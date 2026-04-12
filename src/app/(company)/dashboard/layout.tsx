import { AppSidebar } from "@/components/app-sidebar";
import type { NavItem } from "@/components/app-sidebar";
import { getCompany } from "./_lib/get-company";

const fullNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "Logos", href: "/dashboard/logos", icon: "Image" },
  { title: "Catalog", href: "/dashboard/catalog", icon: "BookOpen" },
  { title: "Kits", href: "/dashboard/kits", icon: "Package" },
  { title: "Orders", href: "/dashboard/orders", icon: "ShoppingCart" },
  { title: "Addresses", href: "/dashboard/addresses", icon: "MapPin" },
  { title: "Users", href: "/dashboard/users", icon: "Users" },
];

const limitedNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "Catalog", href: "/dashboard/catalog", icon: "BookOpen" },
  { title: "Kits", href: "/dashboard/kits", icon: "Package" },
  { title: "Orders", href: "/dashboard/orders", icon: "ShoppingCart" },
];

export default async function EmpresaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await getCompany();
  const navItems = role === "full" ? fullNavItems : limitedNavItems;

  return (
    <div className="flex min-h-screen bg-gray-50/80">
      <AppSidebar title="Kitify" items={navItems} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
