'use client'

import { motion } from 'framer-motion'
import {
  Zap,
  Shield,
  BarChart3,
  MessageSquare,
  Download,
  Folder,
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Deep Research',
    description: 'Advanced AI algorithms scan thousands of sources to provide comprehensive research insights.',
  },
  {
    icon: Shield,
    title: 'Verified Sources',
    description: 'Every finding is traced back to credible sources with full transparency and source attribution.',
  },
  {
    icon: BarChart3,
    title: 'Structured Reports',
    description: 'Get organized research reports with executive summaries, findings, risks, and opportunities.',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat',
    description: 'Ask follow-up questions about your research and get instant AI-powered answers.',
  },
  {
    icon: Download,
    title: 'Export Anywhere',
    description: 'Export your research to PDF, DOCX, or other formats for seamless sharing and collaboration.',
  },
  {
    icon: Folder,
    title: 'Research Workspace',
    description: 'Organize all your research projects in one place with intuitive project management.',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-24 px-4 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl md:text-5xl font-display font-italic text-center mb-4">
          Premium Features
        </h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
          Everything you need to transform raw data into actionable insights
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="p-8 border border-border bg-card rounded-xl hover-lift"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
            >
              <feature.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
