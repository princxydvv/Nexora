'use client'

import { motion } from 'framer-motion'
import { Filter, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { fetchResearchOverview } from '@/features/research/lib/client'
import type { ResearchReportSummary } from '@/features/research/types/research'

export default function WorkspacePage() {
  const [reports, setReports] = useState<ResearchReportSummary[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showCompletedOnly, setShowCompletedOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const overview = await fetchResearchOverview()
        setReports(overview.reports)
      } catch (workspaceError) {
        setError(workspaceError instanceof Error ? workspaceError.message : 'Failed to load workspace data')
      } finally {
        setIsLoading(false)
      }
    }

    void loadWorkspace()
  }, [])

  const filteredReports = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return reports.filter((report) => {
      const matchesSearch =
        term.length === 0 ||
        report.title.toLowerCase().includes(term) ||
        report.query.toLowerCase().includes(term) ||
        (report.summary ?? '').toLowerCase().includes(term)

      const matchesStatus = !showCompletedOnly || report.status === 'completed'

      return matchesSearch && matchesStatus
    })
  }, [reports, searchTerm, showCompletedOnly])

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-display font-italic text-foreground mb-2">
              Research Workspace
            </h1>
            <p className="text-muted-foreground">
              Manage all your research projects in one place
            </p>
          </motion.div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 pt-8">
        <div className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Workspace overview</p>
              <h2 className="text-2xl font-display font-italic text-foreground">Everything in one place</h2>
            </div>
            <Link href="/workspace/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              <Plus className="h-4 w-4" /> Start new research
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {error && (
          <motion.div
            className="mb-8 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        <motion.div
          className="flex flex-col md:flex-row gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search reports..."
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowCompletedOnly((current) => !current)}
            className={`px-4 py-3 border rounded-lg transition-colors flex items-center gap-2 ${showCompletedOnly ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-secondary text-foreground'}`}
          >
            <Filter className="w-5 h-5" />
            {showCompletedOnly ? 'Showing completed' : 'Filter completed'}
          </button>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            <div className="h-48 rounded-2xl border border-border bg-card/60" />
            <div className="h-48 rounded-2xl border border-border bg-card/60" />
            <div className="h-48 rounded-2xl border border-border bg-card/60" />
          </div>
        ) : filteredReports.length === 0 ? (
          <motion.div
            className="rounded-3xl border border-border bg-card/60 p-10 text-center backdrop-blur-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-2xl font-display font-italic text-foreground mb-3">No reports found</h3>
            <p className="mx-auto max-w-2xl text-muted-foreground mb-6">
              {reports.length === 0
                ? 'Create your first research report and it will appear here automatically.'
                : 'Try a different search term or clear the completed-only filter.'}
            </p>
            <Link href="/workspace/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              <Plus className="h-4 w-4" /> New Research
            </Link>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {filteredReports.map((project, index) => (
              <motion.div
                key={project.id}
                className="group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Link href={`/report/${project.id}`}>
                  <motion.div
                    className="p-6 bg-card border border-border rounded-lg hover-lift h-full cursor-pointer"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg mb-1 line-clamp-2">
                          {project.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.summary || project.query}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap ml-2 ${project.status === 'completed'
                          ? 'bg-primary/20 text-primary'
                          : project.status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-secondary text-foreground'
                          }`}
                      >
                        {project.status === 'completed'
                          ? 'Ready'
                          : project.status === 'failed'
                            ? 'Failed'
                            : 'In Progress'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        {project.model || 'gemini'}
                      </span>
                      <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        View Report →
                      </span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div className="mt-12 rounded-3xl border border-border bg-card/60 p-8 text-center backdrop-blur-xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-2xl font-display font-italic text-foreground mb-3">No hidden folders or dead ends</h3>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Every research report is stored in Supabase and can be reopened here later without regeneration.
          </p>
        </motion.div>
      </div>
    </main>
  )
}
