import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { productVariations } from "./product-variations";

export const variationImages = pgTable("variation_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  variationId: uuid("variation_id")
    .notNull()
    .references(() => productVariations.id),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
