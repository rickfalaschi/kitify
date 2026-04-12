import Link from "next/link";
import { db } from "@/db";
import { kits, companies, kitItems } from "@/db/schema";
import { eq, count } from "drizzle-orm";

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-600" },
};

export default async function AdminKitsPage() {
  const allKits = await db
    .select({
      id: kits.id,
      name: kits.name,
      status: kits.status,
      companyName: companies.name,
      createdAt: kits.createdAt,
    })
    .from(kits)
    .innerJoin(companies, eq(companies.id, kits.companyId))
    .orderBy(kits.createdAt);

  // Get item counts per kit
  const itemCounts = await db
    .select({
      kitId: kitItems.kitId,
      count: count(),
    })
    .from(kitItems)
    .groupBy(kitItems.kitId);

  const countMap: Record<string, number> = {};
  for (const ic of itemCounts) {
    countMap[ic.kitId] = ic.count;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kits</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left font-medium text-gray-500 px-4 py-3">Name</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Company</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Items</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Status</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Created</th>
                <th className="text-right font-medium text-gray-500 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {allKits.map((kit) => {
                const status = statusConfig[kit.status] || statusConfig.pending;
                return (
                  <tr key={kit.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">{kit.name}</td>
                    <td className="px-4 py-3 text-gray-600">{kit.companyName}</td>
                    <td className="px-4 py-3 text-gray-600">{countMap[kit.id] || 0} items</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(kit.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/kits/${kit.id}`}
                        className="text-sm text-gray-500 hover:text-gray-900 underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {allKits.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No kits created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
