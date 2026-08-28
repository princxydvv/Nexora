/**
 * Compatibility route: /api/razorpay/verify-payment
 * Re-exports the canonical handler at /api/billing/razorpay/verify-payment
 * so legacy frontend calls keep working.
 */
export { POST } from '@/app/api/billing/razorpay/verify-payment/route'