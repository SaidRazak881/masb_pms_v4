import type { Metadata } from "next";

import { ReportBuilder } from "@/components/reports/report-builder";
import { PROGRAMMES } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Laporan",
  description: "Report Builder & Export Excel — MIMOS Academy TPMS",
};

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
        <p className="text-sm text-muted-foreground">
          Bina laporan program latihan mengikut jenis &amp; penapis, pratonton
          hasilnya, kemudian eksport terus ke fail Excel (.xlsx).
        </p>
      </div>

      <ReportBuilder programmes={PROGRAMMES} />
    </div>
  );
}
