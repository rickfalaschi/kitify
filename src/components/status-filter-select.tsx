"use client";

import { useRouter } from "next/navigation";

export function StatusFilterSelect({
  basePath,
  currentStatus,
  options,
}: {
  basePath: string;
  currentStatus: string | undefined;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();

  return (
    <select
      value={currentStatus || ""}
      onChange={(e) => {
        const value = e.target.value;
        router.push(value ? `${basePath}?status=${value}` : basePath);
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
    >
      <option value="">All statuses</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
