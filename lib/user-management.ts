/**
 * Pengurusan Pengguna — logik tulen & jenis kongsi (Fasa 6).
 *
 * Modul BIASA (bukan "use server") kerana Next.js hanya membenarkan
 * eksport fungsi async daripada fail server actions. Jenis, label dan
 * pengesahan diletakkan di sini supaya boleh dipakai oleh kedua-dua
 * server actions dan komponen klien.
 *
 * Penguat kuasa sebenar berada dalam pangkalan data:
 * `lib/supabase/user-management.sql` (RPC `admin_*` + RLS + column grant).
 */

import type { AccountStatus, UserRole } from "@/lib/auth";

export type { AccountStatus, UserRole };

/** Baris pengguna seperti dipulangkan oleh RPC `admin_list_users`. */
export type ManagedUser = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  role: UserRole;
  account_status: AccountStatus;
  is_active: boolean;
  must_change_password: boolean;
  password_changed_at: string | null;
  last_login_at: string | null;
  created_at: string;
  approved_at: string | null;
  blocked_at: string | null;
  block_reason: string | null;
  auth_email_confirmed_at: string | null;
  auth_last_sign_in_at: string | null;
};

/** KPI dashboard pengurusan pengguna (`admin_user_summary`). */
export type UserSummary = {
  total_users: number;
  pending_users: number;
  active_users: number;
  blocked_users: number;
  default_password_users: number;
  super_admins: number;
};

export type AdminActionResult = {
  success: boolean;
  message: string;
  /** Nilai dikembalikan oleh RPC (cth. kata laluan lalai selepas reset). */
  value?: string | number | null;
};

/** Penapis status yang tersedia dalam UI. */
export const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Menunggu Kelulusan" },
  { value: "active", label: "Aktif" },
  { value: "blocked", label: "Disekat" },
];

/**
 * Role yang boleh ditetapkan oleh Super Admin melalui UI.
 * `super_admin` TIDAK termasuk — ia hanya boleh diberi melalui SQL oleh
 * pemilik sistem (RPC menolak dengan ROLE_NOT_ALLOWED).
 */
export const ASSIGNABLE_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Pentadbir Sistem (admin)" },
  { value: "head_governance", label: "Head Governance" },
  { value: "manager", label: "Pengurus (manager)" },
  { value: "executive", label: "Eksekutif (executive)" },
  { value: "finance", label: "Kewangan (finance)" },
  { value: "staff", label: "Staf (staff)" },
  { value: "viewer", label: "Pemerhati (viewer)" },
];

/** Penerangan kuasa setiap role — dipaparkan semasa Super Admin memilih. */
export const ROLE_DESCRIPTION: Record<string, string> = {
  super_admin:
    "Pemilik sistem. Mengurus semua akaun pengguna: lulus, sekat, set semula kata laluan, tukar role. Mewarisi semua kuasa di bawah.",
  admin:
    "Pentadbir sistem. Import Excel, cipta & sunting program, urus template laporan, lihat semua profil.",
  head_governance:
    "Kunci/buka kunci program, lulus atau tolak Change Request, lihat audit trail penuh.",
  manager:
    "Luluskan permohonan buka kunci program, semak semua program, kelulusan kewangan.",
  executive:
    "Cipta dan sunting program yang tidak dikunci, semak laporan dan dashboard.",
  finance:
    "Urus quotation, PO, DO, invois, kos program dan status bayaran.",
  staff:
    "Cipta, sunting dan semak program yang tidak dikunci. Muat naik dokumen.",
  viewer: "Baca sahaja. Eksport laporan yang dibenarkan.",
};

/** Role lalai apabila meluluskan pengguna baharu. */
export const DEFAULT_APPROVAL_ROLE: UserRole = "staff";

/**
 * Pengesahan tindakan pengurusan sebelum dihantar ke pelayan.
 * Pangkalan data mengesahkan semula — ini hanya untuk maklum balas pantas.
 */
export function validateBlockReason(
  blocked: boolean,
  reason: string,
): { ok: true } | { ok: false; message: string } {
  if (!blocked) return { ok: true };
  const trimmed = reason.trim();
  if (trimmed.length < 5) {
    return {
      ok: false,
      message: "Sila nyatakan sebab sekatan (sekurang-kurangnya 5 aksara) untuk rekod audit.",
    };
  }
  if (trimmed.length > 300) {
    return { ok: false, message: "Sebab sekatan terlalu panjang (maksimum 300 aksara)." };
  }
  return { ok: true };
}

/** Format tarikh ringkas untuk jadual pengurusan pengguna. */
export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ms-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Label ringkas status dalam jadual. */
export const STATUS_SHORT_LABEL: Record<AccountStatus, string> = {
  pending: "Menunggu",
  active: "Aktif",
  blocked: "Disekat",
};
