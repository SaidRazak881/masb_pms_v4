"use server";

/**
 * account-manager-actions.ts — Server Actions bagi Pengesahan Alias Pengurus
 * Akaun (Fasa 8A-2).
 *
 * Semua tindakan memanggil RPC `SECURITY DEFINER` yang dipasang oleh Langkah 2
 * dan Langkah 3 (`lib/supabase/external-account-managers.sql`,
 * `lib/supabase/account-manager-resolution.sql`):
 *
 *   - `am_unresolved_values()`        → senarai nilai mentah + kategori
 *   - `am_list_staff()`               → pemilih staf (id + full_name SAHAJA, §2.8)
 *   - `am_confirm_alias(raw, id, notes)`   → manusia mengesahkan alias
 *   - `am_revoke_alias(raw)`               → batalkan alias (boleh diaudit)
 *   - `am_confirm_external(raw, name, reason, notes)` → klasifikasi orang luar (DP-9)
 *   - `am_revoke_external(raw)`            → batalkan klasifikasi luar
 *   - `can_resolve_account_managers()`     → semakan kuasa
 *
 * KESELAMATAN: fail ini TIDAK mengandungi sebarang keputusan kebenaran.
 * Setiap RPC menyemak `can_resolve_account_managers()` sendiri — fungsi tulis
 * menaikkan `42501`, fungsi baca memulangkan kosong. Ini **disahkan berkelakuan
 * di live** oleh probe L3-R S4 (deny-by-default: 0 baris tanpa identiti) dan
 * S5 (`42501` pada `am_confirm_alias` baris 11, SEBELUM sebarang `INSERT`,
 * dengan S6 mengesahkan tiada baris alias/external/audit terhasil). Jadi
 * walaupun Server Action ini dipanggil secara terus (melangkau UI), pangkalan
 * data tetap menolak.
 *
 * `revalidatePath` dipanggil selepas setiap tulisan supaya paparan seterusnya
 * membaca keadaan baharu daripada pangkalan data, bukan daripada sangkaan UI.
 *
 * Mod demo: tanpa env Supabase, **bacaan** mengembalikan data simulasi supaya
 * halaman boleh dilayari, tetapi **tulisan DITOLAK**. Simulasi tidak boleh
 * menulis — ia bukan pangkalan data, dan menganggapnya begitu ialah
 * tepat kesilapan yang dilarang ("jangan anggap demo tempatan sebagai pengeluaran").
 */

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { stripErrorCode } from "@/lib/auth";
import type {
  AmActionResult,
  AmExternalEntry,
  AmStaffOption,
  AmUnresolvedValue,
} from "@/lib/account-manager";
import {
  validateAliasConfirmation,
  validateExternalClassification,
} from "@/lib/account-manager";

const HALAMAN = "/account-managers";

/* ====================== Bentuk keputusan ====================== */

function ok(message: string, data?: unknown): AmActionResult {
  return { ok: true, message, data };
}

function fail(message: string, code?: string): AmActionResult {
  return { ok: false, message, code };
}

function isDemoMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Terjemah ralat RPC kepada Bahasa Melayu yang boleh difahami.
 *
 * `42501` ialah kod yang **dijangka** apabila pengguna tiada kuasa — ia bukan
 * kerosakan, jadi mesejnya mesti mengatakan demikian dengan jelas dan tidak
 * menakutkan ("ralat pangkalan data").
 */
function translateAmError(error: { code?: string; message?: string }): {
  message: string;
  code?: string;
} {
  const raw = error.message ?? "";
  const code = error.code;

  if (code === "42501" || /42501|tiada kuasa/i.test(raw)) {
    return {
      code: "42501",
      message:
        "Tiada kuasa. Tindakan ini memerlukan peranan Super Admin, Pentadbir, " +
        "Head Governance atau Kewangan.",
    };
  }
  if (/already exists|sudah wujud|duplicate/i.test(raw)) {
    return { code, message: "Nilai ini sudah mempunyai keputusan. Muat semula halaman." };
  }
  if (/not exist|tidak wujud|foreign key|violates/i.test(raw)) {
    return {
      code,
      message:
        "Rujukan tidak sah — staf yang dipilih mungkin tidak lagi wujud. " +
        "Muat semula halaman dan cuba lagi.",
    };
  }
  if (/P0001|RAISE/i.test(raw)) {
    // Ralat yang dinaikkan oleh fungsi itu sendiri: mesejnya sudah ditulis
    // untuk manusia dalam SQL, jadi tunjukkan ia sebagaimana adanya.
    return { code, message: stripErrorCode(raw) };
  }
  return { code, message: stripErrorCode(raw) || "Tindakan gagal." };
}

/* ====================== Data demo (bacaan sahaja) ====================== */

/**
 * Data simulasi untuk mod demo. Berdasarkan 12 nilai mentah SEBENAR daripada
 * `V4 RAW/00. Quotation Tracker (1).xlsx` supaya bentuk paparan boleh dinilai
 * tanpa Supabase — tetapi ia **tidak** boleh ditulis.
 */
const DEMO_UNRESOLVED: AmUnresolvedValue[] = [
  { raw_text: "Fuzy", jumlah_baris: 8, dari_invoices: 8, dari_staging: 1, resolved_id: null, resolved_name: null, kategori: "PERLU_PENGESAHAN", alias_wujud: false },
  { raw_text: "Fuzy / Dila", jumlah_baris: 4, dari_invoices: 4, dari_staging: 0, resolved_id: null, resolved_name: null, kategori: "BERBILANG_ORANG", alias_wujud: false },
  { raw_text: "Fuzy / Sholihin ", jumlah_baris: 2, dari_invoices: 2, dari_staging: 0, resolved_id: null, resolved_name: null, kategori: "BERBILANG_ORANG", alias_wujud: false },
  { raw_text: "Ow Zi Qi", jumlah_baris: 4, dari_invoices: 3, dari_staging: 1, resolved_id: null, resolved_name: null, kategori: "TIADA_PADANAN", alias_wujud: false },
  { raw_text: "Zalina", jumlah_baris: 7, dari_invoices: 7, dari_staging: 0, resolved_id: "00000000-0000-4000-8000-000000000001", resolved_name: "Zalina Sayuti", kategori: "SELESAI", alias_wujud: false },
];

const DEMO_STAFF: AmStaffOption[] = [
  { id: "00000000-0000-4000-8000-000000000001", full_name: "Zalina Sayuti" },
  { id: "00000000-0000-4000-8000-000000000002", full_name: "Fuziah" },
  { id: "00000000-0000-4000-8000-000000000003", full_name: "Adilah" },
  { id: "00000000-0000-4000-8000-000000000004", full_name: "Sholihin" },
];

const DEMO_TULIS =
  "Mod demo: tulisan tidak dibenarkan. Data simulasi bukan pangkalan data, " +
  "dan menganggapnya begitu dilarang. Sambungkan Supabase untuk membuat " +
  "keputusan sebenar.";

/* ====================== Penjana baris ====================== */

/**
 * Petakan baris RPC kepada `AmUnresolvedValue`.
 *
 * `BigInt` boleh muncul bagi lajur `bigint` bergantung pada pemacu, jadi
 * semua angka dinormal melalui `Number()` — paparan tidak boleh menerima
 * `BigInt` kerana `JSON.stringify` akan membaling.
 */
function toUnresolved(r: Record<string, unknown>): AmUnresolvedValue {
  return {
    raw_text: String(r.raw_text ?? ""),
    jumlah_baris: Number(r.jumlah_baris ?? 0),
    dari_invoices: Number(r.dari_invoices ?? 0),
    dari_staging: Number(r.dari_staging ?? 0),
    resolved_id: r.resolved_id == null ? null : String(r.resolved_id),
    resolved_name: r.resolved_name == null ? null : String(r.resolved_name),
    kategori: String(r.kategori ?? ""),
    alias_wujud: Boolean(r.alias_wujud),
  };
}

function toStaff(r: Record<string, unknown>): AmStaffOption {
  return { id: String(r.id ?? ""), full_name: String(r.full_name ?? "") };
}

/* ====================== Bacaan ====================== */

/**
 * Semak kuasa semasa. Digunakan oleh halaman untuk memaparkan penolakan yang
 * jelas; **bukan** kawalan keselamatan (RPC mengawal dirinya sendiri).
 */
export async function canResolveAccountManagers(): Promise<boolean> {
  if (isDemoMode()) return true;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("can_resolve_account_managers");
    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}

/** Senarai nilai mentah `Account Manager` + kategorinya. */
export async function listUnresolvedValues(): Promise<{
  rows: AmUnresolvedValue[];
  isDemo: boolean;
  error?: string;
}> {
  if (isDemoMode()) return { rows: DEMO_UNRESOLVED, isDemo: true };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("am_unresolved_values");
    if (error) {
      // `42501` di sini bermaksud pengguna tiada kuasa — RPC memulangkan kosong
      // bagi fungsi baca, tetapi jika ia sebaliknya menaikkan ralat, laporkan.
      return { rows: [], isDemo: false, error: translateAmError(error).message };
    }
    const rows = Array.isArray(data)
      ? data.map((r) => toUnresolved(r as Record<string, unknown>))
      : [];
    return { rows, isDemo: false };
  } catch (err) {
    return {
      rows: [],
      isDemo: false,
      error: `Gagal membaca nilai pengurus akaun: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

/** Senarai staf untuk pemilih — `id` + `full_name` sahaja (veto §2.8). */
export async function listStaffOptions(): Promise<{
  rows: AmStaffOption[];
  isDemo: boolean;
  error?: string;
}> {
  if (isDemoMode()) return { rows: DEMO_STAFF, isDemo: true };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("am_list_staff");
    if (error) return { rows: [], isDemo: false, error: translateAmError(error).message };
    const rows = Array.isArray(data)
      ? data.map((r) => toStaff(r as Record<string, unknown>))
      : [];
    return { rows, isDemo: false };
  } catch (err) {
    return {
      rows: [],
      isDemo: false,
      error: `Gagal membaca senarai staf: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

/* ====================== Tulisan ====================== */

/**
 * Manusia mengesahkan bahawa nilai mentah `rawText` merujuk kepada staf
 * `userId`.
 *
 * 🔴 **DP-8:** sel berbilang orang BOLEH dipetakan kepada seorang staf, tetapi
 * HANYA melalui keputusan manusia yang eksplisit. Veto Kewangan §2.4 melarang
 * **sistem** memilih; ia tidak boleh menghalang **manusia** memutuskan. Nota
 * diwajibkan untuk nilai berbilang orang supaya keputusan itu boleh diaudit
 * (syarat QA dalam DP-8).
 */
export async function confirmAlias(
  rawText: string,
  userId: string,
  notes: string,
): Promise<AmActionResult> {
  const guard = validateAliasConfirmation(rawText, userId, notes);
  if (guard) return fail(guard);
  if (isDemoMode()) return fail(DEMO_TULIS);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("am_confirm_alias", {
      p_raw_text: rawText,
      p_user_id: userId,
      p_notes: notes.trim() || null,
    });
    if (error) {
      const t = translateAmError(error);
      return fail(t.message, t.code);
    }
    revalidatePath(HALAMAN);
    const pertama = Array.isArray(data) && data.length > 0
      ? (data[0] as Record<string, unknown>)
      : null;
    const nama = pertama?.full_name ? String(pertama.full_name) : null;
    return ok(
      nama
        ? `Alias disahkan: “${rawText}” → ${nama}.`
        : `Alias disahkan untuk “${rawText}”.`,
      data,
    );
  } catch (err) {
    return fail(
      `Gagal mengesahkan alias: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Batalkan alias yang sudah disahkan.
 *
 * Syarat QA dalam DP-8: keputusan manusia mesti **boleh dibatalkan**. Tetapi
 * pembatalan alias DP-8/DP-9 mempunyai kesan kepada laporan komisen Fasa 8F,
 * jadi UI memberi amaran terlebih dahulu — pangkalan data merekodkan
 * pembatalan itu dalam `audit_logs`.
 */
export async function revokeAlias(rawText: string): Promise<AmActionResult> {
  if (!rawText.trim()) return fail("Nilai mentah tidak boleh kosong.");
  if (isDemoMode()) return fail(DEMO_TULIS);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("am_revoke_alias", {
      p_raw_text: rawText,
    });
    if (error) {
      const t = translateAmError(error);
      return fail(t.message, t.code);
    }
    revalidatePath(HALAMAN);
    return ok(`Alias untuk “${rawText}” telah dibatalkan.`, data);
  } catch (err) {
    return fail(
      `Gagal membatalkan alias: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Klasifikasikan nilai mentah sebagai **orang luar** (DP-9).
 *
 * Ini membezakan "sudah diputuskan: orang luar" daripada "belum diputuskan" —
 * kedua-duanya `account_manager_id IS NULL`, tetapi hanya yang kedua
 * memerlukan tindakan. `displayName` diwajibkan supaya laporan boleh
 * memaparkan dan memisahkan orang luar.
 */
export async function confirmExternal(
  rawText: string,
  displayName: string,
  reason: string,
  notes: string,
): Promise<AmActionResult> {
  const guard = validateExternalClassification(rawText, displayName);
  if (guard) return fail(guard);
  if (isDemoMode()) return fail(DEMO_TULIS);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("am_confirm_external", {
      p_raw_text: rawText,
      p_display_name: displayName.trim(),
      p_reason: reason.trim() || null,
      p_notes: notes.trim() || null,
    });
    if (error) {
      const t = translateAmError(error);
      return fail(t.message, t.code);
    }
    revalidatePath(HALAMAN);
    return ok(
      `“${rawText}” diklasifikasi sebagai orang luar (${displayName.trim()}). ` +
        "Ia kekal tidak diagih dan akan dilaporkan berasingan.",
      data,
    );
  } catch (err) {
    return fail(
      `Gagal mengklasifikasi orang luar: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

/** Batalkan klasifikasi orang luar. */
export async function revokeExternal(rawText: string): Promise<AmActionResult> {
  if (!rawText.trim()) return fail("Nilai mentah tidak boleh kosong.");
  if (isDemoMode()) return fail(DEMO_TULIS);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("am_revoke_external", {
      p_raw_text: rawText,
    });
    if (error) {
      const t = translateAmError(error);
      return fail(t.message, t.code);
    }
    revalidatePath(HALAMAN);
    return ok(`Klasifikasi orang luar untuk “${rawText}” telah dibatalkan.`, data);
  } catch (err) {
    return fail(
      `Gagal membatalkan klasifikasi: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

/**
 * Semak sama ada suatu nilai sudah diklasifikasi sebagai orang luar.
 * Read-only; berguna untuk pengesahan silang dalam UI.
 */
export async function isExternal(rawText: string): Promise<boolean> {
  if (isDemoMode()) return false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("is_external_account_manager", {
      p_raw: rawText,
    });
    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}

/**
 * Senarai orang luar yang sudah disahkan.
 *
 * 🟠 Nota: tiada RPC khusus untuk menyenaraikan jadual
 * `external_account_managers`; pembacaan langsung bergantung pada polisi RLS
 * `ext_am_read` (disahkan wujud oleh probe L2d: 4/4 polisi). Jika RLS menolak,
 * senarai kosong dikembalikan dan UI menyembunyikan tab itu.
 */
export async function listExternal(): Promise<{
  rows: AmExternalEntry[];
  isDemo: boolean;
  error?: string;
}> {
  if (isDemoMode()) {
    return {
      rows: [
        { raw_text: "Ow Zi Qi", display_name: "Ow Zi Qi", reason: "DP-9: orang luar", notes: null },
      ],
      isDemo: true,
    };
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("external_account_managers")
      .select("raw_text, display_name, reason, notes")
      .order("raw_text");
    if (error) return { rows: [], isDemo: false, error: translateAmError(error).message };
    const rows = (data ?? []).map((r) => ({
      raw_text: String(r.raw_text ?? ""),
      display_name: String(r.display_name ?? ""),
      reason: r.reason == null ? null : String(r.reason),
      notes: r.notes == null ? null : String(r.notes),
    }));
    return { rows, isDemo: false };
  } catch (err) {
    return {
      rows: [],
      isDemo: false,
      error: `Gagal membaca senarai orang luar: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}
