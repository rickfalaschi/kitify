/**
 * Shared helpers for order status logic.
 */

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

export type OrderStatus =
  | "pending"
  | "awaiting_shipping_quote"
  | "awaiting_payment"
  | "payment_confirmed"
  | "in_production"
  | "shipped"
  | "completed"
  | "cancelled";

export function canCompanyCancel(status: string): boolean {
  return (CANCELLABLE_BY_COMPANY as readonly string[]).includes(status);
}

export function canAdminCancel(status: string): boolean {
  return (CANCELLABLE_BY_ADMIN as readonly string[]).includes(status);
}
