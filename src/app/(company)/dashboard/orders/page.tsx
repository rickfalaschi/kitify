import Link from "next/link";
import { db } from "@/db";
import { orders, kits } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCompany } from "../_lib/get-company";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmForm } from "@/components/confirm-form";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StatusFilterSelect } from "@/components/status-filter-select";

const ITEMS_PER_PAGE = 20;

const statusConfig = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
  processing: { label: "Processing", className: "bg-blue-100 text-blue-700" },
  shipped: { label: "Shipped", className: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-700" },
  incomplete: { label: "Incomplete", className: "bg-orange-100 text-orange-700" },
  awaiting_payment: { label: "Awaiting Payment", className: "bg-amber-100 text-amber-700" },
  awaiting_shipping_quote: { label: "Awaiting Quote", className: "bg-purple-100 text-purple-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
} as const;

const deliveryLabels = {
  company_address: "Company address",
  employee_address: "Employee address",
} as const;

const allStatuses = [
  "incomplete",
  "awaiting_shipping_quote",
  "awaiting_payment",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

async function cancelOrder(formData: FormData) {
  "use server";
  const orderId = formData.get("orderId") as string;
  if (!orderId) return;
  const { company } = await getCompany();
  const [order] = await db
    .select({ id: orders.id, status: orders.status, companyId: orders.companyId })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order || order.companyId !== company.id) return;
  if (order.status === "shipped" || order.status === "delivered" || order.status === "cancelled") return;
  await db
    .update(orders)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(orders.id, orderId));
  revalidatePath("/dashboard/orders");
}

export default async function PedidosPage(props: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { company } = await getCompany();
  const { status: filterStatus, page: pageParam } = await props.searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  // Build where conditions
  const conditions = [eq(orders.companyId, company.id)];
  if (filterStatus && allStatuses.includes(filterStatus as typeof allStatuses[number])) {
    conditions.push(eq(orders.status, filterStatus as typeof orders.status.enumValues[number]));
  }
  const whereCondition = and(...conditions);

  // Count total
  const [{ count: totalCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(whereCondition);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const companyOrders = await db
    .select({
      order: orders,
      kit: kits,
    })
    .from(orders)
    .innerJoin(kits, eq(kits.id, orders.kitId))
    .where(whereCondition)
    .orderBy(desc(orders.createdAt))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  function buildUrl(params: { status?: string; page?: number }) {
    const sp = new URLSearchParams();
    const s = params.status ?? filterStatus;
    if (s) sp.set("status", s);
    if (params.page && params.page > 1) sp.set("page", String(params.page));
    const qs = sp.toString();
    return `/dashboard/orders${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500">Company order history</p>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-3">
        <StatusFilterSelect
          basePath="/dashboard/orders"
          currentStatus={filterStatus}
          options={allStatuses.map((s) => ({ value: s, label: statusConfig[s].label }))}
        />
      </div>

      {companyOrders.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          {filterStatus ? "No orders with this status." : "No orders placed yet."}
        </p>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Kit</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Delivery</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companyOrders.map(({ order, kit }) => {
                  const status = statusConfig[order.status];
                  return (
                    <tr key={order.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {kit.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                        {order.status === "awaiting_payment" && (
                          <a href={`/dashboard/orders/${order.id}/pay`} className="ml-2 text-xs text-amber-700 underline font-medium hover:text-amber-900">Pay Now</a>
                        )}
                        {order.status === "incomplete" && order.publicToken && (
                          <Link
                            href={`/dashboard/orders/pre-order/${order.id}`}
                            className="ml-2 text-xs text-orange-600 hover:text-orange-800 underline"
                          >
                            View Link
                          </Link>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {deliveryLabels[order.deliveryType]}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end">
                          {!["shipped", "delivered", "cancelled"].includes(order.status) && (
                            <ConfirmForm action={cancelOrder} message="Are you sure you want to cancel this order?">
                              <input type="hidden" name="orderId" value={order.id} />
                              <SubmitButton
                                variant="secondary"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 text-xs h-7 px-2"
                              >
                                Cancel
                              </SubmitButton>
                            </ConfirmForm>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {offset + 1}–{Math.min(offset + ITEMS_PER_PAGE, totalCount)} of {totalCount} orders
              </p>
              <div className="flex items-center gap-1">
                {currentPage > 1 ? (
                  <Link
                    href={buildUrl({ page: currentPage - 1 })}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 h-8 w-8 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-300 h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </span>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Link
                    key={page}
                    href={buildUrl({ page })}
                    className={`inline-flex items-center justify-center rounded-lg text-sm font-medium h-8 w-8 transition-colors ${
                      page === currentPage
                        ? "bg-gray-900 text-white"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </Link>
                ))}
                {currentPage < totalPages ? (
                  <Link
                    href={buildUrl({ page: currentPage + 1 })}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 h-8 w-8 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-300 h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
