import Razorpay from 'razorpay'
import crypto from 'crypto'

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// Pricing plans
export const PRICING_PLANS = {
    free: {
        name: 'Free',
        price: 0,
        features: [
            'Generate up to 5 research reports per month',
            'Basic sources and insights',
            'Standard processing time',
            'Limited to 5,000 words per report',
        ],
    },
    pro: {
        name: 'Pro',
        price: 49900, // ₹499 in paise
        displayPrice: 499,
        features: [
            'Unlimited research reports',
            'Advanced sources and deep insights',
            'Priority processing (2x faster)',
            'Up to 50,000 words per report',
            'API access (1,000 requests/month)',
            'Custom branding',
        ],
    },
    team: {
        name: 'Team',
        price: 149900, // ₹1499 in paise
        displayPrice: 1499,
        features: [
            'Everything in Pro',
            'Team collaboration (up to 5 users)',
            'Advanced analytics dashboard',
            'API access (10,000 requests/month)',
            'Dedicated support',
            'Custom integrations',
        ],
    },
}

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
            const order = await razorpay.orders.create({
                amount, // Amount in paise
                currency: 'INR',
                receipt: `order_${userId}_${Date.now()}`,
                notes: {
                    userId,
                    planName,
                    email,
                },
            })
            return order
        } catch (error) {
            console.error('Error creating Razorpay order:', error)
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
