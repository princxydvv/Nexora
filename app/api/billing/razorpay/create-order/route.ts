import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { PLANS } from '@/features/billing/services/plans'
import { paymentService, subscriptionService } from '@/lib/supabase'
import { razorpayService } from '@/lib/razorpay'

function createSupabaseRouteClient(request: NextRequest, response: NextResponse) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )
}

/**
 * POST /api/razorpay/create-order
 * Create a new Razorpay order for payment
 */
export async function POST(request: NextRequest) {
    try {
        const response = NextResponse.next()
        const supabase = createSupabaseRouteClient(request, response)
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { plan } = await request.json()

        // Validate input
        if (!plan) {
            return NextResponse.json(
                { error: 'Missing required fields: plan' },
                { status: 400 }
            )
        }

        // Check if plan exists
        if (!PLANS[plan as keyof typeof PLANS]) {
            return NextResponse.json(
                { error: 'Invalid plan selected' },
                { status: 400 }
            )
        }

        const planData = PLANS[plan as keyof typeof PLANS]
        const userId = user.id
        const email = user.email ?? ''

        const { data: existingPendingPayment } = await supabase
            .from('payments')
            .select('razorpay_order_id')
            .eq('user_id', userId)
            .eq('plan', plan)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (existingPendingPayment && plan !== 'free') {
            return NextResponse.json({
                success: true,
                orderId: existingPendingPayment.razorpay_order_id,
                amount: planData.priceInPaise,
                plan,
                email,
                reused: true,
            })
        }

        // Free plan doesn't need payment
        if (plan === 'free') {
            // Create subscription directly
            await subscriptionService.createSubscription(
                userId,
                plan,
                'free_subscription',
                'free_subscription',
                0
            )

            // Update user profile
            await supabase
                .from('user_profiles')
                .update({ subscription_plan: plan })
                .eq('id', userId)

            return NextResponse.json({
                success: true,
                plan: 'free',
                message: 'Free plan activated successfully',
                orderId: 'free_subscription',
            })
        }

        // Create Razorpay order for paid plans
        const order = await razorpayService.createOrder(
            planData.priceInPaise,
            userId,
            plan,
            email
        )

        // Save payment record
        await paymentService.createPaymentRecord(
            userId,
            order.id,
            planData.priceInPaise,
            plan
        )

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: planData.priceInPaise,
            plan,
            email,
        })
    } catch (error) {
        console.error('Error creating order:', error)
        // Razorpay SDK throws plain objects, not Error instances.
        const err = error as { statusCode?: number; error?: { code?: string; description?: string }; message?: string }
        const statusCode = err.statusCode ?? 500
        const description = err.error?.description || err.message || 'Failed to create order'
        return NextResponse.json(
            { error: description },
            { status: statusCode }
        )
    }
}
