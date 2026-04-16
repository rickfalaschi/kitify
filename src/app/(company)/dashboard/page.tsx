import Link from "next/link";
import { db } from "@/db";
import { kits, orders, companyLogos } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { getCompany } from "./_lib/get-company";
import {
  Package,
  ShoppingCart,
  Image,
  ArrowRight,
  Plus,
} from "lucide-react";

export default async function CompanyDashboard() {
  const { company } = await getCompany();

  const [[activeKits], [totalOrders], [totalLogos]] = await Promise.all([
    db
      .select({ count: count() })
      .from(kits)
      .where(eq(kits.companyId, company.id)),
    db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.companyId, company.id)),
    db
      .select({ count: count() })
      .from(companyLogos)
      .where(eq(companyLogos.companyId, company.id)),
  ]);

  const stats = [
    {
      label: "Kits",
      value: activeKits.count,
      icon: Package,
      href: "/dashboard/kits",
      color: "text-red-600 bg-red-50",
    },
    {
      label: "Orders",
      value: totalOrders.count,
      icon: ShoppingCart,
      href: "/dashboard/orders",
      color: "text-red-600 bg-red-50",
    },
    {
      label: "Logos",
      value: totalLogos.count,
      icon: Image,
      href: "/dashboard/logos",
      color: "text-red-600 bg-red-50",
    },
  ];

  const quickActions = [
    {
      title: "Create a kit",
      description: "Build a new branded product kit",
      icon: Plus,
      href: "/dashboard/kits/new",
      accent: "group-hover:bg-red-600 group-hover:text-white bg-red-50 text-red-600",
    },
    {
      title: "Manage logos",
      description: "Upload and manage your brand logos",
      icon: Image,
      href: "/dashboard/logos",
      accent: "group-hover:bg-red-600 group-hover:text-white bg-red-50 text-red-600",
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
        <p className="text-gray-500 mt-0.5">
          Welcome back. Here&apos;s an overview of your account.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group relative bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color} transition-colors`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${action.accent}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {action.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
