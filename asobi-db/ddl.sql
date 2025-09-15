-- PostgreSQL DDL for invite-based authentication

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE invite_status AS ENUM (
    'pending',
    'accepted',
    'revoked',
    'expired'
);

CREATE TABLE invites (
    invite_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    status invite_status NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    note TEXT,
    invited_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    firebase_uid TEXT NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    invite_id INTEGER REFERENCES invites(invite_id),
    role VARCHAR(50) NOT NULL DEFAULT 'beta_user',
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth_logs (
    log_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    invite_id INTEGER REFERENCES invites(invite_id),
    detail TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invites_updated_at
BEFORE UPDATE ON invites
FOR EACH ROW
EXECUTE FUNCTION update_invites_updated_at();

CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();
