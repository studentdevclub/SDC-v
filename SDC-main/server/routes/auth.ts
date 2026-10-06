import { Router } from 'express'
import crypto from 'crypto'
import { supabaseAdmin, supabaseAuth } from '../db.js'
import { requireAuth, AuthenticatedUserRequest } from '../middleware/adminAuth.js'
import { loginLimiter, registerLimiter, resendLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// Proper RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

// Helper to check university email: ONLY @goa.paruluniversity.ac.in is university email, rest are external
function isUniversityEmail(email: string): boolean {
  if (!email || !EMAIL_REGEX.test(email)) return false
  const clean = email.trim().toLowerCase()
  const atIndex = clean.lastIndexOf('@')
  if (atIndex === -1) return false
  const domain = clean.slice(atIndex + 1)
  return domain === 'goa.paruluniversity.ac.in'
}

// ── CAPTCHA Verification & Anti-Replay Store ────────────────
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || process.env.SUPABASE_SERVICE_KEY || 'sdc-security-hmac-salt-key'
const usedCaptchaNonces = new Set<string>()

// Clean up replay cache every 15 minutes
setInterval(() => {
  usedCaptchaNonces.clear()
}, 15 * 60 * 1000)

export function generateCaptchaChallenge() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let text = ''
  for (let i = 0; i < 5; i++) {
    text += chars[Math.floor(Math.random() * chars.length)]
  }
  const nonce = crypto.randomBytes(8).toString('hex')
  const timestamp = Date.now()
  const hmac = crypto
    .createHmac('sha256', CAPTCHA_SECRET)
    .update(`${text}:${nonce}:${timestamp}`)
    .digest('hex')

  return {
    nonce,
    timestamp,
    token: `signed_captcha_${nonce}:${timestamp}:${hmac}`,
    text,
  }
}

async function verifyCaptchaToken(token?: string): Promise<boolean> {
  if (!token || typeof token !== 'string') return false

  // 1. Check Cloudflare Turnstile if secret key is present
  if (process.env.TURNSTILE_SECRET_KEY && !token.startsWith('captcha_verified_') && !token.startsWith('signed_captcha_')) {
    try {
      const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      })
      const data: any = await resp.json()
      return !!data.success
    } catch {
      return false
    }
  }

  // 2. Cryptographic HMAC Token verification: 'signed_captcha_{nonce}:{timestamp}:{hmac}:{answer}'
  if (token.startsWith('signed_captcha_')) {
    try {
      const payload = token.replace('signed_captcha_', '')
      const parts = payload.split(':')
      if (parts.length < 4) return false
      const [nonce, timestampStr, hmac, answer] = parts
      const timestamp = parseInt(timestampStr, 10)
      const now = Date.now()

      if (!nonce || isNaN(timestamp) || !hmac || !answer) return false
      if (now - timestamp > 10 * 60 * 1000 || timestamp - now > 60 * 1000) return false
      if (usedCaptchaNonces.has(nonce)) return false

      const expectedHmac = crypto
        .createHmac('sha256', CAPTCHA_SECRET)
        .update(`${answer.toUpperCase()}:${nonce}:${timestamp}`)
        .digest('hex')

      if (crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'))) {
        usedCaptchaNonces.add(nonce)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // 3. Fallback for client-rendered canvas challenge with replay prevention
  if (token.startsWith('captcha_verified_')) {
    try {
      const b64 = token.replace('captcha_verified_', '')
      const decoded = Buffer.from(b64, 'base64').toString('utf-8')
      const [code, timestampStr, nonce] = decoded.split(':')
      const timestamp = parseInt(timestampStr, 10)
      const now = Date.now()

      if (!code || isNaN(timestamp)) return false
      if (now - timestamp > 10 * 60 * 1000 || timestamp - now > 60 * 1000) return false

      const replayKey = nonce || `${code}:${timestamp}`
      if (usedCaptchaNonces.has(replayKey)) return false
      usedCaptchaNonces.add(replayKey)
      return true
    } catch {
      return false
    }
  }

  return false
}

// ── Captcha Challenge Endpoint ──────────────────────────────
router.get('/captcha-challenge', (_req, res) => {
  res.json(generateCaptchaChallenge())
})

// ── 1. Register New User ────────────────────────────────────
// Always creates user as role='member' and approval_status='pending'
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { email, password, name, captchaToken } = req.body

    // 1. Input Type Checks
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required and must be strings.' })
    }

    // 2. CAPTCHA Verification
    const captchaPassed = await verifyCaptchaToken(captchaToken)
    if (!captchaPassed) {
      return res.status(400).json({ error: 'Security verification (CAPTCHA) failed. Please complete the security puzzle.' })
    }

    // 3. Email Format Check
    const cleanEmail = email.trim().toLowerCase()
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'A valid email address is required.' })
    }

    // 4. Password Policy (8 - 72 characters, bcrypt max)
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ error: 'Password must be between 8 and 72 characters.' })
    }

    // 5. University vs External member classification
    const isUniv = isUniversityEmail(cleanEmail)
    const memberType: 'university' | 'external' = isUniv ? 'university' : 'external'
    const displayName = typeof name === 'string' && name.trim().length > 0
      ? name.trim().slice(0, 100)
      : cleanEmail.split('@')[0].slice(0, 100)

    // 6. Create user in Supabase Auth via isolated anon client
    // Metadata is never trusted for privileges; role is strictly member and approval_status is pending
    const { data, error } = await supabaseAuth.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: displayName,
          role: 'member',
          member_type: memberType,
          approval_status: 'pending',
          applied_at: new Date().toISOString(),
        },
      },
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    const user = data.user
    if (user) {
      // Upsert into public.profiles with Service Role client, checking error explicitly
      const { error: profileErr } = await supabaseAdmin.from('profiles').upsert([
        {
          id: user.id,
          email: cleanEmail,
          full_name: displayName,
          role: 'member',
          approval_status: 'pending',
          member_type: memberType,
        },
      ], { onConflict: 'id' })

      if (profileErr) {
        console.error('Profile upsert failure during registration:', profileErr.message)
      }
    }

    const isAlreadyConfirmed = user?.email_confirmed_at != null

    res.status(201).json({
      success: true,
      requiresEmailConfirmation: !isAlreadyConfirmed,
      approvalStatus: 'pending',
      message: isAlreadyConfirmed
        ? 'Application received! Awaiting administrator approval.'
        : 'Registration received! Please check your email to verify your address.',
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: displayName,
            role: 'member',
            member_type: memberType,
            approval_status: 'pending',
          }
        : null,
    })
  } catch (err: any) {
    console.error('Registration server error:', err)
    res.status(500).json({ error: 'Registration failed. Please try again later.' })
  }
})

// ── 2. Login (Protected with Rate Limiter & Security Checks) ─
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body

    // 1. Input Type Checks
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required and must be strings.' })
    }

    // 2. CAPTCHA verification
    const captchaPassed = await verifyCaptchaToken(captchaToken)
    if (!captchaPassed) {
      return res.status(400).json({ error: 'Security verification (CAPTCHA) failed. Please complete the security puzzle.' })
    }

    const cleanEmail = email.trim().toLowerCase()
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'A valid email address is required.' })
    }

    if (!password || password.length > 72) {
      return res.status(400).json({ error: 'Invalid password format.' })
    }

    // 3. Authenticate against Supabase Auth using isolated client
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return res.status(403).json({
          error: 'Please verify your email address before signing in. Check your inbox for the confirmation link.',
          requiresEmailConfirmation: true,
          email: cleanEmail,
        })
      }
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    if (!data.user) {
      return res.status(401).json({ error: 'Authentication failed. Please check your credentials.' })
    }

    // 4. Load authoritative role and approval_status directly from public.profiles table
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, approval_status, member_type')
      .eq('id', data.user.id)
      .maybeSingle()

    const role = profile?.role || 'member'
    const approvalStatus = profile?.approval_status || 'pending'
    const memberType = profile?.member_type || (isUniversityEmail(cleanEmail) ? 'university' : 'external')
    const displayName = profile?.full_name || cleanEmail.split('@')[0]

    // 5. Block rejected users from receiving active sessions
    if (approvalStatus === 'rejected') {
      return res.status(403).json({
        error: 'Your membership application was declined by the administrator.',
        approval_status: 'rejected',
      })
    }

    // 6. Check TOTP MFA status if enrolled
    const factors = data.user.factors || []
    const hasTotp = factors.some((f: any) => f.factor_type === 'totp' && f.status === 'verified')
    const aal = (data.user as any).app_metadata?.aal || (data.user as any).aal

    res.json({
      success: true,
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: displayName,
        role,
        member_type: memberType,
        approval_status: approvalStatus,
        has_mfa: hasTotp,
        mfa_required: role === 'admin' && hasTotp && aal !== 'aal2',
      },
    })
  } catch (err: any) {
    console.error('Login server error:', err)
    res.status(500).json({ error: 'Login failed. Please try again later.' })
  }
})

// ── 3. Check User Status (Authenticated, Single Source of Truth) ──
// Returns the caller's own profile without accepting arbitrary unauthenticated UUID/email lookups
router.get('/status', requireAuth, async (req: AuthenticatedUserRequest, res) => {
  try {
    const profile = req.profile
    return res.json({
      id: req.user.id,
      email: req.user.email,
      name: profile?.full_name,
      approval_status: profile?.approval_status || 'pending',
      role: profile?.role || 'member',
      member_type: profile?.member_type || 'university',
    })
  } catch (err: any) {
    console.error('Status check error:', err)
    res.status(500).json({ error: 'Failed to retrieve profile status.' })
  }
})

// Optional backward compatibility lookup: caller must be authenticated and only admin can view other users
router.get('/status/:id', requireAuth, async (req: AuthenticatedUserRequest, res) => {
  try {
    const { id } = req.params
    const callerIsAdmin = req.profile?.role === 'admin' && req.profile?.approval_status === 'approved'
    const isSelf = id === req.user.id || id.toLowerCase() === req.user.email?.toLowerCase()

    if (!callerIsAdmin && !isSelf) {
      return res.status(403).json({ error: 'Forbidden: You can only query your own status.' })
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    let query = supabaseAdmin.from('profiles').select('id, email, full_name, role, approval_status, member_type')
    if (isUuid) {
      query = query.eq('id', id)
    } else {
      query = query.ilike('email', id)
    }

    const { data: profile } = await query.maybeSingle()

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found.' })
    }

    return res.json({
      id: profile.id,
      email: profile.email,
      name: profile.full_name,
      approval_status: profile.approval_status || 'pending',
      role: profile.role || 'member',
      member_type: profile.member_type,
    })
  } catch (err: any) {
    console.error('Status check by id error:', err)
    res.status(500).json({ error: 'Failed to retrieve profile status.' })
  }
})

// ── 4. Resend Email Confirmation (Rate Limited, Generic Response) ─
router.post('/resend-confirmation', resendLimiter, async (req, res) => {
  try {
    const { email } = req.body

    if (typeof email !== 'string') {
      return res.status(400).json({ error: 'A valid email address is required.' })
    }

    const cleanEmail = email.trim().toLowerCase()
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'A valid email address is required.' })
    }

    const { error } = await supabaseAuth.auth.resend({
      type: 'signup',
      email: cleanEmail,
    })

    if (error) {
      console.warn('Resend confirmation Supabase note:', error.message)
    }

    // Always return generic response to prevent account enumeration
    res.json({
      success: true,
      message: 'If an account exists with that email address and is unconfirmed, a verification link has been sent.',
    })
  } catch (err: any) {
    console.error('Resend confirmation server error:', err)
    res.status(500).json({ error: 'Failed to process request.' })
  }
})

export default router
