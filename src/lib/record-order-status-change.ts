import { db } from "@/db";
import { orderStatusChanges } from "@/db/schema";
import type { OrderStatus } from "@/lib/order-status";

type RecordArgs = {
  orderId: string;
  /** Previous status. `null` for the row that records order creation. */
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  /** User who performed the change. `null` for system transitions (e.g. Stripe webhook). */
  changedByUserId: string | null;
  /** Optional free-text note: "cancelled by company", "stripe webhook", etc. */
  reason?: string;
};

/**
 * Append a row to `order_status_changes` capturing a status transition.
 *
 * Call this right after any `UPDATE orders SET status = ...` (or the initial
 * INSERT for the creation row). Failures are logged but never thrown — the
 * audit log is best-effort and must not break the main flow.
 */
export async function recordOrderStatusChange(args: RecordArgs): Promise<void> {
  try {
    await db.insert(orderStatusChanges).values({
      orderId: args.orderId,
      fromStatus: args.fromStatus,
      toStatus: args.toStatus,
      changedByUserId: args.changedByUserId,
      reason: args.reason ?? null,
    });
  } catch (err) {
    // Don't let audit-log writes block real work.
    console.error("Failed to record order status change", { args, err });
  }
}
