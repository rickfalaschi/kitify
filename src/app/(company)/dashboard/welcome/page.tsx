import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companyUsers } from "@/db/schema";
import { createCompanyAction } from "../_actions/create-company";
import { WelcomeForm } from "./_components/welcome-form";

// Onboarding route. This renders under the dashboard layout's "minimal
// shell" branch (layout detects zero memberships and skips the sidebar).
//
// If an authenticated user somehow lands here with at least one membership
// already, we bounce them to /dashboard so they don't see the onboarding
// screen instead of their data.
export default async function DashboardWelcomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const existing = await db
    .select({ companyId: companyUsers.companyId })
    .from(companyUsers)
    .where(eq(companyUsers.userId, session.user.id))
    .orderBy(asc(companyUsers.createdAt))
    .limit(1);

  if (existing.length > 0) redirect("/dashboard");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
      <div className="mb-6">
        <p className="text-sm font-medium text-red-600">Welcome{session.user.name ? `, ${session.user.name}` : ""}</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Let&apos;s set up your first company
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          You don&apos;t belong to any company yet. Create one below to start
          building kits, inviting teammates, and placing orders. You can
          always add more companies or switch between them later from the
          sidebar.
        </p>
      </div>
      <WelcomeForm createAction={createCompanyAction} />
    </div>
  );
}
