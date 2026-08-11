import Razorpay from 'razorpay'
import crypto from 'crypto'

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

import { PLANS } from '@/features/billing/services/plans'

// Export for backward compatibility
export const PRICING_PLANS = Object.entries(PLANS).reduce(
    (acc, [key, plan]) => ({
        ...acc,
        [key]: {
            name: plan.name,
            price: plan.priceInPaise,
            displayPrice: plan.displayPrice,
            features: plan.features,
        },
    }),
    {} as Record<string, any>
)

export const razorpayService = {
    /**
     * Create a Razorpay order
     * Razorpay Terms: Amount must be in paise (1 rupee = 100 paise)
     */
    createOrder: async (
        amount: number, // amount in paise
        userId: string,
        planName: string,
        email: string
    ) => {
        try {
            // Generate short receipt ID (max 40 chars)
            const shortId = userId.substring(0, 8) + Date.now().toString().slice(-8)
            const order = await razorpay.orders.create({
                amount, // Amount in paise
                currency: 'INR',
                receipt: shortId,
                notes: {
                    userId,
                    planName,
                    email,
                },
            })
            return order
        } catch (error) {
            // Razorpay SDK throws plain objects (statusCode + error), not Error instances.
            // Always log the full detail so the real cause is visible.
            const err = error as { statusCode?: number; error?: { code?: string; description?: string }; message?: string }
            console.error(
                '[Razorpay] Error creating order:',
                JSON.stringify({
                    statusCode: err.statusCode,
                    code: err.error?.code,
                    description: err.error?.description,
                    message: err.message,
                })
            )
            throw error
        }
    },

    /**
     * Verify payment signature
     * Razorpay Security: Always verify signature on backend to prevent fraud
     */
    verifyPaymentSignature: (
        orderId: string,
        paymentId: string,
        signature: string
    ): boolean => {
        try {
            const body = orderId + '|' + paymentId
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
                .update(body)
                .digest('hex')

            return expectedSignature === signature
        } catch (error) {
            console.error('Error verifying payment signature:', error)
            return false
        }
    },

    /**
     * Get payment details from Razorpay
     */
    getPaymentDetails: async (paymentId: string) => {
        try {
            const payment = await razorpay.payments.fetch(paymentId)
            return payment
        } catch (error) {
            console.error('Error fetching payment details:', error)
            throw error
        }
    },

    /**
     * Refund a payment
     * Razorpay Terms: Refunds are processed within 3-5 business days
     */
    refundPayment: async (paymentId: string, amount?: number) => {
        try {
            const refund = await razorpay.payments.refund(paymentId, {
                amount, // Optional: partial refund amount in paise
            })
            return refund
        } catch (error) {
            console.error('Error refunding payment:', error)
            throw error
        }
    },

    /**
     * Get order details
     */
    getOrderDetails: async (orderId: string) => {
        try {
            const order = await razorpay.orders.fetch(orderId)
            return order
        } catch (error) {
            console.error('Error fetching order details:', error)
            throw error
        }
    },

    /**
     * Cancel a subscription
     * Razorpay: Cancels a subscription. The subscription is cancelled at the end of the current billing cycle.
     */
    cancelSubscription: async (subscriptionId: string) => {
        try {
            const subscription = await razorpay.subscriptions.cancel(subscriptionId)
            return subscription
        } catch (error) {
            console.error('Error cancelling subscription:', error)
            throw error
        }
    },
}

/**
 * RAZORPAY TERMS & CONDITIONS SUMMARY:
 * 
 * 1. AMOUNT HANDLING:
 *    - All amounts must be in paise (1 INR = 100 paise)
 *    - Minimum amount: ₹1 (100 paise)
 *    - Maximum amount: ₹1,00,00,000 (100 crore rupees)
 * 
 * 2. PAYMENT VERIFICATION:
 *    - Always verify signatures on backend to prevent fraud
 *    - Use SHA256 HMAC for signature verification
 *    - Never verify signatures on client-side
 * 
 * 3. REFUNDS:
 *    - Full refunds: Process within 3-5 business days
 *    - Partial refunds: Available for most payment methods
 *    - Non-refundable: Some payment methods may restrict refunds
 * 
 * 4. PAYMENT METHODS:
 *    - Supported: Credit cards, Debit cards, UPI, Wallets, NetBanking
 *    - 3D Secure authentication may be required
 * 
 * 5. SETTLEMENT:
 *    - Standard settlement: T+2 days to merchant account
 *    - Settlement frequency: Daily or Weekly (configurable)
 * 
 * 6. WEBHOOK SECURITY:
 *    - Verify webhook signature using X-Razorpay-Signature header
 *    - Webhooks are retried for up to 24 hours on failure
 * 
 * 7. RECURRING PAYMENTS:
 *    - Create subscription using token from first payment
 *    - Capture token during initial payment
 * 
 * 8. COMPLIANCE:
 *    - PCI DSS Level 1 compliant
 *    - All data encrypted in transit and at rest
 *    - Never store sensitive payment data
 */
