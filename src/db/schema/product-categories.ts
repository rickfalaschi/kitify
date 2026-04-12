import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { products } from "./products";
import { categories } from "./categories";

export const productCategories = pgTable(
  "product_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.productId, t.categoryId)],
);
