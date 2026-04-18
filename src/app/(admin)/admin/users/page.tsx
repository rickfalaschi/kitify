import { db } from "@/db";
import { users, companyUsers, companies, orders } from "@/db/schema";
import { and, eq, or, ilike, asc, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmForm } from "@/components/confirm-form";
import { Trash2 } from "lucide-react";
import { SearchFilterInput } from "@/components/search-filter-input";
import { StatusFilterSelect } from "@/components/status-filter-select";

// Admin-ness is a boolean, not a role enum. Users can be admin, company
// member (of one or more companies), or both.
const ADMIN_FILTER_OPTIONS = [
  { value: "admin", label: "Admins" },
  { value: "non_admin", label: "Non-admins" },
];

export default async function AdminUsersPage(props: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session || !session.user.isAdmin) redirect("/login");
  const currentUserId = session.user.id;

  const { q, status: filter } = await props.searchParams;
  const query = q?.trim();
  const isValidFilter =
    filter && ADMIN_FILTER_OPTIONS.some((o) => o.value === filter);

  const conditions: SQL[] = [];
  if (query) {
    const pattern = `%${query}%`;
    const or_ = or(ilike(users.name, pattern), ilike(users.email, pattern));
    if (or_) conditions.push(or_);
  }
  if (isValidFilter) {
    conditions.push(eq(users.isAdmin, filter === "admin"));
  }
  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(whereCondition)
    .orderBy(asc(users.name));

  // Get company associations
  const associations = await db
    .select({
      userId: companyUsers.userId,
      companyName: companies.name,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companies.id, companyUsers.companyId));

  const companiesByUser: Record<string, string[]> = {};
  for (const a of associations) {
    if (!companiesByUser[a.userId]) companiesByUser[a.userId] = [];
    companiesByUser[a.userId].push(a.companyName);
  }

  async function toggleAdmin(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || !session.user.isAdmin) redirect("/login");
    const userId = formData.get("userId") as string;
    const makeAdmin = formData.get("makeAdmin") === "true";
    if (!userId) return;
    // Prevent an admin from demoting themselves — avoids locking everyone
    // out of /admin by accident.
    if (userId === session.user.id && !makeAdmin) return;
    await db
      .update(users)
      .set({ isAdmin: makeAdmin, updatedAt: new Date() })
      .where(eq(users.id, userId));
    revalidatePath("/admin/users");
  }

  async function deleteUser(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || !session.user.isAdmin) redirect("/login");
    const userId = formData.get("userId") as string;
    if (!userId) return;
    if (userId === session.user.id) return;

    // Check if user has orders — if so, anonymize instead of deleting
    // to preserve order history (orders.userId has RESTRICT constraint)
    const [orderCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.userId, userId));

    if (orderCount.count > 0) {
      // Anonymize: remove from companies, wipe personal data but keep record
      await db.delete(companyUsers).where(eq(companyUsers.userId, userId));
      await db
        .update(users)
        .set({
          name: "Deleted User",
          email: `deleted-${userId}@removed.local`,
          passwordHash: null,
          inviteToken: null,
          resetToken: null,
          resetTokenExpiry: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } else {
      // No orders — safe to hard delete
      await db.delete(companyUsers).where(eq(companyUsers.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }

    revalidatePath("/admin/users");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500">Manage all platform users</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchFilterInput
          basePath="/admin/users"
          currentQuery={query}
          placeholder="Search by name or email..."
          extraParams={{ status: isValidFilter ? filter : undefined }}
        />
        <StatusFilterSelect
          basePath="/admin/users"
          currentStatus={isValidFilter ? filter : undefined}
          options={ADMIN_FILTER_OPTIONS}
        />
        <span className="text-sm text-gray-500">
          {allUsers.length} {allUsers.length === 1 ? "user" : "users"}
        </span>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {allUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
              {user.id === currentUserId ? (
                <span className="shrink-0 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  You (admin)
                </span>
              ) : user.isAdmin ? (
                <span className="shrink-0 inline-flex items-center rounded-full bg-gray-900 px-2.5 py-1 text-xs font-medium text-white">
                  Admin
                </span>
              ) : null}
            </div>
            {companiesByUser[user.id]?.length ? (
              <p className="text-sm text-gray-600">
                {companiesByUser[user.id].join(", ")}
              </p>
            ) : (
              <p className="text-sm text-gray-400">No companies</p>
            )}
            {user.id !== currentUserId && (
              <div className="flex items-center gap-2 pt-1">
                <form action={toggleAdmin} className="inline">
                  <input type="hidden" name="userId" value={user.id} />
                  <input
                    type="hidden"
                    name="makeAdmin"
                    value={user.isAdmin ? "false" : "true"}
                  />
                  <SubmitButton
                    variant={user.isAdmin ? "primary" : "secondary"}
                    className="text-xs h-8 px-3"
                  >
                    {user.isAdmin ? "Admin — revoke" : "Make admin"}
                  </SubmitButton>
                </form>
                <ConfirmForm
                  action={deleteUser}
                  message="Are you sure you want to delete this user?"
                >
                  <input type="hidden" name="userId" value={user.id} />
                  <SubmitButton
                    variant="secondary"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 text-xs h-8 px-2"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Delete
                  </SubmitButton>
                </ConfirmForm>
              </div>
            )}
          </div>
        ))}
        {allUsers.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            {query || isValidFilter
              ? "No users match your filters."
              : "No users registered."}
          </p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">
                Name
              </th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">
                Email
              </th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">
                Companies
              </th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">
                Admin
              </th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="py-3 px-4 font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="py-3 px-4 text-gray-600">{user.email}</td>
                <td className="py-3 px-4 text-gray-600">
                  {companiesByUser[user.id]?.join(", ") || "—"}
                </td>
                <td className="py-3 px-4">
                  {user.id === currentUserId ? (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      You (admin)
                    </span>
                  ) : (
                    <form action={toggleAdmin} className="inline">
                      <input type="hidden" name="userId" value={user.id} />
                      <input
                        type="hidden"
                        name="makeAdmin"
                        value={user.isAdmin ? "false" : "true"}
                      />
                      <SubmitButton
                        variant={user.isAdmin ? "primary" : "secondary"}
                        className="text-xs h-8 px-3"
                      >
                        {user.isAdmin ? "Admin — revoke" : "Make admin"}
                      </SubmitButton>
                    </form>
                  )}
                </td>
                <td className="py-3 px-4">
                  {user.id === currentUserId ? (
                    <div className="flex justify-end" />
                  ) : (
                    <ConfirmForm
                      action={deleteUser}
                      message="Are you sure you want to delete this user?"
                      className="flex justify-end"
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <SubmitButton
                        variant="secondary"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 text-xs h-8 px-2"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Delete
                      </SubmitButton>
                    </ConfirmForm>
                  )}
                </td>
              </tr>
            ))}
            {allUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-8">
                  {query || isValidFilter
                    ? "No users match your filters."
                    : "No users registered."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
