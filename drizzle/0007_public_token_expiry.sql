-- Add expiry timestamp for public pre-order tokens
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "public_token_expires_at" timestamp;
