import { Router } from 'express'
import { supabase } from '../db.js'
import { requireAdmin } from '../middleware/adminAuth.js'

const router = Router()

router.get('/', async (_req, res) => {
  const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', requireAdmin, async (req, res) => {
  const { headline, category, message, is_active } = req.body
  const { data, error } = await supabase.from('announcements').insert([{
    headline, category: category || 'General', message, is_active: is_active ?? true,
  }]).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
})

router.patch('/:id', requireAdmin, async (req, res) => {
  const { id, ...updates } = req.body
  const { data, error } = await supabase.from('announcements').update(updates).eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data?.[0])
})

router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('announcements').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ success: true })
})

export default router
