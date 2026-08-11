'use client'

import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PaymentFailedPage() {
    const router = useRouter()

    return (
        <main className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

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
                    <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <p className="text-sm uppercase tracking-[0.25em] text-red-400 mb-3">Payment Failed</p>
                    <h1 className="text-4xl font-display font-italic text-foreground mb-4">
                        Something went wrong
                    </h1>
                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        Your payment could not be processed. Please check your payment details and try again, or contact support if the problem persists.
                    </p>
                </motion.div>

                <motion.div
                    className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 mb-8 text-left"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                >
                    <div className="flex gap-3 mb-4">
                        <HelpCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-foreground mb-2">Common reasons for payment failure:</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Insufficient funds in your account</li>
                                <li>• Card declined by your bank</li>
                                <li>• Incorrect card details</li>
                                <li>• Transaction limit exceeded</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 }}
                >
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        <ArrowLeft className="w-4 h-4" /> Try Again
                    </button>
                    <Link
                        href="/#pricing"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
                    >
                        Back to Pricing
                    </Link>
                </motion.div>

                <motion.p
                    className="mt-8 text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.65 }}
                >
                    Need help? <a href="mailto:support@nexora.ai" className="text-primary hover:underline">Contact support</a>
                </motion.p>
            </motion.div>
        </main>
    )
}
