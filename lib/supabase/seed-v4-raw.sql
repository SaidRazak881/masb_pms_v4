-- =====================================================================
-- TPMS MIMOS Academy — Skrip Migrasi Data V4 RAW ke Supabase
-- =====================================================================
--
-- Skrip ini bertujuan untuk:
-- 1. Mencipta jadual induk yang diperlukan (programmes, organizers, participants,
--    financial_docs, programme_costs, dll.)
-- 2. Memuatkan data dari fail Excel V4 RAW ke dalam jadual-jadual tersebut
--
-- Arahan pelaksanaan:
-- 1. Pastikan fail SQL ini dilaksanakan SELEPAS skema asasi Supabase
--    (auth.users, user_profiles, dll.) telah wujud.
-- 2. Jalankan dalam Supabase SQL Editor.
-- 3. Data akan dimuatkan secara batch dari fail Excel yang telah diproses.
--
-- =====================================================================

BEGIN;

-- =====================================================================
-- BAHAGIAN 1: CIPTA JADUAL INDUK (jika belum wujud)
-- =====================================================================

-- Enum untuk status dan kategori
CREATE TYPE IF NOT EXISTS public.programme_status AS ENUM (
  'draft', 'active', 'completed', 'cancelled', 'on_hold'
);

CREATE TYPE IF NOT EXISTS public.programme_category AS ENUM (
  'AI & Data Science',
  'Cybersecurity',
  'Cloud & Infrastructure',
  'Digital Transformation',
  'Leadership & Management',
  'IoT & Embedded Systems',
  'Non-Training'
);

CREATE TYPE IF NOT EXISTS public.delivery_mode AS ENUM (
  'in_person', 'online', 'hybrid', 'physical'
);

CREATE TYPE IF NOT EXISTS public.payment_status AS ENUM (
  'draft', 'sent', 'accepted', 'invoiced', 'paid', 'overdue', 'cancelled', 'partial'
);

CREATE TYPE IF NOT EXISTS public.financial_doc_type AS ENUM (
  'quotation', 'po', 'invoice'
);

CREATE TYPE IF NOT EXISTS public.bumi_status AS ENUM (
  'bumiputera', 'non_bumiputera', 'pending'
);

CREATE TYPE IF NOT EXISTS public.participant_status AS ENUM (
  'registered', 'confirmed', 'attended', 'completed', 'cancelled'
);

CREATE TYPE IF NOT EXISTS public.cost_category AS ENUM (
  'Trainer Fees',
  'Venue',
  'Catering',
  'Materials & Kit',
  'Platform / Software',
  'Logistics',
  'Administration'
);

CREATE TYPE IF NOT EXISTS public.document_type AS ENUM (
  'Borang Permohonan',
  'Quotation',
  'Purchase Order',
  'Invoice',
  'Resit Pembayaran',
  'Sijil Kehadiran',
  'Senarai Kehadiran',
  'Laporan Penilaian'
);

CREATE TYPE IF NOT EXISTS public.audit_action AS ENUM (
  'created',
  'updated',
  'status_changed',
  'financial_added',
  'participant_updated',
  'document_uploaded',
  'locked',
  'unlocked',
  'imported'
);

-- Jadual organisasi/pelanggan
CREATE TABLE IF NOT EXISTS public.organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  address TEXT,
  sector TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Jadual program latihan (jadual induk)
CREATE TABLE IF NOT EXISTS public.programmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users (id),
  
  -- Maklumat program
  programme_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Organisasi/pelanggan
  organizer_id UUID REFERENCES public.organizers (id),
  organizer_name TEXT NOT NULL,
  
  -- Kategorisasi
  category public.programme_category NOT NULL DEFAULT 'Non-Training',
  delivery_mode public.delivery_mode NOT NULL DEFAULT 'physical',
  
  -- Tempoh
  start_date DATE,
  end_date DATE,
  
  -- Lokasi
  venue TEXT,
  
  -- Status
  status public.programme_status NOT NULL DEFAULT 'draft',
  
  -- Jurulatih
  trainer TEXT,
  programme_manager TEXT,
  
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
  unlock_expires_at TIMESTAMPTZ
);

-- Jadual peserta
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  programme_id UUID NOT NULL REFERENCES public.programmes (id) ON DELETE CASCADE,
  
  -- Maklumat peserta
  name TEXT NOT NULL,
  email TEXT,
  organisation TEXT,
  designation TEXT,
  bumi_status public.bumi_status NOT NULL DEFAULT 'pending',
  attendance INTEGER NOT NULL DEFAULT 0 CHECK (attendance >= 0 AND attendance <= 100),
  status public.participant_status NOT NULL DEFAULT 'registered',
  certificate_issued BOOLEAN NOT NULL DEFAULT false
);

-- Jadual dokumen kewangan (quotation, PO, invoice)
CREATE TABLE IF NOT EXISTS public.financial_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  programme_id UUID NOT NULL REFERENCES public.programmes (id) ON DELETE CASCADE,
  
  -- Jenis dan rujukan
  doc_type public.financial_doc_type NOT NULL,
  reference_no TEXT NOT NULL,
  
  -- Nilai dan tarikh
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  issued_date DATE,
  due_date DATE,
  
  -- Status
  status public.payment_status NOT NULL DEFAULT 'draft',
  
  -- Maklumat tambahan
  notes TEXT,
  account_manager TEXT,
  pic_name TEXT,
  pic_email TEXT
);

-- Jadual kos program (cost of sales)
CREATE TABLE IF NOT EXISTS public.programme_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  programme_id UUID NOT NULL REFERENCES public.programmes (id) ON DELETE CASCADE,
  
  -- Kos
  cost_of_sales NUMERIC(14, 2) NOT NULL DEFAULT 0,
  mimos_academy_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  commission NUMERIC(14, 2) NOT NULL DEFAULT 0,
  bro_incentive NUMERIC(14, 2) NOT NULL DEFAULT 0,
  net_profit NUMERIC(14, 2) NOT NULL DEFAULT 0,
  profit_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0
);

-- Jadual pecahan kos (cost breakdown)
CREATE TABLE IF NOT EXISTS public.cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  programme_id UUID NOT NULL REFERENCES public.programmes (id) ON DELETE CASCADE,
  
  category public.cost_category NOT NULL,
  description TEXT,
  budgeted NUMERIC(14, 2) NOT NULL DEFAULT 0,
  actual NUMERIC(14, 2) NOT NULL DEFAULT 0
);

-- Jadual dokumen program
CREATE TABLE IF NOT EXISTS public.programme_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  programme_id UUID NOT NULL REFERENCES public.programmes (id) ON DELETE CASCADE,
  
  doc_type public.document_type NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT,
  uploaded_by UUID REFERENCES auth.users (id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  size_kb INTEGER NOT NULL DEFAULT 0
);

-- Jadual audit log
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

-- =====================================================================
-- BAHAGIAN 2: INDEX DAN CONSTRAINT
-- =====================================================================

-- Index untuk programmes
CREATE INDEX IF NOT EXISTS idx_programmes_code ON public.programmes (programme_code);
CREATE INDEX IF NOT EXISTS idx_programmes_status ON public.programmes (status);
CREATE INDEX IF NOT EXISTS idx_programmes_category ON public.programmes (category);
CREATE INDEX IF NOT EXISTS idx_programmes_organizer ON public.programmes (organizer_id);
CREATE INDEX IF NOT EXISTS idx_programmes_dates ON public.programmes (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_programmes_locked ON public.programmes (is_locked, unlock_expires_at);

-- Index untuk organizers
CREATE INDEX IF NOT EXISTS idx_organizers_name ON public.organizers (name);

-- Index untuk participants
CREATE INDEX IF NOT EXISTS idx_participants_programme ON public.participants (programme_id);
CREATE INDEX IF NOT EXISTS idx_participants_bumi ON public.participants (bumi_status);

-- Index untuk financial_docs
CREATE INDEX IF NOT EXISTS idx_financial_docs_programme ON public.financial_docs (programme_id);
CREATE INDEX IF NOT EXISTS idx_financial_docs_type ON public.financial_docs (doc_type);
CREATE INDEX IF NOT EXISTS idx_financial_docs_reference ON public.financial_docs (reference_no);

-- Index untuk programme_costs
CREATE INDEX IF NOT EXISTS idx_programme_costs_programme ON public.programme_costs (programme_id);

-- Index untuk cost_items
CREATE INDEX IF NOT EXISTS idx_cost_items_programme ON public.cost_items (programme_id);

-- Index untuk audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON public.audit_logs (record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs (user_id);

-- =====================================================================
-- BAHAGIAN 3: ROW LEVEL SECURITY (RLS)
-- =====================================================================

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

CREATE POLICY "Pengguna terauth boleh kemaskini programmes"
  ON public.programmes FOR UPDATE
  TO authenticated
  USING (
    -- Benarkan kemaskini jika program tidak dikunci
    (is_locked = false OR unlock_expires_at > now()) OR
    -- Atau jika pengguna adalah head_governance
    (EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'head_governance'
    ))
  )
  WITH CHECK (
    -- Pastikan governance_lock_status konsisten
    (is_locked = (governance_lock_status = 'locked'))
  );

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

CREATE POLICY "Pengguna terauth boleh kemaskini participants"
  ON public.participants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

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

CREATE POLICY "Pengguna terauth boleh kemaskini financial_docs"
  ON public.financial_docs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

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

CREATE POLICY "Pengguna terauth boleh kemaskini programme_costs"
  ON public.programme_costs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

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

-- RLS untuk audit_logs (read-only)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna terauth boleh lihat audit_logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================================
-- BAHAGIAN 4: FUNGSI PEMBANTU
-- =====================================================================

-- Fungsi untuk mendapatkan ID pengguna semasa
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Fungsi untuk mendapatkan peranan pengguna semasa
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT up.role FROM public.user_profiles up WHERE up.id = auth.uid()),
    'viewer'
  );
$$;

-- Fungsi untuk log audit
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
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, old_data, new_data, metadata
  ) VALUES (
    public.current_user_id(),
    p_action,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data,
    p_metadata
  );
END;
$$;

-- =====================================================================
-- BAHAGIAN 5: TRIGGER UNTUK AUDIT LOG
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
    PERFORM public.log_audit('programmes', NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW));
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

-- =====================================================================
-- BAHAGIAN 6: DATA SEED DARI V4 RAW
-- =====================================================================

-- Catatan: Data sebenar dari fail Excel perlu diproses terlebih dahulu
-- menggunakan skrip Node.js atau Python, kemudian dimuatkan ke sini.
-- Berikut adalah contoh data seed berdasarkan struktur fail V4 RAW.

-- Organizers (Pelanggan/Client) dari fail Excel
-- Contoh: MIMOS Berhad, FGV R&D Sdn Bhd, Kementerian Sumber Manusia, dll.
INSERT INTO public.organizers (id, name, sector, is_active) VALUES
('org-001', 'MIMOS Berhad', 'Government', true),
('org-002', 'FGV R&D Sdn Bhd', 'Private', true),
('org-003', 'Kementerian Sumber Manusia', 'Government', true),
('org-004', 'Ketengah', 'Government', true),
('org-005', 'CyberSecurity Malaysia', 'Government', true),
('org-006', 'SGS', 'Private', true),
('org-007', 'KENANGA INVESTOR BERHAD', 'Private', true),
('org-008', 'Lembaga Pelabuhan Klang', 'Government', true),
('org-009', 'PETRONAS', 'Private', true),
('org-010', 'MAMPU', 'Government', true),
('org-011', 'Bank Negara Malaysia', 'Government', true),
('org-012', 'Jabatan Kastam Diraja Malaysia', 'Government', true);

-- Programmes (Program Latihan) dari Quotation Tracker dan Invoice
-- Catatan: Data ini hendaklah dimuatkan selepas organizers
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name, 
  category, delivery_mode, start_date, end_date, venue, trainer, 
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES
-- Dari Quotation Tracker
('prog-001', 'MSSB/QT/TRA/2026/0001', 'Train The Trainer (TTT)', 'Program latihan untuk jurulatih', 
 'org-007', 'KENANGA INVESTOR BERHAD', 'Leadership & Management', 'in_person', 
 '2026-01-15', '2026-01-17', 'MIMOS Training Centre', 'Ms Liyana Ayunni', 
 'Nur Izzati Zailani', 21000.00, 19000.00, 18500.00, 'completed'),

('prog-002', 'MSSB/QT/TRA/2026/0002', 'In-House AI Training for 20 pax', 'Latihan AI dalaman untuk 20 orang', 
 'org-006', 'SGS', 'AI & Data Science', 'in_person', 
 '2026-02-20', '2026-02-22', 'SGS Office', 'Mr Mohd Najib', 
 'Nur Izzati Zailani', 21000.00, 18000.00, 17500.00, 'completed'),

-- Dari Invoice
('prog-003', 'MA/QT/2026(0001)', 'Training - AI Prompt Skills: Best Practices for Organization Productivity (In-House)', 
 'Program latihan kemahiran AI untuk produktiviti organisasi', 
 'org-001', 'MIMOS Berhad', 'AI & Data Science', 'in_person', 
 '2026-01-01', '2026-01-03', 'MIMOS Auditorium', 'Adilah', 
 'Adilah', 8500.00, 8000.00, 8200.00, 'completed'),

('prog-004', 'MASB/QT/TRA/2026/0038', 'Training - AI System Thinking (Public)', 
 'Latihan berfikir sistem AI untuk awam', 
 'org-002', 'FGV R&D Sdn Bhd', 'AI & Data Science', 'in_person', 
 '2026-02-15', '2026-02-17', 'FGV Training Room', 'Farrah', 
 'Farrah', 1842.59, 1700.00, 1680.00, 'completed');

-- Financial Docs (Quotation, Invoice) dari Quotation Tracker dan Invoice
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status, 
  account_manager, pic_name, notes
) VALUES
-- Quotation dari Quotation Tracker
('fin-001', 'prog-001', 'quotation', 'MSSB/QT/TRA/2026/0001', 21000.00, '2026-01-10', 'accepted', 
 'Nur Izzati Zailani', 'Ms Liyana Ayunni', 'Sebutharga rasmi untuk program TTT'),

('fin-002', 'prog-002', 'quotation', 'MSSB/QT/TRA/2026/0002', 21000.00, '2026-02-10', 'accepted', 
 'Nur Izzati Zailani', 'Mr Mohd Najib', 'Sebutharga untuk latihan AI dalaman'),

-- Invoice dari Income Statement
('fin-003', 'prog-003', 'invoice', '95000016/2026', 8500.00, '2026-01-20', 'paid', 
 'Adilah', 'Adilah', 'Invois untuk program AI Prompt Skills'),

('fin-004', 'prog-004', 'invoice', '95000015/2026', 1842.59, '2026-02-20', 'paid', 
 'Farrah', 'Adilah', 'Invois untuk program AI System Thinking'),

-- PO dari Income Statement
('fin-005', 'prog-003', 'po', 'MA/QT/2026(0001)', 8500.00, '2026-01-15', 'accepted', 
 'Adilah', 'Adilah', 'PO untuk program AI Prompt Skills'),

('fin-006', 'prog-004', 'po', 'MASB/QT/TRA/2026/0038', 1842.59, '2026-02-15', 'accepted', 
 'Farrah', 'Adilah', 'PO untuk program AI System Thinking');

-- Programme Costs (Cost of Sales) dari Cost of Sale sheet
INSERT INTO public.programme_costs (
  id, programme_id, cost_of_sales, mimos_academy_cost, net_profit, profit_percentage
) VALUES
('cost-001', 'prog-003', 4433.00, 4000.00, 4167.00, 49.00),
('cost-002', 'prog-004', 0.00, 0.00, 1842.59, 100.00);

-- Participants (Peserta) - Data contoh
INSERT INTO public.participants (
  id, programme_id, name, email, organisation, designation, bumi_status, attendance, status, certificate_issued
) VALUES
('part-001', 'prog-001', 'Ahmad Faizal bin Rahman', 'ahmad.faizal@mot.gov.my', 'Kementerian Pengangkutan', 'Penolong Pengarah IT', 'bumiputera', 95, 'completed', true),
('part-002', 'prog-001', 'Nurul Aina binti Mohd Yusof', 'nurul.aina@mampu.gov.my', 'MAMPU', 'Pegawai Teknologi Maklumat', 'bumiputera', 90, 'completed', true),
('part-003', 'prog-002', 'Siti Khadijah binti Ismail', 'siti.khadijah@johor.gov.my', 'Kerajaan Negeri Johor', 'Eksekutif Digital', 'bumiputera', 85, 'attended', false),
('part-004', 'prog-003', 'Mohd Hafiz bin Abdul Aziz', 'hafiz.aziz@tm.com.my', 'Telekom Malaysia', 'Network Engineer', 'bumiputera', 88, 'completed', true);

-- Cost Items (Pecahan Kos) - Data contoh
INSERT INTO public.cost_items (
  id, programme_id, category, description, budgeted, actual
) VALUES
('cost-item-001', 'prog-001', 'Trainer Fees', 'Yuran tenaga pengajar pakar industri', 8000.00, 7800.00),
('cost-item-002', 'prog-001', 'Venue', 'Sewa dewan latihan', 2000.00, 1900.00),
('cost-item-003', 'prog-001', 'Catering', 'Katering makan tengah hari', 1500.00, 1450.00),
('cost-item-004', 'prog-001', 'Materials & Kit', 'Bahan latihan dan modul', 1000.00, 950.00);

-- =====================================================================
-- BAHAGIAN 7: COMMIT
-- =====================================================================

COMMIT;
