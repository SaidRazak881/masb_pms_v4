-- =====================================================================
-- ACCOUNT-MANAGER-RESOLUTION.sql  —  Fasa 8A-2 (Panel DP-2, 2026-09-04)
-- Pengesahan alias oleh manusia + pengisian account_manager_id
-- =====================================================================
--
-- PRASYARAT: `lib/supabase/client-master.sql` (Fasa 8A) MESTI sudah
-- dipasang. Fail ini menggunakan:
--   * public.account_manager_aliases
--   * public.normalize_person_name(text)
--   * public.resolve_account_manager(text)
--   * invoices.account_manager_id / import_staging.account_manager_id
--
-- KENAPA FAIL INI WUJUD
-- ---------------------
-- Fasa 8A memasang STRUKTUR sahaja dan sengaja TIDAK mengisi
-- `account_manager_id`, kerana 4 daripada 12 nilai sebenar adalah kabur:
--
--   'Fuzy'              x8   -> mungkin Fuziah, TIDAK pasti
--   'Fuzy / Dila'       x4   -> DUA orang dalam satu sel
--   'Fuzy / Sholihin '  x2   -> DUA orang dalam satu sel
--   'Ow Zi Qi'          x3   -> tiada dalam senarai staf
--
-- Prinsip Panel DP-2: **sistem mengingat keputusan manusia, ia tidak
-- meneka.** Jadi nilai kabur memerlukan manusia memutuskan. Fail ini
-- menyediakan permukaan untuk keputusan itu, dan kemudian mengisi pautan.
--
-- VETO YANG DIPATUHI
-- ------------------
-- §2.4 Kewangan : SISTEM tidak boleh memilih seorang daripada sel berbilang
--                 orang. `resolve_account_manager()` masih mengembalikan NULL
--                 untuknya. DIBATALKAN untuk keputusan MANUSIA oleh Panel DP-8
--                 (keputusan pengguna 2026-09-04): `am_confirm_alias()` kini
--                 menerima sel berbilang orang, dan merekodkan
--                 `sel_berbilang_orang = true` dalam jejak audit supaya kesan
--                 komisen (Fasa 8F) boleh diaudit kemudian.
-- §2.7 QA       : tiada padanan kabur automatik. Setiap pautan yang diisi
--                 datang daripada `resolve_account_manager()`, yang
--                 mengembalikan NULL bila tidak pasti.
-- §2.8 Keselamatan : `am_list_staff()` mengembalikan **HANYA** id + nama.
--                 Tiada peranan, `account_status`, atau e-mel — jadi tiada
--                 laluan bocor maklumat staf melalui permukaan ini.
--
-- SKOP
-- ----
-- ✅ Cipta 6 fungsi; tiada perubahan struktur jadual
-- ✅ Idempoten — selamat dijalankan berulang kali
-- ✅ Setiap tulis diaudit melalui public.log_audit()
-- ❌ TIADA DROP TABLE / TRUNCATE / DELETE daripada jadual perniagaan
-- ❌ TIDAK menambah nilai enum (guna 'created'/'updated'/'deleted' sedia ada)
-- ❌ TIDAK menjalankan backfill — itu dipanggil secara eksplisit dengan
--    p_dry_run, dan tertakluk kepada HARD GATE
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Kebenaran: siapa boleh mengurus pemetaan pengurus akaun?
-- ---------------------------------------------------------------------
-- Selaras dengan polisi RLS `account_manager_aliases` dalam client-master.sql.
-- NOTA ENUM: `super_admin` BUKAN nilai enum app_role. Ia dikendali DI DALAM
-- has_role() (schema-master.sql:274), yang mengembalikan true untuk SEMUA
-- peranan bila current_user_role()::text = 'super_admin'. Jadi has_role('admin')
-- SUDAH meliputi Super Admin.

CREATE OR REPLACE FUNCTION public.can_resolve_account_managers()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.has_role('admin'::public.app_role)
      OR public.has_role('head_governance'::public.app_role)
      OR public.has_role('finance'::public.app_role);
END;
$$;

REVOKE ALL ON FUNCTION public.can_resolve_account_managers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_resolve_account_managers() TO authenticated;


-- ---------------------------------------------------------------------
-- 2. Senarai staf untuk pemilih — pendedahan MINIMUM (veto §2.8)
-- ---------------------------------------------------------------------
-- Mengembalikan HANYA id + full_name. SENGAJA TIDAK mengembalikan role,
-- account_status, email, designation atau department.

CREATE OR REPLACE FUNCTION public.am_list_staff()
RETURNS TABLE (id uuid, full_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_resolve_account_managers() THEN
    RETURN;   -- kosong, bukan ralat: tiada pendedahan kepada yang tidak berkuasa
  END IF;

  RETURN QUERY
    SELECT up.id, up.full_name
      FROM public.user_profiles up
     WHERE up.is_active = true
     ORDER BY up.full_name;
END;
$$;

REVOKE ALL ON FUNCTION public.am_list_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.am_list_staff() TO authenticated;


-- ---------------------------------------------------------------------
-- 3. Nilai yang belum selesai — permukaan kerja untuk manusia
-- ---------------------------------------------------------------------
-- Mengagregat nilai MENTAH daripada invoices + import_staging, dan tunjukkan
-- sama ada ia sudah selesai atau tidak.
--
-- `kategori` membezakan TIGA keadaan yang berbeza secara meaningful:
--   'SELESAI'        -> pautan sudah boleh diisi
--   'BERBILANG_ORANG'-> sel mengandungi >1 orang; KEKAL NULL (veto §2.4)
--   'PERLU_PENGESAHAN'-> sistem enggan meneka; manusia mesti memutuskan
--   'TIADA_PADANAN'  -> tiada staf sepadan langsung (cth. 'Ow Zi Qi')

CREATE OR REPLACE FUNCTION public.am_unresolved_values()
RETURNS TABLE (
  raw_text        text,
  jumlah_baris    bigint,
  dari_invoices   bigint,
  dari_staging    bigint,
  resolved_id     uuid,
  resolved_name   text,
  kategori        text,
  alias_wujud     boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_resolve_account_managers() THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH mentah AS (
    SELECT btrim(i.account_manager) AS raw, 'invoices' AS sumber
      FROM public.invoices i
     WHERE i.account_manager IS NOT NULL
       AND btrim(i.account_manager) <> ''
    UNION ALL
    SELECT btrim(s.account_manager), 'staging'
      FROM public.import_staging s
     WHERE s.account_manager IS NOT NULL
       AND btrim(s.account_manager) <> ''
  ),
  agregat AS (
    SELECT m.raw,
           count(*)::bigint                                     AS jumlah,
           count(*) FILTER (WHERE m.sumber = 'invoices')::bigint AS inv,
           count(*) FILTER (WHERE m.sumber = 'staging')::bigint  AS stg
      FROM mentah m
     GROUP BY m.raw
  )
  SELECT a.raw,
         a.jumlah,
         a.inv,
         a.stg,
         public.resolve_account_manager(a.raw)                       AS rid,
         (SELECT up.full_name FROM public.user_profiles up
           WHERE up.id = public.resolve_account_manager(a.raw)
           LIMIT 1)                                                  AS rname,
         CASE
           -- SELESAI didahulukan: jika alias manusia wujud ATAU penyelesai
           -- berjaya, nilai itu selesai -- termasuk sel berbilang orang yang
           -- sudah diputuskan manusia (Panel DP-8).
           WHEN public.resolve_account_manager(a.raw) IS NOT NULL
             THEN 'SELESAI'
           WHEN EXISTS (SELECT 1 FROM public.account_manager_aliases al
                         WHERE public.normalize_person_name(al.raw_text)
                               = public.normalize_person_name(a.raw))
             THEN 'SELESAI'
           -- sel berbilang orang yang BELUM diputuskan manusia: kekal NULL.
           -- Veto Kewangan §2.4 berkuat kuasa untuk SISTEM; DP-8 membenarkan
           -- MANUSIA memutuskannya melalui am_confirm_alias().
           WHEN public.normalize_person_name(a.raw) LIKE '%/%'
             OR public.normalize_person_name(a.raw) LIKE '%,%'
             OR public.normalize_person_name(a.raw) LIKE '% dan %'
             OR public.normalize_person_name(a.raw) LIKE '% & %'
             THEN 'BERBILANG_ORANG'
           -- tiada staf yang mengandungi sebarang token nilai ini
           WHEN NOT EXISTS (
                  SELECT 1 FROM public.user_profiles up
                   WHERE position(
                           split_part(public.normalize_person_name(a.raw), ' ', 1)
                           in public.normalize_person_name(up.full_name)) > 0)
             THEN 'TIADA_PADANAN'
           ELSE 'PERLU_PENGESAHAN'
         END                                                         AS kat,
         EXISTS (SELECT 1 FROM public.account_manager_aliases al2
                  WHERE public.normalize_person_name(al2.raw_text)
                        = public.normalize_person_name(a.raw))        AS alias_ada
    FROM agregat a
   ORDER BY kat, a.jumlah DESC, a.raw;
END;
$$;

REVOKE ALL ON FUNCTION public.am_unresolved_values() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.am_unresolved_values() TO authenticated;


-- ---------------------------------------------------------------------
-- 4. Sahkan alias (manusia memutuskan)
-- ---------------------------------------------------------------------
-- Ini ialah SATU-SATUNYA cara 'Fuzy' boleh mula menyelesaikan kepada
-- Fuziah. Ia menulis jejak audit.
--
-- Jika pemetaan untuk raw_text yang sama SUDAH ada dan menunjuk staf
-- BERBEZA, ia dikemas kini dan perubahan itu diaudit sebagai 'updated'
-- dengan old_data/new_data — supaya keputusan lama tidak hilang senyap.

CREATE OR REPLACE FUNCTION public.am_confirm_alias(
  p_raw_text text,
  p_user_id  uuid,
  p_notes    text DEFAULT NULL
)
RETURNS TABLE (raw_text text, user_id uuid, full_name text, tindakan text)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm      text;
  v_existing  uuid;
  v_alias_id  uuid;
  v_action    public.audit_action;
  v_name      text;
  v_berbilang boolean;
BEGIN
  IF NOT public.can_resolve_account_managers() THEN
    RAISE EXCEPTION 'tiada kuasa: pengesahan alias memerlukan peranan admin, head_governance atau finance'
      USING ERRCODE = '42501';
  END IF;

  v_norm := public.normalize_person_name(p_raw_text);
  IF v_norm IS NULL THEN
    RAISE EXCEPTION 'raw_text tidak boleh kosong' USING ERRCODE = '22023';
  END IF;

  -- Panel DP-8 (keputusan pengguna 2026-09-04): sel berbilang orang BOLEH
  -- dipetakan kepada seorang staf, tetapi HANYA melalui keputusan manusia
  -- yang eksplisit di sini. Veto Kewangan §2.4 masih berkuat kuasa untuk
  -- SISTEM (resolve_account_manager tidak akan pernah memilih sendiri),
  -- tetapi ia tidak boleh menghalang MANUSIA daripada memutuskan.
  --
  -- Fakta yang direkodkan bersama keputusan ini supaya kesan komisen
  -- (Fasa 8F) boleh diaudit kemudian:
  v_berbilang := (v_norm LIKE '%/%' OR v_norm LIKE '%,%'
                  OR v_norm LIKE '% dan %' OR v_norm LIKE '% & %');

  IF NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = p_user_id) THEN
    RAISE EXCEPTION 'user_id tidak merujuk kepada profil staf yang wujud'
      USING ERRCODE = '23503';
  END IF;

  SELECT up.full_name INTO v_name FROM public.user_profiles up WHERE up.id = p_user_id;

  SELECT al.user_id, al.id INTO v_existing, v_alias_id
    FROM public.account_manager_aliases al
   WHERE public.normalize_person_name(al.raw_text) = v_norm
   LIMIT 1;

  IF v_existing IS NULL THEN
    INSERT INTO public.account_manager_aliases
      (raw_text, user_id, confirmed_by, notes)
    VALUES
      (btrim(p_raw_text), p_user_id, public.current_user_id(), p_notes)
    RETURNING account_manager_aliases.id INTO v_alias_id;
    v_action := 'created';
  ELSIF v_existing = p_user_id THEN
    -- pemetaan sama disahkan semula: kemas kini nota/masa sahaja
    UPDATE public.account_manager_aliases al
       SET confirmed_by = public.current_user_id(),
           confirmed_at = now(),
           notes        = coalesce(p_notes, al.notes)
     WHERE al.id = v_alias_id;
    v_action := 'updated';
  ELSE
    UPDATE public.account_manager_aliases al
       SET user_id      = p_user_id,
           confirmed_by = public.current_user_id(),
           confirmed_at = now(),
           notes        = p_notes
     WHERE al.id = v_alias_id;
    v_action := 'updated';
  END IF;

  PERFORM public.log_audit(
    'account_manager_aliases',
    v_alias_id,
    v_action,
    CASE WHEN v_action = 'updated'
         THEN jsonb_build_object('raw_text', btrim(p_raw_text), 'user_id', v_existing)
         ELSE NULL END,
    jsonb_build_object('raw_text', btrim(p_raw_text),
                       'user_id', p_user_id,
                       'full_name', v_name,
                       'notes', p_notes),
    jsonb_build_object('fasa', '8A-2', 'fungsi', 'am_confirm_alias',
                       'sel_berbilang_orang', v_berbilang,
                       'asas', CASE WHEN v_berbilang
                                    THEN 'Panel DP-8: keputusan pengguna 2026-09-04'
                                    ELSE 'padanan biasa' END)
  );

  RETURN QUERY SELECT btrim(p_raw_text), p_user_id, v_name, v_action::text;
END;
$$;

REVOKE ALL ON FUNCTION public.am_confirm_alias(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.am_confirm_alias(text, uuid, text) TO authenticated;


-- ---------------------------------------------------------------------
-- 5. Batalkan alias (manusia membatalkan keputusan)
-- ---------------------------------------------------------------------
-- Selepas pembatalan, nilai itu kembali kepada keadaan asal: NULL atau
-- penyelesaian automatik. Diaudit sebagai 'deleted'.

CREATE OR REPLACE FUNCTION public.am_revoke_alias(p_raw_text text)
RETURNS TABLE (raw_text text, former_user_id uuid, tindakan text)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm   text;
  v_row    public.account_manager_aliases%ROWTYPE;
BEGIN
  IF NOT public.can_resolve_account_managers() THEN
    RAISE EXCEPTION 'tiada kuasa: pembatalan alias memerlukan peranan admin, head_governance atau finance'
      USING ERRCODE = '42501';
  END IF;

  v_norm := public.normalize_person_name(p_raw_text);

  SELECT * INTO v_row
    FROM public.account_manager_aliases al
   WHERE public.normalize_person_name(al.raw_text) = v_norm
   LIMIT 1;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'tiada alias untuk nilai ini' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.account_manager_aliases al WHERE al.id = v_row.id;

  PERFORM public.log_audit(
    'account_manager_aliases',
    v_row.id,
    'deleted',
    jsonb_build_object('raw_text', v_row.raw_text,
                       'user_id', v_row.user_id,
                       'confirmed_at', v_row.confirmed_at),
    NULL,
    jsonb_build_object('fasa', '8A-2', 'fungsi', 'am_revoke_alias')
  );

  RETURN QUERY SELECT v_row.raw_text, v_row.user_id, 'deleted'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.am_revoke_alias(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.am_revoke_alias(text) TO authenticated;


-- ---------------------------------------------------------------------
-- 6. Pratonton pengisian (TIDAK menulis apa-apa)
-- ---------------------------------------------------------------------
-- Menunjukkan APAKAH yang akan berubah sebelum sebarang UPDATE.
-- Ini membolehkan pengguna menyemak sebelum meluluskan backfill sebenar.

CREATE OR REPLACE FUNCTION public.am_backfill_preview()
RETURNS TABLE (
  jadual          text,
  jumlah_baris    bigint,
  ada_nilai_mentah bigint,
  akan_diisi      bigint,
  kekal_null      bigint,
  sudah_dipautkan bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_resolve_account_managers() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 'invoices'::text,
         count(*)::bigint,
         count(*) FILTER (WHERE btrim(coalesce(i.account_manager,'')) <> '')::bigint,
         count(*) FILTER (WHERE i.account_manager_id IS NULL
                            AND btrim(coalesce(i.account_manager,'')) <> ''
                            AND public.resolve_account_manager(i.account_manager) IS NOT NULL)::bigint,
         count(*) FILTER (WHERE i.account_manager_id IS NULL
                            AND btrim(coalesce(i.account_manager,'')) <> ''
                            AND public.resolve_account_manager(i.account_manager) IS NULL)::bigint,
         count(*) FILTER (WHERE i.account_manager_id IS NOT NULL)::bigint
    FROM public.invoices i
  UNION ALL
  SELECT 'import_staging',
         count(*),
         count(*) FILTER (WHERE btrim(coalesce(s.account_manager,'')) <> ''),
         count(*) FILTER (WHERE s.account_manager_id IS NULL
                            AND btrim(coalesce(s.account_manager,'')) <> ''
                            AND public.resolve_account_manager(s.account_manager) IS NOT NULL),
         count(*) FILTER (WHERE s.account_manager_id IS NULL
                            AND btrim(coalesce(s.account_manager,'')) <> ''
                            AND public.resolve_account_manager(s.account_manager) IS NULL),
         count(*) FILTER (WHERE s.account_manager_id IS NOT NULL)
    FROM public.import_staging s;
END;
$$;

REVOKE ALL ON FUNCTION public.am_backfill_preview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.am_backfill_preview() TO authenticated;


-- ---------------------------------------------------------------------
-- 7. Pengisian sebenar — 🔴 TERTAKLUK KEPADA HARD GATE
-- ---------------------------------------------------------------------
-- Mengisi `account_manager_id` HANYA apabila:
--   * ia kini NULL                     (tidak pernah menimpa keputusan sedia ada)
--   * nilai mentah tidak kosong
--   * `resolve_account_manager()` mengembalikan bukan-NULL
--
-- Jadi baris yang kabur KEKAL NULL — itu betul, bukan kegagalan.
-- Idempoten: larian kedua mengisi 0 baris.

CREATE OR REPLACE FUNCTION public.am_backfill_account_manager()
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
BEGIN
  IF NOT public.can_resolve_account_managers() THEN
    RAISE EXCEPTION 'tiada kuasa: backfill memerlukan peranan admin, head_governance atau finance'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.invoices i
     SET account_manager_id = public.resolve_account_manager(i.account_manager)
   WHERE i.account_manager_id IS NULL
     AND btrim(coalesce(i.account_manager, '')) <> ''
     AND public.resolve_account_manager(i.account_manager) IS NOT NULL;
  GET DIAGNOSTICS v_inv_filled = ROW_COUNT;

  SELECT count(*) INTO v_inv_null
    FROM public.invoices i
   WHERE i.account_manager_id IS NULL
     AND btrim(coalesce(i.account_manager, '')) <> '';

  UPDATE public.import_staging s
     SET account_manager_id = public.resolve_account_manager(s.account_manager)
   WHERE s.account_manager_id IS NULL
     AND btrim(coalesce(s.account_manager, '')) <> ''
     AND public.resolve_account_manager(s.account_manager) IS NOT NULL;
  GET DIAGNOSTICS v_stg_filled = ROW_COUNT;

  SELECT count(*) INTO v_stg_null
    FROM public.import_staging s
   WHERE s.account_manager_id IS NULL
     AND btrim(coalesce(s.account_manager, '')) <> '';

  PERFORM public.log_audit(
    'invoices',
    NULL,
    'updated',
    NULL,
    NULL,
    jsonb_build_object(
      'fasa', '8A-2',
      'fungsi', 'am_backfill_account_manager',
      'invoices_diisi', v_inv_filled,
      'invoices_kekal_null', v_inv_null,
      'staging_diisi', v_stg_filled,
      'staging_kekal_null', v_stg_null
    )
  );

  RETURN QUERY
    SELECT 'invoices'::text, v_inv_filled, v_inv_null
    UNION ALL
    SELECT 'import_staging'::text, v_stg_filled, v_stg_null;
END;
$$;

REVOKE ALL ON FUNCTION public.am_backfill_account_manager() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.am_backfill_account_manager() TO authenticated;


-- =====================================================================
-- PENGESAHAN (read-only)
-- =====================================================================
-- SELECT p.proname, pg_get_function_result(p.oid) AS returns,
--        p.prosecdef, p.provolatile, p.proconfig
--   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
--  WHERE n.nspname='public' AND p.proname LIKE 'am\_%'
--     OR p.proname = 'can_resolve_account_managers'
--  ORDER BY p.proname;
--
-- Jangkaan: 7 fungsi. Semua SECURITY DEFINER, semua search_path=public.
-- Ujian berkelakuan: scripts/test-account-manager-resolution.mjs
