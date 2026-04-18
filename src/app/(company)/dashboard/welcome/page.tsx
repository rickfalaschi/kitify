import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companyUsers } from "@/db/schema";
import { createCompanyAction } from "../_actions/create-company";
import { WelcomeForm } from "./_components/welcome-form";

export default async function DashboardWelcomePage(props: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { from } = await props.searchParams;

  const existing = await db
    .select({ companyId: companyUsers.companyId })
    .from(companyUsers)
    .where(eq(companyUsers.userId, session.user.id))
    .orderBy(asc(companyUsers.createdAt))
    .limit(1);

  const hasMemberships = existing.length > 0;
  const isAdmin = session.user.isAdmin;

  // Determine back link
  let backHref: string | null = null;
  let backLabel: string | null = null;

  if (from === "admin" && isAdmin) {
    backHref = "/admin";
    backLabel = "Back to admin";
  } else if (from === "dashboard" && hasMemberships) {
    backHref = "/dashboard";
    backLabel = "Back to dashboard";
  } else if (isAdmin) {
    // No param but admin — default to admin
    backHref = "/admin";
    backLabel = "Back to admin";
  } else if (hasMemberships) {
    // No param but has companies — default to dashboard
    backHref = "/dashboard";
    backLabel = "Back to dashboard";
  }
  // else: non-admin with no companies — no back link, show Welcome + Sign out

  return (
    <WelcomeForm
      userName={!backHref ? (session.user.name ?? undefined) : undefined}
      isFirstCompany={!hasMemberships}
      backHref={backHref}
      backLabel={backLabel}
      createAction={createCompanyAction}
    />
  );
}
