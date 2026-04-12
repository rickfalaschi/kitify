import Link from "next/link";
import { db } from "@/db";
import { companies } from "@/db/schema";

export default async function EmpresasPage() {
  const allCompanies = await db.select().from(companies);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Companies</h1>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Created At</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium w-24"></th>
            </tr>
          </thead>
          <tbody>
            {allCompanies.map((company) => (
              <tr key={company.id} className="border-b border-gray-100 last:border-0">
                <td className="py-3 px-4 font-medium text-gray-900">
                  {company.name}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {company.createdAt.toLocaleDateString("en-US")}
                </td>
                <td className="py-3 px-4">
                  <Link
                    href={`/admin/companies/${company.id}`}
                    className="text-sm text-gray-500 underline hover:text-gray-900"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
            {allCompanies.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="text-center text-gray-500 py-8"
                >
                  No companies registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
