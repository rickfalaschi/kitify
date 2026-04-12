import Link from "next/link";
import { db } from "@/db";
import { products, productCategories, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Plus } from "lucide-react";

export default async function ProdutosPage() {
  const allProducts = await db.select().from(products).orderBy(products.name);

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

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                  No products registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
