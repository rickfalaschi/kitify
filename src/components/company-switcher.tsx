"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  X,
} from "lucide-react";

type Company = { id: string; name: string };

interface Props {
  companies: Company[];
  activeCompanyId: string;
  switchAction: (companyId: string) => Promise<void>;
  createAction: (
    name: string,
  ) => Promise<{ error?: string; companyId?: string }>;
}

export function CompanySwitcher({
  companies,
  activeCompanyId,
  switchAction,
  createAction,
}: Props) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (createOpen) {
      // Focus after the modal mounts.
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [createOpen]);

  const active =
    companies.find((c) => c.id === activeCompanyId) ?? companies[0];

  function handleSwitch(id: string) {
    if (id === activeCompanyId) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await switchAction(id);
      setOpen(false);
    });
  }

  function openCreate() {
    setOpen(false);
    setName("");
    setError(null);
    setCreateOpen(true);
  }

  function closeCreate() {
    if (pending) return;
    setCreateOpen(false);
    setName("");
    setError(null);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Company name is required.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await createAction(trimmed);
        if (result.error) {
          setError(result.error);
          return;
        }
        setCreateOpen(false);
        setName("");
      } catch (err) {
        console.error("createCompanyAction failed", err);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Could not create company. Please try again.",
        );
      }
    });
  }

  return (
    <>
      <div ref={ref} className="relative px-3 pt-3">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          disabled={pending}
          className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm text-white hover:bg-white/[0.08] transition-colors disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />
          ) : (
            <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
          )}
          <span className="flex-1 truncate">
            {active?.name ?? "Select company"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-500" />
        </button>

        {open && (
          <div className="absolute left-3 right-3 z-50 mt-1 max-h-72 overflow-auto rounded-lg border border-white/10 bg-[#12123a] py-1 shadow-xl">
            {companies.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSwitch(c.id)}
                disabled={pending}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                <Building2 className="h-4 w-4 shrink-0 text-gray-500" />
                <span className="flex-1 truncate text-left">{c.name}</span>
                {c.id === activeCompanyId && (
                  <Check className="h-4 w-4 text-red-400" />
                )}
              </button>
            ))}
            <div className="my-1 border-t border-white/10" />
            <button
              type="button"
              onClick={openCreate}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <Plus className="h-4 w-4 shrink-0 text-gray-500" />
              <span className="flex-1 text-left">Create new company</span>
            </button>
          </div>
        )}
      </div>

      {createOpen &&
        mounted &&
        createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={closeCreate}
        >
          <div
            className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeCreate}
              disabled={pending}
              aria-label="Close"
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              Create new company
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              You&apos;ll be the owner. You can switch between your companies
              anytime from this menu.
            </p>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="new-company-name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Company name
                </label>
                <input
                  ref={inputRef}
                  id="new-company-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={255}
                  placeholder="e.g. Acme Inc."
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  disabled={pending}
                />
              </div>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCreate}
                  disabled={pending}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || !name.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pending ? "Creating..." : "Create company"}
                </button>
              </div>
            </form>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
