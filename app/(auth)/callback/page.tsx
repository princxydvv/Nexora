'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { consumeReturnPath, getSafeReturnPath, peekCheckoutPlan } from '@/lib/route-intent'

export default function AuthCallbackPage() {
    const router = useRouter()

    useEffect(() => {
        const handleCallback = async () => {
            try {
                if (typeof window === 'undefined') {
                    router.push('/signin')
                    return
                }

                const params = new URLSearchParams(window.location.search)
                const code = params.get('code')
                const error = params.get('error')
                const errorDescription = params.get('error_description')

                if (error) {
                    console.error('Auth error:', error, errorDescription)
                    router.push(`/signin?error=${encodeURIComponent(errorDescription || error)}`)
                    return
                }

                if (code) {
                    // Exchange code for session
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

                    if (exchangeError) {
                        console.error('Exchange code error:', exchangeError)
                        router.push(`/signin?error=${encodeURIComponent(exchangeError.message)}`)
                        return
                    }

                    const checkoutPlan = peekCheckoutPlan()
                    const nextPath = consumeReturnPath('/dashboard')

                    if (checkoutPlan === 'pro' || checkoutPlan === 'team' || checkoutPlan === 'free') {
                        router.replace('/#pricing')
                        return
                    }

                    router.replace(getSafeReturnPath(nextPath, '/dashboard'))
                    return
                }

                // If there is no code but Supabase stored a session in the hash
                if (window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token')) {
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                    if (!session || sessionError) {
                        console.error('Session retrieval error:', sessionError)
                        router.push(`/signin?error=${encodeURIComponent(sessionError?.message || 'No active session found')}`)
                        return
                    }
                    const nextPath = consumeReturnPath('/dashboard')
                    router.replace(getSafeReturnPath(nextPath, '/dashboard'))
                    return
                }

                // No code or session available
                router.replace('/signin')
            } catch (error) {
                console.error('Callback error:', error)
                router.replace('/signin?error=An error occurred during authentication')
            }
        }

        handleCallback()
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <div className="mb-4 flex justify-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-foreground">Confirming your email...</p>
                <p className="text-muted-foreground text-sm mt-2">Please wait while we complete your authentication.</p>
            </div>
        </div>
    )
}
