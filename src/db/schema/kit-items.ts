import { pgTable, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { kits } from "./kits";
import { products } from "./products";

export const kitItems = pgTable("kit_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  kitId: uuid("kit_id")
    .notNull()
    .references(() => kits.id),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
