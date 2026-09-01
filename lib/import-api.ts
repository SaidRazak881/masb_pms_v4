/**
 * import-api.ts — Lapisan sambungan Frontend → API `/api/import/sync`
 * (Langkah 4.5 TPMS MIMOS Academy).
 *
 * Modul ini adalah SATU-SATUNYA tempat UI import bercakap dengan pelayan.
 * Ia bertanggungjawab untuk:
 *
 *   1. Mementaskan (staging) batch Excel ke Supabase — `import_batches`
 *      dan `import_staging` — supaya RPC `sync_import_transaction`
 *      mempunyai batch sebenar untuk dikunci (`FOR UPDATE`).
 *   2. Memetakan `StagingRecord` (bentuk parser/UI) kepada kontrak JSON
 *      yang diterima oleh `app/api/import/sync/route.ts`.
 *   3. Pengesahan awal di klien yang mencerminkan pengesahan pelayan,
 *      supaya pengguna mendapat mesej jelas sebelum rangkaian digunakan.
 *   4. Memanggil `POST /api/import/sync` dan menterjemah kod ralat
 *      (401/403/409/422/500) kepada mesej Bahasa Melayu yang boleh
 *      difahami pengguna.
 *
 * Nota atomicity: RPC pelayan adalah satu transaksi. Jika ia gagal,
 * TIADA perubahan separa disimpan — UI hanya perlu memaparkan ralat dan
 * membenarkan pengguna mencuba semula.
 */

import type {
  ParsedWorkbook,
  RecordAction,
  StagingRecord,
} from "@/lib/excel-parser";
import { toStagingRows } from "@/lib/excel-parser";

/* ====================== Kontrak API (request) ====================== */

/** Jenis entiti yang diterima oleh `/api/import/sync`. */
export type SyncEntityKind = "quotation" | "invoice" | "cost";

/** Tindakan yang diterima oleh `/api/import/sync` (tanpa `pending`). */
export type SyncAction =
  | "sync_confirmed"
  | "merged"
  | "created_new"
  | "discarded";

/** Satu rekod dalam payload `POST /api/import/sync`. */
export interface SyncApiRecord {
  /** ID tempatan UI — memudahkan penjejakan, diabaikan oleh pelayan. */
  id?: string;
  /** UUID baris `import_staging` supaya keputusan ditulis balik. */
  stagingId?: string | null;
  entityKind: SyncEntityKind;
  action: SyncAction;
  programmeId?: string | null;
  programmeCode?: string | null;
  duplicateMatchId?: string | null;
  programmeTitle: string;
  clientName?: string | null;
  referenceNo?: string | null;
  referenceType?: string | null;
  amount: number | null;
  currency?: string;
  docDate?: string | null;
  fiscalYear?: number | null;
  category?: string | null;
  trainer?: string | null;
  deliveryMode?: string | null;
  statusRaw?: string | null;
  description?: string | null;
  rawPayload?: Record<string, string>;
}

export interface SyncRequestPayload {
  batchId: string;
  records: SyncApiRecord[];
}

/* ====================== Kontrak API (response) ====================== */

/** Nilai `result` yang dipulangkan oleh RPC `sync_import_transaction`. */
export interface SyncRpcResult {
  success: boolean;
  batch_id: string;
  processed: number;
  created: number;
  merged: number;
  discarded: number;
  failed: number;
}

interface SyncApiSuccessBody {
  success: true;
  result: SyncRpcResult;
}

interface SyncApiErrorBody {
  success: false;
  error: { code: string; message: string };
}

/** Ringkasan yang dipaparkan oleh skrin "Penyegerakan Selesai". */
export interface SyncOutcome {
  batchId: string;
  processed: number;
  created: number;
  merged: number;
  discarded: number;
  failed: number;
  /** Rekod jenis `unknown` yang tidak dihantar ke pelayan. */
  skipped: number;
  /** `true` apabila Supabase belum dikonfigurasikan (mod demo tempatan). */
  simulated: boolean;
}

/* ========================= Ralat bersepadu ========================= */

export type ImportSyncErrorCode =
  | "UNAUTHENTICATED"
  | "VALIDATION_ERROR"
  | "INVALID_JSON"
  | "GOVERNANCE_LOCKED"
  | "FOREIGN_KEY_ERROR"
  | "DUPLICATE_ERROR"
  | "DATA_VALIDATION_ERROR"
  | "RLS_OR_ROLE_DENIED"
  | "SYNC_TRANSACTION_FAILED"
  | "METHOD_NOT_ALLOWED"
  | "INTERNAL_ERROR"
  | "STAGING_FAILED"
  | "NETWORK_ERROR"
  | "CLIENT_VALIDATION_ERROR";

/**
 * Ralat penyegerakan import yang membawa kod pelayan + status HTTP
 * supaya UI boleh memaparkan panduan pemulihan yang tepat.
 */
export class ImportSyncError extends Error {
  readonly code: ImportSyncErrorCode | string;
  readonly status: number;
  /** Butiran tambahan (cth. senarai baris yang gagal pengesahan klien). */
  readonly details: string[];

  constructor(
    code: ImportSyncErrorCode | string,
    message: string,
    status = 0,
    details: string[] = [],
  ) {
    super(message);
    this.name = "ImportSyncError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/** Panduan tindakan pemulihan mengikut kod ralat. */
export function syncErrorHint(code: string): string {
  switch (code) {
    case "UNAUTHENTICATED":
      return "Sila log masuk semula, kemudian ulang penyegerakan. Tiada data ditulis.";
    case "RLS_OR_ROLE_DENIED":
      return "Akaun anda tiada peranan (admin/staff/finance/head_governance) untuk menyegerakkan import.";
    case "GOVERNANCE_LOCKED":
      return "Program terlibat telah dikunci oleh Governance. Pilih 'Cipta Baharu' atau minta Head Governance membuka kunci.";
    case "FOREIGN_KEY_ERROR":
      return "Rujukan rekod induk tidak ditemui. Muat naik semula fail supaya batch staging dijana semula.";
    case "DUPLICATE_ERROR":
      return "Data pendua dikesan pada peringkat pangkalan data. Semak semula rekod bertanda 'Perlu Semak'.";
    case "DATA_VALIDATION_ERROR":
    case "VALIDATION_ERROR":
    case "CLIENT_VALIDATION_ERROR":
      return "Betulkan baris yang ditanda, atau buang baris tersebut, sebelum menyegerak semula.";
    case "STAGING_FAILED":
      return "Batch staging gagal disimpan. Semak sambungan Supabase dan cuba lagi.";
    case "NETWORK_ERROR":
      return "Sambungan ke pelayan terputus. Tiada perubahan disimpan — cuba semula.";
    default:
      return "Transaksi adalah atomic — tiada perubahan separa disimpan. Sila cuba semula.";
  }
}

/* =========================== Utiliti kecil =========================== */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Jana UUID v4 (guna `crypto.randomUUID` bila tersedia). */
export function newUuid(): string {
  const cryptoRef =
    typeof globalThis !== "undefined"
      ? (globalThis.crypto as Crypto | undefined)
      : undefined;

  if (cryptoRef?.randomUUID) return cryptoRef.randomUUID();

  const bytes = new Uint8Array(16);
  if (cryptoRef?.getRandomValues) {
    cryptoRef.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versi 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // varian 10x
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Adakah pemboleh ubah persekitaran Supabase tersedia di klien? */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Rekod yang sudah diputuskan (bukan `pending`). */
export function isDecided(record: StagingRecord): boolean {
  return record.action !== "pending";
}

/** Rekod yang boleh dihantar ke API (jenis entiti disokong pelayan). */
export function isSyncable(record: StagingRecord): boolean {
  return (
    isDecided(record) &&
    (record.entityKind === "quotation" ||
      record.entityKind === "invoice" ||
      record.entityKind === "cost")
  );
}

/* ==================== Pemetaan StagingRecord → API ==================== */

/**
 * Petakan satu `StagingRecord` UI kepada rekod kontrak API.
 *
 * `stagingId` ialah UUID baris `import_staging` yang sepadan (jika batch
 * telah dipentaskan ke Supabase); ia membolehkan RPC menandakan keputusan
 * (`decided_at` / `decided_by`) pada baris staging yang betul.
 */
export function toSyncRecord(
  record: StagingRecord,
  stagingId?: string | null,
): SyncApiRecord {
  const duplicateId = record.duplicate?.matchId ?? null;
  // Pelayan hanya menerima UUID. Padanan berasaskan rujukan teks
  // (cth. "MAC/INV/2024/014") bukan ID program, jadi ia tidak dihantar.
  const duplicateUuid = isUuid(duplicateId) ? duplicateId : null;

  return {
    id: record.id,
    stagingId: stagingId ?? null,
    entityKind: record.entityKind as SyncEntityKind,
    action: record.action as SyncAction,
    // `merged` mengunci rekod kepada program sedia ada; tindakan lain
    // membiarkan pelayan menyelesaikan padanan tajuk/pelanggan sendiri.
    programmeId: record.action === "merged" ? duplicateUuid : null,
    programmeCode: null,
    duplicateMatchId: record.action === "merged" ? duplicateUuid : null,
    programmeTitle: record.programmeTitle.trim(),
    clientName: trimOrNull(record.clientName),
    referenceNo: trimOrNull(record.referenceNo),
    referenceType: trimOrNull(record.referenceType),
    amount: record.amount,
    currency: trimOrNull(record.currency) ?? "MYR",
    docDate: record.docDate || null,
    fiscalYear: record.year ?? null,
    category: trimOrNull(record.category),
    trainer: trimOrNull(record.trainer),
    deliveryMode: trimOrNull(record.mode),
    statusRaw: trimOrNull(record.status),
    description: trimOrNull(record.description),
    rawPayload: record.raw ?? {},
  };
}

/**
 * Pengesahan klien yang mencerminkan `validateBody()` pelayan supaya
 * pengguna tidak perlu menunggu perjalanan rangkaian untuk ralat jelas.
 *
 * @returns senarai mesej ralat (kosong bermakna payload sah).
 */
export function validateSyncPayload(payload: SyncRequestPayload): string[] {
  const issues: string[] = [];

  if (!isUuid(payload.batchId)) {
    issues.push("Batch ID tidak sah (UUID diperlukan).");
  }

  if (payload.records.length === 0) {
    issues.push(
      "Tiada rekod berkeputusan untuk disegerakkan. Sahkan sekurang-kurangnya satu baris.",
    );
  }

  if (payload.records.length > 2000) {
    issues.push(
      `Maksimum 2,000 rekod setiap transaksi — fail ini mempunyai ${payload.records.length} rekod berkeputusan.`,
    );
  }

  payload.records.forEach((r, index) => {
    const label = r.referenceNo || r.programmeTitle || `Rekod #${index + 1}`;

    if (!r.programmeTitle) {
      issues.push(`${label}: tajuk program diperlukan.`);
    }
    if (r.action !== "discarded" && r.amount === null) {
      issues.push(`${label}: amaun diperlukan sebelum penyegerakan.`);
    }
    if (r.amount !== null && !Number.isFinite(r.amount)) {
      issues.push(`${label}: amaun bukan nombor yang sah.`);
    }
    if (r.docDate && !/^\d{4}-\d{2}-\d{2}$/.test(r.docDate)) {
      issues.push(`${label}: tarikh mesti dalam format YYYY-MM-DD.`);
    }
    if (r.action === "merged" && !isUuid(r.duplicateMatchId)) {
      issues.push(
        `${label}: gabungan memerlukan rekod induk Supabase yang sah — pilih "Cipta Baharu" jika padanan hanya berdasarkan rujukan teks.`,
      );
    }
    if (
      r.action !== "discarded" &&
      (r.entityKind === "quotation" || r.entityKind === "invoice") &&
      !r.referenceNo
    ) {
      issues.push(
        `${label}: nombor rujukan ${r.entityKind === "invoice" ? "invois" : "sebut harga"} diperlukan.`,
      );
    }
  });

  // Hadkan senarai supaya UI kekal boleh dibaca.
  return issues.slice(0, 12);
}

/* ================== Langkah 1: pentaskan batch staging ================== */

export interface StagedBatch {
  batchId: string;
  /** Peta `StagingRecord.id` (tempatan) → UUID baris `import_staging`. */
  stagingIds: Map<string, string>;
}

/**
 * Sisipkan `import_batches` + `import_staging` melalui Supabase browser
 * client. UUID baris dijana di klien supaya pemetaan kepada rekod UI
 * kekal tepat tanpa bergantung pada susunan yang dipulangkan.
 */
export async function stageWorkbook(
  workbook: ParsedWorkbook,
  records: StagingRecord[],
): Promise<StagedBatch> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new ImportSyncError(
      "UNAUTHENTICATED",
      "Sesi pengguna tidak sah atau telah tamat.",
      401,
    );
  }

  const batchId = newUuid();

  const { error: batchError } = await supabase.from("import_batches").insert({
    id: batchId,
    created_by: user.id,
    source_file: workbook.fileName,
    file_name: workbook.fileName,
    total_rows: workbook.totalRows,
    valid_rows: workbook.validCount,
    invalid_rows: workbook.invalidCount,
    duplicate_rows: workbook.duplicateCount,
    status: "reviewed",
  });

  if (batchError) {
    throw new ImportSyncError(
      "STAGING_FAILED",
      `Batch import gagal dicipta: ${batchError.message}`,
      500,
    );
  }

  // `toStagingRows()` mengekalkan susunan `workbook.records`, jadi kedua-dua
  // tatasusunan boleh dizip untuk memetakan ID tempatan → UUID staging.
  const stagingRows = toStagingRows(workbook);
  const stagingIds = new Map<string, string>();

  const decided = new Set(records.filter(isDecided).map((r) => r.id));
  const actionById = new Map<string, RecordAction>(
    records.map((r) => [r.id, r.action]),
  );

  const payload = stagingRows.map((row, index) => {
    const source = workbook.records[index];
    const id = newUuid();
    stagingIds.set(source.id, id);
    return {
      ...row,
      id,
      batch_id: batchId,
      imported_by: user.id,
      // Keputusan sebenar ditulis oleh RPC; di sini kekalkan `pending`
      // untuk baris yang belum diputuskan supaya jejak audit jelas.
      suggested_action: decided.has(source.id)
        ? (actionById.get(source.id) ?? "pending")
        : "pending",
    };
  });

  // Sisip berkelompok supaya fail besar tidak melebihi had saiz permintaan.
  const CHUNK = 500;
  for (let i = 0; i < payload.length; i += CHUNK) {
    const { error } = await supabase
      .from("import_staging")
      .insert(payload.slice(i, i + CHUNK));

    if (error) {
      throw new ImportSyncError(
        "STAGING_FAILED",
        `Baris staging gagal disimpan: ${error.message}`,
        500,
      );
    }
  }

  return { batchId, stagingIds };
}

/* ================== Langkah 2: panggil /api/import/sync ================== */

/** Hantar payload ke `POST /api/import/sync` dan tafsirkan responsnya. */
export async function postSync(
  payload: SyncRequestPayload,
  signal?: AbortSignal,
): Promise<SyncRpcResult> {
  let response: Response;

  try {
    response = await fetch("/api/import/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    throw new ImportSyncError(
      "NETWORK_ERROR",
      `Tidak dapat menghubungi pelayan: ${
        error instanceof Error ? error.message : "ralat rangkaian"
      }`,
      0,
    );
  }

  let body: SyncApiSuccessBody | SyncApiErrorBody | null = null;
  try {
    body = (await response.json()) as SyncApiSuccessBody | SyncApiErrorBody;
  } catch {
    body = null;
  }

  if (!response.ok || !body || body.success === false) {
    const error = body && body.success === false ? body.error : null;
    throw new ImportSyncError(
      error?.code ?? "INTERNAL_ERROR",
      error?.message ??
        `Penyegerakan gagal dengan status HTTP ${response.status}.`,
      response.status,
    );
  }

  return body.result;
}

/* ===================== Orkestrasi penuh untuk UI ===================== */

export interface SyncWorkbookOptions {
  workbook: ParsedWorkbook;
  records: StagingRecord[];
  signal?: AbortSignal;
  /** Dipanggil untuk memaparkan kemajuan langkah demi langkah. */
  onProgress?: (message: string) => void;
}

/**
 * Aliran lengkap "Confirm & Sync to Master":
 *
 *   parse → pentaskan batch → POST /api/import/sync → ringkasan.
 *
 * Tanpa konfigurasi Supabase, aliran yang sama dijalankan secara tempatan
 * (mod demo) supaya UI Mock kekal boleh diuji tanpa pangkalan data.
 */
export async function syncWorkbook({
  workbook,
  records,
  signal,
  onProgress,
}: SyncWorkbookOptions): Promise<SyncOutcome> {
  const decided = records.filter(isDecided);
  const sendable = decided.filter(isSyncable);
  const skipped = decided.length - sendable.length;

  if (decided.length === 0) {
    throw new ImportSyncError(
      "CLIENT_VALIDATION_ERROR",
      "Tiada rekod berkeputusan untuk disegerakkan.",
      0,
    );
  }

  // ---- Mod demo: tiada Supabase, jangan panggil API yang pasti gagal ----
  if (!isSupabaseConfigured()) {
    onProgress?.("Mod demo — mensimulasikan transaksi tanpa Supabase…");
    return {
      batchId: newUuid(),
      processed: sendable.filter((r) => r.action !== "discarded").length,
      created: sendable.filter((r) => r.action === "created_new").length,
      merged: sendable.filter((r) => r.action === "merged").length,
      discarded: decided.filter((r) => r.action === "discarded").length,
      failed: 0,
      skipped,
      simulated: true,
    };
  }

  onProgress?.("Mementaskan batch ke import_staging…");
  const { batchId, stagingIds } = await stageWorkbook(workbook, records);

  const payload: SyncRequestPayload = {
    batchId,
    records: sendable.map((r) => toSyncRecord(r, stagingIds.get(r.id) ?? null)),
  };

  const issues = validateSyncPayload(payload);
  if (issues.length > 0) {
    throw new ImportSyncError(
      "CLIENT_VALIDATION_ERROR",
      "Beberapa rekod belum memenuhi syarat penyegerakan.",
      0,
      issues,
    );
  }

  onProgress?.(`Menghantar ${payload.records.length} rekod ke pelayan…`);
  const result = await postSync(payload, signal);

  return {
    batchId: result.batch_id ?? batchId,
    processed: result.processed ?? 0,
    created: result.created ?? 0,
    merged: result.merged ?? 0,
    discarded: result.discarded ?? 0,
    failed: result.failed ?? 0,
    skipped,
    simulated: false,
  };
}
