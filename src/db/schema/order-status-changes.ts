import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { orders, orderStatusEnum } from "./orders";
import { users } from "./users";

/**
 * Append-only audit log of every status transition on an order.
 *
 * - `fromStatus` is nullable because the first row (order creation) has no prior status.
 * - `changedByUserId` is nullable because system transitions (e.g. Stripe webhook)
 *   have no authenticated user; we also want the log to survive user deletion, so
 *   the FK is `ON DELETE SET NULL`.
 * - Rows cascade-delete with their parent order.
 */
export const orderStatusChanges = pgTable(
  "order_status_changes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),
    changedByUserId: uuid("changed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reason: text("reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("order_status_changes_order_id_idx").on(table.orderId),
    index("order_status_changes_created_at_idx").on(table.createdAt),
  ],
);
