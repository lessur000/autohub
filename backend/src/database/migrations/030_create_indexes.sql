CREATE INDEX idx_products_active_name
    ON products (is_active, name);

CREATE INDEX idx_product_categories_category
    ON product_categories (category_id);

CREATE INDEX idx_product_images_product_sort
    ON product_images (product_id, sort_order);

CREATE INDEX idx_shipping_addresses_user
    ON shipping_addresses (user_id);

CREATE UNIQUE INDEX uq_shipping_default_per_user
    ON shipping_addresses (user_id)
    WHERE is_default;

CREATE INDEX idx_cart_items_user
    ON cart_items (user_id);

CREATE INDEX idx_orders_user_created
    ON orders (user_id, placed_at DESC);

CREATE INDEX idx_orders_status_created
    ON orders (status, placed_at DESC);

CREATE INDEX idx_order_items_order
    ON order_items (order_id);

CREATE INDEX idx_payments_order_created
    ON payments (order_id, created_at DESC);

CREATE INDEX idx_payments_status_created
    ON payments (status, created_at);

CREATE INDEX idx_payment_events_payment_created
    ON payment_events (payment_id, created_at DESC);

CREATE INDEX idx_webhook_events_status_received
    ON webhook_events (status, received_at);

CREATE INDEX idx_webhook_logs_event_created
    ON webhook_logs (webhook_event_id, created_at);

CREATE INDEX idx_order_events_order_created
    ON order_events (order_id, created_at);

CREATE INDEX idx_order_status_history_order_created
    ON order_status_history (order_id, created_at);

CREATE INDEX idx_inventory_movements_product_created
    ON inventory_movements (product_id, created_at DESC);

CREATE INDEX idx_password_reset_user_expiry
    ON password_reset_tokens (user_id, expires_at);

CREATE INDEX idx_email_verification_user_expiry
    ON email_verification_tokens (user_id, expires_at);

CREATE INDEX idx_refresh_tokens_user_expiry
    ON refresh_tokens (user_id, expires_at);

CREATE INDEX idx_audit_logs_created
    ON audit_logs (created_at DESC);

CREATE INDEX idx_audit_logs_actor_created
    ON audit_logs (actor_user_id, created_at DESC);

CREATE INDEX idx_contact_messages_status_created
    ON contact_messages (status, created_at DESC);

CREATE INDEX idx_product_reviews_product_published
    ON product_reviews (
        product_id,
        is_published,
        created_at DESC
    );

CREATE INDEX idx_refund_requests_payment
    ON refund_requests (payment_id, created_at DESC);

CREATE INDEX idx_refund_logs_request_created
    ON refund_logs (refund_request_id, created_at);

CREATE INDEX idx_returns_order_created
    ON returns (order_id, created_at DESC);

CREATE INDEX idx_return_items_order_item
    ON return_items (order_item_id);

CREATE INDEX idx_return_evidence_return
    ON return_evidence (return_id);