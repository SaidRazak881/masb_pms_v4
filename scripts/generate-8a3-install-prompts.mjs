// =============================================================================
// scripts/generate-8a3-install-prompts.mjs
//
// PENJANA DETERMINISTIK bagi 4 prompt pemasangan 8A-3 (kata putus DP-12.4).
//
// MENGAPA SKRIP INI WUJUD
// -----------------------
// Connector GitHub ChatGPT MEMOTONG kandungan fail panjang, jadi ia boleh
// mengesahkan blob SHA (Lapis 1 LULUS) tetapi tidak boleh memperoleh byte-stream
// penuh untuk dihantar ke `Supabase.apply_migration`, yang hanya menerima teks
// SQL penuh. ChatGPT betul menolak untuk membina semula SQL daripada potongan.
//
// Penyelesaian: benamkan SQL dalam prompt supaya pengguna menampalnya dan
// ChatGPT memegang teks penuh dalam konteks.
//
// Penyalinan dilakukan oleh SKRIP, bukan manusia atau model, kerana kedua-duanya
// cenderung "memperbaiki" ruang kosong semasa menyalin. Skrip ini membaca bait
// fail dan menulisnya terus ke markdown — sifar transkripsi.
//
// KEKANGAN YANG MESTI DIPEENUHI (semuanya diukur, bukan diandaikan)
//   - Fail SQL tidak mengandungi pagar ``` (disahkan: 0 dalam keempat-empat),
//     jadi ia selamat dibenamkan. Pagar 4-backtick tetap dipakai sebagai
//     pertahanan berlapis.
//   - Semua fail LF (tiada CRLF) dan berakhir dengan newline, jadi pengekstrakan
//     semula adalah byte-tepat.
//   - Fail SQL TIDAK BOLEH diubah — blob SHA Lapis 1 yang sudah LULUS mesti
//     kekal sah.
//
// Gelung integriti ditutup oleh scripts/test-doc-references.mjs seksyen [7],
// yang mengekstrak SQL daripada prompt yang dijana dan menegaskan blob SHA,
// SHA-256, bait, baris, aksara dan kiraan CREATE sama dengan fail sebenar.
//
// Jalankan: node scripts/generate-8a3-install-prompts.mjs
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const SENARAI_SQL = 'lib/supabase';
const PROMPT_INDUK = 'docs/PROMPT-8A3-INSTALL.md';
const BRANCH = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'],
  { encoding: 'utf8' }).trim();
const COMMIT = execFileSync('git', ['rev-parse', '--short', 'HEAD'],
  { encoding: 'utf8' }).trim();
const remoteUrl = execFileSync('git', ['remote', 'get-url', 'origin'],
  { encoding: 'utf8' }).trim();
const REPO = remoteUrl.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)[1];

// -----------------------------------------------------------------------------
// Cap jari — semantik MESTI sepadan test-doc-references.mjs seksyen [6]:
//   bait   = bilangan bait UTF-8            (sama seperti `wc -c`)
//   baris  = bilangan '\n'                  (sama seperti `wc -l`)
//   aksara = bilangan TITIK KOD Unicode, BUKAN unit UTF-16. Emoji seperti
//            U+1F7E2 ialah 2 unit UTF-16 tetapi 1 titik kod, jadi
//            `s.length` TIDAK boleh dipakai; guna `[...s].length`.
//   CREATE = bilangan BARIS yang sepadan     (sama seperti `grep -c`)
// -----------------------------------------------------------------------------
const capJari = (rel) => {
  const teks = fs.readFileSync(rel, 'utf8');
  const buf = fs.readFileSync(rel);
  const barisArr = teks.split('\n');
  const kira = (awalan) => barisArr.filter((l) => l.startsWith(awalan)).length;
  const bukanKosong = barisArr.map((l) => l.replace(/\s+$/, '')).filter((l) => l !== '');
  return {
    teks,
    blob: execFileSync('git', ['hash-object', rel], { encoding: 'utf8' }).trim(),
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    bait: buf.length,
    baris: (teks.match(/\n/g) || []).length,
    aksara: [...teks].length,
    table: kira('CREATE TABLE'),
    func: (teks.match(/CREATE OR REPLACE FUNCTION/g) || []).length,
    policy: kira('CREATE POLICY'),
    index: kira('CREATE INDEX'),
    pertama: bukanKosong[0] ?? '',
    terakhir: bukanKosong[bukanKosong.length - 1] ?? '',
  };
};

// -----------------------------------------------------------------------------
// Terbitkan senarai objek DARIPADA fail SQL itu sendiri — jangan reka.
// -----------------------------------------------------------------------------
const terbitObjek = (teks) => {
  const jadual = [...teks.matchAll(/^CREATE TABLE(?: IF NOT EXISTS)? public\.(\w+)/gm)]
    .map((m) => m[1]);
  const fungsi = [...teks.matchAll(/^CREATE OR REPLACE FUNCTION public\.(\w+)\s*\(/gm)]
    .map((m) => m[1]);
  const polisi = [...teks.matchAll(/^CREATE POLICY\s+"?([\w]+)"?\s+ON\s+public\.(\w+)/gm)]
    .map((m) => ({ nama: m[1], jadual: m[2] }));
  const indeks = [...teks.matchAll(/^CREATE INDEX(?: IF NOT EXISTS)?\s+(\w+)/gm)]
    .map((m) => m[1]);

  // Lajur: ALTER TABLE boleh merangkumi beberapa baris ADD COLUMN, jadi imbas
  // baris demi baris dan jejak jadual sasaran semasa.
  const lajur = [];
  let sasaran = null;
  for (const l of teks.split('\n')) {
    const a = l.match(/^ALTER TABLE\s+public\.(\w+)\s*$/);
    if (a) { sasaran = a[1]; continue; }
    const c = l.match(/^\s*ADD COLUMN(?: IF NOT EXISTS)?\s+(\w+)/);
    if (c && sasaran) lajur.push({ jadual: sasaran, lajur: c[1] });
  }
  return { jadual, fungsi, polisi, indeks, lajur };
};

// -----------------------------------------------------------------------------
// Pembina query pengesahan objek (read-only)
// -----------------------------------------------------------------------------
const senaraiSql = (arr) => arr.map((x) => `'${x}'`).join(', ');

const binaSemakan = (langkah, obj) => {
  const q = [];
  if (obj.lajur.length) {
    const values = obj.lajur
      .map((c) => `('${c.jadual}', '${c.lajur}')`).join(',\n             ');
    q.push(`-- ${langkah}a: lajur baharu wujud
SELECT '${langkah}a' AS check_name,
       table_name || '.' || column_name AS lajur, data_type
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND (table_name, column_name) IN (VALUES
             ${values})
 ORDER BY table_name, column_name;
-- Jangkaan: ${obj.lajur.length} baris`);
  }
  if (obj.jadual.length) {
    q.push(`-- ${langkah}b: jadual baharu wujud
SELECT '${langkah}b' AS check_name, relname AS jadual,
       relrowsecurity AS rls_aktif
  FROM pg_class
 WHERE relnamespace = 'public'::regnamespace
   AND relname IN (${senaraiSql(obj.jadual)})
 ORDER BY relname;
-- Jangkaan: ${obj.jadual.length} baris, rls_aktif = true`);
  }
  if (obj.fungsi.length) {
    q.push(`-- ${langkah}c: fungsi baharu wujud
SELECT '${langkah}c' AS check_name, p.proname AS fungsi,
       pg_get_function_identity_arguments(p.oid) AS argumen
  FROM pg_proc p
 WHERE p.pronamespace = 'public'::regnamespace
   AND p.proname IN (${senaraiSql(obj.fungsi)})
 ORDER BY p.proname;
-- Jangkaan: ${obj.fungsi.length} baris`);
  }
  if (obj.polisi.length) {
    q.push(`-- ${langkah}d: polisi RLS baharu wujud
SELECT '${langkah}d' AS check_name, tablename, policyname, cmd
  FROM pg_policies
 WHERE schemaname = 'public'
   AND policyname IN (${senaraiSql(obj.polisi.map((p) => p.nama))})
 ORDER BY tablename, policyname;
-- Jangkaan: ${obj.polisi.length} baris`);
  }
  if (obj.indeks.length) {
    q.push(`-- ${langkah}e: indeks baharu wujud
SELECT '${langkah}e' AS check_name, tablename, indexname
  FROM pg_indexes
 WHERE schemaname = 'public'
   AND indexname IN (${senaraiSql(obj.indeks)})
 ORDER BY indexname;
-- Jangkaan: ${obj.indeks.length} baris`);
  }
  return q.join('\n\n');
};

// -----------------------------------------------------------------------------
// Kongsi: seksyen larangan + format laporan daripada prompt induk
// -----------------------------------------------------------------------------
const induk = fs.readFileSync(PROMPT_INDUK, 'utf8');
const potong = (mula, tamat) => {
  const i = induk.indexOf(mula);
  const j = induk.indexOf(tamat, i + 1);
  if (i < 0 || j < 0) throw new Error(`seksyen tidak ditemui: ${mula}`);
  return induk.slice(i, j).trimEnd();
};
const SEKSYEN_K = potong('## 6. Kriteria K', '## 7. Larangan');
const LARANGAN = potong('## 7. Larangan', '## 8. FORMAT LAPORAN');
const FORMAT = potong('## 8. FORMAT LAPORAN', '## Nota untuk Arena');

const urlBlob = (p) =>
  `https://github.com/${REPO}/blob/${BRANCH}/${p}`;

// Pagar 4-backtick. MESTI dibina sebagai pemalar: menulisnya secara literal
// dalam template literal JS akan MENAMATKAN template itu pada backtick pertama.
// 4 backtick (bukan 3) dipakai sebagai pertahanan berlapis — fail SQL disahkan
// tidak mengandungi pagar 3-backtick, tetapi jika ia ditambah kelak, kandungan
// SQL tidak akan memecahkan pagar luar.
const PAGAR = '`'.repeat(4);

// -----------------------------------------------------------------------------
// Takrifan 4 langkah
// -----------------------------------------------------------------------------
const LANGKAH = [
  {
    n: 1, kod: 'L1',
    fail: 'client-master.sql',
    out: 'docs/PROMPT-8A3-L1-CLIENT-MASTER.md',
    tajuk: 'Langkah 1 — `client-master.sql` (Fasa 8A)',
    ringkas: '6 lajur induk pelanggan + jadual `account_manager_aliases` + ' +
             '2 fungsi (`normalize_person_name`, `resolve_account_manager`).',
    prasyarat: 'Tiada. Ini langkah pertama. J0 sudah LULUS dan **tidak perlu diulang**.',
    nota: '',
  },
  {
    n: 2, kod: 'L2',
    fail: 'external-account-managers.sql',
    out: 'docs/PROMPT-8A3-L2-EXTERNAL-ACCOUNT-MANAGERS.md',
    tajuk: 'Langkah 2 — `external-account-managers.sql` (DP-9)',
    ringkas: 'Jadual `external_account_managers` + 3 fungsi + 4 polisi RLS + 2 indeks. ' +
             'Merekodkan "orang luar" sebagai **sudah diputuskan**, berbeza daripada ' +
             '"belum diputuskan".',
    prasyarat: '**Langkah 1 mesti sudah dipasang dan dilaporkan.** ' +
               'Fail ini tidak bergantung pada fungsi Langkah 1, tetapi urutan ' +
               '1→2→3→4 adalah wajib supaya laporan boleh dijejak.',
    nota: '',
  },
  {
    n: 3, kod: 'L3',
    fail: 'account-manager-resolution.sql',
    out: 'docs/PROMPT-8A3-L3-ACCOUNT-MANAGER-RESOLUTION.md',
    tajuk: 'Langkah 3 — `account-manager-resolution.sql` (Fasa 8A-2)',
    ringkas: '7 fungsi: permukaan untuk manusia mengesahkan alias ' +
             '(`am_confirm_alias`, `am_revoke_alias`), mengklasifikasi orang luar ' +
             '(`am_confirm_external`, `am_revoke_external`, `is_external_account_manager`), ' +
             'dan `am_backfill_account_manager()` + `am_backfill_preview()`.',
    prasyarat: '**Langkah 1 dan 2 mesti sudah dipasang.** `am_confirm_external()` ' +
               'menulis ke jadual dari Langkah 2.',
    nota: `> 🔴 **JANGAN panggil \`am_backfill_account_manager()\` dalam langkah ini.**
> Ia gate berasingan yang hanya dibuka SELEPAS import Fasa 8C. Di sini anda hanya
> **memasang** fungsinya dan mengesahkan ia wujud.
>
> \`\`\`sql
> -- L3x: SEMAKAN KUASA (read-only) — siapa boleh mengesahkan alias?
> SELECT 'L3x' AS check_name, up.full_name, up.role::text AS role,
>        public.can_resolve_account_managers() AS boleh_selesai
>   FROM public.user_profiles up
>  WHERE up.role::text IN ('super_admin', 'admin', 'head_governance', 'finance')
>  ORDER BY up.role::text, up.full_name;
> -- Jangkaan: Super Admin / admin / head_governance / finance = true;
> --           viewer / executive / staff = false (tidak disenaraikan di sini).
> \`\`\``,
  },
  {
    n: 4, kod: 'L4',
    fail: 'seed-account-manager-aliases.sql',
    out: 'docs/PROMPT-8A3-L4-SEED-ALIASES.md',
    tajuk: 'Langkah 4 — `seed-account-manager-aliases.sql` (keputusan DP-8 + DP-9)',
    ringkas: 'Merekodkan keputusan manusia sebagai **data**: 3 alias DP-8 ' +
             '(`Fuzy`, `Fuzy / Dila`, `Fuzy / Sholihin ` → **Fuziah**) dan ' +
             '1 klasifikasi luar DP-9 (`Ow Zi Qi` = orang luar, ' +
             '`account_manager_id` kekal NULL).',
    prasyarat: '**Langkah 1, 2 dan 3 mesti sudah dipasang.** Fail ini memanggil ' +
               '`am_confirm_alias()` (Langkah 1/3) dan `am_confirm_external()` (Langkah 2/3).',
    nota: `> 🔴 **Jalankan SELURUH fail sebagai SATU pelaksanaan.**
> Fail ini mengandungi **blok identiti** di permulaannya: \`am_confirm_alias()\` dan
> \`am_confirm_external()\` memerlukan \`auth.uid()\`, tetapi SQL Editor Supabase
> berjalan sebagai pemilik pangkalan data **tanpa JWT** → \`auth.uid()\` = NULL →
> setiap INSERT gagal dengan \`42501 tiada kuasa\`. Blok itu menetapkan
> \`request.jwt.claims\` kepada akaun Super Admin untuk tempoh skrip dan
> **memulihkannya** di hujung.
>
> Jika tiada akaun Super Admin ditemui, seed **membatalkan dirinya** dengan
> \`P0002\` — ia tidak akan menulis NULL secara paksa.
>
> **Kesan yang diingini:** \`audit_logs.user_id\` merekodkan Super Admin sebenar
> sebagai pengesah keputusan DP-8/DP-9. Itulah sebabnya \`audit_logs\` dijangka
> **bertambah** daripada 44 (K10).
>
> 🔴 **Jika \`42501 tiada kuasa\` muncul: BERHENTI dan laporkan teks ralat penuh.**
> **JANGAN** longgarkan RLS. **JANGAN** tukar \`SECURITY DEFINER\`.
> **JANGAN** guna \`service_role\`. Itu melanggar larangan tetap.

> 🟢 **J0d sudah mengesahkan \`Fuziah\` UNIK di live** (\`bilangan = 1\`), jadi
> seed **tidak** dijangka berhenti kerana kabur. Teruskan.

> 🟢 **J1f/J0 sudah mengesahkan live mempunyai SIFAR nilai \`Account Manager\`.**
> Maka selepas seed, **K8 dijangka 0 baris** dan \`am_backfill_account_manager()\`
> (bila ia dibuka kelak) akan mengisi **0 baris**. **0 = LULUS**, bukan kegagalan.
> Jangan "memperbaiki" angka ini.`,
    kPenuh: true,
  },
];

// -----------------------------------------------------------------------------
// Jana setiap prompt
// -----------------------------------------------------------------------------
let jumlahBait = 0;
for (const L of LANGKAH) {
  const rel = path.join(SENARAI_SQL, L.fail);
  const cj = capJari(rel);
  const obj = terbitObjek(cj.teks);
  const semakan = L.kPenuh ? SEKSYEN_K : binaSemakan(L.kod, obj);

  const dokumen = `# PROMPT 8A-3 / ${L.kod} — ${L.tajuk}

> **Untuk:** ChatGPT (mempunyai akses penuh Supabase + Vercel + GitHub)
> **Daripada:** Arena (menulis kod/SQL/ujian; **tidak** melaksanakan kerja produksi)
> **Tarikh:** 2026-09-04
> **Repo:** \`${REPO}\` · **Branch:** \`${BRANCH}\` · **Commit:** \`${COMMIT}\`
> **Projek Supabase:** \`lmenmfsbjgxfhnykkgow\` (20 aksara)
> **Jenis:** 🔴 **HARD GATE — pemasangan live. Sudah DILULUSKAN pengguna.**
> **Dijana oleh:** \`node scripts/generate-8a3-install-prompts.mjs\` — **jangan
> sunting tangan**; SQL di bawah ditulis terus daripada bait fail.

---

## 0. Mengapa SQL dibenamkan dalam prompt ini (DP-12)

Anda melaporkan dengan betul bahawa connector GitHub **memotong kandungan fail
panjang**, jadi anda tidak dapat memperoleh byte-stream penuh untuk dihantar ke
\`Supabase.apply_migration\` — dan anda enggan membina semula SQL daripada
potongan. Itu betul.

**Maka SQL penuh dibenamkan di bawah (Seksyen 3).** Anda kini memegang teks
penuh dalam konteks, jadi:

1. Tiada lagi kebergantungan pada connector untuk kandungan.
2. **Lapis 2 akhirnya boleh anda kira sendiri** — tulis teks itu ke sandbox anda
   (jika ada) dan ukur bait / aksara / baris / kiraan \`CREATE\`, malah SHA-256
   yang sebelum ini mustahil.
3. Rantai integriti ditutup di hujung Arena: \`scripts/test-doc-references.mjs\`
   seksyen [7] mengekstrak SQL daripada prompt ini dan menegaskan **blob SHA,
   SHA-256, bait, baris, aksara dan kiraan CREATE sama dengan fail sebenar**.

**Prasyarat:** ${L.prasyarat}

**Objek yang dipasang langkah ini:** ${L.ringkas}

${L.nota}

---

## 1. Keadaan live yang SUDAH disahkan (jangan ulang)

Daripada J0 dan J1 yang anda sendiri jalankan terhadap live
\`lmenmfsbjgxfhnykkgow\`:

| Fakta | Nilai | Implikasi |
|---|---|---|
| \`user_profiles\` | **20** | 18 staf Excel + \`Admin\` (super_admin) + \`test\` (blocked). **Bukan anomali.** |
| J0b nama ternormal berulang | \`[]\` | tiada kabur pada padanan tepat |
| J0c token pertama berulang | \`[]\` | tiada kabur pada langkah token |
| J0d \`Fuziah\` | \`bilangan = 1\` (unik) | seed Langkah 4 tidak akan berhenti |
| \`audit_logs\` | **44** | K10 dijangka **> 44** selepas seed |
| \`import_staging\` / \`invoices\` / \`organizers\` / \`programmes\` | 1124 / 6 / 12 / 14 | **mesti TIDAK berubah** |
| Nilai \`Account Manager\` live | **SIFAR** (J1f = \`[]\`) | **K8 = 0 baris = LULUS** |
| \`import_staging.updated_at\` | **WUJUD** (\`timestamptz\`, \`NOT NULL\`, \`now()\`) | DP-7 **ditutup**; Langkah 5 **LANGKAU** |
| Jadual \`public\` | **18** | K11 dijangka **20** selepas semua 4 langkah |
| Blob SHA keempat-empat fail | **sepadan** | Lapis 1 **LULUS** (anda sudah laporkan) |

**JANGAN jalankan J0 semula. JANGAN jalankan \`fix-import-staging-updated-at.sql\`.**

---

## 2. SAHKAN integriti teks di bawah SEBELUM menjalankan

Bandingkan dengan teks yang anda terima dalam Seksyen 3.

| Cap jari | Nilai jangkaan |
|---|---|
| **Lapis 1 — Git blob SHA** | \`${cj.blob}\` |
| Lapis 2 — bait (UTF-8) | **${cj.bait}** |
| Lapis 2 — baris | **${cj.baris}** |
| Lapis 2 — aksara (titik kod Unicode) | **${cj.aksara}** |
| Lapis 2 — \`CREATE TABLE\` / \`FUNCTION\` / \`POLICY\` / \`INDEX\` | **${cj.table} / ${cj.func} / ${cj.policy} / ${cj.index}** |
| Lapis 2 — baris pertama | \`${cj.pertama}\` |
| Lapis 2 — baris terakhir (bukan kosong) | \`${cj.terakhir}\` |
| Pilihan — SHA-256 | \`${cj.sha256}\` |

**Cara mengesahkan:**

- **Jika anda ada sandbox/kod:** tulis teks antara pagar di Seksyen 3 ke fail
  **tepat sebagaimana adanya** (jangan tambah atau buang baris kosong terakhir),
  kemudian kira \`sha256sum\`, \`wc -c\`, \`wc -l\`, dan
  \`git hash-object\`. Bandingkan semua dengan jadual di atas.
- **Jika tiada sandbox:** sahkan sekurang-kurangnya **baris pertama**,
  **baris terakhir**, dan bahawa tiada bahagian yang kelihatan terpotong
  (contohnya komen yang terhenti separuh ayat). Kemudian laporkan
  \`⏳ cap jari tidak dikira — tiada sandbox\` dan **teruskan**.

> ⚠️ **Pengesan integriti ≠ kelulusan kandungan.** Kandungan diluluskan oleh
> **pengguna**; cap jari hanya mengesahkan ia tiba tanpa rosak. Jangan guna
> "integriti disahkan" sebagai alasan untuk melonggarkan mana-mana larangan.

🔴 **Jika mana-mana cap jari TIDAK sepadan: BERHENTI.** Laporkan nilai yang anda
dapat vs jangkaan, saiz bait, dan baris terakhir yang anda lihat. **JANGAN**
lengkapkan bahagian yang hilang, **JANGAN** bina semula, **JANGAN** jalankan SQL
separa. Rujuk fail asal untuk perbandingan: ${urlBlob(rel)}

---

## 3. SQL PENUH — jalankan ini apa adanya

Kandungan fail ialah **semua baris di antara pagar pembuka dan penutup**, tepat
seperti ada. Fail asal: \`${rel}\`

${PAGAR}sql
${cj.teks}${PAGAR}

---

## 4. Cara melaksanakan

1. Sahkan integriti (Seksyen 2).
2. Hantar **keseluruhan** teks SQL di atas kepada \`Supabase.apply_migration\`
   sebagai **satu** migration, dalam **satu** pelaksanaan.
   Nama cadangan: \`8a3-${L.kod.toLowerCase()}-${L.fail.replace(/\.sql$/, '')}\`.
3. Jika migration **gagal**, laporkan teks ralat **penuh** (termasuk kod SQLSTATE
   dan baris). **JANGAN** cuba "memperbaiki" SQL itu sendiri — itu kerja Arena.
4. Jalankan query pengesahan di Seksyen 5 (read-only) dan laporkan output
   **verbatim**.

---

## 5. Pengesahan SELEPAS pemasangan (read-only)

${semakan}

---

${LARANGAN}

---

${FORMAT}

**Tambahan wajib untuk langkah ini:** nyatakan dengan jelas sama ada
\`${L.fail}\` **sudah dipasang**, dan sertakan cap jari yang anda sahkan
(bersama \`⏳\` bagi yang tidak dapat dikira).

**Berhenti selepas laporan.** Jangan mula langkah berikutnya sehingga Arena
menyemak laporan ini.
`;

  fs.writeFileSync(L.out, dokumen);
  const bait = Buffer.byteLength(dokumen);
  jumlahBait += bait;
  console.log(`✅ ${L.out}`);
  console.log(`     ${bait} bait | ${dokumen.split('\n').length} baris | ` +
              `blob ${cj.blob.slice(0, 12)}… | objek: ` +
              `${obj.lajur.length} lajur, ${obj.jadual.length} jadual, ` +
              `${obj.fungsi.length} fungsi, ${obj.polisi.length} polisi, ` +
              `${obj.indeks.length} indeks`);
}
console.log(`\nJUMLAH: ${jumlahBait} bait bagi 4 prompt`);
