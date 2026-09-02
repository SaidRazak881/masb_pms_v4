"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fetchRole,
  findVerifiedTotpFactor,
  isPrivilegedRole,
  verifyTotpCode,
} from "@/lib/mfa";

const HAS_SUPABASE = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

type SecurityState = {
  status: "loading" | "ready";
  demo: boolean;
  role: string | null;
  currentLevel: string | null;
  verifiedFactor: { id: string; createdAt?: string } | null;
};

/** Data URL SVG untuk <img> — GoTrue mungkin pulangkan SVG mentah. */
function qrSrc(qrCode: string): string {
  if (qrCode.startsWith("data:")) return qrCode;
  return `data:image/svg+xml;utf-8,${encodeURIComponent(qrCode)}`;
}

export default function SecurityPage() {
  const router = useRouter();
  const [state, setState] = useState<SecurityState>({
    status: "loading",
    demo: false,
    role: null,
    currentLevel: null,
    verifiedFactor: null,
  });

  const [requiredBanner, setRequiredBanner] = useState(false);

  // Tukar kata laluan
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwOtp, setPwOtp] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMessage, setPwMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  // Persediaan MFA
  const [enrolling, setEnrolling] = useState(false);
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [enrollCode, setEnrollCode] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaMessage, setMfaMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  // Sahkan log masuk (aal1 → aal2) & lumpuhkan MFA
  const [confirmOtp, setConfirmOtp] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const loadState = useCallback(async () => {
    if (!HAS_SUPABASE) {
      setState({
        status: "ready",
        demo: true,
        role: null,
        currentLevel: null,
        verifiedFactor: null,
      });
      return;
    }
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace("/login");
        return;
      }
      const role = await fetchRole(supabase, session.user.id);
      const verifiedFactor = await findVerifiedTotpFactor(supabase);
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setState({
        status: "ready",
        demo: false,
        role,
        currentLevel: aal?.currentLevel ?? null,
        verifiedFactor,
      });
    } catch (err) {
      setState((s) => ({ ...s, status: "ready" }));
      setMfaMessage({
        kind: "err",
        text:
          err instanceof Error
            ? err.message
            : "Gagal memuatkan status keselamatan.",
      });
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRequiredBanner(
        new URLSearchParams(window.location.search).get("required") === "1",
      );
    }
    void loadState();
  }, [loadState]);

  const privileged = isPrivilegedRole(state.role);

  // ---------- Tukar kata laluan ----------
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMessage(null);
    if (newPassword.length < 8) {
      setPwMessage({
        kind: "err",
        text: "Kata laluan baharu mesti sekurang-kurangnya 8 aksara.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({
        kind: "err",
        text: "Kata laluan baharu dan pengesahan tidak sepadan.",
      });
      return;
    }
    setPwBusy(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Akaun ber-MFA: minta kod TOTP dahulu (naikkan sesi ke aal2).
      if (state.verifiedFactor) {
        if (!pwOtp.trim()) {
          setPwMessage({
            kind: "err",
            text: "Akaun anda menggunakan MFA — masukkan kod authenticator untuk mengesahkan.",
          });
          return;
        }
        const { error: verifyError } = await verifyTotpCode(supabase, pwOtp);
        if (verifyError) throw new Error(verifyError);
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      setPwMessage({
        kind: "ok",
        text: "Kata laluan berjaya ditukar. Gunakan kata laluan baharu pada log masuk seterusnya.",
      });
      setNewPassword("");
      setConfirmPassword("");
      setPwOtp("");
    } catch (err) {
      setPwMessage({
        kind: "err",
        text:
          err instanceof Error
            ? err.message
            : "Gagal menukar kata laluan. Cuba lagi.",
      });
    } finally {
      setPwBusy(false);
    }
  }

  // ---------- Enrol MFA ----------
  async function startEnroll() {
    setMfaMessage(null);
    setMfaBusy(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Bersihkan faktor terdahulu yang tidak disahkan (jika ada) —
      // usaha terbaik sahaja; ralat diabaikan.
      const { data: factors } = await supabase.auth.mfa.listFactors();
      for (const f of factors?.all ?? []) {
        if (f.status === "unverified") {
          try {
            await supabase.auth.mfa.unenroll({ factorId: f.id });
          } catch {
            // abaikan — mungkin perlukan aal2
          }
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (error) throw error;
      setEnrolling(true);
      setEnrollFactorId(data.id);
      setQr(qrSrc(data.totp.qr_code));
      setSecret(data.totp.secret);
      setEnrollCode("");
    } catch (err) {
      setMfaMessage({
        kind: "err",
        text:
          err instanceof Error
            ? err.message
            : "Gagal memulakan persediaan MFA.",
      });
    } finally {
      setMfaBusy(false);
    }
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    setMfaMessage(null);
    setMfaBusy(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (!enrollFactorId) throw new Error("Sesi persediaan tidak sah.");
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: enrollFactorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollFactorId,
        challengeId: challenge.id,
        code: enrollCode.trim(),
      });
      if (verifyError) throw verifyError;

      setMfaMessage({
        kind: "ok",
        text: "MFA berjaya diaktifkan. Log masuk seterusnya akan meminta kod 6 digit.",
      });
      setEnrolling(false);
      setQr(null);
      setSecret(null);
      setEnrollFactorId(null);
      setEnrollCode("");
      await loadState();
    } catch (err) {
      setMfaMessage({
        kind: "err",
        text:
          err instanceof Error
            ? err.message
            : "Kod tidak sah. Cuba lagi.",
      });
    } finally {
      setMfaBusy(false);
    }
  }

  async function cancelEnroll() {
    setMfaBusy(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (enrollFactorId) {
        await supabase.auth.mfa.unenroll({ factorId: enrollFactorId });
      }
    } catch {
      // faktor belum disahkan — abaikan ralat pembersihan
    } finally {
      setEnrolling(false);
      setQr(null);
      setSecret(null);
      setEnrollFactorId(null);
      setEnrollCode("");
      setMfaBusy(false);
      setMfaMessage(null);
    }
  }

  // ---------- Sahkan log masuk (aal1→aal2) / lumpuhkan MFA ----------
  async function confirmSessionOtp() {
    setMfaMessage(null);
    setActionBusy(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await verifyTotpCode(supabase, confirmOtp);
      if (error) throw new Error(error);
      setConfirmOtp("");
      setMfaMessage({
        kind: "ok",
        text: "Pengesahan berjaya — akses penuh diberikan.",
      });
      await loadState();
    } catch (err) {
      setMfaMessage({
        kind: "err",
        text:
          err instanceof Error ? err.message : "Kod tidak sah. Cuba lagi.",
      });
    } finally {
      setActionBusy(false);
    }
  }

  async function disableMfa() {
    setMfaMessage(null);
    setActionBusy(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (!state.verifiedFactor) throw new Error("Tiada faktor MFA aktif.");
      if (!confirmOtp.trim()) {
        setMfaMessage({
          kind: "err",
          text: "Masukkan kod authenticator semasa untuk melumpuhkan MFA.",
        });
        return;
      }
      const { error: verifyError } = await verifyTotpCode(
        supabase,
        confirmOtp,
      );
      if (verifyError) throw new Error(verifyError);
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: state.verifiedFactor.id,
      });
      if (unenrollError) throw unenrollError;
      setConfirmOtp("");
      setMfaMessage({
        kind: "ok",
        text: "MFA dilumpuhkan. Aktifkan semula bila-bila masa dari halaman ini.",
      });
      await loadState();
    } catch (err) {
      setMfaMessage({
        kind: "err",
        text:
          err instanceof Error
            ? err.message
            : "Gagal melumpuhkan MFA. Cuba lagi.",
      });
    } finally {
      setActionBusy(false);
    }
  }

  // ---------- Paparan ----------
  if (state.status === "loading") {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Keselamatan Akaun</h1>
        <p className="text-sm text-muted-foreground">
          Tukar kata laluan dan urus pengesahan 2-langkah (MFA).
        </p>
      </div>

      {requiredBanner && privileged && !state.verifiedFactor && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>MFA wajib untuk peranan {state.role}.</strong> Sila siapkan
          persediaan pengesahan 2-langkah di bawah sebelum meneruskan
          penggunaan sistem.
        </div>
      )}

      {mfaMessage && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            mfaMessage.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {mfaMessage.text}
        </div>
      )}

      {/* ---------- MFA ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            Pengesahan 2-Langkah (MFA)
          </CardTitle>
          <CardDescription>
            {privileged
              ? "Wajib untuk peranan admin & head_governance — setiap log masuk memerlukan kod 6 digit dari aplikasi authenticator."
              : "Dikhaskan untuk peranan admin & head_governance."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.demo && (
            <p className="text-sm text-muted-foreground">
              Mod Demo — sambungkan Supabase untuk fungsi keselamatan sebenar.
            </p>
          )}

          {!state.demo && privileged && !state.verifiedFactor && !enrolling && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Tiada MFA aktif untuk akaun ini. Sediakan sekarang untuk
                melindungi akaun anda.
              </p>
              <Button onClick={startEnroll} disabled={mfaBusy}>
                {mfaBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                <Smartphone className="h-4 w-4" />
                Sediakan MFA
              </Button>
            </div>
          )}

          {!state.demo && privileged && enrolling && (
            <div className="space-y-4">
              <div className="flex flex-col items-start gap-4 sm:flex-row">
                {qr && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qr}
                    alt="Kod QR MFA"
                    className="h-44 w-44 rounded-lg border bg-white p-2"
                  />
                )}
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    Langkah 1 — Imbas kod QR
                  </p>
                  <p className="text-muted-foreground">
                    Gunakan aplikasi authenticator (cth. Google Authenticator,
                    Microsoft Authenticator) untuk mengimbas kod QR di
                    sebelah kiri.
                  </p>
                  <p className="font-medium">Langkah 2 — Masukkan kod 6 digit</p>
                  <p className="text-muted-foreground">
                    Masukkan kod yang dipaparkan oleh aplikasi untuk
                    mengesahkan persediaan.
                  </p>
                </div>
              </div>

              {secret && (
                <div className="space-y-1 text-sm">
                  <Label>Kunci rahsia (guna jika tidak dapat imbas QR)</Label>
                  <Input
                    readOnly
                    value={secret}
                    className="font-mono"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                </div>
              )}

              <form
                onSubmit={confirmEnroll}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <div className="space-y-1">
                  <Label htmlFor="enrollCode">Kod pengesahan</Label>
                  <Input
                    id="enrollCode"
                    className="w-36 text-center text-lg tracking-[0.3em]"
                    placeholder="••••••"
                    inputMode="numeric"
                    maxLength={6}
                    value={enrollCode}
                    onChange={(e) =>
                      setEnrollCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    required
                  />
                </div>
                <Button type="submit" disabled={mfaBusy}>
                  {mfaBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Aktifkan MFA
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cancelEnroll}
                  disabled={mfaBusy}
                >
                  Batal
                </Button>
              </form>
            </div>
          )}

          {!state.demo && privileged && state.verifiedFactor && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">MFA aktif</p>
                  <p className="text-emerald-700">
                    Akaun anda dilindungi pengesahan 2-langkah
                    {state.verifiedFactor.createdAt
                      ? ` sejak ${new Date(
                          state.verifiedFactor.createdAt,
                        ).toLocaleDateString("ms-MY")}`
                      : ""}
                    . Setiap log masuk memerlukan kod 6 digit.
                  </p>
                </div>
              </div>

              {state.currentLevel !== "aal2" && (
                <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
                  <p className="text-sm text-amber-900">
                    Sesi semasa belum disahkan MFA. Masukkan kod authenticator
                    untuk melengkapkan pengesahan dan meneruskan.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      className="w-36 text-center text-lg tracking-[0.3em]"
                      placeholder="••••••"
                      inputMode="numeric"
                      maxLength={6}
                      value={confirmOtp}
                      onChange={(e) =>
                        setConfirmOtp(
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                    />
                    <Button
                      onClick={confirmSessionOtp}
                      disabled={actionBusy || !confirmOtp}
                    >
                      {actionBusy && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <ShieldCheck className="h-4 w-4" />
                      Sahkan & Teruskan
                    </Button>
                  </div>
                </div>
              )}

              {state.currentLevel === "aal2" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Untuk melumpuhkan MFA, masukkan kod authenticator semasa
                    sebagai pengesahan.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      className="w-36 text-center text-lg tracking-[0.3em]"
                      placeholder="••••••"
                      inputMode="numeric"
                      maxLength={6}
                      value={confirmOtp}
                      onChange={(e) =>
                        setConfirmOtp(
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                    />
                    <Button
                      variant="destructive"
                      onClick={disableMfa}
                      disabled={actionBusy || !confirmOtp}
                    >
                      {actionBusy && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <ShieldOff className="h-4 w-4" />
                      Lumpuhkan MFA
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Amaran: jika anda hilang akses ke aplikasi authenticator
                    tanpa kod sandaran, anda mungkin terkunci — hubungi
                    pentadbir sistem untuk bantuan.
                  </p>
                </div>
              )}
            </div>
          )}

          {!state.demo && privileged && state.verifiedFactor && (
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
              Selesai — Ke Dashboard
            </Button>
          )}

          {!state.demo && !privileged && (
            <p className="text-sm text-muted-foreground">
              Akaun anda tidak memerlukan MFA. Hubungi pentadbir jika anda
              merasakan peranan anda patut dilindungi pengesahan 2-langkah.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ---------- Tukar kata laluan ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-5 w-5 text-primary" />
            Tukar Kata Laluan
          </CardTitle>
          <CardDescription>
            Kata laluan minimum 8 aksara. Disyorkan: gabungan huruf besar,
            huruf kecil, nombor dan simbol.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.demo ? (
            <p className="text-sm text-muted-foreground">
              Mod Demo — sambungkan Supabase untuk menukar kata laluan.
            </p>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Kata laluan baharu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      className="pl-9"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={8}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Sahkan kata laluan</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      className="pl-9"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={8}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              {state.verifiedFactor && (
                <div className="space-y-1">
                  <Label htmlFor="pwOtp">
                    Kod authenticator (pengesahan MFA)
                  </Label>
                  <Input
                    id="pwOtp"
                    className="w-36 text-center text-lg tracking-[0.3em]"
                    placeholder="••••••"
                    inputMode="numeric"
                    maxLength={6}
                    value={pwOtp}
                    onChange={(e) =>
                      setPwOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Diperlukan kerana akaun anda menggunakan MFA.
                  </p>
                </div>
              )}

              {pwMessage && (
                <div
                  className={`rounded-md border px-3 py-2 text-sm ${
                    pwMessage.kind === "ok"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  {pwMessage.text}
                </div>
              )}

              <Button type="submit" disabled={pwBusy}>
                {pwBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                Tukar Kata Laluan
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
