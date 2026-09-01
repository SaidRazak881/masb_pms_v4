import type { Metadata } from "next";

import { ProgrammesBrowser } from "@/components/programmes/programmes-browser";
import { getProgrammes } from "@/lib/actions/programme-actions";

export const metadata: Metadata = {
  title: "Program Latihan",
  description: "Senarai program latihan MIMOS Academy",
};

export default async function ProgrammesPage() {
  // Cuba muat data dari Supabase
  let programmes;
  try {
    programmes = await getProgrammes();
  } catch (error) {
    console.error("Error loading programmes from Supabase:", error);
    programmes = undefined; // Biarkan komponen gunakan mock data
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Program Latihan</h1>
        <p className="text-sm text-muted-foreground">
          Urus dan pantau semua program latihan MIMOS Academy — daripada draf
          sehingga program dikunci untuk audit.
        </p>
      </div>

      <ProgrammesBrowser programmes={programmes} />
    </div>
  );
}
