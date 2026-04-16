"use client";

import { useState, useRef } from "react";
import { Upload, Trash2, Check } from "lucide-react";

type MockupData = { id: string; imageUrl: string } | null;

export function ProductMockupManager({
  kitId,
  companyId,
  productId,
  productName,
  colorVariations,
  mockupsByKey,
  uploadMockup,
  deleteMockup,
}: {
  kitId: string;
  companyId: string;
  productId: string;
  productName: string;
  colorVariations: { id: string; value: string }[];
  mockupsByKey: Record<string, MockupData>;
  uploadMockup: (formData: FormData) => Promise<void>;
  deleteMockup: (formData: FormData) => Promise<void>;
}) {
  const hasColors = colorVariations.length > 0;

  if (hasColors) {
    // One mockup slot per color variation
    return (
      <div className="space-y-3">
        {colorVariations.map((color) => {
          const key = `${productId}:${color.id}`;
          const mockup = mockupsByKey[key] || null;
          return (
            <MockupSlot
              key={color.id}
              label={color.value}
              kitId={kitId}
              companyId={companyId}
              productId={productId}
              variationId={color.id}
              mockup={mockup}
              uploadMockup={uploadMockup}
              deleteMockup={deleteMockup}
            />
          );
        })}
      </div>
    );
  }

  // Single mockup slot for the product
  const mockup = mockupsByKey[productId] || null;
  return (
    <MockupSlot
      label={productName}
      kitId={kitId}
      companyId={companyId}
      productId={productId}
      variationId={null}
      mockup={mockup}
      uploadMockup={uploadMockup}
      deleteMockup={deleteMockup}
    />
  );
}

function MockupSlot({
  label,
  kitId,
  companyId,
  productId,
  variationId,
  mockup,
  uploadMockup,
  deleteMockup,
}: {
  label: string;
  kitId: string;
  companyId: string;
  productId: string;
  variationId: string | null;
  mockup: { id: string; imageUrl: string } | null;
  uploadMockup: (formData: FormData) => Promise<void>;
  deleteMockup: (formData: FormData) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    // Upload to B2
    const uploadData = new FormData();
    uploadData.set("file", file);
    uploadData.set("context", `mockups/${companyId}/${productId}`);
    const res = await fetch("/api/upload", { method: "POST", body: uploadData });
    if (!res.ok) { setUploading(false); return; }
    const { url } = await res.json();

    // Save mockup
    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("companyId", companyId);
    fd.set("kitId", kitId);
    fd.set("imageUrl", url);
    if (variationId) fd.set("variationId", variationId);
    await uploadMockup(fd);
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-4 border border-gray-100 rounded-lg p-3">
      {/* Thumbnail / upload area */}
      {mockup ? (
        <div className="relative group h-20 w-20 shrink-0 rounded-md overflow-hidden border border-gray-200">
          <img src={mockup.imageUrl} alt={`${label} mockup`} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs bg-gray-700/80 rounded px-2 py-1 hover:bg-gray-600"
            >
              Replace
            </button>
            <form action={async (fd) => { fd.set("kitId", kitId); await deleteMockup(fd); }}>
              <input type="hidden" name="mockupId" value={mockup.id} />
              <button type="submit" className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs bg-red-600/80 rounded px-2 py-1 hover:bg-red-500">
                <Trash2 className="h-3 w-3" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="h-20 w-20 shrink-0 rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <span className="text-xs">...</span>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">Upload</span>
            </>
          )}
        </button>
      )}

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {mockup ? (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" /> Mockup uploaded
          </p>
        ) : (
          <p className="text-xs text-gray-400">No mockup yet</p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
