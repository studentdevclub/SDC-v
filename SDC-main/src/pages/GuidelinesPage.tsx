import { motion } from 'framer-motion'
import { Download } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const SECTIONS: Array<{
  heading: string
  body?: string
  items?: string[]
}> = [
  {
    heading: 'Inclusivity',
    body: 'We welcome everyone, regardless of gender, ethnicity, religion, sexual orientation, disability, background, or experience level. Everyone deserves to feel safe, respected, and included within the SDC community. Discrimination, harassment, or exclusion of any kind will not be tolerated.',
  },
  {
    heading: 'Participation',
    items: [
      'Be respectful, kind, and constructive in all interactions.',
      'Encourage and support fellow members. No question is too basic.',
      'Share knowledge and help others learn whenever possible.',
      'Take responsibility for your actions, own your mistakes, and learn from them.',
      'Give constructive feedback and remain open to different ideas and perspectives.',
      'Respect the time, effort, and contributions of fellow members, volunteers, and event organizers.',
      'Actively participate in club activities, discussions, workshops, and projects when you commit to them.',
    ],
  },
  {
    heading: 'Event Attendance',
    items: [
      'Register in advance when registration is required.',
      'Arrive on time and be prepared to participate.',
      'If you are unable to attend an event after registering, inform the organizers as early as possible.',
      'Follow the instructions provided by event organizers and respect the venue and its rules.',
      'Do not disrupt sessions, workshops, or activities.',
    ],
  },
  {
    heading: 'Conduct',
    items: [
      'Treat every SDC member, organizer, speaker, guest, and collaborator with respect.',
      'Harassment, bullying, hate speech, discrimination, threats, and personal attacks are prohibited.',
      'Do not engage in inappropriate or disruptive behavior during SDC activities, online or offline.',
      "Respect people's privacy and do not share personal information, photographs, or content without appropriate consent.",
      'Use club communication platforms responsibly and professionally.',
      'Report concerns or inappropriate behavior to a core team member as soon as possible.',
    ],
  },
  {
    heading: 'Projects & Collaboration',
    items: [
      'Give appropriate credit to people whose work, ideas, or resources you use.',
      'Do not claim another person\'s work as your own.',
      'Respect intellectual property, licenses, and academic integrity.',
      'Collaborate fairly and communicate clearly when working on team projects.',
      'Keep shared project resources, repositories, and information secure.',
    ],
  },
  {
    heading: 'Violations',
    body: 'Violations of these guidelines may be reviewed by the SDC core team. Depending on the nature and severity of a violation, actions may include a warning, removal from an event or activity, restriction of club participation, or removal from SDC membership. Serious concerns may be escalated to the appropriate university authorities when necessary.',
  },
]

export function GuidelinesPage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="content-page"
    >
      <motion.h1 variants={itemVariants}>Guidelines &amp; Code of Conduct</motion.h1>
      <motion.p variants={itemVariants}>
        SDC is a community built on curiosity, collaboration, respect, and a shared passion for
        technology. These guidelines help us create a welcoming, inclusive, and productive
        environment where every member can learn, contribute, and grow.
      </motion.p>

      {SECTIONS.map((section) => (
        <motion.section key={section.heading} variants={itemVariants} style={{ marginTop: 36 }}>
          <motion.h2 variants={itemVariants}>{section.heading}</motion.h2>

          {section.body && (
            <motion.p variants={itemVariants} style={{ marginTop: 10 }}>
              {section.body}
            </motion.p>
          )}

          {section.items && (
            <motion.ul variants={itemVariants} style={{ marginTop: 10 }}>
              {section.items.map((text, i) => (
                <motion.li key={i} variants={itemVariants}>
                  {text}
                </motion.li>
              ))}
            </motion.ul>
          )}
        </motion.section>
      ))}

      <motion.section variants={itemVariants} style={{ marginTop: 36 }}>
        <motion.h2 variants={itemVariants}>Questions or Concerns?</motion.h2>
        <motion.p variants={itemVariants} style={{ marginTop: 10 }}>
          If you have questions, need support, or would like to report a concern, please reach out
          to any SDC core team member or contact us through the official SDC communication channels.
        </motion.p>
      </motion.section>

      {/* Download button */}
      <motion.div variants={itemVariants} style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
        <motion.a
          href="/assets/SDC_Guidelines_Code_of_Conduct.docx"
          download="SDC_Guidelines_Code_of_Conduct.docx"
          whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(255,107,26,0.35)' }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '11px 22px',
            borderRadius: 12,
            border: '1px solid rgba(255,107,26,0.45)',
            background: 'rgba(255,107,26,0.08)',
            color: '#ff6b1a',
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: '0.03em',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <Download size={16} />
          Download Guidelines &amp; Code of Conduct (.docx)
        </motion.a>
      </motion.div>
    </motion.div>
  )
}
