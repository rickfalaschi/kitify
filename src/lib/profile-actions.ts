"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash, compare } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function updateProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!name || !email) return;

  // Check if email is taken by another user
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing && existing.id !== userId) {
    return;
  }

  await db
    .update(users)
    .set({ name, email, updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/dashboard/profile");
  revalidatePath("/admin/profile");
}

export async function changePasswordAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || newPassword.length < 6) return;
  if (newPassword !== confirmPassword) return;

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.passwordHash) return;

  const isValid = await compare(currentPassword, user.passwordHash);
  if (!isValid) return;

  const newHash = await hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/dashboard/profile");
  revalidatePath("/admin/profile");
}
