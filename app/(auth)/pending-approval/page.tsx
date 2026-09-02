"use client";

/**
 * Halaman status — akaun belum diluluskan.
 *
 * Dipaparkan apabila pengguna dengan `account_status = 'pending'` cuba masuk.
 * Sesi telah dibuang semasa log masuk, jadi halaman ini hanya memaklumkan
 * status dan menawarkan jalan kembali.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock3, Loader2, LogOut, RefreshCw, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Clock3 className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl">Menunggu Kelulusan</CardTitle>
          <CardDescription>
            Akaun anda telah dicipta tetapi belum diluluskan oleh Super Admin.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
          <p className="font-medium">Status permohonan anda</p>
          <p className="mt-1 text-xs leading-relaxed">
            Pendaftaran baharu memerlukan kelulusan <strong>Super Admin</strong>{" "}
            sebelum anda boleh mengakses Dashboard, Program, Import, Peserta dan
            Laporan. Permohonan anda akan muncul dalam tab{" "}
            <em>Menunggu Kelulusan</em> pada dashboard pengurusan pengguna.
          </p>
        </div>

        <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          <p className="flex items-start gap-1.5">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Selepas diluluskan, Super Admin akan menetapkan role anda
              (Staf, Kewangan, Eksekutif, Pengurus, Head Governance atau Admin).
              Log masuk semula untuk mula menggunakan sistem.
            </span>
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <p className="text-center text-xs text-muted-foreground">
          Sudah diluluskan? Cuba log masuk semula — status akaun disemak setiap
          kali anda log masuk.
        </p>
        <Link href="/login" className="w-full">
          <Button variant="outline" className="w-full" disabled={busy}>
            <RefreshCw className="h-4 w-4" />
            Cuba Log Masuk Semula
          </Button>
        </Link>
        <Button className="w-full" onClick={handleSignOut} disabled={busy}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Log Keluar &amp; Kembali
        </Button>
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Pergi ke halaman Log Masuk
        </Link>
      </CardFooter>
    </Card>
  );
}
