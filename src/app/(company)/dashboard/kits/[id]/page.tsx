import Link from "next/link";
import { db } from "@/db";
import {
  kits,
  kitItems,
  kitItemVariations,
  kitItemVariationOptions,
  companyProductMockups,
  products,
  productVariations,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { getCompany } from "../../_lib/get-company";

const statusConfig = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-600" },
} as const;

export default async function KitDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { company } = await getCompany();

  const [kit] = await db
    .select()
    .from(kits)
    .where(eq(kits.id, id))
    .limit(1);

  if (!kit || kit.companyId !== company.id) notFound();

  const items = await db
    .select({
      kitItem: kitItems,
      product: products,
    })
    .from(kitItems)
    .innerJoin(products, eq(products.id, kitItems.productId))
    .where(eq(kitItems.kitId, kit.id));

  const kitItemIds = items.map((i) => i.kitItem.id);

  // Fetch variation configs with default variation info
  const variationConfigs =
    kitItemIds.length > 0
      ? await db
          .select({
            config: kitItemVariations,
            defaultVariation: productVariations,
          })
          .from(kitItemVariations)
          .innerJoin(
            productVariations,
            eq(productVariations.id, kitItemVariations.defaultVariationId)
          )
          .where(inArray(kitItemVariations.kitItemId, kitItemIds))
      : [];

  // Fetch options for editable configs
  const editableConfigIds = variationConfigs
    .filter((c) => c.config.mode === "editable")
    .map((c) => c.config.id);

  const options =
    editableConfigIds.length > 0
      ? await db
          .select({
            option: kitItemVariationOptions,
            variation: productVariations,
          })
          .from(kitItemVariationOptions)
          .innerJoin(
            productVariations,
            eq(productVariations.id, kitItemVariationOptions.variationId)
          )
          .where(
            inArray(kitItemVariationOptions.kitItemVariationId, editableConfigIds)
          )
      : [];

  // Group configs and options by kitItemId
  const configsByItem = new Map<
    string,
    {
      config: typeof kitItemVariations.$inferSelect;
      defaultVariation: typeof productVariations.$inferSelect;
      options: { value: string; id: string }[];
    }[]
  >();

  for (const vc of variationConfigs) {
    const itemId = vc.config.kitItemId;
    if (!configsByItem.has(itemId)) configsByItem.set(itemId, []);

    const itemOptions = options
      .filter((o) => o.option.kitItemVariationId === vc.config.id)
      .map((o) => ({ value: o.variation.value, id: o.variation.id }));

    configsByItem.get(itemId)!.push({
      config: vc.config,
      defaultVariation: vc.defaultVariation,
      options: itemOptions,
    });
  }

  // Fetch per-product mockups for this company (with variationId)
  const productIds = [...new Set(items.map((i) => i.product.id))];
  const mockups = productIds.length > 0
    ? await db
        .select({
          id: companyProductMockups.id,
          productId: companyProductMockups.productId,
          variationId: companyProductMockups.variationId,
          imageUrl: companyProductMockups.imageUrl,
        })
        .from(companyProductMockups)
        .where(and(eq(companyProductMockups.companyId, company.id), inArray(companyProductMockups.productId, productIds)))
    : [];

  // Key: productId (no color) or productId:variationId (with color)
  const mockupsByKey: Record<string, { id: string; imageUrl: string }> = {};
  for (const m of mockups) {
    const key = m.variationId ? `${m.productId}:${m.variationId}` : m.productId;
    mockupsByKey[key] = { id: m.id, imageUrl: m.imageUrl };
  }

  const status = statusConfig[kit.status];

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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{kit.name}</h1>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
        </div>
        {kit.status === "active" && (
          <Link
            href={`/dashboard/orders/new?kitId=${kit.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-9 px-4 hover:bg-gray-800 transition-colors"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Order Kit
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">Kit Items</h3>
        </div>
        <div className="p-6 pt-0">
          {items.length === 0 ? (
            <p className="text-gray-500">No items in this kit.</p>
          ) : (
            <div className="space-y-3">
              {items.map((row) => {
                const configs = configsByItem.get(row.kitItem.id) || [];
                return (
                  <div
                    key={row.kitItem.id}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 shrink-0 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border border-gray-200">
                      {row.product.imageUrl ? (
                        <img
                          src={row.product.imageUrl}
                          alt={row.product.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">Img</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {row.product.name}
                      </p>
                      {configs.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {configs.map((vc) => (
                            <p
                              key={vc.config.id}
                              className="text-sm text-gray-500"
                            >
                              {vc.config.variationType === "color"
                                ? "Color"
                                : "Size"}
                              : {vc.defaultVariation.value}
                              {vc.config.mode === "fixed" ? (
                                <span className="ml-1 text-gray-400">
                                  (fixed)
                                </span>
                              ) : (
                                <span className="ml-1 text-gray-400">
                                  (editable, default)
                                  {vc.options.length > 0 && (
                                    <>
                                      {" "}
                                      &mdash; Options:{" "}
                                      {vc.options
                                        .map((o) => o.value)
                                        .join(", ")}
                                    </>
                                  )}
                                </span>
                              )}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        Qty: {row.kitItem.quantity}
                      </p>
                      <p className="text-sm text-gray-500">
                        £{Number(row.product.basePrice).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {/* Product mockup(s) */}
                  {(() => {
                    // Check if this product has color configs in the kit
                    const itemConfigs = configsByItem.get(row.kitItem.id) || [];
                    const colorConfig = itemConfigs.find((c) => c.config.variationType === "color");
                    const colorOptions = colorConfig
                      ? [
                          { id: colorConfig.defaultVariation.id, value: colorConfig.defaultVariation.value },
                          ...colorConfig.options.filter((o) => o.id !== colorConfig.defaultVariation.id),
                        ]
                      : [];

                    if (colorOptions.length > 0) {
                      const rendered = colorOptions
                        .map((c) => {
                          const m = mockupsByKey[`${row.product.id}:${c.id}`];
                          return m ? { ...m, label: c.value } : null;
                        })
                        .filter(Boolean);
                      if (rendered.length === 0) return null;
                      return (
                        <div className="ml-16 mt-2 flex gap-2">
                          {rendered.map((m) => (
                            <div key={m!.id} className="text-center">
                              <div className="h-20 w-20 rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                                <img src={m!.imageUrl} alt="Mockup" className="h-full w-full object-cover" />
                              </div>
                              <span className="text-[10px] text-gray-400">{m!.label}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    // Single mockup
                    const m = mockupsByKey[row.product.id];
                    if (!m) return null;
                    return (
                      <div className="ml-16 mt-2">
                        <div className="h-20 w-20 rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                          <img src={m.imageUrl} alt="Mockup" className="h-full w-full object-cover" />
                        </div>
                      </div>
                    );
                  })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
