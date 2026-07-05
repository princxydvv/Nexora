'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar, Mail, ShieldCheck, UserCircle2 } from 'lucide-react'
import { useAuth } from '@/context/auth-context'

export default function ProfilePage() {
    const router = useRouter()
    const { user, userProfile, signOut } = useAuth()

    const joinedDate = user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
    }

    return (
        <main className="min-h-screen bg-background px-4 py-10">
            <div className="mx-auto max-w-4xl">
                <motion.div className="mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">← Back to Dashboard</Link>
                    <h1 className="mt-4 text-4xl font-display font-italic text-foreground">Profile</h1>
                    <p className="mt-2 text-muted-foreground">Manage your account identity and security settings.</p>
                </motion.div>

                <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
                    <motion.section className="rounded-3xl border border-border bg-card/70 p-8 backdrop-blur-xl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center gap-4 border-b border-border pb-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-semibold text-primary-foreground">
                                {((userProfile?.full_name || user?.email || 'N').split(' ').map((part) => part[0]).join('').slice(0, 2)).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-foreground">{userProfile?.full_name || 'Your Account'}</h2>
                                <p className="text-sm text-muted-foreground">{userProfile?.subscription_plan || 'free'} plan</p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4">
                            <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 px-4 py-3"><Mail className="h-4 w-4 text-muted-foreground" /> <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm text-foreground">{user?.email}</p></div></div>
                            <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 px-4 py-3"><ShieldCheck className="h-4 w-4 text-muted-foreground" /> <div><p className="text-xs text-muted-foreground">Subscription</p><p className="text-sm text-foreground capitalize">{userProfile?.subscription_plan || 'free'}</p></div></div>
                            <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 px-4 py-3"><Calendar className="h-4 w-4 text-muted-foreground" /> <div><p className="text-xs text-muted-foreground">Joined</p><p className="text-sm text-foreground">{joinedDate}</p></div></div>
                        </div>
                    </motion.section>

                    <motion.section className="rounded-3xl border border-border bg-card/70 p-8 backdrop-blur-xl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                        <h3 className="text-xl font-semibold text-foreground mb-4">Account actions</h3>
                        <div className="space-y-3">
                            <Link href="/settings" className="block rounded-2xl border border-border px-4 py-3 text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5">Settings</Link>
                            <Link href="/workspace/new" className="block rounded-2xl border border-border px-4 py-3 text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5">Create research</Link>
                            <Link href="/dashboard" className="block rounded-2xl border border-border px-4 py-3 text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5">Dashboard</Link>
                            <button onClick={handleSignOut} className="block w-full rounded-2xl border border-red-500/30 px-4 py-3 text-left text-red-400 transition-colors hover:bg-red-500/10">Sign out</button>
                        </div>
                    </motion.section>
                </div>
            </div>
        </main>
    )
}