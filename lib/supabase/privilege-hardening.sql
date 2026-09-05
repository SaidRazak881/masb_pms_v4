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
