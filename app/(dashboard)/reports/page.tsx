import type { Metadata } from "next";
import type { Programme } from "@/lib/types";

import { ReportBuilder } from "@/components/reports/report-builder";
import { getProgrammes } from "@/lib/actions/programme-actions";

export const metadata: Metadata = {
  title: "Laporan",
  description: "Report Builder & Export Excel — MIMOS Academy TPMS",
};

export default async function ReportsPage() {
  // Cuba muat data dari Supabase
  let programmes: Programme[] = [];
  try {
    programmes = await getProgrammes();
  } catch (error) {
    console.error("Error loading programmes from Supabase:", error);
    // Kosongkan, komponen ReportBuilder akan handle
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
        <p className="text-sm text-muted-foreground">
          Bina laporan program latihan mengikut jenis &amp; penapis, pratonton
          hasilnya, kemudian eksport terus ke fail Excel (.xlsx).
        </p>
      </div>

      <ReportBuilder programmes={programmes} />
    </div>
  );
}
