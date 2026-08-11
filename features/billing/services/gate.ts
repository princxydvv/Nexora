import { createServiceClient } from '@/lib/supabase-service'
import { getPlan, canUseDepth, hasReportsRemaining, type PlanId } from '@/features/billing/services/plans'

export interface GateResult {
    allowed: boolean
    reason?: string
    statusCode?: number
    reportsUsed?: number
    reportsLimit?: number
    plan?: PlanId
}

export interface UserUsage {
    plan: PlanId
    reportsUsed: number
    reportsLimit: number
    creditsRemaining: number
    usageResetAt: string | null
    subscriptionStatus: string | null
    currentPeriodEnd: string | null
}

/**
 * Check if a user is allowed to generate a research report.
 * Always runs server-side with service role — cannot be bypassed.
 */
export async function checkResearchGate(
    userId: string,
    depth: string
): Promise<GateResult> {
    const db = createServiceClient()

    const { data: profile, error } = await db
        .from('user_profiles')
        .select('subscription_plan, reports_used, reports_limit, credits_remaining, usage_reset_at')
        .eq('id', userId)
        .single()

    if (error || !profile) {
        return { allowed: false, reason: 'User profile not found', statusCode: 404 }
    }

    const plan = (profile.subscription_plan ?? 'free') as PlanId

    // Security: For paid plans, verify the subscription is actually active.
    // This prevents stale premium access after cancellation/expiry/halt.
    if (plan !== 'free') {
        const { data: sub } = await db
            .from('subscriptions')
            .select('status, current_period_end')
            .eq('user_id', userId)
            .maybeSingle()

        const isActive = sub?.status === 'active'
        const notExpired = !sub?.current_period_end || new Date(sub.current_period_end) > new Date()

        if (!isActive || !notExpired) {
            // Subscription is not active — downgrade to free and deny premium access
            const freeLimit = 5
            await db
                .from('user_profiles')
                .update({
                    subscription_plan: 'free',
                    reports_limit: freeLimit,
                    credits_remaining: freeLimit,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)

            return {
                allowed: false,
                reason: 'Your subscription is no longer active. Please renew to continue using premium features.',
                statusCode: 403,
                plan: 'free',
                reportsUsed: profile.reports_used,
                reportsLimit: freeLimit,
            }
        }
    }

    // Auto-reset usage if the reset date has passed
    if (profile.usage_reset_at && new Date(profile.usage_reset_at) <= new Date()) {
        const planConfig = getPlan(profile.subscription_plan)
        await db
            .from('user_profiles')
            .update({
                reports_used: 0,
                credits_remaining: planConfig.reportsLimit >= 999999 ? 999999 : planConfig.reportsLimit,
                usage_reset_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)

        profile.reports_used = 0
        profile.credits_remaining = planConfig.reportsLimit >= 999999 ? 999999 : planConfig.reportsLimit
    }

    // Check depth permission
    if (!canUseDepth(plan, depth)) {
        return {
            allowed: false,
            reason: `Deep research requires a Pro or Team plan. You are on the ${plan} plan.`,
            statusCode: 403,
            plan,
            reportsUsed: profile.reports_used,
            reportsLimit: profile.reports_limit,
        }
    }

    // Check report limit
    if (!hasReportsRemaining(profile.reports_used, plan)) {
        return {
            allowed: false,
            reason: `You have used all ${profile.reports_limit} reports for this month. Upgrade to Pro for unlimited reports.`,
            statusCode: 429,
            plan,
            reportsUsed: profile.reports_used,
            reportsLimit: profile.reports_limit,
        }
    }

    return {
        allowed: true,
        plan,
        reportsUsed: profile.reports_used,
        reportsLimit: profile.reports_limit,
    }
}

/**
 * Increment report usage after successful generation.
 */
export async function incrementReportUsage(userId: string): Promise<void> {
    const db = createServiceClient()
    await db.rpc('increment_report_usage', { p_user_id: userId })
}

/**
 * Fetch full usage data for billing dashboard.
 */
export async function getUserUsage(userId: string): Promise<UserUsage | null> {
    const db = createServiceClient()

    const { data: profile } = await db
        .from('user_profiles')
        .select('subscription_plan, reports_used, reports_limit, credits_remaining, usage_reset_at')
        .eq('id', userId)
        .single()

    if (!profile) return null

    const { data: sub } = await db
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', userId)
        .maybeSingle()

    return {
        plan: (profile.subscription_plan ?? 'free') as PlanId,
        reportsUsed: profile.reports_used ?? 0,
        reportsLimit: profile.reports_limit ?? 5,
        creditsRemaining: profile.credits_remaining ?? 5,
        usageResetAt: profile.usage_reset_at ?? null,
        subscriptionStatus: sub?.status ?? null,
        currentPeriodEnd: sub?.current_period_end ?? null,
    }
}
