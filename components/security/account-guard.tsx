"use client";

/**
 * AccountGuard — pertahanan KEDUA bagi penguatkuasaan status akaun.
 *
 * Penguatkuasaan utama dilakukan sisi pelayan dalam `app/(dashboard)/layout.tsx`
 * (tidak boleh dipintas oleh klien). Komponen ini menyemak semula status akaun
 * semasa navigasi sisi klien (apabila layout tidak dimuat semula), supaya
 * sekatan yang dikenakan SELEPAS pengguna log masuk tetap berkuat kuasa tanpa
 * perlu menunggu pengguna memuat semula halaman.
 *
 * Fasa 6: TIADA semakan MFA/TOTP — hanya e-mel + kata laluan.
 */

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  fetchAccountSnapshot,
  resolveAccountAccess,
} from "@/lib/auth";

const HAS_SUPABASE = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** Halaman yang dikecualikan (sama seperti layout dashboard). */
const EXEMPT_PREFIXES = ["/security", "/admin"];

export function AccountGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!HAS_SUPABASE) return;
    if (EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return;

    let cancelled = false;

    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user || cancelled) return;

        const snapshot = await fetchAccountSnapshot(
          supabase,
          session.user.id,
          session.user.email ?? "",
        );
        if (cancelled) return;

        const access = resolveAccountAccess(snapshot);
        if (access.redirect) {
          router.replace(access.redirect);
          return;
        }

        // Kata laluan lalai masih dipakai → wajib tukar dahulu.
        if (snapshot.mustChangePassword) {
          router.replace(
            `/security?required=1&next=${encodeURIComponent(pathname)}`,
          );
        }
      } catch {
        // Jangan kunci pengguna jika semakan gagal (cth. isu rangkaian atau
        // RPC belum dipasang). Penguatkuasaan sisi pelayan + RLS tetap aktif.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
