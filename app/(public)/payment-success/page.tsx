'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/contexts/auth-context'

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams()
    const { userProfile } = useAuth()
    const [plan, setPlan] = useState<string>('')

    useEffect(() => {
        const p = searchParams.get('plan') ?? userProfile?.subscription_plan ?? 'pro'
        setPlan(p)
    }, [searchParams, userProfile])

    return (
        <main className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                className="relative max-w-lg w-full text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <motion.div
                    className="flex justify-center mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                    <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-primary" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <p className="text-sm uppercase tracking-[0.25em] text-primary mb-3">Payment Successful</p>
                    <h1 className="text-4xl font-display font-italic text-foreground mb-4">
                        Welcome to {plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Pro'}
                    </h1>
                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        Your subscription is now active. Start generating unlimited research reports with deep insights and verified sources.
                    </p>
                </motion.div>

                <motion.div
                    className="rounded-2xl border border-primary/30 bg-primary/5 p-6 mb-8 text-left space-y-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                >
                    <div className="flex items-center gap-3 text-sm text-foreground">
                        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                        Unlimited research reports unlocked
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground">
                        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                        Deep research depth enabled
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground">
                        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                        Markdown & text export available
                    </div>
                </motion.div>

                <motion.div
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 }}
                >
                    <Link
                        href="/workspace/new"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        Start Researching <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/billing"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
                    >
                        View Billing
                    </Link>
                </motion.div>
            </motion.div>
        </main>
    )
}
