/**
 * fixture-live.mjs — Fixture PGlite yang SETARA LIVE, dikongsi oleh semua
 * penjana rekonsiliasi (L1-R, L3-R, dan mana-mana langkah seterusnya).
 *
 * MENGAPA MODUL DIKONGSI (bukan salinan dalam setiap penjana)
 * ------------------------------------------------------------
 * DP-14.2 berlaku kerana fixture Arena TIDAK SETARA live: penjana L1-R hanya
 * menyemai 18 staf Excel sedangkan live ada 20 profil (`Admin` + `test`).
 * Akibatnya Arena meramalkan `resolve_account_manager('test')` -> NULL, dan
 * ChatGPT membenderanya sebagai 🔴 seolah-olah fungsi live rosak. Fungsi itu
 * betul; RAMALAN Arena yang salah.
 *
 * Jika setiap penjana menyelenggara fixturenya sendiri, drift yang sama akan
 * berulang — dan kali ini antara DUA fixture, yang lebih sukar dikesan kerana
 * kedua-duanya kelihatan "lulus". Maka fixture ini diekstrak ke satu modul:
 * satu takrifan kesetaraan dengan live, dikunci oleh pengawal di bawah.
 *
 * PENGAWAL KESETARAAN (gagal = balingan, bukan amaran)
 * ----------------------------------------------------
 *   1. `app_role` mesti ada **8** nilai — sepadan J1d live. `schema-master.sql`
 *      hanya mentakrifkan 7 (DP-6); nilai ke-8 (`super_admin`) datang daripada
 *      `user-management.sql` yang Fasa 6 pasang di live. Sebab itu fail Fasa 6
 *      yang SEBENAR dipasang di sini — BUKAN `ALTER TYPE ... ADD VALUE` tangan,
 *      yang akan mewujudkan drift ketiga (DP-14.3).
 *   2. 18 staf Excel mesti disemai — sumber `V4 RAW/User Profiles Mapping.xlsx`.
 *   3. Jumlah profil mesti **20** — sepadan J0a/J0e live.
 *
 * @module
 */

import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

/**
 * UUID yang `auth.uid()` stub kembalikan. Ia ialah pengguna "sesi semasa"
 * fixture; probe yang menguji kebenaran menentukannya semula secara eksplisit.
 */
export const UID = '11111111-1111-4111-8111-111111111111';

/**
 * 18 staf daripada `V4 RAW/User Profiles Mapping.xlsx`. Nama-nama ini DISAHKAN
 * sepadan tepat dengan J0a live yang ChatGPT laporkan.
 */
export const STAFF = [
  ['Zalina Sayuti', 'zalina@mimos.my'], ['Siti Sarah', 'sitisarah.ramli@mimos.my'],
  ["Abu Sa'id", 'abu.razak@mimos.my'], ['Qusyairi', 'qusyairi.zolkefle@mimos.my'],
  ['Fuziah', 'fuziah.rahim@mimos.my'], ['Adilah', 'adilah.nisman@mimos.my'],
  ['Aisyah', 'aisyah.alias@mimos.my'], ['Dr. Ahmad Nizar', 'nizar.harun@mimos.my'],
  ['Farrah', 'farrah.johar@mimos.my'], ['Sholihin', 'sholihin.abdullah@mimos.my'],
  ['Dr. Afiq', 'muhammadafiq.azmi@mimos.my'], ['Ainur Najwa', 'ainur.rodzi@mimos.my'],
  ['Mohd Suhairi', 'suhairi.soobni@mimos.my'], ['Omar', 'omar.azmi@mimos.my'],
  ['Fatin Firzana', 'fatin.pata@mimos.my'], ['Amalia Adriana', 'amalia.rizam@mimos.my'],
  ['Nur Aleeya', 'aleeya.amran@mimos.my'], ['Muhammad Yusuf', 'yusuf.zolkipli@mimos.my'],
];

/**
 * DUA PROFIL TAMBAHAN LIVE yang tiada dalam Excel (DP-10.4 / J0a). Atribut
 * diambil verbatim daripada J0a live yang ChatGPT laporkan.
 *
 * `test` (blocked) dan `Admin` (super_admin) ialah sebab wujudnya DP-14.2:
 * tanpa kedua-duanya fixture tidak setara live dan ramalan menjadi salah.
 */
/**
 * Peranan yang DIUKUR daripada live, bukan diteka. Sumber: probe `L3x` dalam
 * laporan Langkah 3 ChatGPT (2026-09-04), yang menyenaraikan profil mengikut
 * peranan `super_admin`/`admin`/`head_governance`/`finance`.
 *
 * Baki staf TIDAK diketahui peranannya daripada mana-mana laporan live. Mereka
 * disemai sebagai `viewer` — iaitu **kurang kuasa**, jadi ia tidak boleh
 * menghasilkan positif palsu "kuasa ada" dalam fixture. Probe L3-R melaporkan
 * peranan live SEBENAR bersama keputusannya, dan jangkaannya dinyatakan sebagai
 * PERATURAN (role -> boleh/tidak) supaya ia boleh disahkan baris-demi-baris
 * terhadap live tanpa memerlukan Arena mengetahui peranan itu terlebih dahulu.
 */
export const ROLE_DIUKUR_LIVE = {
  'Admin':           'super_admin',
  'Zalina Sayuti':   'admin',
  'Adilah':          'finance',
  'Farrah':          'finance',
  'Dr. Ahmad Nizar': 'head_governance',
  'test':            'staff',
};

export const PROFIL_TAMBAHAN_LIVE = [
  // nama,   email,            role,          is_active, account_status
  ['Admin', 'admin@mimos.my',  'super_admin', true,      'active'],
  ['test',  'test@mimos.my',   'staff',       false,     'blocked'],
];

/**
 * Fail asas yang mesti dipasang, DALAM SUSUNAN INI, untuk meniru live.
 * `user-management.sql` (Fasa 6) wajib — lihat pengawal 1 di atas.
 */
export const FAIL_ASAS = [
  'lib/supabase/schema-master.sql',
  'lib/supabase/schema-import-staging.sql',
  'lib/supabase/user-management.sql',
];

/**
 * Stub schema `auth`. Dipertingkatkan daripada (id, email) sahaja kerana
 * `user-management.sql` membaca `raw_user_meta_data`, `encrypted_password`,
 * `email_confirmed_at` dan `auth.identities`.
 */
export const bootstrap = (uid = UID) => `
CREATE SCHEMA IF NOT EXISTS auth;
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
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
  AS $$ SELECT '${uid}'::uuid $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE
  AS $$ SELECT '{}'::jsonb $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated')
    THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon')
    THEN CREATE ROLE anon NOLOGIN; END IF;
END $$;
INSERT INTO auth.users (id, email) VALUES ('${uid}'::uuid, 'staff@mimos.my')
  ON CONFLICT DO NOTHING;
`;

/**
 * pgcrypto: di Supabase sebenar ia tersedia sebagai extension. PGlite tiada,
 * jadi pasang extension jika boleh; jika tidak, stub deterministik dengan
 * semantik yang sama. Blok stub ini DISALIN daripada
 * `scripts/test-user-management-sql.mjs` supaya kelakuan fixture tidak
 * bercabang dua antara ujian dan penjana.
 */
async function pasangPgcrypto(db) {
  try {
    await db.exec('CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;');
    return 'extension';
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
          IF v_pos <= 1 OR v_pos > length($2) THEN v_salt := $2;
          ELSE v_salt := substring($2 from 1 for v_pos - 1); END IF;
          RETURN v_salt || '|' || md5($1);
        END; $$;`);
    return 'stub';
  }
}

/**
 * Bina fixture PGlite yang setara live: skema asas + Fasa 6 + 20 profil,
 * dengan ketiga-tiga pengawal kesetaraan ditegakkan.
 *
 * @param {object} [opt]
 * @param {string} [opt.uid]  UUID untuk stub `auth.uid()`
 * @returns {Promise<{db: PGlite, pgcrypto: string, profil: number}>}
 */
export async function binaFixture(opt = {}) {
  const uid = opt.uid ?? UID;
  const db = new PGlite();
  await db.exec(bootstrap(uid));
  const pgcrypto = await pasangPgcrypto(db);

  for (const f of FAIL_ASAS) {
    await db.exec(fs.readFileSync(f, 'utf8'));
  }

  // Pengawal 1 — enum setara live (DP-6 / DP-14.3).
  const nEnum = (await db.query(
    `SELECT count(*)::int n FROM pg_enum e
       JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'app_role'`)).rows[0].n;
  if (nEnum !== 8) {
    throw new Error(`jangkaan 8 nilai app_role seperti J1d live, dapat ${nEnum}`);
  }

  // 18 staf Excel.
  let i = 0;
  for (const [name, email] of STAFF) {
    const id = `22222222-2222-4222-8222-22222222${String(++i).padStart(4, '0')}`;
    await db.query(`INSERT INTO auth.users (id,email) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [id, email]);
    // 🔴 PEPINAT FIXTURE YANG DIBETULKAN: `user-management.sql` memasang
    // trigger `on_auth_user_created` pada `auth.users` yang MENCIPTA baris
    // `user_profiles` dengan ('viewer', is_active=false, 'pending'). INSERT
    // kita kemudian melanggar kekangan unik, dan `ON CONFLICT DO UPDATE SET
    // full_name` yang lama hanya mengemas kini NAMA — jadi role/is_active/
    // account_status kekal pada default trigger. Akibatnya SEMUA 20 profil
    // fixture adalah viewer + tidak aktif, dan `am_list_staff()` (yang menapis
    // `is_active = true`) memulangkan 0 baris.
    //
    // L1-R TIDAK terjejas: `resolve_account_manager()` tidak menapis is_active
    // (itulah penemuan DP-14.2), jadi R1/R2 tidak bergantung kepadanya.
    // Tetapi L3-R menguji kebenaran dan penapis is_active, jadi ia kritikal.
    await db.query(
      `INSERT INTO public.user_profiles (id, full_name, email, role, is_active, account_status)
       VALUES ($1,$2,$3,$4::public.app_role,true,'active')
       ON CONFLICT (id) DO UPDATE
          SET full_name      = EXCLUDED.full_name,
              email          = EXCLUDED.email,
              role           = EXCLUDED.role,
              is_active      = EXCLUDED.is_active,
              account_status = EXCLUDED.account_status`,
      [id, name, email, ROLE_DIUKUR_LIVE[name] ?? 'viewer']);
  }
  const nStaf = (await db.query(`SELECT count(*)::int n FROM public.user_profiles`)).rows[0].n;
  if (nStaf !== 18) throw new Error(`jangkaan 18 staf Excel, dapat ${nStaf}`);

  // Pengawal 3 — 2 profil tambahan live => 20, sepadan J0a/J0e.
  let k = 0;
  for (const [nama, email, role, aktif, status] of PROFIL_TAMBAHAN_LIVE) {
    const id = `44444444-4444-4444-8444-44444444${String(++k).padStart(4, '0')}`;
    await db.query(`INSERT INTO auth.users (id,email) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [id, email]);
    await db.query(
      `INSERT INTO public.user_profiles (id, full_name, email, role, is_active, account_status)
       VALUES ($1,$2,$3,$4::public.app_role,$5,$6::public.account_status)
       ON CONFLICT (id) DO UPDATE
          SET full_name      = EXCLUDED.full_name,
              email          = EXCLUDED.email,
              role           = EXCLUDED.role,
              is_active      = EXCLUDED.is_active,
              account_status = EXCLUDED.account_status`,
      [id, nama, email, role, aktif, status]);
  }
  const nSemua = (await db.query(`SELECT count(*)::int n FROM public.user_profiles`)).rows[0].n;
  if (nSemua !== 20) {
    throw new Error(
      `jangkaan 20 profil (18 staf + Admin + test) seperti J0e live, dapat ${nSemua}`);
  }

  // Pengawal 4 — atribut mesti BENAR-BENAR terpakai. Pengawal kiraan (20 profil)
  // lulus walaupun pepijat trigger di atas membuatkan semua profil menjadi
  // viewer/tidak aktif. Mengira baris tidak mencukupi; atributnya mesti disahkan.
  const attr = (await db.query(
    `SELECT count(*) FILTER (WHERE is_active)::int AS aktif,
            count(*) FILTER (WHERE role = 'super_admin'::public.app_role)::int AS super,
            count(*) FILTER (WHERE role = 'viewer'::public.app_role)::int AS viewer
       FROM public.user_profiles`)).rows[0];
  if (attr.aktif !== 19) {
    throw new Error(`jangkaan 19 profil aktif (20 - 'test' blocked), dapat ${attr.aktif}`);
  }
  if (attr.super !== 1) {
    throw new Error(`jangkaan tepat 1 super_admin ('Admin'), dapat ${attr.super}`);
  }
  const peran = (await db.query(
    `SELECT full_name, role::text AS role, is_active
       FROM public.user_profiles
      WHERE full_name = ANY($1::text[]) ORDER BY full_name`,
    [Object.keys(ROLE_DIUKUR_LIVE)])).rows;
  for (const r of peran) {
    if (r.role !== ROLE_DIUKUR_LIVE[r.full_name]) {
      throw new Error(`pengawal peranan: '${r.full_name}' = ${r.role}, ` +
                      `jangkaan ${ROLE_DIUKUR_LIVE[r.full_name]} (diukur daripada L3x live)`);
    }
  }

  return { db, pgcrypto, profil: nSemua, atribut: attr };
}

/**
 * Pasang fail SQL Fasa 8A mengikut urutan langkah. Urutan 1→2→3→4 wajib supaya
 * kebergantungan objek dipatuhi (contoh: `am_confirm_external()` menulis ke
 * jadual dari Langkah 2).
 *
 * @param {PGlite} db
 * @param {string[]} fail laluan relatif ke fail SQL
 */
export async function pasangLangkah(db, fail) {
  for (const f of fail) {
    await db.exec(fs.readFileSync(f, 'utf8'));
  }
}

/**
 * Tukar identiti "sesi semasa" fixture dengan mentakrifkan semula stub
 * `auth.uid()`. Ini cara fixture meniru `request.jwt.claims` yang berbeza —
 * pada live, `has_role()` membaca claims JWT, manakala dalam PGlite stub
 * `auth.uid()` ialah satu-satunya sumber identiti.
 *
 * @param {PGlite} db
 * @param {string|null} uuid null => tiada identiti (konteks bukan pengguna)
 */
export async function sebagaiPengguna(db, uuid) {
  await db.exec(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
    AS $$ SELECT ${uuid === null ? 'NULL' : `'${uuid}'`}::uuid $$;`);
}

/**
 * Cari UUID profil mengikut nama — digunakan oleh probe kebenaran yang
 * memerlukan identiti pengguna sebenar (bukan UUID rekaan).
 *
 * @param {PGlite} db
 * @param {string} nama
 * @returns {Promise<string>}
 */
export async function uuidProfil(db, nama) {
  const r = await db.query(
    `SELECT id::text AS id FROM public.user_profiles WHERE full_name = $1`, [nama]);
  if (r.rows.length !== 1) {
    throw new Error(`jangkaan tepat 1 profil bernama '${nama}', dapat ${r.rows.length}`);
  }
  return r.rows[0].id;
}
