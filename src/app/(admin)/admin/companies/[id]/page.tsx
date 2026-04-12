import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  companies,
  companyUsers,
  companyLogos,
  kits,
  orders,
  users,
} from "@/db/schema";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { auth } from "@/lib/auth";

async function updateCompanyName(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/login");
  const companyId = formData.get("companyId") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!companyId || !name) return;
  await db
    .update(companies)
    .set({ name, updatedAt: new Date() })
    .where(eq(companies.id, companyId));
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/companies");
}

export default async function EmpresaDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1);

  if (!company) {
    notFound();
  }

  const companyUsersList = await db
    .select({
      userId: companyUsers.userId,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
    })
    .from(companyUsers)
    .innerJoin(users, eq(companyUsers.userId, users.id))
    .where(eq(companyUsers.companyId, id));

  const logos = await db
    .select()
    .from(companyLogos)
    .where(eq(companyLogos.companyId, id));

  const companyKits = await db
    .select()
    .from(kits)
    .where(eq(kits.companyId, id));

  const companyOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      deliveryType: orders.deliveryType,
      createdAt: orders.createdAt,
      kitName: kits.name,
    })
    .from(orders)
    .innerJoin(kits, eq(orders.kitId, kits.id))
    .where(eq(orders.companyId, id));

  const kitStatusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-600",
  };

  const orderStatusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    incomplete: "bg-orange-100 text-orange-700",
    awaiting_payment: "bg-amber-100 text-amber-700",
    awaiting_shipping_quote: "bg-purple-100 text-purple-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/companies"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to companies
        </Link>
        <form action={updateCompanyName} className="flex items-end gap-3">
          <input type="hidden" name="companyId" value={company.id} />
          <div>
            <label htmlFor="name" className="text-sm font-medium text-gray-500">
              Company Name
            </label>
            <input
              id="name"
              name="name"
              defaultValue={company.name}
              required
              className="mt-1 block text-2xl font-bold text-gray-900 rounded-lg border border-gray-300 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <SubmitButton>Save</SubmitButton>
        </form>
      </div>

      <div className="space-y-6">
        {/* Users */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Users</h3>
          </div>
          <div className="p-6 pt-0">
            {companyUsersList.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {companyUsersList.map((u) => (
                    <tr key={u.userId} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 px-4 text-gray-900">
                        {u.userName}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {u.userEmail}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.userRole === "admin"
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {u.userRole === "admin" ? "Admin" : "Company"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">
                No users associated.
              </p>
            )}
          </div>
        </div>

        {/* Logos */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Logos</h3>
          </div>
          <div className="p-6 pt-0">
            {logos.length > 0 ? (
              <div className="space-y-2">
                {logos.map((logo) => (
                  <div
                    key={logo.id}
                    className="flex items-center justify-between rounded border border-gray-200 p-3"
                  >
                    <span className="text-sm text-gray-700">
                      {logo.fileName}
                    </span>
                    <a
                      href={logo.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 underline hover:text-gray-900"
                    >
                      View file
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No logos registered.</p>
            )}
          </div>
        </div>

        {/* Kits */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Kits</h3>
          </div>
          <div className="p-6 pt-0">
            {companyKits.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {companyKits.map((kit) => (
                    <tr key={kit.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 px-4 text-gray-900">
                        {kit.name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${kitStatusColors[kit.status]}`}
                        >
                          {kit.status === "pending"
                            ? "Pending"
                            : kit.status === "active"
                              ? "Active"
                              : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {kit.createdAt.toLocaleDateString("en-US")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">No kits registered.</p>
            )}
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
          </div>
          <div className="p-6 pt-0">
            {companyOrders.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Kit</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Delivery</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Created At</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {companyOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 px-4 text-gray-900">
                        {order.kitName}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${orderStatusColors[order.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {order.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {order.deliveryType === "company_address"
                          ? "Company address"
                          : "Employee address"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {order.createdAt.toLocaleDateString("en-US")}
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
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">
                No orders registered.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
