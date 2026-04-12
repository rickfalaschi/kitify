import { db } from "@/db";
import { users, companyUsers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hash, genSalt } from "bcryptjs";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { requireFullAccess } from "../_lib/get-company";
import { sendInviteEmail } from "@/lib/email";
import { UsersView } from "./_components/users-view";

export default async function UsersPage() {
  const { company, userId } = await requireFullAccess();

  const companyUserList = await db
    .select({
      userId: companyUsers.userId,
      name: users.name,
      email: users.email,
      role: companyUsers.role,
      hasPassword: users.passwordHash,
      createdAt: companyUsers.createdAt,
    })
    .from(companyUsers)
    .innerJoin(users, eq(users.id, companyUsers.userId))
    .where(eq(companyUsers.companyId, company.id));

  async function addUser(formData: FormData) {
    "use server";
    const { company } = await requireFullAccess();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as "full" | "limited";
    const mode = formData.get("mode") as "password" | "invite";

    if (!name || !email || !role || !mode) return;

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      const [existingLink] = await db
        .select()
        .from(companyUsers)
        .where(
          and(
            eq(companyUsers.userId, existingUser.id),
            eq(companyUsers.companyId, company.id),
          ),
        )
        .limit(1);

      if (existingLink) return;

      await db.insert(companyUsers).values({
        userId: existingUser.id,
        companyId: company.id,
        role,
      });
    } else {
      if (mode === "password") {
        if (!password || password.length < 6) return;
        const passwordHash = await hash(password, 10);

        const [newUser] = await db
          .insert(users)
          .values({ name, email, passwordHash, role: "company" })
          .returning({ id: users.id });

        await db.insert(companyUsers).values({
          userId: newUser.id,
          companyId: company.id,
          role,
        });
      } else {
        const inviteToken = randomBytes(32).toString("hex");

        const [newUser] = await db
          .insert(users)
          .values({ name, email, inviteToken, role: "company" })
          .returning({ id: users.id });

        await db.insert(companyUsers).values({
          userId: newUser.id,
          companyId: company.id,
          role,
        });

        const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
        const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

        await sendInviteEmail({
          to: email,
          employeeName: name,
          companyName: company.name,
          inviteUrl,
        });
      }
    }

    revalidatePath("/dashboard/users");
  }

  async function updateUserRole(formData: FormData) {
    "use server";
    const { company, userId: currentUserId } = await requireFullAccess();

    const targetUserId = formData.get("targetUserId") as string;
    const newRole = formData.get("newRole") as "full" | "limited";

    if (!targetUserId || !newRole || targetUserId === currentUserId) return;

    await db
      .update(companyUsers)
      .set({ role: newRole })
      .where(
        and(
          eq(companyUsers.userId, targetUserId),
          eq(companyUsers.companyId, company.id),
        ),
      );

    revalidatePath("/dashboard/users");
  }

  async function removeUser(formData: FormData) {
    "use server";
    const { company, userId: currentUserId } = await requireFullAccess();

    const targetUserId = formData.get("targetUserId") as string;
    if (!targetUserId || targetUserId === currentUserId) return;

    await db
      .delete(companyUsers)
      .where(
        and(
          eq(companyUsers.userId, targetUserId),
          eq(companyUsers.companyId, company.id),
        ),
      );

    revalidatePath("/dashboard/users");
  }

  return (
    <UsersView
      users={companyUserList.map((u) => ({
        userId: u.userId,
        name: u.name,
        email: u.email,
        role: u.role as "full" | "limited",
        hasPassword: !!u.hasPassword,
        createdAt: u.createdAt,
      }))}
      currentUserId={userId}
      addUser={addUser}
      updateUserRole={updateUserRole}
      removeUser={removeUser}
    />
  );
}
