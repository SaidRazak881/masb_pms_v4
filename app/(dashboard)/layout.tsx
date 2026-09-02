import Link from "next/link";
import { redirect } from "next/navigation";
import { Ban, Clock3, GraduationCap, Search, ShieldAlert } from "lucide-react";

import { AccountGuard } from "@/components/security/account-guard";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  resolveAccountAccess,
  roleLabel,
  type AccountSnapshot,
} from "@/lib/auth";

const DEMO_SNAPSHOT: AccountSnapshot = {
  id: "demo-user",
  email: "demo@mimos.my",
  fullName: "Zarina Abu Bakar",
  role: "admin",
  accountStatus: "active",
  mustChangePassword: false,
  isDemo: true,
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
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let snapshot: AccountSnapshot = DEMO_SNAPSHOT;

  // Pathname semasa — dihantar oleh middleware sebagai header `x-pathname`
  // (Next.js 14 tidak membekalkannya melalui headers() secara automatik).
  const { headers } = await import("next/headers");
  const pathname = headers().get("x-pathname") ?? "";

  // Halaman yang dikecualikan daripada pengalihan wajib-tukar-kata-laluan:
  //   /security — tempat pengguna menukar kata laluan
  //   /admin    — Super Admin mesti boleh meluluskan pengguna walaupun
  //               beliau sendiri masih guna kata laluan lalai
  const isExemptPage =
    pathname.startsWith("/security") || pathname.startsWith("/admin");

  if (hasSupabase) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        // Baca profil + bendera wajib-tukar. Status akaun dibaca melalui RPC
        // SECURITY DEFINER supaya tetap boleh dibaca walaupun RLS menghadkan
        // baris profil (cth. akaun blocked/pending).
        const [{ data: profile }, { data: statusData }, { data: pwData }] =
          await Promise.all([
            supabase
              .from("user_profiles")
              .select("full_name, role, must_change_password")
              .eq("id", user.id)
              .maybeSingle(),
            supabase.rpc("my_account_status"),
            supabase.rpc("my_password_change_required"),
          ]);

        const row = profile as {
          full_name?: string | null;
          role?: string | null;
          must_change_password?: boolean | null;
        } | null;

        snapshot = {
          id: user.id,
          email: user.email,
          fullName:
            row?.full_name ||
            (user.user_metadata?.full_name as string) ||
            user.email,
          role: (row?.role as AccountSnapshot["role"]) ?? null,
          accountStatus:
            (statusData as AccountSnapshot["accountStatus"] | null) ??
            "active",
          mustChangePassword:
            Boolean(pwData) || Boolean(row?.must_change_password),
          isDemo: false,
        };
      }

    } catch (error) {
      console.error("Layout: gagal membaca sesi pengguna:", error);
    }
  }

  // -------------------------------------------------------------------
  // Penguatkuasaan status akaun (sisi pelayan — tidak boleh dipintas klien)
  // -------------------------------------------------------------------
  const access = resolveAccountAccess(snapshot);

  // Akaun pending/blocked: tiada modul dipaparkan sama sekali, termasuk
  // /security — pengguna mesti berurusan dengan Super Admin dahulu.
  if (access.redirect) {
    return (
      <BlockedScreen
        snapshot={snapshot}
        reason={access.reason}
        detailHref={access.redirect}
      />
    );
  }

  // Kata laluan lalai masih dipakai → wajib tukar dahulu.
  // `next=` dibawa bersama supaya selepas menukar kata laluan pengguna
  // dikembalikan ke halaman yang beliau tuju, bukan sentiasa /dashboard.
  if (snapshot.mustChangePassword && !isExemptPage) {
    const next =
      pathname && pathname.startsWith("/") && !pathname.startsWith("//")
        ? pathname
        : "/dashboard";
    redirect(`/security?required=1&next=${encodeURIComponent(next)}`);
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
          <SidebarNav role={snapshot.role} />
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
            <MobileNav role={snapshot.role} />
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

          <div className="flex items-center gap-2.5 border-l pl-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initialsOf(snapshot.fullName)}
            </div>
            <div className="hidden leading-tight md:block">
              <p className="text-sm font-medium">{snapshot.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {roleLabel(snapshot.role)}
              </p>
            </div>
            <LogoutButton />
          </div>
        </header>

        {/* Semakan semula sisi klien (pertahanan kedua) */}
        <AccountGuard />

        <main className="flex-1 bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}

/** Paparan penuh apabila akaun pending/blocked — tiada akses ke modul. */
function BlockedScreen({
  snapshot,
  reason,
  detailHref,
}: {
  snapshot: AccountSnapshot;
  reason: string | null;
  detailHref: string;
}) {
  const blocked = snapshot.accountStatus === "blocked";
  const Icon = blocked ? Ban : Clock3;
  const tone = blocked
    ? "bg-rose-100 text-rose-700"
    : "bg-amber-100 text-amber-700";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg space-y-4 rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone}`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">
              {blocked ? "Akaun Disekat" : "Menunggu Kelulusan"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {reason ??
                (blocked
                  ? "Akaun anda tidak dibenarkan mengakses sistem."
                  : "Akaun anda belum diluluskan oleh Super Admin.")}
            </p>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <p className="flex items-start gap-1.5">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Hubungi <strong>Super Admin</strong> untuk semakan. Semua tindakan
            pengurusan akaun direkodkan dalam audit log.
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <Link href={detailHref} className="flex-1">
            <Button variant="outline" className="w-full">
              Lihat Butiran
            </Button>
          </Link>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
