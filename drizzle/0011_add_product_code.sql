ALTER TABLE "products" ADD COLUMN "code" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_code_unique" UNIQUE("code");
