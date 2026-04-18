"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

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

type AddressData = {
  id: string;
  label: string;
  addressLine1: string;
  city: string;
  postcode: string;
};

// kitItemId -> variationType -> variationId
type Selections = Record<string, Record<string, string>>;

export function OrderForm({
  items,
  addresses,
  kitId,
  createOrder,
}: {
  items: ItemData[];
  addresses: AddressData[];
  kitId: string;
  createOrder: (formData: FormData) => Promise<void>;
}) {
  // Initialize selections with defaults
  const initialSelections: Selections = {};
  for (const item of items) {
    for (const vc of item.variations) {
      if (!initialSelections[item.kitItemId]) {
        initialSelections[item.kitItemId] = {};
      }
      initialSelections[item.kitItemId][vc.variationType] =
        vc.defaultVariationId;
    }
  }

  const [selections, setSelections] = useState<Selections>(initialSelections);
  const [deliveryType, setDeliveryType] = useState<string>("company_address");
  const [preorderEmails, setPreorderEmails] = useState<string[]>([""]);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createOrder(formData);
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Could not place the order. Please try again.";
        toast.error(message);
      }
    });
  }

  function handleVariationChange(
    kitItemId: string,
    variationType: string,
    variationId: string
  ) {
    setSelections((prev) => ({
      ...prev,
      [kitItemId]: {
        ...prev[kitItemId],
        [variationType]: variationId,
      },
    }));
  }

  function addPreorderEmail() {
    setPreorderEmails((prev) => [...prev, ""]);
  }

  function removePreorderEmail(index: number) {
    setPreorderEmails((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePreorderEmail(index: number, value: string) {
    setPreorderEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
  }

  const validPreorderEmails = preorderEmails.filter((e) => e.trim() && e.includes("@"));

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="kitId" value={kitId} />
      <input
        type="hidden"
        name="selections_json"
        value={JSON.stringify(selections)}
      />

      {/* Description */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
        </div>
        <div className="p-6 pt-0">
          <label
            htmlFor="description"
            className="text-sm font-medium text-gray-700"
          >
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="description"
            name="description"
            placeholder="e.g. Welcome kit for John Smith"
            maxLength={500}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">Kit Summary</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.kitItemId}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {item.productName}
                  </span>
                  <span className="text-sm text-gray-500">
                    Qty: {item.quantity}
                  </span>
                </div>

                {item.variations.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {item.variations.map((vc) => (
                      <div key={vc.id}>
                        {vc.mode === "fixed" ? (
                          <p className="text-sm text-gray-500">
                            {vc.variationType === "color" ? "Color" : "Size"}:{" "}
                            <span className="text-gray-700">
                              {vc.defaultValue}
                            </span>
                            <span className="ml-1 text-gray-400">(fixed)</span>
                          </p>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {vc.variationType === "color" ? "Color" : "Size"}
                            </label>
                            <select
                              value={
                                selections[item.kitItemId]?.[
                                  vc.variationType
                                ] || vc.defaultVariationId
                              }
                              onChange={(e) =>
                                handleVariationChange(
                                  item.kitItemId,
                                  vc.variationType,
                                  e.target.value
                                )
                              }
                              className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            >
                              {vc.options.map((opt) => (
                                <option
                                  key={opt.variationId}
                                  value={opt.variationId}
                                >
                                  {opt.value}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">Delivery Type</h3>
        </div>
        <div className="p-6 pt-0 space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="radio"
              id="company_address"
              name="deliveryType"
              value="company_address"
              checked={deliveryType === "company_address"}
              onChange={() => setDeliveryType("company_address")}
              className="h-4 w-4"
            />
            <label
              htmlFor="company_address"
              className="text-sm font-medium text-gray-700"
            >
              Company address
            </label>
          </div>

          {deliveryType === "company_address" && (
            <div className="ml-7 space-y-2">
              <select
                name="companyAddressId"
                required
                className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">Select address</option>
                {addresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.label} - {addr.addressLine1}, {addr.city}{" "}
                    {addr.postcode}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="radio"
              id="employee_address"
              name="deliveryType"
              value="employee_address"
              checked={deliveryType === "employee_address"}
              onChange={() => setDeliveryType("employee_address")}
              className="h-4 w-4"
            />
            <label
              htmlFor="employee_address"
              className="text-sm font-medium text-gray-700"
            >
              Employee address
            </label>
          </div>

          {deliveryType === "employee_address" && (
            <p className="ml-7 text-sm text-gray-500">
              For pre-orders, the employee will fill in their address. For direct orders, fill it in below.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pre-Order */}
        <div className="bg-white rounded-lg border border-gray-200 flex flex-col">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pre-Order</h3>
          </div>
          <div className="p-6 pt-0 flex-1 flex flex-col gap-3">
            <p className="text-sm text-gray-500">
              Each recipient gets a link to choose their preferences.
            </p>
            <div className="space-y-2 flex-1">
              {preorderEmails.map((email, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => updatePreorderEmail(i, e.target.value)}
                    placeholder="employee@company.com"
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  {preorderEmails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePreorderEmail(i)}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPreorderEmail}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add another
              </button>
            </div>

            <input
              type="hidden"
              name="bulk_emails_json"
              value={JSON.stringify(validPreorderEmails)}
            />
            <input type="hidden" name="preorder_mode" value={preorderEmails.length > 1 ? "bulk" : "single"} />

            <button
              type="submit"
              name="action"
              value="preorder"
              disabled={isPending || validPreorderEmails.length === 0}
              className="w-full inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium h-10 px-6 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {validPreorderEmails.length > 1
                ? `Create ${validPreorderEmails.length} Pre-Order Links`
                : "Create Pre-Order Link"}
            </button>
          </div>
        </div>

        {/* Place Order */}
        <div className="bg-white rounded-lg border border-gray-200 flex flex-col">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Place Order</h3>
          </div>
          <div className="p-6 pt-0 flex-1 flex flex-col gap-3">
            <p className="text-sm text-gray-500">
              Order directly with the current selections.
            </p>

            {deliveryType === "employee_address" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="employeeName" className="text-sm font-medium text-gray-700">
                    Full name
                  </label>
                  <input
                    id="employeeName"
                    name="employeeName"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="employeeAddressLine1" className="text-sm font-medium text-gray-700">
                    Address line 1
                  </label>
                  <input
                    id="employeeAddressLine1"
                    name="employeeAddressLine1"
                    placeholder="e.g. 42 Maple Road"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="employeeAddressLine2" className="text-sm font-medium text-gray-700">
                    Address line 2 <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="employeeAddressLine2"
                    name="employeeAddressLine2"
                    placeholder="e.g. Flat 4B"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="employeeCity" className="text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    id="employeeCity"
                    name="employeeCity"
                    placeholder="e.g. Manchester"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="employeeCounty" className="text-sm font-medium text-gray-700">
                    County <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="employeeCounty"
                    name="employeeCounty"
                    placeholder="e.g. Greater Manchester"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="employeePostcode" className="text-sm font-medium text-gray-700">
                    Postcode
                  </label>
                  <input
                    id="employeePostcode"
                    name="employeePostcode"
                    placeholder="e.g. M1 1AA"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="employeeCountry" className="text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    id="employeeCountry"
                    name="employeeCountry"
                    defaultValue="United Kingdom"
                    placeholder="e.g. United Kingdom"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              name="action"
              value="order"
              disabled={isPending}
              className="w-full inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-10 px-6 hover:bg-gray-800 transition-colors disabled:opacity-50 mt-auto"
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
