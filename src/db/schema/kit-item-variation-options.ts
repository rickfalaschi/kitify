import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { kitItemVariations } from "./kit-item-variations";
import { productVariations } from "./product-variations";

export const kitItemVariationOptions = pgTable(
  "kit_item_variation_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kitItemVariationId: uuid("kit_item_variation_id")
      .notNull()
      .references(() => kitItemVariations.id, { onDelete: "cascade" }),
    variationId: uuid("variation_id")
      .notNull()
      .references(() => productVariations.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.kitItemVariationId, table.variationId)],
);
