import { db } from "@/db";
import { categories, productCategories } from "@/db/schema";
import { eq, sql, isNull, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmForm } from "@/components/confirm-form";
import { Trash2, Plus, FolderOpen, ChevronRight } from "lucide-react";

async function createCategory(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || !session.user.isAdmin) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  const parentId = (formData.get("parentId") as string) || null;
  if (!name) return;

  // Get max sortOrder for siblings
  const siblings = parentId
    ? await db
        .select({ sortOrder: categories.sortOrder })
        .from(categories)
        .where(eq(categories.parentId, parentId))
        .orderBy(asc(categories.sortOrder))
    : await db
        .select({ sortOrder: categories.sortOrder })
        .from(categories)
        .where(isNull(categories.parentId))
        .orderBy(asc(categories.sortOrder));

  const nextSort =
    siblings.length > 0
      ? Math.max(...siblings.map((s) => s.sortOrder)) + 1
      : 0;

  await db.insert(categories).values({ name, parentId, sortOrder: nextSort });
  revalidatePath("/admin/categories");
}

async function deleteCategory(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || !session.user.isAdmin) redirect("/login");

  const categoryId = formData.get("categoryId") as string;
  if (!categoryId) return;

  // Get all descendant category IDs (children, grandchildren, etc.)
  const allCats = await db.select().from(categories);
  const idsToDelete: string[] = [];

  function collectDescendants(parentId: string) {
    idsToDelete.push(parentId);
    for (const cat of allCats) {
      if (cat.parentId === parentId) {
        collectDescendants(cat.id);
      }
    }
  }
  collectDescendants(categoryId);

  // Remove associations first, then all categories
  for (const id of idsToDelete) {
    await db
      .delete(productCategories)
      .where(eq(productCategories.categoryId, id));
    await db.delete(categories).where(eq(categories.id, id));
  }

  revalidatePath("/admin/categories");
}

type CategoryRow = {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  productCount: number;
};

function buildTree(
  allCats: CategoryRow[],
): (CategoryRow & { children: CategoryRow[] })[] {
  const roots = allCats
    .filter((c) => !c.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return roots.map((root) => ({
    ...root,
    children: allCats
      .filter((c) => c.parentId === root.id)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

export default async function CategoriesPage() {
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      parentId: categories.parentId,
      sortOrder: categories.sortOrder,
      createdAt: categories.createdAt,
      productCount: sql<number>`count(${productCategories.id})::int`,
    })
    .from(categories)
    .leftJoin(
      productCategories,
      eq(productCategories.categoryId, categories.id),
    )
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  const tree = buildTree(allCategories);
  const parentCategories = allCategories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-500">Manage product categories and subcategories</p>
      </div>

      {/* Add category form */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <form action={createCategory} className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex-1 w-full sm:w-auto">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="Category name"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div className="w-full sm:w-48">
              <label
                htmlFor="parentId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Parent
              </label>
              <select
                id="parentId"
                name="parentId"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">None (top-level)</option>
                {parentCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </SubmitButton>
          </form>
        </div>
      </div>

      {/* Category tree */}
      <div className="space-y-3">
        {tree.map((parent) => (
          <div
            key={parent.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            {/* Parent category row */}
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <FolderOpen className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{parent.name}</p>
                  <p className="text-xs text-gray-500">
                    {parent.productCount}{" "}
                    {parent.productCount === 1 ? "product" : "products"}
                    {parent.children.length > 0 &&
                      ` · ${parent.children.length} subcategor${parent.children.length === 1 ? "y" : "ies"}`}
                  </p>
                </div>
              </div>
              <ConfirmForm
                action={deleteCategory}
                message={
                  parent.children.length > 0
                    ? `Delete "${parent.name}" and its ${parent.children.length} subcategor${parent.children.length === 1 ? "y" : "ies"}? All will be removed from associated products.`
                    : `Delete category "${parent.name}"? It will be removed from all associated products.`
                }
              >
                <input type="hidden" name="categoryId" value={parent.id} />
                <SubmitButton
                  variant="secondary"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 text-xs h-8 px-2"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Delete
                </SubmitButton>
              </ConfirmForm>
            </div>

            {/* Subcategories */}
            {parent.children.length > 0 && (
              <div className="border-t border-gray-100">
                {parent.children.map((child, i) => (
                  <div
                    key={child.id}
                    className={`flex items-center justify-between gap-3 px-4 py-3 pl-11 ${
                      i < parent.children.length - 1
                        ? "border-b border-gray-50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                      <span className="text-sm text-gray-700">
                        {child.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {child.productCount}{" "}
                        {child.productCount === 1 ? "product" : "products"}
                      </span>
                    </div>
                    <ConfirmForm
                      action={deleteCategory}
                      message={`Delete subcategory "${child.name}"? It will be removed from all associated products.`}
                    >
                      <input
                        type="hidden"
                        name="categoryId"
                        value={child.id}
                      />
                      <SubmitButton
                        variant="secondary"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 text-xs h-7 px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </SubmitButton>
                    </ConfirmForm>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {tree.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">
              No categories yet. Create one above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
