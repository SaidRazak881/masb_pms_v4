/**
 * test-prompt-8a-j1-queries.mjs
 * =====================================================================
 * Mengesahkan bahawa KELAPAN-LAPAN query J1 dalam
 * `docs/PROMPT-8A-J1-READONLY.md` benar-benar BOLEH DIJALANKAN, dan
 * bahawa ia READ-ONLY.
 *
 * MENGAPA UJIAN INI WUJUD (pelajaran #4 + #6 templat prompt)
 * ---------------------------------------------------------
 * "Setiap dakwaan tentang tingkah laku PostgreSQL dalam prompt mesti diuji
 *  terhadap PGlite dahulu sebelum prompt dihantar."
 *
 * Query J1e menggunakan `query_to_xml()` + `xpath()`. Kedua-duanya ciri
 * PostgreSQL yang mungkin tiada dalam PGlite (WASM). Jika ia gagal di sini,
 * ia mungkin juga gagal di live — dan ChatGPT akan melaporkan blocker palsu.
 * Ujian ini menangkapnya SEBELUM prompt dihantar kepada pengguna.
 *
 * Ujian ini juga mengaudit bahawa prompt J1 tidak mengandungi sebarang
 * kata kerja tulis — janji "read-only sepenuhnya" mesti terbukti, bukan
 * sekadar dakwaan.
 *
 * Jalankan: node scripts/test-prompt-8a-j1-queries.mjs
 */
import fs from 'fs';
import { PGlite } from '@electric-sql/pglite';

let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log(`  ✅ ${m}`); };
const bad = (m) => { fail++; console.log(`  ❌ ${m}`); };
const eq = (a, e, m) =>
  a === e ? ok(`${m} = ${JSON.stringify(a)}`)
          : bad(`${m}: dapat ${JSON.stringify(a)}, jangkaan ${JSON.stringify(e)}`);

const DOC = 'docs/PROMPT-8A-J1-READONLY.md';
const doc = fs.readFileSync(DOC, 'utf8');

console.log('\n[1] AUDIT STATIK — janji "read-only sepenuhnya" mesti terbukti');
const blocks = [...doc.matchAll(/```sql\n([\s\S]*?)```/g)].map((m) => m[1]);
eq(blocks.length, 1, 'bilangan blok ```sql dalam prompt J1');
const sql = blocks[0];

// buang komen sebelum mengimbas, supaya perkataan dalam komen/prosa tidak dikira
const code = sql.split('\n').map((l) => l.replace(/--.*$/, '')).join('\n');
const WRITE = [
  [/\bINSERT\b/i, 'INSERT'], [/\bUPDATE\b/i, 'UPDATE'],
  [/\bDELETE\b/i, 'DELETE'], [/\bTRUNCATE\b/i, 'TRUNCATE'],
  [/\bALTER\b/i, 'ALTER'], [/\bCREATE\b/i, 'CREATE'],
  [/\bDROP\b/i, 'DROP'], [/\bGRANT\b/i, 'GRANT'],
  [/\bREVOKE\b/i, 'REVOKE'], [/\bBEGIN\b/i, 'BEGIN'],
  [/\bROLLBACK\b/i, 'ROLLBACK'], [/\bCOMMIT\b/i, 'COMMIT'],
  [/\bservice_role\b/i, 'service_role'],
];
for (const [re, label] of WRITE) {
  re.test(code) ? bad(`blok SQL J1 mengandungi ${label}`)
                : ok(`blok SQL J1 tiada ${label}`);
}
const selects = (code.match(/\bSELECT\b/gi) || []).length;
if (selects >= 8) ok(`hanya SELECT (${selects} kali) — read-only tulen`);
else bad(`SELECT hanya ${selects} kali — jangkaan >= 8`);

// lapan kriteria J1a..J1h mesti hadir
for (const k of ['J1a', 'J1b', 'J1c', 'J1d', 'J1e', 'J1f', 'J1g', 'J1h']) {
  doc.includes(k) ? ok(`kriteria ${k} hadir dalam prompt`)
                  : bad(`kriteria ${k} HILANG daripada prompt`);
}

// prompt mesti menyatakan ia BUKAN hard gate
doc.includes('INI BUKAN HARD GATE')
  ? ok('prompt menyatakan "INI BUKAN HARD GATE"')
  : bad('prompt tidak menyatakan status gate');
doc.includes('MESTI TIDAK') && doc.includes('client-master.sql')
  ? ok('prompt melarang pemasangan client-master.sql secara eksplisit')
  : bad('prompt tidak melarang pemasangan secara eksplisit');

console.log('\n[2] LARIKAN KELAPAN-LAPAN QUERY J1 DALAM PGlite');
const db = new PGlite();
await db.exec(`
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
  AS $$ SELECT '11111111-1111-4111-8111-111111111111'::uuid $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE
  AS $$ SELECT '{}'::jsonb $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated')
    THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon')
    THEN CREATE ROLE anon NOLOGIN; END IF;
END $$;`);
for (const f of ['lib/supabase/schema-master.sql',
                 'lib/supabase/schema-import-staging.sql']) {
  await db.exec(fs.readFileSync(f, 'utf8'));
}

// pisahkan pada sempadan label '-- J1x:' supaya setiap kenyataan diuji berasingan
const parts = sql.split(/\n(?=-- J1[a-h]:)/).map((p) => p.trim()).filter(Boolean);
eq(parts.length, 8, 'bilangan kenyataan J1 yang dipisah');

const results = {};
for (const p of parts) {
  const label = (p.match(/-- (J1[a-h]):/) || [])[1] || 'TANPA-LABEL';
  const stmt = p.replace(/;+\s*$/, '');
  try {
    const r = await db.query(stmt);
    results[label] = r.rows;
    ok(`${label} berjaya — ${r.rows.length} baris`);
  } catch (e) {
    bad(`${label} GAGAL: ${e.message}`);
    results[label] = null;
  }
}

console.log('\n[3] JANGKAAN J1 PADA PANGKALAN DATA BELUM DIPASANG 8A');
eq(results.J1a?.length, 0, 'J1a: 6 lajur baharu belum wujud (0 baris)');
eq(results.J1b?.[0]?.keadaan, 'BELUM WUJUD', 'J1b: account_manager_aliases');
eq(results.J1c?.length, 2, 'J1c: 2 fungsi dilaporkan');
const belum = results.J1c?.filter((r) => r.keadaan === 'BELUM WUJUD').length;
eq(belum, 2, 'J1c: kedua-dua fungsi BELUM WUJUD');

// J1d — enum app_role. INI PENGESAHAN PENTING untuk client-master.sql:
// 'super_admin' MESTI tiada dalam enum (ia dikendali di dalam has_role()).
const labels = (results.J1d || []).map((r) => r.enumlabel);
eq(labels.length, 7, 'J1d: bilangan nilai enum app_role');
const ENUM_JANGKAAN = ['viewer', 'executive', 'manager', 'admin', 'staff',
                       'finance', 'head_governance'];
eq(JSON.stringify(labels), JSON.stringify(ENUM_JANGKAAN),
   'J1d: nilai enum app_role (ikut susunan)');
labels.includes('super_admin')
  ? bad("J1d: 'super_admin' ADA dalam enum — andaian client-master.sql SALAH")
  : ok("J1d: 'super_admin' TIADA dalam enum — andaian client-master.sql SAH");

// J1e — baseline baris. Guna query_to_xml + xpath: ciri yang perlu disahkan
// wujud dalam PGlite, kerana jika tiada, J1e akan gagal di live juga.
eq(results.J1e?.length, 6, 'J1e: 6 jadual dilaporkan (baseline baris)');
const j1eNull = (results.J1e || []).filter((r) => r.row_count == null).length;
eq(j1eNull, 0, 'J1e: query_to_xml+xpath mengembalikan angka (bukan NULL)');

// J1f — nilai Account Manager mentah; kosong pada DB belum diisi
eq(results.J1f?.length, 0, 'J1f: 0 nilai mentah (DB ujian belum diisi)');

// J1g — inventori jadual public.
// JANGAN keras-kodkan 15/18: bootstrap ujian ini hanya memuatkan 2 fail skema,
// sedangkan live ada 15 rasmi + 3 warisan = 18. Sifat yang diuji ialah query
// J1g MENGIRA DENGAN TEPAT — jadi bandingkan dengan pengiraan bebas.
const bilJadual = Number(results.J1g?.[0]?.bilangan_jadual);
const bebas = (await db.query(`
  SELECT count(*)::int AS n FROM pg_class c
    JOIN pg_namespace nn ON nn.oid = c.relnamespace
   WHERE nn.nspname='public' AND c.relkind='r'
     AND c.relname NOT IN ('schema_migrations','spatial_ref_sys')`)).rows[0].n;
eq(bilJadual, bebas, `J1g: bilangan jadual sepadan pengiraan bebas (${bebas})`);
console.log(`     (nota: di LIVE jangkaan 18 sebelum 8A, 19 selepas — lihat J1g/DP-4)`);

// J1h — lajur mentah account_manager
eq(results.J1h?.length, 2, 'J1h: lajur account_manager pada invoices + import_staging');
const semuaText = (results.J1h || []).every((r) => r.data_type === 'text');
semuaText ? ok('J1h: kedua-duanya bertipe text') : bad('J1h: tipe bukan text');

console.log('\n[4] J1 TIDAK MENGUBAH DATA — jalankan dua kali, bandingkan');
const before = {};
for (const t of ['organizers', 'invoices', 'import_staging', 'user_profiles',
                 'programmes', 'audit_logs']) {
  before[t] = (await db.query(`SELECT count(*)::int n FROM public.${t}`)).rows[0].n;
}
for (const p of parts) {
  await db.query(p.trim().replace(/;+\s*$/, ''));
}
let sama = true;
for (const t of Object.keys(before)) {
  const now = (await db.query(`SELECT count(*)::int n FROM public.${t}`)).rows[0].n;
  if (now !== before[t]) { bad(`${t}: ${before[t]} -> ${now} (J1 MENGUBAH DATA!)`); sama = false; }
}
if (sama) ok('kesemua 6 jadual: bilangan baris tidak berubah selepas 2× J1');

await db.close();

console.log(`\n${'='.repeat(62)}`);
console.log(`KEPUTUSAN: ${pass} lulus, ${fail} gagal`);
console.log(`${'='.repeat(62)}\n`);
process.exit(fail === 0 ? 0 : 1);
