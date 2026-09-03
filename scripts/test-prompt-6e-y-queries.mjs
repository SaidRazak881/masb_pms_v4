// =============================================================================
// Ujian: blok SQL dalam docs/PROMPT-6E-VERCEL-PRODUCTION-PRIVATE-HAS-ROLE.md
// =============================================================================
// Tujuan: mengesahkan bahawa kriteria Y1–Y4 yang Arena tulis kepada ChatGPT
//         adalah SAH dan boleh dijalankan, SEBELUM prompt dihantar.
//
// Kenapa ujian ini wujud:
//   Dalam Fasa 6, Arena membuat TIGA kesilapan kriteria yang semuanya dikesan
//   oleh ChatGPT, bukan oleh Arena:
//     1. V3 `policy_count = 9`  — angka dari satu fail, query mengira seluruh skema
//     2. W1 allowlist 13 jadual — grep "CREATE TABLE" peka huruf besar, sedangkan
//                                 schema-import-staging.sql guna huruf kecil
//     3. Gate "D sebelum E"     — gate tanpa sebab tertulis jadi sekatan membuta tuli
//     4. Nota Y3 "pg_depend tidak jejak polisi RLS" — dakwaan tentang tingkah laku
//        Postgres yang TIDAK diuji. Dikesan oleh ujian INI sebelum prompt dihantar.
//   X2/X3 dalam PROMPT-6D juga gagal kerana bergantung kepada pg_proc.prosrc dan
//   pelaksanaan fungsi, yang mungkin dihalang oleh connector ChatGPT.
//
//   Ujian ini menghalang kelas kesilapan yang sama untuk Y1–Y4: ia menjalankan
//   setiap blok SQL terhadap PGlite dan mengesahkan jangkaan Arena.
//
// Batasan yang DIINGATI (bukan pepijat):
//   PGlite tidak boleh menguji RLS — role `postgres` ialah rolsuper=true dan
//   rolbypassrls=true. Jadi ujian ini mengesahkan SINTAKS + BENTUK HASIL sahaja,
//   bukan keselamatan. Lihat scripts/test-c13-has-role-drift.mjs.
// =============================================================================

import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';

const DOC = 'docs/PROMPT-6E-VERCEL-PRODUCTION-PRIVATE-HAS-ROLE.md';

let lulus = 0;
let gagal = 0;
const ok = (m) => { lulus++; console.log(`  ✅ ${m}`); };
const bad = (m) => { gagal++; console.log(`  ❌ ${m}`); };

// ---------------------------------------------------------------------------
console.log('--- 1. Ekstrak blok SQL daripada PROMPT-6E ---');
if (!fs.existsSync(DOC)) {
  console.log(`  ❌ dokumen tidak dijumpai: ${DOC}`);
  process.exit(1);
}
const doc = fs.readFileSync(DOC, 'utf8');
const blocks = [...doc.matchAll(/```sql\n([\s\S]*?)```/g)].map((m) => m[1]);
if (blocks.length !== 4) bad(`jangkaan 4 blok SQL (Y1–Y4), dapat ${blocks.length}`);
else ok(`4 blok SQL ditemui (Y1–Y4)`);

// Setiap blok mesti menamakan check_name Y1..Y4 mengikut urutan.
const names = blocks.map((b) => (b.match(/'(Y\d_[a-z_]+)'/) || [])[1] || null);
const jangkaan = ['Y1_has_role_all_schemas', 'Y2_private_schema_inventory',
                  'Y3_dependents_on_private_has_role', 'Y4_legacy_rows'];
if (JSON.stringify(names) === JSON.stringify(jangkaan)) ok(`check_name urutan betul: ${names.join(', ')}`);
else bad(`check_name tidak sepadan. dapat: ${names.join(', ')}`);

// ---------------------------------------------------------------------------
console.log('\n--- 2. Bina persekitaran tiruan (read-only selepas ini) ---');
const db = await PGlite.create();
await db.exec(`
  -- Role Supabase perlu wujud sebelum CREATE POLICY ... TO authenticated
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE ROLE anon NOLOGIN;
    END IF;
  END $$;

  CREATE TYPE public.app_role AS ENUM (
    'admin','staff','finance','head_governance','manager','executive','viewer','super_admin');
  CREATE SCHEMA IF NOT EXISTS private;

  -- private.has_role(): fungsi YATIM yang wujud dalam live tetapi TIDAK PERNAH
  -- ditakrifkan dalam mana-mana komit git (disahkan oleh siasatan sejarah Arena).
  CREATE OR REPLACE FUNCTION private.has_role(p_role public.app_role)
    RETURNS boolean LANGUAGE sql SECURITY INVOKER AS $$ SELECT false $$;

  CREATE OR REPLACE FUNCTION public.has_role(p_role public.app_role)
    RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN true; END $$;

  CREATE TABLE profiles (id uuid, full_name text);
  CREATE TABLE user_roles (user_id uuid, role public.app_role);
  CREATE TABLE programme_participants (id uuid);

  -- 1 + 1 + 0 baris = meniru W3 live
  INSERT INTO profiles VALUES (gen_random_uuid(), 'Uji');
  INSERT INTO user_roles VALUES (gen_random_uuid(), 'admin');

  CREATE POLICY user_roles_admin_write ON user_roles FOR ALL TO authenticated
    USING (private.has_role('admin')) WITH CHECK (private.has_role('admin'));
  CREATE POLICY profiles_select_self ON profiles FOR SELECT TO authenticated
    USING (private.has_role('staff'));
`);
ok('persekitaran tiruan dibina (private.has_role + public.has_role + 3 jadual warisan)');

// ---------------------------------------------------------------------------
console.log('\n--- 3. Jalankan setiap blok Y (mesti sah secara sintaks) ---');
const hasil = [];
for (let i = 0; i < blocks.length; i++) {
  try {
    const r = await db.query(blocks[i]);
    hasil.push(r.rows);
    ok(`${names[i]} — ${r.rows.length} baris`);
  } catch (e) {
    hasil.push(null);
    bad(`${names[i]} — RALAT: ${e.message.split('\n')[0]}`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- 4. Sahkan JANGKAAN Arena terhadap hasil Y ---');

// Y1: mesti menemui KEDUA-DUA has_role (public + private). Inilah intipati Y1 —
//     membuktikan private.has_role masih hidup dalam live.
if (hasil[0]) {
  const skemas = hasil[0].map((r) => r.schema_name).sort();
  if (skemas.includes('private') && skemas.includes('public')) {
    ok(`Y1 menemui kedua-dua skema: ${skemas.join(', ')}`);
  } else {
    bad(`Y1 sepatutnya menemui public + private, dapat: ${skemas.join(', ')}`);
  }
  // Y1 mesti TIDAK mengembalikan prosrc (connector ChatGPT mungkin dihalang daripadanya)
  const kolum = Object.keys(hasil[0][0] || {});
  if (kolum.includes('prosrc')) bad('Y1 mengembalikan prosrc — sepatutnya katalog sahaja');
  else ok(`Y1 tidak menyentuh prosrc (kolum: ${kolum.length}) — sesuai untuk connector terhad`);
  const p = hasil[0].find((r) => r.schema_name === 'private');
  if (p && p.security_definer === false) ok('Y1 mendedahkan security_definer private.has_role = false');
}

// Y2: mesti menyenaraikan private.has_role
if (hasil[1]) {
  const fns = hasil[1].map((r) => r.function_name);
  if (fns.includes('has_role')) ok(`Y2 menyenaraikan fungsi private: ${fns.join(', ')}`);
  else bad(`Y2 tidak menemui has_role dalam private: ${fns.join(', ')}`);
}

// Y3: JANGKAAN KRITIKAL — pg_depend MEMANG menjejak polisi RLS.
//
//   SEJARAH: Arena mulanya menulis dalam PROMPT-6E bahawa "Y3 mungkin kosong,
//   polisi RLS tidak diwakili dalam pg_depend". UJIAN INI membuktikannya SALAH:
//   pg_depend mengembalikan baris classid='pg_policy', deptype='n'.
//   Ini kesilapan kriteria Arena yang ke-4 dalam Fasa 6, dan yang pertama
//   dikesan oleh Arena sendiri SEBELUM prompt dihantar.
//
//   Kesan operasi yang kini terkod dalam PROMPT-6E: DROP FUNCTION tanpa CASCADE
//   akan GAGAL selagi polisi wujud, jadi urutan selamat ialah
//   REVOKE → DROP TABLE → DROP FUNCTION.
if (hasil[2]) {
  if (hasil[2].length === 0) {
    bad('Y3 kosong — TIDAK DIJANGKA. pg_depend sepatutnya menjejak polisi RLS '
        + '(classid=pg_policy). Jika kosong, query Y3 rosak.');
  } else {
    ok(`Y3 mengembalikan ${hasil[2].length} kebergantungan`);
  }
  // Semua baris mesti pg_policy dengan deptype 'n'
  const bukanPolisi = hasil[2].filter((r) => r.dependent_catalog !== 'pg_policy');
  if (bukanPolisi.length) {
    bad(`Y3 ada kebergantungan bukan pg_policy: ${bukanPolisi.map((r) => r.dependent_catalog).join(', ')}`);
  } else {
    ok("Y3 semua baris classid = pg_policy (deptype 'n') — mengesahkan DROP FUNCTION akan gagal tanpa CASCADE");
  }
  // dependent_name MESTI terlerai kepada "polisi → jadual", bukan NULL.
  // (Query Y3 asal Arena mengembalikan NULL untuk pg_policy — dibetulkan.)
  const nullNama = hasil[2].filter((r) => !r.dependent_name);
  if (nullNama.length) {
    bad(`Y3 dependent_name NULL untuk ${nullNama.length} baris — CASE tidak leraikan pg_policy`);
  } else {
    ok(`Y3 dependent_name terlerai: ${hasil[2].map((r) => r.dependent_name).join(' | ')}`);
  }
  // Bandingkan SET POLISI, bukan bilangan baris.
  //
  //   PENEMUAN (daripada menjalankan ujian ini): satu polisi boleh menghasilkan
  //   LEBIH DARIPADA SATU baris pg_depend, kerana pg_depend merekod satu baris
  //   bagi SETIAP rujukan kepada fungsi. `user_roles_admin_write` merujuk
  //   private.has_role() dalam kedua-dua USING dan WITH CHECK → 2 baris.
  //   Jadi bilangan baris Y3 >= bilangan polisi. Menuntut kesamaan ialah
  //   kriteria yang salah.
  const pol = await db.query(
    `SELECT tablename, policyname FROM pg_policies
      WHERE qual LIKE '%has_role%' OR with_check LIKE '%has_role%' ORDER BY tablename`);
  const setPolisi = [...new Set(hasil[2].map((r) => r.dependent_name))].sort();
  const setPgPolicies = [...new Set(pol.rows.map((r) => `${r.policyname} → ${r.tablename}`))].sort();
  if (JSON.stringify(setPolisi) === JSON.stringify(setPgPolicies)) {
    ok(`set polisi Y3 sepadan pg_policies: ${setPolisi.join(' | ')}`);
    if (hasil[2].length > setPolisi.length) {
      ok(`Y3 ${hasil[2].length} baris untuk ${setPolisi.length} polisi — mengesahkan pg_depend merekod `
         + 'setiap rujukan (USING dan WITH CHECK dikira berasingan)');
    }
  } else {
    bad(`set tidak sepadan. Y3: ${setPolisi.join(' | ')}  pg_policies: ${setPgPolicies.join(' | ')}`);
  }
}

// Y4: mesti mengembalikan TEPAT 2 baris (profiles 1 + user_roles 1 + participants 0)
if (hasil[3]) {
  if (hasil[3].length === 2) ok('Y4 mengembalikan tepat 2 baris (sepadan jangkaan W3 live)');
  else bad(`Y4 sepatutnya 2 baris, dapat ${hasil[3].length}`);
  const tbls = hasil[3].map((r) => r.table_name).sort();
  if (JSON.stringify(tbls) === JSON.stringify(['profiles', 'user_roles'])) {
    ok(`Y4 jadual betul: ${tbls.join(', ')} (programme_participants kosong seperti live)`);
  } else {
    bad(`Y4 jadual tidak sepadan: ${tbls.join(', ')}`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- 5. Larangan: Y mestilah READ-ONLY ---');
for (let i = 0; i < blocks.length; i++) {
  const b = blocks[i].toUpperCase();
  const bahaya = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE', 'ALTER',
                  'GRANT', 'REVOKE', 'CREATE'].filter((k) =>
    new RegExp(`\\b${k}\\b`).test(b.replace(/--[\s\S]*?(\n|$)/g, ' ')));
  if (bahaya.length) bad(`${names[i]} mengandungi kata kunci tulis: ${bahaya.join(', ')}`);
}
ok('tiada blok Y mengandungi DDL/DML/GRANT/REVOKE');

// Y mesti TIDAK melaksanakan private.has_role()
const exec = blocks.some((b) => /SELECT\s+private\.has_role\s*\(/i.test(b));
if (exec) bad('ada blok Y MELAKSANAKAN private.has_role() — larangan 14');
else ok('tiada blok Y melaksanakan private.has_role() (katalog sahaja)');

await db.close();

console.log(`\n${gagal === 0
  ? '🎉 PROMPT-6E DISAHKAN: Y1–Y4 sah, read-only, dan jangkaan Arena terbukti'
  : `🔴 ${gagal} semakan GAGAL`}`);
console.log(`   (lulus ${lulus}, gagal ${gagal})`);
process.exit(gagal === 0 ? 0 : 1);
