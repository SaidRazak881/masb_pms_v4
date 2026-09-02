-- TPMS MIMOS Academy: atomic Excel staging -> master synchronisation
-- Execute this file in Supabase SQL Editor AFTER the master schema and
-- lib/supabase/schema-import-staging.sql have been applied.

BEGIN;

-- Schema `private` digunakan untuk fungsi bantu dalaman (append_import_audit).
-- Pastikan ia wujud (selamat untuk database baru & sedia ada).
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.append_import_audit(
  p_user_id uuid,
  p_action public.audit_action,
  p_record_id uuid,
  p_payload jsonb,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    changed_fields,
    metadata
  )
  VALUES (
    p_user_id,
    p_action,
    'import_staging',
    p_record_id,
    NULL,
    NULL,
    NULL,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('payload', COALESCE(p_payload, '{}'::jsonb))
  );
END;
$$;

REVOKE ALL ON FUNCTION private.append_import_audit(uuid, public.audit_action, uuid, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.append_import_audit(uuid, public.audit_action, uuid, jsonb, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_import_transaction(
  p_batch_id uuid,
  p_rows jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_row jsonb;
  v_kind public.import_entity_kind;
  v_action public.import_record_action;
  v_programme public.programmes%ROWTYPE;
  v_programme_id uuid;
  v_staging_id uuid;
  v_duplicate_id uuid;
  v_programme_code text;
  v_title text;
  v_client text;
  v_category public.programme_category;
  v_delivery public.delivery_mode;
  v_doc_date date;
  v_amount numeric(14,2);
  v_ref text;
  v_status text;
  v_invoice_id uuid;
  v_cost_id uuid;
  v_new_status text;
  v_processed integer := 0;
  v_created integer := 0;
  v_merged integer := 0;
  v_discarded integer := 0;
  v_failed integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Authentication diperlukan untuk penyegerakan import.';
  END IF;

  IF p_batch_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'batch_id diperlukan.';
  END IF;

  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'rows mesti berupa JSON array.';
  END IF;

  IF NOT (
    public.has_role('admin'::public.app_role)
    OR public.has_role('staff'::public.app_role)
    OR public.has_role('finance'::public.app_role)
    OR public.has_role('head_governance'::public.app_role)
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Anda tidak mempunyai role untuk menyegerakkan data import.';
  END IF;

  -- Lock batch row so two sync requests for the same Excel batch cannot race.
  PERFORM 1 FROM public.import_batches WHERE id = p_batch_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = format('Import batch %s tidak ditemui.', p_batch_id);
  END IF;

  -- Penyesuaian schema: pastikan kolum invoices yang diperlukan wujud.
  -- (Menyokong pangkalan data sedia ada yang menggunakan kontrak lama
  --  dengan kolum `status` dan bukannya `payment_status`.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_status text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'invoice_no'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_no text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'quotation_no'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS quotation_no text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'invoice_value_excl_tax'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_value_excl_tax numeric(14,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'po_value_excl_tax'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS po_value_excl_tax numeric(14,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'invoice_date'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_date date;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'account_manager'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS account_manager text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'pic_name'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS pic_name text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'programme_id'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS programme_id uuid;
  END IF;

  -- Penyesuaian untuk programme_costs: pastikan kolum cost_of_sales wujud
  -- (pangkalan data sedia ada mungkin hanya mempunyai amount/budgeted_amount).
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'programme_costs'
      AND column_name = 'cost_of_sales'
  ) THEN
    ALTER TABLE public.programme_costs ADD COLUMN IF NOT EXISTS cost_of_sales numeric(14,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'programme_costs'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.programme_costs ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
  END IF;

  -- Penyesuaian audit_logs: skema rasmi menggunakan kolum
  -- action / changed_fields / metadata (bukan action_type / payload).
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
      AND column_name = 'action'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action public.audit_action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
      AND column_name = 'changed_fields'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS changed_fields jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
      AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    v_action := COALESCE((v_row->>'action')::public.import_record_action, 'pending'::public.import_record_action);
    v_kind := COALESCE((v_row->>'entity_kind')::public.import_entity_kind, 'unknown'::public.import_entity_kind);

    IF v_action = 'pending' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Semua rekod yang dihantar mesti mempunyai keputusan (sync_confirmed, merged, created_new atau discarded).';
    END IF;

    IF v_action = 'discarded' THEN
      v_discarded := v_discarded + 1;
      IF NULLIF(v_row->>'staging_id', '') IS NOT NULL THEN
        v_staging_id := (v_row->>'staging_id')::uuid;
        UPDATE public.import_staging
        SET suggested_action = 'discarded', decided_at = now(), decided_by = v_user_id
        WHERE id = v_staging_id AND batch_id = p_batch_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = format('Staging row %s tidak ditemui dalam batch %s.', v_staging_id, p_batch_id);
        END IF;
        PERFORM private.append_import_audit(v_user_id, 'import_discard', v_staging_id, v_row, jsonb_build_object('batch_id', p_batch_id));
      END IF;
      CONTINUE;
    END IF;

    IF v_kind = 'unknown' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Entity kind tidak dikenali. Hanya quotation, invoice dan cost disokong.';
    END IF;

    IF NULLIF(trim(v_row->>'programme_title'), '') IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'programme_title diperlukan untuk rekod yang hendak disegerakkan.';
    END IF;

    v_title := trim(v_row->>'programme_title');
    v_client := NULLIF(trim(v_row->>'client_name'), '');
    v_ref := NULLIF(trim(v_row->>'reference_no'), '');
    v_amount := NULLIF(v_row->>'amount', '')::numeric;
    v_doc_date := NULLIF(v_row->>'doc_date', '')::date;
    v_status := lower(trim(COALESCE(v_row->>'status_raw', '')));

    IF v_amount IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = format('Amaun diperlukan untuk %s: %s.', v_kind, COALESCE(v_ref, v_title));
    END IF;

    -- Resolve programme. merged requires the parser/UI duplicate_match_id.
    v_programme_id := NULL;
    IF v_action = 'merged' THEN
      IF NULLIF(v_row->>'duplicate_match_id', '') IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = format('merged memerlukan duplicate_match_id untuk %s.', COALESCE(v_ref, v_title));
      END IF;
      BEGIN
        v_duplicate_id := (v_row->>'duplicate_match_id')::uuid;
      EXCEPTION WHEN invalid_text_representation THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'duplicate_match_id mesti UUID bagi tindakan merged.';
      END;
      v_programme_id := v_duplicate_id;
    ELSE
      -- For confirmed records, use an explicit programme_id when supplied;
      -- otherwise resolve an exact title/client match. New records never reuse
      -- a fuzzy parser match unless the UI selected merged explicitly.
      IF NULLIF(v_row->>'programme_id', '') IS NOT NULL THEN
        v_programme_id := (v_row->>'programme_id')::uuid;
      ELSE
        SELECT p.id
        INTO v_programme_id
        FROM public.programmes p
        WHERE lower(trim(p.title)) = lower(v_title)
          AND COALESCE(lower(trim(p.organizer_name)), '') = COALESCE(lower(v_client), '')
        LIMIT 1;
      END IF;
    END IF;

    IF v_programme_id IS NOT NULL THEN
      SELECT * INTO v_programme
      FROM public.programmes
      WHERE id = v_programme_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = format('Programme %s tidak ditemui.', v_programme_id);
      END IF;

      IF v_programme.governance_lock_status = 'locked'
         AND NOT public.has_role('head_governance'::public.app_role) THEN
        RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = format('Programme "%s" telah dikunci oleh Governance. Import tidak boleh mengubah rekod ini.', v_programme.title);
      END IF;
    ELSE
      v_programme_code := COALESCE(
        NULLIF(trim(v_row->>'programme_code'), ''),
        'IMP-' || upper(substr(md5(p_batch_id::text || '|' || v_title || '|' || COALESCE(v_client, '')), 1, 10))
      );

      v_category := CASE lower(trim(COALESCE(v_row->>'category', '')))
        WHEN 'ai' THEN 'AI & Data Science'::public.programme_category
        WHEN 'ai & data science' THEN 'AI & Data Science'::public.programme_category
        WHEN 'engineering' THEN 'Engineering'::public.programme_category
        WHEN 'semiconductor' THEN 'Semiconductor'::public.programme_category
        WHEN 'room rental' THEN 'Room Rental'::public.programme_category
        WHEN 'rental' THEN 'Room Rental'::public.programme_category
        WHEN 'consultancy' THEN 'Consultancy'::public.programme_category
        WHEN 'consulting' THEN 'Consultancy'::public.programme_category
        WHEN 'certification' THEN 'Certification'::public.programme_category
        WHEN 'certificate' THEN 'Certification'::public.programme_category
        ELSE 'Non-Training'::public.programme_category
      END;

      v_delivery := CASE lower(trim(COALESCE(v_row->>'delivery_mode', '')))
        WHEN 'online' THEN 'online'::public.delivery_mode
        WHEN 'hybrid' THEN 'hybrid'::public.delivery_mode
        WHEN 'in_person' THEN 'physical'::public.delivery_mode
        WHEN 'physical' THEN 'physical'::public.delivery_mode
        ELSE 'physical'::public.delivery_mode
      END;

      INSERT INTO public.programmes (
        programme_code,
        title,
        organizer_name,
        category,
        delivery_mode,
        start_date,
        end_date,
        venue,
        governance_lock_status,
        created_by
      )
      VALUES (
        v_programme_code,
        v_title,
        v_client,
        v_category,
        v_delivery,
        COALESCE(v_doc_date, current_date),
        COALESCE(v_doc_date, current_date),
        NULL,
        'unlocked',
        v_user_id
      )
      RETURNING * INTO v_programme;

      v_programme_id := v_programme.id;
      v_created := v_created + 1;
    END IF;

    -- The staging schema has exactly three business entity kinds. Quotation
    -- has no dedicated master table, so its reference/value are stored as
    -- quotation_no / po_value_excl_tax in invoices. Invoice maps to
    -- invoice_no / invoice_value_excl_tax. Cost maps to cost_of_sales.
    IF v_kind = 'quotation' THEN
      IF v_ref IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'quotation memerlukan reference_no (quotation number).';
      END IF;

      SELECT id INTO v_invoice_id
      FROM public.invoices
      WHERE programme_id = v_programme_id
        AND quotation_no = v_ref
      LIMIT 1
      FOR UPDATE;

      IF v_invoice_id IS NULL THEN
        INSERT INTO public.invoices (
          programme_id,
          quotation_no,
          po_value_excl_tax,
          invoice_date,
          account_manager,
          pic_name
        )
        VALUES (
          v_programme_id,
          v_ref,
          v_amount,
          v_doc_date,
          NULLIF(trim(v_row->>'trainer'), ''),
          v_client
        )
        RETURNING id INTO v_invoice_id;
      ELSE
        UPDATE public.invoices
        SET po_value_excl_tax = v_amount,
            invoice_date = COALESCE(v_doc_date, invoice_date),
            account_manager = COALESCE(NULLIF(trim(v_row->>'trainer'), ''), account_manager),
            pic_name = COALESCE(v_client, pic_name),
            updated_at = now()
        WHERE id = v_invoice_id;
      END IF;

    ELSIF v_kind = 'invoice' THEN
      IF v_ref IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'invoice memerlukan reference_no (invoice number).';
      END IF;

      -- Normalisasi status bayaran (untuk kedua-dua kontrak payment_status/status)
      v_new_status := CASE
        WHEN v_status IN ('paid', 'settled', 'bayar', 'dibayar') THEN 'paid'
        WHEN v_status IN ('overdue', 'tertunggak') THEN 'overdue'
        WHEN v_status IN ('cancelled', 'canceled', 'dibatalkan') THEN 'cancelled'
        WHEN v_status IN ('partial', 'partially paid', 'sebahagian') THEN 'partial'
        ELSE 'pending'
      END;

      SELECT id INTO v_invoice_id
      FROM public.invoices
      WHERE programme_id = v_programme_id
        AND invoice_no = v_ref
      LIMIT 1
      FOR UPDATE;

      IF v_invoice_id IS NULL THEN
        INSERT INTO public.invoices (
          programme_id,
          invoice_no,
          invoice_value_excl_tax,
          invoice_date,
          payment_status,
          account_manager,
          pic_name
        )
        VALUES (
          v_programme_id,
          v_ref,
          v_amount,
          v_doc_date,
          v_new_status::public.payment_status,
          NULLIF(trim(v_row->>'trainer'), ''),
          v_client
        )
        RETURNING id INTO v_invoice_id;
      ELSE
        UPDATE public.invoices
        SET invoice_value_excl_tax = v_amount,
            invoice_date = COALESCE(v_doc_date, invoice_date),
            payment_status = v_new_status::public.payment_status,
            account_manager = COALESCE(NULLIF(trim(v_row->>'trainer'), ''), account_manager),
            pic_name = COALESCE(v_client, pic_name),
            updated_at = now()
        WHERE id = v_invoice_id;
      END IF;

      -- Kontrak lama: jadual invoices mungkin menggunakan kolum `status`
      -- dan bukannya `payment_status` — selaraskan juga jika wujud.
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'invoices'
          AND column_name = 'status'
      ) THEN
        EXECUTE 'UPDATE public.invoices SET status = $1 WHERE id = $2'
          USING v_new_status, v_invoice_id;
      END IF;

    ELSIF v_kind = 'cost' THEN
      SELECT id INTO v_cost_id
      FROM public.programme_costs
      WHERE programme_id = v_programme_id
      LIMIT 1
      FOR UPDATE;

      IF v_cost_id IS NULL THEN
        INSERT INTO public.programme_costs (
          programme_id,
          cost_of_sales
        )
        VALUES (
          v_programme_id,
          v_amount
        )
        RETURNING id INTO v_cost_id;
      ELSE
        UPDATE public.programme_costs
        SET cost_of_sales = v_amount,
            updated_at = now()
        WHERE id = v_cost_id;
      END IF;
    END IF;

    v_processed := v_processed + 1;
    IF v_action = 'merged' THEN
      v_merged := v_merged + 1;
    END IF;

    IF NULLIF(v_row->>'staging_id', '') IS NOT NULL THEN
      v_staging_id := (v_row->>'staging_id')::uuid;
      UPDATE public.import_staging
      SET suggested_action = v_action,
          decided_at = now(),
          decided_by = v_user_id
      WHERE id = v_staging_id
        AND batch_id = p_batch_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = format('Staging row %s tidak ditemui dalam batch %s.', v_staging_id, p_batch_id);
      END IF;
    ELSE
      v_staging_id := NULL;
    END IF;

    PERFORM private.append_import_audit(
      v_user_id,
      'import_sync',
      v_staging_id,
      v_row,
      jsonb_build_object(
        'batch_id', p_batch_id,
        'entity_kind', v_kind,
        'action_type', v_action,
        'programme_id', v_programme_id,
        'timestamp', now()
      )
    );
  END LOOP;

  UPDATE public.import_batches
  SET status = 'synced'
  WHERE id = p_batch_id;

  RETURN jsonb_build_object(
    'success', true,
    'batch_id', p_batch_id,
    'processed', v_processed,
    'created', v_created,
    'merged', v_merged,
    'discarded', v_discarded,
    'failed', v_failed
  );

EXCEPTION
  WHEN SQLSTATE '55000' THEN
    RAISE;
  WHEN foreign_key_violation THEN
    RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'Sync gagal: Foreign Key tidak sah atau rekod induk tidak ditemui.', DETAIL = SQLERRM;
  WHEN unique_violation THEN
    RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'Sync gagal: data pendua / konflik unique key dikesan.', DETAIL = SQLERRM;
  WHEN check_violation THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Sync gagal: data melanggar constraint database.', DETAIL = SQLERRM;
END;
$$;

-- Pastikan nilai audit_action untuk import wujud pada pangkalan data sedia
-- ada (jika schema-master/seed lama dipasang sebelum nilai ini ditambah).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'audit_action' AND e.enumlabel = 'import_sync'
  ) THEN
    ALTER TYPE public.audit_action ADD VALUE 'import_sync';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'audit_action' AND e.enumlabel = 'import_discard'
  ) THEN
    ALTER TYPE public.audit_action ADD VALUE 'import_discard';
  END IF;
END
$$;

REVOKE ALL ON FUNCTION public.sync_import_transaction(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_import_transaction(uuid, jsonb) TO authenticated;

COMMIT;
