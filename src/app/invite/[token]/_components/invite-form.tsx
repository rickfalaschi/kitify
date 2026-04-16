"use client";

import { useActionState } from "react";

export type InviteState = { error?: string };

export function InviteForm({
  token,
  setPasswordAction,
}: {
  token: string;
  setPasswordAction: (
    prev: InviteState,
    formData: FormData,
  ) => Promise<InviteState>;
}) {
  const [state, formAction, pending] = useActionState<InviteState, FormData>(
    setPasswordAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {state.error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
          {state.error}
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
          placeholder="Minimum 8 characters"
          required
          minLength={8}
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
          minLength={8}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-10 px-4 hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {pending ? "Setting up..." : "Set password & activate account"}
      </button>
    </form>
  );
}
