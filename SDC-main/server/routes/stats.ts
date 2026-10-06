import { Router } from 'express'
import { supabase } from '../db.js'
import { requireAdmin } from '../middleware/adminAuth.js'

const router = Router()

// GET all stats (returns first row or creates default)
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('stats').select('*').limit(1)
    if (error) return res.status(500).json({ error: error.message })
    
    const row = data?.[0]
    if (!row) {
      return res.json({
        id: 'default',
        active_members: '450+',
        workshops_run: '28+',
        projects_shipped: '64+',
        events_organized: '30+',
        hackathons_won: '30+',
        updated_at: new Date().toISOString(),
      })
    }
    
    const normalized = {
      ...row,
      events_organized: row.events_organized ?? row.hackathons_won ?? '30+',
      hackathons_won: row.hackathons_won ?? row.events_organized ?? '30+',
    }
    res.json(normalized)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch stats' })
  }
})

// PATCH update stats (restricted to approved admins)
router.patch('/', requireAdmin, async (req, res) => {
  try {
    const { id, ...fields } = req.body

    const updatePayload: Record<string, any> = {
      ...fields,
      updated_at: new Date().toISOString(),
    }
    if (updatePayload.events_organized !== undefined) {
      updatePayload.hackathons_won = updatePayload.events_organized
    }

    // Check if row exists or find existing id
    let targetId = id
    if (!targetId || targetId === 'main' || targetId === 'default') {
      const existing = await supabase.from('stats').select('id').limit(1)
      targetId = existing.data?.[0]?.id
    }

    if (!targetId) {
      // Create new row
      delete updatePayload.id
      const insertPayload = { ...updatePayload }
      let { data, error } = await supabase.from('stats').insert([insertPayload]).select().limit(1)
      if (error && error.message.includes('events_organized')) {
        delete insertPayload.events_organized
        const retry = await supabase.from('stats').insert([insertPayload]).select().limit(1)
        data = retry.data
        error = retry.error
      }
      if (error) return res.status(400).json({ error: error.message })
      const created = data?.[0]
      return res.json({
        ...created,
        events_organized: created?.events_organized ?? created?.hackathons_won,
        hackathons_won: created?.hackathons_won ?? created?.events_organized,
      })
    }

    // Update existing row
    let { data, error } = await supabase.from('stats').update(updatePayload).eq('id', targetId).select().limit(1)
    if (error && error.message.includes('events_organized')) {
      delete updatePayload.events_organized
      const fallback = await supabase.from('stats').update(updatePayload).eq('id', targetId).select().limit(1)
      data = fallback.data
      error = fallback.error
    }

    if (error) return res.status(400).json({ error: error.message })
    const updated = data?.[0]
    const normalized = {
      ...updated,
      events_organized: updated?.events_organized ?? updated?.hackathons_won,
      hackathons_won: updated?.hackathons_won ?? updated?.events_organized,
    }
    res.json(normalized)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update stats' })
  }
})

export default router
