/**
 * Bahagian 2 komponen import pintar — Panel Review Staging.
 * Ditulis sebagai fail berasingan untuk kebolehselenggaraan; dieksport
 * semula daripada smart-excel-import.tsx.
 */
"use client";

import {
  CheckCircle2,
  CopyPlus,
  FileSpreadsheet,
  GitCompare,
  RotateCcw,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  ACTION_LABEL,
  ENTITY_KIND_LABEL,
  type ParsedWorkbook,
  type RecordAction,
  type StagingRecord,
} from "@/lib/excel-parser";
import { formatMYRShort } from "@/lib/format";
import type { Summary } from "./import-types";
import { DuplicateCompareDialog } from "./duplicate-compare-dialog";

export type RowFilter = "all" | "valid" | "invalid" | "duplicate";

/* ------------------------------------------------------------------ */
/* Panel utama: ringkasan + penapis + jadual + tindakan                */
/* ------------------------------------------------------------------ */

export function ReviewPanel({
  workbook,
  records,
  summary,
  filter,
  onFilter,
  onAction,
  onBulkAction,
  onCompare,
  compareOpenId,
  onCloseCompare,
  onReset,
  onSync,
}: {
  workbook: ParsedWorkbook;
  records: StagingRecord[];
  summary: Summary;
  filter: RowFilter;
  onFilter: (f: RowFilter) => void;
  onAction: (id: string, action: RecordAction) => void;
  onBulkAction: (action: RecordAction) => void;
  onCompare: (id: string) => void;
  compareOpenId: string | null;
  onCloseCompare: () => void;
  onReset: () => void;
  onSync: () => void;
}) {
  const compareRecord = records.find((r) => r.id === compareOpenId)
    ?? workbook.records.find((r) => r.id === compareOpenId)
    ?? null;

  return (
    <div className="space-y-4">
      {/* Kepala batch */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-9 w-9 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold">{workbook.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {workbook.sheets
                  .map(
                    (s) =>
                      `${s.sheetName}: ${ENTITY_KIND_LABEL[s.entityKind]} (${s.recordCount})`,
                  )
                  .join(" · ")}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Muat Naik Fail Lain
          </Button>
        </CardContent>
      </Card>

      {/* Kad ringkasan */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <SummaryCard
          label="Jumlah Baris"
          value={summary.total}
          tone="default"
        />
        <SummaryCard label="Sah" value={summary.valid} tone="success" icon />
        <SummaryCard label="Ralat" value={summary.invalid} tone="danger" />
        <SummaryCard
          label="Perlu Semak (Pendua)"
          value={summary.duplicates}
          tone="warning"
        />
        <SummaryCard
          label="Menunggu Keputusan"
          value={summary.pending}
          tone="info"
        />
      </div>

      {/* Penapis + tindakan pukal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={filter} onValueChange={(v) => onFilter(v as RowFilter)}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua rekod ({summary.total})</SelectItem>
            <SelectItem value="valid">
              Rekod sah ({summary.valid})
            </SelectItem>
            <SelectItem value="invalid">
              Rekod bermasalah ({summary.invalid})
            </SelectItem>
            <SelectItem value="duplicate">
              Disyaki pendua ({summary.duplicates})
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkAction("discarded")}
          >
            <Trash2 className="h-4 w-4" />
            Buang Yang Menunggu
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={summary.valid === 0}
            onClick={() => onBulkAction("created_new")}
          >
            <CopyPlus className="h-4 w-4" />
            Cipta Baharu (Sah)
          </Button>
          <Button
            size="sm"
            disabled={summary.pending === 0 || summary.valid === 0}
            onClick={onSync}
          >
            <Send className="h-4 w-4" />
            Confirm &amp; Sync to Master
          </Button>
        </div>
      </div>

      {/* Jadual preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Staging Preview</CardTitle>
          <CardDescription>
            Semak setiap baris. Rekod sah tanpa pendua boleh disegerak
            terus; rekod pendua perlu dikaji — gabung, cipta baharu atau
            buang.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Baris</TableHead>
                <TableHead className="w-28">Jenis</TableHead>
                <TableHead>Rujukan / Program / Pelanggan</TableHead>
                <TableHead className="w-28 text-right">Amaun</TableHead>
                <TableHead className="w-36">Pengesahan</TableHead>
                <TableHead className="w-44">Keputusan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <StagingRow
                  key={r.id}
                  record={r}
                  onAction={onAction}
                  onCompare={() => onCompare(r.id)}
                />
              ))}
              {records.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Tiada rekod untuk penapis ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DuplicateCompareDialog
        record={compareRecord}
        open={compareOpenId !== null}
        onClose={onCloseCompare}
        onAction={(action) => {
          if (compareRecord) {
            onAction(compareRecord.id, action);
            onCloseCompare();
          }
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Satu baris dalam jadual staging                                     */
/* ------------------------------------------------------------------ */

function StagingRow({
  record,
  onAction,
  onCompare,
}: {
  record: StagingRecord;
  onAction: (id: string, action: RecordAction) => void;
  onCompare: () => void;
}) {
  const r = record;
  const decided = r.action !== "pending";

  return (
    <TableRow className={!r.isValid ? "bg-red-50/60" : undefined}>
      <TableCell className="align-top text-xs text-muted-foreground">
        {r.sheetName}
        <br />
        <span className="font-mono">#{r.rowNumber}</span>
      </TableCell>

      <TableCell className="align-top">
        <EntityBadge kind={r.entityKind} />
      </TableCell>

      <TableCell className="align-top">
        <div className="space-y-1">
          {r.referenceNo ? (
            <p className="font-mono text-xs font-semibold">{r.referenceNo}</p>
          ) : (
            <p className="font-mono text-xs text-red-500">
              (tiada rujukan)
            </p>
          )}
          <p className="text-sm font-medium leading-snug">
            {r.programmeTitle || (
              <span className="italic text-red-500">(tajuk kosong)</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {r.clientName || r.description || "—"}
          </p>
          {r.docDate && (
            <p className="text-xs text-muted-foreground">
              {formatDisplayDate(r.docDate)}
              {r.status ? ` · ${r.status}` : ""}
            </p>
          )}

          {/* Ralat pengesahan */}
          {r.errors.map((e) => (
            <p
              key={e.code}
              className="flex items-center gap-1 text-xs font-medium text-red-600"
            >
              <XCircle className="h-3 w-3 shrink-0" />
              {e.message}
            </p>
          ))}
          {/* Amaran bukan-rallat */}
          {r.isValid &&
            r.warnings
              .filter((w) => w.code.startsWith("MISSING_DATE"))
              .map((w) => (
                <p
                  key={w.code}
                  className="flex items-center gap-1 text-xs text-amber-600"
                >
                  <AlertTriangleMini />
                  {w.message}
                </p>
              ))}

          {/* Gesaan pendua */}
          {r.duplicate && (
            <button
              type="button"
              onClick={onCompare}
              className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
            >
              <GitCompare className="h-3.5 w-3.5" />
              <span>
                {r.duplicate.confidence === "high"
                  ? "Padanan tinggi"
                  : "Persamaan meragukan"}
              </span>
            </button>
          )}
        </div>
      </TableCell>

      <TableCell className="align-top text-right">
        {r.amount !== null ? (
          <span className="font-semibold tabular-nums">
            {formatMYRShort(r.amount)}
          </span>
        ) : (
          <span className="text-red-500">—</span>
        )}
      </TableCell>

      <TableCell className="align-top">
        <ValidationBadge isValid={r.isValid} duplicate={!!r.duplicate} />
      </TableCell>

      <TableCell className="align-top">
        {decided ? (
          <div className="space-y-1.5">
            <ActionBadge action={r.action} />
            {r.action === "discarded" ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => onAction(r.id, "pending")}
              >
                <RotateCcw className="h-3 w-3" />
                Buat asal
              </Button>
            ) : null}
          </div>
        ) : r.duplicate ? (
          <Button size="sm" variant="outline" className="w-full" onClick={onCompare}>
            <GitCompare className="h-3.5 w-3.5" />
            Bandingkan
          </Button>
        ) : r.isValid ? (
          <div className="flex flex-col gap-1.5">
            <Button
              size="sm"
              className="w-full"
              onClick={() => onAction(r.id, "sync_confirmed")}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sync
            </Button>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 flex-1 px-1 text-xs"
                title="Cipta program / rekod baharu"
                onClick={() => onAction(r.id, "created_new")}
              >
                <CopyPlus className="h-3 w-3" />
                Baharu
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 px-0"
                title="Buang rekod"
                onClick={() => onAction(r.id, "discarded")}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">
              Betulkan dalam fail &amp; muat naik semula.
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-fit px-2 text-xs text-red-600"
              onClick={() => onAction(r.id, "discarded")}
            >
              <Trash2 className="h-3 w-3" />
              Buang
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-komponen kecil                                                  */
/* ------------------------------------------------------------------ */

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "success" | "danger" | "warning" | "info";
  icon?: boolean;
}) {
  const tones: Record<string, string> = {
    default: "border-slate-200",
    success: "border-emerald-200 bg-emerald-50",
    danger: "border-red-200 bg-red-50",
    warning: "border-amber-200 bg-amber-50",
    info: "border-sky-200 bg-sky-50",
  };
  const valueTone: Record<string, string> = {
    default: "text-foreground",
    success: "text-emerald-700",
    danger: "text-red-700",
    warning: "text-amber-700",
    info: "text-sky-700",
  };
  return (
    <Card className={tones[tone]}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold tabular-nums ${valueTone[tone]}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function EntityBadge({ kind }: { kind: StagingRecord["entityKind"] }) {
  const variant =
    kind === "invoice"
      ? "default"
      : kind === "quotation"
        ? "info"
        : kind === "cost"
          ? "secondary"
          : "warning";
  return (
    <Badge variant={variant as "default" | "info" | "secondary" | "warning"}>
      {ENTITY_KIND_LABEL[kind]}
    </Badge>
  );
}

function ValidationBadge({
  isValid,
  duplicate,
}: {
  isValid: boolean;
  duplicate: boolean;
}) {
  if (!isValid) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Ralat
      </Badge>
    );
  }
  if (duplicate) {
    return (
      <Badge variant="warning" className="gap-1">
        <GitCompare className="h-3 w-3" />
        Perlu Semak
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="gap-1">
      <CheckCircle2 className="h-3 w-3" />
      Sah
    </Badge>
  );
}

function ActionBadge({ action }: { action: RecordAction }) {
  const map: Record<RecordAction, { variant: string; label: string }> = {
    pending: { variant: "secondary", label: ACTION_LABEL.pending },
    sync_confirmed: { variant: "success", label: ACTION_LABEL.sync_confirmed },
    merged: { variant: "info", label: ACTION_LABEL.merged },
    created_new: { variant: "default", label: ACTION_LABEL.created_new },
    discarded: { variant: "destructive", label: ACTION_LABEL.discarded },
  };
  const m = map[action];
  return (
    <Badge variant={m.variant as "success" | "info" | "default" | "destructive"}>
      {m.label}
    </Badge>
  );
}

function AlertTriangleMini() {
  return (
    <svg
      className="h-3 w-3 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function formatDisplayDate(iso: string): string {
  // iso = yyyy-mm-dd
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
