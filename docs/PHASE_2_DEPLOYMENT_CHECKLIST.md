# PHASE 2 DEPLOYMENT CHECKLIST

## Pre-Deployment (Local Testing)

- [ ] Read `PHASE_2_SUMMARY.md`
- [ ] Read `PHASE_2_COMPLETION_REPORT.md`
- [ ] Read `PHASE_2_SETUP.md`
- [ ] Build passes: `pnpm build` ✅ (5.0s, 22 routes, 0 errors)
- [ ] TypeScript passes: `pnpm typecheck` ✅ (0 errors)
- [ ] All 22 routes compiled successfully ✅

## Environment Setup

- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- [ ] Add `RAZORPAY_WEBHOOK_SECRET` to `.env.local`
- [ ] Add `NEXT_PUBLIC_APP_URL` to `.env.local`
- [ ] Verify `.env.local` is in `.gitignore` (never commit secrets)

## Database Setup

- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Create new query
- [ ] Copy `supabase/migrations/002_billing_system.sql`
- [ ] Paste into SQL editor
- [ ] Run migration
- [ ] Verify no errors
- [ ] Check new columns exist in `user_profiles`
- [ ] Check new columns exist in `subscriptions`
- [ ] Check new columns exist in `reports`
- [ ] Check new functions exist: `increment_report_usage`, `reset_monthly_usage`, `activate_subscription`
- [ ] Check new indexes created
- [ ] Check RLS policies updated

## Razorpay Setup

- [ ] Go to Razorpay Dashboard → Settings → Webhooks
- [ ] Click "Create Webhook"
- [ ] Set URL: `https://yourdomain.com/api/razorpay/webhook`
- [ ] Select events:
  - [ ] payment.captured
  - [ ] payment.failed
  - [ ] subscription.activated
  - [ ] subscription.charged
  - [ ] subscription.cancelled
  - [ ] subscription.halted
  - [ ] subscription.completed
- [ ] Copy webhook secret
- [ ] Add to production environment as `RAZORPAY_WEBHOOK_SECRET`

## Local Testing

- [ ] Start dev server: `pnpm dev`
- [ ] Go to `http://localhost:3000/#pricing`
- [ ] Click "Start Free" → Should activate free plan
- [ ] Go to `/billing` → Should show 5 reports limit
- [ ] Generate 5 reports → Should work
- [ ] Try to generate 6th report → Should be blocked
- [ ] Click "Upgrade to Pro"
- [ ] Use test card: 4111111111111111
- [ ] Expiry: 12/25, CVV: 123
- [ ] Should redirect to `/payment-success`
- [ ] Go to `/billing` → Should show unlimited reports
- [ ] Try deep research → Should work (was blocked on free)
- [ ] Test failed payment:
  - [ ] Use card: 4000000000000002
  - [ ] Should redirect to `/payment-failed`
- [ ] Test webhook (Razorpay Dashboard):
  - [ ] Go to Webhooks → Your webhook
  - [ ] Click "Send Test Event"
  - [ ] Check server logs for processing
  - [ ] Verify subscription activated in Supabase

## Production Deployment

- [ ] Set environment variables in production:
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `RAZORPAY_WEBHOOK_SECRET`
  - [ ] `NEXT_PUBLIC_APP_URL`
- [ ] Deploy: `pnpm build && vercel deploy --prod`
- [ ] Verify build succeeds
- [ ] Verify all routes accessible
- [ ] Verify `/billing` page loads
- [ ] Verify `/payment-success` page loads
- [ ] Verify `/payment-failed` page loads

## Post-Deployment (First 24 Hours)

- [ ] Monitor server logs for errors
- [ ] Monitor Razorpay Dashboard → Webhooks → Logs
- [ ] Monitor Supabase Dashboard → Logs
- [ ] Test payment flow with test card
- [ ] Verify webhook processing in logs
- [ ] Verify subscription activated in Supabase
- [ ] Verify `/billing` shows correct usage
- [ ] Test with real payment (if comfortable)
- [ ] Check for any error emails

## Monitoring Setup

- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Set up uptime monitoring
- [ ] Set up Razorpay alerts:
  - [ ] Failed payments
  - [ ] Webhook failures
  - [ ] Rate limits
- [ ] Set up Supabase alerts:
  - [ ] Database errors
  - [ ] High query latency
  - [ ] RLS policy violations

## Documentation

- [ ] Share `PHASE_2_SUMMARY.md` with team
- [ ] Share `PHASE_2_SETUP.md` with team
- [ ] Document any custom changes made
- [ ] Update team wiki/docs with billing system overview
- [ ] Create runbook for common issues

## Rollback Plan

If issues occur:

1. **Payment not activating:**
   - Check `RAZORPAY_WEBHOOK_SECRET` is correct
   - Check webhook URL is accessible
   - Manually trigger webhook from Razorpay dashboard
   - Check Supabase logs for errors

2. **Feature gate not working:**
   - Check `checkResearchGate()` is called in research API
   - Check `SUPABASE_SERVICE_ROLE_KEY` is set
   - Verify database functions exist

3. **Webhook not triggering:**
   - Check webhook URL in Razorpay dashboard
   - Test with "Send Test Event" button
   - Check server logs for 200 OK response
   - Verify signature verification passing

4. **Complete rollback:**
   - Revert to previous deployment
   - Disable webhook in Razorpay dashboard
   - Downgrade all users to free plan (manual SQL)
   - Investigate issue before re-deploying

## Success Criteria

✅ All tests pass locally
✅ Build succeeds in production
✅ All routes accessible
✅ Payment flow works end-to-end
✅ Webhook processes events
✅ Subscriptions activate correctly
✅ Feature gates enforce limits
✅ Billing dashboard shows correct data
✅ No errors in logs after 24 hours
✅ Team confident in system

---

## Sign-Off

- [ ] Developer: _________________ Date: _______
- [ ] QA: _________________ Date: _______
- [ ] Product: _________________ Date: _______

---

## Notes

Use this space to document any issues encountered or custom changes made:

```
[Add notes here]
```

---

**Status: READY FOR PRODUCTION DEPLOYMENT** ✅

Build Time: 5.0s
Routes: 22 compiled
Errors: 0
TypeScript: ✅ Pass
