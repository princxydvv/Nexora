# Webhook Payment Activation Fix

## Root Cause

The webhook handler at `app/api/razorpay/webhook/route.ts:137-139` had a critical bug:

```typescript
if (paymentError || !payment) {
    logError('Payment record not found for orderId', orderId)
    return  // ← BUG: Returns undefined (200 OK), marks event as processed!
}
```

When the payment record was missing, the webhook:
1. Returned without error → HTTP 200 OK
2. Event was marked as processed (line 938)
3. Razorpay won't retry
4. User stays on Free plan forever ❌

## The Fix

### 1. Race Condition Handling (Webhook Creates Payment Record)

The webhook now **creates** payment records from webhook data if missing:

```typescript
if (paymentError || !payment) {
    // Create payment record from webhook data
    const { data: newPayment, error: createError } = await db
        .from('payments')
        .insert({
            user_id: userId, // from webhook notes
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            amount: amountPaise,
            plan: planFromNotes,
            status: 'completed',
        })
        .maybeSingle()
}
```

### 2. Proper Error Propagation

All error paths now **throw exceptions** instead of returning:

```typescript
if (!orderId) {
    throw new Error('Missing order_id in payment.captured webhook')
}
```

This causes the outer `try-catch` to return HTTP 500, triggering Razorpay retry.

### 3. Idempotency

Added check to skip duplicate processing:

```typescript
if (payment!.status === 'completed' && payment!.razorpay_payment_id === paymentId) {
    log('Payment already completed, skipping duplicate processing')
    return
}
```

## Files Changed

1. **`app/api/razorpay/webhook/route.ts`**
   - Lines 110-246: Complete rewrite of `handlePaymentCaptured()`
   - Lines 262-264: Fixed `handlePaymentFailed()` error handling
   - Added race condition handling
   - Changed all silent returns to thrown errors

2. **`scripts/test-webhook-race-condition.mjs`** (NEW)
   - Test script for race condition scenario

## Database Changes

**None required** - uses existing `payments` table schema.

## How Race Condition is Handled

```
Timeline:
  T0: create-order creates payment record
  T1: User pays immediately (1ms later)
  T2: Razorpay sends webhook (before DB commit!)
  T3: Webhook queries → NOT FOUND
  T4: Webhook CREATES payment record from webhook data
  T5: Webhook activates subscription
  T6: ✅ Success
```

## Frontend Success Flow

```
1. User pays in Razorpay checkout
2. Frontend calls POST /api/razorpay/verify-payment
3. verify-payment activates subscription
4. Frontend redirects to /payment-success?plan=pro
5. User sees "Payment Successful"

Fallback: If verify-payment fails, webhook still activates subscription
```

## Testing

```bash
# 1. TypeScript check
npm run typecheck
# ✅ PASSED

# 2. Build
npm run build
# ✅ PASSED (23 routes)

# 3. Razorpay smoke test
node scripts/razorpay-smoke-test.mjs
# ✅ PASSED

# 4. Test payment flow
npm run dev
# Go to http://localhost:3000/#pricing
# Click "Upgrade to Pro"
# Use test card: 4111111111111111, Expiry: 12/25, CVV: 123
# Verify: Redirected to /payment-success?plan=pro
# Verify: /billing shows Pro plan

# 5. Test race condition (optional)
node scripts/test-webhook-race-condition.mjs <orderId> <paymentId> <userId>
```

## How to Test the Failed Order (order_TNdRg6DJ4HWgL3)

This order's webhook was already marked as processed and won't retry automatically. Options:

**Option A: Make a new payment** (recommended)
- New payments will work correctly with the fix

**Option B: Manual verification** (if you have the payment details)
```bash
# Call verify-payment endpoint directly
curl -X POST http://localhost:3000/api/razorpay/verify-payment \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_TNdRg6DJ4HWgL3",
    "razorpay_payment_id": "pay_TNdldYvR4WHoep",
    "razorpay_signature": "ACTUAL_SIGNATURE_FROM_RAZORPAY",
    "userId": "ACTUAL_USER_ID",
    "plan": "pro"
  }'
```

**Option C: Resend webhook from Razorpay Dashboard**
1. Delete the processed event from `webhook_events` table
2. Resend webhook from Razorpay Dashboard

## Summary

✅ **Root cause found:** Webhook silently failed on missing payment records  
✅ **Fix applied:** Webhook now creates payment records and returns 500 on errors  
✅ **TypeScript:** 0 errors  
✅ **Build:** PASSED  
✅ **Race condition:** Handled with idempotent record creation  
✅ **Idempotency:** Preserved with duplicate detection  
✅ **No DB changes:** Uses existing schema  
✅ **No key changes:** Razorpay keys unchanged  
✅ **Signature verification:** Still enforced  

**Status: READY FOR TESTING** ✅