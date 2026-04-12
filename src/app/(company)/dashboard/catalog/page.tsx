import { db } from "@/db";
import {
  products,
  productVariations,
  categories,
  productCategories,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function CatalogoPage(props: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: selectedCategoryId } = await props.searchParams;

  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(categories.name);

  let allProducts = await db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(products.name);

  // If a category is selected, filter products
  if (selectedCategoryId) {
    const productIdsInCategory = await db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(eq(productCategories.categoryId, selectedCategoryId));
    const idSet = new Set(productIdsInCategory.map((p) => p.productId));
    allProducts = allProducts.filter((p) => idSet.has(p.id));
  }

  const allVariations = await db.select().from(productVariations);

  const variationsByProduct = allVariations.reduce(
    (acc, v) => {
      if (!acc[v.productId]) acc[v.productId] = [];
      acc[v.productId].push(v);
      return acc;
    },
    {} as Record<string, typeof allVariations>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
        <p className="text-gray-500">Products available to build kits</p>
      </div>

      {/* Category filter */}
      {allCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/catalog"
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              !selectedCategoryId
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            All
          </Link>
          {allCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/dashboard/catalog?category=${cat.id}`}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                selectedCategoryId === cat.id
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {allProducts.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          {selectedCategoryId
            ? "No products in this category."
            : "No products available at the moment."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {allProducts.map((product) => {
            const variations = variationsByProduct[product.id] || [];
            return (
              <div
                key={product.id}
                className="bg-white rounded-lg border border-gray-200"
              >
                <div className="p-6 pb-4">
                  <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center mb-3 overflow-hidden border border-gray-200">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">No image</span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {product.name}
                  </h3>
                </div>
                <div className="p-6 pt-0 space-y-2">
                  <p className="text-lg font-semibold text-gray-900">
                    £{Number(product.basePrice).toFixed(2)}
                  </p>
                  {product.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  {variations.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {variations.map((v) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600"
                        >
                          {v.type === "color" ? "Color" : "Size"}: {v.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
