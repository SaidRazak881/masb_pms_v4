"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  GraduationCap,
  LayoutDashboard,
  Shield,
  Upload,
  UserCog,
  UserRoundCheck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth";

type NavItem = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  /** Jika ditetapkan, item hanya dipaparkan untuk role ini. */
  roles?: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Program Latihan",
    href: "/programmes",
    icon: GraduationCap,
  },
  {
    title: "Import Data",
    href: "/import",
    icon: Upload,
  },
  {
    title: "Peserta",
    href: "/participants",
    icon: Users,
  },
  {
    title: "Laporan",
    href: "/reports",
    icon: BarChart3,
  },
  {
    title: "Keselamatan",
    href: "/security",
    icon: Shield,
  },
  {
    // Fasa 8A-2: permukaan manusia bagi pengesahan pengurus akaun.
    // Peranan ini MESTI sepadan dengan `can_resolve_account_managers()` dalam
    // `account-manager-resolution.sql` — super_admin lulus kerana `has_role()`
    // mengembalikan true untuk super_admin tanpa mengira peranan yang diminta.
    // Jika senarai ini dan fungsi SQL itu berbeza, pengguna akan melihat pautan
    // yang kemudian menolak mereka — jadi keduanya mesti diubah bersama.
    title: "Pengurus Akaun",
    href: "/account-managers",
    icon: UserRoundCheck,
    roles: ["super_admin", "admin", "head_governance", "finance"],
  },
  {
    title: "Admin Pengguna",
    href: "/admin/users",
    icon: UserCog,
    roles: ["super_admin"],
  },
];

export { NAV_ITEMS };

/** Item navigasi yang dibenarkan untuk role semasa. */
export function visibleNavItems(role: UserRole | null | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));
}

export function SidebarNav({ role }: { role?: UserRole | null }) {
  const pathname = usePathname();
  const items = visibleNavItems(role);

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
            {item.roles?.includes("super_admin") && (
              <span className="ml-auto rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                Super
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
