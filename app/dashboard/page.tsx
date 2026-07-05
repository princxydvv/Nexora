'use client'

import { motion } from 'framer-motion'
import { Bell, Clock, CreditCard, FileText, LayoutDashboard, Plus, Search, Settings, ShieldCheck, Trash2, UserCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'

const recentReports = [
  {
    id: 1,
    title: 'AI Agent Market in India',
    date: '2 hours ago',
    type: 'Market Research',
  },
  {
    id: 2,
    title: 'SaaS Pricing Strategies',
    date: '5 hours ago',
    type: 'Technology Analysis',
  },
  {
    id: 3,
    title: 'Future of Remote Work',
    date: '1 day ago',
    type: 'Market Research',
  },
]

const stats = [
  { label: 'Reports Created', value: '12' },
  { label: 'Sources Analyzed', value: '847' },
  { label: 'Hours Saved', value: '48' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, userProfile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const displayName = userProfile?.full_name || user?.email || 'Researcher'
  const subscription = userProfile?.subscription_plan || 'free'
  const credits = subscription === 'team' ? 'Unlimited' : subscription === 'pro' ? '250' : '25'

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Welcome back</p>
                <h1 className="text-3xl font-display font-italic text-foreground mb-2">
                  {displayName}
                </h1>
                <p className="text-muted-foreground">
                  Continue your research or start something new
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/profile" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                  <UserCircle2 className="h-4 w-4" /> Profile
                </Link>
                <Link href="/settings" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <button onClick={handleSignOut} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                  <ShieldCheck className="h-4 w-4" /> Logout
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <motion.div className="p-6 bg-card border border-border rounded-lg hover-lift" whileHover={{ y: -2 }}>
            <p className="text-muted-foreground text-sm mb-2">Subscription</p>
            <p className="text-3xl font-display font-italic text-primary capitalize">{subscription}</p>
            <p className="mt-3 text-xs text-muted-foreground">Current access level for your workspace.</p>
          </motion.div>
          <motion.div className="p-6 bg-card border border-border rounded-lg hover-lift" whileHover={{ y: -2 }}>
            <p className="text-muted-foreground text-sm mb-2">Credits</p>
            <p className="text-3xl font-display font-italic text-primary">{credits}</p>
            <p className="mt-3 text-xs text-muted-foreground">Approximate monthly research capacity.</p>
          </motion.div>
          <motion.div className="p-6 bg-card border border-border rounded-lg hover-lift" whileHover={{ y: -2 }}>
            <p className="text-muted-foreground text-sm mb-2">Reports Created</p>
            <p className="text-3xl font-display font-italic text-primary">12</p>
            <p className="mt-3 text-xs text-muted-foreground">Recent generation activity and saved outputs.</p>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Link href="/workspace/new">
            <motion.div
              className="p-8 bg-card border border-border rounded-lg hover-lift cursor-pointer flex items-center gap-4"
              whileHover={{ y: -2 }}
            >
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  New Research
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start a new research project
                </p>
              </div>
            </motion.div>
          </Link>

          <Link href="/workspace">
            <motion.div
              className="p-8 bg-card border border-border rounded-lg hover-lift cursor-pointer flex items-center gap-4"
              whileHover={{ y: -2 }}
            >
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Browse Workspace
                </h3>
                <p className="text-sm text-muted-foreground">
                  View all your research projects
                </p>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div className="mb-12 rounded-2xl border border-border bg-card/70 p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Need more capacity?</p>
              <h2 className="text-2xl font-display font-italic text-foreground">Upgrade your plan or review billing</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/#pricing" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"><CreditCard className="h-4 w-4" /> Upgrade plan</Link>
              <Link href="/workspace/new" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"><LayoutDashboard className="h-4 w-4" /> Create research</Link>
            </div>
          </div>
        </motion.div>

        {/* Recent Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-italic text-foreground">
                Recent Reports
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your latest research projects
              </p>
            </div>
            <Link
              href="/workspace"
              className="text-primary text-sm hover:text-primary/80 transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {recentReports.map((report, index) => (
              <motion.div
                key={report.id}
                className="p-4 bg-card border border-border rounded-lg hover-lift flex items-center justify-between cursor-pointer group"
                whileHover={{ y: -1 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {report.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {report.type} • {report.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors" aria-label="Report details">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors" aria-label="Delete report">
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  )
}
