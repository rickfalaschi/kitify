"use server";

import { db } from "@/db";
import { users, companyUsers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCompany } from "../../_lib/get-company";

export type UserLookupResult = {
  exists: boolean;
  name?: string;
  alreadyMember?: boolean;
  hasPassword?: boolean;
};

export async function lookupUserAction(
  email: string,
): Promise<UserLookupResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return { exists: false };

  // Gate the lookup on an authenticated company context so this can't be
  // used by random clients to probe which emails are registered.
  const { company } = await getCompany();

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, trimmed))
    .limit(1);

  if (!user) return { exists: false };

  const [membership] = await db
    .select({ userId: companyUsers.userId })
    .from(companyUsers)
    .where(
      and(
        eq(companyUsers.userId, user.id),
        eq(companyUsers.companyId, company.id),
      ),
    )
    .limit(1);

  return {
    exists: true,
    name: user.name,
    alreadyMember: !!membership,
    hasPassword: !!user.passwordHash,
  };
}
