import { supabase } from './supabase'

// Central API client for all SDC backend calls
// Reads VITE_API_URL from .env (defaults to localhost:4000 in dev)
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  try {
    const { data } = await supabase.auth.getSession()
    if (data?.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`
    }
  } catch {}

  const res = await fetch(`${BASE}${path}`, {
    credentials: 'omit',
    ...options,
    headers,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

// ── Projects ────────────────────────────────────────────
export const api = {
  projects: {
    list: () => request<Project[]>('/api/projects'),
    get: (id: string) => request<Project>(`/api/projects/${id}`),
    create: (body: Partial<Project>) => request<Project>('/api/projects', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Project>) => request<Project>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<{ success: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),
  },
  events: {
    list: () => request<SDCEvent[]>('/api/events'),
    get: (id: string) => request<SDCEvent>(`/api/events/${id}`),
    create: (body: Partial<SDCEvent>) => request<SDCEvent>('/api/events', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<SDCEvent>) => request<SDCEvent>(`/api/events/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<{ success: boolean }>(`/api/events/${id}`, { method: 'DELETE' }),
  },
  blogs: {
    list: () => request<Blog[]>('/api/blogs'),
    get: (id: string) => request<Blog>(`/api/blogs/${id}`),
    create: (body: Partial<Blog>) => request<Blog>('/api/blogs', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Blog>) => request<Blog>(`/api/blogs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<{ success: boolean }>(`/api/blogs/${id}`, { method: 'DELETE' }),
  },
  members: {
    list: () => request<Member[]>('/api/members'),
    get: (id: string) => request<Member>(`/api/members/${id}`),
    create: (body: Partial<Member>) => request<Member>('/api/members', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Member>) => request<Member>(`/api/members/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<{ success: boolean }>(`/api/members/${id}`, { method: 'DELETE' }),
  },
  stats: {
    get: () => request<Stats>('/api/stats'),
    update: (body: Partial<Stats> & { id: string }) => request<Stats>('/api/stats', { method: 'PATCH', body: JSON.stringify(body) }),
  },
  voices: {
    list: () => request<Voice[]>('/api/voices'),
    create: (body: Partial<Voice>) => request<Voice>('/api/voices', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Voice>) => request<Voice>(`/api/voices/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<{ success: boolean }>(`/api/voices/${id}`, { method: 'DELETE' }),
  },
  faqs: {
    list: () => request<FAQ[]>('/api/faqs'),
    create: (body: Partial<FAQ>) => request<FAQ>('/api/faqs', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<FAQ>) => request<FAQ>(`/api/faqs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<{ success: boolean }>(`/api/faqs/${id}`, { method: 'DELETE' }),
  },
  announcements: {
    list: () => request<Announcement[]>('/api/announcements'),
    create: (body: Partial<Announcement>) => request<Announcement>('/api/announcements', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Announcement>) => request<Announcement>(`/api/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<{ success: boolean }>(`/api/announcements/${id}`, { method: 'DELETE' }),
  },
  applications: {
    list: () => request<MemberApplication[]>('/api/admin/applications'),
    approve: (id: string) => request<{ success: boolean; message?: string }>(`/api/admin/applications/${id}/approve`, { method: 'POST' }),
    reject: (id: string) => request<{ success: boolean; message?: string }>(`/api/admin/applications/${id}/reject`, { method: 'POST' }),
  },
  auth: {
    checkStatus: (userId?: string) => request<{ id: string; email: string; approval_status: 'approved' | 'pending' | 'rejected'; role: string }>(userId ? `/api/auth/status/${encodeURIComponent(userId)}` : '/api/auth/status'),
  },
}

// ── Types ────────────────────────────────────────────────
export interface MemberApplication {
  id: string
  name: string
  email: string
  role: 'member' | 'admin'
  member_type: 'university' | 'external'
  approval_status: 'pending' | 'approved' | 'rejected'
  applied_at: string
  created_at: string
  avatar_url?: string | null
}
export interface Project {
  id: string
  title: string
  description: string
  github_url: string
  submitted_by: string
  status: 'pending' | 'approved' | 'rejected'
  tags: string[]
  is_featured: boolean
  created_at: string
}

export interface SDCEvent {
  id: string
  title: string
  description: string
  category: 'Workshops' | 'Hackathons' | 'Talks' | 'Social'
  event_date: string
  location: string
  spots_left: number
  featured: boolean
  href: string
  created_at: string
}

export interface Blog {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  tag: string
  read_time: string
  image_url?: string
  photos?: string[]
  published_at: string
}

export interface Member {
  id: string
  name: string
  role: string
  initials: string
  member_type: 'faculty' | 'student'
  dept?: string
  sort_order: number
  created_at: string
}

export interface Stats {
  id: string
  active_members: string
  workshops_run: string
  projects_shipped: string
  events_organized?: string
  hackathons_won?: string
  updated_at: string
}

export interface Voice {
  id: string
  quote: string
  name: string
  year: string
  initials: string
  sort_order: number
  created_at: string
}

export interface FAQ {
  id: string
  question: string
  answer: string
  sort_order: number
  created_at: string
}

export interface Announcement {
  id: string
  headline: string
  category: 'Workshop' | 'Hackathon' | 'Urgent' | 'General'
  message: string
  is_active: boolean
  created_at: string
}
