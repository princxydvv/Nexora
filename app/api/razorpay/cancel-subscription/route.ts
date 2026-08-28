/**
 * Compatibility route: /api/razorpay/cancel-subscription
 * Re-exports the canonical handler at /app/api/billing/razorpay/cancel-subscription
 * so legacy frontend calls keep working.
 */
export { POST } from '@/app/api/billing/razorpay/cancel-subscription/route'