"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, ChevronsUpDown } from "lucide-react";
import Link from "next/link";

export function UserButton() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session?.user) return null;

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.06] transition-colors"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white">
          {initials}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="truncate text-sm font-medium text-white">
            {session.user.name}
          </p>
          <p className="truncate text-xs text-gray-400">
            {session.user.email}
          </p>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-500" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-white/10 bg-[#12123a] py-1 shadow-xl z-50">
          <Link
            href="/dashboard/profile"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" />
            Profile
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/[0.06] hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
