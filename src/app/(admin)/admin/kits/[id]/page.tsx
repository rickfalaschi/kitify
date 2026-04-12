import Link from "next/link";
import { db } from "@/db";
import {
  kits,
  kitItems,
  kitItemVariations,
  kitItemVariationOptions,
  products,
  productVariations,
  companies,
  companyProductMockups,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { deleteFile } from "@/lib/s3";
import { ArrowLeft } from "lucide-react";
import { ProductMockupManager } from "./_components/mockup-manager";
import { auth } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-600" },
};

export default async function AdminKitDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const [kit] = await db
    .select({
      id: kits.id,
      name: kits.name,
      status: kits.status,
      companyId: kits.companyId,
      companyName: companies.name,
      createdAt: kits.createdAt,
    })
    .from(kits)
    .innerJoin(companies, eq(companies.id, kits.companyId))
    .where(eq(kits.id, id))
    .limit(1);

  if (!kit) notFound();

  // Fetch kit items with products
  const items = await db
    .select({
      kitItemId: kitItems.id,
      productId: kitItems.productId,
      productName: products.name,
      basePrice: products.basePrice,
      quantity: kitItems.quantity,
    })
    .from(kitItems)
    .innerJoin(products, eq(products.id, kitItems.productId))
    .where(eq(kitItems.kitId, id));

  // Fetch variation configs
  const kitItemIds = items.map((i) => i.kitItemId);
  let variationConfigs: { kitItemId: string; variationType: string; mode: string; defaultValue: string; defaultVariationId: string }[] = [];
  let variationOptions: { kitItemId: string; variationType: string; value: string; variationId: string }[] = [];

  if (kitItemIds.length > 0) {
    const configs = await db
      .select({
        id: kitItemVariations.id,
        kitItemId: kitItemVariations.kitItemId,
        variationType: kitItemVariations.variationType,
        mode: kitItemVariations.mode,
        defaultValue: productVariations.value,
        defaultVariationId: kitItemVariations.defaultVariationId,
      })
      .from(kitItemVariations)
      .innerJoin(productVariations, eq(productVariations.id, kitItemVariations.defaultVariationId))
      .where(inArray(kitItemVariations.kitItemId, kitItemIds));

    variationConfigs = configs;

    const editableConfigIds = configs.filter((c) => c.mode === "editable").map((c) => c.id);
    if (editableConfigIds.length > 0) {
      const opts = await db
        .select({ kitItemVariationId: kitItemVariationOptions.kitItemVariationId, variationId: productVariations.id, value: productVariations.value })
        .from(kitItemVariationOptions)
        .innerJoin(productVariations, eq(productVariations.id, kitItemVariationOptions.variationId))
        .where(inArray(kitItemVariationOptions.kitItemVariationId, editableConfigIds));

      const configMap: Record<string, { kitItemId: string; variationType: string }> = {};
      for (const c of configs) configMap[c.id] = { kitItemId: c.kitItemId, variationType: c.variationType };
      variationOptions = opts.map((o) => ({ ...configMap[o.kitItemVariationId], variationId: o.variationId, value: o.value }));
    }
  }

  const configsByItem: Record<string, { type: string; mode: string; defaultValue: string; options: string[] }[]> = {};
  for (const c of variationConfigs) {
    if (!configsByItem[c.kitItemId]) configsByItem[c.kitItemId] = [];
    const opts = variationOptions
      .filter((o) => o.kitItemId === c.kitItemId && o.variationType === c.variationType)
      .map((o) => o.value);
    configsByItem[c.kitItemId].push({ type: c.variationType, mode: c.mode, defaultValue: c.defaultValue, options: opts });
  }

  // Derive color variations from kit config (not all product colors)
  const productIds = [...new Set(items.map((i) => i.productId))];
  let colorsByProduct: Record<string, { id: string; value: string }[]> = {};

  for (const item of items) {
    const colorConfig = variationConfigs.find(
      (vc) => vc.kitItemId === item.kitItemId && vc.variationType === "color"
    );
    if (!colorConfig) continue;

    if (colorConfig.mode === "fixed") {
      // Fixed: only the default color
      colorsByProduct[item.productId] = [{ id: colorConfig.defaultVariationId, value: colorConfig.defaultValue }];
    } else {
      // Editable: default + allowed options
      const colors: { id: string; value: string }[] = [
        { id: colorConfig.defaultVariationId, value: colorConfig.defaultValue },
      ];
      const opts = variationOptions.filter(
        (o) => o.kitItemId === item.kitItemId && o.variationType === "color"
      );
      for (const o of opts) {
        if (!colors.find((c) => c.id === o.variationId)) {
          colors.push({ id: o.variationId, value: o.value });
        }
      }
      colorsByProduct[item.productId] = colors;
    }
  }

  // Fetch mockups for this company's products (with variationId)
  let mockupsByKey: Record<string, { id: string; imageUrl: string } | null> = {};

  if (productIds.length > 0) {
    const mockups = await db
      .select({
        id: companyProductMockups.id,
        productId: companyProductMockups.productId,
        variationId: companyProductMockups.variationId,
        imageUrl: companyProductMockups.imageUrl,
      })
      .from(companyProductMockups)
      .where(and(eq(companyProductMockups.companyId, kit.companyId), inArray(companyProductMockups.productId, productIds)));

    for (const m of mockups) {
      const key = m.variationId ? `${m.productId}:${m.variationId}` : m.productId;
      mockupsByKey[key] = { id: m.id, imageUrl: m.imageUrl };
    }
  }

  // Count mockups and missing ones
  let totalMockups = 0;
  let totalSlots = 0;
  for (const pid of productIds) {
    const colors = colorsByProduct[pid];
    if (colors && colors.length > 0) {
      totalSlots += colors.length;
      for (const c of colors) {
        if (mockupsByKey[`${pid}:${c.id}`]) totalMockups++;
      }
    } else {
      totalSlots++;
      if (mockupsByKey[pid]) totalMockups++;
    }
  }
  const missingMockups = totalSlots - totalMockups;

  // Server actions
  async function uploadMockup(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "admin") redirect("/login");
    const productId = formData.get("productId") as string;
    const companyId = formData.get("companyId") as string;
    const variationId = formData.get("variationId") as string | null;
    const imageUrl = formData.get("imageUrl") as string;
    if (!productId || !companyId || !imageUrl) return;

    // Delete existing mockup for this slot (1 per product or 1 per variation)
    if (variationId) {
      await db.delete(companyProductMockups).where(
        and(eq(companyProductMockups.companyId, companyId), eq(companyProductMockups.productId, productId), eq(companyProductMockups.variationId, variationId))
      );
      await db.insert(companyProductMockups).values({ companyId, productId, variationId, imageUrl });
    } else {
      await db.delete(companyProductMockups).where(
        and(eq(companyProductMockups.companyId, companyId), eq(companyProductMockups.productId, productId))
      );
      await db.insert(companyProductMockups).values({ companyId, productId, imageUrl });
    }

    revalidatePath(`/admin/kits/${formData.get("kitId") as string}`);
  }

  async function deleteMockup(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "admin") redirect("/login");
    const mockupId = formData.get("mockupId") as string;
    const kitId = formData.get("kitId") as string;
    if (!mockupId) return;

    const [mockup] = await db.select().from(companyProductMockups).where(eq(companyProductMockups.id, mockupId)).limit(1);
    if (mockup) {
      const bucketPrefix = `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET}/`;
      if (mockup.imageUrl.startsWith(bucketPrefix)) {
        try { await deleteFile(mockup.imageUrl.slice(bucketPrefix.length)); } catch {}
      }
      await db.delete(companyProductMockups).where(eq(companyProductMockups.id, mockupId));
    }

    revalidatePath(`/admin/kits/${kitId}`);
  }

  async function updateKitStatus(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "admin") redirect("/login");
    const kitId = formData.get("kitId") as string;
    const newStatus = formData.get("status") as "pending" | "active" | "inactive";
    if (!kitId || !newStatus) return;

    await db.update(kits).set({ status: newStatus, updatedAt: new Date() }).where(eq(kits.id, kitId));
    revalidatePath(`/admin/kits/${kitId}`);
    revalidatePath("/admin/kits");
  }

  const status = statusConfig[kit.status] || statusConfig.pending;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/kits" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-medium h-8 px-3 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{kit.name}</h1>
          <p className="text-sm text-gray-500">{kit.companyName} &middot; {new Date(kit.createdAt).toLocaleDateString("en-GB")}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
      </div>

      {/* Status Management */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">Kit Status</h3>
        </div>
        <div className="p-6 pt-0">
          <form action={updateKitStatus} className="flex items-center gap-3">
            <input type="hidden" name="kitId" value={kit.id} />
            <select name="status" defaultValue={kit.status} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <SubmitButton>Update Status</SubmitButton>
          </form>
          {kit.status === "pending" && missingMockups > 0 && (
            <p className="mt-3 text-sm text-amber-600">
              {missingMockups} mockup{missingMockups > 1 ? "s" : ""} still needed before activating this kit.
            </p>
          )}
        </div>
      </div>

      {/* Kit Items with per-product mockups */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">Kit Items &amp; Mockups ({items.length} products, {totalMockups} mockups)</h3>
        </div>
        <div className="p-6 pt-0 space-y-6">
          {items.map((item) => {
            const configs = configsByItem[item.kitItemId] || [];

            return (
              <div key={item.kitItemId} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Product info */}
                <div className="flex items-start justify-between p-4 bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    {configs.map((c, i) => (
                      <p key={i} className="text-sm text-gray-500">
                        {c.type === "color" ? "Color" : "Size"}: {c.defaultValue}{" "}
                        <span className="text-xs text-gray-400">
                          ({c.mode})
                          {c.mode === "editable" && c.options.length > 0 && <> &mdash; Options: {c.options.join(", ")}</>}
                        </span>
                      </p>
                    ))}
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-500">Qty: {item.quantity}</p>
                    <p className="text-gray-700">£{parseFloat(item.basePrice).toFixed(2)}</p>
                  </div>
                </div>

                {/* Mockups for this product */}
                <div className="p-4">
                  <ProductMockupManager
                    kitId={kit.id}
                    companyId={kit.companyId}
                    productId={item.productId}
                    productName={item.productName}
                    colorVariations={colorsByProduct[item.productId] || []}
                    mockupsByKey={mockupsByKey}
                    uploadMockup={uploadMockup}
                    deleteMockup={deleteMockup}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
