import Link from "next/link";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { ilike, asc } from "drizzle-orm";
import { SearchFilterInput } from "@/components/search-filter-input";

export default async function CompaniesPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await props.searchParams;
  const query = q?.trim();

  const allCompanies = await db
    .select()
    .from(companies)
    .where(query ? ilike(companies.name, `%${query}%`) : undefined)
    .orderBy(asc(companies.name));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Companies</h1>

      <div className="flex items-center gap-3">
        <SearchFilterInput
          basePath="/admin/companies"
          currentQuery={query}
          placeholder="Search companies..."
        />
        <span className="text-sm text-gray-500">
          {allCompanies.length} {allCompanies.length === 1 ? "company" : "companies"}
        </span>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {allCompanies.map((company) => (
          <Link
            key={company.id}
            href={`/admin/companies/${company.id}`}
            className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
          >
            <p className="font-medium text-gray-900">{company.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              Created {company.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </Link>
        ))}
        {allCompanies.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            {query ? "No companies match your search." : "No companies registered."}
          </p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                  {query ? "No companies match your search." : "No companies registered."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
