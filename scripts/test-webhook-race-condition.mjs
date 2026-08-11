#!/usr/bin/env node
/**
 * Test the webhook race condition fix.
 * 
 * This test simulates the scenario where:
 * 1. Payment record doesn't exist yet
 * 2. Webhook arrives and should create the payment record
 * 3. Webhook should activate the subscription
 * 4. Webhook should return 200 OK
 * 
 * Usage:
 *   node scripts/test-webhook-race-condition.mjs [orderId] [paymentId] [userId] [plan]
 * 
 * Example:
 *   node scripts/test-webhook-race-condition.mjs order_abc123 pay_xyz789 user_123 pro
 */

import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env.local
const env = {}
const envPath = path.join(__dirname, '..', '.env.local')
if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found')
    process.exit(1)
}
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
}

const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET
if (!webhookSecret) {
    console.error('❌ RAZORPAY_WEBHOOK_SECRET not found in .env.local')
    process.exit(1)
}

const endpoint = process.argv[5] || 'http://localhost:3000/api/razorpay/webhook'

// Build a test webhook payload
function buildWebhookPayload(orderId, paymentId, userId, plan) {
    const now = Math.floor(Date.now() / 1000)
    const amount = plan === 'team' ? 99900 : 49900
    
    return {
        entity: 'event',
        account_id: env.RAZORPAY_KEY_ID || 'acc_test',
        event: 'payment.captured',
        contains: ['payment'],
        payload: {
            payment: {
                entity: {
                    id: paymentId,
                    entity: 'payment',
                    amount: amount,
                    currency: 'INR',
                    status: 'captured',
                    order_id: orderId,
                    method: 'card',
                    notes: {
                        userId: userId,
                        planName: plan,
                        email: 'test@example.com',
                    },
                    created_at: now,
                },
            },
        },
        created_at: now,
    }
}

// Main
async function main() {
    const orderId = process.argv[2] || `order_test_${Date.now().toString(36)}`
    const paymentId = process.argv[3] || `pay_test_${Date.now().toString(36)}`
    const userId = process.argv[4] || 'test-user-id-123'
    const plan = process.argv[5] || 'pro'
    const endpoint = process.argv[6] || 'http://localhost:3000/api/razorpay/webhook'

    const payload = buildWebhookPayload(orderId, paymentId, userId, plan)
    const body = JSON.stringify(payload)
    const signature = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex')

    console.log('══════════════════════════════════════════════════════')
    console.log('  Nexora Webhook Race Condition Test')
    console.log('══════════════════════════════════════════════════════')
    console.log(`  Order ID:     ${orderId}`)
    console.log(`  Payment ID:   ${paymentId}`)
    console.log(`  User ID:      ${userId}`)
    console.log(`  Plan:         ${plan}`)
    console.log(`  Endpoint:     ${endpoint}`)
    console.log('──────────────────────────────────────────────────────')
    console.log('  Testing:')
    console.log('  1. Send webhook with userId in notes')
    console.log('  2. Webhook should CREATE payment record')
    console.log('  3. Webhook should ACTIVATE subscription')
    console.log('  4. Webhook should return 200 OK')
    console.log('──────────────────────────────────────────────────────')

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-razorpay-signature': signature,
            },
            body,
        })

        const data = await res.json().catch(() => ({}))
        console.log(`\n  Status:    ${res.status} ${res.statusText}`)
        console.log(`  Response:  ${JSON.stringify(data)}`)
        console.log('──────────────────────────────────────────────────────')

        if (res.ok) {
            console.log('  ✅ Webhook handled successfully!')
            console.log('\n  Check server logs for:')
            console.log('    - "Payment record not found — checking if we can create it"')
            console.log('    - "Payment record created from webhook data"')
            console.log('    - "Subscription activated successfully"')
            console.log('\n  Verify in Supabase:')
            console.log(`    1. payments table: WHERE razorpay_order_id = '${orderId}'`)
            console.log(`    2. subscriptions table: WHERE user_id = '${userId}'`)
            console.log(`    3. user_profiles table: WHERE id = '${userId}'`)
            process.exit(0)
        } else {
            console.log('  ❌ Webhook returned error status')
            console.log('\n  Possible reasons:')
            console.log('    - Payment record already exists (not a race condition)')
            console.log('    - Database error occurred')
            console.log('    - User ID missing in webhook notes')
            console.log('\n  Check server logs for details')
            process.exit(1)
        }
    } catch (error) {
        console.error('\n  ❌ Failed to send webhook:', error.message)
        console.error('  Make sure your server is running on', endpoint)
        process.exit(1)
    }
}

main()