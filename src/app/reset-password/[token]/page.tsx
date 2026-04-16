import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ResetForm } from "./_components/reset-form";

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#0a0a23]">
      <div
        className="absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 110%, #c81e2c 0%, #6b1322 28%, #2a0e2c 55%, #0a0a23 80%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-40 -z-0 bg-gradient-to-b from-[#05051a] to-transparent" />
      <div
        className="absolute inset-0 -z-0 opacity-[0.06] mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}

export default async function ResetPasswordPage(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;

  const [user] = await db
    .select({
      id: users.id,
      resetTokenExpiry: users.resetTokenExpiry,
    })
    .from(users)
    .where(eq(users.resetToken, token))
    .limit(1);

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return (
      <AuthShell>
        <div className="rounded-2xl bg-white shadow-2xl shadow-black/40 overflow-hidden p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Invalid or expired link
          </h1>
          <p className="mt-2 text-gray-500">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <a
            href="/forgot-password"
            className="mt-4 inline-block text-sm text-red-600 font-medium hover:text-red-500 transition-colors"
          >
            Request new link
          </a>
        </div>
      </AuthShell>
    );
  }

  async function resetPassword(formData: FormData) {
    "use server";

    const resetToken = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!password || password.length < 8 || password !== confirmPassword) return;

    const [user] = await db
      .select({ id: users.id, resetTokenExpiry: users.resetTokenExpiry })
      .from(users)
      .where(eq(users.resetToken, resetToken))
      .limit(1);

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date())
      return;

    const passwordHash = await hash(password, 12);

    await db
      .update(users)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    redirect("/login");
  }

  return (
    <AuthShell>
      <div className="rounded-2xl bg-white shadow-2xl shadow-black/40 overflow-hidden">
        <div className="p-8 pb-0 text-center">
          <Link href="/" className="inline-flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kitify-logo-dark.svg"
              alt="Kitify"
              className="h-9 w-auto"
            />
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose a new password for your account.
          </p>
        </div>
        <div className="p-8">
          <ResetForm token={token} resetPassword={resetPassword} />
        </div>
      </div>
    </AuthShell>
  );
}
