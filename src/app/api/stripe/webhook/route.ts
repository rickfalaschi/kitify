import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    if (orderId) {
      const [order] = await db
        .select({
          id: orders.id,
          status: orders.status,
          totalAmount: orders.totalAmount,
        })
        .from(orders)
        .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
        .limit(1);

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
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

      // Cross-check: the PaymentIntent metadata.orderId must match the order we
      // looked up by stripePaymentIntentId. Guards against stale/reused PIs.
      if (order.id !== orderId) {
        return NextResponse.json(
          { error: "Order ID mismatch" },
          { status: 400 },
        );
      }

      const expectedAmount = Math.round(
        Number(order.totalAmount ?? 0) * 100,
      );
      if (paymentIntent.amount_received < expectedAmount) {
        return NextResponse.json(
          { error: "Amount mismatch" },
          { status: 400 },
        );
      }

      await db
        .update(orders)
        .set({ status: "payment_confirmed", updatedAt: new Date() })
        .where(eq(orders.id, order.id));
    }
  }

  return NextResponse.json({ received: true });
}
