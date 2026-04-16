"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthState } from "../_actions/auth";

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    registerAction,
    {},
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-[#0a0a23]">
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
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Create account</h2>
            <p className="text-sm text-gray-500 mt-1">
              Register your company to start building kits
            </p>
          </div>
          <div className="p-8">
            <form action={formAction} className="space-y-4">
              {state.error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                  {state.error}
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Company details</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  Company name
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  placeholder="Company Inc."
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="mt-6 space-y-1">
                <p className="text-sm font-medium text-gray-500">Your details</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="userName" className="text-sm font-medium text-gray-700">
                  Your name
                </label>
                <input
                  id="userName"
                  name="userName"
                  placeholder="John Smith"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

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
                  placeholder="Minimum 6 characters"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat password"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-full bg-red-600 text-white text-sm font-semibold h-11 px-4 shadow-lg shadow-red-600/30 hover:bg-red-500 transition-colors disabled:opacity-50"
                disabled={pending}
              >
                {pending ? "Creating account..." : "Create account"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-red-600 font-medium hover:text-red-500 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
