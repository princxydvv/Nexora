-- Nexora: Upgrade reports table for AI research analyst feature
-- Run this in Supabase SQL Editor if the previous migration has not been applied

-- Step 1: Add missing columns (safe with IF NOT EXISTS)
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS query        TEXT,
  ADD COLUMN IF NOT EXISTS report_json  JSONB   DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sources_json JSONB   DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tokens_used  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS model        TEXT;

-- Step 2: Widen status to TEXT so we can change the constraint
ALTER TABLE public.reports
  ALTER COLUMN status TYPE TEXT USING status::TEXT;

-- Step 3: Drop the old status constraint (draft/published/archived)
ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_status_check;

-- Step 4: Add the new research-pipeline status constraint
ALTER TABLE public.reports
  ADD CONSTRAINT reports_status_check
  CHECK (status IN ('researching', 'searching', 'analyzing', 'writing', 'saving', 'completed', 'failed'));

-- Step 5: Performance indexes
CREATE INDEX IF NOT EXISTS idx_reports_status     ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user_id    ON public.reports(user_id);
