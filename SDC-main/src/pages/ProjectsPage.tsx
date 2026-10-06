import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  CheckCircle2,
  X,
  Search,
  Plus,
  ArrowUpRight,
  Lock,
  UserCheck,
  LogIn,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { fetchProjectsFromApi, createProjectInApi, getStoredProjects, type ProjectItem } from '@/lib/projectsStore'
import { CaptchaChallenge } from '@/components/ui/CaptchaChallenge'
import { classifyEmail } from '@/lib/authRules'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

export function ProjectsPage() {
  const { user, isLoggedIn, login, register } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [allProjects, setAllProjects] = useState<ProjectItem[]>(() => getStoredProjects())
  const [showModal, setShowModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [modalSubmitted, setModalSubmitted] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Auth Modal State
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authError, setAuthError] = useState('')
  const [modalCaptchaToken, setModalCaptchaToken] = useState<string | null>(null)

  const emailClassification = useMemo(() => {
    if (!authEmail || !authEmail.includes('@')) return null
    return classifyEmail(authEmail)
  }, [authEmail])

  // Submit Form State
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newGithub, setNewGithub] = useState('')

  // Load live projects from Supabase on mount
  useEffect(() => {
    let isMounted = true
    fetchProjectsFromApi().then((items) => {
      if (isMounted && items && items.length > 0) {
        setAllProjects(items)
      }
    })

    const handleUpdate = () => {
      fetchProjectsFromApi().then((items) => {
        if (isMounted && items && items.length > 0) setAllProjects(items)
      })
    }
    window.addEventListener('sdc_projects_updated', handleUpdate)
    return () => {
      isMounted = false
      window.removeEventListener('sdc_projects_updated', handleUpdate)
    }
  }, [])

  // Only show approved projects in the public gallery
  const approvedProjects = useMemo(() => {
    return allProjects.filter((p) => p.status === 'approved' || !p.status)
  }, [allProjects])

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return approvedProjects

    return approvedProjects.filter((p) => {
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      )
    })
  }, [approvedProjects, searchQuery])

  const showToastMsg = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const handleOpenSubmit = () => {
    if (!isLoggedIn) {
      setAuthError('')
      setShowAuthModal(true)
    } else {
      setModalSubmitted(false)
      setShowModal(true)
    }
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')

    if (authPassword.length < 8) {
      setAuthError('Password must be at least 8 characters long.')
      return
    }

    if (!modalCaptchaToken) {
      setAuthError('Please complete the security verification challenge.')
      return
    }

    if (authMode === 'signin') {
      const res = await login(authEmail, authPassword, modalCaptchaToken)
      if (!res.success) {
        setAuthError(res.error || 'Failed to sign in')
        return
      }
      showToastMsg(`Welcome back, ${authEmail.split('@')[0]}!`)
    } else {
      const res = await register(authName, authEmail, authPassword, undefined, modalCaptchaToken)
      if (!res.success) {
        setAuthError(res.error || 'Failed to register')
        return
      }
      if (res.requiresEmailConfirmation) {
        showToastMsg('Account created! Please check your email inbox to confirm before signing in.')
        setShowAuthModal(false)
        return
      }
      showToastMsg(`Account created! Welcome, ${authName}!`)
    }

    setShowAuthModal(false)
    // Open project submission modal immediately after authenticating
    setModalSubmitted(false)
    setShowModal(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newDescription) return

    try {
      const newProj = await createProjectInApi({
        title: newTitle.trim(),
        description: newDescription.trim(),
        github_url: newGithub.trim() || 'https://github.com/sdc-club',
        submitted_by: user?.email || user?.name || 'Anonymous Member',
        status: 'pending',
        tags: ['Community'],
      })
      setAllProjects((prev) => [newProj, ...prev])
      showToastMsg('Project submitted! We will verify and publish it soon.')
    } catch (err) {
      console.error('Failed to submit project to Supabase:', err)
      showToastMsg('Submitted project locally. Syncing with server soon.')
    } finally {
      setModalSubmitted(true)
      setNewTitle('')
      setNewDescription('')
      setNewGithub('')
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center select-none"
      style={{ paddingTop: '24px', paddingBottom: '96px' }}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-zinc-900 border border-white/15 text-white shadow-2xl backdrop-blur-2xl text-sm font-medium"
          >
            <CheckCircle2 className="h-4 w-4 text-[#ff6b1a]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. MAIN HEADING */}
      <motion.div
        className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center"
        style={{ marginBottom: '28px' }}
        variants={itemVariants}
      >
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase leading-none font-bank-gothic"
          style={{ marginBottom: '14px' }}
        >
          FEATURED <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b1a] via-[#ff944d] to-[#ffb380] drop-shadow-[0_0_35px_rgba(255,107,26,0.35)]">PROJECTS</span>
        </h1>
        <p className="text-sm sm:text-base text-[#9e9aa8] max-w-xl leading-relaxed">
          Open-source software, graphics engines, and distributed systems built by student developers.
        </p>
      </motion.div>

      {/* 2. SEARCH BAR & BRIGHT SUBMIT BUTTON */}
      <motion.div
        className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between"
        style={{ marginBottom: '40px', gap: '16px' }}
        variants={itemVariants}
      >
        {/* Search Bar */}
        <div className="relative flex-1 w-full" style={{ minWidth: '260px' }}>
          <Search
            className="absolute h-5 w-5 text-zinc-400 pointer-events-none"
            style={{ left: '18px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full h-14 pr-12 rounded-2xl bg-[#0b0a16]/95 border border-white/15 focus:border-[#ff6b1a] focus:ring-2 focus:ring-[#ff6b1a]/25 focus:outline-none text-sm text-white placeholder:text-zinc-500 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            style={{ paddingLeft: '56px' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Prominent High-Visibility Submit Button */}
        <button
          onClick={handleOpenSubmit}
          className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.98] shrink-0 cursor-pointer w-full sm:w-auto text-white shadow-xl"
          style={{
            backgroundColor: '#ff6b1a',
            border: '1px solid #ffaa44',
            boxShadow: '0 0 30px rgba(255, 107, 26, 0.55)',
            minWidth: '200px',
          }}
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Submit a Project</span>
        </button>
      </motion.div>

      {/* 3. PROJECT CARDS (3 BOXES IN A ROW ON DESKTOP, CENTER ALIGNED, BIG GITHUB BUTTON) */}
      {filteredProjects.length === 0 ? (
        <motion.div
          className="w-full max-w-md py-16 text-center rounded-3xl bg-[#090815]/70 border border-white/10 p-8 my-8"
          variants={itemVariants}
        >
          <Search className="h-8 w-8 text-zinc-500 mx-auto mb-3" />
          <p className="text-base font-bold text-white mb-1">No matching projects found</p>
          <p className="text-xs text-zinc-400 mb-5">Try searching with a different keyword.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-5 py-2.5 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            Reset Search
          </button>
        </motion.div>
      ) : (
        <motion.div
          className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch"
          style={{ gap: '28px' }}
          variants={itemVariants}
        >
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="group relative flex flex-col items-center justify-between rounded-3xl bg-[#0a0918]/90 backdrop-blur-2xl border border-white/15 hover:border-[#ff6b1a]/80 transition-all duration-300 shadow-[0_14px_45px_rgba(0,0,0,0.8)] hover:shadow-[0_20px_60px_rgba(255,107,26,0.25)] text-center overflow-hidden"
              style={{
                padding: '36px 28px',
                minHeight: '300px',
              }}
            >
              {/* Ambient Glow in Background */}
              <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#ff6b1a]/10 group-hover:bg-[#ff6b1a]/20 blur-3xl transition-all duration-500" />

              {/* Title & Description (Centered) */}
              <div className="flex flex-col items-center text-center w-full relative z-10">
                <h3
                  className="text-xl sm:text-2xl font-extrabold text-white group-hover:text-[#ff9933] transition-colors font-bank-gothic tracking-wide leading-tight text-center w-full break-words"
                  style={{
                    marginBottom: '14px',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    minHeight: '2.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {project.title}
                </h3>
                <p
                  className="text-sm sm:text-[15px] text-[#c0bdd0] leading-relaxed font-normal text-center"
                  style={{ marginBottom: '28px' }}
                >
                  {project.description}
                </p>
              </div>

              {/* Increased Size "View on GitHub" Button (Centered) */}
              <div
                className="border-t border-white/10 w-full flex flex-col items-center justify-center relative z-10 gap-2.5"
                style={{ paddingTop: '22px', marginTop: 'auto' }}
              >
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-[#ff6b1a] text-white hover:text-zinc-950 font-black text-sm uppercase tracking-wider transition-all duration-200 shadow-md group/btn cursor-pointer w-full sm:w-auto"
                >
                  {/* GitHub Icon */}
                  <svg
                    className="h-5 w-5 fill-current shrink-0"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  <span>View on GitHub</span>
                  <ArrowUpRight className="h-4 w-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </a>

                {/* Person / Team who made that project */}
                <span className="text-xs text-[#a5a0b8] font-mono flex items-center justify-center gap-1.5 pt-1">
                  <span>Built by</span>
                  <strong className="text-white font-semibold">
                    {project.submittedBy || 'SDC Core Team'}
                  </strong>
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* 4. CLEAN & SPACIOUS SUBMIT PROJECT MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 14 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl rounded-3xl bg-[#0d0c1c]/95 border border-white/20 shadow-[0_20px_70px_rgba(0,0,0,0.9)] text-center overflow-y-auto max-h-[90vh] flex flex-col items-center justify-center mx-auto"
              style={{ padding: '36px 32px' }}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-20"
              >
                <X className="h-5 w-5" />
              </button>

              {modalSubmitted ? (
                /* Submission Confirmation Message View */
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center text-center py-6 px-2 w-full mx-auto"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mb-5 shadow-[0_0_35px_rgba(61,220,132,0.45)]">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white font-bank-gothic tracking-tight uppercase mb-3 text-center">
                    PROJECT SUBMITTED
                  </h3>
                  <p className="text-sm sm:text-base text-zinc-300 max-w-md mb-8 leading-relaxed text-center">
                    Project is submitted, we will verify and upload it soon, stay tuned.
                  </p>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setModalSubmitted(false)
                    }}
                    className="h-12 px-8 rounded-xl bg-[#1e1b38] hover:bg-[#28244c] border border-white/20 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                /* Standard Form View */
                <div className="w-full flex flex-col items-center justify-center text-center">
                  {/* Modal Header (Centered) */}
                  <div className="w-full flex flex-col items-center justify-center text-center" style={{ marginBottom: '24px' }}>
                    <h2
                      className="text-2xl sm:text-3xl font-black text-white font-bank-gothic tracking-tight uppercase text-center w-full"
                      style={{ marginBottom: '8px', textAlign: 'center' }}
                    >
                      SUBMIT A <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b1a] via-[#ff944d] to-[#ffb380]">PROJECT</span>
                    </h2>
                    <p
                      className="text-xs sm:text-sm text-zinc-300 leading-relaxed text-center w-full"
                      style={{ textAlign: 'center', margin: '0 auto', maxWidth: '440px' }}
                    >
                      Share your open-source project or developer tool with the SDC community.
                    </p>
                    {user && (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-zinc-400">
                        <UserCheck className="h-3 w-3 text-[#ff6b1a]" />
                        <span>Submitting as <strong className="text-white font-semibold">{user.name || user.email}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Clean High-End Form with Inside Background Placeholders */}
                  <form onSubmit={handleFormSubmit} className="flex flex-col items-center w-full" style={{ gap: '16px' }}>
                    {/* Project Name Input */}
                    <div className="w-full">
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Project Name"
                        className="w-full h-14 px-5 rounded-2xl bg-[#070614]/90 border border-white/20 focus:border-[#ff6b1a] focus:ring-2 focus:ring-[#ff6b1a]/30 focus:outline-none text-sm sm:text-base text-white placeholder:text-zinc-400 text-center placeholder:text-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md"
                      />
                    </div>

                    {/* Brief Description Textarea */}
                    <div className="w-full">
                      <textarea
                        required
                        rows={3}
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Brief Description"
                        className="w-full p-4 rounded-2xl bg-[#070614]/90 border border-white/20 focus:border-[#ff6b1a] focus:ring-2 focus:ring-[#ff6b1a]/30 focus:outline-none text-sm sm:text-base text-white placeholder:text-zinc-400 text-center placeholder:text-center resize-none transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md"
                        style={{ minHeight: '110px' }}
                      />
                    </div>

                    {/* GitHub URL Input */}
                    <div className="w-full">
                      <input
                        type="url"
                        required
                        value={newGithub}
                        onChange={(e) => setNewGithub(e.target.value)}
                        placeholder="GitHub Repository URL"
                        className="w-full h-14 px-5 rounded-2xl bg-[#070614]/90 border border-white/20 focus:border-[#ff6b1a] focus:ring-2 focus:ring-[#ff6b1a]/30 focus:outline-none text-sm sm:text-base text-white placeholder:text-zinc-400 text-center placeholder:text-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md"
                      />
                    </div>

                    {/* Form Action Buttons (Equal Size with Highly Visible Colored Cancel Box) */}
                    <div className="flex items-center justify-center w-full" style={{ gap: '14px', paddingTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="flex-1 h-14 rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center active:scale-[0.98] text-white shadow-md hover:brightness-110"
                        style={{
                          backgroundColor: '#27253d',
                          border: '1.5px solid #635b94',
                          boxShadow: '0 0 20px rgba(99, 91, 148, 0.45)',
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="flex-1 h-14 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg cursor-pointer flex items-center justify-center"
                        style={{
                          backgroundColor: '#ff6b1a',
                          border: '1px solid #ffaa44',
                          boxShadow: '0 0 30px rgba(255, 107, 26, 0.55)',
                        }}
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. AUTHENTICATION REQUIRED MODAL */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAuthModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 14 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl bg-[#0e0c1f]/95 border border-white/20 shadow-[0_20px_70px_rgba(0,0,0,0.9)] text-center overflow-hidden flex flex-col items-center justify-center mx-auto"
              style={{ padding: '36px 28px' }}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-20"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-[#ff6b1a]/15 border border-[#ff6b1a]/40 text-[#ff8c42] flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(255,107,26,0.3)]">
                <Lock className="h-6 w-6" />
              </div>

              <h2 className="text-2xl font-black text-white font-bank-gothic tracking-tight uppercase mb-2">
                AUTHENTICATION REQUIRED
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6 max-w-xs">
                Please sign in or create an account to submit your project to the SDC Showcase.
              </p>

              {/* Mode Toggle Tabs */}
              <div className="flex w-full bg-white/5 p-1 rounded-xl border border-white/10 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin')
                    setAuthError('')
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${authMode === 'signin'
                      ? 'bg-[#ff6b1a] text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register')
                    setAuthError('')
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${authMode === 'register'
                      ? 'bg-[#ff6b1a] text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  Register
                </button>
              </div>

              {/* Auth Form */}
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3.5 w-full">
                {authMode === 'register' && (
                  <div>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full h-12 px-4 rounded-xl bg-[#070614]/90 border border-white/20 focus:border-[#ff6b1a] focus:ring-1 focus:ring-[#ff6b1a] text-sm text-white placeholder:text-zinc-500 text-center outline-none"
                    />
                  </div>
                )}

                <div>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="student@goa.paruluniversity.ac.in"
                    className="w-full h-12 px-4 rounded-xl bg-[#070614]/90 border border-white/20 focus:border-[#ff6b1a] focus:ring-1 focus:ring-[#ff6b1a] text-sm text-white placeholder:text-zinc-500 text-center outline-none"
                  />
                  {emailClassification && (
                    <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[11px] font-mono">
                      <span className={`px-2 py-0.5 rounded-full border ${emailClassification.isUniversity
                          ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        }`}>
                        {emailClassification.isUniversity
                          ? '🎓 University Email (@goa.paruluniversity.ac.in)'
                          : '🌐 External Email (Other / Guest)'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder={authMode === 'signin' ? 'Password' : 'Password (min 8 chars)'}
                    className="w-full h-12 px-4 rounded-xl bg-[#070614]/90 border border-white/20 focus:border-[#ff6b1a] focus:ring-1 focus:ring-[#ff6b1a] text-sm text-white placeholder:text-zinc-500 text-center outline-none"
                  />
                  {authMode === 'register' && authPassword.length > 0 && (
                    <div className="flex justify-between items-center text-[11px] mt-1.5 px-1 font-mono">
                      <span className={authPassword.length >= 8 ? 'text-emerald-400' : 'text-amber-400'}>
                        {authPassword.length >= 8 ? '✓ 8+ chars required' : `${authPassword.length}/8 characters`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Security Verification */}
                <CaptchaChallenge onVerify={(token) => setModalCaptchaToken(token)} />

                {authError && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-lg">
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full h-12 mt-1 rounded-xl bg-[#ff6b1a] text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg hover:bg-[#ff8533] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {authMode === 'signin' ? (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Sign In & Continue</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Register & Continue</span>
                    </>
                  )}
                </button>
              </form>


            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ProjectsPage
