/**
 * participants-data.ts — Agregasi peserta untuk halaman /participants.
 *
 * Senarai peserta dibina dengan meratakan `programme.participants` daripada
 * semua program (Supabase jika dikonfigurasikan, mock jika tidak). Setiap
 * peserta menyimpan senarai program yang dihadiri supaya boleh dipaparkan
 * sebagai "hubungan program" (seorang peserta boleh hadir lebih daripada
 * satu program).
 */

import type { BumiStatus, Participant, Programme } from "@/lib/types";

/* ============================ Jenis ============================ */

export interface ParticipantAggregate {
  /** ID unik agregat (peserta + program pertama). */
  id: string;
  name: string;
  email: string;
  organisation: string;
  designation: string;
  bumiStatus: BumiStatus;
  /** Bilangan program yang dihadiri. */
  programmeCount: number;
  /** Kod program yang dihadiri (untuk paparan). */
  programmeCodes: string[];
  /** Status kehadiran terkini (dari program pertama). */
  status: Participant["status"];
  /** Peratus kehadiran terkini. */
  attendance: number;
  certificateIssued: boolean;
}

export interface ParticipantsSummary {
  total: number;
  bumiputera: number;
  nonBumiputera: number;
  pendingBumi: number;
  completed: number;
  attended: number;
  certificateIssued: number;
  uniqueProgrammes: number;
}

/* ============================ Logik tulen ============================ */

export function aggregateParticipants(programmes: Programme[]): {
  participants: ParticipantAggregate[];
  summary: ParticipantsSummary;
} {
  // Kekunci unik: nama + e-mel (e-mel mungkin kosong).
  const map = new Map<string, ParticipantAggregate & { _statuses: Participant["status"][] }>();

  for (const p of programmes) {
    for (const part of p.participants) {
      const key = `${part.name.toLowerCase().trim()}|${(part.email || "").toLowerCase().trim()}`;
      const existing = map.get(key);
      if (existing) {
        existing.programmeCount += 1;
        if (!existing.programmeCodes.includes(p.code)) existing.programmeCodes.push(p.code);
        existing._statuses.push(part.status);
        // Kekalkan rekod yang paling lengkap
        if (!existing.email && part.email) existing.email = part.email;
        if (existing.bumiStatus === "pending" && part.bumiStatus !== "pending") {
          existing.bumiStatus = part.bumiStatus;
        }
        continue;
      }
      map.set(key, {
        id: `${p.id}-${part.id}`,
        name: part.name,
        email: part.email,
        organisation: part.organisation,
        designation: part.designation,
        bumiStatus: part.bumiStatus,
        programmeCount: 1,
        programmeCodes: [p.code],
        status: part.status,
        attendance: part.attendance,
        certificateIssued: part.certificateIssued,
        _statuses: [part.status],
      });
    }
  }

  const participants: ParticipantAggregate[] = [...map.values()].map(
    ({ _statuses, ...rest }) => ({
      ...rest,
      // Status terkini = status paling "maju" dalam hierarki.
      status: (
        _statuses.includes("completed")
          ? "completed"
          : _statuses.includes("attended")
            ? "attended"
            : _statuses.includes("confirmed")
              ? "confirmed"
              : _statuses.includes("registered")
                ? "registered"
                : "cancelled"
      ) as Participant["status"],
    }),
  );

  const summary: ParticipantsSummary = {
    total: participants.length,
    bumiputera: participants.filter((p) => p.bumiStatus === "bumiputera").length,
    nonBumiputera: participants.filter((p) => p.bumiStatus === "non_bumiputera").length,
    pendingBumi: participants.filter((p) => p.bumiStatus === "pending").length,
    completed: participants.filter((p) => p.status === "completed").length,
    attended: participants.filter((p) => p.status === "attended" || p.status === "confirmed").length,
    certificateIssued: participants.filter((p) => p.certificateIssued).length,
    uniqueProgrammes: new Set(programmes.map((p) => p.id)).size,
  };

  return { participants, summary };
}

/* ============================ Muat data (hibrid) ============================ */

export async function loadParticipantsData(): Promise<{
  participants: ParticipantAggregate[];
  summary: ParticipantsSummary;
  isDemo: boolean;
}> {
  let programmes: Programme[] = [];
  let isDemo = false;

  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (hasSupabase) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data, error } = await supabase.from("programmes").select("*");
      if (error) throw error;
      if (data && data.length > 0) {
        const { mapProgrammeRow } = await import("@/lib/programme-mapper");
        programmes = (data as never[]).map((row) => mapProgrammeRow(row));
      }
    } catch (error) {
      console.error("Peserta: gagal membaca Supabase, jatuh balik ke mock:", error);
      isDemo = true;
    }
  } else {
    isDemo = true;
  }

  if (programmes.length === 0) {
    const { PROGRAMMES } = await import("@/lib/mock-data");
    programmes = PROGRAMMES;
  }

  return { ...aggregateParticipants(programmes), isDemo };
}
