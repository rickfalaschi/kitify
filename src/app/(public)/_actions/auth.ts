"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, companies, companyUsers } from "@/db/schema";
import { signIn } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

export type AuthState = {
  error?: string;
};

export async function loginAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues?.[0]?.message ?? "Invalid input" };
  }

  try {
    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Incorrect email or password" };
    }
  } catch {
    return { error: "Incorrect email or password" };
  }

  // Admins land on /admin; everyone else lands on /dashboard. An admin who
  // is also a company member can switch between the two from the UI.
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (user?.isAdmin) {
    redirect("/admin");
  }

  redirect("/dashboard");
}

export async function registerAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = {
    companyName: formData.get("companyName") as string,
    userName: formData.get("userName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues?.[0]?.message ?? "Invalid input" };
  }

  // Check if email already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existingUser) {
    return { error: "This email is already registered" };
  }

  const passwordHash = await hash(parsed.data.password, 12);

  // Create company
  const [company] = await db
    .insert(companies)
    .values({
      name: parsed.data.companyName,
    })
    .returning();

  // Create user. isAdmin defaults to false at the schema level; admins are
  // promoted manually from /admin/users.
  const [user] = await db
    .insert(users)
    .values({
      name: parsed.data.userName,
      email: parsed.data.email,
      passwordHash,
    })
    .returning();

  // Link user to company
  await db.insert(companyUsers).values({
    userId: user.id,
    companyId: company.id,
    role: "full",
  });

  // Sign in
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch {
    // Sign in may throw on redirect, ignore
  }

  redirect("/dashboard");
}
