import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    CREATE TABLE IF NOT EXISTS "categories" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" varchar(255) NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "categories_name_unique" UNIQUE("name")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "product_categories" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "product_id" uuid NOT NULL,
      "category_id" uuid NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "product_categories_product_id_category_id_unique" UNIQUE("product_id","category_id")
    )
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk"
        FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  console.log("Categories tables created successfully.");
}

main().catch(console.error);
