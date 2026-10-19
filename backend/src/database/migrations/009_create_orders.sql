CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(40) NOT NULL UNIQUE,
    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    status order_status NOT NULL DEFAULT 'pending',
    currency CHAR(3) NOT NULL DEFAULT 'PHP',
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (shipping_fee >= 0),
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (discount_amount >= 0),
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    shipping_address_snapshot JSONB NOT NULL,
    customer_note TEXT,
    placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT orders_total_consistent
        CHECK (
            total_amount =
            subtotal + shipping_fee - discount_amount
        )
);