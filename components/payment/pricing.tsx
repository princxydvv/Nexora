'use client'

import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { CheckoutButton } from './checkout-button'
import { useEffect, useState } from 'react'
import { PRICING_PLANS } from '@/lib/razorpay'
import { consumeCheckoutPlan } from '@/lib/route-intent'

export default function PricingComponent() {
    const { isAuthenticated, userProfile } = useAuth()
    const router = useRouter()
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [autoCheckoutPlan, setAutoCheckoutPlan] = useState<'free' | 'pro' | 'team' | null>(null)

    useEffect(() => {
        if (!isAuthenticated) {
            return
        }

        const pendingPlan = consumeCheckoutPlan()
        if (pendingPlan) {
            setAutoCheckoutPlan(pendingPlan)
        }
    }, [isAuthenticated])

    const handleSuccess = (orderId: string) => {
        setSuccessMessage('Payment successful! Your subscription has been activated.')
        setTimeout(() => {
            router.push('/dashboard')
        }, 2000)
    }

    const handleError = (error: string) => {
        setErrorMessage(error)
        setTimeout(() => setErrorMessage(''), 5000)
    }

    return (
        <section className="py-24 bg-background px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl font-display font-semibold text-foreground mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Choose the perfect plan for your research needs. Always upgrade or downgrade anytime.
                    </p>
                </motion.div>

                {/* Messages */}
                {successMessage && (
                    <motion.div
                        className="mb-8 p-4 rounded-lg bg-green-500/10 border border-green-500/50 text-green-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {successMessage}
                    </motion.div>
                )}

                {errorMessage && (
                    <motion.div
                        className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {errorMessage}
                    </motion.div>
                )}

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Free Plan */}
                    <motion.div
                        className="rounded-2xl border border-secondary-foreground/20 p-8 bg-card hover:border-primary/50 transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        <h3 className="text-2xl font-semibold text-foreground mb-2">
                            {PRICING_PLANS.free.name}
                        </h3>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-foreground">$0</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>

                        <CheckoutButton
                            plan="free"
                            autoStart={autoCheckoutPlan === 'free'}
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />

                        <div className="mt-8 space-y-4">
                            {PRICING_PLANS.free.features.map((feature, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-muted-foreground text-sm">{feature}</span>
                                </div>
                            ))}
                        </div>

                        {userProfile?.subscription_plan === 'free' && (
                            <div className="mt-6 p-3 rounded-lg bg-primary/10 border border-primary/30 text-center text-sm text-primary">
                                Current Plan
                            </div>
                        )}
                    </motion.div>

                    {/* Pro Plan */}
                    <motion.div
                        className="rounded-2xl border border-primary/50 p-8 bg-card relative md:scale-105 shadow-lg shadow-primary/20"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                                Most Popular
                            </span>
                        </div>

                        <h3 className="text-2xl font-semibold text-foreground mb-2">
                            {PRICING_PLANS.pro.name}
                        </h3>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-foreground">
                                ₹{PRICING_PLANS.pro.displayPrice}
                            </span>
                            <span className="text-muted-foreground">/month</span>
                        </div>

                        <CheckoutButton
                            plan="pro"
                            autoStart={autoCheckoutPlan === 'pro'}
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />

                        <div className="mt-8 space-y-4">
                            {PRICING_PLANS.pro.features.map((feature, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-muted-foreground text-sm">{feature}</span>
                                </div>
                            ))}
                        </div>

                        {userProfile?.subscription_plan === 'pro' && (
                            <div className="mt-6 p-3 rounded-lg bg-primary/10 border border-primary/30 text-center text-sm text-primary">
                                Current Plan
                            </div>
                        )}
                    </motion.div>

                    {/* Team Plan */}
                    <motion.div
                        className="rounded-2xl border border-secondary-foreground/20 p-8 bg-card hover:border-primary/50 transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        <h3 className="text-2xl font-semibold text-foreground mb-2">
                            {PRICING_PLANS.team.name}
                        </h3>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-foreground">
                                ₹{PRICING_PLANS.team.displayPrice}
                            </span>
                            <span className="text-muted-foreground">/month</span>
                        </div>

                        <CheckoutButton
                            plan="team"
                            autoStart={autoCheckoutPlan === 'team'}
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />

                        <div className="mt-8 space-y-4">
                            {PRICING_PLANS.team.features.map((feature, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-muted-foreground text-sm">{feature}</span>
                                </div>
                            ))}
                        </div>

                        {userProfile?.subscription_plan === 'team' && (
                            <div className="mt-6 p-3 rounded-lg bg-primary/10 border border-primary/30 text-center text-sm text-primary">
                                Current Plan
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Info */}
                <motion.div
                    className="mt-16 p-6 rounded-lg bg-secondary border border-secondary-foreground/20 text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <p className="text-muted-foreground">
                        All plans include a 14-day free trial. No credit card required.
                        <br />
                        Cancel anytime. Invoices are issued automatically every billing cycle.
                    </p>
                </motion.div>
            </div>
        </section>
    )
}
