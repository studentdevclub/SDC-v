import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { MailIcon, MapPinIcon, CheckCircle2, Send } from 'lucide-react'
import { DiscordIcon } from '@/components/ui/DiscordIcon'
import { ContactCard } from '@/components/ui/contact-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const containerVariants: Variants = {
  hidden: { opacity: 0, filter: 'blur(20px)', y: 12 },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: {
      duration: 0.95,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

export function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)

  // Delay loading the video until after the contact page is open and rendered
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoadVideo(true)
    }, 450)

    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) return
    setSent(true)
    setTimeout(() => {
      setName('')
      setEmail('')
      setPhone('')
      setMessage('')
    }, 2400)
  }

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none overflow-hidden my-auto py-2">
      {/* 1. Fullscreen Looping Video Background loaded and revealed after contacts opens */}
      <AnimatePresence>
        {shouldLoadVideo && (
          <motion.div
            key="earth-video-bg"
            className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0, filter: 'blur(28px)', scale: 1.06 }}
            animate={{
              opacity: isVideoReady ? 1 : 0,
              filter: isVideoReady ? 'blur(0px)' : 'blur(28px)',
              scale: isVideoReady ? 1 : 1.06,
            }}
            exit={{ opacity: 0, filter: 'blur(28px)', scale: 1.06 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <video
              src="/earth-loop.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onCanPlay={() => setIsVideoReady(true)}
              onLoadedData={() => setIsVideoReady(true)}
              className="w-full h-full object-cover select-none"
            />
            {/* Subtle cinematic gradient overlay to ensure perfect contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60 pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Floating Centered Contact Layout */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 w-full max-w-3xl mx-auto px-4 flex flex-col items-center justify-center my-auto"
      >
        <motion.div variants={itemVariants} className="w-full flex flex-col items-center justify-center">
          <ContactCard
            title={
              <span>
                Connect with{' '}
                <span className="font-bank-gothic text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b1a] via-[#ff944d] to-[#ffb380] drop-shadow-[0_0_40px_rgba(255,107,26,0.65)]">
                  SDC
                </span>
              </span>
            }
            description="Have questions regarding our hackathons, open-source projects, or interested in collaborating? Send a transmission directly to our student engineering board."
            contactInfo={[
              {
                icon: MailIcon,
                label: 'Direct Email',
                value: 'team@sdc.club',
                href: 'mailto:team@sdc.club',
              },
              {
                icon: DiscordIcon,
                label: 'Community Discord',
                value: 'discord.gg/dWjnVjdCEA · Join Server',
                href: 'https://discord.gg/dWjnVjdCEA',
              },
              {
                icon: MapPinIcon,
                label: 'Campus Lab Hub',
                value: 'Parul University, Goa Campus',
                href: 'http://goa.paruluniversity.ac.in/',
              },
            ]}
          >
            {sent ? (
              <motion.div
                className="flex flex-col items-center justify-center text-center py-10 px-4 w-full"
                initial={{ scale: 0.9, opacity: 0, filter: 'blur(8px)' }}
                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                transition={{ type: 'spring', damping: 15 }}
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500/25 border border-emerald-500/50 text-emerald-400 flex items-center justify-center text-2xl mb-4 shadow-[0_0_30px_rgba(61,220,132,0.45)]">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                  Transmission Dispatched
                </h3>
                <p className="text-sm text-zinc-300 max-w-sm mb-5 leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  Thank you! Our executive board will review and reply to {email || 'your inbox'} within 24 hours.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setSent(false)}
                  className="text-xs sm:text-sm font-mono font-semibold cursor-pointer border-white/25 bg-black/50 hover:bg-white/15 text-white backdrop-blur-md px-6 py-2.5 rounded-xl"
                >
                  Send Another Message
                </Button>
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="w-full max-w-xl mx-auto flex flex-col items-center"
                style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}
              >
                {/* Name Box */}
                <div className="w-full">
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full bg-black/45 border-white/20 focus-visible:ring-white/40 text-white text-sm sm:text-base placeholder:text-zinc-400 rounded-xl h-12 px-4 backdrop-blur-md shadow-sm transition-all focus:border-white/50 text-center placeholder:text-center"
                  />
                </div>

                {/* Email & Phone Boxes with explicit 16px gap */}
                <div
                  className="w-full flex flex-col sm:flex-row"
                  style={{ display: 'flex', gap: '16px', width: '100%' }}
                >
                  <div className="flex-1 w-full">
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full bg-black/45 border-white/20 focus-visible:ring-white/40 text-white text-sm sm:text-base placeholder:text-zinc-400 rounded-xl h-12 px-4 backdrop-blur-md shadow-sm transition-all focus:border-white/50 text-center placeholder:text-center"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <Input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone / Discord"
                      className="w-full bg-black/45 border-white/20 focus-visible:ring-white/40 text-white text-sm sm:text-base placeholder:text-zinc-400 rounded-xl h-12 px-4 backdrop-blur-md shadow-sm transition-all focus:border-white/50 text-center placeholder:text-center"
                    />
                  </div>
                </div>

                {/* Message Box */}
                <div className="w-full">
                  <Textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you have in mind..."
                    className="w-full bg-black/45 border-white/20 focus-visible:ring-white/40 text-white text-sm sm:text-base placeholder:text-zinc-400 min-h-[95px] resize-none rounded-xl p-4 backdrop-blur-md shadow-sm transition-all focus:border-white/50 text-center placeholder:text-center"
                  />
                </div>

                {/* Transmit Button */}
                <div className="w-full pt-1">
                  <Button
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white font-bold text-sm sm:text-base uppercase tracking-wider backdrop-blur-md shadow-md py-3.5 transition-all cursor-pointer rounded-xl flex items-center justify-center gap-2.5 active:scale-[0.99]"
                    type="submit"
                  >
                    <Send className="h-4 w-4 text-zinc-300" />
                    <span>Transmit Message</span>
                  </Button>
                </div>
              </form>
            )}
          </ContactCard>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default ContactPage
