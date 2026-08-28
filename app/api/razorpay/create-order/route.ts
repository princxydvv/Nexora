/**
 * Compatibility route: /api/razorpay/create-order
 * Re-exports the canonical handler at /api/billing/razorpay/create-order
 * so legacy frontend calls keep working.
 */
export { POST } from '@/app/api/billing/razorpay/create-order/route'