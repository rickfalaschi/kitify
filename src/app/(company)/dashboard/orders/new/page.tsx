import { randomBytes } from "crypto";
import { db } from "@/db";
import {
  kits,
  kitItems,
  kitItemVariations,
  kitItemVariationOptions,
  products,
  productImages,
  productVariations,
  companyAddresses,
  orders,
  orderItems,
  orderItemSelections,
  settings,
} from "@/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getCompany } from "../../_lib/get-company";
import { calculateOrderTotal } from "@/lib/calculate-order-total";
import { OrderForm } from "./_components/order-form";
import { recordOrderStatusChange } from "@/lib/record-order-status-change";
import { sendShippingQuoteRequestEmail } from "@/lib/email";

export default async function NewOrderPage(props: {
  searchParams: Promise<{ kitId?: string }>;
}) {
  const { kitId } = await props.searchParams;
  const { company } = await getCompany();

  if (!kitId) redirect("/dashboard/kits");

  const [kit] = await db
    .select()
    .from(kits)
    .where(eq(kits.id, kitId))
    .limit(1);

  if (!kit || kit.companyId !== company.id || kit.status !== "active")
    notFound();

  // Fetch kit items with products
  const itemsRaw = await db
    .select({
      kitItem: kitItems,
      product: products,
    })
    .from(kitItems)
    .innerJoin(products, eq(products.id, kitItems.productId))
    .where(eq(kitItems.kitId, kit.id));

  // Fetch cover image (lowest sortOrder) for each product in this kit
  const productIds = itemsRaw.map((i) => i.product.id);
  const coverImagesRaw =
    productIds.length > 0
      ? await db
          .select({
            productId: productImages.productId,
            imageUrl: productImages.imageUrl,
          })
          .from(productImages)
          .where(inArray(productImages.productId, productIds))
          .orderBy(asc(productImages.sortOrder))
      : [];
  const coverImageByProduct = coverImagesRaw.reduce<Record<string, string>>(
    (acc, row) => {
      if (!acc[row.productId]) acc[row.productId] = row.imageUrl;
      return acc;
    },
    {},
  );

  const items = itemsRaw.map((row) => ({
    ...row,
    product: {
      ...row.product,
      imageUrl: coverImageByProduct[row.product.id] ?? null,
    },
  }));

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
            inArray(
              kitItemVariationOptions.kitItemVariationId,
              editableConfigIds
            )
          )
      : [];

  // Fetch company addresses
  const addresses = await db
    .select()
    .from(companyAddresses)
    .where(eq(companyAddresses.companyId, company.id))
    .orderBy(companyAddresses.label);

  // Build serializable data for the client component
  type VariationOption = {
    variationId: string;
    value: string;
  };

  type VariationConfig = {
    id: string;
    kitItemId: string;
    variationType: "color" | "size";
    mode: "fixed" | "editable";
    defaultVariationId: string;
    defaultValue: string;
    options: VariationOption[];
  };

  type ItemData = {
    kitItemId: string;
    productName: string;
    productImageUrl: string | null;
    quantity: number;
    basePrice: string;
    variations: VariationConfig[];
  };

  const itemsData: ItemData[] = items.map((row) => {
    const configs = variationConfigs.filter(
      (vc) => vc.config.kitItemId === row.kitItem.id
    );

    return {
      kitItemId: row.kitItem.id,
      productName: row.product.name,
      productImageUrl: row.product.imageUrl,
      quantity: row.kitItem.quantity,
      basePrice: String(row.product.basePrice),
      variations: configs.map((vc) => {
        const itemOptions = options
          .filter((o) => o.option.kitItemVariationId === vc.config.id)
          .map((o) => ({
            variationId: o.variation.id,
            value: o.variation.value,
          }));

        return {
          id: vc.config.id,
          kitItemId: vc.config.kitItemId,
          variationType: vc.config.variationType,
          mode: vc.config.mode,
          defaultVariationId: vc.config.defaultVariationId,
          defaultValue: vc.defaultVariation.value,
          options: itemOptions,
        };
      }),
    };
  });

  const addressesData = addresses.map((addr) => ({
    id: addr.id,
    label: addr.label,
    addressLine1: addr.addressLine1,
    city: addr.city,
    postcode: addr.postcode,
  }));

  // Build a lookup of allowed variation IDs per config for validation
  const allowedByConfig = new Map<string, Set<string>>();
  for (const vc of variationConfigs) {
    const allowed = new Set<string>();
    allowed.add(vc.config.defaultVariationId);
    if (vc.config.mode === "editable") {
      const opts = options.filter(
        (o) => o.option.kitItemVariationId === vc.config.id
      );
      for (const o of opts) {
        allowed.add(o.variation.id);
      }
    }
    allowedByConfig.set(vc.config.id, allowed);
  }

  async function createOrder(formData: FormData) {
    "use server";
    const { company, userId } = await getCompany();
    const action = (formData.get("action") as string) || "order";
    const isPreorder = action === "preorder";
    const deliveryType = formData.get("deliveryType") as string;
    const kitIdValue = formData.get("kitId") as string;
    const selectionsJson = formData.get("selections_json") as string;

    if (!deliveryType || !kitIdValue) {
      throw new Error("Missing delivery information. Please try again.");
    }

    // For direct orders (not pre-orders), validate the delivery details up
    // front. Pre-orders intentionally allow blank employee fields because the
    // employee fills them in via the public /p/<token> link.
    if (!isPreorder) {
      if (deliveryType === "company_address") {
        const companyAddressId = formData.get("companyAddressId") as string;
        if (!companyAddressId) {
          throw new Error("Please select a company address before placing the order.");
        }
      } else if (deliveryType === "employee_address") {
        const name = ((formData.get("employeeName") as string) || "").trim();
        const line1 = ((formData.get("employeeAddressLine1") as string) || "").trim();
        const city = ((formData.get("employeeCity") as string) || "").trim();
        const postcode = ((formData.get("employeePostcode") as string) || "").trim();
        if (!name || !line1 || !city || !postcode) {
          throw new Error("Please fill in the employee's name, address, city and postcode before placing the order.");
        }
      }
    }

    // Parse selections: Record<kitItemId, Record<variationType, variationId>>
    let selections: Record<string, Record<string, string>> = {};
    try {
      selections = selectionsJson ? JSON.parse(selectionsJson) : {};
    } catch {
      throw new Error("Invalid selection data. Please try again.");
    }

    // Re-fetch kit items WITH product data for snapshot
    const currentItemsRaw = await db
      .select({
        kitItem: kitItems,
        product: products,
      })
      .from(kitItems)
      .innerJoin(products, eq(products.id, kitItems.productId))
      .where(eq(kitItems.kitId, kitIdValue));

    // Fetch cover image per product so we can snapshot into order_items.product_image_url
    const currentProductIds = currentItemsRaw.map((i) => i.product.id);
    const currentCoverRaw =
      currentProductIds.length > 0
        ? await db
            .select({
              productId: productImages.productId,
              imageUrl: productImages.imageUrl,
            })
            .from(productImages)
            .where(inArray(productImages.productId, currentProductIds))
            .orderBy(asc(productImages.sortOrder))
        : [];
    const currentCoverByProduct = currentCoverRaw.reduce<Record<string, string>>(
      (acc, row) => {
        if (!acc[row.productId]) acc[row.productId] = row.imageUrl;
        return acc;
      },
      {},
    );

    const currentItems = currentItemsRaw.map((row) => ({
      ...row,
      product: {
        ...row.product,
        imageUrl: currentCoverByProduct[row.product.id] ?? null,
      },
    }));

    const currentItemIds = currentItems.map((i) => i.kitItem.id);

    const currentConfigs =
      currentItemIds.length > 0
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
            .where(inArray(kitItemVariations.kitItemId, currentItemIds))
        : [];

    const editableIds = currentConfigs
      .filter((c) => c.config.mode === "editable")
      .map((c) => c.config.id);

    const currentOptions =
      editableIds.length > 0
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
              inArray(
                kitItemVariationOptions.kitItemVariationId,
                editableIds
              )
            )
        : [];

    // Build allowed map (variationId -> snapshot info)
    const allowedMap = new Map<string, Set<string>>();
    const variationInfo = new Map<
      string,
      { type: "color" | "size"; value: string; priceAdjustment: string }
    >();
    for (const c of currentConfigs) {
      const allowed = new Set<string>();
      allowed.add(c.config.defaultVariationId);
      variationInfo.set(c.config.defaultVariationId, {
        type: c.config.variationType,
        value: c.defaultVariation.value,
        priceAdjustment: c.defaultVariation.priceAdjustment,
      });
      if (c.config.mode === "editable") {
        const opts = currentOptions.filter(
          (o) => o.option.kitItemVariationId === c.config.id
        );
        for (const o of opts) {
          allowed.add(o.option.variationId);
          variationInfo.set(o.variation.id, {
            type: c.config.variationType,
            value: o.variation.value,
            priceAdjustment: o.variation.priceAdjustment,
          });
        }
      }
      allowedMap.set(c.config.id, allowed);
    }

    const values: typeof orders.$inferInsert = {
      companyId: company.id,
      kitId: kitIdValue,
      userId,
      deliveryType: deliveryType as "company_address" | "employee_address",
    };

    if (isPreorder) {
      values.status = "pending";
      values.publicToken = randomBytes(32).toString("hex");
      // Public pre-order links expire after 30 days so stale links can't be
      // used to confirm orders indefinitely.
      values.publicTokenExpiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      );
    }

    if (deliveryType === "company_address") {
      values.companyAddressId = formData.get("companyAddressId") as string;
    } else {
      // For pre-orders with employee_address, address fields are optional
      values.employeeName =
        (formData.get("employeeName") as string) || (isPreorder ? null : undefined) as string | null | undefined;
      values.employeeAddressLine1 =
        (formData.get("employeeAddressLine1") as string) || (isPreorder ? null : undefined) as string | null | undefined;
      values.employeeAddressLine2 =
        (formData.get("employeeAddressLine2") as string) || null;
      values.employeeCity =
        (formData.get("employeeCity") as string) || (isPreorder ? null : undefined) as string | null | undefined;
      values.employeeCounty =
        (formData.get("employeeCounty") as string) || null;
      values.employeePostcode =
        (formData.get("employeePostcode") as string) || (isPreorder ? null : undefined) as string | null | undefined;
      values.employeeCountry =
        (formData.get("employeeCountry") as string) || "United Kingdom";
    }

    const [newOrder] = await db.insert(orders).values(values).returning();

    // 1) Snapshot kit items into order_items
    const orderItemRows: (typeof orderItems.$inferInsert)[] = currentItems.map(
      (row, idx) => ({
        orderId: newOrder.id,
        productName: row.product.name,
        productImageUrl: row.product.imageUrl,
        basePrice: row.product.basePrice,
        quantity: row.kitItem.quantity,
        productId: row.product.id,
        kitItemId: row.kitItem.id,
        sortOrder: idx,
      }),
    );
    const insertedOrderItems =
      orderItemRows.length > 0
        ? await db.insert(orderItems).values(orderItemRows).returning()
        : [];
    const orderItemByKitItemId = new Map<string, string>();
    for (const oi of insertedOrderItems) {
      if (oi.kitItemId) orderItemByKitItemId.set(oi.kitItemId, oi.id);
    }

    // 2) Insert order item selections with snapshot data
    const selectionInserts: (typeof orderItemSelections.$inferInsert)[] = [];

    for (const c of currentConfigs) {
      const kitItemId = c.config.kitItemId;
      const variationType = c.config.variationType;
      const allowed = allowedMap.get(c.config.id);

      let chosenVariationId: string;

      if (c.config.mode === "fixed") {
        chosenVariationId = c.config.defaultVariationId;
      } else {
        // Editable: use user selection or fall back to default
        const userChoice = selections[kitItemId]?.[variationType];
        if (userChoice && allowed?.has(userChoice)) {
          chosenVariationId = userChoice;
        } else {
          // For pre-orders, skip editable selections that have no user choice
          if (isPreorder && !userChoice) continue;
          chosenVariationId = c.config.defaultVariationId;
        }
      }

      const orderItemId = orderItemByKitItemId.get(kitItemId);
      const snapshot = variationInfo.get(chosenVariationId);
      if (!orderItemId || !snapshot) continue;

      selectionInserts.push({
        orderItemId,
        variationType: snapshot.type,
        variationValue: snapshot.value,
        priceAdjustment: snapshot.priceAdjustment,
        variationId: chosenVariationId,
      });
    }

    if (selectionInserts.length > 0) {
      await db.insert(orderItemSelections).values(selectionInserts);
    }

    if (isPreorder) {
      // Record initial state for pre-orders (they'll stay in "pending" until
      // the employee completes the public form).
      await recordOrderStatusChange({
        orderId: newOrder.id,
        fromStatus: null,
        toStatus: "pending",
        changedByUserId: userId,
        reason: "Pre-order created",
      });
      revalidatePath("/dashboard/orders");
      redirect(`/dashboard/orders/pre-order/${newOrder.id}`);
    }

    // Determine if UK or international
    let isUK = true;
    if (deliveryType === "company_address") {
      const companyAddressId = formData.get("companyAddressId") as string;
      if (companyAddressId) {
        const [addr] = await db
          .select({ country: companyAddresses.country })
          .from(companyAddresses)
          .where(eq(companyAddresses.id, companyAddressId))
          .limit(1);
        isUK = !addr?.country || addr.country === "United Kingdom";
      }
    } else if (deliveryType === "employee_address") {
      const country = formData.get("employeeCountry") as string;
      isUK = !country || country === "United Kingdom";
    }

    // Calculate item total
    const total = await calculateOrderTotal(newOrder.id);

    if (isUK) {
      // Fetch UK shipping cost from settings
      const [ukShippingSetting] = await db
        .select()
        .from(settings)
        .where(eq(settings.key, "uk_shipping_cost"))
        .limit(1);
      const shippingCost = ukShippingSetting?.value ?? "0";
      const totalWithShipping = (
        parseFloat(total.toString()) + parseFloat(shippingCost)
      ).toFixed(2);

      await db
        .update(orders)
        .set({
          status: "awaiting_payment",
          shippingCost,
          totalAmount: totalWithShipping,
        })
        .where(eq(orders.id, newOrder.id));

      await recordOrderStatusChange({
        orderId: newOrder.id,
        fromStatus: null,
        toStatus: "awaiting_payment",
        changedByUserId: userId,
        reason: "Order placed (UK, direct payment)",
      });

      revalidatePath("/dashboard/orders");
      redirect(`/dashboard/orders/${newOrder.id}/pay`);
    } else {
      // International: needs admin shipping quote before the payment link is released
      await db
        .update(orders)
        .set({
          status: "awaiting_shipping_quote",
          totalAmount: total.toString(),
        })
        .where(eq(orders.id, newOrder.id));

      await recordOrderStatusChange({
        orderId: newOrder.id,
        fromStatus: null,
        toStatus: "awaiting_shipping_quote",
        changedByUserId: userId,
        reason: "Order placed (international, needs shipping quote)",
      });

      sendShippingQuoteRequestEmail({
        companyName: company.name,
        kitName: kit.name,
        orderId: newOrder.id,
      }).catch((err) =>
        console.error("sendShippingQuoteRequestEmail failed", err),
      );

      revalidatePath("/dashboard/orders");
      redirect(`/dashboard/orders`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-medium h-8 px-3 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
          <p className="text-gray-500">Order kit: {kit.name}</p>
        </div>
      </div>

      <OrderForm
        items={itemsData}
        addresses={addressesData}
        kitId={kit.id}
        createOrder={createOrder}
      />
    </div>
  );
}
