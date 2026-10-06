import { useState, useEffect, useRef } from 'react'
import { RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react'

interface CaptchaChallengeProps {
  onVerify: (token: string | null) => void
  disabled?: boolean
}

export function CaptchaChallenge({ onVerify, disabled }: CaptchaChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [captchaText, setCaptchaText] = useState('')
  const [userInput, setUserInput] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState(false)

  // Generate random 5-character alphanumeric captcha
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    let text = ''
    for (let i = 0; i < 5; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaText(text)
    setUserInput('')
    setIsVerified(false)
    setError(false)
    onVerify(null)
  }

  // Draw captcha onto canvas with noise, rotation, and lines
  useEffect(() => {
    generateCaptcha()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !captchaText) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Dark background matching cosmic theme
    ctx.fillStyle = '#0c0a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add noise lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 107, 26, 0.4)' : 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.bezierCurveTo(
        Math.random() * canvas.width, Math.random() * canvas.height,
        Math.random() * canvas.width, Math.random() * canvas.height,
        Math.random() * canvas.width, Math.random() * canvas.height
      )
      ctx.stroke()
    }

    // Add noise dots
    for (let i = 0; i < 35; i++) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
      ctx.beginPath()
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw characters with slight rotation
    ctx.font = 'bold 22px monospace'
    for (let i = 0; i < captchaText.length; i++) {
      ctx.save()
      const char = captchaText[i]
      const x = 16 + i * 22
      const y = 26 + (Math.random() * 6 - 3)
      const angle = (Math.random() * 24 - 12) * (Math.PI / 180)

      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.fillStyle = i % 2 === 0 ? '#ff8c42' : '#ffffff'
      ctx.fillText(char, 0, 0)
      ctx.restore()
    }
  }, [captchaText])

  const handleCheck = (val: string) => {
    setUserInput(val)
    if (val.trim().toUpperCase() === captchaText) {
      setIsVerified(true)
      setError(false)
      // Provide verified captcha proof token
      const token = `captcha_verified_${btoa(captchaText + ':' + Date.now())}`
      onVerify(token)
    } else {
      setIsVerified(false)
      if (val.length >= captchaText.length) {
        setError(true)
      } else {
        setError(false)
      }
      onVerify(null)
    }
  }

  return (
    <div className="w-full flex flex-col gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#ff6b1a]" />
          <span>Security Verification</span>
        </span>
        {isVerified && (
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            ✓ Verified
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <canvas
          ref={canvasRef}
          width={130}
          height={38}
          className="rounded-xl border border-white/15 select-none shrink-0"
        />

        <button
          type="button"
          onClick={generateCaptcha}
          disabled={disabled || isVerified}
          title="Regenerate CAPTCHA"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        <input
          type="text"
          maxLength={5}
          value={userInput}
          disabled={disabled || isVerified}
          onChange={(e) => handleCheck(e.target.value)}
          placeholder="Code"
          className={`flex-1 h-10 px-3 rounded-xl bg-black/50 border text-center text-sm font-mono tracking-widest uppercase text-white placeholder:text-zinc-600 outline-none transition-colors ${
            isVerified
              ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300'
              : error
              ? 'border-rose-500/50 bg-rose-950/20'
              : 'border-white/20 focus:border-[#ff6b1a]'
          }`}
        />
      </div>

      {error && !isVerified && (
        <p className="text-[11px] text-rose-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>Incorrect code. Please try again.</span>
        </p>
      )}
    </div>
  )
}
