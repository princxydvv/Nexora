'use client'

import { motion } from 'framer-motion'
import { Filter, Plus, Search } from 'lucide-react'
import Link from 'next/link'

const projects = [
  {
    id: 1,
    title: 'AI Agent Market in India',
    description: 'Market analysis and opportunities',
    status: 'completed',
    type: 'Market Research',
  },
  {
    id: 2,
    title: 'SaaS Pricing Strategies',
    description: 'Competitive analysis of pricing models',
    status: 'completed',
    type: 'Technology Analysis',
  },
  {
    id: 3,
    title: 'Future of Remote Work',
    description: 'Trends and implications for 2024',
    status: 'completed',
    type: 'Market Research',
  },
  {
    id: 4,
    title: 'Web3 Adoption Rates',
    description: 'Current statistics and adoption metrics',
    status: 'in-progress',
    type: 'Technology Analysis',
  },
  {
    id: 5,
    title: 'Global Climate Initiatives',
    description: 'Environmental policies and impact',
    status: 'completed',
    type: 'Policy Research',
  },
  {
    id: 6,
    title: 'EdTech Market Growth',
    description: 'Education technology opportunities',
    status: 'completed',
    type: 'Market Research',
  },
]

export default function WorkspacePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
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
            <Link href="/workspace/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"><Plus className="h-4 w-4" /> Start new research</Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search and Filters */}
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
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button className="px-4 py-3 bg-card border border-border rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 text-foreground">
            <Filter className="w-5 h-5" />
            Filter
          </button>
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {projects.map((project, index) => (
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
                        {project.description}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap ml-2 ${project.status === 'completed'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-secondary text-foreground'
                        }`}
                    >
                      {project.status === 'completed' ? 'Ready' : 'In Progress'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {project.type}
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

        <motion.div className="mt-12 rounded-3xl border border-border bg-card/60 p-8 text-center backdrop-blur-xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-2xl font-display font-italic text-foreground mb-3">No hidden folders or dead ends</h3>
          <p className="mx-auto max-w-2xl text-muted-foreground">Each research card opens a report directly, and the new research flow returns you to the same workspace when you are done.</p>
        </motion.div>
      </div>
    </main>
  )
}
