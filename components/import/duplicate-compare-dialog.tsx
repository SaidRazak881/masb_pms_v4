"use client";

import {
  ArrowLeftRight,
  CheckCircle2,
  CopyPlus,
  GitMerge,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ENTITY_KIND_LABEL,
  type RecordAction,
  type StagingRecord,
} from "@/lib/excel-parser";
import { formatMYRShort } from "@/lib/format";

/** Medan yang dibandingkan secara sisi-bersisi. */
const DIFF_FIELDS = [
  "Program",
  "Pelanggan",
  "Rujukan",
  "Nilai Kontrak (RM)",
  "Tahun",
  "Status",
] as const;

export function DuplicateCompareDialog({
  record,
  open,
  onClose,
  onAction,
}: {
  record: StagingRecord | null;
  open: boolean;
  onClose: () => void;
  onAction: (action: RecordAction) => void;
}) {
  if (!record) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const dup = record.duplicate;
  const incoming: Record<string, string> = {
    Program: record.programmeTitle || "(kosong)",
    Pelanggan: record.clientName || "(kosong)",
    Rujukan: record.referenceNo || "(tiada rujukan)",
    "Nilai Kontrak (RM)":
      record.amount !== null ? formatMYRShort(record.amount) : "(kosong)",
    Tahun: record.year ? String(record.year) : "—",
    Status: record.status || "—",
  };

  const master: Record<string, string> = dup?.masterValues ?? {};

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-amber-600" />
            Kemungkinan Data Bertindih (Duplicate)
          </DialogTitle>
          <DialogDescription>
            Baris <strong>#{record.rowNumber}</strong> ({ENTITY_KIND_LABEL[record.entityKind]})
            {" "}dari sheet <strong>{record.sheetName}</strong> sepadan dengan
            rekod sedia ada di dalam sistem. Bandingkan dan pilih tindakan.
          </DialogDescription>
        </DialogHeader>

        {dup && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <Badge variant={dup.confidence === "high" ? "destructive" : "warning"}>
                {dup.confidence === "high" ? "Padanan Tinggi" : "Persamaan Meragukan"}
              </Badge>
              <p className="text-sm text-amber-900">{dup.reason}</p>
            </div>

            {/* Jadual perbandingan sisi-bersisi */}
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="w-40 p-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Medan
                    </th>
                    <th className="p-2.5 text-left">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sky-700">
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Data Dari Excel (Baru)
                      </span>
                    </th>
                    <th className="p-2.5 text-left">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Rekod Dalam Sistem (Induk)
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DIFF_FIELDS.map((field) => {
                    const a = incoming[field] ?? "—";
                    const b = master[field] ?? "—";
                    const differ = normalize(a) !== normalize(b);
                    return (
                      <tr key={field} className="border-t">
                        <td className="p-2.5 text-xs font-medium text-muted-foreground">
                          {field}
                        </td>
                        <td
                          className={`p-2.5 ${
                            differ && b !== "—"
                              ? "bg-sky-50 font-medium"
                              : ""
                          }`}
                        >
                          <span className="flex items-start gap-2">
                            {differ && b !== "—" && (
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                            )}
                            <span className="break-words">{a}</span>
                          </span>
                        </td>
                        <td
                          className={`p-2.5 ${
                            differ && b !== "—"
                              ? "bg-emerald-50"
                              : "text-muted-foreground"
                          }`}
                        >
                          <span className="flex items-start gap-2">
                            {differ && b !== "—" && (
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            )}
                            <span className="break-words">{b}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              Medan yang berlainan diserlahkan. Padanan rujukan tepat hampir
              pasti adalah rekod yang sama — elakkan mencipta rekod baharu.
            </p>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            onClick={() => onAction("discarded")}
          >
            <Trash2 className="h-4 w-4" />
            Discard (Buang)
          </Button>
          <Button variant="outline" onClick={() => onAction("created_new")}>
            <CopyPlus className="h-4 w-4" />
            Create New Programme
          </Button>
          <Button onClick={() => onAction("merged")}>
            <GitMerge className="h-4 w-4" />
            Merge with Existing Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function normalize(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, " ");
}
