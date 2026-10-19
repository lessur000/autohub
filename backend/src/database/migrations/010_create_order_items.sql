CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL
        REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID
        REFERENCES products(id) ON DELETE SET NULL,
    product_sku_snapshot VARCHAR(80) NOT NULL,
    product_name_snapshot VARCHAR(200) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT order_items_total_check
        CHECK (line_total = unit_price * quantity)
);