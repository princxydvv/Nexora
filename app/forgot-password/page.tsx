'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Mail, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { authService } from '@/lib/supabase'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setIsSubmitting(true)
        setError('')
        setMessage('')

        try {
            await authService.resetPassword(email)
            setMessage('Password reset email sent. Check your inbox for the next step.')
        } catch (err: any) {
            setError(err.message || 'Unable to send reset email')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="min-h-screen bg-background px-4 py-12 flex items-center justify-center">
            <motion.div className="w-full max-w-md rounded-3xl border border-border bg-card/70 p-8 backdrop-blur-xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Link href="/signin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
                    <ArrowLeft className="h-4 w-4" /> Back to sign in
                </Link>

                <h1 className="text-3xl font-display font-italic text-foreground mb-3">Reset your password</h1>
                <p className="text-sm text-muted-foreground mb-8">We’ll send a secure link to the email on your account.</p>

                {message && <div className="mb-6 rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-400">{message}</div>}
                {error && <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <label className="block text-sm font-medium text-foreground">Email address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@example.com" className="w-full rounded-lg border border-border bg-background/60 py-3 pl-10 pr-4 text-foreground outline-none transition-colors focus:border-primary" />
                    </div>

                    <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                        {isSubmitting ? 'Sending link...' : 'Send reset link'}
                    </button>
                </form>
            </motion.div>
        </main>
    )
}