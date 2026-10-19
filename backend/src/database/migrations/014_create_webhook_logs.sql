CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_event_id UUID
        REFERENCES webhook_events(id) ON DELETE SET NULL,
    level VARCHAR(20) NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);