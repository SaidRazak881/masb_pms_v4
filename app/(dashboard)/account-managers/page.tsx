import type { Metadata } from "next";
import Link from "next/link";
import { ShieldX } from "lucide-react";

import { AliasConfirmation } from "@/components/account-managers/alias-confirmation";
import { Button } from "@/components/ui/button";
import { canResolveAccountManagers } from "@/lib/actions/account-manager-actions";

export const metadata: Metadata = {
  title: "Pengurus Akaun — TPMS MIMOS Academy",
};

/**
 * Pengesahan Alias Pengurus Akaun (Fasa 8A-2).
 *
 * Halaman ini ialah permukaan **manusia** bagi keseluruhan reka bentuk 8A:
 * sistem **tidak pernah** memutuskan sendiri siapa pengurus akaun bagi sesuatu
 * nilai mentah. Ia mencadangkan, dan manusia memutuskan di sini.
 *
 * Kawalan akses dilakukan di SINI (sisi pelayan) sebelum sebarang data dibaca,
 * dan sekali lagi di pangkalan data: setiap RPC `am_*` memanggil
 * `can_resolve_account_managers()` sendiri. Jadi walaupun halaman ini dipintas,
 * data tidak akan bocor — disahkan berkelakuan di live oleh probe L3-R S4/S5/S6.
 *
 * Kebenaran: Super Admin, Pentadbir, Head Governance, Kewangan.
 */
export default async function AccountManagersPage() {
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let allowed = true;
  let rpcMissing = false;

  if (hasSupabase) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data, error } = await supabase.rpc("can_resolve_account_managers");
      if (error) {
        // Fungsi belum dipasang → tunjuk panduan, bukan 403 mengelirukan.
        // Langkah 3 (account-manager-resolution.sql) ialah fail yang menciptanya.
        rpcMissing = true;
        allowed = false;
      } else {
        allowed = Boolean(data);
      }
    } catch (err) {
      console.error("AccountManagersPage: gagal menyemak kuasa:", err);
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
              ? "Fungsi pengurus akaun belum dipasang di pangkalan data. Jalankan lib/supabase/client-master.sql, external-account-managers.sql dan account-manager-resolution.sql dalam Supabase SQL Editor (Langkah 1–3), kemudian muat semula halaman ini."
              : "Halaman ini memerlukan peranan Super Admin, Pentadbir, Head Governance atau Kewangan. Hubungi pentadbir sistem jika anda memerlukan akses."}
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Kembali ke Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Semakan kedua (untuk mesej yang tepat) — keputusan kebenaran tetap di DB.
  const canResolve = await canResolveAccountManagers();

  return <AliasConfirmation isDemo={!hasSupabase} canResolve={canResolve} />;
}
