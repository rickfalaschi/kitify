-- Add back "awaiting_shipping_quote" as a dedicated status for international
-- orders that need an admin shipping quote before the payment link is released.
ALTER TYPE "public"."order_status" ADD VALUE IF NOT EXISTS 'awaiting_shipping_quote' BEFORE 'awaiting_payment';
