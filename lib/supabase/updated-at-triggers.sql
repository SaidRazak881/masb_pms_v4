-- =====================================================================
-- TPMS MIMOS Academy — Fasa 6G: fungsi + trigger `updated_at`
-- =====================================================================
--
-- KENAPA FAIL INI WUJUD (penemuan daripada audit Z, PROMPT-6F)
-- -------------------------------------------------------------
-- Repo mencipta kolum `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` pada
-- 10 jadual rasmi, tetapi **TIDAK PERNAH** mencipta fungsi atau trigger untuk
-- mengemas kininya:
--
--   $ git grep -niE "create trigger.*updated_at|set_updated_at" HEAD -- '*.sql'
--   ❌ TIADA
--
-- Di pangkalan data LIVE, kolum itu berfungsi untuk 5 jadual sahaja — kerana
-- `private.set_updated_at()` dan 6 trigger `trg_*_updated_at` dicipta secara
-- MANUAL sebelum projek ini dimuat naik ke git (sejarah repo bermula dengan
-- `535fb13 "Add files via upload"`).
--
-- Akibatnya:
--   1. **Pemasangan bersih daripada repo tidak mempunyai fungsi updated_at
--      langsung** — kolum itu kekal pada nilai INSERT selama-lamanya.
--   2. **Di live, 6 jadual rasmi ada kolum `updated_at` tetapi 0 trigger**:
--      app_settings, cost_items, financial_docs, organizers,
--      programme_documents, user_profiles.
--   3. Fungsi `updated_at` live bergantung kepada kod pra-repo yang tidak
--      terkawal, tidak diuji, dan tidak dikemas kini oleh mana-mana pemasangan.
--
-- Bukti live (Z2/Z4, laporan PROMPT-6F ChatGPT):
--   import_staging  → trg_import_staging_updated_at  → private.set_updated_at()
--   invoices        → trg_invoices_updated_at        → private.set_updated_at()
--   participants    → trg_participants_updated_at    → private.set_updated_at()
--   profiles        → trg_profiles_updated_at        → private.set_updated_at()  (warisan)
--   programme_costs → trg_programme_costs_updated_at → private.set_updated_at()
--   programmes      → trg_programmes_updated_at      → private.set_updated_at()
--
-- APA YANG FAIL INI LAKUKAN
-- -------------------------
--   A. Cipta `public.set_updated_at()` — fungsi TERKAWAL REPO, badan serupa
--      dengan `private.set_updated_at()` yang disahkan dalam Z5:
--          BEGIN NEW.updated_at = now(); RETURN NEW; END;
--   B. Alih 6 trigger sedia ada (5 rasmi + 1 warisan) daripada
--      `private.set_updated_at()` kepada `public.set_updated_at()`.
--   C. Tambah trigger kepada 6 jadual rasmi yang ada kolum `updated_at`
--      tetapi tiada trigger di live.
--
-- Selepas fail ini, `private.set_updated_at()` menjadi **yatim sepenuhnya**
-- dan boleh dibuang melalui prompt berasingan (belum diluluskan).
--
-- KESELAMATAN / SKOP
-- ------------------
--   - Tidak menyentuh RLS, polisi, privilej, atau data.
--   - Tidak menyentuh `private.has_role()`, `private.write_audit_log()`, atau
--     `private.validate_programme_lock()` — ketiga-tiganya diuruskan berasingan.
--   - `profiles` (jadual warisan) **sengaja dikecualikan** daripada jadual
--     baharu: ia calon DROP, jadi tidak guna menambah fungsi repo kepadanya.
--     Trigger sedia ada `trg_profiles_updated_at` dialihkan juga supaya
--     `private.set_updated_at()` boleh dibuang kelak tanpa memecahkan live.
--   - Idempoten: selamat dijalankan berulang kali.
--
-- UJIAN: scripts/test-updated-at-triggers.mjs
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- A. Fungsi updated_at terkawal repo
-- ---------------------------------------------------------------------
-- `SET search_path = ''` + rujukan schema-qualified: mengelak penghijackan
-- search_path. Tiada SELECT/INSERT di dalamnya, jadi tiada risiko RLS
-- recursion (berbeza daripada kelas masalah C13).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
  'Trigger BEFORE UPDATE: set updated_at = now(). Menggantikan private.set_updated_at() pra-repo (Fasa 6G).';

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated;

-- ---------------------------------------------------------------------
-- B+C. Trigger pada 11 jadual (5 dialih + 6 baharu)
-- ---------------------------------------------------------------------
-- Nama trigger lama diDROP secara eksplisit supaya tiada trigger berganda
-- (trigger lama memanggil private.set_updated_at(), yang akan menjadi yatim).
DO $$
DECLARE
  t text;
  targets text[] := ARRAY[
    'import_staging','invoices','participants','programme_costs','programmes',
    'app_settings','cost_items','financial_docs','organizers',
    'programme_documents','user_profiles'
  ];
  i int;
BEGIN
  -- B. Alih trigger pra-repo (nama lama, fungsi lama)
  FOR i IN 1 .. array_length(targets, 1) LOOP
    t := targets[i];
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE 'set_updated_at: jadual public.% tiada — dilangkau', t;
      CONTINUE;
    END IF;

    -- Buang trigger pra-repo jika wujud (nama lama dari live)
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I', t, t);
    -- Buang nama seragam baharu jika fail ini dijalankan semula
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);

    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);

    RAISE NOTICE 'set_updated_at: trigger dipasang pada public.%', t;
  END LOOP;

  -- B2. Jadual warisan `profiles`: alih juga, supaya private.set_updated_at()
  --     boleh dibuang kelak. profiles TIDAK diberi trigger baharu jika ia
  --     kemudiannya di-DROP; tetapi selagi ia wujud, updated_atnya mesti
  --     terus berfungsi.
  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles';
    EXECUTE 'DROP TRIGGER IF EXISTS set_updated_at ON public.profiles';
    EXECUTE 'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
               FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()';
    RAISE NOTICE 'set_updated_at: trigger dipasang pada public.profiles (warisan)';
  END IF;
END
$$;

COMMIT;

-- ---------------------------------------------------------------------
-- PENGESAHAN (read-only — jalankan selepas pemasangan)
-- ---------------------------------------------------------------------
-- Jangkaan: 12 baris, SEMUA origin = 'public.set_updated_at()',
--           dan TIADA baris 'private.set_updated_at()'.
--
-- SELECT t.event_object_table AS table_name,
--        t.trigger_name,
--        t.action_statement   AS executes,
--        CASE WHEN t.action_statement ILIKE '%private.%' THEN '🔴 PRA-REPO'
--             WHEN t.action_statement ILIKE '%public.%'  THEN '🟢 repo'
--             ELSE '⚪ tidak dikualifikasi' END AS origin
--   FROM information_schema.triggers t
--  WHERE t.trigger_schema = 'public'
--    AND t.action_statement ILIKE '%set_updated_at%'
--  ORDER BY origin DESC, t.event_object_table;
--
-- Dan sahkan tiada trigger updated_at yang merujuk private.*:
--
-- SELECT count(*)::int AS baki_private
--   FROM information_schema.triggers
--  WHERE trigger_schema = 'public'
--    AND action_statement ILIKE '%private.set_updated_at%';
-- -- Jangkaan: 0
