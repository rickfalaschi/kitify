import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companyUsers, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function getCompany() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const result = await db
    .select({
      company: companies,
      role: companyUsers.role,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companies.id, companyUsers.companyId))
    .where(eq(companyUsers.userId, session.user.id))
    .limit(1);

  if (!result.length) redirect("/login");
  return {
    company: result[0].company,
    userId: session.user.id,
    role: result[0].role as "full" | "limited",
  };
}

export async function requireFullAccess() {
  const ctx = await getCompany();
  if (ctx.role !== "full") redirect("/dashboard");
  return ctx;
}
