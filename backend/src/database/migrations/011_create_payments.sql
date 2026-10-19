CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL
        REFERENCES orders(id) ON DELETE RESTRICT,
    provider payment_provider NOT NULL DEFAULT 'xendit',
    status payment_status NOT NULL DEFAULT 'pending',
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    currency CHAR(3) NOT NULL DEFAULT 'PHP',
    provider_payment_request_id TEXT UNIQUE,
    provider_payment_id TEXT UNIQUE,
    provider_reference_id VARCHAR(120) NOT NULL UNIQUE,
    payment_method VARCHAR(80),
    checkout_url TEXT,
    qr_string TEXT,
    failure_code VARCHAR(120),
    failure_message TEXT,
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);