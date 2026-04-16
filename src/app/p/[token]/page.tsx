import { db } from "@/db";
import {
  orders,
  kits,
  companies,
  kitItems,
  kitItemVariations,
  kitItemVariationOptions,
  products,
  productVariations,
  orderItems,
  orderItemSelections,
  settings,
  companyAddresses,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { calculateOrderTotal } from "@/lib/calculate-order-total";
import { PreOrderForm } from "./_components/pre-order-form";

export default async function PreOrderPage(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;

  // Fetch order by publicToken, join with kit and company
  const result = await db
    .select({
      order: orders,
      kit: kits,
      company: companies,
    })
    .from(orders)
    .innerJoin(kits, eq(kits.id, orders.kitId))
    .innerJoin(companies, eq(companies.id, orders.companyId))
    .where(eq(orders.publicToken, token))
    .limit(1);

  if (result.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-lg font-semibold text-gray-900">Link not found</p>
          <p className="mt-2 text-sm text-gray-500">
            This pre-order link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const { order, kit, company } = result[0];

  // Pre-orders start with status=pending. After submission the order moves to
  // awaiting_payment (UK) or awaiting_shipping_quote (international), so any
  // non-pending status means the employee has already submitted.
  if (order.status !== "pending") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            Already submitted
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Your preferences have already been submitted for this order.
          </p>
        </div>
      </div>
    );
  }

  // Fetch kit items with products
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
            inArray(
              kitItemVariationOptions.kitItemVariationId,
              editableConfigIds
            )
          )
      : [];

  // Check if order already has selections (company pre-filled).
  // Joins via order_items which holds the snapshotted kitItemId.
  const existingSelectionsRows = await db
    .select({
      kitItemId: orderItems.kitItemId,
      variationType: orderItemSelections.variationType,
      variationId: orderItemSelections.variationId,
    })
    .from(orderItemSelections)
    .innerJoin(orderItems, eq(orderItems.id, orderItemSelections.orderItemId))
    .where(eq(orderItems.orderId, order.id));

  const existingSelections: Record<string, Record<string, string>> = {};
  for (const sel of existingSelectionsRows) {
    if (!sel.kitItemId || !sel.variationId) continue;
    if (!existingSelections[sel.kitItemId]) {
      existingSelections[sel.kitItemId] = {};
    }
    existingSelections[sel.kitItemId][sel.variationType] = sel.variationId;
  }

  // Build serializable data
  type ItemData = {
    kitItemId: string;
    productName: string;
    quantity: number;
    basePrice: string;
    variations: {
      variationType: "color" | "size";
      mode: "fixed" | "editable";
      defaultVariationId: string;
      defaultValue: string;
      options: { variationId: string; value: string }[];
    }[];
  };

  const itemsData: ItemData[] = items.map((row) => {
    const configs = variationConfigs.filter(
      (vc) => vc.config.kitItemId === row.kitItem.id
    );

    return {
      kitItemId: row.kitItem.id,
      productName: row.product.name,
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
          variationType: vc.config.variationType,
          mode: vc.config.mode,
          defaultVariationId: vc.config.defaultVariationId,
          defaultValue: vc.defaultVariation.value,
          options: itemOptions,
        };
      }),
    };
  });

  // Build allowed map for validation in server action
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

  async function completePreOrder(
    _prev: { error?: string; success?: boolean },
    formData: FormData,
  ): Promise<{ error?: string; success?: boolean }> {
    "use server";

    const selectionsJson = formData.get("selections_json") as string;

    let selections: Record<string, Record<string, string>> = {};
    try {
      selections = selectionsJson ? JSON.parse(selectionsJson) : {};
    } catch {
      return { error: "Could not read your selections. Please try again." };
    }

    // Re-fetch order to confirm it is still a pending pre-order awaiting the
    // employee's submission.
    const [currentOrder] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.publicToken, token), eq(orders.status, "pending")))
      .limit(1);

    if (!currentOrder) {
      return {
        error:
          "This pre-order link is no longer active. Your preferences may have already been submitted.",
      };
    }

    // Re-fetch the order's snapshotted items (created at pre-order time)
    const currentOrderItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, currentOrder.id));

    const orderItemByKitItemId = new Map<string, string>();
    for (const oi of currentOrderItems) {
      if (oi.kitItemId) orderItemByKitItemId.set(oi.kitItemId, oi.id);
    }
    const currentItemIds = Array.from(orderItemByKitItemId.keys());

    // Re-fetch variation configs + variations for validation and snapshotting.
    // If a kit item has been removed from the kit since pre-order creation,
    // it will be missing from kit_item_variations and gracefully skipped.
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

    // Build allowed map + variation snapshot lookup
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

    // Delete any existing selections for this order's items
    const orderItemIds = Array.from(orderItemByKitItemId.values());
    if (orderItemIds.length > 0) {
      await db
        .delete(orderItemSelections)
        .where(inArray(orderItemSelections.orderItemId, orderItemIds));
    }

    // Insert new selections with snapshot data
    const selectionInserts: (typeof orderItemSelections.$inferInsert)[] = [];

    for (const c of currentConfigs) {
      const kitItemId = c.config.kitItemId;
      const variationType = c.config.variationType;
      const allowed = allowedMap.get(c.config.id);

      let chosenVariationId: string;

      if (c.config.mode === "fixed") {
        chosenVariationId = c.config.defaultVariationId;
      } else {
        const userChoice = selections[kitItemId]?.[variationType];
        if (userChoice && allowed?.has(userChoice)) {
          chosenVariationId = userChoice;
        } else {
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

    // Calculate total
    const total = await calculateOrderTotal(currentOrder.id);

    // Update order with address fields if employee_address delivery
    const updateValues: Partial<typeof orders.$inferInsert> = {};

    if (currentOrder.deliveryType === "employee_address") {
      const name = ((formData.get("employeeName") as string) || "").trim();
      const line1 = ((formData.get("employeeAddressLine1") as string) || "").trim();
      const city = ((formData.get("employeeCity") as string) || "").trim();
      const postcode = ((formData.get("employeePostcode") as string) || "").trim();
      const country = ((formData.get("employeeCountry") as string) || "").trim() || "United Kingdom";

      if (!name || !line1 || !city || !postcode) {
        return {
          error:
            "Please fill in your name, address, city and postcode before confirming.",
        };
      }

      updateValues.employeeName = name;
      updateValues.employeeAddressLine1 = line1;
      updateValues.employeeAddressLine2 =
        ((formData.get("employeeAddressLine2") as string) || "").trim() || null;
      updateValues.employeeCity = city;
      updateValues.employeeCounty =
        ((formData.get("employeeCounty") as string) || "").trim() || null;
      updateValues.employeePostcode = postcode;
      updateValues.employeeCountry = country;
    }

    // Determine if UK or international
    let isUK = true;
    if (currentOrder.deliveryType === "company_address" && currentOrder.companyAddressId) {
      const [addr] = await db
        .select({ country: companyAddresses.country })
        .from(companyAddresses)
        .where(eq(companyAddresses.id, currentOrder.companyAddressId))
        .limit(1);
      isUK = !addr?.country || addr.country === "United Kingdom";
    } else if (currentOrder.deliveryType === "employee_address") {
      const country = formData.get("employeeCountry") as string;
      isUK = !country || country === "United Kingdom";
    }

    if (isUK) {
      const [ukShippingSetting] = await db
        .select()
        .from(settings)
        .where(eq(settings.key, "uk_shipping_cost"))
        .limit(1);
      const shippingCost = ukShippingSetting?.value ?? "0";
      const totalWithShipping = (
        parseFloat(total.toString()) + parseFloat(shippingCost)
      ).toFixed(2);
      updateValues.status = "awaiting_payment";
      updateValues.shippingCost = shippingCost;
      updateValues.totalAmount = totalWithShipping;
    } else {
      // International: needs admin shipping quote before the payment link is released.
      updateValues.status = "awaiting_shipping_quote";
      updateValues.totalAmount = total.toString();
    }

    await db
      .update(orders)
      .set(updateValues)
      .where(eq(orders.id, currentOrder.id));

    revalidatePath(`/p/${token}`);
    return { success: true };
  }

  return (
    <PreOrderForm
      companyName={company.name}
      kitName={kit.name}
      items={itemsData}
      deliveryType={order.deliveryType}
      existingEmployeeName={order.employeeName ?? undefined}
      existingSelections={existingSelections}
      completePreOrder={completePreOrder}
    />
  );
}
