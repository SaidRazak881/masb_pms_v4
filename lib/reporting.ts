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
  | "costs"
  | "monthly_summary"
  | "governance_locked"
  | "certificate_eligibility"
  | "demographic";

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
  monthly_summary: {
    label: "Ringkasan Bulanan",
    description: "Bilangan program, peserta, kategori dan completion mengikut bulan.",
  },
  governance_locked: {
    label: "Program Terkunci (Governance)",
    description: "Program yang dikunci, status, pemilik dan tempoh — untuk semakan tadbir urus.",
  },
  certificate_eligibility: {
    label: "Kelayakan Sijil",
    description: "Peserta layak sijil berdasarkan kehadiran (≥80%) dan completion.",
  },
  demographic: {
    label: "Demografi Peserta",
    description: "Peserta mengikut organisasi, jawatan dan status Bumiputera. Akses dikawal — hanya bagi tujuan dibenarkan polisi organisasi.",
  },
};

export const REPORT_TYPE_ORDER: ReportType[] = [
  "programme_summary",
  "financial",
  "participants",
  "costs",
  "monthly_summary",
  "governance_locked",
  "certificate_eligibility",
  "demographic",
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

/** Bulan dalam BM, cth. "2026-01" → "Januari 2026". */
function monthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const names = [
    "Januari", "Februari", "Mac", "April", "Mei", "Jun",
    "Julai", "Ogos", "September", "Oktober", "November", "Disember",
  ];
  return `${names[(m ?? 1) - 1]} ${y}`;
}

/** Ringkasan bulanan: kumpul program mengikut bulan tarikh mula. */
function buildMonthlySummaryRows(programmes: Programme[]): ReportRow[] {
  const groups = new Map<string, {
    count: number;
    participants: number;
    contracted: number;
    completed: number;
    margin: number;
  }>();

  for (const p of programmes) {
    const start = p.startDate ? p.startDate.slice(0, 7) : null;
    const key = start ?? `${p.year}-00`;
    const g = groups.get(key) ?? {
      count: 0,
      participants: 0,
      contracted: 0,
      completed: 0,
      margin: 0,
    };
    g.count += 1;
    g.participants += p.participants.length;
    g.contracted += p.contractedAmount;
    g.margin += p.contractedAmount - p.actualCost;
    if (p.status === "completed") g.completed += 1;
    groups.set(key, g);
  }

  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, g]) => ({
      month: key === `${new Date().getFullYear()}-00` ? "Tiada tarikh" : monthLabel(key),
      count: g.count,
      participants: g.participants,
      contracted: g.contracted,
      completed: g.completed,
      completionRate: g.count > 0 ? Math.round((g.completed / g.count) * 1000) / 10 : 0,
      margin: g.margin,
    }));
}

/** Laporan program terkunci untuk semakan tadbir urus. */
function buildGovernanceLockedRows(programmes: Programme[]): ReportRow[] {
  return programmes
    .filter((p) => p.locked)
    .map((p) => ({
      code: p.code,
      title: p.title,
      client: p.client,
      category: p.category,
      status: STATUS_LABEL[p.status],
      manager: p.programmeManager,
      trainer: p.trainer,
      contracted: p.contractedAmount,
      startDate: p.startDate,
      endDate: p.endDate,
      locked: booleanLabel(p.locked),
    }));
}

/** Kelayakan sijil: hadir ≥80% DAN status completed. */
function buildCertificateEligibilityRows(programmes: Programme[]): ReportRow[] {
  const rows: ReportRow[] = [];
  for (const p of programmes) {
    for (const part of p.participants) {
      const eligible = part.attendance >= 80 && part.status === "completed";
      const issued = part.certificateIssued;
      rows.push({
        code: p.code,
        title: p.title,
        name: part.name,
        email: part.email,
        organisation: part.organisation,
        attendance: part.attendance,
        status: PARTICIPANT_STATUS_LABEL[part.status],
        eligible: eligible && !issued ? "Layak" : eligible ? "Sijil dikeluarkan" : "Tidak layak",
        certificate: booleanLabel(issued),
      });
    }
  }
  return rows;
}

/**
 * Demografi peserta — data sensitif, guna ONLY bagi tujuan dibenarkan.
 * Kawalan akses dikuatkuasakan oleh RLS / role (lihat skema master).
 */
function buildDemographicRows(programmes: Programme[]): ReportRow[] {
  const rows: ReportRow[] = [];
  for (const p of programmes) {
    for (const part of p.participants) {
      rows.push({
        code: p.code,
        title: p.title,
        name: part.name,
        organisation: part.organisation,
        designation: part.designation,
        bumi: BUMI_LABEL[part.bumiStatus],
        status: PARTICIPANT_STATUS_LABEL[part.status],
        attendance: part.attendance,
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
  monthly_summary: [
    { key: "month", label: "Bulan" },
    { key: "count", label: "Bilangan Program", align: "right" },
    { key: "participants", label: "Peserta", align: "right" },
    { key: "contracted", label: "Nilai Kontrak (RM)", align: "right" },
    { key: "completed", label: "Selesai", align: "right" },
    { key: "completionRate", label: "Kadar Siap (%)", align: "right" },
    { key: "margin", label: "Margin (RM)", align: "right" },
  ],
  governance_locked: [
    { key: "code", label: "Kod" },
    { key: "title", label: "Tajuk Program" },
    { key: "client", label: "Pelanggan" },
    { key: "category", label: "Kategori" },
    { key: "status", label: "Status" },
    { key: "manager", label: "Pengurus Program" },
    { key: "trainer", label: "Jurulatih" },
    { key: "contracted", label: "Nilai Kontrak (RM)", align: "right" },
    { key: "startDate", label: "Tarikh Mula" },
    { key: "endDate", label: "Tarikh Tamat" },
    { key: "locked", label: "Berkunci", align: "center" },
  ],
  certificate_eligibility: [
    { key: "code", label: "Kod" },
    { key: "title", label: "Tajuk Program" },
    { key: "name", label: "Nama" },
    { key: "email", label: "E-mel" },
    { key: "organisation", label: "Organisasi" },
    { key: "attendance", label: "Kehadiran (%)", align: "right" },
    { key: "status", label: "Status" },
    { key: "eligible", label: "Kelayakan Sijil" },
    { key: "certificate", label: "Sijil Dikeluarkan", align: "center" },
  ],
  demographic: [
    { key: "code", label: "Kod" },
    { key: "title", label: "Tajuk Program" },
    { key: "name", label: "Nama" },
    { key: "organisation", label: "Organisasi" },
    { key: "designation", label: "Jawatan" },
    { key: "bumi", label: "Status Bumiputera" },
    { key: "status", label: "Status" },
    { key: "attendance", label: "Kehadiran (%)", align: "right" },
  ],
};

const ROW_BUILDERS: Record<ReportType, (programmes: Programme[]) => ReportRow[]> = {
  programme_summary: buildProgrammeSummaryRows,
  financial: buildFinancialRows,
  participants: buildParticipantsRows,
  costs: buildCostRows,
  monthly_summary: buildMonthlySummaryRows,
  governance_locked: buildGovernanceLockedRows,
  certificate_eligibility: buildCertificateEligibilityRows,
  demographic: buildDemographicRows,
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
