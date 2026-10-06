import { Router } from 'express'
import { supabase } from '../db.js'
import { requireAdmin } from '../middleware/adminAuth.js'

const router = Router()

router.get('/', async (_req, res) => {
  const { data, error } = await supabase.from('voices').select('*').order('sort_order', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', requireAdmin, async (req, res) => {
  const { quote, name, year, initials, sort_order } = req.body
  const { data, error } = await supabase.from('voices').insert([{
    quote, name, year,
    initials: initials || name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
    sort_order: sort_order ?? 99,
  }]).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
})

router.patch('/:id', requireAdmin, async (req, res) => {
  const { id, ...updates } = req.body
  const { data, error } = await supabase.from('voices').update(updates).eq('id', req.params.id).select()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data?.[0])
})

router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('voices').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ success: true })
})

export default router
