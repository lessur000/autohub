-- AutoHub
-- PostgreSQL 14+
-- Initial database types and extensions.
-- Run only against a new, empty development database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    CREATE TYPE user_role AS ENUM (
        'customer',
        'admin',
        'staff'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE order_status AS ENUM (
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'returned'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending',
        'authorized',
        'paid',
        'failed',
        'expired',
        'cancelled',
        'partially_refunded',
        'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE payment_provider AS ENUM (
        'xendit',
        'manual'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE inventory_movement_type AS ENUM (
        'restock',
        'sale',
        'return',
        'adjustment',
        'reservation',
        'release'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE refund_status AS ENUM (
        'requested',
        'approved',
        'rejected',
        'processing',
        'succeeded',
        'failed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE return_status AS ENUM (
        'requested',
        'approved',
        'rejected',
        'in_transit',
        'received',
        'inspected',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;