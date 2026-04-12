"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";

export function ProfileForm({
  user,
  updateProfile,
  changePassword,
}: {
  user: { id: string; name: string; email: string };
  updateProfile: (formData: FormData) => Promise<void>;
  changePassword: (formData: FormData) => Promise<void>;
}) {
  const [passwordError, setPasswordError] = useState("");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500">Manage your account settings</p>
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Personal information
          </h3>
        </div>
        <div className="p-6 pt-0">
          <form
            action={async (formData) => {
              try {
                await updateProfile(formData);
                toast.success("Profile updated.");
              } catch {
                toast.error("Failed to update profile.");
              }
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                defaultValue={user.name}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <SubmitButton>Save changes</SubmitButton>
          </form>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Change password
          </h3>
        </div>
        <div className="p-6 pt-0">
          <form
            action={async (formData) => {
              setPasswordError("");
              const newPw = formData.get("newPassword") as string;
              const confirm = formData.get("confirmPassword") as string;

              if (newPw.length < 6) {
                setPasswordError("Password must be at least 6 characters.");
                return;
              }
              if (newPw !== confirm) {
                setPasswordError("Passwords do not match.");
                return;
              }

              try {
                await changePassword(formData);
                toast.success("Password updated.");
                const form = document.getElementById("password-form") as HTMLFormElement;
                form?.reset();
              } catch {
                toast.error("Failed to change password.");
              }
            }}
            id="password-form"
            className="space-y-4"
          >
            {passwordError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                {passwordError}
              </div>
            )}
            <div>
              <label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                Current password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                New password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repeat new password"
                required
                minLength={6}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <SubmitButton>Change password</SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
