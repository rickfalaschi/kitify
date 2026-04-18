"use server";

import { db } from "@/db";
import {
  users,
  companyUsers,
  companies,
  orders,
  orderItems,
  orderItemSelections,
  companyAddresses,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { hash, compare } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function updateProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!name || !email) return;

  // Check if email is taken by another user
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing && existing.id !== userId) {
    return;
  }

  await db
    .update(users)
    .set({ name, email, updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/dashboard/profile");
  revalidatePath("/admin/profile");
}

export async function changePasswordAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || newPassword.length < 6) return;
  if (newPassword !== confirmPassword) return;

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.passwordHash) return;

  const isValid = await compare(currentPassword, user.passwordHash);
  if (!isValid) return;

  const newHash = await hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/dashboard/profile");
  revalidatePath("/admin/profile");
}

// ---------------------------------------------------------------------------
// Account deletion (GDPR Art. 17 — Right to Erasure)
// ---------------------------------------------------------------------------
// Orders reference users.id with ON DELETE RESTRICT (for accounting/tax
// retention). Instead of hard-deleting, we anonymize the user record and
// remove all memberships so the account can no longer be used.
// ---------------------------------------------------------------------------
export async function deleteAccountAction(): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  // Admin accounts can't self-delete — they must be removed by another admin
  if (session.user.isAdmin) {
    return { error: "Admin accounts cannot be deleted through self-service. Please contact another administrator." };
  }

  // Remove all company memberships
  await db.delete(companyUsers).where(eq(companyUsers.userId, userId));

  // Anonymize user record
  const anonEmail = `deleted-${userId}@deleted.kitify.local`;
  await db
    .update(users)
    .set({
      name: "Deleted User",
      email: anonEmail,
      passwordHash: null,
      inviteToken: null,
      resetToken: null,
      resetTokenExpiry: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Anonymize any employee delivery data on orders placed by this user
  await db
    .update(orders)
    .set({
      employeeName: null,
      employeeEmail: null,
      employeeAddressLine1: null,
      employeeAddressLine2: null,
      employeeCity: null,
      employeeCounty: null,
      employeePostcode: null,
      employeeCountry: null,
    })
    .where(eq(orders.userId, userId));

  redirect("/login");
}

// ---------------------------------------------------------------------------
// Data export (GDPR Art. 20 — Right to Data Portability)
// ---------------------------------------------------------------------------
export async function exportDataAction(): Promise<string> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  // 1. User profile
  const [user] = await db
    .select({
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // 2. Company memberships
  const memberships = await db
    .select({
      companyName: companies.name,
      role: companyUsers.role,
      joinedAt: companyUsers.createdAt,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companies.id, companyUsers.companyId))
    .where(eq(companyUsers.userId, userId));

  // 3. Orders placed by this user (no internal IDs)
  const userOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      deliveryType: orders.deliveryType,
      totalAmount: orders.totalAmount,
      shippingCost: orders.shippingCost,
      employeeName: orders.employeeName,
      employeeAddressLine1: orders.employeeAddressLine1,
      employeeAddressLine2: orders.employeeAddressLine2,
      employeeCity: orders.employeeCity,
      employeeCounty: orders.employeeCounty,
      employeePostcode: orders.employeePostcode,
      employeeCountry: orders.employeeCountry,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, userId));

  // 4. Order items
  const orderIds = userOrders.map((o) => o.id);
  const allOrderItemsRaw =
    orderIds.length > 0
      ? await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productName: orderItems.productName,
            basePrice: orderItems.basePrice,
            quantity: orderItems.quantity,
          })
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds))
      : [];

  // 5. Selections
  const allOrderItemIds = allOrderItemsRaw.map((oi) => oi.id);
  const selections =
    allOrderItemIds.length > 0
      ? await db
          .select({
            orderItemId: orderItemSelections.orderItemId,
            variationType: orderItemSelections.variationType,
            variationValue: orderItemSelections.variationValue,
          })
          .from(orderItemSelections)
          .where(inArray(orderItemSelections.orderItemId, allOrderItemIds))
      : [];

  // Build export with only personal/human-readable data — no internal IDs
  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      name: user.name,
      email: user.email,
      accountCreated: user.createdAt,
    },
    companies: memberships.map((m) => ({
      company: m.companyName,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    orders: userOrders.map((o) => ({
      status: o.status,
      deliveryType: o.deliveryType,
      total: o.totalAmount ? `£${o.totalAmount}` : null,
      shipping: o.shippingCost ? `£${o.shippingCost}` : null,
      deliveryAddress:
        o.deliveryType === "employee_address"
          ? {
              name: o.employeeName,
              addressLine1: o.employeeAddressLine1,
              addressLine2: o.employeeAddressLine2,
              city: o.employeeCity,
              county: o.employeeCounty,
              postcode: o.employeePostcode,
              country: o.employeeCountry,
            }
          : "Company address",
      date: o.createdAt,
      items: allOrderItemsRaw
        .filter((i) => i.orderId === o.id)
        .map((item) => ({
          product: item.productName,
          unitPrice: `£${item.basePrice}`,
          quantity: item.quantity,
          selections: selections
            .filter((s) => s.orderItemId === item.id)
            .map((s) => ({
              type: s.variationType,
              value: s.variationValue,
            })),
        })),
    })),
  };

  return JSON.stringify(exportData, null, 2);
}
