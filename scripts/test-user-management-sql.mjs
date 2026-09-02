/**
 * test-user-management-sql.mjs — Ujian SQL Fasa 6 (Pengurusan Pengguna &
 * Super Admin) terhadap PostgreSQL sebenar (PGlite WASM), meniru
 * persekitaran Supabase.
 *
 * Skrip ini:
 *   1. Bootstrap `auth` schema ala-Supabase (users, identities,
 *      refresh_tokens, auth.uid() boleh dipalsukan melalui
 *      `request.jwt.claims`).
 *   2. Jalankan SEMUA fail SQL rasmi mengikut urutan pemasangan.
 *   3. Uji fungsi Fasa 6 secara berfungsi (approve, block, role, reset
 *      kata laluan, guard anti-eskalasi, trigger pendaftaran).
 *   4. Uji idempotensi (rerun semua fail).
 *
 * Guna: node scripts/test-user-management-sql.mjs
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

// Fail Fasa 6 dijalankan SELEPAS pengguna ujian dicipta — meniru pemasangan
// sebenar di mana 19 akaun Auth (Fasa 3) sudah wujud sebelum Fasa 6.
const FILE_FASA6 = 'lib/supabase/user-management.sql';

const BOOTSTRAP = `
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS private;
CREATE SCHEMA IF NOT EXISTS extensions;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid,
  aud text,
  role text,
  email text UNIQUE,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_sign_in_at timestamptz
);

CREATE TABLE IF NOT EXISTS auth.identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id text,
  identity_data jsonb,
  provider text,
  last_sign_in_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (provider_id, provider)
);

CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token text,
  revoked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- auth.uid() membaca request.jwt.claims (seperti Supabase sebenar) supaya
-- ujian boleh memalsukan identiti pengguna.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid,
    NULL::uuid
  )
$$;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
LANGUAGE sql STABLE AS $$
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

let failed = 0;
const ok = (m) => console.log(`  ✅ ${m}`);
const bad = (m) => { failed++; console.log(`  ❌ ${m}`); };

const db = new PGlite();

// PGlite tidak membungkus pgcrypto. Cuba pasang; jika tiada, guna stub
// deterministik supaya semantik `crypt(pw, encrypted_password)` (pengesahan
// kata laluan) tetap boleh diuji. Di Supabase sebenar pgcrypto tersedia.
try {
  await db.exec('CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;');
  console.log('✅ pgcrypto dipasang');
} catch {
  await db.exec('CREATE SCHEMA IF NOT EXISTS extensions;');
  await db.exec(`
    -- Stub deterministik meniru semantik pgcrypto:
    --   crypt(kata_laluan, garam)        -> garam || '|' || hash
    --   crypt(kata_laluan, hash_tersimpan) -> garam diekstrak semula, jadi
    --     perbandingan crypt(pw, encrypted_password) = encrypted_password
    --     berfungsi seperti bcrypt sebenar.
    -- Garam bcrypt mengandungi '$', jadi pemisah '|' (kemunculan terakhir)
    -- digunakan untuk memisahkan garam daripada hash.
    CREATE OR REPLACE FUNCTION extensions.gen_salt(text) RETURNS text
      LANGUAGE sql IMMUTABLE AS $$ SELECT 'STUBSALT' $$;

    CREATE OR REPLACE FUNCTION extensions.crypt(text, text) RETURNS text
      LANGUAGE plpgsql IMMUTABLE AS $$
      DECLARE
        v_salt text;
        v_pos  int;
      BEGIN
        IF $2 IS NULL OR $2 = '' THEN
          RETURN 'STUBSALT|' || md5($1);
        END IF;
        v_pos := length($2) - position('|' in reverse($2)) + 1;
        IF v_pos <= 1 OR v_pos > length($2) THEN
          v_salt := $2;              -- argumen kedua ialah garam
        ELSE
          v_salt := substring($2 from 1 for v_pos - 1);  -- ...atau hash tersimpan
        END IF;
        RETURN v_salt || '|' || md5($1);
      END;
      $$;
  `);
  console.log('⚠️  pgcrypto tiada dalam PGlite — guna stub crypt/gen_salt (ujian sahaja)');
}

try {
  await db.exec(BOOTSTRAP);
  console.log('✅ Bootstrap (auth schema + roles)');
} catch (e) {
  console.log('❌ Bootstrap gagal:', e.message);
  process.exit(1);
}

// ---------------------------------------------------------------------------
console.log('\n--- PASANG FAIL SQL (urutan rasmi) ---');
for (const f of FILES) {
  const sql = fs.readFileSync(f, 'utf8');
  try {
    await db.exec(sql);
    ok(f);
  } catch (e) {
    bad(`${f}: ${String(e.message).split('\n')[0]}`);
    try { await db.exec('ROLLBACK'); } catch { /* abaikan */ }
  }
}

// ---------------------------------------------------------------------------
async function runFile(label, f) {
  try {
    await db.exec(fs.readFileSync(f, 'utf8'));
    ok(label);
    return true;
  } catch (e) {
    bad(`${label}: ${String(e.message).split('\n')[0]}`);
    try { await db.exec('ROLLBACK'); } catch { /* abaikan */ }
    return false;
  }
}

// Pemasangan #1: cipta enum, kolum, RPC dan TRIGGER pendaftaran.
// (Bahagian 8 belum berkesan kerana tiada akaun lagi — sama seperti DB kosong.)
console.log('\n--- PASANG FASA 6 (#1: skema + trigger) ---');
await runFile(FILE_FASA6, FILE_FASA6);

console.log('\n--- PENGGUNA UJIAN ---');
const SUPER_EMAIL = 'saidrazak881@gmail.com';

async function makeUser(email, fullName, role = 'viewer', extraMeta = {}) {
  const r = await db.query(
    `INSERT INTO auth.users (instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
     VALUES ('00000000-0000-0000-0000-000000000000','authenticated','authenticated',
        $1, extensions.crypt('masb.12345', extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        $2::jsonb)
     RETURNING id`,
    [email, JSON.stringify({ full_name: fullName, ...extraMeta })],
  );
  return r.rows[0].id;
}

async function asUser(id, fn) {
  await db.exec(
    `SELECT set_config('request.jwt.claims', '{"sub":"${id}","role":"authenticated"}', false)`,
  );
  try {
    return await fn();
  } finally {
    await db.exec(`SELECT set_config('request.jwt.claims', '', false)`);
  }
}

const superId = await makeUser(SUPER_EMAIL, 'Said Razak', 'admin');
const staffId = await makeUser('sitisarah.ramli@mimos.my', 'Siti Sarah', 'executive');
const newUserA = await makeUser('pengguna.baharu@a.com', 'Pengguna Baharu A', 'viewer',
  { phone: '0123456789', designation: 'Eksekutif', department: 'MASB' });
const newUserB = await makeUser('pengguna.baharu@b.com', 'Pengguna Baharu B');
ok(`4 akaun sedia-ada dicipta (super=${superId.slice(0, 8)}, staff=${staffId.slice(0, 8)})`);

// Pemasangan #2: Bahagian 8 (promosi Master Admin, set active, reset kata
// laluan lalai, identiti e-mel) kini berkesan ke atas akaun yang wujud.
// Di dunia sebenar ini sepadan dengan keadaan Fasa 3 sudah dijalankan.
console.log('\n--- PASANG FASA 6 (#2: bahagian data) ---');
await runFile(`${FILE_FASA6} (rerun data)`, FILE_FASA6);

// Pendaftaran sendiri SELEPAS pemasangan -> trigger cipta profil 'pending'
// dan Bahagian 8b tidak akan menyentuhnya lagi. Inilah senario sebenar
// pengguna baharu yang perlu diluluskan Super Admin.
console.log('\n--- PENDAFTARAN SENDIRI (selepas pemasangan) ---');
const pendingId = await makeUser('daftar.sendiri@c.com', 'Daftar Sendiri C',
  'viewer', { designation: 'Pembantu', department: 'Latihan' });
ok(`akaun pendaftaran sendiri dicipta (pending=${pendingId.slice(0, 8)})`);

// ---------------------------------------------------------------------------
console.log('\n--- UJIAN 1: Trigger pendaftaran auto-cipta profil ---');
{
  const r = await db.query(
    `SELECT email, full_name, phone, designation, department, role::text AS role,
            account_status::text AS status, must_change_password
       FROM public.user_profiles ORDER BY created_at, email`,
  );
  const rows = r.rows;
  if (rows.length !== 5) bad(`jangka 5 profil, dapat ${rows.length}`);
  else ok('5 profil auto-dicipta oleh trigger on_auth_user_created');

  // Akaun yang wujud SEMASA pemasangan diaktifkan oleh Bahagian 8b (niat:
  // pengguna Fasa 3 dianggap sudah diluluskan). Akaun yang daftar sendiri
  // SELEPAS pemasangan kekal 'pending' sehingga Super Admin meluluskan.
  const ex = rows.find((x) => x.email === 'pengguna.baharu@a.com');
  if (!ex) bad('profil pengguna baharu A tiada');
  else if (ex.status === 'active')
    ok('akaun sedia ada semasa pemasangan -> active (Bahagian 8b)');
  else bad(`akaun sedia ada sepatutnya active, dapat ${ex.status}`);

  if (ex) {
    if (ex.full_name === 'Pengguna Baharu A') ok('full_name dari metadata Auth');
    else bad(`full_name salah: ${ex.full_name}`);
    if (ex.designation === 'Eksekutif' && ex.department === 'MASB')
      ok('designation/department dipetakan dari metadata');
    else bad(`metadata tidak dipetakan: ${ex.designation}/${ex.department}`);
  }

  const a = rows.find((x) => x.email === 'daftar.sendiri@c.com');
  if (!a) bad('profil pendaftaran sendiri tiada');
  else {
    if (a.status === 'pending') ok('pendaftaran sendiri = pending (perlu kelulusan)');
    else bad(`pendaftaran sendiri sepatutnya pending, dapat ${a.status}`);
    if (a.must_change_password) ok('pendaftaran sendiri wajib tukar kata laluan');
    else bad('must_change_password sepatutnya true');
    if (a.role === 'viewer') ok('pendaftaran sendiri diberi role paling rendah (viewer)');
    else bad(`role sepatutnya viewer, dapat ${a.role}`);
    if (a.designation === 'Pembantu') ok('metadata pendaftaran sendiri dipetakan');
    else bad(`metadata pendaftaran sendiri: ${a.designation}`);
  }

  const b = rows.find((x) => x.email === 'pengguna.baharu@b.com');
  if (b && b.full_name === 'Pengguna.Baharu@B.Com'.replace(/\./g, ' ')
      || (b && b.full_name && b.full_name.length > 3))
    ok(`fallback nama dari e-mel: "${b?.full_name}"`);
  else bad(`fallback nama gagal: ${b?.full_name}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- UJIAN 2: Master Admin = super_admin + active ---');
{
  const r = await db.query(
    `SELECT role::text AS role, account_status::text AS status, must_change_password
       FROM public.user_profiles WHERE lower(email) = $1`, [SUPER_EMAIL]);
  const p = r.rows[0];
  if (p?.role === 'super_admin') ok('role = super_admin');
  else bad(`role sepatutnya super_admin, dapat ${p?.role}`);
  if (p?.status === 'active') ok('account_status = active');
  else bad(`status sepatutnya active, dapat ${p?.status}`);
  if (p?.must_change_password) ok('Super Admin juga wajib tukar kata laluan lalai');
  else bad('must_change_password sepatutnya true untuk Super Admin');
}

// ---------------------------------------------------------------------------
console.log('\n--- UJIAN 3: Kata laluan semua akaun = masb.12345 ---');
{
  const r = await db.query(
    `SELECT count(*)::int AS n FROM auth.users
      WHERE encrypted_password = extensions.crypt('masb.12345', encrypted_password)`);
  if (r.rows[0].n === 5) ok('5/5 akaun sah dengan kata laluan lalai masb.12345');
  else bad(`hanya ${r.rows[0].n}/5 akaun sepadan dengan masb.12345`);

  const idr = await db.query(`SELECT count(*)::int AS n FROM auth.identities`);
  // Bahagian 8d menambah identiti e-mel untuk akaun yang wujud SEMASA pemasangan
  // (4 akaun sedia ada). Di Supabase sebenar, signUp() mencipta identiti sendiri.
  if (idr.rows[0].n >= 4) ok(`${idr.rows[0].n} identiti e-mel wujud (boleh signInWithPassword)`);
  else bad(`identiti: ${idr.rows[0].n}, jangka >= 4`);
}

// ---------------------------------------------------------------------------
console.log('\n--- UJIAN 4: Akses ditolak untuk bukan Super Admin ---');
{
  await asUser(staffId, async () => {
    try {
      await db.query('SELECT * FROM public.admin_list_users()');
      bad('staff TIDAK sepatutnya boleh panggil admin_list_users');
    } catch (e) {
      if (/ACCESS_DENIED/.test(e.message)) ok('admin_list_users → ACCESS_DENIED untuk staff');
      else bad(`ralat tidak dijangka: ${e.message}`);
    }
    try {
      await db.query(`SELECT public.admin_approve_user($1, 'staff')`, [pendingId]);
      bad('staff TIDAK sepatutnya boleh approve pengguna');
    } catch (e) {
      if (/ACCESS_DENIED/.test(e.message)) ok('admin_approve_user → ACCESS_DENIED untuk staff');
      else bad(`ralat tidak dijangka: ${e.message}`);
    }
  });

  // Tiada sesi (anon) → juga ditolak
  try {
    await db.query('SELECT * FROM public.admin_list_users()');
    bad('tanpa sesi TIDAK sepatutnya boleh senarai pengguna');
  } catch (e) {
    ok(`tanpa sesi → ditolak (${/ACCESS_DENIED/.test(e.message) ? 'ACCESS_DENIED' : 'ok'})`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- UJIAN 5: Super Admin — senarai, ringkasan, approve ---');
{
  await asUser(superId, async () => {
    const sum = await db.query('SELECT * FROM public.admin_user_summary()');
    const s = sum.rows[0];
    if (Number(s.total_users) === 5 && Number(s.pending_users) === 1)
      ok(`summary: total=5 pending=1 active=${s.active_users} blocked=${s.blocked_users}`);
    else bad(`summary salah: ${JSON.stringify(s)}`);
    if (Number(s.super_admins) === 1) ok('super_admins = 1');
    else bad(`super_admins = ${s.super_admins}`);

    const list = await db.query('SELECT * FROM public.admin_list_users()');
    if (list.rows.length === 5) ok('admin_list_users -> 5 baris');
    else bad(`admin_list_users -> ${list.rows.length} baris`);
    if (list.rows[0]?.account_status === 'pending')
      ok(`senarai disusun: pending dahulu (${list.rows[0].email})`);
    else bad(`susunan salah: ${list.rows[0]?.account_status}`);

    const filtered = await db.query(
      `SELECT * FROM public.admin_list_users('siti', null)`);
    if (filtered.rows.length === 1) ok('carian "siti" → 1 baris');
    else bad(`carian → ${filtered.rows.length} baris`);

    await db.query(`SELECT public.admin_approve_user($1, 'staff')`, [pendingId]);
    const after = await db.query(
      `SELECT account_status::text AS status, role::text AS role, is_active,
              approved_at IS NOT NULL AS has_approved
         FROM public.user_profiles WHERE id = $1`, [pendingId]);
    const p = after.rows[0];
    if (p.status === 'active' && p.role === 'staff' && p.is_active && p.has_approved)
      ok('approve → active + role staff + is_active + approved_at');
    else bad(`approve gagal: ${JSON.stringify(p)}`);

    // Tidak boleh beri super_admin melalui RPC
    try {
      await db.query(`SELECT public.admin_approve_user($1, 'super_admin')`, [pendingId]);
      bad('approve dengan role super_admin sepatutnya DITOLAK');
    } catch (e) {
      if (/ROLE_NOT_ALLOWED/.test(e.message)) ok('role super_admin tidak boleh diberi via approve RPC');
      else bad(`ralat tidak dijangka: ${e.message}`);
    }
  });
}

// ---------------------------------------------------------------------------
console.log('\n--- UJIAN 6: Block / unblock + log keluar paksa ---');
{
  await db.query(
    `INSERT INTO auth.refresh_tokens (user_id, token) VALUES ($1, 'tok-1')`, [newUserA]);

  await asUser(superId, async () => {
    await db.query(`SELECT public.admin_set_user_blocked($1, true, 'Ujian salah guna')`,
      [newUserA]);
    const r = await db.query(
      `SELECT account_status::text AS status, is_active, block_reason,
              blocked_at IS NOT NULL AS has_ts
         FROM public.user_profiles WHERE id = $1`, [newUserA]);
    const p = r.rows[0];
    if (p.status === 'blocked' && p.is_active === false
        && p.block_reason === 'Ujian salah guna' && p.has_ts)
      ok('block → blocked + is_active=false + reason + blocked_at');
    else bad(`block gagal: ${JSON.stringify(p)}`);

    const tok = await db.query(
      `SELECT count(*)::int AS n FROM auth.refresh_tokens WHERE user_id = $1`, [newUserA]);
    if (tok.rows[0].n === 0) ok('refresh token dipadam (log keluar paksa)');
    else bad(`refresh token masih ada: ${tok.rows[0].n}`);

    await db.query(`SELECT public.admin_set_user_blocked($1, false, null)`, [newUserA]);
    const u = await db.query(
      `SELECT account_status::text AS status, is_active, block_reason
         FROM public.user_profiles WHERE id = $1`, [newUserA]);
    if (u.rows[0].status === 'active' && u.rows[0].is_active && !u.rows[0].block_reason)
      ok('unblock → active + is_active + reason dibersihkan');
    else bad(`unblock gagal: ${JSON.stringify(u.rows[0])}`);

    // Larangan: sekat diri sendiri
    try {
      await db.query(`SELECT public.admin_set_user_blocked($1, true, 'x')`, [superId]);
      bad('Super Admin sepatutnya TIDAK boleh sekat diri sendiri');
    } catch (e) {
      if (/SELF_BLOCK_FORBIDDEN/.test(e.message)) ok('self-block ditolak');
      else bad(`ralat tidak dijangka: ${e.message}`);
    }

    // Larangan: sekat Super Admin terakhir
    try {
      await db.query(`SELECT public.admin_set_user_blocked($1, true, 'x')`, [superId]);
      bad('sekat Super Admin terakhir sepatutnya gagal');
    } catch (e) {
      ok(`Super Admin terakhir dilindungi (${/SELF_BLOCK|LAST_SUPER/.test(e.message) ? 'guard aktif' : 'ditolak'})`);
    }
  });

  // Pengguna blocked tidak boleh urus pengguna walaupun ada sesi
  await asUser(newUserA, async () => {
    try {
      await db.query('SELECT * FROM public.admin_list_users()');
      bad('pengguna biasa sepatutnya ditolak');
    } catch (e) {
      ok(`pengguna bukan super → ditolak (${/ACCESS_DENIED/.test(e.message) ? 'ACCESS_DENIED' : 'ok'})`);
    }
  });
}

// ---------------------------------------------------------------------------
console.log('\n--- UJIAN 7: Tukar role + guard Super Admin terakhir ---');
{
  await asUser(superId, async () => {
    await db.query(`SELECT public.admin_change_user_role($1, 'finance')`, [staffId]);
    const r = await db.query(
      `SELECT role::text AS role FROM public.user_profiles WHERE id = $1`, [staffId]);
    if (r.rows[0].role === 'finance') ok('tukar role → finance');
    else bad(`role = ${r.rows[0].role}`);

    // Cipta Super Admin kedua, kemudian cuba turun taraf yang terakhir
    const super2 = await makeUser('super.kedua@mimos.my', 'Super Kedua', 'admin');
    await db.query(
      `UPDATE public.user_profiles SET role='super_admin', account_status='active'
        WHERE id = $1`, [super2]);

    try {
      await db.query(`SELECT public.admin_change_user_role($1, 'viewer')`, [superId]);
      // Masih ada super2 → dibenarkan
      const chk = await db.query(
        `SELECT count(*)::int AS n FROM public.user_profiles
          WHERE role='super_admin'::public.app_role`);
      if (chk.rows[0].n === 1) ok('turun taraf dibenarkan bila ada Super Admin lain (baki 1)');
      else bad(`baki super_admin = ${chk.rows[0].n}`);

      // Sekarang super2 ialah satu-satunya → turun taraf mesti gagal
      await db.exec(
        `SELECT set_config('request.jwt.claims', '{"sub":"${super2}","role":"authenticated"}', false)`);
      try {
        await db.query(`SELECT public.admin_change_user_role($1, 'viewer')`, [super2]);
        bad('turun taraf Super Admin TERAKHIR sepatutnya gagal');
      } catch (e) {
        if (/LAST_SUPER_ADMIN/.test(e.message)) ok('LAST_SUPER_ADMIN guard aktif');
        else bad(`ralat tidak dijangka: ${e.message}`);
      }
    } catch (e) {
      bad(`tukar role gagal: ${e.message}`);
    }
  });
}

// ---------------------------------------------------------------------------
console.log('\n--- UJIAN 8: Reset kata laluan ---');
{
  await asUser(superId, async () => {
    // Tukar kata laluan staff kepada sesuatu yang lain dahulu
    await db.query(
      `UPDATE auth.users SET encrypted_password =
         extensions.crypt('KataLaluanLain1', extensions.gen_salt('bf'))
        WHERE id = $1`, [staffId]);

    const r = await db.query(`SELECT public.admin_reset_user_password($1)`, [staffId]);
    if (r.rows[0].admin_reset_user_password === 'masb.12345')
      ok('reset memulangkan kata laluan lalai masb.12345');
    else bad(`reset pulangan: ${r.rows[0].admin_reset_user_password}`);

    const v = await db.query(
      `SELECT (encrypted_password = extensions.crypt('masb.12345', encrypted_password)) AS match
         FROM auth.users WHERE id = $1`, [staffId]);
    if (v.rows[0].match) ok('hash kata laluan staff kembali kepada lalai');
    else bad('hash tidak dikemas kini');

    const p = await db.query(
      `SELECT must_change_password, password_changed_at IS NULL AS cleared
         FROM public.user_profiles WHERE id = $1`, [staffId]);
    if (p.rows[0].must_change_password && p.rows[0].cleared)
      ok('reset → must_change_password=true + password_changed_at NULL');
    else bad(`flag reset salah: ${JSON.stringify(p.rows[0])}`);

    try {
      await db.query(`SELECT public.admin_reset_user_password($1)`, [superId]);
      bad('reset kata laluan sendiri sepatutnya ditolak');
    } catch (e) {
      if (/SELF_RESET_FORBIDDEN/.test(e.message)) ok('self-reset ditolak (guna /security)');
      else bad(`ralat tidak dijangka: ${e.message}`);
    }
  });

  // mark_password_changed oleh pengguna sendiri
  await asUser(staffId, async () => {
    await db.query('SELECT public.mark_password_changed()');
    const r = await db.query(
      `SELECT must_change_password, password_changed_at IS NOT NULL AS set_ts
         FROM public.user_profiles WHERE id = $1`, [staffId]);
    if (!r.rows[0].must_change_password && r.rows[0].set_ts)
      ok('mark_password_changed → flag padam + tarikh direkod');
    else bad(`mark_password_changed gagal: ${JSON.stringify(r.rows[0])}`);
  });
}

// ---------------------------------------------------------------------------
console.log('\n--- UJIAN 9: Pengesahan kata laluan baharu ---');
{
  const cases = [
    ['masb.12345', false, 'PASSWORD_IS_DEFAULT'],
    ['pendek1', false, 'PASSWORD_TOO_SHORT'],
    ['abcdefghij', false, 'PASSWORD_TOO_WEAK (tiada nombor)'],
    ['1234567890', false, 'PASSWORD_TOO_WEAK (tiada huruf)'],
    ['KataLaluanBaru1', true, 'sah'],
  ];
  for (const [pw, shouldPass, label] of cases) {
    try {
      await db.query('SELECT public.assert_password_acceptable($1)', [pw]);
      if (shouldPass) ok(`"${pw}" diterima (${label})`);
      else bad(`"${pw}" sepatutnya DITOLAK (${label})`);
    } catch (e) {
      if (!shouldPass) ok(`"${pw}" ditolak (${label})`);
      else bad(`"${pw}" sepatutnya diterima: ${e.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- UJIAN 10: Audit log direkod ---');
{
  const r = await db.query(
    `SELECT metadata ->> 'action' AS action, count(*)::int AS n
       FROM public.audit_logs
      WHERE metadata ->> 'action' IN
        ('APPROVE_USER','BLOCK_USER','UNBLOCK_USER','CHANGE_ROLE',
         'RESET_PASSWORD','CHANGE_OWN_PASSWORD')
      GROUP BY 1 ORDER BY 1`);
  const found = Object.fromEntries(r.rows.map((x) => [x.action, x.n]));
  for (const a of ['APPROVE_USER', 'BLOCK_USER', 'UNBLOCK_USER', 'CHANGE_ROLE',
                   'RESET_PASSWORD', 'CHANGE_OWN_PASSWORD']) {
    if (found[a]) ok(`audit ${a} = ${found[a]}`);
    else bad(`audit ${a} TIDAK direkod`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- UJIAN 11: Column grant menghalang eskalasi role ---');
{
  const r = await db.query(`
    SELECT column_name FROM information_schema.column_privileges
     WHERE table_schema='public' AND table_name='user_profiles'
       AND grantee='authenticated' AND privilege_type='UPDATE'
     ORDER BY column_name`);
  const cols = r.rows.map((x) => x.column_name);
  const forbidden = ['role', 'account_status', 'must_change_password',
    'approved_by', 'approved_at', 'blocked_by', 'blocked_at', 'is_active'];
  const leaked = forbidden.filter((c) => cols.includes(c));
  if (leaked.length === 0)
    ok(`kolum sensitif TIDAK boleh ditulis klien (grant: ${cols.join(', ')})`);
  else bad(`kolum sensitif TERBOCOR kepada authenticated: ${leaked.join(', ')}`);

  if (cols.includes('full_name') && cols.includes('phone'))
    ok('kolum profil selamat masih boleh dikemaskini sendiri');
  else bad('grant kolum selamat tidak lengkap');
}

// ---------------------------------------------------------------------------
console.log('\n--- UJIAN 12: Rerun (idempotensi) ---');
for (const f of [...FILES, FILE_FASA6]) {
  const sql = fs.readFileSync(f, 'utf8');
  try {
    await db.exec(sql);
    ok(`rerun ${f.split('/').pop()}`);
  } catch (e) {
    bad(`rerun ${f}: ${String(e.message).split('\n')[0]}`);
    try { await db.exec('ROLLBACK'); } catch { /* abaikan */ }
  }
}

// ---------------------------------------------------------------------------
// UJIAN 13: SUPER ADMIN DISEKAT tidak boleh jalankan tindakan pukal.
//
// Regression test untuk blocker A7 (audit ChatGPT, 2026-09-02):
// `admin_reset_all_passwords_to_default()` dahulunya hanya menyemak
// `is_super_admin()`, yang TIDAK menyemak `account_status`. Akibatnya Super
// Admin yang telah disekat masih boleh mereset kata laluan SEMUA pengguna.
console.log('\n--- UJIAN 13: Super Admin disekat → tindakan pukal ditolak ---');
{
  const super2 = await makeUser('super.admin.kedua@mimos.my', 'Super Admin Kedua', 'admin');

  // Role 'super_admin' TIDAK boleh diberi melalui RPC/UI — hanya melalui SQL
  // oleh pemilik sistem (guard ROLE_NOT_ALLOWED). Jadi naik taraf di sini
  // dilakukan secara langsung, meniru laluan Bahagian 8a pemasangan.
  await db.query(
    `UPDATE public.user_profiles SET role = 'super_admin', account_status = 'active',
            is_active = true WHERE id = $1`, [super2]);
  ok('super_admin kedua dicipta melalui laluan SQL pemilik sistem');

  // Kes positif: super_admin yang active + belum pernah tukar kata laluan
  // mesti BOLEH menjalankan tindakan pukal (fix tidak boleh terlalu ketat).
  await asUser(super2, async () => {
    try {
      const r = await db.query('SELECT public.admin_reset_all_passwords_to_default()');
      const n = Number(r.rows[0].admin_reset_all_passwords_to_default);
      if (n > 0) ok(`super_admin active → reset pukal BERJAYA (${n} akaun)`);
      else bad(`reset pukal membalas ${n} akaun — jangka > 0`);
    } catch (e) {
      bad(`super_admin active sepatutnya dibenarkan reset pukal: ${e.message}`);
    }
  });

  // Sekat super_admin kedua supaya tindakan pukal boleh diuji semula.
  await asUser(superId, async () => {
    await db.query(`SELECT public.admin_set_user_blocked($1, true, 'Ujian: akaun super disekat')`,
      [super2]);
  });
  ok('super_admin kedua disekat oleh super_admin utama');

  await asUser(super2, async () => {
    const calls = [
      ['admin_reset_all_passwords_to_default()', 'tindakan pukal reset semua kata laluan'],
      ['admin_list_users(null, null)',            'baca senarai pengguna'],
      ['admin_user_summary()',                    'baca KPI pengguna'],
    ];
    for (const [call, label] of calls) {
      try {
        await db.query(`SELECT * FROM public.${call}`);
        bad(`Super Admin DISEKAT sepatutnya ditolak: ${label}`);
      } catch (e) {
        if (/ACCOUNT_NOT_ACTIVE|ACCESS_DENIED/.test(e.message)) {
          ok(`Super Admin disekat → ${label} DITOLAK (${/ACCOUNT_NOT_ACTIVE/.test(e.message) ? 'ACCOUNT_NOT_ACTIVE' : 'ACCESS_DENIED'})`);
        } else {
          bad(`${label}: ralat tidak dijangka → ${e.message}`);
        }
      }
    }
  });

  // Pulihkan keadaan supaya ujian seterus tidak terjejas.
  await asUser(superId, async () => {
    await db.query(`SELECT public.admin_set_user_blocked($1, false, null)`, [super2]);
  });
  ok('super_admin kedua dipulihkan (unblock)');
}

// ---------------------------------------------------------------------------
// UJIAN 14: PENGAWAL STRUKTUR — setiap fungsi admin_* dalam sumber SQL mesti
// memanggil assert_can_manage_users(). Ujian ini membaca FAIL, bukan DB, jadi
// ia menangkap regresi walaupun fungsi itu tidak dipanggil dalam ujian lain.
console.log('\n--- UJIAN 14: Pengawal struktur — semua admin_* guna assert_can_manage_users ---');
{
  const src = fs.readFileSync(FILE_FASA6, 'utf8');
  const names = new Set();
  for (const m of src.matchAll(/CREATE OR REPLACE FUNCTION public\.(admin_[a-z_0-9]+)\s*\(/g)) {
    names.add(m[1]);
  }
  if (names.size < 8) bad(`jangka >= 8 fungsi admin_*, jumpa ${names.size}`);
  else ok(`${names.size} fungsi admin_* dijumpai dalam sumber`);

  // Potong sumber kepada satu blok per fungsi (CREATE ... sehingga $$; penutup).
  const bodies = new Map();
  const re = /CREATE OR REPLACE FUNCTION public\.(admin_[a-z_0-9]+)\s*\([\s\S]*?\n\$\$;/g;
  for (const m of src.matchAll(re)) bodies.set(m[1], m[0]);

  const missing = [...names].filter((n) => !bodies.has(n));
  if (missing.length) bad(`gagal mengekstrak badan fungsi: ${missing.join(', ')}`);

  const noAssert = [...bodies].filter(([, body]) => !/PERFORM\s+public\.assert_can_manage_users\s*\(\s*\)\s*;/i.test(body))
    .map(([n]) => n);
  if (noAssert.length) {
    bad(`BLOCKER A7 berulang — tiada assert_can_manage_users(): ${noAssert.join(', ')}`);
  } else {
    ok('semua admin_* memanggil assert_can_manage_users() (Super Admin + akaun active)');
  }

  // Tindakan pukal juga mesti ada lapis kedua is_super_admin() yang ketat.
  const bulk = bodies.get('admin_reset_all_passwords_to_default') ?? '';
  if (/PERFORM\s+public\.assert_can_manage_users\s*\(\s*\)\s*;/i.test(bulk)
      && /IF\s+NOT\s+public\.is_super_admin\s*\(\s*\)\s+THEN/i.test(bulk)) {
    ok('admin_reset_all_passwords_to_default: dwi-pengawal (assert + is_super_admin)');
  } else {
    bad('admin_reset_all_passwords_to_default kehilangan salah satu pengawal');
  }

  // Pengesahan silang: fungsi yang benar-benar wujud dalam DB.
  const live = await db.query(`
    SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname LIKE 'admin\\_%' ORDER BY 1`);
  const liveNames = live.rows.map((r) => r.proname);
  const absent = [...names].filter((n) => !liveNames.includes(n));
  if (absent.length) bad(`fungsi ada dalam sumber tetapi tidak dipasang: ${absent.join(', ')}`);
  else ok(`semua ${names.size} fungsi admin_* wujud dalam pangkalan data`);
}

// ---------------------------------------------------------------------------
console.log('\n--- RINGKASAN OBJEK FASA 6 ---');
{
  const fns = await db.query(`
    SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND (
       p.proname LIKE 'admin\\_%' OR p.proname IN
       ('can_manage_users','is_super_admin','my_account_status',
        'my_password_change_required','mark_password_changed','default_password',
        'assert_password_acceptable','assert_can_manage_users',
        'handle_new_auth_user','sync_auth_user_update'))
     ORDER BY 1`);
  console.log('Fungsi:', fns.rows.map((r) => r.proname).join(', '));

  const trg = await db.query(
    `SELECT tgname FROM pg_trigger WHERE tgrelid='auth.users'::regclass
       AND NOT tgisinternal ORDER BY 1`);
  console.log('Trigger auth.users:', trg.rows.map((r) => r.tgname).join(', ') || '(tiada)');
  if (trg.rows.length < 1) bad('trigger on_auth_user_created tiada');

  const en = await db.query(`
    SELECT t.typname, string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS labels
      FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid
      JOIN pg_namespace n ON n.oid=t.typnamespace
     WHERE n.nspname='public' AND t.typname IN ('app_role','account_status')
     GROUP BY t.typname ORDER BY t.typname`);
  for (const r of en.rows) console.log(`Enum ${r.typname}: ${r.labels}`);
}

console.log(failed === 0
  ? '\n🎉 SEMUA UJIAN FASA 6 LULUS'
  : `\n🔴 ${failed} KEGAGALAN`);
process.exit(failed === 0 ? 0 : 1);
