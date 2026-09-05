/**
 * generate-8c-prompt.mjs — penjana `docs/PROMPT-8C-PRIVILEGE-HARDENING.md`
 * ========================================================================
 *
 * Mengapa penjana dan bukan fail tangan
 * -------------------------------------
 * Prompt ini membawa **bait SQL** yang akan ditampal ke Supabase SQL Editor di
 * live. Jika ia disunting tangan, cap jari (blob SHA / SHA-256 / bait / baris)
 * boleh drift daripada fail sebenar dan ChatGPT akan memasang SQL yang berbeza
 * daripada yang Arena uji dalam PGlite. Rantai integriti DP-12.4(6) menuntut
 * dokumen diterbitkan daripada fail, dan `scripts/test-doc-references.mjs`
 * seksyen [8] menjalankan penjana ini dengan `--check` untuk mengesan drift.
 *
 * DETERMINISTIK: tiada cop `git rev-parse HEAD` (masalah ayam-dan-telur —
 * fail dijana di-commit dalam commit berikutnya, jadi cop sentiasa lapuk).
 * Kandungan dipin oleh blob SHA Git yang content-addressed.
 *
 * Jalankan:  node scripts/generate-8c-prompt.mjs
 * Semak:     node scripts/generate-8c-prompt.mjs --check
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const SQL_REL = 'lib/supabase/privilege-hardening.sql';
const OUT_REL = 'docs/PROMPT-8C-PRIVILEGE-HARDENING.md';
const MOD_CHECK = process.argv.includes('--check');

const BRANCH = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'],
  { encoding: 'utf8' }).trim();
const remoteUrl = execFileSync('git', ['remote', 'get-url', 'origin'],
  { encoding: 'utf8' }).trim();
const REPO = remoteUrl.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)[1];

// -----------------------------------------------------------------------------
// Cap jari — semantik MESTI sepadan test-doc-references.mjs seksyen [6]:
//   bait   = bilangan bait UTF-8            (sama seperti `wc -c`)
//   baris  = bilangan '\n'                  (sama seperti `wc -l`)
//   aksara = bilangan TITIK KOD Unicode, BUKAN unit UTF-16 -> [...s].length
//   CREATE = bilangan BARIS yang sepadan     (sama seperti `grep -c`)
// -----------------------------------------------------------------------------
const capJari = (rel) => {
  const teks = fs.readFileSync(rel, 'utf8');
  const buf = fs.readFileSync(rel);
  const barisArr = teks.split('\n');
  const kira = (awalan) => barisArr.filter((l) => l.startsWith(awalan)).length;
  const bukanKosong = barisArr.map((l) => l.replace(/\s+$/, '')).filter((l) => l !== '');
  return {
    teks,
    blob: execFileSync('git', ['hash-object', rel], { encoding: 'utf8' }).trim(),
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    bait: buf.length,
    baris: (teks.match(/\n/g) || []).length,
    aksara: [...teks].length,
    table: kira('CREATE TABLE'),
    func: (teks.match(/CREATE OR REPLACE FUNCTION/g) || []).length,
    policy: kira('CREATE POLICY'),
    revokePublic: (teks.match(/REVOKE ALL ON FUNCTION/g) || []).length,
    grantAuth: (teks.match(/GRANT EXECUTE ON FUNCTION/g) || []).length,
    pertama: bukanKosong[0] ?? '',
    terakhir: bukanKosong[bukanKosong.length - 1] ?? '',
  };
};

/** Terbitkan senarai objek DARIPADA fail SQL itu sendiri — jangan reka. */
const terbitObjek = (teks) => ({
  jadual: [...teks.matchAll(/CREATE TABLE IF NOT EXISTS public\.(\w+)/g)].map((m) => m[1]),
  fungsi: [...teks.matchAll(/CREATE OR REPLACE FUNCTION public\.(\w+)/g)].map((m) => m[1]),
  polisi: [...teks.matchAll(/CREATE POLICY (\w+)/g)].map((m) => m[1]),
  // Nama dalam inventori Seksyen 2 (untuk jadual cap jari di prompt).
  inventori: (() => {
    const ambil = (nama) => {
      const m = teks.match(new RegExp(`${nama} text\\[\\] := ARRAY\\[([\\s\\S]*?)\\];`));
      return m ? [...m[1].matchAll(/'(\w+)'/g)].map((x) => x[1]) : [];
    };
    return [...ambil('v_inventori'), ...ambil('v_nama_selepas')];
  })(),
});

const cj = capJari(SQL_REL);
const obj = terbitObjek(cj.teks);
const urlBlob = (p) => `https://github.com/${REPO}/blob/${BRANCH}/${p}`;
const PAGAR = '`'.repeat(4);
const senarai = (a) => a.map((x) => `\`${x}\``).join(', ');

// -----------------------------------------------------------------------------
// Query J0 (read-only, SEBELUM pasang) dan K (pengesahan, SELEPAS pasang).
// Setiap query yang menulis DIBALUT dalam BEGIN/ROLLBACK supaya pengesahan
// tidak meninggalkan kesan di live — prinsip yang sama dipakai dalam 8A-3.
// -----------------------------------------------------------------------------
const J0 = [
  {
    id: 'J0a',
    tujuan: 'Baseline privilej: berapa fungsi `public` boleh dipanggil oleh `anon`?',
    sql: `SELECT count(*)::int AS jumlah_fungsi_public,
       count(*) FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE'))::int
         AS anon_boleh_execute,
       count(*) FILTER (WHERE has_function_privilege('authenticated', p.oid, 'EXECUTE'))::int
         AS authenticated_boleh_execute
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public';`,
    jangkaan: '`anon_boleh_execute` = `jumlah_fungsi_public` (≈52). Inilah lubang DP-18.4.',
  },
  {
    id: 'J0b',
    tujuan: 'Punca sistemik: entri `pg_default_acl` bagi fungsi dalam `public`.',
    sql: `SELECT d.defaclacl::text AS default_acl_fungsi
  FROM pg_default_acl d JOIN pg_namespace n ON n.oid = d.defaclnamespace
 WHERE n.nspname = 'public' AND d.defaclobjtype = 'f';`,
    jangkaan: 'mengandungi `anon=X/postgres` (mengesahkan F1 yang anda laporkan 2026-09-05).',
  },
  {
    id: 'J0c',
    tujuan: 'DP-17.4(a): adakah akaun blocked/pending yang AKAN kehilangan kuasa?',
    // `id` WAJIB dipilih: K3 memerlukan UUID akaun blocked sebagai
    // <UUID_AKAUN_BLOCKED>. Draf asal query ini tidak memilih `id`, jadi
    // placeholder K3 tidak boleh diisi daripada mana-mana query J0 — kecacatan
    // prompt Arena yang ditemui apabila laporan J0 live (2026-09-05) dipadankan
    // terhadap keperluan Langkah 2.
    sql: `SELECT id::text AS uuid, full_name, email, role::text AS role, is_active,
       account_status::text AS account_status
  FROM public.user_profiles
 WHERE (is_active = false OR account_status <> 'active')
   AND role <> 'viewer'::public.app_role
 ORDER BY full_name;`,
    jangkaan: 'senarai akaun bukan-viewer yang tidak aktif, **dengan `uuid`**. '
      + '**Tampal semua baris.** Selepas 8C, setiap akaun dalam senarai ini jatuh '
      + 'kepada `viewer` serta-merta. `uuid` baris pertama = `<UUID_AKAUN_BLOCKED>` untuk K3.',
  },
  {
    id: 'J0d',
    tujuan: 'Adakah objek 8C sudah wujud? (mengesan pemasangan separa /ulangan)',
    sql: `SELECT to_regclass('public.backfill_authorizations')::text AS jadual_gate,
       (SELECT count(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='public'
           AND p.proname IN ('am_calon_layak','am_backfill_authorize',
                             'am_backfill_pengecualian')) AS fungsi_8c,
       (SELECT string_agg(pg_get_function_identity_arguments(p.oid), ' | ')
          FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='public' AND p.proname='am_backfill_account_manager')
         AS tanda_tangan_backfill;`,
    jangkaan: 'SEBELUM pasang: `jadual_gate` = NULL, `fungsi_8c` = 0, '
      + '`tanda_tangan_backfill` = string KOSONG (fungsi tanpa argumen).',
  },
  {
    id: 'J0e',
    tujuan: 'Baseline jadual (allowlist W1 — DP-23.6): berapa jadual rasmi kini?',
    sql: `SELECT count(*)::int AS jumlah_jadual_public
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r'
   AND c.relname NOT IN ('schema_migrations','spatial_ref_sys');`,
    jangkaan: '**17 rasmi + 3 warisan = 20** sebelum 8C; **18 + 3 = 21** selepas 8C.',
  },
  {
    id: 'J0f',
    tujuan: 'Inventori penuh objek fungsi `public` — mengenal pasti delta 53 vs 52.',
    // Laporan J0 live (2026-09-05) menunjukkan **53** objek fungsi, sedangkan
    // inventori repo mengandungi **52** nama. Seksyen 2 ialah sapuan dinamik,
    // jadi delta itu mesti dikenal pasti SEBELUM pemasangan — bukan ditemui
    // selepas objek platform sudah disentuh.
    sql: `SELECT p.proname,
       count(*)::int AS bilangan_tanda_tangan,
       string_agg(pg_get_function_identity_arguments(p.oid), ' | ') AS argumen,
       string_agg(DISTINCT r.rolname, ',') AS pemilik,
       bool_or(EXISTS (SELECT 1 FROM pg_depend d
                        WHERE d.objid = p.oid AND d.deptype = 'e')) AS ahli_extension
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_roles r ON r.oid = p.proowner
 WHERE n.nspname = 'public'
 GROUP BY p.proname
 ORDER BY p.proname;`,
    jangkaan: 'satu baris bagi setiap nama fungsi (jangkaan **52 atau 53** baris). '
      + '**Tampal SEMUA baris.** Yang dicari: (a) nama dengan '
      + '`bilangan_tanda_tangan > 1` (fungsi terlebih beban), (b) nama dengan '
      + '`ahli_extension = true` (dikecualikan automatik oleh sapuan), dan '
      + '(c) nama yang **bukan** milik TPMS — contohnya `pgrst_ddl_watch` / '
      + '`pgrst_drop_watch`, yang sudah berada dalam senarai pengecualian 8C.',
  },
  {
    id: 'J0g',
    tujuan: 'UUID yang diperlukan oleh placeholder K3–K6 (read-only).',
    sql: `SELECT up.id::text AS uuid, up.full_name, up.email, up.role::text AS role,
       up.is_active, up.account_status::text AS account_status
  FROM public.user_profiles up
 WHERE up.role = 'super_admin'::public.app_role
    OR up.is_active = false
    OR up.account_status <> 'active'
    OR up.role IN ('admin'::public.app_role,'finance'::public.app_role,
                   'head_governance'::public.app_role)
 ORDER BY up.role::text, up.full_name
 LIMIT 25;`,
    jangkaan: 'cukup untuk mengisi `<UUID_SUPER_ADMIN>` (role = super_admin), '
      + '`<UUID_AKAUN_BLOCKED>` (is_active = false / account_status = blocked) dan '
      + '`<UUID_BUKAN_SUPER>` (admin/finance/head_governance yang **bukan** '
      + 'super_admin). **Tampal jadual penuh** supaya pemetaan UUID→peranan '
      + 'boleh diaudit; jangan ganti placeholder dengan nilai yang tidak dilaporkan.',
  },
  {
    id: 'J0h',
    tujuan: 'Default ACL fungsi **per peranan** (J0b memulangkan 2 baris di live).',
    // J0 live menunjukkan DUA entri: satu grantor `postgres`, satu grantor
    // `supabase_admin`. `ALTER DEFAULT PRIVILEGES` tanpa `FOR ROLE` hanya
    // mengubah entri peranan semasa (`postgres`), jadi K2 mesti dinilai
    // per-peranan — kalau tidak, entri `supabase_admin` yang kekal akan
    // kelihatan seperti kegagalan.
    sql: `SELECT r.rolname AS peranan_pemilik, d.defaclacl::text AS default_acl_fungsi
  FROM pg_default_acl d
  JOIN pg_namespace n ON n.oid = d.defaclnamespace
  JOIN pg_roles r ON r.oid = d.defaclrole
 WHERE n.nspname = 'public' AND d.defaclobjtype = 'f'
 ORDER BY r.rolname;`,
    jangkaan: 'dua baris di live: `postgres` dan `supabase_admin`, kedua-duanya '
      + 'mengandungi `anon=X/...`. Selepas 8C **hanya** baris `postgres` kehilangan '
      + '`anon=`; baris `supabase_admin` **kekal** dan itu **DIJANGKA** (8C tidak '
      + 'berniat menukar default peranan platform).',
  },
];

const K = [
  {
    id: 'K1',
    apa: 'Tiada fungsi TPMS lagi yang boleh dipanggil oleh `anon` (baki dinamakan).',
    sql: `SELECT count(*)::int AS jumlah,
       count(*) FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE'))::int AS anon,
       count(*) FILTER (WHERE has_function_privilege('authenticated', p.oid, 'EXECUTE'))::int AS auth,
       coalesce(string_agg(p.proname, ', ' ORDER BY p.proname)
                  FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE')),
                '(tiada)') AS nama_masih_anon
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public';`,
    jangkaan: '`auth` = `jumlah`. `anon` = **0** jika tiada objek platform dalam '
      + '`public`; jika J0f menemui `pgrst_ddl_watch`/`pgrst_drop_watch`, `anon` = '
      + '**bilangan objek itu** dan `nama_masih_anon` **menamakannya** — itu '
      + '**DIJANGKA dan BETUL** (8C sengaja tidak menyentuh objek platform). '
      + '🔴 Yang **TIDAK** boleh diterima: sebarang nama TPMS dalam '
      + '`nama_masih_anon`. **Tampal keempat-empat nilai.**',
  },
  {
    id: 'K2',
    apa: 'Entri `anon` hilang daripada default ACL peranan `postgres` sahaja.',
    sql: `SELECT r.rolname AS peranan_pemilik,
       d.defaclacl::text AS default_acl_fungsi,
       (d.defaclacl::text LIKE '%anon=%') AS masih_ada_anon
  FROM pg_default_acl d
  JOIN pg_namespace n ON n.oid = d.defaclnamespace
  JOIN pg_roles r ON r.oid = d.defaclrole
 WHERE n.nspname = 'public' AND d.defaclobjtype = 'f'
 ORDER BY r.rolname;`,
    jangkaan: 'baris `postgres`: `masih_ada_anon` = **false**, dan '
      + '`authenticated=X/postgres` masih ada. Baris `supabase_admin`: '
      + '`masih_ada_anon` = **true** — **DIJANGKA, BUKAN KEGAGALAN**. Sebab: '
      + '`ALTER DEFAULT PRIVILEGES` tanpa `FOR ROLE` hanya mengubah entri peranan '
      + 'semasa (`postgres`); 8C **tidak** berniat menukar default peranan '
      + 'platform. Jangan cuba "membaiki" baris `supabase_admin`.',
  },
  {
    id: 'K3',
    apa: 'DP-17.4(a) — akaun blocked kehilangan kuasa (diukur, READ-ONLY + ROLLBACK).',
    sql: `BEGIN;
-- Ganti <UUID_AKAUN_BLOCKED> dengan satu id daripada J0c (akaun blocked/pending).
SELECT set_config('request.jwt.claims',
  json_build_object('sub','<UUID_AKAUN_BLOCKED>','role','authenticated')::text, true);
SELECT public.current_user_role()::text AS peranan_semasa,
       public.current_role_name()      AS nama_peranan,
       public.can_resolve_account_managers() AS boleh_selesai,
       (SELECT count(*)::int FROM public.am_list_staff()) AS staf_dilihat;
ROLLBACK;`,
    jangkaan: '`peranan_semasa` = **viewer**, `boleh_selesai` = **false**, '
      + '`staf_dilihat` = **0**. Jika J0c memulangkan 0 baris, tulis '
      + '`⏳ TIADA AKAUN BLOCKED UNTUK DIUJI` dan tampal bukti J0c.',
  },
  {
    id: 'K4',
    apa: 'Pengguna sah TIDAK terjejas (tiada lockout beramai-ramai).',
    sql: `BEGIN;
-- Ganti <UUID_SUPER_ADMIN> dengan id akaun Super Admin anda.
SELECT set_config('request.jwt.claims',
  json_build_object('sub','<UUID_SUPER_ADMIN>','role','authenticated')::text, true);
SELECT public.current_user_role()::text AS peranan,
       public.is_super_admin()         AS super,
       public.can_resolve_account_managers() AS boleh_selesai,
       (SELECT count(*)::int FROM public.am_list_staff()) AS staf_dilihat;
ROLLBACK;`,
    jangkaan: '`peranan` = **super_admin**, `super` = **true**, '
      + '`boleh_selesai` = **true**, `staf_dilihat` = **19**.',
  },
  {
    id: 'K5',
    apa: 'DP-17.4(b) — backfill TANPA token ditolak (42501).',
    // NOTIS REKA BENTUK: Supabase SQL Editor menjalankan SQL biasa, BUKAN psql —
    // meta-perintah seperti \\gset / :var TIDAK tersedia. Dan pernyataan yang
    // menaikkan ralat akan menghentikan keseluruhan skrip. Jadi setiap ujian
    // ralat dibalut dalam DO + EXCEPTION dan melaporkan SQLERRM melalui NOTICE:
    // skrip selesai sepenuhnya, dan bukti verbatim tetap terhasil.
    sql: `BEGIN;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','<UUID_SUPER_ADMIN>','role','authenticated')::text, true);
DO $$
BEGIN
  PERFORM * FROM public.am_backfill_account_manager(NULL);
  RAISE NOTICE 'K5 GAGAL: backfill tanpa token TIDAK ditolak';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'K5 LULUS: 42501 -> %', SQLERRM;
END $$;
ROLLBACK;`,
    jangkaan: 'NOTICE `K5 LULUS: 42501 -> gate 8C: backfill memerlukan token '
      + 'kebenaran...`. Tampal NOTICE itu verbatim. Jika `K5 GAGAL` muncul, '
      + 'gate tidak dipasang — 🔴 blocker.',
  },
  {
    id: 'K6',
    apa: 'Gate token: hanya Super Admin, sebab ≥ 12 aksara, token SEKALI-GUNA.',
    sql: `-- (a) bukan Super Admin -> 42501
BEGIN;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','<UUID_BUKAN_SUPER>','role','authenticated')::text, true);
DO $$
BEGIN
  PERFORM public.am_backfill_authorize('Sebab ujian yang cukup panjang');
  RAISE NOTICE 'K6a GAGAL: bukan Super Admin dibenarkan mencipta token';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'K6a LULUS: 42501 -> %', SQLERRM;
END $$;
ROLLBACK;

-- (b) sebab terlalu pendek -> 22023
BEGIN;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','<UUID_SUPER_ADMIN>','role','authenticated')::text, true);
DO $$
BEGIN
  PERFORM public.am_backfill_authorize('pendek');
  RAISE NOTICE 'K6b GAGAL: sebab pendek diterima';
EXCEPTION WHEN invalid_parameter_value THEN
  RAISE NOTICE 'K6b LULUS: 22023 -> %', SQLERRM;
END $$;
ROLLBACK;

-- (c) token sah -> backfill jalan; token yang SAMA dipakai dua kali -> 42501
BEGIN;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','<UUID_SUPER_ADMIN>','role','authenticated')::text, true);
DO $$
DECLARE
  v_tok uuid;
  v_baris integer := 0;
  r record;
BEGIN
  v_tok := public.am_backfill_authorize('Kebenaran ujian gate 8C — akan diROLLBACK');
  RAISE NOTICE 'K6c token dicipta: %', v_tok;

  FOR r IN SELECT * FROM public.am_backfill_account_manager(v_tok) LOOP
    v_baris := v_baris + 1;
    RAISE NOTICE 'K6c larian-1: % diisi=% kekal_null=%', r.jadual, r.baris_diisi, r.baris_kekal_null;
  END LOOP;
  RAISE NOTICE 'K6c larian-1 memulangkan % baris (jangkaan 2)', v_baris;

  BEGIN
    PERFORM * FROM public.am_backfill_account_manager(v_tok);
    RAISE NOTICE 'K6c GAGAL: token yang sama diterima KALI KEDUA';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'K6c LULUS: penggunaan kedua ditolak 42501 -> %', SQLERRM;
  END;
END $$;
ROLLBACK;`,
    jangkaan: 'NOTICE: `K6a LULUS: 42501`, `K6b LULUS: 22023`, `K6c token '
      + 'dicipta: <uuid>`, `K6c larian-1 memulangkan 2 baris`, dan `K6c LULUS: '
      + 'penggunaan kedua ditolak 42501`. **Tampal semua NOTICE** dan sahkan '
      + '`ROLLBACK` muncul tiga kali dalam output.',
  },
  {
    id: 'K7',
    apa: 'DP-14.2 — laporan pengecualian boleh dipanggil dan beritem.',
    sql: `BEGIN;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','<UUID_SUPER_ADMIN>','role','authenticated')::text, true);
SELECT * FROM public.am_backfill_pengecualian();
ROLLBACK;`,
    jangkaan: '**0 baris** dijangka hari ini (J1 Fasa 8A mengukur SIFAR nilai '
      + 'mentah `Account Manager` di live). Yang penting: fungsi **wujud dan '
      + 'boleh dipanggil** tanpa ralat. Tampal header lajur yang dipulangkan.',
  },
  {
    id: 'K8',
    apa: 'Objek 8C wujud dengan tanda tangan yang betul.',
    sql: `SELECT to_regclass('public.backfill_authorizations')::text AS jadual_gate,
       (SELECT count(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='public' AND p.proname IN
           ('am_calon_layak','am_backfill_authorize','am_backfill_pengecualian')) AS fungsi_8c,
       (SELECT string_agg(pg_get_function_identity_arguments(p.oid), ' | ')
          FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='public' AND p.proname='am_backfill_account_manager')
         AS tanda_tangan_backfill,
       (SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
         WHERE n.nspname='public' AND c.relname='backfill_authorizations') AS rls;`,
    jangkaan: '`jadual_gate` = **backfill_authorizations** (`to_regclass()::text` '
      + 'memulangkan nama tanpa skema apabila `public` ada dalam search_path); '
      + '`fungsi_8c` = **3**; `tanda_tangan_backfill` = **p_token uuid**; '
      + '`rls` = **true**.',
  },
  {
    id: 'K9',
    apa: 'Had platform DP-23.1 diukur di live (bukan diandaikan daripada PGlite).',
    sql: `BEGIN;
CREATE FUNCTION public.zz_uji_pewarisan_8c() RETURNS boolean
  LANGUAGE sql STABLE AS $$ SELECT true $$;
SELECT has_function_privilege('anon','public.zz_uji_pewarisan_8c()'::regprocedure,'EXECUTE')
         AS anon_mewarisi,
       has_function_privilege('authenticated','public.zz_uji_pewarisan_8c()'::regprocedure,'EXECUTE')
         AS authenticated_ok;
DROP FUNCTION public.zz_uji_pewarisan_8c();
ROLLBACK;`,
    jangkaan: 'PGlite mengukur `anon_mewarisi` = **true** walaupun K2 lulus '
      + '(kerana `acldefault()` memberi EXECUTE kepada PUBLIC, dan `anon` ialah '
      + 'ahli PUBLIC). **Laporkan nilai live yang sebenar** — jika live juga '
      + '`true`, itu mengesahkan DP-23.1 dan Lapisan 2 (pengawal CI) adalah '
      + 'penutupan yang sebenarnya. Jangan "betulkan" keputusan supaya sepadan '
      + 'dengan jangkaan Arena.',
  },
  {
    id: 'K10',
    apa: 'Aplikasi masih berfungsi selepas 8C (tiada aliran terputus).',
    sql: `-- read-only: senarai fungsi yang diperlukan oleh UI (26 RPC dalam kod app)
SELECT p.proname,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname='public'
   AND p.proname IN ('am_list_staff','am_unresolved_values','am_confirm_alias',
                     'am_revoke_alias','am_confirm_external','am_revoke_external',
                     'is_external_account_manager','can_resolve_account_managers',
                     'my_account_status','my_password_change_required',
                     'admin_list_users','admin_user_summary')
 ORDER BY p.proname;`,
    jangkaan: 'semua 12 baris: `auth` = **true**, `anon` = **false**. '
      + 'Kemudian **muat semula dashboard TPMS di Vercel** dan sahkan panel '
      + 'data (DP-22) + halaman Account Manager masih memaparkan data.',
  },
  {
    id: 'K11',
    apa: 'Baseline jadual selepas 8C (allowlist W1 — DP-23.6).',
    sql: `SELECT count(*)::int AS jumlah_jadual_public,
       count(*) FILTER (WHERE c.relrowsecurity)::int AS ber_rls
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r'
   AND c.relname NOT IN ('schema_migrations','spatial_ref_sys');`,
    jangkaan: '**21** jadual (18 rasmi + 3 warisan). Jika W1 penuh dijalankan '
      + 'semula, `backfill_authorizations` mesti muncul sebagai '
      + '`RASMI (repo)` — **BUKAN** `⚠️ WARISAN`.',
  },
  {
    id: 'K12',
    apa: 'Output NOTICE/WARNING migration ditampal VERBATIM (laporan drift).',
    sql: `-- Tiada query: gunakan output daripada Langkah 1 (Supabase SQL Editor
-- memaparkan NOTICE/WARNING dalam tab Messages/output).`,
    jangkaan: 'Tampal **semua** baris `8C Seksyen 2: ... dirawat`, serta '
      + 'SEBARANG `WARNING ... DRIFT` atau `... TIDAK ditemui di live`. '
      + 'Nama dalam DRIFT **mesti** disenaraikan satu per satu — ia mungkin '
      + 'objek platform yang perlu dikecualikan. Jangan ringkaskan.',
  },
];

const LARANGAN = `1. JANGAN ubah skema/RLS/RPC/trigger/seed/storage/password selain fail
   \`${SQL_REL}\` yang dibenarkan oleh prompt ini.
2. JANGAN guna \`service_role\` dalam sebarang ujian.
3. JANGAN panggil RPC tulis perniagaan (\`sync_import_transaction\`, \`lock_programme\`,
   \`request_programme_unlock\`, \`submit_change_request\`, \`review_change_request\`).
4. JANGAN reset/ubah password mana-mana akaun.
5. JANGAN merge ke \`main\`, dan JANGAN tukar Production Branch Vercel. Prompt ini
   **tidak** meluluskannya.
6. JANGAN tampal anon key penuh / sebarang rahsia dalam laporan.
7. JANGAN mereka-reka bukti — setiap LULUS mesti ada bukti verbatim; jika tidak dapat
   diuji, tulis \`⏳ MENUNGGU PENGGUNA\`.
8. JANGAN layan preview local (Mod Demo) sebagai production.
9. JANGAN **berhenti senyap** apabila alat gagal. Namakan operasi spesifik yang dicuba,
   tampal ralat penuhnya, kemudian teruskan bahagian lain yang boleh.
10. 🔴 **8C-khas:** JANGAN jalankan semula \`seed-account-manager-aliases.sql\`. Ia fail
    BEKU (DP-21.3: auditnya tidak idempoten) dan 8C **tidak** memerlukannya.
11. 🔴 **8C-khas:** JANGAN sekat/menaktifkan mana-mana akaun SEBENAR semata-mata untuk
    menguji K3. Guna akaun blocked yang **sudah wujud** (J0c). Jika tiada, tulis
    \`⏳ TIADA AKAUN BLOCKED UNTUK DIUJI\`.
12. 🔴 **8C-khas:** JANGAN tinggalkan sebarang transaksi terbuka. Setiap query K yang
    menulis bermula dengan \`BEGIN\` dan **mesti** berakhir dengan \`ROLLBACK\` — sahkan
    perkataan \`ROLLBACK\` muncul dalam output yang anda tampal.
13. 🔴 **8C-khas:** JANGAN \`DROP\` atau sunting fungsi yang sudah dipasang selain yang
    fail 8C sendiri lakukan. Jika Langkah 1 gagal separuh jalan, **BERHENTI** dan tampal
    ralat penuh — jangan cuba "membaiki" dengan SQL ciptaan sendiri.`;

const FORMAT = `**Seksyen 1 — Konteks & Status:** deploy commit Vercel, projek Supabase, dan
  sama ada J0 (5 query) sudah dijalankan.
**Seksyen 2 — Tindakan yang diambil:** Langkah 0 → 1 → 2, dengan output/bukti verbatim.
**Seksyen 3 — Keputusan ujian (jadual):** \`K1..K12\` | status ✅/❌/⏳ | bukti verbatim.
**Seksyen 4 — Isu / Blocker:** 🔴/🟠/🟢 + penerangan + bukti + cadangan. **WAJIB**
  melaporkan sebarang \`WARNING ... DRIFT\` daripada Langkah 1 di sini.
**Seksyen 5 — Pengesahan penuh:** senarai semak dipatuhi (persona, 13 larangan,
  ROLLBACK disahkan, mock vs live).
**Seksyen 6 — Kesimpulan & langkah seterusnya:** keputusan + cadangan.

Untuk **K12**, tampal **semua** baris NOTICE/WARNING — jangan ringkaskan.
Untuk **K1**, tampal **ketiga-tiga** nombor (jumlah / anon / auth).`;

const dokumen = `# PROMPT 8C — PRIVILEGE HARDENING + GATE BACKFILL

> 🔴 **HARD GATE — KELULUSAN PENGGUNA DIPERLUKAN SEBELUM LANGKAH 1.**
> Prompt ini memasang SQL yang menukar **privilej EXECUTE bagi semua fungsi
> \`public\`**, menukar **takrifan \`current_user_role()\`** (yang dipakai oleh
> \`has_role()\` → **polisi RLS seluruh sistem**), dan **menukar tanda tangan**
> \`am_backfill_account_manager()\` daripada 0 argumen kepada \`(p_token uuid)\`.
> Jangan jalankan Langkah 1 sehingga pengguna meluluskannya secara eksplisit.
> **Langkah 0 (J0a–J0e) adalah read-only dan boleh dijalankan serta-merta.**

---

## 1. PERSONA

Anda ialah **jurutera pangkalan data PostgreSQL/Supabase kanan** yang bekerja
pada projek produksi. Anda teliti, konservatif, dan **tidak pernah** mereka-reka
bukti. Anda menampal output sebenar walaupun ia bercanggah dengan jangkaan.

## 2. PETA KOD

| Perkara | Nilai |
|---|---|
| Repo | \`${REPO}\` |
| Branch sesi | \`${BRANCH}\` |
| Fail SQL 8C | \`${SQL_REL}\` |
| Pautan Raw | ${urlBlob(SQL_REL).replace('/blob/', '/raw/')} |
| Ujian PGlite (Arena) | \`scripts/test-privilege-hardening.mjs\` — **66/66 lulus** |
| Pengawal konvensyen | \`scripts/test-konvensyen-privilej.mjs\` — **14/14 lulus** |
| Suite penuh | **24/24 fail lulus** |

## 3. KONTEKS — APA YANG 8C TUTUP

| Rujukan panel | Isu | Penutupan dalam fail ini |
|---|---|---|
| **DP-18.4** | 52 fungsi TPMS boleh dipanggil oleh \`anon\` (tidak log masuk) | Seksyen 2: sapuan dinamik \`REVOKE FROM PUBLIC\` + \`REVOKE FROM anon\` + \`GRANT authenticated\` |
| **DP-18.4(b)** | Fungsi BAHARU mewarisi \`anon\` melalui \`pg_default_acl\` | Seksyen 3 (\`ALTER DEFAULT PRIVILEGES\`) **+ hadnya diukur: tidak mencukupi** — lihat DP-23.1 dan K9 |
| **DP-17.4(a)** | \`current_user_role()\` tidak menapis \`is_active\`/\`account_status\` → akaun **blocked masih berkuasa** | Seksyen 1: kedua-dua fungsi ditapis; akaun blocked/pending jatuh kepada \`viewer\` |
| **DP-17.4(b)** | \`am_backfill_account_manager()\` tiada gate SQL (hanya larangan prosa dalam prompt) | Seksyen 5: jadual \`backfill_authorizations\` + token **sekali-guna** ciptaan Super Admin |
| **DP-14.2** | Resolver boleh menjana calon blocked/super_admin → risiko pengikatan salah | Seksyen 4 + 6: \`am_calon_layak()\` menolak di titik WRITE; \`am_backfill_pengecualian()\` **melaporkan** (bukan NULL senyap) |
| **DP-23.6** | Jadual baharu mesti masuk allowlist W1 | \`docs/PROMPT-6C-AUDIT-LEGACY-TABLES.md\` sudah dikemas kini: **18 rasmi + 3 warisan = 21** |

**Sifat migration:** tambahan (additive) dan **idempoten** — boleh dijalankan
semula. Satu-satunya perubahan tidak-additif ialah \`DROP FUNCTION
am_backfill_account_manager()\` (tanpa argumen) lalu dicipta semula dengan
\`(p_token uuid)\`. **Ini selamat kerana diukur:** inventori \`.rpc()\` dalam
\`app/\`, \`lib/\`, \`components/\` = **26 nama fungsi berbeza**, dan
\`am_backfill_account_manager\` **bukan** salah satunya (ia RPC migration
sekali-guna yang anda jalankan, bukan dipanggil oleh aplikasi).

## 4. CAP JARI FAIL — sahkan SEBELUM memasang

| Metrik | Nilai |
|---|---|
| Blob SHA (Git) | \`${cj.blob}\` |
| SHA-256 | \`${cj.sha256}\` |
| Bait (\`wc -c\`) | ${cj.bait} |
| Baris (\`wc -l\`) | ${cj.baris} |
| Aksara (titik kod) | ${cj.aksara} |
| \`CREATE TABLE\` | ${cj.table} |
| \`CREATE OR REPLACE FUNCTION\` | ${cj.func} |
| \`CREATE POLICY\` | ${cj.policy} |
| Baris \`REVOKE ALL ON FUNCTION\` | ${cj.revokePublic} |
| Baris \`GRANT EXECUTE ON FUNCTION\` | ${cj.grantAuth} |
| Baris pertama bukan kosong | \`${cj.pertama}\` |
| Baris terakhir bukan kosong | \`${cj.terakhir}\` |

**Objek yang diterbitkan daripada fail itu sendiri (bukan direka):**

* Jadual (${obj.jadual.length}): ${senarai(obj.jadual)}
* Fungsi (${obj.fungsi.length}): ${senarai(obj.fungsi)}
* Polisi RLS (${obj.polisi.length}): ${senarai(obj.polisi)}
* Inventori Seksyen 2 (${obj.inventori.length} nama): ${senarai(obj.inventori)}

🔴 **Jika SHA-256 atau bilangan bait yang anda kira BERBEZA daripada jadual di
atas, BERHENTI dan laporkan.** Jangan pasang fail yang berbeza daripada yang
Arena uji dalam PGlite.

## 5. LANGKAH 0 — J0 (READ-ONLY, jalankan DAHULU)

${J0.map((q, i) => `### ${q.id} — ${q.tujuan}

${PAGAR}sql
${q.sql}
${PAGAR}

**Jangkaan:** ${q.jangkaan}
`).join('\n')}
## 6. LANGKAH 1 — PASANG (🔴 HANYA SELEPAS KELULUSAN PENGGUNA)

Buka **Supabase Dashboard → SQL Editor**, tampal **seluruh** kandungan
\`${SQL_REL}\` **byte-for-byte**, dan jalankan.

${PAGAR}sql
${cj.teks}${cj.teks.endsWith('\n') ? '' : '\n'}${PAGAR}

**Arahan pemasangan:**

1. Sahkan cap jari (Seksyen 4) SEBELUM menampal.
2. Tampal **semua** ${cj.baris} baris — jangan potong, jangan "kemas kini" format.
3. Jalankan **sekali**. Migration ini idempoten, jadi jika ia gagal separuh
   jalan, **BERHENTI** dan tampal ralat penuh (larangan 13).
4. **Simpan dan tampal SEMUA output NOTICE/WARNING** — diperlukan untuk K12.
   Baris \`8C Seksyen 2: N tanda tangan fungsi ... dirawat\` ialah bukti sapuan
   benar-benar berlaku; \`WARNING ... DRIFT\` menandakan objek yang tidak
   dikenali dan **mesti** dilaporkan.

## 7. LANGKAH 2 — PENGESAHAN K1–K12

Gantikan tiga placeholder ini dengan nilai SEBENAR daripada projek live:
\`<UUID_SUPER_ADMIN>\`, \`<UUID_AKAUN_BLOCKED>\` (daripada J0c), dan
\`<UUID_BUKAN_SUPER>\` (akaun finance/admin yang bukan Super Admin).

${K.map((q) => `### ${q.id} — ${q.apa}

${PAGAR}sql
${q.sql}
${PAGAR}

**Jangkaan:** ${q.jangkaan}
`).join('\n')}
## 8. LARANGAN

${LARANGAN}

## 9. FORMAT LAPORAN (WAJIB — 6 seksyen)

${FORMAT}

**Berhenti selepas laporan.** Jangan mula fasa berikutnya (8B/8D) sehingga Arena
menyemak laporan ini.

---

## Nota untuk Arena (bukan sebahagian prompt)

* Penjana: \`scripts/generate-8c-prompt.mjs\`. Jana semula selepas SEBARANG
  perubahan pada \`${SQL_REL}\`, kemudian jalankan
  \`node scripts/test-doc-references.mjs\` (seksyen [6] menyemak SHA-256 dalam
  prompt terhadap fail semasa; seksyen [8] menjalankan penjana dengan \`--check\`).
* K9 sengaja meminta ChatGPT **melaporkan nilai live sebenar** walaupun PGlite
  sudah mengukur \`true\`. Jika live berbeza daripada PGlite, itu penemuan
  baharu (fixture tidak setara live — kelas kesilapan DP-14.2) dan mesti
  dibawa ke panel.
* Jangkaan K4 \`staf_dilihat = 19\` dan K11 \`21 jadual\` adalah berdasarkan
  laporan live terkini (J0a/J1). Jika live sudah berubah, kemaskini penjana —
  jangan sunting dokumen yang dijana.
`;

if (MOD_CHECK) {
  const sedia = fs.existsSync(OUT_REL) ? fs.readFileSync(OUT_REL, 'utf8') : null;
  if (sedia !== dokumen) {
    console.log(`❌ --check: ${OUT_REL} DRIFT daripada output penjana.`);
    console.log('   Jalankan: node scripts/generate-8c-prompt.mjs');
    process.exit(1);
  }
  console.log(`✅ --check: ${OUT_REL} sepadan output penjana (tiada drift).`);
  process.exit(0);
}

fs.writeFileSync(OUT_REL, dokumen);
const bait = Buffer.byteLength(dokumen);
console.log(`✅ ${OUT_REL}`);
console.log(`   ${bait} bait | ${dokumen.split('\n').length} baris | `
  + `SQL: ${cj.bait} bait / ${cj.baris} baris / blob ${cj.blob.slice(0, 12)}…`);
console.log(`   objek: ${obj.jadual.length} jadual, ${obj.fungsi.length} fungsi, `
  + `${obj.polisi.length} polisi, ${obj.inventori.length} nama inventori`);
console.log(`   kriteria: ${J0.length} J0 + ${K.length} K`);
