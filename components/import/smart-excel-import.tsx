"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ParsedWorkbook,
  RecordAction,
  StagingRecord,
} from "@/lib/excel-parser";
import { getMasterRecords } from "@/lib/master-records";
import type { Summary } from "./import-types";
import { ReviewPanel, type RowFilter } from "./review-panel";

/* ============================ Jenis UI ============================ */

type Phase = "upload" | "review" | "done";

const SAMPLE_FILES = [
  {
    href: "/samples/00. Quotation Tracker (1).xlsx",
    name: "00. Quotation Tracker (1).xlsx",
    desc: "Tracker Sebut Harga (8 rekod: rujukan & tajuk pendua, ralat lajur kosong)",
  },
  {
    href: "/samples/R1 MIMOS_Academy_INCOME_STATEMENT.xlsx",
    name: "R1 MIMOS_Academy_INCOME_STATEMENT.xlsx",
    desc: "Invois + Cost of Sale (9 rekod: dua jadual dalam satu sheet)",
  },
];

/* ============================ Komponen ============================ */

export function SmartExcelImport() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [records, setRecords] = useState<StagingRecord[]>([]);
  const [filter, setFilter] = useState<RowFilter>("all");
  const [compareId, setCompareId] = useState<string | null>(null);

  const master = useMemo(() => getMasterRecords(), []);

  const processFile = useCallback(
    async (file: File | { href: string; name: string }) => {
      setParsing(true);
      setParseError(null);
      try {
        const isBrowserFile = file instanceof File;
        const name = isBrowserFile
          ? (file as File).name
          : file.href.split("/").pop()!;
        const buf = isBrowserFile
          ? await (file as File).arrayBuffer()
          : await fetch(file.href).then((r) => r.arrayBuffer());

        // Parser diimport secara dinamik supaya bundle xlsx (SheetJS)
        // hanya dimuatkan apabila pengguna benar-benar memuat naik fail.
        const { parseExcelWorkbook } = await import("@/lib/excel-parser");
        const result = parseExcelWorkbook(buf, name, master);

        if (result.records.length === 0) {
          setParseError(
            result.warnings.map((w) => w.message).join(" ") ||
              "Tiada data dikesan dalam fail ini.",
          );
        } else {
          setWorkbook(result);
          setRecords(result.records);
          setFileName(name);
          setCompareId(null);
          setFilter("all");
          setPhase("review");
        }
      } catch (err) {
        setParseError(
          `Fail tidak dapat dibaca: ${err instanceof Error ? err.message : "ralat tidak diketahui"}`,
        );
      } finally {
        setParsing(false);
      }
    },
    [master],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) void processFile(file);
    },
    [processFile],
  );

  const applyAction = useCallback((id: string, action: RecordAction) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, action } : r)),
    );
    setCompareId((cur) => (cur === id ? null : cur));
  }, []);

  const bulkAction = useCallback((action: RecordAction) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (action === "discarded") {
          return r.action === "pending" ? { ...r, action } : r;
        }
        // Tindakan positif hanya untuk rekod sah yang belum diputuskan.
        if (!r.isValid || r.action !== "pending") return r;
        return { ...r, action };
      }),
    );
  }, []);

  function reset() {
    setPhase("upload");
    setFileName("");
    setWorkbook(null);
    setRecords([]);
    setFilter("all");
    setCompareId(null);
    setParseError(null);
  }

  const summary: Summary = useMemo(
    () => ({
      total: records.length,
      pending: records.filter((r) => r.action === "pending").length,
      valid: records.filter((r) => r.isValid).length,
      invalid: records.filter((r) => !r.isValid).length,
      duplicates: records.filter((r) => r.duplicate).length,
      synced: records.filter((r) => r.action === "sync_confirmed").length,
      merged: records.filter((r) => r.action === "merged").length,
      created: records.filter((r) => r.action === "created_new").length,
      discarded: records.filter((r) => r.action === "discarded").length,
    }),
    [records],
  );

  const visible = useMemo(() => {
    switch (filter) {
      case "valid":
        return records.filter((r) => r.isValid);
      case "invalid":
        return records.filter((r) => !r.isValid);
      case "duplicate":
        return records.filter((r) => r.duplicate);
      default:
        return records;
    }
  }, [records, filter]);

  if (phase === "done") {
    return <SyncDone summary={summary} fileName={fileName} onReset={reset} />;
  }

  return (
    <div className="space-y-6">
      {phase === "upload" && (
        <UploadCard
          parsing={parsing}
          parseError={parseError}
          onFile={(f) => void processFile(f)}
          onDrop={onDrop}
          onSample={(href) =>
            void processFile({ href, name: href.split("/").pop()! })
          }
        />
      )}

      {phase === "review" && workbook && (
        <ReviewPanel
          workbook={workbook}
          records={visible}
          summary={summary}
          filter={filter}
          onFilter={setFilter}
          onAction={applyAction}
          onBulkAction={bulkAction}
          onCompare={(id) => setCompareId(id)}
          compareOpenId={compareId}
          onCloseCompare={() => setCompareId(null)}
          onReset={reset}
          onSync={() => setPhase("done")}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fasa 1: Muat naik                                                   */
/* ------------------------------------------------------------------ */

function UploadCard({
  parsing,
  parseError,
  onFile,
  onDrop,
  onSample,
}: {
  parsing: boolean;
  parseError: string | null;
  onFile: (f: File) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onSample: (href: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Muat Naik Fail Excel (.xlsx / .xls)
          </CardTitle>
          <CardDescription>
            Parser pintar mengesan jenis sheet secara automatik —{" "}
            <strong>Quotation Tracker</strong> atau{" "}
            <strong>Income Statement</strong> (Invois &amp; Cost of Sale) —
            menggunakan padanan pengepala longgar (BM &amp; English), dan
            menyokong berbilang jadual dalam satu sheet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition-colors hover:border-primary hover:bg-primary/5"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              {parsing ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <CloudUpload className="h-7 w-7" />
              )}
            </span>
            <label className="cursor-pointer">
              <span className="font-medium text-primary">
                {parsing
                  ? "Sedang membaca & mengesahkan..."
                  : "Klik untuk memilih fail"}
              </span>
              <span className="text-muted-foreground">
                {" "}
                atau seret dan lepaskan di sini
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                disabled={parsing}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                  e.target.value = "";
                }}
              />
            </label>
            <span className="text-xs text-muted-foreground">
              Maksimum 10 MB · pengepala berbilang baris &amp; berbilang
              jadual disokong
            </span>
          </div>

          {parseError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{parseError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fail contoh */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Fail Contoh (struktur operasi MIMOS Academy)
          </CardTitle>
          <CardDescription>
            Kedua-dua fail yang dinamakan dalam permintaan tidak wujud dalam
            persekitaran ini — contoh di bawah meniru strukturnya. Klik
            &quot;Cuba&quot; untuk menguji parser, atau muat naik fail sebenar
            anda melalui zon di atas (tataletak pengepala yang berbeza tetap
            disokong).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {SAMPLE_FILES.map((s) => (
            <div
              key={s.href}
              className="flex items-center gap-3 rounded-lg border bg-white p-4"
            >
              <FileSpreadsheet className="h-9 w-9 shrink-0 text-emerald-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={parsing}
                onClick={() => onSample(s.href)}
              >
                Cuba
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fasa 3: Selesai                                                     */
/* ------------------------------------------------------------------ */

function SyncDone({
  summary,
  fileName,
  onReset,
}: {
  summary: Summary;
  fileName: string;
  onReset: () => void;
}) {
  const processed =
    summary.synced + summary.merged + summary.created + summary.discarded;
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-9 w-9" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Penyegerakan Selesai</h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            Keputusan untuk <strong>{processed}</strong> rekod daripada{" "}
            <strong>{fileName}</strong> telah dihantar ke jadual induk.
          </p>
        </div>

        <div className="grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
          <DoneStat label="Disegerak" value={summary.synced} tone="text-emerald-700" />
          <DoneStat label="Digabungkan" value={summary.merged} tone="text-sky-700" />
          <DoneStat label="Baharu" value={summary.created} tone="text-primary" />
          <DoneStat label="Dibuang" value={summary.discarded} tone="text-slate-500" />
        </div>

        <Button onClick={onReset} className="mt-2">
          Muat Naik Fail Lain
        </Button>
      </CardContent>
    </Card>
  );
}

function DoneStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <p className={`text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
