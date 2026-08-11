-- ============================================================
-- NEXORA WEBHOOK ENHANCEMENTS MIGRATION
-- Adds fields needed for full webhook synchronization
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add razorpay_customer_id to user_profiles
-- Needed to sync the Razorpay customer ID for subscription management
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;

-- 2. Add pause/resume tracking columns to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMP WITH TIME ZONE;

-- 3. Reconcile razorpay_sub_id / razorpay_subscription_id
-- The base schema used razorpay_subscription_id, migration 002 added razorpay_sub_id.
-- Ensure both exist and are kept in sync via a trigger.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS razorpay_sub_id TEXT;

-- 4. Add unique constraint on webhook_events.event_id (defense-in-depth)
-- The application checks before insert, but this guarantees no duplicates
-- even under race conditions.
ALTER TABLE webhook_events DROP CONSTRAINT IF EXISTS webhook_events_event_id_key;
ALTER TABLE webhook_events ADD CONSTRAINT webhook_events_event_id_key UNIQUE (event_id);

-- 5. Add index on subscriptions.razorpay_sub_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_sub_id ON subscriptions(razorpay_sub_id);

-- 6. Add index on user_profiles.razorpay_customer_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_razorpay_customer_id ON user_profiles(razorpay_customer_id);

-- 7. Trigger to keep razorpay_sub_id and razorpay_subscription_id in sync
CREATE OR REPLACE FUNCTION public.sync_razorpay_subscription_ids()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.razorpay_sub_id IS NOT NULL AND NEW.razorpay_subscription_id IS NULL THEN
    NEW.razorpay_subscription_id := NEW.razorpay_sub_id;
  ELSIF NEW.razorpay_subscription_id IS NOT NULL AND NEW.razorpay_sub_id IS NULL THEN
    NEW.razorpay_sub_id := NEW.razorpay_subscription_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_razorpay_subscription_ids ON subscriptions;
CREATE TRIGGER trg_sync_razorpay_subscription_ids
BEFORE INSERT OR UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION public.sync_razorpay_subscription_ids();

-- Done