-- ============================================================
-- NEXORA BILLING SYSTEM MIGRATION
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add billing columns to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS reports_used     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reports_limit    INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS credits_remaining INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS usage_reset_at   TIMESTAMP WITH TIME ZONE DEFAULT (date_trunc('month', now()) + interval '1 month');

-- 2. Add subscription tracking columns to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS current_period_end   TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS razorpay_sub_id      TEXT;

-- 3. Fix reports table to match actual API schema
-- (The original schema had wrong columns — this adds the missing ones)
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS query        TEXT,
  ADD COLUMN IF NOT EXISTS report_json  JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sources_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tokens_used  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS model        TEXT;

-- Update status check constraint on reports to match actual values
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE reports ADD CONSTRAINT reports_status_check
  CHECK (status IN ('researching','searching','analyzing','writing','saving','completed','failed'));

-- 4. Add missing indexes
CREATE INDEX IF NOT EXISTS idx_reports_status      ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at  ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user  ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_exp   ON subscriptions(expires_at);

-- 5. Service role bypass policies (needed for webhook handler)
-- These allow the service role key to update any row regardless of RLS
CREATE POLICY IF NOT EXISTS "Service role can update user_profiles"
  ON user_profiles FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role can update payments"
  ON payments FOR UPDATE
  USING (auth.role() = 'service_role');

-- 6. Function: increment report usage atomically
CREATE OR REPLACE FUNCTION public.increment_report_usage(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_profiles
  SET
    reports_used      = reports_used + 1,
    credits_remaining = GREATEST(credits_remaining - 1, 0),
    updated_at        = now()
  WHERE id = p_user_id;
END;
$$;

-- 7. Function: reset monthly usage (call via cron or manually)
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_profiles
  SET
    reports_used      = 0,
    credits_remaining = reports_limit,
    usage_reset_at    = date_trunc('month', now()) + interval '1 month',
    updated_at        = now()
  WHERE usage_reset_at <= now();
END;
$$;

-- 8. Function: activate subscription (called by webhook)
CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_user_id    UUID,
  p_plan       TEXT,
  p_order_id   TEXT,
  p_payment_id TEXT,
  p_amount     INTEGER,
  p_period_end TIMESTAMP WITH TIME ZONE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  -- Determine report limit by plan
  v_limit := CASE p_plan
    WHEN 'pro'  THEN 999999
    WHEN 'team' THEN 999999
    ELSE 5
  END;

  -- Upsert subscription
  INSERT INTO subscriptions (user_id, plan, razorpay_order_id, razorpay_payment_id, amount, status, started_at, expires_at, current_period_end)
  VALUES (p_user_id, p_plan, p_order_id, p_payment_id, p_amount, 'active', now(), p_period_end, p_period_end)
  ON CONFLICT (user_id) DO UPDATE
    SET plan                 = EXCLUDED.plan,
        razorpay_order_id    = EXCLUDED.razorpay_order_id,
        razorpay_payment_id  = EXCLUDED.razorpay_payment_id,
        amount               = EXCLUDED.amount,
        status               = 'active',
        started_at           = now(),
        expires_at           = EXCLUDED.expires_at,
        current_period_end   = EXCLUDED.current_period_end,
        updated_at           = now();

  -- Update user profile
  UPDATE user_profiles
  SET
    subscription_plan  = p_plan,
    reports_limit      = v_limit,
    credits_remaining  = v_limit,
    reports_used       = 0,
    updated_at         = now()
  WHERE id = p_user_id;
END;
$$;

-- 9. Add UNIQUE constraint on subscriptions.user_id so upsert works
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_unique;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);

-- Done
