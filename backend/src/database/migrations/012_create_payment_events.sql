CREATE TABLE payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID
        REFERENCES payments(id) ON DELETE SET NULL,
    order_id UUID
        REFERENCES orders(id) ON DELETE SET NULL,
    provider VARCHAR(40) NOT NULL,
    event_type VARCHAR(120) NOT NULL,
    provider_event_id VARCHAR(255),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_event_id)
);