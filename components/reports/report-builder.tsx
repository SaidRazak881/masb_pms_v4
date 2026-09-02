"use client";

import { useMemo, useState } from "react";
import {
  CalendarRange,
  Download,
  FileSpreadsheet,
  Lock,
  Rows3,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMYR, formatMYRShort } from "@/lib/format";
import {
  buildReport,
  buildReportFilename,
  computeMetrics,
  DEFAULT_FILTER,
  listYears,
  REPORT_TYPES,
  REPORT_TYPE_ORDER,
  type ReportFilter,
  type ReportType,
} from "@/lib/reporting";
import { downloadReport } from "@/lib/report-excel";
import {
  PROGRAMME_CATEGORIES,
  type Programme,
  type ProgrammeCategory,
  type ProgrammeStatus,
} from "@/lib/types";

const CATEGORIES: ProgrammeCategory[] = PROGRAMME_CATEGORIES;

const STATUSES: ProgrammeStatus[] = [
  "draft",
  "active",
  "completed",
  "cancelled",
  "on_hold",
];

const STATUS_OPTIONS: { value: ProgrammeStatus; label: string }[] = [
  { value: "draft", label: "Draf" },
  { value: "active", label: "Aktif" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
  { value: "on_hold", label: "Ditangguh" },
];

export interface ReportBuilderProps {
  programmes: Programme[];
}

export function ReportBuilder({ programmes }: ReportBuilderProps) {
  const [type, setType] = useState<ReportType>("programme_summary");
  const [filter, setFilter] = useState<ReportFilter>(DEFAULT_FILTER);

  const years = useMemo(() => listYears(programmes), [programmes]);

  const report = useMemo(
    () => buildReport(programmes, type, filter),
    [programmes, type, filter],
  );

  const metrics = useMemo(
    () => computeMetrics(programmes, filter),
    [programmes, filter],
  );

  const bumiTotal = metrics.bumiputera + metrics.nonBumiputera + metrics.pendingBumi;
  const bumiPercent =
    bumiTotal > 0 ? Math.round((metrics.bumiputera / bumiTotal) * 100) : 0;

  function handleExport() {
    downloadReport(report, buildReportFilename(type, filter));
  }

  return (
    <div className="space-y-6">
      {/* Pilih jenis laporan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Jenis Laporan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={type} onValueChange={(v) => setType(v as ReportType)}>
            <TabsList className="flex-wrap">
              {REPORT_TYPE_ORDER.map((t) => (
                <TabsTrigger key={t} value={t}>
                  {REPORT_TYPES[t].label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p className="text-sm text-muted-foreground">
            {REPORT_TYPES[type].description}
          </p>
        </CardContent>
      </Card>

      {/* Penapis */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="w-full space-y-1.5 sm:w-40">
            <Label className="text-xs">Tahun</Label>
            <Select
              value={filter.year == null ? "all" : String(filter.year)}
              onValueChange={(v) =>
                setFilter((f) => ({
                  ...f,
                  year: v === "all" ? null : Number(v),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1.5 sm:w-64">
            <Label className="text-xs">Kategori</Label>
            <Select
              value={filter.category}
              onValueChange={(v) =>
                setFilter((f) => ({
                  ...f,
                  category: v as ProgrammeCategory | "all",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1.5 sm:w-48">
            <Label className="text-xs">Status</Label>
            <Select
              value={filter.status}
              onValueChange={(v) =>
                setFilter((f) => ({
                  ...f,
                  status: v as ProgrammeStatus | "all",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto">
            <Button onClick={handleExport} disabled={report.rows.length === 0}>
              <Download className="h-4 w-4" />
              Eksport Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kad metrik ringkasan */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Rows3}
          label="Program"
          value={String(metrics.programmes)}
          sub={`${metrics.locked} berkunci`}
        />
        <MetricCard
          icon={Users}
          label="Peserta"
          value={String(metrics.participants)}
          sub={`${bumiPercent}% Bumiputera`}
        />
        <MetricCard
          icon={CalendarRange}
          label="Nilai Kontrak"
          value={formatMYRShort(metrics.contracted)}
          sub={`Bajet ${formatMYRShort(metrics.budget)}`}
        />
        <MetricCard
          icon={FileSpreadsheet}
          label="Kos Sebenar"
          value={formatMYRShort(metrics.actual)}
          sub={
            metrics.actual > metrics.budget ? "Lebih bajet" : "Dalam bajet"
          }
        />
      </div>

      {/* Jadual preview laporan */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Preview Laporan</CardTitle>
            <Badge variant="secondary">{report.rows.length} baris</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {report.columns.map((c) => (
                    <TableHead
                      key={c.key}
                      className={
                        c.align === "right"
                          ? "text-right"
                          : c.align === "center"
                            ? "text-center"
                            : undefined
                      }
                    >
                      {c.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={report.columns.length}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      Tiada data sepadan dengan jenis laporan & penapis dipilih.
                    </TableCell>
                  </TableRow>
                )}
                {report.rows.map((row, i) => (
                  <TableRow key={i}>
                    {report.columns.map((c) => {
                      const value = row[c.key];
                      const isNumber = typeof value === "number";
                      const align =
                        c.align === "right"
                          ? "text-right tabular-nums"
                          : c.align === "center"
                            ? "text-center"
                            : undefined;
                      return (
                        <TableCell key={c.key} className={align}>
                          {isNumber && c.label.includes("(RM)")
                            ? formatMYR(value as number)
                            : isNumber && c.label.includes("%")
                              ? `${value}%`
                              : String(value ?? "")}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        Laporan menjana daripada data program yang ditapis. Eksport menghasilkan
        satu sheet Excel bernama &quot;Laporan&quot;.
      </p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Rows3;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-semibold tabular-nums">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
