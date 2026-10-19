CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL
        REFERENCES orders(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    status return_status NOT NULL DEFAULT 'requested',
    reason TEXT NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by UUID
        REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);