import { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import { HomePage } from './pages/HomePage'
import { NavBar } from './components/NavBar'
import { StarsBackground } from '@/components/ui/stars'
import { GreetingPreloader } from '@/components/ui/GreetingPreloader'
import { TypewriterReveal } from '@/components/ui/TypewriterReveal'
import { AuthPage } from './pages/AuthPage'

// Lazy-load secondary and heavier pages for fast initial page load
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })))
const EventsPage = lazy(() => import('./pages/EventsPage').then(m => ({ default: m.EventsPage })))
const PortfolioLaunchPage = lazy(() => import('./pages/PortfolioLaunchPage').then(m => ({ default: m.PortfolioLaunchPage })))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })))
const BlogPage = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })))
const GuidelinesPage = lazy(() => import('./pages/GuidelinesPage').then(m => ({ default: m.GuidelinesPage })))
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))

const PAGES: Record<string, React.ComponentType<any>> = {
  '':                       HomePage,
  home:                     HomePage,
  about:                    AboutPage,
  events:                   EventsPage,
  'events/portfolio-launch': PortfolioLaunchPage,
  projects:                 ProjectsPage,
  blog:                     BlogPage,
  guidelines:               GuidelinesPage,
  contact:                  ContactPage,
  auth:                     AuthPage,
  dashboard:                DashboardPage,
  admin:                    DashboardPage,
}

function PageFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] w-full py-12 gap-3">
      <div className="h-7 w-7 rounded-full border-2 border-[#ff6b1a]/30 border-t-[#ff6b1a] animate-spin" />
      <span className="text-xs text-[#8a8599] font-mono tracking-wide">Loading module...</span>
    </div>
  )
}

function renderPage(page: string, onAuthSuccess?: () => void) {
  if (page === 'auth') {
    return <AuthPage onAuthSuccess={onAuthSuccess} />
  }
  const C = PAGES[page] || PAGES.home
  return (
    <Suspense fallback={<PageFallback />}>
      <C />
    </Suspense>
  )
}

export default function App() {
  const { isLoggedIn } = useAuth()
  const [preloaderDone, setPreloaderDone] = useState(false)
  const [showTypewriter, setShowTypewriter] = useState(false)

  const [page, setPage] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      return window.location.hash.replace(/^#\/?/, '').trim() || 'home'
    }
    return 'home'
  })

  const navigate = useCallback((nextPage: string) => {
    const clean = nextPage.replace(/^#\/?/, '') || 'home'
    if (clean === page) return
    setPage(clean)
    if (window.location.hash !== `#/${clean}`) {
      window.location.hash = `#/${clean}`
    }
  }, [page])

  // Sync hash changes and respect direct deep-linking
  useEffect(() => {
    const initHash = window.location.hash.replace(/^#\/?/, '').trim() || 'home'
    if (initHash === 'admin') {
      window.location.hash = '#/dashboard'
      setPage('dashboard')
    } else {
      setPage(initHash)
    }
    if (!window.location.hash) {
      window.location.hash = '#/home'
    }

    const handler = () => {
      const h = window.location.hash.replace(/^#\/?/, '').trim() || 'home'
      if (h === 'admin') {
        window.location.hash = '#/dashboard'
        setPage('dashboard')
        return
      }
      setPage(h)
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  // Strict Route Guarding:
  // - 'dashboard' and 'admin' both resolve to DashboardPage
  let activePage = page
  if (page === 'admin') {
    activePage = 'dashboard'
  }
  if (activePage === 'dashboard' && !isLoggedIn) {
    activePage = 'auth'
  }

  const isHome = activePage === 'home'
  const isContact = activePage === 'contact'
  const isAuth = activePage === 'auth'

  const handleAuthSuccess = useCallback((_role?: 'admin' | 'member', _targetPage?: string) => {
    setShowTypewriter(false)
    setPage('dashboard')
    window.location.hash = '#/dashboard'
  }, [])

  const handleTypewriterComplete = useCallback(() => {
    setShowTypewriter(false)
    setPage('home')
    window.location.hash = '#/home'
  }, [])

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activePage])

  return (
    <div className="relative isolate min-h-screen w-full text-foreground bg-[#020204]">
      {/* 1. Initial Greeting Preloader */}
      {!preloaderDone && (
        <GreetingPreloader onComplete={() => setPreloaderDone(true)} />
      )}

      {/* 2. Typewriter Reveal overlay triggered after signup/login */}
      {showTypewriter && (
        <TypewriterReveal onComplete={handleTypewriterComplete} />
      )}

      {/* Dynamic Stars Background - hidden on auth page */}
      {!isAuth && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <StarsBackground className="w-full h-full" />
        </div>
      )}

      {/* Top Navigation Bar - Hidden on Auth views */}
      {!isAuth && (
        <NavBar navigate={navigate} currentPage={activePage} />
      )}

      {/* Main Page Content */}
      <AnimatePresence mode="wait">
        <motion.main
          key={activePage}
          id="main-content"
          className={`relative z-10 w-full flex flex-col items-center min-h-screen ${
            isHome
              ? 'is-home px-0 pt-0 pb-0 justify-start'
              : isContact
              ? 'is-contact px-4 sm:px-6 justify-center'
              : isAuth
              ? 'is-auth justify-center py-6 px-3 sm:px-6'
              : activePage === 'dashboard'
              ? 'w-full justify-start'
              : 'px-4 sm:px-6 justify-start'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <div
            className={`w-full flex flex-col items-center ${
              activePage === 'dashboard'
                ? 'max-w-full justify-start w-full'
                : isHome
                ? 'max-w-full justify-start w-full'
                : isContact
                ? 'max-w-4xl my-auto justify-center text-center'
                : activePage === 'projects' || activePage === 'about'
                ? 'max-w-7xl justify-start w-full'
                : isAuth
                ? 'max-w-2xl my-auto justify-center w-full px-2 sm:px-4'
                : 'max-w-5xl justify-start text-center'
            }`}
          >
            {renderPage(activePage, handleAuthSuccess)}
          </div>
        </motion.main>
      </AnimatePresence>
    </div>
  )
}
