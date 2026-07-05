# Nexora AI SaaS - Razorpay & Supabase Integration Guide

## Setup Instructions

### 1. Environment Variables

Your `.env.local` file has been created with the necessary Razorpay credentials. ✅

```
NEXT_PUBLIC_SUPABASE_URL=https://rpokghmtkhzfweqdfdoa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_rE0MV-ssJ_Xaylc95sDd4A_eWiuoy4T
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_T5OQQa9EHRrrlK
RAZORPAY_KEY_SECRET=SAVJWUn0mntqZCceWapIFWFs
```

### 2. Database Setup

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Open the SQL Editor
3. Copy and paste the contents of `DATABASE_SCHEMA.sql`
4. Execute all the SQL commands to create tables and policies

**Tables Created:**
- `user_profiles` - Store user account information
- `subscriptions` - Track active subscriptions
- `payments` - Payment transaction history
- `reports` - User-generated research reports

### 3. Authentication

#### Email/Password Setup ✅
Authentication is already configured with:
- Sign up with email/password
- Sign in with email/password
- Password reset functionality
- User profiles auto-created on signup

#### Google OAuth (Optional)

To enable Google OAuth:

1. Go to Supabase Dashboard → Authentication → Providers
2. Click "Google"
3. Provide your Google OAuth credentials
4. Update the redirect URL in `lib/supabase.ts` if needed

### 4. Razorpay Integration

#### Test Keys (Already Added) ✅
```
Test Key ID: rzp_test_T5OQQa9EHRrrlK
Test Secret: SAVJWUn0mntqZCceWapIFWFs
```

#### Key Features Implemented:

✅ **Payment Processing**
- Create Razorpay orders
- Verify payment signatures (secure)
- Handle payment success/failure
- Refund management

✅ **Subscription Management**
- Free plan activation
- Pro plan (₹499/month)
- Team plan (₹1499/month)
- Auto-expire subscriptions after 30 days

✅ **Webhooks**
- Handle payment.captured events
- Handle payment.failed events
- Handle order.paid events
- Automatic status updates

#### Razorpay Terms & Conditions Summary:

1. **Amount Handling**
   - Amounts must be in paise (1 INR = 100 paise)
   - Minimum: ₹1 (100 paise)
   - Maximum: ₹1,00,00,000

2. **Security**
   - Always verify signatures on backend
   - Use SHA256 HMAC
   - Never verify on client-side

3. **Refunds**
   - Full refunds: 3-5 business days
   - Partial refunds available
   - Some payment methods may restrict refunds

4. **Supported Payment Methods**
   - Credit cards
   - Debit cards
   - UPI
   - Wallets
   - NetBanking
   - 3D Secure authentication

5. **Settlement**
   - T+2 days to merchant account
   - Daily or Weekly settlement (configurable)

6. **PCI Compliance**
   - Level 1 compliant
   - AES-256 encryption
   - Never store sensitive payment data

### 5. API Routes

#### Create Order
**POST** `/api/razorpay/create-order`
```json
{
  "userId": "user-uuid",
  "plan": "pro",
  "email": "user@example.com"
}
```

#### Verify Payment
**POST** `/api/razorpay/verify-payment`
```json
{
  "razorpay_order_id": "order_xyz",
  "razorpay_payment_id": "pay_xyz",
  "razorpay_signature": "sig_xyz",
  "userId": "user-uuid",
  "plan": "pro"
}
```

#### Webhook
**POST** `/api/razorpay/webhook`
- Handles: payment.captured, payment.failed, order.paid
- Requires: X-Razorpay-Signature header

### 6. Frontend Components

#### CheckoutButton
```tsx
<CheckoutButton 
  plan="pro" 
  onSuccess={(orderId) => {}}
  onError={(error) => {}}
/>
```

#### PricingComponent
Pre-built pricing page with all three tiers and checkout integration

### 7. File Structure

```
lib/
├── supabase.ts          # Supabase client & utilities
└── razorpay.ts          # Razorpay utilities & PRICING_PLANS

context/
└── auth-context.tsx     # Global auth state management

app/
├── api/
│   └── razorpay/
│       ├── create-order/route.ts
│       ├── verify-payment/route.ts
│       └── webhook/route.ts
├── signin/page.tsx      # Sign in with Supabase
├── signup/page.tsx      # Sign up with Supabase
└── dashboard/page.tsx   # Protected dashboard

components/
└── payment/
    ├── checkout-button.tsx
    └── pricing.tsx
```

### 8. Authentication Flow

1. User signs up at `/signup`
   - Creates Supabase user
   - Creates user_profile record
   - Gets free plan by default

2. User signs in at `/signin`
   - Authenticates with Supabase
   - Fetches user profile

3. User upgrades at `/pricing`
   - Clicks upgrade button
   - Creates Razorpay order
   - Opens Razorpay checkout modal
   - Backend verifies payment signature
   - Creates subscription record
   - Updates user plan

### 9. Security Checklist

✅ Payment signature verification on backend
✅ Row-Level Security (RLS) on all tables
✅ Never expose secret keys to client
✅ HTTPS for all payment communications
✅ Input validation on all API routes
✅ Webhook signature verification
✅ Error handling without exposing sensitive info

### 10. Testing

#### Test Razorpay with Test Cards

**Success Card:**
```
Card Number: 4111 1111 1111 1111
Expiry: 12/25
CVV: 123
```

**Failed Payment Card:**
```
Card Number: 4111 1111 1111 1110
Expiry: 12/25
CVV: 123
```

#### Test User Accounts

Create accounts using any email/password combination:
- email@test.com / password123
- Another account will create new subscription

### 11. Pricing Tiers

| Plan | Price | Features |
|------|-------|----------|
| **Free** | ₹0 | 5 reports/month, basic features |
| **Pro** | ₹499 | Unlimited reports, API access |
| **Team** | ₹1499 | Everything + team collab, priority support |

### 12. Going Live

When moving to production:

1. **Get Live Razorpay Keys**
   - Sign up at https://razorpay.com
   - Go to Settings → API Keys
   - Get live keys (production)

2. **Update Environment Variables**
   ```
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxx
   ```

3. **Webhook Setup in Razorpay Dashboard**
   - Add endpoint: `https://yourdomain.com/api/razorpay/webhook`
   - Subscribe to: payment.captured, payment.failed, order.paid
   - Get webhook secret and add to environment variables

4. **DNS & SSL**
   - Ensure SSL certificate is valid
   - Update payment redirect URLs

5. **Compliance**
   - Review Razorpay terms
   - Implement proper error handling
   - Add proper logging
   - Have customer support ready

### 13. Troubleshooting

**Payment stuck in pending:**
- Check Razorpay dashboard for payment status
- Verify webhook is configured
- Check backend logs for errors

**Signature verification failing:**
- Ensure RAZORPAY_KEY_SECRET is correct
- Verify order_id and payment_id match
- Check webhook secret if using webhooks

**User profile not created:**
- Check Supabase auth.users table
- Verify user_profiles table exists
- Check RLS policies

### 14. Additional Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Razorpay Test Card Details](https://razorpay.com/docs/payments/dashboard/test-mode/)
- [Razorpay Integration Checklist](https://razorpay.com/docs/payments/integration-guide/)

## Need Help?

If you need any modifications or have questions:
1. Check the implementation in `lib/razorpay.ts` and `lib/supabase.ts`
2. Review API routes in `app/api/razorpay/`
3. Check the auth context at `context/auth-context.tsx`
4. Refer to component usage in `components/payment/`

---

**Status**: ✅ Ready for development

All dependencies installed and integrated. Start the dev server and navigate to `/signin` to test!
