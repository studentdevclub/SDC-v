import express from 'express'
import http from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import projectsRouter from './routes/projects.js'
import eventsRouter from './routes/events.js'
import blogsRouter from './routes/blogs.js'
import membersRouter from './routes/members.js'
import statsRouter from './routes/stats.js'
import voicesRouter from './routes/voices.js'
import faqsRouter from './routes/faqs.js'
import announcementsRouter from './routes/announcements.js'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'

dotenv.config()

const app = express()
app.set('trust proxy', 1)
const PORT = process.env.SERVER_PORT || 4000

app.use(cors({ origin: '*' }))
app.use(express.json())

// ── Routes ──────────────────────────────────────────────
app.use('/api/projects', projectsRouter)
app.use('/api/events', eventsRouter)
app.use('/api/blogs', blogsRouter)
app.use('/api/members', membersRouter)
app.use('/api/stats', statsRouter)
app.use('/api/voices', voicesRouter)
app.use('/api/faqs', faqsRouter)
app.use('/api/announcements', announcementsRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const server = http.createServer({ maxHeaderSize: 131072 }, app)
server.listen(PORT, () => {
  console.log(`🚀 SDC API server running on http://localhost:${PORT}`)
})
