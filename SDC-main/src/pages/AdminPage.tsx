import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  api,
  type Project,
  type SDCEvent,
  type Blog,
  type Member,
  type Stats,
  type Voice,
  type FAQ,
  type Announcement,
  type MemberApplication,
} from '@/lib/api'

// ── Tiny Icon Set ────────────────────────────────────────
const I = {
  plus: (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
  ),
  trash: (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
  ),
  check: (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  ),
  x: (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
  ),
  edit: (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
  ),
  link: (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" /></svg>
  ),
  reload: (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" /></svg>
  ),
  db: (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
  ),
}

// ── Toast ─────────────────────────────────────────────────
type Toast = { id: string; msg: string; type: 'ok' | 'err' | 'info' }
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = (msg: string, type: Toast['type'] = 'ok') => {
    const id = Date.now().toString()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }
  return { toasts, push }
}

// ── Generic table row component ───────────────────────────
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
      <td style={{ padding: '10px 14px', fontSize: 13, color: '#555', whiteSpace: 'nowrap' }}>{label}</td>
      <td style={{ padding: '10px 14px', fontSize: 13, color: '#111', wordBreak: 'break-all' }}>{value}</td>
    </tr>
  )
}

// ── Modal ─────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '28px 32px', width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 20 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Form field helpers ────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  )
}
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 80, resize: 'vertical' }
const selectStyle: React.CSSProperties = { ...inputStyle }

// ── Main AdminPage ─────────────────────────────────────────
export function AdminPage() {
  const { user } = useAuth()
  const { toasts, push } = useToasts()

  type Tab = 'projects' | 'events' | 'blogs' | 'members' | 'stats' | 'voices' | 'faqs' | 'announcements'
  const [tab, setTab] = useState<Tab>('projects')
  const [loading, setLoading] = useState(false)

  // ── Data state ─────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([])
  const [events, setEvents] = useState<SDCEvent[]>([])
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [applications, setApplications] = useState<MemberApplication[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [voices, setVoices] = useState<Voice[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)

  // ── Modal state ────────────────────────────────────────
  const [modal, setModal] = useState<{ type: string; item?: unknown } | null>(null)

  // ── Access Authorization Guard ─────────────────────────
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif', color: '#fff' }}>
        <div style={{ maxWidth: 440, width: '100%', background: '#13111f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '32px 28px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ width: 56, height: 56, margin: '0 auto 16px', borderRadius: 16, background: 'rgba(255,107,26,0.15)', border: '1px solid rgba(255,107,26,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b1a', fontSize: 24 }}>
            🔒
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>Admin Clearance Required</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 24px', lineHeight: 1.6 }}>
            The SDC Admin Panel is restricted to authorized faculty and club administrators. Please sign in with your verified administrator account.
          </p>
          <a
            href="#/auth"
            style={{ display: 'block', width: '100%', padding: '12px 16px', background: '#ff6b1a', color: '#000', fontWeight: 700, fontSize: 13, borderRadius: 10, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em', boxSizing: 'border-box' }}
          >
            Authenticate with Admin Account
          </a>
        </div>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif', color: '#fff' }}>
        <div style={{ maxWidth: 440, width: '100%', background: '#13111f', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 16, padding: '32px 28px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ width: 56, height: 56, margin: '0 auto 16px', borderRadius: 16, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: 24 }}>
            🛡️
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>Access Forbidden</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 12px', lineHeight: 1.6 }}>
            Administrator clearance required. You are currently logged in as a standard member ({user.email}).
          </p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 24px', lineHeight: 1.5 }}>
            To manage club events, members, or projects, please ask a faculty lead to assign administrator privileges to your university account.
          </p>
          <a
            href="#/dashboard"
            style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600, fontSize: 13, borderRadius: 10, textDecoration: 'none', boxSizing: 'border-box' }}
          >
            Return to Member Dashboard
          </a>
        </div>
      </div>
    )
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      // Check health
      const healthRes = await fetch('/api/health')
      setBackendOnline(healthRes.ok)
      if (!healthRes.ok) { setLoading(false); return }

      const [p, e, b, m, st, v, f, a, apps] = await Promise.allSettled([
        api.projects.list(),
        api.events.list(),
        api.blogs.list(),
        api.members.list(),
        api.stats.get(),
        api.voices.list(),
        api.faqs.list(),
        api.announcements.list(),
        api.applications.list(),
      ])
      if (p.status === 'fulfilled') setProjects(p.value)
      if (e.status === 'fulfilled') setEvents(e.value)
      if (b.status === 'fulfilled') setBlogs(b.value)
      if (m.status === 'fulfilled') setMembers(m.value)
      if (st.status === 'fulfilled') setStats(st.value)
      if (v.status === 'fulfilled') setVoices(v.value)
      if (f.status === 'fulfilled') setFaqs(f.value)
      if (a.status === 'fulfilled') setAnnouncements(a.value)
      if (apps.status === 'fulfilled') setApplications(apps.value)
    } catch {
      setBackendOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  async function handleApproveApplication(id: string, name: string) {
    try {
      await api.applications.approve(id)
      push(`Approved ${name} as club member!`, 'ok')
      fetchAll()
    } catch (e: any) {
      push(e.message || 'Failed to approve application', 'err')
    }
  }

  async function handleRejectApplication(id: string, name: string) {
    try {
      await api.applications.reject(id)
      push(`Application for ${name} rejected`, 'ok')
      fetchAll()
    } catch (e: any) {
      push(e.message || 'Failed to reject application', 'err')
    }
  }

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Actions ────────────────────────────────────────────
  async function deleteProject(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    try { await api.projects.delete(id); setProjects(p => p.filter(x => x.id !== id)); push(`Deleted "${title}"`, 'ok') }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }
  async function patchProject(id: string, patch: Partial<Project>) {
    try { const updated = await api.projects.update(id, patch); setProjects(p => p.map(x => x.id === id ? updated : x)); push('Project updated', 'ok'); setModal(null) }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }
  async function createProject(body: Partial<Project>) {
    try { const created = await api.projects.create(body); setProjects(p => [created, ...p]); push('Project created', 'ok'); setModal(null) }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }

  async function deleteEvent(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    try { await api.events.delete(id); setEvents(p => p.filter(x => x.id !== id)); push(`Deleted "${title}"`, 'ok') }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }
  async function patchEvent(id: string, patch: Partial<SDCEvent>) {
    try { const updated = await api.events.update(id, patch); setEvents(p => p.map(x => x.id === id ? updated : x)); push('Event updated', 'ok'); setModal(null) }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }
  async function createEvent(body: Partial<SDCEvent>) {
    try { const created = await api.events.create(body); setEvents(p => [created, ...p]); push('Event created', 'ok'); setModal(null) }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }

  async function deleteBlog(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    try { await api.blogs.delete(id); setBlogs(p => p.filter(x => x.id !== id)); push(`Deleted "${title}"`, 'ok') }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }
  async function patchBlog(id: string, patch: Partial<Blog>) {
    try { const updated = await api.blogs.update(id, patch); setBlogs(p => p.map(x => x.id === id ? updated : x)); push('Blog post updated', 'ok'); setModal(null) }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }
  async function createBlog(body: Partial<Blog>) {
    try { const created = await api.blogs.create(body); setBlogs(p => [created, ...p]); push('Blog post created', 'ok'); setModal(null) }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }

  async function deleteMember(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    try { await api.members.delete(id); setMembers(p => p.filter(x => x.id !== id)); push(`Deleted "${name}"`, 'ok') }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }
  async function patchMember(id: string, patch: Partial<Member>) {
    try { const updated = await api.members.update(id, patch); setMembers(p => p.map(x => x.id === id ? updated : x)); push('Member updated', 'ok'); setModal(null) }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }
  async function createMember(body: Partial<Member>) {
    try { const created = await api.members.create(body); setMembers(p => [...p, created]); push('Member added', 'ok'); setModal(null) }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }

  async function updateStats(body: Partial<Stats> & { id: string }) {
    try { const updated = await api.stats.update(body); setStats(updated); push('Stats updated', 'ok'); setModal(null) }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }

  async function deleteVoice(id: string) {
    if (!confirm('Delete this testimonial?')) return
    try { await api.voices.delete(id); setVoices(p => p.filter(x => x.id !== id)); push('Deleted', 'ok') }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }
  async function patchVoice(id: string, patch: Partial<Voice>) {
    try { const updated = await api.voices.update(id, patch); setVoices(p => p.map(x => x.id === id ? updated : x)); push('Testimonial updated', 'ok'); setModal(null) }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }
  async function createVoice(body: Partial<Voice>) {
    try { const created = await api.voices.create(body); setVoices(p => [...p, created]); push('Testimonial added', 'ok'); setModal(null) }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }

  async function deleteFAQ(id: string) {
    if (!confirm('Delete this FAQ?')) return
    try { await api.faqs.delete(id); setFaqs(p => p.filter(x => x.id !== id)); push('Deleted', 'ok') }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }
  async function patchFAQ(id: string, patch: Partial<FAQ>) {
    try { const updated = await api.faqs.update(id, patch); setFaqs(p => p.map(x => x.id === id ? updated : x)); push('FAQ updated', 'ok'); setModal(null) }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }
  async function createFAQ(body: Partial<FAQ>) {
    try { const created = await api.faqs.create(body); setFaqs(p => [...p, created]); push('FAQ added', 'ok'); setModal(null) }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('Delete this announcement?')) return
    try { await api.announcements.delete(id); setAnnouncements(p => p.filter(x => x.id !== id)); push('Deleted', 'ok') }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }
  async function patchAnnouncement(id: string, patch: Partial<Announcement>) {
    try { const updated = await api.announcements.update(id, patch); setAnnouncements(p => p.map(x => x.id === id ? updated : x)); push('Announcement updated', 'ok'); setModal(null) }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }
  async function createAnnouncement(body: Partial<Announcement>) {
    try { const created = await api.announcements.create(body); setAnnouncements(p => [created, ...p]); push('Announcement created', 'ok'); setModal(null) }
    catch (e: unknown) { push((e as Error).message, 'err') }
  }

  // ── Tabs ────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'projects', label: 'Projects', count: projects.length },
    { key: 'events', label: 'Events', count: events.length },
    { key: 'blogs', label: 'Blogs', count: blogs.length },
    { key: 'members', label: 'Members', count: members.length },
    { key: 'stats', label: 'Stats' },
    { key: 'voices', label: 'Voices', count: voices.length },
    { key: 'faqs', label: 'FAQs', count: faqs.length },
    { key: 'announcements', label: 'Announce', count: announcements.length },
  ]

  // ── Modals ─────────────────────────────────────────────
  function ProjectModal({ item }: { item?: Project }) {
    const isEdit = !!item
    const [f, setF] = useState({
      title: item?.title || '',
      description: item?.description || '',
      github_url: item?.github_url || '',
      submitted_by: item?.submitted_by || '',
      status: item?.status || 'pending',
      tags: item?.tags ? (Array.isArray(item.tags) ? item.tags.join(', ') : String(item.tags)) : '',
    })
    return (
      <Modal title={isEdit ? 'Edit Project' : 'Add Project'} onClose={() => setModal(null)}>
        <Field label="Title"><input style={inputStyle} value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} /></Field>
        <Field label="Description"><textarea style={textareaStyle} value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} /></Field>
        <Field label="GitHub URL"><input style={inputStyle} value={f.github_url} onChange={e => setF(p => ({ ...p, github_url: e.target.value }))} /></Field>
        <Field label="Submitted By"><input style={inputStyle} value={f.submitted_by} onChange={e => setF(p => ({ ...p, submitted_by: e.target.value }))} /></Field>
        <Field label="Status">
          <select style={selectStyle} value={f.status} onChange={e => setF(p => ({ ...p, status: e.target.value as 'pending' | 'approved' | 'rejected' }))}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </Field>
        <Field label="Tags (comma-separated)"><input style={inputStyle} value={f.tags} onChange={e => setF(p => ({ ...p, tags: e.target.value }))} /></Field>
        <Btn onClick={() => {
          const payload = { ...f, status: f.status as 'pending' | 'approved' | 'rejected', tags: f.tags.split(',').map(t => t.trim()).filter(Boolean) }
          if (isEdit) {
            patchProject(item.id, payload)
          } else {
            createProject(payload)
          }
        }}>
          {isEdit ? 'Save Changes' : 'Create Project'}
        </Btn>
      </Modal>
    )
  }

  function EventModal({ item }: { item?: SDCEvent }) {
    const isEdit = !!item
    const formattedDate = item?.event_date ? new Date(item.event_date).toISOString().slice(0, 16) : ''
    const [f, setF] = useState({
      title: item?.title || '',
      description: item?.description || '',
      category: item?.category || 'Workshops',
      event_date: formattedDate,
      location: item?.location || '',
      spots_left: item?.spots_left ?? 30,
      featured: item?.featured ?? false,
    })
    return (
      <Modal title={isEdit ? 'Edit Event' : 'Add Event'} onClose={() => setModal(null)}>
        <Field label="Title"><input style={inputStyle} value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} /></Field>
        <Field label="Description"><textarea style={textareaStyle} value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} /></Field>
        <Field label="Category">
          <select style={selectStyle} value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value as 'Workshops' | 'Hackathons' | 'Talks' | 'Social' }))}>
            {['Workshops', 'Hackathons', 'Talks', 'Social'].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Date & Time (ISO)"><input style={inputStyle} type="datetime-local" value={f.event_date} onChange={e => setF(p => ({ ...p, event_date: e.target.value }))} /></Field>
        <Field label="Location"><input style={inputStyle} value={f.location} onChange={e => setF(p => ({ ...p, location: e.target.value }))} /></Field>
        <Field label="Spots Left"><input style={inputStyle} type="number" value={f.spots_left} onChange={e => setF(p => ({ ...p, spots_left: Number(e.target.value) }))} /></Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 16, cursor: 'pointer' }}>
          <input type="checkbox" checked={f.featured} onChange={e => setF(p => ({ ...p, featured: e.target.checked }))} /> Featured event
        </label>
        <Btn onClick={() => {
          if (isEdit) {
            patchEvent(item.id, f as Partial<SDCEvent>)
          } else {
            createEvent(f as Partial<SDCEvent>)
          }
        }}>
          {isEdit ? 'Save Changes' : 'Create Event'}
        </Btn>
      </Modal>
    )
  }

  function BlogModal({ item }: { item?: Blog }) {
    const isEdit = !!item
    const [f, setF] = useState({
      title: item?.title || '',
      excerpt: item?.excerpt || '',
      content: item?.content || '',
      author: item?.author || '',
      tag: item?.tag || 'Community',
      read_time: item?.read_time || '3 min read',
    })
    return (
      <Modal title={isEdit ? 'Edit Blog Post' : 'Add Blog Post'} onClose={() => setModal(null)}>
        <Field label="Title"><input style={inputStyle} value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} /></Field>
        <Field label="Excerpt"><textarea style={textareaStyle} value={f.excerpt} onChange={e => setF(p => ({ ...p, excerpt: e.target.value }))} /></Field>
        <Field label="Content"><textarea style={{ ...textareaStyle, minHeight: 120 }} value={f.content} onChange={e => setF(p => ({ ...p, content: e.target.value }))} /></Field>
        <Field label="Author"><input style={inputStyle} value={f.author} onChange={e => setF(p => ({ ...p, author: e.target.value }))} /></Field>
        <Field label="Tag"><input style={inputStyle} value={f.tag} onChange={e => setF(p => ({ ...p, tag: e.target.value }))} /></Field>
        <Field label="Read Time"><input style={inputStyle} value={f.read_time} onChange={e => setF(p => ({ ...p, read_time: e.target.value }))} /></Field>
        <Btn onClick={() => {
          if (isEdit) {
            patchBlog(item.id, f)
          } else {
            createBlog(f)
          }
        }}>
          {isEdit ? 'Save Changes' : 'Create Post'}
        </Btn>
      </Modal>
    )
  }

  function MemberModal({ item }: { item?: Member }) {
    const isEdit = !!item
    const [f, setF] = useState({
      name: item?.name || '',
      role: item?.role || '',
      initials: item?.initials || '',
      member_type: item?.member_type || 'student',
      dept: item?.dept || '',
      sort_order: item?.sort_order ?? 99,
    })
    return (
      <Modal title={isEdit ? 'Edit Member' : 'Add Member'} onClose={() => setModal(null)}>
        <Field label="Name"><input style={inputStyle} value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></Field>
        <Field label="Role"><input style={inputStyle} value={f.role} onChange={e => setF(p => ({ ...p, role: e.target.value }))} /></Field>
        <Field label="Initials (2 letters)"><input style={inputStyle} maxLength={2} value={f.initials} onChange={e => setF(p => ({ ...p, initials: e.target.value.toUpperCase() }))} /></Field>
        <Field label="Type">
          <select style={selectStyle} value={f.member_type} onChange={e => setF(p => ({ ...p, member_type: e.target.value as 'faculty' | 'student' }))}>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>
        </Field>
        <Field label="Department (faculty only)"><input style={inputStyle} value={f.dept} onChange={e => setF(p => ({ ...p, dept: e.target.value }))} /></Field>
        <Field label="Sort Order"><input style={inputStyle} type="number" value={f.sort_order} onChange={e => setF(p => ({ ...p, sort_order: Number(e.target.value) }))} /></Field>
        <Btn onClick={() => {
          if (isEdit) {
            patchMember(item.id, f as Partial<Member>)
          } else {
            createMember(f as Partial<Member>)
          }
        }}>
          {isEdit ? 'Save Changes' : 'Add Member'}
        </Btn>
      </Modal>
    )
  }

  function EditStatsModal() {
    const [f, setF] = useState({ ...stats! })
    return (
      <Modal title="Edit Club Stats" onClose={() => setModal(null)}>
        <Field label="Active Members"><input style={inputStyle} value={f.active_members} onChange={e => setF(p => ({ ...p, active_members: e.target.value }))} /></Field>
        <Field label="Workshops Run"><input style={inputStyle} value={f.workshops_run} onChange={e => setF(p => ({ ...p, workshops_run: e.target.value }))} /></Field>
        <Field label="Projects Shipped"><input style={inputStyle} value={f.projects_shipped} onChange={e => setF(p => ({ ...p, projects_shipped: e.target.value }))} /></Field>
        <Field label="Events Organized"><input style={inputStyle} value={f.events_organized ?? f.hackathons_won ?? ''} onChange={e => setF(p => ({ ...p, events_organized: e.target.value, hackathons_won: e.target.value }))} /></Field>
        <Btn onClick={() => updateStats(f)}>Save Stats</Btn>
      </Modal>
    )
  }

  function VoiceModal({ item }: { item?: Voice }) {
    const isEdit = !!item
    const [f, setF] = useState({
      quote: item?.quote || '',
      name: item?.name || '',
      year: item?.year || '',
      initials: item?.initials || '',
      sort_order: item?.sort_order ?? 99,
    })
    return (
      <Modal title={isEdit ? 'Edit Testimonial' : 'Add Testimonial'} onClose={() => setModal(null)}>
        <Field label="Quote"><textarea style={textareaStyle} value={f.quote} onChange={e => setF(p => ({ ...p, quote: e.target.value }))} /></Field>
        <Field label="Name"><input style={inputStyle} value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></Field>
        <Field label="Year / Batch"><input style={inputStyle} value={f.year} onChange={e => setF(p => ({ ...p, year: e.target.value }))} /></Field>
        <Field label="Initials"><input style={inputStyle} maxLength={2} value={f.initials} onChange={e => setF(p => ({ ...p, initials: e.target.value.toUpperCase() }))} /></Field>
        <Btn onClick={() => {
          if (isEdit) {
            patchVoice(item.id, f)
          } else {
            createVoice(f)
          }
        }}>
          {isEdit ? 'Save Changes' : 'Add Testimonial'}
        </Btn>
      </Modal>
    )
  }

  function FAQModal({ item }: { item?: FAQ }) {
    const isEdit = !!item
    const [f, setF] = useState({
      question: item?.question || '',
      answer: item?.answer || '',
      sort_order: item?.sort_order ?? 99,
    })
    return (
      <Modal title={isEdit ? 'Edit FAQ' : 'Add FAQ'} onClose={() => setModal(null)}>
        <Field label="Question"><input style={inputStyle} value={f.question} onChange={e => setF(p => ({ ...p, question: e.target.value }))} /></Field>
        <Field label="Answer"><textarea style={textareaStyle} value={f.answer} onChange={e => setF(p => ({ ...p, answer: e.target.value }))} /></Field>
        <Field label="Sort Order"><input style={inputStyle} type="number" value={f.sort_order} onChange={e => setF(p => ({ ...p, sort_order: Number(e.target.value) }))} /></Field>
        <Btn onClick={() => {
          if (isEdit) {
            patchFAQ(item.id, f)
          } else {
            createFAQ(f)
          }
        }}>
          {isEdit ? 'Save Changes' : 'Add FAQ'}
        </Btn>
      </Modal>
    )
  }

  function AnnouncementModal({ item }: { item?: Announcement }) {
    const isEdit = !!item
    const [f, setF] = useState({
      headline: item?.headline || '',
      category: item?.category || 'General',
      message: item?.message || '',
      is_active: item?.is_active ?? true,
    })
    return (
      <Modal title={isEdit ? 'Edit Announcement' : 'Add Announcement'} onClose={() => setModal(null)}>
        <Field label="Headline"><input style={inputStyle} value={f.headline} onChange={e => setF(p => ({ ...p, headline: e.target.value }))} /></Field>
        <Field label="Category">
          <select style={selectStyle} value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value as 'General' | 'Workshop' | 'Hackathon' | 'Urgent' }))}>
            {['General', 'Workshop', 'Hackathon', 'Urgent'].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Message"><textarea style={textareaStyle} value={f.message} onChange={e => setF(p => ({ ...p, message: e.target.value }))} /></Field>
        <Btn onClick={() => {
          if (isEdit) {
            patchAnnouncement(item.id, f as Partial<Announcement>)
          } else {
            createAnnouncement(f as Partial<Announcement>)
          }
        }}>
          {isEdit ? 'Save Changes' : 'Post Announcement'}
        </Btn>
      </Modal>
    )
  }

  // ── Content panels ─────────────────────────────────────
  const panels: Record<Tab, React.ReactNode> = {
    projects: (
      <Panel title="Projects" count={projects.length} onAdd={() => setModal({ type: 'add-project' })}>
        {projects.map(p => (
          <Card key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{p.title}</span>
              <StatusPill status={p.status} />
            </div>
            <p style={{ fontSize: 13, color: '#555', margin: '0 0 8px', lineHeight: 1.5 }}>{p.description}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {p.tags?.map(t => <Chip key={t}>{t}</Chip>)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
              {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}>{I.link} GitHub</a>}
              <span style={{ fontSize: 12, color: '#999' }}>by {p.submitted_by}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                {p.status === 'pending' && (
                  <ActionBtn color="#16a34a" onClick={() => patchProject(p.id, { status: 'approved' })}>{I.check} Approve</ActionBtn>
                )}
                {p.status === 'pending' && (
                  <ActionBtn color="#dc2626" onClick={() => patchProject(p.id, { status: 'rejected' })}>{I.x} Reject</ActionBtn>
                )}
                <EditBtn onClick={() => setModal({ type: 'edit-project', item: p })} />
                <TrashBtn onClick={() => deleteProject(p.id, p.title)} />
              </div>
            </div>
          </Card>
        ))}
      </Panel>
    ),

    events: (
      <Panel title="Events" count={events.length} onAdd={() => setModal({ type: 'add-event' })}>
        {events.map(e => (
          <Card key={e.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{e.title}</span>
              <Chip>{e.category}</Chip>
            </div>
            <p style={{ fontSize: 13, color: '#555', margin: '0 0 8px', lineHeight: 1.5 }}>{e.description}</p>
            <div style={{ fontSize: 12, color: '#888', display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
              <span>📍 {e.location}</span>
              <span>🗓 {e.event_date ? new Date(e.event_date).toLocaleString() : '—'}</span>
              <span>🪑 {e.spots_left} spots</span>
              {e.featured && <span style={{ color: '#f59e0b', fontWeight: 600 }}>★ Featured</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
              <EditBtn onClick={() => setModal({ type: 'edit-event', item: e })} />
              <TrashBtn onClick={() => deleteEvent(e.id, e.title)} />
            </div>
          </Card>
        ))}
      </Panel>
    ),

    blogs: (
      <Panel title="Blog Posts" count={blogs.length} onAdd={() => setModal({ type: 'add-blog' })}>
        {blogs.map(b => (
          <Card key={b.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{b.title}</span>
              <Chip>{b.tag}</Chip>
            </div>
            <p style={{ fontSize: 13, color: '#555', margin: '0 0 8px', lineHeight: 1.5 }}>{b.excerpt}</p>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>By {b.author} · {b.read_time} · {b.published_at ? new Date(b.published_at).toLocaleDateString() : ''}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
              <EditBtn onClick={() => setModal({ type: 'edit-blog', item: b })} />
              <TrashBtn onClick={() => deleteBlog(b.id, b.title)} />
            </div>
          </Card>
        ))}
      </Panel>
    ),

    members: (
      <div>
        {/* Pending Member Applications Section */}
        <div style={{ marginBottom: 24, padding: 18, background: '#fff', border: '1px solid #fde68a', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid #fef3c7', paddingBottom: 10 }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#92400e' }}>Pending Member Applications</span>
              <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#fef3c7', color: '#b45309', fontWeight: 700 }}>
                {applications.filter(a => a.approval_status === 'pending').length} Awaiting Review
              </span>
            </div>
          </div>

          {applications.filter(a => a.approval_status === 'pending').length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {applications.filter(a => a.approval_status === 'pending').map(app => (
                <div key={app.id} style={{ padding: 14, borderRadius: 8, background: '#fffbeb', border: '1px solid #fef3c7', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#b45309', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                      {app.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{app.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{app.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #fef3c7', paddingTop: 8 }}>
                    <span style={{ fontSize: 11, color: '#92400e', fontWeight: 600 }}>
                      {app.member_type === 'university' ? '🎓 Parul University' : '🌐 External'}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleRejectApplication(app.id, app.name)}
                        style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #ef4444', background: '#fff', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveApplication(app.id, app.name)}
                        style={{ padding: '4px 12px', borderRadius: 5, border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#92400e', textAlign: 'center', padding: '12px 0' }}>
              ✓ All member applications have been reviewed. No pending requests.
            </div>
          )}
        </div>

        {/* Verified Members Directory */}
        <Panel title="Official Member Directory" count={members.length} onAdd={() => setModal({ type: 'add-member' })}>
          {members.map(m => (
            <Card key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{m.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{m.member_type === 'faculty' ? '🎓 Faculty' : '👤 Student'} {m.role && `· ${m.role}`} {m.dept && `· ${m.dept}`}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <EditBtn onClick={() => setModal({ type: 'edit-member', item: m })} />
                <TrashBtn onClick={() => deleteMember(m.id, m.name)} />
              </div>
            </Card>
          ))}
        </Panel>
      </div>
    ),

    stats: (
      <Panel title="Club Stats" onAdd={stats ? () => setModal({ type: 'edit-stats' }) : undefined} addLabel="Edit">
        {stats ? (
          <Card>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <Row label="Active Members" value={stats.active_members} />
                <Row label="Workshops Run" value={stats.workshops_run} />
                <Row label="Projects Shipped" value={stats.projects_shipped} />
                <Row label="Events Organized" value={stats.events_organized || stats.hackathons_won} />
                <Row label="Last Updated" value={new Date(stats.updated_at).toLocaleString()} />
              </tbody>
            </table>
          </Card>
        ) : (
          <EmptyState msg="No stats row found. Run the seed script to create it." />
        )}
      </Panel>
    ),

    voices: (
      <Panel title="Testimonials" count={voices.length} onAdd={() => setModal({ type: 'add-voice' })}>
        {voices.map(v => (
          <Card key={v.id}>
            <p style={{ fontSize: 14, color: '#333', fontStyle: 'italic', margin: '0 0 10px', lineHeight: 1.6 }}>"{v.quote}"</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{v.name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{v.year}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <EditBtn onClick={() => setModal({ type: 'edit-voice', item: v })} />
                <TrashBtn onClick={() => deleteVoice(v.id)} />
              </div>
            </div>
          </Card>
        ))}
      </Panel>
    ),

    faqs: (
      <Panel title="FAQs" count={faqs.length} onAdd={() => setModal({ type: 'add-faq' })}>
        {faqs.map(f => (
          <Card key={f.id}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Q: {f.question}</div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 10, lineHeight: 1.5 }}>A: {f.answer}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
              <EditBtn onClick={() => setModal({ type: 'edit-faq', item: f })} />
              <TrashBtn onClick={() => deleteFAQ(f.id)} />
            </div>
          </Card>
        ))}
      </Panel>
    ),

    announcements: (
      <Panel title="Announcements" count={announcements.length} onAdd={() => setModal({ type: 'add-announcement' })}>
        {announcements.map(a => (
          <Card key={a.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{a.headline}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Chip>{a.category}</Chip>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: a.is_active ? '#dcfce7' : '#f3f4f6', color: a.is_active ? '#16a34a' : '#9ca3af', fontWeight: 700 }}>{a.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#555', margin: '0 0 10px', lineHeight: 1.5 }}>{a.message}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
              <span style={{ fontSize: 12, color: '#888' }}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <EditBtn onClick={() => setModal({ type: 'edit-announcement', item: a })} />
                <TrashBtn onClick={() => deleteAnnouncement(a.id)} />
              </div>
            </div>
          </Card>
        ))}
      </Panel>
    ),
  }

  // ── Modal routing ──────────────────────────────────────
  const activeModal = (modal?.type === 'add-project' || modal?.type === 'edit-project') ? <ProjectModal item={modal.item as Project | undefined} />
    : (modal?.type === 'add-event' || modal?.type === 'edit-event') ? <EventModal item={modal.item as SDCEvent | undefined} />
      : (modal?.type === 'add-blog' || modal?.type === 'edit-blog') ? <BlogModal item={modal.item as Blog | undefined} />
        : (modal?.type === 'add-member' || modal?.type === 'edit-member') ? <MemberModal item={modal.item as Member | undefined} />
          : modal?.type === 'edit-stats' && stats ? <EditStatsModal />
            : (modal?.type === 'add-voice' || modal?.type === 'edit-voice') ? <VoiceModal item={modal.item as Voice | undefined} />
              : (modal?.type === 'add-faq' || modal?.type === 'edit-faq') ? <FAQModal item={modal.item as FAQ | undefined} />
                : (modal?.type === 'add-announcement' || modal?.type === 'edit-announcement') ? <AnnouncementModal item={modal.item as Announcement | undefined} />
                  : null

  // ── Render ──────────────────────────────────────────────
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif', background: '#f8f9fa', minHeight: '100vh', color: '#111' }}>

      {/* Toasts */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 340 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ padding: '10px 14px', borderRadius: 8, background: t.type === 'ok' ? '#000' : t.type === 'err' ? '#dc2626' : '#374151', color: '#fff', fontSize: 13, fontWeight: 500, boxShadow: '0 8px 20px rgba(0,0,0,0.2)', animation: 'slideIn .2s ease' }}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: '#000', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 13 }}>SDC</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Admin Dashboard</div>
              <div style={{ fontSize: 12, color: '#888' }}>{user.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* DB Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '5px 10px', borderRadius: 6, background: backendOnline === true ? '#dcfce7' : backendOnline === false ? '#fee2e2' : '#f3f4f6', color: backendOnline === true ? '#16a34a' : backendOnline === false ? '#dc2626' : '#6b7280' }}>
              {I.db}
              {backendOnline === null ? 'Checking...' : backendOnline ? 'DB Connected' : 'API Offline'}
            </div>
            <button onClick={fetchAll} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 6, background: '#000', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {I.reload} {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Offline Banner */}
      {backendOnline === false && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '12px 20px', fontSize: 13, color: '#dc2626', textAlign: 'center' }}>
          ⚠️ Cannot reach the API server. Make sure you ran <code style={{ background: '#fee2e2', padding: '1px 5px', borderRadius: 3 }}>npm run server:dev</code> and filled in <code style={{ background: '#fee2e2', padding: '1px 5px', borderRadius: 3 }}>.env</code> with your Supabase credentials.
        </div>
      )}

      {/* Tab Nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 0 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '13px 16px', fontSize: 13, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? '#000' : '#6b7280', background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid #000' : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, transition: 'color .15s' }}>
              {t.label}
              {t.count !== undefined && <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 10, background: tab === t.key ? '#000' : '#f3f4f6', color: tab === t.key ? '#fff' : '#374151', fontWeight: 700 }}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 80px' }}>
        {loading && backendOnline !== false ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888', fontSize: 14 }}>Loading data from database...</div>
        ) : (
          panels[tab]
        )}
      </div>

      {activeModal}

      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:none } }`}</style>
    </div>
  )
}

// ── Small shared components ────────────────────────────────

function Panel({ title, count, onAdd, addLabel = 'Add New', children }: { title: string; count?: number; onAdd?: () => void; addLabel?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #e5e7eb' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{title} {count !== undefined && <span style={{ fontSize: 16, color: '#888', fontWeight: 500 }}>({count})</span>}</h2>
        </div>
        {onAdd && (
          <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#000', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {I.plus} {addLabel}
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
        {React.Children.count(children) > 0 ? children : <EmptyState msg={`No ${title.toLowerCase()} yet.`} />}
      </div>
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', ...style }}>
      {children}
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f3f4f6', color: '#374151', fontWeight: 600, border: '1px solid #e5e7eb' }}>{children}</span>
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    approved: { bg: '#dcfce7', color: '#16a34a' },
    rejected: { bg: '#fee2e2', color: '#dc2626' },
    pending: { bg: '#fef9c3', color: '#92400e' },
  }
  const c = colors[status] || { bg: '#f3f4f6', color: '#6b7280' }
  return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: c.bg, color: c.color, fontWeight: 700, textTransform: 'capitalize' }}>{status}</span>
}

function ActionBtn({ onClick, color, children }: { onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 5, border: `1px solid ${color}`, background: 'transparent', color, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
      {children}
    </button>
  )
}

function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} title="Edit" style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', borderRadius: 5, display: 'flex', alignItems: 'center' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#ff6b1a')}
      onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
    >
      {I.edit}
    </button>
  )
}

function TrashBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} title="Delete" style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', borderRadius: 5, display: 'flex', alignItems: 'center' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
      onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
    >
      {I.trash}
    </button>
  )
}

function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ width: '100%', padding: '10px 16px', background: '#000', color: '#fff', border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
      {children}
    </button>
  )
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 20px', border: '1px dashed #d1d5db', borderRadius: 10, color: '#9ca3af', fontSize: 14 }}>
      {msg}
    </div>
  )
}
