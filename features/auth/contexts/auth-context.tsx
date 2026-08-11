'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, authService, userService } from '@/lib/supabase'

interface UserProfile {
    id: string
    email: string
    full_name?: string | null
    subscription_plan: 'free' | 'pro' | 'team'
    reports_used?: number
    reports_limit?: number
    credits_remaining?: number
    created_at: string
    updated_at?: string
}

interface AuthContextType {
    user: User | null
    userProfile: UserProfile | null
    isLoading: boolean
    isAuthenticated: boolean
    signUp: (email: string, password: string, fullName?: string) => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const buildFallbackProfile = (user: User): UserProfile => ({
        id: user.id,
        email: user.email ?? '',
        full_name: (user.user_metadata as { full_name?: string })?.full_name ?? null,
        subscription_plan: 'free',
        created_at: user.created_at,
        updated_at: user.updated_at ?? undefined,
    })

    const fetchOrCreateProfile = async (user: User) => {
        const email = user.email ?? ''
        const fullName = (user.user_metadata as { full_name?: string })?.full_name

        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

        if (error) {
            if (error.code === 'PGRST205') {
                return buildFallbackProfile(user)
            }

            console.error('Error loading user profile:', error)
            return buildFallbackProfile(user)
        }

        if (data) {
            return data
        }

        const createResult = await userService.createUserProfile(user.id, email, fullName)
        if (createResult.error) {
            if ((createResult.error as { code?: string })?.code === 'PGRST205') {
                return buildFallbackProfile(user)
            }

            console.error('Error creating user profile:', createResult.error)
            return buildFallbackProfile(user)
        }

        return createResult.data?.[0] ?? null
    }

    // Initialize auth state
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const session = await authService.getSession()
                if (session?.user) {
                    setUser(session.user)
                    const profile = await fetchOrCreateProfile(session.user)
                    setUserProfile(profile)
                }
            } catch (error) {
                console.error('Error initializing auth:', error)
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    setUser(session.user)
                    const profile = await fetchOrCreateProfile(session.user)
                    setUserProfile(profile)
                } else {
                    setUser(null)
                    setUserProfile(null)
                }
            }
        )

        return () => {
            subscription?.unsubscribe()
        }
    }, [])

    const signUp = async (email: string, password: string, fullName?: string) => {
        setIsLoading(true)
        try {
            const { data, error } = await authService.signUpWithEmail(email, password, fullName)
            if (error) throw error

            if (data.user) {
                const profile = await fetchOrCreateProfile(data.user)
                setUser(data.user)
                setUserProfile(profile)
            }
        } catch (error) {
            console.error('Error signing up:', error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const signIn = async (email: string, password: string) => {
        setIsLoading(true)

        try {
            const { data, error } = await authService.signInWithEmail(email, password)

            if (error) {
                console.error('Sign In Error:', error)
                throw error
            }

            if (!data.user) {
                throw new Error('Authentication succeeded but no user was returned')
            }

            setUser(data.user)

            const profile = await fetchOrCreateProfile(data.user)
            setUserProfile(profile)
        } catch (error) {
            console.error('Sign In Error:', error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const signOut = async () => {
        setIsLoading(true)
        try {
            await authService.signOut()
            setUser(null)
            setUserProfile(null)
        } catch (error) {
            console.error('Error signing out:', error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const signInWithGoogle = async () => {
        setIsLoading(true)
        try {
            await authService.signInWithGoogle()
        } catch (error) {
            console.error('Error signing in with Google:', error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const value: AuthContextType = {
        user,
        userProfile,
        isLoading,
        isAuthenticated: !!user,
        signUp,
        signIn,
        signOut,
        signInWithGoogle,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
