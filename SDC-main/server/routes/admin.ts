import { Router, Response } from 'express'
import { supabaseAdmin } from '../db.js'
import { requireAdmin, logAdminAction, AuthenticatedAdminRequest } from '../middleware/adminAuth.js'

const router = Router()

// Protect all admin routes: token verification, database profile role='admin' & approval_status='approved'
router.use(requireAdmin)

// ── 1. List All Member Applications (Read from public.profiles table as single source of truth) ──
router.get('/applications', async (_req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, approval_status, member_type, created_at')
      .neq('role', 'admin')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to list applications from profiles:', error.message)
      return res.status(500).json({ error: 'Failed to retrieve applications.' })
    }

    const applications = (profiles || []).map(p => ({
      id: p.id,
      email: p.email,
      name: p.full_name || p.email.split('@')[0],
      role: p.role,
      member_type: p.member_type,
      approval_status: p.approval_status || 'pending',
      applied_at: p.created_at,
      created_at: p.created_at,
    }))

    res.json(applications)
  } catch (err: any) {
    console.error('Applications handler error:', err)
    res.status(500).json({ error: 'Internal server error while listing applications.' })
  }
})

// ── 2. Approve Member Application (Server-only with Service Key) ──
router.post('/applications/:id/approve', async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const rawId = req.params.id
    if (!rawId || typeof rawId !== 'string') {
      return res.status(400).json({ error: 'Valid application ID or email is required.' })
    }

    const cleanId = rawId.trim()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)

    let targetProfile: any = null
    if (isUuid) {
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', cleanId).maybeSingle()
      targetProfile = data
    } else {
      const { data } = await supabaseAdmin.from('profiles').select('*').ilike('email', cleanId).maybeSingle()
      targetProfile = data
    }

    let userId = targetProfile?.id || (isUuid ? cleanId : null)
    let email = targetProfile?.email || (isUuid ? '' : cleanId)
    let fullName = targetProfile?.full_name || ''
    let memberType = targetProfile?.member_type || 'university'

    // Lookup fallback by ID in auth
    if (!userId || !email) {
      if (isUuid) {
        try {
          const { data: authData } = await supabaseAdmin.auth.admin.getUserById(cleanId)
          if (authData?.user) {
            userId = authData.user.id
            email = authData.user.email || email
            fullName = authData.user.user_metadata?.name || fullName
            memberType = authData.user.user_metadata?.member_type || memberType
          }
        } catch (e) {
          console.warn('Auth user lookup warning:', e)
        }
      }
    }

    if (!userId) {
      return res.status(404).json({ error: 'Applicant profile not found.' })
    }

    // Safety checks: Prevent approving oneself or modifying admin roles through application approval
    if (userId === req.adminProfile!.id) {
      return res.status(400).json({ error: 'Cannot approve your own account.' })
    }
    if (targetProfile?.role === 'admin') {
      return res.status(400).json({ error: 'Target account already has administrative privileges.' })
    }

    const displayName = (fullName || email.split('@')[0] || 'Member').trim().slice(0, 100)

    // 1. Update database profile row (approval_status = 'approved')
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        full_name: displayName,
        role: 'member',
        approval_status: 'approved',
        member_type: memberType,
      }, { onConflict: 'id' })

    if (updateErr) {
      console.error('Failed to update profile to approved:', updateErr.message)
      return res.status(500).json({ error: 'Failed to update approval status in database.' })
    }

    // 2. Keep Supabase Auth metadata in sync
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
      },
    }).catch(err => {
      console.warn('Failed to sync auth user metadata:', err)
    })

    // 3. Sync approved member to public 'members' table with unique link
    const initials = displayName
      .split(' ')
      .filter(Boolean)
      .map((w: string) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

    const { data: existingMember } = await supabaseAdmin
      .from('members')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!existingMember) {
      const { error: memberInsertErr } = await supabaseAdmin.from('members').insert([
        {
          user_id: userId,
          name: displayName,
          role: 'Active Member',
          initials: initials || 'SD',
          member_type: 'student',
          dept: memberType === 'external' ? 'External Developer' : 'Computer Science & Engineering',
          sort_order: 50,
        },
      ])
      if (memberInsertErr) {
        console.warn('Members insert warning:', memberInsertErr.message)
      }
    }

    // 4. Audit Log this administrative action with consistent targetId (UUID)
    await logAdminAction({
      adminId: req.adminProfile!.id,
      adminEmail: req.adminProfile!.email,
      action: 'APPROVE_MEMBER_APPLICATION',
      targetType: 'profile',
      targetId: userId,
      details: {
        applicant_email: email,
        applicant_name: displayName,
        member_type: memberType,
      },
      req,
    })

    res.json({
      success: true,
      message: `${displayName} has been approved as an official SDC club member.`,
    })
  } catch (err: any) {
    console.error('Approve application error:', err)
    res.status(500).json({ error: 'Failed to approve application.' })
  }
})

// ── 3. Reject Member Application (Server-only with Service Key) ──
router.post('/applications/:id/reject', async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const rawId = req.params.id
    if (!rawId || typeof rawId !== 'string') {
      return res.status(400).json({ error: 'Valid application ID or email is required.' })
    }

    const cleanId = rawId.trim()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)

    let targetProfile: any = null
    if (isUuid) {
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', cleanId).maybeSingle()
      targetProfile = data
    } else {
      const { data } = await supabaseAdmin.from('profiles').select('*').ilike('email', cleanId).maybeSingle()
      targetProfile = data
    }

    let userId = targetProfile?.id || (isUuid ? cleanId : null)
    let email = targetProfile?.email || (isUuid ? '' : cleanId)
    let fullName = targetProfile?.full_name || ''

    if (!userId || !email) {
      if (isUuid) {
        try {
          const { data: authData } = await supabaseAdmin.auth.admin.getUserById(cleanId)
          if (authData?.user) {
            userId = authData.user.id
            email = authData.user.email || email
            fullName = authData.user.user_metadata?.name || fullName
          }
        } catch (e) {
          console.warn('Auth user lookup warning:', e)
        }
      }
    }

    if (!userId) {
      return res.status(404).json({ error: 'Applicant profile not found.' })
    }

    // Safety checks: Prevent self-rejection and rejection of administrators
    if (userId === req.adminProfile!.id) {
      return res.status(400).json({ error: 'You cannot reject your own administrative account.' })
    }
    if (targetProfile?.role === 'admin') {
      return res.status(400).json({ error: 'Cannot reject an administrator account.' })
    }

    const displayName = (fullName || email.split('@')[0] || 'Applicant').trim()

    // 1. Update database profile row (approval_status = 'rejected')
    const { error: rejectErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        approval_status: 'rejected',
      }, { onConflict: 'id' })

    if (rejectErr) {
      console.error('Failed to update rejection status:', rejectErr.message)
      return res.status(500).json({ error: 'Failed to update application rejection in database.' })
    }

    // 2. Keep user_metadata in sync
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        approval_status: 'rejected',
        rejected_at: new Date().toISOString(),
      },
    }).catch(() => {})

    // 3. Undo earlier approval: Remove from public members table
    await supabaseAdmin.from('members').delete().eq('user_id', userId)
    if (displayName) {
      await supabaseAdmin.from('members').delete().eq('name', displayName)
    }

    // 4. Invalidate / sign out user sessions
    try {
      await (supabaseAdmin.auth.admin as any).signOut?.(userId)
    } catch {}

    // 5. Audit Log this action (safe references, consistent targetId UUID)
    await logAdminAction({
      adminId: req.adminProfile!.id,
      adminEmail: req.adminProfile!.email,
      action: 'REJECT_MEMBER_APPLICATION',
      targetType: 'profile',
      targetId: userId,
      details: {
        applicant_email: email,
        applicant_name: displayName,
      },
      req,
    })

    res.json({
      success: true,
      message: 'Member application marked as rejected.',
    })
  } catch (err: any) {
    console.error('Reject application error:', err)
    res.status(500).json({ error: 'Failed to reject application.' })
  }
})

// ── 4. View Admin Audit Logs (Paginated) ─────────────────────
router.get('/audit-logs', async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50))
    const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0)

    const { data: logs, error } = await supabaseAdmin
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Audit logs query error:', error.message)
      return res.status(500).json({ error: 'Failed to load audit logs.' })
    }

    res.json(logs || [])
  } catch (err: any) {
    console.error('Audit logs handler error:', err)
    res.status(500).json({ error: 'Failed to load audit logs.' })
  }
})

export default router
