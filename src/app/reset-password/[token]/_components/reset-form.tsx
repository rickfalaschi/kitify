"use client";

import { useState } from "react";
import Link from "next/link";

export function ResetForm({
  token,
  resetPassword,
}: {
  token: string;
  resetPassword: (formData: FormData) => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      action={async (formData) => {
        setError("");
        const pw = formData.get("password") as string;
        const confirm = formData.get("confirmPassword") as string;

        if (pw.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }
        if (pw !== confirm) {
          setError("Passwords do not match.");
          return;
        }

        setSubmitting(true);
        await resetPassword(formData);
        setSubmitting(false);
      }}
      className="space-y-4"
    >
      <input type="hidden" name="token" value={token} />

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-gray-700"
        >
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Minimum 6 characters"
          required
          minLength={6}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-gray-700"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Repeat new password"
          required
          minLength={6}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center rounded-full bg-red-600 text-white text-sm font-semibold h-11 px-4 shadow-lg shadow-red-600/30 hover:bg-red-500 transition-colors disabled:opacity-50"
      >
        {submitting ? "Resetting..." : "Reset password"}
      </button>

      <p className="text-center text-sm text-gray-600">
        <Link
          href="/login"
          className="text-red-600 font-medium hover:text-red-500 transition-colors"
        >
          Back to login
        </Link>
      </p>
    </form>
  );
}
