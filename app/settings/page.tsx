'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bell, LockKeyhole, MoonStar, Shield, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/auth-context'

const sections = [
    { title: 'Theme', description: 'Choose how the app looks across devices.', icon: MoonStar },
    { title: 'Notifications', description: 'Control product emails and research alerts.', icon: Bell },
    { title: 'Account', description: 'Manage profile details and connected sessions.', icon: Shield },
    { title: 'Privacy', description: 'Review how your research data is stored.', icon: LockKeyhole },
]

export default function SettingsPage() {
    const { userProfile } = useAuth()

    return (
        <main className="min-h-screen bg-background px-4 py-10">
            <div className="mx-auto max-w-5xl">
                <motion.div className="mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">← Back to Dashboard</Link>
                    <h1 className="mt-4 text-4xl font-display font-italic text-foreground">Settings</h1>
                    <p className="mt-2 text-muted-foreground">Tune the experience for your account and workspace.</p>
                </motion.div>

                <div className="grid gap-6 md:grid-cols-2">
                    {sections.map((section) => {
                        const Icon = section.icon
                        return (
                            <motion.section key={section.title} className="rounded-3xl border border-border bg-card/70 p-6 backdrop-blur-xl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                                        <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                                    </div>
                                </div>
                                <div className="mt-6 rounded-2xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                                    Connected account: {userProfile?.email || 'Not loaded yet'}
                                </div>
                            </motion.section>
                        )
                    })}

                    <motion.section className="rounded-3xl border border-red-500/30 bg-red-500/5 p-6 backdrop-blur-xl md:col-span-2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-400"><Trash2 className="h-5 w-5" /></div>
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Delete account</h2>
                                <p className="mt-1 text-sm text-muted-foreground">This is the destructive path and should be backed by a confirmation dialog in a future iteration.</p>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </div>
        </main>
    )
}