import { db } from "@/db";
import { users, companyUsers, companies } from "@/db/schema";
import { and, eq, or, ilike, asc } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmForm } from "@/components/confirm-form";
import { AutoSubmitSelect } from "@/components/auto-submit-select";
import { Trash2 } from "lucide-react";
import { SearchFilterInput } from "@/components/search-filter-input";
import { StatusFilterSelect } from "@/components/status-filter-select";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "company", label: "Company" },
];

export default async function AdminUsersPage(props: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status: roleParam } = await props.searchParams;
  const query = q?.trim();
  const isValidRole = roleParam && ROLE_OPTIONS.some((o) => o.value === roleParam);

  const conditions: SQL[] = [];
  if (query) {
    const pattern = `%${query}%`;
    const or_ = or(ilike(users.name, pattern), ilike(users.email, pattern));
    if (or_) conditions.push(or_);
  }
  if (isValidRole) {
    conditions.push(
      eq(users.role, roleParam as typeof users.role.enumValues[number]),
    );
  }
  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
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

  async function updateRole(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "admin") redirect("/login");
    const userId = formData.get("userId") as string;
    const role = formData.get("role") as "admin" | "company";
    if (!userId || !role) return;
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
    revalidatePath("/admin/users");
  }

  async function deleteUser(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "admin") redirect("/login");
    const userId = formData.get("userId") as string;
    if (!userId) return;
    await db.delete(companyUsers).where(eq(companyUsers.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
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
          extraParams={{ status: isValidRole ? roleParam : undefined }}
        />
        <StatusFilterSelect
          basePath="/admin/users"
          currentStatus={isValidRole ? roleParam : undefined}
          options={ROLE_OPTIONS}
        />
        <span className="text-sm text-gray-500">
          {allUsers.length} {allUsers.length === 1 ? "user" : "users"}
        </span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                Company
              </th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">
                Role
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
                  <form action={updateRole} className="inline">
                    <input type="hidden" name="userId" value={user.id} />
                    <AutoSubmitSelect
                      name="role"
                      defaultValue={user.role}
                      className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    >
                      <option value="admin">Admin</option>
                      <option value="company">Company</option>
                    </AutoSubmitSelect>
                  </form>
                </td>
                <td className="py-3 px-4">
                  <ConfirmForm action={deleteUser} message="Are you sure you want to delete this user?" className="flex justify-end">
                    <input type="hidden" name="userId" value={user.id} />
                    <SubmitButton
                      variant="secondary"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 text-xs h-8 px-2"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete
                    </SubmitButton>
                  </ConfirmForm>
                </td>
              </tr>
            ))}
            {allUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-8">
                  {query || isValidRole
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
