CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL
        REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(250),
    sort_order INTEGER NOT NULL DEFAULT 0
        CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);