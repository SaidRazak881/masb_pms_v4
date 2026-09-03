/**
 * test-account-manager-resolution.mjs — Ujian PGlite untuk
 * `lib/supabase/account-manager-resolution.sql` (Fasa 8A-2)
 * =====================================================================
 *
 * Fasa 8A memasang STRUKTUR dan sengaja TIDAK mengisi `account_manager_id`,
 * kerana 4 daripada 12 nilai sebenar adalah kabur. Prinsip Panel DP-2:
 * **sistem mengingat keputusan manusia, ia tidak meneka.**
 *
 * Fail ini menguji permukaan untuk keputusan manusia itu:
 *   am_list_staff()              — pemilih staf, pendedahan MINIMUM (§2.8)
 *   am_unresolved_values()       — apa yang perlu diputuskan
 *   am_confirm_alias()           — manusia memutuskan (diaudit)
 *   am_revoke_alias()            — manusia membatalkan (diaudit)
 *   am_backfill_preview()        — pratonton tanpa menulis
 *   am_backfill_account_manager()— pengisian sebenar (HARD GATE)
 *
 * PERATURAN DP-6 DIPATUHI: bootstrap memuatkan SET FAIL SKEMA YANG SAMA
 * seperti urutan pemasangan live, supaya ujian tidak mengesahkan keadaan
 * yang berbeza daripada live.
 *
 * Jalankan: node scripts/test-account-manager-resolution.mjs
 */
import fs from 'fs';
import { PGlite } from '@electric-sql/pglite';

let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log(`  ✅ ${m}`); };
const bad = (m) => { fail++; console.log(`  ❌ ${m}`); };
const eq = (a, e, m) =>
  a === e ? ok(`${m} = ${JSON.stringify(a)}`)
          : bad(`${m}: dapat ${JSON.stringify(a)}, jangkaan ${JSON.stringify(e)}`);

const SQL_FILE = 'lib/supabase/account-manager-resolution.sql';
const sql = fs.readFileSync(SQL_FILE, 'utf8');

// 18 staf SEBENAR daripada V4 RAW/User Profiles Mapping.xlsx
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

// 12 nilai SEBENAR lajur H "Account Manager" + bilangan baris sebenar
const AM_SEBENAR = [
  ['Abu Said', 3], ['Abu said', 1], ['Adilah', 53], ['Farrah', 148],
  ['Fuziah', 7], ['Fuzy', 8], ['Fuzy / Dila', 4], ['Fuzy / Sholihin ', 2],
  ['Omar', 26], ['Ow Zi Qi', 3], ['Sholihin', 3], ['Zalina', 7],
];

const uid = (n) => `22222222-2222-4222-8222-22222222${String(n).padStart(4, '0')}`;
const SUPER_ADMIN = '44444444-4444-4444-8444-444444444444';

async function main() {
  console.log('\n[A] AUDIT TEKSTUAL — skop objek, bukan kata kerja mutlak (pelajaran #9)');
  const code = sql.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/--.*$/, '')).join('\n');
  for (const [re, label] of [
    [/\bDROP\s+TABLE\b/i, 'DROP TABLE'],
    [/\bTRUNCATE\b/i, 'TRUNCATE'],
    [/\bALTER\s+TABLE\b/i, 'ALTER TABLE (tiada perubahan struktur dijangka)'],
    [/\bservice_role\b/i, 'service_role'],
    [/'super_admin'::/, "cast 'super_admin' (lihat DP-6)"],
  ]) {
    re.test(code) ? bad(`kod SQL mengandungi ${label}`) : ok(`kod SQL tiada ${label}`);
  }
  // DELETE dibenarkan HANYA pada account_manager_aliases (pembatalan alias)
  const dels = [...code.matchAll(/DELETE\s+FROM\s+([\w.]+)/gi)].map((m) => m[1]);
  eq(JSON.stringify([...new Set(dels)]), JSON.stringify(['public.account_manager_aliases']),
     'DELETE hanya pada account_manager_aliases');
  // UPDATE dibenarkan HANYA pada account_manager_aliases + mengisi *_id
  const ups = [...code.matchAll(/UPDATE\s+(public\.\w+)/gi)].map((m) => m[1]);
  const upsUnik = [...new Set(ups)].sort();
  eq(JSON.stringify(upsUnik),
     JSON.stringify(['public.account_manager_aliases', 'public.import_staging', 'public.invoices']),
     'UPDATE hanya pada 3 jadual yang dijangka');
  const fnCount = (code.match(/CREATE OR REPLACE FUNCTION/gi) || []).length;
  eq(fnCount, 7, 'bilangan fungsi dicipta');

  console.log('\n[B] BOOTSTRAP + PASANG SET SKEMA PENUH (peraturan DP-6)');
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

  // URUTAN PEMASANGAN LIVE (peraturan DP-6)
  const FILES = [
    'lib/supabase/schema-master.sql',
    'lib/supabase/schema-import-staging.sql',
    'lib/supabase/sync-import-transaction.sql',
    'lib/supabase/governance-lock.sql',
    'lib/supabase/change-requests.sql',
    'lib/supabase/fix-rls-recursion.sql',
    'lib/supabase/fix-add-programme-categories.sql',
    'lib/supabase/user-management.sql',
    'lib/supabase/updated-at-triggers.sql',
    'lib/supabase/fix-import-staging-updated-at.sql',   // pembaikan DP-7
    'lib/supabase/client-master.sql',
    'lib/supabase/account-manager-resolution.sql',
  ];
  for (const f of FILES) {
    if (!fs.existsSync(f)) { bad(`${f} TIDAK WUJUD`); continue; }
    try { await db.exec(fs.readFileSync(f, 'utf8')); ok(`${f.split('/').pop()}`); }
    catch (e) { bad(`${f.split('/').pop()} GAGAL: ${e.message}`); }
  }

  console.log('\n[C] IDEMPOTEN — jalankan fail 8A-2 dua kali');
  try { await db.exec(sql); ok('larian kedua berjaya (idempoten)'); }
  catch (e) { bad(`larian kedua GAGAL: ${e.message}`); }

  console.log('\n[D] SEMUA 7 FUNGSI: SECURITY DEFINER + search_path terkunci');
  const fns = await db.query(`
    SELECT p.proname, pg_get_function_result(p.oid) AS returns,
           p.prosecdef, p.proconfig,
           has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec,
           has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public'
       AND (p.proname LIKE 'am\\_%' OR p.proname='can_resolve_account_managers')
     ORDER BY p.proname`);
  eq(fns.rows.length, 7, 'bilangan fungsi 8A-2');
  for (const r of fns.rows) {
    if (!r.prosecdef) bad(`${r.proname} BUKAN SECURITY DEFINER`);
    const sp = (r.proconfig || []).some((c) => String(c).startsWith('search_path=public'));
    if (!sp) bad(`${r.proname} search_path TIDAK terkunci`);
    if (r.anon_exec) bad(`${r.proname} boleh dilaksanakan oleh anon`);
    if (!r.auth_exec) bad(`${r.proname} TIDAK boleh dilaksanakan oleh authenticated`);
  }
  if (fns.rows.every((r) => r.prosecdef)) ok('semua 7 fungsi SECURITY DEFINER');
  if (fns.rows.every((r) => (r.proconfig || []).some((c) => String(c).startsWith('search_path=public'))))
    ok('semua 7 fungsi mengunci search_path=public');
  if (fns.rows.every((r) => !r.anon_exec)) ok('tiada fungsi boleh dilaksanakan oleh anon');
  if (fns.rows.every((r) => r.auth_exec)) ok('semua fungsi boleh dilaksanakan oleh authenticated');

  console.log('\n[E] VETO §2.8 — am_list_staff() memdedahkan HANYA id + nama');
  const sig = fns.rows.find((r) => r.proname === 'am_list_staff');
  eq(sig.returns, 'TABLE(id uuid, full_name text)',
     'am_list_staff mengembalikan TEPAT id + full_name (tiada role/status/email)');
  for (const dilarang of ['role', 'account_status', 'email', 'designation', 'department']) {
    sig.returns.includes(dilarang)
      ? bad(`am_list_staff MEDEDAHKAN ${dilarang} — veto §2.8 dilanggar`)
      : ok(`am_list_staff tidak mendedahkan ${dilarang}`);
  }

  console.log('\n[F] SEED: 18 staf + Super Admin + baris invois/staging SEBENAR');
  const asUser = async (id) => {
    await db.exec(id
      ? `SELECT set_config('request.jwt.claims','{"sub":"${id}","role":"authenticated"}',false)`
      : `SELECT set_config('request.jwt.claims','',false)`);
  };
  const ids = {};
  let n = 0;
  for (const [name, email, role] of STAFF) {
    const id = uid(++n); ids[name] = id;
    await db.query(`INSERT INTO auth.users (id,email) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [id, email]);
    await db.query(`INSERT INTO public.user_profiles (id,full_name,email,role)
                    VALUES ($1,$2,$3,$4::public.app_role)
                    ON CONFLICT (id) DO UPDATE
                    SET full_name=EXCLUDED.full_name,
                        email=EXCLUDED.email,
                        role=EXCLUDED.role,
                        is_active=true`, [id, name, email, role]);
  }
  await db.query(`INSERT INTO auth.users (id,email) VALUES ($1,'saidrazak881@gmail.com')
                  ON CONFLICT DO NOTHING`, [SUPER_ADMIN]);
  await db.query(`INSERT INTO public.user_profiles (id,full_name,email,role,is_active)
                  VALUES ($1,'Super Admin','saidrazak881@gmail.com','super_admin',true)
                  ON CONFLICT (id) DO UPDATE
                    SET full_name=EXCLUDED.full_name,
                        role=EXCLUDED.role,
                        is_active=true`, [SUPER_ADMIN]);
  ids['Super Admin'] = SUPER_ADMIN;

  // staf dengan peranan 'viewer' untuk ujian penolakan
  const VIEWER = uid(900);
  await db.query(`INSERT INTO auth.users (id,email) VALUES ($1,'viewer@mimos.my')
                  ON CONFLICT DO NOTHING`, [VIEWER]);
  // NOTA: user-management.sql memasang trigger `on_auth_user_created` yang
  // AUTO-CIPTA baris user_profiles apabila auth.users dimasukkan. Jadi setiap
  // INSERT profil di sini MESTI ada ON CONFLICT — tanpa ia, ralat
  // 'duplicate key value violates unique constraint user_profiles_pkey'.
  await db.query(`INSERT INTO public.user_profiles (id,full_name,email,role)
                  VALUES ($1,'Staf Viewer','viewer@mimos.my','viewer')
                  ON CONFLICT (id) DO UPDATE
                    SET full_name=EXCLUDED.full_name, role=EXCLUDED.role`, [VIEWER]);

  // organizer + programme (invoices.programme_id NOT NULL)
  const orgId = (await db.query(`
    INSERT INTO public.organizers (name, client_code) VALUES ('MIMOS Berhad','CL-0001')
    RETURNING id`)).rows[0].id;
  const progId = (await db.query(`
    INSERT INTO public.programmes (programme_code, title, organizer_name, organizer_id)
    VALUES ('TPMS-UJI-1','Program Ujian 8A-2','MIMOS Berhad',$1) RETURNING id`, [orgId])).rows[0].id;

  // invois mengikut bilangan baris SEBENAR setiap nilai Account Manager
  let invCount = 0;
  for (const [raw, bilangan] of AM_SEBENAR) {
    for (let k = 1; k <= bilangan; k++) {
      invCount++;
      await db.query(`
        INSERT INTO public.invoices (invoice_no, programme_id, account_manager, total_value)
        VALUES ($1,$2,$3,100.00)`,
        [`INV-UJI-${String(invCount).padStart(4, '0')}`, progId, raw]);
    }
  }
  eq(invCount, 265, 'bilangan baris invois disemai (= 265 baris Quotation Tracker)');

  // staging: import_batches (batch_id NOT NULL + FK)
  const batchId = (await db.query(`
    INSERT INTO import_batches (source_file, file_name, total_rows)
    VALUES ('quotation','00. Quotation Tracker (1).xlsx', 5) RETURNING id`)).rows[0].id;
  // import_staging ada LIMA lajur `not null` tanpa default:
  // batch_id, source_file, source_sheet, source_row, entity_kind.
  // (schema-import-staging.sql menulisnya dalam huruf kecil — grep PEKA
  //  huruf besar akan melewatkannya; lihat pelajaran #2 templat.)
  let rowNo = 0;
  for (const raw of ['Fuzy', 'Farrah', 'Ow Zi Qi', '', null]) {
    rowNo++;
    await db.query(`
      INSERT INTO public.import_staging
        (batch_id, source_file, source_sheet, source_row, entity_kind, account_manager)
      VALUES ($1,'quotation','Quotation Tracker',$2,'quotation',$3)`,
      [batchId, rowNo, raw]);
  }
  const seeded = await db.query(`SELECT count(*)::int n FROM public.import_staging`);
  eq(seeded.rows[0].n, 5, 'baris staging disemai (termasuk kosong + NULL)');

  console.log('\n[G] KEBENARAN — viewer ditolak, finance/admin/super_admin dibenarkan');
  await asUser(VIEWER);
  const vPerm = await db.query(`SELECT public.can_resolve_account_managers() AS g`);
  eq(vPerm.rows[0].g, false, 'viewer: can_resolve_account_managers = false');
  const vStaff = await db.query(`SELECT count(*)::int n FROM public.am_list_staff()`);
  eq(vStaff.rows[0].n, 0, 'viewer: am_list_staff() kosong (tiada pendedahan)');
  const vUnres = await db.query(`SELECT count(*)::int n FROM public.am_unresolved_values()`);
  eq(vUnres.rows[0].n, 0, 'viewer: am_unresolved_values() kosong');
  const vConf = await db.query(
    `SELECT public.am_confirm_alias('Fuzy',$1,'cubaan')`, [ids['Fuziah']])
    .then(() => 'tiada ralat').catch((e) => e.code);
  eq(vConf, '42501', 'viewer: am_confirm_alias ditolak (42501)');
  const vFill = await db.query(`SELECT * FROM public.am_backfill_account_manager()`)
    .then(() => 'tiada ralat').catch((e) => e.code);
  eq(vFill, '42501', 'viewer: am_backfill ditolak (42501)');

  for (const [nama, role] of [['Amalia Adriana', 'finance'],
                              ['Muhammad Yusuf', 'head_governance'],
                              ['Zalina Sayuti', 'manager']]) {
    await asUser(ids[nama]);
    const g = (await db.query(`SELECT public.can_resolve_account_managers() AS g`)).rows[0].g;
    const jangkaan = role !== 'manager';   // manager TIDAK diberi kuasa
    eq(g, jangkaan, `${role}: can_resolve_account_managers = ${jangkaan}`);
  }
  await asUser(SUPER_ADMIN);
  const saPerm = await db.query(`SELECT public.can_resolve_account_managers() AS g`);
  eq(saPerm.rows[0].g, true, 'super_admin: dibenarkan (melalui has_role(), lihat DP-6)');

  console.log('\n[H] am_list_staff() — Super Admin melihat 19 staf aktif');
  const staffRows = await db.query(`SELECT * FROM public.am_list_staff()`);
  eq(staffRows.rows.length, 19, 'bilangan staf aktif (18 + Super Admin)');
  const kunci = Object.keys(staffRows.rows[0] ?? {}).sort();
  eq(JSON.stringify(kunci), JSON.stringify(['full_name', 'id']),
     'kolum dikembalikan = id + full_name SAHAJA');

  console.log('\n[I] am_unresolved_values() — kategori pada 12 nilai SEBENAR');
  const ur = await db.query(`SELECT * FROM public.am_unresolved_values()`);
  const rows = ur.rows;
  eq(rows.length, 12, '12 nilai unik (nilai staging sudah termasuk; "" dan NULL diabaikan)');
  const byRaw = Object.fromEntries(rows.map((r) => [r.raw_text, r]));

  const jangkaanKategori = {
    'Abu Said': ['SELESAI', "Abu Sa'id"],
    'Abu said': ['SELESAI', "Abu Sa'id"],
    'Adilah': ['SELESAI', 'Adilah'],
    'Farrah': ['SELESAI', 'Farrah'],
    'Fuziah': ['SELESAI', 'Fuziah'],
    'Omar': ['SELESAI', 'Omar'],
    'Sholihin': ['SELESAI', 'Sholihin'],
    'Zalina': ['SELESAI', 'Zalina Sayuti'],
    'Fuzy': ['TIADA_PADANAN', null],
    'Ow Zi Qi': ['TIADA_PADANAN', null],
    'Fuzy / Dila': ['BERBILANG_ORANG', null],
    'Fuzy / Sholihin': ['BERBILANG_ORANG', null],
  };
  for (const [raw, [kat, nama]] of Object.entries(jangkaanKategori)) {
    // 'Fuzy / Sholihin ' dibtrim oleh fungsi -> 'Fuzy / Sholihin'
    const r = byRaw[raw];
    if (!r) { bad(`'${raw}' tiada dalam output`); continue; }
    eq(r.kategori, kat, `'${raw}' kategori`);
    eq(r.resolved_name, nama, `'${raw}' diselesaikan kepada`);
  }
  // bilangan baris mesti sepadan data sumber (invois + staging)
  eq(Number(byRaw['Farrah'].jumlah_baris), 148 + 1,
     "'Farrah' jumlah = 148 invois + 1 staging");
  eq(Number(byRaw['Fuzy'].dari_invoices), 8, "'Fuzy' dari_invoices = 8");
  eq(Number(byRaw['Fuzy'].dari_staging), 1, "'Fuzy' dari_staging = 1");
  eq(byRaw['Fuzy'].alias_wujud, false, "'Fuzy' alias_wujud = false (belum disahkan)");
  // nilai kosong/NULL mesti TIDAK muncul
  rows.some((r) => r.raw_text === '' || r.raw_text == null)
    ? bad('nilai kosong/NULL muncul dalam senarai')
    : ok('nilai kosong/NULL dikecualikan');

  console.log('\n[J] am_confirm_alias() — manusia memutuskan, diaudit');
  const auditBefore = (await db.query(
    `SELECT count(*)::int n FROM public.audit_logs`)).rows[0].n;

  const conf = await db.query(
    `SELECT * FROM public.am_confirm_alias('Fuzy',$1,'Disahkan: Fuzy = Fuziah')`,
    [ids['Fuziah']]);
  eq(conf.rows[0].full_name, 'Fuziah', 'alias Fuzy -> Fuziah');
  eq(conf.rows[0].tindakan, 'created', 'tindakan pertama = created');

  const nowResolves = await db.query(`SELECT public.resolve_account_manager('Fuzy') AS id`);
  eq(nowResolves.rows[0].id, ids['Fuziah'], "'Fuzy' kini selesai ke Fuziah");

  const ur2 = await db.query(
    `SELECT kategori, alias_wujud, resolved_name FROM public.am_unresolved_values()
      WHERE raw_text='Fuzy'`);
  eq(ur2.rows[0].kategori, 'SELESAI', "'Fuzy' kategori bertukar ke SELESAI");
  eq(ur2.rows[0].alias_wujud, true, "'Fuzy' alias_wujud = true");

  // sahkan semula pemetaan SAMA -> updated, bukan created
  const conf2 = await db.query(
    `SELECT * FROM public.am_confirm_alias('Fuzy',$1,'sah semula')`, [ids['Fuziah']]);
  eq(conf2.rows[0].tindakan, 'updated', 'sah semula pemetaan sama = updated');
  const aliasN = (await db.query(
    `SELECT count(*)::int n FROM public.account_manager_aliases
      WHERE raw_text='Fuzy'`)).rows[0].n;
  eq(aliasN, 1, 'tiada baris alias duplikasi');

  // tukar sasaran -> updated, dan old_data mesti merekodkan keputusan lama
  const conf3 = await db.query(
    `SELECT * FROM public.am_confirm_alias('Fuzy',$1,'pembetulan: sebenarnya Adilah')`,
    [ids['Adilah']]);
  eq(conf3.rows[0].tindakan, 'updated', 'tukar sasaran = updated');
  eq(conf3.rows[0].full_name, 'Adilah', 'sasaran baharu = Adilah');
  const auditChange = await db.query(`
    SELECT old_data, new_data FROM public.audit_logs
     WHERE table_name='account_manager_aliases' AND action='updated'
       AND old_data IS NOT NULL
     ORDER BY created_at DESC LIMIT 1`);
  eq(auditChange.rows[0].old_data?.user_id, ids['Fuziah'],
     'audit old_data merekodkan keputusan LAMA (tidak hilang senyap)');
  eq(auditChange.rows[0].new_data?.user_id, ids['Adilah'],
     'audit new_data merekodkan keputusan BAHARU');

  // veto §2.4: sel berbilang orang MESTI ditolak walaupun oleh admin
  for (const raw of ['Fuzy / Dila', 'Fuzy / Sholihin', 'A dan B', 'X & Y', 'P, Q']) {
    const r = await db.query(`SELECT * FROM public.am_confirm_alias($1,$2,'cubaan')`,
      [raw, ids['Fuziah']]).then(() => 'tiada ralat').catch((e) => e.code);
    eq(r, '22023', `'${raw}' DITOLAK (veto Kewangan §2.4)`);
  }
  // input tidak sah
  eq(await db.query(`SELECT * FROM public.am_confirm_alias('  ',$1,'x')`, [ids['Fuziah']])
       .then(() => 'tiada ralat').catch((e) => e.code), '22023',
     'raw_text kosong ditolak');
  eq(await db.query(`SELECT * FROM public.am_confirm_alias('Fuzy',$1,'x')`,
       ['99999999-9999-4999-8999-999999999999'])
       .then(() => 'tiada ralat').catch((e) => e.code), '23503',
     'user_id tidak wujud ditolak');

  const auditAfter = (await db.query(
    `SELECT count(*)::int n FROM public.audit_logs`)).rows[0].n;
  if (auditAfter > auditBefore) ok(`jejak audit ditulis (${auditAfter - auditBefore} baris baharu)`);
  else bad('TIADA jejak audit ditulis');

  console.log('\n[K] am_revoke_alias() — pembatalan kembali kepada keadaan asal');
  await db.query(`SELECT * FROM public.am_confirm_alias('Fuzy',$1,'kembali ke Fuziah')`,
    [ids['Fuziah']]);
  const rev = await db.query(`SELECT * FROM public.am_revoke_alias('Fuzy')`);
  eq(rev.rows[0].tindakan, 'deleted', 'tindakan = deleted');
  eq(rev.rows[0].former_user_id, ids['Fuziah'], 'former_user_id direkodkan');
  const afterRev = await db.query(`SELECT public.resolve_account_manager('Fuzy') AS id`);
  eq(afterRev.rows[0].id, null, "'Fuzy' kembali NULL selepas pembatalan");
  eq(await db.query(`SELECT * FROM public.am_revoke_alias('Fuzy')`)
       .then(() => 'tiada ralat').catch((e) => e.code), 'P0002',
     'batalkan alias yang tiada -> P0002');
  const delAudit = await db.query(`
    SELECT old_data FROM public.audit_logs
     WHERE table_name='account_manager_aliases' AND action='deleted'
     ORDER BY created_at DESC LIMIT 1`);
  eq(delAudit.rows[0].old_data?.raw_text, 'Fuzy',
     'audit pembatalan merekodkan old_data');

  console.log('\n[L] am_backfill_preview() — pratonton TIDAK menulis');
  // sahkan satu alias supaya ada sesuatu untuk diisi
  await db.query(`SELECT * FROM public.am_confirm_alias('Fuzy',$1,'Fuziah')`, [ids['Fuziah']]);
  const prev = await db.query(`SELECT * FROM public.am_backfill_preview()`);
  const prevInv = prev.rows.find((r) => r.jadual === 'invoices');
  eq(Number(prevInv.jumlah_baris), 265, 'preview: 265 baris invois');
  eq(Number(prevInv.sudah_dipautkan), 0, 'preview: belum ada yang dipautkan');
  eq(Number(prevInv.akan_diisi) > 0, true, 'preview: ada baris akan diisi');
  // 9 baris kekal NULL: 'Fuzy / Dila' (4) + 'Fuzy / Sholihin ' (2) + 'Ow Zi Qi' (3).
  // 'Fuzy' (8) TIDAK dikira kerana aliasnya disahkan di atas -> ia boleh diisi.
  eq(Number(prevInv.kekal_null), 9, 'preview: 9 baris kekal NULL (sistem enggan meneka)');
  const p2 = await db.query(
    `SELECT count(*)::int n FROM public.invoices WHERE account_manager_id IS NOT NULL`);
  eq(p2.rows[0].n, 0, 'pratonton TIDAK menulis apa-apa');

  console.log('\n[M] am_backfill_account_manager() — pengisian sebenar');
  const fill = await db.query(`SELECT * FROM public.am_backfill_account_manager()`);
  const fillInv = fill.rows.find((r) => r.jadual === 'invoices');
  eq(Number(fillInv.baris_diisi), Number(prevInv.akan_diisi),
     'baris diisi = pratonton (tiada kejutan)');
  eq(Number(fillInv.baris_kekal_null), 9, '9 baris invois kekal NULL (sistem enggan meneka)');

  // pengisian mesti betul pada setiap nilai
  const check = await db.query(`
    SELECT account_manager, account_manager_id, count(*)::int n
      FROM public.invoices GROUP BY 1,2 ORDER BY 1`);
  const diharapkan = {
    'Abu Said': ids["Abu Sa'id"], 'Abu said': ids["Abu Sa'id"],
    'Adilah': ids['Adilah'], 'Farrah': ids['Farrah'], 'Fuziah': ids['Fuziah'],
    'Fuzy': ids['Fuziah'], 'Omar': ids['Omar'], 'Sholihin': ids['Sholihin'],
    'Zalina': ids['Zalina Sayuti'],
    'Fuzy / Dila': null, 'Fuzy / Sholihin ': null, 'Ow Zi Qi': null,
  };
  for (const r of check.rows) {
    const j = diharapkan[r.account_manager];
    if (j === undefined) { bad(`nilai tak dijangka: '${r.account_manager}'`); continue; }
    r.account_manager_id === j
      ? ok(`'${r.account_manager}' x${r.n} -> ${j === null ? 'NULL' : 'staf betul'}`)
      : bad(`'${r.account_manager}' x${r.n}: dapat ${r.account_manager_id}, jangkaan ${j}`);
  }

  // nilai mentah MESTI tidak berubah
  const rawIntact = await db.query(`
    SELECT count(*)::int n FROM public.invoices
     WHERE account_manager IS NULL OR btrim(account_manager)=''`);
  eq(rawIntact.rows[0].n, 0, 'semua nilai mentah invois masih utuh');

  console.log('\n[N] TIDAK MENIMPA keputusan sedia ada + idempoten');
  await db.query(`
    UPDATE public.invoices SET account_manager_id=$1 WHERE account_manager='Farrah'`,
    [ids['Adilah']]);
  const overwritten = (await db.query(`
    SELECT count(*)::int n FROM public.invoices
     WHERE account_manager='Farrah' AND account_manager_id=$1`, [ids['Adilah']])).rows[0].n;
  eq(overwritten, 148, '148 baris Farrah sengaja dipautkan ke Adilah (untuk ujian)');
  const fill2 = await db.query(`SELECT * FROM public.am_backfill_account_manager()`);
  const stillAdilah = (await db.query(`
    SELECT count(*)::int n FROM public.invoices
     WHERE account_manager='Farrah' AND account_manager_id=$1`, [ids['Adilah']])).rows[0].n;
  eq(stillAdilah, 148,
     'backfill KEDUA TIDAK menimpa pautan sedia ada (hanya isi yang NULL)');
  eq(Number(fill2.rows.find((r) => r.jadual === 'invoices').baris_diisi), 0,
     'backfill idempoten: larian kedua mengisi 0 baris');

  console.log('\n[O] staging: nilai kosong/NULL tidak diisi');
  const stg = await db.query(`
    SELECT coalesce(account_manager,'(NULL)') AS am,
           account_manager_id IS NOT NULL AS dipautkan
      FROM public.import_staging ORDER BY 1`);
  for (const r of stg.rows) {
    const kosong = r.am === '(NULL)' || r.am === '';
    if (kosong && r.dipautkan) bad(`staging '${r.am}' dipautkan — sepatutnya tidak`);
  }
  ok('baris staging kosong/NULL tidak dipautkan');
  const stgFuzy = stg.rows.find((r) => r.am === 'Fuzy');
  eq(stgFuzy.dipautkan, true, "staging 'Fuzy' dipautkan selepas alias disahkan");

  await asUser(null);
  await db.close();

  console.log(`\n${'='.repeat(62)}`);
  console.log(`KEPUTUSAN: ${pass} lulus, ${fail} gagal`);
  console.log(`${'='.repeat(62)}\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('RALAT FATAL:', e.message); process.exit(1); });
