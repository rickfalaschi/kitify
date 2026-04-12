import { pgTable, uuid, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { kitItems } from "./kit-items";
import { variationTypeEnum } from "./product-variations";
import { productVariations } from "./product-variations";

export const variationModeEnum = pgEnum("variation_mode", ["fixed", "editable"]);

export const kitItemVariations = pgTable(
  "kit_item_variations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kitItemId: uuid("kit_item_id")
      .notNull()
      .references(() => kitItems.id),
    variationType: variationTypeEnum("variation_type").notNull(),
    mode: variationModeEnum("mode").notNull(),
    defaultVariationId: uuid("default_variation_id")
      .notNull()
      .references(() => productVariations.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.kitItemId, table.variationType)],
);
