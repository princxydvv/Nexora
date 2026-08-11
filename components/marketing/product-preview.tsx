'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { CheckCircle2, TrendingUp, AlertCircle, Lightbulb, FileText, Link as LinkIcon } from 'lucide-react'
import { useRef } from 'react'

const sections = [
  {
    icon: FileText,
    title: 'Executive Summary',
    description: 'A concise overview of the research topic with key takeaways and market landscape analysis.',
  },
  {
    icon: CheckCircle2,
    title: 'Key Findings',
    description: 'Verified insights extracted from authoritative sources with full citation trails.',
  },
  {
    icon: Lightbulb,
    title: 'Opportunities',
    description: 'Actionable opportunities identified based on market gaps and trends.',
  },
  {
    icon: AlertCircle,
    title: 'Risks & Challenges',
    description: 'Potential obstacles and risk factors you should be aware of.',
  },
  {
    icon: TrendingUp,
    title: 'Action Plan',
    description: 'Concrete next steps tailored to your research goals.',
  },
  {
    icon: LinkIcon,
    title: 'Source Citations',
    description: 'Complete bibliography with verified source links and credibility indicators.',
  },
]

export default function ProductPreview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [100, -100])

  return (
    <section className="py-24 px-4 max-w-6xl mx-auto z-10 relative" ref={containerRef}>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-italic mb-4">
            See the magic happen
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your research report contains everything you need to make informed decisions
          </p>
        </motion.div>

        {/* Mock Dashboard Preview */}
        <motion.div
          className="relative rounded-2xl overflow-hidden border border-border/50"
          style={{ y }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 opacity-0 blur-3xl"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(137, 170, 204, 0.1) 0%, transparent 70%)',
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(11,11,11,0.6) 0%, rgba(11,11,11,0.4) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(137, 170, 204, 0.1)',
            }}
          />

          <div className="relative p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section, index) => {
                const Icon = section.icon
                return (
                  <motion.div
                    key={index}
                    className="group p-6 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    viewport={{ once: true }}
                    whileHover={{
                      y: -8,
                      boxShadow:
                        '0 20px 40px rgba(137, 170, 204, 0.15), inset 0 1px 0 rgba(137, 170, 204, 0.1)',
                    }}
                  >
                    {/* Icon glow */}
                    <div className="relative mb-6">
                      <motion.div
                        className="absolute -inset-3 rounded-lg blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                        style={{
                          background:
                            'linear-gradient(90deg, #89AACC 0%, #4E85BF 100%)',
                        }}
                      />
                      <Icon className="w-6 h-6 text-primary relative z-10" />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {section.description}
                    </p>

                    {/* Hover indicator */}
                    <motion.div
                      className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ x: -10 }}
                      whileHover={{ x: 0 }}
                    >
                      <span className="text-xs text-primary font-medium tracking-wide">
                        EXPLORE →
                      </span>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
