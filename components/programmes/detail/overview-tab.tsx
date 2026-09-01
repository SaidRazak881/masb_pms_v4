import {
  Banknote,
  CalendarClock,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMYRShort, formatPercent } from "@/lib/format";
import type { Programme } from "@/lib/types";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-bold tabular-nums">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewTab({ programme }: { programme: Programme }) {
  const total = programme.participants.length;
  const bumi = programme.participants.filter(
    (p) => p.bumiStatus === "bumiputera",
  ).length;
  const pending = programme.participants.filter(
    (p) => p.bumiStatus === "pending",
  ).length;

  const spent = programme.actualCost;
  const budget = programme.budget;
  const utilisation = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const underBudget = spent <= budget;
  const margin = programme.contractedAmount - spent;

  return (
    <div className="space-y-6">
      {/* Statistik ringkas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Jumlah Peserta"
          value={String(total)}
          sub={`${bumi} Bumiputera · ${pending} belum disahkan`}
          icon={Users}
        />
        <StatCard
          label="Nilai Kontrak"
          value={formatMYRShort(programme.contractedAmount)}
          sub={programme.code}
          icon={Banknote}
        />
        <StatCard
          label="Belanja Sebenar"
          value={formatMYRShort(spent)}
          sub={`${utilisation}% daripada bajet`}
          icon={underBudget ? TrendingDown : TrendingUp}
        />
        <StatCard
          label="Anggaran Margin"
          value={formatMYRShort(margin)}
          sub={underBudget ? "Di bawah bajet" : "Terlebih bajet — semak Costs"}
          icon={CalendarClock}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Penerangan & maklumat */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Maklumat Program</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {programme.description}
            </p>

            <dl className="grid gap-x-6 gap-y-3 border-t pt-4 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Pelanggan</dt>
                <dd className="text-right font-medium">{programme.client}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Kategori</dt>
                <dd className="text-right font-medium">{programme.category}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Jurulatih</dt>
                <dd className="text-right font-medium">{programme.trainer}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Pengurus Program</dt>
                <dd className="text-right font-medium">
                  {programme.programmeManager}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Lokasi</dt>
                <dd className="text-right font-medium">{programme.venue}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Tahun Kewangan</dt>
                <dd className="text-right font-medium">{programme.year}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Komposisi peserta & penggunaan bajet */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Komposisi Bumiputera</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CompositionBar
                label="Bumiputera"
                value={bumi}
                total={total}
                barClass="bg-emerald-500"
              />
              <CompositionBar
                label="Bukan Bumiputera"
                value={total - bumi - pending}
                total={total}
                barClass="bg-slate-400"
              />
              <CompositionBar
                label="Belum Disahkan"
                value={pending}
                total={total}
                barClass="bg-amber-500"
              />
              <p className="pt-1 text-xs text-muted-foreground">
                Sasaran pematuhan: sekurang-kurangnya{" "}
                <span className="font-semibold">70%</span> peserta Bumiputera.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Penggunaan Bajet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold tabular-nums">
                  {utilisation}%
                </span>
                <span
                  className={
                    underBudget
                      ? "text-xs font-medium text-emerald-600"
                      : "text-xs font-medium text-red-600"
                  }
                >
                  {underBudget ? "Dalam kawalan" : "Terlebih bajet"}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    underBudget ? "bg-primary" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(utilisation, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Bajet: {formatMYRShort(budget)}</span>
                <span>Sebenar: {formatMYRShort(spent)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CompositionBar({
  label,
  value,
  total,
  barClass,
}: {
  label: string;
  value: number;
  total: number;
  barClass: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {value} ({formatPercent(value, total)})
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${total ? (value / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}
