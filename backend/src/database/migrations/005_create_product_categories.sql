CREATE TABLE product_categories (
    product_id UUID NOT NULL
        REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL
        REFERENCES categories(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (product_id, category_id)
);