/**
 * test-preflight-b-sql.mjs — Sahkan blok "LANGKAH B: READ-ONLY LIVE PREFLIGHT"
 * yang terbenam dalam docs/PROMPT-6-INSTALL-USER-MANAGEMENT.md.
 *
 * Blok B dihantar kepada ChatGPT untuk dijalankan di Supabase SQL Editor.
 * Supabase menjalankan semua kenyataan sebagai SATU transaksi dan berhenti
 * pada ralat pertama, jadi sebarang rujukan ke objek Fasa 6 yang belum wujud
 * akan memusnahkan keseluruhan output. Skrip ini membuktikan blok B:
 *
 *   1. Benar-benar READ-ONLY (tiada INSERT/UPDATE/DELETE/DDL/service_role).
 *   2. Tidak mencetak nilai kata laluan (hanya panjang + cap jari md5).
 *   3. LULUS pada keadaan "sebelum Fasa 6" (schema Fasa 1–5 + 19 akaun,
 *      tiada kolum/jadual/fungsi/trigger Fasa 6) — iaitu keadaan live sebenar.
 *   4. LULUS pada keadaan "selepas Fasa 6 dipasang".
 *   5. Melaporkan semua semakan B1–B10 dalam kedua-dua keadaan.
 *
 * Guna: node scripts/test-preflight-b-sql.mjs
 */
import fs from 'fs';
import { PGlite } from '@electric-sql/pglite';

const DOC = 'docs/PROMPT-6-INSTALL-USER-MANAGEMENT.md';
const FILE_FASA6 = 'lib/supabase/user-management.sql';
const FILES = [
  'lib/supabase/schema-master.sql',
  'lib/supabase/schema-import-staging.sql',
  'lib/supabase/sync-import-transaction.sql',
  'lib/supabase/governance-lock.sql',
  'lib/supabase/change-requests.sql',
  'lib/supabase/fix-rls-recursion.sql',
  'lib/supabase/fix-add-programme-categories.sql',
];

let failed = 0;
const ok = (m) => console.log(`  ✅ ${m}`);
const bad = (m) => { failed++; console.log(`  ❌ ${m}`); };

/* =========================================================================
   1. EKSTRAK BLOK B DARIPADA DOKUMEN
   ========================================================================= */
console.log('\n--- 1. EKSTRAK BLOK B DARIPADA PROMPT-6 ---');
const doc = fs.readFileSync(DOC, 'utf8');

const startIdx = doc.indexOf('#### LANGKAH B');
const endIdx = doc.indexOf('#### LANGKAH C');
if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
  bad('Langkah B / C tidak dijumpai dalam dokumen');
  process.exit(1);
}
const section = doc.slice(startIdx, endIdx);

const fence = section.match(/```sql\n([\s\S]*?)```/);
if (!fence) {
  bad('tiada blok ```sql``` dalam Langkah B');
  process.exit(1);
}
const B_SQL = fence[1];
ok(`blok B diekstrak (${B_SQL.split('\n').length} baris)`);

/* =========================================================================
   2. AUDIT STATIK — mesti read-only & tiada kata laluan bocor
   ========================================================================= */
console.log('\n--- 2. AUDIT STATIK BLOK B ---');
{
  // Buang komen supaya kata dalam komen tidak dikira sebagai kenyataan tulis.
  const code = B_SQL.split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n');

  const writes = [
    /\bINSERT\s+INTO/i, /\bUPDATE\s+[a-z_."]+\s+SET/i, /\bDELETE\s+FROM/i,
    /\bTRUNCATE\b/i, /\bCREATE\s+(TABLE|OR\s+REPLACE|INDEX|POLICY|EXTENSION)/i,
    /\bALTER\s+(TABLE|TYPE|USER|ROLE|SYSTEM)/i, /\bDROP\s+/i, /\bGRANT\b/i,
    /\bREVOKE\b/i, /\bCOMMENT\s+ON\b/i,
  ];
  const hit = writes.filter((re) => re.test(code)).map((re) => re.source);
  if (hit.length) bad(`blok B mengandungi kenyataan TULIS/DDL: ${hit.join(', ')}`);
  else ok('tiada INSERT/UPDATE/DELETE/DDL/GRANT/REVOKE — read-only tulen');

  if (/service_role/i.test(code)) bad('blok B merujuk service_role');
  else ok('tiada rujukan service_role');

  // Panggilan fungsi: hanya yang membaca status sendiri dibenarkan, dan
  // blok B sepatutnya langsung tidak memanggil RPC (katalog sahaja).
  const rpc = code.match(/public\.(admin_[a-z_0-9]+|mark_password_changed)\s*\(/gi);
  if (rpc) bad(`blok B memanggil RPC pengurusan: ${rpc.join(', ')}`);
  else ok('tiada panggilan RPC admin_* / mark_password_changed (katalog sahaja)');

  // Kata laluan mesti TIDAK dicetak sebagai nilai.
  if (/masb\.12345/i.test(code)) bad('blok B mengandungi kata laluan lalai secara literal');
  else ok('tiada kata laluan literal dalam SQL');

  // app_settings: nilai default_password mesti disembunyikan.
  // B9 mesti menggunakan katalog sahaja: nama jadual app_settings tidak boleh
  // muncul dalam FROM/JOIN (akan ralat 42P01 pada pemasangan bersih).
  // Hiriskan kenyataan B9 sahaja. Penanda dalam kod (bukan komen) ialah
  // 'B9_app_settings' dan 'B10_rumusan'.
  const i9 = code.indexOf("'B9_app_settings'");
  const i10 = code.indexOf("'B10_rumusan'");
  if (i9 === -1 || i10 === -1 || i10 <= i9) bad('gagal mengekstrak kenyataan B9 untuk audit');
  const b9 = (i9 !== -1 && i10 > i9) ? code.slice(i9, i10) : '';
  if (/FROM\s+public\.app_settings/i.test(b9) || /JOIN\s+public\.app_settings/i.test(b9)) {
    bad('B9 menamakan public.app_settings dalam FROM/JOIN → akan runtuh pada DB bersih');
  } else if (/to_regclass\('public\.app_settings'\)/.test(b9)) {
    ok('B9 guna to_regclass() + katalog sahaja — tiada FROM/JOIN ke app_settings');
  } else {
    bad('B9 tidak menggunakan to_regclass() seperti yang dijangka');
  }
  if (/md5\(value\)|length\(value\)/.test(b9)) {
    bad('B9 membaca nilai app_settings — Langkah B tidak boleh cetak kata laluan');
  } else {
    ok('B9 tidak membaca nilai default_password (cap jari md5 disahkan di Langkah C)');
  }

  // Rujukan langsung yang boleh meruntuhkan transaksi pada DB bersih.
  const risky = [
    [/FROM\s+public\.app_settings/i, 'FROM public.app_settings (ralat 42P01 pada DB bersih)'],
    [/up\.account_status/i, 'up.account_status'],
    [/up\.must_change_password/i, 'up.must_change_password'],
    [/SELECT\s+public\.my_account_status\s*\(/i, 'SELECT my_account_status()'],
  ].filter(([re]) => re.test(code)).map(([, label]) => label);
  if (risky.length) bad(`rujukan langsung ke objek Fasa 6 (akan runtuhkan output): ${risky.join(', ')}`);
  else ok('tiada rujukan langsung ke objek Fasa 6 — guna to_jsonb()/to_regclass()/katalog');

  // Semua 10 semakan mesti ada.
  const checks = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'];
  const missing = checks.filter((c) => !code.includes(`'${c}_`));
  if (missing.length) bad(`semakan hilang: ${missing.join(', ')}`);
  else ok(`semua ${checks.length} semakan B1–B10 hadir`);
}

/* =========================================================================
   3. BOOTSTRAP PERSEKITARAN (ala-Supabase)
   ========================================================================= */
const BOOTSTRAP = `
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS private;
CREATE SCHEMA IF NOT EXISTS extensions;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid, aud text, role text, email text UNIQUE,
  encrypted_password text, email_confirmed_at timestamptz,
  raw_app_meta_data jsonb, raw_user_meta_data jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  last_sign_in_at timestamptz
);
CREATE TABLE IF NOT EXISTS auth.identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id text, identity_data jsonb, provider text,
  last_sign_in_at timestamptz,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE (provider_id, provider)
);
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token text, revoked boolean DEFAULT false, created_at timestamptz DEFAULT now()
);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT COALESCE((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid, NULL::uuid)
$$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('request.jwt.claims', true)::jsonb, '{}'::jsonb)
$$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
END $$;
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO authenticated;
`;

const db = new PGlite();
try {
  await db.exec('CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;');
  console.log('\n✅ pgcrypto dipasang');
} catch {
  await db.exec('CREATE SCHEMA IF NOT EXISTS extensions;');
  await db.exec(`
    CREATE OR REPLACE FUNCTION extensions.gen_salt(text) RETURNS text
      LANGUAGE sql IMMUTABLE AS $$ SELECT 'STUBSALT' $$;
    CREATE OR REPLACE FUNCTION extensions.crypt(text, text) RETURNS text
      LANGUAGE plpgsql IMMUTABLE AS $$
      DECLARE v_salt text; v_pos int;
      BEGIN
        IF $2 IS NULL OR $2 = '' THEN RETURN 'STUBSALT|' || md5($1); END IF;
        v_pos := length($2) - position('|' in reverse($2)) + 1;
        IF v_pos <= 0 OR v_pos > length($2) THEN v_salt := $2;
        ELSE v_salt := substring($2 from 1 for v_pos - 1); END IF;
        RETURN v_salt || '|' || md5($1);
      END; $$;
  `);
  console.log('\n⚠️  pgcrypto tiada dalam PGlite — guna stub crypt/gen_salt (ujian sahaja)');
}

try {
  await db.exec(BOOTSTRAP);
  ok('bootstrap auth schema + roles');
} catch (e) {
  bad(`bootstrap gagal: ${e.message}`);
  process.exit(1);
}

async function runFile(f) {
  try {
    await db.exec(fs.readFileSync(f, 'utf8'));
    return true;
  } catch (e) {
    bad(`${f}: ${String(e.message).split('\n')[0]}`);
    try { await db.exec('ROLLBACK'); } catch { /* abaikan */ }
    return false;
  }
}

/* =========================================================================
   4. KEADAAN "SEBELUM FASA 6" = keadaan live sebenar sekarang
   ========================================================================= */
console.log('\n--- 3. PASANG FASA 1–5 (keadaan live sebelum Fasa 6) ---');
for (const f of FILES) {
  if (await runFile(f)) ok(f.split('/').pop());
}

// 19 akaun Fasa 3 ( auth.users + user_profiles ), termasuk Master Admin.
const FASA3_USERS = [
  ['saidrazak881@gmail.com', 'Said Razak', 'admin'],
  ['sitisarah.ramli@mimos.my', 'Siti Sarah Ramli', 'executive'],
  ['nizar.harun@mimos.my', 'Ahmad Nizar Harun', 'head_governance'],
  ['adilah.nisman@mimos.my', 'Adilah Nisman', 'finance'],
];
for (let i = 5; i <= 19; i++) {
  FASA3_USERS.push([`pengguna${i}@mimos.my`, `Pengguna Uji ${i}`,
    ['viewer', 'staff', 'manager', 'executive'][i % 4]]);
}
for (const [email, name, role] of FASA3_USERS) {
  const r = await db.query(
    `INSERT INTO auth.users (instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
     VALUES ('00000000-0000-0000-0000-000000000000','authenticated','authenticated',
        $1, extensions.crypt('masb.12345', extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        $2::jsonb) RETURNING id`,
    [email, JSON.stringify({ full_name: name })]);
  await db.query(
    `INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
     VALUES ($1, $2, $3, $4::public.app_role, true)
     ON CONFLICT (id) DO NOTHING`,
    [r.rows[0].id, email, name, role]);
}
ok(`${FASA3_USERS.length} akaun Fasa 3 dicipta (auth.users + user_profiles)`);

// Sahkan objek Fasa 6 memang BELUM wujud (prasyarat ujian keadaan bersih).
const pre = await db.query(`
  SELECT (SELECT count(*) FROM information_schema.columns
           WHERE table_schema='public' AND table_name='user_profiles'
             AND column_name='account_status')::int AS kolum_status,
         to_regclass('public.app_settings') IS NOT NULL AS ada_app_settings,
         (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public' AND p.proname LIKE 'admin\\_%')::int AS admin_rpc`);
if (pre.rows[0].kolum_status === 0 && !pre.rows[0].ada_app_settings
    && pre.rows[0].admin_rpc === 0) {
  ok('disahkan: account_status / app_settings / admin_* SEMUA belum wujud');
} else {
  bad(`prasyarat keadaan bersih tidak dipenuhi: ${JSON.stringify(pre.rows[0])}`);
}

/* =========================================================================
   5. JALANKAN BLOK B PADA KEADAAN "SEBELUM FASA 6"
   ========================================================================= */
async function runBlockB(label) {
  console.log(`\n--- ${label} ---`);
  // Supabase SQL Editor guna simple query protocol (banyak kenyataan dalam
  // satu penghantaran, berhenti pada ralat pertama). PGlite: db.exec() adalah
  // padanan terdekat — db.query() menolak berbilang kenyataan.
  let results;
  try {
    results = await db.exec(B_SQL);
  } catch (e) {
    bad(`${label}: blok B GAGAL → ${String(e.message).split('\n')[0]}`);
    try { await db.exec('ROLLBACK'); } catch { /* abaikan */ }
    return null;
  }
  ok('keseluruhan blok B (10 kenyataan) diterima tanpa ralat');

  const all = [];
  for (const r of results) {
    const name = (r.rows[0] && r.rows[0].check_name) || '(tanpa nama)';
    all.push({ name, rows: r.rows });
    console.log(`  ✅ ${name} — ${r.rows.length} baris`);
  }
  return all;
}

const before = await runBlockB('4. BLOK B — KEADAAN SEBELUM FASA 6 (live sekarang)');
if (before) {
  const names = before.map((b) => b.name);
  const expect = ['B1_role_breakdown', 'B2_fasa6_columns', 'B3_super_admin_enum',
    'B4_master_admin', 'B5_auth_users', 'B6_auth_users_triggers',
    'B7_function_presence', 'B8_column_privileges', 'B9_app_settings', 'B10_rumusan'];
  const hilang = expect.filter((e) => !names.includes(e));
  if (hilang.length) bad(`semakan tidak mengembalikan output: ${hilang.join(', ')}`);
  else ok('semua B1–B10 mengembalikan output walaupun Fasa 6 belum dipasang');

  const b2 = before.find((b) => b.name === 'B2_fasa6_columns');
  if (b2 && b2.rows.every((r) => /BELUM WUJUD/.test(r.status))) {
    ok('B2: 8 kolum Fasa 6 dilaporkan "BELUM WUJUD" (jangkaan betul)');
  } else bad(`B2 tidak seperti jangkaan: ${JSON.stringify(b2?.rows)}`);

  const b4 = before.find((b) => b.name === 'B4_master_admin');
  if (b4 && b4.rows.length === 1 && b4.rows[0].current_role === 'admin'
      && /belum wujud/.test(b4.rows[0].current_account_status)) {
    ok('B4: Master Admin = role "admin", account_status "(kolum belum wujud)" — tiada ralat');
  } else bad(`B4 tidak seperti jangkaan: ${JSON.stringify(b4?.rows)}`);

  const b7 = before.find((b) => b.name === 'B7_function_presence');
  const b7ada = b7 ? b7.rows.filter((r) => /wujud$/.test(r.status) && !/BELUM/.test(r.status)) : [];
  if (b7 && b7.rows.length === 15 && b7ada.length === 0) {
    ok('B7: 15 fungsi Fasa 6 semuanya "BELUM wujud"');
  } else bad(`B7 tidak seperti jangkaan: ${JSON.stringify(b7?.rows)}`);

  const b9 = before.find((b) => b.name === 'B9_app_settings');
  if (b9 && b9.rows.length === 1 && /BELUM wujud/.test(b9.rows[0].table_status)
      && b9.rows[0].columns === '(n/a)' && b9.rows[0].kolum_key_value_daripada_2 === 0) {
    ok('B9: app_settings dilaporkan belum wujud melalui katalog (sifar ralat parse)');
  } else bad(`B9 tidak seperti jangkaan: ${JSON.stringify(b9?.rows)}`);
}

/* =========================================================================
   6. PASANG FASA 6, KEMUDIAN JALANKAN BLOK B SEKALI LAGI
   ========================================================================= */
console.log('\n--- 5. PASANG FASA 6 (user-management.sql) ---');
if (await runFile(FILE_FASA6)) ok('user-management.sql dipasang');

const after = await runBlockB('6. BLOK B — KEADAAN SELEPAS FASA 6 DIPASANG');
if (after) {
  const b2 = after.find((b) => b.name === 'B2_fasa6_columns');
  if (b2 && b2.rows.every((r) => /^✅ wujud/.test(r.status))) {
    ok('B2: 8 kolum Fasa 6 kini wujud');
  } else bad(`B2 (selepas) tidak seperti jangkaan: ${JSON.stringify(b2?.rows)}`);

  const b3 = after.find((b) => b.name === 'B3_super_admin_enum');
  if (b3 && /super_admin wujud/.test(b3.rows[0].status)) ok('B3: enum super_admin wujud');
  else bad(`B3 (selepas): ${JSON.stringify(b3?.rows)}`);

  const b4 = after.find((b) => b.name === 'B4_master_admin');
  if (b4 && b4.rows[0].current_role === 'super_admin'
      && b4.rows[0].current_account_status === 'active') {
    ok('B4: Master Admin kini super_admin + active (Bahagian 8a berkesan)');
  } else bad(`B4 (selepas): ${JSON.stringify(b4?.rows)}`);

  const b7 = after.find((b) => b.name === 'B7_function_presence');
  const b7ok = b7 ? b7.rows.filter((r) => /^✅ wujud/.test(r.status)) : [];
  if (b7 && b7ok.length === 15 && b7ok.every((r) => r.security_definer === true)) {
    ok('B7: 15 fungsi wujud, SEMUA SECURITY DEFINER');
  } else bad(`B7 (selepas): ${JSON.stringify(b7?.rows)}`);

  const b8 = after.find((b) => b.name === 'B8_column_privileges');
  const grants = b8 ? b8.rows[0].grants : '';
  const sensitif = ['role', 'account_status', 'must_change_password', 'is_active',
    'approved_by', 'approved_at', 'blocked_by', 'blocked_at'];
  const bocor = sensitif.filter((k) => new RegExp(`UPDATE\\(${k}\\)`).test(grants));
  const selamat = ['avatar_url', 'department', 'designation', 'full_name', 'phone', 'updated_at'];
  const ada = selamat.filter((k) => new RegExp(`UPDATE\\(${k}\\)`).test(grants));
  if (!bocor.length && ada.length === 6) {
    ok(`B8: hanya 6 kolum selamat boleh ditulis; tiada kolum sensitif (${grants})`);
  } else {
    bad(`B8 (selepas) tidak seperti jangkaan — bocor=${bocor.join(',')} ada=${ada.join(',')} :: ${grants}`);
  }

  const b9 = after.find((b) => b.name === 'B9_app_settings');
  if (b9 && b9.rows.length === 1 && /jadual wujud/.test(b9.rows[0].table_status)
      && b9.rows[0].kolum_key_value_daripada_2 === 2
      && /key/.test(b9.rows[0].columns) && /value/.test(b9.rows[0].columns)) {
    ok(`B9: app_settings wujud, kolum = ${b9.rows[0].columns} (nilai TIDAK dibaca)`);
  } else bad(`B9 (selepas): ${JSON.stringify(b9?.rows)}`);

  // Pengesahan cap jari md5 kata laluan lalai — dilakukan TERPISAH kerana
  // Langkah B sengaja tidak membaca nilai. Ini bukti bahawa selepas pemasangan
  // nilai yang tersimpan memang kata laluan lalai rasmi.
  const pw = await db.query(
    `SELECT length(value) AS len, md5(value) AS cap FROM public.app_settings
      WHERE key = 'default_password'`);
  const { createHash } = await import('crypto');
  const jangka = createHash('md5').update('masb.12345').digest('hex');
  if (pw.rows[0].len === 10 && pw.rows[0].cap === jangka) {
    ok(`cap jari default_password SEPADAN kata laluan lalai rasmi (panjang=10, md5=${jangka})`);
  } else bad(`cap jari tidak sepadan: ${JSON.stringify(pw.rows[0])} jangka ${jangka}`);

  const b10 = after.find((b) => b.name === 'B10_rumusan');
  if (b10 && b10.rows[0].admin_rpc_wujud === 8 && b10.rows[0].kolum_fasa6_daripada_2 === 2) {
    ok(`B10: rumusan — ${b10.rows[0].profil_users} profil, ${b10.rows[0].auth_users} auth.users, 8 admin_*, 2/2 kolum, app_settings ada`);
  } else bad(`B10 (selepas): ${JSON.stringify(b10?.rows)}`);

  const b6 = after.find((b) => b.name === 'B6_auth_users_triggers');
  if (b6 && /on_auth_user_created/.test(b6.rows[0].triggers)) {
    ok(`B6: trigger hadir → ${b6.rows[0].triggers}`);
  } else bad(`B6 (selepas): ${JSON.stringify(b6?.rows)}`);
}

// BASELINE automatik untuk kriteria V3 dalam PROMPT-6B.
// Arena menetapkan `policy_count = 9` untuk V3. Baseline pemasangan bersih
// MEMANG 9 — jadi angka itu betul, tetapi SKOP query V3 berbeza: ia mengira
// SEMUA polisi dalam skema public yang merujuk has_role(, jadi pada projek
// live yang mempunyai jadual warisan (profiles, programme_participants,
// user_roles) bilangannya 17 = 9 rasmi + 8 warisan. Kriteria penerimaan mesti
// dinyatakan sebagai "9 rasmi hadir + lebihan diaudit", bukan "tepat 9".
// Baseline diterbitkan di sini supaya kriteria tidak lagi diteka oleh manusia.
{
  const pol = await db.query(`
    SELECT count(*)::int AS n,
           string_agg(pol.tablename || '.' || pol.cmd, ', '
                      ORDER BY pol.tablename, pol.cmd) AS senarai
      FROM pg_policies pol
     WHERE pol.schemaname = 'public'
       AND (pol.qual LIKE '%has_role(%' OR pol.with_check LIKE '%has_role(%')`);
  const n = pol.rows[0].n;
  const rasmi = ['cost_items.UPDATE','financial_docs.UPDATE','invoices.UPDATE',
    'participants.UPDATE','programme_costs.UPDATE','programme_documents.UPDATE',
    'programmes.UPDATE','programmes.UPDATE','user_profiles.SELECT'];
  const ada = pol.rows[0].senarai.split(', ');
  const hilang = rasmi.filter((r) => {
    const i = ada.indexOf(r);
    if (i === -1) return true;
    ada.splice(i, 1);
    return false;
  });
  if (hilang.length === 0) {
    if (n === 9) {
      ok('BASELINE V3: pemasangan bersih = TEPAT 9 polisi bergantung has_role(), '
       + 'semuanya dari fix-rls-recursion.sql (polisi has_role schema-master.sql '
       + 'digugurkan & dicipta semula oleh fix)');
    } else {
      ok(`BASELINE V3: pemasangan bersih = ${n} polisi bergantung has_role() `
       + `(${n > 9 ? n - 9 + ' lebihan bukan dari fix-rls-recursion.sql' : 'kurang dari 9 — semak!'})`);
    }
    console.log(`     senarai: ${pol.rows[0].senarai}`);
    console.log('     → kriteria V3 live = baseline + polisi jadual warisan (bukan 9)');
  } else {
    bad(`polisi rasmi hilang: ${hilang.join(', ')}`);
  }
}

/* =========================================================================
   7. KESELAMATAN: blok B mesti tidak mengubah apa-apa
   ========================================================================= */
console.log('\n--- 7. BLOK B TIDAK MENGUBAH DATA ---');
{
  const sebelum = await db.query(`
    SELECT (SELECT count(*) FROM auth.users)::int AS au,
           (SELECT count(*) FROM public.user_profiles)::int AS up,
           (SELECT count(*) FROM public.audit_logs)::int AS al,
           (SELECT md5(string_agg(encrypted_password, ',' ORDER BY id)) FROM auth.users) AS pw_hash`);
  await db.exec(B_SQL);
  await db.exec(B_SQL);
  const selepas = await db.query(`
    SELECT (SELECT count(*) FROM auth.users)::int AS au,
           (SELECT count(*) FROM public.user_profiles)::int AS up,
           (SELECT count(*) FROM public.audit_logs)::int AS al,
           (SELECT md5(string_agg(encrypted_password, ',' ORDER BY id)) FROM auth.users) AS pw_hash`);
  const a = sebelum.rows[0], b = selepas.rows[0];
  if (a.au === b.au && a.up === b.up && a.al === b.al && a.pw_hash === b.pw_hash) {
    ok(`2x jalankan blok B → tiada perubahan (auth.users=${b.au}, profil=${b.up}, audit=${b.al}, hash kata laluan tidak berubah)`);
  } else {
    bad(`blok B MENGUBAH data: sebelum=${JSON.stringify(a)} selepas=${JSON.stringify(b)}`);
  }
}

// ---------------------------------------------------------------------------
// 8. INVENTORI JADUAL RASMI REPO — guard terhadap kesilapan allowlist W1.
//    Arena pernah menerbitkan allowlist 13 jadual daripada
//    `grep "CREATE TABLE"` yang PEKA HURUF BESAR, sedangkan
//    schema-import-staging.sql menulis `create table` dalam huruf kecil.
//    ChatGPT yang mengesan kesilapan itu. Pengiraan kini automatik + case-
//    insensitive, dan allowlist dalam dokumen mesti sepadan.
console.log('\n--- 8. INVENTORI JADUAL RASMI REPO (case-insensitive) ---');
{
  const sqlFiles = fs.readdirSync('lib/supabase')
    .filter((f) => f.endsWith('.sql'))
    .map((f) => `lib/supabase/${f}`);
  const tables = new Set();
  for (const f of sqlFiles) {
    const txt = fs.readFileSync(f, 'utf8');
    for (const m of txt.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z_][a-z_0-9]*)/gi)) {
      tables.add(m[1]);
    }
  }
  const sorted = [...tables].sort();
  console.log(`  ${sorted.length} jadual: ${sorted.join(', ')}`);

  const wajib = ['import_batches', 'import_staging', 'user_profiles',
                 'programmes', 'participants', 'app_settings'];
  const hilang = wajib.filter((t) => !tables.has(t));
  if (hilang.length) bad(`jadual rasmi tidak dikesan (grep case-sensitive?): ${hilang.join(', ')}`);
  else ok('import_batches + import_staging dikesan — pengiraan case-insensitive berfungsi');

  const warisan = ['profiles', 'programme_participants', 'user_roles'];
  const tersilap = warisan.filter((t) => tables.has(t));
  if (tersilap.length) bad(`jadual warisan tersilap dianggap rasmi: ${tersilap.join(', ')}`);
  else ok('3 jadual warisan live (profiles, programme_participants, user_roles) memang BUKAN dari repo');

  // Allowlist dalam PROMPT-6C mesti sepadan dengan inventori automatik.
  const docC = fs.readFileSync('docs/PROMPT-6C-AUDIT-LEGACY-TABLES.md', 'utf8');
  const w1 = docC.slice(docC.indexOf('W1_public_tables'));
  const allowlist = [...w1.matchAll(/'([a-z_][a-z_0-9]*)'/g)].map((m) => m[1]);
  const unik = [...new Set(allowlist.filter((t) => tables.has(t) || warisan.includes(t)))];
  const kurang = sorted.filter((t) => !unik.includes(t));
  if (kurang.length) {
    bad(`allowlist W1 dalam PROMPT-6C tidak lengkap — kurang: ${kurang.join(', ')}`);
  } else {
    ok(`allowlist W1 dalam PROMPT-6C lengkap (${sorted.length} jadual rasmi)`);
  }
}

console.log(failed === 0
  ? '\n🎉 BLOK PREFLIGHT B DISAHKAN: read-only, kalis ralat, tiada kata laluan bocor'
  : `\n🔴 ${failed} KEGAGALAN`);
process.exit(failed === 0 ? 0 : 1);
