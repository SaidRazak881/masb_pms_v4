import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENTITY_KINDS = new Set(["quotation", "invoice", "cost"]);
const ACTIONS = new Set([
  "sync_confirmed",
  "merged",
  "created_new",
  "discarded",
]);

interface SyncInputRecord {
  id?: string;
  stagingId?: string | null;
  entityKind: "quotation" | "invoice" | "cost";
  action: "sync_confirmed" | "merged" | "created_new" | "discarded";
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

interface SyncRequestBody {
  batchId: string;
  records: SyncInputRecord[];
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function isFiniteNumberOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isValidDateOrNull(value: unknown): value is string | null | undefined {
  if (value === undefined || value === null || value === "") return true;
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateBody(body: unknown): { value?: SyncRequestBody; error?: string } {
  if (!body || typeof body !== "object") {
    return { error: "Payload JSON tidak sah." };
  }

  const candidate = body as Record<string, unknown>;
  if (!isUuid(candidate.batchId)) {
    return { error: "batchId mesti UUID yang sah." };
  }

  if (!Array.isArray(candidate.records) || candidate.records.length === 0) {
    return { error: "records mesti berupa array dan sekurang-kurangnya satu rekod diperlukan." };
  }

  if (candidate.records.length > 2000) {
    return { error: "Maksimum 2,000 rekod boleh disegerakkan dalam satu transaksi." };
  }

  for (let index = 0; index < candidate.records.length; index += 1) {
    const record = candidate.records[index];
    if (!record || typeof record !== "object") {
      return { error: `Rekod #${index + 1} tidak sah.` };
    }

    const r = record as Record<string, unknown>;
    if (!ENTITY_KINDS.has(r.entityKind as string)) {
      return { error: `Rekod #${index + 1}: entityKind mesti quotation, invoice atau cost.` };
    }
    if (!ACTIONS.has(r.action as string)) {
      return { error: `Rekod #${index + 1}: action tidak sah.` };
    }
    if (typeof r.programmeTitle !== "string" || !r.programmeTitle.trim()) {
      return { error: `Rekod #${index + 1}: programmeTitle diperlukan.` };
    }
    if (!isFiniteNumberOrNull(r.amount)) {
      return { error: `Rekod #${index + 1}: amount mesti nombor atau null.` };
    }
    if (!isValidDateOrNull(r.docDate)) {
      return { error: `Rekod #${index + 1}: docDate mesti YYYY-MM-DD.` };
    }
    if (r.stagingId !== undefined && r.stagingId !== null && r.stagingId !== "" && !isUuid(r.stagingId)) {
      return { error: `Rekod #${index + 1}: stagingId mesti UUID.` };
    }
    if (r.programmeId !== undefined && r.programmeId !== null && r.programmeId !== "" && !isUuid(r.programmeId)) {
      return { error: `Rekod #${index + 1}: programmeId mesti UUID.` };
    }
    if (r.duplicateMatchId !== undefined && r.duplicateMatchId !== null && r.duplicateMatchId !== "" && !isUuid(r.duplicateMatchId)) {
      return { error: `Rekod #${index + 1}: duplicateMatchId mesti UUID.` };
    }

    if (r.action === "merged" && !isUuid(r.duplicateMatchId)) {
      return { error: `Rekod #${index + 1}: merged memerlukan duplicateMatchId.` };
    }
  }

  return {
    value: {
      batchId: candidate.batchId as string,
      records: candidate.records as SyncInputRecord[],
    },
  };
}

function toRpcRow(record: SyncInputRecord) {
  return {
    staging_id: record.stagingId ?? null,
    entity_kind: record.entityKind,
    action: record.action,
    programme_id: record.programmeId ?? null,
    programme_code: record.programmeCode ?? null,
    duplicate_match_id: record.duplicateMatchId ?? null,
    programme_title: record.programmeTitle.trim(),
    client_name: record.clientName?.trim() || null,
    reference_no: record.referenceNo?.trim() || null,
    reference_type: record.referenceType?.trim() || null,
    amount: record.amount,
    currency: record.currency?.trim() || "MYR",
    doc_date: record.docDate || null,
    fiscal_year: record.fiscalYear ?? null,
    category: record.category?.trim() || null,
    trainer: record.trainer?.trim() || null,
    delivery_mode: record.deliveryMode?.trim() || null,
    status_raw: record.statusRaw?.trim() || null,
    description: record.description?.trim() || null,
    raw_payload: record.rawPayload ?? {},
  };
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Authentication is deliberately performed with the server client so the
    // user's JWT is retained. The RPC is SECURITY INVOKER, therefore RLS on
    // programmes/invoices/programme_costs/import_staging remains effective.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(401, "UNAUTHENTICATED", "Sesi pengguna tidak sah atau telah tamat.");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, "INVALID_JSON", "Request body bukan JSON yang sah.");
    }

    const validation = validateBody(body);
    if (validation.error || !validation.value) {
      return errorResponse(400, "VALIDATION_ERROR", validation.error ?? "Payload tidak sah.");
    }

    const { batchId, records } = validation.value;

    const { data, error } = await supabase.rpc("sync_import_transaction", {
      p_batch_id: batchId,
      p_rows: records.map(toRpcRow),
    });

    if (error) {
      const pgCode = error.code ?? "UNKNOWN";
      const message = error.message || "Sync transaksi gagal.";

      if (pgCode === "55000" || /dikunci|locked/i.test(message)) {
        return errorResponse(409, "GOVERNANCE_LOCKED", message);
      }

      if (pgCode === "23503") {
        return errorResponse(409, "FOREIGN_KEY_ERROR", message);
      }

      if (pgCode === "23505") {
        return errorResponse(409, "DUPLICATE_ERROR", message);
      }

      if (pgCode === "23514" || pgCode === "22023") {
        return errorResponse(422, "DATA_VALIDATION_ERROR", message);
      }

      if (pgCode === "42501") {
        return errorResponse(403, "RLS_OR_ROLE_DENIED", message);
      }

      console.error("TPMS import sync RPC failed", {
        batchId,
        userId: user.id,
        pgCode,
        message,
      });

      return errorResponse(500, "SYNC_TRANSACTION_FAILED", "Penyegerakan gagal. Tiada perubahan separa disimpan kerana transaksi adalah atomic.");
    }

    return NextResponse.json({
      success: true,
      result: data,
    });
  } catch (error) {
    console.error("TPMS /api/import/sync unexpected error", error);
    return errorResponse(500, "INTERNAL_ERROR", "Ralat dalaman berlaku semasa penyegerakan import.");
  }
}

export async function GET() {
  return errorResponse(405, "METHOD_NOT_ALLOWED", "Gunakan POST untuk penyegerakan import.");
}
