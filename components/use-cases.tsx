'use client'

import { motion } from 'framer-motion'
import {
  BookOpen,
  Lightbulb,
  Search,
  Briefcase,
  Target,
  Users,
} from 'lucide-react'

const useCases = [
  {
    icon: BookOpen,
    title: 'Students',
    description: 'Write better research papers with verified sources and comprehensive analysis.',
  },
  {
    icon: Lightbulb,
    title: 'Startup Founders',
    description: 'Validate market ideas and understand competitive landscape before launch.',
  },
  {
    icon: Search,
    title: 'Researchers',
    description: 'Accelerate literature reviews and data gathering for academic research.',
  },
  {
    icon: Briefcase,
    title: 'Consultants',
    description: 'Deliver comprehensive market research reports to clients faster.',
  },
  {
    icon: Target,
    title: 'Job Seekers',
    description: 'Research companies and industries to prepare better for interviews.',
  },
  {
    icon: Users,
    title: 'Business Teams',
    description: 'Enable team collaboration on shared research projects and insights.',
  },
]

export default function UseCases() {
  return (
    <section className="py-24 px-4 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl md:text-5xl font-display font-italic text-center mb-16">
          Built for Everyone
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              className="p-6 border border-border bg-card rounded-lg hover-lift"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -2 }}
            >
              <useCase.icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {useCase.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {useCase.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
