"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, companyUsers } from "@/db/schema";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ACTIVE_COMPANY_COOKIE } from "../_lib/active-company";

export type CreateCompanyResult = { error?: string; companyId?: string };

export async function createCompanyAction(
  name: string,
): Promise<CreateCompanyResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const trimmed = name.trim();
  if (!trimmed) return { error: "Company name is required." };
  if (trimmed.length > 255) return { error: "Company name is too long." };

  // Note: neon-http driver doesn't support transactions. If the membership
  // insert fails after the company insert succeeds, the orphan company row
  // is harmless (no data attached, no user can access it).
  const [company] = await db
    .insert(companies)
    .values({ name: trimmed })
    .returning({ id: companies.id });

  await db.insert(companyUsers).values({
    userId: session.user.id,
    companyId: company.id,
    role: "full",
  });

  // Switch the active-company cookie to the newly created company so the
  // user lands directly inside it after the dashboard re-renders.
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE, company.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard", "layout");
  return { companyId: company.id };
}
