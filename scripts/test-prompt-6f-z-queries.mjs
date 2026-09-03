// =============================================================================
// Ujian: blok SQL dalam docs/PROMPT-6F-AUDIT-PRIVATE-SCHEMA-DRIFT.md (Z1–Z5)
// =============================================================================
// Tujuan: mengesahkan kriteria Z1–Z5 SAH dan boleh dijalankan SEBELUM prompt
//         dihantar kepada ChatGPT.
//
// Kenapa wujud — pengajaran kesilapan kriteria Arena #4:
//   Dalam PROMPT-6E, Arena mendakwa "Y3 mungkin kosong, pg_depend tidak menjejak
//   polisi RLS". Dakwaan itu SALAH dan dikesan oleh ujian PGlite sebelum prompt
//   dihantar. Peraturannya kini: setiap jangkaan tentang tingkah laku Postgres
//   yang ditulis ke dalam prompt mesti diuji dahulu.
//
// Persekitaran tiruan di bawah SENGAJA meniru keadaan live yang dilaporkan
// ChatGPT dalam Y1–Y4:
//   - 5 fungsi skema private (append_import_audit, has_role, set_updated_at,
//     validate_programme_lock, write_audit_log)
//   - trigger governance yang MASIH terikat kepada private.* (Senario A)
//   - 3 jadual warisan dengan polisi bergantung kepada private.has_role()
//
// Batasan DIINGATI: PGlite tidak boleh menguji RLS (role postgres = rolsuper,
// rolbypassrls). Ujian ini mengesahkan SINTAKS + BENTUK HASIL + SIFAT READ-ONLY,
// bukan keselamatan.
// =============================================================================

import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';

const DOC = 'docs/PROMPT-6F-AUDIT-PRIVATE-SCHEMA-DRIFT.md';

let lulus = 0;
let gagal = 0;
const ok = (m) => { lulus++; console.log(`  ✅ ${m}`); };
const bad = (m) => { gagal++; console.log(`  ❌ ${m}`); };

// ---------------------------------------------------------------------------
console.log('--- 1. Ekstrak blok SQL daripada PROMPT-6F ---');
if (!fs.existsSync(DOC)) {
  console.log(`  ❌ dokumen tidak dijumpai: ${DOC}`);
  process.exit(1);
}
const doc = fs.readFileSync(DOC, 'utf8');
const blocks = [...doc.matchAll(/```sql\n([\s\S]*?)```/g)].map((m) => m[1]);
if (blocks.length !== 5) bad(`jangkaan 5 blok SQL (Z1–Z5), dapat ${blocks.length}`);
else ok('5 blok SQL ditemui (Z1–Z5)');

const names = blocks.map((b) => (b.match(/'(Z\d_[a-z_]+)'/) || [])[1] || null);
const jangkaan = ['Z1_private_function_metadata', 'Z2_trigger_bindings',
                  'Z3_policies_referencing_private', 'Z4_updated_at_coverage',
                  'Z5_private_function_source'];
if (JSON.stringify(names) === JSON.stringify(jangkaan)) ok(`check_name urutan betul: ${names.join(', ')}`);
else bad(`check_name tidak sepadan. dapat: ${names.join(', ')}`);

// ---------------------------------------------------------------------------
console.log('\n--- 2. Bina persekitaran tiruan (meniru live Y1–Y4) ---');
const db = await PGlite.create();
await db.exec(`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  END $$;

  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE SCHEMA IF NOT EXISTS private;

  CREATE TYPE public.app_role AS ENUM (
    'admin','staff','finance','head_governance','manager','executive','viewer','super_admin');

  -- Stub auth (PGlite tiada Supabase auth)
  CREATE TABLE auth.users (id uuid primary key, email text);
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT null::uuid $$;

  -- ===== 5 fungsi private.* (meniru Y2 live) =====
  CREATE OR REPLACE FUNCTION private.has_role(requested_role text)
    RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$ SELECT true $$;
  CREATE OR REPLACE FUNCTION private.set_updated_at()
    RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
  CREATE OR REPLACE FUNCTION private.validate_programme_lock()
    RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
  CREATE OR REPLACE FUNCTION private.write_audit_log()
    RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
  CREATE OR REPLACE FUNCTION private.append_import_audit(
      p_user_id uuid, p_action text, p_record_id uuid, p_payload jsonb, p_metadata jsonb)
    RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN NULL; END $$;

  -- ===== Padanan public.* dari repo (nama BERBEZA - punca drift) =====
  CREATE OR REPLACE FUNCTION public.has_role(p_role public.app_role)
    RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN true; END $$;
  CREATE OR REPLACE FUNCTION public.enforce_programme_lock()
    RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
  CREATE OR REPLACE FUNCTION public.log_audit()
    RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;

  -- ===== Jadual =====
  CREATE TABLE programmes (id uuid primary key, title text, is_locked boolean default false,
                           updated_at timestamptz default now());
  CREATE TABLE user_profiles (user_id uuid primary key, role public.app_role,
                              updated_at timestamptz default now());
  CREATE TABLE audit_logs (id uuid primary key, created_at timestamptz default now());
  CREATE TABLE profiles (id uuid, full_name text, updated_at timestamptz default now());
  CREATE TABLE user_roles (user_id uuid, role public.app_role);
  CREATE TABLE programme_participants (id uuid);

  -- ===== SENARIO A: trigger governance MASIH pada private.* =====
  CREATE TRIGGER programmes_enforce_lock BEFORE UPDATE ON programmes
    FOR EACH ROW EXECUTE FUNCTION private.validate_programme_lock();
  CREATE TRIGGER programmes_audit BEFORE INSERT ON programmes
    FOR EACH ROW EXECUTE FUNCTION private.write_audit_log();
  CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
  -- satu trigger yang SUDAH dipindahkan ke public (untuk uji pembezaan Z2)
  CREATE TRIGGER user_profiles_audit BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.log_audit();

  -- ===== Polisi warisan bergantung private.has_role (meniru X5/Y3 live) =====
  CREATE POLICY profiles_select_self ON profiles FOR SELECT TO authenticated
    USING (private.has_role('staff'));
  CREATE POLICY profiles_insert_self ON profiles FOR INSERT TO authenticated
    WITH CHECK (private.has_role('staff'));
  CREATE POLICY profiles_update_self ON profiles FOR UPDATE TO authenticated
    USING (private.has_role('staff'));
  CREATE POLICY user_roles_admin_write ON user_roles FOR ALL TO authenticated
    USING (private.has_role('admin')) WITH CHECK (private.has_role('admin'));
  CREATE POLICY user_roles_select ON user_roles FOR SELECT TO authenticated
    USING (private.has_role('admin'));
  CREATE POLICY pp_update ON programme_participants FOR UPDATE TO authenticated
    USING (private.has_role('staff'));
  CREATE POLICY pp_insert ON programme_participants FOR INSERT TO authenticated
    WITH CHECK (private.has_role('staff'));
  CREATE POLICY pp_delete ON programme_participants FOR DELETE TO authenticated
    USING (private.has_role('admin'));

  -- Baris warisan: 1 + 1 + 0 (meniru W3/Y4 live)
  INSERT INTO profiles (id, full_name) VALUES (gen_random_uuid(), 'Uji');
  INSERT INTO user_roles VALUES (gen_random_uuid(), 'admin');
`);
ok('persekitaran Senario A dibina: 5 private.*, 3 public.*, 4 trigger, 8 polisi warisan');

// ---------------------------------------------------------------------------
console.log('\n--- 3. Jalankan setiap blok Z ---');
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
console.log('\n--- 4. Sahkan jangkaan Arena terhadap hasil Z ---');

// Z1: mesti kembalikan kelima-lima fungsi private + kolum owner/search_path
if (hasil[0]) {
  const fns = hasil[0].map((r) => r.function_name).sort();
  const wajib = ['append_import_audit', 'has_role', 'set_updated_at',
                 'validate_programme_lock', 'write_audit_log'];
  const hilang = wajib.filter((f) => !fns.includes(f));
  if (hilang.length) bad(`Z1 tidak menemui: ${hilang.join(', ')}`);
  else ok(`Z1 menemui kelima-lima fungsi private: ${fns.join(', ')}`);

  const kolum = Object.keys(hasil[0][0] || {});
  for (const w of ['owner_role', 'owner_bypasses_rls', 'has_locked_search_path', 'security_definer']) {
    if (!kolum.includes(w)) bad(`Z1 tiada kolum ${w} — ChatGPT tidak dapat jawab kriteria Z1`);
  }
  if (['owner_role', 'owner_bypasses_rls', 'has_locked_search_path', 'security_definer']
        .every((w) => kolum.includes(w))) {
    ok('Z1 mendedahkan owner + bypassrls + search_path terkunci (kriteria Z1 boleh dijawab)');
  }
  // Z1 mesti TIDAK mengembalikan prosrc (connector ChatGPT dihalang daripadanya)
  if (kolum.includes('prosrc')) bad('Z1 mengembalikan prosrc — sepatutnya katalog sahaja');
  else ok('Z1 tidak menyentuh prosrc');
  // Bukti: has_role ialah SECURITY DEFINER (sepadan laporan Y1 ChatGPT)
  const hr = hasil[0].find((r) => r.function_name === 'has_role');
  if (hr && hr.security_definer === true) ok('Z1 mengesahkan private.has_role = SECURITY DEFINER (sepadan Y1 live)');
  else bad(`Z1: has_role security_definer = ${hr && hr.security_definer}, jangkaan true`);
}

// Z2: ⭐ soalan paling penting. Mesti BEZAkan trigger private vs public.
if (hasil[1]) {
  const priv = hasil[1].filter((r) => r.origin && r.origin.includes('private'));
  const publ = hasil[1].filter((r) => r.origin && r.origin.includes('public'));
  if (priv.length === 0) bad('Z2 tidak mengesan sebarang trigger private.* — pembezaan origin rosak');
  else ok(`Z2 mengesan ${priv.length} trigger PRA-REPO (private) dan ${publ.length} trigger repo (public)`);

  // Jangkaan spesifik: governance lock pada private.validate_programme_lock
  const lock = hasil[1].find((r) => r.trigger_name === 'programmes_enforce_lock');
  if (!lock) bad('Z2 tidak menemui trigger programmes_enforce_lock');
  else if (/private\.validate_programme_lock/i.test(lock.executes)) {
    ok(`Z2 MENDEDAHKAN Senario A: programmes_enforce_lock → ${lock.executes.trim()}`);
  } else bad(`Z2: programmes_enforce_lock executes = ${lock.executes}`);

  // dependent_name / executes mesti BUKAN null supaya ChatGPT boleh lapor
  if (hasil[1].some((r) => !r.executes)) bad('Z2 ada baris executes = null');
  else ok('Z2: semua baris ada teks executes (tiada NULL)');
}

// Z3: mesti senaraikan polisi yang merujuk private.*, dengan using_expr terisi
if (hasil[2]) {
  if (hasil[2].length < 8) bad(`Z3 hanya ${hasil[2].length} polisi, jangkaan >= 8`);
  else ok(`Z3 menemui ${hasil[2].length} polisi merujuk private.* (sepadan 8 polisi Y3 live)`);
  const tbls = [...new Set(hasil[2].map((r) => r.table_name))].sort();
  const jangkaanTbl = ['profiles', 'programme_participants', 'user_roles'];
  if (JSON.stringify(tbls) === JSON.stringify(jangkaanTbl)) ok(`Z3 jadual tepat: ${tbls.join(', ')}`);
  else bad(`Z3 jadual: ${tbls.join(', ')} — jangkaan ${jangkaanTbl.join(', ')}`);
  // user_roles_admin_write guna has_role dalam USING + WITH CHECK
  const uraw = hasil[2].find((r) => r.policyname === 'user_roles_admin_write');
  if (uraw && uraw.using_expr && uraw.check_expr) {
    ok('Z3: user_roles_admin_write mendedahkan KEDUA-DUA using_expr dan check_expr');
  } else bad('Z3: user_roles_admin_write tidak mendedahkan kedua-dua ungkapan');
}

// Z4: mesti beza jadual yang ada trigger private vs tidak
if (hasil[3]) {
  const kolum = Object.keys(hasil[3][0] || {});
  if (!kolum.includes('updated_at_origin')) {
    bad('Z4 tiada kolum updated_at_origin — klasifikasi khusus trigger updated_at hilang');
  } else {
    // Dalam persekitaran tiruan: HANYA profiles patut 🔴 (trigger updated_at
    // private). programmes & user_profiles ada kolum updated_at tetapi trigger
    // updated_at mereka bukan private (atau tiada) — versi Z4 yang lama
    // tersalah klasifikasi kedua-duanya sebagai 🔴 kerana ia mengimbas SEMUA
    // trigger pada jadual.
    const merah = hasil[3].filter((r) => (r.updated_at_origin || '').includes('private'));
    if (merah.length === 1 && merah[0].table_name === 'profiles') {
      ok('Z4 TEPAT: hanya profiles 🔴 private.set_updated_at (tiada positif palsu)');
    } else {
      bad(`Z4 mengelas ${merah.length} jadual sebagai private: ${merah.map((r) => r.table_name).join(', ')} — jangkaan hanya 'profiles'`);
    }
  }
  // programmes mesti TIDAK dikelaskan private walaupun ada trigger private lain
  const prog = hasil[3].find((r) => r.table_name === 'programmes');
  if (!prog) {
    bad('Z4 tidak menyenaraikan programmes (ia ada kolum updated_at)');
  } else if ((prog.updated_at_origin || '').includes('private')) {
    bad(`Z4 POSITIF PALSU: programmes dikelaskan private kerana programmes_enforce_lock — ${prog.updated_at_origin}`);
  } else {
    ok(`Z4 menolak positif palsu: programmes → "${prog.updated_at_origin}" walaupun ada trigger private lain (${prog.semua_trigger_count} trigger keseluruhan)`);
  }
}

// Z5: mesti kembalikan prosrc (atau gagal dengan jelas di live)
if (hasil[4]) {
  if (hasil[4].length !== 5) bad(`Z5 ${hasil[4].length} baris, jangkaan 5`);
  else ok('Z5 mengembalikan 5 badan fungsi (di PGlite prosrc tersedia; di live mungkin dihalang)');
  if (hasil[4].every((r) => r.source && r.source.length > 0)) ok('Z5: semua source terisi');
}

// ---------------------------------------------------------------------------
console.log('\n--- 5. Larangan: Z mestilah READ-ONLY ---');
for (let i = 0; i < blocks.length; i++) {
  // Buang KOMEN dan RENTETAN sebelum mengimbas. Kedua-duanya menyebabkan
  // positif palsu yang Arena sendiri temui semasa menjalankan ujian ini:
  //   - komen Arena menyebut "prosrc" dan "CREATE OR REPLACE"
  //   - Z4 mengandungi rentetan 'UPDATE' (penapis event_manipulation) dan
  //     'set_updated_at', bukan pernyataan UPDATE
  // Jadi yang diimbas ialah KOD SQL sahaja.
  const kod = blocks[i]
    .replace(/--[^\n]*/g, ' ')        // komen baris
    .replace(/'[^']*'/g, "''")         // rentetan single-quote
    .replace(/"[^"]*"/g, '""')         // pengecam double-quote
    .toUpperCase();
  const bahaya = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE', 'ALTER',
                  'GRANT', 'REVOKE', 'CREATE'].filter((k) => new RegExp(`\\b${k}\\b`).test(kod));
  if (bahaya.length) bad(`${names[i]} mengandungi kata kunci tulis dalam KOD: ${bahaya.join(', ')}`);
}
ok('tiada blok Z mengandungi DDL/DML/GRANT/REVOKE');

const execPrivate = blocks.some((b) =>
  /SELECT\s+private\.[a-z_]+\s*\(/i.test(b.replace(/--[^\n]*/g, ' ')));
if (execPrivate) bad('ada blok Z MELAKSANAKAN fungsi private.* — larangan 14');
else ok('tiada blok Z melaksanakan fungsi private.* (katalog sahaja)');

// Z2/Z4 bergantung kepada information_schema, bukan prosrc — sahkan
for (const idx of [1, 3]) {
  const kod = blocks[idx].replace(/--[^\n]*/g, ' ');
  if (/prosrc/i.test(kod)) bad(`${names[idx]} bergantung kepada prosrc — akan dihalang connector`);
}
ok('Z2 dan Z4 tidak bergantung kepada prosrc (guna information_schema.triggers)');

// Z3 bergantung kepada pg_policies.qual (teks terbitan katalog) — sahkan
if (!/pg_policies/i.test(blocks[2])) bad('Z3 tidak menggunakan pg_policies');
else ok('Z3 menggunakan pg_policies.qual/with_check (boleh dibaca walaupun prosrc dihalang)');

await db.close();

console.log(`\n${gagal === 0
  ? '🎉 PROMPT-6F DISAHKAN: Z1–Z5 sah, read-only, dan mampu menjawab kriteria'
  : `🔴 ${gagal} semakan GAGAL`}`);
console.log(`   (lulus ${lulus}, gagal ${gagal})`);
process.exit(gagal === 0 ? 0 : 1);
