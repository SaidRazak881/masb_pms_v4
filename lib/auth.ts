import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Pengesahan & Pengurusan Akaun — Fasa 6.
 *
 * Reka bentuk (menggantikan MFA Fasa 5):
 *   • Log masuk HANYA dengan e-mel + kata laluan. Tiada TOTP/MFA.
 *   • Kata laluan lalai pertama: `masb.12345` (DEFAULT_PASSWORD).
 *   • Pengguna yang masih guna kata laluan lalai WAJIB tukar — dipaksa
 *     melalui `must_change_password` (bendera dibaca dari pangkalan data,
 *     dikuatkuasakan oleh AccountGuard + RLS/RPC).
 *   • Akaun baharu mendaftar sendiri → `account_status = 'pending'` →
 *     mesti diluluskan Super Admin.
 *   • Super Admin (`saidrazak881@gmail.com`) mengurus semua akaun melalui
 *     RPC `admin_*` di `lib/supabase/user-management.sql`.
 *
 * Semua keputusan kebenaran dibaca dari PANGKALAN DATA (bukan disimpan dalam
 * klien), supaya tidak boleh dipintas dengan mengubah suai localStorage.
 */

// ---------------------------------------------------------------------------
// Peranan
// ---------------------------------------------------------------------------

export type UserRole =
  | "super_admin"
  | "admin"
  | "head_governance"
  | "manager"
  | "executive"
  | "finance"
  | "staff"
  | "viewer";

export const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Pentadbir Sistem",
  head_governance: "Head Governance",
  manager: "Pengurus",
  executive: "Eksekutif",
  finance: "Kewangan",
  staff: "Staf",
  viewer: "Pemerhati",
};

/** Role yang boleh dipilih oleh Super Admin dalam dashboard pengurusan. */
export const ASSIGNABLE_ROLES: UserRole[] = [
  "admin",
  "head_governance",
  "manager",
  "executive",
  "finance",
  "staff",
  "viewer",
];

export function roleLabel(role: string | null | undefined): string {
  if (!role) return "Pengguna";
  return ROLE_LABEL[role] ?? role;
}

/** Super Admin = pemilik sistem ( Master Admin ). */
export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === "super_admin";
}

// ---------------------------------------------------------------------------
// Status akaun
// ---------------------------------------------------------------------------

export type AccountStatus = "pending" | "active" | "blocked";

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  pending: "Menunggu Kelulusan",
  active: "Aktif",
  blocked: "Disekat",
};

export const ACCOUNT_STATUS_TONE: Record<
  AccountStatus,
  "amber" | "emerald" | "rose"
> = {
  pending: "amber",
  active: "emerald",
  blocked: "rose",
};

// ---------------------------------------------------------------------------
// Kata laluan
// ---------------------------------------------------------------------------

/** Kata laluan lalai rasmi sistem (Fasa 6). */
export const DEFAULT_PASSWORD = "masb.12345";

export const MIN_PASSWORD_LENGTH = 8;

/** E-mel Master Admin / Super Admin. */
export const SUPER_ADMIN_EMAIL = "saidrazak881@gmail.com";

export type PasswordIssue =
  | "too_short"
  | "is_default"
  | "no_letter"
  | "no_digit"
  | "same_as_current"
  | "mismatch";

const PASSWORD_ISSUE_TEXT: Record<PasswordIssue, string> = {
  too_short: `Kata laluan mesti sekurang-kurangnya ${MIN_PASSWORD_LENGTH} aksara.`,
  is_default:
    "Kata laluan baharu tidak boleh sama dengan kata laluan lalai sistem.",
  no_letter: "Kata laluan mesti mengandungi sekurang-kurangnya satu huruf.",
  no_digit: "Kata laluan mesti mengandungi sekurang-kurangnya satu nombor.",
  same_as_current:
    "Kata laluan baharu mestilah berbeza daripada kata laluan semasa.",
  mismatch: "Kata laluan baharu dan pengesahan tidak sepadan.",
};

/**
 * Pengesahan kata laluan di klien — CERMIN kepada
 * `public.assert_password_acceptable()` dalam pangkalan data.
 * Pangkalan data tetap menjadi penguat kuasa muktamad.
 */
export function validateNewPassword(
  password: string,
  confirm?: string,
): { ok: true } | { ok: false; issue: PasswordIssue; message: string } {
  const fail = (issue: PasswordIssue) => ({
    ok: false as const,
    issue,
    message: PASSWORD_ISSUE_TEXT[issue],
  });

  if (!password || password.length < MIN_PASSWORD_LENGTH) return fail("too_short");
  if (password === DEFAULT_PASSWORD) return fail("is_default");
  if (!/[A-Za-z]/.test(password)) return fail("no_letter");
  if (!/[0-9]/.test(password)) return fail("no_digit");
  if (confirm !== undefined && confirm !== password) return fail("mismatch");

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Bacaan profil semasa (dari pangkalan data)
// ---------------------------------------------------------------------------

export type AccountSnapshot = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole | null;
  accountStatus: AccountStatus;
  mustChangePassword: boolean;
  /** Sebab sekatan (jika ada) — dipaparkan kepada pengguna yang disekat. */
  blockReason?: string | null;
  isDemo: boolean;
};

/**
 * Baca profil akaun semasa. Menggunakan RPC `SECURITY DEFINER`
 * (`my_account_status`, `my_password_change_required`) supaya nilai boleh
 * dibaca walaupun polisi RLS menghadkan baris profil.
 */
export async function fetchAccountSnapshot(
  supabase: SupabaseClient,
  userId: string,
  email: string,
): Promise<Omit<AccountSnapshot, "isDemo">> {
  // Profil: nama + role + sebab sekatan (RLS membenarkan baris sendiri).
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, role, block_reason")
    .eq("id", userId)
    .maybeSingle();

  const row = profile as
    | { full_name?: string | null; role?: string | null; block_reason?: string | null }
    | null;

  // Status & bendera kata laluan melalui RPC (kalis RLS).
  const [{ data: statusData }, { data: pwData }] = await Promise.all([
    supabase.rpc("my_account_status"),
    supabase.rpc("my_password_change_required"),
  ]);

  const status = (statusData as string | null) ?? null;

  return {
    id: userId,
    email,
    fullName: row?.full_name || email,
    role: (row?.role as UserRole | null) ?? null,
    // Jika RPC belum dipasang (DB belum dikemas kini), jangan kunci pengguna
    // di luar aplikasi — anggap aktif tetapi biar API menolak bila perlu.
    accountStatus: (status as AccountStatus | null) ?? "active",
    mustChangePassword: Boolean(pwData),
    blockReason: row?.block_reason ?? null,
  };
}

/**
 * Keputusan akses untuk guard aplikasi.
 * `redirect` = laluan yang pengguna mesti pergi; null = benarkan teruskan.
 */
export function resolveAccountAccess(snapshot: {
  accountStatus: AccountStatus;
  mustChangePassword: boolean;
  role: UserRole | null;
  blockReason?: string | null;
}): { redirect: string | null; reason: string | null } {
  if (snapshot.accountStatus === "pending") {
    return {
      redirect: "/pending-approval",
      reason: "Akaun anda menunggu kelulusan Super Admin.",
    };
  }

  if (snapshot.accountStatus === "blocked") {
    // Sebab sekatan dibawa melalui URL kerana sesi dibuang sebaik sahaja
    // pengguna dialihkan — halaman /account-blocked tidak dapat membacanya
    // dari pangkalan data tanpa sesi.
    const reason = snapshot.blockReason?.trim();
    const query = reason
      ? `?reason=${encodeURIComponent(reason)}`
      : "";
    return {
      redirect: `/account-blocked${query}`,
      reason: "Akaun anda telah disekat.",
    };
  }

  return { redirect: null, reason: null };
}

// ---------------------------------------------------------------------------
// Terjemahan ralat Supabase Auth → Bahasa Melayu
// ---------------------------------------------------------------------------

export function translateAuthError(
  message: string | undefined,
  fallback: string,
): string {
  const m = (message ?? "").toLowerCase();

  if (m.includes("invalid login credentials") || m.includes("invalid credentials"))
    return "E-mel atau kata laluan tidak sah.";
  if (m.includes("email not confirmed"))
    return "E-mel anda belum disahkan. Semak peti masuk anda atau hubungi Super Admin.";
  if (m.includes("user not found"))
    return "Akaun tidak dijumpai. Semak e-mel atau daftar akaun baharu.";
  if (m.includes("rate limit") || m.includes("too many requests"))
    return "Terlalu banyak percubaan. Sila tunggu beberapa minit dan cuba lagi.";
  if (m.includes("password should be at least"))
    return `Kata laluan mesti sekurang-kurangnya ${MIN_PASSWORD_LENGTH} aksara.`;
  if (m.includes("email is invalid") || m.includes("invalid email"))
    return "Format e-mel tidak sah.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "E-mel ini sudah berdaftar. Cuba log masuk atau guna 'Lupa Kata Laluan'.";
  if (m.includes("for security purposes") || m.includes("generic error"))
    return "Permintaan tidak dapat diproses. Semak e-mel anda atau cuba lagi.";
  if (m.includes("access_denied") || m.includes("42501"))
    return "Anda tiada kebenaran untuk melakukan tindakan ini.";
  if (m.includes("account_not_active"))
    return "Akaun anda tidak aktif. Hubungi Super Admin.";
  if (m.includes("self_block_forbidden"))
    return "Anda tidak boleh menyekat akaun sendiri.";
  if (m.includes("self_reset_forbidden"))
    return "Untuk akaun sendiri, guna borang Tukar Kata Laluan di halaman ini.";
  if (m.includes("last_super_admin"))
    return "Sekurang-kurangnya satu Super Admin aktif mesti kekal.";
  if (m.includes("role_not_allowed"))
    return "Role Super Admin hanya boleh diberi melalui SQL oleh pemilik sistem.";
  if (m.includes("user_not_found"))
    return "Pengguna tidak dijumpai.";
  if (m.includes("password_too_short"))
    return PASSWORD_ISSUE_TEXT.too_short;
  if (m.includes("password_is_default"))
    return PASSWORD_ISSUE_TEXT.is_default;
  if (m.includes("password_too_weak"))
    return "Kata laluan mesti mengandungi huruf dan nombor.";

  return message?.trim() ? message : fallback;
}

/** Buang kod ralat dalaman (cth. "ACCESS_DENIED: ...") → teks mesra. */
export function stripErrorCode(message: string): string {
  return message.replace(/^[A-Z_]+:\s*/, "").trim();
}
