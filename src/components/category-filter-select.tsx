"use client";

import { useRouter } from "next/navigation";

type CategoryOption = { value: string; label: string; parentId: string | null };

export function CategoryFilterSelect({
  basePath,
  currentCategoryId,
  options,
}: {
  basePath: string;
  currentCategoryId: string | undefined;
  options: CategoryOption[];
}) {
  const router = useRouter();

  // Build hierarchy: parents with children
  const parents = options.filter((o) => !o.parentId);
  const childrenMap = options.reduce<Record<string, CategoryOption[]>>(
    (acc, o) => {
      if (o.parentId) {
        if (!acc[o.parentId]) acc[o.parentId] = [];
        acc[o.parentId].push(o);
      }
      return acc;
    },
    {},
  );

  return (
    <select
      value={currentCategoryId || ""}
      onChange={(e) => {
        const value = e.target.value;
        router.push(value ? `${basePath}?category=${value}` : basePath);
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
    >
      <option value="">All categories</option>
      {parents.map((parent) => {
        const children = childrenMap[parent.value] || [];
        if (children.length === 0) {
          return (
            <option key={parent.value} value={parent.value}>
              {parent.label}
            </option>
          );
        }
        return (
          <optgroup key={parent.value} label={parent.label}>
            <option value={parent.value}>All {parent.label}</option>
            {children.map((child) => (
              <option key={child.value} value={child.value}>
                {child.label}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}
