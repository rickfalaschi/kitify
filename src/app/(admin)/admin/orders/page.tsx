import Link from "next/link";
import { revalidatePath } from "next/cache";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, companies, kits, users } from "@/db/schema";
import { sendOrderStatusEmail } from "@/lib/email";
import { auth } from "@/lib/auth";
import { recordOrderStatusChange } from "@/lib/record-order-status-change";
import {
  ALL_ORDER_STATUSES,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/order-status";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StatusFilterSelect } from "@/components/status-filter-select";

const ITEMS_PER_PAGE = 20;

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
      reason: "Admin status update (list page)",
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

  revalidatePath("/admin/orders");
}

const statusColors = ORDER_STATUS_COLORS;
const statusLabels = ORDER_STATUS_LABELS;
const allStatuses = ALL_ORDER_STATUSES;

export default async function OrdersPage(props: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status: filterStatus, page: pageParam } = await props.searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  // Build where condition
  const whereCondition =
    filterStatus && (allStatuses as readonly string[]).includes(filterStatus)
      ? and(
          eq(
            orders.status,
            filterStatus as typeof orders.status.enumValues[number],
          ),
        )
      : undefined;

  // Count total
  const [{ count: totalCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(whereCondition ?? undefined);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const allOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      deliveryType: orders.deliveryType,
      createdAt: orders.createdAt,
      description: orders.description,
      companyName: companies.name,
      kitName: kits.name,
    })
    .from(orders)
    .innerJoin(companies, eq(orders.companyId, companies.id))
    .innerJoin(kits, eq(orders.kitId, kits.id))
    .where(whereCondition ?? undefined)
    .orderBy(desc(orders.createdAt))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  function buildUrl(params: { status?: string; page?: number }) {
    const sp = new URLSearchParams();
    const s = params.status ?? filterStatus;
    if (s) sp.set("status", s);
    if (params.page && params.page > 1) sp.set("page", String(params.page));
    const qs = sp.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

      {/* Status filter */}
      <div className="flex items-center gap-3">
        <StatusFilterSelect
          basePath="/admin/orders"
          currentStatus={filterStatus}
          options={allStatuses.map((s) => ({ value: s, label: statusLabels[s] }))}
        />
        <span className="text-sm text-gray-500">{totalCount} orders</span>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {allOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{order.companyName}</p>
                <p className="text-sm text-gray-500 mt-0.5">{order.kitName}</p>
                {order.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{order.description}</p>
                )}
              </div>
              <span
                className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status]}`}
              >
                {statusLabels[order.status]}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{order.deliveryType === "company_address" ? "Company address" : "Employee address"}</span>
              <span>{order.createdAt.toLocaleDateString("en-GB")}</span>
            </div>
            <form
              action={updateOrderStatusAction}
              className="flex items-center gap-2"
            >
              <input type="hidden" name="orderId" value={order.id} />
              <select
                name="status"
                defaultValue={order.status}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                {allStatuses.map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </select>
              <SubmitButton variant="secondary" className="text-xs h-8 px-3">Save</SubmitButton>
            </form>
            <Link
              href={`/admin/orders/${order.id}`}
              className="block text-sm text-gray-500 underline hover:text-gray-900"
            >
              View details
            </Link>
          </div>
        ))}
        {allOrders.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            {filterStatus ? "No orders with this status." : "No orders registered."}
          </p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Company</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Kit</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Delivery</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Change Status</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium w-16"></th>
            </tr>
          </thead>
          <tbody>
            {allOrders.map((order) => (
              <tr key={order.id} className="border-b border-gray-100 last:border-0">
                <td className="py-3 px-4 font-medium text-gray-900">
                  {order.companyName}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {order.kitName}
                  {order.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{order.description}</p>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status]}`}
                  >
                    {statusLabels[order.status]}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {order.deliveryType === "company_address"
                    ? "Company"
                    : "Employee"}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {order.createdAt.toLocaleDateString("en-GB")}
                </td>
                <td className="py-3 px-4">
                  <form
                    action={updateOrderStatusAction}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="orderId" value={order.id} />
                    <select
                      name="status"
                      defaultValue={order.status}
                      className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    >
                      {allStatuses.map((s) => (
                        <option key={s} value={s}>
                          {statusLabels[s]}
                        </option>
                      ))}
                    </select>
                    <SubmitButton variant="secondary" className="text-xs h-8 px-3">Save</SubmitButton>
                  </form>
                </td>
                <td className="py-3 px-4">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-sm text-gray-500 underline hover:text-gray-900"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {allOrders.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-center text-gray-500 py-8"
                >
                  {filterStatus ? "No orders with this status." : "No orders registered."}
                </td>
              </tr>
            )}
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
    </div>
  );
}
