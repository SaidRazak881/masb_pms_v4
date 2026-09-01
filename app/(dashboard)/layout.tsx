import { Bell, GraduationCap, Search } from "lucide-react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROLE_LABEL: Record<string, string> = {
  admin: "Pentadbir Sistem",
  head_governance: "Head Governance",
  executive: "Eksekutif",
  manager: "Pengurus",
  staff: "Staf",
  finance: "Kewangan",
  viewer: "Pemerhati",
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Baca pengguna semasa daripada sesi Supabase (jika env diisi).
  // Mod demo: gunakan identiti contoh.
  let displayName = "Zarina Abu Bakar";
  let displayRole = "Programme Manager";
  let initials = "ZA";

  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (hasSupabase) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .maybeSingle();

        const fullName =
          (profile as { full_name?: string } | null)?.full_name ||
          user.user_metadata?.full_name ||
          user.email;
        const role = (profile as { role?: string } | null)?.role;

        displayName = fullName;
        displayRole = role ? (ROLE_LABEL[role] ?? role) : "Pengguna";
        initials = initialsOf(fullName);
      }
    } catch (error) {
      console.error("Layout: gagal membaca sesi pengguna:", error);
    }
  }

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
              {initials}
            </div>
            <div className="hidden leading-tight md:block">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{displayRole}</p>
            </div>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}
