/**
 * account-manager.ts — Jenis dan pembantu TULEN bagi Pengesahan Alias
 * Pengurus Akaun (Fasa 8A-2).
 *
 * Fail ini **tidak** membuat sebarang panggilan I/O dan **tidak** mengandungi
 * sebarang keputusan kebenaran. Kebenaran dikuatkuasakan dua kali di tempat
 * lain:
 *
 *   1. Sisi pelayan — `app/(dashboard)/account-managers/page.tsx` memanggil
 *      RPC `can_resolve_account_managers()` sebelum membaca apa-apa.
 *   2. Pangkalan data — setiap RPC `am_*` memanggil `can_resolve_account_managers()`
 *      sendiri dan menaikkan `42501` (fungsi tulis) atau memulangkan kosong
 *      (fungsi baca). Disahkan berkelakuan oleh probe L3-R S4/S5 di live.
 *
 * Jadi walaupun Server Action dipanggil secara terus (melangkau UI), pangkalan
 * data tetap menolak. Pembantu di bawah hanyalah untuk **paparan** dan
 * **pengesahan input awal** — ia mengurangkan pusingan gagal, bukan menjadi
 * kawalan keselamatan.
 *
 * Sumber kebenaran bagi kategori dan peraturan: `lib/supabase/account-manager-resolution.sql`
 * (Langkah 3, dipasang di live) dan `lib/supabase/external-account-managers.sql`
 * (Langkah 2).
 */

/**
 * Lima kategori daripada `am_unresolved_values()`.
 *
 * Susunan ini ialah susunan keutamaan dalam SQL, dan ia **bermakna**:
 * `LUAR` dan `TIADA_PADANAN` kedua-duanya mempunyai `account_manager_id IS NULL`,
 * tetapi yang pertama SUDAH diputuskan manusia (DP-9) dan yang kedua BELUM.
 * Tanpa pemisahan ini, laporan tidak dapat memberitahu sama ada baki itu
 * memerlukan tindakan — itulah inti DP-9.
 */
export const AM_KATEGORI = [
  "SELESAI",
  "LUAR",
  "BERBILANG_ORANG",
  "TIADA_PADANAN",
  "PERLU_PENGESAHAN",
] as const;

export type AmKategori = (typeof AM_KATEGORI)[number];

/** Satu baris daripada `am_unresolved_values()`. */
export type AmUnresolvedValue = {
  raw_text: string;
  jumlah_baris: number;
  dari_invoices: number;
  dari_staging: number;
  resolved_id: string | null;
  resolved_name: string | null;
  kategori: string;
  alias_wujud: boolean;
};

/**
 * Satu baris daripada `am_list_staff()`.
 *
 * SENGAJA hanya dua medan. Veto Keselamatan §2.8 menghendaki pemilih staf
 * mendedahkan **minimum**: tiada `role`, `account_status`, `email`,
 * `designation` atau `department`, kerana pautan antara data kewangan dan
 * identiti staf tidak boleh membocorkan peranan staf kepada pengguna yang
 * hanya boleh melihat invois. Disahkan di live oleh probe L3-R S1:
 * `pg_get_function_result` = `TABLE(id uuid, full_name text)`.
 *
 * Jangan tambah medan di sini tanpa menukar SQL **dan** menilai semula §2.8.
 */
export type AmStaffOption = {
  id: string;
  full_name: string;
};

/** Satu baris daripada `am_confirm_external` / jadual `external_account_managers`. */
export type AmExternalEntry = {
  raw_text: string;
  display_name: string;
  reason: string | null;
  notes: string | null;
};

/** Bentuk keputusan seragam bagi semua Server Action dalam modul ini. */
export type AmActionResult = {
  ok: boolean;
  message: string;
  /** Kod ralat Postgres, jika ada (contoh `42501` = tiada kuasa). */
  code?: string;
  /** Data yang dikembalikan RPC, jika berguna untuk paparan. */
  data?: unknown;
};

/* ====================== Label & ton paparan ====================== */

export const KATEGORI_LABEL: Record<string, string> = {
  SELESAI: "Selesai",
  LUAR: "Orang luar",
  BERBILANG_ORANG: "Berbilang orang",
  TIADA_PADANAN: "Tiada padanan",
  PERLU_PENGESAHAN: "Perlu pengesahan",
};

/**
 * Ton warna bagi `Badge`. Dinamakan mengikut **maksud**, bukan warna, supaya
 * rupa boleh ditukar tanpa menyentuh logik.
 */
export type AmTone = "selesai" | "luar" | "amaran" | "perlu" | "tidak_diketahui";

export const KATEGORI_TONE: Record<string, AmTone> = {
  SELESAI: "selesai",
  LUAR: "luar",
  BERBILANG_ORANG: "amaran",
  TIADA_PADANAN: "perlu",
  PERLU_PENGESAHAN: "perlu",
};

export const TONE_CLASS: Record<AmTone, string> = {
  selesai: "border-emerald-200 bg-emerald-50 text-emerald-700",
  luar: "border-sky-200 bg-sky-50 text-sky-700",
  amaran: "border-amber-200 bg-amber-50 text-amber-800",
  perlu: "border-rose-200 bg-rose-50 text-rose-700",
  tidak_diketahui: "border-muted-foreground/20 bg-muted text-muted-foreground",
};

export function kategoriLabel(kategori: string): string {
  return KATEGORI_LABEL[kategori] ?? kategori;
}

export function kategoriTone(kategori: string): AmTone {
  return KATEGORI_TONE[kategori] ?? "tidak_diketahui";
}

/**
 * Adakah kategori ini **memerlukan tindakan manusia**?
 *
 * `SELESAI` dan `LUAR` kedua-duanya sudah mempunyai keputusan manusia (atau
 * padanan automatik), jadi ia tidak memerlukan tindakan — tetapi ia masih
 * dipaparkan supaya keputusan itu boleh **diaudit dan dibatalkan** (syarat QA
 * dalam DP-8).
 */
export function perluTindakan(kategori: string): boolean {
  return kategori !== "SELESAI" && kategori !== "LUAR";
}

/* ====================== Pengesahan input ====================== */

/**
 * Nilai mentah `Account Manager` yang diketahui daripada sumber Excel
 * (`V4 RAW/00. Quotation Tracker (1).xlsx`, lajur H): 12 rentetan unik,
 * 265 baris. Disenaraikan di sini **hanya** untuk memberi konteks kepada
 * pengguna — pangkalan data kekal satu-satunya sumber kebenaran, dan senarai
 * ini **tidak** digunakan untuk menapis apa yang dipaparkan.
 */
export const NILAI_EXCEL_DIKETAHUI = [
  "Abu Said",
  "Abu said",
  "Adilah",
  "Farrah",
  "Fuziah",
  "Fuzy",
  "Fuzy / Dila",
  "Fuzy / Sholihin ",
  "Omar",
  "Ow Zi Qi",
  "Sholihin",
  "Zalina",
] as const;

/**
 * Mengesan sel **berbilang orang** — cermin kepada logik `v_berbilang` dalam
 * `am_confirm_alias()`:
 *
 * ```sql
 * v_berbilang := (v_norm LIKE '%/%' OR v_norm LIKE '%,%'
 *                 OR v_norm LIKE '% dan %' OR v_norm LIKE '% & %');
 * ```
 *
 * 🔴 **Ini PETUNJUK paparan, bukan pihak berkuasa.** SQL menilai versi yang
 * telah **dinormal** (`normalize_person_name`), manakala fungsi ini menilai
 * teks mentah. Kedua-duanya boleh berbeza (contoh: gelaran dibuang). Jangan
 * guna fungsi ini untuk **menolak** pengesahan — pangkalan data yang memutuskan.
 */
export function isMultiPersonRaw(rawText: string): boolean {
  const t = rawText.toLowerCase();
  return t.includes("/") || t.includes(",") || t.includes(" dan ") || t.includes(" & ");
}

/**
 * Cermin TS bagi `public.normalize_person_name(text)` — huruf kecil, buang
 * apostrofu/titik/tanda pisah, runtuhkan ruang, buang gelaran di permulaan.
 *
 * 🔴 **MENGAPA INI WAJIB, bukan pilihan gaya.** Nilai yang sampai ke UI datang
 * daripada `am_unresolved_values()`, dan view itu mengenakan `btrim()` pada
 * nilai mentah. Diukur dalam PGlite (`scripts/test-seed-l4-idempoten.mjs`
 * Bahagian D, DP-21.2): invois mengandungi `'Fuzy / Sholihin '` (ruang hujung,
 * bentuk Excel sebenar) tetapi UI menerima **`'Fuzy / Sholihin'`**. Perbandingan
 * rentetan tepat terhadap bentuk Excel oleh itu **gagal secara senyap** —
 * lencana "keputusan pengguna DP-8" tidak muncul untuk baris yang sebenarnya
 * sudah diputuskan manusia, iaitu tepat maklumat yang menghalang pembatalan
 * sambil lewa.
 *
 * Pangkalan data kekal pihak berkuasa: fungsi ini hanya memutuskan **label
 * paparan**, sama seperti `isMultiPersonRaw`. Jangan gunakannya untuk menolak
 * pengesahan.
 */
export function kunciNama(rawText: string): string {
  return rawText
    .toLowerCase()
    .replace(/['\u2019.`\-]/g, " ")
    .replace(/\s+/g, " ")
    .replace(
      /^(dr|pn|en|ms|mr|mrs|puan|encik|tuan|datuk|datin|hajah|haji|prof|ir|ar|sr|tun|tan sri|puan sri)\s+/g,
      "",
    )
    .trim();
}

/**
 * Keputusan DP-8 (pengguna, 2026-09-04, verbatim: *"dua dua tu masukkan Fuzy
 * aka Fuziah"*): ketiga-tiga nilai ini diagih kepada **Fuziah**.
 *
 * Kesan yang direkodkan dan **tidak disembunyikan**: Dila (Adilah) tidak
 * menerima kredit untuk 4 baris `Fuzy / Dila`, dan Sholihin tidak menerima
 * kredit untuk 2 baris `Fuzy / Sholihin `. Ini akan mempengaruhi laporan
 * komisen Fasa 8F.
 *
 * UI mesti menunjukkan ini supaya pembatalan tidak dilakukan secara sambil lewa.
 */
export const KEPUTUSAN_DP8 = new Set(["Fuzy", "Fuzy / Dila", "Fuzy / Sholihin "]);

/**
 * Keputusan DP-9 (pengguna, 2026-09-04): `Ow Zi Qi` ialah **orang luar**
 * (bukan staf MIMOS Academy). Kekal NULL, tetapi direkodkan sebagai SUDAH
 * diputuskan dan dilaporkan berasingan.
 */
export const KEPUTUSAN_DP9 = new Set(["Ow Zi Qi"]);

/**
 * Set kunci yang DINORMALKAN, diterbitkan daripada set Excel di atas.
 *
 * Set Excel dikekalkan sebagai **dokumen** (ia mencatat bait sebenar sumber,
 * termasuk ruang hujung `Fuzy / Sholihin `), tetapi **padanan** mesti melalui
 * `kunciNama` kerana DB menghantar nilai tertrim. Satu sumber, dua bentuk —
 * diterbitkan, bukan ditaip dua kali, supaya keduanya tidak boleh drift.
 */
const DP8_KUNCI = new Set([...KEPUTUSAN_DP8].map(kunciNama));
const DP9_KUNCI = new Set([...KEPUTUSAN_DP9].map(kunciNama));

export function isKeputusanPengguna(rawText: string): boolean {
  const k = kunciNama(rawText);
  return DP8_KUNCI.has(k) || DP9_KUNCI.has(k);
}

/** Nota keputusan manusia bagi nilai yang sudah diputuskan pengguna. */
export function notaKeputusanPengguna(rawText: string): string | null {
  const k = kunciNama(rawText);
  if (DP8_KUNCI.has(k)) {
    return "DP-8 (keputusan pengguna 2026-09-04): diagih kepada Fuziah. " +
      "Kesan direkodkan — Dila/Sholihin tidak menerima kredit untuk baris ini, " +
      "dan ia akan mempengaruhi laporan komisen Fasa 8F.";
  }
  if (DP9_KUNCI.has(k)) {
    return "DP-9 (keputusan pengguna 2026-09-04): orang luar, bukan staf MIMOS " +
      "Academy. Sengaja tidak diagih; laporan mesti memisahkannya daripada " +
      "baki yang belum diputuskan.";
  }
  return null;
}

/** Panjang nota minimum yang diperlukan untuk keputusan berbilang orang. */
export const NOTA_MINIMUM_BERBILANG = 12;

/**
 * Pengesahan awal pengesahan alias.
 *
 * 🔴 **Peraturan penting (DP-8):** sel berbilang orang **BOLEH** dipetakan
 * kepada seorang staf, tetapi **HANYA** melalui keputusan manusia yang
 * eksplisit. Veto Kewangan §2.4 melarang **sistem** memilih seorang; ia tidak
 * boleh menghalang **manusia** daripada memutuskan. Syarat QA pula: keputusan
 * itu mesti **boleh diaudit dan dibatalkan**.
 *
 * Sebab itu nota diWAJIBkan untuk nilai berbilang orang — nota itulah jejak
 * audit yang membezakan "manusia memutuskan" daripada "sistem meneka".
 *
 * @returns mesej ralat, atau `null` jika input sah.
 */
export function validateAliasConfirmation(
  rawText: string,
  userId: string | null,
  notes: string,
): string | null {
  if (!rawText.trim()) return "Nilai mentah tidak boleh kosong.";
  if (!userId) return "Pilih staf yang patut menerima nilai ini.";
  if (isMultiPersonRaw(rawText) && notes.trim().length < NOTA_MINIMUM_BERBILANG) {
    return (
      "Nilai ini mengandungi lebih daripada seorang. Nota sebab diWAJIBkan " +
      `(sekurang-kurangnya ${NOTA_MINIMUM_BERBILANG} aksara) supaya keputusan manusia itu boleh diaudit.`
    );
  }
  return null;
}

/**
 * Pengesahan awal klasifikasi orang luar (DP-9).
 *
 * `display_name` diwajibkan kerana `LUAR` bermaksud "sudah diputuskan" —
 * tanpa nama untuk dipaparkan, laporan tidak dapat memisahkan orang luar
 * daripada baki yang belum diputuskan, dan seluruh tujuan DP-9 hilang.
 *
 * @returns mesej ralat, atau `null` jika input sah.
 */
export function validateExternalClassification(
  rawText: string,
  displayName: string,
): string | null {
  if (!rawText.trim()) return "Nilai mentah tidak boleh kosong.";
  if (!displayName.trim()) {
    return "Nama paparan diWAJIBkan — klasifikasi LUAR bermaksud 'sudah diputuskan', " +
      "jadi laporan memerlukan nama untuk dipaparkan.";
  }
  return null;
}

/* ====================== Ringkasan ====================== */

export type AmSummary = {
  jumlah: number;
  selesai: number;
  luar: number;
  perluTindakan: number;
  barisTerjejas: number;
  mengikutKategori: Record<string, number>;
};

/**
 * Ringkasan tulen daripada senarai nilai — tiada I/O, jadi boleh diuji terus.
 */
export function summarizeUnresolved(rows: AmUnresolvedValue[]): AmSummary {
  const mengikutKategori: Record<string, number> = {};
  let selesai = 0;
  let luar = 0;
  let perlu = 0;
  let barisTerjejas = 0;

  for (const r of rows) {
    mengikutKategori[r.kategori] = (mengikutKategori[r.kategori] ?? 0) + 1;
    if (r.kategori === "SELESAI") selesai += 1;
    else if (r.kategori === "LUAR") luar += 1;
    if (perluTindakan(r.kategori)) perlu += 1;
    barisTerjejas += Number(r.jumlah_baris) || 0;
  }

  return {
    jumlah: rows.length,
    selesai,
    luar,
    perluTindakan: perlu,
    barisTerjejas,
    mengikutKategori,
  };
}
