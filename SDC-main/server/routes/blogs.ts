import { Router } from 'express'
import { supabase } from '../db.js'
import { requireAdmin } from '../middleware/adminAuth.js'

const router = Router()

router.get('/', async (_req, res) => {
  const { data, error } = await supabase.from('blogs').select('*').order('published_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('blogs').select('*').eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: error.message })
  res.json(data)
})

router.post('/', requireAdmin, async (req, res) => {
  const { title, excerpt, content, author, tag, read_time, image_url, photos } = req.body
  const payload: any = {
    title, excerpt, content,
    author: author || 'SDC Team',
    tag: tag || 'Community',
    read_time: read_time || '3 min read',
    image_url: image_url || null,
    photos: Array.isArray(photos) ? photos : [],
  }

  const { data, error } = await supabase.from('blogs').insert([payload]).select().single()
  if (error) {
    // If schema cache hasn't refreshed with new columns yet, fallback to base fields
    if (error.message.includes('image_url') || error.message.includes('photos')) {
      const fallback = {
        title, excerpt, content,
        author: author || 'SDC Team',
        tag: tag || 'Community',
        read_time: read_time || '3 min read',
      }
      const { data: fbData, error: fbError } = await supabase.from('blogs').insert([fallback]).select().single()
      if (fbError) return res.status(400).json({ error: fbError.message })
      return res.status(201).json(fbData)
    }
    return res.status(400).json({ error: error.message })
  }
  res.status(201).json(data)
})

router.patch('/:id', requireAdmin, async (req, res) => {
  const { id, ...updates } = req.body
  const { data, error } = await supabase.from('blogs').update(updates).eq('id', req.params.id).select()
  if (error) {
    if (error.message.includes('image_url') || error.message.includes('photos')) {
      const { image_url, photos, ...safeUpdates } = updates
      const { data: fbData, error: fbError } = await supabase.from('blogs').update(safeUpdates).eq('id', req.params.id).select()
      if (fbError) return res.status(400).json({ error: fbError.message })
      return res.json(fbData?.[0])
    }
    return res.status(400).json({ error: error.message })
  }
  res.json(data?.[0])
})

router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('blogs').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ success: true })
})

export default router
