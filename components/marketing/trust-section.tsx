'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

const stats = [
  { label: 'Reports Generated', value: '50000', suffix: '+' },
  { label: 'Countries', value: '120', suffix: '+' },
  { label: 'Sources Analyzed', value: '1000000', suffix: '+', format: '1M+' },
  { label: 'User Satisfaction', value: '98', suffix: '%' },
]

const Counter = ({ value, format }: { value: string; format?: string }) => {
  const ref = useRef<HTMLSpanElement>(null)
  const numValue = parseInt(value.replace(/,/g, ''))

  useEffect(() => {
    if (!ref.current) return

    let current = 0
    const increment = Math.ceil(numValue / 50)
    const timer = setInterval(() => {
      current += increment
      if (current >= numValue) {
        current = numValue
        clearInterval(timer)
      }
      if (ref.current) {
        ref.current.textContent = format || current.toLocaleString()
      }
    }, 30)

    return () => clearInterval(timer)
  }, [numValue, format])

  return <span ref={ref}>0</span>
}

export default function TrustSection() {
  return (
    <section className="py-20 px-4 max-w-6xl mx-auto z-10 relative">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        {/* Heading */}
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-display font-italic mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Trusted by Researchers Worldwide
          </motion.h2>
          <motion.p
            className="text-muted-foreground max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Join thousands of researchers, students, and professionals using Nexora daily
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center p-6 rounded-xl border border-border bg-card/30 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, backgroundColor: 'rgba(11, 11, 11, 0.6)' }}
            >
              <div className="text-4xl font-bold gradient-accent mb-2">
                <Counter value={stat.value} format={stat.format} />
                {stat.format ? '' : stat.suffix}
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Personas */}
        <div className="mt-20">
          <motion.h3
            className="text-2xl font-display font-italic text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Trusted by
          </motion.h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '👨‍🎓', label: 'Students' },
              { icon: '🚀', label: 'Founders' },
              { icon: '📊', label: 'Researchers' },
              { icon: '👥', label: 'Teams' },
            ].map((persona, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center gap-4 p-6 rounded-lg border border-border/50 bg-card/20 backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-4xl">{persona.icon}</div>
                <p className="text-foreground font-medium">{persona.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
