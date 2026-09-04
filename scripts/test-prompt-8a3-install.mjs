/**
 * test-prompt-8a3-install.mjs
 * =====================================================================
 * Mengesahkan bahawa SETIAP query J0 dan K1–K12 dalam
 * `docs/PROMPT-8A3-INSTALL.md` benar-benar BOLEH DIJALANKAN, dan bahawa
 * jangkaan yang didokumenkan adalah BETUL.
 *
 * MENGAPA (pelajaran #4 templat prompt)
 * -------------------------------------
 * "Setiap dakwaan tentang tingkah laku PostgreSQL dalam prompt mesti diuji
 *  terhadap PGlite dahulu sebelum prompt dihantar."
 *
 * Prompt 8A-3 mengandungi 5 query J0 dan 14 query K, beberapa daripadanya
 * kompleks (LATERAL join, xpath, regexp bersarang, to_regclass). Jika
 * mana-mana satunya gagal di live, ChatGPT akan melaporkan blocker palsu
 * pada pemasangan yang SUDAH diluluskan pengguna — kos pusingan yang tinggi.
 *
 * Ia juga mengesahkan empat SHA-256 yang dicetak dalam prompt SEPADAN
 * dengan fail sebenar, supaya arahan "jangan jalankan jika SHA tidak
 * sepadan" tidak mencetuskan penolakan palsu.
 *
 * Jalankan: node scripts/test-prompt-8a3-install.mjs
 */
import fs from 'fs';
import crypto from 'crypto';
import { PGlite } from '@electric-sql/pglite';

let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log(`  ✅ ${m}`); };
const bad = (m) => { fail++; console.log(`  ❌ ${m}`); };
const eq = (a, e, m) =>
  a === e ? ok(`${m} = ${JSON.stringify(a)}`)
          : bad(`${m}: dapat ${JSON.stringify(a)}, jangkaan ${JSON.stringify(e)}`);

const DOC = 'docs/PROMPT-8A3-INSTALL.md';
const doc = fs.readFileSync(DOC, 'utf8');

// ---------------------------------------------------------------------
// Pengekstrak query daripada prompt.
//
// Dua perangkap yang mesti dielakkan (kedua-duanya menyebabkan kegagalan
// harness semasa pembangunan ujian ini):
//   1. Query J0 mengandungi BACKTICK dalam kelas aksara regexp
//      ('[''’.`\-]'), jadi sebarang pengeksrak berasaskan [^`] terputus
//      separuh jalan.
//   2. K6 bermula dengan `WITH kes(...) AS (VALUES ...)`, bukan `SELECT`,
//      jadi mengekstrak dari `SELECT 'K6'` menghasilkan
//      "relation kes does not exist".
// Penyelesaian: pecah kepada BLOK ```sql, kemudian pecah kepada KENYATAAN
// pada sempadan ';\n', kemudian cari label sama ada dalam komen pendahulu
// ('-- J0a:') atau dalam literal ('K6').
// ---------------------------------------------------------------------
const SQL_BLOCKS = [...doc.matchAll(/```sql\n([\s\S]*?)```/g)].map((m) => m[1]);
const STATEMENTS = [];
for (const b of SQL_BLOCKS) {
  for (const raw of b.split(/;\s*\n/)) {
    const t = raw.trim();
    if (t) STATEMENTS.push(t.replace(/;+\s*$/, ''));
  }
}
const findStmt = (label) => STATEMENTS.find((st) =>
  new RegExp('(^|\\n)--\\s*' + label + '[:\\s]').test(st) || st.includes("'" + label + "'"));

const FILES = {
  'client-master.sql': 'lib/supabase/client-master.sql',
  'external-account-managers.sql': 'lib/supabase/external-account-managers.sql',
  'account-manager-resolution.sql': 'lib/supabase/account-manager-resolution.sql',
  'seed-account-manager-aliases.sql': 'lib/supabase/seed-account-manager-aliases.sql',
};

const STAFF = [
  ['Zalina Sayuti', 'zalina@mimos.my', 'manager'],
  ['Siti Sarah', 'sitisarah.ramli@mimos.my', 'staff'],
  ["Abu Sa'id", 'abu.razak@mimos.my', 'staff'],
  ['Qusyairi', 'qusyairi.zolkefle@mimos.my', 'staff'],
  ['Fuziah', 'fuziah.rahim@mimos.my', 'staff'],
  ['Adilah', 'adilah.nisman@mimos.my', 'staff'],
  ['Aisyah', 'aisyah.alias@mimos.my', 'staff'],
  ['Dr. Ahmad Nizar', 'nizar.harun@mimos.my', 'executive'],
  ['Farrah', 'farrah.johar@mimos.my', 'staff'],
  ['Sholihin', 'sholihin.abdullah@mimos.my', 'staff'],
  ['Dr. Afiq', 'muhammadafiq.azmi@mimos.my', 'executive'],
  ['Ainur Najwa', 'ainur.rodzi@mimos.my', 'staff'],
  ['Mohd Suhairi', 'suhairi.soobni@mimos.my', 'staff'],
  ['Omar', 'omar.azmi@mimos.my', 'staff'],
  ['Fatin Firzana', 'fatin.pata@mimos.my', 'staff'],
  ['Amalia Adriana', 'amalia.rizam@mimos.my', 'finance'],
  ['Nur Aleeya', 'aleeya.amran@mimos.my', 'staff'],
  ['Muhammad Yusuf', 'yusuf.zolkipli@mimos.my', 'head_governance'],
];
const SUPER_ADMIN = '44444444-4444-4444-8444-444444444444';
const uid = (n) => `22222222-2222-4222-8222-22222222${String(n).padStart(4, '0')}`;

console.log('\n[1] SHA-256 dalam prompt MESTI sepadan fail sebenar');
for (const [nama, path] of Object.entries(FILES)) {
  const sebenar = crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
  doc.includes(sebenar)
    ? ok(`${nama}: SHA penuh ${sebenar.slice(0, 16)}… hadir dalam prompt`)
    : bad(`${nama}: SHA ${sebenar.slice(0, 16)}… TIDAK ditemui dalam prompt`);
}
// ref projek mesti 20 aksara (DP-10.1)
const REF_BETUL = 'lmenmfsbjgxfhnykkgow';   // 20 aksara
const REF_SALAH = 'lmenmfsbjgxcfhnykkgow';   // 21 aksara — typo Arena (DP-10.1)
doc.includes(REF_BETUL) ? ok(`ref betul ${REF_BETUL} (20 aksara) hadir`)
                        : bad('ref betul TIDAK hadir dalam prompt');
eq(REF_BETUL.length, 20, 'ref betul = 20 aksara');
eq(REF_SALAH.length, 21, 'ref salah = 21 aksara');
// Varian 21-aksara HANYA boleh muncul dalam baris yang menandakannya sebagai
// salah/typo — ia tidak boleh muncul sebagai arahan operasi.
const barisSalah = doc.split('\n').filter((l) => l.includes(REF_SALAH));
const tidakDitanda = barisSalah.filter((l) => !/salah|typo|21/i.test(l));
eq(barisSalah.length > 0, true,
   'prompt mendedahkan typo DP-10.1 secara telus (bukan menyembunyikannya)');
eq(tidakDitanda.length, 0,
   'setiap kemunculan ref 21-aksara ditandakan sebagai SALAH/typo/21');

console.log('\n[2] AUDIT STATIK — larangan yang boleh disemak secara tekstual');
doc.includes('JANGAN** jalankan `am_backfill_account_manager()')
  || doc.includes('JANGAN jalankan `am_backfill_account_manager()')
  ? ok('prompt melarang am_backfill (live ada 0 nilai — §2.3)')
  : bad('prompt TIDAK melarang am_backfill');
doc.includes('disyorkan LANGKAU')
  ? ok('prompt menyatakan fix-import-staging-updated-at disyorkan LANGKAU')
  : bad('prompt tidak menyebut pengecualian Langkah 5');
doc.includes('JANGAN** tukar Production Branch Vercel')
  || doc.includes('JANGAN** tukar Production Branch')
  ? ok('prompt melarang tukar Production Branch')
  : bad('prompt tidak melarang tukar Production Branch');

console.log('\n[3] BOOTSTRAP + PASANG SET SKEMA PENUH (peraturan DP-6)');
const db = new PGlite();
try {
  await db.exec('CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;');
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
      END; $$;`);
}
await db.exec(`
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid, aud text, role text, email text UNIQUE,
  encrypted_password text, email_confirmed_at timestamptz,
  raw_app_meta_data jsonb, raw_user_meta_data jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  last_sign_in_at timestamptz);
CREATE TABLE IF NOT EXISTS auth.identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id text, identity_data jsonb, provider text,
  last_sign_in_at timestamptz,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE (provider_id, provider));
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token text, revoked boolean DEFAULT false, created_at timestamptz DEFAULT now());
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT COALESCE((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid, NULL::uuid) $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('request.jwt.claims', true)::jsonb, '{}'::jsonb) $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    CREATE ROLE anon NOLOGIN; END IF;
END $$;
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO authenticated;`);

const URUTAN = [
  'lib/supabase/schema-master.sql',
  'lib/supabase/schema-import-staging.sql',
  'lib/supabase/sync-import-transaction.sql',
  'lib/supabase/governance-lock.sql',
  'lib/supabase/change-requests.sql',
  'lib/supabase/fix-rls-recursion.sql',
  'lib/supabase/fix-add-programme-categories.sql',
  'lib/supabase/user-management.sql',
  'lib/supabase/updated-at-triggers.sql',
  'lib/supabase/fix-import-staging-updated-at.sql',
];
for (const f of URUTAN) {
  try { await db.exec(fs.readFileSync(f, 'utf8')); ok(`${f.split('/').pop()}`); }
  catch (e) { bad(`${f.split('/').pop()} GAGAL: ${e.message}`); }
}

const asUser = async (id) => {
  await db.exec(id
    ? `SELECT set_config('request.jwt.claims','{"sub":"${id}","role":"authenticated"}',false)`
    : `SELECT set_config('request.jwt.claims','',false)`);
};

console.log('\n[4] SEMAI 18 STAF + SUPER ADMIN (seperti keadaan live yang dijangka)');
let n = 0;
const ids = {};
for (const [name, email, role] of STAFF) {
  const id = uid(++n); ids[name] = id;
  await db.query(`INSERT INTO auth.users (id,email) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [id, email]);
  await db.query(`INSERT INTO public.user_profiles (id,full_name,email,role,is_active)
                  VALUES ($1,$2,$3,$4::public.app_role,true)
                  ON CONFLICT (id) DO UPDATE
                    SET full_name=EXCLUDED.full_name, role=EXCLUDED.role, is_active=true`,
                 [id, name, email, role]);
}
await db.query(`INSERT INTO auth.users (id,email) VALUES ($1,'saidrazak881@gmail.com')
                ON CONFLICT DO NOTHING`, [SUPER_ADMIN]);
await db.query(`INSERT INTO public.user_profiles (id,full_name,email,role,is_active)
                VALUES ($1,'Super Admin','saidrazak881@gmail.com','super_admin',true)
                ON CONFLICT (id) DO UPDATE SET full_name=EXCLUDED.full_name,
                  role='super_admin', is_active=true`, [SUPER_ADMIN]);
ids['Super Admin'] = SUPER_ADMIN;
eq((await db.query(`SELECT count(*)::int n FROM public.user_profiles`)).rows[0].n, 19,
   'bilangan profil disemai (18 staf + Super Admin)');

console.log('\n[5] JALANKAN QUERY J0 (read-only, sebelum pemasangan 8A)');
const j0 = {};
for (const q of ['J0a', 'J0b', 'J0c', 'J0d', 'J0e']) {
  // Berhenti pada ';' pertama: beberapa query berkongsi satu blok ```sql
  const st = findStmt(q);
  if (!st) { bad(`${q}: query tidak ditemui dalam prompt`); continue; }
  try {
    const r = await db.query(st);
    j0[q] = r.rows;
    ok(`${q} berjaya — ${r.rows.length} baris`);
  } catch (e) { bad(`${q} GAGAL: ${e.message}`); }
}
eq(j0.J0a?.length, 19, 'J0a: semua profil disenaraikan dengan nama sebenar');
eq(j0.J0a?.[0]?.norm !== undefined, true, 'J0a: kolum `norm` (ternormal) dikira inline');
eq(j0.J0a?.[0]?.token_pertama !== undefined, true, 'J0a: kolum `token_pertama` dikira');
eq(j0.J0b?.length, 0, 'J0b: tiada perlanggaran nama ternormal dalam set 18 staf');
eq(j0.J0c?.length, 0, 'J0c: tiada perlanggaran token pertama dalam set 18 staf');
eq(Number(j0.J0d?.[0]?.bilangan), 1, "J0d: 'Fuziah' wujud dan UNIK — seed Langkah 4 akan berjaya");
eq(j0.J0e?.length, 6, 'J0e: 6 jadual baseline (query_to_xml+xpath berfungsi)');

const kiraBaseline = async () => {
  const o = {};
  for (const t of ['import_staging', 'invoices', 'organizers', 'programmes',
                   'user_profiles', 'audit_logs']) {
    o[t] = (await db.query(`SELECT count(*)::int n FROM public.${t}`)).rows[0].n;
  }
  // Jadual 8A/DP-9 belum wujud sebelum pemasangan -> guna to_regclass supaya
  // kiraBaseline boleh dipanggil pada KEDUA-DUA belah pemasangan.
  for (const t of ['account_manager_aliases', 'external_account_managers']) {
    const wujud = (await db.query(
      `SELECT to_regclass('public.${t}') IS NOT NULL AS w`)).rows[0].w;
    o[t] = wujud
      ? (await db.query(`SELECT count(*)::int n FROM public.${t}`)).rows[0].n
      : -1;   // -1 = jadual belum wujud
  }
  return o;
};
const baselineSebelum = await kiraBaseline();
eq(baselineSebelum.account_manager_aliases, -1, 'sebelum pemasangan: jadual alias belum wujud');
eq(baselineSebelum.external_account_managers, -1, 'sebelum pemasangan: jadual luar belum wujud');

console.log('\n[6] PASANG 4 FAIL 8A mengikut urutan prompt');
for (const [nama, path] of Object.entries(FILES)) {
  try { await db.exec(fs.readFileSync(path, 'utf8')); ok(`${nama} dipasang`); }
  catch (e) { bad(`${nama} GAGAL: ${e.message}`); }
}
await asUser(SUPER_ADMIN);

const baselineSelepas = await kiraBaseline();

console.log('\n[7] JALANKAN QUERY K1–K12 dan sahkan jangkaan yang didokumenkan');
const runK = async (label) => {
  const st = findStmt(label);
  if (!st) { bad(`${label}: query tidak ditemui dalam prompt`); return null; }
  try { return (await db.query(st)).rows; }
  catch (e) { bad(`${label} GAGAL: ${e.message}`); return null; }
};

const K1 = await runK('K1');
eq(K1?.length, 6, 'K1: 6 lajur baharu');
eq(K1?.every((r) => r.is_nullable === 'YES'), true, 'K1: semua NULL-able (tidak memecah INSERT lama)');

const K2a = await runK('K2a');
eq(K2a?.length, 2, 'K2a: 2 jadual baharu');
eq(K2a?.every((r) => r.wujud && r.rls), true, 'K2a: kedua-duanya wujud + RLS aktif');
const K2b = await runK('K2b');
eq(K2b?.length, 8, 'K2b: tepat 8 polisi (4 setiap jadual)');

const K3 = await runK('K3');
eq(K3?.length, 2, 'K3: lajur mentah account_manager masih utuh');
eq(K3?.every((r) => r.data_type === 'text'), true, 'K3: kedua-duanya text');

const K4 = await runK('K4');
eq(K4?.length, 12, 'K4: tepat 12 fungsi');
const norm = K4?.find((r) => r.proname === 'normalize_person_name');
eq(norm?.security_definer, false, 'K4: normalize_person_name BUKAN SECURITY DEFINER');
eq(norm?.volatility, 'i', 'K4: normalize_person_name IMMUTABLE');
const res = K4?.find((r) => r.proname === 'resolve_account_manager');
eq(res?.returns, 'uuid', 'K4: resolve_account_manager mengembalikan uuid sahaja');
eq(res?.volatility, 's', 'K4: resolve_account_manager STABLE');
const ls = K4?.find((r) => r.proname === 'am_list_staff');
eq(ls?.returns, 'TABLE(id uuid, full_name text)',
   'K4: am_list_staff HANYA id + full_name (veto §2.8)');
eq(K4?.every((r) => (r.config || []).some((c) => String(c).startsWith('search_path=public'))), true,
   'K4: semua 12 fungsi mengunci search_path=public');
eq(K4?.every((r) => r.anon_exec === false), true, 'K4: anon tidak boleh melaksanakan mana-mana');
eq(K4?.every((r) => r.auth_exec === true), true, 'K4: authenticated boleh melaksanakan semua');
const selainNorm = K4?.filter((r) => r.proname !== 'normalize_person_name');
eq(selainNorm?.every((r) => r.security_definer === true), true,
   'K4: 11 fungsi lain SECURITY DEFINER');

const K5 = await runK('K5');
eq(K5?.length, 2, 'K5: 2 kekangan FK account_manager_id');
eq(K5?.every((r) => r.rujukan_ke === 'user_profiles'), true, 'K5: kedua-duanya -> user_profiles');
eq(K5?.every((r) => r.on_delete === 'a'), true, 'K5: NO ACTION (bukan CASCADE)');

const K6 = await runK('K6');
eq(K6?.length, 12, 'K6: 12 nilai sebenar dilaporkan');
const jangkaanK6 = {
  'Abu Said': "Abu Sa'id", 'Abu said': "Abu Sa'id", 'Adilah': 'Adilah',
  'Farrah': 'Farrah', 'Fuziah': 'Fuziah', 'Fuzy': 'Fuziah',
  'Fuzy / Dila': 'Fuziah', 'Fuzy / Sholihin ': 'Fuziah',
  'Omar': 'Omar', 'Ow Zi Qi': null, 'Sholihin': 'Sholihin',
  'Zalina': 'Zalina Sayuti',
};
for (const r of K6 || []) {
  const j = jangkaanK6[r.nilai_mentah];
  if (j === undefined) { bad(`K6: nilai tak dijangka '${r.nilai_mentah}'`); continue; }
  const dapat = r.diselesaikan_kepada ?? null;
  dapat === j
    ? ok(`K6: '${r.nilai_mentah}' -> ${j === null ? 'NULL (DP-9 orang luar)' : j}`)
    : bad(`K6: '${r.nilai_mentah}' dapat ${JSON.stringify(dapat)}, jangkaan ${JSON.stringify(j)}`);
}
const selesaiK6 = (K6 || []).filter((r) => r.diselesaikan_kepada != null).length;
eq(selesaiK6, 11, 'K6: 11 daripada 12 selesai (selepas seed DP-8/DP-9)');
const ow = (K6 || []).find((r) => r.nilai_mentah === 'Ow Zi Qi');
eq(ow?.diklasifikasi_luar, true, "K6: 'Ow Zi Qi' NULL tetapi diklasifikasi LUAR (DP-9)");
eq((K6 || []).every((r) => r.keputusan === 'SEPADAN'), true,
   'K6: semua 12 baris SEPADAN jangkaan PGlite');

const K6b = await runK('K6b');
eq(K6b?.length, 3, 'K6b: 3 nilai berbilang-orang tanpa keputusan manusia');
eq(K6b?.every((r) => r.id === null), true,
   'K6b: SEMUA NULL — veto Kewangan §2.4 masih hidup');

const K7a = await runK('K7a');
eq(K7a?.length, 3, 'K7a: 3 alias DP-8');
eq(K7a?.every((r) => r.kepada === 'Fuziah'), true, 'K7a: ketiga-tiganya -> Fuziah');
const K7b = await runK('K7b');
eq(K7b?.length, 1, 'K7b: 1 klasifikasi luar (DP-9)');
eq(K7b?.[0]?.raw_text, 'Ow Zi Qi', "K7b: 'Ow Zi Qi' direkodkan sebagai luar");

const K8 = await runK('K8');
eq(K8?.length, 0,
   'K8: 0 baris — SEPADAN live (J1f = [], tiada nilai Account Manager). Lihat §2.3');

const K9 = await runK('K9');
eq(K9?.[0]?.saya_berkuasa, true, 'K9: Super Admin berkuasa (melalui has_role, DP-6)');
eq(Number(K9?.[0]?.bilangan_staf_dilihat), 19, 'K9: 19 staf aktif dilihat');

const K11 = await runK('K11');
eq(Number(K11?.[0]?.bilangan_jadual), 17,
   'K11: 17 jadual (15 asal + 2 baharu; bootstrap ujian tiada 3 jadual warisan live)');

console.log('\n[8] K12 — IDEMPOTENSI: Langkah 1–3 dijalankan semula');
for (const nama of ['client-master.sql', 'external-account-managers.sql',
                    'account-manager-resolution.sql']) {
  try { await db.exec(fs.readFileSync(FILES[nama], 'utf8')); ok(`${nama} larian kedua OK`); }
  catch (e) { bad(`${nama} larian kedua GAGAL: ${e.message}`); }
}
const K1b = await runK('K1');
eq(K1b?.length, 6, 'K12: K1 masih 6 baris (bukan 12)');
const K4b = await runK('K4');
eq(K4b?.length, 12, 'K12: K4 masih 12 fungsi');

console.log('\n[9] K10 — pemasangan TIDAK mengubah data perniagaan');
// Bandingkan SEBELUM/SELEPAS, bukan terhadap 0: bootstrap menyemai 19 profil,
// jadi jangkaan "0 baris" adalah salah dari segi reka bentuk ujian.
const JADUAL_BISNES = ['import_staging', 'invoices', 'organizers',
                       'programmes', 'user_profiles'];
for (const t of JADUAL_BISNES) {
  eq(baselineSebelum[t], baselineSelepas[t],
     `K10: ${t} tidak berubah (${baselineSelepas[t]} baris)`);
}
eq(baselineSelepas.audit_logs > baselineSebelum.audit_logs, true,
   `K10: audit_logs BERTAMBAH ${baselineSebelum.audit_logs} -> ${baselineSelepas.audit_logs} (seed menulis jejak audit — DIJANGKA)`);
eq(baselineSelepas.account_manager_aliases, 3, 'K10: 3 alias DP-8 wujud');
eq(baselineSelepas.external_account_managers, 1, 'K10: 1 klasifikasi luar DP-9 wujud');

console.log('\n[10] KAWALAN KEBENARAN — viewer melihat tiada apa');
const VIEWER = uid(900);
await db.query(`INSERT INTO auth.users (id,email) VALUES ($1,'viewer@mimos.my')
                ON CONFLICT DO NOTHING`, [VIEWER]);
await db.query(`INSERT INTO public.user_profiles (id,full_name,email,role,is_active)
                VALUES ($1,'Staf Viewer','viewer@mimos.my','viewer',true)
                ON CONFLICT (id) DO UPDATE SET role='viewer'`, [VIEWER]);
await asUser(VIEWER);
const K9v = await runK('K9');
eq(K9v?.[0]?.saya_berkuasa, false, 'K9 (viewer): tidak berkuasa');
eq(Number(K9v?.[0]?.bilangan_staf_dilihat), 0, 'K9 (viewer): 0 staf dilihat');
eq(Number(K9v?.[0]?.bilangan_nilai), 0, 'K9 (viewer): 0 nilai dilihat');

await asUser(null);
await db.close();

// -----------------------------------------------------------------------------
console.log('\n[11] DP-15 — 12 nilai K6 MESTI tersenarai di setiap langkah yang menuntutnya');
{
  // Kecacatan yang diukur dalam laporan L2 ChatGPT: FORMAT LAPORAN (dikongsi
  // semua langkah) mengarah "Untuk K6, tampal kesemua 12 baris - jangan
  // ringkaskan", tetapi 12 nilai itu HANYA ada dalam SEKSYEN_K yang disuntik ke
  // langkah kPenuh (L4). L2/L3 diminta melaporkan baris yang tidak pernah
  // diberikan, jadi ChatGPT membina semula daripada ingatan: `Abu said`
  // (varian huruf kecil - satu-satunya bukti kes-kepekaan) DIGUGURKAN dan
  // `Afiq / Ahmad Nizar` (probe rekonsiliasi L1, BUKAN nilai Excel) DIREKA lalu
  // digabung menjadi satu baris. Seksyen ini mengunci pembetulan itu.
  const NILAI_12 = [
    "'Abu Said'", "'Abu said'", "'Adilah'", "'Farrah'", "'Fuziah'", "'Fuzy'",
    "'Fuzy / Dila'", "'Fuzy / Sholihin '", "'Omar'", "'Ow Zi Qi'",
    "'Sholihin'", "'Zalina'",
  ];
  const LANGKAH = [
    ['L1-CLIENT-MASTER',                 { k6: false, praseed: false, versi: false }],
    ['L2-EXTERNAL-ACCOUNT-MANAGERS',     { k6: true,  praseed: true,  versi: false }],
    ['L3-ACCOUNT-MANAGER-RESOLUTION',    { k6: true,  praseed: true,  versi: true  }],
    ['L4-SEED-ALIASES',                  { k6: true,  praseed: false, versi: true  }],
  ];
  for (const [kod, j] of LANGKAH) {
    const f = `docs/PROMPT-8A3-${kod}.md`;
    if (!fs.existsSync(f)) { bad(`${f} tiada`); continue; }
    const d = fs.readFileSync(f, 'utf8');
    const minta = d.includes('kesemua 12 baris');

    if (j.k6) {
      // (a) Semua 12 nilai mesti hadir VERBATIM - tiada ruang untuk membina semula.
      const hilang = NILAI_12.filter((v) => !d.includes(v));
      eq(hilang.length, 0, `${kod}: 12 nilai K6 hadir verbatim` +
         (hilang.length ? ` (hilang: ${hilang.join(', ')})` : ''));
      // (b) `Abu said` ialah baris yang ChatGPT gugurkan - kunci ia khusus.
      eq(d.includes("'Abu said'"), true,
         `${kod}: varian huruf kecil 'Abu said' hadir (bukti kes-kepekaan)`);
    } else {
      // L1: query K6 memanggil is_external_account_manager() yang HANYA wujud
      // selepas L2. Menyuntiknya ke L1 akan menghasilkan query yang ralat.
      // Penanda QUERY (bukan sekadar nama fungsi - arahan L1 memang menyebut
      // nama fungsi itu untuk menjelaskan MENGAPA K6 dilangkau).
      eq(d.includes('WITH kes(raw_text'), false,
         `${kod}: query K6 TIDAK disuntik (fungsi itu belum wujud pada L1)`);
      eq(d.includes("SELECT 'K6' AS k"), false, `${kod}: tiada blok SELECT K6`);
      // Ayat K6 mesti dikhususkan, bukan dibiarkan menuntut 12 baris yang L1
      // tidak boleh kembalikan (percanggahan FORMAT, kelas DP-15.2).
      eq(d.includes('tidak dijalankan pada Langkah 1'), true,
         `${kod}: FORMAT mengarah '⏳ tidak dijalankan pada Langkah 1'`);
      eq(d.includes('kesemua 12 baris'), false,
         `${kod}: FORMAT TIDAK menuntut 12 baris yang tidak boleh dipenuhi`);
    }

    // (c) Peraturan umum: jika prompt menuntut 12 baris, ia MESTI menyenaraikannya.
    if (minta) {
      eq(d.includes("'Abu said'"), true,
         `${kod}: menuntut "kesemua 12 baris" DAN menyenaraikannya (tiada percanggahan)`);
    }

    if (j.praseed) {
      // (d) Sebelum L4, `Fuzy*` -> NULL dan Ow Zi Qi -> luar=false. Tanpa nota
      //     ini, jangkaan "SELEPAS seed" akan dibaca sebagai jangkaan semasa.
      eq(d.includes('K6 PADA LANGKAH INI'), true, `${kod}: nota pra-seed K6 hadir`);
      eq(d.includes('BUKAN** nilai Account Manager'), true,
         `${kod}: nota menyebut Afiq/Ahmad Nizar bukan nilai Excel`);
      eq(d.includes('diklasifikasi_luar` = **false**'), true,
         `${kod}: nota menyatakan Ow Zi Qi luar=false sebelum seed`);
    }

    // (e2) DP-16.3: probe versi PostgreSQL live. DP-14.1 (R6b) berlaku kerana
    //      Arena buta versi; probe read-only ini menutup punca itu. Hanya untuk
    //      langkah yang BELUM dijalankan - prompt L1/L2 yang sudah dilaksanakan
    //      mesti kekal tidak berubah supaya laporan lepas masih boleh dipadan.
    eq(d.includes('versi platform (read-only'), j.versi,
       `${kod}: probe versi platform ${j.versi ? 'HADIR' : 'tidak hadir (sudah dilaksanakan)'}`);
    if (j.versi) {
      eq(d.includes("current_setting('server_version')"), true,
         `${kod}: probe membaca server_version`);
      eq(d.includes('kekangan_not_null_bernama'), true,
         `${kod}: probe mengira kekangan NOT NULL bernama (punca R6b/DP-14.1)`);
      eq(/### L\dv — versi platform/.test(d), true,
         `${kod}: tajuk probe mengikut kod langkah (bukan 'Lx')`);
    }

    // (e) DP-11: K1 mesti jelas bahawa SHA-256 ialah PILIHAN. Tanpanya GPT
    //     menandakan K1 🟠 selama-lamanya untuk kriteria yang sudah digantikan.
    eq(d.includes('DP-11 — kriteria K1'), true,
       `${kod}: kriteria K1 (DP-11) dijelaskan - SHA-256 pilihan, blob SHA = gate`);
    eq(d.includes('K1 = 🟢 LULUS'), true,
       `${kod}: keadaan LULUS K1 dinyatakan secara eksplisit`);
  }
}

console.log(`\n${'='.repeat(62)}`);
console.log(`KEPUTUSAN: ${pass} lulus, ${fail} gagal`);
console.log(`${'='.repeat(62)}\n`);
process.exit(fail === 0 ? 0 : 1);
