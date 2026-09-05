/**
 * test-prompt-8c-queries.mjs — laksanakan SETIAP query J0/K dalam prompt 8C
 * ========================================================================
 *
 * Mengapa wujud (pelajaran DP-14.2 + DP-10.11)
 * ---------------------------------------------
 * Prompt yang dihantar kepada ChatGPT mengandungi query yang akan dijalankan di
 * LIVE. Jika query itu salah eja nama lajur, salah tanda tangan, atau — seperti
 * yang dielakkan di sini — memakai meta-perintah `psql` (`\gset`, `:var`) yang
 * TIDAK tersedia dalam Supabase SQL Editor, maka ChatGPT akan melaporkan
 * kegagalan yang berpunca daripada Arena, bukan daripada live. Setiap query J0
 * dan K dalam `docs/PROMPT-8C-PRIVILEGE-HARDENING.md` diekstrak daripada
 * DOKUMEN YANG DIJANA (bukan disalin tangan) dan dilaksanakan dalam PGlite.
 *
 * HAD PGlite YANG DIKETAHUI, dan cara ia ditangani dengan jujur
 * --------------------------------------------------------------
 * PGlite TIDAK mendedahkan output `NOTICE` (diukur: `onNotice` tidak menangkap
 * apa-apa; objek hasil hanya ada rows/fields/command/affectedRows). Beberapa
 * query K (K5, K6) melaporkan keputusannya melalui `RAISE NOTICE` di dalam blok
 * `DO ... EXCEPTION`. Maka untuk query begitu, ujian ini menuntut DUA perkara:
 *
 *   (1) blok itu **dilaksanakan tanpa ralat**. Ini bermakna: jika nama kondisi
 *       EXCEPTION salah (cth. `invalid_parameter_value` sedangkan fungsi
 *       menaikkan 42501), pengecualian itu TIDAK tertangkap dan query GAGAL —
 *       jadi ujian ini tetap sensitif terhadap kesilapan itu.
 *   (2) fakta dasarnya **dituntut secara langsung** dalam ujian ini (cth.
 *       `am_backfill_account_manager(NULL)` memang menaikkan 42501).
 *
 * (1) + (2) bersama memaksa cabang `LULUS` dalam NOTICE: cabang `GAGAL` hanya
 * boleh dicapai jika panggilan itu tidak menaikkan ralat, dan (2) membuktikan ia
 * menaikkan ralat. Inferens ini dinyatakan di sini supaya ia tidak dianggap
 * sebagai "ujian lulus tanpa bukti".
 *
 * Jalankan: node scripts/test-prompt-8c-queries.mjs
 */
import fs from 'node:fs';
import { binaFixture, pasangLangkah, sebagaiPengguna, pulihkanAuthUid, uuidProfil } from './lib/fixture-live.mjs';

let pass = 0;
let fail = 0;
const ok = (m) => { pass++; console.log(`  ✅ ${m}`); };
const bad = (m) => { fail++; console.log(`  ❌ ${m}`); };
const eq = (a, e, m) => (JSON.stringify(a) === JSON.stringify(e)
  ? ok(m)
  : bad(`${m} — dapat ${JSON.stringify(a)}, jangkaan ${JSON.stringify(e)}`));
const truthy = (v, m) => (v ? ok(m) : bad(m));
const section = (t) => console.log(`\n${'─'.repeat(62)}\n${t}\n${'─'.repeat(62)}`);

const DOC = 'docs/PROMPT-8C-PRIVILEGE-HARDENING.md';
const SQL = 'lib/supabase/privilege-hardening.sql';
const LANGKAH_123 = [
  'lib/supabase/client-master.sql',
  'lib/supabase/external-account-managers.sql',
  'lib/supabase/account-manager-resolution.sql',
];
const SEED = 'lib/supabase/seed-account-manager-aliases.sql';

/* ===================================================================== */
section('Ekstraksi query daripada dokumen yang DIJANA');

const doc = fs.readFileSync(DOC, 'utf8');
// Pagar dalam prompt ialah 4 backtick (SQL 8C mengandungi $$ dan backtick).
const re = /^### (J0[a-h]|K\d+) —[^\n]*\n+`{4}sql\n([\s\S]*?)\n`{4}/gm;
const blok = {};
for (const m of doc.matchAll(re)) blok[m[1]] = m[2];

const J0_IDS = ['J0a', 'J0b', 'J0c', 'J0d', 'J0e', 'J0f', 'J0g', 'J0h'];
const K_IDS = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10', 'K11', 'K12'];
eq(J0_IDS.filter((i) => !blok[i]), [], 'semua 8 query J0 ditemui dalam dokumen');
eq(K_IDS.filter((i) => !blok[i]), [], 'semua 12 query K ditemui dalam dokumen');
truthy(!/\\gset|^\s*:\w+/m.test(Object.values(blok).join('\n')),
  'tiada meta-perintah psql (\\gset / :var) dalam prompt — Supabase SQL Editor tidak menyokongnya');
truthy(Object.values(blok).every((s) => !/service_role/i.test(s)),
  'tiada rujukan service_role dalam mana-mana query prompt');

/* ===================================================================== */
const { db } = await binaFixture();
await pasangLangkah(db, LANGKAH_123);

const adminUuid = await uuidProfil(db, 'Admin');
await sebagaiPengguna(db, adminUuid);
await pasangLangkah(db, [SEED]);
// `sebagaiPengguna()` mentakrifkan semula auth.uid() sebagai LITERAL, jadi ia
// memadam kesedaran claims. Query J0/K dalam prompt menetapkan
// `request.jwt.claims` (mekanisme live di Supabase SQL Editor), jadi stub
// sedar-claims DIPULIHKAN di sini. Tanpa baris ini K3 akan memulangkan
// super_admin dan kelihatan seperti 8C gagal — sedangkan yang salah ialah
// fixture. (Ditangkap oleh larian pertama ujian ini.)
await pulihkanAuthUid(db, adminUuid);

const testUuid = await uuidProfil(db, 'test');        // blocked sejak asal
const adilahUuid = await uuidProfil(db, 'Adilah');    // finance, bukan Super Admin

const ganti = (sql) => sql
  .replaceAll('<UUID_SUPER_ADMIN>', adminUuid)
  .replaceAll('<UUID_AKAUN_BLOCKED>', testUuid)
  .replaceAll('<UUID_BUKAN_SUPER>', adilahUuid);

/** Jalankan blok berbilang pernyataan; pulangkan hasil yang ada lajur. */
const jalankan = async (id) => {
  const sql = ganti(blok[id]);
  const res = await db.exec(sql);
  return res.filter((r) => r.fields && r.fields.length > 0);
};
const baris = async (id, kolum) => {
  const hasil = await jalankan(id);
  const r = hasil.find((h) => h.fields.some((f) => f.name === kolum));
  if (!r) throw new Error(`${id}: tiada hasil dengan lajur '${kolum}'`);
  return r.rows[0];
};
/** Hanya sahkan blok itu dilaksanakan tanpa ralat (query tanpa hasil baris). */
const tanpaRalat = async (id, label) => {
  try { await db.exec(ganti(blok[id])); ok(`${label}: ${id} dilaksanakan tanpa ralat`); }
  catch (e) { bad(`${label}: ${id} GAGAL — ${e.message?.slice(0, 120)}`); }
};

/* ===================================================================== */
section('LANGKAH 0 — J0 dijalankan SEBELUM 8C (seperti di live)');

const j0a = await baris('J0a', 'jumlah_fungsi_public');
truthy(j0a.jumlah_fungsi_public >= 30,
  `J0a: ${j0a.jumlah_fungsi_public} fungsi public dikesan`);
eq(j0a.anon_boleh_execute, j0a.jumlah_fungsi_public,
  'J0a: SEBELUM 8C, anon boleh execute SEMUA fungsi (baseline DP-18.4 diukur)');
eq(j0a.authenticated_boleh_execute, j0a.jumlah_fungsi_public,
  'J0a: authenticated juga penuh (jadi 8C tidak boleh menyalahkan baseline)');

const j0b = await baris('J0b', 'default_acl_fungsi');
truthy(/anon=/.test(j0b.default_acl_fungsi ?? ''),
  `J0b: pg_default_acl mengandungi anon= (${j0b.default_acl_fungsi})`);

const hasilJ0c = await jalankan('J0c');
truthy(hasilJ0c[0].rows.length >= 1,
  `J0c: ${hasilJ0c[0].rows.length} akaun bukan-viewer tidak aktif disenaraikan (bahan uji K3)`);
truthy(hasilJ0c[0].rows.some((r) => r.email === 'test@mimos.my'),
  'J0c: akaun `test` (blocked) muncul dalam senarai yang akan kehilangan kuasa');

const j0d = await baris('J0d', 'jadual_gate');
eq(j0d.jadual_gate, null, 'J0d: SEBELUM 8C, jadual backfill_authorizations belum wujud');
eq(j0d.fungsi_8c, 0, 'J0d: SEBELUM 8C, tiada fungsi 8C');
eq(j0d.tanda_tangan_backfill ?? '', '',
  'J0d: SEBELUM 8C, am_backfill_account_manager() tanpa argumen');

const j0e = await baris('J0e', 'jumlah_jadual_public');
const jadualSebelum = j0e.jumlah_jadual_public;
truthy(jadualSebelum >= 15, `J0e: ${jadualSebelum} jadual public sebelum 8C`);

/* ===================================================================== */
section('LANGKAH 1 — pasang 8C, kemudian LANGKAH 2 (K1–K12)');

await db.exec(fs.readFileSync(SQL, 'utf8'));

const k1 = await baris('K1', 'jumlah');
eq(k1.anon, 0, 'K1: SELEPAS 8C, anon boleh execute 0 fungsi (fixture tiada objek platform)');
eq(k1.nama_masih_anon, '(tiada)', 'K1: tiada nama baki memegang capaian anon');
eq(k1.auth, k1.jumlah, 'K1: authenticated dikekalkan bagi semua fungsi');

const k2 = await baris('K2', 'masih_ada_anon');
eq(k2.masih_ada_anon, false, 'K2: entri anon hilang daripada default ACL peranan postgres');
truthy(/authenticated=/.test(k2.default_acl_fungsi ?? ''),
  'K2: authenticated masih ada dalam pg_default_acl');

const k3 = await baris('K3', 'peranan_semasa');
eq(k3.peranan_semasa, 'viewer', 'K3: akaun blocked -> current_user_role() = viewer');
eq(k3.boleh_selesai, false, 'K3: akaun blocked -> can_resolve = false');
eq(k3.staf_dilihat, 0, 'K3: akaun blocked -> 0 staf dilihat');
eq(k3.nama_peranan, 'viewer', 'K3: current_role_name() juga viewer');

const k4 = await baris('K4', 'peranan');
eq(k4.peranan, 'super_admin', 'K4: Super Admin aktif -> super_admin');
eq(k4.super, true, 'K4: is_super_admin() = true');
eq(k4.boleh_selesai, true, 'K4: can_resolve = true');
eq(k4.staf_dilihat, 19, 'K4: 19 staf dilihat (tiada lockout)');

// K5/K6: blok DO yang melaporkan melalui NOTICE (lihat header fail ini).
await tanpaRalat('K5', 'K5 (DO+EXCEPTION, laporan via NOTICE)');
const ralatNull = await (async () => {
  try { await db.query(`SELECT * FROM public.am_backfill_account_manager(NULL)`); return null; }
  catch (e) { return e.code ?? e.message; }
})();
eq(ralatNull, '42501',
  'K5 fakta dasar: am_backfill_account_manager(NULL) memang menaikkan 42501 -> cabang NOTICE mestilah LULUS');

await tanpaRalat('K6', 'K6 (3 blok DO: bukan-super / sebab pendek / token sekali-guna)');
const ralatPendek = await (async () => {
  try { await db.query(`SELECT public.am_backfill_authorize('pendek')`); return null; }
  catch (e) { return e.code ?? e.message; }
})();
eq(ralatPendek, '22023',
  'K6b fakta dasar: sebab < 12 aksara memang menaikkan 22023 (kondisi invalid_parameter_value betul)');

// K7: blok ini mengandungi `SELECT set_config(...)` (1 baris, lajur `set_config`)
// SEBELUM query sebenar, jadi hasil yang betul mesti dipilih mengikut LAJUR —
// bukan hasil pertama. (Kesilapan larian pertama ujian ini.)
const hasilK7 = await jalankan('K7');
const laporanK7 = hasilK7.find((h) => h.fields.some((f) => f.name === 'sebab'));
truthy(laporanK7 !== undefined,
  'K7: am_backfill_pengecualian() memulangkan set hasil dengan lajur `sebab`');
eq(laporanK7?.rows.length ?? -1, 0,
  'K7: 0 baris dijangka (sifar nilai mentah Account Manager, seperti J1 live)');
truthy((laporanK7?.fields ?? []).map((f) => f.name).includes('nilai_mentah'),
  'K7: lajur `nilai_mentah` wujud (laporan beritem, bukan NULL senyap)');

const k8 = await baris('K8', 'jadual_gate');
// `to_regclass()::text` memulangkan nama TANPA skema apabila `public` ada dalam
// search_path — jadi jangkaan prompt dan ujian ialah nama ringkas.
eq(k8.jadual_gate, 'backfill_authorizations', 'K8: jadual gate wujud');
eq(k8.fungsi_8c, 3, 'K8: 3 fungsi baharu 8C wujud');
eq(k8.tanda_tangan_backfill, 'p_token uuid',
  'K8: tanda tangan backfill kini (p_token uuid)');
eq(k8.rls, true, 'K8: RLS diaktifkan pada jadual gate');

const k9 = await baris('K9', 'anon_mewarisi');
eq(k9.anon_mewarisi, true,
  'K9: HAD PLATFORM DP-23.1 disahkan — fungsi baharu masih mewarisi anon walaupun K2 lulus');
eq(k9.authenticated_ok, true, 'K9: fungsi baharu tetap boleh dipanggil oleh authenticated');

const hasilK10 = await jalankan('K10');
eq(hasilK10[0].rows.length, 12, 'K10: semua 12 fungsi RPC UI disenaraikan');
eq(hasilK10[0].rows.filter((r) => r.auth === true).length, 12,
  'K10: setiap 12 fungsi UI kekal boleh dipanggil oleh authenticated');
eq(hasilK10[0].rows.filter((r) => r.anon === false).length, 12,
  'K10: tiada satu pun fungsi UI boleh dipanggil oleh anon');

const k11 = await baris('K11', 'jumlah_jadual_public');
eq(k11.jumlah_jadual_public, jadualSebelum + 1,
  `K11: tepat SATU jadual ditambah oleh 8C (${jadualSebelum} -> ${k11.jumlah_jadual_public})`);
truthy(k11.ber_rls >= k11.jumlah_jadual_public - 3,
  `K11: ${k11.ber_rls} daripada ${k11.jumlah_jadual_public} jadual ber-RLS`);

// K12 ialah blok komen sahaja (tiada query) — sahakan ia memang bukan SQL boleh laku.
const k12 = blok.K12.replace(/^\s*--.*$/gm, '').trim();
eq(k12, '', 'K12: blok itu komen sahaja (arahan tampal output NOTICE, bukan query)');

// Setiap blok J0/K mesti BOLEH DILAKSANAKAN — menangkap kesilapan sintaks atau
// nama lajur dalam query yang baru ditambah (J0f, J0g, J0h) SEBELUM ia sampai ke
// live. Query read-only, jadi pelaksanaan semula selepas pemasangan adalah selamat.
for (const id of [...J0_IDS, ...K_IDS]) {
  if (id === 'K12') continue;   // blok komen sahaja, bukan SQL
  try { await db.exec(ganti(blok[id])); ok(`${id}: blok query dilaksanakan tanpa ralat`); }
  catch (e) { bad(`${id}: GAGAL dilaksanakan — ${e.message?.slice(0, 110)}`); }
}

await db.close();

console.log(`\n${'='.repeat(62)}`);
console.log(`KEPUTUSAN: ${pass} lulus, ${fail} gagal`);
console.log(`${'='.repeat(62)}\n`);
process.exit(fail === 0 ? 0 : 1);
