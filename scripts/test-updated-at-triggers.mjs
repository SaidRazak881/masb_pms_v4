// =============================================================================
// Ujian: lib/supabase/updated-at-triggers.sql (Fasa 6G)
// =============================================================================
// Mencelah kecacatan repo yang didedahkan oleh audit Z (PROMPT-6F):
//   - Repo mencipta kolum `updated_at` pada 10 jadual rasmi tetapi TIDAK PERNAH
//     mencipta fungsi/trigger untuk mengemas kininya.
//   - Di live, 6 jadual rasmi ada kolum updated_at tetapi 0 trigger.
//   - 5 jadual rasmi + profiles berfungsi HANYA kerana private.set_updated_at()
//     dicipta secara manual pra-repo.
//
// Ujian ini membina DB tiruan yang MENIRU keadaan live (trigger pra-repo pada
// 5 jadual, tiada trigger pada 6 jadual), memasang fail 6G, dan mengesahkan:
//   1. Semua 12 jadual kini ada trigger → public.set_updated_at()
//   2. TIADA trigger yang masih merujuk private.set_updated_at()
//   3. updated_at BENAR-BENAR dikemas kini pada UPDATE (bukti berkelakuan)
//   4. Idempoten — pasang dua kali, tiada trigger berganda
//
// Batasan DIINGATI: PGlite tidak boleh menguji RLS. Fail ini tidak menyentuh
// RLS/polisi/privilej, jadi batasan itu tidak menghalang ujian ini.
// =============================================================================
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';

const SQL = 'lib/supabase/updated-at-triggers.sql';
let lulus = 0, gagal = 0;
const ok = (m) => { lulus++; console.log(`  ✅ ${m}`); };
const bad = (m) => { gagal++; console.log(`  ❌ ${m}`); };

const sql = fs.readFileSync(SQL, 'utf8');

// 5 jadual yang di live ada trigger pra-repo (Z2/Z4)
const ADA_TRIGGER_LAMA = ['import_staging','invoices','participants','programme_costs','programmes'];
// 6 jadual rasmi yang di live ada updated_at tetapi 0 trigger (Z4)
const TIADA_TRIGGER = ['app_settings','cost_items','financial_docs','organizers','programme_documents','user_profiles'];
const SEMUA = [...ADA_TRIGGER_LAMA, ...TIADA_TRIGGER];

console.log('--- 1. Bina DB tiruan yang meniru keadaan LIVE ---');
const db = await PGlite.create();
await db.exec(`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  END $$;
  CREATE SCHEMA IF NOT EXISTS private;
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE auth.users(id uuid primary key);

  -- Fungsi pra-repo (badan disahkan daripada Z5)
  CREATE OR REPLACE FUNCTION private.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
`);
// Jadual + trigger seperti live
for (const t of SEMUA) {
  await db.exec(`CREATE TABLE public.${t} (id uuid primary key DEFAULT gen_random_uuid(), nama text, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
}
for (const t of ADA_TRIGGER_LAMA) {
  await db.exec(`CREATE TRIGGER trg_${t}_updated_at BEFORE UPDATE ON public.${t} FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();`);
}
// profiles (warisan) — ada trigger pra-repo di live
await db.exec(`CREATE TABLE public.profiles (id uuid primary key DEFAULT gen_random_uuid(), full_name text, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
await db.exec(`CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();`);

const kiraLama = await db.query(`SELECT count(*)::int n FROM information_schema.triggers WHERE action_statement ILIKE '%private.set_updated_at%'`);
console.log(`  trigger pra-repo (private) sebelum pasang: ${kiraLama.rows[0].n}  [jangkaan 6 = 5 rasmi + profiles]`);
if (kiraLama.rows[0].n === 6) ok('keadaan live ditiru dengan tepat (6 trigger private)');
else bad(`jangkaan 6 trigger private, dapat ${kiraLama.rows[0].n}`);

console.log('\n--- 2. Pasang lib/supabase/updated-at-triggers.sql ---');
try { await db.exec(sql); ok('pemasangan berjaya (tiada ralat)'); }
catch (e) { bad(`pemasangan GAGAL: ${e.message.split('\n')[0]}`); }

console.log('\n--- 3. Sahkan semua jadual kini guna public.set_updated_at() ---');
const trig = await db.query(`
  SELECT event_object_table AS tbl, trigger_name, action_statement AS exec
    FROM information_schema.triggers
   WHERE trigger_schema='public' AND action_statement ILIKE '%set_updated_at%'
   ORDER BY event_object_table`);
const masihPrivate = trig.rows.filter(r => /private\./i.test(r.exec));
if (masihPrivate.length) bad(`MASIH ada ${masihPrivate.length} trigger private: ${masihPrivate.map(r=>r.tbl).join(', ')}`);
else ok('TIADA trigger merujuk private.set_updated_at() — semua dialih ke public');

const tblCovered = [...new Set(trig.rows.map(r => r.tbl))].sort();
const hilang = [...SEMUA, 'profiles'].filter(t => !tblCovered.includes(t));
if (hilang.length) bad(`jadual tanpa trigger: ${hilang.join(', ')}`);
else ok(`semua ${tblCovered.length} jadual ada trigger public.set_updated_at(): ${tblCovered.join(', ')}`);

// Tiada trigger berganda
const ganda = trig.rows.length !== tblCovered.length;
if (ganda) bad(`trigger berganda: ${trig.rows.length} trigger untuk ${tblCovered.length} jadual`);
else ok('tiada trigger berganda (1 trigger per jadual)');

console.log('\n--- 4. Bukti BERKELAKUAN: updated_at benar-benar dikemas kini ---');
// Jadual yang DULU tiada trigger — ini kecacatan sebenar yang dibaiki
for (const t of ['user_profiles','cost_items','financial_docs']) {
  const ins = await db.query(`INSERT INTO public.${t} (nama) VALUES ('asal') RETURNING updated_at`);
  const before = new Date(ins.rows[0].updated_at).getTime();
  await db.query(`SELECT pg_sleep(0.02)`);
  const upd = await db.query(`UPDATE public.${t} SET nama='ubah' RETURNING updated_at`);
  const after = new Date(upd.rows[0].updated_at).getTime();
  if (after > before) ok(`${t}: updated_at dikemas kini (${before} → ${after})`);
  else bad(`${t}: updated_at TIDAK berubah (${before} = ${after}) — trigger tidak berfungsi`);
}
// Jadual yang DULU ada trigger pra-repo — mesti terus berfungsi selepas dialih
for (const t of ['programmes','participants']) {
  const ins = await db.query(`INSERT INTO public.${t} (nama) VALUES ('asal') RETURNING updated_at`);
  const before = new Date(ins.rows[0].updated_at).getTime();
  await db.query(`SELECT pg_sleep(0.02)`);
  const upd = await db.query(`UPDATE public.${t} SET nama='ubah' RETURNING updated_at`);
  const after = new Date(upd.rows[0].updated_at).getTime();
  if (after > before) ok(`${t} (dialih dari private): updated_at masih berfungsi`);
  else bad(`${t}: updated_at ROSAK selepas pengalihan`);
}

console.log('\n--- 5. Idempotensi: pasang semula ---');
try {
  await db.exec(sql);
  const t2 = await db.query(`SELECT count(*)::int n FROM information_schema.triggers WHERE trigger_schema='public' AND action_statement ILIKE '%set_updated_at%'`);
  if (t2.rows[0].n === tblCovered.length) ok(`pasang 2x: masih ${t2.rows[0].n} trigger (tiada berganda)`);
  else bad(`pasang 2x: ${t2.rows[0].n} trigger, jangkaan ${tblCovered.length}`);
} catch (e) { bad(`pasang semula GAGAL: ${e.message.split('\n')[0]}`); }

console.log('\n--- 6. private.set_updated_at kini YATIM (boleh dibuang kelak) ---');
const baki = await db.query(`
  SELECT count(*)::int n FROM information_schema.triggers
   WHERE action_statement ILIKE '%private.set_updated_at%'`);
if (baki.rows[0].n === 0) ok('0 trigger merujuk private.set_updated_at — ia kini yatim sepenuhnya');
else bad(`masih ${baki.rows[0].n} rujukan`);
const masihWujud = await db.query(`SELECT count(*)::int n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='private' AND p.proname='set_updated_at'`);
if (masihWujud.rows[0].n === 1) ok('fungsi private.set_updated_at MASIH wujud (fail ini tidak DROP apa-apa — betul)');
else bad('fail ini telah DROP private.set_updated_at — sepatutnya tidak');

console.log('\n--- 7. Query PENGESAHAN dalam fail SQL (versi katalog) ---');
// Pengajaran daripada pelaksanaan PROMPT-6G (2026-09-04):
//   information_schema.triggers.action_statement HANYA mengkualifikasikan skema
//   apabila fungsi BUKAN dalam search_path lalai. Jadi:
//     private.set_updated_at() -> "EXECUTE FUNCTION private.set_updated_at()"
//     public.set_updated_at()  -> "EXECUTE FUNCTION set_updated_at()"  (TIADA skema)
//   Pengelasan asal G1 (`ILIKE '%public.%'`) memulangkan "tidak dikualifikasi"
//   untuk kesemua 12 trigger SELEPAS migrasi — kriteria GAGAL walaupun kerja
//   itu betul. ChatGPT yang menangkap ini di live.
const act = await db.query(
  `SELECT event_object_table AS tbl, action_statement FROM information_schema.triggers
    WHERE trigger_schema='public' AND action_statement ILIKE '%set_updated_at%'`);
const adaSkema = act.rows.filter((r) => /public\./i.test(r.action_statement)).length;
const tanpaSkema = act.rows.filter((r) => !/public\.|private\./i.test(r.action_statement)).length;
console.log(`  action_statement: ${adaSkema} mengandungi "public.", ${tanpaSkema} TANPA skema`);
if (tanpaSkema > 0 && adaSkema === 0) {
  ok(`DISAHKAN: selepas migrasi, action_statement TIDAK mengkualifikasikan public `
     + `(${tanpaSkema}/${act.rows.length} tanpa skema) — pengelasan berasaskan teks GAGAL di sini`);
} else {
  console.log(`  (nota: PGlite mungkin memaparkan skema; live tidak — lihat laporan 6G)`);
}

// Query katalog yang sah (kini embedded dalam fail SQL sebagai PENGESAHAN)
const kat = await db.query(`
  SELECT n.nspname AS function_schema, p.proname AS function_name,
         c.relname AS table_name, tg.tgname AS trigger_name
    FROM pg_trigger tg
    JOIN pg_class c     ON c.oid = tg.tgrelid
    JOIN pg_proc p      ON p.oid = tg.tgfoid
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE NOT tg.tgisinternal
     AND c.relnamespace = 'public'::regnamespace
     AND p.proname = 'set_updated_at'
   ORDER BY c.relname`);
if (kat.rows.length !== tblCovered.length) {
  bad(`query katalog: ${kat.rows.length} baris, jangkaan ${tblCovered.length}`);
} else {
  ok(`query katalog: ${kat.rows.length} baris (sepadan bilangan jadual)`);
}
const bukanPublic = kat.rows.filter((r) => r.function_schema !== 'public');
if (bukanPublic.length) {
  bad(`masih ada trigger ke skema bukan public: ${bukanPublic.map((r) => `${r.table_name}->${r.function_schema}`).join(', ')}`);
} else {
  ok('query katalog: SEMUA function_schema = public — pengesahan kejayaan migrasi yang SAH');
}

// Baki private melalui katalog (setara G2)
const bakiKat = await db.query(`
  SELECT count(*)::int AS baki FROM pg_trigger tg
    JOIN pg_proc p ON p.oid = tg.tgfoid
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE NOT tg.tgisinternal AND n.nspname='private' AND p.proname='set_updated_at'`);
if (bakiKat.rows[0].baki === 0) ok('G2 (versi katalog): baki_private = 0');
else bad(`G2 (versi katalog): baki = ${bakiKat.rows[0].baki}`);

await db.close();
console.log(`\n${gagal===0 ? '🎉 updated-at-triggers.sql DISAHKAN' : `🔴 ${gagal} GAGAL`}  (lulus ${lulus}, gagal ${gagal})`);
process.exit(gagal===0?0:1);
