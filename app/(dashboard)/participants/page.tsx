import type { Metadata } from "next";

import { ParticipantsBrowser } from "@/components/participants/participants-browser";
import { loadParticipantsData } from "@/lib/participants-data";

export const metadata: Metadata = {
  title: "Peserta",
  description: "Senarai peserta program latihan MIMOS Academy",
};

export default async function ParticipantsPage() {
  const { participants, summary, isDemo } = await loadParticipantsData();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Peserta</h1>
        <p className="text-sm text-muted-foreground">
          Senarai peserta merentas semua program latihan — termasuk status
          Bumiputera (deklarasi), kehadiran dan pengeluaran sijil.
        </p>
      </div>

      <ParticipantsBrowser
        participants={participants}
        summary={summary}
        isDemo={isDemo}
      />
    </div>
  );
}
