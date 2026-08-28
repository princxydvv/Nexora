# PHASE 2 SETUP GUIDE

## Step 1: Add Environment Variables

Add these to your `.env.local`:

```bash
# Get from Supabase Dashboard → Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Set in Razorpay Dashboard → Webhooks → Create Webhook
RAZORPAY_WEBHOOK_SECRET=whsec_...

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 2: Run Database Migration

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire contents of `supabase/migrations/002_billing_system.sql`
4. Paste into SQL editor
5. Click "Run"
6. Verify no errors

## Step 3: Configure Razorpay Webhook

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Click "Create Webhook"
3. **URL:** `https://yourdomain.com/api/razorpay/webhook`
4. **Events:** Select all subscription and payment events
5. Copy the **Webhook Secret**
6. Add to `.env.local` as `RAZORPAY_WEBHOOK_SECRET`

## Step 4: Test Locally

```bash
# Start dev server
pnpm dev

# Test payment flow
# 1. Go to http://localhost:3000/#pricing
# 2. Click "Upgrade to Pro"
# 3. Use Razorpay test card: 4111111111111111
# 4. Expiry: 12/25, CVV: 123
# 5. Should redirect to /payment-success

# Test webhook (Razorpay Dashboard)
# 1. Go to Webhooks → Your webhook
# 2. Click "Send Test Event"
# 3. Check server logs for webhook processing
```

## Step 5: Deploy to Production

```bash
# Build
pnpm build

# Deploy (Vercel)
vercel deploy --prod

# Or deploy to your hosting
```

## Step 6: Verify Production

1. Set environment variables in production
2. Test payment flow with real card (or test mode)
3. Check Razorpay Dashboard → Webhooks → Logs
4. Verify subscription activated in Supabase
5. Check `/billing` page shows correct usage

## Troubleshooting

### Webhook not triggering

- Check `RAZORPAY_WEBHOOK_SECRET` is set correctly
- Verify webhook URL is accessible from internet
- Check Razorpay Dashboard → Webhooks → Logs for errors
- Test with "Send Test Event" button

### Payment not activating subscription

- Check Supabase logs for errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check webhook handler logs
- Manually test webhook with curl:

```bash
curl -X POST http://localhost:3000/api/razorpay/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: test" \
  -d '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_123","order_id":"order_123","notes":{"userId":"user-id"}}}}}'
```

### Usage not incrementing

- Check `increment_report_usage()` function exists in Supabase
- Verify research API calls the function after report generation
- Check user_profiles table for reports_used column

---

## Key Files to Know

- `lib/billing/plans.ts` — Plan definitions (edit here to change limits)
- `lib/billing/gate.ts` — Feature gate logic (edit here to change enforcement)
- `app/api/razorpay/webhook/route.ts` — Webhook handler (edit here to add events)
- `app/billing/page.tsx` — Billing dashboard (edit here to change UI)
- `supabase/migrations/002_billing_system.sql` — Database schema

---

## Support

If you encounter issues:

1. Check server logs: `pnpm dev` output
2. Check Supabase logs: Dashboard → Logs
3. Check Razorpay logs: Dashboard → Webhooks → Logs
4. Review `PHASE_2_COMPLETION_REPORT.md` for architecture details
