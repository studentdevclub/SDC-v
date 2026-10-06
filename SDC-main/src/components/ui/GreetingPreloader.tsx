import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export type Greeting = {
  text: string
  lang?: string
}

export interface GreetingPreloaderProps {
  greetings?: Greeting[]
  greetingHold?: number
  className?: string
  greetingClassName?: string
  onComplete?: () => void
}

const DEFAULT_GREETINGS: Greeting[] = [
  { text: 'देव बरें करूं', lang: 'kok' },
  { text: 'નમસ્તે', lang: 'gu' },
  { text: 'नमस्ते', lang: 'hi' },
  { text: 'नमस्कार', lang: 'mr' },
  { text: 'నమస్కారం', lang: 'te' },
  { text: 'வணக்கம்', lang: 'ta' },
  { text: 'Bonjour', lang: 'fr' },
  { text: '¡Hola!', lang: 'es' },
  { text: 'こんにちは', lang: 'ja' },
  { text: 'Hello', lang: 'en' },
]

export function GreetingPreloader({
  greetings = DEFAULT_GREETINGS,
  greetingHold = 450,
  className,
  greetingClassName,
  onComplete,
}: GreetingPreloaderProps) {
  const [index, setIndex] = React.useState(0)
  const [isExiting, setIsExiting] = React.useState(false)

  React.useEffect(() => {
    if (isExiting) return

    const isLast = index >= greetings.length - 1
    if (isLast) {
      const timer = window.setTimeout(() => {
        setIsExiting(true)
        window.setTimeout(() => {
          onComplete?.()
        }, 400)
      }, greetingHold + 350)
      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      setIndex((prev) => prev + 1)
    }, greetingHold)

    return () => window.clearTimeout(timer)
  }, [index, greetingHold, greetings.length, isExiting, onComplete])

  const current = greetings[Math.min(index, greetings.length - 1)]

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="greeting-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            'fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#020204] overflow-hidden select-none',
            className
          )}
        >
          {/* Centered multi-lingual greeting with vertical lift */}
          <div className="flex flex-col items-center justify-center -translate-y-5 px-6">
            <AnimatePresence mode="wait">
              {current && (
                <motion.div
                  key={`${index}-${current.text}`}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center justify-center text-center"
                >
                  <span
                    lang={current.lang}
                    className={cn(
                      'text-center text-5xl font-bold tracking-tight text-white drop-shadow-[0_0_35px_rgba(255,107,26,0.35)] sm:text-6xl md:text-7xl lg:text-8xl',
                      greetingClassName
                    )}
                  >
                    {current.text}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SDC Brand subtag at the bottom */}
          <div className="absolute bottom-10 sm:bottom-12 text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-[#8a8599] uppercase text-center px-4">
            Student Developer Club
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default GreetingPreloader
