"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { Download, Trash2 } from "lucide-react";

export function ProfileForm({
  user,
  isAdmin,
  updateProfile,
  changePassword,
  exportData,
  deleteAccount,
}: {
  user: { id: string; name: string; email: string };
  isAdmin?: boolean;
  updateProfile: (formData: FormData) => Promise<void>;
  changePassword: (formData: FormData) => Promise<void>;
  exportData: () => Promise<string>;
  deleteAccount: () => Promise<{ error?: string }>;
}) {
  const [passwordError, setPasswordError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [exportPending, startExport] = useTransition();
  const [deletePending, startDelete] = useTransition();

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

      {/* Data export */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">Your data</h3>
        </div>
        <div className="p-6 pt-0">
          <p className="text-sm text-gray-500 mb-4">
            Download a copy of all personal data we hold about you, including
            your profile, company memberships, and order history.
          </p>
          <button
            type="button"
            disabled={exportPending}
            onClick={() => {
              startExport(async () => {
                try {
                  const json = await exportData();
                  const blob = new Blob([json], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `kitify-data-export-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Data exported successfully.");
                } catch {
                  toast.error("Failed to export data.");
                }
              });
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exportPending ? "Exporting..." : "Export my data"}
          </button>
        </div>
      </div>

      {/* Delete account */}
      <div className="bg-white rounded-lg border border-red-200">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-red-600">Delete account</h3>
        </div>
        <div className="p-6 pt-0">
          <p className="text-sm text-gray-500 mb-4">
            Permanently delete your account and anonymize all associated data.
            Your order records will be retained for legal purposes but all
            personal information will be removed. This action cannot be undone.
          </p>
          {isAdmin ? (
            <p className="text-sm text-gray-400 italic">
              Admin accounts cannot be deleted through self-service. Please
              contact another administrator.
            </p>
          ) : !deleteConfirm ? (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete my account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-600">
                Are you sure? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={deletePending}
                  onClick={() => {
                    startDelete(async () => {
                      const result = await deleteAccount();
                      if (result?.error) {
                        toast.error(result.error);
                        setDeleteConfirm(false);
                      }
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {deletePending ? "Deleting..." : "Yes, delete my account"}
                </button>
                <button
                  type="button"
                  disabled={deletePending}
                  onClick={() => setDeleteConfirm(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
