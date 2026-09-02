"use client";

/**
 * Halaman Log Masuk — Fasa 6.
 *
 * Log masuk HANYA dengan e-mel + kata laluan (tiada MFA/TOTP).
 * Pengguna pertama kali log masuk dengan kata laluan lalai `masb.12345`
 * dan akan diarah menukar kata laluan.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Info,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  UserPlus,
} from "lucide-react";

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
import { DEFAULT_PASSWORD } from "@/lib/auth";
import { resolveRedirect, signInAndRoute } from "@/lib/auth-client";

const HAS_SUPABASE = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    // Mod demo: tiada env Supabase — log masuk disimulasikan.
    if (!HAS_SUPABASE) {
      setTimeout(() => {
        router.push(resolveRedirect());
        router.refresh();
      }, 400);
      setLoading(false);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const result = await signInAndRoute(supabase, email, password);

      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }

      if (result.destination.startsWith("/pending-approval")) {
        setNotice(
          "Kata laluan sah, tetapi akaun anda belum diluluskan. Permohonan anda menunggu kelulusan Super Admin.",
        );
      } else if (result.destination.startsWith("/account-blocked")) {
        setNotice(
          "Kata laluan sah, tetapi akaun anda telah disekat. Sila hubungi Super Admin.",
        );
      }

      router.push(result.destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Log masuk gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl">MIMOS Academy</CardTitle>
          <CardDescription>
            Training Programme Management System (TPMS)
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
                placeholder="nama@mimos.my"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Kata Laluan</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Lupa kata laluan?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                className="pl-9"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="flex gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              Log masuk pertama kali? Guna kata laluan lalai{" "}
              <code className="rounded bg-white/70 px-1 font-mono font-semibold">
                {DEFAULT_PASSWORD}
              </code>{" "}
              — anda akan diminta menukarnya sebaik sahaja masuk.
            </p>
          </div>

          {notice && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {notice}
            </div>
          )}

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Log Masuk
          </Button>

          <div className="flex w-full items-center gap-3 text-xs">
            <Link href="/register" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                <UserPlus className="h-4 w-4" />
                Daftar Akaun Baharu
              </Button>
            </Link>
            <Link href="/forgot-password" className="flex-1">
              <Button type="button" variant="ghost" className="w-full">
                <KeyRound className="h-4 w-4" />
                Set Semula
              </Button>
            </Link>
          </div>

          {!HAS_SUPABASE && (
            <p className="text-center text-xs text-muted-foreground">
              Mod Demo — tanpa env Supabase, log masuk disimulasikan.
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
