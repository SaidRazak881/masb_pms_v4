-- =====================================================================
-- TPMS MIMOS Academy — Langkah 5
-- Modul Governance Lock & Request Unlock
--
-- Jalankan fail ini di Supabase SQL Editor SELEPAS skema induk dan
-- lib/supabase/sync-import-transaction.sql telah dipasang.
--
-- Reka bentuk:
--   * Program yang `is_locked = true` adalah rekod audit — tiada UPDATE
--     dibenarkan oleh RLS melainkan terdapat tetingkap suntingan aktif
--     (`unlock_expires_at > now()`).
--   * Suntingan hanya boleh dibuka melalui permohonan bertulis yang
--     diluluskan oleh Pengurus/Pentadbir (bukan pemohon sendiri).
--   * Semua peralihan keadaan ditulis ke `public.audit_logs`.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Enum & lajur kunci pada jadual programmes
-- ---------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unlock_request_status') THEN
    CREATE TYPE public.unlock_request_status AS ENUM (
      'pending', 'approved', 'rejected', 'expired', 'cancelled'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'programme_lock_reason') THEN
    CREATE TYPE public.programme_lock_reason AS ENUM (
      'programme_completed', 'financial_closed', 'audit_period', 'manual'
    );
  END IF;
END
$$;

ALTER TABLE public.programmes
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lock_reason public.programme_lock_reason NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS locked_by uuid REFERENCES auth.users (id),
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS unlock_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS programmes_locked_idx
  ON public.programmes (is_locked, unlock_expires_at);

-- ---------------------------------------------------------------------
-- 2. Jadual permohonan buka kunci
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.programme_unlock_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id      uuid NOT NULL REFERENCES public.programmes (id) ON DELETE CASCADE,
  programme_code    text,
  requested_by      uuid NOT NULL REFERENCES auth.users (id),
  requested_by_name text,
  requested_at      timestamptz NOT NULL DEFAULT now(),
  reason            text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 20 AND 1000),
  scope             text[] NOT NULL DEFAULT '{}'::text[],
  requested_hours   integer NOT NULL DEFAULT 24 CHECK (requested_hours BETWEEN 1 AND 72),
  status            public.unlock_request_status NOT NULL DEFAULT 'pending',
  reviewed_by       uuid REFERENCES auth.users (id),
  reviewed_by_name  text,
  reviewed_at       timestamptz,
  review_note       text,
  unlock_expires_at timestamptz,
  CONSTRAINT unlock_scope_not_empty CHECK (array_length(scope, 1) >= 1),
  CONSTRAINT unlock_review_complete CHECK (
    status = 'pending' OR reviewed_at IS NOT NULL OR status = 'cancelled'
  )
);

-- Hanya SATU permohonan 'pending' dibenarkan bagi setiap program.
CREATE UNIQUE INDEX IF NOT EXISTS unlock_one_pending_per_programme
  ON public.programme_unlock_requests (programme_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS unlock_requests_programme_idx
  ON public.programme_unlock_requests (programme_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS unlock_requests_requester_idx
  ON public.programme_unlock_requests (requested_by, status);

-- ---------------------------------------------------------------------
-- 3. Fungsi pembantu peranan
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_role_name()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT up.role FROM public.user_profiles up WHERE up.id = auth.uid()),
    'viewer'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_unlock_approver()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  -- Fasa 6: super_admin ditambah sebagai pelulus.
  SELECT public.current_role_name() IN
         ('manager', 'admin', 'head_governance', 'super_admin');
$$;

-- Adakah program boleh disunting sekarang?
CREATE OR REPLACE FUNCTION public.programme_is_editable(p_programme_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (
      SELECT (NOT p.is_locked)
             OR (p.unlock_expires_at IS NOT NULL AND p.unlock_expires_at > now())
      FROM public.programmes p
      WHERE p.id = p_programme_id
    ),
    false
  );
$$;

-- ---------------------------------------------------------------------
-- 4. RPC: hantar permohonan buka kunci
-- ---------------------------------------------------------------------

-- Buang versi lama (jika wujud) supaya kontrak baharu digunakan dengan
-- pasti — fungsi yang sama dicipta semula di bawah dalam transaksi yang
-- sama, jadi operasi ini selamat untuk dijalankan semula.
DROP FUNCTION IF EXISTS public.request_programme_unlock(uuid, text, text[], integer);
DROP FUNCTION IF EXISTS public.review_programme_unlock(uuid, boolean, text, integer);
DROP FUNCTION IF EXISTS public.lock_programme(uuid, text);
DROP FUNCTION IF EXISTS public.cancel_programme_unlock(uuid);

CREATE OR REPLACE FUNCTION public.request_programme_unlock(
  p_programme_id    uuid,
  p_reason          text,
  p_scope           text[],
  p_requested_hours integer DEFAULT 24
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user     uuid := auth.uid();
  v_name     text;
  v_code     text;
  v_locked   boolean;
  v_expires  timestamptz;
  v_id       uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'FORBIDDEN: sesi tidak sah' USING ERRCODE = '42501';
  END IF;

  IF public.current_role_name() = 'viewer' THEN
    RAISE EXCEPTION 'FORBIDDEN: peranan pemerhati tidak boleh memohon' USING ERRCODE = '42501';
  END IF;

  -- Kunci baris program supaya semakan keadaan bersifat atomik.
  SELECT p.programme_code, p.is_locked, p.unlock_expires_at
    INTO v_code, v_locked, v_expires
  FROM public.programmes p
  WHERE p.id = p_programme_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROGRAMME_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_locked THEN
    RAISE EXCEPTION 'PROGRAMME_NOT_LOCKED' USING ERRCODE = 'P0001';
  END IF;

  IF v_expires IS NOT NULL AND v_expires > now() THEN
    RAISE EXCEPTION 'PROGRAMME_ALREADY_UNLOCKED' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.programme_unlock_requests r
    WHERE r.programme_id = p_programme_id AND r.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'UNLOCK_PENDING_EXISTS' USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE(up.full_name, up.email)
    INTO v_name
  FROM public.user_profiles up
  WHERE up.id = v_user;

  INSERT INTO public.programme_unlock_requests (
    programme_id, programme_code, requested_by, requested_by_name,
    reason, scope, requested_hours, status
  )
  VALUES (
    p_programme_id, v_code, v_user, COALESCE(v_name, 'Pengguna'),
    btrim(p_reason), COALESCE(p_scope, '{}'::text[]),
    LEAST(72, GREATEST(1, COALESCE(p_requested_hours, 24))), 'pending'
  )
  RETURNING id INTO v_id;

  PERFORM public.log_audit(
    'programme_unlock_requests',
    v_id,
    'unlock_requested',
    NULL,
    NULL,
    jsonb_build_object(
      'programme_id', p_programme_id,
      'programme_code', v_code,
      'reason', btrim(p_reason),
      'scope', to_jsonb(COALESCE(p_scope, '{}'::text[])),
      'requested_hours', p_requested_hours
    )
  );

  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- 5. RPC: lulus / tolak permohonan (atomik)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.review_programme_unlock(
  p_request_id    uuid,
  p_approve       boolean,
  p_review_note   text DEFAULT NULL,
  p_granted_hours integer DEFAULT 24
)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user     uuid := auth.uid();
  v_name     text;
  v_req      public.programme_unlock_requests%ROWTYPE;
  v_hours    integer;
  v_expires  timestamptz;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'FORBIDDEN: sesi tidak sah' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_unlock_approver() THEN
    RAISE EXCEPTION 'FORBIDDEN: hanya pengurus/pentadbir boleh meluluskan' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_req
  FROM public.programme_unlock_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'UNLOCK_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'UNLOCK_NOT_PENDING' USING ERRCODE = 'P0001';
  END IF;

  -- Pengasingan tugas: pemohon tidak boleh meluluskan permohonan sendiri.
  IF v_req.requested_by = v_user THEN
    RAISE EXCEPTION 'UNLOCK_SELF_APPROVAL' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(up.full_name, up.email) INTO v_name
  FROM public.user_profiles up WHERE up.id = v_user;

  IF p_approve THEN
    v_hours := LEAST(72, GREATEST(1, COALESCE(p_granted_hours, v_req.requested_hours)));
    v_expires := now() + make_interval(hours => v_hours);

    UPDATE public.programme_unlock_requests
       SET status = 'approved',
           reviewed_by = v_user,
           reviewed_by_name = COALESCE(v_name, 'Pengurus'),
           reviewed_at = now(),
           review_note = p_review_note,
           unlock_expires_at = v_expires
     WHERE id = p_request_id;

    -- Buka tetingkap suntingan bertempoh pada program.
    UPDATE public.programmes
       SET unlock_expires_at = v_expires
     WHERE id = v_req.programme_id;
  ELSE
    UPDATE public.programme_unlock_requests
       SET status = 'rejected',
           reviewed_by = v_user,
           reviewed_by_name = COALESCE(v_name, 'Pengurus'),
           reviewed_at = now(),
           review_note = p_review_note
     WHERE id = p_request_id;

    v_expires := NULL;
  END IF;

  PERFORM public.log_audit(
    'programme_unlock_requests',
    p_request_id,
    CASE WHEN p_approve THEN 'unlock_approved'::public.audit_action
         ELSE 'unlock_rejected'::public.audit_action END,
    NULL,
    NULL,
    jsonb_build_object(
      'programme_id', v_req.programme_id,
      'requested_by', v_req.requested_by,
      'review_note', p_review_note,
      'unlock_expires_at', v_expires
    )
  );

  RETURN v_expires;
END;
$$;

-- ---------------------------------------------------------------------
-- 6. RPC: kunci semula program
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.lock_programme(
  p_programme_id uuid,
  p_lock_reason  text DEFAULT 'manual'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL OR NOT public.is_unlock_approver() THEN
    RAISE EXCEPTION 'FORBIDDEN: hanya pengurus/pentadbir boleh mengunci' USING ERRCODE = '42501';
  END IF;

  UPDATE public.programmes
     SET is_locked = true,
         lock_reason = p_lock_reason::public.programme_lock_reason,
         locked_by = v_user,
         locked_at = now(),
         unlock_expires_at = NULL
   WHERE id = p_programme_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROGRAMME_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- Tetingkap suntingan aktif ditutup serta-merta.
  UPDATE public.programme_unlock_requests
     SET status = 'expired'
   WHERE programme_id = p_programme_id AND status = 'approved';

  PERFORM public.log_audit(
    'programmes',
    p_programme_id,
    'locked',
    NULL,
    NULL,
    jsonb_build_object('lock_reason', p_lock_reason)
  );
END;
$$;

-- ---------------------------------------------------------------------
-- 7. RPC: batalkan permohonan sendiri
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cancel_programme_unlock(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_req  public.programme_unlock_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_req
  FROM public.programme_unlock_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'UNLOCK_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_req.requested_by <> v_user AND NOT public.is_unlock_approver() THEN
    RAISE EXCEPTION 'FORBIDDEN: bukan pemohon' USING ERRCODE = '42501';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'UNLOCK_NOT_PENDING' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.programme_unlock_requests
     SET status = 'cancelled', reviewed_at = now()
   WHERE id = p_request_id;

  PERFORM public.log_audit(
    'programme_unlock_requests',
    p_request_id,
    'unlock_cancelled',
    NULL,
    NULL,
    jsonb_build_object('programme_id', v_req.programme_id)
  );
END;
$$;

-- ---------------------------------------------------------------------
-- 8. Tugas penyelenggaraan: luputkan tetingkap yang tamat tempoh
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_stale_unlocks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.programmes
     SET unlock_expires_at = NULL
   WHERE is_locked = true
     AND unlock_expires_at IS NOT NULL
     AND unlock_expires_at <= now();

  UPDATE public.programme_unlock_requests
     SET status = 'expired'
   WHERE status = 'approved'
     AND unlock_expires_at IS NOT NULL
     AND unlock_expires_at <= now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------
-- 9. Penguatkuasaan kunci pada peringkat pangkalan data
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_programme_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Benarkan operasi tadbir urus (kunci/buka) melalui RPC SECURITY DEFINER.
  IF OLD.is_locked
     AND (OLD.unlock_expires_at IS NULL OR OLD.unlock_expires_at <= now())
     AND (NEW.is_locked IS NOT DISTINCT FROM OLD.is_locked)
     AND (NEW.unlock_expires_at IS NOT DISTINCT FROM OLD.unlock_expires_at)
  THEN
    RAISE EXCEPTION 'PROGRAMME_LOCKED: program berkunci — mohon buka kunci dahulu'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS programmes_enforce_lock ON public.programmes;
CREATE TRIGGER programmes_enforce_lock
  BEFORE UPDATE ON public.programmes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_programme_lock();

-- ---------------------------------------------------------------------
-- 10. Row Level Security
-- ---------------------------------------------------------------------

ALTER TABLE public.programme_unlock_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS unlock_select_authenticated ON public.programme_unlock_requests;
CREATE POLICY unlock_select_authenticated
  ON public.programme_unlock_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Penulisan hanya melalui RPC SECURITY DEFINER di atas.
DROP POLICY IF EXISTS unlock_no_direct_write ON public.programme_unlock_requests;
CREATE POLICY unlock_no_direct_write
  ON public.programme_unlock_requests
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- ---------------------------------------------------------------------
-- 11. Audit — peralihan keadaan ditulis melalui log_audit (konsisten
--     dengan skema master). Nilai audit_action unlock_* ditambah oleh
--     schema-master.sql.
-- ---------------------------------------------------------------------

-- Pastikan nilai audit_action wujud (untuk pangkalan data sedia ada yang
-- mungkin dipasang sebelum schema-master dikemas kini).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'audit_action' AND e.enumlabel = 'unlock_requested'
  ) THEN
    ALTER TYPE public.audit_action ADD VALUE 'unlock_requested';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'audit_action' AND e.enumlabel = 'unlock_approved'
  ) THEN
    ALTER TYPE public.audit_action ADD VALUE 'unlock_approved';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'audit_action' AND e.enumlabel = 'unlock_rejected'
  ) THEN
    ALTER TYPE public.audit_action ADD VALUE 'unlock_rejected';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'audit_action' AND e.enumlabel = 'unlock_cancelled'
  ) THEN
    ALTER TYPE public.audit_action ADD VALUE 'unlock_cancelled';
  END IF;
END
$$;

GRANT EXECUTE ON FUNCTION public.request_programme_unlock(uuid, text, text[], integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_programme_unlock(uuid, boolean, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lock_programme(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_programme_unlock(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.programme_is_editable(uuid) TO authenticated;

COMMIT;
