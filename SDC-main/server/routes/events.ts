import { Router } from 'express'
import { supabase } from '../db.js'
import { requireAdmin } from '../middleware/adminAuth.js'

const router = Router()

router.get('/', async (_req, res) => {
  const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('events').select('*').eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: error.message })
  res.json(data)
})

router.post('/', requireAdmin, async (req, res) => {
  const { title, description, category, event_date, location, spots_left, featured, href } = req.body
  const { data, error } = await supabase.from('events').insert([{
    title, description,
    category: category || 'Workshops',
    event_date, location,
    spots_left: spots_left ?? 30,
    featured: featured ?? false,
    href: href || '#/events',
  }]).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
})

router.patch('/:id', requireAdmin, async (req, res) => {
  const { id, ...updates } = req.body
  const { data, error } = await supabase.from('events').update(updates).eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data?.[0])
})

router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('events').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ success: true })
})

export default router
