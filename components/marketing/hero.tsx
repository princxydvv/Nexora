'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Search, ArrowRight, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'

const placeholders = [
  'Analyze India\'s AI market trends',
  'Research SaaS opportunities 2026',
  'Compare OpenAI vs Anthropic',
  'Startup ideas in Healthcare AI',
  'Web3 adoption patterns',
]

export default function Hero() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [placeholder, setPlaceholder] = useState(placeholders[0])
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)
      setPlaceholder(placeholders[(placeholderIndex + 1) % placeholders.length])
    }, 4000)
    return () => clearInterval(interval)
  }, [placeholderIndex])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  } satisfies Variants

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: 'easeOut' as const },
    },
  } satisfies Variants

  const charVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { delay: i * 0.03, duration: 0.6, ease: 'easeOut' as const },
    }),
  } satisfies Variants

  const headingText = 'Turn research into decisions'

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 px-4 overflow-hidden z-10">
      {/* Background gradient accents */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl"></div>

      <motion.div
        className="max-w-4xl mx-auto text-center z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Main Headline - Character by character reveal */}
        <motion.h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-italic leading-tight mb-6 text-balance">
          {headingText.split('').map((char, i) => (
            <motion.span
              key={i}
              custom={i}
              variants={charVariants}
              initial="hidden"
              animate="visible"
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Nexora researches the web, verifies sources, and delivers executive summaries, market insights, opportunities, risks, and action plans.
        </motion.p>

        {/* Search Input with glow and placeholder animation */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 mb-12 max-w-2xl mx-auto">
          <div
            className={`flex-1 relative transition-all duration-300 ${isFocused ? 'ring-2 ring-primary/50 rounded-lg' : ''
              }`}
            style={{
              boxShadow: isFocused
                ? '0 0 30px rgba(137, 170, 204, 0.2)'
                : '0 0 0px transparent',
            }}
          >
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-lg focus:outline-none text-foreground placeholder:text-muted-foreground transition-all"
            />
          </div>
          <motion.button
            type="button"
            onClick={() => {
              const topic = query.trim()
              const url = topic
                ? `/workspace/new?topic=${encodeURIComponent(topic)}`
                : '/workspace/new'
              router.push(url)
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 30px rgba(137, 170, 204, 0.4)',
            }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            Generate
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {/* Trust Badge with animation */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Trusted by students, founders, analysts and researchers worldwide.
          </p>
          <div className="flex gap-8 justify-center flex-wrap">
            <span className="text-xs text-muted-foreground opacity-60">50K+ Reports</span>
            <span className="text-xs text-muted-foreground opacity-60">120+ Countries</span>
            <span className="text-xs text-muted-foreground opacity-60">98% Satisfaction</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
