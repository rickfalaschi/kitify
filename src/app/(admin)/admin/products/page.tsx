import Link from "next/link";
import { db } from "@/db";
import { products, productCategories, categories } from "@/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { CategoryFilterSelect } from "@/components/category-filter-select";

export default async function ProductsPage(props: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: filterCategoryId } = await props.searchParams;

  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  const validCategoryId =
    filterCategoryId && allCategories.some((c) => c.id === filterCategoryId)
      ? filterCategoryId
      : undefined;

  // Figure out which product IDs match the filter (if any)
  let filteredProductIds: string[] | null = null;
  if (validCategoryId) {
    const matches = await db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(eq(productCategories.categoryId, validCategoryId));
    filteredProductIds = matches.map((m) => m.productId);
  }

  const allProducts = filteredProductIds
    ? filteredProductIds.length > 0
      ? await db
          .select()
          .from(products)
          .where(inArray(products.id, filteredProductIds))
          .orderBy(products.name)
      : []
    : await db.select().from(products).orderBy(products.name);

  // Fetch all product-category associations with category names
  const associations = await db
    .select({
      productId: productCategories.productId,
      categoryName: categories.name,
    })
    .from(productCategories)
    .innerJoin(categories, eq(categories.id, productCategories.categoryId));

  const categoriesByProduct: Record<string, string[]> = {};
  for (const a of associations) {
    if (!categoriesByProduct[a.productId]) categoriesByProduct[a.productId] = [];
    categoriesByProduct[a.productId].push(a.categoryName);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-9 px-4 hover:bg-gray-800 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <CategoryFilterSelect
          basePath="/admin/products"
          currentCategoryId={validCategoryId}
          options={allCategories.map((c) => ({ value: c.id, label: c.name, parentId: c.parentId }))}
        />
        <span className="text-sm text-gray-500">
          {allProducts.length} product{allProducts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {allProducts.map((product) => (
          <Link
            key={product.id}
            href={`/admin/products/${product.id}`}
            className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  £{Number(product.basePrice).toFixed(2)}
                </p>
              </div>
              <span
                className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  product.active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {product.active ? "Active" : "Inactive"}
              </span>
            </div>
            {categoriesByProduct[product.id]?.length ? (
              <div className="flex flex-wrap gap-1 mt-2">
                {categoriesByProduct[product.id].map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : null}
          </Link>
        ))}
        {allProducts.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            {validCategoryId
              ? "No products in this category."
              : "No products registered."}
          </p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Categories</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Base Price</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium w-24"></th>
            </tr>
          </thead>
          <tbody>
            {allProducts.map((product) => (
              <tr key={product.id} className="border-b border-gray-100 last:border-0">
                <td className="py-3 px-4 font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="py-3 px-4">
                  {categoriesByProduct[product.id]?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {categoriesByProduct[product.id].map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  £{Number(product.basePrice).toFixed(2)}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {product.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="text-sm text-gray-500 underline hover:text-gray-900"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {allProducts.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center text-gray-500 py-8"
                >
                  {validCategoryId
                    ? "No products in this category."
                    : "No products registered."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
