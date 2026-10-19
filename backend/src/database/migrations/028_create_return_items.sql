CREATE TABLE return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL
        REFERENCES returns(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL
        REFERENCES order_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    condition_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (return_id, order_item_id)
);