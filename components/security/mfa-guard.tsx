"use client";

/**
 * MfaGuard — penguatkuasaan MFA untuk role admin & head_governance.
 *
 * Diletakkan dalam layout dashboard. Jika pengguna berperanan istimewa
 * (admin/head_governance) tiada faktor TOTP disahkan ATAU sesi semasa belum
 * mencapai aal2, alihkan ke /security untuk melengkapkan persediaan /
 * pengesahan MFA dahulu.
 *
 * Nota: halaman /security dikecualikan daripada pengalihan ini.
 */

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  fetchRole,
  findVerifiedTotpFactor,
  isPrivilegedRole,
} from "@/lib/mfa";

const HAS_SUPABASE = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function MfaGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!HAS_SUPABASE) return;
    if (pathname === "/security" || pathname === "/login") return;

    let cancelled = false;

    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user || cancelled) return;

        const role = await fetchRole(supabase, session.user.id);
        if (!isPrivilegedRole(role) || cancelled) return;

        const { data: aal } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        // Sesi sudah aal2 → MFA lengkap, benarkan akses.
        if (aal?.currentLevel === "aal2") return;
        if (cancelled) return;

        const verifiedFactor = await findVerifiedTotpFactor(supabase);
        if (cancelled) return;

        if (!verifiedFactor) {
          // Role istimewa tanpa MFA → wajib daftar dahulu.
          router.replace("/security?required=1");
        } else {
          // Ada MFA tetapi sesi ini belum disahkan → sahkan dahulu.
          router.replace("/security");
        }
      } catch {
        // Jangan blok aplikasi jika semakan gagal (cth. isu rangkaian) —
        // log masuk penuh melalui halaman login tetap menguatkuasakan MFA.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
