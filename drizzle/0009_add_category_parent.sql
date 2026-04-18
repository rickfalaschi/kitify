ALTER TABLE "categories" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "sort_order" integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_name_unique";
