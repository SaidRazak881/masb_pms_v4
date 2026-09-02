-- =====================================================================
-- TPMS MIMOS Academy — FASA 6: Pengurusan Pengguna & Super Admin
-- =====================================================================
--
-- MATLAMAT FASA 6 (menggantikan MFA Fasa 5):
--   1. Log masuk HANYA dengan e-mel + kata laluan (TIADA MFA/TOTP).
--   2. Kata laluan lalai pertama: `masb.12345`.
--   3. Pengguna yang masih guna kata laluan lalai WAJIB tukar kata laluan
--      (notis dipaparkan selepas log masuk — `must_change_password`).
--   4. Super Admin (`saidrazak881@gmail.com`) mempunyai dashboard khusus
--      untuk: approve pengguna baharu, block/unblock, reset kata laluan,
--      tukar role.
--   5. Pendaftaran akaun baharu oleh pengguna sendiri → status `pending`
--      → mesti diluluskan Super Admin sebelum boleh guna sistem.
--
-- FAIL INI IDEMPOTENT — selamat dijalankan berulang kali.
-- Jalankan SELEPAS: schema-master.sql, governance-lock.sql,
--                   change-requests.sql, fix-rls-recursion.sql
--
-- Prinsip keselamatan:
--   * Semua operasi pengurusan pengguna melalui RPC `SECURITY DEFINER`.
--     TIADA penulisan terus ke kolum sensitif dari klien.
--   * RLS + column-level GRANT menghalang pengguna menaikkan role sendiri.
--   * Setiap tindakan direkod dalam `audit_logs`.
-- =====================================================================

BEGIN;

-- =====================================================================
-- BAHAGIAN 0: EXTENSION & PEMBOLEH UBAH TETAPAN
-- =====================================================================

-- pgcrypto diperlukan untuk crypt()/gen_salt() (reset kata laluan).
-- Di Supabase ia biasanya sudah tersedia; blok ini toleran ralat supaya
-- skrip boleh dijalankan dalam persekitaran ujian (PGlite) yang tidak
-- membungkusnya.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgcrypto tidak dapat dipasang (%) — andaikan sudah tersedia',
    SQLERRM;
END
$$;

-- Fungsi ini DIRUJUK oleh polisi RLS app_settings di bawah, jadi ia mesti
-- dicipta dahulu (definisi penuh & muktamad ada di Bahagian 3a).
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT up.role::text INTO v_role
    FROM public.user_profiles up
   WHERE up.id = auth.uid();
  RETURN COALESCE(v_role = 'super_admin', false);
END;
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Kata laluan lalai rasmi sistem (Fasa 6).
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings (key, value, description) VALUES
  ('default_password', 'masb.12345',
   'Kata laluan lalai untuk pendaftaran baharu & reset oleh Super Admin.'),
  ('super_admin_email', 'saidrazak881@gmail.com',
   'Akaun Master Admin / Super Admin sistem TPMS.')
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      description = EXCLUDED.description,
      updated_at = now();

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admin sahaja boleh lihat tetapan"
  ON public.app_settings;
CREATE POLICY "Super Admin sahaja boleh lihat tetapan"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- =====================================================================
-- BAHAGIAN 1: ENUM — super_admin + account_status
-- =====================================================================

-- 1a. Tambah nilai 'super_admin' ke enum app_role (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'super_admin'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'super_admin';
  END IF;
END
$$;

-- 1b. Enum status akaun.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'account_status'
  ) THEN
    CREATE TYPE public.account_status AS ENUM (
      'pending',   -- baru daftar, menunggu kelulusan Super Admin
      'active',    -- diluluskan, boleh guna sistem
      'blocked'    -- disekat oleh Super Admin
    );
  END IF;
END
$$;

-- PENTING: COMMIT di sini. PostgreSQL TIDAK membenarkan nilai enum yang baru
-- ditambah ('super_admin') digunakan dalam transaksi yang SAMA. Supabase SQL
-- Editor membungkus keseluruhan skrip dalam satu transaksi, jadi tanpa COMMIT
-- ini Bahagian 8 akan gagal dengan "unsafe use of new value of enum type".
COMMIT;
BEGIN;

-- =====================================================================
-- BAHAGIAN 2: KOLUM BAHARU user_profiles
-- =====================================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS account_status public.account_status
    NOT NULL DEFAULT 'active';

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN
    NOT NULL DEFAULT false;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users (id);

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users (id);

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS block_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_account_status
  ON public.user_profiles (account_status);

-- =====================================================================
-- BAHAGIAN 3: FUNGSI BANTUAN (SECURITY DEFINER)
-- =====================================================================

-- 3a. Definisi muktamad is_super_admin() (sedia dicipta di Bahagian 0
--     kerana dirujuk oleh polisi RLS app_settings).
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT up.role::text INTO v_role
    FROM public.user_profiles up
   WHERE up.id = auth.uid();
  RETURN COALESCE(v_role = 'super_admin', false);
END;
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- 3b. Super Admin boleh urus pengguna jika role = super_admin ATAU
--     e-mel = akaun Master Admin (supaya tidak terkunci jika role
--     belum dikemas kini).
CREATE OR REPLACE FUNCTION public.can_manage_users()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_is_master_email BOOLEAN;
BEGIN
  SELECT up.role::text INTO v_role
    FROM public.user_profiles up
   WHERE up.id = auth.uid();

  SELECT (u.email = (SELECT value FROM public.app_settings
                      WHERE key = 'super_admin_email'))
    INTO v_is_master_email
    FROM auth.users u
   WHERE u.id = auth.uid();

  RETURN COALESCE(v_role = 'super_admin', false)
      OR COALESCE(v_is_master_email, false);
END;
$$;

REVOKE ALL ON FUNCTION public.can_manage_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_users() TO authenticated;

-- 3c. Status akaun pengguna semasa (untuk middleware / guard aplikasi).
CREATE OR REPLACE FUNCTION public.my_account_status()
RETURNS public.account_status
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status public.account_status;
BEGIN
  SELECT up.account_status INTO v_status
    FROM public.user_profiles up
   WHERE up.id = auth.uid();
  RETURN COALESCE(v_status, 'pending'::public.account_status);
END;
$$;

REVOKE ALL ON FUNCTION public.my_account_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_account_status() TO authenticated;

-- 3d. Adakah pengguna semasa wajib tukar kata laluan?
CREATE OR REPLACE FUNCTION public.my_password_change_required()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_required BOOLEAN;
BEGIN
  SELECT up.must_change_password INTO v_required
    FROM public.user_profiles up
   WHERE up.id = auth.uid();
  RETURN COALESCE(v_required, false);
END;
$$;

REVOKE ALL ON FUNCTION public.my_password_change_required() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_password_change_required() TO authenticated;

-- 3e. Pengurusan pengguna: hanya Super Admin, dan akaun mesti active.
CREATE OR REPLACE FUNCTION public.assert_can_manage_users()
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status public.account_status;
BEGIN
  IF NOT public.can_manage_users() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: hanya Super Admin boleh mengurus pengguna'
      USING ERRCODE = '42501';
  END IF;

  SELECT up.account_status INTO v_status
    FROM public.user_profiles up WHERE up.id = auth.uid();

  IF v_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'ACCOUNT_NOT_ACTIVE: akaun anda tidak aktif'
      USING ERRCODE = '42501';
  END IF;
END
$$;

REVOKE ALL ON FUNCTION public.assert_can_manage_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assert_can_manage_users() TO authenticated;

-- 3f. Kata laluan lalai sistem.
CREATE OR REPLACE FUNCTION public.default_password()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT value INTO v_value FROM public.app_settings
   WHERE key = 'default_password';
  RETURN COALESCE(v_value, 'masb.12345');
END;
$$;

REVOKE ALL ON FUNCTION public.default_password() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.default_password() TO authenticated;

-- 3g. Semak kekuatan kata laluan baharu (≥8 aksara, bukan lalai, ada
--     huruf + nombor).
CREATE OR REPLACE FUNCTION public.assert_password_acceptable(p_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_password IS NULL OR length(p_password) < 8 THEN
    RAISE EXCEPTION 'PASSWORD_TOO_SHORT: kata laluan mesti sekurang-kurangnya 8 aksara'
      USING ERRCODE = '22023';
  END IF;

  IF p_password = public.default_password() THEN
    RAISE EXCEPTION 'PASSWORD_IS_DEFAULT: kata laluan baharu tidak boleh sama dengan kata laluan lalai'
      USING ERRCODE = '22023';
  END IF;

  IF p_password !~ '[A-Za-z]' OR p_password !~ '[0-9]' THEN
    RAISE EXCEPTION 'PASSWORD_TOO_WEAK: kata laluan mesti mengandungi huruf dan nombor'
      USING ERRCODE = '22023';
  END IF;
END
$$;

REVOKE ALL ON FUNCTION public.assert_password_acceptable(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assert_password_acceptable(TEXT) TO authenticated;

-- =====================================================================
-- BAHAGIAN 4: RPC PENGURUSAN PENGGUNA (SUPER ADMIN)
-- =====================================================================

-- 4a. Senarai pengguna untuk dashboard Super Admin.
CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  designation TEXT,
  department TEXT,
  role public.app_role,
  account_status public.account_status,
  is_active BOOLEAN,
  must_change_password BOOLEAN,
  password_changed_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  blocked_at TIMESTAMPTZ,
  block_reason TEXT,
  auth_email_confirmed_at TIMESTAMPTZ,
  auth_last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_can_manage_users();

  RETURN QUERY
  SELECT
    up.id, up.full_name, up.email, up.phone, up.designation, up.department,
    up.role, up.account_status, up.is_active, up.must_change_password,
    up.password_changed_at, up.last_login_at, up.created_at,
    up.approved_at, up.blocked_at, up.block_reason,
    au.email_confirmed_at, au.last_sign_in_at
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON au.id = up.id
  WHERE (p_search IS NULL OR p_search = ''
         OR up.full_name ILIKE '%' || p_search || '%'
         OR up.email ILIKE '%' || p_search || '%'
         OR COALESCE(up.department, '') ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR p_status = '' OR p_status = 'all'
         OR up.account_status::text = p_status)
  ORDER BY
    CASE up.account_status
      WHEN 'pending' THEN 0 WHEN 'blocked' THEN 1 ELSE 2
    END,
    up.created_at DESC;
END
$$;

REVOKE ALL ON FUNCTION public.admin_list_users(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users(TEXT, TEXT) TO authenticated;

-- 4b. Ringkasan KPI dashboard Super Admin.
CREATE OR REPLACE FUNCTION public.admin_user_summary()
RETURNS TABLE (
  total_users BIGINT,
  pending_users BIGINT,
  active_users BIGINT,
  blocked_users BIGINT,
  default_password_users BIGINT,
  super_admins BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_can_manage_users();

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE up.account_status = 'pending')::BIGINT,
    COUNT(*) FILTER (WHERE up.account_status = 'active')::BIGINT,
    COUNT(*) FILTER (WHERE up.account_status = 'blocked')::BIGINT,
    COUNT(*) FILTER (WHERE up.must_change_password)::BIGINT,
    COUNT(*) FILTER (WHERE up.role::text = 'super_admin')::BIGINT
  FROM public.user_profiles up;
END
$$;

REVOKE ALL ON FUNCTION public.admin_user_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_user_summary() TO authenticated;

-- 4c. LULUSKAN pengguna baharu (pending → active).
CREATE OR REPLACE FUNCTION public.admin_approve_user(
  p_user_id UUID,
  p_role public.app_role DEFAULT 'staff'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.user_profiles%ROWTYPE;
BEGIN
  PERFORM public.assert_can_manage_users();

  SELECT * INTO v_profile FROM public.user_profiles up
   WHERE up.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND: profil pengguna tidak wujud'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_role = 'super_admin'::public.app_role THEN
    RAISE EXCEPTION 'ROLE_NOT_ALLOWED: role Super Admin hanya boleh diberi melalui SQL oleh pemilik sistem'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.user_profiles
     SET account_status = 'active',
         is_active = true,
         role = COALESCE(p_role, role),
         approved_by = auth.uid(),
         approved_at = now(),
         blocked_by = NULL,
         blocked_at = NULL,
         block_reason = NULL,
         updated_at = now()
   WHERE id = p_user_id;

  PERFORM public.log_audit(
    'user_profiles', p_user_id, 'updated',
    jsonb_build_object('account_status', v_profile.account_status::text,
                       'role', v_profile.role::text),
    jsonb_build_object('account_status', 'active',
                       'role', COALESCE(p_role, v_profile.role)::text),
    jsonb_build_object('action', 'APPROVE_USER',
                       'approved_by', auth.uid(),
                       'email', v_profile.email)
  );
END
$$;

REVOKE ALL ON FUNCTION public.admin_approve_user(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_approve_user(UUID, public.app_role) TO authenticated;

-- 4d. SEKAT / NYAHSEKAT pengguna.
CREATE OR REPLACE FUNCTION public.admin_set_user_blocked(
  p_user_id UUID,
  p_blocked BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.user_profiles%ROWTYPE;
  v_actor_is_super BOOLEAN;
  v_target_is_super BOOLEAN;
  v_remaining_super BIGINT;
BEGIN
  PERFORM public.assert_can_manage_users();

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'SELF_BLOCK_FORBIDDEN: anda tidak boleh menyekat akaun sendiri'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile FROM public.user_profiles up WHERE up.id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND: profil pengguna tidak wujud'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT public.is_super_admin() INTO v_actor_is_super;
  SELECT (v_profile.role = 'super_admin'::public.app_role) INTO v_target_is_super;

  -- Hanya Super Admin penuh boleh menyekat Super Admin lain.
  IF v_target_is_super AND NOT v_actor_is_super THEN
    RAISE EXCEPTION 'ACCESS_DENIED: hanya Super Admin boleh menyekat Super Admin'
      USING ERRCODE = '42501';
  END IF;

  -- Elak semua Super Admin disekat serentak.
  IF p_blocked AND v_target_is_super THEN
    SELECT COUNT(*) INTO v_remaining_super
      FROM public.user_profiles
     WHERE role = 'super_admin'::public.app_role
       AND account_status = 'active'
       AND id <> p_user_id;

    IF v_remaining_super = 0 THEN
      RAISE EXCEPTION 'LAST_SUPER_ADMIN: sekurang-kurangnya satu Super Admin aktif mesti kekal'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF p_blocked THEN
    UPDATE public.user_profiles
       SET account_status = 'blocked',
           is_active = false,
           blocked_by = auth.uid(),
           blocked_at = now(),
           block_reason = NULLIF(trim(COALESCE(p_reason, '')), ''),
           updated_at = now()
     WHERE id = p_user_id;
  ELSE
    UPDATE public.user_profiles
       SET account_status = 'active',
           is_active = true,
           blocked_by = NULL,
           blocked_at = NULL,
           block_reason = NULL,
           updated_at = now()
     WHERE id = p_user_id;
  END IF;

  -- Tamatkan sesi refresh token pengguna (log keluar paksa), jika jadual
  -- auth.refresh_tokens wujud dalam versi GoTrue projek ini.
  BEGIN
    IF p_blocked THEN
      EXECUTE 'DELETE FROM auth.refresh_tokens WHERE user_id = $1'
        USING p_user_id;
    END IF;
  EXCEPTION WHEN undefined_table OR undefined_column
           OR insufficient_privilege THEN
    NULL; -- tidak kritikal: JWT akan luput sendiri
  END;

  PERFORM public.log_audit(
    'user_profiles', p_user_id, 'updated',
    jsonb_build_object('account_status', v_profile.account_status::text),
    jsonb_build_object('account_status', CASE WHEN p_blocked THEN 'blocked'
                                              ELSE 'active' END),
    jsonb_build_object('action', CASE WHEN p_blocked THEN 'BLOCK_USER'
                                      ELSE 'UNBLOCK_USER' END,
                       'reason', p_reason,
                       'email', v_profile.email,
                       'performed_by', auth.uid())
  );
END
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_blocked(UUID, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_blocked(UUID, BOOLEAN, TEXT) TO authenticated;

-- 4e. TUKAR ROLE pengguna.
CREATE OR REPLACE FUNCTION public.admin_change_user_role(
  p_user_id UUID,
  p_role public.app_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.user_profiles%ROWTYPE;
  v_actor_is_super BOOLEAN;
  v_remaining_super BIGINT;
BEGIN
  PERFORM public.assert_can_manage_users();

  IF p_role IS NULL THEN
    RAISE EXCEPTION 'ROLE_REQUIRED: role baharu mesti dinyatakan'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_profile FROM public.user_profiles up WHERE up.id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND: profil pengguna tidak wujud'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT public.is_super_admin() INTO v_actor_is_super;

  -- Naik taraf ke Super Admin: hanya Super Admin penuh, dan bukan diri sendiri.
  IF p_role = 'super_admin'::public.app_role THEN
    IF NOT v_actor_is_super THEN
      RAISE EXCEPTION 'ACCESS_DENIED: hanya Super Admin boleh memberi role Super Admin'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Turun taraf Super Admin terakhir: dilarang.
  IF v_profile.role = 'super_admin'::public.app_role
     AND p_role <> 'super_admin'::public.app_role THEN
    SELECT COUNT(*) INTO v_remaining_super
      FROM public.user_profiles
     WHERE role = 'super_admin'::public.app_role
       AND id <> p_user_id;

    IF v_remaining_super = 0 THEN
      RAISE EXCEPTION 'LAST_SUPER_ADMIN: tidak boleh turun taraf Super Admin terakhir'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public.user_profiles
     SET role = p_role,
         updated_at = now()
   WHERE id = p_user_id;

  PERFORM public.log_audit(
    'user_profiles', p_user_id, 'updated',
    jsonb_build_object('role', v_profile.role::text),
    jsonb_build_object('role', p_role::text),
    jsonb_build_object('action', 'CHANGE_ROLE',
                       'email', v_profile.email,
                       'performed_by', auth.uid())
  );
END
$$;

REVOKE ALL ON FUNCTION public.admin_change_user_role(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_change_user_role(UUID, public.app_role) TO authenticated;

-- 4f. RESET kata laluan pengguna ke kata laluan lalai (`masb.12345`).
--     Selepas reset, pengguna WAJIB tukar kata laluan pada log masuk
--     seterusnya.
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.user_profiles%ROWTYPE;
  v_default TEXT := public.default_password();
BEGIN
  PERFORM public.assert_can_manage_users();

  SELECT * INTO v_profile FROM public.user_profiles up WHERE up.id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND: profil pengguna tidak wujud'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'SELF_RESET_FORBIDDEN: guna "Tukar Kata Laluan" di halaman Keselamatan untuk akaun sendiri'
      USING ERRCODE = '42501';
  END IF;

  IF v_profile.role = 'super_admin'::public.app_role
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: hanya Super Admin boleh reset kata laluan Super Admin'
      USING ERRCODE = '42501';
  END IF;

  UPDATE auth.users
     SET encrypted_password = extensions.crypt(v_default, extensions.gen_salt('bf')),
         updated_at = now()
   WHERE id = p_user_id;

  UPDATE public.user_profiles
     SET must_change_password = true,
         password_changed_at = NULL,
         updated_at = now()
   WHERE id = p_user_id;

  -- Log keluar semua sesi pengguna itu.
  BEGIN
    EXECUTE 'DELETE FROM auth.refresh_tokens WHERE user_id = $1' USING p_user_id;
  EXCEPTION WHEN undefined_table OR undefined_column
           OR insufficient_privilege THEN
    NULL;
  END;

  PERFORM public.log_audit(
    'user_profiles', p_user_id, 'updated',
    NULL,
    jsonb_build_object('must_change_password', true),
    jsonb_build_object('action', 'RESET_PASSWORD',
                       'email', v_profile.email,
                       'performed_by', auth.uid())
  );

  RETURN v_default;
END
$$;

REVOKE ALL ON FUNCTION public.admin_reset_user_password(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(UUID) TO authenticated;

-- 4g. Reset kata laluan SEMUA akaun ke lalai (tindakan pukal, Fasa 6).
CREATE OR REPLACE FUNCTION public.admin_reset_all_passwords_to_default()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default TEXT := public.default_password();
  v_count BIGINT;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: tindakan pukal hanya untuk Super Admin'
      USING ERRCODE = '42501';
  END IF;

  UPDATE auth.users
     SET encrypted_password = extensions.crypt(v_default, extensions.gen_salt('bf')),
         updated_at = now();

  UPDATE public.user_profiles
     SET must_change_password = true,
         password_changed_at = NULL,
         updated_at = now();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  PERFORM public.log_audit(
    'user_profiles', NULL, 'updated',
    NULL, NULL,
    jsonb_build_object('action', 'RESET_ALL_PASSWORDS',
                       'accounts_affected', v_count,
                       'performed_by', auth.uid())
  );

  RETURN v_count;
END
$$;

REVOKE ALL ON FUNCTION public.admin_reset_all_passwords_to_default() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reset_all_passwords_to_default() TO authenticated;

-- 4h. Wajibkan pengguna tukar kata laluan (tanpa reset).
CREATE OR REPLACE FUNCTION public.admin_require_password_change(
  p_user_id UUID,
  p_required BOOLEAN DEFAULT true
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.user_profiles%ROWTYPE;
BEGIN
  PERFORM public.assert_can_manage_users();

  SELECT * INTO v_profile FROM public.user_profiles up WHERE up.id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND: profil pengguna tidak wujud'
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.user_profiles
     SET must_change_password = p_required,
         password_changed_at = CASE WHEN p_required THEN NULL
                                    ELSE password_changed_at END,
         updated_at = now()
   WHERE id = p_user_id;

  PERFORM public.log_audit(
    'user_profiles', p_user_id, 'updated',
    jsonb_build_object('must_change_password', v_profile.must_change_password),
    jsonb_build_object('must_change_password', p_required),
    jsonb_build_object('action', 'REQUIRE_PASSWORD_CHANGE',
                       'email', v_profile.email,
                       'performed_by', auth.uid())
  );
END
$$;

REVOKE ALL ON FUNCTION public.admin_require_password_change(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_require_password_change(UUID, BOOLEAN) TO authenticated;

-- =====================================================================
-- BAHAGIAN 5: TUKAR KATA LALUAN SENDIRI (SEMUA PENGGUNA)
-- =====================================================================

-- Dipanggil oleh aplikasi SELEPAS `supabase.auth.updateUser()` berjaya.
CREATE OR REPLACE FUNCTION public.mark_password_changed()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.user_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM public.user_profiles up WHERE up.id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND: profil pengguna tidak wujud'
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.user_profiles
     SET must_change_password = false,
         password_changed_at = now(),
         updated_at = now()
   WHERE id = auth.uid();

  PERFORM public.log_audit(
    'user_profiles', auth.uid(), 'updated',
    jsonb_build_object('must_change_password', v_profile.must_change_password),
    jsonb_build_object('must_change_password', false,
                       'password_changed_at', now()),
    jsonb_build_object('action', 'CHANGE_OWN_PASSWORD',
                       'email', v_profile.email)
  );
END
$$;

REVOKE ALL ON FUNCTION public.mark_password_changed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_password_changed() TO authenticated;

-- =====================================================================
-- BAHAGIAN 6: TRIGGER — auto-cipta profil apabila akaun baharu daftar
-- =====================================================================
-- Penting: `supabase.auth.signUp()` dari klien HANYA mencipta baris dalam
-- `auth.users`. RLS tidak boleh membaca `auth.users`, jadi profil mesti
-- dicipta oleh trigger ini. Akaun baharu mula sebagai `pending` dan wajib
-- ditukar kata laluannya.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  v_full_name := NULLIF(
    trim(COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')), '');

  IF v_full_name IS NULL THEN
    v_full_name := initcap(split_part(NEW.email, '@', 1));
  END IF;

  INSERT INTO public.user_profiles (
    id, full_name, email, phone, designation, department,
    role, is_active, account_status, must_change_password
  ) VALUES (
    NEW.id,
    v_full_name,
    lower(NEW.email),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'phone', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'designation', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'department', '')), ''),
    'viewer'::public.app_role,
    false,
    'pending'::public.account_status,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Rekod kemas kini nama/e-mel daripada Auth ke profil (pilihan).
CREATE OR REPLACE FUNCTION public.sync_auth_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_profiles
     SET email = lower(NEW.email),
         full_name = COALESCE(
           NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
           full_name),
         updated_at = now()
   WHERE id = NEW.id;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_update();

-- =====================================================================
-- BAHAGIAN 7: RLS & GRANT — halang eskalasi privilege
-- =====================================================================
--
-- STRATEGI PERTAHANAN (berlapis):
--   Lapis 1 — Column-level GRANT: `authenticated` hanya boleh menulis
--             kolum profil BUKAN sensitif. `role`, `account_status`,
--             `must_change_password`, `approved_*`, `blocked_*` tidak
--             boleh disentuh langsung dari klien.
--   Lapis 2 — RLS baris: pengguna hanya nampak/kemaskini baris sendiri;
--             Super Admin nampak semua baris.
--   Lapis 3 — RPC SECURITY DEFINER: SEMUA operasi pengurusan pengguna
--             (approve/block/role/reset) melalui fungsi di Bahagian 4 yang
--             menjalankan semakan `can_manage_users()` + audit log.
--
-- Nota: kerana Lapis 1 menarik balik privilege UPDATE, polisi UPDATE
-- pada user_profiles tidak lagi berkesan untuk klien (dokumen sahaja).
-- RPC tidak terjejas kerana ia berjalan sebagai pemilik jadual.

-- 7a. Super Admin boleh lihat semua profil (untuk dashboard /admin/users).
DROP POLICY IF EXISTS "Super Admin boleh lihat semua profil"
  ON public.user_profiles;
CREATE POLICY "Super Admin boleh lihat semua profil"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (public.can_manage_users());

-- 7b. Pengguna boleh lihat profil sendiri (kekal dari schema-master).
DROP POLICY IF EXISTS "Pengguna boleh lihat profil sendiri"
  ON public.user_profiles;
CREATE POLICY "Pengguna boleh lihat profil sendiri"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 7c. Polisi UPDATE (dokumen niat — berkesan hanya jika grant diberi):
--     pengguna boleh kemaskini baris sendiri sahaja.
DROP POLICY IF EXISTS "Pengguna boleh kemaskini profil sendiri"
  ON public.user_profiles;
CREATE POLICY "Pengguna boleh kemaskini profil sendiri"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 7d. COLUMN-LEVEL GRANT — pertahanan utama terhadap eskalasi privilege.
REVOKE UPDATE ON public.user_profiles FROM authenticated;
GRANT UPDATE (
  full_name, phone, designation, department, avatar_url, updated_at
) ON public.user_profiles TO authenticated;

-- 7e. Tiada INSERT/DELETE profil terus dari klien.
--     (Profil baharu dicipta oleh trigger `on_auth_user_created`;
--      pemadaman melalui pembuangan akaun Auth oleh Super Admin.)
REVOKE INSERT, DELETE ON public.user_profiles FROM authenticated;

-- 7f. app_settings: baca untuk Super Admin sahaja (polisi di Bahagian 0);
--     tiada penulisan dari klien.
REVOKE INSERT, UPDATE, DELETE ON public.app_settings FROM authenticated, anon;
GRANT SELECT ON public.app_settings TO authenticated;

-- =====================================================================
-- BAHAGIAN 8: DATA — Master Admin + status 19 pengguna sedia ada
-- =====================================================================

-- 8a. Naik taraf Master Admin kepada super_admin + aktif.
UPDATE public.user_profiles
   SET role = 'super_admin',
       account_status = 'active',
       is_active = true,
       must_change_password = true,
       updated_at = now()
 WHERE lower(email) = lower(
   (SELECT value FROM public.app_settings WHERE key = 'super_admin_email')
 );

-- 8b. Semua pengguna LAIN yang sedia ada dianggap telah diluluskan
--     (mereka dicipta oleh skrip Fasa 3, bukan pendaftaran sendiri).
--     Kata laluan lalai diaktifkan semula → wajib tukar pada log masuk
--     pertama selepas Fasa 6.
UPDATE public.user_profiles
   SET account_status = 'active',
       is_active = true,
       must_change_password = true,
       updated_at = now()
 WHERE lower(email) <> lower(
   (SELECT value FROM public.app_settings WHERE key = 'super_admin_email')
 )
   AND account_status = 'pending';

-- 8c. Reset kata laluan SEMUA akaun kepada `masb.12345` (keperluan Fasa 6:
--     "Untuk penggunaan pertama kali, mereka akan log masuk dengan
--     password: masb.12345"). Ini membatalkan reset rawak Fasa 5.
UPDATE auth.users
   SET encrypted_password = extensions.crypt(
         public.default_password(), extensions.gen_salt('bf')),
       email_confirmed_at = COALESCE(email_confirmed_at, now()),
       updated_at = now();

-- 8d. Pastikan identiti e-mel wujud untuk semua akaun (perlu untuk
--     log masuk signInWithPassword).
INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email,
                     'email_verified', true),
  'email',
  now(), now(), now()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i
   WHERE i.provider_id = u.id::text AND i.provider = 'email'
)
ON CONFLICT DO NOTHING;

COMMIT;

-- =====================================================================
-- BAHAGIAN 9: QUERY PENGESAHAN (read-only — jalankan selepas install)
-- =====================================================================
--
-- 9a. Master Admin mestilah super_admin + active:
--   select email, role, account_status, must_change_password
--     from public.user_profiles
--    where lower(email) = 'saidrazak881@gmail.com';
--
-- 9b. Tiada akaun pending/block yang tidak dijangka:
--   select account_status, count(*) from public.user_profiles
--    group by account_status order by 1;
--
-- 9c. Semua 19+1 akaun boleh log masuk dengan masb.12345:
--   select count(*) as total_accounts,
--          count(*) filter (where email_confirmed_at is not null) as confirmed
--     from auth.users;
--
-- 9d. Enum & kolum baharu wujud:
--   select enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid
--    where t.typname in ('app_role','account_status') order by t.typname, e.enumsortorder;
--   select column_name from information_schema.columns
--    where table_schema='public' and table_name='user_profiles'
--      and column_name in ('account_status','must_change_password',
--                          'password_changed_at','approved_by','approved_at',
--                          'blocked_by','blocked_at','block_reason');
--
-- 9e. RPC wujud:
--   select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--    where n.nspname='public' and p.proname like 'admin\_%'
--       or p.proname in ('can_manage_users','is_super_admin','my_account_status',
--                        'my_password_change_required','mark_password_changed',
--                        'default_password','handle_new_auth_user')
--    order by 1;
--
-- 9f. Trigger Auth wujud:
--   select tgname from pg_trigger where tgrelid = 'auth.users'::regclass
--     and not tgisinternal;
--
-- 9g. Column grant (mesti TIDAK mengandungi role/account_status):
--   select privilege_type, column_name from information_schema.column_privileges
--    where table_schema='public' and table_name='user_profiles'
--      and grantee='authenticated' and privilege_type='UPDATE'
--    order by column_name;
-- =====================================================================
