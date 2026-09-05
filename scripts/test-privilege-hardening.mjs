/**
 * test-privilege-hardening.mjs — Ujian PGlite bagi Fasa 8C
 * ========================================================
 *
 * MENGAPA UJIAN INI WUJUD
 * -----------------------
 * 8C menyentuh permukaan yang paling luas setakat ini: `current_user_role()`
 * dipanggil oleh `has_role()`, yang dipanggil oleh **polisi RLS di seluruh
 * sistem** (Fasa 6). DP-17.4(a) ditangguh ke gate ini tepat kerana ia
 * memerlukan suite penuh dijalankan semula — jadi ujian ini ialah suite itu
 * bagi bahagian 8C.
 *
 * Prinsip: **ukur lubang itu SEBELUM, dan ukur ia tertutup SELEPAS.** Ujian
 * yang hanya memeriksa keadaan selepas tidak dapat membezakan "migration
 * menutup lubang" daripada "lubang itu tidak pernah wujud dalam fixture".
 *
 * Yang diukur:
 *   A. SEBELUM: `anon` boleh execute semua fungsi (fixture kini memodelkan
 *      *default privileges* platform — DP-20.4), dan akaun **blocked**
 *      berperanan `finance` MASIH `can_resolve = true` (lubang DP-17.4(a)).
 *   B. SELEPAS: `anon` = 0 bagi semua fungsi TPMS; `authenticated` dikekalkan;
 *      akaun blocked → `viewer`; 19 pengguna aktif TIDAK berubah.
 *   C. DP-17.4(b): backfill tanpa token → 42501; token sekali-guna; hanya
 *      Super Admin boleh mencipta token; sebab minimum 12 aksara.
 *   D. DP-14.2: calon `super_admin` dan calon blocked DITOLAK oleh backfill
 *      dan **DILAPORKAN** oleh `am_backfill_pengecualian()` — bukan NULL senyap.
 *   E. Pewarisan mati: fungsi yang dicipta SELEPAS migration tidak mendapat
 *      `anon`.
 *   F. Idempoten: migration boleh dijalankan dua kali.
 *   G. Tidak merosakkan yang sedia ada: resolusi DP-8/DP-9, veto §2.4, dan
 *      `am_confirm_alias()` masih berkelakuan sama (DP-14.2 Posisi C —
 *      resolver TIDAK disempitkan).
 *
 * Jalankan: node scripts/test-privilege-hardening.mjs
 */
import fs from 'fs';
import { binaFixture, pasangLangkah, sebagaiPengguna, uuidProfil } from './lib/fixture-live.mjs';

let pass = 0;
let fail = 0;
const ok = (m) => { pass++; console.log(`  ✅ ${m}`); };
const bad = (m) => { fail++; console.log(`  ❌ ${m}`); };
const eq = (a, e, m) => (JSON.stringify(a) === JSON.stringify(e)
  ? ok(m)
  : bad(`${m} — dapat ${JSON.stringify(a)}, jangkaan ${JSON.stringify(e)}`));
const truthy = (v, m) => (v ? ok(m) : bad(m));
const section = (t) => console.log(`\n${'─'.repeat(62)}\n${t}\n${'─'.repeat(62)}`);

const LANGKAH_123 = [
  'lib/supabase/client-master.sql',
  'lib/supabase/external-account-managers.sql',
  'lib/supabase/account-manager-resolution.sql',
];
// Susunan live: L1-L3 dipasang, kemudian seed L4 (3 alias DP-8 + 1 luar DP-9)
// dijalankan oleh ChatGPT pada 2026-09-05. 8C akan dipasang SELEPAS itu, jadi
// ujian ini mengikut susunan yang sama — dan dengan itu mengesahkan 8C boleh
// diterapkan ke atas keadaan live yang sedia ada, bukan ke atas fixture kosong.
const SEED = 'lib/supabase/seed-account-manager-aliases.sql';
const MIGRASI_8C = 'lib/supabase/privilege-hardening.sql';
const teks8C = fs.readFileSync(MIGRASI_8C, 'utf8');

const { db } = await binaFixture();
await pasangLangkah(db, LANGKAH_123);

// Seed L4 memerlukan identiti yang berkuasa (ia memanggil am_confirm_alias /
// am_confirm_external, dua-duanya berpagar can_resolve_account_managers()).
// Pada live, ChatGPT menetapkan `request.jwt.claims` kepada Super Admin; dalam
// PGlite sumber identiti ialah stub `auth.uid()`.
const adminUuid = await uuidProfil(db, 'Admin');        // super_admin, aktif
await sebagaiPengguna(db, adminUuid);
await pasangLangkah(db, [SEED]);
const adilahUuid = await uuidProfil(db, 'Adilah');      // finance, aktif
const fuziahUuid = await uuidProfil(db, 'Fuziah');
const sholihinUuid = await uuidProfil(db, 'Sholihin');
const testUuid = await uuidProfil(db, 'test');          // staff, blocked

/** Objek platform Supabase yang 8C SENGAJA kecualikan (senarai v_platform). */
const PLATFORM = ['pgrst_ddl_watch', 'pgrst_drop_watch'];

// Simulasikan objek platform Supabase dalam `public`. J0 live (2026-09-05)
// melaporkan **53** objek fungsi sedangkan inventori repo ada **52** nama;
// `pgrst_ddl_watch`/`pgrst_drop_watch` ialah calon utama delta itu (fungsi event
// trigger milik platform, bukan ahli extension). Dengan stub ini, ujian dapat
// membuktikan senarai pengecualian benar-benar melindungi objek platform —
// bukan sekadar mendakwanya dalam komen.
for (const fn of PLATFORM) {
  await db.exec(`CREATE OR REPLACE FUNCTION public.${fn}() RETURNS event_trigger
                 LANGUAGE plpgsql AS $$ BEGIN NULL; END $$;`);
}

const postur = async () => (await db.query(`
  SELECT count(*)::int AS jumlah,
         count(*) FILTER (WHERE p.proname <> ALL($1::text[]))::int AS jumlah_tpms,
         count(*) FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE')
                            AND p.proname <> ALL($1::text[]))::int AS anon_boleh,
         count(*) FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE')
                            AND p.proname = ANY($1::text[]))::int AS platform_anon,
         count(*) FILTER (WHERE has_function_privilege('authenticated', p.oid, 'EXECUTE')
                            AND p.proname <> ALL($1::text[]))::int AS auth_boleh
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'`, [PLATFORM])).rows[0];

const boleh = async () => (await db.query(
  `SELECT public.can_resolve_account_managers() AS boleh`)).rows[0].boleh;
const stafDilihat = async () => (await db.query(
  `SELECT count(*)::int AS n FROM public.am_list_staff()`)).rows[0].n;

/** Buat satu invois dengan nilai `account_manager` tertentu (untuk ujian). */
const invoisDengan = async (nilai) => {
  const kod = `UJI-${Math.random().toString(36).slice(2, 8)}`;
  await db.query(`INSERT INTO public.programmes (programme_code, title, organizer_name)
                  VALUES ($1, 'Program Ujian 8C', 'Org Ujian')`, [kod]);
  await db.query(`INSERT INTO public.invoices (programme_id, account_manager)
                  SELECT id, $2 FROM public.programmes WHERE programme_code = $1`, [kod, nilai]);
  return kod;
};
const isiInvois = async () => (await db.query(
  `SELECT count(*)::int n FROM public.invoices WHERE account_manager_id IS NOT NULL`)).rows[0].n;

/* ===================================================================== */
section('BAHAGIAN A — SEBELUM 8C: ukur lubang itu wujud dalam fixture');

// Invarian "tidak mengganggu skema lain": kira fungsi DI LUAR `public` yang
// memegang anon EXECUTE SEBELUM migration, supaya Bahagian E boleh menuntut
// jumlahnya TIDAK BERUBAH. Diukur sebelum, dibandingkan selepas — bukan
// assertions yang sentiasa benar.
const anonLuarPublic = async () => (await db.query(`
  SELECT count(*)::int n FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
   WHERE ns.nspname <> 'public'
     AND has_function_privilege('anon', p.oid, 'EXECUTE')`)).rows[0].n;
const luarPublicSebelum = await anonLuarPublic();

const sebelum = await postur();
// Nota skop: fixture memasang FAIL_ASAS + Langkah 1–3 sahaja (38 fungsi),
// manakala inventori penuh repo ialah 52. Seksyen 2 migration menyenaraikan
// kesemua 52 mengikut NAMA dan melaporkan yang tidak ditemui sebagai `tiada`
// (RAISE WARNING, bukan ralat) — jadi subset fixture ini sah, bukan kekurangan.
truthy(sebelum.jumlah_tpms >= 30,
  `sekurang-kurangnya 30 fungsi TPMS dalam fixture (dapat ${sebelum.jumlah_tpms}; jumlah termasuk stub platform = ${sebelum.jumlah})`);
eq(sebelum.anon_boleh, sebelum.jumlah_tpms,
  'SEBELUM: `anon` boleh execute SEMUA fungsi TPMS (pewarisan default privileges platform, DP-20.4)');
eq(sebelum.platform_anon, PLATFORM.length,
  `SEBELUM: ${PLATFORM.length} stub platform juga mewarisi anon (meniru keadaan live)`);

// Lubang DP-17.4(a): akaun blocked berperanan finance masih berkuasa.
await db.query(`UPDATE public.user_profiles
                   SET is_active = false, account_status = 'blocked'
                 WHERE id = $1`, [adilahUuid]);
await sebagaiPengguna(db, adilahUuid);
eq(await boleh(), true,
  'SEBELUM: akaun blocked berperanan finance MASIH can_resolve = true (lubang DP-17.4(a) diukur)');
// 18, bukan 19: `am_list_staff()` sudah menapis is_active=true, dan Adilah
// baru disekat. Ini menunjukkan penapis SENARAI sudah ada sejak 8A — yang
// TIADA ialah penapis KUASA (can_resolve), dan itulah yang 8C tutup.
eq(await stafDilihat(), 18,
  'SEBELUM: akaun blocked itu masih boleh menyenaraikan 18 staf yang tinggal');
await db.query(`UPDATE public.user_profiles
                   SET is_active = true, account_status = 'active'
                 WHERE id = $1`, [adilahUuid]);

/* ===================================================================== */
section('BAHAGIAN B — pasang 8C, kemudian ukur semula');

await db.exec(teks8C);
const selepas = await postur();
eq(selepas.anon_boleh, 0,
  'SELEPAS: TIADA fungsi TPMS yang boleh dipanggil oleh `anon`');
eq(selepas.platform_anon, PLATFORM.length,
  `SELEPAS: ${PLATFORM.length} objek platform DILANGKAU — capaian anon mereka TIDAK dirampas (senarai pengecualian benar-benar berkesan, bukan hanya didakwa dalam komen)`);
eq(selepas.auth_boleh, selepas.jumlah_tpms,
  'SELEPAS: `authenticated` dikekalkan bagi SEMUA fungsi TPMS (tiada aliran aplikasi terputus)');
truthy(selepas.jumlah_tpms >= sebelum.jumlah_tpms + 3,
  `SELEPAS: 3 fungsi baharu wujud (am_calon_layak, am_backfill_authorize, am_backfill_pengecualian): ${sebelum.jumlah_tpms} -> ${selepas.jumlah_tpms}`);

// DP-17.4(a) tertutup
await db.query(`UPDATE public.user_profiles
                   SET is_active = false, account_status = 'blocked'
                 WHERE id = $1`, [adilahUuid]);
await sebagaiPengguna(db, adilahUuid);
eq(await boleh(), false,
  'DP-17.4(a) TERTUTUP: akaun blocked berperanan finance -> can_resolve = false');
eq(await stafDilihat(), 0,
  'DP-17.4(a): akaun blocked melihat 0 staf (deny-by-default)');
eq((await db.query(`SELECT public.current_user_role()::text AS r`)).rows[0].r, 'viewer',
  'DP-17.4(a): current_user_role() jatuh kepada viewer untuk akaun blocked');
eq((await db.query(`SELECT public.current_role_name() AS r`)).rows[0].r, 'viewer',
  'DP-17.4(a): current_role_name() juga jatuh kepada viewer');

// Pengguna sah TIDAK terjejas
await db.query(`UPDATE public.user_profiles
                   SET is_active = true, account_status = 'active'
                 WHERE id = $1`, [adilahUuid]);
await sebagaiPengguna(db, adilahUuid);
eq(await boleh(), true, 'finance yang aktif semula -> can_resolve = true (tiada kerosakan kekal)');
eq(await stafDilihat(), 19, 'finance aktif masih melihat 19 staf');
await sebagaiPengguna(db, adminUuid);
eq(await boleh(), true, 'super_admin aktif -> can_resolve = true');
eq(await stafDilihat(), 19, 'super_admin aktif -> 19 staf');
await sebagaiPengguna(db, testUuid);
eq(await boleh(), false, 'akaun `test` (blocked sejak asal) -> can_resolve = false');

// Kekangan NULL — DIUKUR, bukan diandaikan.
// Kedua-dua lajur ialah NOT NULL, jadi bentuk toleran NULL dalam migration
// (`is_active IS NOT FALSE`, `coalesce(account_status,'active')`) TIDAK boleh
// terpicu dalam skema semasa: ia pertahanan berlapis, bukan pembaikan baris
// warisan. Ujian ini mengunci fakta itu supaya komen tidak boleh drift
// daripada skema tanpa dikesan (draft awal fail SQL mendakwa is_active boleh
// NULL — dakwaan itu salah dan ditangkap di sini).
const bolehNull = async (kolum) =>
  (await db.query(`
    SELECT is_nullable AS n FROM information_schema.columns
     WHERE table_schema='public' AND table_name='user_profiles'
       AND column_name=$1`, [kolum])).rows[0].n;
eq(await bolehNull('is_active'), 'NO',
  'diukur: is_active ialah NOT NULL (schema-master.sql:311)');
eq(await bolehNull('account_status'), 'NO',
  'diukur: account_status ialah NOT NULL (user-management.sql:139)');
let ralatNull = null;
try {
  await db.query(`UPDATE public.user_profiles SET is_active = NULL WHERE id = $1`, [adilahUuid]);
} catch (e) { ralatNull = e; }
truthy(ralatNull && ralatNull.code === '23502',
  `diukur: menulis NULL kepada is_active ditolak (23502) — jadi toleransi NULL ialah pertahanan berlapis sahaja: ${ralatNull?.code ?? 'tiada ralat'}`);

// Semantik PENDING — yang benar-benar boleh diuji dan bermakna.
await sebagaiPengguna(db, adilahUuid);
await db.query(`UPDATE public.user_profiles
                   SET account_status = 'pending'::public.account_status WHERE id = $1`, [adilahUuid]);
eq(await boleh(), false,
  'DP-17.4(a): akaun PENDING (belum diluluskan Super Admin) tidak memegang kuasa');
eq(await stafDilihat(), 0, 'akaun pending melihat 0 staf (deny-by-default)');

await db.query(`UPDATE public.user_profiles
                   SET account_status = 'active'::public.account_status WHERE id = $1`, [adilahUuid]);
eq(await boleh(), true, 'selepas diluluskan semula -> kuasa pulih (tiada kerosakan kekal)');

// search_path dipin (fungsi SECURITY DEFINER)
const pin = (await db.query(`
  SELECT p.proname, p.proconfig::text AS cfg
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname='public'
     AND p.proname IN ('current_user_role','current_role_name','am_calon_layak',
                       'am_backfill_authorize','am_backfill_account_manager',
                       'am_backfill_pengecualian')
   ORDER BY p.proname`)).rows;
for (const r of pin) {
  truthy(/search_path=public/.test(r.cfg ?? ''), `${r.proname}: search_path dipin (tiada hijack)`);
}

/* ===================================================================== */
section('BAHAGIAN C — DP-17.4(b): gate backfill yang dikuatkuasakan');

// C1: tanpa token -> 42501, walaupun peranan berkuasa
await sebagaiPengguna(db, adminUuid);
let ralat = null;
try { await db.query(`SELECT * FROM public.am_backfill_account_manager(NULL)`); }
catch (e) { ralat = e; }
truthy(ralat && /42501|tiada kuasa|gate 8C/i.test(ralat.message),
  `backfill TANPA token ditolak (42501): ${ralat?.message?.slice(0, 60) ?? 'tiada ralat'}`);

// C2: bukan Super Admin tidak boleh mencipta token
await sebagaiPengguna(db, adilahUuid);
ralat = null;
try { await db.query(`SELECT public.am_backfill_authorize('Ujian sebab yang cukup panjang')`); }
catch (e) { ralat = e; }
truthy(ralat && /42501|Super Admin/i.test(ralat.message),
  'am_backfill_authorize: finance DITOLAK (Super Admin sahaja)');

// C3: sebab terlalu pendek ditolak
await sebagaiPengguna(db, adminUuid);
ralat = null;
try { await db.query(`SELECT public.am_backfill_authorize('pendek')`); }
catch (e) { ralat = e; }
truthy(ralat && /22023|terlalu pendek/i.test(ralat.message),
  'am_backfill_authorize: sebab < 12 aksara DITOLAK (jejak audit)');

// C4: token sah -> backfill berjalan; token sekali-guna
const token = (await db.query(
  `SELECT public.am_backfill_authorize($1)::text AS t`,
  ['Kebenaran backfill ujian 8C — data sudah disahkan manusia.']))
  .rows[0].t;
truthy(/^[0-9a-f-]{36}$/.test(token), 'token kebenaran dicipta oleh Super Admin');

await invoisDengan('Fuziah');
const sebelumIsi = await isiInvois();
const hasil = (await db.query(
  `SELECT * FROM public.am_backfill_account_manager($1::uuid)`, [token])).rows;
eq(hasil.length, 2, 'backfill memulangkan 2 baris (invoices + import_staging)');
truthy((await isiInvois()) > sebelumIsi, 'backfill mengisi sekurang-kurangnya satu baris');

ralat = null;
try { await db.query(`SELECT * FROM public.am_backfill_account_manager($1::uuid)`, [token]); }
catch (e) { ralat = e; }
truthy(ralat && /42501|sudah digunakan/i.test(ralat.message),
  'token SEKALI-GUNA: penggunaan kedua ditolak');

// C5: token rekaan ditolak
ralat = null;
try {
  await db.query(`SELECT * FROM public.am_backfill_account_manager($1::uuid)`,
    ['00000000-0000-4000-8000-000000000000']);
} catch (e) { ralat = e; }
truthy(ralat && /42501|tidak wujud/i.test(ralat.message), 'token yang tidak wujud ditolak');

/* ===================================================================== */
section('BAHAGIAN D — DP-14.2: penolakan calon DILAPORKAN, bukan NULL senyap');

// D1: calon super_admin ('Admin' ialah profil super_admin yang unik)
await invoisDengan('Admin');
// D2: calon blocked
await db.query(`UPDATE public.user_profiles SET is_active = false, account_status = 'blocked'
                 WHERE id = $1`, [sholihinUuid]);
await invoisDengan('Sholihin');

const pengecualian = (await db.query(
  `SELECT * FROM public.am_backfill_pengecualian() ORDER BY nilai_mentah`)).rows;
truthy(pengecualian.length >= 2,
  `laporan pengecualian menyenaraikan calon tidak layak (dapat ${pengecualian.length})`);
const adminExc = pengecualian.find((r) => r.nilai_mentah === 'Admin');
truthy(adminExc, "'Admin' muncul dalam laporan pengecualian");
truthy(/super_admin/i.test(adminExc?.sebab ?? ''),
  `sebab dinyatakan untuk super_admin: "${adminExc?.sebab}"`);
const sholihinExc = pengecualian.find((r) => r.nilai_mentah === 'Sholihin');
truthy(sholihinExc, "'Sholihin' (blocked) muncul dalam laporan pengecualian");
truthy(/tidak aktif|is_active/i.test(sholihinExc?.sebab ?? ''),
  `sebab dinyatakan untuk akaun blocked: "${sholihinExc?.sebab}"`);

// D3: backfill TIDAK mengikat calon yang tidak layak
const token2 = (await db.query(
  `SELECT public.am_backfill_authorize($1)::text AS t`,
  ['Kebenaran kedua untuk menguji penapis DP-14.2.']))
  .rows[0].t;
await db.query(`SELECT * FROM public.am_backfill_account_manager($1::uuid)`, [token2]);
const terikat = (await db.query(`
  SELECT count(*)::int n FROM public.invoices i
    WHERE i.account_manager_id IN ($1, $2)`, [adminUuid, sholihinUuid])).rows[0].n;
eq(terikat, 0,
  'DP-14.2: TIADA baris diikat kepada super_admin atau akaun blocked');
const masihNull = (await db.query(`
  SELECT count(*)::int n FROM public.invoices
    WHERE account_manager IN ('Admin','Sholihin') AND account_manager_id IS NULL`)).rows[0].n;
truthy(masihNull >= 2, 'nilai itu kekal NULL dan kekal KELIHATAN dalam laporan pengecualian (bising, bukan senyap)');

// D4: laporan pengecualian menolak yang tiada kuasa (deny-by-default, bukan ralat)
await sebagaiPengguna(db, testUuid);
eq((await db.query(`SELECT count(*)::int n FROM public.am_backfill_pengecualian()`)).rows[0].n, 0,
  'akaun blocked: laporan pengecualian memulangkan 0 baris (bukan ralat)');
await db.query(`UPDATE public.user_profiles SET is_active = true, account_status = 'active'
                 WHERE id = $1`, [sholihinUuid]);

/* ===================================================================== */
section('BAHAGIAN E — pewarisan `anon` bagi fungsi BAHARU (had platform, diukur)');

// E1: bahagian ALTER DEFAULT PRIVILEGES yang MEMANG berkesan — entri `anon`
// yang eksplisit hilang daripada pg_default_acl.
const dACL = (await db.query(`
  SELECT d.defaclacl::text AS a
    FROM pg_default_acl d JOIN pg_namespace n ON n.oid = d.defaclnamespace
   WHERE n.nspname = 'public' AND d.defaclobjtype = 'f'`)).rows[0]?.a ?? '';
truthy(!/anon=/.test(dACL),
  `pg_default_acl: entri eksplisit \`anon\` berjaya dibuang (${dACL})`);

// E2: HAD PLATFORM — fungsi baharu MASIH boleh dipanggil oleh anon, kerana
// `acldefault()` memberi EXECUTE kepada PUBLIC secara terbina dalam dan
// pg_default_acl tidak boleh menyimpan operasi "buang PUBLIC". Diukur, bukan
// diteka: inilah sebab Seksyen 2 ialah sapuan dinamik yang boleh dijalankan
// semula, dan sebab pengawal CI (Lapisan 2) wujud.
await db.exec(`CREATE OR REPLACE FUNCTION public.uji_fungsi_selepas_8c()
               RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT true $$;`);
const cekFungsi = async () => (await db.query(`
  SELECT has_function_privilege('anon','public.uji_fungsi_selepas_8c()'::regprocedure,'EXECUTE') AS anon,
         has_function_privilege('authenticated','public.uji_fungsi_selepas_8c()'::regprocedure,'EXECUTE') AS auth`))
  .rows[0];
const waris = await cekFungsi();
eq(waris.anon, true,
  'HAD PLATFORM diukur: fungsi dicipta selepas ALTER DEFAULT PRIVILEGES MASIH mewarisi anon (melalui PUBLIC terbina dalam)');
eq(waris.auth, true, 'fungsi baharu itu tetap boleh dipanggil oleh authenticated');

// E3: LAPISAN 1 menutupnya — jalankan semula migration (idempoten), dan sapuan
// dinamik Seksyen 2 merawat fungsi yang tidak wujud semasa larian pertama.
await db.exec(teks8C);
const selepasSapuan = await cekFungsi();
eq(selepasSapuan.anon, false,
  'LAPISAN 1: selepas migration dijalankan semula, fungsi baharu itu TIDAK lagi boleh dipanggil oleh anon');
eq(selepasSapuan.auth, true,
  'LAPISAN 1: authenticated dikekalkan pada fungsi baharu itu (tiada aliran terputus)');
await db.exec(`DROP FUNCTION public.uji_fungsi_selepas_8c();`);

// E4: sapuan TERHAD kepada skema `public`. Fungsi di skema lain (`auth`,
// `extensions`) tidak disentuh — ini boleh diukur di sini.
//
// Penapis `pg_depend.deptype='e'` (yang mengecualikan fungsi milik extension
// sekiranya PostGIS/pgjwt dipasang dalam `public` pada live) TIDAK boleh diukur
// dalam PGlite kerana fixture meletakkan pgcrypto dalam skema `extensions`,
// jadi tiada ahli extension dalam `public`. Ia disahkan di live melalui laporan
// Seksyen 2: setiap nama yang disapu dicetak, dan nama di luar inventori
// dilaporkan sebagai DRIFT untuk semakan manusia.
const ahliExt = (await db.query(`
  SELECT count(*)::int n FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
   WHERE ns.nspname = 'public'
     AND EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')`)).rows[0].n;
eq(ahliExt, 0,
  'diukur: tiada ahli extension dalam `public` pada fixture (jadi penapis pg_depend tidak boleh diuji di sini — ia disahkan melalui laporan DRIFT di live)');
eq(await anonLuarPublic(), luarPublicSebelum,
  `sapuan TERHAD kepada public: bilangan fungsi di LUAR public dengan anon EXECUTE tidak berubah (${luarPublicSebelum} -> ${await anonLuarPublic()})`);

/* ===================================================================== */
section('BAHAGIAN F — idempoten: migration boleh dijalankan dua kali');

let idempotenRalat = null;
try { await db.exec(teks8C); } catch (e) { idempotenRalat = e; }
eq(idempotenRalat, null,
  `larian kedua migration tidak gagal: ${idempotenRalat?.message?.slice(0, 80) ?? 'bersih'}`);
const selepas2 = await postur();
eq(selepas2.anon_boleh, 0, 'larian kedua: anon masih 0 bagi fungsi TPMS');
eq(selepas2.platform_anon, PLATFORM.length,
  'larian kedua: objek platform masih dilangkau (pengecualian idempoten)');
eq(selepas2.auth_boleh, selepas2.jumlah_tpms, 'larian kedua: authenticated masih penuh');

/* ===================================================================== */
section('BAHAGIAN G — 8C TIDAK merosakkan kelakuan sedia ada');

// G1: DP-14.2 Posisi C — resolver TIDAK disempitkan
await sebagaiPengguna(db, adminUuid);
const resolusi = async (v) =>
  (await db.query(`SELECT public.resolve_account_manager($1)::text AS id`, [v])).rows[0].id;
eq(await resolusi('Fuzy'), fuziahUuid, 'DP-8: "Fuzy" -> Fuziah masih betul selepas 8C');
eq(await resolusi('Fuzy / Sholihin '), fuziahUuid,
  'DP-8: "Fuzy / Sholihin " (ruang hujung) -> Fuziah masih betul selepas 8C');
eq(await resolusi('Fuzy / Dila'), fuziahUuid, 'DP-8: "Fuzy / Dila" -> Fuziah masih betul');
eq(await resolusi('Ow Zi Qi'), null, 'DP-9: "Ow Zi Qi" kekal NULL (tidak dipautkan)');
eq((await db.query(`SELECT public.is_external_account_manager('Ow Zi Qi') AS x`)).rows[0].x, true,
  'DP-9: "Ow Zi Qi" masih DIREKOD sebagai orang luar (bukan NULL kerana tiada keputusan)');
eq(await resolusi('Faiz / Siti'), null, 'veto §2.4: "Faiz / Siti" kekal NULL');
// resolver masih boleh menjana calon blocked/super_admin — itu SENGAJA (Posisi C):
// penolakan dikawal di titik WRITE dan dilaporkan, bukan disembunyikan di carian.
eq(await resolusi('Admin'), adminUuid,
  'DP-14.2 Posisi C: resolver MASIH menjana super_admin (penolakan di backfill, bukan di carian)');

// G2: laluan UI (am_confirm_alias) masih berfungsi selepas 8C
const alias = (await db.query(
  `SELECT * FROM public.am_confirm_alias('Ujian Lapan C', $1, 'Nota ujian 8C yang cukup panjang')`,
  [fuziahUuid])).rows[0];
eq(alias.tindakan, 'created', 'am_confirm_alias: pengesahan baharu -> created');
eq(await resolusi('Ujian Lapan C'), fuziahUuid, 'alias baharu terus berkuat kuasa');
const alias2 = (await db.query(
  `SELECT * FROM public.am_confirm_alias('Ujian Lapan C', $1, 'Nota dikemas kini oleh manusia')`,
  [fuziahUuid])).rows[0];
eq(alias2.tindakan, 'updated',
  'DP-21.3 disemak semula: pengesahan semula -> updated (fungsi live SUDAH setia pada audit)');
const batal = (await db.query(`SELECT * FROM public.am_revoke_alias('Ujian Lapan C')`)).rows[0];
truthy(batal.tindakan, 'am_revoke_alias masih berfungsi (keputusan boleh dibatalkan)');

// G3: am_unresolved_values masih berfungsi (UI tidak rosak)
const uv = (await db.query(`SELECT count(*)::int n FROM public.am_unresolved_values()`)).rows[0].n;
truthy(uv >= 0, `am_unresolved_values() masih boleh dipanggil (${uv} baris)`);

await db.close();

console.log(`\n${'='.repeat(62)}`);
console.log(`KEPUTUSAN: ${pass} lulus, ${fail} gagal`);
console.log(`${'='.repeat(62)}\n`);
process.exit(fail === 0 ? 0 : 1);
