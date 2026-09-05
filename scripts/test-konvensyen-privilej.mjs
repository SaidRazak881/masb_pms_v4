/**
 * test-konvensyen-privilej.mjs — Pengawal CI bagi konvensyen privilej fungsi
 * ==========================================================================
 *
 * Lapisan 2 kepada Fasa 8C (lihat `lib/supabase/privilege-hardening.sql`,
 * Seksyen 3 untuk pengukuran penuh).
 *
 * MASALAH YANG DITUTUP
 * --------------------
 * DP-18.4 diukur oleh ChatGPT pada 2026-09-05: 52 fungsi TPMS di live boleh
 * dipanggil oleh peranan `anon` (tidak log masuk). Punca sistemiknya ialah
 * `pg_default_acl` Supabase mengandungi `anon=X/postgres`.
 *
 * 8C menutup fungsi yang SEDA ADA melalui sapuan dinamik (Lapisan 1). Tetapi
 * pengukuran dalam PGlite menunjukkan `ALTER DEFAULT PRIVILEGES` **tidak boleh**
 * mematikan pewarisan itu untuk fungsi BAHARU: PostgreSQL membina ACL awal
 * fungsi daripada `acldefault()` yang memberi EXECUTE kepada PUBLIC, dan
 * `pg_default_acl` tidak dapat menyimpan operasi "buang PUBLIC". Selagi PUBLIC
 * memegang EXECUTE, `anon` memegangnya juga.
 *
 * Jadi fungsi yang dicipta oleh fasa seterusnya (8B, 8D, ...) akan bocor semula
 * MELAINKAN fail SQL itu sendiri membawa baris konvensyen:
 *
 *     REVOKE ALL ON FUNCTION public.<nama>(...) FROM PUBLIC;
 *     REVOKE ALL ON FUNCTION public.<nama>(...) FROM anon;
 *     GRANT EXECUTE ON FUNCTION public.<nama>(...) TO authenticated;
 *
 * Pengawal ini menuntut baris itu wujud. Ia adalah satu-satunya mekanisme yang
 * menutup fungsi baharu SEMASA ia dicipta, bukan hanya apabila seseorang
 * teringat menjalankan semula 8C.
 *
 * BASELINE (61 entri, diukur 2026-09-05)
 * --------------------------------------
 * Fail yang dipasang SEBELUM 8C tidak boleh disunting (peraturan kerja:
 * migration tambahan sahaja, fail terpasang dibekukan). Maka pelanggaran yang
 * sedia ada dibekukan sebagai BASELINE dan ditutup di peringkat pangkalan data
 * oleh sapuan dinamik 8C. Pengukuran menunjukkan TIADA satu pun fail pra-8C
 * mempunyai baris `REVOKE ... FROM anon` — itulah sebabnya DP-18.4 terbuka.
 *
 * Peraturan pengawal:
 *   * pelanggaran BAHARU (tiada dalam BASELINE)      -> GAGAL
 *   * entri BASELINE yang sudah tidak melanggar      -> GAGAL (kemas kini senarai)
 *   * entri BASELINE yang fungsinya sudah tiada      -> GAGAL (entri basi)
 *
 * FASA_BAHARU: fasa akan datang mendaftarkan nama fungsinya di sini supaya
 * laporan DRIFT Seksyen 2 di live kekal bermakna (nama yang tidak dikenali
 * dalam laporan itu sepatutnya benar-benar tidak dikenali).
 *
 * Jalankan: node scripts/test-konvensyen-privilej.mjs
 */
import fs from 'node:fs';

let pass = 0;
let fail = 0;
const ok = (m) => { pass++; console.log(`  ✅ ${m}`); };
const bad = (m) => { fail++; console.log(`  ❌ ${m}`); };
const eq = (a, e, m) => (JSON.stringify(a) === JSON.stringify(e)
  ? ok(m)
  : bad(`${m} — dapat ${JSON.stringify(a)}, jangkaan ${JSON.stringify(e)}`));
const truthy = (v, m) => (v ? ok(m) : bad(m));
const section = (t) => console.log(`\n${'─'.repeat(62)}\n${t}\n${'─'.repeat(62)}`);

const DIR = 'lib/supabase';
const FAIL_8C = 'privilege-hardening.sql';

/** Pelanggaran konvensyen yang DIBEKUKAN (diukur 2026-09-05, pra-8C). */
const BASELINE = [
  'account-manager-resolution.sql:am_backfill_account_manager',
  'account-manager-resolution.sql:am_backfill_preview',
  'account-manager-resolution.sql:am_confirm_alias',
  'account-manager-resolution.sql:am_list_staff',
  'account-manager-resolution.sql:am_revoke_alias',
  'account-manager-resolution.sql:am_unresolved_values',
  'account-manager-resolution.sql:can_resolve_account_managers',
  'change-requests.sql:cancel_change_request',
  'change-requests.sql:change_request_allowed_fields',
  'change-requests.sql:review_change_request', 'change-requests.sql:submit_change_request',
  'client-master.sql:normalize_person_name', 'client-master.sql:resolve_account_manager',
  'external-account-managers.sql:am_confirm_external',
  'external-account-managers.sql:am_revoke_external',
  'external-account-managers.sql:is_external_account_manager',
  'fix-import-staging-updated-at.sql:set_updated_at', 'fix-rls-recursion.sql:current_role_name',
  'fix-rls-recursion.sql:current_user_role', 'fix-rls-recursion.sql:has_role',
  'governance-lock.sql:cancel_programme_unlock', 'governance-lock.sql:current_role_name',
  'governance-lock.sql:enforce_programme_lock', 'governance-lock.sql:expire_stale_unlocks',
  'governance-lock.sql:is_unlock_approver', 'governance-lock.sql:lock_programme',
  'governance-lock.sql:programme_is_editable', 'governance-lock.sql:request_programme_unlock',
  'governance-lock.sql:review_programme_unlock', 'schema-master.sql:current_role_name',
  'schema-master.sql:current_user_id', 'schema-master.sql:current_user_role',
  'schema-master.sql:financial_docs_audit_trigger', 'schema-master.sql:has_role',
  'schema-master.sql:log_audit', 'schema-master.sql:participants_audit_trigger',
  'schema-master.sql:programmes_audit_trigger', 'seed-v4-raw.sql:current_user_id',
  'seed-v4-raw.sql:current_user_role', 'seed-v4-raw.sql:log_audit',
  'seed-v4-raw.sql:programmes_audit_trigger',
  'sync-import-transaction.sql:sync_import_transaction',
  'updated-at-triggers.sql:set_updated_at', 'user-management.sql:admin_approve_user',
  'user-management.sql:admin_change_user_role', 'user-management.sql:admin_list_users',
  'user-management.sql:admin_require_password_change',
  'user-management.sql:admin_reset_all_passwords_to_default',
  'user-management.sql:admin_reset_user_password', 'user-management.sql:admin_set_user_blocked',
  'user-management.sql:admin_user_summary', 'user-management.sql:assert_can_manage_users',
  'user-management.sql:assert_password_acceptable', 'user-management.sql:can_manage_users',
  'user-management.sql:default_password', 'user-management.sql:handle_new_auth_user',
  'user-management.sql:is_super_admin', 'user-management.sql:mark_password_changed',
  'user-management.sql:my_account_status', 'user-management.sql:my_password_change_required',
  'user-management.sql:sync_auth_user_update'
];

/** Fasa selepas 8C: daftarkan nama fungsi baharu di sini (format 'nama'). */
const FASA_BAHARU = [];

const failSql = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();

// Tiga baris konvensyen, dicari sebagai SATU pernyataan (dibatasi oleh `;`)
// supaya padanan tidak melompat antara pernyataan berbeza.
const adaRevPublic = (t, n) => new RegExp(`REVOKE[^;]*public\\.${n}[^;]*FROM PUBLIC`, 's').test(t);
const adaRevAnon = (t, n) => new RegExp(`REVOKE[^;]*public\\.${n}[^;]*FROM anon`, 's').test(t);
const adaGrant = (t, n) => new RegExp(`GRANT EXECUTE[^;]*public\\.${n}[^;]*TO authenticated`, 's').test(t);

const semuaNama = new Set();
const dicipta8C = new Set();
const pelanggaran = [];      // 'fail:nama' yang tidak patuh
const ikutFail = {};

for (const f of failSql) {
  const teks = fs.readFileSync(`${DIR}/${f}`, 'utf8');
  const nama = [...new Set(
    [...teks.matchAll(/CREATE OR REPLACE FUNCTION public\.(\w+)/g)].map((m) => m[1]),
  )].sort();
  ikutFail[f] = nama;
  nama.forEach((n) => semuaNama.add(n));
  if (f === FAIL_8C) nama.forEach((n) => dicipta8C.add(n));

  for (const n of nama) {
    const patuh = adaRevPublic(teks, n) && adaRevAnon(teks, n) && adaGrant(teks, n);
    if (!patuh) pelanggaran.push(`${f}:${n}`);
  }
}

/* ===================================================================== */
section('BAHAGIAN A — pelanggaran BAHARU di luar BASELINE');

const baharu = pelanggaran.filter((p) => !BASELINE.includes(p)).sort();
eq(baharu, [],
  'tiada fungsi baharu yang kekurangan baris konvensyen (REVOKE PUBLIC + REVOKE anon + GRANT authenticated)');
if (baharu.length) {
  console.log('\n  Cara membetulkan — tambah SELEPAS takrifan fungsi itu:');
  for (const b of baharu.slice(0, 12)) {
    const [f, n] = b.split(':');
    console.log(`    REVOKE ALL ON FUNCTION public.${n}(...) FROM PUBLIC;`);
    console.log(`    REVOKE ALL ON FUNCTION public.${n}(...) FROM anon;`);
    console.log(`    GRANT EXECUTE ON FUNCTION public.${n}(...) TO authenticated;`);
    console.log(`    (dalam ${DIR}/${f})`);
  }
}

/* ===================================================================== */
section('BAHAGIAN B — integriti BASELINE (tidak basi, tidak menyusut senyap)');

const sudahPatuh = BASELINE.filter((b) => !pelanggaran.includes(b)).sort();
eq(sudahPatuh, [],
  'setiap entri BASELINE masih satu pelanggaran (jika sudah dibetulkan, pendekkan BASELINE)');

const fungsiHilang = BASELINE.filter((b) => {
  const [f, n] = b.split(':');
  return !(ikutFail[f] ?? []).includes(n);
}).sort();
eq(fungsiHilang, [],
  'setiap entri BASELINE merujuk fungsi yang masih ditakrifkan (tiada entri basi)');

eq(BASELINE.length, 61,
  `saiz BASELINE dibekukan pada 61 entri (diukur 2026-09-05); dapat ${BASELINE.length}`);

/* ===================================================================== */
section('BAHAGIAN C — fail 8C sendiri patuh PENUH');

const pelanggaran8C = pelanggaran.filter((p) => p.startsWith(`${FAIL_8C}:`));
eq(pelanggaran8C, [],
  'privilege-hardening.sql: setiap fungsi yang ditakrifkannya membawa ketiga-tiga baris konvensyen');
truthy(dicipta8C.size >= 6,
  `8C mentakrifkan sekurang-kurangnya 6 fungsi (dapat ${dicipta8C.size}: ${[...dicipta8C].join(', ')})`);

/* ===================================================================== */
section('BAHAGIAN D — Lapisan 1 (sapuan dinamik) masih wujud dalam migration');

const teks8C = fs.readFileSync(`${DIR}/${FAIL_8C}`, 'utf8');
truthy(/FROM pg_proc p[\s\S]*?n\.nspname = 'public'/.test(teks8C),
  'sapuan dinamik membaca pg_proc bagi skema public (bukan senarai nama semata-mata)');
truthy(/deptype = 'e'/.test(teks8C),
  'penapis extension (pg_depend deptype = \'e\') wujud — objek platform tidak dirampas');
truthy(/REVOKE ALL ON FUNCTION public\.%I\(%s\) FROM PUBLIC/.test(teks8C),
  'sapuan melakukan REVOKE FROM PUBLIC — satu-satunya baris yang benar-benar menutup `anon`');
truthy(/RAISE WARNING[\s\S]*?DRIFT/.test(teks8C),
  'drift dilaporkan melalui RAISE WARNING (bising, bukan senyap — DP-14.2)');
truthy(/ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon/.test(teks8C),
  'ALTER DEFAULT PRIVILEGES dikekalkan (membuang entri anon eksplisit daripada pg_default_acl)');

/* ===================================================================== */
section('BAHAGIAN E — liputan inventori Seksyen 2');

const blokArray = (src, nama) => {
  const m = src.match(new RegExp(`${nama} text\\[\\] := ARRAY\\[([\\s\\S]*?)\\];`));
  if (!m) return [];
  return [...m[1].matchAll(/'(\w+)'/g)].map((x) => x[1]);
};
const inventori = [...blokArray(teks8C, 'v_inventori'), ...blokArray(teks8C, 'v_nama_selepas')];
truthy(inventori.length >= 52,
  `inventori Seksyen 2 mengandungi sekurang-kurangnya 52 nama (dapat ${inventori.length})`);

const dilindungi = new Set([...inventori, ...dicipta8C, ...FASA_BAHARU]);
const tidakDilindungi = [...semuaNama].filter((n) => !dilindungi.has(n)).sort();
eq(tidakDilindungi, [],
  'setiap fungsi dalam repo SQL dilindungi inventori 8C, dicipta oleh 8C, atau didaftarkan dalam FASA_BAHARU');

const lebihan = inventori.filter((n) => !semuaNama.has(n)).sort();
eq(lebihan, [],
  'inventori tidak mengandungi nama yang tiada dalam repo (tiada entri rekaan)');

console.log(`\n  (fungsi unik dalam repo: ${semuaNama.size}; fail SQL: ${failSql.length})`);

console.log(`\n${'='.repeat(62)}`);
console.log(`KEPUTUSAN: ${pass} lulus, ${fail} gagal`);
console.log(`${'='.repeat(62)}\n`);
process.exit(fail === 0 ? 0 : 1);
