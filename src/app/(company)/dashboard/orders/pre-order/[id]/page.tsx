import { db } from "@/db";
import { orders, kits, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCompany } from "../../../_lib/get-company";
import { sendPreOrderEmail } from "@/lib/email";
import { PreOrderInfo } from "./_components/pre-order-info";

export default async function PreOrderPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = await props.params;
  const { company } = await getCompany();

  const [result] = await db
    .select({
      order: orders,
      kit: kits,
    })
    .from(orders)
    .innerJoin(kits, eq(kits.id, orders.kitId))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!result) notFound();
  if (result.order.companyId !== company.id) notFound();
  // Pre-order landing is only useful while the employee hasn't submitted yet.
  if (result.order.status !== "pending") notFound();

  const publicUrl = `${process.env.AUTH_URL || "http://localhost:3000"}/p/${result.order.publicToken}`;

  async function sendLinkAction(formData: FormData) {
    "use server";
    const id = formData.get("orderId") as string;
    const employeeName = formData.get("employeeName") as string;
    const employeeEmail = formData.get("employeeEmail") as string;

    if (!employeeEmail) return;

    await db
      .update(orders)
      .set({ employeeName: employeeName || null, employeeEmail })
      .where(eq(orders.id, id));

    const [orderData] = await db
      .select({
        order: orders,
        kit: kits,
        company: companies,
      })
      .from(orders)
      .innerJoin(kits, eq(kits.id, orders.kitId))
      .innerJoin(companies, eq(companies.id, orders.companyId))
      .where(eq(orders.id, id))
      .limit(1);

    if (!orderData) return;

    const url = `${process.env.AUTH_URL || "http://localhost:3000"}/p/${orderData.order.publicToken}`;

    await sendPreOrderEmail({
      to: employeeEmail,
      employeeName: employeeName || undefined,
      companyName: orderData.company.name,
      kitName: orderData.kit.name,
      publicUrl: url,
    });

    revalidatePath(`/dashboard/orders/pre-order/${id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-medium h-8 px-3 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pre-Order Created</h1>
        <p className="text-gray-500 mt-1">
          Kit: {result.kit.name} &middot; Delivery:{" "}
          {result.order.deliveryType === "company_address"
            ? "Company address"
            : "Employee address"}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <PreOrderInfo
          publicUrl={publicUrl}
          orderId={orderId}
          existingName={result.order.employeeName}
          existingEmail={result.order.employeeEmail}
          sendLinkAction={sendLinkAction}
        />
      </div>

      <div>
        <Link
          href="/dashboard/orders"
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Back to Orders
        </Link>
      </div>
    </div>
  );
}
