'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Calendar, CreditCard, Zap, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/contexts/auth-context'
import { PLANS } from '@/features/billing/services/plans'

function CancelSubscriptionButton() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel your subscription? You will retain access until the end of the current billing period.')) {
            return
        }

        setIsLoading(true)
        setMessage('')

        try {
            const res = await fetch('/api/razorpay/cancel-subscription', {
                method: 'POST',
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to cancel subscription')
            }

            setMessage(data.message || 'Subscription cancelled')
            // Refresh billing data after a short delay
            setTimeout(() => router.refresh(), 1500)
        } catch (err) {
            setMessage(err instanceof Error ? err.message : 'Failed to cancel subscription')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-6 py-3 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cancelling...
                    </span>
                ) : (
                    'Cancel Subscription'
                )}
            </button>
            {message && (
                <p className={`text-xs ${message.includes('Failed') || message.includes('failed') ? 'text-red-400' : 'text-green-400'}`}>
                    {message}
                </p>
            )}
        </div>
    )
}

interface BillingData {
    plan: string
    planConfig: {
        name: string
        displayPrice: string
        period: string
        features: string[]
    }
    usage: {
        reportsUsed: number
        reportsLimit: number
        creditsRemaining: number
        usageResetAt: string | null
        isUnlimited: boolean
    }
    subscription: {
        status: string
        startedAt: string
        expiresAt: string
        currentPeriodEnd: string
        amount: number
    } | null
    payments: Array<{
        id: string
        plan: string
        amount: number
        status: string
        createdAt: string
        paymentId: string
        orderId: string
    }>
}

export default function BillingPage() {
    const { user, userProfile } = useAuth()
    const [data, setData] = useState<BillingData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchBilling = async () => {
            try {
                const res = await fetch('/api/billing')
                if (!res.ok) throw new Error('Failed to load billing data')
                const billing = await res.json()
                setData(billing)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error loading billing')
            } finally {
                setIsLoading(false)
            }
        }

        if (user) fetchBilling()
    }, [user])

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background px-6 py-12">
                <div className="max-w-5xl mx-auto animate-pulse space-y-6">
                    <div className="h-8 w-40 rounded-lg bg-secondary/60" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 rounded-2xl bg-secondary/60" />
                        ))}
                    </div>
                </div>
            </main>
        )
    }

    if (error || !data) {
        return (
            <main className="min-h-screen bg-background px-6 py-12">
                <div className="max-w-5xl mx-auto">
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center">
                        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                        <p className="text-foreground font-medium">{error || 'Failed to load billing'}</p>
                    </div>
                </div>
            </main>
        )
    }

    const resetDate = data.usage.usageResetAt ? new Date(data.usage.usageResetAt) : null
    const periodEnd = data.subscription?.currentPeriodEnd ? new Date(data.subscription.currentPeriodEnd) : null
    const usagePercent = data.usage.isUnlimited ? 100 : Math.round((data.usage.reportsUsed / data.usage.reportsLimit) * 100)

    return (
        <main className="min-h-screen bg-background px-6 py-12">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <Link href="/dashboard" className="text-primary text-sm mb-4 inline-block hover:underline">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-display font-italic text-foreground mb-2">Billing & Subscription</h1>
                    <p className="text-muted-foreground">Manage your plan, usage, and payment methods</p>
                </motion.div>

                {/* Current Plan */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-3xl border border-border bg-card/70 p-8 mb-8 backdrop-blur-xl"
                >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-2">Current Plan</p>
                            <h2 className="text-3xl font-display font-italic text-foreground mb-3">
                                {data.planConfig.name}
                            </h2>
                            <p className="text-2xl text-primary font-semibold mb-4">
                                {data.planConfig.displayPrice}
                                <span className="text-sm text-muted-foreground ml-2">{data.planConfig.period}</span>
                            </p>
                            <ul className="space-y-2">
                                {data.planConfig.features.slice(0, 3).map((feature) => (
                                    <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex flex-col gap-3">
                            {data.plan !== 'team' && (
                                <Link
                                    href="/#pricing"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                                >
                                    Upgrade Plan <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}
                            {data.subscription && data.subscription.status === 'active' && (
                                <CancelSubscriptionButton />
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Usage Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                >
                    <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-muted-foreground">Reports Used</p>
                            <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-3xl font-display font-italic text-foreground mb-2">
                            {data.usage.reportsUsed}/{data.usage.isUnlimited ? '∞' : data.usage.reportsLimit}
                        </p>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-muted-foreground">Credits Remaining</p>
                            <CreditCard className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-3xl font-display font-italic text-foreground">
                            {data.usage.creditsRemaining}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {data.usage.isUnlimited ? 'Unlimited' : 'per month'}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-muted-foreground">Next Reset</p>
                            <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                            {resetDate ? resetDate.toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {resetDate && resetDate > new Date() ? 'in ' + Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) + ' days' : 'Today'}
                        </p>
                    </div>
                </motion.div>

                {/* Subscription Status */}
                {data.subscription && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-2xl border border-border bg-card/70 p-6 mb-8 backdrop-blur-xl"
                    >
                        <h3 className="text-lg font-semibold text-foreground mb-4">Subscription Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <p className="text-foreground font-medium capitalize">
                                    {data.subscription.status === 'active' ? (
                                        <span className="text-green-400">Active</span>
                                    ) : (
                                        <span className="text-yellow-400">{data.subscription.status}</span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Renewal Date</p>
                                <p className="text-foreground font-medium">
                                    {periodEnd ? periodEnd.toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Started</p>
                                <p className="text-foreground font-medium">
                                    {new Date(data.subscription.startedAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Monthly Amount</p>
                                <p className="text-foreground font-medium">
                                    ₹{(data.subscription.amount / 100).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Payment History */}
                {data.payments.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-xl"
                    >
                        <h3 className="text-lg font-semibold text-foreground mb-4">Payment History</h3>
                        <div className="space-y-3">
                            {data.payments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-foreground capitalize">{payment.plan} Plan</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(payment.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-foreground">₹{(payment.amount / 100).toFixed(2)}</p>
                                        <p className="text-xs text-green-400 capitalize">{payment.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    )
}
