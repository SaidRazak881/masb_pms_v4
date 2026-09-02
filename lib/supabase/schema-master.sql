-- =====================================================================
-- TPMS MIMOS Academy — Skema Master Pangkalan Data Supabase
-- =====================================================================
--
-- Fail ini mengandungi skema lengkap untuk sistem TPMS MIMOS Academy.
-- Jalankan fail ini TERLEBIH DAHULU sebelum sebarang migrasi data.
--
-- Arahan:
-- 1. Jalankan di Supabase SQL Editor
-- 2. Pastikan auth.users sudah wujud (dicipta automatik oleh Supabase)
-- 3. Jalankan seed-v4-raw.sql selepas ini
--
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. Sediakan semula polisi RLS (supaya fail boleh dijalankan semula)
--    Hanya polisi pada jadual yang diurus oleh sistem TPMS dibuang.
-- ---------------------------------------------------------------------

DO $$
DECLARE
  v_table text;
  v_policy text;
BEGIN
  FOR v_table IN SELECT unnest(ARRAY[
    'user_profiles', 'organizers', 'programmes', 'participants',
    'financial_docs', 'programme_costs', 'cost_items', 'programme_documents',
    'audit_logs', 'invoices'
  ])
  LOOP
    FOR v_policy IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = v_table
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_policy, v_table);
    END LOOP;
  END LOOP;
END
$$;

-- =====================================================================
-- BAHAGIAN 1: ENUM DAN TYPE
-- =====================================================================

-- Enum untuk status program
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'programme_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.programme_status AS ENUM (
  'draft', 'active', 'completed', 'cancelled', 'on_hold'
);
  END IF;
END
$$;

-- Enum untuk kategori program
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'programme_category' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.programme_category AS ENUM (
  'AI & Data Science',
  'Cybersecurity',
  'Cloud & Infrastructure',
  'Digital Transformation',
  'Leadership & Management',
  'IoT & Embedded Systems',
  'Engineering',
  'Semiconductor',
  'Non-Training',
  'Room Rental',
  'Consultancy',
  'Certification'
);
  END IF;
END
$$;

-- Enum untuk mod latihan
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_mode' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.delivery_mode AS ENUM (
  'in_person', 'online', 'hybrid', 'physical'
);
  END IF;
END
$$;

-- Enum untuk status bayaran
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.payment_status AS ENUM (
  'draft', 'pending', 'sent', 'accepted', 'invoiced', 'paid', 'overdue', 'cancelled', 'partial'
);
  END IF;
END
$$;

-- Enum untuk jenis dokumen kewangan
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_doc_type' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.financial_doc_type AS ENUM (
  'quotation', 'po', 'invoice'
);
  END IF;
END
$$;

-- Enum untuk status Bumiputera
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bumi_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.bumi_status AS ENUM (
  'bumiputera', 'non_bumiputera', 'pending'
);
  END IF;
END
$$;

-- Enum untuk status peserta
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.participant_status AS ENUM (
  'registered', 'confirmed', 'attended', 'completed', 'cancelled'
);
  END IF;
END
$$;

-- Enum untuk kategori kos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cost_category' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.cost_category AS ENUM (
  'Trainer Fees',
  'Venue',
  'Catering',
  'Materials & Kit',
  'Platform / Software',
  'Logistics',
  'Administration'
);
  END IF;
END
$$;

-- Enum untuk jenis dokumen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.document_type AS ENUM (
  'Borang Permohonan',
  'Quotation',
  'Purchase Order',
  'Invoice',
  'Resit Pembayaran',
  'Sijil Kehadiran',
  'Senarai Kehadiran',
  'Laporan Penilaian'
);
  END IF;
END
$$;

-- Enum untuk tindakan audit
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.audit_action AS ENUM (
  'created',
  'updated',
  'status_changed',
  'financial_added',
  'participant_updated',
  'document_uploaded',
  'locked',
  'unlocked',
  'imported',
  'import_sync',
  'import_discard',
  'unlock_requested',
  'unlock_approved',
  'unlock_rejected',
  'unlock_cancelled',
  'change_requested',
  'change_reviewed',
  'deleted'
);
  END IF;
END
$$;

-- Enum untuk peranan pengguna
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.app_role AS ENUM (
  'viewer', 'executive', 'manager', 'admin', 'staff', 'finance', 'head_governance'
);
  END IF;
END
$$;

-- NOTA SUSUNAN (pembaikan Fasa 6): current_user_id / current_user_role /
-- current_role_name / has_role / log_audit dipisahkan mengikut kebergantungan:
--   * fungsi ROLE diletakkan DI SINI kerana polisi RLS Bahagian 2-10 memanggil
--     public.has_role() semasa CREATE POLICY (badan LANGUAGE sql dihurai serta-merta).
--   * log_audit kekal SELEPAS Bahagian 10 kerana badannya (plpgsql) merujuk
--     jadual public.audit_logs yang mesti wujud dahulu.
-- Sebelum pembaikan ini, pemasangan pada pangkalan data KOSONG gagal dengan
-- "function public.has_role(app_role) does not exist".

-- =====================================================================
-- BAHAGIAN 11: FUNGSI PEMBANTU
-- =====================================================================

-- Fungsi untuk mendapatkan ID pengguna semasa
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN auth.uid();
END;
$$;

-- Fungsi untuk mendapatkan peranan pengguna semasa
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  SELECT up.role INTO v_role
    FROM public.user_profiles up
   WHERE up.id = auth.uid();
  RETURN COALESCE(v_role, 'viewer'::public.app_role);
END;
$$;

-- Alias nama peranan sebagai TEXT
-- (digunakan oleh RPC change-request legacy: review_change_request, dll.)
CREATE OR REPLACE FUNCTION public.current_role_name()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT up.role::text INTO v_role
    FROM public.user_profiles up
   WHERE up.id = auth.uid();
  RETURN COALESCE(v_role, 'viewer');
END;
$$;

-- Fungsi untuk semak kebolehan pengguna
-- Fasa 6: super_admin mewarisi SEMUA kuasa. Fungsi ini hanya digunakan untuk
-- keputusan kebenaran (polisi RLS / RPC), bukan untuk paparan role — jadi
-- memulangkan true bagi sebarang role yang diminta adalah selamat dan
-- mengelakkan suntingan berpuluh-puluh polisi secara berasingan.
CREATE OR REPLACE FUNCTION public.has_role(p_role public.app_role)
RETURNS BOOLEAN
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

-- =====================================================================

-- =====================================================================
-- BAHAGIAN 2: JADUAL USER PROFILES
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Maklumat peribadi
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  designation TEXT,
  department TEXT,
  
  -- Peranan dan kebolehan
  role public.app_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  last_login_at TIMESTAMPTZ,
  avatar_url TEXT
);

-- Index untuk user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles (email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles (role);

-- RLS untuk user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna boleh lihat profil sendiri"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Pengguna boleh kemaskini profil sendiri"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin boleh lihat semua profil
CREATE POLICY "Admin boleh lihat semua profil"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    public.has_role('admin'::public.app_role)
    OR public.has_role('manager'::public.app_role)
  );

-- =====================================================================
-- BAHAGIAN 3: JADUAL ORGANIZERS (PELANGGAN/AGENSI)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users (id),
  
  -- Maklumat organisasi
  name TEXT NOT NULL,
  short_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postcode TEXT,
  
  -- Kategorisasi
  sector TEXT,
  industry TEXT,
  organization_type TEXT,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  notes TEXT,
  website TEXT
);

-- Index untuk organizers
CREATE INDEX IF NOT EXISTS idx_organizers_name ON public.organizers (name);
CREATE INDEX IF NOT EXISTS idx_organizers_sector ON public.organizers (sector);
CREATE INDEX IF NOT EXISTS idx_organizers_active ON public.organizers (is_active);

-- Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizers_name_unique ON public.organizers (name) WHERE is_active = true;

-- RLS untuk organizers
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna terauth boleh lihat organizers"
  ON public.organizers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pengguna terauth boleh tambah organizers"
  ON public.organizers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Pengguna terauth boleh kemaskini organizers"
  ON public.organizers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================================
-- BAHAGIAN 4: JADUAL PROGRAMMES (PROGRAM LATIHAN)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.programmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users (id),
  updated_by UUID REFERENCES auth.users (id),
  
  -- Maklumat program
  programme_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  
  -- Organisasi/pelanggan
  organizer_id UUID REFERENCES public.organizers (id) ON DELETE SET NULL,
  organizer_name TEXT NOT NULL,
  
  -- Kategorisasi
  category public.programme_category NOT NULL DEFAULT 'Non-Training',
  delivery_mode public.delivery_mode NOT NULL DEFAULT 'physical',
  
  -- Tempoh
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  
  -- Lokasi
  venue TEXT,
  venue_address TEXT,
  city TEXT,
  state TEXT,
  
  -- Status
  status public.programme_status NOT NULL DEFAULT 'draft',
  
  -- Jurulatih dan pengurus
  trainer TEXT,
  trainer_email TEXT,
  trainer_phone TEXT,
  programme_manager TEXT,
  programme_manager_email TEXT,
  
  -- Kewangan (ringkasan)
  contracted_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  budget NUMERIC(14, 2) NOT NULL DEFAULT 0,
  actual_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  
  -- Governance Lock
  governance_lock_status TEXT NOT NULL DEFAULT 'unlocked',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  lock_reason TEXT,
  locked_by UUID REFERENCES auth.users (id),
  locked_at TIMESTAMPTZ,
  unlock_expires_at TIMESTAMPTZ,
  
  -- Metadata
  fiscal_year INTEGER,
  tags TEXT[],
  is_published BOOLEAN NOT NULL DEFAULT false
);

-- Index untuk programmes
CREATE INDEX IF NOT EXISTS idx_programmes_code ON public.programmes (programme_code);
CREATE INDEX IF NOT EXISTS idx_programmes_status ON public.programmes (status);
CREATE INDEX IF NOT EXISTS idx_programmes_category ON public.programmes (category);
CREATE INDEX IF NOT EXISTS idx_programmes_organizer ON public.programmes (organizer_id);
CREATE INDEX IF NOT EXISTS idx_programmes_dates ON public.programmes (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_programmes_locked ON public.programmes (is_locked, unlock_expires_at);
CREATE INDEX IF NOT EXISTS idx_programmes_fiscal_year ON public.programmes (fiscal_year);

-- Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_programmes_code_unique ON public.programmes (programme_code);

-- RLS untuk programmes
ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna terauth boleh lihat programmes"
  ON public.programmes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pengguna terauth boleh tambah programmes"
  ON public.programmes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Pengguna boleh kemaskini programmes jika tidak dikunci"
  ON public.programmes FOR UPDATE
  TO authenticated
  USING (
    -- Benarkan kemaskini jika program tidak dikunci
    (is_locked = false OR unlock_expires_at > now()) OR
    -- Atau jika pengguna adalah head_governance / admin
    public.has_role('head_governance'::public.app_role)
    OR public.has_role('admin'::public.app_role)
  )
  WITH CHECK (
    -- Pastikan governance_lock_status konsisten
    (is_locked = (governance_lock_status = 'locked'))
  );

CREATE POLICY "Pengguna boleh padam programmes sendiri jika draf"
  ON public.programmes FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() AND status = 'draft'
  );

-- =====================================================================
-- BAHAGIAN 5: JADUAL PARTICIPANTS (PESERTA)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users (id),
  
  programme_id UUID NOT NULL REFERENCES public.programmes (id) ON DELETE CASCADE,
  
  -- Maklumat peserta
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  organisation TEXT,
  designation TEXT,
  department TEXT,
  
  -- Status Bumiputera
  bumi_status public.bumi_status NOT NULL DEFAULT 'pending',
  bumi_verified BOOLEAN NOT NULL DEFAULT false,
  bumi_verification_date DATE,
  bumi_verification_notes TEXT,
  
  -- Kehadiran dan status
  attendance INTEGER NOT NULL DEFAULT 0 CHECK (attendance >= 0 AND attendance <= 100),
  status public.participant_status NOT NULL DEFAULT 'registered',
  certificate_issued BOOLEAN NOT NULL DEFAULT false,
  certificate_issue_date DATE,
  
  -- Penilaian
  assessment_score NUMERIC(5, 2),
  assessment_feedback TEXT,
  
  -- Bayaran
  payment_status TEXT,
  payment_amount NUMERIC(10, 2),
  payment_date DATE,
  payment_reference TEXT,
  
  -- Metadata
  notes TEXT,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index untuk participants
CREATE INDEX IF NOT EXISTS idx_participants_programme ON public.participants (programme_id);
CREATE INDEX IF NOT EXISTS idx_participants_bumi ON public.participants (bumi_status);
CREATE INDEX IF NOT EXISTS idx_participants_status ON public.participants (status);
CREATE INDEX IF NOT EXISTS idx_participants_email ON public.participants (email);
CREATE INDEX IF NOT EXISTS idx_participants_organisation ON public.participants (organisation);

-- RLS untuk participants
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna terauth boleh lihat participants"
  ON public.participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pengguna terauth boleh tambah participants"
  ON public.participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Pengguna boleh kemaskini participants jika program tidak dikunci"
  ON public.participants FOR UPDATE
  TO authenticated
  USING (
    -- Benarkan kemaskini jika program tidak dikunci
    (EXISTS (
      SELECT 1 FROM public.programmes p 
      WHERE p.id = programme_id AND (p.is_locked = false OR p.unlock_expires_at > now())
    ))
    OR public.has_role('head_governance'::public.app_role)
    OR public.has_role('admin'::public.app_role)
  )
  WITH CHECK (true);

CREATE POLICY "Pengguna boleh padam participants jika program draf"
  ON public.participants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.programmes p 
      WHERE p.id = programme_id AND p.status = 'draft'
    )
  );

-- =====================================================================
-- BAHAGIAN 6: JADUAL FINANCIAL_DOCS (DOKUMEN KEWANGAN)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.financial_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users (id),
  
  programme_id UUID NOT NULL REFERENCES public.programmes (id) ON DELETE CASCADE,
  
  -- Jenis dan rujukan
  doc_type public.financial_doc_type NOT NULL,
  reference_no TEXT NOT NULL,
  revision TEXT,
  
  -- Nilai dan tarikh
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MYR',
  
  issued_date DATE,
  due_date DATE,
  valid_until DATE,
  
  -- Status
  status public.payment_status NOT NULL DEFAULT 'draft',
  
  -- Maklumat tambahan
  notes TEXT,
  description TEXT,
  account_manager TEXT,
  account_manager_email TEXT,
  pic_name TEXT,
  pic_email TEXT,
  pic_phone TEXT,
  
  -- Metadata
  file_path TEXT,
  uploaded_by UUID REFERENCES auth.users (id),
  uploaded_at TIMESTAMPTZ
);

-- Index untuk financial_docs
CREATE INDEX IF NOT EXISTS idx_financial_docs_programme ON public.financial_docs (programme_id);
CREATE INDEX IF NOT EXISTS idx_financial_docs_type ON public.financial_docs (doc_type);
CREATE INDEX IF NOT EXISTS idx_financial_docs_reference ON public.financial_docs (reference_no);
CREATE INDEX IF NOT EXISTS idx_financial_docs_status ON public.financial_docs (status);
CREATE INDEX IF NOT EXISTS idx_financial_docs_dates ON public.financial_docs (issued_date, due_date);

-- Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_docs_reference_unique ON public.financial_docs (doc_type, reference_no);

-- RLS untuk financial_docs
ALTER TABLE public.financial_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna terauth boleh lihat financial_docs"
  ON public.financial_docs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pengguna terauth boleh tambah financial_docs"
  ON public.financial_docs FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

-- =====================================================================
-- BAHAGIAN 7: JADUAL INVOICES (KUMPULAN INVOIS PER PROGRAM)
-- =====================================================================
-- Jadual ini dicipta oleh skema master supaya RPC sync_import_transaction
-- (dan laporan kewangan) mempunyai jadual invoices yang konsisten.
-- Ia memegang maklumat invois + quotation + PO yang diimport daripada
-- fail Excel MIMOS Academy (R1 Income Statement, invoice_2026, dll.).
--
-- NOTA: jadual `financial_docs` kekal untuk dokumen kewangan generik
-- (quotation/PO/invoice berbilang per program) yang diurus secara manual.
-- `invoices` direka khusus untuk aliran import pukal Excel.

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users (id),

  programme_id UUID NOT NULL REFERENCES public.programmes (id) ON DELETE CASCADE,

  -- Rujukan dokumen (salah satu akan diisi bergantung jenis import)
  invoice_no TEXT,
  quotation_no TEXT,
  po_no TEXT,

  -- Nilai
  invoice_value_excl_tax NUMERIC(14, 2) NOT NULL DEFAULT 0,
  po_value_excl_tax NUMERIC(14, 2) NOT NULL DEFAULT 0,
  sst NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_value NUMERIC(14, 2) NOT NULL DEFAULT 0,

  -- Tarikh
  invoice_date DATE,
  due_date DATE,
  payment_date DATE,

  -- Status
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  account TEXT,
  account_manager TEXT,
  pic_name TEXT,

  -- Metadata
  file_path TEXT,
  notes TEXT
);

-- Index untuk invoices
CREATE INDEX IF NOT EXISTS idx_invoices_programme ON public.invoices (programme_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_no ON public.invoices (invoice_no);
CREATE INDEX IF NOT EXISTS idx_invoices_quotation_no ON public.invoices (quotation_no);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON public.invoices (payment_status);

-- Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_invoice_no_unique
  ON public.invoices (invoice_no) WHERE invoice_no IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_quotation_no_unique
  ON public.invoices (quotation_no) WHERE quotation_no IS NOT NULL;

-- RLS untuk invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna terauth boleh lihat invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pengguna terauth boleh tambah invoices"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

-- =====================================================================
-- BAHAGIAN 8: JADUAL PROGRAMME_COSTS (KOS PROGRAM)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.programme_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users (id),
  
  programme_id UUID NOT NULL REFERENCES public.programmes (id) ON DELETE CASCADE,
  
  -- Kos
  cost_of_sales NUMERIC(14, 2) NOT NULL DEFAULT 0,
  mimos_academy_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  commission NUMERIC(10, 2) NOT NULL DEFAULT 0,
  bro_incentive NUMERIC(10, 2) NOT NULL DEFAULT 0,
  net_profit NUMERIC(14, 2) NOT NULL DEFAULT 0,
  profit_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  
  -- Maklumat tambahan
  notes TEXT,
  fiscal_year INTEGER
);

-- Index untuk programme_costs
CREATE INDEX IF NOT EXISTS idx_programme_costs_programme ON public.programme_costs (programme_id);

-- Unique constraint (satu rekod kos per program)
CREATE UNIQUE INDEX IF NOT EXISTS idx_programme_costs_programme_unique ON public.programme_costs (programme_id);

-- RLS untuk programme_costs
ALTER TABLE public.programme_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna terauth boleh lihat programme_costs"
  ON public.programme_costs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pengguna terauth boleh tambah programme_costs"
  ON public.programme_costs FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

-- =====================================================================
-- BAHAGIAN 8: JADUAL COST_ITEMS (PECahan KOS)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  programme_id UUID NOT NULL REFERENCES public.programmes (id) ON DELETE CASCADE,
  
  -- Kategorisasi
  category public.cost_category NOT NULL,
  sub_category TEXT,
  
  -- Keterangan
  description TEXT NOT NULL,
  
  -- Nilai
  budgeted NUMERIC(14, 2) NOT NULL DEFAULT 0,
  actual NUMERIC(14, 2) NOT NULL DEFAULT 0,
  variance NUMERIC(14, 2) GENERATED ALWAYS AS (actual - budgeted) STORED,
  
  -- Status
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users (id),
  approved_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  vendor TEXT,
  vendor_reference TEXT
);

-- Index untuk cost_items
CREATE INDEX IF NOT EXISTS idx_cost_items_programme ON public.cost_items (programme_id);
CREATE INDEX IF NOT EXISTS idx_cost_items_category ON public.cost_items (category);

-- RLS untuk cost_items
ALTER TABLE public.cost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna terauth boleh lihat cost_items"
  ON public.cost_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pengguna terauth boleh tambah cost_items"
  ON public.cost_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

-- =====================================================================
-- BAHAGIAN 9: JADUAL PROGRAMME_DOCUMENTS (DOKUMEN PROGRAM)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.programme_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  programme_id UUID NOT NULL REFERENCES public.programmes (id) ON DELETE CASCADE,
  
  -- Jenis dan maklumat dokumen
  doc_type public.document_type NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT,
  file_name TEXT,
  
  -- Metadata
  uploaded_by UUID REFERENCES auth.users (id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  size_kb INTEGER NOT NULL DEFAULT 0,
  mime_type TEXT,
  
  -- Status
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES auth.users (id),
  verified_at TIMESTAMPTZ,
  
  -- Keterangan
  description TEXT,
  notes TEXT
);

-- Index untuk programme_documents
CREATE INDEX IF NOT EXISTS idx_programme_documents_programme ON public.programme_documents (programme_id);
CREATE INDEX IF NOT EXISTS idx_programme_documents_type ON public.programme_documents (doc_type);

-- RLS untuk programme_documents
ALTER TABLE public.programme_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna terauth boleh lihat programme_documents"
  ON public.programme_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pengguna terauth boleh tambah programme_documents"
  ON public.programme_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

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



-- =====================================================================

-- =====================================================================
-- BAHAGIAN 10: JADUAL AUDIT_LOGS (LOG AUDIT)

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  user_id UUID REFERENCES auth.users (id),
  action public.audit_action NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  changed_fields JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Index untuk audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON public.audit_logs (record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at);

-- RLS untuk audit_logs (read-only bagi kebanyakan pengguna)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna terauth boleh lihat audit_logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (true);

-- Fungsi untuk log audit. MESTI berada SELEPAS jadual public.audit_logs
-- dicipta: badan plpgsql dirujuk semasa CREATE FUNCTION, jadi jika fungsi ini
-- diletak lebih awal pemasangan pada DB kosong gagal dengan
-- "relation public.audit_logs does not exist".
CREATE OR REPLACE FUNCTION public.log_audit(
  p_table_name TEXT,
  p_record_id UUID,
  p_action public.audit_action,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, old_data, new_data, changed_fields, metadata
  ) VALUES (
    public.current_user_id(),
    p_action,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data,
    p_metadata -> 'changed_fields',
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

-- BAHAGIAN 12: TRIGGER UNTUK AUDIT LOG
-- =====================================================================

-- Trigger untuk programmes
CREATE OR REPLACE FUNCTION public.programmes_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit('programmes', NEW.id, 'created', NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit(
      'programmes',
      NEW.id,
      'updated',
      to_jsonb(OLD),
      to_jsonb(NEW),
      jsonb_build_object('changed_fields', COALESCE(
        (SELECT jsonb_object_agg(k, v)
           FROM jsonb_each(to_jsonb(NEW)) AS e(k, v)
          WHERE to_jsonb(OLD) -> k IS DISTINCT FROM v),
        '{}'::jsonb
      ))
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit('programmes', OLD.id, 'deleted', to_jsonb(OLD), NULL);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS programmes_audit_trigger ON public.programmes;
CREATE TRIGGER programmes_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.programmes
  FOR EACH ROW
  EXECUTE FUNCTION public.programmes_audit_trigger();

-- Trigger untuk participants
CREATE OR REPLACE FUNCTION public.participants_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit('participants', NEW.id, 'created', NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit('participants', NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit('participants', OLD.id, 'deleted', to_jsonb(OLD), NULL);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS participants_audit_trigger ON public.participants;
CREATE TRIGGER participants_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.participants
  FOR EACH ROW
  EXECUTE FUNCTION public.participants_audit_trigger();

-- Trigger untuk financial_docs
CREATE OR REPLACE FUNCTION public.financial_docs_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit('financial_docs', NEW.id, 'created', NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit('financial_docs', NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit('financial_docs', OLD.id, 'deleted', to_jsonb(OLD), NULL);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS financial_docs_audit_trigger ON public.financial_docs;
CREATE TRIGGER financial_docs_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_docs
  FOR EACH ROW
  EXECUTE FUNCTION public.financial_docs_audit_trigger();

-- =====================================================================
-- BAHAGIAN 13: COMMIT
-- =====================================================================

COMMIT;
