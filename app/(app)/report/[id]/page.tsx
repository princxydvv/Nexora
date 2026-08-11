'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Copy, Download, ExternalLink, FileText, Share2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { fetchResearchReport } from '@/features/research/lib/client'
import type { ResearchReportRecord } from '@/features/research/types/research'

type ReportParams = {
  id?: string | string[]
}

function normalizeId(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return value ?? ''
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleString()
}

export default function ReportPage() {
  const params = useParams<ReportParams>()
  const reportId = normalizeId(params?.id)
  const [report, setReport] = useState<ResearchReportRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')

  useEffect(() => {
    const loadReport = async () => {
      try {
        const response = await fetchResearchReport(reportId)
        setReport(response.report)
      } catch (reportError) {
        setError(reportError instanceof Error ? reportError.message : 'Failed to load report')
      } finally {
        setIsLoading(false)
      }
    }

    if (reportId) {
      void loadReport()
    } else {
      setError('Missing report id')
      setIsLoading(false)
    }
  }, [reportId])

  const sections = useMemo(() => {
    if (!report?.report_json) {
      return []
    }

    return [
      { title: 'Executive Summary', body: report.report_json.executiveSummary },
      { title: 'Background', body: report.report_json.background },
      { title: 'Current Market', body: report.report_json.currentMarket },
      { title: 'Key Insights', body: report.report_json.keyInsights },
      { title: 'Risks', body: report.report_json.risks },
      { title: 'Opportunities', body: report.report_json.opportunities },
      { title: 'Future Trends', body: report.report_json.futureTrends },
      { title: 'Final Conclusion', body: report.report_json.conclusion },
    ]
  }, [report])

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') {
      return
    }

    await navigator.clipboard.writeText(window.location.href)
    setCopyMessage('Report link copied to clipboard')
    setTimeout(() => setCopyMessage(''), 2500)
  }

  const handleDownloadMarkdown = async () => {
    if (!report?.id || typeof window === 'undefined') {
      return
    }

    try {
      const response = await fetch(`/api/research/${report.id}/download?format=markdown`)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${report.title || 'research-report'}.md`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      setCopyMessage('Report downloaded as Markdown')
      setTimeout(() => setCopyMessage(''), 2500)
    } catch (error) {
      setCopyMessage('Failed to download report')
      setTimeout(() => setCopyMessage(''), 2500)
    }
  }

  const handleDownloadText = async () => {
    if (!report?.id || typeof window === 'undefined') {
      return
    }

    try {
      const response = await fetch(`/api/research/${report.id}/download?format=text`)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${report.title || 'research-report'}.txt`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      setCopyMessage('Report downloaded as Text')
      setTimeout(() => setCopyMessage(''), 2500)
    } catch (error) {
      setCopyMessage('Failed to download report')
      setTimeout(() => setCopyMessage(''), 2500)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-6 py-12">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-6 w-40 rounded-full bg-secondary/60" />
          <div className="h-14 w-2/3 rounded-2xl bg-secondary/60" />
          <div className="h-24 rounded-3xl bg-secondary/60" />
          <div className="h-24 rounded-3xl bg-secondary/60" />
          <div className="h-24 rounded-3xl bg-secondary/60" />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background px-6 py-12 flex items-center justify-center">
        <div className="max-w-xl rounded-3xl border border-border bg-card/80 p-8 text-center backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Report unavailable</p>
          <h1 className="mt-4 text-3xl font-display font-italic text-foreground">Unable to load report</h1>
          <p className="mt-3 text-sm text-muted-foreground">{error}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/workspace" className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground">
              Back to Workspace
            </Link>
            <button onClick={() => window.location.reload()} className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 font-medium text-foreground">
              Retry
            </button>
          </div>
        </div>
      </main>
    )
  }

  const isCompleted = report?.status === 'completed'
  const reportDate = report ? formatDate(report.created_at) : 'Recently'

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-8">
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
              {report?.title || 'Research Report'}
            </h1>
            <p className="text-muted-foreground max-w-3xl">
              {report?.query || 'Stored research report'} • Generated {reportDate}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className={`rounded-full border px-3 py-1 ${isCompleted ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'}`}>
                {report?.status || 'unknown'}
              </span>
              <span className="rounded-full border border-border px-3 py-1">
                Model: {report?.model || 'gemini'}
              </span>
              <span className="rounded-full border border-border px-3 py-1">
                Sources: {report?.sourceCount ?? 0}
              </span>
              <span className="rounded-full border border-border px-3 py-1">
                Tokens: {report?.tokens_used?.toLocaleString() || '0'}
              </span>
            </div>
          </motion.div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          className="flex flex-wrap gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex gap-2">
            <button onClick={handleDownloadMarkdown} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 font-medium">
              <Download className="w-4 h-4" />
              Download MD
            </button>
            <button onClick={handleDownloadText} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 font-medium">
              <Download className="w-4 h-4" />
              Download TXT
            </button>
          </div>
          <button onClick={handleCopyLink} className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 text-foreground">
            <Copy className="w-4 h-4" />
            Copy Link
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 text-foreground">
            <FileText className="w-4 h-4" />
            Print
          </button>
          <button onClick={handleCopyLink} className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 text-foreground">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </motion.div>

        {copyMessage && (
          <motion.div
            className="mb-8 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {copyMessage}
          </motion.div>
        )}

        <div className="space-y-4">
          {sections.map((section, index) => (
            <details
              key={section.title}
              className="group rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-xl"
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-foreground">
                <h2 className="text-2xl font-display font-italic">{section.title}</h2>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground group-open:text-primary">Toggle</span>
              </summary>
              <div className="mt-5">
                {Array.isArray(section.body) ? (
                  <ul className="space-y-3">
                    {section.body.map((item) => (
                      <li key={item} className="rounded-xl border border-border bg-background/50 px-4 py-3 text-muted-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{section.body}</p>
                )}
              </div>
            </details>
          ))}
        </div>

        <motion.section
          className="mt-12 p-8 bg-card border border-border rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-display font-italic text-foreground mb-6">
            Source Citations
          </h2>

          <div className="space-y-4">
            {(report?.report_json?.references ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No references were captured for this report.</p>
            ) : (
              report?.report_json?.references.map((citation) => (
                <a
                  key={`${citation.url}-${citation.title}`}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-secondary/30 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-foreground mb-1">
                        {citation.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        {citation.summary}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {citation.publishedDate || 'Publication date unavailable'}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </a>
              ))
            )}
          </div>
        </motion.section>
      </div>
    </main>
  )
}
