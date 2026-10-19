CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(40) NOT NULL DEFAULT 'xendit',
    event_key VARCHAR(255) NOT NULL,
    event_type VARCHAR(120) NOT NULL,
    resource_id VARCHAR(255),
    payload JSONB NOT NULL,
    signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'received'
        CHECK (
            status IN (
                'received',
                'processing',
                'processed',
                'failed',
                'ignored'
            )
        ),
    attempts INTEGER NOT NULL DEFAULT 0
        CHECK (attempts >= 0),
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    last_error TEXT,
    UNIQUE (provider, event_key)
);