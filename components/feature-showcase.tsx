'use client'

import { motion } from 'framer-motion'
import {
  Zap,
  FileText,
  MessageSquare,
  FileDown,
  CheckCircle,
  BarChart3,
} from 'lucide-react'

const features = [
  {
    title: 'AI Deep Research',
    description: 'Powered by advanced AI algorithms that scan thousands of sources',
    icon: Zap,
    span: 'col-span-1 row-span-1',
  },
  {
    title: 'Executive Reports',
    description: 'Get structured, professional reports with all key insights',
    icon: FileText,
    span: 'col-span-1 row-span-1',
  },
  {
    title: 'Chat With Research',
    description: 'Ask follow-up questions and get instant AI-powered responses',
    icon: MessageSquare,
    span: 'col-span-1 row-span-1',
  },
  {
    title: 'Export Anywhere',
    description: 'Download as PDF, DOCX, PPT or share directly',
    icon: FileDown,
    span: 'col-span-1 row-span-1',
  },
  {
    title: 'Citation Verification',
    description: 'Every claim is verified and traced to original sources',
    icon: CheckCircle,
    span: 'col-span-1 row-span-1',
  },
  {
    title: 'Market Intelligence',
    description: 'Real-time insights and trends from across the web',
    icon: BarChart3,
    span: 'col-span-1 row-span-1',
  },
]

export default function FeatureShowcase() {
  return (
    <section id="showcase" className="py-24 px-4 max-w-6xl mx-auto z-10 relative">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        {/* Heading */}
        <motion.h2
          className="text-4xl md:text-5xl font-display font-italic text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Everything you need to research smarter
        </motion.h2>

        <motion.p
          className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          Comprehensive tools designed for modern researchers
        </motion.p>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                className={`${feature.span} p-8 rounded-2xl border border-border bg-card/40 backdrop-blur-sm group hover:bg-card/60 transition-all duration-300`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{
                  y: -8,
                  boxShadow: '0 20px 40px rgba(137, 170, 204, 0.1)',
                }}
              >
                {/* Icon with glow */}
                <div className="relative mb-6">
                  <div
                    className="absolute -inset-3 rounded-full blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                    style={{
                      background:
                        'linear-gradient(90deg, #89AACC 0%, #4E85BF 100%)',
                    }}
                  />
                  <Icon className="w-8 h-8 text-primary relative z-10" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover arrow */}
                <motion.div
                  className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ x: -10 }}
                  whileHover={{ x: 0 }}
                >
                  <span className="text-primary text-sm font-medium">
                    Learn more →
                  </span>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </section>
  )
}
