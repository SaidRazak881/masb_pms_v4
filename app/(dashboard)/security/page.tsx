"use client";

/**
 * Halaman Keselamatan — Fasa 6.
 *
 * TIADA MFA/TOTP. Sistem hanya menggunakan e-mel + kata laluan.
 *
 * Fungsi:
 *   1. Notis WAJIB tukar kata laluan apabila `must_change_password = true`
 *      (cth. log masuk pertama dengan kata laluan lalai `masb.12345`, atau
 *      selepas Super Admin set semula kata laluan).
 *   2. Borang tukar kata laluan sendiri.
 *   3. Aliran set semula kata laluan dari pautan e-mel (`?reset=1`) —
 *      Supabase menghantar pengguna ke sini dengan token pemulihan dalam URL.
 *   4. Paparan maklumat akaun (role, status, tarikh tukar kata laluan).
 *
 * Selepas kata laluan berjaya ditukar, RPC `mark_password_changed()`
 * memadamkan bendera wajib-tukar di pangkalan data.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Info,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  UserCog,
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
import {
  DEFAULT_PASSWORD,
  MIN_PASSWORD_LENGTH,
  fetchAccountSnapshot,
  roleLabel,
  stripErrorCode,
  translateAuthError,
  validateNewPassword,
  type AccountSnapshot,
} from "@/lib/auth";

const HAS_SUPABASE = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

type Message = { kind: "ok" | "err"; text: string } | null;

export default function SecurityPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<AccountSnapshot | null>(null);

  // `?required=1` → notis wajib tukar; `?next=` → destinasi selepas tukar.
  const [requiredMode, setRequiredMode] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [nextPath, setNextPath] = useState("/dashboard");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  // -----------------------------------------------------------------------
  // Muat status akaun
  // -----------------------------------------------------------------------
  const load = useCallback(async () => {
    if (!HAS_SUPABASE) {
      setSnapshot({
        id: "demo-user",
        email: "demo@mimos.my",
        fullName: "Pengguna Demo",
        role: "admin",
        accountStatus: "active",
        mustChangePassword: true,
        isDemo: true,
      });
      setRequiredMode(true);
      setLoading(false);
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

      const snap = await fetchAccountSnapshot(
        supabase,
        session.user.id,
        session.user.email ?? "",
      );
      setSnapshot({ ...snap, isDemo: false });
      setRequiredMode(snap.mustChangePassword);
    } catch {
      // Jika RPC belum dipasang, jangan kunci pengguna — benarkan tukar
      // kata laluan tanpa bendera wajib.
      setRequiredMode(false);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    setRequiredMode(q.get("required") === "1");
    setResetMode(q.get("reset") === "1");
    const next = q.get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) setNextPath(next);
    void load();
  }, [load]);

  // -----------------------------------------------------------------------
  // Tukar kata laluan
  // -----------------------------------------------------------------------
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    // Tangkap keadaan semasa SEBELUM sebarang kemas kini state — digunakan
    // untuk memutuskan sama ada pengguna perlu dialihkan selepas berjaya.
    const wasForced = requiredMode || Boolean(snapshot?.mustChangePassword);
    const wasReset = resetMode;

    // Semak kata laluan semasa (kecuali dalam aliran set semula e-mel,
    // di mana Supabase sudah mengesahkan identiti melalui token).
    const check = validateNewPassword(newPassword, confirmPassword);
    if (!check.ok) {
      setMessage({ kind: "err", text: check.message });
      return;
    }

    if (snapshot?.isDemo) {
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        setMessage({
          kind: "ok",
          text: "Mod Demo — kata laluan tidak benar-benar ditukar.",
        });
      }, 400);
      return;
    }

    setBusy(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Sahkan kata laluan semasa dengan log masuk semula — ini mengelakkan
      // sesi yang ditinggalkan terbuka menukar kata laluan tanpa bukti.
      if (!resetMode && snapshot?.email) {
        if (!currentPassword) {
          setMessage({
            kind: "err",
            text: "Masukkan kata laluan semasa untuk pengesahan.",
          });
          setBusy(false);
          return;
        }
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: snapshot.email,
          password: currentPassword,
        });
        if (verifyError) {
          setMessage({
            kind: "err",
            text: translateAuthError(
              verifyError.message,
              "Kata laluan semasa tidak sah.",
            ),
          });
          setBusy(false);
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      // Padam bendera wajib-tukar di pangkalan data.
      try {
        await supabase.rpc("mark_password_changed");
      } catch {
        // Jika RPC belum dipasang, bendera kekal — pengguna akan diminta lagi.
      }

      setSnapshot((s) => (s ? { ...s, mustChangePassword: false } : s));
      setRequiredMode(false);
      setResetMode(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({
        kind: "ok",
        text: resetMode
          ? "Kata laluan berjaya ditetapkan. Anda boleh teruskan."
          : "Kata laluan berjaya ditukar. Gunakan kata laluan baharu pada log masuk seterusnya.",
      });

      // Aliran set semula / wajib tukar: bawa pengguna ke destinasi asal.
      if (wasReset || wasForced) {
        setTimeout(() => {
          router.push(nextPath);
          router.refresh();
        }, 1200);
      } else {
        router.refresh();
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      setMessage({
        kind: "err",
        text: stripErrorCode(translateAuthError(raw, "Gagal menukar kata laluan.")),
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const mustChange = requiredMode || Boolean(snapshot?.mustChangePassword);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Keselamatan</h1>
        <p className="text-sm text-muted-foreground">
          Kata laluan akaun anda. Sistem ini menggunakan e-mel dan kata laluan
          sahaja.
        </p>
      </div>

      {/* Notis wajib tukar kata laluan */}
      {mustChange && (
        <Card className="border-amber-300 bg-amber-50/60">
          <CardHeader className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-200 text-amber-800">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base text-amber-900">
                  Anda wajib menukar kata laluan
                </CardTitle>
                <CardDescription className="text-amber-800">
                  Akaun anda masih menggunakan kata laluan lalai{" "}
                  <code className="rounded bg-white/70 px-1 font-mono font-semibold">
                    {DEFAULT_PASSWORD}
                  </code>{" "}
                  atau kata laluan anda telah diset semula oleh Super Admin.
                  Tukar kata laluan untuk meneruskan penggunaan sistem.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {resetMode && !mustChange && (
        <Card className="border-sky-300 bg-sky-50/60">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-200 text-sky-800">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base text-sky-900">
                  Tetapkan kata laluan baharu
                </CardTitle>
                <CardDescription className="text-sky-800">
                  Anda tiba dari pautan pemulihan kata laluan. Masukkan kata
                  laluan baharu di bawah.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Borang tukar kata laluan */}
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Tukar Kata Laluan
          </CardTitle>
          <CardDescription>
            Sekurang-kurangnya {MIN_PASSWORD_LENGTH} aksara, mengandungi huruf
            dan nombor, dan bukan kata laluan lalai sistem.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4">
            {!resetMode && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Kata Laluan Semasa</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required={!snapshot?.isDemo}
                  placeholder={snapshot?.isDemo ? "Mod demo — tidak diperlukan" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  Diperlukan untuk mengesahkan identiti anda sebelum kata laluan
                  ditukar.
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Kata Laluan Baharu</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Sahkan Kata Laluan Baharu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                />
              </div>
            </div>

            {message && (
              <div
                className={
                  message.kind === "ok"
                    ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                    : "rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                }
              >
                {message.text}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mustChange ? "Tukar Kata Laluan & Teruskan" : "Tukar Kata Laluan"}
            </Button>

            {mustChange && (
              <p className="text-xs text-muted-foreground">
                Anda tidak boleh menggunakan modul lain sehingga kata laluan
                ditukar.
              </p>
            )}
          </CardFooter>
        </form>
      </Card>

      {/* Maklumat akaun */}
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog className="h-4 w-4 text-muted-foreground" />
            Maklumat Akaun
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          <Row label="Nama" value={snapshot?.fullName ?? "—"} />
          <Row label="E-mel" value={snapshot?.email ?? "—"} />
          <Row label="Peranan" value={roleLabel(snapshot?.role)} />
          <Row
            label="Status akaun"
            value={
              snapshot?.accountStatus === "active"
                ? "Aktif"
                : snapshot?.accountStatus === "pending"
                  ? "Menunggu Kelulusan"
                  : snapshot?.accountStatus === "blocked"
                    ? "Disekat"
                    : "—"
            }
          />
          {snapshot?.isDemo && (
            <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Mod Demo — tiada sambungan Supabase, jadi kata laluan tidak
              benar-benar ditukar.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-2 border-t pt-4">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              Terlupa kata laluan anda? Minta{" "}
              <strong>Super Admin</strong> set semula ke kata laluan lalai
              melalui dashboard pengurusan pengguna, atau guna{" "}
              <Link href="/forgot-password" className="text-primary hover:underline">
                pautan set semula melalui e-mel
              </Link>
              .
            </p>
          </div>
          {mustChange && (
            <Link href={nextPath} className="ml-auto">
              <Button variant="ghost" size="sm">
                Langkau buat masa ini
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>

      {/* Pengesahan status */}
      {!mustChange && !snapshot?.isDemo && (
        <div className="flex items-center gap-2 text-xs text-emerald-700">
          <BadgeCheck className="h-4 w-4" />
          Kata laluan anda telah dikemas kini. Tiada tindakan diperlukan.
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
