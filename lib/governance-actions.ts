"use server";

/**
 * governance-actions.ts — Server Actions bagi Governance Lock & Request Unlock
 * (Langkah 5, TPMS MIMOS Academy).
 *
 * Semua tindakan di sini adalah SEMPADAN KESELAMATAN sebenar: peraturan dalam
 * `lib/governance.ts` disahkan semula di pelayan walaupun UI telah menapisnya.
 *
 * Setiap tindakan memanggil RPC atomik yang ditakrifkan dalam
 * `lib/supabase/governance-lock.sql`:
 *
 *   - `request_programme_unlock`  → cipta permohonan (satu pending sahaja)
 *   - `review_programme_unlock`   → lulus/tolak + buka tetingkap suntingan
 *   - `lock_programme`            → kunci semula program
 *   - `cancel_programme_unlock`   → pemohon membatalkan permohonan sendiri
 *
 * Mod demo: apabila env Supabase tiada, tindakan mengembalikan keputusan
 * simulasi supaya UI mock boleh dilayari sepenuhnya tanpa pangkalan data.
 */

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_UNLOCK_HOURS,
  MAX_UNLOCK_HOURS,
  MIN_UNLOCK_HOURS,
  computeUnlockExpiry,
  type GovernanceRole,
  type LockReason,
  type UnlockRequest,
  validateUnlockRequest,
} from "@/lib/governance";

/* ====================== Bentuk keputusan ====================== */

export interface ActionResult<T = undefined> {
  ok: boolean;
  /** Mesej Bahasa Melayu untuk dipaparkan kepada pengguna. */
  message: string;
  /** Ralat mengikut medan borang, jika pengesahan gagal. */
  fieldErrors?: Record<string, string>;
  data?: T;
}

function fail(message: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, message, fieldErrors };
}

function isDemoMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Terjemah ralat Postgres/PostgREST kepada mesej Bahasa Melayu. */
function translateError(error: { code?: string; message?: string }): string {
  const raw = error.message ?? "";
  if (raw.includes("UNLOCK_PENDING_EXISTS")) {
    return "Sudah ada permohonan buka kunci yang menunggu kelulusan bagi program ini.";
  }
  if (raw.includes("UNLOCK_SELF_APPROVAL")) {
    return "Pemohon tidak boleh meluluskan permohonan sendiri (pengasingan tugas).";
  }
  if (raw.includes("UNLOCK_NOT_PENDING")) {
    return "Permohonan ini telah pun diputuskan atau tamat tempoh.";
  }
  if (raw.includes("PROGRAMME_NOT_LOCKED")) {
    return "Program ini tidak berkunci — tiada permohonan diperlukan.";
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
}

/* ====================== 1. Hantar permohonan ====================== */

export async function requestUnlockAction(
  formData: FormData,
): Promise<ActionResult<{ requestId: string }>> {
  const programmeId = String(formData.get("programmeId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const scope = formData
    .getAll("scope")
    .map((s) => String(s))
    .filter(Boolean);
  const requestedHours = Number(
    formData.get("requestedHours") ?? DEFAULT_UNLOCK_HOURS,
  );

  const check = validateUnlockRequest({
    programmeId,
    reason,
    scope,
    requestedHours,
  });
  if (!check.valid) {
    return fail(
      "Permohonan tidak lengkap. Sila semak medan yang ditanda.",
      check.errors as Record<string, string>,
    );
  }

  if (isDemoMode()) {
    return {
      ok: true,
      message:
        "Permohonan buka kunci dihantar (mod demo). Pengurus akan dimaklumkan.",
      data: { requestId: `DEMO-${Date.now()}` },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Sesi anda telah tamat. Sila log masuk semula.");

  const { data, error } = await supabase.rpc("request_programme_unlock", {
    p_programme_id: programmeId,
    p_reason: reason,
    p_scope: scope,
    p_requested_hours: Math.min(
      MAX_UNLOCK_HOURS,
      Math.max(MIN_UNLOCK_HOURS, Math.round(requestedHours)),
    ),
  });

  if (error) return fail(translateError(error));

  revalidateProgramme(programmeId);
  return {
    ok: true,
    message:
      "Permohonan buka kunci berjaya dihantar. Pengurus akan menyemak justifikasi anda.",
    data: { requestId: String(data) },
  };
}

/* ====================== 2. Lulus / tolak permohonan ====================== */

export async function reviewUnlockAction(
  formData: FormData,
): Promise<ActionResult<{ unlockExpiresAt: string | null }>> {
  const requestId = String(formData.get("requestId") ?? "").trim();
  const programmeId = String(formData.get("programmeId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim();
  const grantedHours = Number(
    formData.get("grantedHours") ?? DEFAULT_UNLOCK_HOURS,
  );

  if (!requestId) return fail("ID permohonan tidak sah.");
  if (decision !== "approve" && decision !== "reject") {
    return fail("Keputusan tidak sah — pilih Lulus atau Tolak.");
  }
  if (decision === "reject" && note.length < 10) {
    return fail("Sila nyatakan sebab penolakan (sekurang-kurangnya 10 aksara).", {
      reviewNote: "Sebab penolakan terlalu ringkas.",
    });
  }

  if (isDemoMode()) {
    return {
      ok: true,
      message:
        decision === "approve"
          ? "Permohonan diluluskan (mod demo). Tetingkap suntingan dibuka."
          : "Permohonan ditolak (mod demo).",
      data: {
        unlockExpiresAt:
          decision === "approve" ? computeUnlockExpiry(grantedHours) : null,
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Sesi anda telah tamat. Sila log masuk semula.");

  const { data, error } = await supabase.rpc("review_programme_unlock", {
    p_request_id: requestId,
    p_approve: decision === "approve",
    p_review_note: note || null,
    p_granted_hours: Math.min(
      MAX_UNLOCK_HOURS,
      Math.max(MIN_UNLOCK_HOURS, Math.round(grantedHours)),
    ),
  });

  if (error) return fail(translateError(error));

  if (programmeId) revalidateProgramme(programmeId);
  return {
    ok: true,
    message:
      decision === "approve"
        ? "Permohonan diluluskan. Tetingkap suntingan bertempoh telah dibuka."
        : "Permohonan ditolak dan pemohon telah dimaklumkan.",
    data: { unlockExpiresAt: (data as string | null) ?? null },
  };
}

/* ====================== 3. Kunci semula program ====================== */

export async function lockProgrammeAction(
  formData: FormData,
): Promise<ActionResult> {
  const programmeId = String(formData.get("programmeId") ?? "").trim();
  const reason = String(formData.get("lockReason") ?? "manual") as LockReason;

  if (!programmeId) return fail("ID program tidak sah.");

  if (isDemoMode()) {
    return { ok: true, message: "Program dikunci semula (mod demo)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Sesi anda telah tamat. Sila log masuk semula.");

  const { error } = await supabase.rpc("lock_programme", {
    p_programme_id: programmeId,
    p_lock_reason: reason,
  });

  if (error) return fail(translateError(error));

  revalidateProgramme(programmeId);
  return {
    ok: true,
    message: "Program telah dikunci semula sebagai rekod audit.",
  };
}

/* ====================== 4. Batalkan permohonan sendiri ====================== */

export async function cancelUnlockAction(
  formData: FormData,
): Promise<ActionResult> {
  const requestId = String(formData.get("requestId") ?? "").trim();
  const programmeId = String(formData.get("programmeId") ?? "").trim();

  if (!requestId) return fail("ID permohonan tidak sah.");

  if (isDemoMode()) {
    return { ok: true, message: "Permohonan dibatalkan (mod demo)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_programme_unlock", {
    p_request_id: requestId,
  });

  if (error) return fail(translateError(error));

  if (programmeId) revalidateProgramme(programmeId);
  return { ok: true, message: "Permohonan buka kunci telah dibatalkan." };
}

/* ====================== 5. Bacaan sokongan ====================== */

/**
 * Dapatkan permohonan buka kunci bagi sesuatu program (terbaharu dahulu).
 * Dalam mod demo ia mengembalikan senarai kosong supaya UI mock kekal stabil.
 */
export async function listUnlockRequests(
  programmeId: string,
): Promise<UnlockRequest[]> {
  if (isDemoMode()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programme_unlock_requests")
    .select("*")
    .eq("programme_id", programmeId)
    .order("requested_at", { ascending: false });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    programmeId: String(row.programme_id),
    programmeCode: (row.programme_code as string) ?? undefined,
    requestedBy: String(row.requested_by),
    requestedByName: (row.requested_by_name as string) ?? "Pengguna",
    requestedAt: String(row.requested_at),
    reason: String(row.reason ?? ""),
    scope: Array.isArray(row.scope) ? (row.scope as string[]) : [],
    requestedHours: Number(row.requested_hours ?? DEFAULT_UNLOCK_HOURS),
    status: row.status as UnlockRequest["status"],
    reviewedBy: (row.reviewed_by as string) ?? null,
    reviewedByName: (row.reviewed_by_name as string) ?? null,
    reviewedAt: (row.reviewed_at as string) ?? null,
    reviewNote: (row.review_note as string) ?? null,
    unlockExpiresAt: (row.unlock_expires_at as string) ?? null,
  }));
}

/** Peranan tadbir urus pengguna semasa (lalai `executive` dalam mod demo). */
export async function getCurrentGovernanceRole(): Promise<GovernanceRole> {
  if (isDemoMode()) return "manager";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "viewer";

  const { data } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (data as { role?: string } | null)?.role;
  if (
    role === "super_admin" ||
    role === "admin" ||
    role === "manager" ||
    role === "executive" ||
    role === "head_governance"
  ) {
    return role;
  }
  return "viewer";
}
