import { db } from "@/db";
import { orders, kits, orderItems, orderItemSelections } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCompany } from "../../../_lib/get-company";
import { stripe } from "@/lib/stripe";
import { calculateOrderTotal } from "@/lib/calculate-order-total";
import { PaymentForm } from "./_components/payment-form";
import { CheckCircle } from "lucide-react";
import { recordOrderStatusChange } from "@/lib/record-order-status-change";
import type { OrderStatus } from "@/lib/order-status";

export default async function PayPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const { company, userId } = await getCompany();

  // Fetch order
  const [order] = await db
    .select({
      id: orders.id,
      companyId: orders.companyId,
      kitId: orders.kitId,
      status: orders.status,
      stripePaymentIntentId: orders.stripePaymentIntentId,
      totalAmount: orders.totalAmount,
      shippingCost: orders.shippingCost,
    })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order || order.companyId !== company.id) {
    redirect("/dashboard/orders");
  }

  // If already paid, redirect to order detail
  if (order.status !== "awaiting_payment") {
    redirect(`/dashboard/orders/${id}`);
  }

  // Check if returning from Stripe (payment_intent in search params)
  const paymentIntentParam = searchParams.payment_intent as string | undefined;
  if (paymentIntentParam && order.stripePaymentIntentId) {
    const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
    if (pi.status === "succeeded") {
      await db
        .update(orders)
        .set({ status: "payment_confirmed", updatedAt: new Date() })
        .where(eq(orders.id, id));

      // Only record if this isn't a re-render of an already-confirmed order.
      // (The status check above redirects when already paid, so getting here
      // implies the webhook hasn't processed yet and we're the first writer.)
      await recordOrderStatusChange({
        orderId: id,
        fromStatus: order.status as OrderStatus,
        toStatus: "payment_confirmed",
        changedByUserId: userId,
        reason: `Payment confirmed via redirect (pi=${pi.id})`,
      });

      // Show success
      return (
        <div className="max-w-lg mx-auto py-20 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Payment successful!</h1>
          <p className="mt-2 text-gray-500">Your order has been confirmed and is ready for processing.</p>
          <Link
            href={`/dashboard/orders/${id}`}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-9 px-4 hover:bg-gray-800 transition-colors"
          >
            View Order
          </Link>
        </div>
      );
    }
  }

  // Calculate total if not cached
  let totalAmount = order.totalAmount ? parseFloat(order.totalAmount) : null;
  if (!totalAmount) {
    totalAmount = await calculateOrderTotal(id);
    await db
      .update(orders)
      .set({ totalAmount: totalAmount.toString() })
      .where(eq(orders.id, id));
  }

  // Create or retrieve PaymentIntent
  let clientSecret: string;

  try {
    if (order.stripePaymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
      clientSecret = pi.client_secret ?? "";
    } else {
      if (totalAmount <= 0) {
        throw new Error("Order total must be greater than zero.");
      }
      const pi = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // cents/pence
        currency: "gbp",
        metadata: { orderId: id },
      });

      await db
        .update(orders)
        .set({ stripePaymentIntentId: pi.id })
        .where(eq(orders.id, id));

      clientSecret = pi.client_secret ?? "";
    }
  } catch (err) {
    console.error("Stripe PaymentIntent error:", err);
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Error</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          We couldn&apos;t set up payment for this order. Please try again later or contact support.
        </div>
        <Link
          href={`/dashboard/orders/${id}`}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium h-9 px-4 hover:bg-gray-50 transition-colors"
        >
          Back to order
        </Link>
      </div>
    );
  }

  // Fetch kit info for summary
  const [kit] = await db
    .select({ name: kits.name })
    .from(kits)
    .where(eq(kits.id, order.kitId))
    .limit(1);

  // Fetch items for summary (snapshot)
  const items = await db
    .select({
      orderItemId: orderItems.id,
      productName: orderItems.productName,
      basePrice: orderItems.basePrice,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, id))
    .orderBy(orderItems.sortOrder);

  // Fetch selections (snapshot)
  const orderItemIds = items.map((i) => i.orderItemId);
  const selections =
    orderItemIds.length > 0
      ? await db
          .select({
            orderItemId: orderItemSelections.orderItemId,
            variationType: orderItemSelections.variationType,
            variationValue: orderItemSelections.variationValue,
            priceAdjustment: orderItemSelections.priceAdjustment,
          })
          .from(orderItemSelections)
          .where(inArray(orderItemSelections.orderItemId, orderItemIds))
      : [];

  // Group selections by order item
  const selectionsByItem: Record<string, { type: string; value: string; adjustment: number }[]> = {};
  for (const s of selections) {
    if (!selectionsByItem[s.orderItemId]) selectionsByItem[s.orderItemId] = [];
    selectionsByItem[s.orderItemId].push({
      type: s.variationType,
      value: s.variationValue,
      adjustment: parseFloat(s.priceAdjustment),
    });
  }

  const shippingCost = order.shippingCost ? parseFloat(order.shippingCost) : null;
  const subtotal = shippingCost ? totalAmount - shippingCost : totalAmount;
  const totalFormatted = totalAmount.toFixed(2);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
        <p className="text-gray-500">Pay for your order to start processing</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Summary */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Order Summary
            </h3>
            <p className="text-sm text-gray-500">{kit?.name}</p>
          </div>
          <div className="p-6 pt-0 space-y-3">
            {items.map((item) => {
              const itemSelections = selectionsByItem[item.orderItemId] || [];
              const adjustment = itemSelections.reduce((sum, s) => sum + s.adjustment, 0);
              const unitPrice = parseFloat(item.basePrice) + adjustment;
              const lineTotal = unitPrice * item.quantity;

              return (
                <div key={item.orderItemId} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    {itemSelections.map((s, i) => (
                      <p key={i} className="text-gray-500 text-xs">
                        {s.type === "color" ? "Color" : "Size"}: {s.value}
                        {s.adjustment > 0 && ` (+£${s.adjustment.toFixed(2)})`}
                      </p>
                    ))}
                    <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-gray-700 font-medium">
                    £{lineTotal.toFixed(2)}
                  </span>
                </div>
              );
            })}

            <div className="border-t border-gray-200 pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700">£{subtotal.toFixed(2)}</span>
              </div>
              {shippingCost && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-gray-700">£{shippingCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>£{totalFormatted}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment</h3>
          </div>
          <div className="p-6 pt-0">
            <PaymentForm
              clientSecret={clientSecret}
              orderId={id}
              total={totalFormatted}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
