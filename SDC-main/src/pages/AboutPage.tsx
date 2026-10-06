import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Code2, Globe, Users, Rocket } from 'lucide-react'
import { api } from '@/lib/api'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const VALUES = [
  {
    num: '01',
    value: 'Build real things',
    oneLiner: 'We learn by shipping projects, not just finishing tutorials.',
    icon: Code2,
  },
  {
    num: '02',
    value: 'Learn in public',
    oneLiner: "We share what we're building, including the mistakes.",
    icon: Globe,
  },
  {
    num: '03',
    value: 'Everyone is welcome',
    oneLiner: "Any department, any skill level. If you're curious, you belong here.",
    icon: Users,
  },
  {
    num: '04',
    value: 'Help each other grow',
    oneLiner: "Seniors mentor, juniors contribute, and everyone reviews each other's work.",
    icon: Rocket,
  },
]

const DEFAULT_STUDENT_COORDINATORS = [
  { name: 'Tanishq Naik', role: '', initials: 'TN' },
  { name: 'Shriyansh Narvekar', role: '', initials: 'SN' },
  { name: 'Yash Mukade', role: '', initials: 'YM' },
  { name: 'Priyal Nagvekar', role: '', initials: 'PN' },
  { name: 'Shravan Bhise', role: '', initials: 'SB' },
  { name: 'Raziya Sultana', role: '', initials: 'RS' },
  { name: 'Bhramay', role: '', initials: 'BS' },
  { name: 'Abhimanyu Dixit', role: '', initials: 'AD' },
  { name: 'Aaryan Kumar Tiwari', role: '', initials: 'AT' },
]

const DEFAULT_FACULTY = [
  {
    name: 'Dr. Abhijeet Gaonkar',
    role: 'Faculty Coordinator',
    dept: 'Faculty of Engineering & Technology',
    initials: 'AG',
  }

]

function randomizeCoordinators(list: any[]): any[] {
  if (!list || list.length === 0) return []

  // Separate Tanishq and others
  const tanishq = list.find((m) => m.name.toLowerCase().includes('tanishq'))
  const others = list.filter((m) => !m.name.toLowerCase().includes('tanishq'))

  // Fisher-Yates shuffle for other members
  const shuffledOthers = [...others]
  for (let i = shuffledOthers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOthers[i], shuffledOthers[j]] = [shuffledOthers[j], shuffledOthers[i]]
  }

  if (!tanishq) {
    return shuffledOthers
  }

  // Tanishq must always be on the first row (indices 0..3) at a random column
  const firstRowCols = Math.min(4, list.length)
  const tanishqCol = Math.floor(Math.random() * firstRowCols)

  const result: any[] = []
  let otherIdx = 0

  for (let i = 0; i < list.length; i++) {
    if (i === tanishqCol) {
      result.push(tanishq)
    } else {
      if (otherIdx < shuffledOthers.length) {
        result.push(shuffledOthers[otherIdx++])
      }
    }
  }

  return result
}

export function AboutPage() {
  const [teamMembers, setTeamMembers] = useState<any[]>(() => randomizeCoordinators(DEFAULT_STUDENT_COORDINATORS))
  const [professors, setProfessors] = useState<any[]>(DEFAULT_FACULTY)

  useEffect(() => {
    let isMounted = true
    api.members.list()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const students = data
            .filter((m) => {
              if (m.member_type !== 'student') return false
              const role = (m.role || '').toLowerCase().trim()
              // General members should not be displayed under Student Coordinators
              if (role === 'active member' || role === 'member' || role === 'general member') {
                return false
              }
              const lowerName = (m.name || '').toLowerCase().trim()
              if (lowerName === 'functionalloop' || lowerName === 'yash demo') {
                return false
              }
              return true
            })
            .map((m) => ({ name: m.name, role: m.role || '', initials: m.initials || m.name.slice(0, 2).toUpperCase() }))

          const faculty = data
            .filter((m) => m.member_type === 'faculty' && !m.name.toLowerCase().includes('tbd'))
            .map((m) => ({
              name: m.name,
              role: m.role || 'Faculty Coordinator',
              dept: m.dept || 'Faculty of Engineering & Technology',
              initials: m.initials || m.name.slice(0, 2).toUpperCase(),
            }))

          if (students.length > 0) {
            setTeamMembers((prev) => {
              // Preserve randomized layout for current session while updating any updated server fields
              const studentMap = new Map(students.map((s) => [s.name.toLowerCase().trim(), s]))
              const updated = prev.map((m) => {
                const serverData = studentMap.get(m.name.toLowerCase().trim())
                return serverData ? { ...m, ...serverData } : m
              })

              const existingNames = new Set(prev.map((m) => m.name.toLowerCase().trim()))
              const brandNew = students.filter((s) => !existingNames.has(s.name.toLowerCase().trim()))
              if (brandNew.length > 0) {
                return randomizeCoordinators([...updated, ...brandNew])
              }
              return updated
            })
          }
          if (faculty.length > 0) setProfessors(faculty)
        }
      })
      .catch((err) => {
        console.warn('Using fallback members list, server fetch error:', err)
      })

    return () => { isMounted = false }
  }, [])

  return (
    <motion.div
      className="w-full max-w-6xl flex flex-col items-center justify-center text-center mx-auto px-4"
      style={{ paddingTop: '20px', paddingBottom: '80px' }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* ── 1. WHO WE ARE ────────────────────────────────────────── */}
      <motion.div
        className="w-full max-w-4xl mx-auto text-center mb-16 sm:mb-20 pt-4"
        variants={itemVariants}
      >
        <h1
          className="section-title font-bank-gothic tracking-tight uppercase text-white mb-6"
          style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}
        >
          A club, built by students
        </h1>
        <p className="text-base sm:text-xl text-zinc-300 leading-relaxed max-w-3xl mx-auto font-light">
          The Student Developer Club (SDC) is a student-run technical community at{' '}
          <a
            href="http://goa.paruluniversity.ac.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline decoration-[#ff6b1a]/60 hover:decoration-[#ff6b1a] transition-all"
          >
            Parul University, Goa
          </a>
          . We started with a simple idea: students learn faster when they build real things together.
        </p>
      </motion.div>

      {/* Blended divider */}
      <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/15 to-transparent mb-16 sm:mb-20 pointer-events-none" />

      {/* ── 2. FACULTY & STUDENT COORDINATORS (BELOW WHO WE ARE) ─── */}
      <motion.div className="section-header max-w-2xl mx-auto mb-6" variants={itemVariants}>
        <h2 className="section-title font-bank-gothic tracking-tight uppercase" style={{ fontSize: 'clamp(30px, 4.2vw, 44px)' }}>
          Faculty Coordinator{professors.length > 1 ? 's' : ''}
        </h2>
        <p className="section-desc text-sm sm:text-base text-[#9e9aa8] max-w-lg mx-auto leading-relaxed mt-2">
          {professors.length > 1
            ? 'Academic leaders and mentors guiding the Student Developer Club.'
            : 'Academic leader and mentor guiding the Student Developer Club.'}
        </p>
      </motion.div>

      {/* Dedicated centered space for Faculty Coordinator */}
      <motion.div
        className="w-full flex justify-center items-center mb-16 sm:mb-20"
        variants={itemVariants}
      >
        <div className="w-full flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
          {professors.map((prof, i) => (
            <motion.div
              key={i}
              className="team-card w-full max-w-[280px] flex flex-col items-center justify-center text-center rounded-2xl bg-[#0c0b15]/90 border border-white/15 hover:border-white/35 backdrop-blur-xl p-6 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
              data-mouse-x="50"
              data-mouse-y="50"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 100
                const y = ((e.clientY - rect.top) / rect.height) * 100
                e.currentTarget.dataset.mouseX = `${x}`
                e.currentTarget.dataset.mouseY = `${y}`
              }}
              whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(255,255,255,0.08)' }}
              transition={{ duration: 0.25 }}
            >
              <div className="team-avatar mb-4 flex items-center justify-center rounded-full bg-[#181528] border border-white/20 text-white font-black font-bank-gothic text-xl shadow-md">
                {prof.initials}
              </div>
              <div className="team-name text-lg font-bold text-white font-bank-gothic mb-1 tracking-wide">
                {prof.name}
              </div>
              <div className="team-role text-xs text-zinc-300 font-mono tracking-wider uppercase font-semibold mb-1">
                {prof.role}
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                {prof.dept}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Blended divider */}
      <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/15 to-transparent mb-16 sm:mb-20 pointer-events-none" />

      {/* Student Coordinators */}
      <motion.div
        className="section-header max-w-2xl mx-auto mb-8"
        variants={itemVariants}
      >
        <h2 className="section-title font-bank-gothic tracking-tight uppercase" style={{ fontSize: 'clamp(30px, 4.2vw, 44px)' }}>
          Student Coordinators
        </h2>
        <p className="section-desc text-sm sm:text-base text-[#9e9aa8] max-w-lg mx-auto leading-relaxed mt-2">
          Nine student leaders driving tech initiatives, events, and open-source projects.
        </p>
      </motion.div>

      {/* 4 In A Row Grid for Student Coordinators */}
      <motion.div
        className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch mb-20 sm:mb-24"
        variants={itemVariants}
      >
        {teamMembers.map((member, i) => {
          // Center the last row if there is a single member or 2 members
          const isSingleLast = i === teamMembers.length - 1 && teamMembers.length % 4 === 1
          const isTwoLastFirst = teamMembers.length % 4 === 2 && i === teamMembers.length - 2
          const isTwoLastSecond = teamMembers.length % 4 === 2 && i === teamMembers.length - 1

          const centerClass = isSingleLast
            ? 'sm:col-span-2 lg:col-span-4 justify-self-center w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]'
            : isTwoLastFirst
              ? 'lg:col-start-2'
              : isTwoLastSecond
                ? 'lg:col-start-3'
                : ''

          return (
            <motion.div
              key={i}
              className={`team-card flex flex-col items-center justify-center text-center rounded-2xl bg-[#0c0b15]/90 border border-white/10 hover:border-white/30 backdrop-blur-xl p-6 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.6)] ${centerClass}`}
              data-mouse-x="50"
              data-mouse-y="50"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 100
                const y = ((e.clientY - rect.top) / rect.height) * 100
                e.currentTarget.dataset.mouseX = `${x}`
                e.currentTarget.dataset.mouseY = `${y}`
              }}
              whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(255,255,255,0.06)' }}
              transition={{ duration: 0.25 }}
            >
              <div className="team-avatar mb-4 flex items-center justify-center rounded-full bg-[#181528] border border-white/20 text-white font-black font-bank-gothic text-xl shadow-md">
                {member.initials}
              </div>
              <div className="team-name text-lg font-bold text-white font-bank-gothic mb-1 tracking-wide">
                {member.name}
              </div>
              <div className="team-role text-xs text-zinc-400 font-mono tracking-wider uppercase font-semibold">
                {member.role}
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Blended divider */}
      <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-[#ff6b1a]/25 to-transparent mb-16 sm:mb-20 pointer-events-none" />

      {/* ── 3. WHY SDC EXISTS ────────────────────────────────────── */}
      <motion.div
        className="w-full max-w-4xl mx-auto mb-20 sm:mb-24"
        variants={itemVariants}
      >
        <div className="relative rounded-2xl bg-[#0c0b15]/90 border border-white/10 p-8 sm:p-12 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] text-left overflow-hidden group hover:border-[#ff6b1a]/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff6b1a]/5 rounded-full blur-3xl pointer-events-none -z-0" />
          <div className="relative z-10">
            <h2
              className="section-title font-bank-gothic tracking-tight uppercase text-white mb-6"
              style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
            >
              Why SDC exists
            </h2>
            <div className="space-y-4 text-base sm:text-lg text-zinc-300 leading-relaxed">
              <p>
                Classrooms teach the theory. But building software means working in a team, using Git, reviewing each other's code, and shipping something people can actually use. Most students don't get a place to practise that until after graduation.
              </p>
              <p className="text-zinc-400">
                We started SDC to be that place: a club where a first-year can pair with a senior, where a half-finished idea can become a working project, and where it's fine to get things wrong along the way.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Blended divider */}
      <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/15 to-transparent mb-16 sm:mb-20 pointer-events-none" />

      {/* ── 4. WHAT WE STAND FOR ─────────────────────────────────── */}
      <motion.div
        className="w-full max-w-6xl mx-auto mb-20 sm:mb-24"
        variants={itemVariants}
      >
        <div className="section-header max-w-2xl mx-auto mb-10 text-center">
          <h2
            className="section-title font-bank-gothic tracking-tight uppercase text-white"
            style={{ fontSize: 'clamp(30px, 4.2vw, 44px)' }}
          >
            Our values
          </h2>
          <p className="section-desc text-sm sm:text-base text-[#9e9aa8] max-w-lg mx-auto leading-relaxed mt-2">
            The core principles that guide how we learn, collaborate, and ship software together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {VALUES.map((val) => {
            const Icon = val.icon
            return (
              <motion.div
                key={val.num}
                className="team-card flex flex-col justify-between text-left rounded-2xl bg-[#0c0b15]/90 border border-white/10 hover:border-[#ff6b1a]/40 backdrop-blur-xl p-7 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.6)] group hover:-translate-y-1"
                whileHover={{ y: -4, boxShadow: '0 12px 35px rgba(255,107,26,0.12)' }}
                transition={{ duration: 0.25 }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl sm:text-2xl font-bold font-bank-gothic text-white group-hover:text-[#ffaa44] transition-colors tracking-wide uppercase">
                      {val.value}
                    </h3>
                    <Icon className="h-5 w-5 text-zinc-400 group-hover:text-[#ffaa44] transition-colors shrink-0 ml-3" />
                  </div>
                  <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                    {val.oneLiner}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Blended divider */}
      <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-[#ff6b1a]/25 to-transparent mb-16 sm:mb-20 pointer-events-none" />

      {/* ── 5. MISSION SECTION ───────────────────────────────────── */}
      <motion.div className="section-header flex flex-col items-center" variants={itemVariants}>
        <div className="flex items-center justify-center mb-4">
          <motion.img
            src="/assets/sdc-logo.png"
            alt="SDC Logo"
            className="h-16 w-16 object-contain cursor-pointer"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <h2 className="section-title font-bank-gothic tracking-tight uppercase" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
          Building the next generation<br />of builders.
        </h2>
        <p className="section-desc text-sm sm:text-base text-[#9e9aa8] max-w-lg mx-auto leading-relaxed mt-2">
          We believe every student deserves a place to experiment, fail,
          ship, and learn alongside peers who care about the same things.
          SDC is that place.
        </p>
      </motion.div>
    </motion.div>
  )
}
