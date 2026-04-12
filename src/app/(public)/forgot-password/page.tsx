"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { requestResetAction, type ResetState } from "../_actions/reset-password";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    requestResetAction,
    {},
  );

  if (state.success) {
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
        <div className="absolute inset-x-0 top-0 h-40 -z-0 bg-gradient-to-b from-[#05051a] to-transparent" />
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
            <div className="p-8 text-center">
              <Link href="/" className="inline-flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600">
                  <Package className="h-4 w-4 text-white" />
                </span>
                <span className="text-lg font-bold tracking-tight text-gray-900">
                  Kitify
                </span>
              </Link>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                If an account exists with that email, we&apos;ve sent a password
                reset link. Please check your inbox.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-sm font-semibold h-11 px-6 shadow-lg shadow-red-600/30 hover:bg-red-500 transition-colors"
              >
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
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
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600">
                <Package className="h-4 w-4 text-white" />
              </span>
              <span className="text-lg font-bold tracking-tight text-gray-900">
                Kits
              </span>
            </Link>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Forgot your password?
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>
          <div className="p-8">
            <form action={formAction} className="space-y-4">
              {state.error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                  {state.error}
                </div>
              )}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@email.com"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-full bg-red-600 text-white text-sm font-semibold h-11 px-4 shadow-lg shadow-red-600/30 hover:bg-red-500 transition-colors disabled:opacity-50"
                disabled={pending}
              >
                {pending ? "Sending..." : "Send reset link"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
              <Link
                href="/login"
                className="text-red-600 font-medium hover:text-red-500 transition-colors"
              >
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
