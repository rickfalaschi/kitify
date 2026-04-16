"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companyUsers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ACTIVE_COMPANY_COOKIE } from "../_lib/active-company";

export async function switchCompanyAction(companyId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Validate the user is actually a member of the target company.
  // This prevents a tampered cookie/forged action call from switching to
  // an arbitrary company.
  const [membership] = await db
    .select({ role: companyUsers.role })
    .from(companyUsers)
    .where(
      and(
        eq(companyUsers.userId, session.user.id),
        eq(companyUsers.companyId, companyId),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new Error("You are not a member of this company.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE, companyId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  // Invalidate the entire dashboard tree so every server component
  // re-resolves `getCompany()` and renders data for the new active company.
  revalidatePath("/dashboard", "layout");
}
