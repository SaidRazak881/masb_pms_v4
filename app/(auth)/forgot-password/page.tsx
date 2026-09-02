"use client";

/**
 * Lupa / Set Semula Kata Laluan — Fasa 6.
 *
 * Aliran: `supabase.auth.resetPasswordForEmail()` menghantar e-mel
 * pemulihan ke alamat pengguna. Pautan dalam e-mel itu membawa pengguna
 * kembali ke `/security?reset=1` untuk menetapkan kata laluan baharu.
 *
 * Perlu dikonfigurasi di Supabase → Authentication → URL Configuration:
 *   Site URL          = https://masb-pms-v4.vercel.app
 *   Redirect URLs     = https://masb-pms-v4.vercel.app/security**
 *
 * Jika e-mel pemulihan tidak disediakan oleh organisasi, Super Admin boleh
 * set semula kata laluan mana-mana pengguna ke `masb.12345` melalui
 * dashboard /admin/users.
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Loader2, Mail, MailCheck, ShieldQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEFAULT_PASSWORD, translateAuthError } from "@/lib/auth";

const HAS_SUPABASE = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    if (!HAS_SUPABASE) {
      setTimeout(() => {
        setBusy(false);
        setSent(true);
      }, 400);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${origin}/security?reset=1` },
      );

      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(
        translateAuthError(
          err instanceof Error ? err.message : undefined,
          "Gagal menghantar e-mel pemulihan.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Card className="border-0 shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <MailCheck className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl">Semak E-mel Anda</CardTitle>
            <CardDescription>
              Jika akaun wujud untuk{" "}
              <span className="font-semibold">{email}</span>, pautan set semula
              kata laluan telah dihantar.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sky-900">
            <ol className="list-decimal space-y-1 pl-4">
              <li>Buka e-mel &quot;Reset Your Password&quot;.</li>
              <li>
                Klik pautan — anda akan dibawa ke halaman{" "}
                <strong>Keselamatan</strong> dalam sistem ini.
              </li>
              <li>
                Masukkan kata laluan baharu (sekurang-kurangnya 8 aksara, huruf
                + nombor).
              </li>
            </ol>
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
            <p className="flex items-start gap-1.5">
              <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Tidak terima e-mel dalam 5 minit? Minta{" "}
                <strong>Super Admin</strong> set semula kata laluan anda melalui
                dashboard pengurusan pengguna. Kata laluan akan dikembalikan ke
                lalai{" "}
                <code className="rounded bg-white/70 px-1 font-mono font-semibold">
                  {DEFAULT_PASSWORD}
                </code>{" "}
                dan anda wajib menukarnya selepas log masuk.
              </span>
            </p>
          </div>

          {!HAS_SUPABASE && (
            <p className="text-xs text-muted-foreground">
              Mod Demo — e-mel tidak benar-benar dihantar.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Log Masuk
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <KeyRound className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl">Lupa Kata Laluan</CardTitle>
          <CardDescription>
            Masukkan e-mel berdaftar anda. Kami akan hantar pautan untuk
            menetapkan kata laluan baharu.
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mel</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                className="pl-9"
                placeholder="nama@mimos.my"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Hantar Pautan Set Semula
          </Button>
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Log Masuk
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
