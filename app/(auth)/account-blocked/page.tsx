"use client";

/**
 * Halaman status — akaun disekat.
 *
 * Dipaparkan apabila pengguna dengan `account_status = 'blocked'` cuba masuk.
 * Sekatan dikenakan oleh Super Admin melalui RPC `admin_set_user_blocked()`;
 * refresh token pengguna turut dipadam supaya semua sesi aktif tamat.
 *
 * Sebab sekatan dihantar melalui query string (`?reason=`) oleh aliran log
 * masuk — sesi pengguna dibuang sebaik sahaja sekatan dikesan, jadi halaman
 * ini tidak dapat membacanya semula daripada pangkalan data.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, Loader2, LogOut, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AccountBlockedPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const r = new URLSearchParams(window.location.search).get("reason");
    if (r && r.trim()) setReason(r.trim());
  }, []);

  async function handleSignOut() {
    setBusy(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      await createClient().auth.signOut();
    } catch {
      // abaikan — navigasi ke /login tetap selamat
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
          <Ban className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl">Akaun Disekat</CardTitle>
          <CardDescription>
            Akaun anda telah disekat oleh Super Admin dan tidak boleh mengakses
            sistem buat masa ini.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-900">
          <p className="font-medium">Sebab sekatan</p>
          <p className="mt-1 text-xs leading-relaxed">
            {reason ??
              "Tiada sebab direkodkan. Hubungi Super Admin untuk mendapatkan penjelasan."}
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <p className="flex items-start gap-1.5">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Semua sesi aktif anda telah ditamatkan. Jika anda rasa ini satu
              kesilapan, hubungi <strong>Super Admin</strong> — sekatan boleh
              ditarik balik dan anda akan boleh log masuk semula serta-merta.
            </span>
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <Button className="w-full" onClick={handleSignOut} disabled={busy}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Kembali ke Log Masuk
        </Button>
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Halaman Log Masuk
        </Link>
      </CardFooter>
    </Card>
  );
}
