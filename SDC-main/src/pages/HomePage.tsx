import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { api } from '@/lib/api'
import {
  ArrowRight,
  Terminal,
  Cpu,
  Globe,
  Rocket,
  BookOpen,
  Code2,
  Trophy,
  Layers,
  Users,
  Award,
  Sparkles,
  ChevronDown,
  ArrowUpRight,
  Zap,
  Quote,
  MapPin,
  Mail,
  Database,
  Server,
  Workflow,
  Flame,
  Box,
} from 'lucide-react'
import { DiscordIcon } from '@/components/ui/DiscordIcon'
import SpecularButton from '@/components/ui/SpecularButton'

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

function sectionAnim(idx = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { delay: idx * 0.07, duration: 0.35 },
  }
}

// FIX: cards use framer's whileHover for the lift. Tailwind's hover:-translate-y
// is overridden by framer's inline transform, and transition-all fights framer's
// per-frame animation, so both were removed from the card classes.
function cardAnim(idx = 0) {
  return {
    ...sectionAnim(idx),
    whileHover: { y: -2, transition: { duration: 0.2 } },
  }
}

const CARD_CLASS =
  'bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col h-full hover:border-[#ff6b1a]/40 hover:shadow-[0_0_25px_rgba(255,107,26,0.15)] transition-[border-color,box-shadow] duration-200 group'

// ─── Data ─────────────────────────────────────────────────────────────────────

const TRACKS = [
  {
    num: '01',
    icon: Terminal,
    title: 'Full-Stack & Cloud',
    description:
      'Architect production web & mobile applications using modern frameworks, scalable microservices, and distributed cloud databases.',
    tags: ['React 19', 'Next.js 15', 'Node.js', 'PostgreSQL', 'Docker', 'Redis'],
  },
  {
    num: '02',
    icon: Cpu,
    title: 'AI, Agents & Systems',
    description:
      'Train local open-weight models, build autonomous multi-agent pipelines, and engineer high-throughput systems in Python and Rust.',
    tags: ['Python', 'PyTorch', 'Rust', 'LangChain', 'Ollama', 'FastAPI'],
  },
  {
    num: '03',
    icon: Globe,
    title: 'WebGL & 3D Graphics',
    description:
      'Craft interactive 3D web experiences, GPU-accelerated GLSL fragment shaders, physics simulations, and bespoke creative visuals.',
    tags: ['Three.js', 'WebGL', 'GLSL', 'WebGPU', 'React Three Fiber', 'GSAP'],
  },
  {
    num: '04',
    icon: Rocket,
    title: 'Hackathons & Sprints',
    description:
      'Form high-velocity squads, compete in 36-hour national hackathons, build working MVPs under pressure, and pitch to industry judges.',
    tags: ['Rapid Prototyping', 'System Architecture', 'Pitch Sprints', 'Devfolio', 'SIH'],
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Learn',
    subtitle: 'Hands-on Labs',
    icon: BookOpen,
    description:
      'Master industry-standard frameworks, system architecture, and tools through weekly practical workshops and senior-guided teardowns.',
  },
  {
    num: '02',
    title: 'Build',
    subtitle: 'Project Squads',
    icon: Code2,
    description:
      'Form small agile squads of 3-4 developers. Write real code, manage GitHub branches, and conduct thorough peer pull request reviews.',
  },
  {
    num: '03',
    title: 'Ship',
    subtitle: 'Live Deployments',
    icon: Rocket,
    description:
      'Deploy applications to production with automated CI/CD pipelines, cloud databases, custom domains, and real user feedback.',
  },
  {
    num: '04',
    title: 'Compete',
    subtitle: 'National Arenas',
    icon: Trophy,
    description:
      'Compete in 36-hour hackathons, present at developer showcases, and represent Parul University on state and national stages.',
  },
]

const BENEFITS = [
  {
    num: '01',
    icon: Layers,
    title: 'Build real products, not toy tutorials',
    description:
      'Ship production-grade applications with real users, live cloud databases, and active open-source GitHub repositories from semester one.',
  },
  {
    num: '02',
    icon: Users,
    title: 'Learn from seniors and mentors',
    description:
      'Get direct 1-on-1 code reviews, architectural guidance, and pair-programming sessions with upperclassmen who have shipped real tech.',
  },
  {
    num: '03',
    icon: Award,
    title: 'Portfolio-ready proof of work',
    description:
      'Graduate beyond textbook theory. Earn official university-backed certificates and build standout portfolio artifacts recruiters notice.',
  },
  {
    num: '04',
    icon: Sparkles,
    title: 'Hackathon squads and community',
    description:
      'Find ambitious co-builders, form high-velocity hackathon squads, and build lifelong technical friendships with passionate developers.',
  },
]

const TECH_ROW_1 = [
  { name: 'React 19', desc: 'Modern UI Engine', icon: Code2, color: '#61dafb' },
  { name: 'Next.js 15', desc: 'SSR & Server Actions', icon: Layers, color: '#ffffff' },
  { name: 'TypeScript', desc: 'Type Safety', icon: Workflow, color: '#3178c6' },
  { name: 'Node.js', desc: 'Asynchronous APIs', icon: Server, color: '#68a063' },
  { name: 'PostgreSQL', desc: 'Relational Cloud DB', icon: Database, color: '#4169e1' },
  { name: 'Redis', desc: 'In-Memory Cache', icon: Flame, color: '#ff4438' },
  { name: 'Tailwind CSS', desc: 'Utility Design', icon: Zap, color: '#38bdf8' },
]

const TECH_ROW_2 = [
  { name: 'Python', desc: 'AI & Data Engineering', icon: Cpu, color: '#3776ab' },
  { name: 'PyTorch', desc: 'Deep Learning', icon: Flame, color: '#ee4c2c' },
  { name: 'Rust', desc: 'High-Throughput Systems', icon: Terminal, color: '#dea584' },
  { name: 'Three.js / WebGL', desc: '3D Graphics & Shaders', icon: Globe, color: '#ff6b1a' },
  { name: 'Docker', desc: 'Containerized Microservices', icon: Box, color: '#2496ed' },
  { name: 'Vite', desc: 'Ultra-Fast Tooling', icon: Zap, color: '#bd34fe' },
  { name: 'Supabase', desc: 'Postgres & Edge Auth', icon: Database, color: '#3ecf8e' },
]

// 4 identical copies so translating by exactly -50% (2 copies) loops seamlessly
const MARQUEE_1 = [...TECH_ROW_1, ...TECH_ROW_1, ...TECH_ROW_1, ...TECH_ROW_1]
const MARQUEE_2 = [...TECH_ROW_2, ...TECH_ROW_2, ...TECH_ROW_2, ...TECH_ROW_2]

const PLATFORM_LINKS = [
  { label: 'Home', href: '#/home' },
  { label: 'Dashboard', href: '#/dashboard' },
  { label: 'About Us', href: '#/about' },
  { label: 'Events & Hackathons', href: '#/events' },
  { label: 'Projects & Repos', href: '#/projects' },
  { label: 'Technical Blog', href: '#/blog' },
  { label: 'Club Guidelines', href: '#/guidelines' },
  { label: 'Contact Leadership', href: '#/contact' },
]

// ─── Shared Container Constant ────────────────────────────────────────────────
const CONTAINER = 'w-full max-w-[1200px] mx-auto px-6 md:px-8'

// ─── Component ────────────────────────────────────────────────────────────────
export function HomePage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0)
  const [statsData, setStatsData] = useState({
    active_members: '—',
    workshops_run: '—',
    projects_shipped: '—',
    events_organized: '—',
  })
  const [voicesData, setVoicesData] = useState<any[]>([])
  const [faqsData, setFaqsData] = useState<any[]>([])

  useEffect(() => {
    let isMounted = true

    // Fetch stats
    api.stats.get()
      .then((s) => {
        if (isMounted && s) {
          setStatsData({
            active_members: s.active_members || '--',
            workshops_run: s.workshops_run || '--',
            projects_shipped: s.projects_shipped || '--',
            events_organized: s.events_organized || s.hackathons_won || '--',
          })
        }
      })
      .catch((err) => console.warn('HomePage stats fetch fallback:', err))

    // Fetch voices
    api.voices.list()
      .then((v) => {
        if (isMounted && Array.isArray(v) && v.length > 0) {
          setVoicesData(v)
        }
      })
      .catch((err) => console.warn('HomePage voices fetch fallback:', err))

    // Fetch FAQs
    api.faqs.list()
      .then((f) => {
        if (isMounted && Array.isArray(f) && f.length > 0) {
          const mapped = f.map((item, idx) => ({
            code: String(idx + 1).padStart(2, '0'),
            question: item.question,
            answer: item.answer,
          }))
          setFaqsData(mapped)
        }
      })
      .catch((err) => console.warn('HomePage faqs fetch fallback:', err))

    return () => { isMounted = false }
  }, [])

  return (
    // FIX: overflow-x-clip instead of overflow-x-hidden. "hidden" turns this div
    // into a scroll container, which silently breaks the sticky FAQ column.
    // select-none removed so visitors can copy the email / text.
    <div className="w-full flex flex-col items-center overflow-x-clip">

      {/* ── 1. HERO & STATS ───────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[100svh] flex flex-col justify-between pt-24 md:pt-28 pb-0">
        {/* Centered Hero Content */}
        <motion.div
          className={`${CONTAINER} my-auto flex flex-col items-center justify-center text-center gap-6 py-8`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          {/* Headline */}
          <motion.h1
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white leading-[1.08] text-balance"
            variants={itemVariants}
          >
            Where curiosity{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#ff6b1a]">
              meets code.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-base sm:text-xl text-white/70 max-w-2xl leading-relaxed text-balance"
            variants={itemVariants}
          >
            A student-driven technology community building real products, running hackathons, and shipping open-source software every semester.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 w-full sm:w-auto"
            variants={itemVariants}
          >
            <SpecularButton
              size="lg"
              radius={28}
              tint="#ff6b1a"
              tintOpacity={0.9}
              textColor="#ffffff"
              lineColor="#ffaa44"
              baseColor="#ff6b1a"
              intensity={1.3}
              shineSize={14}
              shineFade={35}
              thickness={1.5}
              followMouse
              proximity={300}
              onClick={() => {
                window.location.hash = '#/auth'
              }}
              className="w-full sm:w-auto shadow-[0_0_35px_rgba(255,107,26,0.4)] font-bold text-base sm:text-lg justify-center py-3.5 sm:py-4 px-8 sm:px-10 cursor-pointer"
            >
              <span>Join the Club</span>
              <ArrowRight className="h-5 w-5" />
            </SpecularButton>

            <SpecularButton
              size="lg"
              radius={28}
              tint="#12101c"
              tintOpacity={0.85}
              blur={12}
              textColor="#f0ece4"
              lineColor="#ff6b1a"
              baseColor="#2b273b"
              intensity={1.1}
              shineSize={12}
              shineFade={40}
              thickness={1.2}
              followMouse
              proximity={300}
              onClick={() => {
                window.location.hash = '#/projects'
              }}
              className="w-full sm:w-auto border border-[#ff6b1a]/25 font-semibold text-base sm:text-lg justify-center py-3.5 sm:py-4 px-7 sm:px-9 cursor-pointer"
            >
              <span>See Projects</span>
            </SpecularButton>
          </motion.div>
        </motion.div>

        {/* Stats strip: 80-96px below CTAs, 4 equal columns, top border, py-10 */}
        <div className="w-full mt-20 md:mt-24">
          <div className={CONTAINER}>
            <div className="border-t border-white/10 py-10">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {[
                  { value: statsData.active_members, label: 'Active Members', detail: 'Developers, designers & researchers' },
                  { value: statsData.workshops_run, label: 'Workshops Run', detail: 'Hands-on technical bootcamps' },
                  { value: statsData.projects_shipped, label: 'Projects Shipped', detail: 'Production apps & open-source repos' },
                  { value: statsData.events_organized, label: 'Events Organized', detail: 'Workshops, hackathons & tech talks' },
                ].map((s, i) => (
                  <motion.div key={i} className="flex flex-col text-left" {...sectionAnim(i)}>
                    <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-[#ff6b1a]">
                      {s.value}
                    </span>
                    <span className="mt-2 text-base sm:text-lg font-bold text-white tracking-wide">{s.label}</span>
                    <span className="mt-1 text-sm text-white/70 leading-relaxed">{s.detail}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. WHAT WE BUILD ───────────────────────────────────────────────── */}
      <section className="w-full py-16 md:py-24 border-t border-white/10">
        <div className={CONTAINER}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="font-mono text-xs sm:text-[13px] text-[#ff6b1a] uppercase tracking-widest font-semibold block mb-2">
                01 // DISCIPLINES
              </span>
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight">What We Build</h2>
            </div>
            <p className="text-[15px] sm:text-base text-white/70 max-w-md leading-relaxed">
              Four technical disciplines where members ship real software, conduct peer code reviews, and master production stacks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TRACKS.map((track, idx) => {
              const Icon = track.icon
              return (
                <motion.div key={track.num} className={CARD_CLASS} {...cardAnim(idx)}>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-xs text-[#ff6b1a] tracking-widest font-semibold uppercase">
                      TRACK {track.num}
                    </span>
                    <Icon className="h-5 w-5 text-zinc-400 group-hover:text-[#ffaa44] transition-colors" />
                  </div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-[#ffaa44] transition-colors mb-3">
                    {track.title}
                  </h3>
                  <p className="text-[15px] sm:text-base text-white/70 leading-relaxed mb-6">
                    {track.description}
                  </p>
                  <div className="mt-auto pt-4 flex flex-wrap gap-2">
                    {track.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="inline-flex items-center text-xs font-mono text-white/70 bg-white/[0.05] border border-white/15 px-3 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 3. HOW SDC WORKS ───────────────────────────────────────────────── */}
      <section className="w-full py-16 md:py-24 border-t border-white/10">
        <div className={CONTAINER}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="font-mono text-xs sm:text-[13px] text-[#ff6b1a] uppercase tracking-widest font-semibold block mb-2">
                02 // THE JOURNEY
              </span>
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight">How SDC Works</h2>
            </div>
            <p className="text-[15px] sm:text-base text-white/70 max-w-md leading-relaxed">
              A four-step engineering lifecycle that turns active curiosity into production-ready software skills.
            </p>
          </div>

          <div className="relative">
            {/* Dashed connector between the 4 steps (visible in the gaps; cards are opaque) */}
            <div className="hidden lg:block absolute top-12 left-16 right-16 border-t border-dashed border-[#ff6b1a]/30 pointer-events-none z-0" />

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((step, idx) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.num}
                    className={CARD_CLASS.replace('bg-white/[0.03]', 'bg-[#090812]')}
                    {...cardAnim(idx)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-3xl font-black text-[#ff6b1a]">{step.num}</span>
                      <Icon className="h-5 w-5 text-zinc-400 group-hover:text-[#ffaa44] transition-colors" />
                    </div>
                    <div className="font-mono text-xs text-[#ffaa44] uppercase tracking-wider mb-1 font-semibold">
                      {step.subtitle}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-[#ffaa44] transition-colors mb-3">
                      {step.title}
                    </h3>
                    <p className="text-[15px] text-white/70 leading-relaxed mt-auto">
                      {step.description}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. WHY JOIN ────────────────────────────────────────────────────── */}
      <section className="w-full py-16 md:py-24 border-t border-white/10">
        <div className={CONTAINER}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="font-mono text-xs sm:text-[13px] text-[#ff6b1a] uppercase tracking-widest font-semibold block mb-2">
                03 // ADVANTAGE
              </span>
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight">Why Join SDC?</h2>
            </div>
            <p className="text-[15px] sm:text-base text-white/70 max-w-md leading-relaxed">
              Everything you need to accelerate your engineering career, build production tech, and join an elite student network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BENEFITS.map((b, idx) => {
              const Icon = b.icon
              return (
                <motion.div key={b.num} className={CARD_CLASS} {...cardAnim(idx)}>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-xs text-[#ff6b1a] tracking-widest font-semibold uppercase">
                      ADVANTAGE {b.num}
                    </span>
                    <Icon className="h-5 w-5 text-zinc-400 group-hover:text-[#ffaa44] transition-colors" />
                  </div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-[#ffaa44] transition-colors mb-3">
                    {b.title}
                  </h3>
                  <p className="text-[15px] sm:text-base text-white/70 leading-relaxed mt-auto">
                    {b.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 5. TECH STACK MARQUEE ──────────────────────────────────────────── */}
      <section className="w-full py-16 md:py-24 border-t border-white/10 overflow-hidden">
        <div className={CONTAINER}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="font-mono text-xs sm:text-[13px] text-[#ff6b1a] uppercase tracking-widest font-semibold block mb-2">
                04 // ECOSYSTEM
              </span>
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight">
                Industry Tech We Ship With
              </h2>
            </div>
            <p className="text-[15px] sm:text-base text-white/70 max-w-md leading-relaxed">
              Battle-tested frameworks, distributed databases, and machine learning runtimes our members build with.
            </p>
          </div>
        </div>

        {/* Full-bleed track with edge fade. Needs the marquee CSS (see index.css) */}
        <div
          className="marquee-track w-full flex flex-col gap-4 overflow-hidden select-none py-2"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
          }}
        >
          {/* Row 1: scrolls left */}
          <div className="overflow-hidden w-full">
            {/* FIX: w-max so translateX(-50%) is relative to the full track width.
                Items use mr-4 instead of flex gap so the loop point is pixel-exact. */}
            <div className="animate-marquee-left flex items-center w-max whitespace-nowrap">
              {MARQUEE_1.map((item, idx) => {
                const Icon = item.icon
                return (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-3 px-5 py-3 mr-4 rounded-xl border border-white/10 hover:border-[#ff6b1a]/50 bg-white/[0.03] transition-colors cursor-default group"
                  >
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ color: item.color }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-white group-hover:text-[#ffaa44] transition-colors">
                        {item.name}
                      </span>
                      <span className="text-xs font-mono text-white/60">{item.desc}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Row 2: scrolls right (reverse) */}
          <div className="overflow-hidden w-full">
            <div className="animate-marquee-right flex items-center w-max whitespace-nowrap">
              {MARQUEE_2.map((item, idx) => {
                const Icon = item.icon
                return (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-3 px-5 py-3 mr-4 rounded-xl border border-white/10 hover:border-[#ff6b1a]/50 bg-white/[0.03] transition-colors cursor-default group"
                  >
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ color: item.color }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-white group-hover:text-[#ffaa44] transition-colors">
                        {item.name}
                      </span>
                      <span className="text-xs font-mono text-white/60">{item.desc}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. MEMBER VOICES ───────────────────────────────────────────────── */}
      <section className="w-full py-16 md:py-24 border-t border-white/10">
        <div className={CONTAINER}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="font-mono text-xs sm:text-[13px] text-[#ff6b1a] uppercase tracking-widest font-semibold block mb-2">
                05 // COMMUNITY
              </span>
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight">Member Voices</h2>
            </div>
            <p className="text-[15px] sm:text-base text-white/70 max-w-md leading-relaxed">
              Hear directly from active builders, track leads, and hackathon competitors building inside SDC.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {voicesData.map((v, idx) => (
              <motion.div key={idx} className={CARD_CLASS} {...cardAnim(idx)}>
                <div>
                  <Quote className="h-6 w-6 text-[#ff6b1a] mb-4 opacity-80" />
                  <p className="text-[15px] sm:text-base text-white/70 leading-relaxed italic mb-6">
                    "{v.quote}"
                  </p>
                </div>
                <div className="mt-auto pt-4 border-t border-white/10 flex items-center gap-3.5">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#ff6b1a] to-[#ffaa44] flex items-center justify-center text-white font-bold text-xs shadow-[0_0_15px_rgba(255,107,26,0.3)] shrink-0">
                    {v.initials}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-white group-hover:text-[#ffaa44] transition-colors">
                      {v.name}
                    </span>
                    <span className="text-xs text-white/60 font-mono">{v.year}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. FAQ ─────────────────────────────────────────────────────────── */}
      <section className="w-full py-16 md:py-24 border-t border-white/10">
        <div className={CONTAINER}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-start">
            {/* Sticky left column on desktop */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 flex flex-col justify-between self-start gap-8">
              <div>
                <span className="font-mono text-xs sm:text-[13px] text-[#ff6b1a] uppercase tracking-widest font-semibold block mb-2">
                  06 // INTELLIGENCE
                </span>
                <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-[15px] sm:text-base text-white/70 leading-relaxed mb-6">
                  Everything you need to know about joining SDC, squad expectations, and kickstarting your engineering journey.
                </p>
              </div>

              <div className="pt-6 border-t border-white/10">
                <h4 className="text-base font-bold text-white mb-1">Have another question?</h4>
                <p className="text-sm text-white/70 mb-3">
                  Talk directly with track leads on our official Discord server.
                </p>
                <a
                  href="https://discord.gg/dWjnVjdCEA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-mono text-[#ffaa44] hover:text-white transition-colors"
                >
                  <DiscordIcon className="h-4 w-4 shrink-0" />
                  <span>Join Discord Server</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Accordion: one open at a time */}
            <div className="lg:col-span-7 divide-y divide-white/10 border-y border-white/10">
              {faqsData.map((faq, idx) => {
                const isOpen = faqOpen === idx
                return (
                  <div key={idx} className="py-5">
                    <button
                      onClick={() => setFaqOpen(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between text-left cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b1a]/60 rounded-md"
                    >
                      <div className="flex items-center gap-4 pr-4">
                        <span className="font-mono text-xs text-[#ff6b1a] font-bold">{faq.code}</span>
                        <span className="text-lg sm:text-xl font-bold text-white group-hover:text-[#ffaa44] transition-colors">
                          {faq.question}
                        </span>
                      </div>
                      {/* FIX: colour is a ternary, so text-white/60 and text-[#ff6b1a] no longer fight */}
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#ff6b1a]' : 'text-white/60'
                          }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <p className="pt-3 pl-8 text-[15px] sm:text-base text-white/70 leading-relaxed">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="relative w-full py-24 md:py-28 border-t border-white/10 text-center flex flex-col items-center overflow-hidden">
        {/* Soft radial orange glow behind headline */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#ff6b1a]/15 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className={`${CONTAINER} flex flex-col items-center`}>
          <motion.div
            className="flex flex-col items-center w-full"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >


            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold text-white tracking-tight leading-[1.08] max-w-2xl text-balance">
              Ready to stop watching and{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#ff6b1a]">
                start building?
              </span>
            </h2>

            <p className="mt-5 text-[15px] sm:text-lg text-white/70 max-w-xl leading-relaxed mb-8">
              Join the student developer collective at Parul University, Goa. Form squads, ship production software, and build your technical reputation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <SpecularButton
                size="lg"
                radius={28}
                tint="#ff6b1a"
                tintOpacity={0.9}
                textColor="#ffffff"
                lineColor="#ffaa44"
                baseColor="#ff6b1a"
                intensity={1.3}
                shineSize={14}
                shineFade={35}
                thickness={1.5}
                followMouse
                proximity={300}
                onClick={() => {
                  window.location.hash = '#/auth'
                }}
                className="w-full sm:w-auto shadow-[0_0_35px_rgba(255,107,26,0.4)] font-bold text-base sm:text-lg justify-center py-3.5 sm:py-4 px-8 sm:px-10 cursor-pointer"
              >
                <span>Join the Club</span>
                <ArrowRight className="h-5 w-5" />
              </SpecularButton>

              <SpecularButton
                size="lg"
                radius={28}
                tint="#12101c"
                tintOpacity={0.85}
                blur={12}
                textColor="#f0ece4"
                lineColor="#ff6b1a"
                baseColor="#2b273b"
                intensity={1.1}
                shineSize={12}
                shineFade={40}
                thickness={1.2}
                followMouse
                proximity={300}
                onClick={() => {
                  window.location.hash = '#/projects'
                }}
                className="w-full sm:w-auto border border-white/10 font-semibold text-base sm:text-lg justify-center py-3.5 sm:py-4 px-7 sm:px-9 cursor-pointer"
              >
                <span>Explore Projects</span>
              </SpecularButton>
            </div>


          </motion.div>
        </div>
      </section>

      {/* ── 9. FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="w-full border-t border-white/10 py-16 text-left">
        <div className={CONTAINER}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-white/10 items-start">
            {/* Column 1: Brand */}
            <div className="md:col-span-6 flex flex-col items-start gap-4">
              <a href="#/home" className="flex items-center gap-2.5 text-white">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#ff6b1a] to-[#ffaa44] flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,107,26,0.4)] shrink-0">
                  <Terminal className="h-5 w-5" />
                </div>
                <span className="text-xl font-extrabold tracking-tight font-mono">
                  SDC<span className="text-[#ff6b1a]">.</span>
                </span>
              </a>
              <p className="text-[15px] text-white/70 max-w-sm leading-relaxed">
                Student Developer Club is the flagship student-run technical community at Parul University, Goa. We build production systems, train neural models, and ship open-source software.
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                <a
                  href="http://goa.paruluniversity.ac.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0c0a18] border border-[#231e38] text-xs text-[#d1cdde] hover:border-[#ff6b1a]/50 hover:text-white transition-all cursor-pointer w-fit"
                >
                  <MapPin className="h-3.5 w-3.5 text-[#ff6b1a]" />
                  <span className="font-semibold text-white">Parul University, Goa Campus</span>
                  <span className="text-[10px] text-white/40 ml-1">↗</span>
                </a>
                <span className="text-[10px] font-mono text-white/50 pl-1">
                  COORDINATES: 15.2993° N, 74.1240° E
                </span>
              </div>
            </div>

            {/* Column 2: Platform */}
            <div className="md:col-span-3 flex flex-col gap-3">
              <h4 className="text-xs font-mono tracking-wider text-[#ff944d] uppercase font-bold">Platform</h4>
              <ul className="space-y-2.5 text-sm">
                {PLATFORM_LINKS.map((link, idx) => (
                  <li key={idx}>
                    <a href={link.href} className="text-white/70 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Connect */}
            <div className="md:col-span-3 flex flex-col gap-4">
              <h4 className="text-xs font-mono tracking-wider text-[#ff944d] uppercase font-bold">Connect</h4>
              <a
                href="mailto:sdc@paruluniversity.ac.in"
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-white/70 hover:text-white transition-colors break-all"
              >
                <Mail className="h-4 w-4 text-[#ff6b1a] shrink-0" />
                <span>SDC@paruluniversity.ac.in</span>
              </a>
              <div className="flex items-center gap-2">
                {[
                  {
                    label: 'Discord',
                    href: 'https://discord.gg/dWjnVjdCEA',
                    svg: (
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    ),
                  },
                  {
                    label: 'GitHub',
                    href: 'https://github.com/tudentdevclub',
                    svg: (
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    ),
                  },
                  {
                    label: 'LinkedIn',
                    href: 'https://linkedin.com',
                    svg: (
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
                    ),
                  },

                  {
                    label: 'Instagram',
                    href: 'https://www.instagram.com/buildwith_sdc',
                    svg: (
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    ),
                  },
                  {
                    label: 'Discord',
                    href: 'https://discord.gg/dWjnVjdCEA',
                    svg: (
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    ),
                  },
                ].map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="h-8 w-8 rounded-lg bg-[#0c0a18] border border-[#231e38] flex items-center justify-center text-white/70 hover:text-white hover:border-[#ff6b1a]/50 hover:bg-[#ff6b1a]/10 transition-all"
                  >
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      {s.svg}
                    </svg>
                  </a>
                ))}
              </div>

            </div>
          </div>

          {/* Bottom row */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <p>© {new Date().getFullYear()} Student Developer Club (SDC), Parul University, Goa. All rights reserved.</p>
            <p className="font-mono flex items-center gap-1.5 text-white/60">
              <span>Engineered by SDC Technical Collective</span>
              <span className="text-[#ff6b1a]">⚡</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}