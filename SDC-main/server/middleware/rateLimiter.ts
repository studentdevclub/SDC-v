import type { Request, Response, NextFunction } from 'express'

interface RateLimitRecord {
  timestamps: number[]
}

const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter(t => now - t < 60 * 60 * 1000)
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key)
    }
  }
}, 10 * 60 * 1000)

export function createRateLimiter(options: {
  windowMs: number
  max: number
  message: string
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const key = `${req.baseUrl || ''}${req.path}:${ip}`
    const now = Date.now()

    let record = rateLimitStore.get(key)
    if (!record) {
      record = { timestamps: [] }
      rateLimitStore.set(key, record)
    }

    // Filter timestamps within the current window
    record.timestamps = record.timestamps.filter(t => now - t < options.windowMs)

    if (record.timestamps.length >= options.max) {
      const oldest = record.timestamps[0]
      const retryAfterSeconds = Math.ceil((oldest + options.windowMs - now) / 1000)

      res.setHeader('Retry-After', retryAfterSeconds)
      res.setHeader('X-RateLimit-Limit', options.max)
      res.setHeader('X-RateLimit-Remaining', 0)

      return res.status(429).json({
        error: options.message,
        retryAfter: retryAfterSeconds,
      })
    }

    record.timestamps.push(now)
    res.setHeader('X-RateLimit-Limit', options.max)
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - record.timestamps.length))

    next()
  }
}

// 5 login attempts per 15 minutes
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts from this IP. Please wait 15 minutes before trying again.',
})

// 5 sign-up attempts per 1 hour
export const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many accounts registered from this IP. Please wait an hour before registering again.',
})

// 3 resend confirmation attempts per 15 minutes
export const resendLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many confirmation requests. Please check your spam folder or wait 15 minutes.',
})
