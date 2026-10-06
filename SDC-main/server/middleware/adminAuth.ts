import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db.js'

export interface AuthenticatedUserRequest extends Request {
  user?: any
  profile?: {
    id: string
    email: string
    full_name: string | null
    role: 'admin' | 'member'
    approval_status: 'pending' | 'approved' | 'rejected'
    member_type: 'university' | 'external'
  }
}

export interface AuthenticatedAdminRequest extends AuthenticatedUserRequest {
  adminProfile?: {
    id: string
    email: string
    full_name: string | null
    role: 'admin' | 'member'
    approval_status: 'pending' | 'approved' | 'rejected'
    member_type: 'university' | 'external'
  }
}

/**
 * Standard User Auth Middleware:
 * Verifies Bearer session token via Supabase Auth and loads profile.
 */
export async function requireAuth(
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized: Missing or invalid Authorization header.',
      })
    }

    const token = authHeader.split(' ')[1]?.trim()
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized: Bearer token is required.',
      })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or expired session token.',
      })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, approval_status, member_type')
      .eq('id', user.id)
      .maybeSingle()

    req.user = user
    req.profile = profile || {
      id: user.id,
      email: user.email || '',
      full_name: (user.user_metadata?.name || user.email?.split('@')[0]) || null,
      role: 'member',
      approval_status: 'pending',
      member_type: 'external',
    }

    next()
  } catch (err: any) {
    return res.status(500).json({
      error: 'Internal authorization verification error.',
    })
  }
}

/**
 * Admin Middleware:
 * 1. Verifies Bearer session token via Supabase Auth.
 * 2. Loads profile row from public.profiles table.
 * 3. Enforces role = 'admin' AND approval_status = 'approved'.
 * 4. Checks TOTP MFA if factor is enrolled (requires AAL2).
 * 5. Denies by default.
 */
export async function requireAdmin(
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized: Missing or invalid Authorization header.',
      })
    }

    const token = authHeader.split(' ')[1]?.trim()
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized: Bearer token is required.',
      })
    }

    // 1. Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or expired session token.',
      })
    }

    // 2. Load profile row from database table (never trusting user metadata)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, approval_status, member_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return res.status(403).json({
        error: 'Forbidden: User profile not found in database.',
      })
    }

    // 3. Deny by default: Must be role 'admin' AND approval_status 'approved'
    if (profile.role !== 'admin' || profile.approval_status !== 'approved') {
      return res.status(403).json({
        error: 'Forbidden: Access denied. Requires approved administrative credentials.',
      })
    }

    // 4. TOTP MFA enforcement for admins:
    // If admin has enrolled in TOTP, their session must achieve AAL2
    const factors = user.factors || []
    const hasVerifiedTotp = factors.some(
      (f: any) => f.factor_type === 'totp' && f.status === 'verified'
    )

    if (hasVerifiedTotp) {
      const aal = (user as any).app_metadata?.aal || (user as any).aal
      if (aal !== 'aal2') {
        return res.status(403).json({
          error: 'MFA_REQUIRED',
          message: 'Two-factor authentication (TOTP) verification required for admin actions (AAL2).',
        })
      }
    }

    req.user = user
    req.profile = profile
    req.adminProfile = profile
    next()
  } catch (err: any) {
    return res.status(500).json({
      error: 'Internal authorization verification error.',
    })
  }
}

/**
 * Log all administrative actions to public.admin_audit_logs
 */
export async function logAdminAction(params: {
  adminId: string
  adminEmail: string
  action: string
  targetType: string
  targetId?: string
  details?: Record<string, any>
  req?: Request
}) {
  try {
    const ipAddress =
      (params.req?.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      params.req?.socket?.remoteAddress ||
      'unknown'
    const userAgent = params.req?.headers['user-agent'] || 'unknown'

    await supabase.from('admin_audit_logs').insert([
      {
        admin_id: params.adminId,
        admin_email: params.adminEmail,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId || null,
        details: params.details || {},
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    ])
  } catch (err) {
    console.error('Failed to write admin audit log:', err)
  }
}
