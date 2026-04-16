import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, companyUsers } from "@/db/schema";
import { AppSidebar } from "@/components/app-sidebar";
import type { NavItem } from "@/components/app-sidebar";
import { CompanySwitcher } from "@/components/company-switcher";
import { switchCompanyAction } from "./_actions/switch-company";
import { createCompanyAction } from "./_actions/create-company";
import { ACTIVE_COMPANY_COOKIE } from "./_lib/active-company";

const fullNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "Logos", href: "/dashboard/logos", icon: "Image" },
  { title: "Kits", href: "/dashboard/kits", icon: "Package" },
  { title: "Orders", href: "/dashboard/orders", icon: "ShoppingCart" },
  { title: "Addresses", href: "/dashboard/addresses", icon: "MapPin" },
  { title: "Users", href: "/dashboard/users", icon: "Users" },
];

const limitedNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "Kits", href: "/dashboard/kits", icon: "Package" },
  { title: "Orders", href: "/dashboard/orders", icon: "ShoppingCart" },
];

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Query memberships inline (not via getCompany) so we can render a
  // minimal onboarding shell for authenticated-but-membership-less users
  // without getCompany redirecting them.
  const memberships = await db
    .select({
      company: companies,
      role: companyUsers.role,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companies.id, companyUsers.companyId))
    .where(eq(companyUsers.userId, session.user.id))
    .orderBy(asc(companyUsers.createdAt));

  // No memberships → render the bare onboarding shell. The /dashboard/welcome
  // page lives inside it and owns the create-company UI. Any other route
  // under /dashboard/* will trigger getCompany() and be redirected to
  // /dashboard/welcome anyway.
  if (memberships.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/80">
        <main className="mx-auto max-w-2xl px-6 py-16">{children}</main>
      </div>
    );
  }

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value;
  const active =
    (activeId && memberships.find((m) => m.company.id === activeId)) ||
    memberships[0];

  const companyList = memberships.map((m) => ({
    id: m.company.id,
    name: m.company.name,
  }));

  const navItems =
    active.role === "full" ? fullNavItems : limitedNavItems;

  return (
    <div className="flex min-h-screen bg-gray-50/80">
      <AppSidebar
        title="Kitify"
        items={navItems}
        topSlot={
          <CompanySwitcher
            companies={companyList}
            activeCompanyId={active.company.id}
            switchAction={switchCompanyAction}
            createAction={createCompanyAction}
          />
        }
      />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
