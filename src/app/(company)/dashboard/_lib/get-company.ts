import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companyUsers, companies } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ACTIVE_COMPANY_COOKIE } from "./active-company";

export type CompanyListItem = { id: string; name: string };

export async function getCompany() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await db
    .select({
      company: companies,
      role: companyUsers.role,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companies.id, companyUsers.companyId))
    .where(eq(companyUsers.userId, session.user.id))
    .orderBy(asc(companyUsers.createdAt));

  // Authenticated but membership-less users land on /dashboard/welcome
  // (the onboarding page) so they can create their first company. Sending
  // them to /login would log them out in a loop.
  if (!memberships.length) redirect("/dashboard/welcome");

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value;
  const active =
    (activeId && memberships.find((m) => m.company.id === activeId)) ||
    memberships[0];

  const companyList: CompanyListItem[] = memberships.map((m) => ({
    id: m.company.id,
    name: m.company.name,
  }));

  return {
    company: active.company,
    userId: session.user.id,
    role: active.role as "full" | "limited",
    companies: companyList,
  };
}

export async function requireFullAccess() {
  const ctx = await getCompany();
  if (ctx.role !== "full") redirect("/dashboard");
  return ctx;
}
