import { pgTable, uuid, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  inviteToken: varchar("invite_token", { length: 64 }).unique(),
  resetToken: varchar("reset_token", { length: 64 }).unique(),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  // Admin-ness is orthogonal to company membership. Any user can access
  // /dashboard (based on their company memberships); only is_admin users
  // can access /admin.
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
