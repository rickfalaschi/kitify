"use client";

import { useRef, useState, useActionState } from "react";
import { Upload, Trash2, ImageIcon, ArrowLeft, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import Link from "next/link";

type ProductData = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  basePrice: string;
  active: boolean;
};

type ProductImage = {
  id: string;
  imageUrl: string;
};

type Variation = {
  id: string;
  type: "color" | "size";
  value: string;
  priceAdjustment: string;
};

type VariationImage = {
  id: string;
  variationId: string;
  imageUrl: string;
};

type Category = { id: string; name: string; parentId: string | null };

type Props = {
  product: ProductData;
  images: ProductImage[];
  variations: Variation[];
  variationImages: VariationImage[];
  categories: Category[];
  productCategoryIds: string[];
  updateProduct: (formData: FormData) => Promise<void>;
  uploadProductImages: (formData: FormData) => Promise<void>;
  deleteProductImage: (formData: FormData) => Promise<void>;
  addVariation: (formData: FormData) => Promise<void>;
  deleteVariation: (formData: FormData) => Promise<void>;
  uploadVariationImages: (formData: FormData) => Promise<void>;
  deleteVariationImage: (formData: FormData) => Promise<void>;
  deleteProduct: (
    prevState: { error?: string } | undefined,
    formData: FormData,
  ) => Promise<{ error?: string }>;
  syncProductCategories: (formData: FormData) => Promise<void>;
};

export function EditProductForm({
  product,
  images,
  variations,
  variationImages,
  categories,
  productCategoryIds,
  updateProduct,
  uploadProductImages,
  deleteProductImage,
  addVariation,
  deleteVariation,
  uploadVariationImages,
  deleteVariationImage,
  deleteProduct,
  syncProductCategories,
}: Props) {
  const [deleteState, deleteAction, deletePending] = useActionState(deleteProduct, undefined);

  function confirmDelete(e: React.FormEvent<HTMLFormElement>) {
    if (
      !window.confirm(
        `Delete "${product.name}"? This will remove it from all kits where it is used. This cannot be undone.`,
      )
    ) {
      e.preventDefault();
    }
  }
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [uploadingVariation, setUploadingVariation] = useState<string | null>(null);
  const [expandedColors, setExpandedColors] = useState<Set<string>>(
    () => new Set(variations.filter((v) => v.type === "color").map((v) => v.id)),
  );
  const productFileRef = useRef<HTMLInputElement>(null);
  const variationFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const sizeVariations = variations.filter((v) => v.type === "size");
  const colorVariations = variations.filter((v) => v.type === "color");

  function toggleColor(id: string) {
    setExpandedColors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* ── Product Details ── */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Product Details
            </h3>
          </div>
          <div className="p-6 pt-0">
            <form action={updateProduct} className="space-y-4">
              <input type="hidden" name="id" value={product.id} />

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    defaultValue={product.name}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="code"
                    className="text-sm font-medium text-gray-700"
                  >
                    Code
                  </label>
                  <input
                    id="code"
                    name="code"
                    defaultValue={product.code ?? ""}
                    placeholder="e.g. TSH-001"
                    maxLength={50}
                    className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={product.description ?? ""}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="basePrice"
                  className="text-sm font-medium text-gray-700"
                >
                  Base Price
                </label>
                <input
                  id="basePrice"
                  name="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={product.basePrice}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="active"
                  className="text-sm font-medium text-gray-700"
                >
                  Status
                </label>
                <select
                  name="active"
                  defaultValue={String(product.active)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-9 px-4 hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Categories ── */}
        {categories.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 pb-4">
              <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
            </div>
            <div className="p-6 pt-0">
              <form action={syncProductCategories}>
                <input type="hidden" name="productId" value={product.id} />
                <div className="space-y-3 mb-4">
                  {(() => {
                    const parents = categories.filter((c) => !c.parentId);
                    const childrenMap = categories.reduce<Record<string, Category[]>>((acc, c) => {
                      if (c.parentId) {
                        if (!acc[c.parentId]) acc[c.parentId] = [];
                        acc[c.parentId].push(c);
                      }
                      return acc;
                    }, {});
                    return parents.map((parent) => {
                      const children = childrenMap[parent.id] || [];
                      return (
                        <div key={parent.id}>
                          <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              name="categoryIds"
                              value={parent.id}
                              defaultChecked={productCategoryIds.includes(parent.id)}
                              className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                            />
                            <span className="text-sm font-medium text-gray-700">{parent.name}</span>
                          </label>
                          {children.length > 0 && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1.5 pl-6">
                              {children.map((child) => (
                                <label key={child.id} className="inline-flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    name="categoryIds"
                                    value={child.id}
                                    defaultChecked={productCategoryIds.includes(child.id)}
                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                  />
                                  <span className="text-sm text-gray-600">{child.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-9 px-4 hover:bg-gray-800 transition-colors"
                >
                  Save Categories
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Product Images ── */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900 shrink-0">
              Product Images ({images.length})
            </h3>
            <button
              type="button"
              onClick={() => productFileRef.current?.click()}
              disabled={uploadingProduct}
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-xs sm:text-sm font-medium h-8 sm:h-9 px-3 sm:px-4 hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
            >
              <Upload className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              {uploadingProduct ? "Uploading..." : "Upload Images"}
            </button>
            <input
              ref={productFileRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={async (e) => {
                if (!e.target.files?.length) return;
                setUploadingProduct(true);
                const urls: string[] = [];
                for (const file of Array.from(e.target.files)) {
                  const fd = new FormData();
                  fd.set("file", file);
                  fd.set("context", `products/${product.id}`);
                  const res = await fetch("/api/upload", { method: "POST", body: fd });
                  if (res.ok) { const { url } = await res.json(); urls.push(url); }
                }
                if (urls.length > 0) {
                  const fd = new FormData();
                  fd.set("productId", product.id);
                  fd.set("imageUrls", JSON.stringify(urls));
                  await uploadProductImages(fd);
                }
                setUploadingProduct(false);
                e.target.value = "";
              }}
            />
          </div>

          <div className="p-6 pt-0">
            {images.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <ImageIcon className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  No images uploaded yet
                </p>
                <p className="text-xs text-gray-400">
                  Upload product images to display in your store
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <img
                      src={img.imageUrl}
                      alt="Product"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <form
                        action={deleteProductImage}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <input
                          type="hidden"
                          name="imageId"
                          value={img.id}
                        />
                        <input
                          type="hidden"
                          name="productId"
                          value={product.id}
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-lg bg-red-600 text-white text-xs font-medium h-8 px-3 hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Size Variations ── */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Size Variations
            </h3>
          </div>
          <div className="p-6 pt-0 space-y-4">
            {sizeVariations.length > 0 ? (
              <div className="space-y-2">
                {sizeVariations.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium text-gray-900">{v.value}</span>
                      <span className="text-sm text-gray-500">
                        £{Number(v.priceAdjustment).toFixed(2)}
                      </span>
                    </div>
                    <form action={deleteVariation}>
                      <input type="hidden" name="variationId" value={v.id} />
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        className="text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium h-8 px-3 transition-colors shrink-0"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No size variations yet.</p>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Add Size
              </h4>
              <form action={addVariation} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="type" value="size" />

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Value
                  </label>
                  <input
                    name="value"
                    required
                    placeholder="e.g. M, L, XL"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Price Adj.
                  </label>
                  <input
                    name="priceAdjustment"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium h-9 px-4 hover:bg-gray-50 transition-colors"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── Color Variations ── */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Color Variations
            </h3>
          </div>
          <div className="p-6 pt-0 space-y-4">
            {colorVariations.length === 0 && (
              <p className="text-sm text-gray-500">
                No color variations yet.
              </p>
            )}

            {colorVariations.map((color) => {
              const imgs = variationImages.filter(
                (vi) => vi.variationId === color.id,
              );
              const expanded = expandedColors.has(color.id);

              return (
                <div
                  key={color.id}
                  className="border border-gray-200 rounded-lg"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleColor(color.id)}
                      className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium text-gray-900 hover:text-gray-700 min-w-0"
                    >
                      {expanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">{color.value}</span>
                      <span className="text-gray-400 font-normal shrink-0">
                        (£{Number(color.priceAdjustment).toFixed(2)})
                      </span>
                      <span className="text-gray-400 font-normal text-xs shrink-0 hidden sm:inline">
                        {imgs.length} image{imgs.length !== 1 && "s"}
                      </span>
                    </button>

                    <form action={deleteVariation}>
                      <input type="hidden" name="variationId" value={color.id} />
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        className="text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium h-8 px-3 transition-colors shrink-0"
                      >
                        Remove
                      </button>
                    </form>
                  </div>

                  {/* Expandable body */}
                  {expanded && (
                    <div className="border-t border-gray-100 px-4 py-4 space-y-3">
                      {/* Upload button */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-500 truncate">
                          Images for {color.value}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            variationFileRefs.current[color.id]?.click()
                          }
                          disabled={uploadingVariation === color.id}
                          className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-xs font-medium h-8 px-3 hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
                        >
                          <Upload className="mr-1.5 h-3.5 w-3.5" />
                          {uploadingVariation === color.id
                            ? "Uploading..."
                            : "Upload Images"}
                        </button>
                        <input
                          ref={(el) => {
                            variationFileRefs.current[color.id] = el;
                          }}
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            if (!e.target.files?.length) return;
                            setUploadingVariation(color.id);
                            const urls: string[] = [];
                            for (const file of Array.from(e.target.files)) {
                              const fd = new FormData();
                              fd.set("file", file);
                              fd.set("context", `variations/${color.id}`);
                              const res = await fetch("/api/upload", { method: "POST", body: fd });
                              if (res.ok) { const { url } = await res.json(); urls.push(url); }
                            }
                            if (urls.length > 0) {
                              const fd = new FormData();
                              fd.set("variationId", color.id);
                              fd.set("productId", product.id);
                              fd.set("imageUrls", JSON.stringify(urls));
                              await uploadVariationImages(fd);
                            }
                            setUploadingVariation(null);
                            e.target.value = "";
                          }}
                        />
                      </div>

                      {/* Image grid */}
                      {imgs.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                          <ImageIcon className="mx-auto h-8 w-8 text-gray-300" />
                          <p className="mt-1 text-xs text-gray-500">
                            No images for this color
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                          {imgs.map((img) => (
                            <div
                              key={img.id}
                              className="relative group border border-gray-200 rounded-lg overflow-hidden"
                            >
                              <img
                                src={img.imageUrl}
                                alt={`${color.value} variation`}
                                className="w-full h-36 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <form
                                  action={deleteVariationImage}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <input
                                    type="hidden"
                                    name="imageId"
                                    value={img.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="productId"
                                    value={product.id}
                                  />
                                  <button
                                    type="submit"
                                    className="inline-flex items-center justify-center rounded-lg bg-red-600 text-white text-xs font-medium h-8 px-3 hover:bg-red-700 transition-colors"
                                  >
                                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                                    Delete
                                  </button>
                                </form>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add color form */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Add Color
              </h4>
              <form action={addVariation} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="type" value="color" />

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Value
                  </label>
                  <input
                    name="value"
                    required
                    placeholder="e.g. Blue, Red"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Price Adj.
                  </label>
                  <input
                    name="priceAdjustment"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium h-9 px-4 hover:bg-gray-50 transition-colors"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── Danger Zone ── */}
        <div className="bg-white rounded-lg border border-red-200">
          <div className="p-6 pb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-700">Danger Zone</h3>
          </div>
          <div className="p-6 pt-0 space-y-3">
            <p className="text-sm text-gray-600">
              Permanently delete this product. It will be removed from all kits
              where it is currently used. This action cannot be undone.
            </p>
            {deleteState?.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {deleteState.error}
              </p>
            )}
            <form action={deleteAction} onSubmit={confirmDelete}>
              <input type="hidden" name="productId" value={product.id} />
              <button
                type="submit"
                disabled={deletePending}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 text-white text-sm font-medium h-9 px-4 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deletePending ? "Deleting..." : "Delete Product"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
