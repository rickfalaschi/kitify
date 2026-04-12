import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { products } from "./products";
import { productVariations } from "./product-variations";

export const companyProductMockups = pgTable("company_product_mockups", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  variationId: uuid("variation_id").references(() => productVariations.id),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
