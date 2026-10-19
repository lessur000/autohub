CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID
        REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(160) NOT NULL,
    email VARCHAR(320) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'new'
        CHECK (
            status IN ('new', 'in_progress', 'resolved', 'spam')
        ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);