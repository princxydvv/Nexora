import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase-service'
import { getPlan, isValidPlan, type PlanId } from '@/features/billing/services/plans'

const LOG_PREFIX = '[Razorpay Webhook]'

function log(message: string, data?: Record<string, unknown>) {
    if (data) {
        console.log(`${LOG_PREFIX} ${message}`, JSON.stringify(data))
    } else {
        console.log(`${LOG_PREFIX} ${message}`)
    }
}

function logError(message: string, error: unknown) {
    console.error(`${LOG_PREFIX} ${message}`, error instanceof Error ? error.message : String(error))
}

/**
 * Verify webhook signature using HMAC-SHA256
 * IMPORTANT: Verify against RAW body, not parsed JSON
 */
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex')

        // Use timing-safe comparison to prevent timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(signature)
        )
    } catch {
        return false
    }
}

/**
 * Check if event has already been processed (idempotency)
 * Returns true if event was already processed, false if new
 */
async function isEventProcessed(db: ReturnType<typeof createServiceClient>, eventId: string): Promise<boolean> {
    const { data } = await db
        .from('webhook_events')
        .select('id')
        .eq('event_id', eventId)
        .maybeSingle()

    return !!data
}

/**
 * Mark event as processed
 */
async function markEventProcessed(
    db: ReturnType<typeof createServiceClient>,
    eventId: string,
    eventType: string
): Promise<void> {
    const { error } = await db
        .from('webhook_events')
        .insert({ event_id: eventId, event_type: eventType })

    if (error) {
        // If the event was already inserted (race condition), that's fine
        if (error.code === '23505') {
            log('Event already marked as processed (race condition)', { eventId })
            return
        }
        throw error
    }
}

/**
 * Get period end date (30 days from now)
 */
function getPeriodEnd(): string {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * Resolve the plan from a payment record, falling back to a safe default.
 * Never trusts client-supplied plan values directly.
 */
function resolvePlan(plan: string | undefined | null): PlanId {
    if (plan && isValidPlan(plan)) {
        return plan
    }
    return 'free'
}

/**
 * Verify that the payment amount matches the expected plan price.
 * Prevents tampering where a user pays for a cheaper plan but claims a premium one.
 */
function amountMatchesPlan(amountPaise: number | undefined | null, plan: PlanId): boolean {
    if (plan === 'free') return true
    const expected = getPlan(plan).priceInPaise
    // Allow small tolerance for currency conversion rounding
    return Math.abs((amountPaise ?? 0) - expected) <= 1
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle payment.captured event
 * Sent when a payment is successfully captured
 * This is the PRIMARY event for the order-based flow.
 */
async function handlePaymentCaptured(entity: Record<string, unknown>) {
    const db = createServiceClient()
    const orderId = entity.order_id as string | undefined
    const paymentId = entity.id as string
    const amount = entity.amount as number | undefined
    const notes = (entity.notes ?? {}) as Record<string, string>
    const userId = notes.userId

    log('Processing payment.captured', { orderId, paymentId, userId: userId ? 'present' : 'missing' })

    if (!orderId) {
        logError('Missing order_id in payment.captured', entity)
        throw new Error('Missing order_id in payment.captured webhook')
    }

    // Load the payment record to get user_id, plan, and expected amount
    let { data: payment, error: paymentError } = await db
        .from('payments')
        .select('user_id, plan, amount, status, razorpay_payment_id')
        .eq('razorpay_order_id', orderId)
        .maybeSingle()

    // RACE CONDITION HANDLING: If payment record doesn't exist, try to create it from webhook data
    // This handles the case where webhook arrives before verify-payment creates the record
    if (paymentError || !payment) {
        log('Payment record not found — checking if we can create it from webhook data', { orderId })

        if (!userId) {
            logError('Cannot create payment record: userId missing in webhook notes and no existing record', {
                orderId,
                paymentId,
            })
            // Throw error to trigger Razorpay retry (returns 500)
            throw new Error(`Payment record not found for orderId: ${orderId} and userId missing in webhook`)
        }

        // Create payment record from webhook data (idempotent — will fail if already exists)
        const planFromNotes = resolvePlan(notes.planName)
        const amountPaise = amount ?? getPlan(planFromNotes).priceInPaise

        const { data: newPayment, error: createError } = await db
            .from('payments')
            .insert({
                user_id: userId,
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                amount: amountPaise,
                plan: planFromNotes,
                status: 'completed',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select('user_id, plan, amount, status, razorpay_payment_id')
            .maybeSingle()

        if (createError || !newPayment) {
            // If it's a unique constraint violation, the record was just created by another request
            if (createError?.code === '23505') {
                log('Payment record created by concurrent request, reloading', { orderId })
                const { data: reloadedPayment } = await db
                    .from('payments')
                    .select('user_id, plan, amount, status, razorpay_payment_id')
                    .eq('razorpay_order_id', orderId)
                    .maybeSingle()

                if (!reloadedPayment) {
                    throw new Error(`Payment record creation race condition for orderId: ${orderId}`)
                }
                payment = reloadedPayment
            } else {
                logError('Failed to create payment record from webhook', createError)
                throw new Error(`Failed to create payment record: ${createError?.message || 'unknown error'}`)
            }
        } else {
            log('Payment record created from webhook data', { orderId, userId })
            payment = newPayment
        }
    }

    // Resolve the plan from the payment record (server-side source of truth)
    const plan = resolvePlan(payment!.plan)

    // IDEMPOTENCY: If already completed with same paymentId, skip duplicate processing
    if (payment!.status === 'completed' && payment!.razorpay_payment_id === paymentId) {
        log('Payment already completed, skipping duplicate processing', { orderId, paymentId })
        return
    }

    // Security: verify the captured amount matches the plan price
    if (!amountMatchesPlan(amount, plan)) {
        logError('Payment amount does not match plan price — possible tampering', {
            orderId,
            plan,
            capturedAmount: amount,
            expectedAmount: getPlan(plan).priceInPaise,
        })
        // Do NOT activate the subscription. Mark payment as failed to flag it.
        await db
            .from('payments')
            .update({
                status: 'failed',
                razorpay_payment_id: paymentId,
                updated_at: new Date().toISOString(),
            })
            .eq('razorpay_order_id', orderId)
        // Throw error to prevent marking webhook as processed
        throw new Error(`Amount mismatch for orderId: ${orderId}`)
    }

    // Update payment status
    const { error: updateError } = await db
        .from('payments')
        .update({
            status: 'completed',
            razorpay_payment_id: paymentId,
            updated_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', orderId)

    if (updateError) {
        logError('Failed to update payment status', updateError)
        throw updateError
    }

    // Activate the subscription using the payment record's user_id (server-side)
    const targetUserId = userId || payment!.user_id
    if (!targetUserId) {
        logError('Could not determine user for payment', { orderId })
        throw new Error(`Cannot determine user for orderId: ${orderId}`)
    }

    await activateUserSubscription(db, targetUserId, plan, orderId, paymentId, payment!.amount ?? 0)
}

/**
 * Handle payment.failed event
 * Sent when a payment attempt fails
 * IMPORTANT: Never grant premium access on failed payment.
 */
async function handlePaymentFailed(entity: Record<string, unknown>) {
    const db = createServiceClient()
    const orderId = entity.order_id as string | undefined
    const paymentId = entity.id as string
    const errorCode = entity.error_code as string | undefined

    log('Processing payment.failed', { orderId, errorCode })

    if (!orderId) {
        throw new Error('Missing order_id in payment.failed webhook')
    }

    const { error } = await db
        .from('payments')
        .update({
            status: 'failed',
            razorpay_payment_id: paymentId,
            updated_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', orderId)

    if (error) {
        logError('Failed to update payment status to failed', error)
        throw error
    }

    log('Payment marked as failed', { orderId })
}

/**
 * Handle order.paid event
 * Sent when an order is fully paid (order-based flow)
 */
async function handleOrderPaid(entity: Record<string, unknown>) {
    const db = createServiceClient()
    const orderId = entity.id as string
    const amount = entity.amount as number | undefined
    const notes = (entity.notes ?? {}) as Record<string, string>
    const userId = notes.userId

    log('Processing order.paid', { orderId, userId: userId ? 'present' : 'missing' })

    if (!orderId) return

    // Load payment record
    const { data: payment, error: paymentError } = await db
        .from('payments')
        .select('user_id, plan, amount, status')
        .eq('razorpay_order_id', orderId)
        .maybeSingle()

    if (paymentError || !payment) {
        logError('Payment record not found for orderId', orderId)
        return
    }

    const plan = resolvePlan(payment.plan)

    // Security: verify amount matches plan price
    if (!amountMatchesPlan(amount, plan)) {
        logError('Order amount does not match plan price — possible tampering', {
            orderId,
            plan,
            orderAmount: amount,
            expectedAmount: getPlan(plan).priceInPaise,
        })
        return
    }

    // Update payment status
    await db
        .from('payments')
        .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', orderId)

    const targetUserId = userId || payment.user_id
    if (!targetUserId) {
        logError('Could not determine user for order', { orderId })
        return
    }

    await activateUserSubscription(db, targetUserId, plan, orderId, '', payment.amount ?? 0)
}

/**
 * Handle subscription.activated event
 * Sent when a subscription is activated (subscription-based flow)
 */
async function handleSubscriptionActivated(entity: Record<string, unknown>) {
    const db = createServiceClient()
    const subscriptionId = entity.id as string
    const notes = (entity.notes ?? {}) as Record<string, string>
    const userId = notes.userId
    const plan = resolvePlan(notes.plan)

    log('Processing subscription.activated', { subscriptionId, userId: userId ? 'present' : 'missing' })

    if (!userId) {
        logError('Missing userId in subscription.activated notes', {})
        return
    }

    const periodEnd = getPeriodEnd()
    const planConfig = getPlan(plan)
    const limit = planConfig.reportsLimit >= 999999 ? 999999 : planConfig.reportsLimit

    // Update subscription
    const { error: subError } = await db
        .from('subscriptions')
        .update({
            status: 'active',
            razorpay_sub_id: subscriptionId,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

    if (subError) {
        logError('Failed to update subscription', subError)
        throw subError
    }

    // Update user profile
    const { error: profileError } = await db
        .from('user_profiles')
        .update({
            subscription_plan: plan,
            reports_limit: limit,
            credits_remaining: limit,
            reports_used: 0,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

    if (profileError) {
        logError('Failed to update user profile', profileError)
        throw profileError
    }

    log('Subscription activated successfully', { userId, plan })
}

/**
 * Handle subscription.charged event
 * Sent when a subscription payment is successful (renewal)
 */
async function handleSubscriptionCharged(entity: Record<string, unknown>) {
    const db = createServiceClient()
    const subscriptionId = entity.id as string
    const notes = (entity.notes ?? {}) as Record<string, string>
    const userId = notes.userId

    log('Processing subscription.charged', { subscriptionId, userId: userId ? 'present' : 'missing' })

    if (!userId) return

    const newPeriodEnd = getPeriodEnd()

    // Update subscription period
    const { error: subError } = await db
        .from('subscriptions')
        .update({
            status: 'active',
            razorpay_sub_id: subscriptionId,
            current_period_end: newPeriodEnd,
            expires_at: newPeriodEnd,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

    if (subError) {
        logError('Failed to update subscription period', subError)
        throw subError
    }

    // Reset monthly usage
    const { data: profile } = await db
        .from('user_profiles')
        .select('subscription_plan')
        .eq('id', userId)
        .single()

    if (profile) {
        const planConfig = getPlan(profile.subscription_plan)
        const limit = planConfig.reportsLimit >= 999999 ? 999999 : planConfig.reportsLimit

        const { error: profileError } = await db
            .from('user_profiles')
            .update({
                reports_used: 0,
                credits_remaining: limit,
                usage_reset_at: newPeriodEnd,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)

        if (profileError) {
            logError('Failed to reset usage', profileError)
            throw profileError
        }

        log('Subscription renewed, usage reset', { userId, limit })
    }
}

/**
 * Handle subscription.cancelled event
 * Sent when a subscription is cancelled
 * Policy: Keep access until current_period_end (grace period), then downgrade.
 */
async function handleSubscriptionCancelled(entity: Record<string, unknown>) {
    const db = createServiceClient()
    const notes = (entity.notes ?? {}) as Record<string, string>
    const userId = notes.userId

    log('Processing subscription.cancelled', { userId: userId ? 'present' : 'missing' })

    if (!userId) return

    // Update subscription status to cancelled (keep access until period end)
    const { error: subError } = await db
        .from('subscriptions')
        .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

    if (subError) {
        logError('Failed to update subscription status', subError)
        throw subError
    }

    log('Subscription cancelled (access continues until period end)', { userId })
}

/**
 * Handle subscription.halted event
 * Sent when a subscription is halted (payment failures, etc.)
 * Policy: Restrict premium access immediately.
 */
async function handleSubscriptionHalted(entity: Record<string, unknown>) {
    const db = createServiceClient()
    const notes = (entity.notes ?? {}) as Record<string, string>
    const userId = notes.userId

    log('Processing subscription.halted', { userId: userId ? 'present' : 'missing' })

    if (!userId) return

    const { error: subError } = await db
        .from('subscriptions')
        .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

    if (subError) {
        logError('Failed to update subscription status', subError)
        throw subError
    }

    // Downgrade to free
    const { error: profileError } = await db
        .from('user_profiles')
        .update({
            subscription_plan: 'free',
            reports_limit: 5,
            credits_remaining: 5,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

    if (profileError) {
        logError('Failed to downgrade user profile', profileError)
        throw profileError
    }

    log('Subscription halted, downgraded to free', { userId })
}

/**
 * Handle subscription.completed event
 * Sent when a subscription completes its cycle
 * Policy: Downgrade to free.
 */
async function handleSubscriptionCompleted(entity: Record<string, unknown>) {
    const db = createServiceClient()
    const notes = (entity.notes ?? {}) as Record<string, string>
    const userId = notes.userId

    log('Processing subscription.completed', { userId: userId ? 'present' : 'missing' })

    if (!userId) return

    const { error: subError } = await db
        .from('subscriptions')
        .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

    if (subError) {
        logError('Failed to update subscription status', subError)
        throw subError
    }

    const { error: profileError } = await db
        .from('user_profiles')
        .update({
            subscription_plan: 'free',
            reports_limit: 5,
            credits_remaining: 5,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

    if (profileError) {
        logError('Failed to downgrade user profile', profileError)
        throw profileError
    }

    log('Subscription completed, downgraded to free', { userId })
}

/**
 * Handle subscription.paused event
 * Sent when a subscription is paused
 * Policy: Reflect paused state, restrict premium access.
 */
async function handleSubscriptionPaused(entity: Record<string, unknown>) {
    const db = createServiceClient()
    const notes = (entity.notes ?? {}) as Record<string, string>
    const userId = notes.userId

    log('Processing subscription.paused', { userId: userId ? 'present' : 'missing' })

    if (!userId) return

    const { error: subError } = await db
        .from('subscriptions')
        .update({
            status: 'paused',
            paused_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

    if (subError) {
        logError('Failed to update subscription status', subError)
        throw subError
    }

    // Downgrade to free while paused
    const { error: profileError } = await db
        .from('user_profiles')
        .update({
            subscription_plan: 'free',
            reports_limit: 5,
            credits_remaining: 5,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

    if (profileError) {
        logError('Failed to downgrade user profile', profileError)
        throw profileError
    }

    log('Subscription paused, downgraded to free', { userId })
}

/**
 * Handle subscription.resumed event
 * Sent when a subscription is resumed
 * Policy: Restore premium access.
 */
async function handleSubscriptionResumed(entity: Record<string, unknown>) {
    const db = createServiceClient()
    const subscriptionId = entity.id as string
    const notes = (entity.notes ?? {}) as Record<string, string>
    const userId = notes.userId
    const plan = resolvePlan(notes.plan)

    log('Processing subscription.resumed', { subscriptionId, userId: userId ? 'present' : 'missing' })

    if (!userId) return

    const periodEnd = getPeriodEnd()
    const planConfig = getPlan(plan)
    const limit = planConfig.reportsLimit >= 999999 ? 999999 : planConfig.reportsLimit

    const { error: subError } = await db
        .from('subscriptions')
        .update({
            status: 'active',
            razorpay_sub_id: subscriptionId,
            current_period_end: periodEnd,
            resumed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

    if (subError) {
        logError('Failed to update subscription status', subError)
        throw subError
    }

    const { error: profileError } = await db
        .from('user_profiles')
        .update({
            subscription_plan: plan,
            reports_limit: limit,
            credits_remaining: limit,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

    if (profileError) {
        logError('Failed to update user profile', profileError)
        throw profileError
    }

    log('Subscription resumed, access restored', { userId, plan })
}

/**
 * Handle subscription.pending event
 * Sent when a subscription is pending (awaiting first payment)
 * Policy: No premium access until activated.
 */
async function handleSubscriptionPending(entity: Record<string, unknown>) {
    const db = createServiceClient()
    const notes = (entity.notes ?? {}) as Record<string, string>
    const userId = notes.userId

    log('Processing subscription.pending', { userId: userId ? 'present' : 'missing' })

    if (!userId) return

    const { error: subError } = await db
        .from('subscriptions')
        .update({
            status: 'pending',
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

    if (subError) {
        logError('Failed to update subscription status', subError)
        throw subError
    }

    log('Subscription pending (no premium access granted)', { userId })
}

/**
 * Handle subscription.updated event
 * Sent when a subscription is updated (plan change, etc.)
 */
async function handleSubscriptionUpdated(entity: Record<string, unknown>) {
    const db = createServiceClient()
    const subscriptionId = entity.id as string
    const notes = (entity.notes ?? {}) as Record<string, string>
    const userId = notes.userId
    const plan = resolvePlan(notes.plan)

    log('Processing subscription.updated', { subscriptionId, userId: userId ? 'present' : 'missing' })

    if (!userId) return

    const planConfig = getPlan(plan)
    const limit = planConfig.reportsLimit >= 999999 ? 999999 : planConfig.reportsLimit

    const { error: subError } = await db
        .from('subscriptions')
        .update({
            plan,
            razorpay_sub_id: subscriptionId,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

    if (subError) {
        logError('Failed to update subscription', subError)
        throw subError
    }

    const { error: profileError } = await db
        .from('user_profiles')
        .update({
            subscription_plan: plan,
            reports_limit: limit,
            credits_remaining: limit,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

    if (profileError) {
        logError('Failed to update user profile', profileError)
        throw profileError
    }

    log('Subscription updated', { userId, plan })
}

/**
 * Handle subscription.authenticated event
 * Sent when a subscription is authenticated (first payment authorized)
 * Policy: No premium access until activated.
 */
async function handleSubscriptionAuthenticated(entity: Record<string, unknown>) {
    const db = createServiceClient()
    const subscriptionId = entity.id as string
    const notes = (entity.notes ?? {}) as Record<string, string>
    const userId = notes.userId

    log('Processing subscription.authenticated', { subscriptionId, userId: userId ? 'present' : 'missing' })

    if (!userId) return

    const { error: subError } = await db
        .from('subscriptions')
        .update({
            status: 'pending',
            razorpay_sub_id: subscriptionId,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

    if (subError) {
        logError('Failed to update subscription status', subError)
        throw subError
    }

    log('Subscription authenticated (awaiting activation)', { userId })
}

/**
 * Activate user subscription - shared helper
 */
async function activateUserSubscription(
    db: ReturnType<typeof createServiceClient>,
    userId: string,
    plan: PlanId,
    orderId: string,
    paymentId: string,
    amount: number
) {
    const periodEnd = getPeriodEnd()

    try {
        // Use the database function for atomic operation
        await db.rpc('activate_subscription', {
            p_user_id: userId,
            p_plan: plan,
            p_order_id: orderId,
            p_payment_id: paymentId,
            p_amount: amount,
            p_period_end: periodEnd,
        })

        log('Subscription activated successfully', { userId, plan })
    } catch (error) {
        logError('Failed to activate subscription', error)
        throw error
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN WEBHOOK HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    // 1. Check webhook secret is configured
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
        logError('RAZORPAY_WEBHOOK_SECRET not configured', {})
        return NextResponse.json(
            { error: 'Webhook not configured' },
            { status: 500 }
        )
    }

    // 2. Get signature from header
    const signature = request.headers.get('x-razorpay-signature')
    if (!signature) {
        log('Missing x-razorpay-signature header')
        return NextResponse.json(
            { error: 'Missing signature' },
            { status: 400 }
        )
    }

    // 3. Get RAW body for signature verification
    // IMPORTANT: Do not parse JSON before verifying signature
    let rawBody: string
    try {
        rawBody = await request.text()
    } catch {
        logError('Failed to read request body', {})
        return NextResponse.json(
            { error: 'Failed to read body' },
            { status: 400 }
        )
    }

    // 4. Verify signature
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        log('Invalid webhook signature - REJECTED')
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 403 }
        )
    }

    log('Signature verified')

    // 5. Parse the webhook payload
    let payload: {
        event: string
        payload: Record<string, { entity: Record<string, unknown> }>
        entity?: string
    }

    try {
        payload = JSON.parse(rawBody)
    } catch {
        logError('Invalid JSON payload', {})
        return NextResponse.json(
            { error: 'Invalid JSON' },
            { status: 400 }
        )
    }

    const eventType = payload.event
    log(`Event received: ${eventType}`)

    // 6. Get event ID for idempotency
    // Razorpay includes the event ID in the payload
    // For most events, we can construct a unique ID from entity ID + event type
    let eventId: string

    // Try to get entity from payload
    const entityKey = eventType.split('.')[0] // 'payment' or 'subscription'
    const entity = payload.payload?.[entityKey]?.entity || payload.payload?.payment?.entity || payload.payload?.subscription?.entity

    if (entity && entity.id) {
        // Use entity ID + event type as unique identifier
        // This ensures the same event processed twice doesn't cause issues
        eventId = `${eventType}_${entity.id}`
    } else {
        // Fallback: use hash of raw body
        eventId = `${eventType}_${crypto.createHash('sha256').update(rawBody).digest('hex').slice(0, 16)}`
    }

    // 7. Check idempotency
    const db = createServiceClient()

    try {
        const alreadyProcessed = await isEventProcessed(db, eventId)
        if (alreadyProcessed) {
            log(`Event already processed, skipping: ${eventId}`)
            return NextResponse.json({ success: true, duplicate: true })
        }
    } catch (error) {
        logError('Failed to check idempotency, continuing anyway', error)
        // Continue processing - better to risk duplicate than block all webhooks
    }

    // 8. Process the event
    try {
        switch (eventType) {
            case 'payment.captured':
                await handlePaymentCaptured(entity || payload.payload.payment?.entity || {})
                break

            case 'payment.failed':
                await handlePaymentFailed(entity || payload.payload.payment?.entity || {})
                break

            case 'order.paid':
                await handleOrderPaid(entity || payload.payload.order?.entity || {})
                break

            case 'subscription.activated':
                await handleSubscriptionActivated(entity || payload.payload.subscription?.entity || {})
                break

            case 'subscription.charged':
                await handleSubscriptionCharged(entity || payload.payload.subscription?.entity || {})
                break

            case 'subscription.cancelled':
                await handleSubscriptionCancelled(entity || payload.payload.subscription?.entity || {})
                break

            case 'subscription.halted':
                await handleSubscriptionHalted(entity || payload.payload.subscription?.entity || {})
                break

            case 'subscription.completed':
                await handleSubscriptionCompleted(entity || payload.payload.subscription?.entity || {})
                break

            case 'subscription.paused':
                await handleSubscriptionPaused(entity || payload.payload.subscription?.entity || {})
                break

            case 'subscription.resumed':
                await handleSubscriptionResumed(entity || payload.payload.subscription?.entity || {})
                break

            case 'subscription.pending':
                await handleSubscriptionPending(entity || payload.payload.subscription?.entity || {})
                break

            case 'subscription.updated':
                await handleSubscriptionUpdated(entity || payload.payload.subscription?.entity || {})
                break

            case 'subscription.authenticated':
                await handleSubscriptionAuthenticated(entity || payload.payload.subscription?.entity || {})
                break

            case 'payment.authorized':
                // Payment is authorized but not yet captured
                // For most use cases, wait for payment.captured
                log('payment.authorized received - waiting for payment.captured')
                break

            default:
                log(`Unhandled event type: ${eventType}`)
            // Still mark as processed to avoid repeated logs
        }

        // 9. Mark event as processed ONLY on success
        // This ensures Razorpay retries on transient failures
        try {
            await markEventProcessed(db, eventId, eventType)
        } catch (error) {
            const err = error as { message?: string; code?: string; details?: string }
            logError('Failed to mark event as processed', {
                message: err.message,
                code: err.code,
                details: err.details,
            })
            // If we can't mark it, return 500 so Razorpay retries
            return NextResponse.json(
                { error: 'Failed to record event' },
                { status: 500 }
            )
        }

        log(`Event processed successfully: ${eventType}`)
        return NextResponse.json({
            success: true,
            eventId,
        })
    } catch (error) {
        // Handler failed — return 500 so Razorpay retries
        // Do NOT mark the event as processed
        logError(`Handler failed for ${eventType}`, error)
        return NextResponse.json(
            { error: 'Event processing failed' },
            { status: 500 }
        )
    }
}