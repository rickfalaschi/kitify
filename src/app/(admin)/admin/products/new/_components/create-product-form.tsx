"use client";

import Link from "next/link";
import { useRef, useState } from "react";

interface CreateProductFormProps {
  createProductAction: (formData: FormData) => Promise<void>;
  categories: { id: string; name: string; parentId: string | null }[];
}

export function CreateProductForm({
  createProductAction,
  categories,
}: CreateProductFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;

    // Upload images via /api/upload first
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const uploadData = new FormData();
      uploadData.set("file", file);
      uploadData.set("context", "products");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      if (res.ok) {
        const { url } = await res.json();
        uploadedUrls.push(url);
      }
    }

    // Pass product data + uploaded URLs to server action
    const formData = new FormData();
    formData.set(
      "code",
      (form.elements.namedItem("code") as HTMLInputElement).value,
    );
    formData.set(
      "name",
      (form.elements.namedItem("name") as HTMLInputElement).value,
    );
    formData.set(
      "description",
      (form.elements.namedItem("description") as HTMLTextAreaElement).value,
    );
    formData.set(
      "basePrice",
      (form.elements.namedItem("basePrice") as HTMLInputElement).value,
    );
    formData.set("imageUrls", JSON.stringify(uploadedUrls));

    for (const catId of selectedCategories) {
      formData.append("categoryIds", catId);
    }

    try {
      await createProductAction(formData);
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-[1fr_140px] gap-3">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Product name"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium text-gray-700">
            Code
          </label>
          <input
            id="code"
            name="code"
            placeholder="e.g. TSH-001"
            maxLength={50}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
          placeholder="Product description"
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
          placeholder="0.00"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      {/* Categories */}
      {categories.length > 0 && (() => {
        const parents = categories.filter((c) => !c.parentId);
        const childrenMap = categories.reduce<Record<string, typeof categories>>((acc, c) => {
          if (c.parentId) {
            if (!acc[c.parentId]) acc[c.parentId] = [];
            acc[c.parentId].push(c);
          }
          return acc;
        }, {});

        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Categories
            </label>
            <div className="space-y-3">
              {parents.map((parent) => {
                const children = childrenMap[parent.id] || [];
                return (
                  <div key={parent.id}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(parent.id)}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                        selectedCategories.has(parent.id)
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {parent.name}
                    </button>
                    {children.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5 pl-3">
                        {children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => toggleCategory(child.id)}
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border transition-colors ${
                              selectedCategories.has(child.id)
                                ? "bg-gray-700 text-white border-gray-700"
                                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Images</label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium h-9 px-4 hover:bg-gray-50 transition-colors"
        >
          Add Images
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        {files.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="relative group rounded-lg border border-gray-200 overflow-hidden aspect-square"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/70 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-900"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-9 px-4 hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Product"}
        </button>
        <Link
          href="/admin/products"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium h-9 px-4 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
