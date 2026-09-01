"use server";

/**
 * import-actions.ts — Server Actions untuk Sejarah Import (import_batches
 * & import_staging).
 *
 * Menyediakan:
 *   - getImportBatches()  — senarai batch muat naik Excel + ringkasan
 *   - getStagingRows(batchId) — baris staging bagi satu batch
 *
 * Dalam mod demo (tiada env Supabase), pulangan simulasi berdasarkan
 * mock-data supaya UI Sejarah Import boleh dilayari tanpa pangkalan data.
 */

import { createClient } from "@/lib/supabase/server";

import {
  batchStatusLabel,
  type ImportBatchSummary,
  type StagingRowSummary,
} from "@/lib/import-shared";

export async function getImportBatches(): Promise<ImportBatchSummary[]> {
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (hasSupabase) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("import_batches")
        .select(
          "id,source_file,created_at,created_by,total_rows,valid_rows,invalid_rows,duplicate_rows,status",
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data ?? []).map((b: {
        id: string;
        source_file: string;
        created_at: string;
        total_rows: number;
        valid_rows: number;
        invalid_rows: number;
        duplicate_rows: number;
        status: string;
      }) => ({
        id: b.id,
        sourceFile: b.source_file,
        uploadedAt: b.created_at,
        uploadedByName: null,
        totalRows: b.total_rows,
        validRows: b.valid_rows,
        invalidRows: b.invalid_rows,
        duplicateRows: b.duplicate_rows,
        status: (["staged", "reviewed", "synced", "discarded", "failed"].includes(b.status)
          ? b.status
          : "staged") as ImportBatchSummary["status"],
      }));
    } catch (error) {
      console.error("Sejarah import: gagal membaca Supabase:", error);
      return demoBatches();
    }
  }

  return demoBatches();
}

export async function getStagingRows(
  batchId: string,
): Promise<StagingRowSummary[]> {
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (hasSupabase) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("import_staging")
        .select(
          "id,entity_kind,reference_no,programme_title,client_name,amount,is_valid,duplicate_confidence,suggested_action,source_file,source_sheet,source_row",
        )
        .eq("batch_id", batchId)
        .order("source_row", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((r: {
        id: string;
        entity_kind: string;
        reference_no: string | null;
        programme_title: string | null;
        client_name: string | null;
        amount: number | null;
        is_valid: boolean;
        duplicate_confidence: string | null;
        suggested_action: string;
        source_file: string;
        source_sheet: string;
        source_row: number;
      }) => ({
        id: r.id,
        entityKind: r.entity_kind,
        referenceNo: r.reference_no,
        programmeTitle: r.programme_title,
        clientName: r.client_name,
        amount: r.amount,
        isValid: r.is_valid,
        duplicateConfidence: r.duplicate_confidence,
        suggestedAction: r.suggested_action,
        rawSource: {
          sourceFile: r.source_file,
          sourceSheet: r.source_sheet,
          sourceRow: r.source_row,
        },
      }));
    } catch (error) {
      console.error("Sejarah import: gagal membaca staging:", error);
      return [];
    }
  }

  return demoRows(batchId);
}

/* ====================== Data demo ====================== */

function demoBatches(): ImportBatchSummary[] {
  const now = Date.now();
  return [
    {
      id: "demo-batch-1",
      sourceFile: "00. Quotation Tracker (1).xlsx",
      uploadedAt: new Date(now - 6 * 3600_000).toISOString(),
      uploadedByName: "Nur Izzati Zailani",
      totalRows: 4,
      validRows: 3,
      invalidRows: 1,
      duplicateRows: 1,
      status: "reviewed",
    },
    {
      id: "demo-batch-2",
      sourceFile: "R1 MIMOS_Academy_INCOME_STATEMENT.xlsx",
      uploadedAt: new Date(now - 26 * 3600_000).toISOString(),
      uploadedByName: "Muhammad Fayyadh",
      totalRows: 3,
      validRows: 3,
      invalidRows: 0,
      duplicateRows: 0,
      status: "synced",
    },
    {
      id: "demo-batch-3",
      sourceFile: "invoice_2026.xlsx",
      uploadedAt: new Date(now - 72 * 3600_000).toISOString(),
      uploadedByName: "Adilah Nisman",
      totalRows: 5,
      validRows: 5,
      invalidRows: 0,
      duplicateRows: 2,
      status: "synced",
    },
  ];
}

function demoRows(batchId: string): StagingRowSummary[] {
  const rows: StagingRowSummary[] = [
    {
      id: `${batchId}-r1`,
      entityKind: "quotation",
      referenceNo: "MSSB/QT/TRA/2026/0001",
      programmeTitle: "Train The Trainer (TTT)",
      clientName: "KENANGA INVESTOR BERHAD",
      amount: 21000,
      isValid: true,
      duplicateConfidence: null,
      suggestedAction: "sync_confirmed",
      rawSource: { sourceFile: "00. Quotation Tracker (1).xlsx", sourceSheet: "Quotation Tracker", sourceRow: 2 },
    },
    {
      id: `${batchId}-r2`,
      entityKind: "quotation",
      referenceNo: "MSSB/QT/TRA/2026/0002",
      programmeTitle: "In-House AI Training for 20 pax",
      clientName: "SGS",
      amount: 21000,
      isValid: true,
      duplicateConfidence: null,
      suggestedAction: "sync_confirmed",
      rawSource: { sourceFile: "00. Quotation Tracker (1).xlsx", sourceSheet: "Quotation Tracker", sourceRow: 3 },
    },
    {
      id: `${batchId}-r3`,
      entityKind: "quotation",
      referenceNo: "MSSB/QT/TRA/2026/0003",
      programmeTitle: "Train The Trainer (TTT)",
      clientName: "MDEC",
      amount: 10500,
      isValid: false,
      duplicateConfidence: "high",
      suggestedAction: "pending",
      rawSource: { sourceFile: "00. Quotation Tracker (1).xlsx", sourceSheet: "Quotation Tracker", sourceRow: 4 },
    },
  ];
  return rows.filter((_, i) => (batchId === "demo-batch-1" ? i < 4 : i < 2));
}
