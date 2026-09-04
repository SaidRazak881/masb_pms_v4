/**
 * generate-8a3-l3-reconciliation.mjs — Penjana deterministik untuk
 * `docs/PROMPT-8A3-L3-REKONSILIASI.md`.
 *
 * MENGAPA PROMPT INI WUJUD (DP-17.2)
 * -----------------------------------
 * ChatGPT mendedahkan dengan jujur bahawa pemasangan Langkah 3 dihantar sebagai
 * "implementation SQL yang semantically equivalent tetapi bukan byte-for-byte
 * keseluruhan 539-line file". Ini pengulangan TEPAT DP-13.2 (Langkah 1).
 *
 * Mengikut kata putus DP-13.2: apabila input tidak boleh dipercayai
 * byte-for-byte, sahkan melalui KELAKUAN, bukan teks. Perbandingan teks terhadap
 * `pg_get_functiondef` tidak boleh dipakai kerana komen di dalam blok `$$`
 * menjadikan ia tidak stabil.
 *
 * Apa yang SUDAH disahkan oleh laporan L3 (tidak diulang di sini):
 *   - 7 fungsi wujud dengan nama + senarai argumen yang tepat (L3c verbatim)
 *   - semua 7 `prosecdef = true` dan `search_path = public`
 *   - K6: 12/12 nilai berkelakuan betul pra-seed
 *   - K8 = 0 baris; kiraan perniagaan tidak berubah; audit_logs +0
 *   - L3v: live = PostgreSQL 17.6
 *
 * Apa yang BELUM disahkan dan diuji oleh probe di bawah:
 *   - pendedahan MINIMUM `am_list_staff()` (veto §2.8) — lajur hasilnya
 *   - pengawal kuasa dalam setiap fungsi tulis
 *   - postur GRANT/REVOKE (authenticated vs anon)
 *   - deny-by-default: tiada kebocoran apabila tiada identiti
 *   - cubaan tulis tanpa kuasa mesti RAISE 42501 dan TIDAK menulis apa-apa
 *
 * KEPUTUSAN REKA BENTUK: probe ini READ-ONLY sepenuhnya dan TIDAK memanipulasi
 * `request.jwt.claims`. Sebab: ujian kuasa POSITIF (admin -> true, alias
 * ditulis) sudah dilakukan oleh seed Langkah 4, yang menetapkan claims kepada
 * Super Admin dan menaikkan ralat diagnostik jika `can_resolve_account_managers()`
 * masih false. Mengulanginya di sini akan menambah risiko tulis tanpa menambah
 * maklumat. Maka L3-R menguji sisi NEGATIF (deny-by-default), yang boleh
 * dijalankan tanpa identiti — dan itulah sisi yang paling penting untuk
 * keselamatan.
 *
 * Semua jangkaan dalam dokumen yang dijana DIKIRA dalam PGlite daripada fail SQL
 * yang diluluskan, atas fixture yang setara live (scripts/lib/fixture-live.mjs,
 * dikongsi dengan penjana L1-R supaya kedua-duanya tidak boleh drift).
 *
 * Guna:  node scripts/generate-8a3-l3-reconciliation.mjs
 * Semak: node scripts/generate-8a3-l3-reconciliation.mjs --check
 */

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { binaFixture, pasangLangkah } from './lib/fixture-live.mjs';

const OUT = 'docs/PROMPT-8A3-L3-REKONSILIASI.md';
const FAIL_LANGKAH = [
  'lib/supabase/client-master.sql',
  'lib/supabase/external-account-managers.sql',
  'lib/supabase/account-manager-resolution.sql',
];
const BRANCH = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'],
  { encoding: 'utf8' }).trim();
const REPO = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' })
  .trim().match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)[1];

const SENARAI_7 = `('am_backfill_account_manager','am_backfill_preview','am_confirm_alias',
       'am_list_staff','am_revoke_alias','am_unresolved_values',
       'can_resolve_account_managers')`;


// -----------------------------------------------------------------------------
// Probe. `ketat` = MESTI sepadan; `maklum` = boleh berbeza atas sebab platform.
// -----------------------------------------------------------------------------
const PROBE = [
  {
    id: 'S1',
    tajuk: 'Pendedahan MINIMUM — lajur hasil 7 fungsi (veto §2.8)',
    ketat: true,
    sql: () => `SELECT p.proname AS fungsi,
       pg_get_function_result(p.oid) AS hasil
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ${SENARAI_7}
 ORDER BY p.proname;`,
    nota: [
      '🔴 **Yang paling penting di sini ialah `am_list_staff`.** Veto Keselamatan §2.8',
      'mengkehendaki pemilih staf mendedahkan **HANYA** `id` dan `full_name` —',
      '**bukan** `role`, `account_status`, `email`, `designation` atau `department`,',
      'kerana pautan antara data kewangan dan identiti staf tidak boleh membocorkan',
      'peranan staf kepada pengguna yang hanya boleh melihat invois.',
      '',
      'Jangkaan tepat bagi `am_list_staff`: `TABLE(id uuid, full_name text)`.',
      'Jika live memulangkan lajur tambahan, itu **pelanggaran §2.8** → 🔴 BERHENTI.',
      '',
      'Probe ini membaca **katalog**, jadi ia tidak memerlukan kuasa untuk memanggil',
      'fungsi itu — dan ia tidak bergantung pada komen di dalam badan fungsi,',
      'jadi ia stabil walaupun SQL yang dipasang bukan byte-for-byte (DP-13.2).',
    ].join('\n'),
  },
  {
    id: 'S2',
    tajuk: 'Postur GRANT — `authenticated` boleh, `anon` tidak',
    ketat: true,
    sql: () => `SELECT p.proname AS fungsi,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated,
       has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ${SENARAI_7}
 ORDER BY p.proname;`,
    nota: [
      'Ketujuh-tujuh fungsi mesti `authenticated = true` dan **`anon = false`**.',
      'Ini mengesahkan pasangan `REVOKE ALL ... FROM PUBLIC` + `GRANT EXECUTE ... TO',
      'authenticated` benar-benar terpakai, bukan sekadar hadir dalam teks SQL.',
      '',
      'Jika mana-mana satu memberi `anon = true`, fungsi itu boleh dipanggil oleh',
      'pelawat tanpa log masuk → 🔴 BERHENTI dan laporkan.',
    ].join('\n'),
  },
  {
    id: 'S3',
    tajuk: 'Pengawal kuasa dalam 4 fungsi yang boleh menulis / mendedahkan',
    ketat: false,
    sql: () => `SELECT p.proname AS fungsi,
       (pg_get_functiondef(p.oid) LIKE '%can_resolve_account_managers%') AS ada_pengawal,
       (pg_get_functiondef(p.oid) LIKE '%42501%')                        AS ada_errcode
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('am_confirm_alias','am_revoke_alias',
                     'am_backfill_preview','am_backfill_account_manager')
 ORDER BY p.proname;`,
    nota: [
      '🟠 **MAKLUMAN — sokongan, bukan bukti utama.** DP-13.2 menetapkan bahawa',
      'perbandingan TEKS penuh `pg_get_functiondef` tidak boleh dipakai (komen di',
      'dalam `$$` menjadikannya tidak stabil). Probe ini **tidak** membandingkan',
      'teks penuh — ia hanya menguji **kehadiran** rentetan pengawal, yang stabil.',
      '',
      'Jangkaan: `ada_pengawal = true` bagi **keempat-empat** fungsi.',
      '`ada_errcode = true` bagi `am_confirm_alias`, `am_revoke_alias` dan',
      '`am_backfill_account_manager` — tetapi **`false` bagi `am_backfill_preview`**,',
      'kerana preview yang tanpa kuasa **memulangkan kosong** (`RETURN;`) dan bukan',
      'menaikkan ralat. Itu sengaja: fungsi baca tidak patut mendedahkan sama ada',
      'pemanggilnya berkuasa.',
      '',
      '**Bukti utama ialah S5 dan S6** (kelakuan sebenar), bukan probe ini.',
    ].join('\n'),
  },
  {
    id: 'S4',
    tajuk: 'Deny-by-default — tiga fungsi baca tanpa identiti',
    ketat: true,
    sql: () => `SELECT 'am_list_staff' AS fungsi, count(*) AS baris
  FROM public.am_list_staff()
UNION ALL
SELECT 'am_unresolved_values', count(*) FROM public.am_unresolved_values()
UNION ALL
SELECT 'am_backfill_preview',  count(*) FROM public.am_backfill_preview()
 ORDER BY fungsi;`,
    nota: [
      '🔴 **Ini kawalan keselamatan yang paling penting dalam rekonsiliasi ini.**',
      'Jalankan probe ini **TANPA** menetapkan `request.jwt.claims` — iaitu dalam',
      'konteks `Supabase.execute_sql` biasa, yang memang tiada identiti pengguna.',
      '',
      'Dalam konteks itu `auth.uid()` ialah NULL, jadi `current_user_role()`',
      'memulangkan `viewer` dan `can_resolve_account_managers()` memulangkan',
      '`false`. Ketiga-tiga fungsi mesti memulangkan **0 baris**.',
      '',
      '> 🟢 **Sudah diperhatikan dalam laporan L3.** Probe `L3x` anda memulangkan',
      '> `boleh_selesai = false` bagi **semua** profil — termasuk `Admin`',
      '> (super_admin), `Zalina Sayuti` (admin), `Adilah` dan `Farrah` (finance),',
      '> `Dr. Ahmad Nizar` (head_governance). Anda mentafsirnya dengan **betul**:',
      '> ia bukan bukti bahawa kebenaran rosak, kerana tiada sesi pengguna.',
      '> Sebaliknya ia **bukti bahawa fungsi ini tidak membocorkan kuasa kepada',
      '> konteks tanpa identiti** — iaitu kelakuan yang kita mahukan.',
      '> Arahan asal prompt L3 (jangkaan `= true`) yang **salah**, dan ia telah',
      '> dibaiki; lihat DP-17.3.',
      '',
      'Jika mana-mana fungsi memulangkan **lebih daripada 0 baris** tanpa identiti,',
      'itu kebocoran → 🔴 BERHENTI.',
      '',
      '🟠 **Jika anda mendapat "permission denied for function ..."** — itu',
      'bermakna peranan `execute_sql` anda bukan `postgres`/pemilik dan tidak',
      'mempunyai GRANT. Laporkan mesej itu **verbatim** sebagai `⏳ tidak dapat',
      'dipanggil dalam peranan ini`. **JANGAN** simpulkan bahawa fungsi itu rosak,',
      'dan **JANGAN** cuba `GRANT` apa-apa.',
    ].join('\n'),
  },
  {
    id: 'S5',
    tajuk: 'Cubaan tulis TANPA kuasa mesti ditolak (42501)',
    ketat: true,
    sql: () => `SELECT * FROM public.am_confirm_alias(
         'Probe Rekonsiliasi Tanpa Kuasa',
         '99999999-9999-4999-8999-999999999999'::uuid);`,
    nota: [
      '🔴 **Jangkaan: query ini MESTI GAGAL dengan ralat `42501`.** Kegagalan itu',
      'ialah **kejayaan** probe ini. Mesej yang dijangka:',
      '',
      '```text',
      'tiada kuasa: pengesahan alias memerlukan peranan admin, head_governance atau finance',
      '```',
      '',
      '**Reka bentuk probe ini sengaja selamat walaupun pengawal kuasa itu HILANG.**',
      'UUID `99999999-…` **tidak wujud** dalam `user_profiles`, jadi:',
      '1. Jika pengawal kuasa ada → ia naik **dahulu**, sebelum sebarang tulis.',
      '2. Jika pengawal kuasa hilang → pemeriksaan kewujudan profil naik seterusnya.',
      '3. Jika kedua-duanya hilang → kekangan kekunci asing',
      '   `account_manager_aliases_user_id_fkey` menolak baris itu.',
      '',
      'Jadi **tiada keadaan** di mana probe ini boleh menulis baris. Lapisan ketiga',
      'itu penting kerana inilah satu-satunya probe yang memanggil fungsi tulis.',
      '',
      '🟠 Jalankan probe ini sebagai **panggilan berasingan**, kerana ralat mungkin',
      'membatalkan keseluruhan kelompok jika ia dihantar bersama query lain.',
      'Laporkan mesej ralat **verbatim**.',
    ].join('\n'),
  },
  {
    id: 'S6',
    tajuk: 'Tiada kesan sampingan — kiraan mesti kekal sifar',
    ketat: true,
    sql: () => `SELECT (SELECT count(*) FROM public.account_manager_aliases)   AS alias,
       (SELECT count(*) FROM public.external_account_managers) AS external,
       (SELECT count(*) FROM public.audit_logs)               AS audit;`,
    nota: [
      'Jalankan **SELEPAS** S5. Jangkaan: `alias = 0`, `external = 0` (kerana L4',
      'belum dijalankan), dan `audit = 44` — **tidak berubah** daripada baseline.',
      '',
      'Ini menutup gelung S5: ia membuktikan bahawa cubaan tulis yang ditolak itu',
      '**benar-benar tidak menulis apa-apa**, termasuk baris audit. Jika `audit`',
      'bertambah, fungsi itu menulis sebelum pengawal kuasa naik → 🔴.',
    ].join('\n'),
  },
];

// -----------------------------------------------------------------------------
// Kira jangkaan dalam PGlite
// -----------------------------------------------------------------------------
const { db } = await binaFixture();
await pasangLangkah(db, FAIL_LANGKAH);

const hasil = [];
for (const p of PROBE) {
  const sql = p.sql();
  let rows = null;
  let ralat = null;
  try {
    rows = (await db.query(sql)).rows;
  } catch (e) {
    ralat = String(e.message ?? e).split('\n')[0];
  }
  hasil.push({ ...p, sql, rows, ralat });
}

// Pengawal penjana: S5 MESTI gagal dalam PGlite. Jika ia "berjaya", sama ada
// pengawal kuasa hilang daripada SQL yang diluluskan (kecacatan sebenar) atau
// probe itu salah reka — kedua-duanya mesti menghentikan penjanaan.
const s5 = hasil.find((h) => h.id === 'S5');
if (s5.ralat === null) {
  throw new Error('S5: am_confirm_alias TIDAK menaikkan ralat tanpa kuasa — ' +
                  'pengawal kuasa hilang atau probe salah reka');
}
if (!/42501|tiada kuasa/.test(s5.ralat)) {
  throw new Error(`S5: ralat yang tidak dijangka: ${s5.ralat}`);
}
// Pengawal: S4 mesti 3 baris (satu per fungsi) dan semuanya 0.
const s4 = hasil.find((h) => h.id === 'S4');
if (!s4.rows || s4.rows.length !== 3) {
  throw new Error(`S4: jangkaan 3 baris, dapat ${s4.rows?.length}`);
}
if (s4.rows.some((r) => Number(r.baris) !== 0)) {
  throw new Error('S4: kebocoran — fungsi baca memulangkan baris tanpa identiti');
}
// Pengawal: S1 mesti ada tepat 7 fungsi, dan am_list_staff mesti 2 lajur sahaja.
const s1 = hasil.find((h) => h.id === 'S1');
if (!s1.rows || s1.rows.length !== 7) {
  throw new Error(`S1: jangkaan 7 fungsi, dapat ${s1.rows?.length}`);
}
const listStaff = s1.rows.find((r) => r.fungsi === 'am_list_staff');
if (!listStaff || listStaff.hasil !== 'TABLE(id uuid, full_name text)') {
  throw new Error(`S1: pendedahan minimum am_list_staff berubah: ${listStaff?.hasil}`);
}
// Pengawal: S2 mesti authenticated=true / anon=false bagi semua 7.
const s2 = hasil.find((h) => h.id === 'S2');
if (!s2.rows || s2.rows.length !== 7 ||
    s2.rows.some((r) => r.authenticated !== true || r.anon !== false)) {
  throw new Error('S2: postur GRANT tidak seperti yang diluluskan');
}

await db.close();

// -----------------------------------------------------------------------------
// Dokumen
// -----------------------------------------------------------------------------
const jadual = (rows) => {
  if (!rows || rows.length === 0) return '_(tiada baris)_';
  const k = Object.keys(rows[0]);
  const out = [`| ${k.join(' | ')} |`, `|${k.map(() => '---').join('|')}|`];
  for (const r of rows) out.push(`| ${k.map((x) => (r[x] === null ? 'NULL' : String(r[x]))).join(' | ')} |`);
  return out.join('\n');
};

const bahagianProbe = hasil.map((h) => `### ${h.id} — ${h.tajuk} ${h.ketat ? '🔴 MESTI SEPADAN' : '🟠 MAKLUMAN'}

${h.nota}

\`\`\`sql
${h.sql}
\`\`\`

**Jangkaan (dikira dalam PGlite daripada fail SQL yang diluluskan):**

${h.ralat !== null
    ? `🔴 **Jangkaan: query ini GAGAL.** Mesej ralat yang dikira:\n\n\`\`\`text\n${h.ralat}\n\`\`\``
    : jadual(h.rows)}
`).join('\n---\n\n');

const dokumen = `# PROMPT 8A-3 / L3-R — Rekonsiliasi Langkah 3 (read-only)

> **Untuk:** ChatGPT (mempunyai akses penuh Supabase + Vercel + GitHub)
> **Projek Supabase:** \`lmenmfsbjgxfhnykkgow\`
> **Repo:** \`${REPO}\` · **Branch:** \`${BRANCH}\`
> **Keadaan:** Langkah 1 ✅ dipasang + direkonsiliasi (DP-14) · Langkah 2 ✅ dipasang (DP-15) · **Langkah 3 ✅ dipasang, rekonsiliasi INI** · Langkah 4 ⏳ belum
> **Sifat:** **READ-ONLY sepenuhnya.** Tiada DDL, tiada DML, tiada \`service_role\`, tiada kelulusan pengguna diperlukan.

---

## 0. Mengapa prompt ini wujud

Anda mendedahkan dengan jujur dalam laporan Langkah 3:

> "aku menghantar **implementation SQL yang semantically equivalent tetapi bukan
> byte-for-byte keseluruhan 539-line file**. Jadi aku **tidak akan claim bahawa
> migration ini ialah exact byte-for-byte execution daripada fail asal**."

**Terima kasih — itu pendedahan yang betul, dan kami tidak akan menandakan
"exact file execution" sebagai terbukti.** Ini pengulangan keadaan Langkah 1
(DP-13.2), dan kata putusnya sama: **apabila input tidak boleh dipercayai
byte-for-byte, sahkan melalui KELAKUAN, bukan teks.**

Perbandingan teks terhadap \`pg_get_functiondef\` **tidak boleh dipakai** kerana
komen dokumentasi di dalam blok \`$$\` menjadikan ia tidak stabil — ia akan
menghasilkan positif palsu dan mendorong "pembaikan" kepada production yang
tidak rosak.

### Apa yang SUDAH anda sahkan (JANGAN ulang)

Laporan L3 anda sudah membuktikan, dan kami terima:

| Sudah disahkan | Bukti anda |
|---|---|
| 7 fungsi wujud, nama + argumen tepat | L3c verbatim, 7/7 |
| Semua 7 \`SECURITY DEFINER\` + \`search_path = public\` | L3x definisi |
| K6: 12 nilai berkelakuan betul pra-seed | 12 baris verbatim |
| K8 = 0 baris; \`am_backfill_account_manager()\` tidak dipanggil | \`[]\` |
| Data perniagaan tidak berubah; \`audit_logs\` 44 → 44 | counts verbatim |
| **Live = PostgreSQL 17.6** | L3v verbatim |

### Apa yang BELUM disahkan — dan diuji di sini

Laporan L3 tidak menyentuh **badan** tujuh fungsi itu. Yang belum disahkan:

1. **Pendedahan minimum** \`am_list_staff()\` — veto Keselamatan §2.8
2. **Pengawal kuasa** dalam setiap fungsi yang boleh menulis
3. **Postur GRANT/REVOKE** — \`authenticated\` vs \`anon\`
4. **Deny-by-default** — tiada kebocoran apabila tiada identiti
5. **Cubaan tulis tanpa kuasa** mesti ditolak **dan tidak menulis apa-apa**

> 🔴 **Ini mesti selesai SEBELUM Langkah 4.** L4 (seed) akan memanggil
> \`am_confirm_alias()\` dan \`am_confirm_external()\` untuk **benar-benar menulis**
> alias DP-8 dan klasifikasi luar DP-9, serta baris \`audit_logs\`. Jika badan
> fungsi itu berbeza daripada yang diluluskan, L4 akan menulis data yang salah
> dan jejak audit yang salah. **Mengesahkan badan fungsi sebelum menulis ialah
> urutan yang betul; selepas menulis ialah pembersihan.**

---

## 1. Peraturan

1. **READ-ONLY sepenuhnya.** Semua query di bawah ialah \`SELECT\`, kecuali **S5**
   yang **dijangka GAGAL** dengan ralat \`42501\`. Tiada \`INSERT\`, \`UPDATE\`,
   \`DELETE\`, \`DDL\`, \`GRANT\` atau \`REVOKE\`.
2. **JANGAN** tetapkan \`request.jwt.claims\` dan **JANGAN** cuba mendapatkan
   identiti pengguna. Probe ini **sengaja** menguji sisi *deny-by-default*.
   Ujian kuasa positif (admin → \`true\`, alias ditulis) dilakukan oleh **seed
   Langkah 4**, yang sudah menetapkan claims kepada Super Admin dan menaikkan
   ralat diagnostik jika \`can_resolve_account_managers()\` masih \`false\`.
3. **JANGAN** jalankan Langkah 4 sehingga rekonsiliasi ini disemak.
4. **JANGAN** panggil \`am_backfill_account_manager()\`. Gate itu 8C.
5. **JANGAN** "memperbaiki" apa-apa di live. Jika sesuatu probe tidak sepadan,
   **BERHENTI** dan laporkan. Menentukan sama ada ia kecacatan atau artifak
   ialah kerja Arena — dan dalam dua rekonsiliasi lepas, **kedua-dua** perbezaan
   yang dibendera ternyata artifak pada sisi Arena (DP-14.1 versi PostgreSQL,
   DP-14.2 fixture tidak lengkap), **bukan** kecacatan live.
6. **JANGAN reka bukti.** Jika sesuatu tidak dapat dikira atau dipanggil,
   laporkan \`⏳\` dengan sebabnya. Anda sudah melakukannya dengan betul dalam
   L2 dan L3 — teruskan.

### Tentang cap jari \`⏳\` (DP-11, dijelaskan semula dalam DP-15.3)

Gate integriti ialah **Lapis 1 (Git blob SHA) + Lapis 2 (cap jari struktur)**.
**SHA-256 ialah PILIHAN** kerana runtime anda terbukti tiada byte-stream fail
tempatan. Anda sudah melaporkan blob SHA \`afcdc600efda…\` **sepadan** — itu
memadai. **Tiada** tindakan lanjut diperlukan mengenai \`⏳\` tersebut.

---

## 2. PROBE

${bahagianProbe}
---

## 3. FORMAT LAPORAN

**Seksyen 1 — Status:** project ref, migration L3, dan pengesahan bahawa probe
ini read-only (tiada DDL/DML/\`service_role\`, tiada \`set_config\`).

**Seksyen 2 — Keputusan probe (jadual):**
\`Probe | Ketat? | Jangkaan PGlite | Dapat di live | Status 🟢/🟠/🔴\`.
Tampal output **verbatim** bagi setiap probe. Bagi **S5**, tampal **mesej ralat
penuh** — ralat itu ialah keputusan yang diharapkan, jadi jangan ringkaskannya.

**Seksyen 3 — Perbezaan:** bagi setiap 🟠/🔴, nyatakan (a) nilai jangkaan,
(b) nilai live, (c) sama ada ia kelihatan seperti **kecacatan** atau **artifak
platform/versi**, dan (d) **apa yang anda TIDAK ubah**.

**Seksyen 4 — Soalan keselamatan yang anda bangkitkan, dijawab.** Dalam laporan
L3 anda menulis:

> "\`SECURITY DEFINER\` dalam \`public\` mempunyai implikasi keselamatan yang
> perlu dinilai terhadap model auth sebenar."

Sahkan sama ada S1–S6 menjawab kebimbangan itu, atau nyatakan apa yang masih
terbuka. **Jangan ubah apa-apa** — jawapan Arena direkodkan dalam DP-17.4.

**Seksyen 5 — Keputusan akhir:** nyatakan sama ada badan 7 fungsi Langkah 3
**disahkan setara** dengan SQL yang diluluskan, dan sama ada **Langkah 4 boleh
diteruskan**.

**Berhenti selepas laporan.** Jangan mula Langkah 4.

---

## Nota untuk Arena (bukan untuk ChatGPT)

* Penjana: \`scripts/generate-8a3-l3-reconciliation.mjs\` (deterministik).
* Fixture: \`scripts/lib/fixture-live.mjs\` — **dikongsi** dengan penjana L1-R
  supaya dua fixture tidak boleh drift antara satu sama lain.
* Pengawal penjana: S1 mesti 7 fungsi dengan \`am_list_staff\` =
  \`TABLE(id uuid, full_name text)\`; S2 mesti \`authenticated=true\`/\`anon=false\`;
  S4 mesti 3 baris semuanya 0; **S5 mesti gagal dengan 42501** — jika ia tidak
  gagal, penjanaan berhenti kerana pengawal kuasa telah hilang daripada SQL.
* **Fail SQL TIDAK diubah** oleh penjana ini.
`;

if (process.argv.includes('--check')) {
  const semasa = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
  if (semasa === dokumen) {
    console.log('\n✅ --check: prompt rekonsiliasi L3 sepadan output penjana (tiada drift).');
    process.exit(0);
  }
  console.log('\n❌ --check: ' + OUT + ' DRIFT daripada output penjana.');
  process.exit(1);
}

fs.writeFileSync(OUT, dokumen);
const bait = Buffer.byteLength(dokumen, 'utf8');
console.log(`✅ ${OUT}`);
console.log(`   ${bait} bait | ${dokumen.split('\n').length} baris | ${PROBE.length} probe`);
for (const h of hasil) {
  console.log(`   ${h.id.padEnd(4)} ${h.ketat ? '🔴 ketat ' : '🟠 maklum'} ` +
    (h.ralat !== null ? `ralat dijangka: ${h.ralat.slice(0, 48)}…`
                      : `${String(h.rows.length).padStart(2)} baris`));
}
