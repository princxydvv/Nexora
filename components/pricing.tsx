'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { CheckoutButton } from './payment/checkout-button'
import { consumeCheckoutPlan } from '@/lib/route-intent'

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Get started with Nexora',
    features: [
      '5 reports per month',
      'Basic research',
      'Limited sources',
      'Web access',
    ],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '₹499',
    period: '/month',
    description: 'For serious researchers',
    features: [
      'Unlimited reports',
      'Deep research',
      'AI Chat',
      'Export PDF',
      'Export DOCX',
      'Research History',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    name: 'Team',
    price: '₹1499',
    period: '/month',
    description: 'For teams and organizations',
    features: [
      'Shared workspace',
      'Team analytics',
      'Collaboration tools',
      'Unlimited reports',
      'Deep research',
      'AI Chat',
      'Advanced exports',
      'Dedicated support',
    ],
    highlighted: false,
  },
]

export default function Pricing() {
  const { isAuthenticated, userProfile } = useAuth()
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

  return (
    <section id="pricing" className="py-24 px-4 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl md:text-5xl font-display font-italic text-center mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
          Choose the plan that fits your research needs
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              className={`relative p-8 border rounded-2xl backdrop-blur-sm transition-all ${plan.highlighted
                  ? 'border-primary/60 bg-card/60 ring-2 ring-primary/30 md:scale-105 z-10'
                  : 'border-border bg-card/40'
                }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{
                y: plan.highlighted ? -8 : -4,
                boxShadow: plan.highlighted
                  ? '0 25px 50px rgba(137, 170, 204, 0.2)'
                  : '0 15px 30px rgba(137, 170, 204, 0.08)',
              }}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    {plan.period}
                  </span>
                </div>
              </div>

              <div className="mb-8">
                <CheckoutButton
                  plan={plan.name.toLowerCase() as 'free' | 'pro' | 'team'}
                  autoStart={autoCheckoutPlan === plan.name.toLowerCase()}
                  onSuccess={() => setAutoCheckoutPlan(null)}
                  onError={() => setAutoCheckoutPlan(null)}
                />
              </div>

              <div className="space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <motion.div
                    key={featureIndex}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.1 + featureIndex * 0.05,
                      duration: 0.4,
                    }}
                    viewport={{ once: true }}
                  >
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>

              {userProfile?.subscription_plan === plan.name.toLowerCase() && (
                <div className="mt-6 p-3 rounded-lg bg-primary/10 border border-primary/30 text-center text-sm text-primary">
                  Current Plan
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
