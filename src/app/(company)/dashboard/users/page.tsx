import { db } from "@/db";
import { users, companyUsers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { requireFullAccess } from "../_lib/get-company";
import { sendInviteEmail, sendAddedToCompanyEmail } from "@/lib/email";
import { UsersView } from "./_components/users-view";
import { lookupUserAction } from "./_actions/lookup-user";

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

  async function addUser(
    formData: FormData,
  ): Promise<{ error?: string; kind?: "linked" | "invited" | "created" }> {
    "use server";
    const { company } = await requireFullAccess();

    const rawEmail = (formData.get("email") as string) || "";
    const email = rawEmail.trim().toLowerCase();
    const role = formData.get("role") as "full" | "limited";

    if (!email || !email.includes("@")) {
      return { error: "A valid email is required." };
    }
    if (role !== "full" && role !== "limited") {
      return { error: "Select a valid permission level." };
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      // Existing user path: link + notify. Name/password fields (if sent)
      // are intentionally ignored — we don't overwrite the user's profile.
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

      if (existingLink) {
        return {
          error: "This user is already a member of this company.",
        };
      }

      await db.insert(companyUsers).values({
        userId: existingUser.id,
        companyId: company.id,
        role,
      });

      const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
      try {
        await sendAddedToCompanyEmail({
          to: email,
          userName: existingUser.name,
          companyName: company.name,
          loginUrl: `${baseUrl}/login`,
        });
      } catch (err) {
        // Non-fatal: the membership was created successfully. We just
        // failed to notify the user by email.
        console.error("sendAddedToCompanyEmail failed", err);
      }

      revalidatePath("/dashboard/users");
      return { kind: "linked" };
    }

    // New user path: name is required, mode determines password vs invite.
    const name = ((formData.get("name") as string) || "").trim();
    const mode = formData.get("mode") as "password" | "invite";
    const password = (formData.get("password") as string) || "";

    if (!name) {
      return { error: "Name is required for a new user." };
    }
    if (mode !== "password" && mode !== "invite") {
      return { error: "Invalid password setup mode." };
    }

    if (mode === "password") {
      if (password.length < 8) {
        return { error: "Password must be at least 8 characters." };
      }
      const passwordHash = await hash(password, 12);

      const [newUser] = await db
        .insert(users)
        .values({ name, email, passwordHash })
        .returning({ id: users.id });

      await db.insert(companyUsers).values({
        userId: newUser.id,
        companyId: company.id,
        role,
      });

      revalidatePath("/dashboard/users");
      return { kind: "created" };
    }

    // Invite mode
    const inviteToken = randomBytes(32).toString("hex");

    const [newUser] = await db
      .insert(users)
      .values({ name, email, inviteToken })
      .returning({ id: users.id });

    await db.insert(companyUsers).values({
      userId: newUser.id,
      companyId: company.id,
      role,
    });

    const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

    try {
      await sendInviteEmail({
        to: email,
        employeeName: name,
        companyName: company.name,
        inviteUrl,
      });
    } catch (err) {
      // Non-fatal: account + invite token are stored; admin can resend.
      console.error("sendInviteEmail failed", err);
    }

    revalidatePath("/dashboard/users");
    return { kind: "invited" };
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
      lookupUser={lookupUserAction}
    />
  );
}
