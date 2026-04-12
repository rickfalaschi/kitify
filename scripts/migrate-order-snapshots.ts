/**
 * One-shot migration: introduce order_items snapshot table and refactor
 * order_item_selections to reference it with snapshotted variation data.
 *
 * Run with: tsx --env-file=.env.local scripts/migrate-order-snapshots.ts
 */
import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("→ Creating order_items table...");
  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id uuid NOT NULL REFERENCES orders(id),
      product_name varchar(255) NOT NULL,
      product_image_url text,
      base_price numeric(10,2) NOT NULL,
      quantity integer NOT NULL,
      product_id uuid,
      kit_item_id uuid,
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  console.log("→ Backfilling order_items from existing orders...");
  await sql`
    INSERT INTO order_items (order_id, product_name, product_image_url, base_price, quantity, product_id, kit_item_id, sort_order, created_at)
    SELECT
      o.id AS order_id,
      p.name AS product_name,
      p.image_url AS product_image_url,
      p.base_price AS base_price,
      ki.quantity AS quantity,
      p.id AS product_id,
      ki.id AS kit_item_id,
      (ROW_NUMBER() OVER (PARTITION BY o.id ORDER BY ki.created_at) - 1) AS sort_order,
      ki.created_at AS created_at
    FROM orders o
    INNER JOIN kit_items ki ON ki.kit_id = o.kit_id
    INNER JOIN products p ON p.id = ki.product_id
    WHERE NOT EXISTS (
      SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.kit_item_id = ki.id
    )
  `;

  console.log("→ Adding new columns to order_item_selections...");
  await sql`ALTER TABLE order_item_selections ADD COLUMN IF NOT EXISTS order_item_id uuid`;
  await sql`ALTER TABLE order_item_selections ADD COLUMN IF NOT EXISTS variation_type variation_type`;
  await sql`ALTER TABLE order_item_selections ADD COLUMN IF NOT EXISTS variation_value varchar(100)`;
  await sql`ALTER TABLE order_item_selections ADD COLUMN IF NOT EXISTS price_adjustment numeric(10,2) NOT NULL DEFAULT '0'`;

  console.log("→ Backfilling snapshot data into order_item_selections...");
  await sql`
    UPDATE order_item_selections ois
    SET
      variation_type = pv.type,
      variation_value = pv.value,
      price_adjustment = pv.price_adjustment,
      order_item_id = oi.id
    FROM product_variations pv, order_items oi
    WHERE pv.id = ois.variation_id
      AND oi.order_id = ois.order_id
      AND oi.kit_item_id = ois.kit_item_id
      AND ois.order_item_id IS NULL
  `;

  console.log("→ Setting NOT NULL constraints on snapshot columns...");
  await sql`ALTER TABLE order_item_selections ALTER COLUMN order_item_id SET NOT NULL`;
  await sql`ALTER TABLE order_item_selections ALTER COLUMN variation_type SET NOT NULL`;
  await sql`ALTER TABLE order_item_selections ALTER COLUMN variation_value SET NOT NULL`;

  console.log("→ Dropping old constraints and columns from order_item_selections...");
  await sql`ALTER TABLE order_item_selections DROP CONSTRAINT IF EXISTS order_item_selections_order_id_kit_item_id_variation_id_unique`;
  await sql`ALTER TABLE order_item_selections DROP CONSTRAINT IF EXISTS order_item_selections_order_id_orders_id_fk`;
  await sql`ALTER TABLE order_item_selections DROP CONSTRAINT IF EXISTS order_item_selections_kit_item_id_kit_items_id_fk`;
  await sql`ALTER TABLE order_item_selections DROP CONSTRAINT IF EXISTS order_item_selections_variation_id_product_variations_id_fk`;
  await sql`ALTER TABLE order_item_selections DROP COLUMN IF EXISTS order_id`;
  await sql`ALTER TABLE order_item_selections DROP COLUMN IF EXISTS kit_item_id`;

  console.log("→ Adding new FK + unique constraints to order_item_selections...");
  // FK to order_items
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'order_item_selections_order_item_id_order_items_id_fk'
      ) THEN
        ALTER TABLE order_item_selections
          ADD CONSTRAINT order_item_selections_order_item_id_order_items_id_fk
          FOREIGN KEY (order_item_id) REFERENCES order_items(id);
      END IF;
    END $$
  `;
  // Unique (order_item_id, variation_type)
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'order_item_selections_order_item_id_variation_type_unique'
      ) THEN
        ALTER TABLE order_item_selections
          ADD CONSTRAINT order_item_selections_order_item_id_variation_type_unique
          UNIQUE (order_item_id, variation_type);
      END IF;
    END $$
  `;

  console.log("✓ Migration complete.");
}

main().catch((err) => {
  console.error("✗ Migration failed:", err);
  process.exit(1);
});
