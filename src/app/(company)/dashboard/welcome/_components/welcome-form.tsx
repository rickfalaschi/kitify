"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, Building2 } from "lucide-react";
import { signOut } from "next-auth/react";

type CreateResult = { error?: string; companyId?: string };

interface Props {
  createAction: (name: string) => Promise<CreateResult>;
}

export function WelcomeForm({ createAction }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Company name is required.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await createAction(trimmed);
        if (result.error) {
          setError(result.error);
          return;
        }
        // Membership + active-company cookie are already set server-side.
        // Refresh to pick up the new layout (sidebar + company data) and
        // land on the company dashboard.
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        console.error("createCompanyAction failed", err);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Could not create company. Please try again.",
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="welcome-company-name"
          className="block text-sm font-medium text-gray-700"
        >
          Company name
        </label>
        <div className="relative mt-1">
          <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="welcome-company-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            maxLength={255}
            placeholder="e.g. Acme Inc."
            disabled={pending}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          disabled={pending}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Creating..." : "Create company"}
        </button>
      </div>
    </form>
  );
}
