"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  GraduationCap,
  LayoutDashboard,
  Upload,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    disabled: true,
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
    disabled: true,
  },
  {
    title: "Laporan",
    href: "/reports",
    icon: BarChart3,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const active =
          !item.disabled &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;

        if (item.disabled) {
          return (
            <span
              key={item.href}
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/50"
              title="Modul ini akan dibangunkan pada fasa seterusnya"
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </span>
          );
        }

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
          </Link>
        );
      })}
    </nav>
  );
}
