"use server";

import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sendPasswordResetEmail } from "@/lib/email";

export type ResetState = {
  error?: string;
  success?: boolean;
};

export async function requestResetAction(
  _prevState: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = formData.get("email") as string;
  if (!email) return { error: "Email is required" };

  const [user] = await db
    .select({
      id: users.id,
      resetTokenExpiry: users.resetTokenExpiry,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Always show success to prevent email enumeration
  if (!user) return { success: true };

  // Rate limit: 1 reset email per hour per account. If an active token already
  // exists (not yet expired), silently treat the request as success so we
  // don't leak account state.
  if (
    user.resetTokenExpiry &&
    user.resetTokenExpiry.getTime() > Date.now()
  ) {
    return { success: true };
  }

  const resetToken = randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db
    .update(users)
    .set({ resetToken, resetTokenExpiry })
    .where(eq(users.id, user.id));

  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

  await sendPasswordResetEmail({ to: email, resetUrl });

  return { success: true };
}
