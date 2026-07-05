'use client'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

const faqs = [
  {
    question: 'How accurate are the research reports?',
    answer:
      'Our AI uses advanced verification techniques to ensure sources are credible and current. Every finding is traced back to original sources with full transparency.',
  },
  {
    question: 'Can I export reports in different formats?',
    answer:
      'Yes! With Pro and Team plans, you can export reports as PDF, DOCX, and other formats. Free plan includes basic text export.',
  },
  {
    question: 'Is there a limit to report generation?',
    answer:
      'Free plans allow 5 reports per month. Pro and Team plans offer unlimited reports. All plans regenerate monthly on a rolling basis.',
  },
  {
    question: 'How does the AI Chat feature work?',
    answer:
      'The AI Chat allows you to ask follow-up questions specific to your research report. It uses the verified data from your report to provide accurate answers.',
  },
  {
    question: 'Can teams collaborate on research projects?',
    answer:
      'Yes! The Team plan includes shared workspaces, team analytics, and collaboration tools for seamless research collaboration.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-24 px-4 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl md:text-5xl font-display font-italic text-center mb-16">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="border border-border bg-card rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              viewport={{ once: true }}
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
              >
                <h3 className="text-left text-foreground font-semibold">
                  {faq.question}
                </h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                </motion.div>
              </button>

              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: openIndex === index ? 'auto' : 0,
                  opacity: openIndex === index ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 py-4 text-muted-foreground border-t border-border">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
