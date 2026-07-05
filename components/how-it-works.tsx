'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRef } from 'react'

const steps = [
  {
    number: '01',
    title: 'Enter Topic',
    description: 'Tell Nexora what you want to research in plain English.',
  },
  {
    number: '02',
    title: 'AI Researches Sources',
    description: 'Our AI scans thousands of sources to gather comprehensive information.',
  },
  {
    number: '03',
    title: 'Generates Structured Report',
    description: 'Get a professionally organized report with all key information.',
  },
  {
    number: '04',
    title: 'Chat, Save & Export',
    description: 'Ask follow-up questions, save your research, and export in any format.',
  },
]

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start center', 'end center'],
  })

  const lineScaleY = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section
      id="how-it-works"
      className="py-24 px-4 max-w-6xl mx-auto z-10 relative"
      ref={sectionRef}
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <motion.h2
          className="text-4xl md:text-5xl font-display font-italic text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          How It Works
        </motion.h2>

        <motion.p
          className="text-center text-muted-foreground mb-16 max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          Transform any topic into structured intelligence in 4 simple steps
        </motion.p>

        {/* Timeline */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative">
          {/* Progress line for desktop */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-border/50">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/50"
              style={{ scaleX: lineScaleY, transformOrigin: 'left' }}
            />
          </div>

          {steps.map((step, index) => (
            <div key={index} className="flex-1 relative">
              {/* Step */}
              <motion.div
                className="bg-card border border-border rounded-xl p-8 backdrop-blur-sm group hover:border-primary/50 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{
                  y: -8,
                  boxShadow: '0 20px 40px rgba(137, 170, 204, 0.15)',
                }}
              >
                {/* Number with glow */}
                <div className="relative mb-6">
                  <div
                    className="absolute -inset-2 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                    style={{
                      background:
                        'linear-gradient(90deg, #89AACC 0%, #4E85BF 100%)',
                    }}
                  />
                  <div className="text-5xl font-bold text-primary/40 font-display relative z-10">
                    {step.number}
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>

              {/* Arrow connector */}
              {index < steps.length - 1 && (
                <>
                  {/* Desktop arrow */}
                  <motion.div
                    className="hidden lg:flex absolute -right-5 top-24 z-20"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 + 0.2, duration: 0.6 }}
                    viewport={{ once: true }}
                  >
                    <div className="w-10 h-10 bg-card border border-primary/40 rounded-full flex items-center justify-center group hover:bg-primary/20 transition-colors">
                      <ArrowRight className="w-5 h-5 text-primary" />
                    </div>
                  </motion.div>

                  {/* Mobile separator */}
                  <motion.div
                    className="lg:hidden h-8 w-1 bg-gradient-to-b from-primary to-primary/30 mx-auto my-4"
                    initial={{ opacity: 0, scaleY: 0 }}
                    whileInView={{ opacity: 1, scaleY: 1 }}
                    transition={{ delay: index * 0.15 + 0.2, duration: 0.6 }}
                    viewport={{ once: true }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
