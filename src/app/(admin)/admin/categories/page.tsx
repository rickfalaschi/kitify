import { db } from "@/db";
import { categories, productCategories, products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmForm } from "@/components/confirm-form";
import { Trash2, Plus } from "lucide-react";

async function createCategory(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  await db.insert(categories).values({ name }).onConflictDoNothing();
  revalidatePath("/admin/categories");
}

async function deleteCategory(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/login");

  const categoryId = formData.get("categoryId") as string;
  if (!categoryId) return;

  // Remove associations first, then the category
  await db
    .delete(productCategories)
    .where(eq(productCategories.categoryId, categoryId));
  await db.delete(categories).where(eq(categories.id, categoryId));
  revalidatePath("/admin/categories");
}

export default async function CategoriesPage() {
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      createdAt: categories.createdAt,
      productCount: sql<number>`count(${productCategories.id})::int`,
    })
    .from(categories)
    .leftJoin(
      productCategories,
      eq(productCategories.categoryId, categories.id),
    )
    .groupBy(categories.id)
    .orderBy(categories.name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-500">Manage product categories</p>
      </div>

      {/* Add category form */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <form action={createCategory} className="flex items-end gap-3">
            <div className="flex-1">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New Category
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="Category name"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <SubmitButton>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </SubmitButton>
          </form>
        </div>
      </div>

      {/* Categories list */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">
                Name
              </th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">
                Products
              </th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {allCategories.map((cat) => (
              <tr
                key={cat.id}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="py-3 px-4 font-medium text-gray-900">
                  {cat.name}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {cat.productCount}{" "}
                  {cat.productCount === 1 ? "product" : "products"}
                </td>
                <td className="py-3 px-4">
                  <ConfirmForm
                    action={deleteCategory}
                    message={`Delete category "${cat.name}"? It will be removed from all associated products.`}
                    className="flex justify-end"
                  >
                    <input
                      type="hidden"
                      name="categoryId"
                      value={cat.id}
                    />
                    <SubmitButton
                      variant="secondary"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 text-xs h-8 px-2"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete
                    </SubmitButton>
                  </ConfirmForm>
                </td>
              </tr>
            ))}
            {allCategories.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-gray-500 py-8">
                  No categories yet. Create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
