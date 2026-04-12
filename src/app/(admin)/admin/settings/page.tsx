import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";

async function updateSettings(formData: FormData) {
  "use server";

  const session = await auth();
  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  const ukShippingCost = formData.get("uk_shipping_cost") as string;

  await db
    .insert(settings)
    .values({
      key: "uk_shipping_cost",
      value: ukShippingCost,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: ukShippingCost,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/admin/settings");
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  const [ukShippingSetting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "uk_shipping_cost"));

  const ukShippingCost = ukShippingSetting?.value ?? "5.00";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Platform configuration</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6">
            <form action={updateSettings} className="space-y-4">
              <div>
                <label
                  htmlFor="uk_shipping_cost"
                  className="block text-sm font-medium text-gray-700"
                >
                  UK Shipping Cost
                </label>
                <input
                  type="number"
                  id="uk_shipping_cost"
                  name="uk_shipping_cost"
                  step="0.01"
                  defaultValue={ukShippingCost}
                  className="mt-1 block w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <SubmitButton>Save</SubmitButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
