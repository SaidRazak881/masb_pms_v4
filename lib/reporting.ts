/**
 * reporting.ts — Domain Report Builder & Export Excel
 * (Langkah 6, TPMS MIMOS Academy).
 *
 * Modul ini mengandungi LOGIK TULEN sahaja (tiada I/O, tiada React) supaya
 * boleh digunakan bersama oleh Server Component, Client Component dan
 * pengeksport Excel (`lib/report-excel.ts`).
 *
 * Ia membina "laporan" sebagai set data baris-kolom yang agnostik terhadap
 * medium paparan — jadual HTML, CSV atau Excel semuanya membaca struktur
 * `ReportResult` yang sama.
 */

import type {
  FinancialDocStatus,
  FinancialDocType,
  ParticipantStatus,
  Programme,
  ProgrammeCategory,
  ProgrammeStatus,
  TrainingMode,
  BumiStatus,
} from "@/lib/types";

/* ====================== Jenis laporan ====================== */

export type ReportType =
  | "programme_summary"
  | "financial"
  | "participants"
  | "costs";

export interface ReportFilter {
  /** Tahun program; `null` bermaksud semua tahun. */
  year: number | null;
  /** Kategori program; `"all"` bermaksud semua kategori. */
  category: ProgrammeCategory | "all";
  /** Status program; `"all"` bermaksud semua status. */
  status: ProgrammeStatus | "all";
}

export const DEFAULT_FILTER: ReportFilter = {
  year: null,
  category: "all",
  status: "all",
};

/* ====================== Label paparan (BM) ====================== */

export const MODE_LABEL: Record<TrainingMode, string> = {
  in_person: "Bersemuka",
  online: "Dalam Talian",
  hybrid: "Hibrid",
};

export const STATUS_LABEL: Record<ProgrammeStatus, string> = {
  draft: "Draf",
  active: "Aktif",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  on_hold: "Ditangguh",
};

export const FINANCIAL_TYPE_LABEL: Record<FinancialDocType, string> = {
  quotation: "Sebutharga (Quotation)",
  po: "Pesanan Belian (PO)",
  invoice: "Invois",
};

export const FINANCIAL_STATUS_LABEL: Record<FinancialDocStatus, string> = {
  draft: "Draf",
  sent: "Dihantar",
  accepted: "Diterima",
  invoiced: "Telah Diinvois",
  paid: "Dibayar",
  overdue: "Tertunggak",
};

export const PARTICIPANT_STATUS_LABEL: Record<ParticipantStatus, string> = {
  registered: "Berdaftar",
  confirmed: "Disahkan",
  attended: "Hadir",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const BUMI_LABEL: Record<BumiStatus, string> = {
  bumiputera: "Bumiputera",
  non_bumiputera: "Bukan Bumiputera",
  pending: "Belum Disahkan",
};

/** Label "Ya"/"Tidak" untuk nilai boolean dalam laporan. */
export function booleanLabel(value: boolean): string {
  return value ? "Ya" : "Tidak";
}

/* ====================== Struktur hasil laporan ====================== */

export interface ReportColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
}

export type ReportCell = string | number | boolean | null;

export type ReportRow = Record<string, ReportCell>;

export interface ReportResult {
  type: ReportType;
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
}

/** Metrik ringkasan untuk kad statistik di atas preview laporan. */
export interface ReportMetrics {
  programmes: number;
  participants: number;
  contracted: number;
  budget: number;
  actual: number;
  bumiputera: number;
  nonBumiputera: number;
  pendingBumi: number;
  locked: number;
}

/* ====================== Metadata jenis laporan ====================== */

export interface ReportTypeMeta {
  label: string;
  description: string;
}

export const REPORT_TYPES: Record<ReportType, ReportTypeMeta> = {
  programme_summary: {
    label: "Ringkasan Program",
    description: "Senarai program berserta nilai kontrak, bajet, kos & peserta.",
  },
  financial: {
    label: "Laporan Kewangan",
    description: "Sebutharga, pesanan belian & invois bagi setiap program.",
  },
  participants: {
    label: "Laporan Peserta",
    description: "Senarai peserta, organisasi, status Bumiputera & kehadiran.",
  },
  costs: {
    label: "Laporan Kos",
    description: "Pecahan kos mengikut kategori: bajet vs sebenar & varians.",
  },
};

export const REPORT_TYPE_ORDER: ReportType[] = [
  "programme_summary",
  "financial",
  "participants",
  "costs",
];

/* ====================== Penapisan program ====================== */

export function applyProgrammeFilter(
  programmes: Programme[],
  filter: ReportFilter,
): Programme[] {
  return programmes.filter((p) => {
    if (filter.year !== null && p.year !== filter.year) return false;
    if (filter.category !== "all" && p.category !== filter.category) return false;
    if (filter.status !== "all" && p.status !== filter.status) return false;
    return true;
  });
}

export function listYears(programmes: Programme[]): number[] {
  return Array.from(new Set(programmes.map((p) => p.year))).sort((a, b) => b - a);
}

/* ====================== Pembinaan baris laporan ====================== */

function buildProgrammeSummaryRows(programmes: Programme[]): ReportRow[] {
  return programmes.map((p) => ({
    code: p.code,
    title: p.title,
    client: p.client,
    category: p.category,
    mode: MODE_LABEL[p.mode],
    status: STATUS_LABEL[p.status],
    startDate: p.startDate,
    endDate: p.endDate,
    trainer: p.trainer,
    manager: p.programmeManager,
    contracted: p.contractedAmount,
    budget: p.budget,
    actual: p.actualCost,
    variance: p.actualCost - p.budget,
    participants: p.participants.length,
    locked: booleanLabel(p.locked),
  }));
}

function buildFinancialRows(programmes: Programme[]): ReportRow[] {
  const rows: ReportRow[] = [];
  for (const p of programmes) {
    for (const doc of p.financials) {
      rows.push({
        code: p.code,
        title: p.title,
        client: p.client,
        type: FINANCIAL_TYPE_LABEL[doc.type],
        reference: doc.reference,
        issuedDate: doc.issuedDate,
        amount: doc.amount,
        status: FINANCIAL_STATUS_LABEL[doc.status],
      });
    }
  }
  return rows;
}

function buildParticipantsRows(programmes: Programme[]): ReportRow[] {
  const rows: ReportRow[] = [];
  for (const p of programmes) {
    for (const part of p.participants) {
      rows.push({
        code: p.code,
        title: p.title,
        name: part.name,
        email: part.email,
        organisation: part.organisation,
        designation: part.designation,
        bumi: BUMI_LABEL[part.bumiStatus],
        attendance: part.attendance,
        status: PARTICIPANT_STATUS_LABEL[part.status],
        certificate: booleanLabel(part.certificateIssued),
      });
    }
  }
  return rows;
}

function buildCostRows(programmes: Programme[]): ReportRow[] {
  const rows: ReportRow[] = [];
  for (const p of programmes) {
    for (const c of p.costs) {
      rows.push({
        code: p.code,
        title: p.title,
        category: c.category,
        description: c.description,
        budgeted: c.budgeted,
        actual: c.actual,
        variance: c.actual - c.budgeted,
      });
    }
  }
  return rows;
}

/* ====================== Definisi kolom mengikut jenis ====================== */

const COLUMNS: Record<ReportType, ReportColumn[]> = {
  programme_summary: [
    { key: "code", label: "Kod" },
    { key: "title", label: "Tajuk Program" },
    { key: "client", label: "Pelanggan" },
    { key: "category", label: "Kategori" },
    { key: "mode", label: "Mod" },
    { key: "status", label: "Status" },
    { key: "startDate", label: "Tarikh Mula" },
    { key: "endDate", label: "Tarikh Tamat" },
    { key: "trainer", label: "Jurulatih" },
    { key: "manager", label: "Pengurus Program" },
    { key: "contracted", label: "Nilai Kontrak (RM)", align: "right" },
    { key: "budget", label: "Bajet (RM)", align: "right" },
    { key: "actual", label: "Kos Sebenar (RM)", align: "right" },
    { key: "variance", label: "Varians (RM)", align: "right" },
    { key: "participants", label: "Peserta", align: "right" },
    { key: "locked", label: "Berkunci", align: "center" },
  ],
  financial: [
    { key: "code", label: "Kod" },
    { key: "title", label: "Tajuk Program" },
    { key: "client", label: "Pelanggan" },
    { key: "type", label: "Jenis Dokumen" },
    { key: "reference", label: "Rujukan" },
    { key: "issuedDate", label: "Tarikh" },
    { key: "amount", label: "Amaun (RM)", align: "right" },
    { key: "status", label: "Status" },
  ],
  participants: [
    { key: "code", label: "Kod" },
    { key: "title", label: "Tajuk Program" },
    { key: "name", label: "Nama" },
    { key: "email", label: "E-mel" },
    { key: "organisation", label: "Organisasi" },
    { key: "designation", label: "Jawatan" },
    { key: "bumi", label: "Status Bumiputera" },
    { key: "attendance", label: "Kehadiran (%)", align: "right" },
    { key: "status", label: "Status" },
    { key: "certificate", label: "Sijil Dikeluarkan", align: "center" },
  ],
  costs: [
    { key: "code", label: "Kod" },
    { key: "title", label: "Tajuk Program" },
    { key: "category", label: "Kategori Kos" },
    { key: "description", label: "Keterangan" },
    { key: "budgeted", label: "Bajet (RM)", align: "right" },
    { key: "actual", label: "Sebenar (RM)", align: "right" },
    { key: "variance", label: "Varians (RM)", align: "right" },
  ],
};

const ROW_BUILDERS: Record<ReportType, (programmes: Programme[]) => ReportRow[]> = {
  programme_summary: buildProgrammeSummaryRows,
  financial: buildFinancialRows,
  participants: buildParticipantsRows,
  costs: buildCostRows,
};

/* ====================== API utama ====================== */

export function buildReport(
  programmes: Programme[],
  type: ReportType,
  filter: ReportFilter,
): ReportResult {
  const filtered = applyProgrammeFilter(programmes, filter);
  return {
    type,
    title: REPORT_TYPES[type].label,
    columns: COLUMNS[type],
    rows: ROW_BUILDERS[type](filtered),
  };
}

export function computeMetrics(
  programmes: Programme[],
  filter: ReportFilter,
): ReportMetrics {
  const filtered = applyProgrammeFilter(programmes, filter);

  let participants = 0;
  let contracted = 0;
  let budget = 0;
  let actual = 0;
  let bumiputera = 0;
  let nonBumiputera = 0;
  let pendingBumi = 0;
  let locked = 0;

  for (const p of filtered) {
    participants += p.participants.length;
    contracted += p.contractedAmount;
    budget += p.budget;
    actual += p.actualCost;
    if (p.locked) locked += 1;
    for (const part of p.participants) {
      if (part.bumiStatus === "bumiputera") bumiputera += 1;
      else if (part.bumiStatus === "non_bumiputera") nonBumiputera += 1;
      else pendingBumi += 1;
    }
  }

  return {
    programmes: filtered.length,
    participants,
    contracted,
    budget,
    actual,
    bumiputera,
    nonBumiputera,
    pendingBumi,
    locked,
  };
}

/** Nama fail Excel yang deskriptif mengikut jenis & penapis laporan. */
export function buildReportFilename(
  type: ReportType,
  filter: ReportFilter,
): string {
  const slug = REPORT_TYPES[type].label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const scope = filter.year ? `-tahun-${filter.year}` : "";
  return `laporan-${slug}${scope}.xlsx`;
}
