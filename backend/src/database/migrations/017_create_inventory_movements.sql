CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL
        REFERENCES products(id) ON DELETE RESTRICT,
    movement_type inventory_movement_type NOT NULL,
    quantity_delta INTEGER NOT NULL
        CHECK (quantity_delta <> 0),
    reference_type VARCHAR(60),
    reference_id UUID,
    note TEXT,
    actor_user_id UUID
        REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);