-- Migrate orders.status to new enum values with explicit mapping:
--   incomplete              -> pending
--   awaiting_shipping_quote -> pending
--   awaiting_payment        -> awaiting_payment   (unchanged)
--   pending (old, paid)     -> payment_confirmed
--   processing              -> in_production
--   shipped                 -> shipped            (unchanged)
--   delivered               -> completed
--   cancelled               -> cancelled          (unchanged)

ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'awaiting_payment', 'payment_confirmed', 'in_production', 'shipped', 'completed', 'cancelled');--> statement-breakpoint
UPDATE "orders" SET "status" = CASE "status"
  WHEN 'incomplete'              THEN 'pending'
  WHEN 'awaiting_shipping_quote' THEN 'pending'
  WHEN 'pending'                 THEN 'payment_confirmed'
  WHEN 'processing'              THEN 'in_production'
  WHEN 'delivered'               THEN 'completed'
  ELSE "status"
END;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."order_status";
