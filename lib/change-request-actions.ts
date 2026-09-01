"use server";

/**
 * change-request-actions.ts — Server Actions Change Requests.
 *
 * Tindakan (submit / review / cancel) memanggil RPC atomik dalam
 * `lib/supabase/change-requests.sql`. Semua peraturan disahkan SEMULA di
 * pelayan (bukan hanya UI):
 *
 *   - `submit_change_request`  → hanya untuk program yang dikunci,
 *                                satu pending setiap medan, sebab ≥ 10 aksara
 *   - `review_change_request`  → head_governance / admin / manager sahaja,
 *                                tanpa self-approval
 *   - `cancel_change_request`  → pemohon sendiri, status masih pending
 *
 * Mod demo: apabila env Supabase tiada, tindakan disimulasikan supaya UI
 * boleh diuji tanpa pangkalan data.
 */

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  validateChangeRequest,
  type ChangeRequest,
  type ChangeRequestStatus,
} from "@/lib/change-requests";

export interface ChangeRequestActionResult<T = undefined> {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  data?: T;
}

function fail(message: string, fieldErrors?: Record<string, string>): ChangeRequestActionResult<never> {
  return { ok: false, message, fieldErrors };
}

function isDemoMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function translateError(error: { code?: string; message?: string }): string {
  const raw = error.message ?? "";
  if (raw.includes("CHANGE_REQUEST_PENDING_EXISTS")) {
    return "Sudah ada permohonan menunggu kelulusan bagi medan ini.";
  }
  if (raw.includes("PROGRAMME_NOT_LOCKED")) {
    return "Program ini tidak berkunci — anda boleh mengedit terus.";
  }
  if (raw.includes("PROGRAMME_NOT_FOUND")) {
    return "Program tidak ditemui.";
  }
  if (raw.includes("FIELD_NOT_ALLOWED")) {
    return "Medan tersebut tidak dibenarkan untuk diminta diubah.";
  }
  if (raw.includes("REASON_TOO_SHORT")) {
    return "Sebab permohonan terlalu pendek (minimum 10 aksara).";
  }
  if (raw.includes("NO_CHANGE_VALUE")) {
    return "Sila isi nilai lama atau nilai baharu.";
  }
  if (raw.includes("REQUEST_NOT_FOUND")) {
    return "Permohonan tidak ditemui.";
  }
  if (raw.includes("REQUEST_NOT_PENDING")) {
    return "Permohonan ini telah diputuskan atau dibatalkan.";
  }
  if (raw.includes("CHANGE_SELF_APPROVAL")) {
    return "Pemohon tidak boleh meluluskan permohonan sendiri (pengasingan tugas).";
  }
  if (raw.includes("FORBIDDEN") || error.code === "42501") {
    return "Anda tiada kebenaran untuk melakukan tindakan ini.";
  }
  if (error.code === "PGRST301" || raw.includes("JWT")) {
    return "Sesi anda telah tamat. Sila log masuk semula.";
  }
  return "Ralat pelayan semasa memproses permohonan. Sila cuba sekali lagi.";
}

function revalidateProgramme(programmeId: string) {
  revalidatePath(`/programmes/${programmeId}`);
  revalidatePath("/programmes");
  revalidatePath("/dashboard");
}

/* ====================== 1. Hantar permohonan ====================== */

export async function submitChangeRequestAction(
  formData: FormData,
): Promise<ChangeRequestActionResult<{ requestId: string }>> {
  const programmeId = String(formData.get("programmeId") ?? "");
  const fieldName = String(formData.get("fieldName") ?? "");
  const oldValue = String(formData.get("oldValue") ?? "");
  const newValue = String(formData.get("newValue") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const documentUrl = String(formData.get("supportingDocumentUrl") ?? "") || null;

  if (!programmeId) {
    return fail("ID program tidak sah.");
  }

  // Pengesahan bersama (klien + pelayan)
  const validation = validateChangeRequest({ fieldName, oldValue, newValue, reason });
  if (!validation.ok) {
    return fail("Sila betulkan borang permohonan.", validation.fieldErrors);
  }

  if (isDemoMode()) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      ok: true,
      message: "Permohonan ubah data dihantar (mod demo).",
      data: { requestId: `demo-cr-${Date.now()}` },
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_change_request", {
      p_programme_id: programmeId,
      p_field_name: fieldName,
      p_old_value: oldValue || null,
      p_new_value: newValue || null,
      p_reason: reason,
      p_supporting_document_url: documentUrl,
    });

    if (error) {
      return fail(translateError(error));
    }

    revalidateProgramme(programmeId);
    return {
      ok: true,
      message: "Permohonan ubah data telah dihantar untuk kelulusan Head Governance.",
      data: { requestId: String(data) },
    };
  } catch (error) {
    console.error("submit_change_request:", error);
    return fail("Ralat pelayan semasa menghantar permohonan.");
  }
}

/* ====================== 2. Lulus / tolak ====================== */

export async function reviewChangeRequestAction(
  formData: FormData,
): Promise<ChangeRequestActionResult> {
  const requestId = String(formData.get("requestId") ?? "");
  const programmeId = String(formData.get("programmeId") ?? "");
  const approve = formData.get("approve") === "true";
  const reviewNote = String(formData.get("reviewNote") ?? "") || null;

  if (!requestId) return fail("ID permohonan tidak sah.");

  if (isDemoMode()) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      ok: true,
      message: approve
        ? "Permohonan diluluskan (mod demo)."
        : "Permohonan ditolak (mod demo).",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("review_change_request", {
      p_request_id: requestId,
      p_approve: approve,
      p_review_note: reviewNote,
    });

    if (error) {
      return fail(translateError(error));
    }

    if (programmeId) revalidateProgramme(programmeId);
    return {
      ok: true,
      message: approve
        ? "Permohonan diluluskan. Nilai baharu boleh dikemas kini oleh pasukan."
        : "Permohonan ditolak. Staff dimaklumkan melalui sejarah permohonan.",
    };
  } catch (error) {
    console.error("review_change_request:", error);
    return fail("Ralat pelayan semasa memproses kelulusan.");
  }
}

/* ====================== 3. Batal permohonan sendiri ====================== */

export async function cancelChangeRequestAction(
  formData: FormData,
): Promise<ChangeRequestActionResult> {
  const requestId = String(formData.get("requestId") ?? "");
  const programmeId = String(formData.get("programmeId") ?? "");

  if (!requestId) return fail("ID permohonan tidak sah.");

  if (isDemoMode()) {
    await new Promise((r) => setTimeout(r, 300));
    return { ok: true, message: "Permohonan dibatalkan (mod demo)." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("cancel_change_request", {
      p_request_id: requestId,
    });

    if (error) {
      return fail(translateError(error));
    }

    if (programmeId) revalidateProgramme(programmeId);
    return { ok: true, message: "Permohonan telah dibatalkan." };
  } catch (error) {
    console.error("cancel_change_request:", error);
    return fail("Ralat pelayan semasa membatalkan permohonan.");
  }
}

/* ====================== 4. Senarai permohonan ====================== */

export async function listChangeRequests(
  programmeId: string,
): Promise<ChangeRequest[]> {
  if (isDemoMode()) {
    return demoChangeRequests(programmeId);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("change_requests")
      .select("*")
      .eq("programme_id", programmeId)
      .order("requested_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((r: Record<string, never>) => ({
      id: r.id as string,
      programmeId: r.programme_id as string,
      programmeCode: r.programme_code as string | undefined,
      fieldName: r.field_name as string,
      fieldLabel: (r.field_label as string) ?? r.field_name,
      oldValue: r.old_value as string | null,
      newValue: r.new_value as string | null,
      reason: r.reason as string,
      supportingDocumentUrl: r.supporting_document_url as string | null,
      status: r.status as ChangeRequestStatus,
      requestedBy: r.requested_by as string,
      requestedByName: r.requested_by_name as string | null,
      requestedAt: r.requested_at as string,
      reviewedBy: r.reviewed_by as string | null,
      reviewedByName: r.reviewed_by_name as string | null,
      reviewedAt: r.reviewed_at as string | null,
      reviewNote: r.review_note as string | null,
    }));
  } catch (error) {
    console.error("listChangeRequests:", error);
    return [];
  }
}

/** Senarai semua permohonan pending (untuk Head Governance di dashboard). */
export async function listPendingChangeRequests(): Promise<ChangeRequest[]> {
  if (isDemoMode()) {
    return demoChangeRequests("demo-programme-1").filter((r) => r.status === "pending");
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("change_requests")
      .select("*")
      .eq("status", "pending")
      .order("requested_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data ?? []).map((r: Record<string, never>) => ({
      id: r.id as string,
      programmeId: r.programme_id as string,
      programmeCode: r.programme_code as string | undefined,
      fieldName: r.field_name as string,
      fieldLabel: (r.field_label as string) ?? r.field_name,
      oldValue: r.old_value as string | null,
      newValue: r.new_value as string | null,
      reason: r.reason as string,
      supportingDocumentUrl: r.supporting_document_url as string | null,
      status: r.status as ChangeRequestStatus,
      requestedBy: r.requested_by as string,
      requestedByName: r.requested_by_name as string | null,
      requestedAt: r.requested_at as string,
      reviewedBy: r.reviewed_by as string | null,
      reviewedByName: r.reviewed_by_name as string | null,
      reviewedAt: r.reviewed_at as string | null,
      reviewNote: r.review_note as string | null,
    }));
  } catch (error) {
    console.error("listPendingChangeRequests:", error);
    return [];
  }
}

/* ====================== Data demo ====================== */

function demoChangeRequests(programmeId: string): ChangeRequest[] {
  return [
    {
      id: "demo-cr-1",
      programmeId,
      programmeCode: "MIMOS-TRN-2026-0001",
      fieldName: "contracted_amount",
      fieldLabel: "Nilai Kontrak (RM)",
      oldValue: "RM 25,000.00",
      newValue: "RM 26,500.00",
      reason: "Invois disemak semula selepas tambahan peserta (5 pax) disahkan oleh penganjur.",
      supportingDocumentUrl: null,
      status: "pending",
      requestedBy: "user-1",
      requestedByName: "Nur Izzati Zailani",
      requestedAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
      reviewedBy: null,
      reviewedByName: null,
      reviewedAt: null,
      reviewNote: null,
    },
    {
      id: "demo-cr-2",
      programmeId,
      programmeCode: "MIMOS-TRN-2026-0001",
      fieldName: "start_date",
      fieldLabel: "Tarikh Mula",
      oldValue: "2026-09-14",
      newValue: "2026-09-21",
      reason: "Penganjur meminta penjadualan semula kerana konflik dengan mesyuarat agung tahunan.",
      supportingDocumentUrl: null,
      status: "approved",
      requestedBy: "user-2",
      requestedByName: "Muhammad Fayyadh",
      requestedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      reviewedBy: "user-3",
      reviewedByName: "Dr. Ahmad Nizar",
      reviewedAt: new Date(Date.now() - 1 * 86_400_000).toISOString(),
      reviewNote: "Diluluskan. Sila kemas kini jadual trainer.",
    },
  ];
}
