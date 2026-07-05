import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { razorpayService } from '@/lib/razorpay'
import { paymentService, subscriptionService } from '@/lib/supabase'

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
 * POST /api/razorpay/verify-payment
 * Verify Razorpay payment signature and complete subscription
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
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = await request.json()

        // Validate input
        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields for payment verification',
                },
                { status: 400 }
            )
        }

        // Verify payment signature (CRITICAL SECURITY CHECK)
        const isValidSignature = razorpayService.verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        )

        if (!isValidSignature) {
            console.error('Invalid payment signature detected - Fraud attempt?')
            return NextResponse.json(
                {
                    success: false,
                    error: 'Payment verification failed - Invalid signature',
                },
                { status: 403 }
            )
        }

        // Fetch payment details from Razorpay to confirm
        const paymentDetails = await razorpayService.getPaymentDetails(
            razorpay_payment_id
        )

        if (paymentDetails.status !== 'captured') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Payment not captured yet',
                },
                { status: 400 }
            )
        }

        // Load the matching payment row and use server-side data only
        const { data: paymentRow, error: paymentLookupError } = await supabase
            .from('payments')
            .select('*')
            .eq('razorpay_order_id', razorpay_order_id)
            .maybeSingle()

        if (paymentLookupError) {
            return NextResponse.json(
                { success: false, error: 'Failed to load payment record' },
                { status: 500 }
            )
        }

        if (!paymentRow) {
            return NextResponse.json(
                { success: false, error: 'Payment record not found' },
                { status: 404 }
            )
        }

        const plan = paymentRow.plan
        const userId = paymentRow.user_id

        if (paymentRow.status === 'completed' && paymentRow.razorpay_payment_id === razorpay_payment_id) {
            return NextResponse.json({
                success: true,
                message: 'Payment already verified',
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
            })
        }

        // Update payment status in database
        await paymentService.updatePaymentStatus(
            razorpay_order_id,
            'completed',
            razorpay_payment_id,
            razorpay_signature
        )

        // Create or update subscription
        const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()

        if (user.id !== userId) {
            return NextResponse.json(
                { success: false, error: 'Payment record does not belong to this user' },
                { status: 403 }
            )
        }

        if (existingSubscription) {
            // Update existing subscription
            await subscriptionService.updateSubscription(userId, {
                plan,
                razorpay_payment_id,
                status: 'active',
                started_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            })
        } else {
            // Create new subscription
            await subscriptionService.createSubscription(
                userId,
                plan,
                razorpay_order_id,
                razorpay_payment_id,
                Number(paymentDetails.amount)
            )
        }

        // Update user profile
        await supabase
            .from('user_profiles')
            .update({ subscription_plan: plan })
            .eq('id', userId)

        return NextResponse.json({
            success: true,
            message: 'Payment verified and subscription activated successfully',
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
        })
    } catch (error) {
        console.error('Error verifying payment:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to verify payment',
            },
            { status: 500 }
        )
    }
}
