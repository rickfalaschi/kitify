"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

/**
 * Debounced search filter. Pushes `?q=<value>` to `basePath`, preserving any
 * other listed query params. Meant for admin list pages.
 */
export function SearchFilterInput({
  basePath,
  currentQuery,
  placeholder = "Search...",
  extraParams = {},
}: {
  basePath: string;
  currentQuery: string | undefined;
  placeholder?: string;
  extraParams?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentQuery ?? "");

  useEffect(() => {
    setValue(currentQuery ?? "");
  }, [currentQuery]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if ((currentQuery ?? "") === value) return;
      const sp = new URLSearchParams();
      if (value) sp.set("q", value);
      for (const [k, v] of Object.entries(extraParams)) {
        if (v) sp.set(k, v);
      }
      const qs = sp.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-64 rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
    </div>
  );
}
