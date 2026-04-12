CREATE TYPE "public"."company_role" AS ENUM('full', 'limited');--> statement-breakpoint
CREATE TYPE "public"."variation_mode" AS ENUM('fixed', 'editable');--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'incomplete' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'awaiting_shipping_quote' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'awaiting_payment' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'cancelled';--> statement-breakpoint
CREATE TABLE "company_product_mockups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variation_id" uuid,
	"image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "variation_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variation_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kit_item_variations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kit_item_id" uuid NOT NULL,
	"variation_type" "variation_type" NOT NULL,
	"mode" "variation_mode" NOT NULL,
	"default_variation_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kit_item_variations_kit_item_id_variation_type_unique" UNIQUE("kit_item_id","variation_type")
);
--> statement-breakpoint
CREATE TABLE "kit_item_variation_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kit_item_variation_id" uuid NOT NULL,
	"variation_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kit_item_variation_options_kit_item_variation_id_variation_id_unique" UNIQUE("kit_item_variation_id","variation_id")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"product_image_url" text,
	"base_price" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"product_id" uuid,
	"kit_item_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item_selections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" uuid NOT NULL,
	"variation_type" "variation_type" NOT NULL,
	"variation_value" varchar(100) NOT NULL,
	"price_adjustment" numeric(10, 2) DEFAULT '0' NOT NULL,
	"variation_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_item_selections_order_item_id_variation_type_unique" UNIQUE("order_item_id","variation_type")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kit_items" DROP CONSTRAINT "kit_items_variation_id_product_variations_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "company_addresses" ADD COLUMN "country" varchar(100) DEFAULT 'United Kingdom' NOT NULL;--> statement-breakpoint
ALTER TABLE "company_users" ADD COLUMN "role" "company_role" DEFAULT 'full' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invite_token" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "public_token" varchar(64);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stripe_payment_intent_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "total_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "employee_email" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "employee_country" varchar(100);--> statement-breakpoint
ALTER TABLE "company_product_mockups" ADD CONSTRAINT "company_product_mockups_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_product_mockups" ADD CONSTRAINT "company_product_mockups_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_product_mockups" ADD CONSTRAINT "company_product_mockups_variation_id_product_variations_id_fk" FOREIGN KEY ("variation_id") REFERENCES "public"."product_variations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variation_images" ADD CONSTRAINT "variation_images_variation_id_product_variations_id_fk" FOREIGN KEY ("variation_id") REFERENCES "public"."product_variations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kit_item_variations" ADD CONSTRAINT "kit_item_variations_kit_item_id_kit_items_id_fk" FOREIGN KEY ("kit_item_id") REFERENCES "public"."kit_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kit_item_variations" ADD CONSTRAINT "kit_item_variations_default_variation_id_product_variations_id_fk" FOREIGN KEY ("default_variation_id") REFERENCES "public"."product_variations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kit_item_variation_options" ADD CONSTRAINT "kit_item_variation_options_kit_item_variation_id_kit_item_variations_id_fk" FOREIGN KEY ("kit_item_variation_id") REFERENCES "public"."kit_item_variations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kit_item_variation_options" ADD CONSTRAINT "kit_item_variation_options_variation_id_product_variations_id_fk" FOREIGN KEY ("variation_id") REFERENCES "public"."product_variations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_selections" ADD CONSTRAINT "order_item_selections_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kit_items" DROP COLUMN "variation_id";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_invite_token_unique" UNIQUE("invite_token");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_reset_token_unique" UNIQUE("reset_token");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_public_token_unique" UNIQUE("public_token");