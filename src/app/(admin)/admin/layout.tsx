import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";
import type { NavItem } from "@/components/app-sidebar";

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  {
    title: "Products",
    href: "/admin/products",
    icon: "Package",
    children: [{ title: "Categories", href: "/admin/categories" }],
  },
  { title: "Companies", href: "/admin/companies", icon: "Building2" },
  { title: "Kits", href: "/admin/kits", icon: "BookOpen" },
  { title: "Orders", href: "/admin/orders", icon: "ShoppingCart" },
  { title: "Users", href: "/admin/users", icon: "Users" },
  { title: "Settings", href: "/admin/settings", icon: "Settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user.isAdmin) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50/80">
      <AppSidebar
        title="Kitify Admin"
        items={navItems}
        profileHref="/admin/profile"
      />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
