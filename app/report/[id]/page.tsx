'use client'

import { motion } from 'framer-motion'
import { Download, MessageSquare, Share2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const reportSections = [
  {
    title: 'Executive Summary',
    content:
      'The AI agent market in India is experiencing rapid growth with significant opportunities for innovation and investment. Current market size is estimated at $2.5B with projected CAGR of 45% through 2028.',
  },
  {
    title: 'Key Findings',
    content:
      'Enterprise adoption is accelerating, particularly in financial services and customer support sectors. Major players include Rasa, Microsoft, and Google Cloud. Integration with existing systems remains a primary challenge.',
  },
  {
    title: 'Market Opportunities',
    content:
      'Healthcare automation, legal document analysis, and personalized education represent high-growth opportunities. Emerging markets show strong demand for cost-effective AI solutions.',
  },
  {
    title: 'Risks & Challenges',
    content:
      'Regulatory uncertainty, data privacy concerns, and talent scarcity pose significant challenges. Competition from global players may limit market share for local startups.',
  },
  {
    title: 'Action Plan',
    content:
      'Focus on vertical-specific solutions, build partnerships with enterprises, and invest in AI safety research. Prioritize regulatory compliance and data governance.',
  },
]

export default function ReportPage() {
  const params = useParams<{ id: string }>()
  const reportId = params?.id || 'report'
  const reportTitle = reportId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Workspace
            </Link>
            <h1 className="text-4xl font-display font-italic text-foreground mb-2">
              {reportTitle}
            </h1>
            <p className="text-muted-foreground">
              Comprehensive market research report • Generated recently
            </p>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Action Buttons */}
        <motion.div
          className="flex flex-wrap gap-3 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 font-medium">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 text-foreground">
            <Download className="w-4 h-4" />
            Export DOCX
          </button>
          <button className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 text-foreground">
            <MessageSquare className="w-4 h-4" />
            Chat with Report
          </button>
          <button className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 text-foreground">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </motion.div>

        {/* Report Sections */}
        <div className="space-y-8">
          {reportSections.map((section, index) => (
            <motion.section
              key={index}
              className="p-8 bg-card border border-border rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
            >
              <h2 className="text-2xl font-display font-italic text-foreground mb-4">{section.title}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {section.content}
              </p>
            </motion.section>
          ))}
        </div>

        {/* Sources */}
        <motion.section
          className="mt-12 p-8 bg-card border border-border rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-display font-italic text-foreground mb-6">
            Source Citations
          </h2>
          <div className="space-y-4">
            {[
              {
                title: 'Global AI Market Report 2024',
                source: 'Grand View Research',
                url: '#',
              },
              {
                title: 'India AI Adoption Study',
                source: 'McKinsey & Company',
                url: '#',
              },
              {
                title: 'Enterprise AI Market Trends',
                source: 'Gartner',
                url: '#',
              },
            ].map((citation, index) => (
              <div
                key={index}
                className="p-4 bg-secondary/30 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <h3 className="font-medium text-foreground mb-1">
                  {citation.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Source: {citation.source}
                </p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </main>
  )
}
