import { pgTable, uuid, varchar, numeric, timestamp, unique } from "drizzle-orm/pg-core";
import { orderItems } from "./order-items";
import { variationTypeEnum } from "./product-variations";

/**
 * One row per chosen variation (color/size) for an order_item.
 * Variation details are snapshotted so the row remains valid even if
 * the underlying product_variation is later modified or deleted.
 */
export const orderItemSelections = pgTable(
  "order_item_selections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id),
    // Snapshot fields
    variationType: variationTypeEnum("variation_type").notNull(),
    variationValue: varchar("variation_value", { length: 100 }).notNull(),
    priceAdjustment: numeric("price_adjustment", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    // Reference field (no FK — original may be deleted)
    variationId: uuid("variation_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.orderItemId, table.variationType)],
);
