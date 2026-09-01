"use client";

/**
 * DashboardOverview — paparan utama Dashboard TPMS MIMOS Academy.
 *
 * Menerima `DashboardData` yang telah diagregat oleh Server Component
 * (`/dashboard`) dan memaparkan:
 *   • Kad KPI mengikut status program, kunci tadbir urus, import tertunda,
 *     invois belum bayar & peserta tidak lengkap.
 *   • Pecahan program mengikut kategori & penganjur.
 *   • Ringkasan kewangan (kontrak, kos, margin anggaran).
 *   • Aktiviti terkini & kelulusan yang belum diputuskan.
 */

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarClock,
  FileWarning,
  Landmark,
  Lock,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_LABEL } from "@/lib/reporting";
import { formatDateTime, formatMYRShort } from "@/lib/format";
import type { ProgrammeStatus } from "@/lib/types";
import type { DashboardData } from "@/lib/dashboard-data";

const STATUS_ORDER: ProgrammeStatus[] = [
  "draft",
  "active",
  "completed",
  "on_hold",
  "cancelled",
];

const STATUS_COLOR: Record<ProgrammeStatus, string> = {
  draft: "bg-slate-500",
  active: "bg-emerald-500",
  completed: "bg-sky-500",
  on_hold: "bg-amber-500",
  cancelled: "bg-rose-500",
};

interface DashboardOverviewProps {
  data: DashboardData;
}

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const { kpi, categories, organizers, recentActivity, pendingApprovals } = data;

  const marginPercent =
    kpi.totalContracted > 0
      ? Math.round((kpi.estimatedMargin / kpi.totalContracted) * 1000) / 10
      : 0;

  return (
    <div className="space-y-6">
      {data.isDemo && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Mod demo — paparan menggunakan data contoh. Sambungkan env
            Supabase (<code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            &amp; <code className="rounded bg-amber-100 px-1">ANON_KEY</code>) untuk
            data sebenar.
          </span>
        </div>
      )}

      {/* ============ Kad KPI status ============ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STATUS_ORDER.map((s) => (
          <Card key={s}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {STATUS_LABEL[s]}
                </p>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${STATUS_COLOR[s]}`}
                />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {kpi.byStatus[s] ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ============ KPI operasi & kewangan ============ */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<CalendarClock className="h-4 w-4" />}
          label="Program aktif bulan ini"
          value={String(kpi.activeThisMonth)}
          hint="Tarikh program dalam bulan semasa"
        />
        <MetricCard
          icon={<Lock className="h-4 w-4" />}
          label="Program dikunci (governance)"
          value={String(kpi.lockedProgrammes)}
          hint="Tidak boleh disunting tanpa kelulusan"
          tone={kpi.lockedProgrammes > 0 ? "amber" : "default"}
        />
        <MetricCard
          icon={<Upload className="h-4 w-4" />}
          label="Import menunggu semakan"
          value={String(kpi.pendingImports)}
          hint="Batch dalam staging / review"
        />
        <MetricCard
          icon={<Banknote className="h-4 w-4" />}
          label="Invois belum dibayar"
          value={String(kpi.unpaidInvoices)}
          hint="Status selain PAID"
          tone={kpi.unpaidInvoices > 0 ? "rose" : "default"}
        />
      </div>

      {/* ============ Kewangan & peserta ============ */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Landmark className="h-4 w-4" />
              Ringkasan Kewangan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Nilai kontrak (revenue)" value={formatMYRShort(kpi.totalContracted)} />
            <Row label="Bajet" value={formatMYRShort(kpi.totalBudget)} />
            <Row label="Kos sebenar" value={formatMYRShort(kpi.totalActualCost)} />
            <div className="flex items-center justify-between border-t pt-2">
              <span className="font-medium">Margin anggaran</span>
              <span
                className={`font-semibold ${
                  kpi.estimatedMargin >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatMYRShort(kpi.estimatedMargin)}{" "}
                <span className="text-xs text-muted-foreground">
                  ({marginPercent}%)
                </span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pecahan kategori */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Program Mengikut Kategori
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">Tiada data.</p>
            )}
            {categories.map((c) => (
              <div key={c.category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate">{c.category}</span>
                  <span className="ml-2 shrink-0 text-muted-foreground">
                    {c.count} ({c.percent}%)
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(c.percent, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pecahan penganjur */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Program Mengikut Penganjur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {organizers.length === 0 && (
              <p className="text-sm text-muted-foreground">Tiada data.</p>
            )}
            {organizers.map((o) => (
              <div key={o.organizer} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{o.organizer}</span>
                <span className="shrink-0 text-muted-foreground">
                  {o.count} program
                </span>
              </div>
            ))}
            {kpi.incompleteParticipants > 0 && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <FileWarning className="h-3.5 w-3.5 shrink-0" />
                {kpi.incompleteParticipants} peserta dengan data tidak lengkap
                (e-mel / status Bumiputera belum disahkan).
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============ Aktiviti & kelulusan ============ */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Aktiviti Terkini</CardTitle>
            <Link
              href="/programmes"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Semua program <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground">Tiada aktiviti.</p>
            )}
            {recentActivity.slice(0, 8).map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 text-sm">
                <Badge variant="outline" className="mt-0.5 shrink-0 font-mono text-[10px]">
                  {ev.action}
                </Badge>
                <div className="min-w-0">
                  <p className="truncate">{ev.detail}</p>
                  <p className="text-xs text-muted-foreground">
                    {ev.actor} · {formatDateTime(ev.timestamp)}
                    {ev.programmeCode ? ` · ${ev.programmeCode}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Kelulusan Belum Diputuskan</CardTitle>
            <Link
              href="/programmes"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Ke program <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Tiada kelulusan yang menunggu. ✓
              </p>
            )}
            {pendingApprovals.map((a) => (
              <div
                key={a.id}
                className="rounded-md border border-slate-200 p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {a.type === "unlock" ? "Permohonan Buka Kunci" : a.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(a.requestedAt)}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                  {a.summary}
                </p>
                <p className="mt-1 text-xs">
                  {a.programmeCode && (
                    <span className="font-mono">{a.programmeCode}</span>
                  )}
                  {a.programmeTitle ? ` — ${a.programmeTitle}` : ""} · oleh{" "}
                  {a.requestedBy}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ============================ Sub-komponen ============================ */

type Tone = "default" | "amber" | "rose";

function MetricCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-md ${
              tone === "amber"
                ? "bg-amber-100 text-amber-700"
                : tone === "rose"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {icon}
          </span>
          <p className="text-xs font-medium">{label}</p>
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
