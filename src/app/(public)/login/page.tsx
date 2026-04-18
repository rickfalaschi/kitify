"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthState } from "../_actions/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    loginAction,
    {},
  );

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
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Sign in</h2>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to manage your kits
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
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
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
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Your password"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-full bg-red-600 text-white text-sm font-semibold h-11 px-4 shadow-lg shadow-red-600/30 hover:bg-red-500 transition-colors disabled:opacity-50"
                disabled={pending}
              >
                {pending ? "Signing in..." : "Sign in"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-red-600 font-medium hover:text-red-500 transition-colors">
                Sign up
              </Link>
            </p>
            <p className="mt-4 text-center text-xs text-gray-400">
              <Link href="/privacy" className="hover:text-gray-600 transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
