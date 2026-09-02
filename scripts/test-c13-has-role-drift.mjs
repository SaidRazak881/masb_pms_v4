/**
 * test-c13-has-role-drift.mjs — Ujian regresi untuk BLOCKER C13.
 *
 * Penemuan live (2026-09-03, projek `lmenmfsbjgxfhnykkgow`):
 * selepas `user-management.sql` dipasang, `public.has_role()` di produksi
 * MASIH versi lama:
 *
 *     LANGUAGE sql  →  SELECT public.current_user_role() = p_role;
 *
 * Punca: versi sedar-super_admin (`IF v_role::text = 'super_admin' THEN
 * RETURN true`) hanya wujud dalam `schema-master.sql` dan
 * `fix-rls-recursion.sql` pada branch Fasa 6. Produksi memasang kedua-dua
 * fail itu SEMASA Fasa 1–5, iaitu sebelum cawangan super_admin ditambah, dan
 * Fasa 6 hanya memasang `user-management.sql`. Jadi produksi mengalami
 * "version drift".
 *
 * Kesan SEBENAR (bukan kosmetik): Bahagian 8a menaikkan taraf Master Admin
 * daripada `admin` → `super_admin`. Dengan `has_role()` lama:
 *     has_role('admin') = (super_admin = admin) = FALSE
 * Jadi 23 polisi RLS yang bergantung pada `has_role()` mula MENOLAK Master
 * Admin — termasuk "Admin boleh lihat semua profil" dan hak kemaskini
 * `programmes` / `participants` yang DIKUNCI. Master Admin layak melihat
 * data terbuka tetapi kehilangan semua kebolehan peringkat admin.
 *
 * Ujian ini:
 *   1. Pasang urutan rasmi penuh + 19 akaun + Fasa 6 (keadaan betul).
 *   2. SAHKAN super_admin mewarisi semua role.
 *   3. TURUN TARAF has_role() kepada versi Fasa 5 (language sql) — melakukan
 *      semula drift live secara tepat.
 *   4. SAHKAN drift itu merosakkan: has_role() gagal DAN Master Admin
 *      kehilangan akses RLS kepada program terkunci + profil pengguna lain.
 *   5. Jalankan fix-rls-recursion.sql (pembaikan C13).
 *   6. SAHKAN pemulihan sepenuhnya, dan bahawa objek Fasa 6 tidak terjejas
 *      (column grant, 8 RPC admin_*, app_settings).
 *
 * HAD UJIAN INI (jujur, penting — disahkan secara empirikal):
 *   Role `postgres` dalam PGlite ialah SUPERUSER dengan `rolbypassrls = true`,
 *   jadi RLS LANGSUNG TIDAK dikuatkuasakan bagi sesi ujian. Oleh itu ujian ini
 *   TIDAK BOLEH membuktikan baris mana yang kelihatan kepada pengguna.
 *   Yang BOLEH dibuktikan di sini:
 *     (a) tingkah laku `has_role()` pada peringkat unit (punca akar C13),
 *     (b) bilangan polisi RLS yang bergantung pada `has_role()` (impak C13),
 *     (c) objek Fasa 6 tidak terjejas oleh pembaikan.
 *   Pengesahan RLS hujung-ke-hujung WAJIB dibuat di SUPABASE LIVE melalui
 *   C13 + C14 — lihat docs/PROMPT-6B-FIX-C13-HAS-ROLE.md.
 *
 *   Nota susunan pemasangan: Fasa 6 mesti dipasang SEBELUM akaun dicipta,
 *   kerana profil `user_profiles` dihasilkan oleh trigger
 *   `on_auth_user_created`. Jika akaun dicipta dahulu, profil tidak wujud
 *   (Bahagian 8 hanya UPDATE profil sedia ada, ia tidak mencipta).
 *
 * Guna: node scripts/test-c13-has-role-drift.mjs
 */
import fs from 'fs';
import { PGlite } from '@electric-sql/pglite';

const FILES = [
  'lib/supabase/schema-master.sql',
  'lib/supabase/schema-import-staging.sql',
  'lib/supabase/sync-import-transaction.sql',
  'lib/supabase/governance-lock.sql',
  'lib/supabase/change-requests.sql',
  'lib/supabase/fix-rls-recursion.sql',
  'lib/supabase/fix-add-programme-categories.sql',
];
const FILE_FASA6 = 'lib/supabase/user-management.sql';
const FILE_FIX = 'lib/supabase/fix-rls-recursion.sql';

/** Versi has_role() dari branch Fasa 5 = keadaan live yang rosak. */
const HAS_ROLE_LAMA = `
CREATE OR REPLACE FUNCTION public.has_role(p_role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.current_user_role() = p_role;
$$;
`;

let failed = 0;
const ok = (m) => console.log(`  ✅ ${m}`);
const bad = (m) => { failed++; console.log(`  ❌ ${m}`); };

/* =========================================================================
   Bootstrap persekitaran ala-Supabase
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
  console.log('✅ pgcrypto dipasang');
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
  console.log('⚠️  pgcrypto tiada dalam PGlite — guna stub (ujian sahaja)');
}

await db.exec(BOOTSTRAP);
ok('bootstrap auth schema + roles');

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

/**
 * Tetapkan identiti pengguna semasa melalui `request.jwt.claims` supaya
 * `auth.uid()` dan rantai `current_user_role()` → `has_role()` berfungsi.
 *
 * `SET ROLE authenticated` SENGAJA TIDAK digunakan: dalam PGlite role
 * `postgres` ialah superuser dengan BYPASSRLS, jadi menukar role hanya
 * menimbulkan tingkah laku yang tidak sepadan dengan Supabase. Ujian ini
 * menguji LOGIK fungsi, bukan penguatkuasaan RLS.
 */
async function asUser(id, fn) {
  await db.exec(
    `SELECT set_config('request.jwt.claims', '{"sub":"${id}","role":"authenticated"}', false)`);
  try {
    return await fn();
  } finally {
    await db.exec(`SELECT set_config('request.jwt.claims', '', false)`);
  }
}

/* =========================================================================
   1. Pasang urutan rasmi + 19 akaun + Fasa 6
   ========================================================================= */
console.log('\n--- 1. PASANG URUTAN RASMI (Fasa 1-5) ---');
for (const f of FILES) {
  if (await runFile(f)) ok(f.split('/').pop());
}

const SUPER_EMAIL = 'saidrazak881@gmail.com';
const ROLES = ['admin', 'executive', 'finance', 'head_governance', 'staff'];
const users = [];

console.log('\n--- 2. PASANG FASA 6 (#1: skema + trigger) ---');
if (await runFile(FILE_FASA6)) ok('user-management.sql dipasang (trigger on_auth_user_created aktif)');

for (let i = 1; i <= 19; i++) {
  const email = i === 1 ? SUPER_EMAIL : `pengguna${i}@mimos.my`;
  const r = await db.query(
    `INSERT INTO auth.users (instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
     VALUES ('00000000-0000-0000-0000-000000000000','authenticated','authenticated',
        $1, extensions.crypt('masb.12345', extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        $2::jsonb) RETURNING id`,
    [email, JSON.stringify({ full_name: `Pengguna ${i}` })]);
  const id = r.rows[0].id;
  // Trigger cipta profil sebagai viewer/pending. Tetapkan role asal Fasa 3
  // supaya Bahagian 8a/8b bertindak seperti di live.
  await db.query(
    `UPDATE public.user_profiles SET role = $2::public.app_role WHERE id = $1`,
    [id, i === 1 ? 'admin' : ROLES[i % ROLES.length]]);
  users.push({ id, email, role: i === 1 ? 'admin' : ROLES[i % ROLES.length] });
}
ok(`19 akaun + profil dicipta SELEPAS trigger aktif (Master Admin role asal 'admin')`);

const chk = await db.query(`SELECT count(*)::int AS n FROM public.user_profiles`);
if (chk.rows[0].n === 19) ok('19 profil user_profiles wujud');
else { bad(`jangka 19 profil, dapat ${chk.rows[0].n} — trigger tidak berfungsi`); }

console.log('\n--- 2b. PASANG FASA 6 (#2: Bahagian 8 data) ---');
if (await runFile(FILE_FASA6)) ok('user-management.sql dijalankan semula (8a naik taraf Master Admin ke super_admin)');

const naik = await db.query(
  `SELECT role::text AS r, account_status::text AS s FROM public.user_profiles
    WHERE lower(email) = lower($1)`, [SUPER_EMAIL]);
if (naik.rows[0]?.r === 'super_admin' && naik.rows[0]?.s === 'active') {
  ok('Bahagian 8a: Master Admin = super_admin + active (keadaan live selepas C)');
} else {
  bad(`8a gagal: ${JSON.stringify(naik.rows[0])}`);
}

const superId = users[0].id;
const otherId = users[1].id;

// Nota: PGlite tidak meniru RLS dengan setia (lihat header), jadi ujian ini
// tidak mencipta data untuk pengesahan baris RLS. Pengesahan RLS hujung-ke-
// hujung dilakukan di Supabase live melalui C13 + C14.

/* =========================================================================
   3. KEADAAN BETUL — has_role() sedar super_admin
   ========================================================================= */
console.log('\n--- 3. KEADAAN BETUL (has_role sedar super_admin) ---');

/** Senarai polisi RLS yang bergantung pada has_role() (bukti impak). */
async function kiraPolisiBergantung() {
  const r = await db.query(`
    SELECT count(*)::int AS n
      FROM pg_policies pol
     WHERE pol.schemaname = 'public'
       AND (pol.qual LIKE '%has_role(%' OR pol.with_check LIKE '%has_role(%')`);
  return r.rows[0].n;
}

/** Baca definisi has_role() dari katalog. */
async function bacaHasRole() {
  const r = await db.query(
    `SELECT p.prosrc, l.lanname
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
       JOIN pg_language l ON l.oid = p.prolang
      WHERE n.nspname = 'public' AND p.proname = 'has_role'`);
  return r.rows[0];
}

/** Tanya has_role() bagi setiap role, sebagai pengguna semasa. */
async function semakPewarisan() {
  const roles = ['super_admin', 'admin', 'head_governance', 'manager',
                 'executive', 'finance', 'staff', 'viewer'];
  const out = {};
  for (const r of roles) {
    const q = await db.query(`SELECT public.has_role($1::public.app_role) AS v`, [r]);
    out[r] = q.rows[0].v;
  }
  return out;
}

{
  const { prosrc, lanname } = await bacaHasRole();
  if (/super_admin/.test(prosrc) && lanname === 'plpgsql') {
    ok(`C13 LULUS: has_role language=${lanname}, prosrc mengandungi 'super_admin'`);
  } else {
    bad(`jangkaan has_role sedar super_admin; dapat language=${lanname}, super_admin_pos=${prosrc.indexOf('super_admin')}`);
  }

  await asUser(superId, async () => {
    const waris = await semakPewarisan();
    const lain = ['admin', 'head_governance', 'manager', 'executive', 'finance', 'staff', 'viewer'];
    const gagal = lain.filter((r) => waris[r] !== true);
    if (gagal.length === 0 && waris.super_admin === true) {
      ok(`super_admin mewarisi SEMUA ${lain.length} role lain`);
    } else {
      bad(`pewarisan gagal untuk: ${gagal.join(', ') || '(tiada)'} :: ${JSON.stringify(waris)}`);
    }
  });

  // Bukan super_admin mesti TIDAK mewarisi (pembaikan tidak boleh over-grant).
  await asUser(otherId, async () => {
    const waris = await semakPewarisan();
    const sendiri = users[1].role;
    const bocor = Object.entries(waris)
      .filter(([r, v]) => v === true && r !== sendiri)
      .map(([r]) => r);
    if (bocor.length === 0) {
      ok(`bukan-super_admin (role=${sendiri}) hanya true untuk role sendiri — tiada over-grant`);
    } else {
      bad(`bukan-super_admin mewarisi role lain: ${bocor.join(', ')}`);
    }
  });

  const n = await kiraPolisiBergantung();
  if (n > 0) ok(`${n} polisi RLS bergantung pada has_role() — inilah impak sebenar C13`);
  else bad('tiada polisi RLS bergantung pada has_role() — jangkaan salah');
}

/* =========================================================================
   4. LAKUKAN SEMULA DRIFT LIVE — turun taraf has_role() ke versi Fasa 5
   ========================================================================= */
console.log('\n--- 4. DRIFT C13 (turun taraf has_role ke versi Fasa 5) ---');
await db.exec(HAS_ROLE_LAMA);
{
  const { prosrc, lanname } = await bacaHasRole();
  if (lanname === 'sql' && !/super_admin/.test(prosrc)
      && /current_user_role\(\)\s*=\s*p_role/.test(prosrc)) {
    ok(`drift dilakukan semula: language=sql, prosrc="${prosrc.trim()}"`);
    ok('→ sepadan TEPAT bukti live ChatGPT (super_admin_pos=0)');
  } else {
    bad(`drift tidak berlaku seperti jangkaan: language=${lanname}, prosrc=${prosrc}`);
  }

  await asUser(superId, async () => {
    const waris = await semakPewarisan();
    const hilang = ['admin', 'head_governance', 'manager', 'executive',
                    'finance', 'staff', 'viewer'].filter((r) => waris[r] !== false);
    if (hilang.length === 0 && waris.super_admin === true) {
      ok('KEMUSNAHAN DISAHKAN: super_admin HANYA true untuk super_admin — kehilangan 7 role');
      ok('→ di live ini bermakna Master Admin gagal SEMUA polisi RLS guna has_role(admin/...)');
    } else {
      bad(`drift tidak merosakkan seperti jangkaan: masih true untuk ${hilang.join(', ')} :: ${JSON.stringify(waris)}`);
    }

    const can = await db.query(`SELECT public.can_manage_users() AS c`);
    if (can.rows[0].c === true) {
      ok('can_manage_users() masih true (tidak guna has_role) → kerosakan ini SENYAP di /admin/users');
    } else {
      bad(`can_manage_users() = ${can.rows[0].c}`);
    }
  });
}

/* =========================================================================
   5. PEMBAIKAN C13 — jalankan fix-rls-recursion.sql
   ========================================================================= */
console.log('\n--- 5. PEMBAIKAN C13 (fix-rls-recursion.sql) ---');
if (await runFile(FILE_FIX)) ok('fix-rls-recursion.sql dijalankan');

{
  const { prosrc, lanname } = await bacaHasRole();
  if (/super_admin/.test(prosrc) && lanname === 'plpgsql') {
    ok('has_role() DIPULIHKAN: language=plpgsql + cawangan super_admin');
  } else {
    bad(`pembaikan gagal: language=${lanname}, prosrc=${prosrc}`);
  }

  await asUser(superId, async () => {
    const waris = await semakPewarisan();
    const gagal = Object.entries(waris).filter(([, v]) => v !== true).map(([r]) => r);
    if (gagal.length === 0) ok('pewarisan penuh DIPULIHKAN untuk semua 8 role');
    else bad(`masih gagal untuk: ${gagal.join(', ')}`);
  });

  await asUser(otherId, async () => {
    const waris = await semakPewarisan();
    const sendiri = users[1].role;
    const bocor = Object.entries(waris)
      .filter(([r, v]) => v === true && r !== sendiri).map(([r]) => r);
    if (bocor.length === 0) ok(`bukan-super_admin kekal terhad (role=${sendiri}) — pembaikan tidak over-grant`);
    else bad(`pembaikan terlalu longgar: ${bocor.join(', ')}`);
  });

  const n = await kiraPolisiBergantung();
  if (n > 0) ok(`${n} polisi RLS bergantung has_role() kini menggunakan versi sedar super_admin`);
  else bad('polisi RLS hilang selepas pembaikan');
}

/* =========================================================================
   6. OBJEK FASA 6 MESTI TIDAK TERJEJAS oleh pembaikan
   ========================================================================= */
console.log('\n--- 6. FASA 6 TIDAK TERJEJAS OLEH fix-rls-recursion.sql ---');
{
  const g = await db.query(`
    SELECT column_name FROM information_schema.column_privileges
     WHERE table_schema='public' AND table_name='user_profiles'
       AND grantee='authenticated' AND privilege_type='UPDATE' ORDER BY 1`);
  const cols = g.rows.map((r) => r.column_name).join(', ');
  const selamat = ['avatar_url', 'department', 'designation', 'full_name', 'phone', 'updated_at'];
  if (cols === selamat.join(', ')) ok(`column grant Fasa 6 kekal tepat 6 kolum: ${cols}`);
  else bad(`column grant berubah: ${cols}`);

  const rpc = await db.query(`
    SELECT count(*)::int AS n, bool_and(p.prosecdef) AS semua_definer
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname LIKE 'admin\\_%'`);
  if (rpc.rows[0].n === 8 && rpc.rows[0].semua_definer) ok('8 RPC admin_* kekal wujud + SECURITY DEFINER');
  else bad(`RPC admin_*: ${JSON.stringify(rpc.rows[0])}`);

  const dual = await db.query(`
    SELECT prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname='admin_reset_all_passwords_to_default'`);
  if (/assert_can_manage_users/.test(dual.rows[0].prosrc)
      && /is_super_admin/.test(dual.rows[0].prosrc)) {
    ok('dwi-pengawal A7 pada reset pukal kekal utuh');
  } else bad('dwi-pengawal A7 hilang selepas fix-rls-recursion.sql');

  const st = await db.query(`SELECT key, length(value) AS len, md5(value) AS cap
                               FROM public.app_settings WHERE key='default_password'`);
  const { createHash } = await import('crypto');
  const jangka = createHash('md5').update('masb.12345').digest('hex');
  if (st.rows[0].len === 10 && st.rows[0].cap === jangka) {
    ok(`app_settings kekal: panjang=10, md5=${jangka}`);
  } else bad(`app_settings berubah: ${JSON.stringify(st.rows[0])}`);

  const trg = await db.query(`
    SELECT string_agg(tgname, ', ' ORDER BY tgname) AS t FROM pg_trigger
     WHERE tgrelid='auth.users'::regclass AND NOT tgisinternal`);
  if (/on_auth_user_created/.test(trg.rows[0].t ?? '') && /on_auth_user_updated/.test(trg.rows[0].t ?? '')) {
    ok(`trigger Fasa 6 kekal: ${trg.rows[0].t}`);
  } else bad(`trigger berubah: ${trg.rows[0].t}`);

  const en = await db.query(`
    SELECT string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS labels
      FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid
      JOIN pg_namespace n ON n.oid=t.typnamespace
     WHERE n.nspname='public' AND t.typname='app_role'`);
  if (/super_admin/.test(en.rows[0].labels)) ok(`enum app_role kekal: ${en.rows[0].labels}`);
  else bad(`enum app_role berubah: ${en.rows[0].labels}`);
}

console.log(failed === 0
  ? '\n🎉 C13 DISAHKAN: drift dilakukan semula, kerosakan dibuktikan, pembaikan pulih sepenuhnya'
  : `\n🔴 ${failed} KEGAGALAN`);
process.exit(failed === 0 ? 0 : 1);
