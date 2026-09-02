"use client";

/**
 * MobileNav — navigasi mudah alih (skrin < lg).
 *
 * Sidebar penuh disembunyikan pada skrin kecil; tanpa komponen ini pengguna
 * langsung tiada cara untuk menavigasi (contohnya ke halaman Import).
 * Hamburger butang membuka panel senarai item navigasi yang sama dengan
 * SidebarNav.
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { visibleNavItems } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth";

export function MobileNav({ role }: { role?: UserRole | null }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const items = visibleNavItems(role);

  // Tutup panel apabila laluan berubah.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        aria-label={open ? "Tutup menu" : "Buka menu navigasi"}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-slate-100 hover:text-foreground"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-64 rounded-lg border bg-white p-2 shadow-xl">
          <nav className="flex flex-col gap-1">
            {items.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
