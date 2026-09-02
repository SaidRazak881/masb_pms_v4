-- ============================================================================
-- FIX RLS RECURSION — user_profiles
-- ----------------------------------------------------------------------------
-- Punca: polisi RLS yang mengandungi subquery ke public.user_profiles
-- menyebabkan "infinite recursion detected in policy for relation
-- user_profiles" apabila polisi "Admin boleh lihat semua profil" (yang turut
-- merujuk user_profiles) dinilai serentak.
--
-- Penyelesaian: gantikan SEMUA subquery user_profiles dalam polisi dengan
-- fungsi SECURITY DEFINER (public.has_role / public.current_role_name) —
-- fungsi SECURITY DEFINER dijalankan sebagai pemilik dan TIDAK tertakluk
-- kepada RLS, maka rantaian recursion terputus.
--
-- Fail ini idempotent — boleh dijalankan berulang kali.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Pastikan fungsi bantuan wujud (idempotent)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT up.role FROM public.user_profiles up WHERE up.id = auth.uid()),
    'viewer'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.current_role_name()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT up.role::text FROM public.user_profiles up WHERE up.id = auth.uid()),
    'viewer'
  );
$$;

-- Fasa 6: super_admin mewarisi SEMUA kuasa. Fungsi ini hanya digunakan untuk
-- keputusan kebenaran (polisi RLS / RPC), bukan untuk paparan role — jadi
-- memulangkan true bagi sebarang role yang diminta adalah selamat dan
-- mengelakkan suntingan berpuluh-puluh polisi secara berasingan.
CREATE OR REPLACE FUNCTION public.has_role(p_role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  v_role := public.current_user_role();
  IF v_role::text = 'super_admin' THEN
    RETURN true;
  END IF;
  RETURN v_role = p_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_role_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;

-- ----------------------------------------------------------------------------
-- 1. user_profiles — polisi SELECT admin (punca recursion utama)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin boleh lihat semua profil" ON public.user_profiles;
CREATE POLICY "Admin boleh lihat semua profil"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    public.has_role('admin'::public.app_role)
    OR public.has_role('manager'::public.app_role)
  );

-- ----------------------------------------------------------------------------
-- 2. programmes — UPDATE
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Pengguna boleh kemaskini programmes jika tidak dikunci"
  ON public.programmes;
CREATE POLICY "Pengguna boleh kemaskini programmes jika tidak dikunci"
  ON public.programmes FOR UPDATE
  TO authenticated
  USING (
    (is_locked = false OR unlock_expires_at > now())
    OR public.has_role('head_governance'::public.app_role)
    OR public.has_role('admin'::public.app_role)
  )
  WITH CHECK (
    (is_locked = (governance_lock_status = 'locked'))
  );

-- ----------------------------------------------------------------------------
-- 3. participants — UPDATE
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Pengguna boleh kemaskini participants jika program tidak dikunci"
  ON public.participants;
CREATE POLICY "Pengguna boleh kemaskini participants jika program tidak dikunci"
  ON public.participants FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM public.programmes p
      WHERE p.id = programme_id AND (p.is_locked = false OR p.unlock_expires_at > now())
    ))
    OR public.has_role('head_governance'::public.app_role)
    OR public.has_role('admin'::public.app_role)
  )
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 4. financial_docs — UPDATE
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Pengguna boleh kemaskini financial_docs jika program tidak dikunci"
  ON public.financial_docs;
CREATE POLICY "Pengguna boleh kemaskini financial_docs jika program tidak dikunci"
  ON public.financial_docs FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM public.programmes p
      WHERE p.id = programme_id AND (p.is_locked = false OR p.unlock_expires_at > now())
    ))
    OR public.has_role('head_governance'::public.app_role)
    OR public.has_role('admin'::public.app_role)
    OR public.has_role('finance'::public.app_role)
  )
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 5. invoices — UPDATE
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Pengguna boleh kemaskini invoices jika program tidak dikunci"
  ON public.invoices;
CREATE POLICY "Pengguna boleh kemaskini invoices jika program tidak dikunci"
  ON public.invoices FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM public.programmes p
      WHERE p.id = programme_id AND (p.is_locked = false OR p.unlock_expires_at > now())
    ))
    OR public.has_role('head_governance'::public.app_role)
    OR public.has_role('admin'::public.app_role)
    OR public.has_role('finance'::public.app_role)
  )
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 6. programme_costs — UPDATE
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Pengguna boleh kemaskini programme_costs jika program tidak dikunci"
  ON public.programme_costs;
CREATE POLICY "Pengguna boleh kemaskini programme_costs jika program tidak dikunci"
  ON public.programme_costs FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM public.programmes p
      WHERE p.id = programme_id AND (p.is_locked = false OR p.unlock_expires_at > now())
    ))
    OR public.has_role('head_governance'::public.app_role)
    OR public.has_role('admin'::public.app_role)
    OR public.has_role('finance'::public.app_role)
  )
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 7. cost_items — UPDATE
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Pengguna boleh kemaskini cost_items jika program tidak dikunci"
  ON public.cost_items;
CREATE POLICY "Pengguna boleh kemaskini cost_items jika program tidak dikunci"
  ON public.cost_items FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM public.programmes p
      WHERE p.id = programme_id AND (p.is_locked = false OR p.unlock_expires_at > now())
    ))
    OR public.has_role('head_governance'::public.app_role)
    OR public.has_role('admin'::public.app_role)
    OR public.has_role('finance'::public.app_role)
  )
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 8. programme_documents — UPDATE
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Pengguna boleh kemaskini programme_documents jika program tidak dikunci"
  ON public.programme_documents;
CREATE POLICY "Pengguna boleh kemaskini programme_documents jika program tidak dikunci"
  ON public.programme_documents FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM public.programmes p
      WHERE p.id = programme_id AND (p.is_locked = false OR p.unlock_expires_at > now())
    ))
    OR public.has_role('head_governance'::public.app_role)
    OR public.has_role('admin'::public.app_role)
  )
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 9. Polisi legacy daripada seed-v4-raw (jika wujud di DB live)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Pengguna terauth boleh kemaskini programmes"
  ON public.programmes;
CREATE POLICY "Pengguna terauth boleh kemaskini programmes"
  ON public.programmes FOR UPDATE
  TO authenticated
  USING (
    (is_locked = false OR unlock_expires_at > now())
    OR public.has_role('head_governance'::public.app_role)
  )
  WITH CHECK (
    (is_locked = (governance_lock_status = 'locked'))
  );

-- ----------------------------------------------------------------------------
-- PENGESAHAN
-- ----------------------------------------------------------------------------
-- Tiada polisi lagi yang merujuk user_profiles secara subquery:
--   SELECT p.policyname, p.tablename
--   FROM pg_policies p
--   WHERE pg_get_expr(p.polqual, p.polrelid)::text LIKE '%user_profiles%';
-- Jangkaan: 0 baris (fungsi has_role tidak dikira kerana ia SECURITY DEFINER).
--
-- Ujian pantas (selepas fix, dari SQL editor):
--   SET ROLE authenticated;  -- tidak perlu; gunakan aplikasi
--   UPDATE public.programmes SET title = title WHERE id = '<uuid>';  -- TIADA recursion
