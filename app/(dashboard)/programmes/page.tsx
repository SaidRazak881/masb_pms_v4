import type { Metadata } from "next";

import { ProgrammesBrowser } from "@/components/programmes/programmes-browser";
import { PROGRAMMES } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Program Latihan",
  description: "Senarai program latihan MIMOS Academy",
};

export default function ProgrammesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Program Latihan</h1>
        <p className="text-sm text-muted-foreground">
          Urus dan pantau semua program latihan MIMOS Academy — daripada draf
          sehingga program dikunci untuk audit.
        </p>
      </div>

      <ProgrammesBrowser programmes={PROGRAMMES} />
    </div>
  );
}
