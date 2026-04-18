"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Loader2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

type CreateResult = { error?: string; companyId?: string };

interface Props {
  userName?: string;
  isFirstCompany: boolean;
  backHref: string | null;
  backLabel: string | null;
  createAction: (name: string) => Promise<CreateResult>;
}

export function WelcomeForm({ userName, isFirstCompany, backHref, backLabel, createAction }: Props) {
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
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#0a0a23]">
      {/* Ambient gradient */}
      <div
        className="absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 110%, #c81e2c 0%, #6b1322 28%, #2a0e2c 55%, #0a0a23 80%)",
        }}
      />
      {/* Top vignette */}
      <div className="absolute inset-x-0 top-0 h-40 -z-0 bg-gradient-to-b from-[#05051a] to-transparent" />
      {/* Grid texture */}
      <div
        className="absolute inset-0 -z-0 opacity-[0.06] mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative w-full max-w-md">
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
            {userName && (
              <p className="mt-6 text-sm text-red-600 font-medium">
                Welcome, {userName}
              </p>
            )}
            <h2 className={`${userName ? "mt-1" : "mt-6"} text-2xl font-bold text-gray-900`}>
              {isFirstCompany ? "Create your company" : "New company"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isFirstCompany
                ? "Set up your first company to start building kits and placing orders"
                : "Add another company to your account"}
            </p>
          </div>
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label
                  htmlFor="welcome-company-name"
                  className="text-sm font-medium text-gray-700"
                >
                  Company name
                </label>
                <div className="relative">
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={pending || !name.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-red-600 text-white text-sm font-semibold h-11 px-4 shadow-lg shadow-red-600/30 hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {pending ? "Creating..." : "Create company"}
              </button>
            </form>

            <div className="mt-6 text-center">
              {backHref ? (
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {backLabel}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
