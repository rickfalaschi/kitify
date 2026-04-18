import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companyUsers } from "@/db/schema";
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

  // Check if admin has any company memberships
  const [membership] = await db
    .select({ userId: companyUsers.userId })
    .from(companyUsers)
    .where(eq(companyUsers.userId, session.user.id))
    .limit(1);

  const hasMemberships = !!membership;

  const contextLink = hasMemberships
    ? { href: "/dashboard", label: "My companies", icon: "companies" as const }
    : { href: "/dashboard/welcome?from=admin", label: "Create company", icon: "create" as const };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/80">
      <AppSidebar
        title="Kitify Admin"
        items={navItems}
        profileHref="/admin/profile"
        contextLink={contextLink}
        user={{ name: session.user.name ?? "", email: session.user.email ?? "" }}
      />
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
