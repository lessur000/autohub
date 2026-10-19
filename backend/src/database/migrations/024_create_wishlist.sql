CREATE TABLE wishlist (
    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL
        REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, product_id)
);