# PROMPT 8C — PRIVILEGE HARDENING + GATE BACKFILL

> 🔴 **HARD GATE — KELULUSAN PENGGUNA DIPERLUKAN SEBELUM LANGKAH 1.**
> Prompt ini memasang SQL yang menukar **privilej EXECUTE bagi semua fungsi
> `public`**, menukar **takrifan `current_user_role()`** (yang dipakai oleh
> `has_role()` → **polisi RLS seluruh sistem**), dan **menukar tanda tangan**
> `am_backfill_account_manager()` daripada 0 argumen kepada `(p_token uuid)`.
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
| Repo | `SaidRazak881/masb_pms_v4` |
| Branch sesi | `arena/01a06274-masb-pms-v4` |
| Fail SQL 8C | `lib/supabase/privilege-hardening.sql` |
| Pautan Raw | https://github.com/SaidRazak881/masb_pms_v4/raw/arena/01a06274-masb-pms-v4/lib/supabase/privilege-hardening.sql |
| Ujian PGlite (Arena) | `scripts/test-privilege-hardening.mjs` — **66/66 lulus** |
| Pengawal konvensyen | `scripts/test-konvensyen-privilej.mjs` — **14/14 lulus** |
| Suite penuh | **24/24 fail lulus** |

## 3. KONTEKS — APA YANG 8C TUTUP

| Rujukan panel | Isu | Penutupan dalam fail ini |
|---|---|---|
| **DP-18.4** | 52 fungsi TPMS boleh dipanggil oleh `anon` (tidak log masuk) | Seksyen 2: sapuan dinamik `REVOKE FROM PUBLIC` + `REVOKE FROM anon` + `GRANT authenticated` |
| **DP-18.4(b)** | Fungsi BAHARU mewarisi `anon` melalui `pg_default_acl` | Seksyen 3 (`ALTER DEFAULT PRIVILEGES`) **+ hadnya diukur: tidak mencukupi** — lihat DP-23.1 dan K9 |
| **DP-17.4(a)** | `current_user_role()` tidak menapis `is_active`/`account_status` → akaun **blocked masih berkuasa** | Seksyen 1: kedua-dua fungsi ditapis; akaun blocked/pending jatuh kepada `viewer` |
| **DP-17.4(b)** | `am_backfill_account_manager()` tiada gate SQL (hanya larangan prosa dalam prompt) | Seksyen 5: jadual `backfill_authorizations` + token **sekali-guna** ciptaan Super Admin |
| **DP-14.2** | Resolver boleh menjana calon blocked/super_admin → risiko pengikatan salah | Seksyen 4 + 6: `am_calon_layak()` menolak di titik WRITE; `am_backfill_pengecualian()` **melaporkan** (bukan NULL senyap) |
| **DP-23.6** | Jadual baharu mesti masuk allowlist W1 | `docs/PROMPT-6C-AUDIT-LEGACY-TABLES.md` sudah dikemas kini: **18 rasmi + 3 warisan = 21** |

**Sifat migration:** tambahan (additive) dan **idempoten** — boleh dijalankan
semula. Satu-satunya perubahan tidak-additif ialah `DROP FUNCTION
am_backfill_account_manager()` (tanpa argumen) lalu dicipta semula dengan
`(p_token uuid)`. **Ini selamat kerana diukur:** inventori `.rpc()` dalam
`app/`, `lib/`, `components/` = **26 nama fungsi berbeza**, dan
`am_backfill_account_manager` **bukan** salah satunya (ia RPC migration
sekali-guna yang anda jalankan, bukan dipanggil oleh aplikasi).

## 4. CAP JARI FAIL — sahkan SEBELUM memasang

| Metrik | Nilai |
|---|---|
| Blob SHA (Git) | `0d42c84db5de735b56eac9d650f01c937f38d7ea` |
| SHA-256 | `7e663ebea124c72c1d4eef367ae0f87b1c1db43e422100b34c19156e32002ebb` |
| Bait (`wc -c`) | 35862 |
| Baris (`wc -l`) | 772 |
| Aksara (titik kod) | 35748 |
| `CREATE TABLE` | 1 |
| `CREATE OR REPLACE FUNCTION` | 6 |
| `CREATE POLICY` | 2 |
| Baris `REVOKE ALL ON FUNCTION` | 16 |
| Baris `GRANT EXECUTE ON FUNCTION` | 8 |
| Baris pertama bukan kosong | `-- =====================================================================` |
| Baris terakhir bukan kosong | `-- =====================================================================` |

**Objek yang diterbitkan daripada fail itu sendiri (bukan direka):**

* Jadual (1): `backfill_authorizations`
* Fungsi (6): `current_user_role`, `current_role_name`, `am_calon_layak`, `am_backfill_authorize`, `am_backfill_account_manager`, `am_backfill_pengecualian`
* Polisi RLS (2): `backfill_auth_super_read`, `backfill_auth_super_insert`
* Inventori Seksyen 2 (55 nama): `admin_approve_user`, `admin_change_user_role`, `admin_list_users`, `admin_require_password_change`, `admin_reset_all_passwords_to_default`, `admin_reset_user_password`, `admin_set_user_blocked`, `admin_user_summary`, `am_backfill_account_manager`, `am_backfill_preview`, `am_confirm_alias`, `am_confirm_external`, `am_list_staff`, `am_revoke_alias`, `am_revoke_external`, `am_unresolved_values`, `assert_can_manage_users`, `assert_password_acceptable`, `can_manage_users`, `can_resolve_account_managers`, `cancel_change_request`, `cancel_programme_unlock`, `change_request_allowed_fields`, `current_role_name`, `current_user_id`, `current_user_role`, `default_password`, `enforce_programme_lock`, `expire_stale_unlocks`, `financial_docs_audit_trigger`, `handle_new_auth_user`, `has_role`, `is_external_account_manager`, `is_super_admin`, `is_unlock_approver`, `lock_programme`, `log_audit`, `mark_password_changed`, `my_account_status`, `my_password_change_required`, `normalize_person_name`, `participants_audit_trigger`, `programme_is_editable`, `programmes_audit_trigger`, `request_programme_unlock`, `resolve_account_manager`, `review_change_request`, `review_programme_unlock`, `set_updated_at`, `submit_change_request`, `sync_auth_user_update`, `sync_import_transaction`, `am_calon_layak`, `am_backfill_authorize`, `am_backfill_pengecualian`

🔴 **Jika SHA-256 atau bilangan bait yang anda kira BERBEZA daripada jadual di
atas, BERHENTI dan laporkan.** Jangan pasang fail yang berbeza daripada yang
Arena uji dalam PGlite.

## 5. LANGKAH 0 — J0 (READ-ONLY, jalankan DAHULU)

### J0a — Baseline privilej: berapa fungsi `public` boleh dipanggil oleh `anon`?

````sql
SELECT count(*)::int AS jumlah_fungsi_public,
       count(*) FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE'))::int
         AS anon_boleh_execute,
       count(*) FILTER (WHERE has_function_privilege('authenticated', p.oid, 'EXECUTE'))::int
         AS authenticated_boleh_execute
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public';
````

**Jangkaan:** `anon_boleh_execute` = `jumlah_fungsi_public` (≈52). Inilah lubang DP-18.4.

### J0b — Punca sistemik: entri `pg_default_acl` bagi fungsi dalam `public`.

````sql
SELECT d.defaclacl::text AS default_acl_fungsi
  FROM pg_default_acl d JOIN pg_namespace n ON n.oid = d.defaclnamespace
 WHERE n.nspname = 'public' AND d.defaclobjtype = 'f';
````

**Jangkaan:** mengandungi `anon=X/postgres` (mengesahkan F1 yang anda laporkan 2026-09-05).

### J0c — DP-17.4(a): adakah akaun blocked/pending yang AKAN kehilangan kuasa?

````sql
SELECT id::text AS uuid, full_name, email, role::text AS role, is_active,
       account_status::text AS account_status
  FROM public.user_profiles
 WHERE (is_active = false OR account_status <> 'active')
   AND role <> 'viewer'::public.app_role
 ORDER BY full_name;
````

**Jangkaan:** senarai akaun bukan-viewer yang tidak aktif, **dengan `uuid`**. **Tampal semua baris.** Selepas 8C, setiap akaun dalam senarai ini jatuh kepada `viewer` serta-merta. `uuid` baris pertama = `<UUID_AKAUN_BLOCKED>` untuk K3.

### J0d — Adakah objek 8C sudah wujud? (mengesan pemasangan separa /ulangan)

````sql
SELECT to_regclass('public.backfill_authorizations')::text AS jadual_gate,
       (SELECT count(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='public'
           AND p.proname IN ('am_calon_layak','am_backfill_authorize',
                             'am_backfill_pengecualian')) AS fungsi_8c,
       (SELECT string_agg(pg_get_function_identity_arguments(p.oid), ' | ')
          FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='public' AND p.proname='am_backfill_account_manager')
         AS tanda_tangan_backfill;
````

**Jangkaan:** SEBELUM pasang: `jadual_gate` = NULL, `fungsi_8c` = 0, `tanda_tangan_backfill` = string KOSONG (fungsi tanpa argumen).

### J0e — Baseline jadual (allowlist W1 — DP-23.6): berapa jadual rasmi kini?

````sql
SELECT count(*)::int AS jumlah_jadual_public
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r'
   AND c.relname NOT IN ('schema_migrations','spatial_ref_sys');
````

**Jangkaan:** **17 rasmi + 3 warisan = 20** sebelum 8C; **18 + 3 = 21** selepas 8C.

### J0f — Inventori penuh objek fungsi `public` — mengenal pasti delta 53 vs 52.

````sql
SELECT p.proname,
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
 ORDER BY p.proname;
````

**Jangkaan:** satu baris bagi setiap nama fungsi (jangkaan **52 atau 53** baris). **Tampal SEMUA baris.** Yang dicari: (a) nama dengan `bilangan_tanda_tangan > 1` (fungsi terlebih beban), (b) nama dengan `ahli_extension = true` (dikecualikan automatik oleh sapuan), dan (c) nama yang **bukan** milik TPMS — contohnya `pgrst_ddl_watch` / `pgrst_drop_watch`, yang sudah berada dalam senarai pengecualian 8C.

### J0g — UUID yang diperlukan oleh placeholder K3–K6 (read-only).

````sql
SELECT up.id::text AS uuid, up.full_name, up.email, up.role::text AS role,
       up.is_active, up.account_status::text AS account_status
  FROM public.user_profiles up
 WHERE up.role = 'super_admin'::public.app_role
    OR up.is_active = false
    OR up.account_status <> 'active'
    OR up.role IN ('admin'::public.app_role,'finance'::public.app_role,
                   'head_governance'::public.app_role)
 ORDER BY up.role::text, up.full_name
 LIMIT 25;
````

**Jangkaan:** cukup untuk mengisi `<UUID_SUPER_ADMIN>` (role = super_admin), `<UUID_AKAUN_BLOCKED>` (is_active = false / account_status = blocked) dan `<UUID_BUKAN_SUPER>` (admin/finance/head_governance yang **bukan** super_admin). **Tampal jadual penuh** supaya pemetaan UUID→peranan boleh diaudit; jangan ganti placeholder dengan nilai yang tidak dilaporkan.

### J0h — Default ACL fungsi **per peranan** (J0b memulangkan 2 baris di live).

````sql
SELECT r.rolname AS peranan_pemilik, d.defaclacl::text AS default_acl_fungsi
  FROM pg_default_acl d
  JOIN pg_namespace n ON n.oid = d.defaclnamespace
  JOIN pg_roles r ON r.oid = d.defaclrole
 WHERE n.nspname = 'public' AND d.defaclobjtype = 'f'
 ORDER BY r.rolname;
````

**Jangkaan:** dua baris di live: `postgres` dan `supabase_admin`, kedua-duanya mengandungi `anon=X/...`. Selepas 8C **hanya** baris `postgres` kehilangan `anon=`; baris `supabase_admin` **kekal** dan itu **DIJANGKA** (8C tidak berniat menukar default peranan platform).

## 6. LANGKAH 1 — PASANG (🔴 HANYA SELEPAS KELULUSAN PENGGUNA)

Buka **Supabase Dashboard → SQL Editor**, tampal **seluruh** kandungan
`lib/supabase/privilege-hardening.sql` **byte-for-byte**, dan jalankan.

````sql
-- =====================================================================
-- TPMS MIMOS Academy — Fasa 8C: PENGETATAN PRIVILEJ + GATE BACKFILL
-- =====================================================================
--
-- JENIS: migration ADITIF. Fail ini TIDAK menyunting mana-mana fail yang
--        sudah dipasang (`user-management.sql`, `fix-rls-recursion.sql`,
--        `client-master.sql`, `account-manager-resolution.sql`). Semua
--        perubahan dibuat dengan `CREATE OR REPLACE`, objek baharu, atau
--        `REVOKE`/`GRANT` — mengikut larangan berdiri dan preseden DP-13.2.
--
-- IDEMPOTEN: boleh dijalankan berulang kali dengan hasil yang sama.
--
-- ---------------------------------------------------------------------
-- SKOP — empat perkara yang panel sudah putuskan, tiada yang lain
-- ---------------------------------------------------------------------
--
-- (1) DP-18.4 + DP-20.2 — PENGETATAN PRIVILEJ `anon`.
--     Diukur live oleh probe S2-F: `pg_default_acl` bagi skema `public`
--     mengandungi `anon=X/postgres`, jadi SETIAP fungsi baharu mewarisi
--     EXECUTE untuk `anon`. F2 mengukur **46/46 fungsi pra-L3** dan **7/7
--     fungsi L3** boleh dipanggil tanpa log masuk (53 keseluruhan).
--     F4 menunjukkan `anon` tidak MENDAPATKAN data (uid=NULL, 0 baris) —
--     jadi ini **bukan** kebocoran aktif, tetapi ia bergantung sepenuhnya
--     kepada setiap fungsi menjaga dirinya sendiri. Fail ini:
--       (a) membuang capaian `anon` daripada fungsi TPMS yang sedia ada,
--       (b) mematikan pewarisan itu untuk fungsi baharu, dan
--       (c) merekodkan konvensyen wajib bagi setiap fungsi akan datang.
--
-- (2) DP-17.4(a) — `current_user_role()` / `current_role_name()` TIDAK
--     menapis akaun yang tidak boleh digunakan. Diukur: akaun **blocked**
--     berperanan `admin`/`finance` masih `can_resolve_account_managers() =
--     true` dan masih boleh menyenaraikan 19 staf. Mitigasi sedia ada ialah
--     pemadaman `auth.refresh_tokens` (log keluar paksa), jadi vektor utama
--     sudah tertutup; yang tinggal ialah JWT capaian yang belum luput.
--     Fail ini menutupnya di pangkalan data.
--
-- (3) DP-17.4(b) + DP-14.2 — `am_backfill_account_manager()`:
--       (a) gate 8C selama ini **prosedur sahaja** (larangan dalam prompt);
--           tiada mekanisme dalam SQL yang menghalang `admin`/`finance`/
--           `head_governance` memanggilnya hari ini. Fail ini menjadikannya
--           gate yang **dikuatkuasakan**: token kebenaran sekali-guna yang
--           mesti dicipta oleh Super Admin, dengan sebab, dan diaudit.
--       (b) backfill MESTI menolak `user_id` yang profilnya tidak aktif atau
--           berperanan `super_admin`, dan MESTI **melaporkannya** sebagai
--           pengecualian — bukan `NULL` senyap. Prinsip DP-14.2: data yang
--           salah mesti **bising**, bukan senyap.
--
-- (4) Konvensyen — setiap fungsi `public` baharu mesti ada:
--       REVOKE ALL ... FROM PUBLIC;
--       REVOKE ALL ... FROM anon;
--       GRANT EXECUTE ... TO authenticated;
--     `scripts/test-privilege-hardening.mjs` menguji ketiga-tiganya.
--
-- ---------------------------------------------------------------------
-- YANG SENGAJA **TIDAK** DIBUAT DALAM FAIL INI
-- ---------------------------------------------------------------------
--
-- * `resolve_account_manager()` TIDAK disempitkan (kata putus DP-14.2 =
--   Posisi C): menyempitkan carian akan membuat nilai yang merujuk kepada
--   akaun blocked **hilang senyap**. Penolakan dikawal di titik WRITE
--   (backfill) dan dilaporkan sebagai pengecualian.
-- * `am_confirm_alias()` / `am_confirm_external()` TIDAK disentuh untuk
--   kesetiaan audit: apabila DP-21.3 disemak semula terhadap badan fungsi
--   sebenar, kedua-duanya **sudah** mencatat `created` hanya untuk baris
--   baharu dan `updated` untuk pengesahan semula. Kecacatan yang dijumpai
--   hanya dalam **skrip seed** (`log_audit` tanpa syarat dalam gelung), dan
--   skrip itu beku kerana blob SHA-nya sudah dipasang di live. Mitigasinya
--   ialah "jangan jalankan seed dua kali" + ujian, bukan suntingan.
-- * `am_unresolved_values()` TIDAK ditukar jenis pulangannya. Menandai calon
--   blocked/Super Admin di UI (tindakan berjadual DP-14.2) memerlukan lajur
--   baharu, dan menukar `RETURNS TABLE` fungsi yang sudah dipasang memerlukan
--   `DROP` + `CREATE`. Kerana live mempunyai **sifar** nilai `Account Manager`
--   mentah (K8 `[]`, K9 `bilangan_nilai = 0`), penanda itu **tidak boleh
--   menyala hari ini**, dan gate backfill di bawah sudah menutup risiko
--   pengikatannya. Ditangguh ke 8B/8D apabila data wujud (DP-23.5).
--
-- Jalankan sebagai SATU pelaksanaan (satu transaction).
-- =====================================================================


-- =====================================================================
-- SEKSYEN 1 — DP-17.4(a): akaun yang tidak boleh digunakan kehilangan kuasa
-- =====================================================================
--
-- Reka bentuk penapis (fakta lajur DIUKUR, bukan diandaikan):
--
--   * `is_active` — `schema-master.sql:311`: `BOOLEAN NOT NULL DEFAULT true`.
--   * `account_status` — `user-management.sql:139-140`:
--     `public.account_status NOT NULL DEFAULT 'active'`, dengan nilai enum
--     `pending` (baru daftar, menunggu kelulusan Super Admin), `active`
--     (diluluskan), `blocked` (disekat). `LAST_SUPER_ADMIN` dalam
--     `user-management.sql` sudah menggunakan `account_status = 'active'`
--     sebagai penanda "boleh guna", jadi fail ini mengikut semantik yang sama.
--
--   KEDUA-DUA lajur ialah NOT NULL, jadi bentuk toleran NULL di bawah
--   (`is_active IS NOT FALSE`, `coalesce(account_status,'active')`) **tidak
--   boleh terpicu** dalam skema semasa. Ia dikekalkan sebagai pertahanan
--   berlapis yang kosnya sifar: ia membuatkan penapis ini tetap betul sekiranya
--   suatu migration kelak melonggarkan mana-mana kekangan, atau sekiranya satu
--   baris ditulis melalui laluan yang memintas DEFAULT.
--
--   ⚠️ PEMBETULAN FAKTA: draf awal fail ini mendakwa `is_active` "boleh NULL".
--   Dakwaan itu SALAH — ia berasal daripada lajur `is_active BOOLEAN` dalam
--   `RETURNS TABLE` fungsi `admin_list_users()` (user-management.sql:364),
--   iaitu takrifan baris hasil fungsi, BUKAN lajur jadual. Ujian PGlite
--   (`test-privilege-hardening.mjs`, Bahagian B) menangkap percanggahan ini
--   apabila `UPDATE ... SET is_active = NULL` gagal dengan 23502.
--
-- Kesan yang diukur pada fixture setara-live (20 profil: 19 aktif + `test`
-- blocked): 19 pengguna aktif **tidak berubah**; `test` jatuh kepada `viewer`.
--
-- `SET search_path = public` DITAMBAH: versi yang dipasang dalam
-- `fix-rls-recursion.sql` tidak menetapkannya, dan fungsi ini `SECURITY
-- DEFINER` — tanpa `search_path` yang dipin ia terdedah kepada *search_path
-- hijack*. Semua 7 fungsi Langkah 3 sudah dipin; kini dua fungsi ini juga.
--
-- 🔴 Fungsi ini dipanggil oleh `has_role()`, yang dipanggil oleh **polisi RLS
-- di seluruh sistem** (Fasa 6). Itulah sebabnya DP-17.4(a) ditangguh ke gate
-- ini dan bukan diedit terus: ia memerlukan suite penuh dijalankan semula.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT up.role
       FROM public.user_profiles up
      WHERE up.id = auth.uid()
        -- DP-17.4(a): akaun blocked/pending TIDAK memegang kuasa, walaupun
        -- JWT capaian yang sudah diterbitkan masih dalam tempoh sah.
        AND up.is_active IS NOT FALSE
        AND coalesce(up.account_status, 'active'::public.account_status) = 'active'),
    'viewer'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.current_role_name()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT up.role::text
       FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.is_active IS NOT FALSE
        AND coalesce(up.account_status, 'active'::public.account_status) = 'active'),
    'viewer'
  );
$$;

COMMENT ON FUNCTION public.current_user_role() IS
  'Peranan pengguna semasa. DP-17.4(a): memulangkan viewer jika akaun tidak '
  'aktif atau account_status bukan active — jadi akaun blocked/pending '
  'kehilangan kuasa serta-merta di pangkalan data, bukan hanya selepas JWT '
  'luput. Kedua-dua lajur ialah NOT NULL; bentuk toleran NULL di dalamnya '
  'ialah pertahanan berlapis, bukan pembaikan untuk baris warisan.';

-- Konvensyen (4) diterapkan kepada dua fungsi yang disentuh ini.
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

REVOKE ALL ON FUNCTION public.current_role_name() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_role_name() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_role_name() TO authenticated;


-- =====================================================================
-- SEKSYEN 2 — DP-18.4: buang capaian `anon` daripada SEMUA fungsi TPMS
-- =====================================================================
--
-- Reka bentuk: SATU sapuan dinamik + SATU inventori untuk laporan drift.
--
-- Mengapa sapuan dinamik dan bukan senarai nama semata-mata:
--
--   * Senarai nama 52 fungsi (diukur daripada repo, 2026-09-05) adalah tepat
--     pada masa ia ditulis, tetapi fasa seterusnya (8B, 8D, ...) akan mencipta
--     fungsi BAHARU. Jika revoke hanya mengikut senarai, fungsi baharu itu
--     terlepas — dan Seksyen 3 di bawah TIDAK dapat menutupnya (lihat
--     penjelasan terukur di sana).
--   * Sapuan dinamik merawat setiap fungsi dalam skema `public` yang BUKAN
--     ahli mana-mana extension, jadi migration ini boleh dijalankan semula
--     pada penghujung fasa akan datang dan terus berkesan.
--
-- Penapis keselamatan — mengapa `pg_depend.deptype = 'e'`:
--
--   * `REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public` tanpa penapis akan
--     menyentuh objek platform. Sekiranya PostGIS/pgjwt dipasang dalam skema
--     `public` pada projek live, fungsinya ialah **ahli extension** dan akan
--     dikecualikan oleh penapis ini. Objek platform tidak disentuh — itu di
--     luar skop kelulusan.
--   * Fungsi TPMS bukan ahli mana-mana extension, jadi semuanya dirawat.
--
-- `REVOKE` memerlukan **tanda tangan tepat** (Postgres membezakan fungsi
-- mengikut argumen), jadi identiti argumen dibaca daripada katalog melalui
-- `pg_get_function_identity_arguments()`. Ini juga menjadikan blok ini betul
-- untuk fungsi terlebih beban (overloaded).
--
-- Fungsi trigger (`set_updated_at`, `handle_new_auth_user`,
-- `*_audit_trigger`, `financial_docs_audit_trigger`) turut disapu: mekanisme
-- trigger **tidak** memerlukan grant EXECUTE, jadi membuang `anon` tidak
-- menjejaskan trigger — ia hanya menutup permukaan PostgREST.
--
-- Prinsip "bising, bukan senyap" (DP-14.2):
--   * nama dalam inventori yang TIDAK ditemui di live  -> RAISE WARNING
--   * nama disapu yang TIDAK ada dalam inventori       -> RAISE WARNING (DRIFT)
-- Kedua-duanya muncul dalam laporan ChatGPT supaya objek yang tidak dikenali
-- boleh disemak, dan bukan lolos secara senyap.

DO $$
DECLARE
  -- Inventori 52 fungsi TPMS pra-8C (diukur daripada repo, bukan direka).
  -- Kini digunakan untuk LAPORAN DRIFT sahaja; kerja revoke dilakukan oleh
  -- sapuan dinamik di bawah supaya tiada senarai kedua yang perlu diselenggara.
  v_inventori text[] := ARRAY[
    'admin_approve_user', 'admin_change_user_role', 'admin_list_users',
    'admin_require_password_change', 'admin_reset_all_passwords_to_default',
    'admin_reset_user_password', 'admin_set_user_blocked', 'admin_user_summary',
    'am_backfill_account_manager', 'am_backfill_preview', 'am_confirm_alias',
    'am_confirm_external', 'am_list_staff', 'am_revoke_alias',
    'am_revoke_external', 'am_unresolved_values', 'assert_can_manage_users',
    'assert_password_acceptable', 'can_manage_users',
    'can_resolve_account_managers', 'cancel_change_request',
    'cancel_programme_unlock', 'change_request_allowed_fields',
    'current_role_name', 'current_user_id', 'current_user_role',
    'default_password', 'enforce_programme_lock', 'expire_stale_unlocks',
    'financial_docs_audit_trigger', 'handle_new_auth_user', 'has_role',
    'is_external_account_manager', 'is_super_admin', 'is_unlock_approver',
    'lock_programme', 'log_audit', 'mark_password_changed', 'my_account_status',
    'my_password_change_required', 'normalize_person_name',
    'participants_audit_trigger', 'programme_is_editable',
    'programmes_audit_trigger', 'request_programme_unlock',
    'resolve_account_manager', 'review_change_request',
    'review_programme_unlock', 'set_updated_at', 'submit_change_request',
    'sync_auth_user_update', 'sync_import_transaction'
  ];
  -- Fungsi yang dicipta oleh fail INI — disenaraikan berasingan supaya
  -- inventori di atas kekal sebagai inventori fungsi PRA-8C yang diukur.
  v_nama_selepas text[] := ARRAY[
    'am_calon_layak', 'am_backfill_authorize', 'am_backfill_pengecualian'
  ];
  -- Objek PLATFORM Supabase yang diketahui wujud dalam skema `public`.
  -- Ditambah selepas laporan J0 live (2026-09-05) mendedahkan **53** objek
  -- fungsi di live sedangkan inventori repo mengandungi **52** nama — delta 1
  -- yang belum dikenal pasti. `pgrst_ddl_watch`/`pgrst_drop_watch` ialah fungsi
  -- event trigger milik platform yang dicipta oleh Supabase dalam `public` dan
  -- BUKAN ahli extension, jadi penapis `pg_depend` tidak mengecualikannya.
  --
  -- Mengapa dikecualikan walaupun risikonya rendah: mekanisme event trigger
  -- (seperti trigger biasa) TIDAK menyemak privilej EXECUTE, jadi menyapu
  -- fungsinya tidak merosakkannya — tetapi ia objek platform di luar skop
  -- kelulusan, dan prinsip fail ini ialah **tidak menyentuh apa yang bukan
  -- milik TPMS**. Pengecualian ini juga menjadikan jangkaan K1 boleh diramal:
  -- sebarang fungsi yang MASIH boleh dipanggil oleh `anon` selepas 8C mestilah
  -- bernama dalam senarai ini, dan K1 menampalnya.
  --
  -- Senarai ini boleh dipanjangkan apabila J0f (inventori penuh 53 objek)
  -- mengenal pasti delta itu dengan tepat.
  v_platform    text[]  := ARRAY['pgrst_ddl_watch', 'pgrst_drop_watch'];
  r             record;
  v_diproses    integer := 0;
  v_dilangkau   text[]  := ARRAY[]::text[];
  v_tiada       text[]  := ARRAY[]::text[];
  v_diluar      text[]  := ARRAY[]::text[];
  v_dikenali    text[];
BEGIN
  v_dikenali := v_inventori || v_nama_selepas;

  FOR r IN
    SELECT p.proname,
           pg_get_function_identity_arguments(p.oid) AS argumen
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       -- Kecualikan fungsi milik extension (objek platform, cth. PostGIS).
       AND NOT EXISTS (SELECT 1 FROM pg_depend d
                        WHERE d.objid = p.oid AND d.deptype = 'e')
       -- Kecualikan objek platform Supabase yang dinamakan secara eksplisit.
       AND p.proname <> ALL(v_platform)
     ORDER BY p.proname
  LOOP
    -- Konvensyen (4): PUBLIC dan anon dibuang, authenticated dikekalkan.
    -- REVOKE FROM PUBLIC adalah yang benar-benar menutup `anon`: selagi
    -- PUBLIC memegang EXECUTE, `anon` turut memegangnya (Seksyen 3).
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC',
                   r.proname, r.argumen);
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM anon',
                   r.proname, r.argumen);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated',
                   r.proname, r.argumen);
    v_diproses := v_diproses + 1;

    IF NOT (r.proname = ANY(v_dikenali)) THEN
      v_diluar := v_diluar || r.proname;
    END IF;
  END LOOP;

  -- Inventori yang tidak ditemui di live (drift repo -> live).
  SELECT array_agg(x) INTO v_tiada
    FROM unnest(v_dikenali) AS x
   WHERE NOT EXISTS (SELECT 1 FROM pg_proc p
                       JOIN pg_namespace n ON n.oid = p.pronamespace
                      WHERE n.nspname = 'public' AND p.proname = x);

  -- Objek platform yang SENGAJA dilangkau — dilaporkan, bukan senyap (DP-14.2).
  SELECT array_agg(p.proname ORDER BY p.proname) INTO v_dilangkau
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = ANY(v_platform);

  RAISE NOTICE '8C Seksyen 2: % tanda tangan fungsi dalam public dirawat (REVOKE PUBLIC + REVOKE anon + GRANT authenticated)', v_diproses;

  IF v_dilangkau IS NOT NULL THEN
    RAISE NOTICE '8C Seksyen 2: % objek platform DILANGKAU (tidak disentuh): % — dijangka; K1 akan menampalnya sebagai baki capaian anon',
      cardinality(v_dilangkau), array_to_string(v_dilangkau, ', ');
  END IF;

  IF v_tiada IS NOT NULL AND cardinality(v_tiada) > 0 THEN
    -- Bukan ralat: fungsi boleh ditambah/dibuang di live oleh fasa lain.
    RAISE WARNING '8C Seksyen 2: % fungsi dalam inventori TIDAK ditemui di live: %',
      cardinality(v_tiada), array_to_string(v_tiada, ', ');
  END IF;

  IF cardinality(v_diluar) > 0 THEN
    RAISE WARNING '8C Seksyen 2 DRIFT: % fungsi dirawat tetapi TIADA dalam inventori 8C: % — sahkan setiap nama ini memang milik TPMS dan bukan objek platform',
      cardinality(v_diluar), array_to_string(v_diluar, ', ');
  END IF;
END
$$;


-- =====================================================================
-- SEKSYEN 3 — DP-18.4: default privileges (dan hadnya, diukur)
-- =====================================================================
--
-- 🔴 PENEMUAN TERUKUR YANG PALING PENTING DALAM FASA 8C.
--
-- Andaian asal (dan punca yang diukur oleh probe F1 ChatGPT): `pg_default_acl`
-- bagi skema `public` mengandungi `anon=X/postgres`, jadi setiap fungsi baharu
-- mewarisi EXECUTE untuk `anon`; maka `ALTER DEFAULT PRIVILEGES ... REVOKE`
-- akan mematikan pewarisan itu.
--
-- Andaian itu **SEPARUH BETUL**, dan ujian 8C (Bahagian E) membuktikannya:
--
--   pg_default_acl SEBELUM 8C : {authenticated=X/postgres, anon=X/postgres}
--   pg_default_acl SELEPAS 8C : {authenticated=X/postgres}   <- anon BERJAYA dibuang
--   fungsi dicipta SELEPAS 8C : has_function_privilege('anon', ...) = TRUE  <- MASIH BOCOR
--
-- Punca kebocoran yang tinggal: PostgreSQL membina ACL awal fungsi baharu
-- daripada `acldefault()`, yang memberi EXECUTE kepada pseudo-peranan
-- **PUBLIC**, kemudian MENAMBAH entri `pg_default_acl` di atasnya.
-- `pg_default_acl` menyimpan ACL *hasil*, bukan operasi delta — jadi tiada cara
-- untuk menyimpan "buang PUBLIC" di dalamnya. Selagi PUBLIC memegang EXECUTE,
-- `anon` memegangnya juga. Kesimpulannya:
--
--   ** `ALTER DEFAULT PRIVILEGES` TIDAK BOLEH mematikan pewarisan `anon`. **
--
-- Apa yang benar-benar menutupnya (diukur dalam PGlite yang sama):
--
--   fungsi baharu, tiada revoke eksplisit        -> anon = TRUE
--   fungsi baharu + REVOKE ALL ... FROM PUBLIC   -> anon = FALSE, authenticated = TRUE
--
-- Maka penutupan fungsi baharu datang daripada DUA lapisan lain:
--
--   * Lapisan 1 — Seksyen 2 (sapuan dinamik). Migration ini idempoten, jadi ia
--     dijalankan semula pada penghujung setiap fasa akan datang dan menutup
--     fungsi yang fasa itu cipta.
--   * Lapisan 2 — `scripts/test-konvensyen-privilej.mjs` (pengawal CI). Fungsi
--     baharu dalam `lib/supabase/*.sql` mesti membawa baris konvensyen (4)
--     sendiri, jadi ia tertutup SEMASA dicipta — bukan hanya apabila seseorang
--     teringat untuk menjalankan semula 8C.
--
-- Arahan di bawah tetap DIKEKALKAN, dengan sebab yang jujur:
--
--   1. `REVOKE ... FROM anon` — membuang entri `anon=X/postgres` yang eksplisit
--      daripada `pg_default_acl` live (punca F1). Ini mengurangkan satu laluan
--      pemberian kuasa, walaupun ia bukan penutupan penuh.
--   2. `REVOKE ... FROM PUBLIC` — tidak berkesan terhadap `acldefault()` terbina
--      dalam (diukur), tetapi ia menetapkan niat dalam katalog dan menutup
--      entri PUBLIC sekiranya `pg_default_acl` live memang mempunyainya.
--   3. `GRANT EXECUTE ... TO authenticated` — memastikan fungsi baharu terus
--      boleh dipanggil oleh pengguna yang log masuk tanpa bergantung kepada
--      sapuan. `postgres` dan `service_role` tidak disentuh.
--
-- Jika suatu hari nanti satu fungsi memang patut didedahkan kepada pelawat
-- tanpa log masuk, ia memerlukan `GRANT EXECUTE ... TO anon` yang **eksplisit**
-- — dan itu sepatutunya kelihatan dalam semakan kod.
--
-- Nota: `ALTER DEFAULT PRIVILEGES` hanya terpakai kepada objek yang dicipta
-- **selepas** arahan ini, oleh peranan yang menjalankannya (`postgres` dalam
-- migration Supabase). Fungsi yang sedia ada dirawat dalam Seksyen 2.

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;


-- =====================================================================
-- SEKSYEN 4 — DP-14.2: kelayakan calon (helper tulen, boleh diuji)
-- =====================================================================
--
-- Dipisahkan supaya penapis DP-14.2 wujud di SATU tempat dan boleh diuji
-- secara langsung, dan supaya `am_backfill_pengecualian()` dan
-- `am_backfill_account_manager()` tidak boleh drift antara satu sama lain.

CREATE OR REPLACE FUNCTION public.am_calon_layak(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.user_profiles up
     WHERE up.id = p_user_id
       -- DP-14.2: jangan ikat data perniagaan kepada akaun yang tidak boleh
       -- digunakan, atau kepada akaun pentadbiran (bukan AM perniagaan).
       AND up.is_active IS NOT FALSE
       AND coalesce(up.account_status, 'active'::public.account_status) = 'active'
       AND up.role <> 'super_admin'::public.app_role
  );
$$;

COMMENT ON FUNCTION public.am_calon_layak(uuid) IS
  'DP-14.2: adakah profil ini layak menerima pengikatan data perniagaan? '
  'Menolak akaun tidak aktif, akaun bukan active, dan super_admin. Digunakan '
  'oleh am_backfill_account_manager() dan am_backfill_pengecualian() supaya '
  'keduanya tidak boleh drift.';

REVOKE ALL ON FUNCTION public.am_calon_layak(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.am_calon_layak(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.am_calon_layak(uuid) TO authenticated;


-- =====================================================================
-- SEKSYEN 5 — DP-17.4(b): gate 8C yang DIKUATKUASAAN (bukan prosedur)
-- =====================================================================
--
-- Gate 8C selama ini ialah larangan #4 dalam prompt GPT — iaitu **prosedur**,
-- bukan kawalan. Sesiapa dengan peranan `admin`/`finance`/`head_governance`
-- boleh memanggil `am_backfill_account_manager()` hari ini.
--
-- Reka bentuk: **token kebenaran sekali-guna**.
--
--   * Hanya Super Admin boleh mencipta token (`am_backfill_authorize`), dan
--     mesti menyatakan **sebab** — jadi kebenaran itu sendiri mempunyai jejak
--     audit dan tidak boleh diberikan secara sambil lewa.
--   * Token tunggal-guna: selepas backfill berjaya, `used_at` diisi dan token
--     itu tidak boleh dipakai lagi. Setiap larian backfill memerlukan satu
--     keputusan manusia yang eksplisit.
--   * Backfill tanpa token (atau token yang tidak sah/sudah dipakai) naik
--     `42501` — kod yang sama dengan penolakan kuasa lain, jadi klien sedia
--     ada menerjemahkannya dengan cara yang sama.
--
-- `DROP FUNCTION` di bawah adalah **sengaja dan selamat**: menukar senarai
-- argumen tidak boleh dilakukan dengan `CREATE OR REPLACE` (Postgres akan
-- mencipta fungsi kedua dan meninggalkan yang lama). Tiada kod aplikasi
-- memanggil fungsi ini (disahkan: inventori `.rpc(` dalam `app/`, `lib/`,
-- `components/` tidak mengandungi `am_backfill_account_manager`), dan tiada
-- pandangan atau fungsi lain bergantung kepadanya.

CREATE TABLE IF NOT EXISTS public.backfill_authorizations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  reason        text NOT NULL,
  authorized_by uuid NOT NULL REFERENCES auth.users (id),
  used_at       timestamptz,
  used_by       uuid REFERENCES auth.users (id),
  CONSTRAINT backfill_authorizations_reason_panjang
    CHECK (length(btrim(reason)) >= 12)
);

COMMENT ON TABLE public.backfill_authorizations IS
  'DP-17.4(b): gate 8C yang dikuatkuasakan. Setiap larian '
  'am_backfill_account_manager() memerlukan satu token sekali-guna yang '
  'dicipta oleh Super Admin dengan sebab bertulis (minimum 12 aksara). '
  'Menukar gate prosedur (larangan dalam prompt) kepada gate pangkalan data.';

ALTER TABLE public.backfill_authorizations ENABLE ROW LEVEL SECURITY;

-- Polisi: hanya Super Admin yang boleh melihat/mencipta kebenaran.
DROP POLICY IF EXISTS backfill_auth_super_read ON public.backfill_authorizations;
CREATE POLICY backfill_auth_super_read
  ON public.backfill_authorizations FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS backfill_auth_super_insert ON public.backfill_authorizations;
CREATE POLICY backfill_auth_super_insert
  ON public.backfill_authorizations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

-- Nota: tiada polisi UPDATE/DELETE — `used_at` diisi oleh fungsi SECURITY
-- DEFINER (yang tidak tertakluk kepada RLS), jadi tiada keperluan untuk
-- mendedahkan tulisan langsung. Ini juga bermakna token tidak boleh dibuang
-- atau diedit melalui API: jejak kebenaran itu kekal.

CREATE OR REPLACE FUNCTION public.am_backfill_authorize(p_reason text)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'tiada kuasa: hanya Super Admin boleh membenarkan backfill pengurus akaun'
      USING ERRCODE = '42501';
  END IF;

  IF length(btrim(coalesce(p_reason, ''))) < 12 THEN
    RAISE EXCEPTION 'sebab kebenaran terlalu pendek: minimum 12 aksara supaya keputusan ini boleh diaudit'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.backfill_authorizations (reason, authorized_by)
  VALUES (btrim(p_reason), public.current_user_id())
  RETURNING id INTO v_id;

  PERFORM public.log_audit(
    'backfill_authorizations', v_id, 'created', NULL,
    jsonb_build_object('reason', btrim(p_reason)),
    jsonb_build_object('fasa', '8C', 'fungsi', 'am_backfill_authorize',
                       'asas', 'DP-17.4(b): gate 8C dikuatkuasakan')
  );

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.am_backfill_authorize(text) IS
  'DP-17.4(b): cipta token kebenaran sekali-guna untuk backfill pengurus '
  'akaun. Super Admin sahaja; sebab minimum 12 aksara; diaudit.';

REVOKE ALL ON FUNCTION public.am_backfill_authorize(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.am_backfill_authorize(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.am_backfill_authorize(text) TO authenticated;

-- Buang versi lama (tiada argumen) sebelum mencipta versi bertoken.
DROP FUNCTION IF EXISTS public.am_backfill_account_manager();

CREATE OR REPLACE FUNCTION public.am_backfill_account_manager(p_token uuid)
RETURNS TABLE (jadual text, baris_diisi bigint, baris_kekal_null bigint)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv_filled  bigint;
  v_inv_null    bigint;
  v_stg_filled  bigint;
  v_stg_null    bigint;
  v_pengecualian bigint;
  v_who         uuid;
BEGIN
  -- Lapis 1: kuasa peranan (tidak berubah daripada versi asal).
  IF NOT public.can_resolve_account_managers() THEN
    RAISE EXCEPTION 'tiada kuasa: backfill memerlukan peranan admin, head_governance atau finance'
      USING ERRCODE = '42501';
  END IF;

  -- Lapis 2 (BAHARU, DP-17.4(b)): gate token sekali-guna.
  IF p_token IS NULL THEN
    RAISE EXCEPTION 'gate 8C: backfill memerlukan token kebenaran. Cipta satu dengan am_backfill_authorize(sebab) — Super Admin sahaja.'
      USING ERRCODE = '42501';
  END IF;

  SELECT ba.authorized_by INTO v_who
    FROM public.backfill_authorizations ba
   WHERE ba.id = p_token
     AND ba.used_at IS NULL;

  IF v_who IS NULL THEN
    RAISE EXCEPTION 'gate 8C: token kebenaran tidak wujud atau sudah digunakan (sekali-guna)'
      USING ERRCODE = '42501';
  END IF;

  -- Lapis 3 (BAHARU, DP-14.2): hanya ikat kepada calon yang LAYAK.
  -- Penolakan tidak dibuat senyap — ia dikira di sini dan disenaraikan oleh
  -- am_backfill_pengecualian() supaya operator boleh melihat dan membetulkannya.
  UPDATE public.invoices i
     SET account_manager_id = public.resolve_account_manager(i.account_manager)
   WHERE i.account_manager_id IS NULL
     AND btrim(coalesce(i.account_manager, '')) <> ''
     AND public.resolve_account_manager(i.account_manager) IS NOT NULL
     AND public.am_calon_layak(public.resolve_account_manager(i.account_manager));
  GET DIAGNOSTICS v_inv_filled = ROW_COUNT;

  SELECT count(*) INTO v_inv_null
    FROM public.invoices i
   WHERE i.account_manager_id IS NULL
     AND btrim(coalesce(i.account_manager, '')) <> '';

  UPDATE public.import_staging s
     SET account_manager_id = public.resolve_account_manager(s.account_manager)
   WHERE s.account_manager_id IS NULL
     AND btrim(coalesce(s.account_manager, '')) <> ''
     AND public.resolve_account_manager(s.account_manager) IS NOT NULL
     AND public.am_calon_layak(public.resolve_account_manager(s.account_manager));
  GET DIAGNOSTICS v_stg_filled = ROW_COUNT;

  SELECT count(*) INTO v_stg_null
    FROM public.import_staging s
   WHERE s.account_manager_id IS NULL
     AND btrim(coalesce(s.account_manager, '')) <> '';

  SELECT count(*) INTO v_pengecualian FROM public.am_backfill_pengecualian();

  -- Token ditandai terpakai SELEPAS kerja berjaya: jika backfill gagal,
  -- transaction dibatalkan dan token itu masih boleh digunakan semula.
  UPDATE public.backfill_authorizations ba
     SET used_at = now(),
         used_by = public.current_user_id()
   WHERE ba.id = p_token;

  PERFORM public.log_audit(
    'invoices',
    NULL,
    'updated',
    NULL,
    NULL,
    jsonb_build_object(
      'fasa', '8C',
      'fungsi', 'am_backfill_account_manager',
      'token', p_token,
      'invoices_diisi', v_inv_filled,
      'invoices_kekal_null', v_inv_null,
      'staging_diisi', v_stg_filled,
      'staging_kekal_null', v_stg_null,
      'pengecualian_dilapor', v_pengecualian,
      'asas', 'DP-17.4(b) gate + DP-14.2 penapis kelayakan'
    )
  );

  RETURN QUERY
    SELECT 'invoices'::text, v_inv_filled, v_inv_null
    UNION ALL
    SELECT 'import_staging'::text, v_stg_filled, v_stg_null;
END;
$$;

COMMENT ON FUNCTION public.am_backfill_account_manager(uuid) IS
  'DP-17.4(b) + DP-14.2: isi account_manager_id daripada nilai mentah. '
  'Memerlukan (1) peranan yang berkuasa dan (2) token kebenaran sekali-guna '
  'daripada Super Admin. Menolak calon yang tidak aktif atau super_admin, dan '
  'penolakan itu dilaporkan oleh am_backfill_pengecualian() — bukan NULL senyap.';

REVOKE ALL ON FUNCTION public.am_backfill_account_manager(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.am_backfill_account_manager(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.am_backfill_account_manager(uuid) TO authenticated;


-- =====================================================================
-- SEKSYEN 6 — DP-14.2: laporan pengecualian (bising, bukan senyap)
-- =====================================================================
--
-- Prinsip DP-14.2: jika resolver menjana calon yang tidak layak, nilai itu
-- mesti **muncul dalam laporan pengecualian** — boleh dilihat, boleh
-- dibetulkan — dan bukan hilang sebagai NULL.
--
-- Read-only: tiada tulisan, jadi ia selamat dipanggil bila-bila masa oleh
-- sesiapa yang berkuasa menguruskan pengurus akaun.

CREATE OR REPLACE FUNCTION public.am_backfill_pengecualian()
RETURNS TABLE (
  sumber        text,
  nilai_mentah  text,
  calon_id      uuid,
  calon_nama    text,
  sebab         text,
  jumlah_baris  bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_resolve_account_managers() THEN
    -- Deny-by-default: pulangan kosong, bukan ralat (konsisten dengan
    -- am_list_staff / am_unresolved_values, disahkan L3-R S4).
    RETURN;
  END IF;

  RETURN QUERY
  WITH mentah AS (
    SELECT 'invoices'::text AS src, btrim(i.account_manager) AS raw
      FROM public.invoices i
     WHERE i.account_manager_id IS NULL
       AND btrim(coalesce(i.account_manager, '')) <> ''
    UNION ALL
    SELECT 'import_staging'::text, btrim(s.account_manager)
      FROM public.import_staging s
     WHERE s.account_manager_id IS NULL
       AND btrim(coalesce(s.account_manager, '')) <> ''
  ),
  calon AS (
    SELECT m.src,
           m.raw,
           public.resolve_account_manager(m.raw) AS uid
      FROM mentah m
  )
  SELECT c.src,
         c.raw,
         c.uid,
         (SELECT up.full_name FROM public.user_profiles up WHERE up.id = c.uid LIMIT 1),
         CASE
           WHEN (SELECT up.role FROM public.user_profiles up WHERE up.id = c.uid LIMIT 1)
                = 'super_admin'::public.app_role
             THEN 'calon ialah super_admin (akaun pentadbiran, bukan AM perniagaan)'
           WHEN (SELECT up.is_active FROM public.user_profiles up WHERE up.id = c.uid LIMIT 1) IS FALSE
             THEN 'calon tidak aktif (is_active = false)'
           ELSE 'calon bukan account_status = active'
         END,
         count(*)::bigint
    FROM calon c
   WHERE c.uid IS NOT NULL
     AND NOT public.am_calon_layak(c.uid)
   GROUP BY c.src, c.raw, c.uid
   ORDER BY count(*) DESC, c.raw;
END;
$$;

COMMENT ON FUNCTION public.am_backfill_pengecualian() IS
  'DP-14.2: senarai nilai mentah yang resolver-nya menjana calon TIDAK LAYAK '
  '(akaun tidak aktif atau super_admin). Read-only. Nilai ini sengaja TIDAK '
  'diikat oleh backfill; ia dilaporkan supaya manusia boleh membetulkannya.';

REVOKE ALL ON FUNCTION public.am_backfill_pengecualian() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.am_backfill_pengecualian() FROM anon;
GRANT EXECUTE ON FUNCTION public.am_backfill_pengecualian() TO authenticated;


-- =====================================================================
-- PENGESAHAN SELEPAS PEMASANGAN (read-only — jalankan dan laporkan)
-- =====================================================================
--
-- 8C-a: tiada fungsi TPMS yang masih boleh dipanggil oleh `anon`.
--       Jangkaan: `anon_boleh = 0`, `auth_boleh = jumlah_fungsi`.
--
--   SELECT count(*) AS jumlah_fungsi,
--          count(*) FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE'))          AS anon_boleh,
--          count(*) FILTER (WHERE has_function_privilege('authenticated', p.oid, 'EXECUTE')) AS auth_boleh
--     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--    WHERE n.nspname = 'public';
--
-- 8C-b: pewarisan `anon` sudah mati — `acl` tidak lagi mengandungi `anon=`.
--
--   SELECT pg_catalog.pg_get_userbyid(d.defaclrole) AS ditetapkan_oleh,
--          d.defaclobjtype, d.defaclacl::text AS acl
--     FROM pg_default_acl d
--     JOIN pg_namespace n ON n.oid = d.defaclnamespace
--    WHERE n.nspname = 'public' AND d.defaclobjtype = 'f';
--
-- 8C-c: akaun blocked kehilangan kuasa (DP-17.4(a)).
--       Jangkaan: `test` (blocked) → `can_resolve = false`, `staf = 0`.
--
-- 8C-d: gate backfill (DP-17.4(b)).
--       Jangkaan: tanpa token → `42501`; token sekali-guna → guna kedua `42501`.
--
-- =====================================================================
````

**Arahan pemasangan:**

1. Sahkan cap jari (Seksyen 4) SEBELUM menampal.
2. Tampal **semua** 772 baris — jangan potong, jangan "kemas kini" format.
3. Jalankan **sekali**. Migration ini idempoten, jadi jika ia gagal separuh
   jalan, **BERHENTI** dan tampal ralat penuh (larangan 13).
4. **Simpan dan tampal SEMUA output NOTICE/WARNING** — diperlukan untuk K12.
   Baris `8C Seksyen 2: N tanda tangan fungsi ... dirawat` ialah bukti sapuan
   benar-benar berlaku; `WARNING ... DRIFT` menandakan objek yang tidak
   dikenali dan **mesti** dilaporkan.

## 7. LANGKAH 2 — PENGESAHAN K1–K12

Gantikan tiga placeholder ini dengan nilai SEBENAR daripada projek live:
`<UUID_SUPER_ADMIN>`, `<UUID_AKAUN_BLOCKED>` (daripada J0c), dan
`<UUID_BUKAN_SUPER>` (akaun finance/admin yang bukan Super Admin).

### K1 — Tiada fungsi TPMS lagi yang boleh dipanggil oleh `anon` (baki dinamakan).

````sql
SELECT count(*)::int AS jumlah,
       count(*) FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE'))::int AS anon,
       count(*) FILTER (WHERE has_function_privilege('authenticated', p.oid, 'EXECUTE'))::int AS auth,
       coalesce(string_agg(p.proname, ', ' ORDER BY p.proname)
                  FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE')),
                '(tiada)') AS nama_masih_anon
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public';
````

**Jangkaan:** `auth` = `jumlah`. `anon` = **0** jika tiada objek platform dalam `public`; jika J0f menemui `pgrst_ddl_watch`/`pgrst_drop_watch`, `anon` = **bilangan objek itu** dan `nama_masih_anon` **menamakannya** — itu **DIJANGKA dan BETUL** (8C sengaja tidak menyentuh objek platform). 🔴 Yang **TIDAK** boleh diterima: sebarang nama TPMS dalam `nama_masih_anon`. **Tampal keempat-empat nilai.**

### K2 — Entri `anon` hilang daripada default ACL peranan `postgres` sahaja.

````sql
SELECT r.rolname AS peranan_pemilik,
       d.defaclacl::text AS default_acl_fungsi,
       (d.defaclacl::text LIKE '%anon=%') AS masih_ada_anon
  FROM pg_default_acl d
  JOIN pg_namespace n ON n.oid = d.defaclnamespace
  JOIN pg_roles r ON r.oid = d.defaclrole
 WHERE n.nspname = 'public' AND d.defaclobjtype = 'f'
 ORDER BY r.rolname;
````

**Jangkaan:** baris `postgres`: `masih_ada_anon` = **false**, dan `authenticated=X/postgres` masih ada. Baris `supabase_admin`: `masih_ada_anon` = **true** — **DIJANGKA, BUKAN KEGAGALAN**. Sebab: `ALTER DEFAULT PRIVILEGES` tanpa `FOR ROLE` hanya mengubah entri peranan semasa (`postgres`); 8C **tidak** berniat menukar default peranan platform. Jangan cuba "membaiki" baris `supabase_admin`.

### K3 — DP-17.4(a) — akaun blocked kehilangan kuasa (diukur, READ-ONLY + ROLLBACK).

````sql
BEGIN;
-- Ganti <UUID_AKAUN_BLOCKED> dengan satu id daripada J0c (akaun blocked/pending).
SELECT set_config('request.jwt.claims',
  json_build_object('sub','<UUID_AKAUN_BLOCKED>','role','authenticated')::text, true);
SELECT public.current_user_role()::text AS peranan_semasa,
       public.current_role_name()      AS nama_peranan,
       public.can_resolve_account_managers() AS boleh_selesai,
       (SELECT count(*)::int FROM public.am_list_staff()) AS staf_dilihat;
ROLLBACK;
````

**Jangkaan:** `peranan_semasa` = **viewer**, `boleh_selesai` = **false**, `staf_dilihat` = **0**. Jika J0c memulangkan 0 baris, tulis `⏳ TIADA AKAUN BLOCKED UNTUK DIUJI` dan tampal bukti J0c.

### K4 — Pengguna sah TIDAK terjejas (tiada lockout beramai-ramai).

````sql
BEGIN;
-- Ganti <UUID_SUPER_ADMIN> dengan id akaun Super Admin anda.
SELECT set_config('request.jwt.claims',
  json_build_object('sub','<UUID_SUPER_ADMIN>','role','authenticated')::text, true);
SELECT public.current_user_role()::text AS peranan,
       public.is_super_admin()         AS super,
       public.can_resolve_account_managers() AS boleh_selesai,
       (SELECT count(*)::int FROM public.am_list_staff()) AS staf_dilihat;
ROLLBACK;
````

**Jangkaan:** `peranan` = **super_admin**, `super` = **true**, `boleh_selesai` = **true**, `staf_dilihat` = **19**.

### K5 — DP-17.4(b) — backfill TANPA token ditolak (42501).

````sql
BEGIN;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','<UUID_SUPER_ADMIN>','role','authenticated')::text, true);
DO $$
BEGIN
  PERFORM * FROM public.am_backfill_account_manager(NULL);
  RAISE NOTICE 'K5 GAGAL: backfill tanpa token TIDAK ditolak';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'K5 LULUS: 42501 -> %', SQLERRM;
END $$;
ROLLBACK;
````

**Jangkaan:** NOTICE `K5 LULUS: 42501 -> gate 8C: backfill memerlukan token kebenaran...`. Tampal NOTICE itu verbatim. Jika `K5 GAGAL` muncul, gate tidak dipasang — 🔴 blocker.

### K6 — Gate token: hanya Super Admin, sebab ≥ 12 aksara, token SEKALI-GUNA.

````sql
-- (a) bukan Super Admin -> 42501
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
ROLLBACK;
````

**Jangkaan:** NOTICE: `K6a LULUS: 42501`, `K6b LULUS: 22023`, `K6c token dicipta: <uuid>`, `K6c larian-1 memulangkan 2 baris`, dan `K6c LULUS: penggunaan kedua ditolak 42501`. **Tampal semua NOTICE** dan sahkan `ROLLBACK` muncul tiga kali dalam output.

### K7 — DP-14.2 — laporan pengecualian boleh dipanggil dan beritem.

````sql
BEGIN;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','<UUID_SUPER_ADMIN>','role','authenticated')::text, true);
SELECT * FROM public.am_backfill_pengecualian();
ROLLBACK;
````

**Jangkaan:** **0 baris** dijangka hari ini (J1 Fasa 8A mengukur SIFAR nilai mentah `Account Manager` di live). Yang penting: fungsi **wujud dan boleh dipanggil** tanpa ralat. Tampal header lajur yang dipulangkan.

### K8 — Objek 8C wujud dengan tanda tangan yang betul.

````sql
SELECT to_regclass('public.backfill_authorizations')::text AS jadual_gate,
       (SELECT count(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='public' AND p.proname IN
           ('am_calon_layak','am_backfill_authorize','am_backfill_pengecualian')) AS fungsi_8c,
       (SELECT string_agg(pg_get_function_identity_arguments(p.oid), ' | ')
          FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='public' AND p.proname='am_backfill_account_manager')
         AS tanda_tangan_backfill,
       (SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
         WHERE n.nspname='public' AND c.relname='backfill_authorizations') AS rls;
````

**Jangkaan:** `jadual_gate` = **backfill_authorizations** (`to_regclass()::text` memulangkan nama tanpa skema apabila `public` ada dalam search_path); `fungsi_8c` = **3**; `tanda_tangan_backfill` = **p_token uuid**; `rls` = **true**.

### K9 — Had platform DP-23.1 diukur di live (bukan diandaikan daripada PGlite).

````sql
BEGIN;
CREATE FUNCTION public.zz_uji_pewarisan_8c() RETURNS boolean
  LANGUAGE sql STABLE AS $$ SELECT true $$;
SELECT has_function_privilege('anon','public.zz_uji_pewarisan_8c()'::regprocedure,'EXECUTE')
         AS anon_mewarisi,
       has_function_privilege('authenticated','public.zz_uji_pewarisan_8c()'::regprocedure,'EXECUTE')
         AS authenticated_ok;
DROP FUNCTION public.zz_uji_pewarisan_8c();
ROLLBACK;
````

**Jangkaan:** PGlite mengukur `anon_mewarisi` = **true** walaupun K2 lulus (kerana `acldefault()` memberi EXECUTE kepada PUBLIC, dan `anon` ialah ahli PUBLIC). **Laporkan nilai live yang sebenar** — jika live juga `true`, itu mengesahkan DP-23.1 dan Lapisan 2 (pengawal CI) adalah penutupan yang sebenarnya. Jangan "betulkan" keputusan supaya sepadan dengan jangkaan Arena.

### K10 — Aplikasi masih berfungsi selepas 8C (tiada aliran terputus).

````sql
-- read-only: senarai fungsi yang diperlukan oleh UI (26 RPC dalam kod app)
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
 ORDER BY p.proname;
````

**Jangkaan:** semua 12 baris: `auth` = **true**, `anon` = **false**. Kemudian **muat semula dashboard TPMS di Vercel** dan sahkan panel data (DP-22) + halaman Account Manager masih memaparkan data.

### K11 — Baseline jadual selepas 8C (allowlist W1 — DP-23.6).

````sql
SELECT count(*)::int AS jumlah_jadual_public,
       count(*) FILTER (WHERE c.relrowsecurity)::int AS ber_rls
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r'
   AND c.relname NOT IN ('schema_migrations','spatial_ref_sys');
````

**Jangkaan:** **21** jadual (18 rasmi + 3 warisan). Jika W1 penuh dijalankan semula, `backfill_authorizations` mesti muncul sebagai `RASMI (repo)` — **BUKAN** `⚠️ WARISAN`.

### K12 — Output NOTICE/WARNING migration ditampal VERBATIM (laporan drift).

````sql
-- Tiada query: gunakan output daripada Langkah 1 (Supabase SQL Editor
-- memaparkan NOTICE/WARNING dalam tab Messages/output).
````

**Jangkaan:** Tampal **semua** baris `8C Seksyen 2: ... dirawat`, serta SEBARANG `WARNING ... DRIFT` atau `... TIDAK ditemui di live`. Nama dalam DRIFT **mesti** disenaraikan satu per satu — ia mungkin objek platform yang perlu dikecualikan. Jangan ringkaskan.

## 8. LARANGAN

1. JANGAN ubah skema/RLS/RPC/trigger/seed/storage/password selain fail
   `lib/supabase/privilege-hardening.sql` yang dibenarkan oleh prompt ini.
2. JANGAN guna `service_role` dalam sebarang ujian.
3. JANGAN panggil RPC tulis perniagaan (`sync_import_transaction`, `lock_programme`,
   `request_programme_unlock`, `submit_change_request`, `review_change_request`).
4. JANGAN reset/ubah password mana-mana akaun.
5. JANGAN merge ke `main`, dan JANGAN tukar Production Branch Vercel. Prompt ini
   **tidak** meluluskannya.
6. JANGAN tampal anon key penuh / sebarang rahsia dalam laporan.
7. JANGAN mereka-reka bukti — setiap LULUS mesti ada bukti verbatim; jika tidak dapat
   diuji, tulis `⏳ MENUNGGU PENGGUNA`.
8. JANGAN layan preview local (Mod Demo) sebagai production.
9. JANGAN **berhenti senyap** apabila alat gagal. Namakan operasi spesifik yang dicuba,
   tampal ralat penuhnya, kemudian teruskan bahagian lain yang boleh.
10. 🔴 **8C-khas:** JANGAN jalankan semula `seed-account-manager-aliases.sql`. Ia fail
    BEKU (DP-21.3: auditnya tidak idempoten) dan 8C **tidak** memerlukannya.
11. 🔴 **8C-khas:** JANGAN sekat/menaktifkan mana-mana akaun SEBENAR semata-mata untuk
    menguji K3. Guna akaun blocked yang **sudah wujud** (J0c). Jika tiada, tulis
    `⏳ TIADA AKAUN BLOCKED UNTUK DIUJI`.
12. 🔴 **8C-khas:** JANGAN tinggalkan sebarang transaksi terbuka. Setiap query K yang
    menulis bermula dengan `BEGIN` dan **mesti** berakhir dengan `ROLLBACK` — sahkan
    perkataan `ROLLBACK` muncul dalam output yang anda tampal.
13. 🔴 **8C-khas:** JANGAN `DROP` atau sunting fungsi yang sudah dipasang selain yang
    fail 8C sendiri lakukan. Jika Langkah 1 gagal separuh jalan, **BERHENTI** dan tampal
    ralat penuh — jangan cuba "membaiki" dengan SQL ciptaan sendiri.

## 9. FORMAT LAPORAN (WAJIB — 6 seksyen)

**Seksyen 1 — Konteks & Status:** deploy commit Vercel, projek Supabase, dan
  sama ada J0 (5 query) sudah dijalankan.
**Seksyen 2 — Tindakan yang diambil:** Langkah 0 → 1 → 2, dengan output/bukti verbatim.
**Seksyen 3 — Keputusan ujian (jadual):** `K1..K12` | status ✅/❌/⏳ | bukti verbatim.
**Seksyen 4 — Isu / Blocker:** 🔴/🟠/🟢 + penerangan + bukti + cadangan. **WAJIB**
  melaporkan sebarang `WARNING ... DRIFT` daripada Langkah 1 di sini.
**Seksyen 5 — Pengesahan penuh:** senarai semak dipatuhi (persona, 13 larangan,
  ROLLBACK disahkan, mock vs live).
**Seksyen 6 — Kesimpulan & langkah seterusnya:** keputusan + cadangan.

Untuk **K12**, tampal **semua** baris NOTICE/WARNING — jangan ringkaskan.
Untuk **K1**, tampal **ketiga-tiga** nombor (jumlah / anon / auth).

**Berhenti selepas laporan.** Jangan mula fasa berikutnya (8B/8D) sehingga Arena
menyemak laporan ini.

---

## Nota untuk Arena (bukan sebahagian prompt)

* Penjana: `scripts/generate-8c-prompt.mjs`. Jana semula selepas SEBARANG
  perubahan pada `lib/supabase/privilege-hardening.sql`, kemudian jalankan
  `node scripts/test-doc-references.mjs` (seksyen [6] menyemak SHA-256 dalam
  prompt terhadap fail semasa; seksyen [8] menjalankan penjana dengan `--check`).
* K9 sengaja meminta ChatGPT **melaporkan nilai live sebenar** walaupun PGlite
  sudah mengukur `true`. Jika live berbeza daripada PGlite, itu penemuan
  baharu (fixture tidak setara live — kelas kesilapan DP-14.2) dan mesti
  dibawa ke panel.
* Jangkaan K4 `staf_dilihat = 19` dan K11 `21 jadual` adalah berdasarkan
  laporan live terkini (J0a/J1). Jika live sudah berubah, kemaskini penjana —
  jangan sunting dokumen yang dijana.
