import { db } from "@/db";
import {
  orders,
  kits,
  companyAddresses,
  orderItems,
  orderItemSelections,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getCompany } from "../../_lib/get-company";

const statusConfig = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
  processing: { label: "Processing", className: "bg-blue-100 text-blue-700" },
  shipped: { label: "Shipped", className: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-700" },
  incomplete: { label: "Incomplete", className: "bg-orange-100 text-orange-700" },
  awaiting_payment: { label: "Awaiting Payment", className: "bg-amber-100 text-amber-700" },
  awaiting_shipping_quote: { label: "Awaiting Shipping Quote", className: "bg-purple-100 text-purple-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
} as const;

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

  const status = statusConfig[order.status];

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
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
          {order.status === "awaiting_payment" && (
            <Link href={`/dashboard/orders/${order.id}/pay`} className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-9 px-4 hover:bg-gray-800 transition-colors">
              Pay Now
            </Link>
          )}
        </div>
      </div>

      {order.status === "awaiting_shipping_quote" && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-700">
          This order is awaiting a shipping quote from our team. You will be able to pay once the shipping cost is confirmed.
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
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
              >
                {status.label}
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

      {order.status === "incomplete" && order.publicToken && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Public Link</h3>
          </div>
          <div className="p-6 pt-0 text-sm">
            <p className="text-gray-500 mb-1">Share this link to complete the order:</p>
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
