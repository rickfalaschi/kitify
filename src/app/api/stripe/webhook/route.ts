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
        .select({ id: orders.id, totalAmount: orders.totalAmount })
        .from(orders)
        .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
        .limit(1);

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
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
        .set({ status: "pending", updatedAt: new Date() })
        .where(eq(orders.id, order.id));
    }
  }

  return NextResponse.json({ received: true });
}
