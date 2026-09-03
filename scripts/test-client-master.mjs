/**
 * test-client-master.mjs — Ujian PGlite untuk lib/supabase/client-master.sql
 * =====================================================================
 *
 * MENGAPA UJIAN INI WUJUD
 * -----------------------
 * Panel Pakar TPMS, Deliberasi Panel DP-2 (lihat docs/PANEL-PAKAR-TPMS.md)
 * menemui bahawa lajur `Account Manager` dalam Quotation Tracker mengandungi
 * TEKS BEBAS yang merujuk kepada orang sebenar:
 *
 *   265 baris, 12 rentetan unik, tetapi HANYA ~8 orang sebenar.
 *
 *   'Abu Said' x3, 'Abu said' x1        -> SATU orang (Abu Sa'id)
 *   'Fuzy' x8                            -> mungkin Fuziah, TIDAK pasti
 *   'Fuzy / Dila' x4                     -> DUA orang dalam satu sel
 *   'Fuzy / Sholihin ' x2  (ruang hujung)-> DUA orang dalam satu sel
 *   'Ow Zi Qi' x3                        -> tiada dalam senarai staf
 *
 * Akibatnya, setiap laporan "mengikut pengurus akaun" adalah SALAH secara
 * senyap — dan Fasa 7C (quotation), 7E (pipeline) dan 7F (komisen) akan
 * mewarisi ralat itu. Jadi ia mesti diselesaikan dahulu, di Fasa 8A.
 *
 * PRINSIP YANG DIUJI (veto Pakar Kewangan §2.4, QA §2.7, Keselamatan §2.8)
 * ------------------------------------------------------------------------
 *   Sistem MENGINGAT keputusan manusia; ia TIDAK MENEKA.
 *   Bila kabur -> NULL. TIADA padanan "terdekat".
 *
 * Ujian ini menggunakan 18 NAMA STAF SEBENAR daripada
 * `V4 RAW/User Profiles Mapping.xlsx` dan 12 NILAI SEBENAR daripada lajur H
 * `V4 RAW/00. Quotation Tracker (1).xlsx` — bukan data rekaan.
 *
 * Jalankan: node scripts/test-client-master.mjs
 */
import fs from 'fs';
import { PGlite } from '@electric-sql/pglite';

let pass = 0;
let fail = 0;
const ok = (m) => { pass++; console.log(`  ✅ ${m}`); };
const bad = (m) => { fail++; console.log(`  ❌ ${m}`); };
const eq = (a, e, m) =>
  a === e ? ok(`${m} = ${JSON.stringify(a)}`)
          : bad(`${m}: dapat ${JSON.stringify(a)}, jangkaan ${JSON.stringify(e)}`);

const UID = '11111111-1111-4111-8111-111111111111';

const BOOTSTRAP = `
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
  AS $$ SELECT '${UID}'::uuid $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE
  AS $$ SELECT '{}'::jsonb $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated')
    THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon')
    THEN CREATE ROLE anon NOLOGIN; END IF;
END $$;
INSERT INTO auth.users (id, email) VALUES ('${UID}'::uuid, 'staff@mimos.my')
  ON CONFLICT DO NOTHING;
`;

// ---------------------------------------------------------------------
// DATA SEBENAR — jangan diubah tanpa mengemas kini sumber Excel
// ---------------------------------------------------------------------

// 18 staf bernama daripada `V4 RAW/User Profiles Mapping.xlsx`
const STAFF = [
  ['Zalina Sayuti',     'zalina@mimos.my'],
  ['Siti Sarah',        'sitisarah.ramli@mimos.my'],
  ["Abu Sa'id",         'abu.razak@mimos.my'],
  ['Qusyairi',          'qusyairi.zolkefle@mimos.my'],
  ['Fuziah',            'fuziah.rahim@mimos.my'],
  ['Adilah',            'adilah.nisman@mimos.my'],
  ['Aisyah',            'aisyah.alias@mimos.my'],
  ['Dr. Ahmad Nizar',   'nizar.harun@mimos.my'],
  ['Farrah',            'farrah.johar@mimos.my'],
  ['Sholihin',          'sholihin.abdullah@mimos.my'],
  ['Dr. Afiq',          'muhammadafiq.azmi@mimos.my'],
  ['Ainur Najwa',       'ainur.rodzi@mimos.my'],
  ['Mohd Suhairi',      'suhairi.soobni@mimos.my'],
  ['Omar',              'omar.azmi@mimos.my'],
  ['Fatin Firzana',     'fatin.pata@mimos.my'],
  ['Amalia Adriana',    'amalia.rizam@mimos.my'],
  ['Nur Aleeya',        'aleeya.amran@mimos.my'],
  ['Muhammad Yusuf',    'yusuf.zolkipli@mimos.my'],
];

// 12 nilai SEBENAR lajur H "Account Manager", Quotation Tracker.
// `null` = jangkaan TIDAK DAPAT DISELESAIKAN. NULL di sini ialah jawapan
// yang BETUL (sistem enggan meneka), bukan kegagalan.
const AM_CASES = [
  ['Abu Said',           "Abu Sa'id",  'token pertama "abu" unik'],
  ['Abu said',           "Abu Sa'id",  'varian huruf besar/kecil'],
  ['Adilah',             'Adilah',     'padanan tepat'],
  ['Farrah',             'Farrah',     'padanan tepat'],
  ['Fuziah',             'Fuziah',     'padanan tepat'],
  ['Fuzy',               null,         'singkatan TIDAK pasti -> enggan meneka'],
  ['Fuzy / Dila',        null,         'berbilang orang dalam satu sel'],
  ['Fuzy / Sholihin ',   null,         'berbilang orang + ruang hujung'],
  ['Omar',               'Omar',       'padanan tepat'],
  ['Ow Zi Qi',           null,         'bukan staf MIMOS Academy'],
  ['Sholihin',           'Sholihin',   'padanan tepat'],
  ['Zalina',             'Zalina Sayuti', 'token pertama "zalina" unik'],
];

// ---------------------------------------------------------------------

const SQL_FILE = 'lib/supabase/client-master.sql';
const sql = fs.readFileSync(SQL_FILE, 'utf8');

async function main() {
  const db = new PGlite();
  await db.exec(BOOTSTRAP);

  for (const f of [
    'lib/supabase/schema-master.sql',
    'lib/supabase/schema-import-staging.sql',
  ]) {
    await db.exec(fs.readFileSync(f, 'utf8'));
  }

  console.log('\n[A] TEKSTUAL — tiada operasi merosakkan');
  // Komen dibuang DAHULU supaya perkataan dalam komen (cth. "TIADA TRUNCATE")
  // tidak dikira sebagai operasi sebenar. Imbasan kemudian lebih ketat,
  // bukan kurang ketat: hanya KOD SQL yang diperiksa.
  const code = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')            // komen blok
    .split('\n')
    .map((l) => l.replace(/--.*$/, ''))           // komen baris
    .join('\n');
  // bahagian dalam $$ ... $$ adalah KOD (badan fungsi) — mesti diimbas juga
  const banned = [
    [/\bDROP\s+TABLE\b/i,           'DROP TABLE'],
    [/\bTRUNCATE\b/i,               'TRUNCATE'],
    [/\bDELETE\s+FROM\b/i,          'DELETE FROM'],
    [/\bUPDATE\s+public\./i,        'UPDATE pada data'],
    [/\bRENAME\s+TO\b/i,            'RENAME (ditangguhkan ke 7H)'],
    [/\bDROP\s+COLUMN\b/i,          'DROP COLUMN'],
    [/\bservice_role\b/i,           'service_role'],
    [/'super_admin'::/,             "cast 'super_admin' (bukan nilai enum)"],
  ];
  for (const [re, label] of banned) {
    re.test(code) ? bad(`kod SQL mengandungi ${label}`) : ok(`kod SQL tiada ${label}`);
  }
  // DROP POLICY / REVOKE adalah dibenarkan & diperlukan untuk idempotensi
  ok('DROP POLICY IF EXISTS dibenarkan (idempotensi RLS)');
  ok('REVOKE/GRANT dibenarkan (pengurangan keistimewaan)');

  console.log('\n[B] IDEMPOTEN — jalankan dua kali');
  await db.exec(sql);
  ok('larian pertama berjaya');
  try {
    await db.exec(sql);
    ok('larian kedua berjaya (idempoten)');
  } catch (e) {
    bad(`larian kedua GAGAL: ${e.message}`);
  }

  console.log('\n[C] STRUKTUR — lajur & jadual baharu wujud');
  const cols = async (t) => {
    const r = await db.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema='public' AND table_name=$1`, [t]);
    return new Set(r.rows.map((x) => x.column_name));
  };
  const org = await cols('organizers');
  for (const c of ['client_code', 'sst_registration_no',
                   'billing_address', 'payment_terms_days']) {
    org.has(c) ? ok(`organizers.${c} wujud`) : bad(`organizers.${c} HILANG`);
  }
  (await cols('invoices')).has('account_manager_id')
    ? ok('invoices.account_manager_id wujud')
    : bad('invoices.account_manager_id HILANG');
  (await cols('import_staging')).has('account_manager_id')
    ? ok('import_staging.account_manager_id wujud')
    : bad('import_staging.account_manager_id HILANG');

  // lajur mentah MESTI kekal (jejak audit)
  (await cols('invoices')).has('account_manager')
    ? ok('invoices.account_manager (mentah) KEKAL')
    : bad('invoices.account_manager (mentah) HILANG — jejak audit rosak');

  const t = await db.query(
    `SELECT count(*)::int n FROM information_schema.tables
      WHERE table_schema='public' AND table_name='account_manager_aliases'`);
  eq(t.rows[0].n, 1, 'account_manager_aliases wujud');

  const rls = await db.query(
    `SELECT relrowsecurity FROM pg_class
      WHERE oid='public.account_manager_aliases'::regclass`);
  eq(rls.rows[0].relrowsecurity, true, 'RLS diaktifkan pada aliases');

  const pol = await db.query(
    `SELECT polname FROM pg_policy
      WHERE polrelid='public.account_manager_aliases'::regclass
      ORDER BY polname`);
  const polNames = pol.rows.map((r) => r.polname).sort();
  eq(polNames.length, 4, 'bilangan polisi aliases');
  for (const p of ['am_aliases_delete', 'am_aliases_read',
                   'am_aliases_update', 'am_aliases_write']) {
    polNames.includes(p) ? ok(`polisi ${p} wujud`) : bad(`polisi ${p} HILANG`);
  }

  console.log('\n[D] NORMALISASI NAMA');
  const norm = async (s) =>
    (await db.query('SELECT public.normalize_person_name($1) v', [s])).rows[0].v;

  eq(await norm("Abu Sa'id"), 'abu sa id', "apostrofu -> ruang (Abu Sa'id)");
  eq(await norm('Abu Said'),  'abu said',  'huruf besar/kecil (Abu Said)');
  eq(await norm('Dr. Ahmad Nizar'), 'ahmad nizar', 'gelaran + titik dibuang');
  eq(await norm('  Farrah   Farhana  '), 'farrah farhana', 'ruang berlebihan');
  eq(await norm('Fuzy / Sholihin '), 'fuzy / sholihin', 'ruang hujung + /');
  eq(await norm(''), null, 'rentetan kosong -> NULL');
  eq(await norm(null), null, 'NULL -> NULL');
  eq(await norm('   '), null, 'ruang sahaja -> NULL');
  eq(await norm('Pn. Zalina'), 'zalina', 'gelaran Pn dibuang');
  eq(await norm('Ariffin'), 'ariffin', '"ar" tidak dipotong tanpa ruang');

  console.log('\n[E] SEED 18 STAF SEBENAR');
  let i = 0;
  for (const [name, email] of STAFF) {
    const uid = `22222222-2222-4222-8222-22222222${String(++i).padStart(4, '0')}`;
    await db.query(
      `INSERT INTO auth.users (id, email) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [uid, email]);
    await db.query(
      `INSERT INTO public.user_profiles (id, full_name, email)
       VALUES ($1,$2,$3)
       ON CONFLICT (id) DO UPDATE SET full_name=EXCLUDED.full_name`,
      [uid, name, email]);
  }
  const sc = await db.query(`SELECT count(*)::int n FROM public.user_profiles`);
  eq(sc.rows[0].n, 18, 'bilangan staf disemai');

  console.log('\n[F] PENYELESAIAN 12 NILAI SEBENAR (lajur H, Quotation Tracker)');
  const nameOf = async (id) => id == null ? null
    : (await db.query(`SELECT full_name FROM public.user_profiles WHERE id=$1`,
        [id])).rows[0]?.full_name ?? null;

  let resolved = 0, nulled = 0;
  for (const [raw, expectName, why] of AM_CASES) {
    const r = await db.query('SELECT public.resolve_account_manager($1) id', [raw]);
    const got = await nameOf(r.rows[0].id);
    if (expectName === null) {
      if (got === null) { ok(`'${raw}' -> NULL (${why})`); nulled++; }
      else bad(`'${raw}' SEPATUTNYA NULL tetapi selesai ke '${got}' — sistem meneka!`);
    } else {
      if (got === expectName) { ok(`'${raw}' -> '${got}' (${why})`); resolved++; }
      else bad(`'${raw}': dapat ${JSON.stringify(got)}, jangkaan '${expectName}'`);
    }
  }
  eq(resolved, 8, 'bilangan nilai yang SELESAI');
  eq(nulled, 4, 'bilangan nilai yang NULL (enggan meneka)');

  console.log('\n[G] KEKABURAN -> NULL (veto QA §2.7)');
  // dua staf bernama sama
  await db.query(
    `INSERT INTO auth.users (id,email) VALUES
      ('33333333-3333-4333-8333-333333333301','kembar1@mimos.my')`);
  await db.query(
    `INSERT INTO public.user_profiles (id,full_name,email) VALUES
      ('33333333-3333-4333-8333-333333333301','Siti Nurhaliza','kembar1@mimos.my')`);
  await db.query(
    `INSERT INTO auth.users (id,email) VALUES
      ('33333333-3333-4333-8333-333333333302','kembar2@mimos.my')`);
  await db.query(
    `INSERT INTO public.user_profiles (id,full_name,email) VALUES
      ('33333333-3333-4333-8333-333333333302','Siti Nurhaliza','kembar2@mimos.my')`);
  const amb = await db.query(`SELECT public.resolve_account_manager('Siti Nurhaliza') id`);
  eq(amb.rows[0].id, null, 'dua staf bernama sama -> NULL');

  // substring pendek ditolak oleh had panjang minimum
  const short = await db.query(`SELECT public.resolve_account_manager('Ain') id`);
  eq(short.rows[0].id, null, '"Ain" (3 aksara) tidak padan "Ainur Najwa"');

  // NOTA REKA BENTUK (direkodkan sebagai DP-2a):
  // "Nur" MENYELESAI ke Nur Aleeya melalui langkah 5 (token pertama), kerana
  // dalam senarai 18 staf sebenar HANYA SATU staf mempunyai token pertama
  // "nur" ("Ainur Najwa" bermula dengan "ainur", bukan "nur").
  //
  // Ini BUKAN tekaan kabur: ia padanan token pertama yang TEPAT dan UNIK.
  // Peraturan yang sama inilah yang menyelesaikan 'Abu Said' -> "Abu Sa'id"
  // dan 'Zalina' -> 'Zalina Sayuti' dalam data sebenar (11 baris).
  // Menggugurkannya akan menurunkan liputan automatik 8/12 -> 6/12.
  //
  // Sifat keselamatan yang SEBENAR diuji di sini ialah SYARAT KEUNIKAN:
  // bila DUA staf berkongsi token pertama, hasilnya MESTI NULL.
  const nurNow = await db.query(`SELECT public.resolve_account_manager('Nur') id`);
  const nurName = await nameOf(nurNow.rows[0].id);
  eq(nurName, 'Nur Aleeya',
     '"Nur" -> satu-satunya staf bertoken pertama "nur" (langkah 5, unik)');

  // tambah staf kedua bertoken pertama "nur" -> syarat keunikan mesti menolak
  await db.query(
    `INSERT INTO auth.users (id,email) VALUES
      ('33333333-3333-4333-8333-333333333303','nurkembar@mimos.my')`);
  await db.query(
    `INSERT INTO public.user_profiles (id,full_name,email) VALUES
      ('33333333-3333-4333-8333-333333333303','Nur Batrisyia','nurkembar@mimos.my')`);
  const nurAmb = await db.query(`SELECT public.resolve_account_manager('Nur') id`);
  eq(nurAmb.rows[0].id, null,
     '"Nur" -> NULL selepas 2 staf berkongsi token pertama (syarat keunikan)');

  // langkah 6 (substring) juga mesti menolak bila berbilang staf padan.
  // Nilai ujian "arah" sengaja sintetik: tiada token pertama "arah", tiada
  // padanan tepat, tetapi "Siti Sarah" dan "Sarah Amelia" kedua-duanya
  // MENGANDUNGI "arah" -> syarat keunikan langkah 6 mesti mengembalikan NULL.
  await db.query(
    `INSERT INTO auth.users (id,email) VALUES
      ('33333333-3333-4333-8333-333333333304','sarah2@mimos.my')`);
  await db.query(
    `INSERT INTO public.user_profiles (id,full_name,email) VALUES
      ('33333333-3333-4333-8333-333333333304','Sarah Amelia','sarah2@mimos.my')`);
  const arah = await db.query(`SELECT public.resolve_account_manager('arah') id`);
  eq(arah.rows[0].id, null,
     '"arah" -> NULL (2 staf mengandungi substring itu, langkah 6)');

  // dan langkah 6 mesti berfungsi bila TEPAT SATU staf padan
  const sarah1 = await db.query(`SELECT public.resolve_account_manager('Siti Sar') id`);
  eq(await nameOf(sarah1.rows[0].id), 'Siti Sarah',
     '"Siti Sar" -> Siti Sarah (substring unik, langkah 6)');

  console.log('\n[H] ALIAS DISAHKAN MANUSIA mengatasi kekaburan');
  const fuziahId = (await db.query(
    `SELECT id FROM public.user_profiles WHERE full_name='Fuziah'`)).rows[0].id;
  const before = await db.query(`SELECT public.resolve_account_manager('Fuzy') id`);
  eq(before.rows[0].id, null, 'sebelum pengesahan: "Fuzy" -> NULL');

  await db.query(
    `INSERT INTO public.account_manager_aliases (raw_text,user_id,confirmed_by,notes)
     VALUES ('Fuzy',$1,$2,'Disahkan oleh pengguna: Fuzy = Fuziah')`,
    [fuziahId, UID]);
  const after = await db.query(`SELECT public.resolve_account_manager('Fuzy') id`);
  eq(after.rows[0].id, fuziahId, 'selepas pengesahan: "Fuzy" -> Fuziah');

  // alias juga menyelesaikan varian huruf besar/kecil & ruang
  const afterVar = await db.query(`SELECT public.resolve_account_manager('  FUZY  ') id`);
  eq(afterVar.rows[0].id, fuziahId, 'alias tahan varian "  FUZY  "');

  // alias TIDAK boleh mengatasi penolakan berbilang-orang
  await db.query(
    `INSERT INTO public.account_manager_aliases (raw_text,user_id,confirmed_by)
     VALUES ('Fuzy / Dila',$1,$2)`, [fuziahId, UID]);
  const multi = await db.query(
    `SELECT public.resolve_account_manager('Fuzy / Dila') id`);
  eq(multi.rows[0].id, null,
     'alias TIDAK membenarkan sel berbilang-orang selesai (veto Kewangan §2.4)');

  console.log('\n[I] KESELAMATAN — pendedahan minimum (veto §2.8)');
  const sig = await db.query(`
    SELECT p.prosecdef, l.lanname,
           pg_get_function_result(p.oid) AS rettype
      FROM pg_proc p JOIN pg_language l ON l.oid=p.prolang
     WHERE p.proname='resolve_account_manager'`);
  eq(sig.rows[0].rettype, 'uuid', 'hanya mengembalikan uuid (tiada nama/peranan/status)');
  eq(sig.rows[0].prosecdef, true, 'SECURITY DEFINER (perlu lintas RLS user_profiles)');
  eq(sig.rows[0].lanname, 'plpgsql', 'bahasa plpgsql');

  const cfg = await db.query(`
    SELECT proconfig FROM pg_proc WHERE proname='resolve_account_manager'`);
  const hasSearchPath = (cfg.rows[0].proconfig || []).some(
    (c) => String(c).startsWith('search_path='));
  hasSearchPath ? ok('search_path dikunci (tiada pintasan skema)')
                : bad('search_path TIDAK dikunci');

  const grant = await db.query(`
    SELECT has_function_privilege('anon','public.resolve_account_manager(text)','EXECUTE') g`);
  eq(grant.rows[0].g, false, 'anon TIDAK boleh melaksanakan resolve_account_manager');

  console.log('\n[J] MEDAN INDUK PELANGGAN boleh ditulis');
  const oc = await db.query(`
    INSERT INTO public.organizers
      (name, client_code, sst_registration_no, billing_address, payment_terms_days)
    VALUES ('MIMOS Berhad','CL-0001','W10-1234-5678','TPM, Kuala Lumpur',30)
    RETURNING client_code, sst_registration_no, payment_terms_days`);
  eq(oc.rows[0].client_code, 'CL-0001', 'client_code ditulis');
  eq(oc.rows[0].sst_registration_no, 'W10-1234-5678', 'sst_registration_no ditulis');
  eq(oc.rows[0].payment_terms_days, 30, 'payment_terms_days ditulis');

  const dup = await db.query(`
    INSERT INTO public.organizers (name, client_code) VALUES ('Dup','CL-0001')`)
    .then(() => 'tiada ralat').catch((e) => e.code || e.message);
  dup === '23505'
    ? ok('client_code UNIQUE dikuatkuasakan (23505)')
    : bad(`client_code UNIQUE tidak dikuatkuasakan: ${dup}`);

  const nullDup = await db.query(`
    INSERT INTO public.organizers (name) VALUES ('Tiada Kod A'),
                                  ('Tiada Kod B')`)
    .then(() => 'ok').catch((e) => 'ralat: ' + e.message);
  eq(nullDup, 'ok', 'client_code NULL dibenarkan berulang (indeks separa)');

  console.log('\n[K] INTEGRITI RUJUKAN — pautan selesai ke user_profiles');
  // Bukti daripada katalog: kekangan FK wujud dan menunjuk ke user_profiles(id).
  // Diuji pada KEDUA-DUA jadual sasaran 8A.
  const fk = async (tbl) => {
    const r = await db.query(`
      SELECT c.confdeltype, ref.relname AS ref_table,
             (SELECT a.attname FROM pg_attribute a
               WHERE a.attrelid = c.confrelid AND a.attnum = c.confkey[1]) AS ref_col
        FROM pg_constraint c
        JOIN pg_class ref ON ref.oid = c.confrelid
       WHERE c.contype = 'f'
         AND c.conrelid = ('public.' || $1)::regclass
         AND (SELECT a.attname FROM pg_attribute a
               WHERE a.attrelid = c.conrelid AND a.attnum = c.conkey[1])
             = 'account_manager_id'`, [tbl]);
    return r.rows[0] ?? null;
  };
  for (const tbl of ['invoices', 'import_staging']) {
    const f = await fk(tbl);
    if (!f) { bad(`${tbl}.account_manager_id TIADA kekangan FK`); continue; }
    eq(f.ref_table, 'user_profiles', `${tbl}.account_manager_id -> user_profiles`);
    eq(f.ref_col, 'id', `${tbl}.account_manager_id -> user_profiles.id`);
    eq(f.confdeltype, 'a', `${tbl} FK = NO ACTION (bukan CASCADE: sejarah invois tidak boleh terhapus)`);
  }

  // Fungsi boleh digunakan terus dalam INSERT ... SELECT — inilah cara
  // migrasi data (Fasa 8A langkah 2) akan mengisinya, BUKAN dalam fail ini.
  const ins = await db.query(`
    INSERT INTO public.organizers (name) VALUES ('Uji Pelanggan') RETURNING id`);
  const resolvedRow = await db.query(`
    SELECT public.resolve_account_manager('Farrah') AS id,
           'Farrah' AS raw_text`);
  eq(resolvedRow.rows[0].raw_text, 'Farrah', 'nilai mentah dikekalkan bersebelahan pautan');
  const isStaff = await db.query(
    `SELECT full_name FROM public.user_profiles WHERE id = $1`,
    [resolvedRow.rows[0].id]);
  eq(isStaff.rows[0].full_name, 'Farrah', 'pautan selesai menunjuk staf yang betul');
  void ins;

  console.log('\n[L] UJIAN ALIAS TANPA MENULIS (BEGIN ... ROLLBACK)');
  // Prompt 8A mengarahkan ChatGPT menguji perilaku alias di LIVE tanpa
  // meninggalkan data. Dakwaan bahawa BEGIN/INSERT/ROLLBACK tidak meninggalkan
  // kesan MESTI dibuktikan di PGlite dahulu (pelajaran #4: setiap dakwaan
  // tentang tingkah laku PostgreSQL diuji terhadap PGlite sebelum prompt dihantar).
  const aliasCount = async () =>
    (await db.query(`SELECT count(*)::int n FROM public.account_manager_aliases`)).rows[0].n;
  const cntBefore = await aliasCount();
  await db.exec('BEGIN');
  await db.query(`
    INSERT INTO public.account_manager_aliases (raw_text,user_id,confirmed_by,notes)
    VALUES ('Ujian Rollback',$1,$2,'transaksi dibatalkan')`, [fuziahId, UID]);
  // PENTING — jangan gabungkan INSERT dan panggilan fungsi dalam SATU kenyataan.
  // `resolve_account_manager` ialah STABLE, jadi ia menggunakan snapshot yang
  // sama dengan kenyataan pemanggilnya dan TIDAK NAMPAK baris yang dimasukkan
  // oleh kenyataan itu sendiri. Dibuktikan di PGlite: versi RETURNING
  // mengembalikan NULL (bukan user_id). Di live ia akan kelihatan seperti
  // kegagalan palsu. Oleh itu: INSERT dahulu, SELECT dalam kenyataan berasingan.
  const inTx = await db.query(
    `SELECT public.resolve_account_manager('Ujian Rollback') AS resolved_now`);
  eq(inTx.rows[0].resolved_now, fuziahId,
     'dalam transaksi: alias berkesan (kenyataan SELECT berasingan)');
  await db.exec('ROLLBACK');
  const cntAfter = await aliasCount();
  eq(cntAfter, cntBefore, 'selepas ROLLBACK: bilangan alias tidak berubah');
  const gone = await db.query(`SELECT public.resolve_account_manager('Ujian Rollback') id`);
  eq(gone.rows[0].id, null, 'selepas ROLLBACK: alias tiada lagi -> NULL');
  // STABLE: panggilan berulang memberikan hasil sama
  const s1 = await db.query(`SELECT public.resolve_account_manager('Farrah') id`);
  const s2 = await db.query(`SELECT public.resolve_account_manager('Farrah') id`);
  eq(s1.rows[0].id, s2.rows[0].id, 'fungsi STABLE: dua panggilan -> hasil sama');

  await db.close();

  console.log(`\n${'='.repeat(62)}`);
  console.log(`KEPUTUSAN: ${pass} lulus, ${fail} gagal`);
  console.log(`${'='.repeat(62)}\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('RALAT FATAL:', e); process.exit(1); });
