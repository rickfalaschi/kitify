import { db } from "@/db";
import { orders, orderItems, orderItemSelections } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function calculateSubtotal(orderId: string): Promise<number> {
  const items = await db
    .select({
      id: orderItems.id,
      basePrice: orderItems.basePrice,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  if (items.length === 0) return 0;

  const orderItemIds = items.map((i) => i.id);

  const selections = await db
    .select({
      orderItemId: orderItemSelections.orderItemId,
      priceAdjustment: orderItemSelections.priceAdjustment,
    })
    .from(orderItemSelections)
    .where(inArray(orderItemSelections.orderItemId, orderItemIds));

  const adjustmentsByItem: Record<string, number> = {};
  for (const sel of selections) {
    adjustmentsByItem[sel.orderItemId] =
      (adjustmentsByItem[sel.orderItemId] || 0) + parseFloat(sel.priceAdjustment);
  }

  let total = 0;
  for (const item of items) {
    const base = parseFloat(item.basePrice);
    const adjustment = adjustmentsByItem[item.id] || 0;
    total += (base + adjustment) * item.quantity;
  }

  return Math.round(total * 100) / 100;
}

/** Calculate total including shipping */
export async function calculateOrderTotal(orderId: string): Promise<number> {
  const subtotal = await calculateSubtotal(orderId);

  const [order] = await db
    .select({ shippingCost: orders.shippingCost })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  const shipping = order?.shippingCost ? parseFloat(order.shippingCost) : 0;

  return Math.round((subtotal + shipping) * 100) / 100;
}
