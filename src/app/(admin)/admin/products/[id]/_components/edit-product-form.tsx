"use client";

import { useRef, useState, useActionState } from "react";
import { Upload, Trash2, ImageIcon, ArrowLeft, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import Link from "next/link";

type ProductData = {
  id: string;
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

type Category = { id: string; name: string };

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
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className="inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        name="categoryIds"
                        value={cat.id}
                        defaultChecked={productCategoryIds.includes(cat.id)}
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                    </label>
                  ))}
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
          <div className="p-6 pb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Product Images ({images.length})
            </h3>
            <button
              type="button"
              onClick={() => productFileRef.current?.click()}
              disabled={uploadingProduct}
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-9 px-4 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Upload className="mr-2 h-4 w-4" />
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
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
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
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">
                      Value
                    </th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">
                      Price Adjustment
                    </th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium w-24" />
                  </tr>
                </thead>
                <tbody>
                  {sizeVariations.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="py-3 px-4 text-gray-900">{v.value}</td>
                      <td className="py-3 px-4 text-gray-600">
                        £{Number(v.priceAdjustment).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <form action={deleteVariation}>
                          <input
                            type="hidden"
                            name="variationId"
                            value={v.id}
                          />
                          <input
                            type="hidden"
                            name="productId"
                            value={product.id}
                          />
                          <button
                            type="submit"
                            className="text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium h-8 px-3 transition-colors"
                          >
                            Remove
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">No size variations yet.</p>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Add Size
              </h4>
              <form action={addVariation} className="flex items-end gap-3">
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
                    className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Price Adjustment
                  </label>
                  <input
                    name="priceAdjustment"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="w-36 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
                  <div className="flex items-center justify-between px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleColor(color.id)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-700"
                    >
                      {expanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {color.value}
                      <span className="text-gray-400 font-normal">
                        (£{Number(color.priceAdjustment).toFixed(2)})
                      </span>
                      <span className="text-gray-400 font-normal text-xs">
                        {imgs.length} image{imgs.length !== 1 && "s"}
                      </span>
                    </button>

                    <form action={deleteVariation}>
                      <input
                        type="hidden"
                        name="variationId"
                        value={color.id}
                      />
                      <input
                        type="hidden"
                        name="productId"
                        value={product.id}
                      />
                      <button
                        type="submit"
                        className="text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium h-8 px-3 transition-colors"
                      >
                        Remove
                      </button>
                    </form>
                  </div>

                  {/* Expandable body */}
                  {expanded && (
                    <div className="border-t border-gray-100 px-4 py-4 space-y-3">
                      {/* Upload button */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Images for {color.value}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            variationFileRefs.current[color.id]?.click()
                          }
                          disabled={uploadingVariation === color.id}
                          className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-xs font-medium h-8 px-3 hover:bg-gray-800 transition-colors disabled:opacity-50"
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
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
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
              <form action={addVariation} className="flex items-end gap-3">
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
                    className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Price Adjustment
                  </label>
                  <input
                    name="priceAdjustment"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="w-36 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
