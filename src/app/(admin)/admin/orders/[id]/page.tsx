import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  companies,
  kits,
  users,
  companyAddresses,
  orderItems,
  orderItemSelections,
} from "@/db/schema";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { CancelOrderButton } from "@/components/cancel-order-button";
import { calculateOrderTotal } from "@/lib/calculate-order-total";
import { sendOrderStatusEmail } from "@/lib/email";
import { auth } from "@/lib/auth";
import {
  ALL_ORDER_STATUSES,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  canAdminCancel,
  type OrderStatus,
} from "@/lib/order-status";
import { recordOrderStatusChange } from "@/lib/record-order-status-change";

async function updateOrderStatusAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || !session.user.isAdmin) redirect("/login");

  const orderId = formData.get("orderId") as string;
  const status = formData.get("status") as
    | "pending"
    | "awaiting_shipping_quote"
    | "awaiting_payment"
    | "payment_confirmed"
    | "in_production"
    | "shipped"
    | "completed"
    | "cancelled";

  const [prev] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  if (prev && prev.status !== status) {
    await recordOrderStatusChange({
      orderId,
      fromStatus: prev.status as OrderStatus,
      toStatus: status,
      changedByUserId: session.user.id,
      reason: "Admin status update",
    });
  }

  // Send email notification
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
      newStatus: status,
    }).catch(() => {});
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

async function setShippingCostAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || !session.user.isAdmin) redirect("/login");

  const orderId = formData.get("orderId") as string;
  const shippingCost = formData.get("shippingCost") as string;

  const [prev] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  await db
    .update(orders)
    .set({
      shippingCost,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  const totalAmount = await calculateOrderTotal(orderId);

  await db
    .update(orders)
    .set({
      totalAmount: totalAmount.toFixed(2),
      status: "awaiting_payment",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  if (prev && prev.status !== "awaiting_payment") {
    await recordOrderStatusChange({
      orderId,
      fromStatus: prev.status as OrderStatus,
      toStatus: "awaiting_payment",
      changedByUserId: session.user.id,
      reason: `Admin set shipping cost (${shippingCost})`,
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

async function cancelOrderAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || !session.user.isAdmin) redirect("/login");

  const orderId = formData.get("orderId") as string;

  const [existing] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!existing) {
    throw new Error("Order not found.");
  }

  if (!canAdminCancel(existing.status)) {
    throw new Error(
      `Orders in status "${existing.status}" can no longer be cancelled.`,
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
    reason: "Admin cancelled",
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

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

const statusColors = ORDER_STATUS_COLORS;
const statusLabels = ORDER_STATUS_LABELS;

export default async function OrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const [order] = await db
    .select({
      id: orders.id,
      kitId: orders.kitId,
      status: orders.status,
      deliveryType: orders.deliveryType,
      employeeName: orders.employeeName,
      employeeAddressLine1: orders.employeeAddressLine1,
      employeeAddressLine2: orders.employeeAddressLine2,
      employeeCity: orders.employeeCity,
      employeeCounty: orders.employeeCounty,
      employeePostcode: orders.employeePostcode,
      employeeCountry: orders.employeeCountry,
      companyAddressId: orders.companyAddressId,
      shippingCost: orders.shippingCost,
      publicToken: orders.publicToken,
      employeeEmail: orders.employeeEmail,
      stripePaymentIntentId: orders.stripePaymentIntentId,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      companyName: companies.name,
      kitName: kits.name,
      userName: users.name,
      userEmail: users.email,
    })
    .from(orders)
    .innerJoin(companies, eq(orders.companyId, companies.id))
    .innerJoin(kits, eq(orders.kitId, kits.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    notFound();
  }

  let companyAddress = null;
  if (order.companyAddressId) {
    const [addr] = await db
      .select()
      .from(companyAddresses)
      .where(eq(companyAddresses.id, order.companyAddressId))
      .limit(1);
    companyAddress = addr;
  }

  // Fetch order items (snapshot)
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
    .orderBy(orderItems.sortOrder);

  // Fetch order item selections (snapshot variation data)
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

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to orders
        </Link>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
          {canAdminCancel(order.status) && (
            <CancelOrderButton
              orderId={order.id}
              cancelAction={cancelOrderAction}
              confirmText="Cancel this order? The company will be notified by email. This action cannot be undone."
            />
          )}
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              General Information
            </h3>
          </div>
          <div className="p-6 pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Company</span>
                <p className="font-medium text-gray-900">
                  {order.companyName}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Kit</span>
                <p className="font-medium text-gray-900">{order.kitName}</p>
              </div>
              <div>
                <span className="text-gray-500">Requested by</span>
                <p className="font-medium text-gray-900">{order.userName}</p>
                <p className="text-gray-500">{order.userEmail}</p>
              </div>
              <div>
                <span className="text-gray-500">Order Date</span>
                <p className="font-medium text-gray-900">
                  {order.createdAt.toLocaleDateString("en-US")}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Delivery Type</span>
                <p className="font-medium text-gray-900">
                  {order.deliveryType === "company_address"
                    ? "Company address"
                    : "Employee address"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Status</span>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status]}`}
                  >
                    {statusLabels[order.status]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {order.publicToken && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 pb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Public Token
              </h3>
            </div>
            <div className="p-6 pt-0 text-sm">
              <p className="text-gray-500 mb-1">Public pre-order link:</p>
              <code className="block bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-800 break-all">
                {`${process.env.AUTH_URL || "http://localhost:3000"}/p/${order.publicToken}`}
              </code>
              {order.employeeEmail && (
                <p className="mt-2 text-gray-500">
                  Employee email: <span className="text-gray-800">{order.employeeEmail}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {order.stripePaymentIntentId && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 pb-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
            </div>
            <div className="p-6 pt-0 space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">Stripe Payment Intent</span>
                  <p className="font-medium text-gray-900 break-all">{order.stripePaymentIntentId}</p>
                </div>
              </div>
              {order.totalAmount && (
                <div className="mt-4 space-y-1">
                  {order.shippingCost && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-medium text-gray-900">
                          {(Number(order.totalAmount) - Number(order.shippingCost)).toLocaleString("en-GB", { style: "currency", currency: "GBP" })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Shipping</span>
                        <span className="font-medium text-gray-900">
                          {Number(order.shippingCost).toLocaleString("en-GB", { style: "currency", currency: "GBP" })}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-medium text-gray-900">
                      {Number(order.totalAmount).toLocaleString("en-GB", { style: "currency", currency: "GBP" })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {order.status === "awaiting_shipping_quote" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 pb-4">
              <h3 className="text-lg font-semibold text-gray-900">Set Shipping Cost</h3>
            </div>
            <div className="p-6 pt-0">
              <p className="text-sm text-gray-500 mb-4">
                This order requires a shipping quote before the company can pay.
              </p>
              <form action={setShippingCostAction} className="flex items-end gap-3">
                <input type="hidden" name="orderId" value={order.id} />
                <div>
                  <label htmlFor="shippingCost" className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Cost (&pound;)
                  </label>
                  <input
                    type="number"
                    id="shippingCost"
                    name="shippingCost"
                    step="0.01"
                    min="0"
                    required
                    className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <SubmitButton>Set Shipping &amp; Release Payment</SubmitButton>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Delivery Address
            </h3>
          </div>
          <div className="p-6 pt-0">
            {order.deliveryType === "company_address" && companyAddress ? (
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-medium">{companyAddress.label}</p>
                <p>{companyAddress.addressLine1}</p>
                {companyAddress.addressLine2 && (
                  <p>{companyAddress.addressLine2}</p>
                )}
                <p>
                  {companyAddress.city}
                  {companyAddress.county && `, ${companyAddress.county}`}
                </p>
                <p>{companyAddress.postcode}</p>
              </div>
            ) : order.deliveryType === "employee_address" ? (
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-medium">{order.employeeName}</p>
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
              <p className="text-sm text-gray-500">Address not available.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Kit Items</h3>
          </div>
          <div className="p-6 pt-0">
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">No items.</p>
            ) : (
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
                              <span
                                key={i}
                                className="text-gray-500 text-xs"
                              >
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
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Change Status
            </h3>
          </div>
          <div className="p-6 pt-0">
            <form
              action={updateOrderStatusAction}
              className="flex items-center gap-3"
            >
              <input type="hidden" name="orderId" value={order.id} />
              <select
                name="status"
                defaultValue={order.status}
                className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                {ALL_ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <SubmitButton>Update</SubmitButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
