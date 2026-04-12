import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash, compare } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getCompany } from "../_lib/get-company";
import { ProfileForm } from "./_components/profile-form";

export default async function ProfilePage() {
  const { userId } = await getCompany();

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  async function updateProfile(formData: FormData) {
    "use server";
    const { userId } = await getCompany();

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
  }

  async function changePassword(formData: FormData) {
    "use server";
    const { userId } = await getCompany();

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
  }

  return (
    <ProfileForm
      user={user}
      updateProfile={updateProfile}
      changePassword={changePassword}
    />
  );
}
