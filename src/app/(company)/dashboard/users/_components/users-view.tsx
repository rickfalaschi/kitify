"use client";

import { useState } from "react";
import { Plus, Trash2, Mail, Key } from "lucide-react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";

type CompanyUser = {
  userId: string;
  name: string;
  email: string;
  role: "full" | "limited";
  hasPassword: boolean;
  createdAt: Date;
};

export function UsersView({
  users,
  currentUserId,
  addUser,
  updateUserRole,
  removeUser,
}: {
  users: CompanyUser[];
  currentUserId: string;
  addUser: (formData: FormData) => Promise<void>;
  updateUserRole: (formData: FormData) => Promise<void>;
  removeUser: (formData: FormData) => Promise<void>;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [mode, setMode] = useState<"password" | "invite">("invite");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500">Manage users in your company</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-9 px-4 hover:bg-gray-800 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </button>
      </div>

      {showAddForm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add User
            </h3>
            <form
              action={async (formData) => {
                try {
                  await addUser(formData);
                  toast.success(mode === "invite" ? "Invite sent." : "User added.");
                  setShowAddForm(false);
                } catch {
                  toast.error("Failed to add user.");
                }
              }}
              className="space-y-4"
            >
              <input type="hidden" name="mode" value={mode} />

              <div>
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  placeholder="Full name"
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
                  placeholder="user@example.com"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Password setup
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("invite")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      mode === "invite"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    Send invite link
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("password")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      mode === "password"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Key className="h-4 w-4" />
                    Set password
                  </button>
                </div>
                {mode === "invite" && (
                  <p className="mt-2 text-xs text-gray-500">
                    An email will be sent with a link to create their password.
                  </p>
                )}
              </div>

              {mode === "password" && (
                <div>
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
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Permissions
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue="full"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="full">Full access</option>
                  <option value="limited">Limited (orders only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium h-9 px-4 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <SubmitButton>
                  {mode === "invite" ? "Send Invite" : "Add User"}
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No users yet.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left font-medium text-gray-500 px-4 py-3">Name</th>
                  <th className="text-left font-medium text-gray-500 px-4 py-3">Email</th>
                  <th className="text-left font-medium text-gray-500 px-4 py-3">Permissions</th>
                  <th className="text-left font-medium text-gray-500 px-4 py-3">Status</th>
                  <th className="text-left font-medium text-gray-500 px-4 py-3">Joined</th>
                  <th className="text-right font-medium text-gray-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isCurrentUser = user.userId === currentUserId;
                  return (
                    <tr key={user.userId} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {user.name}
                        {isCurrentUser && (
                          <span className="ml-1 text-gray-400 text-xs">(you)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            user.role === "full"
                              ? "bg-gray-900 text-white rounded-full px-2 py-0.5 text-xs"
                              : "bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs"
                          }
                        >
                          {user.role === "full" ? "Full access" : "Limited"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.hasPassword ? (
                          <span className="text-green-600 text-xs">Active</span>
                        ) : (
                          <span className="text-orange-500 text-xs">Invite pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <form action={async (formData) => {
                            try {
                              await updateUserRole(formData);
                              toast.success("Role updated.");
                            } catch {
                              toast.error("Failed to update role.");
                            }
                          }}>
                            <input type="hidden" name="targetUserId" value={user.userId} />
                            <select
                              name="newRole"
                              defaultValue={user.role}
                              disabled={isCurrentUser}
                              onChange={(e) => {
                                const form = e.currentTarget.closest("form");
                                if (form) form.requestSubmit();
                              }}
                              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="full">Full access</option>
                              <option value="limited">Limited</option>
                            </select>
                          </form>
                          <form onSubmit={(e) => { if (!confirm("Are you sure you want to remove this user?")) e.preventDefault(); }} action={async (formData) => {
                            try {
                              await removeUser(formData);
                              toast.success("User removed.");
                            } catch {
                              toast.error("Failed to remove user.");
                            }
                          }}>
                            <input type="hidden" name="targetUserId" value={user.userId} />
                            <button
                              type="submit"
                              disabled={isCurrentUser}
                              className="inline-flex items-center justify-center rounded-lg text-red-600 text-xs font-medium h-8 px-2 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Remove
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
