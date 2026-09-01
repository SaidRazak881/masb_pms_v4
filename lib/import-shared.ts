/**
 * import-shared.ts — Jenis & label kongsi untuk modul Import Excel.
 *
 * Modul ini TIDAK mengandungi "use server" supaya boleh diimport oleh
 * server actions dan komponen UI tanpa melanggar peraturan fail
 * server actions (fungsi eksport mestilah async).
 */

export interface ImportBatchSummary {
  id: string;
  sourceFile: string;
  uploadedAt: string;
  uploadedByName: string | null;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  status: "staged" | "reviewed" | "synced" | "discarded" | "failed";
}

export interface StagingRowSummary {
  id: string;
  entityKind: string;
  referenceNo: string | null;
  programmeTitle: string | null;
  clientName: string | null;
  amount: number | null;
  isValid: boolean;
  duplicateConfidence: string | null;
  suggestedAction: string;
  rawSource: { sourceFile: string; sourceSheet: string; sourceRow: number };
}

const BATCH_STATUS_LABEL: Record<ImportBatchSummary["status"], string> = {
  staged: "Dalam staging",
  reviewed: "Sedang disemak",
  synced: "Diselaraskan",
  discarded: "Dibuang",
  failed: "Gagal",
};

export function batchStatusLabel(status: ImportBatchSummary["status"]): string {
  return BATCH_STATUS_LABEL[status] ?? status;
}
