const RETURN_TO_KEY = 'nexora:returnTo'
const CHECKOUT_PLAN_KEY = 'nexora:checkoutPlan'

export type CheckoutPlan = 'free' | 'pro' | 'team'

export function getSafeReturnPath(candidate: string | null | undefined, fallback = '/dashboard') {
    if (!candidate) {
        return fallback
    }

    const normalized = candidate.trim()
    if (!normalized.startsWith('/')) {
        return fallback
    }

    if (normalized.startsWith('//') || normalized.includes('://')) {
        return fallback
    }

    return normalized
}

export function storeReturnPath(pathname: string) {
    if (typeof window === 'undefined') {
        return
    }

    window.localStorage.setItem(RETURN_TO_KEY, getSafeReturnPath(pathname, '/dashboard'))
}

export function consumeReturnPath(fallback = '/dashboard') {
    if (typeof window === 'undefined') {
        return fallback
    }

    const value = window.localStorage.getItem(RETURN_TO_KEY)
    if (value) {
        window.localStorage.removeItem(RETURN_TO_KEY)
    }

    return getSafeReturnPath(value, fallback)
}

export function storeCheckoutPlan(plan: CheckoutPlan) {
    if (typeof window === 'undefined') {
        return
    }

    window.localStorage.setItem(CHECKOUT_PLAN_KEY, plan)
}

export function consumeCheckoutPlan() {
    if (typeof window === 'undefined') {
        return null
    }

    const value = window.localStorage.getItem(CHECKOUT_PLAN_KEY) as CheckoutPlan | null
    if (value) {
        window.localStorage.removeItem(CHECKOUT_PLAN_KEY)
    }

    return value
}

export function peekCheckoutPlan() {
    if (typeof window === 'undefined') {
        return null
    }

    return (window.localStorage.getItem(CHECKOUT_PLAN_KEY) as CheckoutPlan | null) ?? null
}