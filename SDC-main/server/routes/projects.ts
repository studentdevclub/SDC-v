import { Router } from 'express'
import { supabase } from '../db.js'
import { requireAdmin } from '../middleware/adminAuth.js'

const router = Router()

// GET all projects
router.get('/', async (_req, res) => {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET single project
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('projects').select('*').eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: error.message })
  res.json(data)
})

// POST create project (always pending review on submission)
router.post('/', async (req, res) => {
  const { title, description, github_url, submitted_by, tags } = req.body
  const { data, error } = await supabase.from('projects').insert([{
    title, description, github_url,
    submitted_by: submitted_by || 'SDC Contributor',
    status: 'pending', // Submissions must always be pending review
    tags: tags || [],
  }]).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
})

// PATCH update project (restricted to approved admins)
router.patch('/:id', requireAdmin, async (req, res) => {
  const { id, ...updates } = req.body
  const { data, error } = await supabase.from('projects').update(updates).eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data?.[0])
})

// DELETE project (restricted to approved admins)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('projects').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ success: true })
})

export default router
