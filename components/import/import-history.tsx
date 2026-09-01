"use client";

/**
 * ImportHistory — Sejarah batch import Excel.
 *
 * Memaparkan senarai batch (fail) yang dimuat naik ke sistem beserta status
 * pemprosesan. Klik satu batch untuk melihat baris staging individu.
 * Data dibaca daripada jadual `import_batches` / `import_staging` melalui
 * server actions; dalam mod demo, dipaparkan data simulasi.
 */

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, FileSpreadsheet, Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatMYRShort } from "@/lib/format";
import {
  batchStatusLabel,
  type ImportBatchSummary,
  type StagingRowSummary,
} from "@/lib/import-shared";
import { getImportBatches, getStagingRows } from "@/lib/actions/import-actions";

const STATUS_TONE: Record<ImportBatchSummary["status"], string> = {
  staged: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  reviewed: "bg-sky-100 text-sky-800 hover:bg-sky-100",
  synced: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  discarded: "bg-slate-200 text-slate-700 hover:bg-slate-200",
  failed: "bg-rose-100 text-rose-800 hover:bg-rose-100",
};

const ACTION_LABEL: Record<string, string> = {
  pending: "Menunggu",
  sync_confirmed: "Sync disahkan",
  merged: "Digabung",
  created_new: "Program baharu",
  discarded: "Dibuang",
};

export function ImportHistory() {
  const [batches, setBatches] = useState<ImportBatchSummary[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, StagingRowSummary[]>>({});
  const [loadingRows, setLoadingRows] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getImportBatches();
        if (!cancelled) setBatches(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat sejarah import.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(batchId: string) {
    if (expanded === batchId) {
      setExpanded(null);
      return;
    }
    setExpanded(batchId);
    if (!rows[batchId]) {
      setLoadingRows(batchId);
      try {
        const data = await getStagingRows(batchId);
        setRows((r) => ({ ...r, [batchId]: data }));
      } finally {
        setLoadingRows(null);
      }
    }
  }

  if (batches === null && !error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Memuat sejarah import…
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-rose-600">{error}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Inbox className="h-4 w-4" />
          Sejarah Import (batch)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {batches!.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Belum ada fail Excel dimuat naik. Pergi ke tab “Muat Naik &amp;
            Semakan” untuk bermula.
          </p>
        )}

        {batches!.map((b) => (
          <div key={b.id} className="rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => toggle(b.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
            >
              {expanded === b.id ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <FileSpreadsheet className="h-5 w-5 shrink-0 text-emerald-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{b.sourceFile}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(b.uploadedAt)}
                  {b.uploadedByName ? ` · oleh ${b.uploadedByName}` : ""}
                </p>
              </div>
              <div className="hidden gap-3 text-xs text-muted-foreground sm:flex">
                <span>{b.totalRows} baris</span>
                <span className="text-emerald-600">{b.validRows} sah</span>
                {b.invalidRows > 0 && (
                  <span className="text-rose-600">{b.invalidRows} bermasalah</span>
                )}
                {b.duplicateRows > 0 && (
                  <span className="text-amber-600">{b.duplicateRows} pendua</span>
                )}
              </div>
              <Badge className={STATUS_TONE[b.status]} variant="outline">
                {batchStatusLabel(b.status)}
              </Badge>
            </button>

            {expanded === b.id && (
              <div className="border-t border-slate-100 px-4 py-3">
                {loadingRows === b.id && (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    Memuat baris staging…
                  </p>
                )}
                {rows[b.id] && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Rujukan</TableHead>
                        <TableHead>Program / Klien</TableHead>
                        <TableHead className="text-right">Amaun</TableHead>
                        <TableHead>Pengesahan</TableHead>
                        <TableHead>Tindakan</TableHead>
                        <TableHead className="text-right">Baris Excel</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows[b.id].length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-16 text-center text-muted-foreground">
                            Tiada baris staging untuk batch ini.
                          </TableCell>
                        </TableRow>
                      )}
                      {rows[b.id].map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs uppercase">
                            {r.entityKind}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {r.referenceNo ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            <p className="font-medium">{r.programmeTitle ?? "—"}</p>
                            <p className="text-muted-foreground">{r.clientName ?? ""}</p>
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {r.amount != null ? formatMYRShort(r.amount) : "—"}
                          </TableCell>
                          <TableCell>
                            {r.isValid ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                                Sah
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-rose-50 text-rose-700">
                                Bermasalah
                              </Badge>
                            )}
                            {r.duplicateConfidence && r.duplicateConfidence !== "none" && (
                              <Badge variant="outline" className="ml-1 bg-amber-50 text-amber-700">
                                Pendua ({r.duplicateConfidence})
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {ACTION_LABEL[r.suggestedAction] ?? r.suggestedAction}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {r.rawSource.sourceSheet}:{r.rawSource.sourceRow}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
