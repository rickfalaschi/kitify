"use client";

import { useState } from "react";

export function InviteForm({
  token,
  setPassword,
}: {
  token: string;
  setPassword: (formData: FormData) => Promise<void>;
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
        await setPassword(formData);
        setSubmitting(false);
      }}
      className="space-y-4"
    >
      <input type="hidden" name="token" value={token} />

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
          {error}
        </div>
      )}

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
          minLength={6}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
          minLength={6}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-10 px-4 hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {submitting ? "Setting up..." : "Set password & activate account"}
      </button>
    </form>
  );
}
