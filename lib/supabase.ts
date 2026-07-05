import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase =
    typeof window !== 'undefined'
        ? createBrowserClient(supabaseUrl, supabaseAnonKey)
        : createClient(supabaseUrl, supabaseAnonKey)

// Auth functions
export const authService = {
    signUpWithEmail: async (email: string, password: string, fullName?: string) => {
        const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
        return await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectTo,
                data: fullName ? { full_name: fullName } : undefined,
            },
        })
    },

    signInWithEmail: async (email: string, password: string) => {
        return await supabase.auth.signInWithPassword({
            email,
            password,
        })
    },

    signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            throw error
        }
    },

    signOut: async () => {
        return await supabase.auth.signOut()
    },

    getCurrentUser: async () => {
        const { data: { user } } = await supabase.auth.getUser()
        return user
    },

    getSession: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        return session
    },

    resetPassword: async (email: string) => {
        return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        })
    },
}

// User profile functions
export const userService = {
    createUserProfile: async (userId: string, email: string, fullName?: string) => {
        return await supabase.from('user_profiles').upsert(
            [
                {
                    id: userId,
                    email,
                    full_name: fullName,
                    subscription_plan: 'free',
                },
            ],
            {
                onConflict: 'id',
            }
        )
    },

    getUserProfile: async (userId: string) => {
        return await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single()
    },

    updateUserProfile: async (userId: string, updates: any) => {
        return await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', userId)
    },
}

// Subscription functions
export const subscriptionService = {
    getSubscriptionStatus: async (userId: string) => {
        return await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single()
    },

    createSubscription: async (
        userId: string,
        plan: string,
        razorpayOrderId: string,
        razorpayPaymentId: string,
        amount: number
    ) => {
        const now = new Date()
        const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

        return await supabase.from('subscriptions').insert([
            {
                user_id: userId,
                plan,
                razorpay_order_id: razorpayOrderId,
                razorpay_payment_id: razorpayPaymentId,
                amount,
                status: 'active',
                started_at: now,
                expires_at: expiryDate,
            },
        ])
    },

    updateSubscription: async (userId: string, updates: any) => {
        return await supabase
            .from('subscriptions')
            .update(updates)
            .eq('user_id', userId)
    },
}

// Payment functions
export const paymentService = {
    createPaymentRecord: async (
        userId: string,
        orderId: string,
        amount: number,
        plan: string
    ) => {
        return await supabase.from('payments').insert([
            {
                user_id: userId,
                razorpay_order_id: orderId,
                amount,
                plan,
                status: 'pending',
                created_at: new Date(),
            },
        ])
    },

    updatePaymentStatus: async (
        orderId: string,
        status: string,
        paymentId?: string,
        signature?: string
    ) => {
        return await supabase
            .from('payments')
            .update({
                status,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature,
                updated_at: new Date(),
            })
            .eq('razorpay_order_id', orderId)
    },

    getPaymentHistory: async (userId: string) => {
        return await supabase
            .from('payments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
    },
}
