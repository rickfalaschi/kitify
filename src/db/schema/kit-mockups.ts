import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { kits } from "./kits";

export const kitMockups = pgTable("kit_mockups", {
  id: uuid("id").primaryKey().defaultRandom(),
  kitId: uuid("kit_id")
    .notNull()
    .references(() => kits.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
