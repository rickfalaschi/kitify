import { db } from "@/db";
import { companyAddresses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireFullAccess } from "../_lib/get-company";
import { AddressesView } from "./_components/addresses-view";

export default async function AddressesPage() {
  const { company } = await requireFullAccess();

  const addresses = await db
    .select()
    .from(companyAddresses)
    .where(eq(companyAddresses.companyId, company.id))
    .orderBy(companyAddresses.label);

  async function createAddress(formData: FormData) {
    "use server";
    const { company } = await requireFullAccess();

    const label = formData.get("label") as string;
    const addressLine1 = formData.get("addressLine1") as string;
    const addressLine2 = (formData.get("addressLine2") as string) || null;
    const city = formData.get("city") as string;
    const county = (formData.get("county") as string) || null;
    const postcode = formData.get("postcode") as string;
    const country = (formData.get("country") as string) || "United Kingdom";

    if (!label || !addressLine1 || !city || !postcode) return;

    await db.insert(companyAddresses).values({
      companyId: company.id,
      label,
      addressLine1,
      addressLine2,
      city,
      county,
      postcode,
      country,
    });

    revalidatePath("/dashboard/addresses");
  }

  async function deleteAddress(formData: FormData) {
    "use server";
    const { company } = await requireFullAccess();
    const addressId = formData.get("addressId") as string;
    if (!addressId) return;

    const [addr] = await db
      .select()
      .from(companyAddresses)
      .where(eq(companyAddresses.id, addressId))
      .limit(1);

    if (!addr || addr.companyId !== company.id) return;

    await db.delete(companyAddresses).where(eq(companyAddresses.id, addressId));
    revalidatePath("/dashboard/addresses");
  }

  return (
    <AddressesView
      addresses={addresses}
      createAddress={createAddress}
      deleteAddress={deleteAddress}
    />
  );
}
