"use client";

/**
 * Pendaftaran Akaun Baharu — Fasa 6.
 *
 * `supabase.auth.signUp()` hanya mencipta baris dalam `auth.users`.
 * Profil `public.user_profiles` dicipta secara automatik oleh trigger
 * `on_auth_user_created` (lihat lib/supabase/user-management.sql) dengan:
 *   role            = 'viewer'   (paling rendah)
 *   account_status  = 'pending'  (perlu kelulusan Super Admin)
 *   must_change_password = true
 *
 * Pengguna TIDAK boleh memilih role sendiri — itu keputusan Super Admin.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  GraduationCap,
  IdCard,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
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
import {
  DEFAULT_PASSWORD,
  MIN_PASSWORD_LENGTH,
  validateNewPassword,
} from "@/lib/auth";

const HAS_SUPABASE = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  password: string;
  confirmPassword: string;
};

const EMPTY: FormState = {
  fullName: "",
  email: "",
  phone: "",
  designation: "",
  department: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Pengesahan klien (cermin kepada assert_password_acceptable di DB).
    if (form.fullName.trim().length < 3) {
      setError("Sila masukkan nama penuh anda.");
      return;
    }

    if (form.password === DEFAULT_PASSWORD) {
      setError(
        "Jangan guna kata laluan lalai sistem semasa mendaftar. Pilih kata laluan anda sendiri.",
      );
      return;
    }

    const check = validateNewPassword(form.password, form.confirmPassword);
    if (!check.ok) {
      setError(check.message);
      return;
    }

    setBusy(true);

    // Mod demo: tiada env Supabase — tunjuk pengesahan simulasi.
    if (!HAS_SUPABASE) {
      setTimeout(() => {
        setBusy(false);
        setSubmitted(true);
      }, 400);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            full_name: form.fullName.trim(),
            phone: form.phone.trim() || undefined,
            designation: form.designation.trim() || undefined,
            department: form.department.trim() || undefined,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Jika projek memerlukan pengesahan e-mel, sesi tidak dikembalikan.
      if (!data.session && !data.user) {
        setError(
          "Pendaftaran diterima tetapi e-mel anda perlu disahkan terlebih dahulu. Semak peti masuk anda, kemudian cuba lagi.",
        );
        setBusy(false);
        return;
      }

      // Buang sesi — pengguna pending belum dibenarkan masuk.
      await supabase.auth.signOut();
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Pendaftaran gagal.";
      const { translateAuthError } = await import("@/lib/auth");
      setError(translateAuthError(message, "Pendaftaran gagal."));
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border-0 shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl">Permohonan Dihantar</CardTitle>
            <CardDescription>
              Akaun anda telah dicipta dan berstatus{" "}
              <span className="font-semibold text-amber-700">
                Menunggu Kelulusan
              </span>
              .
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sky-900">
            <p className="font-medium">Apa seterusnya?</p>
            <ol className="mt-1.5 list-decimal space-y-1 pl-4">
              <li>
                Super Admin akan menyemak permohonan anda di dashboard
                pengurusan pengguna.
              </li>
              <li>
                Selepas diluluskan, anda boleh log masuk dengan e-mel{" "}
                <span className="font-mono font-semibold">{form.email}</span>{" "}
                dan kata laluan yang anda pilih.
              </li>
              <li>
                Jika anda cuba log masuk sebelum diluluskan, sistem akan
                memaparkan semula status &quot;Menunggu Kelulusan&quot;.
              </li>
            </ol>
          </div>
          {!HAS_SUPABASE && (
            <p className="text-xs text-muted-foreground">
              Mod Demo — pendaftaran disimulasikan, tiada akaun sebenar
              dicipta.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button className="w-full" onClick={() => router.push("/login")}>
            Kembali ke Log Masuk
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <UserPlus className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl">Daftar Akaun Baharu</CardTitle>
          <CardDescription>
            Permohonan anda perlu diluluskan oleh Super Admin sebelum boleh
            menggunakan sistem.
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nama Penuh *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                className="pl-9"
                placeholder="cth. Nurul Aini binti Hassan"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mel *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                className="pl-9"
                placeholder="nama@mimos.my"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  className="pl-9"
                  placeholder="012-345 6789"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  autoComplete="tel"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="designation">Jawatan</Label>
              <div className="relative">
                <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="designation"
                  className="pl-9"
                  placeholder="cth. Eksekutif Latihan"
                  value={form.designation}
                  onChange={(e) => set("designation", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="department">Jabatan / Unit</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="department"
                className="pl-9"
                placeholder="cth. MIMOS Academy (MASB)"
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="password">Kata Laluan *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Sahkan Kata Laluan *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  className="pl-9"
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Sekurang-kurangnya {MIN_PASSWORD_LENGTH} aksara, mengandungi huruf
            dan nombor. Jangan guna kata laluan lalai sistem (
            <code className="font-mono">{DEFAULT_PASSWORD}</code>).
          </p>

          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <p className="flex items-start gap-1.5">
              <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Akaun baharu diberi role <strong>Pemerhati (viewer)</strong> dan
              status <strong>Menunggu Kelulusan</strong>. Super Admin akan
              menetapkan role sebenar anda selepas meluluskan permohonan.
            </p>
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
            Hantar Permohonan
          </Button>
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Sudah ada akaun? Log masuk
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
