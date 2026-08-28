-- ============================================================
-- NEXORA SECURITY HARDENING 005
-- Goal: prevent client-side privilege escalation.
--  1. Drop user-owned INSERT/UPDATE policies on subscriptions + payments
--  2. Add trigger to lock privileged user_profiles columns for non-service roles
-- Run in Supabase SQL Editor. Safe to re-run (uses IF EXISTS / OR REPLACE).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. subscriptions: users can SELECT their own row ONLY.
--    INSERT/UPDATE are reserved for the service role.
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert their subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their subscriptions" ON subscriptions;

-- ────────────────────────────────────────────────────────────
-- 2. payments: users can SELECT their own rows ONLY.
--    INSERT/UPDATE are reserved for the service role.
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert their payments" ON payments;
DROP POLICY IF EXISTS "Users can update their payments" ON payments;

-- ────────────────────────────────────────────────────────────
-- 3. user_profiles: users may SELECT + INSERT their own row, but
--    privileged billing columns can only be written by the
--    service role. A BEFORE trigger enforces safe defaults and
--    blocks non-service writes to billing state.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.protect_user_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  is_service BOOLEAN;
BEGIN
  -- auth.role() reads the JWT claim: 'service_role' for the service key,
  -- 'authenticated' for a user session, or NULL when unauthenticated.
  SELECT COALESCE(auth.role() = 'service_role', false) INTO is_service;

  IF TG_OP = 'INSERT' THEN
    IF NOT is_service THEN
      -- Force safe defaults regardless of what the client sent
      NEW.subscription_plan := 'free';
      NEW.reports_used      := 0;
      NEW.reports_limit     := 5;
      NEW.credits_remaining := 5;
      NEW.usage_reset_at    := date_trunc('month', now()) + interval '1 month';
      NEW.updated_at        := now();
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT is_service THEN
      -- Non-service callers can NEVER modify billing state:
      -- keep whatever the server last wrote.
      NEW.subscription_plan := OLD.subscription_plan;
      NEW.reports_used      := OLD.reports_used;
      NEW.reports_limit     := OLD.reports_limit;
      NEW.credits_remaining := OLD.credits_remaining;
      NEW.usage_reset_at    := OLD.usage_reset_at;
      NEW.updated_at        := now();
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_profiles_insert ON user_profiles;
CREATE TRIGGER trg_protect_user_profiles_insert
  BEFORE INSERT ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_profile_privileges();

DROP TRIGGER IF EXISTS trg_protect_user_profiles_update ON user_profiles;
CREATE TRIGGER trg_protect_user_profiles_update
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_profile_privileges();