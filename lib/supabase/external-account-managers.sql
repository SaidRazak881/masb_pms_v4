-- =====================================================================
-- EXTERNAL-ACCOUNT-MANAGERS.sql  —  Fasa 8A-2 (Panel DP-9, 2026-09-04)
-- Pengurus akaun LUAR — orang yang sengaja TIDAK diagih kepada staf
-- =====================================================================
--
-- KEPUTUSAN PENGGUNA YANG MENCETUSKAN FAIL INI
-- ---------------------------------------------
-- Selepas Panel DP-8 menyelesaikan 11 daripada 12 nilai `Account Manager`,
-- hanya `'Ow Zi Qi'` (3 baris invois + 1 baris staging) yang tinggal. Nama
-- itu tiada dalam senarai 18 staf `User Profiles Mapping.xlsx`.
--
-- Ditanya siapa itu, pengguna memutuskan (2026-09-04):
--     **Orang luar — bukan staf MIMOS Academy. Biarkan NULL dan
--       laporkan berasingan.**
--
-- KENAPA PERLU JADUAL BAHARU (bukan sekadar biarkan NULL)
-- -------------------------------------------------------
-- Tanpa fail ini, `'Ow Zi Qi'` dan `'Fuzy'`-sebelum-disahkan kelihatan
-- **SERUPA** dalam laporan: kedua-duanya `account_manager_id IS NULL`.
-- Tetapi maksudnya berbeza sepenuhnya:
--
--   `'Ow Zi Qi'`  = SUDAH diputuskan manusia: orang luar, sengaja tidak
--                   diagih. Tiada tindakan lanjut diperlukan.
--   nilai lain     = BELUM diputuskan: sistem tidak tahu, perlu perhatian.
--
-- Jika kedua-duanya dicampur, laporan akan sentiasa menunjukkan "4 baris
-- tidak diagih" tanpa membezakan yang **selesai** daripada yang **terbuka**.
-- Itu menghalang Fasa 8E (pipeline) dan 8F (komisen) daripada tahu sama ada
-- baki itu perlu tindakan atau tidak.
--
-- Dengan fail ini, `am_unresolved_values()` melaporkan kategori `LUAR`
-- berasingan daripada `TIADA_PADANAN`, dan **setiap satu daripada 12 nilai
-- sebenar kini mempunyai keputusan manusia di belakangnya**.
--
-- PRASYARAT
-- ---------
-- `client-master.sql` (8A) dan `account-manager-resolution.sql` (8A-2).
--
-- SKOP
-- ----
-- ✅ 1 jadual + RLS + 4 polisi + 2 fungsi + 3 indeks
-- ✅ Idempoten
-- ✅ Setiap tulis diaudit
-- ❌ TIADA DROP/DELETE/TRUNCATE pada jadual perniagaan
-- ❌ TIDAK menambah nilai enum audit_action (guna created/updated/deleted)
--
-- NOTA DP-7: jadual ini MENTAKRIFKAN lajur `updated_at` walaupun ia TIDAK
-- disenaraikan dalam `targets` `updated-at-triggers.sql`. Dua sebab:
--   1. konsistensi dengan semua jadual repo yang lain
--   2. jika ia kelak ditambah ke `targets`, ia tidak akan menghadapi
--      kecacatan DP-7 (trigger dipasang pada jadual tanpa lajur)
-- Ia sengaja TIDAK ditambah ke `targets` sekarang kerana itu akan mengubah
-- bilangan trigger di live (G1=12/12 dalam laporan PROMPT-6G) dan
-- memerlukan pengesahan semula baseline itu.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Jadual
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.external_account_managers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  raw_text      text NOT NULL,
  display_name  text NOT NULL,
  reason        text,
  confirmed_by  uuid REFERENCES auth.users (id),
  confirmed_at  timestamptz NOT NULL DEFAULT now(),
  notes         text,
  CONSTRAINT external_account_managers_raw_unique UNIQUE (raw_text)
);

COMMENT ON TABLE public.external_account_managers IS
  'Nilai Account Manager yang DISAHKAN MANUSIA sebagai orang LUAR (bukan staf '
  'MIMOS Academy), dan oleh itu SENGAJA tidak diagih kepada mana-mana '
  'user_profiles. Wujud supaya laporan boleh membezakan "sudah diputuskan: '
  'orang luar" daripada "belum diputuskan: sistem tidak tahu" — kedua-duanya '
  'kelihatan sebagai account_manager_id IS NULL tanpa jadual ini. '
  'Keputusan pertama direkodkan oleh Panel DP-9 (2026-09-04): "Ow Zi Qi". '
  'LIHAT JUGA: public.account_manager_aliases (untuk orang DALAM staf).';

COMMENT ON COLUMN public.external_account_managers.display_name IS
  'Nama untuk dipaparkan dalam laporan, cth. "Ow Zi Qi (luar)". Tidak dipaut '
  'ke user_profiles kerana orang ini bukan staf.';

COMMENT ON COLUMN public.external_account_managers.reason IS
  'Sebab klasifikasi luar, cth. "ejen", "rakan kongsi", "staf klien", '
  '"bekas staf". Diperlukan untuk laporan Fasa 8F (komisen) supaya baris '
  'yang dikecualikan boleh dijelaskan.';

CREATE INDEX IF NOT EXISTS idx_ext_am_raw_lower
  ON public.external_account_managers (public.normalize_person_name(raw_text));

CREATE INDEX IF NOT EXISTS idx_ext_am_display
  ON public.external_account_managers (display_name);


-- ---------------------------------------------------------------------
-- 2. RLS — sama seperti account_manager_aliases
-- ---------------------------------------------------------------------
ALTER TABLE public.external_account_managers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ext_am_read" ON public.external_account_managers;
CREATE POLICY "ext_am_read" ON public.external_account_managers
  FOR SELECT TO authenticated USING (true);

-- Veto Keselamatan §2.8: baca dibenarkan (teks + UUID pengesah sahaja, tiada
-- peranan atau status staf). Tulis hanya untuk peranan pengurusan.
-- NOTA ENUM (DP-6): 'super_admin' BUKAN nilai enum dalam schema-master.sql:202,
-- tetapi ADA di live kerana user-management.sql Bahagian 1a menambahnya.
-- has_role() sendiri mengembalikan true untuk SEMUA peranan bila
-- role='super_admin', jadi Super Admin sudah dilindungi tanpa cast itu.
DROP POLICY IF EXISTS "ext_am_write" ON public.external_account_managers;
CREATE POLICY "ext_am_write" ON public.external_account_managers
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('admin'::public.app_role)
    OR public.has_role('head_governance'::public.app_role)
    OR public.has_role('finance'::public.app_role)
  );

DROP POLICY IF EXISTS "ext_am_update" ON public.external_account_managers;
CREATE POLICY "ext_am_update" ON public.external_account_managers
  FOR UPDATE TO authenticated
  USING (
    public.has_role('admin'::public.app_role)
    OR public.has_role('head_governance'::public.app_role)
    OR public.has_role('finance'::public.app_role)
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "ext_am_delete" ON public.external_account_managers;
-- Padan dengan am_aliases_delete: hanya admin (Super Admin dilindungi oleh
-- has_role() sendiri, lihat DP-6).
CREATE POLICY "ext_am_delete" ON public.external_account_managers
  FOR DELETE TO authenticated
  USING (public.has_role('admin'::public.app_role));


-- ---------------------------------------------------------------------
-- 3. adakah nilai ini sudah diklasifikasikan sebagai luar?
-- ---------------------------------------------------------------------
-- IMMUTABLE-ish helper supaya boleh digunakan dalam query laporan.
-- STABLE kerana membaca jadual.

CREATE OR REPLACE FUNCTION public.is_external_account_manager(p_raw text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text;
BEGIN
  v_norm := public.normalize_person_name(p_raw);
  IF v_norm IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.external_account_managers e
     WHERE public.normalize_person_name(e.raw_text) = v_norm
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_external_account_manager(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_external_account_manager(text) TO authenticated;


-- ---------------------------------------------------------------------
-- 4. Klasifikasikan nilai sebagai orang luar (keputusan manusia)
-- ---------------------------------------------------------------------
-- DUA PENOLAKAN PENTING:
--   * jika nilai itu SUDAH menyelesaikan kepada staf -> tolak. Gunakan
--     am_confirm_alias() untuk membetulkannya, jangan labelkannya luar.
--   * jika nilai itu sel berbilang orang -> tolak. Satu klasifikasi luar
--     ialah untuk SATU orang; 'Fuzy / Dila' bukan seorang orang luar.

CREATE OR REPLACE FUNCTION public.am_confirm_external(
  p_raw_text     text,
  p_display_name text,
  p_reason       text DEFAULT NULL,
  p_notes        text DEFAULT NULL
)
RETURNS TABLE (raw_text text, display_name text, tindakan text)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm      text;
  v_existing  uuid;
  v_action    public.audit_action;
  v_old       jsonb;
BEGIN
  IF NOT public.can_resolve_account_managers() THEN
    RAISE EXCEPTION 'tiada kuasa: klasifikasi luar memerlukan peranan admin, head_governance atau finance'
      USING ERRCODE = '42501';
  END IF;

  v_norm := public.normalize_person_name(p_raw_text);
  IF v_norm IS NULL THEN
    RAISE EXCEPTION 'raw_text tidak boleh kosong' USING ERRCODE = '22023';
  END IF;

  IF public.normalize_person_name(p_display_name) IS NULL THEN
    RAISE EXCEPTION 'display_name tidak boleh kosong' USING ERRCODE = '22023';
  END IF;

  -- Tolak jika nilai ini sudah menyelesaikan kepada staf
  IF public.resolve_account_manager(p_raw_text) IS NOT NULL THEN
    RAISE EXCEPTION 'nilai ini sudah menyelesaikan kepada seorang staf — guna am_confirm_alias() untuk membetulkannya, jangan klasifikasikannya sebagai luar'
      USING ERRCODE = '22023';
  END IF;

  -- Tolak sel berbilang orang
  IF v_norm LIKE '%/%' OR v_norm LIKE '%,%'
     OR v_norm LIKE '% dan %' OR v_norm LIKE '% & %' THEN
    RAISE EXCEPTION 'sel berbilang orang tidak boleh diklasifikasikan sebagai SATU orang luar'
      USING ERRCODE = '22023';
  END IF;

  SELECT e.id,
         jsonb_build_object('display_name', e.display_name, 'reason', e.reason)
    INTO v_existing, v_old
    FROM public.external_account_managers e
   WHERE public.normalize_person_name(e.raw_text) = v_norm
   LIMIT 1;

  IF v_existing IS NULL THEN
    INSERT INTO public.external_account_managers
      (raw_text, display_name, reason, confirmed_by, notes)
    VALUES
      (btrim(p_raw_text), btrim(p_display_name), p_reason,
       public.current_user_id(), p_notes)
    RETURNING external_account_managers.id INTO v_existing;
    v_action := 'created';
  ELSE
    UPDATE public.external_account_managers e
       SET display_name = btrim(p_display_name),
           reason       = p_reason,
           confirmed_by = public.current_user_id(),
           confirmed_at = now(),
           notes        = coalesce(p_notes, e.notes)
     WHERE e.id = v_existing;
    v_action := 'updated';
  END IF;

  PERFORM public.log_audit(
    'external_account_managers',
    v_existing,
    v_action,
    v_old,
    jsonb_build_object('raw_text', btrim(p_raw_text),
                       'display_name', btrim(p_display_name),
                       'reason', p_reason),
    jsonb_build_object('fasa', '8A-2', 'fungsi', 'am_confirm_external',
                       'asas', 'Panel DP-9: keputusan pengguna 2026-09-04')
  );

  RETURN QUERY SELECT btrim(p_raw_text), btrim(p_display_name), v_action::text;
END;
$$;

REVOKE ALL ON FUNCTION public.am_confirm_external(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.am_confirm_external(text, text, text, text) TO authenticated;


-- ---------------------------------------------------------------------
-- 5. Batalkan klasifikasi luar
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.am_revoke_external(p_raw_text text)
RETURNS TABLE (raw_text text, former_display_name text, tindakan text)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text;
  v_row  public.external_account_managers%ROWTYPE;
BEGIN
  IF NOT public.can_resolve_account_managers() THEN
    RAISE EXCEPTION 'tiada kuasa: pembatalan klasifikasi luar memerlukan peranan admin, head_governance atau finance'
      USING ERRCODE = '42501';
  END IF;

  v_norm := public.normalize_person_name(p_raw_text);

  SELECT * INTO v_row
    FROM public.external_account_managers e
   WHERE public.normalize_person_name(e.raw_text) = v_norm
   LIMIT 1;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'tiada klasifikasi luar untuk nilai ini' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.external_account_managers e WHERE e.id = v_row.id;

  PERFORM public.log_audit(
    'external_account_managers',
    v_row.id,
    'deleted',
    jsonb_build_object('raw_text', v_row.raw_text,
                       'display_name', v_row.display_name,
                       'reason', v_row.reason,
                       'confirmed_at', v_row.confirmed_at),
    NULL,
    jsonb_build_object('fasa', '8A-2', 'fungsi', 'am_revoke_external')
  );

  RETURN QUERY SELECT v_row.raw_text, v_row.display_name, 'deleted'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.am_revoke_external(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.am_revoke_external(text) TO authenticated;


-- =====================================================================
-- PENGESAHAN (read-only)
-- =====================================================================
-- 3 fungsi baharu: is_external_account_manager, am_confirm_external,
-- am_revoke_external. Semua SECURITY DEFINER, search_path=public.
--
-- ⚠️ DP-4: jadual `external_account_managers` ialah jadual rasmi repo.
--    Allowlist `W1_public_tables` dalam `docs/PROMPT-6C-AUDIT-LEGACY-TABLES.md`
--    MESTI dikemas kini 16 -> 17, jika tidak `test-preflight-b-sql.mjs` §8
--    akan gagal.
--
-- Ujian berkelakuan: scripts/test-account-manager-resolution.mjs seksyen [Q].
