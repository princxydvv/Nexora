'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function CTABanner() {
  return (
    <section className="py-24 px-4 max-w-6xl mx-auto z-10 relative">
      <motion.div
        className="relative rounded-3xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Background with gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(137, 170, 204, 0.1) 0%, rgba(78, 133, 191, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(137, 170, 204, 0.2)',
          }}
        />

        {/* Animated background elements */}
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
          animate={{
            y: [0, 30, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Content */}
        <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
          <motion.h2
            className="text-4xl md:text-5xl font-display font-italic mb-6 text-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            Start making better decisions with AI research
          </motion.h2>

          <motion.p
            className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            Get your first research report generated in minutes, no credit card required.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link
              href="/workspace/new"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all transform hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              Generate Your First Report
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center justify-center px-8 py-4 border border-primary/50 text-foreground rounded-lg font-medium hover:bg-primary/10 transition-colors"
            >
              View Pricing
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
