import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import SpecularButton from '@/components/ui/SpecularButton'
import { ShieldCheck, User } from 'lucide-react'

const BASE_NAV_LINKS = [
  { href: '#/home', label: 'Home' },
  { href: '#/dashboard', label: 'Dashboard' },
  { href: '#/about', label: 'About' },
  { href: '#/events', label: 'Events' },
  { href: '#/projects', label: 'Projects' },
  { href: '#/blog', label: 'Blog' },
  { href: '#/guidelines', label: 'Guidelines' },
  { href: '#/contact', label: 'Contact' },
]

interface NavBarProps {
  navigate: (page: string) => void
  currentPage: string
}

export function NavBar({ navigate, currentPage }: NavBarProps) {
  const { user, isLoggedIn, isAdmin } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = isAdmin
    ? [...BASE_NAV_LINKS, { href: '#/admin', label: 'Admin' }]
    : BASE_NAV_LINKS

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const closeMobile = () => setMobileOpen(false)

  const isLinkActive = (href: string) => {
    const target = href.replace(/^#\/?/, '') || 'home'
    const cur = currentPage.replace(/^#\/?/, '') || 'home'
    return target === cur
  }

  const handleNav = (href: string) => {
    closeMobile()
    const target = href.replace(/^#\/?/, '') || 'home'
    if (target !== currentPage && navigate) {
      navigate(target)
    }
  }

  return (
    <nav className="nav" style={{ background: scrolled ? 'rgba(5,5,8,0.88)' : 'rgba(5,5,8,0.65)' }}>
      {/* logo */}
      <motion.a
        href="#/home"
        className="nav-logo flex items-center justify-center cursor-pointer"
        aria-label="SDC Home"
        onClick={(e) => {
          e.preventDefault()
          handleNav('#/home')
        }}
        whileTap={{ scale: 0.94 }}
      >
        <motion.img
          src="/assets/sdc-logo.png"
          alt="SDC Logo"
          className="h-9 w-9 object-contain select-none"
          whileHover={{
            rotate: 360,
            transition: {
              duration: 1.6,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
        />
      </motion.a>

      {/* desktop links with active indicator */}
      <ul className="nav-links">
        {navLinks.map((link) => {
          const active = isLinkActive(link.href)
          const isAdminLink = link.label === 'Admin'
          return (
            <li key={link.href}>
              <motion.a
                href={link.href}
                onClick={(e) => {
                  e.preventDefault()
                  handleNav(link.href)
                }}
                style={{
                  color: active
                    ? 'var(--accent)'
                    : isAdminLink
                    ? '#ff9933'
                    : 'var(--text-secondary)',
                  fontWeight: active || isAdminLink ? 600 : 400,
                  transition: 'color 0.3s, font-weight 0.3s',
                }}
                whileHover={{ color: 'var(--text-primary)' }}
                whileTap={{ scale: 0.95 }}
                className={isAdminLink ? 'flex items-center gap-1' : ''}
              >
                {isAdminLink && <ShieldCheck className="h-3.5 w-3.5 text-[#ff6b1a]" />}
                <span>{link.label}</span>
              </motion.a>
            </li>
          )
        })}
      </ul>

      {/* right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isLoggedIn && user ? (
          <button
            onClick={() => {
              if (window.location.hash.startsWith('#/dashboard')) {
                window.dispatchEvent(new CustomEvent('open-edit-profile'))
              } else {
                window.location.hash = '#/dashboard?editProfile=true'
              }
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151324] hover:bg-[#1d1b32] border border-[#ff6b1a]/30 hover:border-[#ff6b1a] hover:scale-105 text-white text-xs font-mono transition-all cursor-pointer shadow-md"
            title={`Click to edit profile (${user.name})`}
          >
            <div className="w-5 h-5 rounded-full bg-[#ff6b1a]/20 text-[#ff8c42] flex items-center justify-center overflow-hidden border border-[#ff6b1a]/30 shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : isAdmin ? (
                <ShieldCheck className="h-3 w-3" />
              ) : (
                <User className="h-3 w-3" />
              )}
            </div>
            <span className="font-semibold">{user.name.split(' ')[0]}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wider ${
                isAdmin
                  ? 'bg-[#ff6b1a]/20 text-[#ff8c42]'
                  : user.approvalStatus === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {isAdmin ? 'Admin' : user.approvalStatus === 'pending' ? 'Pending' : 'Member'}
            </span>
          </button>
        ) : (
          <SpecularButton
            size="sm"
            radius={20}
            tint="#ff6b1a"
            tintOpacity={0.9}
            textColor="#ffffff"
            lineColor="#ffaa44"
            baseColor="#ff6b1a"
            intensity={1.2}
            shineSize={12}
            shineFade={30}
            thickness={1.2}
            followMouse
            proximity={180}
            onClick={(e) => {
              e.preventDefault()
              handleNav('#/auth')
            }}
            className="shadow-[0_0_20px_rgba(255,107,26,0.45)] font-semibold text-xs tracking-wider uppercase px-5 py-2 cursor-pointer"
          >
            Join / Sign In
          </SpecularButton>
        )}

        {/* mobile hamburger */}
        <motion.button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: 'var(--text-primary)',
          }}
          whileTap={{ scale: 0.9 }}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <AnimatePresence mode="wait">
              {mobileOpen ? (
                <motion.path
                  key="close"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  exit={{ pathLength: 0 }}
                  transition={{ duration: 0.2 }}
                  d="M18 6L6 18M6 6l12 12"
                />
              ) : (
                <motion.path
                  key="open"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  exit={{ pathLength: 0 }}
                  transition={{ duration: 0.2 }}
                  d="M3 6h18M3 12h18M3 18h18"
                />
              )}
            </AnimatePresence>
          </svg>
        </motion.button>
      </div>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={closeMobile}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
              background: 'rgba(5,5,8,0.96)',
              backdropFilter: 'blur(24px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              gap: 28,
            }}
          >
            <button
              onClick={closeMobile}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: 8,
              }}
              aria-label="Close menu"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, listStyle: 'none' }}>
              <div className="flex items-center gap-3 mb-2">
                <motion.img
                  src="/assets/sdc-logo.png"
                  alt="SDC Logo"
                  className="h-10 w-10 object-contain select-none cursor-pointer"
                  whileHover={{
                    rotate: 360,
                    transition: {
                      duration: 1.6,
                      repeat: Infinity,
                      ease: 'linear',
                    },
                  }}
                />
                <span className="text-xl font-bold tracking-widest text-white">SDC</span>
              </div>
              {navLinks.map((link) => {
                const active = isLinkActive(link.href)
                const isAdminLink = link.label === 'Admin'
                return (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleNav(link.href)
                    }}
                    style={{
                      fontSize: 22,
                      fontWeight: active ? 700 : 500,
                      color: active ? 'var(--accent)' : isAdminLink ? '#ff9933' : 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      transition: 'color 0.2s',
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    whileHover={{ color: 'var(--text-primary)', scale: 1.02 }}
                  >
                    {link.label}
                  </motion.a>
                )
              })}
            </div>

            {isLoggedIn && user ? (
              <motion.button
                onClick={() => {
                  closeMobile()
                  if (window.location.hash.startsWith('#/dashboard')) {
                    window.dispatchEvent(new CustomEvent('open-edit-profile'))
                  } else {
                    window.location.hash = '#/dashboard?editProfile=true'
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#151324] border border-[#ff6b1a]/50 text-white text-sm font-mono shadow-lg cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="w-6 h-6 rounded-full bg-[#ff6b1a]/20 text-[#ff8c42] flex items-center justify-center overflow-hidden border border-[#ff6b1a]/30 shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : isAdmin ? (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className="font-semibold">{user.name}</span>
                <span className="text-xs text-[#ff6b1a]">· Edit Profile</span>
              </motion.button>
            ) : (
              <motion.a
                href="#/auth"
                className="nav-cta"
                onClick={(e) => {
                  e.stopPropagation()
                  handleNav('#/auth')
                }}
                style={{
                  marginTop: 12,
                  padding: '12px 32px',
                  fontSize: 15,
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Join SDC
              </motion.a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* responsive: show hamburger on small screens, hide nav-links */}
      <style>{`@media (max-width: 768px) {
        .nav .nav-links { display: none; }
        .nav .mobile-toggle { display: flex !important; }
      }`}</style>
    </nav>
  )
}
