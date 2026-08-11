-- Nexora: Consolidated research pipeline migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to run on a fresh project or after DATABASE_SCHEMA.sql

-- Step 1: Add research pipeline columns to reports table
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS query        TEXT,
  ADD COLUMN IF NOT EXISTS report_json  JSONB   DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sources_json JSONB   DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tokens_used  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS model        TEXT;

-- Step 2: Widen status column to plain TEXT
ALTER TABLE public.reports
  ALTER COLUMN status TYPE TEXT USING status::TEXT;

-- Step 3: Drop the old status constraint (draft/published/archived)
ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_status_check;

-- Step 4: Add the research-pipeline status constraint
ALTER TABLE public.reports
  ADD CONSTRAINT reports_status_check
  CHECK (status IN ('researching', 'searching', 'analyzing', 'writing', 'saving', 'completed', 'failed'));

-- Step 5: Performance indexes
CREATE INDEX IF NOT EXISTS idx_reports_status     ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user_id    ON public.reports(user_id);

-- Step 6: Ensure RLS UPDATE policy exists for reports (needed by research API)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'reports'
      AND policyname = 'Users can update their reports'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their reports" ON reports FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
END
$$;
