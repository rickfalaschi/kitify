"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Building2,
  ShoppingCart,
  Users,
  Image,
  BookOpen,
  MapPin,
  Settings,
} from "lucide-react";
import { UserButton } from "./user-button";

const iconMap = {
  LayoutDashboard,
  Package,
  Building2,
  ShoppingCart,
  Users,
  Image,
  BookOpen,
  MapPin,
  Settings,
} as const;

export type IconName = keyof typeof iconMap;

export interface SubNavItem {
  title: string;
  href: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon: IconName;
  children?: SubNavItem[];
}

interface AppSidebarProps {
  title: string;
  items: NavItem[];
  topSlot?: React.ReactNode;
  profileHref?: string;
}

export function AppSidebar({ title, items, topSlot, profileHref }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0 bg-[#0a0a23] relative overflow-hidden">
      {/* Subtle red glow at bottom */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 110%, rgba(200,30,44,0.08) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 flex flex-col h-full">
        <div className="border-b border-white/10 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kitify-logo.svg"
              alt="Kitify"
              className="h-8 w-auto"
            />
            {title !== "Kitify" && (
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                {title.replace(/^Kitify\s*/, "")}
              </span>
            )}
          </Link>
        </div>
        {topSlot}
        <nav className="flex-1 overflow-y-auto py-5">
          <p className="px-6 pb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Menu
          </p>
          <ul className="space-y-0.5 px-3">
            {items.map((item) => {
              const Icon = iconMap[item.icon];
              // Count path segments to avoid "/admin" matching "/admin/products"
              const hrefSegments = item.href.split("/").filter(Boolean).length;
              const isExactMatch = pathname === item.href;
              const isSubRoute = hrefSegments >= 2 && pathname.startsWith(item.href + "/") && !item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
              const isActive = isExactMatch || isSubRoute;
              const isParentActive =
                isActive ||
                (item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href + "/")) ??
                  false);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                      isParentActive
                        ? "bg-white/10 font-medium text-white shadow-sm"
                        : "text-gray-400 hover:bg-white/[0.06] hover:text-gray-200"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${isParentActive ? "text-red-400" : ""}`}
                    />
                    <span>{item.title}</span>
                  </Link>
                  {isParentActive && item.children && (
                    <ul className="mt-0.5 space-y-0.5 pl-7">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`block rounded-lg px-3 py-1.5 text-sm transition-all ${
                                isChildActive
                                  ? "text-white font-medium"
                                  : "text-gray-500 hover:text-gray-300"
                              }`}
                            >
                              {child.title}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="relative border-t border-white/10 p-3 overflow-visible">
          <UserButton profileHref={profileHref} />
        </div>
      </div>
    </aside>
  );
}
