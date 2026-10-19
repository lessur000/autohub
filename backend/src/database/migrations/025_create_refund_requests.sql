CREATE TABLE refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL
        REFERENCES payments(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL
        REFERENCES orders(id) ON DELETE RESTRICT,
    requested_by UUID
        REFERENCES users(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    currency CHAR(3) NOT NULL DEFAULT 'PHP',
    status refund_status NOT NULL DEFAULT 'requested',
    reason TEXT NOT NULL,
    provider_refund_id TEXT UNIQUE,
    reviewed_by UUID
        REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);