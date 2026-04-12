"use client";

import { useState } from "react";

export function PreOrderInfo({
  publicUrl,
  orderId,
  existingName,
  existingEmail,
  sendLinkAction,
}: {
  publicUrl: string;
  orderId: string;
  existingName: string | null;
  existingEmail: string | null;
  sendLinkAction: (formData: FormData) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your pre-order link:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={publicUrl}
            className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium h-10 px-4 hover:bg-gray-50 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-1">
          Send to employee (optional)
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Send the pre-order link directly to the employee via email.
        </p>
        <form
          action={async (formData) => {
            setSending(true);
            await sendLinkAction(formData);
            setSending(false);
            setSent(true);
            setTimeout(() => setSent(false), 3000);
          }}
          className="space-y-3 max-w-md"
        >
          <input type="hidden" name="orderId" value={orderId} />
          <div>
            <label
              htmlFor="employeeName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              id="employeeName"
              name="employeeName"
              defaultValue={existingName || ""}
              placeholder="e.g. John Smith"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="employeeEmail"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="employeeEmail"
              name="employeeEmail"
              type="email"
              required
              defaultValue={existingEmail || ""}
              placeholder="e.g. john@example.com"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-10 px-6 hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {sending ? "Sending..." : sent ? "Sent!" : "Send Link via Email"}
          </button>
        </form>
      </div>
    </div>
  );
}
