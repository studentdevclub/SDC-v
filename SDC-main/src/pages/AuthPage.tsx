import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import SpecularButton from '@/components/ui/SpecularButton'
import { useAuth } from '@/context/AuthContext'
import { classifyEmail } from '@/lib/authRules'
import { CaptchaChallenge } from '@/components/ui/CaptchaChallenge'
import { Mail } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export interface AuthPageProps {
  onAuthSuccess?: (role: 'admin' | 'member', targetPage: string) => void
}

export function AuthPage({ onAuthSuccess }: AuthPageProps = {}) {
  const { login, register, resendConfirmation } = useAuth()
  const [tab, setTab] = useState<'signup' | 'signin'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('Frontend Developer')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [successInfo, setSuccessInfo] = useState<string | null>(null)
  const [showResend, setShowResend] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<string | null>(null)

  const emailClassification = useMemo(() => {
    if (!email || !email.includes('@')) return null
    return classifyEmail(email)
  }, [email])

  const handleResend = async () => {
    if (!email) return
    setResending(true)
    setResendStatus(null)
    const res = await resendConfirmation(email)
    setResending(false)
    if (res.success) {
      setResendStatus(res.message || 'Verification email resent! Please check your inbox.')
    } else {
      setError(res.error || 'Failed to resend confirmation email.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessInfo(null)
    setShowResend(false)

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (!captchaToken) {
      setError('Please complete the security verification (CAPTCHA) below.')
      return
    }

    if (tab === 'signup' && !agreedToTerms) {
      setError('You must agree to the Code of Conduct and Terms & Conditions to create an account.')
      return
    }

    if (tab === 'signup') {
      const assignedRole = emailClassification?.isExternal ? 'member' : emailClassification?.suggestedRole
      const res = await register(name || 'Developer', email, password, assignedRole, captchaToken)

      if (res.error) {
        setError(res.error)
        return
      }

      if (res.requiresEmailConfirmation) {
        setSuccessInfo(res.message || 'Registration successful! A confirmation email has been dispatched. Please check your inbox to verify your email before logging in.')
        setSubmitted(false)
        setShowResend(true)
        return
      }
    } else {
      const res = await login(email, password, captchaToken)

      if (res.error) {
        setError(res.error)
        if (res.requiresEmailConfirmation) {
          setShowResend(true)
        }
        return
      }
    }

    setSubmitted(true)
    const isAdminUser = emailClassification?.suggestedRole === 'admin'
    setTimeout(() => {
      if (onAuthSuccess) {
        onAuthSuccess(isAdminUser ? 'admin' : 'member', 'dashboard')
      } else {
        window.location.hash = '#/dashboard'
      }
    }, 900)
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}
    >
      <motion.div className="section-header flex flex-col items-center" style={{ marginBottom: 32 }} variants={itemVariants}>
        <div className="flex items-center justify-center mb-4">
          <motion.img
            src="/assets/sdc-logo.png"
            alt="SDC Logo"
            className="h-16 w-16 object-contain cursor-pointer"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="section-tag">Member Access</div>
        <h1 className="section-title" style={{ fontSize: 'clamp(30px, 4vw, 44px)' }}>
          {tab === 'signup' ? 'Join the Collective' : 'Welcome Back'}
        </h1>
        <p className="section-desc">
          {tab === 'signup'
            ? 'Sign up with your college email to access workshops, hackathons, and certifications.'
            : 'Access your member dashboard, certificates, and event registrations.'}
        </p>
      </motion.div>

      <motion.div
        style={{
          background: 'rgba(10,10,16,0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '32px 28px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        }}
        whileHover={{ borderColor: 'rgba(255,107,26,0.2)' }}
        transition={{ duration: 0.3 }}
        variants={itemVariants}
      >
        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.03)',
            padding: 4,
            borderRadius: 8,
            marginBottom: 24,
            border: '1px solid var(--card-border)',
          }}
        >
          <motion.button
            type="button"
            onClick={() => { setTab('signup'); setError(''); setAgreedToTerms(false) }}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: tab === 'signup' ? 'var(--accent)' : 'transparent',
              color: tab === 'signup' ? '#050508' : 'var(--text-secondary)',
              transition: 'all 0.25s',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Create Account
          </motion.button>
          <motion.button
            type="button"
            onClick={() => { setTab('signin'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: tab === 'signin' ? 'var(--accent)' : 'transparent',
              color: tab === 'signin' ? '#050508' : 'var(--text-secondary)',
              transition: 'all 0.25s',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Sign In
          </motion.button>
        </div>

        {submitted ? (
          <motion.div style={{ textAlign: 'center', padding: '32px 16px' }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'rgba(61,220,132,0.15)',
                color: 'var(--green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                margin: '0 auto 16px',
                border: '1px solid var(--green)',
              }}
            >
              ✓
            </div>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>
              {tab === 'signup' ? 'Application Received!' : 'Authenticated!'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {tab === 'signup'
                ? 'Your membership application is pending administrator review. Redirecting to check status...'
                : 'Redirecting to your member dashboard...'}
            </p>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {tab === 'signup' && (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255, 170, 0, 0.08)', border: '1px solid rgba(255, 170, 0, 0.25)', color: '#ffd580', fontSize: 12, lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 16 }}>🛡️</span>
                <span>
                  <strong>Membership Policy:</strong> All student applications are reviewed and approved by SDC administrators before internal squad access and repositories are unlocked.
                </span>
              </div>
            )}

            {tab === 'signup' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Full Name
                  </label>
                  <motion.input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                    whileHover={{ borderColor: 'var(--border)' }}
                    whileTap={{ scale: 0.99 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Primary Track
                  </label>
                  <motion.select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  >
                    <option value="Frontend Developer">Frontend & Web3D</option>
                    <option value="Backend Developer">Backend & Distributed Systems</option>
                    <option value="AI / ML Engineer">AI / Machine Learning</option>
                    <option value="UI / UX Designer">UI / UX Design</option>
                    <option value="Open Source Enthusiast">Open Source & DevOps</option>
                  </motion.select>
                </div>
              </motion.div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Email Address
              </label>
              <motion.input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@goa.paruluniversity.ac.in or personal@gmail.com"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  outline: 'none',
                }}
                whileHover={{ borderColor: 'var(--border)' }}
                whileTap={{ scale: 0.99 }}
              />

              {/* Dynamic Email Classification Badge */}
              {emailClassification && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: emailClassification.isUniversity ? 'rgba(255,107,26,0.15)' : 'rgba(99,102,241,0.15)',
                    color: emailClassification.isUniversity ? '#ff9944' : '#a5b4fc',
                    border: `1px solid ${emailClassification.isUniversity ? 'rgba(255,107,26,0.3)' : 'rgba(99,102,241,0.3)'}`,
                    width: 'fit-content',
                  }}>
                    <span>{emailClassification.badgeLabel}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {emailClassification.description}
                  </span>
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <span style={{ fontSize: 11, color: password.length >= 8 ? '#10b981' : '#888' }}>
                  {password ? (password.length >= 8 ? '✓ 8+ chars' : `${password.length}/8 chars`) : 'Min. 8 characters'}
                </span>
              </div>
              <motion.input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: password && password.length < 8 ? '1px solid rgba(255,59,48,0.4)' : '1px solid var(--card-border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  outline: 'none',
                }}
                whileHover={{ borderColor: 'var(--border)' }}
                whileTap={{ scale: 0.99 }}
              />
            </div>

            {/* Terms & Conditions checkbox — signup only */}
            {tab === 'signup' && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ marginTop: 4 }}
              >
                <label
                  htmlFor="terms-checkbox"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <div
                    onClick={() => setAgreedToTerms(!agreedToTerms)}
                    style={{
                      flexShrink: 0,
                      marginTop: 2,
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      border: agreedToTerms
                        ? '1.5px solid #ff6b1a'
                        : '1.5px solid rgba(255,255,255,0.2)',
                      background: agreedToTerms
                        ? 'rgba(255,107,26,0.18)'
                        : 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      boxShadow: agreedToTerms ? '0 0 10px rgba(255,107,26,0.3)' : 'none',
                    }}
                  >
                    {agreedToTerms && (
                      <motion.svg
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 300 }}
                        width="11"
                        height="11"
                        viewBox="0 0 11 11"
                        fill="none"
                      >
                        <path
                          d="M1.5 5.5L4 8L9.5 2.5"
                          stroke="#ff6b1a"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </motion.svg>
                    )}
                  </div>
                  <input
                    id="terms-checkbox"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    I have read and agree to the{' '}
                    <a
                      href="#/guidelines"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 500 }}
                    >
                      Code of Conduct
                    </a>
                    {' '}and{' '}
                    <a
                      href="#/guidelines"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 500 }}
                    >
                      Terms &amp; Conditions
                    </a>
                    .
                  </span>
                </label>
              </motion.div>
            )}

            {/* Anti-Bot Security CAPTCHA Challenge */}
            <div style={{ marginTop: 4 }}>
              <CaptchaChallenge onVerify={(token) => setCaptchaToken(token)} />
            </div>

            {/* Email Confirmation Dispatched Banner */}
            {successInfo && (
              <motion.div
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#34d399',
                  fontSize: 13,
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Mail className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>Confirmation Required</div>
                  <div>{successInfo}</div>
                </div>
              </motion.div>
            )}

            {/* Resend Confirmation Status */}
            {resendStatus && (
              <motion.div
                style={{
                  padding: '10px 14px',
                  borderRadius: 6,
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: '#60a5fa',
                  fontSize: 13,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {resendStatus}
              </motion.div>
            )}

            {/* Error Message & Resend Action */}
            {error && (
              <motion.div
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'rgba(255,59,48,0.1)',
                  border: '1px solid rgba(255,59,48,0.3)',
                  color: '#ff6b6b',
                  fontSize: 13,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
              >
                <div>{error}</div>

                {showResend && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {resending ? 'Resending...' : 'Resend Verification Email'}
                  </button>
                )}
              </motion.div>
            )}

            <SpecularButton
              type="submit"
              size="md"
              radius={12}
              tint="#ff6b1a"
              tintOpacity={0.92}
              textColor="#ffffff"
              lineColor="#ffaa44"
              baseColor="#ff6b1a"
              intensity={1.2}
              shineSize={12}
              shineFade={35}
              thickness={1.2}
              followMouse
              proximity={220}
              className="w-full mt-3 font-semibold text-sm shadow-[0_0_25px_rgba(255,107,26,0.35)] py-3.5"
            >
              <span>{tab === 'signup' ? 'Complete Registration →' : 'Enter Dashboard →'}</span>
            </SpecularButton>


          </motion.form>
        )}
      </motion.div>

      <motion.p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, marginTop: 24 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        By continuing you agree to the{' '}
        <a href="#/guidelines" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
          SDC Community Guidelines
        </a>.
      </motion.p>
    </motion.div>
  )
}

export default AuthPage

