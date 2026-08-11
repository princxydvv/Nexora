-- Nexora research report storage upgrade

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS query TEXT,
  ADD COLUMN IF NOT EXISTS report_json JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sources_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tokens_used INTEGER,
  ADD COLUMN IF NOT EXISTS model TEXT;

ALTER TABLE public.reports
  ALTER COLUMN status TYPE TEXT USING status::TEXT;

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_status_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_status_check
  CHECK (status IN ('researching', 'searching', 'analyzing', 'writing', 'saving', 'completed', 'failed'));

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
