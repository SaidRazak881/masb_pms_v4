/**
 * test-seed-l4-idempoten.mjs — Ukuran PGlite bagi seed L4 (DP-8 + DP-9)
 * =====================================================================
 *
 * MENGAPA UJIAN INI WUJUD
 * -----------------------
 * Laporan live ChatGPT bagi Langkah 4 (2026-09-05) mengesahkan seed berjaya
 * dipasang: 3 alias DP-8, 1 klasifikasi luar DP-9, `audit_logs` 44 → 48 (+4),
 * K6 12/12 SEPADAN, K6b 3/3 NULL, K8 = 0, data perniagaan tidak berubah.
 * Semua itu diterima.
 *
 * Tetapi laporan itu meninggalkan **dua soalan yang tidak dijawab di live**, dan
 * kedua-duanya tidak boleh dijawab dengan membaca SQL sahaja:
 *
 *   1. **K12 ditanda ⏳** — GPT dengan betul enggan menjalankan semula L1–L3
 *      (Larangan 1) dan tidak menguji idempotensi. Maka tiada siapa tahu apa
 *      yang berlaku jika seed dijalankan **dua kali**. Ini penting kerana seed
 *      memanggil `log_audit()` **tanpa syarat** di dalam gelung `FOREACH`,
 *      selepas `ON CONFLICT DO UPDATE` — jadi data mungkin idempoten tetapi
 *      jejak audit mungkin tidak.
 *
 *   2. **Ruang hujung `Fuzy / Sholihin `.** Nilai Excel sebenar (2 baris dalam
 *      `00. Quotation Tracker (1).xlsx`, lajur H) mempunyai **ruang hujung**.
 *      Baris 142 seed menulis kunci **tanpa** ruang hujung:
 *          FOREACH v_raw IN ARRAY ARRAY['Fuzy', 'Fuzy / Dila', 'Fuzy / Sholihin']
 *      sedangkan komen seed sendiri (baris 18, 25), query verifikasinya
 *      (baris 190), `account-manager-resolution.sql` (baris 20) dan
 *      `KEPUTUSAN_DP8` dalam `lib/account-manager.ts` semuanya menggunakan
 *      bentuk **dengan** ruang. Ujian ini mengukur sama ada percanggahan itu
 *      mengubah kelakuan, dan **bentuk mana yang sampai ke UI**.
 *
 * Prinsip: **ukur, jangan hujah.** Kedua-dua soalan dijawab di bawah dengan
 * melaksanakan seed sebenar (bait fail, tanpa suntingan) ke atas fixture
 * setara-live yang dikongsi (`scripts/lib/fixture-live.mjs`).
 *
 * Jalankan: node scripts/test-seed-l4-idempoten.mjs
 */
import fs from 'fs';
import { binaFixture, pasangLangkah, sebagaiPengguna, uuidProfil } from './lib/fixture-live.mjs';

let pass = 0;
let fail = 0;
const ok = (m) => { pass++; console.log(`  ✅ ${m}`); };
const bad = (m) => { fail++; console.log(`  ❌ ${m}`); };
const eq = (a, e, m) => (JSON.stringify(a) === JSON.stringify(e)
  ? ok(m)
  : bad(`${m} — dapat ${JSON.stringify(a)}, jangkaan ${JSON.stringify(e)}`));
const section = (t) => console.log(`\n${'─'.repeat(62)}\n${t}\n${'─'.repeat(62)}`);

const LANGKAH_123 = [
  'lib/supabase/client-master.sql',
  'lib/supabase/external-account-managers.sql',
  'lib/supabase/account-manager-resolution.sql',
];
const SEED = 'lib/supabase/seed-account-manager-aliases.sql';
const teksSeed = fs.readFileSync(SEED, 'utf8');

const { db } = await binaFixture();
await pasangLangkah(db, LANGKAH_123);

// Identiti: Super Admin ('Admin'). Pada live, seed menetapkan
// `request.jwt.claims`; dalam PGlite sumber identiti ialah stub `auth.uid()`,
// jadi fixture menukarnya secara eksplisit.
const adminUuid = await uuidProfil(db, 'Admin');
const fuziahUuid = await uuidProfil(db, 'Fuziah');
await sebagaiPengguna(db, adminUuid);

const kira = async () => ({
  alias: (await db.query('SELECT count(*)::int n FROM public.account_manager_aliases')).rows[0].n,
  luar: (await db.query('SELECT count(*)::int n FROM public.external_account_managers')).rows[0].n,
  audit: (await db.query('SELECT count(*)::int n FROM public.audit_logs')).rows[0].n,
});
const selesai = async (v) =>
  (await db.query('SELECT public.resolve_account_manager($1)::text AS id', [v])).rows[0].id;

/* ===================================================================== */
section('BAHAGIAN A — keadaan pra-seed');
const A = await kira();
eq(A.alias, 0, 'tiada alias sebelum seed');
eq(A.luar, 0, 'tiada klasifikasi luar sebelum seed');
ok(A.audit >= 0, `audit_logs pra-seed = ${A.audit} (asas untuk mengukur delta)`);
eq(await selesai('Fuzy'), null, 'sebelum seed: "Fuzy" -> NULL (sistem tidak meneka)');
eq(await selesai('Fuzy / Dila'), null, 'sebelum seed: "Fuzy / Dila" -> NULL (veto §2.4)');

/* ===================================================================== */
section('BAHAGIAN B — larian 1: seed dilaksanakan (bait fail, tanpa suntingan)');
await db.exec(teksSeed);
const B = await kira();
eq(B.alias, 3, 'selepas seed: 3 alias DP-8');
eq(B.luar, 1, 'selepas seed: 1 klasifikasi luar DP-9');
eq(B.audit - A.audit, 4, 'jejak audit bertambah TEPAT 4 (3 DP-8 + 1 DP-9) — sepadan laporan live 44→48');

// K7 live: "Provenans kedua-dua jenis rekod menunjuk kepada profil Admin"
const prov = (await db.query(
  `SELECT count(*)::int n FROM public.account_manager_aliases WHERE confirmed_by = $1`,
  [adminUuid])).rows[0].n;
eq(prov, 3, 'ketiga-tiga alias direkodkan oleh Super Admin (provenans sebenar, bukan NULL)');
const kunciAlias = (await db.query(
  `SELECT raw_text FROM public.account_manager_aliases ORDER BY raw_text`)).rows.map((r) => r.raw_text);
eq(kunciAlias, ['Fuzy', 'Fuzy / Dila', 'Fuzy / Sholihin'],
  'kunci alias yang SEBENARNYA ditulis oleh seed (perhatikan: tiada ruang hujung)');
eq(kunciAlias.includes('Fuzy / Sholihin '), false,
  'bentuk Excel (dengan ruang hujung) TIDAK disimpan sebagai kunci oleh seed');

/* ===================================================================== */
section('BAHAGIAN C — resolusi: adakah percanggahan ruang hujung mengubah kelakuan?');
for (const v of ['Fuzy', 'Fuzy / Dila', 'Fuzy / Sholihin']) {
  eq(await selesai(v), fuziahUuid, `"${v}" -> Fuziah (keputusan pengguna DP-8)`);
}
// Soalan sebenar: nilai Excel ada ruang hujung.
eq(await selesai('Fuzy / Sholihin '), fuziahUuid,
  '"Fuzy / Sholihin " (RUANG HUJUNG, bentuk Excel sebenar) -> Fuziah');
eq(await selesai('  FUZY  '), fuziahUuid, '"  FUZY  " (ruang + huruf besar) -> Fuziah');
eq(await selesai('Fuzy / Sholihin  '), fuziahUuid, '"Fuzy / Sholihin  " (dua ruang hujung) -> Fuziah');

// DP-9: kekal NULL tetapi diklasifikasikan LUAR
eq(await selesai('Ow Zi Qi'), null, 'DP-9: "Ow Zi Qi" -> NULL (kekal tidak diagih)');
eq((await db.query(`SELECT public.is_external_account_manager('Ow Zi Qi') AS luar`)).rows[0].luar,
  true, 'DP-9: "Ow Zi Qi" dikenal pasti sebagai orang luar');

// Veto §2.4 masih hidup untuk nilai yang BELUM diputuskan manusia
for (const v of ['Faiz / Siti', 'Ali, Abu', 'X dan Y']) {
  eq(await selesai(v), null, `veto §2.4: "${v}" -> NULL (sistem tidak memilih seorang)`);
}

/* ===================================================================== */
section('BAHAGIAN D — bentuk mana yang SAMPAI KE UI?');
// `am_unresolved_values()` membaca invoices/import_staging dan menggunakan
// `btrim()`. Jadi UI tidak semestinya melihat bait mentah yang sama dengan
// yang ada dalam jadual sumber. Ini diukur, bukan diandaikan.
await db.exec('BEGIN');
await db.exec(`
  INSERT INTO public.organizers (name) VALUES ('UjianOrganizer');
  INSERT INTO public.programmes (programme_code, title, organizer_name)
    VALUES ('UJIAN-1', 'Program Ujian Ruang Hujung', 'UjianOrganizer');
  INSERT INTO public.invoices (programme_id, account_manager)
    SELECT id, 'Fuzy / Sholihin ' FROM public.programmes
     WHERE programme_code = 'UJIAN-1';
  INSERT INTO public.invoices (programme_id, account_manager)
    SELECT id, 'Ow Zi Qi' FROM public.programmes
     WHERE programme_code = 'UJIAN-1';
  INSERT INTO public.invoices (programme_id, account_manager)
    SELECT id, 'Faiz / Siti' FROM public.programmes
     WHERE programme_code = 'UJIAN-1';
`);
const barisUji = (await db.query(
  `SELECT raw_text, jumlah_baris::int, kategori, alias_wujud, resolved_id::text
     FROM public.am_unresolved_values() ORDER BY raw_text`)).rows;

eq(barisUji.length, 3, 'am_unresolved_values() memulangkan 3 nilai ujian');
const sholihin = barisUji.find((r) => r.raw_text.startsWith('Fuzy / Sholihin'));
eq(sholihin.raw_text, 'Fuzy / Sholihin',
  '🔴 UKURAN KUNCI: UI menerima nilai TERTRIM ("Fuzy / Sholihin"), BUKAN bentuk Excel beruang hujung');
eq(sholihin.kategori, 'SELESAI', 'nilai beruang hujung itu tetap SELESAI (alias manusia dipakai)');
eq(sholihin.alias_wujud, true, 'alias_wujud = true walaupun kunci alias tiada ruang hujung');
eq(sholihin.resolved_id, fuziahUuid, 'ia diagihkan kepada Fuziah');
eq(sholihin.jumlah_baris, 1, 'jumlah_baris = 1 bagi nilai ujian itu');

const ow = barisUji.find((r) => r.raw_text === 'Ow Zi Qi');
eq(ow.kategori, 'LUAR', 'DP-9: "Ow Zi Qi" -> kategori LUAR (bukan TIADA_PADANAN)');
eq(ow.resolved_id, null, 'DP-9: LUAR kekal resolved_id = NULL');
const faiz = barisUji.find((r) => r.raw_text === 'Faiz / Siti');
eq(faiz.kategori, 'BERBILANG_ORANG', 'veto §2.4: "Faiz / Siti" -> BERBILANG_ORANG (belum diputuskan)');
await db.exec('ROLLBACK');

/* ===================================================================== */
section('BAHAGIAN E — idempotensi (soalan K12 yang ditinggalkan ⏳ di live)');
await db.exec(teksSeed); // larian KEDUA, fail yang sama
const E = await kira();
eq(E.alias, 3, 'larian 2: alias KEKAL 3 (ON CONFLICT DO UPDATE — data idempoten)');
eq(E.luar, 1, 'larian 2: klasifikasi luar KEKAL 1');
const kunciAlias2 = (await db.query(
  `SELECT raw_text FROM public.account_manager_aliases ORDER BY raw_text`)).rows.map((r) => r.raw_text);
eq(kunciAlias2, kunciAlias, 'larian 2: set kunci alias tidak berubah (tiada baris keempat)');
eq(await selesai('Fuzy / Sholihin '), fuziahUuid, 'larian 2: resolusi masih betul');

// 🔴 Bahagian yang BUKAN idempoten — diukur, bukan diandaikan.
eq(E.audit - B.audit, 4,
  '🔴 larian 2 menambah 4 baris audit LAGI (data idempoten, JEJAK AUDIT TIDAK)');
eq(E.audit - A.audit, 8, 'jumlah audit selepas dua larian = +8, bukan +4');
const createdBerganda = (await db.query(
  `SELECT count(*)::int n FROM public.audit_logs
    WHERE table_name = 'account_manager_aliases' AND action = 'created'`)).rows[0].n;
eq(createdBerganda, 6,
  '🔴 6 peristiwa "created" bagi 3 alias: larian kedua melabel baris SEDIA ADA sebagai "created"');

/* ===================================================================== */
section('BAHAGIAN F — apa yang ujian ini buktikan tentang fail seed');
eq(teksSeed.includes("ARRAY['Fuzy', 'Fuzy / Dila', 'Fuzy / Sholihin']"), true,
  'fail seed mengandungi kunci TANPA ruang hujung (baris 142)');
eq(teksSeed.includes("'Fuzy / Sholihin '"), true,
  'fail yang sama merujuk bentuk BERUANG hujung di tempat lain (komen + query verifikasi)');
eq(/PERFORM public\.log_audit\(/.test(teksSeed), true,
  'log_audit() dipanggil tanpa syarat dalam gelung — punca audit tidak idempoten');

/* ===================================================================== */
section('BAHAGIAN G — cermin TS `kunciNama` vs SQL `normalize_person_name`');
// `lib/account-manager.ts` mengandungi cermin TS bagi normalisasi SQL supaya
// lencana DP-8/DP-9 boleh diputuskan di klien. Cermin yang drift daripada SQL
// akan melabel nilai secara salah — jadi ia dibandingkan TERUS kepada fungsi
// SQL yang dipasang, bagi setiap nilai Excel yang diketahui + kes tepi.
const AM = await import('../lib/account-manager.ts');
const KES = [
  ...AM.NILAI_EXCEL_DIKETAHUI,
  'Fuzy / Sholihin ',            // ruang hujung (bentuk Excel sebenar)
  'Fuzy / Sholihin  ',           // dua ruang hujung
  '  FUZY  ',                    // ruang + huruf besar
  'fuzy / dila',                 // huruf kecil
  'Dr. Afiq',                    // gelaran + titik
  "Abu Sa'id",                   // apostrofu
  'Tan Sri Ali',                 // gelaran berbilang perkataan
  'Ow Zi Qi ',                   // DP-9 dengan ruang hujung
  '',                            // kosong
  '   ',                         // ruang sahaja
];
let sepadan = 0;
for (const v of KES) {
  const sql = (await db.query(
    'SELECT public.normalize_person_name($1) AS n', [v])).rows[0].n;
  const ts = AM.kunciNama(v);
  // SQL memulangkan NULL bagi kosong; TS memulangkan '' — kedua-duanya bermaksud
  // "tiada kunci". Bandingkan selepas menyamakan perwakilan kosong itu.
  const sqlK = sql === null ? '' : sql;
  if (sqlK === ts) { sepadan += 1; }
  else { bad(`cermin normalisasi berbeza bagi ${JSON.stringify(v)}: SQL=${JSON.stringify(sqlK)} TS=${JSON.stringify(ts)}`); }
}
eq(sepadan, KES.length, `kunciNama === normalize_person_name bagi semua ${KES.length} kes`);
eq(AM.kunciNama('Fuzy / Sholihin '), AM.kunciNama('Fuzy / Sholihin'),
  'bentuk Excel dan bentuk tertrim (yang DB hantar ke UI) mempunyai kunci SAMA');
eq(AM.isKeputusanPengguna('Fuzy / Sholihin'), true,
  'lencana DP-8 muncul bagi nilai tertrim yang UI sebenarnya terima');
eq(AM.isKeputusanPengguna('Fuzy / Sholihin '), true,
  'lencana DP-8 juga muncul bagi bentuk Excel beruang hujung');
eq(AM.isKeputusanPengguna("Abu Sa'id"), false,
  'nilai yang bukan keputusan pengguna TIDAK dilabel (tiada lencana palsu)');
eq(AM.notaKeputusanPengguna('Fuzy / Sholihin')?.includes('DP-8'), true,
  'nota audit DP-8 tersedia bagi bentuk tertrim');
eq(AM.notaKeputusanPengguna('Ow Zi Qi')?.includes('DP-9'), true,
  'nota audit DP-9 tersedia bagi orang luar');

await db.close();

console.log(`\n${'='.repeat(62)}`);
console.log(`KEPUTUSAN: ${pass} lulus, ${fail} gagal`);
console.log(`${'='.repeat(62)}\n`);
process.exit(fail === 0 ? 0 : 1);
