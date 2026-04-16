import { db } from "@/db";
import {
  orders,
  kits,
  companies,
  users,
  companyAddresses,
  orderItems,
  orderItemSelections,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getCompany } from "../../_lib/get-company";
import { CancelOrderButton } from "@/components/cancel-order-button";
import {
  canCompanyCancel,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/order-status";
import { sendOrderStatusEmail } from "@/lib/email";
import { auth } from "@/lib/auth";
import { recordOrderStatusChange } from "@/lib/record-order-status-change";

async function cancelOrderAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orderId = formData.get("orderId") as string;

  const [existing] = await db
    .select({
      id: orders.id,
      status: orders.status,
      companyId: orders.companyId,
      stripePaymentIntentId: orders.stripePaymentIntentId,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!existing) {
    throw new Error("Order not found.");
  }

  // Verify the logged-in user belongs to the order's company
  const { company } = await getCompany();
  if (existing.companyId !== company.id) {
    throw new Error("You do not have permission to cancel this order.");
  }

  if (!canCompanyCancel(existing.status)) {
    throw new Error(
      "This order can no longer be cancelled. Please contact support if you need to cancel it.",
    );
  }

  if (existing.stripePaymentIntentId) {
    throw new Error(
      "This order already has a payment attached. Please contact support to cancel it.",
    );
  }

  await db
    .update(orders)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  await recordOrderStatusChange({
    orderId,
    fromStatus: existing.status as OrderStatus,
    toStatus: "cancelled",
    changedByUserId: session.user.id,
    reason: "Cancelled by company",
  });

  const [orderInfo] = await db
    .select({
      userEmail: users.email,
      companyName: companies.name,
      kitName: kits.name,
    })
    .from(orders)
    .innerJoin(companies, eq(orders.companyId, companies.id))
    .innerJoin(kits, eq(orders.kitId, kits.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (orderInfo) {
    sendOrderStatusEmail({
      to: orderInfo.userEmail,
      companyName: orderInfo.companyName,
      kitName: orderInfo.kitName,
      orderId,
      newStatus: "cancelled",
    }).catch(() => {});
  }

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
}

export default async function PedidoDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { company } = await getCompany();

  const [result] = await db
    .select({ order: orders, kit: kits })
    .from(orders)
    .innerJoin(kits, eq(kits.id, orders.kitId))
    .where(eq(orders.id, id))
    .limit(1);

  if (!result || result.order.companyId !== company.id) notFound();

  const { order, kit } = result;

  // Fetch order items (snapshot) and their selections
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
    .orderBy(orderItems.sortOrder);

  const orderItemIds = items.map((i) => i.id);
  const selections =
    orderItemIds.length > 0
      ? await db
          .select()
          .from(orderItemSelections)
          .where(inArray(orderItemSelections.orderItemId, orderItemIds))
      : [];

  // Group selections by orderItemId
  const selectionsByItem = new Map<
    string,
    { type: string; value: string }[]
  >();
  for (const s of selections) {
    if (!selectionsByItem.has(s.orderItemId)) {
      selectionsByItem.set(s.orderItemId, []);
    }
    selectionsByItem.get(s.orderItemId)!.push({
      type: s.variationType,
      value: s.variationValue,
    });
  }

  let address: typeof companyAddresses.$inferSelect | null = null;
  if (order.companyAddressId) {
    const [addr] = await db
      .select()
      .from(companyAddresses)
      .where(eq(companyAddresses.id, order.companyAddressId))
      .limit(1);
    address = addr || null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-medium h-8 px-3 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Order - {kit.name}
          </h1>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {order.status === "awaiting_payment" && (
            <Link href={`/dashboard/orders/${order.id}/pay`} className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-9 px-4 hover:bg-gray-800 transition-colors">
              Pay Now
            </Link>
          )}
          {canCompanyCancel(order.status) && !order.stripePaymentIntentId && (
            <CancelOrderButton
              orderId={order.id}
              cancelAction={cancelOrderAction}
              confirmText="Cancel this order? This action cannot be undone."
            />
          )}
        </div>
      </div>

      {order.status === "awaiting_shipping_quote" && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-700">
          This order is awaiting a shipping quote from our team. You will be
          able to pay once the shipping cost is confirmed.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Order Details
            </h3>
          </div>
          <div className="p-6 pt-0 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Kit</span>
              <span className="font-medium text-gray-900">{kit.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery type</span>
              <span className="font-medium text-gray-900">
                {order.deliveryType === "company_address"
                  ? "Company address"
                  : "Employee address"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">
                {new Date(order.createdAt).toLocaleDateString("en-US")}
              </span>
            </div>
            {order.shippingCost && (
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium text-gray-900">
                  {Number(order.shippingCost).toLocaleString("en-US", { style: "currency", currency: "GBP" })}
                </span>
              </div>
            )}
            {order.totalAmount && (
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-medium text-gray-900">
                  {Number(order.totalAmount).toLocaleString("en-US", { style: "currency", currency: "GBP" })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Delivery Address
            </h3>
          </div>
          <div className="p-6 pt-0 text-sm text-gray-700">
            {order.deliveryType === "company_address" && address ? (
              <div className="space-y-1">
                <p className="font-medium">{address.label}</p>
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>
                  {address.city}
                  {address.county && `, ${address.county}`}
                </p>
                <p>{address.postcode}</p>
              </div>
            ) : order.deliveryType === "employee_address" ? (
              <div className="space-y-1">
                {order.employeeName && (
                  <p className="font-medium">{order.employeeName}</p>
                )}
                <p>{order.employeeAddressLine1}</p>
                {order.employeeAddressLine2 && (
                  <p>{order.employeeAddressLine2}</p>
                )}
                <p>
                  {order.employeeCity}
                  {order.employeeCounty && `, ${order.employeeCounty}`}
                </p>
                <p>{order.employeePostcode}</p>
              </div>
            ) : (
              <p className="text-gray-500">Address not available.</p>
            )}
          </div>
        </div>
      </div>

      {order.status === "pending" && order.publicToken && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Public Link</h3>
          </div>
          <div className="p-6 pt-0 text-sm">
            <p className="text-gray-500 mb-1">
              Share this link to complete the order:
            </p>
            <code className="block bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-800 break-all">
              {`${process.env.AUTH_URL || "http://localhost:3000"}/p/${order.publicToken}`}
            </code>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">Kit Items</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-2">
            {items.map((item) => {
              const itemSelections = selectionsByItem.get(item.id) || [];
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm"
                >
                  <div>
                    <span className="text-gray-700">{item.productName}</span>
                    {itemSelections.length > 0 && (
                      <div className="mt-0.5 space-x-3">
                        {itemSelections.map((sel, i) => (
                          <span key={i} className="text-gray-500 text-xs">
                            {sel.type === "color" ? "Color" : "Size"}:{" "}
                            {sel.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-500">
                    Qty: {item.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
