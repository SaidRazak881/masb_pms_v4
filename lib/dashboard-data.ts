/**
 * dashboard-data.ts — Agregasi data untuk Dashboard TPMS MIMOS Academy.
 *
 * Logik TULEN (tiada I/O): semua pengiraan KPI, pecahan kategori, senarai
 * aktiviti dan senarai kelulusan yang belum diputuskan beroperasi ke atas
 * senarai `Programme` + data import (mock/Supabase) dan mengembalikan
 * struktur sedia-papar.
 *
 * Halaman `/dashboard` (Server Component) memuatkan data melalui
 * `loadDashboardData()` yang menggunakan Supabase jika dikonfigurasikan,
 * dan jatuh balik kepada data mock jika tidak.
 */

import type { Programme, ProgrammeStatus } from "@/lib/types";

/* ============================ Jenis ============================ */

export interface DashboardKpi {
  /** Jumlah program mengikut status. */
  totalProgrammes: number;
  byStatus: Record<ProgrammeStatus, number>;
  /** Program aktif bulan ini (tarikh mula ≤ bulan semasa ≤ tarikh tamat). */
  activeThisMonth: number;
  /** Program yang dikunci tadbir urus (locked). */
  lockedProgrammes: number;
  /** Import yang masih dalam status staged/review. */
  pendingImports: number;
  /** Bilangan invois belum dibayar (status selain paid). */
  unpaidInvoices: number;
  /** Bilangan peserta dengan data tidak lengkap / Bumiputera belum disahkan. */
  incompleteParticipants: number;
  /** Nilai agregat kewangan. */
  totalContracted: number;
  totalBudget: number;
  totalActualCost: number;
  estimatedMargin: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  /** Pecahan peratus (0–100). */
  percent: number;
}

export interface OrganizerBreakdown {
  organizer: string;
  count: number;
  /** Jumlah nilai kontrak bagi organisasi (RM). */
  contracted: number;
}

export interface RecentActivityItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  programmeId?: string;
  programmeCode?: string;
}

export interface PendingApprovalItem {
  id: string;
  type: "unlock" | "change_request" | "import";
  programmeId?: string;
  programmeCode?: string;
  programmeTitle?: string;
  requestedBy: string;
  requestedAt: string;
  summary: string;
}

export interface DashboardData {
  kpi: DashboardKpi;
  categories: CategoryBreakdown[];
  organizers: OrganizerBreakdown[];
  recentActivity: RecentActivityItem[];
  pendingApprovals: PendingApprovalItem[];
  /** Tarikh penjanaan data (untuk paparan). */
  generatedAt: string;
  /** `true` jika data datang daripada mock (bukan Supabase). */
  isDemo: boolean;
}

/* ============================ KPI ============================ */

const EMPTY_STATUS_COUNT: Record<ProgrammeStatus, number> = {
  draft: 0,
  active: 0,
  completed: 0,
  cancelled: 0,
  on_hold: 0,
};

export function computeKpis(programmes: Programme[]): DashboardKpi {
  const byStatus = { ...EMPTY_STATUS_COUNT };
  let activeThisMonth = 0;
  let locked = 0;
  let unpaidInvoices = 0;
  let incompleteParticipants = 0;
  let totalContracted = 0;
  let totalBudget = 0;
  let totalActualCost = 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  for (const p of programmes) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    if (p.locked) locked += 1;

    const start = p.startDate ? new Date(p.startDate) : null;
    const end = p.endDate ? new Date(p.endDate) : null;
    if (
      p.status === "active" &&
      start &&
      start <= monthEnd &&
      (!end || end >= monthStart)
    ) {
      activeThisMonth += 1;
    }

    totalContracted += p.contractedAmount;
    totalBudget += p.budget;
    totalActualCost += p.actualCost;

    for (const doc of p.financials) {
      if (doc.type === "invoice" && doc.status !== "paid") {
        unpaidInvoices += 1;
      }
    }

    for (const part of p.participants) {
      if (!part.email || part.bumiStatus === "pending") {
        incompleteParticipants += 1;
      }
    }
  }

  return {
    totalProgrammes: programmes.length,
    byStatus,
    activeThisMonth,
    lockedProgrammes: locked,
    pendingImports: 0, // diisi oleh loadDashboardData (import_batches)
    unpaidInvoices,
    incompleteParticipants,
    totalContracted,
    totalBudget,
    totalActualCost,
    estimatedMargin: totalContracted - totalActualCost,
  };
}

/* ============================ Pecahan ============================ */

export function computeCategoryBreakdown(
  programmes: Programme[],
): CategoryBreakdown[] {
  const counts = new Map<string, number>();
  for (const p of programmes) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  const total = programmes.length || 1;
  return [...counts.entries()]
    .map(([category, count]) => ({
      category,
      count,
      percent: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

export function computeOrganizerBreakdown(
  programmes: Programme[],
): OrganizerBreakdown[] {
  const map = new Map<string, { count: number; contracted: number }>();
  for (const p of programmes) {
    const key = p.client || "Tiada Penganjur";
    const entry = map.get(key) ?? { count: 0, contracted: 0 };
    entry.count += 1;
    entry.contracted += p.contractedAmount;
    map.set(key, entry);
  }
  return [...map.entries()]
    .map(([organizer, v]) => ({ organizer, count: v.count, contracted: v.contracted }))
    .sort((a, b) => b.count - a.count);
}

/* ============================ Aktiviti & Kelulusan ============================ */

/** Bina senarai aktiviti terkini daripada audit trail program. */
export function buildRecentActivity(
  programmes: Programme[],
  limit = 12,
): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];
  for (const p of programmes) {
    for (const ev of p.auditTrail) {
      items.push({
        id: `${p.id}-${ev.id}`,
        timestamp: ev.timestamp,
        actor: ev.user,
        action: ev.action,
        detail: ev.detail,
        programmeId: p.id,
        programmeCode: p.code,
      });
    }
  }
  return items
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, limit);
}

/** Bina senarai kelulusan yang belum diputuskan daripada permohonan unlock. */
export function buildPendingApprovals(
  programmes: Programme[],
  unlockRequests: { programmeId: string; requestedBy: string; requestedAt: string; summary: string }[],
  limit = 10,
): PendingApprovalItem[] {
  const byId = new Map(programmes.map((p) => [p.id, p]));
  const items: PendingApprovalItem[] = unlockRequests.map((r) => {
    const p = byId.get(r.programmeId);
    return {
      id: `${r.programmeId}-${r.requestedAt}`,
      type: "unlock" as const,
      programmeId: r.programmeId,
      programmeCode: p?.code,
      programmeTitle: p?.title,
      requestedBy: r.requestedBy,
      requestedAt: r.requestedAt,
      summary: r.summary,
    };
  });
  return items.sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1)).slice(0, limit);
}

/* ============================ Pengagregat hibrid ============================ */

/**
 * Muatkan data dashboard — dipanggil daripada Server Component.
 *
 * 1. Cuba baca daripada Supabase (programmes, import_batches,
 *    programme_unlock_requests).
 * 2. Jika gagal / mod demo, gunakan mock-data + nilai demo.
 */
export async function loadDashboardData(): Promise<DashboardData> {
  let programmes: Programme[] = [];
  let pendingImports = 0;
  let unlockPending: { programmeId: string; requestedBy: string; requestedAt: string; summary: string }[] = [];
  let isDemo = false;

  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (hasSupabase) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();

      const [progRes, batchRes, unlockRes] = await Promise.all([
        supabase.from("programmes").select("*"),
        supabase.from("import_batches").select("id,status").in("status", ["staged", "reviewed"]),
        supabase
          .from("programme_unlock_requests")
          .select("programme_id,requested_by_name,requested_at,reason")
          .eq("status", "pending"),
      ]);

      if (progRes.error) throw progRes.error;

      const { mapProgrammeRow } = await import("@/lib/programme-mapper");
      programmes = (progRes.data ?? []).map((row) => mapProgrammeRow(row as never));
      pendingImports = batchRes.data?.length ?? 0;
      unlockPending = (unlockRes.data ?? []).map((r: { programme_id: string; requested_by_name: string | null; requested_at: string; reason: string }) => ({
        programmeId: r.programme_id,
        requestedBy: r.requested_by_name ?? "Pengguna",
        requestedAt: r.requested_at,
        summary: r.reason,
      }));
    } catch (error) {
      console.error("Dashboard: gagal membaca Supabase, jatuh balik ke mock:", error);
      isDemo = true;
    }
  } else {
    isDemo = true;
  }

  // Jatuh balik ke mock
  if (programmes.length === 0) {
    const { PROGRAMMES } = await import("@/lib/mock-data");
    programmes = PROGRAMMES;
    // Simulasikan beberapa permohonan unlock yang belum diputuskan.
    unlockPending = [
      {
        programmeId: PROGRAMMES[0]?.id ?? "",
        requestedBy: "Nur Izzati Zailani",
        requestedAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
        summary: "Kemas kini nilai invois selepas semakan akhir pasukan kewangan.",
      },
    ];
  }

  const kpi = computeKpis(programmes);
  kpi.pendingImports = pendingImports;

  return {
    kpi,
    categories: computeCategoryBreakdown(programmes),
    organizers: computeOrganizerBreakdown(programmes).slice(0, 8),
    recentActivity: buildRecentActivity(programmes),
    pendingApprovals: buildPendingApprovals(programmes, unlockPending),
    generatedAt: new Date().toISOString(),
    isDemo,
  };
}
