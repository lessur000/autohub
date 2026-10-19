CREATE TABLE return_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL
        REFERENCES returns(id) ON DELETE CASCADE,
    uploaded_by UUID
        REFERENCES users(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    mime_type VARCHAR(120),
    file_size_bytes BIGINT
        CHECK (
            file_size_bytes IS NULL OR file_size_bytes > 0
        ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);