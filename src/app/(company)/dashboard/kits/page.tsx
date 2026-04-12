import Link from "next/link";
import { db } from "@/db";
import { kits, kitItems } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { Plus } from "lucide-react";
import { getCompany } from "../_lib/get-company";

const statusConfig = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-600" },
} as const;

export default async function KitsPage() {
  const { company } = await getCompany();

  const companyKits = await db
    .select()
    .from(kits)
    .where(eq(kits.companyId, company.id))
    .orderBy(kits.createdAt);

  const itemCounts = await db
    .select({ kitId: kitItems.kitId, count: count() })
    .from(kitItems)
    .groupBy(kitItems.kitId);

  const countByKit = Object.fromEntries(
    itemCounts.map((r) => [r.kitId, r.count]),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kits</h1>
          <p className="text-gray-500">Manage your product kits</p>
        </div>
        <Link
          href="/dashboard/kits/new"
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-9 px-4 hover:bg-gray-800 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Kit
        </Link>
      </div>

      {companyKits.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          No kits created yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {companyKits.map((kit) => {
            const status = statusConfig[kit.status];
            return (
              <Link key={kit.id} href={`/dashboard/kits/${kit.id}`}>
                <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-400 transition-colors cursor-pointer">
                  <div className="p-6 pb-4">
                    <h3 className="text-base font-semibold text-gray-900">{kit.name}</h3>
                  </div>
                  <div className="p-6 pt-0 space-y-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                    <p className="text-sm text-gray-500">
                      {countByKit[kit.id] || 0} items
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
