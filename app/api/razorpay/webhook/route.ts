/**
 * Compatibility route: /api/razorpay/webhook
 * Re-exports the canonical handler at /api/billing/razorpay/webhook
 * so existing webhook URLs configured in Razorpay Dashboard keep working.
 */
export { POST } from '@/app/api/billing/razorpay/webhook/route'