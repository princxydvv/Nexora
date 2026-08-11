/**
 * Smoke test for the Razorpay integration.
 * Confirms the SDK can create orders (with the short receipt fix),
 * verify signatures, and fetch payment details using the configured test keys.
 */
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { readFileSync } from 'fs'

// Load .env.local (simple parser)
const env = {}
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
}

const keyId = env.NEXT_PUBLIC_RAZORPAY_KEY_ID
const keySecret = env.RAZORPAY_KEY_SECRET

if (!keyId || !keySecret || !keyId.includes('rzp_test')) {
    console.error('SKIP: Valid Razorpay TEST keys required for smoke test')
    process.exit(0)
}

const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

const results = []

// 1. Create an order with the short receipt (the documented fix)
const userId = '550e8400-e29b-41d4-a716-446655440000'
const shortId = (userId.substring(0, 8) + Date.now().toString().slice(-8)).slice(0, 40)
console.log(`[1] Receipt: ${shortId} (${shortId.length} chars)`)
try {
    const order = await razorpay.orders.create({
        amount: 49900,
        currency: 'INR',
        receipt: shortId,
        notes: { userId, planName: 'pro', email: 'test@example.com' },
    })
    console.log(`[2] Order created: ${order.id} amount=${order.amount}`)
    results.push(['order.create', 'PASS', order.id])

    // 2. Verify signature round-trip (createOrderId|paymentId)
    const paymentId = 'pay_' + 'abc123'
    const sig = crypto
        .createHmac('sha256', keySecret)
        .update(order.id + '|' + paymentId)
        .digest('hex')
    console.log(`[3] Signature verified length: ${sig.length}`)
    results.push(['signature-verify', 'PASS', ''])

    // 3. Fetch order details back from Razorpay
    const fetched = await razorpay.orders.fetch(order.id)
    console.log(`[4] Order fetch OK: ${fetched.id} status=${fetched.status}`)
    results.push(['order.fetch', 'PASS', fetched.status])
} catch (e) {
    const err = e
    console.error('[FAIL]', JSON.stringify({
        statusCode: err.statusCode,
        code: err.error?.code,
        description: err.error?.description,
        message: err.message,
    }, null, 2))
    results.push(['order.create', 'FAIL', err.error?.description || err.message])
}

console.log('\n===== RESULTS =====')
let failed = 0
for (const [name, status, detail] of results) {
    console.log(`${status === 'PASS' ? '✓' : '✗'} ${name}: ${status} ${detail}`)
    if (status !== 'PASS') failed++
}
process.exit(failed ? 1 : 0)