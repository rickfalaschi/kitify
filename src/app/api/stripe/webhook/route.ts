import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { recordOrderStatusChange } from "@/lib/record-order-status-change";
import type { OrderStatus } from "@/lib/order-status";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      // No orderId in metadata — nothing we can safely act on. Ack so Stripe
      // stops retrying; log-and-ignore is safer than guessing.
      return NextResponse.json({ received: true, ignored: "no_order_id" });
    }

    // Look up the order by its primary key using the metadata.orderId. This is
    // the authoritative link that *we* set when creating the PaymentIntent.
    const [order] = await db
      .select({
        id: orders.id,
        status: orders.status,
        totalAmount: orders.totalAmount,
        stripePaymentIntentId: orders.stripePaymentIntentId,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      // Order referenced by metadata doesn't exist. Returning 500 so Stripe
      // retries — the order may have been created asynchronously after the
      // PaymentIntent, or the situation is bad enough that a human should see
      // it in the Stripe dashboard rather than us silently acking.
      console.error(
        `Stripe webhook: order ${orderId} not found for pi=${paymentIntent.id}`,
      );
      return NextResponse.json(
        { error: "Order not found" },
        { status: 500 },
      );
    }

    // Bi-directional cross-order confusion guard: the order referenced by
    // metadata.orderId MUST have this exact PaymentIntent ID recorded on
    // file. Rejects tampered metadata, replayed PIs, or a PI from an
    // unrelated order being used to confirm payment on this one.
    if (order.stripePaymentIntentId !== paymentIntent.id) {
      console.error(
        `Stripe webhook: pi mismatch for order ${order.id}: stored=${order.stripePaymentIntentId} incoming=${paymentIntent.id}`,
      );
      return NextResponse.json(
        { error: "PaymentIntent does not belong to this order" },
        { status: 500 },
      );
    }

    // Idempotency: if we already confirmed or advanced the order, ack the
    // webhook without re-processing. Stripe retries on transient failures
    // and we don't want to double-advance a shipped/completed order back
    // to payment_confirmed.
    const alreadyPaidStatuses = [
      "payment_confirmed",
      "in_production",
      "shipped",
      "completed",
      "cancelled",
    ];
    if (alreadyPaidStatuses.includes(order.status)) {
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    const expectedAmount = Math.round(Number(order.totalAmount ?? 0) * 100);
    if (paymentIntent.amount_received < expectedAmount) {
      console.error(
        `Stripe webhook: amount mismatch for order ${order.id}: expected=${expectedAmount} received=${paymentIntent.amount_received}`,
      );
      return NextResponse.json(
        { error: "Amount mismatch" },
        { status: 500 },
      );
    }

    await db
      .update(orders)
      .set({ status: "payment_confirmed", updatedAt: new Date() })
      .where(eq(orders.id, order.id));

    await recordOrderStatusChange({
      orderId: order.id,
      fromStatus: order.status as OrderStatus,
      toStatus: "payment_confirmed",
      changedByUserId: null,
      reason: `Stripe webhook (pi=${paymentIntent.id})`,
    });
  }

  return NextResponse.json({ received: true });
}
