-- ============================================================
-- NEXORA WEBHOOK IDEMPOTENCY MIGRATION
-- Prevents duplicate webhook processing
-- ============================================================

-- Create webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);

-- Service role can insert webhook events
CREATE POLICY IF NOT EXISTS "Service role can insert webhook_events"
    ON webhook_events FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Enable RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
