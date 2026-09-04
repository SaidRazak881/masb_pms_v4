// =============================================================================
// scripts/generate-8a3-l1-reconciliation.mjs
//
// PENJANA PROMPT REKONSILIASI L1 — mengesahkan apa yang SEBENARNYA terpasang di
// live, bukan apa yang ChatGPT dakwa ia hantar.
//
// MENGAPA PERLU (DP-13)
// ---------------------
// ChatGPT memasang `client-master.sql` di live dan L1a–L1e LULUS. Tetapi ia
// mendedahkan dengan jujur:
//
//   "SQL yang dihantar ke apply_migration ialah implementation SQL yang sama
//    secara semantik, tetapi BUKAN salinan byte-for-byte penuh termasuk semua
//    komen dokumentasi."
//
// L1a–L1e hanya mengesahkan KEWUJUDAN dan NAMA objek. Yang belum disahkan:
//   - badan `normalize_person_name()` dan `resolve_account_manager()`
//     (logik padanan — teras seluruh Fasa 8A)
//   - `qual` / `with_check` bagi 4 polisi RLS (KESELAMATAN)
//   - ungkapan 2 indeks
//   - `is_nullable` / `column_default` bagi 6 lajur
//   - kekangan FK `account_manager_id`
//
// MENAPA PERBANDINGAN TEKS TIDAK BOLEH DIPAKAI
// --------------------------------------------
// Badan fungsi dalam fail mengandungi komen `--` DI DALAM blok `$$ … $$`
// (contoh: `-- gelaran kehormat Malaysia + antarabangsa, hanya di permulaan`).
// Jika komen dibuang, `pg_get_functiondef()` di live berbeza secara TEKS
// walaupun betul secara SEMANTIK. Jadi perbandingan teks akan memberi positif
// palsu, dan "betulkan supaya sepadan" akan mendorong seseorang menyunting
// production.
//
// PENYELESAIAN: SAHKAN MELALUI KELAKUAN, BUKAN TEKS.
// Skrip ini memasang fail yang DILULUSKAN ke dalam PGlite, menjalankan probe
// kelakuan, dan menerbitkan output PGlite sebagai JANGKAAN. ChatGPT menjalankan
// probe yang sama di live dan membandingkan. Kerana probe menguji KELAKUAN
// (input -> output), ia kalis terhadap pembuangan komen, ruang kosong, dan
// susun atur semula — tetapi TIDAK kalis terhadap logik yang berubah.
//
// Probe diskriminatif sengaja dipilih. Contoh: `resolve_account_manager('Afiq')`
// hanya menyelesaikan kepada 'Dr. Afiq' JIKA pembuangan gelaran berfungsi pada
// sisi profil. Jika regexp gelaran hilang, probe ini gagal — manakala probe
// `normalize_person_name('Dr. Afiq')` sahaja tidak cukup kerana kedua-dua sisi
// akan gagal bersama-sama dan masih sepadan.
//
// Jalankan: node scripts/generate-8a3-l1-reconciliation.mjs
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { PGlite } from '@electric-sql/pglite';

import {
  UID, STAFF, PROFIL_TAMBAHAN_LIVE, binaFixture, pasangLangkah,
} from './lib/fixture-live.mjs';

// Fixture (UID, STAFF, PROFIL_TAMBAHAN_LIVE, bootstrap, pengawal kesetaraan)
// kini tinggal di `scripts/lib/fixture-live.mjs` — SATU takrifan dikongsi oleh
// semua penjana rekonsiliasi. Sebab: DP-14.2 berlaku kerana fixture tidak
// setara live; dua fixture yang diselenggara berasingan akan drift antara satu
// sama lain dan kedua-duanya kelihatan "lulus".
const SQL_FILE = 'lib/supabase/client-master.sql';
const OUT = 'docs/PROMPT-8A3-L1-REKONSILIASI.md';
const BRANCH = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'],
  { encoding: 'utf8' }).trim();
const REPO = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' })
  .trim().match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)[1];

const q = (v) => (v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

// Escape backtick untuk rentetan yang akan ditanam dalam template literal JS.
const E = (t) => t.replace(/`/g, '\\`');

// -----------------------------------------------------------------------------
// Probe. `ketat` = MESTI sepadan; `maklumat` = boleh berbeza atas sebab platform.
// -----------------------------------------------------------------------------
const VEKTOR_NORM = [
  'Dr. Afiq', 'Dr. Ahmad Nizar', 'Tan Sri Ali', 'Pn. Zalina', "Abu Sa'id",
  '  FUZY  ', 'Fuzy / Dila', 'Ariffin', 'Zalina Sayuti', '', null,
];
const VEKTOR_RESOLVE = [
  'Abu Said', 'Adilah', 'Farrah', 'Fuziah', 'Fuzy', 'Fuzy / Dila',
  'Fuzy / Sholihin ', 'Omar', 'Ow Zi Qi', 'Sholihin', 'Zalina',
  'Afiq',                 // DISKRIMINATIF: hanya lulus jika gelaran dibuang
  'Ahmad Nizar',          // DISKRIMINATIF: sama
  // ⚠️ BUKAN probe negatif — ia mendedahkan risiko positif palsu Langkah 5
  // yang DIREKODKAN dalam DP-13.3. 'Siti Nurhaliza' bukan staf, tetapi token
  // pertamanya ('siti') unik dalam kalangan 18 staf, jadi Langkah 5
  // menyelesaikannya kepada 'Siti Sarah'. Ini kelakuan yang DIREKA (DP-2a),
  // bukan kecacatan — tetapi ia patut dilihat, bukan disembunyikan.
  'Siti Nurhaliza',
  'test', 'Admin',        // dua profil tambahan live — mesti TIDAK menyelesaikan
];
const LAJUR_BARU = [
  ['organizers', 'client_code'], ['organizers', 'sst_registration_no'],
  ['organizers', 'billing_address'], ['organizers', 'payment_terms_days'],
  ['invoices', 'account_manager_id'], ['import_staging', 'account_manager_id'],
];

// Nota yang dirender ke dalam prompt. Ia wujud supaya ChatGPT (atau pembaca
// kemudian) tidak menandakan perbezaan YANG DIJANGKA sebagai kegagalan.
const PROBE = [
  {
    id: 'R1', ketat: true,
    tajuk: 'Kelakuan `normalize_person_name()` — 11 vektor',
    sebab: 'Menguji keempat-empat langkah penormalan, termasuk pembuangan ' +
           'gelaran (DP-10.8a). Kalis terhadap pembuangan komen kerana ia ' +
           'menguji input→output, bukan teks fungsi.',
    sql: () => `SELECT v.masuk,
       public.normalize_person_name(v.masuk) AS keluar
  FROM (VALUES ${VEKTOR_NORM.map((x) => `(${q(x)})`).join(', ')}) AS v(masuk);`,
  },
  {
    id: 'R2', ketat: true,
    tajuk: 'Kelakuan `resolve_account_manager()` — 16 vektor',
    sebab: 'Teras Fasa 8A. Termasuk dua probe DISKRIMINATIF (`Afiq`, ' +
           '`Ahmad Nizar`) yang hanya lulus jika pembuangan gelaran berfungsi ' +
           'pada sisi PROFIL, dan dua profil tambahan live (`test`, `Admin`) ' +
           'yang mesti TIDAK menyelesaikan. NULL ialah jawapan BETUL bagi ' +
           'nilai yang belum diputuskan — L4 (seed) belum dijalankan.',
    nota: `> 🔴 **Perhatikan baris \`Siti Nurhaliza\` → \`Siti Sarah\`.** Ini **BUKAN** ralat.
> \`Siti Nurhaliza\` bukan staf, tetapi Langkah 5 (padanan token pertama, tepat
> satu) menyelesaikannya kerana token \`siti\` unik dalam kalangan 18 staf.
> Kelakuan ini **direka** (DP-2a) dan risikonya **direkodkan dalam DP-13.3**.
> Jika live memberikan \`NULL\` di sini, itu bermakna Langkah 5 **tidak
> berfungsi** — laporkan sebagai 🔴.
>
> 🟢 **\`Fuzy\`, \`Fuzy / Dila\`, \`Fuzy / Sholihin \` dan \`Ow Zi Qi\` dijangka NULL**
> kerana L4 (seed alias) belum dijalankan. Selepas L4, tiga yang pertama
> menyelesaikan kepada **Fuziah** dan \`Ow Zi Qi\` kekal NULL tetapi diklasifikasi
> \`LUAR\`. Jangan "memperbaiki" NULL ini sekarang.
>
> 🟠 **\`test\` → \`test\` dan \`Admin\` → \`Admin\` IALAH JANGKAAN YANG BETUL.**
> Versi pertama prompt ini meramalkan \`NULL\` kerana fixture PGlite Arena hanya
> menyemai 18 staf Excel dan **tertinggal** dua profil tambahan live. Ramalan itu
> **salah**; fixture kini menyemai **20 profil** supaya sepadan J0a/J0e live.
> Fungsi live **tidak rosak** dan **tidak perlu diubah**.
>
> Pendedahan ini bagaimanapun membuka **persoalan tadbir urus sebenar** yang
> direkodkan sebagai **DP-14.2**: patutkah \`resolve_account_manager()\` mengaitkan
> data perniagaan kepada akaun **blocked** (\`test\`) atau kepada akaun Super Admin
> (\`Admin\`)? Perhatikan \`am_list_staff()\` **sudah** menapis \`is_active = true\`
> manakala \`resolve_account_manager()\` **tidak menapis apa-apa** —
> ketidakselarasan dalam dua fail yang sama-sama diluluskan.
> **Jangan selesaikan dalam rekonsiliasi ini**; ia gate berasingan (DP-14).`,
    sql: () => `SELECT v.raw,
       (SELECT up.full_name FROM public.user_profiles up
         WHERE up.id = public.resolve_account_manager(v.raw)) AS diselesaikan
  FROM (VALUES ${VEKTOR_RESOLVE.map((x) => `(${q(x)})`).join(', ')}) AS v(raw);`,
  },
  {
    id: 'R3', ketat: true,
    tajuk: 'Definisi penuh 4 polisi RLS — `qual` dan `with_check`',
    sebab: 'KESELAMATAN. L1d hanya mengesahkan nama + cmd. Jika `qual` atau ' +
           'with_check` lebih longgar daripada yang diluluskan, itu kecacatan ' +
           'keselamatan yang senyap.',
    nota: `> 🟢 **\`am_aliases_read\` mempunyai \`qual = true\` — ini DISENGAJAKAN.** Fail yang
> diluluskan mengandungi komen "Veto Keselamatan §2.8: hanya peranan pengurusan
> boleh **menulis** pemetaan". Bacaan dibuka kepada semua \`authenticated\`
> (pemetaan alias bukan data demografi tertakluk sekatan peranan); **tulisan**
> dihadkan kepada \`admin\` / \`head_governance\` / \`finance\`. Jangan tandakan
> \`qual = true\` sebagai longgar.`,
    sql: () => `SELECT policyname, cmd, roles::text AS peranan,
       coalesce(qual, '(tiada)')        AS qual,
       coalesce(with_check, '(tiada)')  AS with_check
  FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'account_manager_aliases'
 ORDER BY policyname;`,
  },
  {
    id: 'R4', ketat: false,
    tajuk: 'Definisi 2 indeks',
    sebab: 'MAKLUMAN. PostgreSQL boleh merender ungkapan indeks sedikit ' +
           'berbeza antara versi/platform (contoh `lower(x)` vs ' +
           '`lower((x)::text)`). Laporkan apa adanya; perbezaan kosmetik ' +
           'BUKAN kegagalan, tetapi indeks yang HILANG atau pada ungkapan ' +
           'yang berbeza secara makna ISU.',
    nota: `> 🟠 **Perbezaan kosmetik dijangka.** PostgreSQL boleh merender \`lower(btrim(name))\`
> sebagai \`lower((btrim(name)))\` atau serupa antara versi. Yang penting: indeks
> itu **wujud**, pada **jadual yang betul**, dan pada **ungkapan yang sama
> maknanya**. Laporkan apa adanya.`,
    sql: () => `SELECT indexname, indexdef
  FROM pg_indexes
 WHERE schemaname = 'public'
   AND indexname IN ('idx_am_aliases_user', 'idx_organizers_name_lower')
 ORDER BY indexname;`,
  },
  {
    id: 'R5', ketat: true,
    tajuk: '6 lajur baharu — `is_nullable` dan `column_default`',
    sebab: 'L1a hanya mengesahkan nama + data_type. `is_nullable` dan default ' +
           'menentukan sama ada lajur itu boleh diisi dan apa yang berlaku ' +
           'kepada baris sedia ada.',
    sql: () => `SELECT table_name || '.' || column_name AS lajur, data_type,
       is_nullable, coalesce(column_default, '(tiada)') AS lalai
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND (table_name, column_name) IN (VALUES
       ${LAJUR_BARU.map(([t, c]) => `('${t}', '${c}')`).join(',\n       ')})
 ORDER BY 1;`,
  },
  {
    id: 'R6', ketat: true,
    tajuk: 'Struktur `account_manager_aliases` + kekangan',
    sebab: 'L1b hanya mengesahkan jadual wujud dan RLS aktif. Kekangan UNIQUE ' +
           'dan NOT NULL ialah apa yang menjadikan pemetaan alias boleh ' +
           'dipercayai (satu alias → satu orang).',
    sql: () => `SELECT c.column_name, c.data_type, c.is_nullable,
       coalesce(c.column_default, '(tiada)') AS lalai
  FROM information_schema.columns c
 WHERE c.table_schema = 'public' AND c.table_name = 'account_manager_aliases'
 ORDER BY c.ordinal_position;`,
  },
  {
    id: 'R6b', ketat: false,
    tajuk: 'Kekangan `account_manager_aliases`',
    sebab: '🟠 **MAKLUMAN — bukan ketat.** PGlite berjalan pada **PostgreSQL 18.3**, ' +
           'dan PG 18 memperkenalkan kekangan `NOT NULL` **bernama** dalam ' +
           '`pg_constraint` (`*_not_null`). Live Supabase menjalankan versi lebih ' +
           'lama yang merepresentasikan `NOT NULL` sebagai metadata lajur sahaja. ' +
           'Jadi bilangan baris probe ini **dijangka berbeza mengikut versi**, dan ' +
           'perbezaan itu **BUKAN kecacatan**. Semantik `NOT NULL` sudah disahkan ' +
           'secara ketat oleh **R6** (`is_nullable = NO`).',
    nota: [
      '> 🔴 **Yang WAJIB sepadan walaupun probe ini 🟠:**',
      '> - `account_manager_aliases_pkey` → `PRIMARY KEY (id)`',
      '> - `account_manager_aliases_raw_unique` → `UNIQUE (raw_text)`',
      '> - `account_manager_aliases_user_id_fkey` → `FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE`',
      '> - `account_manager_aliases_confirmed_by_fkey` → `FOREIGN KEY (confirmed_by) REFERENCES auth.users(id)`',
      '>',
      '> 🟠 **Yang DIJANGKA TIADA di live** (ciri PostgreSQL 18; PGlite 18.3 sahaja):',
      '> `*_id_not_null`, `*_created_at_not_null`, `*_raw_text_not_null`,',
      '> `*_user_id_not_null`, `*_confirmed_at_not_null`.',
      '> Jika live **ada** kekangan bernama ini, laporkan — itu bermakna live juga',
      '> PG 18 dan beberapa andaian lain perlu dikemas kini.',
      '>',
      '> **Jangan** tambah kekangan `NOT NULL` bernama di live untuk "menyamakan".',
      '> Semantiknya sudah betul dan sudah disahkan oleh R6.',
    ].join('\n'),
    sql: () => `SELECT conname, pg_get_constraintdef(oid) AS definisi
  FROM pg_constraint
 WHERE conrelid = 'public.account_manager_aliases'::regclass
 ORDER BY conname;`,
  },
  {
    id: 'R7', ketat: true,
    tajuk: 'FK `account_manager_id` → `user_profiles` (K5)',
    sebab: 'K5 menuntut 2 FK ke `user_profiles` dengan `NO ACTION`. ' +
           '`ON DELETE SET NULL` atau `CASCADE` akan memadam atau yatimkan ' +
           'pautan sejarah kewangan — itu kecacatan, bukan variasi.',
    nota: `> 🟢 **Tiada \`ON DELETE\` dalam output ialah BETUL — ia bermakna \`NO ACTION\`.**
> \`pg_get_constraintdef()\` **membuang** \`ON DELETE NO ACTION\` kerana ia lalai
> PostgreSQL. K5 menuntut "2 FK → \`user_profiles\`, \`NO ACTION\`", dan kedua-dua
> baris di bawah memenuhinya. **Jangan** tandakan ketiadaan \`ON DELETE\` sebagai
> tidak sepadan, dan **jangan** tambah \`ON DELETE SET NULL\` atau \`CASCADE\` —
> itu akan memadam atau yatimkan pautan sejarah kewangan.`,
    sql: () => `SELECT conrelid::regclass::text AS jadual, conname,
       pg_get_constraintdef(oid) AS definisi
  FROM pg_constraint
 WHERE confrelid = 'public.user_profiles'::regclass
   AND conrelid IN ('public.invoices'::regclass,
                    'public.import_staging'::regclass)
 ORDER BY 1;`,
  },
];

// -----------------------------------------------------------------------------
// Jalankan dalam PGlite untuk mendapatkan JANGKAAN
// -----------------------------------------------------------------------------
// Fixture setara live dibina oleh modul dikongsi (pengawal: 8 nilai app_role,
// 18 staf Excel, 20 profil keseluruhan — gagal = balingan).
const { db } = await binaFixture({ uid: UID });
await pasangLangkah(db, [SQL_FILE]);

const hasil = [];
const JANGKAAN_BARIS = { R1: VEKTOR_NORM.length, R2: VEKTOR_RESOLVE.length };
for (const p of PROBE) {
  const sql = p.sql();
  const r = await db.query(sql);
  // Penjaga senyap-senyap: probe yang mengembalikan bilangan baris yang salah
  // (contoh kerana kesilapan kurungan VALUES) menjadikan rekonsiliasi sia-sia,
  // dan ChatGPT akan membandingkan 11 baris live dengan 1 baris jangkaan.
  const patut = JANGKAAN_BARIS[p.id];
  if (patut !== undefined && r.rows.length !== patut) {
    throw new Error(`${p.id}: jangkaan ${patuh} baris, dapat ${r.rows.length} — probe rosak`);
  }
  hasil.push({ ...p, sql, rows: r.rows });
}

// -----------------------------------------------------------------------------
// Bentukkan jadual markdown
// -----------------------------------------------------------------------------
const jadual = (rows) => {
  if (!rows.length) return '_(tiada baris)_';
  const kolum = Object.keys(rows[0]);
  const sel = (v) => (v === null || v === undefined ? '**NULL**'
    : String(v).replace(/\|/g, '\\|').replace(/\n/g, '<br>'));
  const out = ['| ' + kolum.join(' | ') + ' |',
               '|' + kolum.map(() => '---').join('|') + '|'];
  for (const r of rows) out.push('| ' + kolum.map((k) => sel(r[k])).join(' | ') + ' |');
  return out.join('\n');
};

let seksyen = '';
for (const h of hasil) {
  seksyen += `### ${h.id} — ${h.tajuk} ${h.ketat ? '🔴 MESTI SEPADAN' : '🟠 MAKLUMAN'}

${h.sebab ? `${h.sebab}\n\n` : ''}${h.nota ? `${h.nota}\n\n` : ''}\`\`\`sql
${h.sql}
\`\`\`

**Jangkaan (dikira dalam PGlite daripada fail yang diluluskan):**

${jadual(h.rows)}

`;
}

const dokumen = `# PROMPT 8A-3 / L1-R — Rekonsiliasi Langkah 1 (read-only)

> **Untuk:** ChatGPT (akses penuh Supabase + Vercel + GitHub)
> **Dari:** Arena (menulis kod/SQL/ujian; **tidak** melaksanakan kerja produksi)
> **Tarikh:** 2026-09-04
> **Repo:** \`${REPO}\` · **Branch:** \`${BRANCH}\`
> **Projek Supabase:** \`lmenmfsbjgxfhnykkgow\` (20 aksara)
> **Jenis:** 🟢 **READ-ONLY SEPENUHNYA — tiada pemasangan, tiada kelulusan diperlukan**
> **Dijana oleh:** \`node scripts/generate-8a3-l1-reconciliation.mjs\` — jangan
> sunting tangan; jangkaan di bawah dikira dalam PGlite daripada fail yang
> diluluskan.

---

## 0. Mengapa prompt ini wujud

Anda memasang \`client-master.sql\` di live dan L1a–L1e **LULUS**. Terima kasih —
dan terima kasih kerana **mendedahkan dengan jujur** bahawa:

> "SQL yang dihantar ke \`apply_migration\` ialah implementation SQL yang sama
> secara semantik, tetapi **bukan salinan byte-for-byte penuh** termasuk semua
> komen dokumentasi."

Itu pendedahan yang betul dan kami tidak menganggapnya sebagai pelanggaran.
Tetapi ia bermakna **L1a–L1e belum mencukupi**: ia mengesahkan KEWUJUDAN dan
NAMA objek, bukan DEFINISINYA. Yang belum disahkan:

| Objek | Sudah disahkan | **Belum disahkan** |
|---|---|---|
| 6 lajur | nama + \`data_type\` | \`is_nullable\`, \`column_default\`, FK |
| \`account_manager_aliases\` | wujud + \`rls_aktif\` | lajur, \`NOT NULL\`, \`UNIQUE\`, kekangan |
| 2 fungsi | nama + argumen | **BADAN FUNGSI — logik padanan** |
| 4 polisi | nama + \`cmd\` | **\`qual\` / \`with_check\` — KESELAMATAN** |
| 2 indeks | nama | ungkapan indeks |

**Mengapa kita tidak membandingkan teks fungsi secara langsung:** badan fungsi
dalam fail mengandungi komen \`--\` **di dalam** blok \`$$ … $$\`. Jika komen
dibuang, \`pg_get_functiondef()\` di live berbeza secara **teks** walaupun betul
secara **semantik**. Membandingkan teks akan memberi positif palsu dan mendorong
seseorang "memperbaiki" production supaya sepadan — itu lebih berbahaya daripada
jurang itu sendiri.

**Maka rekonsiliasi ini menguji KELAKUAN, bukan teks.** Setiap jangkaan di bawah
dikira oleh Arena dalam **PGlite** dengan memasang **fail yang diluluskan**
(\`client-master.sql\`, blob SHA \`37b8d8b8fa882b65645cf32e2c37d55590ec6cf2\`)
ke atas 18 staf yang **sama namanya dengan J0a live** yang anda laporkan. Jadi
perbezaan kelakuan = perbezaan logik, bukan perbezaan format.

---

## 1. ARAHAN

1. Jalankan **R1 … R7** di bawah terhadap live \`lmenmfsbjgxfhnykkgow\`.
   Semuanya **read-only** (\`SELECT\` sahaja).
2. Laporkan output **verbatim** dalam bentuk jadual, di sebelah jangkaan.
3. Tandakan setiap satu 🟢 SEPADAN / 🔴 BERBEZA / 🟠 MAKLUUMAN.
4. **Jika mana-mana probe 🔴 ketat BERBEZA: BERHENTI dan laporkan.** Jangan
   cuba "memperbaiki" fungsi, polisi, atau indeks di live. Itu kerja Arena —
   kami akan mengeluarkan fail pembetulan yang diluluskan.
5. **JANGAN** jalankan Langkah 2, 3, atau 4 sehingga rekonsiliasi ini disemak.

> ⚠️ **Peringkat semasa:** L1 sudah dipasang; **L4 (seed) BELUM**. Maka
> \`Fuzy\`, \`Fuzy / Dila\`, \`Fuzy / Sholihin \` dan \`Ow Zi Qi\` **dijangka
> NULL** dalam R2. Selepas L4, tiga yang pertama akan menyelesaikan kepada
> **Fuziah**. Jangan "memperbaiki" NULL ini sekarang.

> 🟢 **Dua profil tambahan live** (\`Admin\`, \`test\`) **KINI ADA** dalam
> fixture PGlite. Versi pertama prompt ini hanya menyemai 18 staf Excel dan
> meramalkan \`NULL\` untuk kedua-duanya — ramalan itu **salah**, bukan
> kelakuan live yang salah. Fixture kini menyemai **20 profil** (sepadan
> J0a/J0e live), jadi R2 **dijangka** \`test\` → \`test\` dan
> \`Admin\` → \`Admin\`. **Jangan ubah fungsi production** kerana versi
> pertama ramalan itu.
> Persoalan tadbir urus yang timbul daripadanya direkodkan sebagai **DP-14.2**
> dan **BUKAN** sebahagian rekonsiliasi ini.

---

## 2. PROBE

${seksyen}---

## 3. FORMAT LAPORAN

**Seksyen 1 — Konteks & Status:** project ref; pengesahan bahawa tiada DDL/DML
dijalankan; peringkat pemasangan semasa (L1 sahaja).

**Seksyen 2 — Keputusan R1–R7:** bagi setiap probe, jadual **dapat vs jangkaan**
dan status 🟢/🔴/🟠. Sertakan output **verbatim**, bukan rumusan.

**Seksyen 3 — Perbezaan:** senaraikan setiap perbezaan, walaupun kecil. Bagi
yang 🔴 ketat, nyatakan nilai dapat dan nilai jangkaan secara eksplisit.

**Seksyen 4 — Isu / Blocker / Penemuan.**

**Seksyen 5 — Pematuhan larangan:** khususnya — tiada DDL, tiada DML, tiada
\`service_role\`, tiada pembetulan sendiri terhadap fungsi/polisi/indeks, tiada
Langkah 2–4.

**Berhenti selepas laporan.**
`;

// Mod --check: bina dalam ingatan dan bandingkan dengan cakera TANPA menulis,
// supaya drift (suntingan tangan, atau jangkaan lapuk selepas fail SQL berubah)
// boleh dikesan oleh scripts/test-doc-references.mjs semasa ujian.
if (process.argv.includes('--check')) {
  const sedia = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
  if (sedia === dokumen) {
    console.log('\n\u2705 --check: prompt rekonsiliasi sepadan output penjana (tiada drift).');
    process.exit(0);
  }
  console.log('\n\u274c --check: ' + OUT + ' DRIFT daripada output penjana.');
  console.log('   Jalankan: node scripts/generate-8a3-l1-reconciliation.mjs');
  process.exit(1);
}

fs.writeFileSync(OUT, dokumen);
console.log(`✅ ${OUT}`);
console.log(`   ${Buffer.byteLength(dokumen)} bait | ${dokumen.split('\n').length} baris | ${hasil.length} probe`);
for (const h of hasil) {
  console.log(`   ${h.id.padEnd(4)} ${h.ketat ? '🔴 ketat ' : '🟠 maklum'} ${String(h.rows.length).padStart(2)} baris`);
}
