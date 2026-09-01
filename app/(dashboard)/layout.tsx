import { Bell, GraduationCap, Search } from "lucide-react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-800 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">MIMOS Academy</p>
            <p className="text-xs text-slate-400">TPMS v4</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="border-t border-slate-800 p-4">
          <p className="text-xs text-slate-500">
            © 2026 MIMOS Berhad
            <br />
            Training Programme Management
          </p>
        </div>
      </aside>

      {/* Kawasan utama */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">MIMOS Academy</span>
          </div>

          <div className="relative ml-auto w-full max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari program, peserta, dokumen..."
              className="pl-9"
            />
          </div>

          <Button variant="ghost" size="icon" aria-label="Notifikasi">
            <Bell className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2.5 border-l pl-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              ZA
            </div>
            <div className="hidden leading-tight md:block">
              <p className="text-sm font-medium">Zarina Abu Bakar</p>
              <p className="text-xs text-muted-foreground">
                Programme Manager
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}
