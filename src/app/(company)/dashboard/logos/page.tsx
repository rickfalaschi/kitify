import { db } from "@/db";
import { companyLogos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uploadFile, deleteFile } from "@/lib/s3";
import { Trash2, Upload } from "lucide-react";
import { requireFullAccess } from "../_lib/get-company";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmForm } from "@/components/confirm-form";

export default async function LogosPage() {
  const { company } = await requireFullAccess();

  const logos = await db
    .select()
    .from(companyLogos)
    .where(eq(companyLogos.companyId, company.id))
    .orderBy(companyLogos.createdAt);

  async function uploadLogo(formData: FormData) {
    "use server";
    const { company } = await requireFullAccess();
    const file = formData.get("file") as File;
    if (!file || file.size === 0) return;

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "png";
    const key = `logos/${company.id}/${crypto.randomUUID()}.${ext}`;
    const fileUrl = await uploadFile(buffer, key, file.type);

    await db.insert(companyLogos).values({
      companyId: company.id,
      fileUrl,
      fileName: file.name,
    });

    revalidatePath("/dashboard/logos");
  }

  async function deleteLogo(formData: FormData) {
    "use server";
    const { company } = await requireFullAccess();
    const logoId = formData.get("logoId") as string;
    if (!logoId) return;

    const [logo] = await db
      .select()
      .from(companyLogos)
      .where(eq(companyLogos.id, logoId))
      .limit(1);

    if (!logo || logo.companyId !== company.id) return;

    const urlParts = logo.fileUrl.split("/");
    const key = urlParts.slice(urlParts.indexOf("logos")).join("/");
    await deleteFile(key);

    await db.delete(companyLogos).where(eq(companyLogos.id, logoId));
    revalidatePath("/dashboard/logos");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Logos</h1>
        <p className="text-gray-500">Manage your company logos</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <form action={uploadLogo} className="flex items-end gap-4">
            <div className="flex-1">
              <label htmlFor="file" className="text-sm font-medium text-gray-700">
                Upload new logo
              </label>
              <input
                id="file"
                name="file"
                type="file"
                accept="image/*"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <SubmitButton>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </SubmitButton>
          </form>
        </div>
      </div>

      {logos.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          No logos uploaded yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {logos.map((logo) => (
            <div key={logo.id} className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 space-y-3">
                <div className="aspect-square bg-gray-50 rounded-md flex items-center justify-center overflow-hidden border border-gray-200">
                  <img
                    src={logo.fileUrl}
                    alt={logo.fileName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <p className="text-sm text-gray-700 truncate">{logo.fileName}</p>
                <ConfirmForm action={deleteLogo} message="Are you sure you want to delete this logo?">
                  <input type="hidden" name="logoId" value={logo.id} />
                  <SubmitButton variant="secondary" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 text-xs h-8">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </SubmitButton>
                </ConfirmForm>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
