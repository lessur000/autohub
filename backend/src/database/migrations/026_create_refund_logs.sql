CREATE TABLE refund_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refund_request_id UUID NOT NULL
        REFERENCES refund_requests(id) ON DELETE CASCADE,
    actor_user_id UUID
        REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);