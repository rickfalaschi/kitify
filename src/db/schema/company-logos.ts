import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { companies } from "./companies";

export const companyLogos = pgTable("company_logos", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
