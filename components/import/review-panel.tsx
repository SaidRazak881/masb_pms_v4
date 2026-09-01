/**
 * Bahagian 2 komponen import pintar — Panel Review Staging.
 * Ditulis sebagai fail berasingan untuk kebolehselenggaraan; dieksport
 * semula daripada smart-excel-import.tsx.
 */
"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CopyPlus,
  FileSpreadsheet,
  GitCompare,
  Loader2,
  RotateCcw,
  Send,
  Trash2,
  X,
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
import { isUuid } from "@/lib/import-api";
import type { Summary } from "./import-types";
import type { SyncErrorState } from "./smart-excel-import";
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
  syncing = false,
  syncStep = null,
  syncError = null,
  onDismissError,
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
  /** Penyegerakan ke /api/import/sync sedang berjalan. */
  syncing?: boolean;
  /** Mesej kemajuan langkah semasa (staging / penghantaran). */
  syncStep?: string | null;
  /** Ralat daripada API, dipaparkan tanpa menukar fasa wizard. */
  syncError?: SyncErrorState | null;
  onDismissError?: () => void;
}) {
  const compareRecord = records.find((r) => r.id === compareOpenId)
    ?? workbook.records.find((r) => r.id === compareOpenId)
    ?? null;

  // Bilangan keputusan sebenar yang akan dihantar ke pelayan.
  const decidedCount =
    summary.synced + summary.merged + summary.created + summary.discarded;

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
          <Button
            variant="ghost"
            size="sm"
            disabled={syncing}
            onClick={onReset}
          >
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

      {/* Ralat penyegerakan daripada /api/import/sync */}
      {syncError && (
        <SyncErrorAlert error={syncError} onDismiss={onDismissError} />
      )}

      {/* Penapis + tindakan pukal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          value={filter}
          disabled={syncing}
          onValueChange={(v) => onFilter(v as RowFilter)}
        >
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

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={syncing}
            onClick={() => onBulkAction("discarded")}
          >
            <Trash2 className="h-4 w-4" />
            Buang Yang Menunggu
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={syncing || summary.valid === 0}
            onClick={() => onBulkAction("created_new")}
          >
            <CopyPlus className="h-4 w-4" />
            Cipta Baharu (Sah)
          </Button>
          <Button
            size="sm"
            // Segerak dibenarkan sebaik sahaja ada keputusan — tidak perlu
            // menunggu setiap baris diputuskan; baris `pending` dilangkau.
            disabled={syncing || decidedCount === 0}
            onClick={onSync}
            title={
              decidedCount === 0
                ? "Sahkan sekurang-kurangnya satu baris sebelum menyegerak."
                : `Hantar ${decidedCount} keputusan ke /api/import/sync`
            }
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {syncing
              ? "Menyegerak…"
              : `Confirm & Sync to Master${decidedCount > 0 ? ` (${decidedCount})` : ""}`}
          </Button>
        </div>
      </div>

      {/* Kemajuan penyegerakan */}
      {syncing && (
        <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          <p>
            {syncStep ?? "Menyegerakkan rekod…"}{" "}
            <span className="text-sky-700">
              Transaksi adalah atomic — jangan tutup tetingkap ini.
            </span>
          </p>
        </div>
      )}

      {summary.pending > 0 && !syncing && (
        <p className="text-xs text-muted-foreground">
          {summary.pending} baris masih menunggu keputusan dan tidak akan
          dihantar ke pelayan.
        </p>
      )}

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
                  disabled={syncing}
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
  disabled = false,
}: {
  record: StagingRecord;
  onAction: (id: string, action: RecordAction) => void;
  onCompare: () => void;
  /** Kunci semua kawalan semasa penyegerakan berjalan. */
  disabled?: boolean;
}) {
  const r = record;
  const decided = r.action !== "pending";
  // Gabungan hanya sah apabila padanan pendua merujuk UUID program sebenar
  // dalam Supabase — RPC menolak `duplicate_match_id` bukan-UUID.
  const canMerge = isUuid(r.duplicate?.matchId);

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
            {r.action !== "discarded" || disabled ? null : (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                disabled={disabled}
                onClick={() => onAction(r.id, "pending")}
              >
                <RotateCcw className="h-3 w-3" />
                Buat asal
              </Button>
            )}
            {r.action === "merged" && !canMerge && (
              <p className="text-xs text-amber-700">
                Padanan bukan program Supabase — pilih &quot;Cipta
                Baharu&quot;.
              </p>
            )}
          </div>
        ) : r.duplicate ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={disabled}
            onClick={onCompare}
          >
            <GitCompare className="h-3.5 w-3.5" />
            Bandingkan
          </Button>
        ) : r.isValid ? (
          <div className="flex flex-col gap-1.5">
            <Button
              size="sm"
              className="w-full"
              disabled={disabled}
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
                disabled={disabled}
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
                disabled={disabled}
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
              disabled={disabled}
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
/* Papar ralat daripada /api/import/sync                               */
/* ------------------------------------------------------------------ */

function SyncErrorAlert({
  error,
  onDismiss,
}: {
  error: SyncErrorState;
  onDismiss?: () => void;
}) {
  // Konflik governance / kebenaran diberi warna amber (boleh dipulihkan
  // oleh pengguna); selebihnya merah.
  const recoverable =
    error.code === "GOVERNANCE_LOCKED" ||
    error.code === "CLIENT_VALIDATION_ERROR" ||
    error.code === "VALIDATION_ERROR" ||
    error.code === "DATA_VALIDATION_ERROR";

  const tone = recoverable
    ? "border-amber-200 bg-amber-50 text-amber-900"
    : "border-red-200 bg-red-50 text-red-900";

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${tone}`}>
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="font-semibold">
          Penyegerakan gagal
          <span className="ml-2 rounded bg-white/70 px-1.5 py-0.5 font-mono text-xs font-normal">
            {error.code}
          </span>
        </p>
        <p>{error.message}</p>
        {error.details.length > 0 && (
          <ul className="list-inside list-disc space-y-0.5 text-xs">
            {error.details.map((detail, i) => (
              <li key={i}>{detail}</li>
            ))}
          </ul>
        )}
        <p className="text-xs opacity-90">{error.hint}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup amaran"
          className="shrink-0 rounded p-1 transition-colors hover:bg-white/60"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
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
