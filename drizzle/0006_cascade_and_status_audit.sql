-- FK hardening: tighten existing foreign keys and add the order status audit log.

-- orders.user_id → RESTRICT: prevent accidental orphaning of orders when an
-- admin deletes a user. Soft-delete is a larger refactor; for now we simply
-- block the delete at the DB level.
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint

-- order_items.order_id → CASCADE: if the parent order is deleted, its snapshot
-- items should go with it (otherwise we leak orphans).
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_orders_id_fk";--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- kit_items.kit_id → CASCADE: deleting a kit should also delete its items
-- (kit_item_variations + their options already cascade through kit_item_id).
ALTER TABLE "kit_items" DROP CONSTRAINT "kit_items_kit_id_kits_id_fk";--> statement-breakpoint
ALTER TABLE "kit_items" ADD CONSTRAINT "kit_items_kit_id_kits_id_fk" FOREIGN KEY ("kit_id") REFERENCES "public"."kits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Append-only audit log of order status transitions. `from_status` is NULL
-- for the initial creation row; `changed_by_user_id` is NULL for system
-- transitions (e.g. Stripe webhook).
CREATE TABLE "order_status_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" "order_status",
	"to_status" "order_status" NOT NULL,
	"changed_by_user_id" uuid,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_status_changes" ADD CONSTRAINT "order_status_changes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_changes" ADD CONSTRAINT "order_status_changes_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_status_changes_order_id_idx" ON "order_status_changes" ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_changes_created_at_idx" ON "order_status_changes" ("created_at");
