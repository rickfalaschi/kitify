/**
 * Single source of truth for order status metadata.
 *
 * If you find yourself copying a label or a color class into another file,
 * import from here instead. This file owns:
 * - the type
 * - the ordered list (for filters / selects)
 * - human-readable labels (English)
 * - tailwind color classes for badges
 * - cancellability rules (company vs. admin)
 */

export type OrderStatus =
  | "pending"
  | "awaiting_shipping_quote"
  | "awaiting_payment"
  | "payment_confirmed"
  | "in_production"
  | "shipped"
  | "completed"
  | "cancelled";

export const ALL_ORDER_STATUSES = [
  "pending",
  "awaiting_shipping_quote",
  "awaiting_payment",
  "payment_confirmed",
  "in_production",
  "shipped",
  "completed",
  "cancelled",
] as const satisfies readonly OrderStatus[];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  awaiting_shipping_quote: "Awaiting Shipping Quote",
  awaiting_payment: "Awaiting Payment",
  payment_confirmed: "Payment Confirmed",
  in_production: "In Production",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-orange-100 text-orange-700",
  awaiting_shipping_quote: "bg-purple-100 text-purple-700",
  awaiting_payment: "bg-amber-100 text-amber-700",
  payment_confirmed: "bg-yellow-100 text-yellow-700",
  in_production: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function getOrderStatusColor(status: string): string {
  return (
    ORDER_STATUS_COLORS[status as OrderStatus] ?? "bg-gray-100 text-gray-700"
  );
}

export const CANCELLABLE_BY_COMPANY = [
  "pending",
  "awaiting_shipping_quote",
  "awaiting_payment",
] as const;

export const CANCELLABLE_BY_ADMIN = [
  "pending",
  "awaiting_shipping_quote",
  "awaiting_payment",
  "payment_confirmed",
  "in_production",
] as const;

export function canCompanyCancel(status: string): boolean {
  return (CANCELLABLE_BY_COMPANY as readonly string[]).includes(status);
}

export function canAdminCancel(status: string): boolean {
  return (CANCELLABLE_BY_ADMIN as readonly string[]).includes(status);
}
