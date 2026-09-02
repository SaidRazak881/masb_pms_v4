import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Pembantu MFA — digunakan oleh halaman login, halaman /security dan
 * penguatkuasaan MFA (mfa-guard).
 *
 * Rujukan: Supabase Auth MFA (TOTP) — enroll → challenge → verify.
 * Selepas verify berjaya, sesi semasa dinaikkan ke aal2 dan semua sesi
 * lain pengguna itu ditamatkan oleh GoTrue.
 */

export const PRIVILEGED_ROLES = ["admin", "head_governance"] as const;

/** Role yang MFA adalah WAJIB (admin + head_governance). */
export function isPrivilegedRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "head_governance";
}

/** Baca role pengguna daripada user_profiles (RLS: profil sendiri sahaja). */
export async function fetchRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return (data?.role as string | undefined) ?? null;
}

/** Faktor TOTP pertama yang berstatus verified (jika ada). */
export async function findVerifiedTotpFactor(
  supabase: SupabaseClient,
): Promise<{ id: string; createdAt?: string } | null> {
  const { data } = await supabase.auth.mfa.listFactors();
  const verified = (data?.totp ?? []).find((f) => f.status === "verified");
  if (!verified) return null;
  return { id: verified.id, createdAt: verified.created_at };
}

/**
 * Sahkan kod TOTP pengguna terhadap faktor verified sedia ada.
 * Berjaya → sesi dinaikkan ke aal2 (challenge/verify diuruskan GoTrue).
 */
export async function verifyTotpCode(
  supabase: SupabaseClient,
  code: string,
): Promise<{ error?: string }> {
  const factor = await findVerifiedTotpFactor(supabase);
  if (!factor) {
    return { error: "Tiada faktor TOTP yang disahkan untuk akaun ini." };
  }
  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId: factor.id });
  if (challengeError) {
    return { error: challengeError.message };
  }
  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code: code.trim(),
  });
  if (verifyError) {
    return { error: verifyError.message };
  }
  return {};
}
