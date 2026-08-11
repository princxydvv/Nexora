import { NextRequest, NextResponse } from 'next/server'
import { createRouteSupabaseClient } from '@/lib/supabase-route-client'
import { createServiceClient } from '@/lib/supabase-service'
import { razorpayService } from '@/lib/razorpay'

/**
 * POST /api/razorpay/cancel-subscription
 * Cancel a user's active subscription.
 * For order-based flow, this marks the subscription as cancelled.
 * For subscription-based flow, it also cancels the Razorpay subscription.
 */
export async function POST(request: NextRequest) {
    // 1. Authenticate user
    const supabase = createRouteSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = createServiceClient()

    // 2. Load the user's subscription
    const { data: sub, error: subError } = await db
        .from('subscriptions')
        .select('id, plan, status, razorpay_sub_id, razorpay_subscription_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (subError) {
        return NextResponse.json({ success: false, error: 'Failed to load subscription' }, { status: 500 })
    }

    if (!sub) {
        return NextResponse.json({ success: false, error: 'No active subscription found' }, { status: 404 })
    }

    if (sub.status !== 'active') {
        return NextResponse.json({ success: false, error: 'Subscription is not active' }, { status: 400 })
    }

    // 3. If there's a Razorpay subscription ID, cancel it with Razorpay
    const razorpaySubId = sub.razorpay_sub_id || sub.razorpay_subscription_id
    if (razorpaySubId && razorpaySubId !== 'free_subscription') {
        try {
            await razorpayService.cancelSubscription(razorpaySubId)
        } catch (error) {
            console.error('[cancel-subscription] Failed to cancel Razorpay subscription:', error)
            // Continue — we still mark it cancelled locally
        }
    }

    // 4. Mark subscription as cancelled (keep access until period end)
    const { error: updateError } = await db
        .from('subscriptions')
        .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

    if (updateError) {
        return NextResponse.json({ success: false, error: 'Failed to cancel subscription' }, { status: 500 })
    }

    console.log(`[cancel-subscription] Cancelled subscription for user=${user.id}`)

    return NextResponse.json({
        success: true,
        message: 'Subscription cancelled. You will retain access until the end of the current billing period.',
    })
}