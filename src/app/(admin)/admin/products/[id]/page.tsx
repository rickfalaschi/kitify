import { db } from "@/db";
import {
  products,
  productVariations,
  productImages,
  variationImages,
  kitItems,
  kitItemVariations,
  kitItemVariationOptions,
  companyProductMockups,
  categories,
  productCategories,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { deleteFile } from "@/lib/s3";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { EditProductForm } from "./_components/edit-product-form";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/login");
}

function revalidate(id: string) {
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/admin/products");
}

function extractKey(url: string) {
  const parts = url.split("/");
  return parts.slice(3).join("/");
}

async function updateProduct(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const basePrice = formData.get("basePrice") as string;
  const active = formData.get("active") === "true";

  await db
    .update(products)
    .set({
      name,
      description: description || null,
      basePrice,
      active,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidate(id);
}

async function uploadProductImages(formData: FormData) {
  "use server";
  await requireAdmin();
  const productId = formData.get("productId") as string;
  const imageUrlsJson = formData.get("imageUrls") as string;

  if (imageUrlsJson) {
    let urls: string[];
    try { urls = JSON.parse(imageUrlsJson); } catch { urls = []; }
    for (const url of urls) {
      await db.insert(productImages).values({
        productId,
        imageUrl: url,
      });
    }
  }

  revalidate(productId);
}

async function deleteProductImage(formData: FormData) {
  "use server";
  await requireAdmin();
  const imageId = formData.get("imageId") as string;
  const productId = formData.get("productId") as string;

  const [image] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.id, imageId))
    .limit(1);

  if (image) {
    await deleteFile(extractKey(image.imageUrl));
    await db.delete(productImages).where(eq(productImages.id, imageId));
  }

  revalidate(productId);
}

async function addVariation(formData: FormData) {
  "use server";
  await requireAdmin();
  const productId = formData.get("productId") as string;
  const type = formData.get("type") as "color" | "size";
  const value = formData.get("value") as string;
  const priceAdjustment = formData.get("priceAdjustment") as string;

  await db.insert(productVariations).values({
    productId,
    type,
    value,
    priceAdjustment: priceAdjustment || "0",
  });

  revalidate(productId);
}

async function deleteVariation(formData: FormData) {
  "use server";
  await requireAdmin();
  const variationId = formData.get("variationId") as string;
  const productId = formData.get("productId") as string;

  // Delete variation images from B2 first
  const images = await db
    .select()
    .from(variationImages)
    .where(eq(variationImages.variationId, variationId));

  for (const img of images) {
    await deleteFile(extractKey(img.imageUrl));
  }

  await db
    .delete(variationImages)
    .where(eq(variationImages.variationId, variationId));

  await db
    .delete(productVariations)
    .where(eq(productVariations.id, variationId));

  revalidate(productId);
}

async function uploadVariationImages(formData: FormData) {
  "use server";
  await requireAdmin();
  const variationId = formData.get("variationId") as string;
  const productId = formData.get("productId") as string;
  const imageUrlsJson = formData.get("imageUrls") as string;

  if (imageUrlsJson) {
    let urls: string[];
    try { urls = JSON.parse(imageUrlsJson); } catch { urls = []; }
    for (const url of urls) {
      await db.insert(variationImages).values({
        variationId,
        imageUrl: url,
      });
    }
  }

  revalidate(productId);
}

async function deleteProduct(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  "use server";

  await requireAdmin();
  const productId = formData.get("productId") as string;
  if (!productId) return { error: "Missing product ID" };

  // Find all kit items that use this product
  const itemsForProduct = await db
    .select({ id: kitItems.id })
    .from(kitItems)
    .where(eq(kitItems.productId, productId));
  const kitItemIds = itemsForProduct.map((i) => i.id);

  // Fetch all product variations (needed for cleanup)
  const variations = await db
    .select({ id: productVariations.id })
    .from(productVariations)
    .where(eq(productVariations.productId, productId));
  const variationIds = variations.map((v) => v.id);

  // Existing orders are safe: order_items + order_item_selections snapshot
  // product/variation data and have no FK constraints back to products.

  // 1) Remove product from all kits — delete kit_item_variation_options,
  //    kit_item_variations, and kit_items
  if (kitItemIds.length > 0) {
    const kivs = await db
      .select({ id: kitItemVariations.id })
      .from(kitItemVariations)
      .where(inArray(kitItemVariations.kitItemId, kitItemIds));
    const kivIds = kivs.map((k) => k.id);

    if (kivIds.length > 0) {
      await db
        .delete(kitItemVariationOptions)
        .where(inArray(kitItemVariationOptions.kitItemVariationId, kivIds));
      await db
        .delete(kitItemVariations)
        .where(inArray(kitItemVariations.id, kivIds));
    }

    await db.delete(kitItems).where(inArray(kitItems.id, kitItemIds));
  }

  // 2) Delete company_product_mockups (B2 + DB) for this product
  const mockups = await db
    .select({ id: companyProductMockups.id, imageUrl: companyProductMockups.imageUrl })
    .from(companyProductMockups)
    .where(eq(companyProductMockups.productId, productId));
  for (const m of mockups) {
    await deleteFile(extractKey(m.imageUrl));
  }
  await db
    .delete(companyProductMockups)
    .where(eq(companyProductMockups.productId, productId));

  // 3) Delete variation images (B2 + DB)
  if (variationIds.length > 0) {
    const varImgs = await db
      .select({ id: variationImages.id, imageUrl: variationImages.imageUrl })
      .from(variationImages)
      .where(inArray(variationImages.variationId, variationIds));
    for (const img of varImgs) {
      await deleteFile(extractKey(img.imageUrl));
    }
    await db
      .delete(variationImages)
      .where(inArray(variationImages.variationId, variationIds));
  }

  // 4) Delete product variations
  await db
    .delete(productVariations)
    .where(eq(productVariations.productId, productId));

  // 5) Delete product images (B2 + DB)
  const prodImgs = await db
    .select({ id: productImages.id, imageUrl: productImages.imageUrl })
    .from(productImages)
    .where(eq(productImages.productId, productId));
  for (const img of prodImgs) {
    await deleteFile(extractKey(img.imageUrl));
  }
  await db.delete(productImages).where(eq(productImages.productId, productId));

  // 6) Delete the product itself (and legacy imageUrl if present)
  const [productRow] = await db
    .select({ imageUrl: products.imageUrl })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (productRow?.imageUrl) {
    await deleteFile(extractKey(productRow.imageUrl));
  }
  await db.delete(products).where(eq(products.id, productId));

  revalidatePath("/admin/products");
  revalidatePath("/admin/kits");
  redirect("/admin/products");
}

async function syncProductCategories(formData: FormData) {
  "use server";
  await requireAdmin();
  const productId = formData.get("productId") as string;
  const categoryIds = formData.getAll("categoryIds") as string[];
  if (!productId) return;

  // Delete all existing associations, then insert new ones
  await db
    .delete(productCategories)
    .where(eq(productCategories.productId, productId));

  for (const categoryId of categoryIds) {
    await db
      .insert(productCategories)
      .values({ productId, categoryId })
      .onConflictDoNothing();
  }

  revalidate(productId);
}

async function deleteVariationImage(formData: FormData) {
  "use server";
  await requireAdmin();
  const imageId = formData.get("imageId") as string;
  const productId = formData.get("productId") as string;

  const [image] = await db
    .select()
    .from(variationImages)
    .where(eq(variationImages.id, imageId))
    .limit(1);

  if (image) {
    await deleteFile(extractKey(image.imageUrl));
    await db.delete(variationImages).where(eq(variationImages.id, imageId));
  }

  revalidate(productId);
}

export default async function EditProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) {
    notFound();
  }

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id))
    .orderBy(productImages.sortOrder);

  const variations = await db
    .select()
    .from(productVariations)
    .where(eq(productVariations.productId, id));

  const varImages = await db
    .select({
      id: variationImages.id,
      variationId: variationImages.variationId,
      imageUrl: variationImages.imageUrl,
    })
    .from(variationImages)
    .innerJoin(
      productVariations,
      eq(variationImages.variationId, productVariations.id),
    )
    .where(eq(productVariations.productId, id));

  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(categories.name);

  const productCats = await db
    .select({ categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(eq(productCategories.productId, id));

  return (
    <EditProductForm
      product={{
        id: product.id,
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        active: product.active,
      }}
      images={images.map((img) => ({ id: img.id, imageUrl: img.imageUrl }))}
      variations={variations.map((v) => ({
        id: v.id,
        type: v.type,
        value: v.value,
        priceAdjustment: v.priceAdjustment,
      }))}
      variationImages={varImages}
      categories={allCategories.map((c) => ({ id: c.id, name: c.name }))}
      productCategoryIds={productCats.map((pc) => pc.categoryId)}
      updateProduct={updateProduct}
      uploadProductImages={uploadProductImages}
      deleteProductImage={deleteProductImage}
      addVariation={addVariation}
      deleteVariation={deleteVariation}
      uploadVariationImages={uploadVariationImages}
      deleteVariationImage={deleteVariationImage}
      deleteProduct={deleteProduct}
      syncProductCategories={syncProductCategories}
    />
  );
}
