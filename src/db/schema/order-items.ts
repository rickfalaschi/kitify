import { pgTable, uuid, varchar, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { orders } from "./orders";

/**
 * Snapshot of a kit item at the time the order was placed.
 * This table preserves order history even if the source product or
 * kit item is later modified or deleted.
 */
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  // Snapshot fields (frozen at order time)
  productName: varchar("product_name", { length: 255 }).notNull(),
  productImageUrl: text("product_image_url"),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  // Reference fields (no FK — original may be deleted)
  productId: uuid("product_id"),
  kitItemId: uuid("kit_item_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
