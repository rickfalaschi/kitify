import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { InviteForm, type InviteState } from "./_components/invite-form";

export default async function InvitePage(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.inviteToken, token))
    .limit(1);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid invite link</h1>
          <p className="mt-2 text-gray-500">This invite link is invalid or has already been used.</p>
          <a href="/login" className="mt-4 inline-block text-sm text-gray-900 font-medium hover:underline">
            Go to login
          </a>
        </div>
      </div>
    );
  }

  if (user.passwordHash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Account already set up</h1>
          <p className="mt-2 text-gray-500">Your account is already active. You can log in.</p>
          <a href="/login" className="mt-4 inline-block text-sm text-gray-900 font-medium hover:underline">
            Go to login
          </a>
        </div>
      </div>
    );
  }

  async function setPasswordAction(
    _prev: InviteState,
    formData: FormData,
  ): Promise<InviteState> {
    "use server";

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const inviteToken = formData.get("token") as string;

    if (!inviteToken) {
      return { error: "Invalid invite token." };
    }
    if (!password || password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }
    if (password !== confirmPassword) {
      return { error: "Passwords do not match." };
    }

    const passwordHash = await hash(password, 12);

    // Atomic claim: UPDATE ... WHERE inviteToken = $1 AND passwordHash IS NULL
    // RETURNING id. Two rapid clicks race to the same row — only the first
    // one satisfies the WHERE clause (because the winner nulls the token and
    // sets passwordHash in the same row update), so at most one succeeds.
    // Postgres row-level locking guarantees this is safe under concurrency.
    const claimed = await db
      .update(users)
      .set({ passwordHash, inviteToken: null })
      .where(
        and(
          eq(users.inviteToken, inviteToken),
          isNull(users.passwordHash),
        ),
      )
      .returning({ id: users.id });

    if (claimed.length === 0) {
      return { error: "This invite link is no longer valid." };
    }

    redirect("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm w-full max-w-md">
        <div className="p-6 pb-0 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kitify-logo-dark.svg"
            alt="Kitify"
            className="mx-auto h-10 w-auto"
          />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Set up your account
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome, {user.name}! Create a password to activate your account.
          </p>
        </div>
        <div className="p-6">
          <InviteForm token={token} setPasswordAction={setPasswordAction} />
        </div>
      </div>
    </div>
  );
}
