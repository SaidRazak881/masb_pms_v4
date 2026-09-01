-- =====================================================================
-- TPMS MIMOS Academy — Change Requests (Permohonan Ubah Data Terkunci)
--
-- Jalankan fail ini di Supabase SQL Editor SELEPAS skema induk
-- (schema-master.sql) dan governance-lock.sql telah dipasang.
--
-- Konsep (mengikut spesifikasi sistem):
--   * Apabila program dikunci oleh Head Governance, staff TIDAK boleh
--     mengemaskini data terus. Mereka menyerahkan "Change Request"
--     dengan: medan yang ingin diubah, nilai lama, nilai baharu, sebab,
--     dan dokumen sokongan (jika berkaitan kewangan).
--   * Head Governance / Admin meluluskan atau menolak permintaan.
--   * Semua keputusan direkod dalam audit_logs.
--   * Tiada penulisan terus ke jadual change_requests daripada klien —
--     semua melalui RPC (SECURITY DEFINER) supaya logik tidak boleh
--     dipintas di peringkat API/UI.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Enum & jenis
-- ---------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'change_request_status') THEN
    CREATE TYPE public.change_request_status AS ENUM (
      'pending', 'approved', 'rejected', 'cancelled', 'applied'
    );
  END IF;
END
$$;

-- Tambah tindakan audit baharu jika belum wujud
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'audit_action' AND e.enumlabel = 'change_requested'
  ) THEN
    ALTER TYPE public.audit_action ADD VALUE 'change_requested';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'audit_action' AND e.enumlabel = 'change_reviewed'
  ) THEN
    ALTER TYPE public.audit_action ADD VALUE 'change_reviewed';
  END IF;
END
$$;

-- ---------------------------------------------------------------------
-- 2. Jadual change_requests
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.change_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id      uuid NOT NULL REFERENCES public.programmes (id) ON DELETE CASCADE,
  programme_code    text,

  -- Medan yang diminta diubah
  field_name        text NOT NULL,
  field_label       text,
  old_value         text,
  new_value         text,
  reason            text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 10 AND 2000),
  supporting_document_url text,

  -- Status & aliran kelulusan
  status            public.change_request_status NOT NULL DEFAULT 'pending',
  requested_by      uuid NOT NULL REFERENCES auth.users (id),
  requested_by_name text,
  requested_at      timestamptz NOT NULL DEFAULT now(),
  reviewed_by       uuid REFERENCES auth.users (id),
  reviewed_by_name  text,
  reviewed_at       timestamptz,
  review_note       text,

  CONSTRAINT change_request_has_change CHECK (
    (old_value IS NOT NULL AND old_value <> '')
    OR (new_value IS NOT NULL AND new_value <> '')
  ),
  CONSTRAINT change_request_review_complete CHECK (
    status IN ('pending', 'cancelled') OR reviewed_at IS NOT NULL
  )
);

-- Hanya SATU permohonan 'pending' dibenarkan bagi setiap program + medan.
CREATE UNIQUE INDEX IF NOT EXISTS change_request_one_pending_per_field
  ON public.change_requests (programme_id, field_name)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS change_requests_programme_idx
  ON public.change_requests (programme_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS change_requests_status_idx
  ON public.change_requests (status, requested_at DESC);

-- ---------------------------------------------------------------------
-- 3. Fungsi pembantu: senarai medan yang dibenarkan
-- ---------------------------------------------------------------------

-- Medan program yang dibenarkan untuk diminta diubah melalui change
-- request. Nilai boleh ditambah oleh admin mengikut keperluan.
CREATE OR REPLACE FUNCTION public.change_request_allowed_fields()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ARRAY[
    'title',
    'description',
    'organizer_name',
    'category',
    'delivery_mode',
    'start_date',
    'end_date',
    'venue',
    'trainer',
    'programme_manager',
    'contracted_amount',
    'budget',
    'actual_cost',
    'status'
  ];
$$;

-- ---------------------------------------------------------------------
-- 4. RPC: hantar permohonan ubah data
-- ---------------------------------------------------------------------

-- Buang versi lama (jika wujud) supaya kontrak baharu digunakan dengan
-- pasti; fungsi dicipta semula di bawah dalam transaksi yang sama.
DROP FUNCTION IF EXISTS public.submit_change_request(uuid, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.review_change_request(uuid, boolean, text);
DROP FUNCTION IF EXISTS public.cancel_change_request(uuid);

CREATE OR REPLACE FUNCTION public.submit_change_request(
  p_programme_id   uuid,
  p_field_name     text,
  p_old_value      text,
  p_new_value      text,
  p_reason         text,
  p_supporting_document_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request_id uuid;
  v_programme  public.programmes%ROWTYPE;
  v_user_name  text;
  v_field_label text;
BEGIN
  -- Pengguna mesti log masuk
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  -- Program mesti wujud DAN berkunci (perubahan hanya perlu jika terkunci)
  SELECT * INTO v_programme
  FROM public.programmes p
  WHERE p.id = p_programme_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROGRAMME_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF NOT v_programme.is_locked THEN
    RAISE EXCEPTION 'PROGRAMME_NOT_LOCKED' USING ERRCODE = 'P0001';
  END IF;

  -- Medan mesti berada dalam senarai dibenarkan
  IF NOT p_field_name = ANY (public.change_request_allowed_fields()) THEN
    RAISE EXCEPTION 'FIELD_NOT_ALLOWED:%', p_field_name USING ERRCODE = 'P0001';
  END IF;

  -- Sebab wajib
  IF char_length(btrim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'REASON_TOO_SHORT' USING ERRCODE = 'P0001';
  END IF;

  -- Nilai lama atau baharu wajib diisi
  IF (p_old_value IS NULL OR btrim(p_old_value) = '')
     AND (p_new_value IS NULL OR btrim(p_new_value) = '') THEN
    RAISE EXCEPTION 'NO_CHANGE_VALUE' USING ERRCODE = 'P0001';
  END IF;

  -- Semak permohonan pending sedia ada bagi medan ini
  IF EXISTS (
    SELECT 1 FROM public.change_requests cr
    WHERE cr.programme_id = p_programme_id
      AND cr.field_name = p_field_name
      AND cr.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'CHANGE_REQUEST_PENDING_EXISTS' USING ERRCODE = 'P0001';
  END IF;

  SELECT full_name INTO v_user_name
  FROM public.user_profiles up
  WHERE up.id = auth.uid();

  v_field_label := initcap(replace(p_field_name, '_', ' '));

  INSERT INTO public.change_requests (
    programme_id, programme_code, field_name, field_label,
    old_value, new_value, reason, supporting_document_url,
    status, requested_by, requested_by_name
  ) VALUES (
    p_programme_id, v_programme.programme_code, p_field_name, v_field_label,
    p_old_value, p_new_value, p_reason, p_supporting_document_url,
    'pending', auth.uid(), COALESCE(v_user_name, 'Pengguna')
  )
  RETURNING id INTO v_request_id;

  PERFORM public.log_audit(
    'change_requests',
    v_request_id,
    'change_requested',
    NULL,
    jsonb_build_object(
      'programme_id', p_programme_id,
      'programme_code', v_programme.programme_code,
      'field_name', p_field_name,
      'old_value', p_old_value,
      'new_value', p_new_value
    ),
    jsonb_build_object(
      'source', 'change_request',
      'reason', p_reason,
      'programme_code', v_programme.programme_code
    )
  );

  RETURN v_request_id;
END;
$$;

-- ---------------------------------------------------------------------
-- 5. RPC: lulus / tolak permohonan (Head Governance / Admin sahaja)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.review_change_request(
  p_request_id uuid,
  p_approve    boolean,
  p_review_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request public.change_requests%ROWTYPE;
  v_reviewer_name text;
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  -- Hanya head_governance / admin / manager boleh memutuskan
  v_role := public.current_role_name();
  IF v_role NOT IN ('head_governance', 'admin', 'manager') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_request
  FROM public.change_requests cr
  WHERE cr.id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REQUEST_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'REQUEST_NOT_PENDING' USING ERRCODE = 'P0001';
  END IF;

  -- Pengasingan tugas: pemohon tidak boleh meluluskan sendiri
  IF v_request.requested_by = auth.uid() THEN
    RAISE EXCEPTION 'CHANGE_SELF_APPROVAL' USING ERRCODE = 'P0001';
  END IF;

  SELECT full_name INTO v_reviewer_name
  FROM public.user_profiles up
  WHERE up.id = auth.uid();

  UPDATE public.change_requests cr
  SET status      = CASE WHEN p_approve THEN 'approved'::public.change_request_status
                         ELSE 'rejected'::public.change_request_status END,
      reviewed_by = auth.uid(),
      reviewed_by_name = COALESCE(v_reviewer_name, 'Pengguna'),
      reviewed_at = now(),
      review_note = p_review_note
  WHERE cr.id = p_request_id
  RETURNING * INTO v_request;

  PERFORM public.log_audit(
    'change_requests',
    p_request_id,
    'change_reviewed',
    NULL,
    jsonb_build_object(
      'status', CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      'review_note', p_review_note
    ),
    jsonb_build_object(
      'source', 'change_request_review',
      'programme_id', v_request.programme_id,
      'programme_code', v_request.programme_code,
      'field_name', v_request.field_name
    )
  );

  RETURN p_request_id;
END;
$$;

-- ---------------------------------------------------------------------
-- 6. RPC: batal permohonan sendiri (jika masih pending)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cancel_change_request(
  p_request_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request public.change_requests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_request
  FROM public.change_requests cr
  WHERE cr.id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REQUEST_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'REQUEST_NOT_PENDING' USING ERRCODE = 'P0001';
  END IF;

  IF v_request.requested_by <> auth.uid() THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  UPDATE public.change_requests cr
  SET status = 'cancelled'
  WHERE cr.id = p_request_id;

  PERFORM public.log_audit(
    'change_requests',
    p_request_id,
    'change_reviewed',
    NULL,
    jsonb_build_object('status', 'cancelled'),
    jsonb_build_object(
      'source', 'change_request_cancel',
      'programme_code', v_request.programme_code
    )
  );

  RETURN p_request_id;
END;
$$;

-- ---------------------------------------------------------------------
-- 7. RLS — baca dibenarkan, tulis hanya melalui RPC
-- ---------------------------------------------------------------------

-- Sediakan semula polisi supaya fail boleh dijalankan semula.
DO $$
DECLARE
  v_policy text;
BEGIN
  FOR v_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'change_requests'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.change_requests', v_policy);
  END LOOP;
END
$$;

ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY change_requests_select_authenticated
  ON public.change_requests FOR SELECT
  TO authenticated
  USING (true);

-- Tiada polisi INSERT/UPDATE/DELETE — semua tulis melalui RPC
-- SECURITY DEFINER di atas (owner bypass RLS). Ini memastikan lock
-- governance tidak boleh dipintas dengan panggilan API terus.

COMMIT;
