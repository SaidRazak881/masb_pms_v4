"use client";

/**
 * Aliran log masuk bersama (Fasa 6) — e-mel + kata laluan SAHAJA.
 *
 * Selepas kata laluan disahkan, status akaun dibaca dari pangkalan data:
 *   pending → /pending-approval      (menunggu kelulusan Super Admin)
 *   blocked → /account-blocked       (disekat Super Admin)
 *   active  → teruskan ke destinasi; jika `must_change_password` masih true,
 *             hantar ke /security?required=1 supaya pengguna menukar kata
 *             laluan lalai `masb.12345` dahulu.
 */

import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  fetchAccountSnapshot,
  resolveAccountAccess,
  translateAuthError,
} from "@/lib/auth";

export type SignInOutcome =
  | { ok: true; destination: string }
  | { ok: false; message: string };

/** Destinasi selepas log masuk (hormati `?redirect=` dari middleware). */
export function resolveRedirect(fallback = "/dashboard"): string {
  if (typeof window === "undefined") return fallback;
  const r = new URLSearchParams(window.location.search).get("redirect");
  return r && r.startsWith("/") && !r.startsWith("//") ? r : fallback;
}

/**
 * Log masuk dengan e-mel + kata laluan, kemudian tentukan destinasi
 * berdasarkan status akaun. Tidak mengandungi MFA/TOTP.
 */
export async function signInAndRoute(
  supabase: SupabaseClient,
  email: string,
  password: string,
): Promise<SignInOutcome> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { ok: false, message: translateAuthError(error.message, "Log masuk gagal.") };
  }

  const user = data.user;
  if (!user) {
    return { ok: false, message: "Log masuk gagal — sesi tidak diterima." };
  }

  // Baca status akaun dari pangkalan data (sumber kebenaran).
  const snapshot = await fetchAccountSnapshot(
    supabase,
    user.id,
    user.email ?? email,
  );

  const access = resolveAccountAccess(snapshot);
  if (access.redirect) {
    // Sesi dibuang supaya pengguna tidak kekal "log masuk" semasa menunggu.
    await supabase.auth.signOut();
    return { ok: true, destination: access.redirect };
  }

  // Wajib tukar kata laluan lalai sebelum guna sistem.
  if (snapshot.mustChangePassword) {
    const target = resolveRedirect();
    return {
      ok: true,
      destination: `/security?required=1&next=${encodeURIComponent(target)}`,
    };
  }

  return { ok: true, destination: resolveRedirect() };
}

/** Navigasi hasil log masuk (dipanggil dari komponen). */
export function useSignInNavigation() {
  const router = useRouter();
  return (destination: string) => {
    router.push(destination);
    router.refresh();
  };
}
