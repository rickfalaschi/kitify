import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  updateProfileAction,
  changePasswordAction,
} from "@/lib/profile-actions";
import { ProfileForm } from "@/components/profile-form";

export async function ProfilePageContents() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) redirect("/login");

  return (
    <ProfileForm
      user={user}
      updateProfile={updateProfileAction}
      changePassword={changePasswordAction}
    />
  );
}
