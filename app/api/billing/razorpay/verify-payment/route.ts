import { NextRequest, NextResponse } from 'next/server'
import { createRouteSupabaseClient } from '@/lib/supabase-route-client'
import { createServiceClient } from '@/lib/supabase-service'
import { razorpayService } from '@/lib/razorpay'
import { getPlan } from '@/features/billing/services/plans'

export async function POST(request: NextRequest) {
    // 1. Authenticate user
    const supabase = createRouteSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse and validate body
    let body: { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string }
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
        )
    }

    // 3. Verify HMAC signature FIRST — before any DB reads
    const isValid = razorpayService.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    )

    if (!isValid) {
        console.error(`[verify-payment] Invalid signature for order=${razorpay_order_id}`)
        return NextResponse.json(
            { success: false, error: 'Payment verification failed' },
            { status: 403 }
        )
    }

    // 4. Load payment record using service client
    const db = createServiceClient()
    const { data: paymentRow, error: paymentErr } = await db
        .from('payments')
        .select('user_id, plan, status, razorpay_payment_id, amount')
        .eq('razorpay_order_id', razorpay_order_id)
        .maybeSingle()

    if (paymentErr || !paymentRow) {
        return NextResponse.json({ success: false, error: 'Payment record not found' }, { status: 404 })
    }

    // 5. Ownership check BEFORE any writes
    if (paymentRow.user_id !== user.id) {
        console.error(`[verify-payment] Ownership mismatch: user=${user.id} payment.user=${paymentRow.user_id}`)
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // 6. Idempotency — already verified
    if (paymentRow.status === 'completed' && paymentRow.razorpay_payment_id === razorpay_payment_id) {
        return NextResponse.json({
            success: true,
            message: 'Payment already verified',
            plan: paymentRow.plan,
        })
    }

    // 7. Confirm payment is captured with Razorpay
    let paymentDetails: Awaited<ReturnType<typeof razorpayService.getPaymentDetails>>
    try {
        paymentDetails = await razorpayService.getPaymentDetails(razorpay_payment_id)
    } catch {
        return NextResponse.json({ success: false, error: 'Could not verify payment with Razorpay' }, { status: 502 })
    }

    if (paymentDetails.status !== 'captured') {
        return NextResponse.json({ success: false, error: 'Payment not captured yet' }, { status: 400 })
    }

    // 8. Mark payment completed
    await db
        .from('payments')
        .update({
            status: 'completed',
            razorpay_payment_id,
            razorpay_signature,
            updated_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', razorpay_order_id)

    // 9. Activate subscription via DB function
    const plan = paymentRow.plan as string
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await db.rpc('activate_subscription', {
        p_user_id: user.id,
        p_plan: plan,
        p_order_id: razorpay_order_id,
        p_payment_id: razorpay_payment_id,
        p_amount: paymentRow.amount ?? 0,
        p_period_end: periodEnd,
    })

    console.log(`[verify-payment] Activated plan=${plan} for user=${user.id}`)

    return NextResponse.json({
        success: true,
        message: 'Payment verified and subscription activated',
        plan,
        periodEnd,
    })
}
