import { pgTable, uuid, varchar, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { kits } from "./kits";
import { users } from "./users";
import { companyAddresses } from "./company-addresses";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "awaiting_shipping_quote",
  "awaiting_payment",
  "payment_confirmed",
  "in_production",
  "shipped",
  "completed",
  "cancelled",
]);

export const deliveryTypeEnum = pgEnum("delivery_type", [
  "company_address",
  "employee_address",
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  kitId: uuid("kit_id")
    .notNull()
    .references(() => kits.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  status: orderStatusEnum("status").notNull().default("pending"),
  deliveryType: deliveryTypeEnum("delivery_type").notNull(),
  companyAddressId: uuid("company_address_id").references(() => companyAddresses.id),
  publicToken: varchar("public_token", { length: 64 }).unique(),
  publicTokenExpiresAt: timestamp("public_token_expires_at"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),
  shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }),
  employeeName: varchar("employee_name", { length: 255 }),
  employeeEmail: varchar("employee_email", { length: 255 }),
  employeeAddressLine1: varchar("employee_address_line_1", { length: 255 }),
  employeeAddressLine2: varchar("employee_address_line_2", { length: 255 }),
  employeeCity: varchar("employee_city", { length: 100 }),
  employeeCounty: varchar("employee_county", { length: 100 }),
  employeePostcode: varchar("employee_postcode", { length: 10 }),
  employeeCountry: varchar("employee_country", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
