import type { Metadata } from "next";
import Link from "next/link";
import { Upload } from "lucide-react";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { DataAttentionPanel } from "@/components/dashboard/data-attention-panel";
import { Button } from "@/components/ui/button";
import { listUnresolvedValues } from "@/lib/actions/account-manager-actions";
import { loadDashboardData } from "@/lib/dashboard-data";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Ringkasan keseluruhan program latihan MIMOS Academy",
};

export default async function DashboardPage() {
  // DP-22: data bermasalah ditonjolkan di PAPARAN UTAMA supaya pengguna tidak
  // perlu tahu bahawa /account-managers wujud. Kedua-dua panggilan dibuat
  // serentak kerana ia tidak bersandaran antara satu sama lain.
  //
  // `listUnresolvedValues()` TIDAK melontar ralat: ia memulangkan
  // `{ rows: [], error }` apabila pengguna tiada kuasa (42501) atau RPC belum
  // dipasang, dan panel menyembunyikan dirinya dalam kes itu. Kuasa tetap
  // dikuatkuasakan oleh pangkalan data, bukan oleh halaman ini.
  const [data, am] = await Promise.all([
    loadDashboardData(),
    listUnresolvedValues(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan program latihan, kewangan, import dan tadbir urus MIMOS
            Academy. Dikemas kini pada{" "}
            {new Date(data.generatedAt).toLocaleString("ms-MY")}.
          </p>
        </div>
        <Link href="/import">
          <Button>
            <Upload className="h-4 w-4" />
            Import Data (Excel)
          </Button>
        </Link>
      </div>

      <DataAttentionPanel rows={am.rows} isDemo={am.isDemo} error={am.error} />

      <DashboardOverview data={data} />
    </div>
  );
}
