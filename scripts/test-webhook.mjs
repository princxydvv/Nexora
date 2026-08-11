#!/usr/bin/env node
/**
 * Nexora Razorpay Webhook Local Test Script
 * 
 * Sends a signed test webhook to your local/ngrok endpoint.
 * 
 * Usage:
 *   node scripts/test-webhook.mjs [event] [endpoint]
 * 
 * Examples:
 *   node scripts/test-webhook.mjs payment.captured http://localhost:3000/api/razorpay/webhook
 *   node scripts/test-webhook.mjs payment.failed https://your-ngrok-url/api/razorpay/webhook
 * 
 * Events:
 *   payment.captured  (default) — simulates a successful payment
 *   payment.failed              — simulates a failed payment
 *   order.paid                  — simulates an order being paid
 */

import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load webhook secret from .env.local
function loadWebhookSecret() {
    const envPath = path.join(__dirname, '..', '.env.local')
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env.local not found. Run this from the project root.')
        process.exit(1)
    }

    const content = fs.readFileSync(envPath, 'utf-8')
    const match = content.match(/^RAZORPAY_WEBHOOK_SECRET=(.+)$/m)
    if (!match) {
        console.error('❌ RAZORPAY_WEBHOOK_SECRET not found in .env.local')
        process.exit(1)
    }

    return match[1].trim()
}

// Build a test webhook payload
function buildPayload(event, orderId, paymentId) {
    const now = Math.floor(Date.now() / 1000)

    if (event === 'payment.captured') {
        return {
            entity: 'event',
            account_id: 'acc_test_account',
            event: 'payment.captured',
            contains: ['payment'],
            payload: {
                payment: {
                    entity: {
                        id: paymentId,
                        entity: 'payment',
                        amount: 49900, // ₹499 in paise (Pro plan)
                        currency: 'INR',
                        status: 'captured',
                        order_id: orderId,
                        method: 'card',
                        notes: {
                            userId: 'test-user-id',
                            planName: 'pro',
                        },
                        created_at: now,
                    },
                },
            },
            created_at: now,
        }
    }

    if (event === 'payment.failed') {
        return {
            entity: 'event',
            account_id: 'acc_test_account',
            event: 'payment.failed',
            contains: ['payment'],
            payload: {
                payment: {
                    entity: {
                        id: paymentId,
                        entity: 'payment',
                        amount: 49900,
                        currency: 'INR',
                        status: 'failed',
                        order_id: orderId,
                        method: 'card',
                        error_code: 'BAD_REQUEST_ERROR',
                        error_description: 'The payment was declined',
                        notes: {
                            userId: 'test-user-id',
                            planName: 'pro',
                        },
                        created_at: now,
                    },
                },
            },
            created_at: now,
        }
    }

    if (event === 'order.paid') {
        return {
            entity: 'event',
            account_id: 'acc_test_account',
            event: 'order.paid',
            contains: ['order'],
            payload: {
                order: {
                    entity: {
                        id: orderId,
                        entity: 'order',
                        amount: 49900,
                        currency: 'INR',
                        status: 'paid',
                        notes: {
                            userId: 'test-user-id',
                            planName: 'pro',
                        },
                        created_at: now,
                    },
                },
            },
            created_at: now,
        }
    }

    console.error(`❌ Unknown event: ${event}`)
    console.error('Supported events: payment.captured, payment.failed, order.paid')
    process.exit(1)
}

// Main
async function main() {
    const event = process.argv[2] || 'payment.captured'
    const endpoint = process.argv[3] || 'http://localhost:3000/api/razorpay/webhook'

    const secret = loadWebhookSecret()
    const orderId = `order_${Date.now().toString().slice(-8)}`
    const paymentId = `pay_${Date.now().toString().slice(-8)}`

    const payload = buildPayload(event, orderId, paymentId)
    const body = JSON.stringify(payload)

    // Sign the raw body with the webhook secret
    const signature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex')

    console.log('══════════════════════════════════════════════════════')
    console.log('  Nexora Razorpay Webhook Test')
    console.log('══════════════════════════════════════════════════════')
    console.log(`  Event:     ${event}`)
    console.log(`  Endpoint:  ${endpoint}`)
    console.log(`  Order ID:  ${orderId}`)
    console.log(`  Payment ID: ${paymentId}`)
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
        console.log(`  Status:    ${res.status} ${res.statusText}`)
        console.log(`  Response:  ${JSON.stringify(data)}`)
        console.log('──────────────────────────────────────────────────────')

        if (res.ok) {
            console.log('  ✅ Webhook delivered successfully!')
            console.log('  Check your server logs for:')
            console.log('    [Razorpay Webhook] Event received: ' + event)
            console.log('    [Razorpay Webhook] Signature verified')
            console.log('    [Razorpay Webhook] Event processed successfully')
        } else {
            console.log('  ❌ Webhook was rejected. Check server logs for details.')
        }
    } catch (error) {
        console.error('  ❌ Failed to send webhook:', error.message)
        console.error('  Make sure your server is running and the endpoint is correct.')
        process.exit(1)
    }
}

main()