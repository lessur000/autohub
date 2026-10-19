CREATE TABLE shipping_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    recipient_name VARCHAR(160) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    address_line1 VARCHAR(250) NOT NULL,
    address_line2 VARCHAR(250),
    barangay VARCHAR(120),
    city VARCHAR(120) NOT NULL,
    province VARCHAR(120) NOT NULL,
    postal_code VARCHAR(20),
    country_code CHAR(2) NOT NULL DEFAULT 'PH',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);