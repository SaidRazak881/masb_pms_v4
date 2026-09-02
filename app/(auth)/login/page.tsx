"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
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
import { verifyTotpCode } from "@/lib/mfa";

const HAS_SUPABASE = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

type Step = "password" | "mfa";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("zalina@mimos.my");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  function resolveRedirect(): string {
    if (typeof window === "undefined") return "/dashboard";
    const r = new URLSearchParams(window.location.search).get("redirect");
    return r && r.startsWith("/") ? r : "/dashboard";
  }

  /** Lengkapkan log masuk selepas kata laluan SAH (sama ada MFA atau tidak). */
  async function finishSignIn() {
    router.push(resolveRedirect());
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Mod demo: tiada env Supabase — teruskan tanpa pengesahan sebenar.
    if (!HAS_SUPABASE) {
      setTimeout(() => {
        router.push(resolveRedirect());
      }, 500);
      setLoading(false);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;

      // Pengguna dengan MFA: GoTrue beri sesi aal1 + nextLevel aal2 —
      // minta kod TOTP SEBELUM benarkan masuk ke aplikasi.
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
        setStep("mfa");
        setLoading(false);
        return;
      }

      await finishSignIn();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Log masuk gagal.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: verifyError } = await verifyTotpCode(supabase, mfaCode);
      if (verifyError) throw new Error(verifyError);

      await finishSignIn();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kod pengesahan tidak sah. Cuba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (step === "mfa") {
    return (
      <Card className="border-0 shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl">Pengesahan 2-Langkah</CardTitle>
            <CardDescription>
              Masukkan kod 6 digit daripada aplikasi authenticator anda.
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleMfaSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mfaCode">Kod Authenticator</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mfaCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="pl-9 text-center text-lg tracking-[0.4em]"
                  placeholder="••••••"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) =>
                    setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Buka aplikasi authenticator (cth. Google Authenticator) pada
                telefon anda dan masukkan kod semasa untuk {email}.
              </p>
            </div>

            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sahkan & Masuk
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={loading}
              onClick={async () => {
                try {
                  const { createClient } = await import(
                    "@/lib/supabase/client"
                  );
                  await createClient().auth.signOut();
                } catch {
                  // abaikan — halaman login kekal selamat
                }
                setStep("password");
                setMfaCode("");
                setError(null);
              }}
            >
              ← Kembali ke log masuk
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
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
            <Label htmlFor="password">Kata Laluan</Label>
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
