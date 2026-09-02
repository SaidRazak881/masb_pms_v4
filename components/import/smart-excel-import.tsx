"use client";

import * as React from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  Database,
  FileSpreadsheet,
  LayoutDashboard,
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
  MasterRecords,
  ParsedWorkbook,
  RecordAction,
  StagingRecord,
} from "@/lib/excel-parser";
import {
  ImportSyncError,
  isSupabaseConfigured,
  isUuid,
  syncErrorHint,
  syncWorkbook,
  type SyncOutcome,
} from "@/lib/import-api";
import { fetchMasterRecords, getMasterRecords } from "@/lib/master-records";
import type { Summary } from "./import-types";
import { ReviewPanel, type RowFilter } from "./review-panel";

/* ============================ Jenis UI ============================ */

type Phase = "upload" | "review" | "done";

export interface SyncErrorState {
  code: string;
  message: string;
  hint: string;
  details: string[];
}

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

  // ---- Keadaan penyegerakan ke /api/import/sync (Langkah 4.5) ----
  const [syncing, setSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<SyncErrorState | null>(null);
  const [outcome, setOutcome] = useState<SyncOutcome | null>(null);

  // ---- Rekod induk (Supabase bila tersedia, mock sebagai sandaran) ----
  const [master, setMaster] = useState<MasterRecords>(() => getMasterRecords());
  const [masterLive, setMasterLive] = useState(false);
  const [masterError, setMasterError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchMasterRecords().then((result) => {
      if (cancelled) return;
      setMaster(result.master);
      setMasterLive(result.live);
      setMasterError(result.error);
    });
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

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
          // Auto-keputusan: rekod yang SAH (quotation/invoice/cost) terus
          // ditanda "sync_confirmed" supaya pengguna boleh terus klik
          // "Confirm & Sync" tanpa memilih setiap baris. Rekod tidak sah
          // kekal "pending" untuk semakan/buang.
          const autoDecided = result.records.map((r) =>
            r.isValid &&
            (r.entityKind === "quotation" ||
              r.entityKind === "invoice" ||
              r.entityKind === "cost")
              ? { ...r, action: "sync_confirmed" as RecordAction }
              : r,
          );
          setWorkbook(result);
          setRecords(autoDecided);
          setFileName(name);
          setCompareId(null);
          setFilter("all");
          setSyncError(null);
          setOutcome(null);
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
    setSyncError(null);
  }, []);

  const bulkAction = useCallback((action: RecordAction) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (action === "discarded") {
          return r.action === "pending" ? { ...r, action } : r;
        }
        // Gabung pukal: hanya pendua SAH yang memadankan program Supabase
        // (UUID) dan masih menunggu keputusan. Yang lain kekal pending.
        if (action === "merged") {
          if (
            r.action !== "pending" ||
            !r.isValid ||
            !isUuid(r.duplicate?.matchId)
          ) {
            return r;
          }
          return { ...r, action };
        }
        // Tindakan positif hanya untuk rekod sah yang belum diputuskan.
        if (!r.isValid || r.action !== "pending") return r;
        return { ...r, action };
      }),
    );
    setSyncError(null);
  }, []);

  function reset() {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("upload");
    setFileName("");
    setWorkbook(null);
    setRecords([]);
    setFilter("all");
    setCompareId(null);
    setParseError(null);
    setSyncing(false);
    setSyncStep(null);
    setSyncError(null);
    setOutcome(null);
  }

  /**
   * "Confirm & Sync to Master" — hantar semua keputusan ke API transaksi
   * atomic `/api/import/sync`. Kegagalan tidak menukar fasa: pengguna kekal
   * pada panel review supaya baris bermasalah boleh dibetulkan dan dicuba
   * semula (tiada perubahan separa ditulis oleh pelayan).
   */
  const handleSync = useCallback(async () => {
    if (!workbook || syncing) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setSyncing(true);
    setSyncError(null);
    setSyncStep("Menyediakan penyegerakan…");

    try {
      const result = await syncWorkbook({
        workbook,
        records,
        signal: controller.signal,
        onProgress: (message) => setSyncStep(message),
      });
      setOutcome(result);
      setPhase("done");
    } catch (error) {
      if (error instanceof ImportSyncError) {
        setSyncError({
          code: error.code,
          message: error.message,
          hint: syncErrorHint(error.code),
          details: error.details,
        });
      } else {
        setSyncError({
          code: "INTERNAL_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Ralat tidak dijangka semasa penyegerakan.",
          hint: syncErrorHint("INTERNAL_ERROR"),
          details: [],
        });
      }
    } finally {
      setSyncing(false);
      setSyncStep(null);
      abortRef.current = null;
    }
  }, [workbook, records, syncing]);

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

  // Bilangan pendua yang BOLEH digabung serentak: sah, masih menunggu
  // keputusan, dan padanan merujuk UUID program Supabase yang sebenar.
  const mergeableCount = useMemo(
    () =>
      records.filter(
        (r) =>
          r.action === "pending" &&
          r.isValid &&
          isUuid(r.duplicate?.matchId),
      ).length,
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
    return (
      <SyncDone
        summary={summary}
        outcome={outcome}
        fileName={fileName}
        onReset={reset}
      />
    );
  }

  return (
    <div className="space-y-6">
      <MasterSourceNotice live={masterLive} error={masterError} />

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
          mergeableCount={mergeableCount}
          filter={filter}
          onFilter={setFilter}
          onAction={applyAction}
          onBulkAction={bulkAction}
          onCompare={(id) => setCompareId(id)}
          compareOpenId={compareId}
          onCloseCompare={() => setCompareId(null)}
          onReset={reset}
          onSync={() => void handleSync()}
          syncing={syncing}
          syncStep={syncStep}
          syncError={syncError}
          onDismissError={() => setSyncError(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Petunjuk sumber rekod induk (Supabase vs mock)                      */
/* ------------------------------------------------------------------ */

function MasterSourceNotice({
  live,
  error,
}: {
  live: boolean;
  error: string | null;
}) {
  if (live && !error) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        <Database className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Pengesanan pendua menggunakan <strong>data induk Supabase</strong>{" "}
          secara langsung. Penyegerakan akan ditulis melalui transaksi atomic{" "}
          <code className="rounded bg-white/70 px-1 py-0.5 text-xs">
            /api/import/sync
          </code>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        {error
          ? `Rekod induk Supabase tidak dapat dibaca (${error}). `
          : "Pemboleh ubah persekitaran Supabase belum ditetapkan. "}
        Sistem menggunakan <strong>data mock</strong> untuk pengesanan pendua
        dan penyegerakan dijalankan dalam <strong>mod simulasi</strong> tanpa
        menulis ke pangkalan data.
      </p>
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
            Fail contoh rasmi daripada folder <code>V4 RAW</code> turut
            disertakan. Klik &quot;Cuba&quot; untuk menguji parser, atau muat
            naik fail sebenar anda melalui zon di atas (tataletak pengepala
            yang berbeza tetap disokong).
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
  outcome,
  fileName,
  onReset,
}: {
  summary: Summary;
  outcome: SyncOutcome | null;
  fileName: string;
  onReset: () => void;
}) {
  // Nombor pelayan diutamakan; ringkasan UI hanya sandaran (mod demo).
  const processed =
    outcome?.processed ??
    summary.synced + summary.merged + summary.created;
  const created = outcome?.created ?? summary.created;
  const merged = outcome?.merged ?? summary.merged;
  const discarded = outcome?.discarded ?? summary.discarded;
  const simulated = outcome?.simulated ?? !isSupabaseConfigured();

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-9 w-9" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            {simulated ? "Penyegerakan Selesai (Simulasi)" : "Penyegerakan Selesai"}
          </h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            <strong>{processed}</strong> rekod daripada{" "}
            <strong>{fileName}</strong>{" "}
            {simulated
              ? "diproses dalam mod demo — tiada penulisan ke pangkalan data."
              : "telah ditulis ke jadual induk melalui satu transaksi atomic."}
          </p>
        </div>

        <div className="grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
          <DoneStat label="Diproses" value={processed} tone="text-emerald-700" />
          <DoneStat label="Digabungkan" value={merged} tone="text-sky-700" />
          <DoneStat label="Program Baharu" value={created} tone="text-primary" />
          <DoneStat label="Dibuang" value={discarded} tone="text-slate-500" />
        </div>

        {outcome && outcome.skipped > 0 && (
          <p className="max-w-lg text-xs text-amber-700">
            {outcome.skipped} rekod berjenis &quot;Tidak Dikenali&quot;
            dilangkau kerana pelayan hanya menerima sebut harga, invois dan
            kos.
          </p>
        )}

        {outcome && !outcome.simulated && (
          <p className="font-mono text-xs text-muted-foreground">
            Batch ID: {outcome.batchId}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onReset} className="mt-2">
            Muat Naik Fail Lain
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" className="mt-2">
              <LayoutDashboard className="h-4 w-4" />
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
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
