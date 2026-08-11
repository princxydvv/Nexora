import { NextRequest, NextResponse } from 'next/server'
import { createRouteSupabaseClient } from '@/lib/supabase-route-client'
import { createServiceClient } from '@/lib/supabase-service'
import { getPlan } from '@/features/billing/services/plans'

export async function GET(request: NextRequest) {
    const supabase = createRouteSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = createServiceClient()

    const [profileResult, subResult, paymentsResult] = await Promise.all([
        db
            .from('user_profiles')
            .select('subscription_plan, reports_used, reports_limit, credits_remaining, usage_reset_at')
            .eq('id', user.id)
            .single(),
        db
            .from('subscriptions')
            .select('plan, status, started_at, expires_at, current_period_end, razorpay_payment_id, amount')
            .eq('user_id', user.id)
            .maybeSingle(),
        db
            .from('payments')
            .select('id, plan, amount, status, created_at, razorpay_payment_id, razorpay_order_id')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(20),
    ])

    if (profileResult.error || !profileResult.data) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const profile = profileResult.data
    const sub = subResult.data
    const payments = paymentsResult.data ?? []
    const plan = profile.subscription_plan ?? 'free'
    const planConfig = getPlan(plan)

    return NextResponse.json({
        plan,
        planConfig: {
            name: planConfig.name,
            displayPrice: planConfig.displayPrice,
            period: planConfig.period,
            features: planConfig.features,
        },
        usage: {
            reportsUsed: profile.reports_used ?? 0,
            reportsLimit: profile.reports_limit ?? 5,
            creditsRemaining: profile.credits_remaining ?? 5,
            usageResetAt: profile.usage_reset_at ?? null,
            isUnlimited: planConfig.reportsLimit >= 999999,
        },
        subscription: sub
            ? {
                status: sub.status,
                startedAt: sub.started_at,
                expiresAt: sub.expires_at,
                currentPeriodEnd: sub.current_period_end,
                amount: sub.amount,
            }
            : null,
        payments: payments.map((p) => ({
            id: p.id,
            plan: p.plan,
            amount: p.amount,
            status: p.status,
            createdAt: p.created_at,
            paymentId: p.razorpay_payment_id,
            orderId: p.razorpay_order_id,
        })),
    })
}
