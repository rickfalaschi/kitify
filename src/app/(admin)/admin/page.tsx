import Link from "next/link";
import { db } from "@/db";
import { companies, products, orders, users } from "@/db/schema";
import { count, eq, desc } from "drizzle-orm";
import {
  AlertTriangle,
  Building2,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const [companiesCount] = await db
    .select({ count: count() })
    .from(companies);
  const [productsCount] = await db
    .select({ count: count() })
    .from(products);
  const [ordersCount] = await db
    .select({ count: count() })
    .from(orders);
  const [usersCount] = await db
    .select({ count: count() })
    .from(users);
  const [shippingQuoteCount] = await db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.status, "awaiting_shipping_quote"));

  const quoteOrders =
    shippingQuoteCount.count > 0
      ? await db
          .select({
            id: orders.id,
            createdAt: orders.createdAt,
            companyName: companies.name,
          })
          .from(orders)
          .innerJoin(companies, eq(orders.companyId, companies.id))
          .where(eq(orders.status, "awaiting_shipping_quote"))
          .orderBy(desc(orders.createdAt))
          .limit(5)
      : [];

  const stats = [
    {
      title: "Companies",
      value: companiesCount.count,
      icon: Building2,
    },
    {
      title: "Products",
      value: productsCount.count,
      icon: Package,
    },
    {
      title: "Orders",
      value: ordersCount.count,
      icon: ShoppingCart,
    },
    {
      title: "Users",
      value: usersCount.count,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {shippingQuoteCount.count > 0 && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-purple-700" />
            <h3 className="text-sm font-semibold text-purple-900">
              {shippingQuoteCount.count}{" "}
              {shippingQuoteCount.count === 1 ? "order needs" : "orders need"} a
              shipping quote
            </h3>
          </div>
          <p className="text-sm text-purple-700 mb-3">
            These international orders are waiting for you to set a shipping
            cost before the company can pay.
          </p>
          <ul className="space-y-1">
            {quoteOrders.map((o) => (
              <li key={o.id} className="text-sm">
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="text-purple-900 underline hover:text-purple-950"
                >
                  {o.companyName}
                </Link>
                <span className="ml-2 text-xs text-purple-700">
                  {o.createdAt.toLocaleDateString("en-GB")}
                </span>
              </li>
            ))}
          </ul>
          {shippingQuoteCount.count > quoteOrders.length && (
            <p className="mt-2 text-xs text-purple-700">
              <Link
                href="/admin/orders?status=awaiting_shipping_quote"
                className="underline"
              >
                View all &rarr;
              </Link>
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 pb-2 flex flex-row items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">
                {stat.title}
              </h3>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-3xl font-bold text-gray-900">
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
