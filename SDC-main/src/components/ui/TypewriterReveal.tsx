import * as React from 'react'
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from 'framer-motion'
import { cn } from '@/lib/utils'
import TextType from '@/components/ui/TextType'

export interface TypewriterRevealProps {
  revealDuration?: number
  className?: string
  onComplete?: () => void
}

export function TypewriterReveal({
  revealDuration = 1000,
  className,
  onComplete,
}: TypewriterRevealProps) {
  const [showSdc, setShowSdc] = React.useState(false)
  const [isRevealing, setIsRevealing] = React.useState(false)
  const [isDone, setIsDone] = React.useState(false)

  // Drive the arc shape from a single 0→1 progress
  const progress = useMotionValue(0)
  const arcPath = useTransform(progress, (p: number) => {
    const edge = 110 - p * 140
    const control = edge + 25
    return `M 0 ${edge} Q 50 ${control} 100 ${edge} L 100 110 L 0 110 Z`
  })

  const triggerReveal = React.useCallback(() => {
    setIsRevealing(true)
    const controls = animate(progress, 1, {
      duration: revealDuration / 1000,
      ease: [0.85, 0, 0.15, 1],
      onComplete: () => {
        setIsDone(true)
        onComplete?.()
      },
    })
    return () => controls.stop()
  }, [progress, revealDuration, onComplete])

  if (isDone) return null

  return (
    <AnimatePresence>
      <motion.div
        key="typewriter-reveal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'fixed inset-0 z-[99998] flex flex-col items-center justify-center bg-[#020204] overflow-hidden select-none',
          className
        )}
      >
        <div className="flex flex-col items-center justify-center overflow-hidden bg-[#020204] px-4 gap-6 sm:gap-8 w-full max-w-5xl">
          {/* Glowing SDC Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center px-4"
          >
            <motion.img
              src="/sdc-logo.png"
              alt="SDC Logo"
              className="w-44 h-44 sm:w-64 sm:h-64 md:w-[360px] md:h-[360px] lg:w-[420px] lg:h-[420px] max-w-[85vw] max-h-[40vh] object-contain select-none cursor-pointer"
              whileHover={{
                rotate: 360,
                transition: {
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'linear',
                },
              }}
            />
          </motion.div>

          {/* Typewriter text sequences */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center text-center max-w-4xl px-4 z-10 gap-3"
          >
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
              <TextType
                text="EVERYTHING STARTS WITH A DREAM"
                typingSpeed={60}
                initialDelay={100}
                pauseDuration={2000}
                loop={false}
                showCursor={!showSdc}
                cursorCharacter="|"
                cursorClassName="text-[#ff6b1a] text-lg sm:text-2xl md:text-4xl lg:text-5xl font-bold ml-1"
                className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-bold tracking-wider uppercase text-white font-bank-gothic drop-shadow-[0_0_40px_rgba(255,107,26,0.45)] text-center leading-snug"
                onTypingComplete={() => {
                  window.setTimeout(() => {
                    setShowSdc(true)
                  }, 700)
                }}
              />

              {showSdc && (
                <TextType
                  text="SDC"
                  typingSpeed={240}
                  initialDelay={80}
                  loop={false}
                  showCursor={true}
                  cursorCharacter="|"
                  cursorClassName="text-[#ff6b1a] text-lg sm:text-2xl md:text-4xl lg:text-5xl font-bold ml-1"
                  className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-bold tracking-[0.18em] uppercase text-[#ff6b1a] font-bank-gothic drop-shadow-[0_0_45px_rgba(255,107,26,0.95)] text-center leading-snug"
                  onTypingComplete={() => {
                    window.setTimeout(() => {
                      triggerReveal()
                    }, 950)
                  }}
                />
              )}
            </div>
          </motion.div>
        </div>

        {/* Rising curved curtain */}
        {isRevealing && (
          <svg
            className="pointer-events-none absolute inset-0 z-30 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <motion.path
              d={arcPath}
              style={{
                fill: '#ffffff',
              }}
            />
          </svg>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default TypewriterReveal
