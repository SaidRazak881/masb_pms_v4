import type { Metadata } from "next";
import Link from "next/link";
import { ShieldX } from "lucide-react";

import { UserManagement } from "@/components/admin/user-management";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Admin Pengguna — TPMS MIMOS Academy",
};

/**
 * Dashboard Pengurusan Pengguna — khas untuk SUPER ADMIN.
 *
 * Kawalan akses dilakukan di SINI (sisi pelayan) sebelum sebarang data
 * dibaca, dan sekali lagi di pangkalan data: setiap RPC `admin_*` memanggil
 * `can_manage_users()` sendiri. Jadi walaupun halaman ini dipintas, data
 * pengguna tidak akan bocor.
 */
export default async function AdminUsersPage() {
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let allowed = true;
  let rpcMissing = false;

  if (hasSupabase) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data, error } = await supabase.rpc("can_manage_users");
      if (error) {
        // Fungsi belum dipasang → tunjuk panduan, bukan 403 mengelirukan.
        rpcMissing = true;
        allowed = false;
      } else {
        allowed = Boolean(data);
      }
    } catch (err) {
      console.error("AdminUsersPage: gagal menyemak kuasa:", err);
      allowed = false;
      rpcMissing = true;
    }
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
          <ShieldX className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Akses Ditolak</h1>
          <p className="text-sm text-muted-foreground">
            {rpcMissing
              ? "Fungsi pengurusan pengguna belum dipasang di pangkalan data. Jalankan lib/supabase/user-management.sql dalam Supabase SQL Editor, kemudian muat semula halaman ini."
              : "Halaman ini hanya untuk Super Admin (saidrazak881@gmail.com). Hubungi pentadbir sistem jika anda memerlukan akses."}
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Kembali ke Dashboard</Button>
        </Link>
      </div>
    );
  }

  return <UserManagement isDemo={!hasSupabase} />;
}
