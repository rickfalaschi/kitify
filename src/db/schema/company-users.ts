import { pgTable, uuid, timestamp, primaryKey, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";
import { companies } from "./companies";

export const companyRoleEnum = pgEnum("company_role", ["full", "limited"]);

export const companyUsers = pgTable(
  "company_users",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    role: companyRoleEnum("role").notNull().default("full"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.companyId] })],
);
