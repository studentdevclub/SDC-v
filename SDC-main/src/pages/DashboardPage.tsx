import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  CircleDashed, 
  Calendar, 
  FolderOpen, 
  TerminalSquare, 
  FileText, 
  LogOut, 
  CheckCircle2, 
  Circle, 
  Clock, 
  ExternalLink, 
  MapPin, 
  ChevronRight, 
  Plus, 
  X, 
  Code2, 
  ShieldCheck, 
  Megaphone, 
  RefreshCw, 
  Award,
  Camera,
  Upload,
  Trash2,
  Users,
  BarChart3,
  Layers,
  Check,
  Search,
  BookOpen,
  Eye,
  EyeOff,
  Database,
  Pencil,
  User as UserIcon,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  GraduationCap,
  Sparkles
} from 'lucide-react'
import { useAuth, type User } from '@/context/AuthContext'
import { 
  api, 
  type SDCEvent, 
  type Project, 
  type Announcement,
  type Blog,
  type Member,
  type Stats,
  type Voice,
  type FAQ,
  type MemberApplication
} from '@/lib/api'

export type DashboardTab = 
  | 'overview' 
  | 'sessions' 
  | 'projects' 
  | 'timeline'
  | 'admin-projects'
  | 'admin-events'
  | 'admin-announcements'
  | 'admin-members'
  | 'admin-stats'
  | 'admin-content'

interface EventStatusMap {
  [eventId: string]: {
    registered: boolean
    attended: boolean
  }
}

export function DashboardPage() {
  const { user, isAdmin, updateProfilePhoto, updateProfile, checkApprovalStatus, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  
  // Live Database States
  const [events, setEvents] = useState<SDCEvent[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [applications, setApplications] = useState<MemberApplication[]>([])
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [processingAppId, setProcessingAppId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [voices, setVoices] = useState<Voice[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionFilter, setSessionFilter] = useState<'all' | 'registered' | 'attended'>('all')

  // Admin filter states
  const [adminProjectFilter, setAdminProjectFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [adminProjectSearch, setAdminProjectSearch] = useState('')
  const [adminContentSubTab, setAdminContentSubTab] = useState<'blogs' | 'voices' | 'faqs'>('blogs')
  const [adminModal, setAdminModal] = useState<{ type: string; item?: any } | null>(null)

  // Edit Profile Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)

  // Listen for external open-edit-profile events or hash trigger
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash.includes('editProfile=true') || window.location.hash.includes('#/profile')) {
        setShowEditProfileModal(true)
      }
    }
    checkHash()
    const handleOpenEvent = () => setShowEditProfileModal(true)
    window.addEventListener('open-edit-profile', handleOpenEvent)
    window.addEventListener('hashchange', checkHash)
    return () => {
      window.removeEventListener('open-edit-profile', handleOpenEvent)
      window.removeEventListener('hashchange', checkHash)
    }
  }, [])

  // User-specific event participation (stored per user ID in localStorage)
  const userStorageKey = useMemo(() => {
    return user?.id ? `sdc_user_events_${user.id}` : 'sdc_user_events_guest'
  }, [user?.id])

  const [eventStatus, setEventStatus] = useState<EventStatusMap>(() => {
    try {
      const saved = localStorage.getItem(userStorageKey)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Synchronize stored event participation when user identity changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(userStorageKey)
      setEventStatus(saved ? JSON.parse(saved) : {})
    } catch {
      setEventStatus({})
    }
  }, [userStorageKey])

  // In-Dashboard Project Submission Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newGithub, setNewGithub] = useState('')
  const [newTags, setNewTags] = useState('')
  const [submittingProject, setSubmittingProject] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Profile Photo Modal State
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoUrlInput, setPhotoUrlInput] = useState('')
  const [savingPhoto, setSavingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Show Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Sync photoPreview whenever modal opens or user avatar changes
  useEffect(() => {
    if (showPhotoModal) {
      setPhotoPreview(user?.avatarUrl || null)
      setPhotoUrlInput('')
      setPhotoError(null)
    }
  }, [showPhotoModal, user?.avatarUrl])

  // Client-side image resize and data URL conversion
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (PNG, JPG, WebP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image file is too large (maximum 5MB).')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 256
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > MAX) {
            height = Math.round((height * MAX) / width)
            width = MAX
          }
        } else {
          if (height > MAX) {
            width = Math.round((width * MAX) / height)
            height = MAX
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
          setPhotoPreview(dataUrl)
          setPhotoError(null)
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSavePhoto = async () => {
    setSavingPhoto(true)
    setPhotoError(null)
    const targetUrl = photoPreview || photoUrlInput.trim()
    if (!targetUrl) {
      setPhotoError('Please select an image file or enter a valid image URL.')
      setSavingPhoto(false)
      return
    }

    const res = await updateProfilePhoto(targetUrl)
    setSavingPhoto(false)
    if (res.success) {
      setShowPhotoModal(false)
      showToast('Profile photo updated successfully!')
    } else {
      setPhotoError(res.error || 'Failed to update profile photo.')
    }
  }

  const handleRemovePhoto = async () => {
    setSavingPhoto(true)
    setPhotoError(null)
    const res = await updateProfilePhoto('')
    setSavingPhoto(false)
    if (res.success) {
      setPhotoPreview(null)
      setShowPhotoModal(false)
      showToast('Profile photo removed. Restored monogram initials.')
    } else {
      setPhotoError(res.error || 'Failed to remove profile photo.')
    }
  }

  // Fetch live events, projects, announcements, blogs, members, stats, voices, faqs from Supabase
  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        eventsData, 
        projectsData, 
        announcementsData,
        blogsData,
        membersData,
        statsData,
        voicesData,
        faqsData
      ] = await Promise.all([
        api.events.list().catch(() => [] as SDCEvent[]),
        api.projects.list().catch(() => [] as Project[]),
        api.announcements.list().catch(() => [] as Announcement[]),
        api.blogs.list().catch(() => [] as Blog[]),
        api.members.list().catch(() => [] as Member[]),
        api.stats.get().catch(() => null as Stats | null),
        api.voices.list().catch(() => [] as Voice[]),
        api.faqs.list().catch(() => [] as FAQ[]),
      ])

      const evList = Array.isArray(eventsData) ? eventsData : []
      setEvents(evList)
      setProjects(Array.isArray(projectsData) ? projectsData : [])
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : [])
      setBlogs(Array.isArray(blogsData) ? blogsData : [])
      setMembers(Array.isArray(membersData) ? membersData : [])
      if (statsData) setStats(statsData)
      setVoices(Array.isArray(voicesData) ? voicesData : [])
      setFaqs(Array.isArray(faqsData) ? faqsData : [])

      // Fetch member applications if admin
      if (isAdmin) {
        api.applications.list()
          .then(apps => setApplications(Array.isArray(apps) ? apps : []))
          .catch(err => console.warn('Applications fetch warning:', err))
      }

      // Health ping
      fetch('/api/health')
        .then(r => setBackendOnline(r.ok))
        .catch(() => setBackendOnline(false))

      // Auto-register first 2 upcoming events for new users if none recorded
      setEventStatus(prev => {
        if (Object.keys(prev).length === 0 && evList.length > 0) {
          const initial: EventStatusMap = {}
          evList.slice(0, 2).forEach((e, idx) => {
            initial[e.id] = { registered: true, attended: idx === 0 }
          })
          try {
            localStorage.setItem(userStorageKey, JSON.stringify(initial))
          } catch {}
          return initial
        }
        return prev
      })
    } catch (err) {
      console.warn('Dashboard data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [userStorageKey, isAdmin])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Auto-check approval status every 6 seconds for pending users
  useEffect(() => {
    if (!user || user.role === 'admin' || user.approvalStatus !== 'pending') return

    checkApprovalStatus().catch(() => {})
    const timer = setInterval(() => {
      checkApprovalStatus().catch(() => {})
    }, 6000)

    return () => clearInterval(timer)
  }, [user?.id, user?.email, user?.role, user?.approvalStatus, checkApprovalStatus])

  const pendingApplications = useMemo(() => {
    return applications.filter(a => a.approval_status === 'pending')
  }, [applications])

  const handleApproveApplication = async (appId: string, applicantName: string) => {
    setProcessingAppId(appId)
    try {
      await api.applications.approve(appId)
      showToast(`Approved ${applicantName} as official SDC member! ✓`)
      const [newApps, newMembers] = await Promise.all([
        api.applications.list().catch(() => []),
        api.members.list().catch(() => []),
      ])
      setApplications(newApps)
      setMembers(newMembers)
    } catch (err: any) {
      showToast(err.message || 'Failed to approve application.')
    } finally {
      setProcessingAppId(null)
    }
  }

  const handleRejectApplication = async (appId: string, applicantName: string) => {
    setProcessingAppId(appId)
    try {
      await api.applications.reject(appId)
      showToast(`Application for ${applicantName} marked as rejected.`)
      const newApps = await api.applications.list().catch(() => [])
      setApplications(newApps)
    } catch (err: any) {
      showToast(err.message || 'Failed to reject application.')
    } finally {
      setProcessingAppId(null)
    }
  }

  // Admin Action Handlers
  const handleApproveProject = async (id: string) => {
    try {
      const updated = await api.projects.update(id, { status: 'approved' })
      setProjects(prev => prev.map(p => p.id === id ? updated : p))
      showToast('Project approved and live on public showcase! ✓')
    } catch (e: any) {
      showToast(e.message || 'Failed to approve project.')
    }
  }

  const handleRejectProject = async (id: string) => {
    try {
      const updated = await api.projects.update(id, { status: 'rejected' })
      setProjects(prev => prev.map(p => p.id === id ? updated : p))
      showToast('Project marked as rejected.')
    } catch (e: any) {
      showToast(e.message || 'Failed to reject project.')
    }
  }

  const handleDeleteProject = async (id: string, title: string) => {
    if (!confirm(`Delete project "${title}"?`)) return
    try {
      await api.projects.delete(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      showToast(`Deleted "${title}".`)
    } catch (e: any) {
      showToast(e.message || 'Failed to delete project.')
    }
  }

  const handleCreateProjectAdmin = async (body: Partial<Project>) => {
    try {
      const created = await api.projects.create(body)
      setProjects(prev => [created, ...prev])
      showToast('Project created and stored!')
      setAdminModal(null)
    } catch (e: any) {
      showToast(e.message || 'Failed to create project.')
    }
  }

  const handleUpdateProject = async (id: string, body: Partial<Project>) => {
    try {
      const updated = await api.projects.update(id, body)
      setProjects(prev => prev.map(p => p.id === id ? updated : p))
      showToast('Project updated successfully! ✓')
      setAdminModal(null)
    } catch (e: any) {
      showToast(e.message || 'Failed to update project.')
    }
  }

  const handleCreateEvent = async (body: Partial<SDCEvent>) => {
    try {
      const created = await api.events.create(body)
      setEvents(prev => [created, ...prev])
      showToast('Event created and published!')
      setAdminModal(null)
    } catch (e: any) {
      showToast(e.message || 'Failed to create event.')
    }
  }

  const handleUpdateEvent = async (id: string, body: Partial<SDCEvent>) => {
    try {
      const updated = await api.events.update(id, body)
      setEvents(prev => prev.map(e => e.id === id ? updated : e))
      showToast('Event updated successfully! ✓')
      setAdminModal(null)
    } catch (e: any) {
      showToast(e.message || 'Failed to update event.')
    }
  }

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Delete event "${title}"?`)) return
    try {
      await api.events.delete(id)
      setEvents(prev => prev.filter(e => e.id !== id))
      showToast(`Deleted "${title}".`)
    } catch (e: any) {
      showToast(e.message || 'Failed to delete event.')
    }
  }

  const handleCreateAnnouncement = async (body: Partial<Announcement>) => {
    try {
      const created = await api.announcements.create(body)
      setAnnouncements(prev => [created, ...prev])
      showToast('Announcement broadcasted!')
      setAdminModal(null)
    } catch (e: any) {
      showToast(e.message || 'Failed to broadcast announcement.')
    }
  }

  const handleUpdateAnnouncement = async (id: string, body: Partial<Announcement>) => {
    try {
      const updated = await api.announcements.update(id, body)
      setAnnouncements(prev => prev.map(a => a.id === id ? updated : a))
      showToast('Announcement updated! ✓')
      setAdminModal(null)
    } catch (e: any) {
      showToast(e.message || 'Failed to update announcement.')
    }
  }

  const handleToggleAnnouncement = async (id: string, current: boolean) => {
    try {
      const updated = await api.announcements.update(id, { is_active: !current })
      setAnnouncements(prev => prev.map(a => a.id === id ? updated : a))
      showToast(!current ? 'Announcement activated and broadcasted!' : 'Announcement deactivated.')
    } catch (e: any) {
      showToast(e.message || 'Failed to update announcement.')
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    try {
      await api.announcements.delete(id)
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      showToast('Announcement deleted.')
    } catch (e: any) {
      showToast(e.message || 'Failed to delete announcement.')
    }
  }

  const handleUpdateStats = async (body: Partial<Stats> & { id: string }) => {
    try {
      const updated = await api.stats.update(body)
      setStats(updated)
      showToast('Public club stats updated live!')
      setAdminModal(null)
    } catch (e: any) {
      showToast(e.message || 'Failed to update stats.')
    }
  }

  const handleCreateMember = async (body: Partial<Member>) => {
    try {
      const created = await api.members.create(body)
      setMembers(prev => [...prev, created])
      showToast(`Member "${created.name}" added to directory!`)
      setAdminModal(null)
    } catch (e: any) {
      showToast(e.message || 'Failed to add member.')
    }
  }

  const handleUpdateMember = async (id: string, body: Partial<Member>) => {
    try {
      const updated = await api.members.update(id, body)
      setMembers(prev => prev.map(m => m.id === id ? updated : m))
      showToast(`Member "${updated.name}" updated! ✓`)
      setAdminModal(null)
    } catch (e: any) {
      showToast(e.message || 'Failed to update member.')
    }
  }

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Delete member "${name}"?`)) return
    try {
      await api.members.delete(id)
      setMembers(prev => prev.filter(m => m.id !== id))
      showToast(`Removed "${name}".`)
    } catch (e: any) {
      showToast(e.message || 'Failed to delete member.')
    }
  }

  const handleCreateBlog = async (body: Partial<Blog>) => {
    try {
      const created = await api.blogs.create(body)
      setBlogs(prev => [created, ...prev])
      showToast('Blog post published!')
      setAdminModal(null)
    } catch (e: any) {
      showToast(e.message || 'Failed to create blog post.')
    }
  }

  const handleUpdateBlog = async (id: string, body: Partial<Blog>) => {
    try {
      const updated = await api.blogs.update(id, body)
      setBlogs(prev => prev.map(b => b.id === id ? updated : b))
      showToast('Blog post updated! ✓')
      setAdminModal(null)
    } catch (e: any) {
      showToast(e.message || 'Failed to update blog post.')
    }
  }

  const handleDeleteBlog = async (id: string, title: string) => {
    if (!confirm(`Delete blog post "${title}"?`)) return
    try {
      await api.blogs.delete(id)
      setBlogs(prev => prev.filter(b => b.id !== id))
      showToast(`Deleted post "${title}".`)
    } catch (e: any) {
      showToast(e.message || 'Failed to delete blog post.')
    }
  }

  const handleCreateVoice = async (body: Partial<Voice>) => {
    try {
      const created = await api.voices.create(body)
      setVoices(prev => [...prev, created])
      showToast('Testimonial added!')
      setAdminModal(null)
    } catch (e: any) {
      showToast(e.message || 'Failed to add testimonial.')
    }
  }

  const handleUpdateVoice = async (id: string, body: Partial<Voice>) => {
    try {
      const updated = await api.voices.update(id, body)
      setVoices(prev => prev.map(v => v.id === id ? updated : v))
      showToast('Testimonial updated! ✓')
      setAdminModal(null)
    } catch (e: any) {
      showToast(e.message || 'Failed to update testimonial.')
    }
  }

  const handleDeleteVoice = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return
    try {
      await api.voices.delete(id)
      setVoices(prev => prev.filter(v => v.id !== id))
      showToast('Deleted testimonial.')
    } catch (e: any) {
      showToast(e.message || 'Failed to delete testimonial.')
    }
  }

  const handleCreateFAQ = async (body: Partial<FAQ>) => {
    try {
      const created = await api.faqs.create(body)
      setFaqs(prev => [...prev, created])
      showToast('FAQ question added!')
      setAdminModal(null)
    } catch (e: any) {
      showToast(e.message || 'Failed to add FAQ.')
    }
  }

  const handleUpdateFAQ = async (id: string, body: Partial<FAQ>) => {
    try {
      const updated = await api.faqs.update(id, body)
      setFaqs(prev => prev.map(f => f.id === id ? updated : f))
      showToast('FAQ updated! ✓')
      setAdminModal(null)
    } catch (e: any) {
      showToast(e.message || 'Failed to update FAQ.')
    }
  }

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return
    try {
      await api.faqs.delete(id)
      setFaqs(prev => prev.filter(f => f.id !== id))
      showToast('Deleted FAQ.')
    } catch (e: any) {
      showToast(e.message || 'Failed to delete FAQ.')
    }
  }

  const pendingProjects = useMemo(() => {
    return projects.filter(p => p.status === 'pending')
  }, [projects])

  const filteredAdminProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesFilter = adminProjectFilter === 'all' || p.status === adminProjectFilter
      const q = adminProjectSearch.toLowerCase().trim()
      const matchesSearch = !q || 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) || 
        (p.submitted_by && p.submitted_by.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      return matchesFilter && matchesSearch
    })
  }, [projects, adminProjectFilter, adminProjectSearch])

  // Save event registration changes
  const saveEventStatus = (updated: EventStatusMap) => {
    setEventStatus(updated)
    try {
      localStorage.setItem(userStorageKey, JSON.stringify(updated))
    } catch {}
  }

  const toggleRegister = (eventId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const current = eventStatus[eventId] || { registered: false, attended: false }
    const nextRegistered = !current.registered
    const updated: EventStatusMap = {
      ...eventStatus,
      [eventId]: {
        registered: nextRegistered,
        attended: nextRegistered ? current.attended : false,
      },
    }
    saveEventStatus(updated)
    showToast(nextRegistered ? 'Enrolled in session!' : 'Unregistered from session.')
  }

  const toggleAttended = (eventId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const current = eventStatus[eventId] || { registered: false, attended: false }
    const nextAttended = !current.attended
    const updated: EventStatusMap = {
      ...eventStatus,
      [eventId]: {
        registered: true, // Attending implies registration
        attended: nextAttended,
      },
    }
    saveEventStatus(updated)
    showToast(nextAttended ? 'Marked session as Attended! ✓' : 'Attendance record cleared.')
  }

  // Compute initials dynamically from auth user
  const userInitials = useMemo(() => {
    if (user?.name && user.name.trim()) {
      const parts = user.name.trim().split(/\s+/).filter(Boolean)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return user.name.slice(0, 2).toUpperCase()
    }
    if (user?.email) {
      const prefix = user.email.split('@')[0].replace(/[^a-zA-Z]/g, '')
      return (prefix.slice(0, 2) || 'SD').toUpperCase()
    }
    return 'SD'
  }, [user])

  // User display name & details
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Member')
  const userEmail = user?.email || 'member@goa.paruluniversity.ac.in'
  const isUniversity = user?.memberType === 'university'

  // Computed event metrics
  const registeredEvents = useMemo(() => {
    return events.filter(e => eventStatus[e.id]?.registered)
  }, [events, eventStatus])

  const attendedEvents = useMemo(() => {
    return events.filter(e => eventStatus[e.id]?.attended)
  }, [events, eventStatus])

  // Projects submitted by this user
  const myProjects = useMemo(() => {
    if (!user) return []
    const uName = (user.name || '').toLowerCase().trim()
    const uEmail = (user.email || '').toLowerCase().trim()
    return projects.filter(p => {
      const sub = (p.submitted_by || '').toLowerCase()
      return (uName && sub.includes(uName)) || (uEmail && sub.includes(uEmail))
    })
  }, [projects, user])

  // Submit project handler
  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newDescription.trim()) return

    setSubmittingProject(true)
    setSubmitError(null)

    try {
      const tagsArray = newTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      const created = await api.projects.create({
        title: newTitle.trim(),
        description: newDescription.trim(),
        github_url: newGithub.trim() || 'https://github.com/sdc-club',
        submitted_by: user?.name || user?.email || 'SDC Member',
        status: 'pending',
        tags: tagsArray.length > 0 ? tagsArray : ['React', 'TypeScript', 'SDC'],
      })

      setProjects(prev => [created, ...prev])
      setShowSubmitModal(false)
      setNewTitle('')
      setNewDescription('')
      setNewGithub('')
      setNewTags('')
      showToast('Project submitted! Under review by SDC leads.')
      setActiveTab('projects')
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit project. Please try again.')
    } finally {
      setSubmittingProject(false)
    }
  }

  const handleNavClick = (tabId: string) => {
    if (tabId === 'projects-gallery') {
      window.location.hash = '#/projects'
    } else if (tabId === 'events') {
      window.location.hash = '#/events'
    } else if (tabId === 'guidelines') {
      window.location.hash = '#/guidelines'
    } else if (tabId === 'about') {
      window.location.hash = '#/about'
    } else {
      setActiveTab(tabId as any)
    }
  }

  // Active announcement (if any)
  const activeAnnouncement = announcements.find(a => a.is_active)

  // ── Pending Approval View for newly registered students ──
  if (user && user.role !== 'admin' && user.approvalStatus === 'pending') {
    return (
      <PendingApprovalView
        user={user}
        checkingStatus={checkingStatus}
        onCheckStatus={async () => {
          setCheckingStatus(true)
          try {
            const status = await checkApprovalStatus()
            if (status === 'approved') {
              showToast('Congratulations! Your SDC membership has been approved! 🎉')
            } else if (status === 'rejected') {
              showToast('Your application was not approved. Please contact club leads.')
            } else {
              showToast('Application still under review by administrators. Check back shortly.')
            }
          } catch {
            showToast('Failed to check status. Please try again.')
          } finally {
            setCheckingStatus(false)
          }
        }}
        onLogout={logout}
      />
    )
  }

  // ── Rejected View for rejected applicants ──
  if (user && user.role !== 'admin' && user.approvalStatus === 'rejected') {
    return (
      <RejectedApprovalView
        user={user}
        onLogout={logout}
      />
    )
  }

  return (
    <div className="dashboard-page w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 text-zinc-300 flex flex-col items-center">
      
      {/* ── Toast Notification ─────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-[#ff6b1a] text-zinc-950 px-4 py-2.5 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 border border-white/20"
          >
            <CheckCircle2 className="w-4 h-4 text-zinc-950" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Dynamic User Profile Header ─────────────────────── */}
      <header className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 bg-transparent border-none p-0">
        {/* Left Side: Monogram & Identity */}
        <div className="flex flex-row items-center gap-5 min-w-0 max-w-full">
          {/* Dynamic Avatar / Monogram Badge */}
          <div className="relative shrink-0 group">
            <button
              type="button"
              onClick={() => setShowEditProfileModal(true)}
              className="relative block h-16 w-16 rounded-2xl overflow-hidden border border-zinc-700/60 hover:border-[#ff6b1a] shadow-[0_0_20px_rgba(255,107,26,0.18)] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ff6b1a]/50"
              title="Click to edit profile and avatar"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover rounded-2xl"
                />
              ) : (
                <div className="bg-gradient-to-br from-zinc-800 via-zinc-900 to-[#120e24] text-white font-extrabold text-2xl h-full w-full flex items-center justify-center">
                  {userInitials}
                </div>
              )}
              {/* Hover overlay with pencil/camera icon */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                <Pencil className="w-4 h-4 text-[#ff6b1a]" />
                <span className="text-[9px] font-bold mt-0.5 text-zinc-200 uppercase tracking-wider">Edit</span>
              </div>
            </button>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-zinc-950 border-2 border-zinc-900 flex items-center justify-center pointer-events-none">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* User Details */}
          <div className="flex flex-col justify-center gap-1.5 min-w-0">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="bg-zinc-800/90 text-zinc-200 text-xs px-2.5 py-0.5 rounded-md uppercase tracking-wider font-semibold border border-zinc-700/60 shrink-0 font-mono">
                {isAdmin ? 'SDC Admin' : 'Member Portal'}
              </span>

              <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${
                isAdmin
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : isUniversity
                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}>
                {isAdmin && <ShieldCheck className="w-3 h-3 text-amber-400" />}
                {isAdmin ? 'Club Administrator' : isUniversity ? '🎓 Parul University Student' : '🌐 External Community Member'}
              </span>

              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span>Active Session</span>
              </div>
            </div>

            {/* Name & Email Row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <button
                type="button"
                onClick={() => setShowEditProfileModal(true)}
                className="text-left group cursor-pointer inline-flex items-center gap-2"
                title="Click to edit name and profile details"
              >
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight m-0 p-0 break-words group-hover:text-[#ff6b1a] transition-colors">
                  {displayName}
                </h1>
                <span className="p-1 rounded-md bg-zinc-800/80 group-hover:bg-[#ff6b1a]/20 text-zinc-400 group-hover:text-[#ff6b1a] transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </span>
              </button>

              <span className="text-xs sm:text-sm text-zinc-400 font-mono break-all">
                {userEmail}
              </span>
              <span className="text-xs text-zinc-500 font-sans">
                • Member since {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Fall 2026'}
              </span>

              <button
                type="button"
                onClick={() => setShowEditProfileModal(true)}
                className="inline-flex items-center gap-1.5 text-xs text-[#ff6b1a] hover:text-[#ff8533] font-semibold transition-colors cursor-pointer bg-[#ff6b1a]/10 hover:bg-[#ff6b1a]/20 border border-[#ff6b1a]/30 px-2.5 py-1 rounded-lg"
              >
                <Pencil className="w-3 h-3 text-[#ff6b1a]" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex flex-row items-center gap-2.5 flex-wrap shrink-0">
          {isAdmin && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className={backendOnline === true ? 'text-emerald-400 font-semibold' : backendOnline === false ? 'text-rose-400' : 'text-zinc-400'}>
                {backendOnline === true ? 'DB Live' : backendOnline === false ? 'DB Offline' : 'Syncing...'}
              </span>
            </div>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setAdminModal({ type: 'add-event' })}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 inline-flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" />
              <span>New Event</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setAdminModal({ type: 'add-announcement' })}
              className="bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Broadcast</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="bg-[#ff6b1a] hover:bg-[#ff8533] text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#ff6b1a]/20 inline-flex items-center gap-2 cursor-pointer shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-zinc-950" />
            <span>Submit Project</span>
          </button>

          <a
            href="#/events"
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors border border-zinc-700/50 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-[#ff6b1a]" />
            <span>Browse Events</span>
          </a>

          <button
            type="button"
            onClick={() => {
              logout()
              window.location.hash = '#/auth'
            }}
            title="Sign Out"
            className="text-zinc-500 hover:text-rose-400 px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── 2. Main Content Grid Layout ────────────────────────── */}
      <div className="grid grid-cols-12 gap-8 lg:gap-10 w-full items-start">
        
        {/* Navigation Sidebar */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6 self-start w-full">
          {/* Section 1: MY CLUB */}
          <div className="w-full">
            <h3 className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2.5 px-1 font-mono">
              MY PORTAL
            </h3>
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-zinc-800 text-white border border-zinc-700/80 shadow-md ring-1 ring-[#ff6b1a]/40 font-semibold'
                    : 'bg-zinc-900/40 border border-zinc-800/70 text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'overview' ? 'text-[#ff6b1a]' : 'text-zinc-400'}`} />
                  <span className="truncate">Overview & Metrics</span>
                </div>
                {activeTab === 'overview' && (
                  <span className="w-2 h-2 rounded-full bg-[#ff6b1a] shadow-[0_0_8px_rgba(255,107,26,0.8)] shrink-0 ml-2" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sessions')}
                className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                  activeTab === 'sessions'
                    ? 'bg-zinc-800 text-white border border-zinc-700/80 shadow-md ring-1 ring-[#ff6b1a]/40 font-semibold'
                    : 'bg-zinc-900/40 border border-zinc-800/70 text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Calendar className={`w-4 h-4 shrink-0 ${activeTab === 'sessions' ? 'text-[#ff6b1a]' : 'text-zinc-400'}`} />
                  <span className="truncate">Registered Sessions</span>
                </div>
                {registeredEvents.length > 0 && (
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-[#ff6b1a]/20 text-[#ff9944] border border-[#ff6b1a]/30">
                    {registeredEvents.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('projects')}
                className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                  activeTab === 'projects'
                    ? 'bg-zinc-800 text-white border border-zinc-700/80 shadow-md ring-1 ring-[#ff6b1a]/40 font-semibold'
                    : 'bg-zinc-900/40 border border-zinc-800/70 text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Code2 className={`w-4 h-4 shrink-0 ${activeTab === 'projects' ? 'text-[#ff6b1a]' : 'text-zinc-400'}`} />
                  <span className="truncate">My Submissions</span>
                </div>
                {myProjects.length > 0 && (
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {myProjects.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'bg-zinc-800 text-white border border-zinc-700/80 shadow-md ring-1 ring-[#ff6b1a]/40 font-semibold'
                    : 'bg-zinc-900/40 border border-zinc-800/70 text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CircleDashed className={`w-4 h-4 shrink-0 ${activeTab === 'timeline' ? 'text-[#ff6b1a]' : 'text-zinc-400'}`} />
                  <span className="truncate">Membership Stepper</span>
                </div>
                {activeTab === 'timeline' && (
                  <span className="w-2 h-2 rounded-full bg-[#ff6b1a] shadow-[0_0_8px_rgba(255,107,26,0.8)] shrink-0 ml-2" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowEditProfileModal(true)}
                className="w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between bg-zinc-900/40 border border-zinc-800/70 text-zinc-300 hover:text-white hover:bg-zinc-800/60 hover:border-[#ff6b1a]/40 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserIcon className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-[#ff6b1a] transition-colors" />
                  <span className="truncate">Edit Profile & Account</span>
                </div>
                <Pencil className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#ff6b1a] shrink-0 ml-2 transition-colors" />
              </button>
            </div>
          </div>

          {/* Section: ADMIN COMMAND CENTER (Admin Only) */}
          {isAdmin && (
            <div className="w-full">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <h3 className="text-xs text-amber-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  ADMIN CONTROL
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  SUPERUSER
                </span>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab('admin-projects')}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                    activeTab === 'admin-projects'
                      ? 'bg-zinc-800 text-white border border-amber-500/50 shadow-md ring-1 ring-amber-500/40 font-semibold'
                      : 'bg-zinc-900/40 border border-zinc-800/70 text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Layers className={`w-4 h-4 shrink-0 ${activeTab === 'admin-projects' ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span className="truncate">Project Approvals</span>
                  </div>
                  {pendingProjects.length > 0 ? (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-extrabold animate-pulse">
                      {pendingProjects.length} pending
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-zinc-500">{projects.length}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('admin-events')}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                    activeTab === 'admin-events'
                      ? 'bg-zinc-800 text-white border border-amber-500/50 shadow-md ring-1 ring-amber-500/40 font-semibold'
                      : 'bg-zinc-900/40 border border-zinc-800/70 text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Calendar className={`w-4 h-4 shrink-0 ${activeTab === 'admin-events' ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span className="truncate">Event Manager</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">{events.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('admin-announcements')}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                    activeTab === 'admin-announcements'
                      ? 'bg-zinc-800 text-white border border-amber-500/50 shadow-md ring-1 ring-amber-500/40 font-semibold'
                      : 'bg-zinc-900/40 border border-zinc-800/70 text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Megaphone className={`w-4 h-4 shrink-0 ${activeTab === 'admin-announcements' ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span className="truncate">Broadcast Studio</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">{announcements.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('admin-members')}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                    activeTab === 'admin-members'
                      ? 'bg-zinc-800 text-white border border-amber-500/50 shadow-md ring-1 ring-amber-500/40 font-semibold'
                      : 'bg-zinc-900/40 border border-zinc-800/70 text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Users className={`w-4 h-4 shrink-0 ${activeTab === 'admin-members' ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span className="truncate">Member Roster</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">{members.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('admin-stats')}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                    activeTab === 'admin-stats'
                      ? 'bg-zinc-800 text-white border border-amber-500/50 shadow-md ring-1 ring-amber-500/40 font-semibold'
                      : 'bg-zinc-900/40 border border-zinc-800/70 text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'admin-stats' ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span className="truncate">Club Stats</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                    Live
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('admin-content')}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                    activeTab === 'admin-content'
                      ? 'bg-zinc-800 text-white border border-amber-500/50 shadow-md ring-1 ring-amber-500/40 font-semibold'
                      : 'bg-zinc-900/40 border border-zinc-800/70 text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'admin-content' ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span className="truncate">Content Studio</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {blogs.length + voices.length + faqs.length}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Section 2: CLUB EXPLORE */}
          <div className="w-full">
            <h3 className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2.5 px-1 font-mono">
              COMMUNITY HUBS
            </h3>
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => handleNavClick('projects-gallery')}
                className="w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between bg-zinc-900/40 border border-zinc-800/70 text-zinc-300 hover:text-white hover:bg-zinc-800/60 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FolderOpen className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="truncate">Project Showcase ({projects.length})</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0 ml-2" />
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('events')}
                className="w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between bg-zinc-900/40 border border-zinc-800/70 text-zinc-300 hover:text-white hover:bg-zinc-800/60 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TerminalSquare className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="truncate">Events & Hackathons</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0 ml-2" />
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('guidelines')}
                className="w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between bg-zinc-900/40 border border-zinc-800/70 text-zinc-300 hover:text-white hover:bg-zinc-800/60 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="truncate">Code of Conduct</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0 ml-2" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="col-span-12 lg:col-span-9 flex flex-col min-w-0 w-full">
          <AnimatePresence mode="wait">
            
            {/* ── OVERVIEW TAB ──────────────────────────────────── */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col min-w-0 gap-8"
              >
                {/* Live Announcement Banner (if available) */}
                {activeAnnouncement && (
                  <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase font-mono tracking-wider font-bold text-amber-400">
                            {activeAnnouncement.category}
                          </span>
                          <span className="text-xs text-zinc-400">· Active Transmission</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white truncate">{activeAnnouncement.headline}</h4>
                        <p className="text-xs text-zinc-400 line-clamp-1">{activeAnnouncement.message}</p>
                      </div>
                    </div>
                    <a
                      href="#/events"
                      className="text-xs text-amber-400 hover:text-amber-300 font-mono font-medium underline shrink-0 cursor-pointer"
                    >
                      Details →
                    </a>
                  </div>
                )}

                {/* Executive Admin Strip (When Admin Logs In) */}
                {isAdmin && (
                  <div className="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-zinc-900/90 to-zinc-900/50 border border-amber-500/35 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono uppercase font-extrabold text-amber-400 tracking-wider">
                            SDC Executive Admin Control
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-[11px] font-mono text-zinc-400">Database Live Synchronization Active</span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1">
                          {pendingProjects.length > 0 ? (
                            <span className="text-amber-300 font-semibold">
                              ⚠️ Action Required: {pendingProjects.length} member submitted project{pendingProjects.length > 1 ? 's' : ''} awaiting review.
                            </span>
                          ) : (
                            <span>All member projects reviewed. {events.length} events scheduled and {announcements.length} announcements active.</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {pendingProjects.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('admin-projects')}
                          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-amber-500/20"
                        >
                          Review Queue ({pendingProjects.length})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setAdminModal({ type: 'add-event' })}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer border border-zinc-700"
                      >
                        + Add Event
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminModal({ type: 'add-announcement' })}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer border border-zinc-700"
                      >
                        + Broadcast
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminModal({ type: 'edit-stats' })}
                        className="bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer border border-amber-500/30"
                      >
                        Edit Stats
                      </button>
                    </div>
                  </div>
                )}

                {/* 3 Live Metric Cards Linked to DB & User */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
                  {/* Card 1: Registered Sessions */}
                  <div className="flex flex-col justify-between p-6 rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/70 hover:border-zinc-700 transition-colors shadow-lg min-w-0">
                    <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-3 truncate font-mono">
                      Registered Sessions
                    </div>
                    <div className="text-2xl sm:text-3xl text-white font-bold tracking-tight break-words">
                      {registeredEvents.length} enrolled
                    </div>
                    <div className="text-xs text-zinc-500 mt-2">
                      {attendedEvents.length} marked attended · {events.length} upcoming
                    </div>
                  </div>

                  {/* Card 2: My Submissions */}
                  <div className="flex flex-col justify-between p-6 rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/70 hover:border-zinc-700 transition-colors shadow-lg min-w-0">
                    <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-3 truncate font-mono">
                      My Submissions
                    </div>
                    <div className="text-2xl sm:text-3xl text-[#ff6b1a] font-bold tracking-tight break-words">
                      {myProjects.length} projects
                    </div>
                    <div className="text-xs text-zinc-500 mt-2">
                      {projects.length} total active in club repo
                    </div>
                  </div>

                  {/* Card 3: Membership Status */}
                  <div className="flex flex-col justify-between p-6 rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/70 hover:border-zinc-700 transition-colors shadow-lg min-w-0">
                    <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-3 truncate font-mono">
                      Membership Status
                    </div>
                    <div className="text-2xl sm:text-3xl text-emerald-400 font-bold tracking-tight break-words">
                      {isAdmin ? 'Core Board' : isUniversity ? 'Parul Verified' : 'External Dev'}
                    </div>
                    <div className="text-xs text-zinc-500 mt-2">
                      Good Standing · Verified Session
                    </div>
                  </div>
                </div>

                {/* Upcoming Schedule (Live from Supabase events table) */}
                <div className="w-full min-w-0">
                  <div className="flex justify-between items-end mb-5">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">
                        Upcoming Schedule
                      </h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Live sessions synced directly from Supabase events calendar
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('sessions')}
                      className="text-[#ff6b1a] text-xs font-mono font-medium hover:text-[#ff8533] transition-colors cursor-pointer"
                    >
                      View all sessions ({events.length}) →
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center p-12 bg-zinc-900/30 rounded-2xl border border-zinc-800/60">
                      <RefreshCw className="w-5 h-5 text-[#ff6b1a] animate-spin mr-2.5" />
                      <span className="text-xs text-zinc-400 font-mono">Loading live sessions from database...</span>
                    </div>
                  ) : events.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/30 rounded-2xl border border-zinc-800/60 text-zinc-500 text-sm font-mono">
                      No scheduled events found in the database.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3.5 w-full">
                      {events.slice(0, 3).map(event => {
                        const status = eventStatus[event.id] || { registered: false, attended: false }
                        const eventDateStr = event.event_date
                          ? new Date(event.event_date).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : 'TBD'

                        return (
                          <div
                            key={event.id}
                            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5 rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/70 hover:border-zinc-700 transition-colors shadow-md w-full min-w-0"
                          >
                            {/* Card Left */}
                            <div className="flex flex-col min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[#ff6b1a] text-xs font-mono font-semibold">
                                  {eventDateStr}
                                </span>
                                <span className="text-zinc-600">•</span>
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                  {event.category}
                                </span>
                              </div>
                              <h3 className="text-base font-semibold text-white break-words">
                                {event.title}
                              </h3>
                              <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{event.description}</p>
                              <div className="text-zinc-500 text-xs mt-2 flex items-center gap-3">
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                  <span>{event.location}</span>
                                </span>
                                <span>•</span>
                                <span>{event.spots_left} spots left</span>
                              </div>
                            </div>

                            {/* Card Right: Interactive actions */}
                            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t border-zinc-800/60 md:border-t-0">
                              <a
                                href="#/events"
                                className="text-zinc-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                              >
                                Details
                              </a>

                              <button
                                type="button"
                                onClick={(e) => toggleRegister(event.id, e)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer border ${
                                  status.registered
                                    ? 'bg-[#ff6b1a]/15 border-[#ff6b1a]/40 text-[#ff9944]'
                                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                                }`}
                              >
                                {status.registered ? '✓ Enrolled' : 'Register'}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => toggleAttended(event.id, e)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer border ${
                                  status.attended
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                    : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {status.attended ? '✓ Attended' : 'Mark Attended'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* My Project Submissions Quick Strip */}
                <div className="w-full min-w-0 pt-2">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        My Projects Showcase
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Open-source builds registered under your account
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(true)}
                      className="text-xs font-mono font-medium text-[#ff6b1a] hover:text-[#ff8533] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Submit Codebase</span>
                    </button>
                  </div>

                  {myProjects.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center gap-2">
                      <Code2 className="w-8 h-8 text-zinc-600 mb-1" />
                      <div className="text-sm font-medium text-zinc-300">No project submissions yet</div>
                      <p className="text-xs text-zinc-500 max-w-sm">
                        Submit your full-stack apps, AI models, or developer tools to feature them on the official SDC gallery.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowSubmitModal(true)}
                        className="mt-2 bg-[#ff6b1a] text-zinc-950 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#ff8533] transition-colors cursor-pointer"
                      >
                        Submit Your First Project
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {myProjects.slice(0, 2).map(proj => (
                        <div
                          key={proj.id}
                          className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/70 flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <h4 className="text-base font-bold text-white truncate">{proj.title}</h4>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase ${
                                proj.status === 'approved'
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                  : proj.status === 'rejected'
                                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                              }`}>
                                {proj.status}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 line-clamp-2">{proj.description}</p>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/60">
                            <span className="text-[11px] font-mono text-zinc-500 truncate">
                              tags: {(proj.tags || []).join(', ') || 'code'}
                            </span>
                            <a
                              href={proj.github_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#ff6b1a] hover:underline flex items-center gap-1 shrink-0"
                            >
                              <span>Repo</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── SESSIONS TAB ──────────────────────────────────── */}
            {activeTab === 'sessions' && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl w-full flex flex-col gap-6 min-w-0"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/60 pb-5">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Session Registry
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Manage your campus workshop enrollments and confirm attendance
                    </p>
                  </div>
                  
                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-800/80 border border-zinc-700/60 shrink-0">
                    {(['all', 'registered', 'attended'] as const).map(filterKey => (
                      <button
                        key={filterKey}
                        type="button"
                        onClick={() => setSessionFilter(filterKey)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                          sessionFilter === filterKey
                            ? 'bg-[#ff6b1a] text-zinc-950 font-bold shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {filterKey}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3.5 w-full">
                  {events
                    .filter(s => {
                      const st = eventStatus[s.id] || { registered: false, attended: false }
                      if (sessionFilter === 'registered') return st.registered
                      if (sessionFilter === 'attended') return st.attended
                      return true
                    })
                    .map(event => {
                      const st = eventStatus[event.id] || { registered: false, attended: false }
                      const dateStr = event.event_date
                        ? new Date(event.event_date).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'Date TBD'

                      return (
                        <div
                          key={event.id}
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/70 hover:border-zinc-700 transition-colors w-full min-w-0"
                        >
                          <div className="flex flex-col gap-1 min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                {event.category}
                              </span>
                              <h3 className={`text-base font-semibold transition-colors break-words ${st.attended ? 'text-zinc-400' : 'text-white'}`}>
                                {event.title}
                              </h3>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">{event.description}</p>
                            <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono flex-wrap mt-1">
                              <span className="text-[#ff6b1a] shrink-0 font-medium">{dateStr}</span>
                              <span>•</span>
                              <span className="truncate">{event.location}</span>
                              <span>•</span>
                              <span className="text-zinc-500">{event.spots_left} open slots</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t border-zinc-800/60 sm:border-t-0">
                            <a
                              href="#/events"
                              className="text-zinc-400 hover:text-white text-xs font-mono inline-flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <span>Curriculum</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            <button
                              type="button"
                              onClick={(e) => toggleRegister(event.id, e)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors border cursor-pointer ${
                                st.registered
                                  ? 'bg-[#ff6b1a]/20 border-[#ff6b1a]/40 text-[#ff9944]'
                                  : 'bg-zinc-800 text-zinc-300 border-zinc-700/60 hover:bg-zinc-700'
                              }`}
                            >
                              {st.registered ? 'Enrolled' : 'Register'}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => toggleAttended(event.id, e)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors border cursor-pointer ${
                                st.attended
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700/60 hover:text-white'
                              }`}
                            >
                              {st.attended ? '✓ Attended' : 'Mark Attended'}
                            </button>
                          </div>
                        </div>
                      )
                    })}

                  {events.filter(s => {
                    const st = eventStatus[s.id] || { registered: false, attended: false }
                    if (sessionFilter === 'registered') return st.registered
                    if (sessionFilter === 'attended') return st.attended
                    return true
                  }).length === 0 && (
                    <div className="text-center py-12 text-zinc-500 font-mono text-sm">
                      No sessions match this filter ({sessionFilter}).
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── MY PROJECTS TAB ──────────────────────────────── */}
            {activeTab === 'projects' && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl w-full flex flex-col gap-6 min-w-0"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/60 pb-5">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      My Project Submissions
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Codebases and open-source applications created by you
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="bg-[#ff6b1a] hover:bg-[#ff8533] text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-zinc-950" />
                    <span>Submit New Project</span>
                  </button>
                </div>

                {myProjects.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-500">
                      <Code2 className="w-7 h-7 text-[#ff6b1a]" />
                    </div>
                    <h3 className="text-base font-semibold text-white">No projects registered under your name</h3>
                    <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                      You haven't submitted any projects yet. All approved submissions appear on the public SDC Project Showcase with GitHub badges.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(true)}
                      className="mt-2 bg-[#ff6b1a] text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#ff8533] transition-colors cursor-pointer"
                    >
                      Submit a Project Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {myProjects.map(proj => (
                      <div
                        key={proj.id}
                        className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/70 hover:border-zinc-700 transition-colors flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="text-base font-bold text-white leading-snug">{proj.title}</h4>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${
                              proj.status === 'approved'
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                : proj.status === 'rejected'
                                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                            }`}>
                              {proj.status}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">{proj.description}</p>
                        </div>

                        <div className="flex flex-col gap-2 pt-3 border-t border-zinc-800/60">
                          <div className="flex flex-wrap gap-1.5">
                            {(proj.tags || []).map((tag, idx) => (
                              <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                            <span>Author: {proj.submitted_by}</span>
                            <a
                              href={proj.github_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-mono text-[#ff6b1a] hover:underline flex items-center gap-1"
                            >
                              <span>View Repository</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── APPLICATION TIMELINE TAB ───────────────────────── */}
            {activeTab === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl w-full min-w-0"
              >
                <div className="border-b border-zinc-800/60 pb-5 mb-8">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Membership Lifecycle Stepper
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Live verification and progression status for {displayName}
                  </p>
                </div>

                <div className="relative pl-6 space-y-8 border-l-2 border-zinc-800 ml-4">
                  {/* Step 1: Account Creation & Auth */}
                  <div className="relative">
                    <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-[#050508] flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 bg-[#050508]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-semibold text-zinc-200">1. Account Provisioned & Verified</h4>
                      <p className="text-sm text-zinc-400 mt-1 break-words">
                        Authenticated via Supabase Auth with email confirmation.
                      </p>
                      <span className="inline-block mt-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded">
                        Completed {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Fall 2026'}
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Domain Classification */}
                  <div className="relative">
                    <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-[#050508] flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 bg-[#050508]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-semibold text-zinc-200">2. Institutional Domain Verification</h4>
                      <p className="text-sm text-zinc-400 mt-1 break-words">
                        {isUniversity
                          ? 'Parul University official academic domain verified for student & admin eligibility.'
                          : 'External builder domain verified for member access.'}
                      </p>
                      <span className="inline-block mt-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded">
                        {isUniversity ? 'Verified Campus Student' : 'Verified Community Member'}
                      </span>
                    </div>
                  </div>

                  {/* Step 3: Active Technical Engagement */}
                  <div className="relative">
                    <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-[#050508] flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-[#ff6b1a] shadow-[0_0_12px_rgba(249,115,22,0.9)]" />
                    </div>
                    <div className="bg-[#ff6b1a]/10 border border-[#ff6b1a]/30 rounded-xl p-5 -mt-2 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h4 className="text-base font-bold text-white break-words">3. Active Technical Engagement</h4>
                        <span className="text-xs font-mono uppercase tracking-wider text-[#ff944d] bg-[#ff6b1a]/20 border border-[#ff6b1a]/40 px-2 py-0.5 rounded shrink-0">
                          Active Stage
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 mb-3 break-words">
                        Participation in campus workshops, open-source pull requests, and national hackathons.
                      </p>
                      <div className="bg-black/50 border border-zinc-800 rounded-lg p-3.5 text-xs font-mono space-y-1.5 min-w-0">
                        <div className="text-orange-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>Status: {registeredEvents.length} workshop(s) enrolled, {attendedEvents.length} attended</span>
                        </div>
                        <p className="text-zinc-400">
                          Project portfolio: {myProjects.length} submitted build(s) recorded in database.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Core Collective & Leadership */}
                  <div className="relative pt-4">
                    <div className="absolute -left-[35px] top-4 w-8 h-8 rounded-full bg-[#050508] flex items-center justify-center">
                      {isAdmin ? (
                        <Award className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-700" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-semibold text-zinc-400">
                        4. {isAdmin ? 'Executive Steering Board' : 'Core Collective & Leadership Track'}
                      </h4>
                      <p className="text-sm text-zinc-500 mt-1 break-words">
                        {isAdmin
                          ? 'Active administrative and steering privileges enabled for club governance.'
                          : 'Maintain workshop attendance and contribute to club repositories to unlock track lead nominations.'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ADMIN TAB 1: PROJECT APPROVALS & REGISTRY ────── */}
            {activeTab === 'admin-projects' && isAdmin && (
              <motion.div
                key="admin-projects"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col gap-6"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-white tracking-tight">Project Approvals & Registry</h2>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {projects.length} Total
                      </span>
                      {pendingProjects.length > 0 && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-bold animate-pulse">
                          {pendingProjects.length} Pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Review submitted student repositories, grant public showcase status, or register new projects.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminModal({ type: 'add-project' })}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4 text-zinc-950 stroke-[3]" />
                    <span>Add Project</span>
                  </button>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(filter => {
                      const count = filter === 'all' 
                        ? projects.length 
                        : projects.filter(p => p.status === filter).length
                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setAdminProjectFilter(filter)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                            adminProjectFilter === filter
                              ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                              : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                        >
                          {filter} ({count})
                        </button>
                      )
                    })}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={adminProjectSearch}
                      onChange={(e) => setAdminProjectSearch(e.target.value)}
                      placeholder="Search title, tech, author..."
                      className="w-full sm:w-64 h-9 pl-9 pr-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                {/* Projects Grid */}
                {filteredAdminProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800">
                    <Layers className="w-10 h-10 text-zinc-600 mb-3" />
                    <h3 className="text-sm font-semibold text-white">No projects found</h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                      {adminProjectSearch ? 'Try a different search query or clear the filter.' : 'No projects match the selected status.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAdminProjects.map(proj => (
                      <div
                        key={proj.id}
                        className={`p-5 rounded-2xl bg-zinc-900/60 border transition-all flex flex-col justify-between gap-4 ${
                          proj.status === 'pending'
                            ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.08)] ring-1 ring-amber-500/30'
                            : 'border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="text-base font-bold text-white leading-snug">{proj.title}</h4>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 font-bold ${
                              proj.status === 'approved'
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                : proj.status === 'rejected'
                                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                : 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                            }`}>
                              {proj.status}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mb-3">
                            {proj.description}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {proj.tags?.map(tag => (
                              <span
                                key={tag}
                                className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/90 text-zinc-300 border border-zinc-700/60"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2.5 pt-3 border-t border-zinc-800/70">
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>Author: <strong className="text-zinc-300">{proj.submitted_by}</strong></span>
                            {proj.github_url && (
                              <a
                                href={proj.github_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#ff6b1a] hover:underline flex items-center gap-1 font-mono text-[11px]"
                              >
                                <span>Code repo</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-1.5">
                              {proj.status !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveProject(proj.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                              )}
                              {proj.status !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => handleRejectProject(proj.id)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setAdminModal({ type: 'edit-project', item: proj })}
                                className="text-zinc-500 hover:text-amber-400 p-1 rounded hover:bg-amber-500/10 transition-colors cursor-pointer"
                                title="Edit project"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProject(proj.id, proj.title)}
                                className="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Delete project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── ADMIN TAB 2: EVENT MANAGER ────────────────────── */}
            {activeTab === 'admin-events' && isAdmin && (
              <motion.div
                key="admin-events"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col gap-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-white tracking-tight">Event Management</h2>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {events.length} Live
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Publish workshops, hackathons, and speaker sessions. Synchronized with the public events calendar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminModal({ type: 'add-event' })}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4 text-zinc-950 stroke-[3]" />
                    <span>Create Event</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map(ev => (
                    <div
                      key={ev.id}
                      className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="text-base font-bold text-white leading-snug">{ev.title}</h4>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {ev.featured && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                ★ Featured
                              </span>
                            )}
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {ev.category}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                          {ev.description}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-400 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                          <div>📍 {ev.location}</div>
                          <div>🪑 {ev.spots_left} seats remaining</div>
                          <div className="col-span-2 text-zinc-500">
                            🗓 {ev.event_date ? new Date(ev.event_date).toLocaleString() : 'Date TBD'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                        <span className="text-[11px] font-mono text-zinc-500">ID: {ev.id.slice(0, 8)}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAdminModal({ type: 'edit-event', item: ev })}
                            className="px-2.5 py-1 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id, ev.title)}
                            className="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── ADMIN TAB 3: BROADCAST STUDIO ─────────────────── */}
            {activeTab === 'admin-announcements' && isAdmin && (
              <motion.div
                key="admin-announcements"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col gap-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-white tracking-tight">Broadcast Announcements</h2>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {announcements.length} Total
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Dispatch official banner notices directly to all logged-in student dashboards.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminModal({ type: 'add-announcement' })}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4 text-zinc-950 stroke-[3]" />
                    <span>New Broadcast</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {announcements.map(ann => (
                    <div
                      key={ann.id}
                      className={`p-5 rounded-2xl bg-zinc-900/60 border transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        ann.is_active
                          ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-zinc-900/70 to-zinc-900/40'
                          : 'border-zinc-800/80 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                          ann.is_active ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono uppercase tracking-wider font-bold text-amber-400">
                              {ann.category}
                            </span>
                            <span className="text-xs text-zinc-500">·</span>
                            <span className="text-xs text-zinc-500 font-mono">
                              {ann.created_at ? new Date(ann.created_at).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white truncate">{ann.headline}</h4>
                          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{ann.message}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAnnouncement(ann.id, ann.is_active)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            ann.is_active
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                          }`}
                        >
                          {ann.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{ann.is_active ? 'Active Transmission' : 'Inactive'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminModal({ type: 'edit-announcement', item: ann })}
                          className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Edit announcement"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── ADMIN TAB 4: MEMBER ROSTER & APPROVALS ────────── */}
            {activeTab === 'admin-members' && isAdmin && (
              <motion.div
                key="admin-members"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col gap-8"
              >
                {/* ── 1. Pending Member Applications Review Section ── */}
                <div className="p-6 rounded-2xl bg-[#12101e]/90 border border-amber-500/25 shadow-xl flex flex-col gap-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-amber-400" />
                          <span>Member Join Applications</span>
                        </h3>
                        <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-bold ${
                          pendingApplications.length > 0
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {pendingApplications.length} Pending Approval
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Review student registration requests. Approving an applicant grants them access to member dashboard features, squads, and workshop repositories.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const apps = await api.applications.list()
                          setApplications(Array.isArray(apps) ? apps : [])
                          showToast('Applications refreshed! ✓')
                        } catch {}
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {pendingApplications.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingApplications.map(app => (
                        <div
                          key={app.id}
                          className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-amber-500/30 transition-all flex flex-col justify-between gap-3 shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0">
                                {app.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-white truncate">{app.name}</h4>
                                <p className="text-xs text-zinc-400 truncate font-mono">{app.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                    app.member_type === 'university'
                                      ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                                      : 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
                                  }`}>
                                    {app.member_type === 'university' ? '🎓 Parul University' : '🌐 External'}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 font-mono">
                                    {app.applied_at ? `Applied ${new Date(app.applied_at).toLocaleDateString()}` : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-900">
                            <button
                              type="button"
                              disabled={processingAppId === app.id}
                              onClick={() => handleRejectApplication(app.id, app.name)}
                              className="px-3 py-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                            <button
                              type="button"
                              disabled={processingAppId === app.id}
                              onClick={() => handleApproveApplication(app.id, app.name)}
                              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>{processingAppId === app.id ? 'Approving...' : 'Approve Member'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 px-4 rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center flex flex-col items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <p className="text-xs text-zinc-300 font-medium">All member applications reviewed!</p>
                      <p className="text-[11px] text-zinc-500">No new student join requests currently awaiting administrator review.</p>
                    </div>
                  )}
                </div>

                {/* ── 2. Official Member Directory Header ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-white tracking-tight">Club Member Roster</h2>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {members.length} Members
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Official directory of student leaders, committee heads, and faculty advisors.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminModal({ type: 'add-member' })}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4 text-zinc-950 stroke-[3]" />
                    <span>Add Member</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {members.map(mem => (
                    <div
                      key={mem.id}
                      className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono font-extrabold text-sm flex items-center justify-center shrink-0">
                          {mem.initials || mem.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{mem.name}</h4>
                          <p className="text-xs text-amber-400 truncate font-mono">{mem.role || 'Member'}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">
                              {mem.member_type === 'faculty' ? '🎓 Faculty' : '👤 Student'}
                            </span>
                            {mem.dept && (
                              <span className="text-[10px] text-zinc-500 truncate">· {mem.dept}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setAdminModal({ type: 'edit-member', item: mem })}
                          className="text-zinc-500 hover:text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
                          title="Edit member"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(mem.id, mem.name)}
                          className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── ADMIN TAB 5: CLUB STATS ───────────────────────── */}
            {activeTab === 'admin-stats' && isAdmin && (
              <motion.div
                key="admin-stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col gap-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-white tracking-tight">Club Platform Metrics</h2>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Live on Landing Page
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Platform statistics displayed publicly across the hero counters on the SDC homepage.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminModal({ type: 'edit-stats' })}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <span>Edit Live Stats</span>
                  </button>
                </div>

                {stats ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
                      <span className="text-xs font-mono uppercase text-zinc-400">Active Members</span>
                      <div className="text-3xl font-extrabold text-white my-3">{stats.active_members}</div>
                      <span className="text-[11px] text-zinc-500">Live verified community builders</span>
                    </div>

                    <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
                      <span className="text-xs font-mono uppercase text-zinc-400">Workshops Run</span>
                      <div className="text-3xl font-extrabold text-[#ff6b1a] my-3">{stats.workshops_run}</div>
                      <span className="text-[11px] text-zinc-500">Hands-on technical bootcamps</span>
                    </div>

                    <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
                      <span className="text-xs font-mono uppercase text-zinc-400">Projects Shipped</span>
                      <div className="text-3xl font-extrabold text-blue-400 my-3">{stats.projects_shipped}</div>
                      <span className="text-[11px] text-zinc-500">Production software repositories</span>
                    </div>

                    <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
                      <span className="text-xs font-mono uppercase text-zinc-400">Events Organized</span>
                      <div className="text-3xl font-extrabold text-emerald-400 my-3">
                        {stats.events_organized ?? stats.hackathons_won ?? '--'}
                      </div>
                      <span className="text-[11px] text-zinc-500">Campus and national hackathons</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center">
                    <p className="text-xs text-zinc-500">Stats row not yet seeded. Click "Edit Live Stats" to initialize.</p>
                  </div>
                )}

                {stats?.updated_at && (
                  <p className="text-xs font-mono text-zinc-500 text-right">
                    Last platform update: {new Date(stats.updated_at).toLocaleString()}
                  </p>
                )}
              </motion.div>
            )}

            {/* ── ADMIN TAB 6: CONTENT STUDIO (BLOGS, VOICES, FAQS) ─ */}
            {activeTab === 'admin-content' && isAdmin && (
              <motion.div
                key="admin-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col gap-6"
              >
                {/* Content Header & Sub-Tab Switcher */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Content & Knowledge Studio</h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Manage technical blog articles, student testimonials, and official FAQ responses.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {adminContentSubTab === 'blogs' && (
                      <button
                        type="button"
                        onClick={() => setAdminModal({ type: 'add-blog' })}
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                      >
                        <Plus className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" />
                        <span>Add Blog Post</span>
                      </button>
                    )}
                    {adminContentSubTab === 'voices' && (
                      <button
                        type="button"
                        onClick={() => setAdminModal({ type: 'add-voice' })}
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                      >
                        <Plus className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" />
                        <span>Add Testimonial</span>
                      </button>
                    )}
                    {adminContentSubTab === 'faqs' && (
                      <button
                        type="button"
                        onClick={() => setAdminModal({ type: 'add-faq' })}
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                      >
                        <Plus className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" />
                        <span>Add FAQ Question</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* SubTab Bar */}
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <button
                    type="button"
                    onClick={() => setAdminContentSubTab('blogs')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                      adminContentSubTab === 'blogs'
                        ? 'bg-zinc-800 text-white font-bold border border-zinc-700 shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Blog Articles ({blogs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminContentSubTab('voices')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                      adminContentSubTab === 'voices'
                        ? 'bg-zinc-800 text-white font-bold border border-zinc-700 shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Testimonials ({voices.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminContentSubTab('faqs')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                      adminContentSubTab === 'faqs'
                        ? 'bg-zinc-800 text-white font-bold border border-zinc-700 shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    FAQs ({faqs.length})
                  </button>
                </div>

                {/* SubTab 1: Blogs */}
                {adminContentSubTab === 'blogs' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {blogs.map(b => (
                      <div
                        key={b.id}
                        className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between gap-3 overflow-hidden"
                      >
                        <div>
                          {b.image_url && (
                            <div className="w-full h-32 rounded-xl overflow-hidden mb-3 border border-zinc-800/80 relative">
                              <img
                                src={b.image_url}
                                alt={b.title}
                                className="w-full h-full object-cover"
                              />
                              {Array.isArray(b.photos) && b.photos.length > 0 && (
                                <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur text-white text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                                  <Camera className="w-3 h-3 text-amber-400" />
                                  {b.photos.length} Photo{b.photos.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="text-base font-bold text-white line-clamp-1">{b.title}</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                              {b.tag}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                            {b.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                            <span>By {b.author} · {b.read_time}</span>
                            {!b.image_url && Array.isArray(b.photos) && b.photos.length > 0 && (
                              <span className="text-amber-400/80 flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                {b.photos.length} Photo{b.photos.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                          <button
                            type="button"
                            onClick={() => setAdminModal({ type: 'edit-blog', item: b })}
                            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBlog(b.id, b.title)}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* SubTab 2: Testimonials */}
                {adminContentSubTab === 'voices' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {voices.map(v => (
                      <div
                        key={v.id}
                        className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between gap-3"
                      >
                        <p className="text-sm text-zinc-300 italic">"{v.quote}"</p>
                        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                          <div>
                            <div className="text-xs font-bold text-white">{v.name}</div>
                            <div className="text-[11px] text-zinc-500 font-mono">{v.year}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setAdminModal({ type: 'edit-voice', item: v })}
                              className="text-zinc-500 hover:text-amber-400 p-1 rounded hover:bg-amber-500/10 cursor-pointer"
                              title="Edit testimonial"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVoice(v.id)}
                              className="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 cursor-pointer"
                              title="Delete testimonial"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* SubTab 3: FAQs */}
                {adminContentSubTab === 'faqs' && (
                  <div className="flex flex-col gap-3">
                    {faqs.map(f => (
                      <div
                        key={f.id}
                        className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white mb-1">Q: {f.question}</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">A: {f.answer}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setAdminModal({ type: 'edit-faq', item: f })}
                            className="text-zinc-500 hover:text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10 cursor-pointer"
                            title="Edit FAQ"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFAQ(f.id)}
                            className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                            title="Delete FAQ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ── Submit Project Modal ───────────────────────────────── */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-5">
                <h3 className="text-xl font-bold text-white">Submit Open-Source Project</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Add your project to the SDC gallery. Submitting as <span className="text-[#ff6b1a]">{displayName}</span>.
                </p>
              </div>

              {submitError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleProjectSubmit} className="flex flex-col gap-3.5">
                <div>
                  <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5">Project Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. PulseAuth, CampusNav"
                    className="w-full h-11 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:border-[#ff6b1a] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Briefly explain what problem this solves and the tech stack used."
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:border-[#ff6b1a] outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5">GitHub Repository URL</label>
                  <input
                    type="url"
                    value={newGithub}
                    onChange={(e) => setNewGithub(e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="w-full h-11 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:border-[#ff6b1a] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="React, Next.js, Node.js, AI"
                    className="w-full h-11 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:border-[#ff6b1a] outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProject}
                    className="bg-[#ff6b1a] hover:bg-[#ff8533] disabled:opacity-50 text-zinc-950 font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
                  >
                    {submittingProject && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{submittingProject ? 'Submitting...' : 'Submit Project'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Profile Photo Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-5">
                <div className="flex items-center gap-2 text-[#ff6b1a] mb-1">
                  <Camera className="w-5 h-5" />
                  <h3 className="text-xl font-bold text-white">Profile Photo</h3>
                </div>
                <p className="text-xs text-zinc-400">
                  Personalize your SDC member profile with an avatar image.
                </p>
              </div>

              {photoError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {photoError}
                </div>
              )}

              {/* Live Preview Area */}
              <div className="flex flex-col items-center justify-center py-4 px-6 bg-zinc-900/60 rounded-xl border border-zinc-800/80 mb-5">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#ff6b1a]/40 shadow-xl bg-zinc-950 flex items-center justify-center">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={() => setPhotoError('Failed to load image from URL. Please check the link.')}
                      />
                    ) : user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Current Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-[#120e24] text-white font-extrabold text-3xl flex items-center justify-center">
                        {userInitials}
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ff6b1a] text-zinc-950 shadow-md">
                    {photoPreview ? 'Preview' : (user?.avatarUrl ? 'Current' : 'Default')}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-3 text-center">
                  {photoPreview
                    ? 'New image ready to be saved'
                    : user?.avatarUrl
                    ? 'Displaying current profile photo'
                    : 'Showing standard initials badge'}
                </p>
              </div>

              {/* Upload from Device */}
              <div className="mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-zinc-700 hover:border-[#ff6b1a] bg-zinc-900/40 hover:bg-zinc-900 text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#ff6b1a]" />
                  <span>Upload Image from Device (PNG, JPG, WebP)</span>
                </button>
                <p className="text-[10px] text-zinc-500 mt-1 text-center">
                  Max 5MB • Automatically scaled for fast loading
                </p>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                  Or use image URL
                </span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>

              {/* URL Input */}
              <div className="mb-5 mt-1">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={photoUrlInput}
                    onChange={(e) => {
                      setPhotoUrlInput(e.target.value)
                      if (photoError) setPhotoError(null)
                    }}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#ff6b1a] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (photoUrlInput.trim()) {
                        setPhotoPreview(photoUrlInput.trim())
                      }
                    }}
                    className="px-3 h-10 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    Preview
                  </button>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                <div>
                  {(user?.avatarUrl || photoPreview) && (
                    <button
                      type="button"
                      disabled={savingPhoto}
                      onClick={handleRemovePhoto}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      title="Remove custom photo and restore initials"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingPhoto || (!photoPreview && !photoUrlInput.trim())}
                    onClick={handleSavePhoto}
                    className="bg-[#ff6b1a] hover:bg-[#ff8533] disabled:opacity-50 text-zinc-950 font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-[#ff6b1a]/20"
                  >
                    {savingPhoto && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{savingPhoto ? 'Saving...' : 'Save Photo'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Profile & Account Modal ───────────────────────── */}
      <AnimatePresence>
        {showEditProfileModal && user && (
          <EditProfileModal
            user={user}
            onClose={() => {
              setShowEditProfileModal(false)
              if (window.location.hash.includes('editProfile=true')) {
                window.location.hash = '#/dashboard'
              }
            }}
            onSave={async (updates) => {
              const res = await updateProfile(updates)
              if (res.success) {
                showToast('Profile updated successfully! ✨')
                setShowEditProfileModal(false)
                if (window.location.hash.includes('editProfile=true')) {
                  window.location.hash = '#/dashboard'
                }
              } else {
                throw new Error(res.error || 'Failed to update profile.')
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Admin Management Modals ─────────────────────────────── */}
      <AnimatePresence>
        {adminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setAdminModal(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {(adminModal.type === 'add-project' || adminModal.type === 'edit-project') && (
                <AdminProjectForm
                  initialData={adminModal.type === 'edit-project' ? adminModal.item : undefined}
                  onSubmit={(data) => {
                    if (adminModal.type === 'edit-project' && adminModal.item?.id) {
                      return handleUpdateProject(adminModal.item.id, data)
                    }
                    return handleCreateProjectAdmin(data)
                  }}
                  onCancel={() => setAdminModal(null)}
                  defaultAuthor={displayName}
                />
              )}

              {(adminModal.type === 'add-event' || adminModal.type === 'edit-event') && (
                <AdminEventForm
                  initialData={adminModal.type === 'edit-event' ? adminModal.item : undefined}
                  onSubmit={(data) => {
                    if (adminModal.type === 'edit-event' && adminModal.item?.id) {
                      return handleUpdateEvent(adminModal.item.id, data)
                    }
                    return handleCreateEvent(data)
                  }}
                  onCancel={() => setAdminModal(null)}
                />
              )}

              {(adminModal.type === 'add-announcement' || adminModal.type === 'edit-announcement') && (
                <AdminAnnouncementForm
                  initialData={adminModal.type === 'edit-announcement' ? adminModal.item : undefined}
                  onSubmit={(data) => {
                    if (adminModal.type === 'edit-announcement' && adminModal.item?.id) {
                      return handleUpdateAnnouncement(adminModal.item.id, data)
                    }
                    return handleCreateAnnouncement(data)
                  }}
                  onCancel={() => setAdminModal(null)}
                />
              )}

              {(adminModal.type === 'add-member' || adminModal.type === 'edit-member') && (
                <AdminMemberForm
                  initialData={adminModal.type === 'edit-member' ? adminModal.item : undefined}
                  onSubmit={(data) => {
                    if (adminModal.type === 'edit-member' && adminModal.item?.id) {
                      return handleUpdateMember(adminModal.item.id, data)
                    }
                    return handleCreateMember(data)
                  }}
                  onCancel={() => setAdminModal(null)}
                />
              )}

              {adminModal.type === 'edit-stats' && (
                <AdminStatsForm
                  stats={stats || {
                    id: 'main',
                    active_members: '--',
                    workshops_run: '--',
                    projects_shipped: '--',
                    events_organized: '--',
                    hackathons_won: '--',
                    updated_at: new Date().toISOString(),
                  }}
                  onSubmit={handleUpdateStats}
                  onCancel={() => setAdminModal(null)}
                />
              )}

              {(adminModal.type === 'add-blog' || adminModal.type === 'edit-blog') && (
                <AdminBlogForm
                  initialData={adminModal.type === 'edit-blog' ? adminModal.item : undefined}
                  onSubmit={(data) => {
                    if (adminModal.type === 'edit-blog' && adminModal.item?.id) {
                      return handleUpdateBlog(adminModal.item.id, data)
                    }
                    return handleCreateBlog(data)
                  }}
                  onCancel={() => setAdminModal(null)}
                  defaultAuthor={displayName}
                />
              )}

              {(adminModal.type === 'add-voice' || adminModal.type === 'edit-voice') && (
                <AdminVoiceForm
                  initialData={adminModal.type === 'edit-voice' ? adminModal.item : undefined}
                  onSubmit={(data) => {
                    if (adminModal.type === 'edit-voice' && adminModal.item?.id) {
                      return handleUpdateVoice(adminModal.item.id, data)
                    }
                    return handleCreateVoice(data)
                  }}
                  onCancel={() => setAdminModal(null)}
                />
              )}

              {(adminModal.type === 'add-faq' || adminModal.type === 'edit-faq') && (
                <AdminFAQForm
                  initialData={adminModal.type === 'edit-faq' ? adminModal.item : undefined}
                  onSubmit={(data) => {
                    if (adminModal.type === 'edit-faq' && adminModal.item?.id) {
                      return handleUpdateFAQ(adminModal.item.id, data)
                    }
                    return handleCreateFAQ(data)
                  }}
                  onCancel={() => setAdminModal(null)}
                />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

// ── Admin Modal Form Subcomponents ─────────────────────────

function AdminProjectForm({
  onSubmit,
  onCancel,
  defaultAuthor,
  initialData,
}: {
  onSubmit: (p: Partial<Project>) => Promise<void>
  onCancel: () => void
  defaultAuthor: string
  initialData?: Partial<Project>
}) {
  const isEdit = !!initialData
  const [f, setF] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    github_url: initialData?.github_url || 'https://github.com/sdc-club',
    submitted_by: initialData?.submitted_by || defaultAuthor || 'Admin',
    status: (initialData?.status || 'approved') as 'pending' | 'approved' | 'rejected',
    tags: initialData?.tags ? (Array.isArray(initialData.tags) ? initialData.tags.join(', ') : String(initialData.tags)) : 'React, TypeScript, SDC',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit({
      ...f,
      tags: f.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setSubmitting(false)
  }

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-xl font-bold text-white">{isEdit ? 'Edit Project' : 'Register Project (Admin)'}</h3>
        <p className="text-xs text-zinc-400 mt-1">
          {isEdit ? 'Update project repository, details, or showcase status.' : 'Directly register or approve student builds into the public repository.'}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Title</label>
          <input
            required
            value={f.title}
            onChange={e => setF(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Parul Campus Portal"
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Description</label>
          <textarea
            required
            rows={3}
            value={f.description}
            onChange={e => setF(p => ({ ...p, description: e.target.value }))}
            placeholder="Brief overview of software architecture and features"
            className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">GitHub Repo URL</label>
          <input
            type="url"
            value={f.github_url}
            onChange={e => setF(p => ({ ...p, github_url: e.target.value }))}
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Author / Submitter</label>
            <input
              required
              value={f.submitted_by}
              onChange={e => setF(p => ({ ...p, submitted_by: e.target.value }))}
              className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Status</label>
            <select
              value={f.status}
              onChange={e => setF(p => ({ ...p, status: e.target.value as any }))}
              className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none cursor-pointer"
            >
              <option value="approved">Approved (Live)</option>
              <option value="pending">Pending Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Tags (Comma-separated)</label>
          <input
            value={f.tags}
            onChange={e => setF(p => ({ ...p, tags: e.target.value }))}
            placeholder="React, TypeScript, Supabase, Tailwind"
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800 mt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            {submitting ? (isEdit ? 'Saving...' : 'Registering...') : (isEdit ? 'Save Changes' : 'Register Project')}
          </button>
        </div>
      </form>
    </div>
  )
}

function AdminEventForm({
  onSubmit,
  onCancel,
  initialData,
}: {
  onSubmit: (e: Partial<SDCEvent>) => Promise<void>
  onCancel: () => void
  initialData?: Partial<SDCEvent>
}) {
  const isEdit = !!initialData
  const formattedDate = initialData?.event_date
    ? new Date(initialData.event_date).toISOString().slice(0, 16)
    : ''

  const [f, setF] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: (initialData?.category || 'Workshops') as SDCEvent['category'],
    event_date: formattedDate,
    location: initialData?.location || 'PIET Campus / Online Meet',
    spots_left: initialData?.spots_left ?? 45,
    featured: initialData?.featured ?? false,
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit(f as Partial<SDCEvent>)
    setSubmitting(false)
  }

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-xl font-bold text-white">{isEdit ? 'Edit Event Details' : 'Create New Event'}</h3>
        <p className="text-xs text-zinc-400 mt-1">
          {isEdit ? 'Update session timing, venue, seats, or featured showcase status.' : 'Add a session to the SDC public calendar and workshop pipeline.'}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Event Title</label>
          <input
            required
            value={f.title}
            onChange={e => setF(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Full-Stack Cloud Architecture Workshop"
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Description</label>
          <textarea
            required
            rows={3}
            value={f.description}
            onChange={e => setF(p => ({ ...p, description: e.target.value }))}
            placeholder="Key syllabus points, speaker credentials, and hands-on goals."
            className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Category</label>
            <select
              value={f.category}
              onChange={e => setF(p => ({ ...p, category: e.target.value as any }))}
              className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none cursor-pointer"
            >
              {['Workshops', 'Hackathons', 'Talks', 'Social'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Seats Remaining</label>
            <input
              type="number"
              value={f.spots_left}
              onChange={e => setF(p => ({ ...p, spots_left: Number(e.target.value) }))}
              className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Date & Time</label>
            <input
              type="datetime-local"
              required
              value={f.event_date}
              onChange={e => setF(p => ({ ...p, event_date: e.target.value }))}
              className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Location</label>
            <input
              required
              value={f.location}
              onChange={e => setF(p => ({ ...p, location: e.target.value }))}
              placeholder="e.g. Lab 402 or Google Meet"
              className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
            />
          </div>
        </div>
        <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={f.featured}
            onChange={e => setF(p => ({ ...p, featured: e.target.checked }))}
            className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-0"
          />
          <span>Feature prominently on club homepage banner</span>
        </label>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800 mt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            {submitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Event')}
          </button>
        </div>
      </form>
    </div>
  )
}

function AdminAnnouncementForm({
  onSubmit,
  onCancel,
  initialData,
}: {
  onSubmit: (a: Partial<Announcement>) => Promise<void>
  onCancel: () => void
  initialData?: Partial<Announcement>
}) {
  const isEdit = !!initialData
  const [f, setF] = useState({
    headline: initialData?.headline || '',
    category: initialData?.category || 'General',
    message: initialData?.message || '',
    is_active: initialData?.is_active ?? true,
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit(f as Partial<Announcement>)
    setSubmitting(false)
  }

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-xl font-bold text-white">{isEdit ? 'Edit Announcement' : 'Broadcast Announcement'}</h3>
        <p className="text-xs text-zinc-400 mt-1">
          {isEdit ? 'Update broadcast notification copy and visibility status.' : 'Send a banner notification to all registered student accounts.'}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Headline</label>
          <input
            required
            value={f.headline}
            onChange={e => setF(p => ({ ...p, headline: e.target.value }))}
            placeholder="e.g. Parul Hackathon Registrations Open"
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Category</label>
          <select
            value={f.category}
            onChange={e => setF(p => ({ ...p, category: e.target.value as 'General' | 'Workshop' | 'Hackathon' | 'Urgent' }))}
            className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none cursor-pointer"
          >
            {['General', 'Workshop', 'Hackathon', 'Urgent'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Message Details</label>
          <textarea
            required
            rows={3}
            value={f.message}
            onChange={e => setF(p => ({ ...p, message: e.target.value }))}
            placeholder="Detailed instructions or transmission briefing."
            className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none resize-none"
          />
        </div>
        <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={f.is_active}
            onChange={e => setF(p => ({ ...p, is_active: e.target.checked }))}
            className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-0"
          />
          <span>Set as Active Broadcast immediately</span>
        </label>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800 mt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            {submitting ? (isEdit ? 'Saving...' : 'Broadcasting...') : (isEdit ? 'Save Changes' : 'Broadcast Announcement')}
          </button>
        </div>
      </form>
    </div>
  )
}

function AdminMemberForm({
  onSubmit,
  onCancel,
  initialData,
}: {
  onSubmit: (m: Partial<Member>) => Promise<void>
  onCancel: () => void
  initialData?: Partial<Member>
}) {
  const isEdit = !!initialData
  const [f, setF] = useState({
    name: initialData?.name || '',
    role: initialData?.role || 'Lead Developer',
    initials: initialData?.initials || '',
    member_type: initialData?.member_type || 'student',
    dept: initialData?.dept || 'Computer Science & Engineering',
    sort_order: initialData?.sort_order ?? 99,
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit({
      ...f,
      member_type: f.member_type as Member['member_type'],
      initials: f.initials.trim().slice(0, 2).toUpperCase() || f.name.slice(0, 2).toUpperCase(),
    })
    setSubmitting(false)
  }

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-xl font-bold text-white">{isEdit ? 'Edit Member Profile' : 'Add Club Member'}</h3>
        <p className="text-xs text-zinc-400 mt-1">
          {isEdit ? 'Update student lead or faculty mentor details on the official roster.' : 'Enroll an official student lead or faculty mentor to the roster.'}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Full Name</label>
          <input
            required
            value={f.name}
            onChange={e => setF(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. John Doe"
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Role Title</label>
            <input
              required
              value={f.role}
              onChange={e => setF(p => ({ ...p, role: e.target.value }))}
              placeholder="e.g. Frontend Lead"
              className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Initials (2 letters)</label>
            <input
              maxLength={2}
              value={f.initials}
              onChange={e => setF(p => ({ ...p, initials: e.target.value.toUpperCase() }))}
              placeholder="JD"
              className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none uppercase font-mono"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Member Type</label>
            <select
              value={f.member_type}
              onChange={e => setF(p => ({ ...p, member_type: e.target.value as 'student' | 'faculty' }))}
              className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none cursor-pointer"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Sort Priority</label>
            <input
              type="number"
              value={f.sort_order}
              onChange={e => setF(p => ({ ...p, sort_order: Number(e.target.value) }))}
              className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Department / Program</label>
          <input
            value={f.dept}
            onChange={e => setF(p => ({ ...p, dept: e.target.value }))}
            placeholder="e.g. Department of Information Technology"
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800 mt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            {submitting ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Member')}
          </button>
        </div>
      </form>
    </div>
  )
}

function AdminStatsForm({
  stats,
  onSubmit,
  onCancel,
}: {
  stats: Stats
  onSubmit: (s: Partial<Stats> & { id: string }) => Promise<void>
  onCancel: () => void
}) {
  const [f, setF] = useState({
    id: stats.id || 'main',
    active_members: stats.active_members || '--',
    workshops_run: stats.workshops_run || '--',
    projects_shipped: stats.projects_shipped || '--',
    events_organized: stats.events_organized || stats.hackathons_won || '--',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit({
      ...f,
      hackathons_won: f.events_organized,
    })
    setSubmitting(false)
  }

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-xl font-bold text-white">Edit Platform Live Stats</h3>
        <p className="text-xs text-zinc-400 mt-1">Changes reflect instantly across the public landing page hero metrics.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Active Members</label>
          <input
            required
            value={f.active_members}
            onChange={e => setF(p => ({ ...p, active_members: e.target.value }))}
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Workshops Run</label>
          <input
            required
            value={f.workshops_run}
            onChange={e => setF(p => ({ ...p, workshops_run: e.target.value }))}
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Projects Shipped</label>
          <input
            required
            value={f.projects_shipped}
            onChange={e => setF(p => ({ ...p, projects_shipped: e.target.value }))}
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Events Organized</label>
          <input
            required
            value={f.events_organized}
            onChange={e => setF(p => ({ ...p, events_organized: e.target.value }))}
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800 mt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            {submitting ? 'Saving...' : 'Save Live Stats'}
          </button>
        </div>
      </form>
    </div>
  )
}

function compressImageFile(file: File, maxWidth = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(e.target?.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.onerror = () => resolve(e.target?.result as string)
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function AdminBlogForm({
  onSubmit,
  onCancel,
  defaultAuthor,
  initialData,
}: {
  onSubmit: (b: Partial<Blog>) => Promise<void>
  onCancel: () => void
  defaultAuthor: string
  initialData?: Partial<Blog>
}) {
  const isEdit = !!initialData
  const [f, setF] = useState({
    title: initialData?.title || '',
    excerpt: initialData?.excerpt || '',
    content: initialData?.content || '',
    author: initialData?.author || defaultAuthor || 'SDC Tech Lead',
    tag: initialData?.tag || 'Community',
    read_time: initialData?.read_time || '4 min read',
    image_url: initialData?.image_url || '',
    photos: Array.isArray(initialData?.photos) ? initialData.photos : [],
  })
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingCover(true)
      const dataUrl = await compressImageFile(file, 1200, 0.85)
      setF(prev => ({
        ...prev,
        image_url: dataUrl,
        photos: prev.photos.length === 0 ? [dataUrl] : prev.photos,
      }))
    } catch (err) {
      console.error('Failed to compress cover image', err)
    } finally {
      setUploadingCover(false)
      e.target.value = ''
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    try {
      setUploadingPhotos(true)
      const compressedList: string[] = []
      for (let i = 0; i < files.length; i++) {
        const dataUrl = await compressImageFile(files[i], 1200, 0.85)
        compressedList.push(dataUrl)
      }
      setF(prev => ({
        ...prev,
        photos: [...prev.photos, ...compressedList],
        image_url: prev.image_url || compressedList[0] || '',
      }))
    } catch (err) {
      console.error('Failed to process gallery images', err)
    } finally {
      setUploadingPhotos(false)
      e.target.value = ''
    }
  }

  const handleAddPhotoUrl = () => {
    const url = newPhotoUrl.trim()
    if (!url) return
    setF(prev => ({
      ...prev,
      photos: [...prev.photos, url],
      image_url: prev.image_url || url,
    }))
    setNewPhotoUrl('')
  }

  const handleRemovePhoto = (index: number) => {
    setF(prev => {
      const updated = prev.photos.filter((_, i) => i !== index)
      let cover = prev.image_url
      if (cover === prev.photos[index]) {
        cover = updated[0] || ''
      }
      return { ...prev, photos: updated, image_url: cover }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit(f)
    setSubmitting(false)
  }

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-xl font-bold text-white">{isEdit ? 'Edit Event Blog Post' : 'Publish Event Blog Post'}</h3>
        <p className="text-xs text-zinc-400 mt-1">
          {isEdit ? 'Update event story copy, cover banner, and member photo gallery.' : 'Share technical insights, hackathon highlights, and event photo albums with members.'}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 max-h-[75vh] overflow-y-auto pr-1">
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Article Title</label>
          <input
            required
            value={f.title}
            onChange={e => setF(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. SDC Fall Hackathon 2026: Winning Builds & Recap"
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Excerpt Summary</label>
          <textarea
            required
            rows={2}
            value={f.excerpt}
            onChange={e => setF(p => ({ ...p, excerpt: e.target.value }))}
            placeholder="Brief preview of the event or article content..."
            className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Full Article Content (Markdown supported)</label>
          <textarea
            required
            rows={5}
            value={f.content}
            onChange={e => setF(p => ({ ...p, content: e.target.value }))}
            placeholder="Write full article description, event highlights, recap..."
            className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none resize-none font-mono"
          />
        </div>

        {/* ── EVENT PHOTOS & COVER BANNER SECTION ───────────────── */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono uppercase text-white font-bold tracking-wider">Event Photos & Gallery</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Upload event snapshots from your device or add image URLs. Members can view them in the interactive photo viewer.
              </p>
            </div>
            {f.photos.length > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {f.photos.length} Photo{f.photos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Cover Image Controls */}
          <div>
            <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1.5 font-semibold">Featured Cover Image</label>
            <div className="flex gap-2 items-center">
              <input
                value={f.image_url}
                onChange={e => setF(p => ({ ...p, image_url: e.target.value }))}
                placeholder="Paste Cover Image URL (https://...) or upload below"
                className="flex-1 h-9 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none font-mono"
              />
              <label className="h-9 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors shrink-0">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>{uploadingCover ? 'Uploading...' : 'Upload Cover'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="hidden"
                />
              </label>
            </div>

            {f.image_url && (
              <div className="mt-2.5 relative w-full h-32 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 group">
                <img
                  src={f.image_url}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-3">
                  <span className="text-[11px] font-mono text-white bg-black/70 px-2 py-0.5 rounded">Featured Cover</span>
                  <button
                    type="button"
                    onClick={() => setF(p => ({ ...p, image_url: '' }))}
                    className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                    title="Remove cover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Event Photo Gallery Upload & Management */}
          <div className="pt-2 border-t border-zinc-800/80">
            <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1.5 font-semibold">Event Gallery Photos (Multi-Upload)</label>
            <div className="flex flex-wrap gap-2 items-center mb-2.5">
              <label className="h-9 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>{uploadingPhotos ? 'Processing Photos...' : 'Upload Event Photos (Multi)'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleGalleryUpload}
                  disabled={uploadingPhotos}
                  className="hidden"
                />
              </label>

              <div className="flex flex-1 min-w-[220px] gap-1.5 items-center">
                <input
                  value={newPhotoUrl}
                  onChange={e => setNewPhotoUrl(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddPhotoUrl()
                    }
                  }}
                  placeholder="Or paste photo URL..."
                  className="flex-1 h-9 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddPhotoUrl}
                  disabled={!newPhotoUrl.trim()}
                  className="h-9 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-medium cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Gallery Grid Preview */}
            {f.photos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-2 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                {f.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 group"
                  >
                    <img
                      src={photo}
                      alt={`Event photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setF(p => ({ ...p, image_url: photo }))}
                        className="px-1.5 py-0.5 rounded bg-amber-500 text-[10px] font-bold text-zinc-950 hover:bg-amber-400 transition-colors cursor-pointer"
                        title="Set as cover image"
                      >
                        Cover
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="p-1 rounded bg-rose-500/90 text-white hover:bg-rose-500 transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {f.image_url === photo && (
                      <span className="absolute bottom-1 left-1 bg-amber-500 text-zinc-950 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded shadow">
                        COVER
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center bg-zinc-950/30">
                <p className="text-[11px] text-zinc-500">No event photos attached yet. Upload photos from the event to showcase it to members.</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Author</label>
            <input
              required
              value={f.author}
              onChange={e => setF(p => ({ ...p, author: e.target.value }))}
              className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Topic Tag</label>
            <input
              required
              value={f.tag}
              onChange={e => setF(p => ({ ...p, tag: e.target.value }))}
              placeholder="Engineering"
              className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Read Time</label>
            <input
              required
              value={f.read_time}
              onChange={e => setF(p => ({ ...p, read_time: e.target.value }))}
              className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800 mt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            {submitting ? (isEdit ? 'Saving...' : 'Publishing...') : (isEdit ? 'Save Changes' : 'Publish Post')}
          </button>
        </div>
      </form>
    </div>
  )
}

function AdminVoiceForm({
  onSubmit,
  onCancel,
  initialData,
}: {
  onSubmit: (v: Partial<Voice>) => Promise<void>
  onCancel: () => void
  initialData?: Partial<Voice>
}) {
  const isEdit = !!initialData
  const [f, setF] = useState({
    quote: initialData?.quote || '',
    name: initialData?.name || '',
    year: initialData?.year || 'B.Tech CSE \'26',
    initials: initialData?.initials || '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit({
      ...f,
      initials: f.initials.trim().slice(0, 2).toUpperCase() || f.name.slice(0, 2).toUpperCase(),
      sort_order: initialData?.sort_order ?? 99,
    })
    setSubmitting(false)
  }

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-xl font-bold text-white">{isEdit ? 'Edit Student Testimonial' : 'Add Student Testimonial'}</h3>
        <p className="text-xs text-zinc-400 mt-1">
          {isEdit ? 'Update student quote testimonial or batch details.' : 'Add a quote from a member showcasing their SDC club experience.'}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Quote Testimonial</label>
          <textarea
            required
            rows={3}
            value={f.quote}
            onChange={e => setF(p => ({ ...p, quote: e.target.value }))}
            placeholder="Sharing what I learned collaborating with other students..."
            className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none resize-none italic"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Student Name</label>
            <input
              required
              value={f.name}
              onChange={e => setF(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Alex Sharma"
              className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Batch / Department</label>
            <input
              required
              value={f.year}
              onChange={e => setF(p => ({ ...p, year: e.target.value }))}
              placeholder="e.g. B.Tech IT '26"
              className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Initials (Optional)</label>
          <input
            maxLength={2}
            value={f.initials}
            onChange={e => setF(p => ({ ...p, initials: e.target.value.toUpperCase() }))}
            placeholder="AS"
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none uppercase font-mono"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800 mt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            {submitting ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Testimonial')}
          </button>
        </div>
      </form>
    </div>
  )
}

function AdminFAQForm({
  onSubmit,
  onCancel,
  initialData,
}: {
  onSubmit: (f: Partial<FAQ>) => Promise<void>
  onCancel: () => void
  initialData?: Partial<FAQ>
}) {
  const isEdit = !!initialData
  const [f, setF] = useState({
    question: initialData?.question || '',
    answer: initialData?.answer || '',
    sort_order: initialData?.sort_order ?? 99,
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit(f)
    setSubmitting(false)
  }

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-xl font-bold text-white">{isEdit ? 'Edit FAQ Question' : 'Add FAQ Question'}</h3>
        <p className="text-xs text-zinc-400 mt-1">
          {isEdit ? 'Update question and response in the help center.' : 'Add common member queries and answers to the help section.'}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Question</label>
          <input
            required
            value={f.question}
            onChange={e => setF(p => ({ ...p, question: e.target.value }))}
            placeholder="e.g. How do I join the SDC open-source sprint?"
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Answer</label>
          <textarea
            required
            rows={4}
            value={f.answer}
            onChange={e => setF(p => ({ ...p, answer: e.target.value }))}
            placeholder="Comprehensive explanation and links if applicable."
            className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold">Display Sort Order</label>
          <input
            type="number"
            value={f.sort_order}
            onChange={e => setF(p => ({ ...p, sort_order: Number(e.target.value) }))}
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-400 outline-none"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800 mt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            {submitting ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add FAQ')}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Pending Approval View for newly registered students ───────
function PendingApprovalView({
  user,
  checkingStatus,
  onCheckStatus,
  onLogout,
}: {
  user: User
  checkingStatus: boolean
  onCheckStatus: () => void
  onLogout: () => void
}) {
  return (
    <div className="dashboard-page w-full min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 text-zinc-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-xl rounded-3xl bg-[#0e0c18]/90 border border-amber-500/30 p-8 sm:p-10 backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.7)] text-center relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono uppercase tracking-wider mb-6 font-bold shadow-sm">
          <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" style={{ animationDuration: '4s' }} />
          <span>Membership Application Under Review</span>
        </div>

        {/* Monogram Avatar with Pulsing Halo */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-md animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-amber-500/40 flex items-center justify-center text-white font-mono text-2xl font-black shadow-xl overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              (user.name || user.email).slice(0, 2).toUpperCase()
            )}
          </div>
        </div>

        {/* Greeting & Headline */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Welcome, {user.name.split(' ')[0]}!
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed mb-6">
          Your application to join the <span className="text-white font-semibold">Student Developer Club</span> at Parul University, Goa has been submitted and is currently awaiting administrator review.
        </p>

        {/* Policy Detail Card */}
        <div className="text-left p-4 sm:p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 mb-6 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs py-1 border-b border-zinc-900">
            <span className="text-zinc-500 font-mono">Applicant Email:</span>
            <span className="text-white font-mono font-medium truncate max-w-[240px]">{user.email}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1 border-b border-zinc-900">
            <span className="text-zinc-500 font-mono">Affiliation:</span>
            <span className="text-amber-300 font-mono">
              {user.memberType === 'university' ? '🎓 Parul University Student' : '🌐 External Developer'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs py-1 border-b border-zinc-900">
            <span className="text-zinc-500 font-mono">Submitted Date:</span>
            <span className="text-zinc-300 font-mono">{new Date(user.joinedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-zinc-500 font-mono">Access Status:</span>
            <span className="text-amber-400 font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              Pending Admin Approval
            </span>
          </div>
        </div>

        {/* Note about approval requirement */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs leading-relaxed mb-8 text-left flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Club administrators review all registrations to ensure student squads maintain verified GitHub credentials, project squad slots, and workshop lab allocations.
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          <button
            type="button"
            disabled={checkingStatus}
            onClick={onCheckStatus}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/25 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${checkingStatus ? 'animate-spin' : ''}`} />
            <span>{checkingStatus ? 'Checking Status...' : 'Check Approval Status'}</span>
          </button>
          <button
            type="button"
            onClick={() => { window.location.hash = '#/events' }}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs border border-zinc-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Explore Public Events</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto px-4 py-3 rounded-xl hover:bg-zinc-900/60 text-zinc-400 hover:text-white font-mono text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Rejected View for rejected applicants ─────────────────────
function RejectedApprovalView({
  user,
  onLogout,
}: {
  user: User
  onLogout: () => void
}) {
  return (
    <div className="dashboard-page w-full min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 text-zinc-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-3xl bg-[#0e0c18]/90 border border-rose-500/30 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-2xl mx-auto mb-6">
          <X className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Membership Application Not Approved</h2>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
          Your request to join the Student Developer Club could not be approved at this time. If you believe this is in error, please contact our student coordinators or faculty mentors.
        </p>
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs font-mono text-zinc-400 mb-6 text-left">
          <div>Account: {user.email}</div>
          <div className="mt-1">Inquiries: lead@sdc.club</div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </motion.div>
    </div>
  )
}

// ── Full Profile & Account Edit Modal ─────────────────────────
function EditProfileModal({
  user,
  onClose,
  onSave,
}: {
  user: User
  onClose: () => void
  onSave: (updates: {
    name?: string
    avatarUrl?: string
    bio?: string
    githubUrl?: string
    linkedinUrl?: string
    discordTag?: string
    phone?: string
    dept?: string
    year?: string
  }) => Promise<void>
}) {
  const [name, setName] = useState(user.name || '')
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '')
  const [bio, setBio] = useState(user.bio || '')
  const [dept, setDept] = useState(user.dept || 'Computer Science & Engineering')
  const [year, setYear] = useState(user.year || "3rd Year (Class of '26)")
  const [githubUrl, setGithubUrl] = useState(user.githubUrl || '')
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl || '')
  const [discordTag, setDiscordTag] = useState(user.discordTag || '')
  const [phone, setPhone] = useState(user.phone || '')

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null)
  const [photoUrlInput, setPhotoUrlInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Compute initials fallback
  const initials = useMemo(() => {
    if (name.trim()) {
      const parts = name.trim().split(/\s+/).filter(Boolean)
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      return name.slice(0, 2).toUpperCase()
    }
    return 'SD'
  }, [name])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).')
      return
    }
    if (file.size > 6 * 1024 * 1024) {
      setError('Image file is too large (maximum 6MB).')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 256
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > MAX) {
            height = Math.round((height * MAX) / width)
            width = MAX
          }
        } else {
          if (height > MAX) {
            width = Math.round((width * MAX) / height)
            height = MAX
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
          setAvatarPreview(dataUrl)
          setAvatarUrl(dataUrl)
          setError(null)
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleApplyUrl = () => {
    if (photoUrlInput.trim()) {
      setAvatarPreview(photoUrlInput.trim())
      setAvatarUrl(photoUrlInput.trim())
      setPhotoUrlInput('')
      setError(null)
    }
  }

  const handleRemovePhoto = () => {
    setAvatarPreview(null)
    setAvatarUrl('')
    setPhotoUrlInput('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Full Name is required.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave({
        name: name.trim(),
        avatarUrl: avatarUrl,
        bio: bio.trim(),
        dept: dept.trim(),
        year: year.trim(),
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        discordTag: discordTag.trim(),
        phone: phone.trim(),
      })
    } catch (err: any) {
      setError(err?.message || 'Failed to save changes. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-[0_25px_80px_rgba(0,0,0,0.8)] relative my-8 max-h-[92vh] flex flex-col"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-zinc-800/80">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ff6b1a]/20 to-amber-500/10 border border-[#ff6b1a]/30 flex items-center justify-center text-[#ff6b1a]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Edit Member Profile</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Customize your public SDC directory card, avatar, contact socials, and student affiliations.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-medium">
            <X className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 overflow-y-auto pr-1">
          {/* 1. Avatar Photo Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col sm:flex-row items-center gap-5">
            {/* Avatar Preview */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#ff6b1a]/50 shadow-xl bg-zinc-950 flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                    onError={() => setError('Unable to load image preview. Please check URL.')}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-[#120e24] text-white font-extrabold text-2xl flex items-center justify-center">
                    {initials}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#ff6b1a] text-zinc-950 shadow-md hover:scale-110 transition-transform cursor-pointer"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Photo Controls */}
            <div className="flex-1 w-full flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase font-bold text-zinc-300">Profile Photo</span>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-zinc-700/60 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#ff6b1a]" />
                  <span>Choose Image File</span>
                </button>

                <div className="flex gap-1.5 flex-1">
                  <input
                    type="url"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    placeholder="or paste image URL..."
                    className="flex-1 h-9 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:border-[#ff6b1a] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3 h-9 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    Apply
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">Max 6MB. PNG, JPG, or WebP. Automatically optimized.</p>
            </div>
          </div>

          {/* 2. Basic Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-[#ff6b1a]" />
                <span>Full Name</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Sharma"
                className="w-full h-11 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:border-[#ff6b1a] outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>Account Email</span>
              </label>
              <input
                type="text"
                disabled
                value={user.email}
                className="w-full h-11 px-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-sm text-zinc-500 font-mono cursor-not-allowed"
                title="Account email address cannot be modified directly"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Phone / WhatsApp</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-11 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:border-[#ff6b1a] outline-none font-mono"
              />
            </div>
          </div>

          {/* 3. Academic Affiliation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>Academic Department</span>
              </label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#ff6b1a] outline-none"
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering (CSE)</option>
                <option value="Information Technology">Information Technology (IT)</option>
                <option value="Artificial Intelligence & Data Science">AI & Data Science (AI/ML)</option>
                <option value="Robotics & Automation">Robotics & Automation</option>
                <option value="Electronics & Communication">Electronics & Communication (ECE)</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Computer Applications (MCA/BCA)">Computer Applications (MCA/BCA)</option>
                <option value="Faculty / Mentor">Faculty / Mentor</option>
                <option value="Community Member">External Developer</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Cohort / Academic Year</span>
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#ff6b1a] outline-none"
              >
                <option value="1st Year (Class of '28)">1st Year (Class of '28)</option>
                <option value="2nd Year (Class of '27)">2nd Year (Class of '27)</option>
                <option value="3rd Year (Class of '26)">3rd Year (Class of '26)</option>
                <option value="Final Year (Class of '25)">Final Year (Class of '25)</option>
                <option value="Faculty / Academic Mentor">Faculty / Academic Mentor</option>
                <option value="Alumni Developer">Alumni Developer</option>
              </select>
            </div>
          </div>

          {/* 4. Bio / About Description */}
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Bio & Tech Passions</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">{bio.length}/300</span>
            </label>
            <textarea
              rows={3}
              maxLength={300}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other club members about your favorite tech stack, open-source projects, and what you're currently building..."
              className="w-full p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:border-[#ff6b1a] outline-none resize-none leading-relaxed"
            />
          </div>

          {/* 5. Developer Links & Socials */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex flex-col gap-3.5">
            <h3 className="text-xs font-mono uppercase font-bold text-zinc-300 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#ff6b1a]" />
              <span>Developer Handles & Social Profiles</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1 font-semibold flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-zinc-300 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub Profile URL</span>
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#ff6b1a] outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1 font-semibold flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-400 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                  <span>LinkedIn Profile URL</span>
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#ff6b1a] outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1 font-semibold flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Discord Username / Handle</span>
                </label>
                <input
                  type="text"
                  value={discordTag}
                  onChange={(e) => setDiscordTag(e.target.value)}
                  placeholder="e.g. dev_alex or alex#1234"
                  className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#ff6b1a] outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800 mt-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#ff6b1a] hover:bg-[#ff8533] disabled:opacity-50 text-zinc-950 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#ff6b1a]/25 cursor-pointer flex items-center gap-2 active:scale-[0.98]"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default DashboardPage

