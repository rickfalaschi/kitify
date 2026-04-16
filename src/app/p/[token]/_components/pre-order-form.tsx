"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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

type PreOrderState = { error?: string; success?: boolean };

type Props = {
  companyName: string;
  kitName: string;
  items: ItemData[];
  deliveryType: "company_address" | "employee_address";
  existingEmployeeName?: string;
  existingSelections: Record<string, Record<string, string>>;
  completePreOrder: (
    prev: PreOrderState,
    formData: FormData,
  ) => Promise<PreOrderState>;
};

type Selections = Record<string, Record<string, string>>;

export function PreOrderForm({
  companyName,
  kitName,
  items,
  deliveryType,
  existingEmployeeName,
  existingSelections,
  completePreOrder,
}: Props) {
  // Initialize selections: use existing (pre-filled) or fall back to defaults
  const initialSelections: Selections = {};
  for (const item of items) {
    for (const vc of item.variations) {
      if (!initialSelections[item.kitItemId]) {
        initialSelections[item.kitItemId] = {};
      }
      initialSelections[item.kitItemId][vc.variationType] =
        existingSelections[item.kitItemId]?.[vc.variationType] ??
        vc.defaultVariationId;
    }
  }

  const [selections, setSelections] = useState<Selections>(initialSelections);
  const [state, formAction, pending] = useActionState<PreOrderState, FormData>(
    completePreOrder,
    {},
  );
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (state.success) setSubmitted(true);
  }, [state.success]);

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

  if (submitted) {
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
          <p className="text-lg font-semibold text-gray-900">Thank you!</p>
          <p className="mt-2 text-sm text-gray-500">
            Your preferences have been saved. Your kit will be on its way soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kitify-logo-dark.svg"
            alt="Kitify"
            className="mx-auto h-10 w-auto"
          />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Choose your kit preferences
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {companyName} &middot; {kitName}
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <input
            type="hidden"
            name="selections_json"
            value={JSON.stringify(selections)}
          />

          {state.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {state.error}
            </div>
          )}

          {/* Kit Items */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-6 pb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Kit Items
              </h2>
            </div>
            <div className="px-6 pb-6 space-y-4">
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
                      {item.variations.map((vc, idx) => (
                        <div key={`${item.kitItemId}-${vc.variationType}-${idx}`}>
                          {vc.mode === "fixed" ? (
                            <p className="text-sm text-gray-500">
                              {vc.variationType === "color" ? "Color" : "Size"}:{" "}
                              <span className="text-gray-700">
                                {vc.defaultValue}
                              </span>
                              <span className="ml-1 text-gray-400">
                                (fixed)
                              </span>
                            </p>
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {vc.variationType === "color"
                                  ? "Color"
                                  : "Size"}
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
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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

          {/* Delivery */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-6 pb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Delivery
              </h2>
            </div>
            <div className="px-6 pb-6">
              {deliveryType === "company_address" ? (
                <p className="text-sm text-gray-500">
                  Your kit will be delivered to the company office.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="employeeName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Full name
                    </label>
                    <input
                      id="employeeName"
                      name="employeeName"
                      required
                      defaultValue={existingEmployeeName ?? ""}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="employeeAddressLine1"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Address line 1
                    </label>
                    <input
                      id="employeeAddressLine1"
                      name="employeeAddressLine1"
                      required
                      placeholder="e.g. 42 Maple Road"
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="employeeAddressLine2"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Address line 2{" "}
                      <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      id="employeeAddressLine2"
                      name="employeeAddressLine2"
                      placeholder="e.g. Flat 4B"
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="employeeCity"
                      className="block text-sm font-medium text-gray-700"
                    >
                      City
                    </label>
                    <input
                      id="employeeCity"
                      name="employeeCity"
                      required
                      placeholder="e.g. Manchester"
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="employeeCounty"
                      className="block text-sm font-medium text-gray-700"
                    >
                      County{" "}
                      <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      id="employeeCounty"
                      name="employeeCounty"
                      placeholder="e.g. Greater Manchester"
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="employeePostcode"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Postcode
                    </label>
                    <input
                      id="employeePostcode"
                      name="employeePostcode"
                      required
                      placeholder="e.g. M1 1AA"
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="employeeCountry"
                      className="block text-sm font-medium text-gray-700"
                    >
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
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={pending}
              aria-busy={pending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 text-white text-sm font-medium h-10 px-8 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? "Submitting..." : "Confirm Preferences"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
