"use server";

/**
 * user-management-actions.ts — Server Actions bagi Pengurusan Pengguna (Fasa 6).
 *
 * Semua tindakan memanggil RPC `SECURITY DEFINER` dalam
 * `lib/supabase/user-management.sql`:
 *
 *   - `admin_list_users`              → senarai pengguna + penapis/carian
 *   - `admin_user_summary`            → KPI dashboard
 *   - `admin_approve_user`            → lulus pengguna pending + set role
 *   - `admin_set_user_blocked`        → sekat / nyahsekat + tamatkan sesi
 *   - `admin_change_user_role`        → tukar role
 *   - `admin_reset_user_password`     → set semula ke kata laluan lalai
 *   - `admin_require_password_change` → wajibkan tukar kata laluan
 *
 * KESELAMATAN: fail ini TIDAK mengandungi sebarang keputusan kebenaran.
 * Setiap RPC menyemak `can_manage_users()` sendiri dan menulis audit log,
 * jadi walaupun Server Action ini dipanggil secara terus (melangkau UI),
 * pangkalan data tetap menolak pengguna yang bukan Super Admin.
 *
 * Mod demo: tanpa env Supabase, tindakan mengembalikan data simulasi supaya
 * dashboard pengurusan boleh dilayari sepenuhnya.
 */

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { stripErrorCode, translateAuthError } from "@/lib/auth";
import {
  DEFAULT_APPROVAL_ROLE,
  validateBlockReason,
  type AdminActionResult,
  type ManagedUser,
  type UserRole,
  type UserSummary,
} from "@/lib/user-management";

/* ====================== Bentuk keputusan ====================== */

export interface ActionResult<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
}

function fail(message: string): ActionResult<never> {
  return { ok: false, message };
}

function isDemoMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Terjemah ralat RPC pengurusan pengguna kepada Bahasa Melayu. */
function translateAdminError(error: { code?: string; message?: string }): string {
  const raw = error.message ?? "";
  const mapped = translateAuthError(raw, "Tindakan gagal.");
  return stripErrorCode(mapped);
}

/** Sahkan identiti & kuasa Super Admin sebelum sebarang tindakan. */
async function assertSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, error: fail("Sesi anda telah tamat. Sila log masuk semula.") };
  }

  const { data: allowed, error: rpcError } = await supabase.rpc(
    "can_manage_users",
  );

  if (rpcError) {
    return {
      supabase,
      error: fail(
        "Fungsi pengurusan pengguna belum dipasang di pangkalan data. " +
          "Jalankan lib/supabase/user-management.sql dalam Supabase SQL Editor.",
      ),
    };
  }

  if (!allowed) {
    return {
      supabase,
      error: fail("Akses ditolak — halaman ini hanya untuk Super Admin."),
    };
  }

  return { supabase, error: null, userId: user.id };
}

/* ====================== Data demo ====================== */

const DEMO_USERS: ManagedUser[] = [
  {
    id: "demo-super",
    full_name: "Said Razak",
    email: "saidrazak881@gmail.com",
    phone: "012-345 6789",
    designation: "Master Admin",
    department: "MIMOS Academy (MASB)",
    role: "super_admin",
    account_status: "active",
    is_active: true,
    must_change_password: true,
    password_changed_at: null,
    last_login_at: null,
    created_at: "2026-08-01T09:00:00+08:00",
    approved_at: "2026-08-01T09:00:00+08:00",
    blocked_at: null,
    block_reason: null,
    auth_email_confirmed_at: "2026-08-01T09:00:00+08:00",
    auth_last_sign_in_at: "2026-09-02T08:30:00+08:00",
  },
  {
    id: "demo-pending-1",
    full_name: "Nurul Aini Hassan",
    email: "nurul.aini@mimos.my",
    phone: "013-222 4455",
    designation: "Eksekutif Latihan",
    department: "MIMOS Academy (MASB)",
    role: "viewer",
    account_status: "pending",
    is_active: false,
    must_change_password: true,
    password_changed_at: null,
    last_login_at: null,
    created_at: "2026-09-01T14:20:00+08:00",
    approved_at: null,
    blocked_at: null,
    block_reason: null,
    auth_email_confirmed_at: "2026-09-01T14:20:00+08:00",
    auth_last_sign_in_at: null,
  },
  {
    id: "demo-pending-2",
    full_name: "Ahmad Faiz Ismail",
    email: "ahmad.faiz@mimos.my",
    phone: null,
    designation: "Pembantu Tadbir",
    department: "Kewangan",
    role: "viewer",
    account_status: "pending",
    is_active: false,
    must_change_password: true,
    password_changed_at: null,
    last_login_at: null,
    created_at: "2026-09-02T10:05:00+08:00",
    approved_at: null,
    blocked_at: null,
    block_reason: null,
    auth_email_confirmed_at: null,
    auth_last_sign_in_at: null,
  },
  {
    id: "demo-gov",
    full_name: "Dr. Ahmad Nizar",
    email: "nizar.harun@mimos.my",
    phone: "019-777 8899",
    designation: "Head of Governance",
    department: "Tadbir Urus",
    role: "head_governance",
    account_status: "active",
    is_active: true,
    must_change_password: true,
    password_changed_at: null,
    last_login_at: null,
    created_at: "2026-08-01T09:05:00+08:00",
    approved_at: "2026-08-01T09:05:00+08:00",
    blocked_at: null,
    block_reason: null,
    auth_email_confirmed_at: "2026-08-01T09:05:00+08:00",
    auth_last_sign_in_at: "2026-09-01T17:45:00+08:00",
  },
  {
    id: "demo-finance",
    full_name: "Adilah Nisman",
    email: "adilah.nisman@mimos.my",
    phone: null,
    designation: "Akauntan",
    department: "Kewangan",
    role: "finance",
    account_status: "active",
    is_active: true,
    must_change_password: false,
    password_changed_at: "2026-08-20T11:00:00+08:00",
    last_login_at: null,
    created_at: "2026-08-01T09:10:00+08:00",
    approved_at: "2026-08-01T09:10:00+08:00",
    blocked_at: null,
    block_reason: null,
    auth_email_confirmed_at: "2026-08-01T09:10:00+08:00",
    auth_last_sign_in_at: "2026-08-30T09:15:00+08:00",
  },
  {
    id: "demo-blocked",
    full_name: "Bekas Kontraktor",
    email: "kontraktor.luar@mimos.my",
    phone: null,
    designation: "Kontraktor",
    department: "Luar",
    role: "staff",
    account_status: "blocked",
    is_active: false,
    must_change_password: false,
    password_changed_at: "2026-07-01T10:00:00+08:00",
    last_login_at: null,
    created_at: "2026-06-15T09:00:00+08:00",
    approved_at: "2026-06-15T09:30:00+08:00",
    blocked_at: "2026-08-28T16:00:00+08:00",
    block_reason: "Kontrak tamat — akses ditarik balik.",
    auth_email_confirmed_at: "2026-06-15T09:00:00+08:00",
    auth_last_sign_in_at: "2026-08-28T15:50:00+08:00",
  },
];

function demoSummary(users: ManagedUser[]): UserSummary {
  return {
    total_users: users.length,
    pending_users: users.filter((u) => u.account_status === "pending").length,
    active_users: users.filter((u) => u.account_status === "active").length,
    blocked_users: users.filter((u) => u.account_status === "blocked").length,
    default_password_users: users.filter((u) => u.must_change_password).length,
    super_admins: users.filter((u) => u.role === "super_admin").length,
  };
}

function demoFilter(users: ManagedUser[], search: string, status: string) {
  const q = search.trim().toLowerCase();
  return users.filter((u) => {
    const matchSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department ?? "").toLowerCase().includes(q);
    const matchStatus = !status || status === "all" || u.account_status === status;
    return matchSearch && matchStatus;
  });
}

/* ====================== Tindakan: bacaan ====================== */

/** Senarai pengguna untuk dashboard Super Admin. */
export async function listUsers(
  search = "",
  status = "all",
): Promise<ActionResult<ManagedUser[]>> {
  if (isDemoMode()) {
    return { ok: true, message: "Mod demo", data: demoFilter(DEMO_USERS, search, status) };
  }

  const guard = await assertSuperAdmin();
  if (guard.error) return guard.error;

  const { data, error } = await guard.supabase.rpc("admin_list_users", {
    p_search: search || null,
    p_status: status && status !== "all" ? status : null,
  });

  if (error) return fail(translateAdminError(error));
  return { ok: true, message: "OK", data: (data as ManagedUser[]) ?? [] };
}

/** KPI ringkasan pengurusan pengguna. */
export async function getUserSummary(): Promise<ActionResult<UserSummary>> {
  if (isDemoMode()) {
    return { ok: true, message: "Mod demo", data: demoSummary(DEMO_USERS) };
  }

  const guard = await assertSuperAdmin();
  if (guard.error) return guard.error;

  const { data, error } = await guard.supabase.rpc("admin_user_summary");
  if (error) return fail(translateAdminError(error));

  const row = Array.isArray(data) ? data[0] : data;
  return { ok: true, message: "OK", data: row as UserSummary };
}

/* ====================== Tindakan: kelulusan ====================== */

/** Luluskan pengguna baharu (pending → active) dan tetapkan role. */
export async function approveUser(
  userId: string,
  role: UserRole = DEFAULT_APPROVAL_ROLE,
): Promise<AdminActionResult> {
  if (isDemoMode()) {
    return {
      success: true,
      message: `Mod demo — permohonan diluluskan dengan role "${role}".`,
    };
  }

  const guard = await assertSuperAdmin();
  if (guard.error) return { success: false, message: guard.error.message };

  const { error } = await guard.supabase.rpc("admin_approve_user", {
    p_user_id: userId,
    p_role: role,
  });

  if (error) return { success: false, message: translateAdminError(error) };

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  return { success: true, message: "Permohonan diluluskan dan role ditetapkan." };
}

/* ====================== Tindakan: sekatan ====================== */

/** Sekat atau nyahsekat pengguna. */
export async function setUserBlocked(
  userId: string,
  blocked: boolean,
  reason: string,
): Promise<AdminActionResult> {
  const reasonCheck = validateBlockReason(blocked, reason);
  if (!reasonCheck.ok) return { success: false, message: reasonCheck.message };

  if (isDemoMode()) {
    return {
      success: true,
      message: blocked
        ? "Mod demo — pengguna disekat."
        : "Mod demo — sekatan ditarik balik.",
    };
  }

  const guard = await assertSuperAdmin();
  if (guard.error) return { success: false, message: guard.error.message };

  const { error } = await guard.supabase.rpc("admin_set_user_blocked", {
    p_user_id: userId,
    p_blocked: blocked,
    p_reason: blocked ? reason.trim() : null,
  });

  if (error) return { success: false, message: translateAdminError(error) };

  revalidatePath("/admin/users");
  return {
    success: true,
    message: blocked
      ? "Pengguna disekat dan semua sesi aktifnya ditamatkan."
      : "Sekatan ditarik balik — pengguna boleh log masuk semula.",
  };
}

/* ====================== Tindakan: role ====================== */

/** Tukar role pengguna. */
export async function changeUserRole(
  userId: string,
  role: UserRole,
): Promise<AdminActionResult> {
  if (isDemoMode()) {
    return { success: true, message: `Mod demo — role ditukar kepada "${role}".` };
  }

  const guard = await assertSuperAdmin();
  if (guard.error) return { success: false, message: guard.error.message };

  const { error } = await guard.supabase.rpc("admin_change_user_role", {
    p_user_id: userId,
    p_role: role,
  });

  if (error) return { success: false, message: translateAdminError(error) };

  revalidatePath("/admin/users");
  return { success: true, message: "Role pengguna dikemas kini." };
}

/* ====================== Tindakan: kata laluan ====================== */

/** Set semula kata laluan pengguna kepada lalai `masb.12345`. */
export async function resetUserPassword(
  userId: string,
): Promise<AdminActionResult> {
  if (isDemoMode()) {
    return {
      success: true,
      message: "Mod demo — kata laluan diset semula.",
      value: "masb.12345",
    };
  }

  const guard = await assertSuperAdmin();
  if (guard.error) return { success: false, message: guard.error.message };

  const { data, error } = await guard.supabase.rpc(
    "admin_reset_user_password",
    { p_user_id: userId },
  );

  if (error) return { success: false, message: translateAdminError(error) };

  revalidatePath("/admin/users");
  return {
    success: true,
    message:
      "Kata laluan diset semula ke lalai. Pengguna wajib menukarnya pada log masuk seterusnya.",
    value: typeof data === "string" ? data : null,
  };
}

/** Wajibkan (atau batalkan) tuntutan tukar kata laluan. */
export async function requirePasswordChange(
  userId: string,
  required: boolean,
): Promise<AdminActionResult> {
  if (isDemoMode()) {
    return {
      success: true,
      message: required
        ? "Mod demo — pengguna diwajibkan tukar kata laluan."
        : "Mod demo — tuntutan dibatalkan.",
    };
  }

  const guard = await assertSuperAdmin();
  if (guard.error) return { success: false, message: guard.error.message };

  const { error } = await guard.supabase.rpc("admin_require_password_change", {
    p_user_id: userId,
    p_required: required,
  });

  if (error) return { success: false, message: translateAdminError(error) };

  revalidatePath("/admin/users");
  return {
    success: true,
    message: required
      ? "Pengguna akan diwajibkan menukar kata laluan pada log masuk seterusnya."
      : "Tukar kata laluan wajib dibatalkan untuk pengguna ini.",
  };
}
