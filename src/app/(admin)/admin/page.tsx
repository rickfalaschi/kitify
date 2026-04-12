import { db } from "@/db";
import { companies, products, orders, users } from "@/db/schema";
import { count } from "drizzle-orm";
import { Building2, Package, ShoppingCart, Users } from "lucide-react";

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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
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
