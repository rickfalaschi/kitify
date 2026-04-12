import { db } from "@/db";
import { products, productImages, categories, productCategories } from "@/db/schema";
import { redirect } from "next/navigation";
import { CreateProductForm } from "./_components/create-product-form";
import { auth } from "@/lib/auth";

async function createProductAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/login");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const basePrice = formData.get("basePrice") as string;
  const imageUrlsJson = formData.get("imageUrls") as string;
  const categoryIds = formData.getAll("categoryIds") as string[];

  const [newProduct] = await db
    .insert(products)
    .values({
      name,
      description: description || null,
      basePrice,
    })
    .returning({ id: products.id });

  // Images were already uploaded via /api/upload, just save the URLs
  if (imageUrlsJson) {
    let urls: string[];
    try { urls = JSON.parse(imageUrlsJson); } catch { urls = []; }
    for (let i = 0; i < urls.length; i++) {
      await db.insert(productImages).values({
        productId: newProduct.id,
        imageUrl: urls[i],
        sortOrder: i,
      });
    }
  }

  // Associate categories
  for (const categoryId of categoryIds) {
    await db
      .insert(productCategories)
      .values({ productId: newProduct.id, categoryId })
      .onConflictDoNothing();
  }

  redirect(`/admin/products/${newProduct.id}`);
}

export default async function NewProductPage() {
  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(categories.name);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Product</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 max-w-2xl">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Product Details
          </h3>
        </div>
        <div className="p-6 pt-0">
          <CreateProductForm
            createProductAction={createProductAction}
            categories={allCategories.map((c) => ({ id: c.id, name: c.name }))}
          />
        </div>
      </div>
    </div>
  );
}
