import { api, type Project } from './api'

export interface ProjectItem {
  id: string
  title: string
  description: string
  githubUrl: string
  status?: 'approved' | 'pending' | 'rejected'
  submittedBy?: string
  submittedAt?: string
  tags?: string[]
  is_featured?: boolean
}

const STORAGE_KEY = 'sdc_all_projects'

export function projectToItem(p: Project): ProjectItem {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    githubUrl: p.github_url || 'https://github.com/sdc-club',
    status: p.status,
    submittedBy: p.submitted_by,
    tags: p.tags,
    is_featured: p.is_featured,
    submittedAt: p.created_at
      ? new Date(p.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : undefined,
  }
}

export async function fetchProjectsFromApi(): Promise<ProjectItem[]> {
  try {
    const data = await api.projects.list()
    if (Array.isArray(data)) {
      const items = data.map(projectToItem)
      saveLocalBackup(items)
      return items
    }
  } catch (err) {
    console.warn('Could not fetch projects from API, checking local backup:', err)
  }
  return getLocalBackup()
}

export async function createProjectInApi(p: {
  title: string
  description: string
  github_url: string
  submitted_by: string
  status?: 'pending' | 'approved' | 'rejected'
  tags?: string[]
}): Promise<ProjectItem> {
  const created = await api.projects.create(p)
  const item = projectToItem(created)
  const existing = getLocalBackup()
  saveLocalBackup([item, ...existing])
  return item
}

function getLocalBackup(): ProjectItem[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) return JSON.parse(data)
  } catch (e) {
    console.error('Error reading local project backup', e)
  }
  return []
}

function saveLocalBackup(projects: ProjectItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
    window.dispatchEvent(new Event('sdc_projects_updated'))
  } catch (e) {
    console.error('Error saving local project backup', e)
  }
}

// Deprecated local sync helpers maintained for backwards compatibility
export function getStoredProjects(): ProjectItem[] {
  return getLocalBackup()
}

export function saveStoredProjects(projects: ProjectItem[]) {
  saveLocalBackup(projects)
}
