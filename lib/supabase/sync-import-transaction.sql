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
  -- GAP-ANALISIS §4.1–4.3: medan perniagaan sebenar. Sebelum ini RPC
  -- menulis `trainer` ke account_manager dan `client_name` (syarikat) ke
  -- pic_name (individu) kerana lajur sebenar tidak pernah ditangkap.
  v_account_manager text;
  v_pic_name text;
  v_pic_contact_no text;
  v_pic_email text;
  v_po_no text;
  v_quotation_ref text;
  v_prepared_by text;
  v_sst numeric(14,2);
  v_final_price numeric(14,2);
  v_unit_price numeric(14,2);
  v_quantity numeric(14,2);
  v_total_incl_sst numeric(14,2);
  v_total_excl_sst numeric(14,2);
  v_payment_status_raw text;
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

  -- -------------------------------------------------------------------
  -- Lajur BAHARU daripada fix-field-mapping.sql (GAP-ANALISIS §4.1–4.4).
  -- Diulang di sini sebagai pertahanan: fail SQL ini boleh dipasang
  -- tanpa fix-field-mapping.sql, dan tanpa lajur ini penyataan INSERT
  -- statik di bawah akan gagal semasa perancangan.
  -- -------------------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'client_name'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_name text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'pic_contact_no'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS pic_contact_no text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'pic_email'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS pic_email text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'quantity'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS quantity numeric(14,2);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'unit_price'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS unit_price numeric(14,2);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'total_value'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_value numeric(14,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices'
      AND column_name = 'sst'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS sst numeric(10,2) NOT NULL DEFAULT 0;
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
      AND column_name = 'po_no'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS po_no text;
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

    -- Medan perniagaan (GAP-ANALISIS §4.1–4.3). Semua boleh NULL supaya
    -- baris staging lama (yang tiada lajur ini) terus berfungsi.
    v_account_manager    := NULLIF(trim(v_row->>'account_manager'), '');
    v_pic_name           := NULLIF(trim(v_row->>'pic_name'), '');
    v_pic_contact_no     := NULLIF(trim(v_row->>'pic_contact_no'), '');
    v_pic_email          := NULLIF(trim(v_row->>'pic_email'), '');
    v_po_no              := NULLIF(trim(v_row->>'po_no'), '');
    v_quotation_ref      := NULLIF(trim(v_row->>'quotation_ref'), '');
    v_prepared_by        := NULLIF(trim(v_row->>'prepared_by'), '');
    v_payment_status_raw := NULLIF(trim(v_row->>'payment_status_raw'), '');
    v_sst                := NULLIF(v_row->>'sst_amount', '')::numeric;
    v_final_price        := NULLIF(v_row->>'final_price', '')::numeric;
    v_unit_price         := NULLIF(v_row->>'unit_price', '')::numeric;
    v_quantity           := NULLIF(v_row->>'quantity', '')::numeric;
    v_total_incl_sst     := NULLIF(v_row->>'total_incl_sst', '')::numeric;
    v_total_excl_sst     := NULLIF(v_row->>'total_excl_sst', '')::numeric;

    -- Keutamaan amaun (GAP-ANALISIS §4.1). `amount` staging sudah dikira
    -- oleh parser dengan keutamaan finalPrice > totalInclSst > amount >
    -- unitPrice; ini adalah jaring keselamatan kedua di peringkat DB, dan
    -- yang melindungi baris staging yang ditulis oleh parser versi lama.
    -- `sst_amount` SENGAJA tidak pernah digunakan sebagai amaun.
    v_amount := COALESCE(v_final_price, v_total_incl_sst, v_amount, v_unit_price);

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

      -- GAP-ANALISIS §4.1–4.3 DIBETULKAN:
      --   SEBELUM: account_manager <- trainer (JURULATIH)
      --            pic_name        <- v_client (nama SYARIKAT)
      --            po_value_excl_tax <- amaun quotation
      --   SELEPAS: account_manager <- lajur "Account Manager" sebenar
      --            pic_name        <- lajur "PIC - Full Name" sebenar
      --            client_name     <- nama syarikat (lajur BAHARU)
      --            quotation_value <- amaun quotation (lajur betul)
      -- `po_value_excl_tax` kini HANYA diisi daripada lajur PO sebenar.
      IF v_invoice_id IS NULL THEN
        -- `po_value_excl_tax` SENGAJA tidak disenaraikan: ia NOT NULL
        -- DEFAULT 0, dan menyebutnya dengan nilai NULL akan MEMBATALKAN
        -- DEFAULT lalu melanggar kekangan. Nilai PO sebenar hanya datang
        -- daripada lajur PO (GAP-ANALISIS §4.3).
        -- `invoice_value_excl_tax`, `sst` dan `total_value` juga NOT NULL
        -- DEFAULT 0, jadi setiap satu dibalut COALESCE(..., 0).
        INSERT INTO public.invoices (
          programme_id,
          quotation_no,
          invoice_value_excl_tax,
          sst,
          total_value,
          quantity,
          unit_price,
          invoice_date,
          account_manager,
          pic_name,
          pic_contact_no,
          pic_email,
          client_name,
          notes
        )
        VALUES (
          v_programme_id,
          v_ref,
          COALESCE(v_total_excl_sst, v_amount, 0),
          COALESCE(v_sst, 0),
          COALESCE(v_total_incl_sst, v_final_price, v_amount, 0),
          v_quantity,
          v_unit_price,
          v_doc_date,
          v_account_manager,
          v_pic_name,
          v_pic_contact_no,
          v_pic_email,
          v_client,
          v_prepared_by
        )
        RETURNING id INTO v_invoice_id;
      ELSE
        UPDATE public.invoices
        SET invoice_value_excl_tax = COALESCE(v_total_excl_sst, v_amount, invoice_value_excl_tax),
            sst            = COALESCE(v_sst, sst),
            total_value    = COALESCE(v_total_incl_sst, v_final_price, v_amount, total_value),
            quantity       = COALESCE(v_quantity, quantity),
            unit_price     = COALESCE(v_unit_price, unit_price),
            invoice_date   = COALESCE(v_doc_date, invoice_date),
            account_manager = COALESCE(v_account_manager, account_manager),
            pic_name        = COALESCE(v_pic_name, pic_name),
            pic_contact_no  = COALESCE(v_pic_contact_no, pic_contact_no),
            pic_email       = COALESCE(v_pic_email, pic_email),
            client_name     = COALESCE(v_client, client_name),
            updated_at      = now()
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

      -- GAP-ANALISIS §4.4 DIBETULKAN.
      -- `idx_invoices_quotation_no_unique` ialah indeks UNIQUE separa pada
      -- invoices(quotation_no). Import quotation mencipta baris dengan
      -- quotation_no diisi dan invoice_no NULL. Apabila invois sebenar
      -- tiba, padanan asal HANYA mencari invoice_no, jadi ia tidak jumpa
      -- baris quotation itu lalu cuba INSERT baris kedua dengan
      -- quotation_no yang sama → unique_violation (23505) → kerana
      -- transaksi ini ATOMIK, SELURUH batch gagal.
      -- Fallback kedua memadankan baris quotation-then-invoice supaya
      -- kitaran Quotation → PO → Invoice dikemaskini pada SATU baris.
      -- Padanan DUA LANGKAH.
      --
      -- Langkah 1 — padanan tepat: nombor invois dalam program yang sama.
      SELECT id INTO v_invoice_id
      FROM public.invoices
      WHERE programme_id = v_programme_id
        AND invoice_no = v_ref
      LIMIT 1
      FOR UPDATE;

      -- Langkah 2 — fallback kitaran Quotation → Invoice (GAP-ANALISIS §4.4).
      --
      -- `idx_invoices_quotation_no_unique` ialah indeks UNIQUE SEPARA yang
      -- GLOBAL — ia TIDAK termasuk programme_id. Jadi kekangan itu boleh
      -- dilanggar walaupun program berbeza, dan padanan fallback juga mesti
      -- GLOBAL (tanpa penapis programme_id).
      --
      -- Bukti daripada ujian: quotation KENANGA INVESTOR BERHAD mencipta
      -- program sintetik IMP-xxx, kemudian invois MIMOS Berhad (yang
      -- merujuk quotation_no yang sama) mencipta program sintetik IMP-yyy
      -- yang BERBEZA. Fallback versi pertama yang masih menapis
      -- `programme_id = v_programme_id` tidak menemui baris quotation itu,
      -- cuba INSERT baris kedua, dan melanggar 23505 — menggagalkan
      -- SELURUH batch kerana transaksi ini atomik.
      --
      -- Syarat `invoice_no IS NULL` memastikan kita hanya mengambil baris
      -- yang masih berstatus "quotation sahaja" (belum dibilkan). Baris
      -- yang sudah ada invoice_no ditangani oleh Langkah 1.
      IF v_invoice_id IS NULL AND v_quotation_ref IS NOT NULL THEN
        SELECT id INTO v_invoice_id
        FROM public.invoices
        WHERE invoice_no IS NULL
          AND quotation_no = v_quotation_ref
        LIMIT 1
        FOR UPDATE;
      END IF;

      -- GAP-ANALISIS §4.1–4.3 DIBETULKAN (sama seperti blok quotation).
      IF v_invoice_id IS NULL THEN
        INSERT INTO public.invoices (
          programme_id,
          invoice_no,
          quotation_no,
          po_no,
          invoice_value_excl_tax,
          sst,
          total_value,
          invoice_date,
          payment_status,
          account_manager,
          pic_name,
          pic_contact_no,
          pic_email,
          client_name,
          notes
        )
        VALUES (
          v_programme_id,
          v_ref,
          v_quotation_ref,
          v_po_no,
          COALESCE(v_total_excl_sst, v_amount, 0),
          COALESCE(v_sst, 0),
          COALESCE(v_total_incl_sst, v_amount, 0),
          v_doc_date,
          v_new_status::public.payment_status,
          v_account_manager,
          v_pic_name,
          v_pic_contact_no,
          v_pic_email,
          v_client,
          v_prepared_by
        )
        RETURNING id INTO v_invoice_id;
      ELSE
        UPDATE public.invoices
        SET -- programme_id diselaraskan apabila baris quotation-sahaja
            -- dipadankan menerusi fallback global: baris itu kini menjadi
            -- invois bagi program yang invois ini selesaikan kepadanya.
            -- Tanpa ini, invois MIMOS Berhad akan kekal terikat pada
            -- program KENANGA — percanggahan data yang senyap.
            programme_id = COALESCE(v_programme_id, programme_id),
            -- invoice_no WAJIB diisi: tanpa ini baris kekal berstatus
            -- "quotation sahaja" (invoice_no IS NULL) dan akan dipadankan
            -- SEMULA oleh import invois yang seterusnya, menyebabkan
            -- invois kedua menimpa yang pertama tanpa amaran.
            invoice_no     = COALESCE(v_ref, invoice_no),
            invoice_value_excl_tax = COALESCE(v_total_excl_sst, v_amount, invoice_value_excl_tax),
            sst            = COALESCE(v_sst, sst),
            total_value    = COALESCE(v_total_incl_sst, v_amount, total_value),
            po_no          = COALESCE(v_po_no, po_no),
            quotation_no   = COALESCE(v_quotation_ref, quotation_no),
            invoice_date   = COALESCE(v_doc_date, invoice_date),
            payment_status = v_new_status::public.payment_status,
            account_manager = COALESCE(v_account_manager, account_manager),
            pic_name        = COALESCE(v_pic_name, pic_name),
            pic_contact_no  = COALESCE(v_pic_contact_no, pic_contact_no),
            pic_email       = COALESCE(v_pic_email, pic_email),
            client_name     = COALESCE(v_client, client_name),
            updated_at      = now()
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
