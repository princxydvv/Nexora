# Complete Integration Flow

## User Journey: Sign Up → Payment → Dashboard

### 1️⃣ Sign Up Flow
```
User visits /signup
        ↓
Fill in email, password, full name
        ↓
Click "Get Started"
        ↓
Frontend: useAuth().signUp(email, password)
        ↓
Supabase: Creates auth.users record
        ↓
Supabase: Trigger (if any) or manual: Create user_profiles record
        ↓
AuthContext: Update user state
        ↓
Redirect to /pricing
        ↓
SUCCESS ✅ - User created with FREE plan
```

### 2️⃣ Payment/Upgrade Flow
```
User visits /pricing (or clicks upgrade)
        ↓
Click "Upgrade to Pro" button
        ↓
CheckoutButton component:
  1. POST /api/razorpay/create-order
     - userId, plan, email
     ↓
  2. Backend creates Razorpay order
     - Amount: ₹499 → 49900 paise
     - Notes: userId, plan
     ↓
  3. Frontend receives orderId + amount
     ↓
  4. Load Razorpay checkout.js
     ↓
  5. Open Razorpay modal
     ↓
USER ENTERS CARD DETAILS (Test: 4111 1111 1111 1111)
     ↓
  6. Razorpay processes payment
     ↓
  7. Payment handler receives response with:
     - razorpay_order_id
     - razorpay_payment_id
     - razorpay_signature
     ↓
  8. Frontend: POST /api/razorpay/verify-payment
     - Send order_id, payment_id, signature
     ↓
Backend Verification:
  1. Verify signature using HMAC-SHA256
     - body = order_id + "|" + payment_id
     - expectedSig = HMAC-SHA256(secret, body)
     ✅ If matches = payment verified
     ❌ If not = FRAUD ATTEMPT
     ↓
  2. Fetch payment details from Razorpay API
     - Confirm status = "captured"
     ↓
  3. Create/Update records:
     - Update payments table: status = "completed"
     - Create subscriptions record: status = "active"
     - Update user_profiles: subscription_plan = "pro"
     ↓
  4. Return success to frontend
     ↓
Frontend: Redirect to /dashboard
        ↓
SUCCESS ✅ - Subscription activated
```

### 3️⃣ Dashboard/Protected Routes
```
User visits /dashboard
        ↓
Middleware checks auth token in cookies
        ↓
✅ Token exists → Allow access
❌ No token → Redirect to /signin
        ↓
DashboardPage:
  1. useAuth() hook gets user from context
  2. Fetch userProfile from Supabase
  3. Display subscription status
  4. Show plan badge
     ↓
SUCCESS ✅ - Dashboard loaded
```

## Database State After Payment

```
BEFORE PAYMENT:
┌─ auth.users ──────────────────┐
│ id: uuid-123                   │
│ email: user@example.com        │
└────────────────────────────────┘

┌─ user_profiles ────────────────┐
│ id: uuid-123                   │
│ email: user@example.com        │
│ subscription_plan: "free"      │
│ created_at: 2024-01-01         │
└────────────────────────────────┘

AFTER PAYMENT:
┌─ user_profiles ────────────────┐
│ id: uuid-123                   │
│ email: user@example.com        │
│ subscription_plan: "pro" ⬅️    │ UPDATED
│ created_at: 2024-01-01         │
└────────────────────────────────┘

┌─ payments ─────────────────────────────┐
│ id: uuid-456                           │
│ user_id: uuid-123                      │
│ razorpay_order_id: order_abc123        │
│ razorpay_payment_id: pay_def456        │
│ razorpay_signature: sig_xyz789         │
│ plan: "pro"                            │
│ amount: 49900                          │
│ status: "completed"                    │
│ created_at: 2024-01-01 12:30:00        │
└────────────────────────────────────────┘

┌─ subscriptions ────────────────────────┐
│ id: uuid-789                           │
│ user_id: uuid-123                      │
│ razorpay_order_id: order_abc123        │
│ razorpay_payment_id: pay_def456        │
│ plan: "pro"                            │
│ amount: 49900                          │
│ status: "active"                       │
│ started_at: 2024-01-01 12:30:00        │
│ expires_at: 2024-02-01 12:30:00        │
└────────────────────────────────────────┘
```

## Component Interaction Flow

```
┌─────────────────────────────────────────────────────┐
│           Root Layout (RootLayout)                  │
│  └─→ AuthProvider ────────────────────────────────┐ │
│                                                   │ │
│  ┌─────────────────────────────────────────────┐ │ │
│  │       Auth Context (useAuth)                │ │ │
│  │  - user                                     │ │ │
│  │  - userProfile                              │ │ │
│  │  - isAuthenticated                          │ │ │
│  │  - signUp, signIn, signOut                  │ │ │
│  └─────────────────────────────────────────────┘ │ │
│                      ↓                             │ │
│  ┌──────────────┐    ┌────────────────┐         │ │
│  │  /signin     │    │  /signup       │         │ │
│  │  Page        │    │  Page          │         │ │
│  └──────────────┘    └────────────────┘         │ │
│                      ↓                             │ │
│  ┌────────────────────────────────────┐         │ │
│  │  /pricing Page                     │         │ │
│  │  └─→ PricingComponent              │         │ │
│  │      └─→ CheckoutButton (×3)       │         │ │
│  │          - Uses: razorpayService   │         │ │
│  │          - Calls: /api/razorpay/*  │         │ │
│  └────────────────────────────────────┘         │ │
│                      ↓                             │ │
│  ┌────────────────────────────────────┐         │ │
│  │  /dashboard (Protected)            │         │ │
│  │  └─→ Middleware checks auth        │         │ │
│  │      └─→ useAuth() for profile     │         │ │
│  └────────────────────────────────────┘         │ │
│                                                   │ │
│  └─→ End AuthProvider ─────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## API Route Flow

```
POST /api/razorpay/create-order
├─ Input: userId, plan, email
├─ Logic:
│  ├─ Validate plan exists
│  ├─ Get plan price from PRICING_PLANS
│  ├─ For free plan: Create subscription directly
│  └─ For paid: Call razorpayService.createOrder()
│     └─ Returns: order object with id, amount
├─ Save payment record to Supabase
└─ Return: orderId, amount, plan

                    ↓

POST /api/razorpay/verify-payment
├─ Input: razorpay_order_id, razorpay_payment_id, razorpay_signature, userId
├─ Logic:
│  ├─ Verify signature using HMAC-SHA256
│  ├─ If invalid: Return 403 (Fraud detected)
│  ├─ Fetch payment details from Razorpay API
│  ├─ Verify payment status = "captured"
│  ├─ Update payments table: status = "completed"
│  ├─ Create/Update subscriptions
│  └─ Update user_profiles: subscription_plan
├─ Return: success message
└─ Frontend: Redirect to /dashboard

                    ↓

POST /api/razorpay/webhook
├─ Input: Webhook event from Razorpay
├─ Header: X-Razorpay-Signature
├─ Logic:
│  ├─ Verify webhook signature
│  ├─ Parse event.event type
│  ├─ Handle payment.captured
│  ├─ Handle payment.failed
│  └─ Handle order.paid
└─ Return: 200 OK (Acknowledge receipt)
```

## Security Measures

```
🔒 Frontend
├─ No secret keys exposed
├─ No payment data stored
└─ Redirects to signin if not authenticated

🔒 Backend
├─ Verify Razorpay signature ALWAYS
│  └─ Uses RAZORPAY_KEY_SECRET
├─ Validate input on all routes
├─ Verify webhook signature
│  └─ Uses RAZORPAY_WEBHOOK_SECRET
├─ Check user owns the subscription
└─ Use HTTPS only

🔒 Database (Supabase)
├─ Row-Level Security (RLS) enabled
├─ Users can only see own data
├─ Policies enforce user_id matching
└─ No sensitive data in plaintext

🔒 Environment Variables
├─ NEXT_PUBLIC_* only for client-safe values
├─ RAZORPAY_KEY_SECRET server-only
├─ Never commit .env.local
└─ Rotate keys regularly
```

## Pricing Tier Logic

```
FREE PLAN
├─ Price: ₹0
├─ Auto-activated on signup
├─ No Razorpay order needed
└─ Features: 5 reports/month, basic

PRO PLAN
├─ Price: ₹499 (49900 paise)
├─ Most popular (UI badge)
├─ Requires Razorpay payment
└─ Features: Unlimited reports, API access

TEAM PLAN
├─ Price: ₹1499 (149900 paise)
├─ Enterprise features
├─ Requires Razorpay payment
└─ Features: Team collab, priority support

SUBSCRIPTION LOGIC
├─ 30-day expiry from creation
├─ Auto-check on user profile load
├─ Can upgrade/downgrade anytime
└─ Refunds handled per policy
```

## Error Handling Flow

```
Payment Process Errors:

1. Order Creation Failed
   ├─ Invalid plan
   ├─ API communication error
   └─ Display: "Failed to create order"

2. Razorpay Modal
   ├─ User cancels payment
   └─ Display: "Payment cancelled"

3. Payment Verification Failed
   ├─ Signature mismatch = FRAUD
   ├─ Payment not captured
   └─ Display: "Payment verification failed"

4. Database Errors
   ├─ RLS policy denial
   ├─ Subscription creation failed
   └─ Display: "Failed to activate subscription"

Authentication Errors:

1. Signup
   ├─ Email already exists
   ├─ Weak password
   └─ User profile creation failed

2. Signin
   ├─ Invalid credentials
   ├─ User not found
   └─ Session creation failed

3. Protected Routes
   ├─ No auth token
   ├─ Token expired
   └─ Redirect to /signin
```

## Data Flow Summary

```
USER DATA:
SignUp → Supabase Auth → user_profiles (free plan) ✅

PAYMENT DATA:
Checkout → Razorpay Order → Payment Modal → Payment Handler
         → verify-payment → Supabase (payments + subscriptions) ✅

SESSION DATA:
Signin → Supabase Auth → AuthContext → Protected Pages ✅

SUBSCRIPTION DATA:
Payment Success → subscriptions table → Dashboard shows plan ✅
```

---

## Quick Reference

| Component | Purpose | Location |
|-----------|---------|----------|
| AuthContext | Global auth state | `context/auth-context.tsx` |
| CheckoutButton | Payment UI | `components/payment/checkout-button.tsx` |
| PricingComponent | Pricing page | `components/payment/pricing.tsx` |
| razorpayService | Payment utilities | `lib/razorpay.ts` |
| authService | Auth utilities | `lib/supabase.ts` |
| API Routes | Backend logic | `app/api/razorpay/*` |
| Middleware | Route protection | `middleware.ts` |

This complete flow ensures:
✅ Secure payments with signature verification
✅ Protected user data with RLS
✅ Proper error handling
✅ Smooth user experience
✅ Production-ready implementation
