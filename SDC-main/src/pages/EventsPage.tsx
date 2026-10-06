import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [events, setEvents] = useState<any[]>([])
  const [registeredEvents, setRegisteredEvents] = useState<Record<string, boolean>>({})
  const [activeModalEvent, setActiveModalEvent] = useState<any | null>(null)

  useEffect(() => {
    let isMounted = true
    api.events.list()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((e) => {
            const dateObj = e.event_date ? new Date(e.event_date) : new Date()
            const monthStr = dateObj.toLocaleString('en-US', { month: 'short' })
            const dayNum = dateObj.getDate()
            return {
              id: e.id,
              category: e.category || 'Workshops',
              month: monthStr,
              day: dayNum,
              title: e.title,
              desc: e.description,
              href: e.href || '#/events',
              featured: e.featured,
              location: e.location || 'Campus / Online',
              spotsLeft: e.spots_left ?? 30,
            }
          })
          setEvents(mapped)
        }
      })
      .catch((err) => {
        console.warn('Using fallback initial events, server fetch error:', err)
      })

    return () => { isMounted = false }
  }, [])

  const categories = ['All', 'Workshops', 'Hackathons', 'Talks', 'Social']

  const filteredEvents = events.filter((ev) => {
    const matchesCat = selectedCategory === 'All' || ev.category === selectedCategory
    const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.desc.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  const handleRegister = (ev: any) => {
    setRegisteredEvents((prev) => ({ ...prev, [ev.id]: true }))
    setActiveModalEvent(ev)
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: '100%', maxWidth: 760, margin: '0 auto' }}
    >
      <motion.div className="section-header" variants={itemVariants}>
        <div className="section-tag">Semester Calendar</div>
        <h1 className="section-title">Upcoming Events</h1>
        <p className="section-desc">
          Hands-on workshops, hackathons, and technical deep dives - special discounts for members.
        </p>
      </motion.div>

      {/* Filter and Search Bar */}
      <motion.div
        style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}
        variants={itemVariants}
      >
        <motion.div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: selectedCategory === cat ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
                color: selectedCategory === cat ? '#050508' : 'var(--text-secondary)',
                border: selectedCategory === cat ? '1px solid var(--accent)' : '1px solid var(--card-border)',
                transition: 'all 0.2s',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cat}
            </motion.button>
          ))}
        </motion.div>

        <motion.input
          type="text"
          placeholder="Search events by title or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--card-border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 14,
            outline: 'none',
          }}
          whileHover={{ borderColor: 'var(--border)' }}
          whileTap={{ scale: 0.99 }}
        />
      </motion.div>

      {/* Events List */}
      <motion.div className="events-feed" variants={itemVariants}>
        {filteredEvents.length === 0 ? (
          <motion.div
            style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}
            animate={{ opacity: 1 }}
          >
            No events found matching your filter criteria.
          </motion.div>
        ) : (
          filteredEvents.map((ev, i) => {
            const isRegistered = registeredEvents[ev.id]
            return (
              <motion.div
                key={ev.id}
                className="event-card"
                style={ev.featured ? { borderColor: 'rgba(255,107,26,0.35)', background: 'rgba(255,107,26,0.03)' } : {}}
                whileHover={{ x: 6, borderColor: 'rgba(255,107,26,0.4)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.25 }}
              >
                <div className="event-date">
                  <div className="month">{ev.month}</div>
                  <div className="day">{ev.day}</div>
                </div>

                <div className="event-info">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    {ev.featured && (
                      <motion.span
                        style={{ fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.07 }}
                      >
                        ★ Featured
                      </motion.span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {ev.category} · {ev.location}
                    </span>
                  </div>

                  <motion.h3
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.07 }}
                  >
                    {ev.title}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                  >
                    {ev.desc}
                  </motion.p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  {ev.featured ? (
                    <motion.a
                      className="event-cta"
                      href={ev.href}
                      whileHover={{ scale: 1.05, boxShadow: '0 4px 15px rgba(255,107,26,0.4)' }}
                      whileTap={{ scale: 0.96 }}
                    >
                      View Workshop
                    </motion.a>
                  ) : (
                    <motion.button
                      className="event-cta"
                      onClick={() => handleRegister(ev)}
                      style={{
                        background: isRegistered ? 'rgba(61,220,132,0.15)' : 'var(--accent)',
                        color: isRegistered ? 'var(--green)' : '#050508',
                        border: isRegistered ? '1px solid var(--green)' : 'none',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isRegistered ? '✓ Registered' : 'Register'}
                    </motion.button>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {isRegistered ? 'Spot secured' : `${ev.spotsLeft} spots left`}
                  </span>
                </div>
              </motion.div>
            )
          })
        )}
      </motion.div>

      {/* Confirmation Modal */}
      {activeModalEvent && (
        <motion.div
          onClick={() => setActiveModalEvent(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 32,
              maxWidth: 440,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(61,220,132,0.15)',
                color: 'var(--green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                margin: '0 auto 16px',
                border: '1px solid var(--green)',
              }}
            >
              ✓
            </div>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Registration Confirmed!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
              You are registered for <strong>{activeModalEvent.title}</strong> on {activeModalEvent.month} {activeModalEvent.day}.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, padding: '10px' }}
                onClick={() => setActiveModalEvent(null)}
              >
                Close
              </button>
              <a
                href="#/dashboard"
                className="btn-primary"
                style={{ flex: 1, padding: '10px', textAlign: 'center' }}
                onClick={() => setActiveModalEvent(null)}
              >
                My Dashboard
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* CTA bottom */}
      <motion.div style={{ marginTop: 48, textAlign: 'center' }} variants={itemVariants}>
        <motion.a
          href="#/auth"
          className="btn-primary"
          whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(255,107,26,0.4)' }}
          whileTap={{ scale: 0.97 }}
        >
          Become a Member
        </motion.a>
      </motion.div>
    </motion.div>
  )
}
