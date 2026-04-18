import { db } from "@/db";
import {
  products,
  productImages,
  productVariations,
  categories,
  productCategories,
  kits,
  kitItems,
  kitItemVariations,
  kitItemVariationOptions,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireFullAccess } from "../../_lib/get-company";
import { KitBuilderForm } from "./_components/kit-builder-form";

type KitItemInput = {
  productId: string;
  quantity: number;
  variations: {
    color?: {
      mode: "fixed" | "editable";
      defaultVariationId: string;
      allowedOptionIds: string[];
    };
    size?: {
      mode: "fixed" | "editable";
      defaultVariationId: string;
      allowedOptionIds: string[];
    };
  };
};

export default async function NewKitPage() {
  const allProductsRaw = await db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(products.name);

  // Fetch cover image (lowest sortOrder) for each product from product_images
  const allProductImages = await db
    .select({
      productId: productImages.productId,
      imageUrl: productImages.imageUrl,
    })
    .from(productImages)
    .orderBy(asc(productImages.sortOrder));

  const coverImageByProduct = allProductImages.reduce<Record<string, string>>(
    (acc, img) => {
      if (!acc[img.productId]) acc[img.productId] = img.imageUrl;
      return acc;
    },
    {},
  );

  const allProducts = allProductsRaw.map((p) => ({
    ...p,
    imageUrl: coverImageByProduct[p.id] ?? null,
  }));

  // Fetch all categories + product<->category relations
  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(categories.name);

  const allProductCategories = await db
    .select({
      productId: productCategories.productId,
      categoryId: productCategories.categoryId,
    })
    .from(productCategories);

  const categoriesByProduct = allProductCategories.reduce<
    Record<string, string[]>
  >((acc, row) => {
    if (!acc[row.productId]) acc[row.productId] = [];
    acc[row.productId].push(row.categoryId);
    return acc;
  }, {});

  const allVariations = await db.select().from(productVariations);

  const variationsByProduct = allVariations.reduce(
    (acc, v) => {
      if (!acc[v.productId]) acc[v.productId] = { color: [], size: [] };
      acc[v.productId][v.type].push(v);
      return acc;
    },
    {} as Record<
      string,
      {
        color: (typeof allVariations)[number][];
        size: (typeof allVariations)[number][];
      }
    >,
  );

  async function createKit(formData: FormData) {
    "use server";
    const { company } = await requireFullAccess();
    const name = formData.get("name") as string;
    const itemsJson = formData.get("items_json") as string;

    if (!name || !itemsJson) return;

    let items: KitItemInput[];
    try {
      items = JSON.parse(itemsJson);
    } catch {
      throw new Error("Invalid kit data. Please try again.");
    }
    const validItems = items.filter((item) => item.quantity > 0);

    if (validItems.length === 0) {
      throw new Error("Please add at least one product to the kit.");
    }

    const [kit] = await db
      .insert(kits)
      .values({
        companyId: company.id,
        name,
        status: "pending",
      })
      .returning();

    for (const item of validItems) {
      const [kitItem] = await db
        .insert(kitItems)
        .values({
          kitId: kit.id,
          productId: item.productId,
          quantity: item.quantity,
        })
        .returning();

      for (const variationType of ["color", "size"] as const) {
        const varConfig = item.variations[variationType];
        if (!varConfig) continue;

        const [kitItemVar] = await db
          .insert(kitItemVariations)
          .values({
            kitItemId: kitItem.id,
            variationType,
            mode: varConfig.mode,
            defaultVariationId: varConfig.defaultVariationId,
          })
          .returning();

        if (varConfig.mode === "editable" && varConfig.allowedOptionIds.length > 0) {
          await db.insert(kitItemVariationOptions).values(
            varConfig.allowedOptionIds.map((variationId) => ({
              kitItemVariationId: kitItemVar.id,
              variationId,
            })),
          );
        }
      }
    }

    revalidatePath("/dashboard/kits");
    redirect("/dashboard/kits");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/kits"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-medium h-8 px-3 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Kit</h1>
          <p className="text-gray-500">
            Browse the catalog and add products to build your kit
          </p>
        </div>
      </div>

      <KitBuilderForm
        products={allProducts}
        variationsByProduct={variationsByProduct}
        categories={allCategories.map((c) => ({ id: c.id, name: c.name }))}
        categoriesByProduct={categoriesByProduct}
        createKit={createKit}
      />
    </div>
  );
}
