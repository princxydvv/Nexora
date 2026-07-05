import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { paymentService, subscriptionService } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/razorpay/webhook
 * Razorpay webhook handler for payment events
 * 
 * Razorpay sends webhooks for various events:
 * - payment.authorized
 * - payment.failed
 * - payment.captured
 * - order.paid
 * - subscription.activated
 * - subscription.halted
 */
export async function POST(request: NextRequest) {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

        if (!webhookSecret) {
            console.error('RAZORPAY_WEBHOOK_SECRET not configured')
            return NextResponse.json(
                { error: 'Webhook not configured' },
                { status: 500 }
            )
        }

        // Get the signature from headers
        const signature = request.headers.get('x-razorpay-signature')
        if (!signature) {
            return NextResponse.json(
                { error: 'Missing signature' },
                { status: 400 }
            )
        }

        // Get the raw body
        const body = await request.text()

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex')

        if (expectedSignature !== signature) {
            console.error('Invalid webhook signature')
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 403 }
            )
        }

        const event = JSON.parse(body)

        // Handle different webhook events
        switch (event.event) {
            case 'payment.captured':
                await handlePaymentCaptured(event.payload.payment.entity)
                break

            case 'payment.failed':
                await handlePaymentFailed(event.payload.payment.entity)
                break

            case 'order.paid':
                await handleOrderPaid(event.payload.order.entity)
                break

            default:
                break
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error processing webhook:', error)
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        )
    }
}

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(payment: any) {
    try {
        const { id, order_id, notes } = payment
        const userId = notes?.userId

        if (!userId) {
            console.error('No userId in payment notes')
            return
        }

        // Update payment status
        await paymentService.updatePaymentStatus(
            order_id,
            'completed',
            id,
            payment.acquirer_data?.auth_code
        )

    } catch (error) {
        console.error('Error handling payment.captured:', error)
    }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payment: any) {
    try {
        const { id, order_id, notes } = payment

        // Update payment status
        await paymentService.updatePaymentStatus(order_id, 'failed', id)

    } catch (error) {
        console.error('Error handling payment.failed:', error)
    }
}

/**
 * Handle order.paid event
 */
async function handleOrderPaid(order: any) {
    try {
        const { id, notes } = order
        const { userId, planName } = notes

        if (!userId) {
            console.error('No userId in order notes')
            return
        }

        // Update user profile with subscription plan
        await supabase
            .from('user_profiles')
            .update({ subscription_plan: planName })
            .eq('id', userId)

    } catch (error) {
        console.error('Error handling order.paid:', error)
    }
}
