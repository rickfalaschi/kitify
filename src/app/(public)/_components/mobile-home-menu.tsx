"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileHomeMenu() {
  const [open, setOpen] = useState(false);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center justify-center rounded-lg p-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute right-6 top-16 w-48 rounded-xl border border-white/10 bg-[#0a0a23] p-2 shadow-2xl">
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
}
