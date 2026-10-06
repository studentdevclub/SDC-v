import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api, type Blog } from '@/lib/api'
import { Camera, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react'

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

interface BlogPost {
  id: string
  date: string
  tag: string
  readTime: string
  title: string
  excerpt: string
  author: string
  content: string
  image_url?: string
  photos: string[]
}

const SAMPLE_EVENT_GALLERIES: string[][] = [
  [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&w=1200&q=80',
  ],
]

const INITIAL_FALLBACK_BLOGS: BlogPost[] = [
  {
    id: 'b1',
    date: 'Sep 18, 2026',
    tag: 'Community',
    readTime: '4 min read',
    title: 'Welcome to SDC Fall 2026: The Black Hole Roadmap',
    excerpt: 'A new semester, a new team, and a roadmap that starts with WebGL gravitational lensing and ends with production shipped code.',
    author: 'Aarav Mehta (President)',
    content: `Welcome to another semester of building at the Student Developer Club!

This semester, we're doubling down on production-grade projects, open-source development, and high-impact campus tech. Our core tracks include:

• Graphics & WebGL: Real-time compute shaders and 3D visualizers
• Systems & Cloud: Distributed key-value caches and edge workers
• AI / ML: Neural schedule optimizers and LLM agents

Browse the event photo gallery below from our opening orientation & team kickoff!`,
    image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    photos: SAMPLE_EVENT_GALLERIES[0]
  },
  {
    id: 'b2',
    date: 'Aug 28, 2026',
    tag: 'Hackathon',
    readTime: '5 min read',
    title: 'Summer 2026 Hackathon: Retrospective & Winning Builds',
    excerpt: '48 hours, 12 projects, 3 grand prizes. Highlights of what our summer cohorts created across AI and student utilities.',
    author: 'Priya Nair (Vice President)',
    content: `Over the summer, over 80 students gathered for 48 hours of intense hacking and product design.

Teams worked around the clock building real-time collaboration engines, campus navigation meshes, and automated grading assistants. Congratulations to Team PulseAuth and Team NeuralSchedule for taking home top honors.

Check out the full gallery of hackathon moments and victory celebrations below!`,
    image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    photos: SAMPLE_EVENT_GALLERIES[1]
  },
  {
    id: 'b3',
    date: 'Sep 10, 2026',
    tag: 'Infrastructure',
    readTime: '6 min read',
    title: 'Why We Deploy Student Projects to Cloudflare Pages',
    excerpt: 'A technical breakdown of why we transitioned our workshop curriculum to CF Pages: edge KV, zero cold starts, and generous free tiers.',
    author: 'Dev Patel (Backend Lead)',
    content: `When teaching students how to deploy their first full-stack applications, latency and simplicity matter.

In our recent hands-on DevOps bootcamp, 40+ members deployed serverless workers, configured edge caches, and connected PostgreSQL backends in under 45 minutes.

Here are snapshots from the live workshop session in Computer Lab 4.`,
    image_url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    photos: SAMPLE_EVENT_GALLERIES[2]
  }
]

export function BlogPage() {
  const [selectedTag, setSelectedTag] = useState('All')
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_FALLBACK_BLOGS)
  const [activePost, setActivePost] = useState<BlogPost | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true
    api.blogs.list()
      .then((data: Blog[]) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped: BlogPost[] = data.map((b, idx) => {
            const dateStr = b.published_at
              ? new Date(b.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recently'
            
            // Build photos list (ensuring default sample images if none present)
            let photosList = Array.isArray(b.photos) && b.photos.length > 0 ? [...b.photos] : []
            if (b.image_url && !photosList.includes(b.image_url)) {
              photosList = [b.image_url, ...photosList]
            }

            // If still no photos, assign a rich sample event photo album
            if (photosList.length === 0) {
              const sampleSet = SAMPLE_EVENT_GALLERIES[idx % SAMPLE_EVENT_GALLERIES.length]
              photosList = [...sampleSet]
            }

            return {
              id: b.id,
              date: dateStr,
              tag: b.tag || 'Community',
              readTime: b.read_time || '3 min read',
              title: b.title,
              excerpt: b.excerpt,
              author: b.author,
              content: b.content,
              image_url: b.image_url || photosList[0],
              photos: photosList,
            }
          })
          setPosts(mapped)
        }
      })
      .catch((err) => {
        console.warn('Using fallback blog posts with event photos:', err)
      })

    return () => { isMounted = false }
  }, [])

  // Keyboard navigation for lightbox
  const activePhotos = activePost?.photos || []
  
  const handleNextPhoto = useCallback(() => {
    if (lightboxIndex === null || activePhotos.length === 0) return
    setLightboxIndex((prev) => (prev! + 1) % activePhotos.length)
  }, [lightboxIndex, activePhotos.length])

  const handlePrevPhoto = useCallback(() => {
    if (lightboxIndex === null || activePhotos.length === 0) return
    setLightboxIndex((prev) => (prev! - 1 + activePhotos.length) % activePhotos.length)
  }, [lightboxIndex, activePhotos.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return
      if (e.key === 'ArrowRight') handleNextPhoto()
      if (e.key === 'ArrowLeft') handlePrevPhoto()
      if (e.key === 'Escape') setLightboxIndex(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, handleNextPhoto, handlePrevPhoto])

  const tags = ['All', 'Community', 'Infrastructure', 'Hackathon']

  const filteredPosts = posts.filter(
    (p) => selectedTag === 'All' || p.tag.toLowerCase() === selectedTag.toLowerCase()
  )

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: '100%', maxWidth: 840, margin: '0 auto', paddingBottom: 60 }}
    >
      <motion.div className="section-header" variants={itemVariants}>
        <h1 className="section-title">SDC Stories & Event Gallery</h1>
        <p className="section-desc">
          Recaps, tutorials, event snapshots, and project retrospectives from our builders and hackathon cohorts.
        </p>
      </motion.div>

      {/* Filter tags */}
      <motion.div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }} variants={itemVariants}>
        {tags.map((t) => (
          <motion.button
            key={t}
            onClick={() => setSelectedTag(t)}
            style={{
              padding: '6px 18px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: selectedTag === t ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
              color: selectedTag === t ? '#050508' : 'var(--text-secondary)',
              border: selectedTag === t ? '1px solid var(--accent)' : '1px solid var(--card-border)',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t}
          </motion.button>
        ))}
      </motion.div>

      {/* Blog and Event Feed */}
      <motion.div className="events-feed" style={{ maxWidth: '100%' }} variants={itemVariants}>
        {filteredPosts.map((post) => (
          <motion.div
            key={post.id}
            className="event-card"
            style={{
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              gap: 20,
              padding: 16,
              background: 'rgba(15, 15, 20, 0.75)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
            }}
            whileHover={{ y: -3, borderColor: 'rgba(255,107,26,0.4)', boxShadow: '0 12px 35px rgba(0,0,0,0.45)' }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActivePost(post)}
          >
            {/* Event Cover Photo Thumbnail */}
            {post.image_url ? (
              <div
                style={{
                  width: 140,
                  minWidth: 140,
                  borderRadius: 12,
                  overflow: 'hidden',
                  position: 'relative',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <img
                  src={post.image_url}
                  alt={post.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease',
                  }}
                  className="hover:scale-105"
                />
                {post.photos.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 6,
                      left: 6,
                      right: 6,
                      background: 'rgba(0,0,0,0.75)',
                      backdropFilter: 'blur(6px)',
                      borderRadius: 6,
                      padding: '2px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                    }}
                  >
                    <Camera style={{ width: 11, height: 11, color: 'var(--accent)' }} />
                    <span>{post.photos.length} Photo{post.photos.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="event-date" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div className="month">{post.date.split(',')[0]}</div>
                <div className="day" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {post.date.split(', ')[1] || '2026'}
                </div>
              </div>
            )}

            <div className="event-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  {post.tag}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  · {post.date} · {post.readTime}
                </span>
                {post.image_url && post.photos.length > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--accent)',
                      background: 'rgba(255,107,26,0.1)',
                      border: '1px solid rgba(255,107,26,0.25)',
                      padding: '1px 7px',
                      borderRadius: 100,
                      fontFamily: 'monospace',
                    }}
                  >
                    Gallery Available
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: '#fff' }}>{post.title}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {post.excerpt}
              </p>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                By {post.author}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
              <motion.button
                className="event-cta"
                style={{ padding: '8px 16px', fontSize: 12, whiteSpace: 'nowrap', borderRadius: 10 }}
                whileHover={{ scale: 1.05, boxShadow: '0 4px 15px rgba(255,107,26,0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation()
                  setActivePost(post)
                }}
              >
                View Story & Photos
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── ARTICLE & EVENT GALLERY MODAL ───────────────────────── */}
      <AnimatePresence>
        {activePost && (
          <motion.div
            onClick={() => setActivePost(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 16px',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#0d0d12',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 20,
                maxWidth: 720,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 30px 80px rgba(0,0,0,0.95)',
                position: 'relative',
              }}
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            >
              {/* Featured Cover Banner in Modal */}
              {activePost.image_url && (
                <div style={{ position: 'relative', width: '100%', height: 260, overflow: 'hidden' }}>
                  <img
                    src={activePost.image_url}
                    alt={activePost.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(13,13,18,0.9) 100%)',
                    }}
                  />
                  <button
                    onClick={() => setActivePost(null)}
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: 'rgba(0,0,0,0.65)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <X style={{ width: 18, height: 18 }} />
                  </button>
                </div>
              )}

              <div style={{ padding: '24px 32px' }}>
                {!activePost.image_url && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                      {activePost.tag} · {activePost.date}
                    </span>
                    <button
                      onClick={() => setActivePost(null)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                )}

                {activePost.image_url && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                      {activePost.tag}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      · {activePost.date} · {activePost.readTime}
                    </span>
                  </div>
                )}

                <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12, lineHeight: 1.3, color: '#fff' }}>
                  {activePost.title}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      background: 'linear-gradient(135deg, var(--accent) 0%, #ff8c42 100%)',
                      color: '#050508',
                      fontWeight: 800,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {activePost.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{activePost.author}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>SDC Contributor · {activePost.readTime}</div>
                  </div>
                </div>

                {/* Main Content Body */}
                <div style={{ color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: 28 }}>
                  {activePost.content}
                </div>

                {/* ── EVENT PHOTOS GALLERY SECTION ─────────────────────── */}
                {activePost.photos && activePost.photos.length > 0 && (
                  <div
                    style={{
                      marginTop: 24,
                      padding: 20,
                      background: 'rgba(255, 255, 255, 0.025)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Camera style={{ width: 16, height: 16, color: 'var(--accent)' }} />
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Event Photo Gallery ({activePost.photos.length})
                        </h4>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Click any photo to expand</span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: 12,
                      }}
                    >
                      {activePost.photos.map((photo, pIdx) => (
                        <motion.div
                          key={pIdx}
                          style={{
                            position: 'relative',
                            aspectRatio: '16/10',
                            borderRadius: 10,
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.08)',
                            cursor: 'pointer',
                            background: '#000',
                          }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setLightboxIndex(pIdx)}
                        >
                          <img
                            src={photo}
                            alt={`Event moment ${pIdx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.35)',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            className="hover:opacity-100"
                          >
                            <div
                              style={{
                                background: 'rgba(0,0,0,0.7)',
                                backdropFilter: 'blur(4px)',
                                padding: '6px 12px',
                                borderRadius: 20,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              <Maximize2 style={{ width: 12, height: 12, color: 'var(--accent)' }} />
                              <span>View</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Published by SDC Campus Chapter
                  </span>
                  <motion.button
                    className="btn-primary"
                    style={{ padding: '8px 24px', fontSize: 13, borderRadius: 10 }}
                    whileHover={{ scale: 1.05, boxShadow: '0 4px 20px rgba(255,107,26,0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActivePost(null)}
                  >
                    Done Reading
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FULL-SCREEN INTERACTIVE LIGHTBOX ─────────────────────── */}
      <AnimatePresence>
        {lightboxIndex !== null && activePhotos.length > 0 && (
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2000,
              background: 'rgba(3, 3, 6, 0.96)',
              backdropFilter: 'blur(24px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Bar Controls */}
            <div
              style={{
                position: 'absolute',
                top: 20,
                left: 24,
                right: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '4px 12px',
                    borderRadius: 100,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#fff',
                    fontFamily: 'monospace',
                  }}
                >
                  Photo {lightboxIndex + 1} of {activePhotos.length}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {activePost?.title}
                </span>
              </div>

              <button
                onClick={() => setLightboxIndex(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            {/* Main Lightbox Image View with Prev/Next controls */}
            <div
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '75vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {activePhotos.length > 1 && (
                <button
                  onClick={handlePrevPhoto}
                  style={{
                    position: 'absolute',
                    left: -60,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  title="Previous Photo (Left Arrow)"
                >
                  <ChevronLeft style={{ width: 24, height: 24 }} />
                </button>
              )}

              <motion.img
                key={lightboxIndex}
                src={activePhotos[lightboxIndex]}
                alt="Expanded event photo"
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  borderRadius: 12,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              />

              {activePhotos.length > 1 && (
                <button
                  onClick={handleNextPhoto}
                  style={{
                    position: 'absolute',
                    right: -60,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  title="Next Photo (Right Arrow)"
                >
                  <ChevronRight style={{ width: 24, height: 24 }} />
                </button>
              )}
            </div>

            {/* Bottom thumbnail strip */}
            {activePhotos.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 20,
                  display: 'flex',
                  gap: 10,
                  overflowX: 'auto',
                  maxWidth: '85vw',
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {activePhotos.map((thumb, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    style={{
                      width: 56,
                      height: 38,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: lightboxIndex === idx ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.2)',
                      opacity: lightboxIndex === idx ? 1 : 0.5,
                      cursor: 'pointer',
                      padding: 0,
                      background: '#000',
                      transition: 'all 0.2s',
                    }}
                  >
                    <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
