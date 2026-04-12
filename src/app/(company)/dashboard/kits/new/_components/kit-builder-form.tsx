"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import {
  Search,
  X,
  Plus,
  Minus,
  ShoppingBag,
  Package,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";

/* ---------- Types ---------- */

type Product = {
  id: string;
  name: string;
  basePrice: string;
  description: string | null;
  imageUrl: string | null;
};

type Variation = {
  id: string;
  productId: string;
  type: "color" | "size";
  value: string;
  priceAdjustment: string;
};

type VariationsByProduct = Record<
  string,
  { color: Variation[]; size: Variation[] }
>;

type VariationConfig = {
  mode: "fixed" | "editable";
  defaultVariationId: string;
  allowedOptionIds: string[];
};

type CartItem = {
  productId: string;
  quantity: number;
  variations: {
    color?: VariationConfig;
    size?: VariationConfig;
  };
};

const ITEMS_PER_PAGE = 12;

/* ---------- Component ---------- */

export function KitBuilderForm({
  products,
  variationsByProduct,
  createKit,
}: {
  products: Product[];
  variationsByProduct: VariationsByProduct;
  createKit: (formData: FormData) => Promise<void>;
}) {
  const SESSION_KEY = "kit-builder-draft";

  const [kitName, setKitName] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? (JSON.parse(saved).kitName ?? "") : "";
    } catch { return ""; }
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? (JSON.parse(saved).cart ?? []) : [];
    } catch { return []; }
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Persist draft to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ kitName, cart }));
    } catch {}
  }, [kitName, cart]);

  // Modal state for configuring a product
  const [modalQty, setModalQty] = useState(1);
  const [modalVariations, setModalVariations] = useState<
    Record<string, VariationConfig>
  >({});

  /* ----- Filtering & Pagination ----- */

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  /* ----- Modal helpers ----- */

  function openProductModal(product: Product, existingIndex?: number) {
    setSelectedProduct(product);
    const vars = variationsByProduct[product.id] || { color: [], size: [] };

    if (existingIndex !== undefined) {
      const existing = cart[existingIndex];
      setModalQty(existing.quantity);
      setModalVariations({ ...existing.variations } as Record<string, VariationConfig>);
      setEditingIndex(existingIndex);
    } else {
      setModalQty(1);
      const initial: Record<string, VariationConfig> = {};
      for (const type of ["color", "size"] as const) {
        if (vars[type].length > 0) {
          initial[type] = {
            mode: "fixed",
            defaultVariationId: vars[type][0].id,
            allowedOptionIds: [vars[type][0].id],
          };
        }
      }
      setModalVariations(initial);
      setEditingIndex(null);
    }
  }

  function closeModal() {
    setSelectedProduct(null);
    setEditingIndex(null);
  }

  function addToCart() {
    if (!selectedProduct) return;
    const item: CartItem = {
      productId: selectedProduct.id,
      quantity: modalQty,
      variations: modalVariations as CartItem["variations"],
    };

    if (editingIndex !== null) {
      setCart((prev) => prev.map((c, i) => (i === editingIndex ? item : c)));
    } else {
      setCart((prev) => [...prev, item]);
    }
    closeModal();
  }

  function removeFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  /* ----- Variation modal controls ----- */

  function setVariationMode(type: string, mode: "fixed" | "editable") {
    setModalVariations((prev) => {
      const existing = prev[type];
      if (!existing) return prev;
      const updated = { ...existing, mode };
      if (
        mode === "editable" &&
        updated.allowedOptionIds.length === 0 &&
        updated.defaultVariationId
      ) {
        updated.allowedOptionIds = [updated.defaultVariationId];
      }
      return { ...prev, [type]: updated };
    });
  }

  function setDefaultVariation(type: string, variationId: string) {
    setModalVariations((prev) => {
      const existing = prev[type];
      if (!existing) return prev;
      const allowedOptionIds = existing.allowedOptionIds.includes(variationId)
        ? existing.allowedOptionIds
        : [...existing.allowedOptionIds, variationId];
      return {
        ...prev,
        [type]: { ...existing, defaultVariationId: variationId, allowedOptionIds },
      };
    });
  }

  function toggleAllowedOption(type: string, variationId: string) {
    setModalVariations((prev) => {
      const existing = prev[type];
      if (!existing) return prev;
      if (existing.defaultVariationId === variationId) return prev;
      const has = existing.allowedOptionIds.includes(variationId);
      const allowedOptionIds = has
        ? existing.allowedOptionIds.filter((id) => id !== variationId)
        : [...existing.allowedOptionIds, variationId];
      return { ...prev, [type]: { ...existing, allowedOptionIds } };
    });
  }

  /* ----- Submit ----- */

  function buildItemsPayload() {
    return cart.map((item) => {
      const variations: Record<string, VariationConfig> = {};
      for (const type of ["color", "size"] as const) {
        const config = item.variations[type];
        if (config?.defaultVariationId) {
          variations[type] = config;
        }
      }
      return { productId: item.productId, quantity: item.quantity, variations };
    });
  }

  /* ----- Helpers ----- */

  function getProduct(id: string) {
    return products.find((p) => p.id === id);
  }

  function getVariationLabel(productId: string, type: "color" | "size", variationId: string) {
    const vars = variationsByProduct[productId]?.[type] || [];
    return vars.find((v) => v.id === variationId)?.value || "";
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Kit Name */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Kit Name
        </label>
        <input
          value={kitName}
          onChange={(e) => setKitName(e.target.value)}
          placeholder="e.g. Onboarding Kit"
          className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      {/* Cart Preview */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-red-600" />
            <h3 className="text-base font-semibold text-gray-900">
              Kit Items
            </h3>
            {cart.length > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-red-50 text-red-600 text-xs font-semibold h-5 min-w-5 px-1.5">
                {cartCount}
              </span>
            )}
          </div>
        </div>
        <div className="px-5 pb-5">
          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No items yet. Browse the catalog below to add products.
            </p>
          ) : (
            <div className="space-y-2">
              {cart.map((item, index) => {
                const product = getProduct(item.productId);
                if (!product) return null;
                const colorLabel = item.variations.color
                  ? getVariationLabel(
                      item.productId,
                      "color",
                      item.variations.color.defaultVariationId
                    )
                  : null;
                const sizeLabel = item.variations.size
                  ? getVariationLabel(
                      item.productId,
                      "size",
                      item.variations.size.defaultVariationId
                    )
                  : null;

                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3"
                  >
                    <div className="h-10 w-10 shrink-0 bg-white rounded-md flex items-center justify-center overflow-hidden border border-gray-200">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <Package className="h-4 w-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Qty: {item.quantity}</span>
                        {colorLabel && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span>
                              Color: {colorLabel}
                              {item.variations.color?.mode === "editable" && (
                                <span className="text-gray-400"> (editable)</span>
                              )}
                            </span>
                          </>
                        )}
                        {sizeLabel && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span>
                              Size: {sizeLabel}
                              {item.variations.size?.mode === "editable" && (
                                <span className="text-gray-400"> (editable)</span>
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openProductModal(product, index)}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Catalog */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-5 pb-3">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Product Catalog
          </h3>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search products..."
              className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>
        <div className="px-5 pb-5">
          {paginated.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No products found.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginated.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => openProductModal(product)}
                    className="group text-left rounded-lg border border-gray-200 p-3 hover:border-gray-300 transition-colors"
                  >
                    <div className="aspect-square bg-gray-50 rounded-md flex items-center justify-center mb-2.5 overflow-hidden border border-gray-100">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-200" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      £{Number(product.basePrice).toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    {filtered.length} product{filtered.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-gray-600 px-2">
                      {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Kit Button */}
      <div className="flex justify-end">
        <form
          action={async (formData: FormData) => {
            formData.set("name", kitName);
            formData.set("items_json", JSON.stringify(buildItemsPayload()));
            try { sessionStorage.removeItem(SESSION_KEY); } catch {}
            try {
              await createKit(formData);
            } catch {
              toast.error("Failed to create kit.");
            }
          }}
        >
          <SubmitButton disabled={!kitName.trim() || cart.length === 0} className="h-10 px-6">
            Create Kit
          </SubmitButton>
        </form>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-xl z-10">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingIndex !== null ? "Edit Item" : "Add to Kit"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Product info */}
              <div className="flex gap-4">
                <div className="h-20 w-20 shrink-0 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-gray-200" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {selectedProduct.name}
                  </h4>
                  <p className="text-sm text-gray-500 mt-0.5">
                    £{Number(selectedProduct.basePrice).toFixed(2)}
                  </p>
                  {selectedProduct.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {selectedProduct.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Quantity
                </label>
                <div className="inline-flex items-center rounded-lg border border-gray-300">
                  <button
                    type="button"
                    onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                    className="inline-flex items-center justify-center h-9 w-9 text-gray-500 hover:bg-gray-50 transition-colors rounded-l-lg"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={modalQty}
                    onChange={(e) =>
                      setModalQty(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="h-9 w-14 text-center text-sm border-x border-gray-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setModalQty((q) => q + 1)}
                    className="inline-flex items-center justify-center h-9 w-9 text-gray-500 hover:bg-gray-50 transition-colors rounded-r-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Variation configs */}
              {(["color", "size"] as const).map((type) => {
                const vars =
                  variationsByProduct[selectedProduct.id]?.[type] || [];
                if (vars.length === 0) return null;

                const config = modalVariations[type];
                const mode = config?.mode || "fixed";
                const defaultId = config?.defaultVariationId || "";
                const allowedIds = config?.allowedOptionIds || [];

                return (
                  <div key={type} className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 capitalize">
                      {type === "color" ? "Color" : "Size"}
                    </label>

                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={mode === "fixed"}
                          onChange={() => setVariationMode(type, "fixed")}
                          className="h-4 w-4 text-gray-900"
                        />
                        <span className="text-sm text-gray-700">Fixed</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={mode === "editable"}
                          onChange={() => setVariationMode(type, "editable")}
                          className="h-4 w-4 text-gray-900"
                        />
                        <span className="text-sm text-gray-700">Editable</span>
                      </label>
                    </div>

                    {mode === "fixed" && (
                      <select
                        value={defaultId}
                        onChange={(e) =>
                          setDefaultVariation(type, e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      >
                        {vars.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.value}
                            {Number(v.priceAdjustment) !== 0
                              ? ` (+£${Number(v.priceAdjustment).toFixed(2)})`
                              : ""}
                          </option>
                        ))}
                      </select>
                    )}

                    {mode === "editable" && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">
                            Default value
                          </label>
                          <select
                            value={defaultId}
                            onChange={(e) =>
                              setDefaultVariation(type, e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          >
                            {vars.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.value}
                                {Number(v.priceAdjustment) !== 0
                                  ? ` (+£${Number(v.priceAdjustment).toFixed(2)})`
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-2 block">
                            Allowed options
                          </label>
                          <div className="space-y-1.5">
                            {vars.map((v) => {
                              const isDefault = v.id === defaultId;
                              const isChecked = allowedIds.includes(v.id);
                              return (
                                <label
                                  key={v.id}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked || isDefault}
                                    disabled={isDefault}
                                    onChange={() =>
                                      toggleAllowedOption(type, v.id)
                                    }
                                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                  />
                                  <span
                                    className={`text-sm ${isDefault ? "text-gray-500" : "text-gray-700"}`}
                                  >
                                    {v.value}
                                    {isDefault && " (default)"}
                                    {Number(v.priceAdjustment) !== 0
                                      ? ` (+£${Number(v.priceAdjustment).toFixed(2)})`
                                      : ""}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex justify-end gap-2 rounded-b-xl">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium h-9 px-4 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addToCart}
                className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-9 px-4 hover:bg-gray-800 transition-colors"
              >
                {editingIndex !== null ? "Update Item" : "Add to Kit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
