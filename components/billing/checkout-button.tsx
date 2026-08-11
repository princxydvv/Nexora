'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/features/auth/contexts/auth-context'
import { PLANS } from '@/features/billing/services/plans'
import axios from 'axios'
import { storeCheckoutPlan, storeReturnPath } from '@/lib/route-intent'

interface CheckoutProps {
    plan: 'free' | 'pro' | 'team'
    onSuccess?: (orderId: string) => void
    onError?: (error: string) => void
    autoStart?: boolean
}

interface RazorpayWindow extends Window {
    Razorpay: any
}

declare const window: RazorpayWindow

export function CheckoutButton({ plan, onSuccess, onError, autoStart = false }: CheckoutProps) {
    const router = useRouter()
    const { user, userProfile } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const planData = PLANS[plan]
    const autoStartedRef = useRef(false)

    const handleCheckout = async () => {
        if (!user) {
            if (typeof window !== 'undefined') {
                const basePath = window.location.pathname === '/' ? '/' : window.location.pathname
                const returnPath = `${basePath}#pricing`
                storeReturnPath(returnPath)
                storeCheckoutPlan(plan)
                router.push(`/signin?next=${encodeURIComponent(returnPath)}`)
            } else {
                onError?.('Please sign in first')
            }
            return
        }

        setIsLoading(true)

        try {
            // Create order on backend
            const { data } = await axios.post('/api/razorpay/create-order', {
                plan,
            })

            if (plan === 'free') {
                onSuccess?.(data.orderId)
                return
            }

            // Load Razorpay SDK if not already loaded
            if (!window.Razorpay) {
                const script = document.createElement('script')
                script.src = 'https://checkout.razorpay.com/v1/checkout.js'
                script.async = true
                document.body.appendChild(script)

                script.onload = () => {
                    launchRazorpay(data)
                }
            } else {
                launchRazorpay(data)
            }
        } catch (error: any) {
            console.error('Checkout error:', error)
            onError?.(error.response?.data?.error || 'Failed to initiate payment')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!autoStart || autoStartedRef.current || !user) {
            return
        }

        autoStartedRef.current = true
        void handleCheckout()
    }, [autoStart, user])

    const launchRazorpay = (orderData: any) => {
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: orderData.amount,
            currency: 'INR',
            name: 'Nexora',
            description: `${planData.name} Plan`,
            order_id: orderData.orderId,
            prefill: {
                name: userProfile?.full_name || '',
                email: user?.email || '',
            },
            notes: {
                plan,
                userId: user?.id,
            },
            handler: async (response: any) => {
                try {
                    // Verify payment on backend
                    const { data: verifyData } = await axios.post(
                        '/api/razorpay/verify-payment',
                        {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            userId: user?.id,
                            plan,
                        }
                    )

                    if (verifyData.success) {
                        window.location.href = `/payment-success?plan=${plan}`
                    }
                } catch (error: any) {
                    console.error('Payment verification failed:', error)
                    onError?.(error.response?.data?.error || 'Payment verification failed')
                }
            },
            modal: {
                ondismiss: () => {
                    onError?.('Payment cancelled')
                },
            },
            theme: {
                color: '#10b981',
            },
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
    }

    return (
        <motion.button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Processing...
                </div>
            ) : plan === 'free' ? (
                'Start Free'
            ) : (
                `Upgrade to ${planData.name}`
            )}
        </motion.button>
    )
}
