-- =====================================================================
-- TPMS MIMOS Academy — Data Migrasi V4 RAW
-- Dijana pada: 2026-09-01T10:15:51.712Z
-- =====================================================================

BEGIN;


-- Organizer: 'KENANGA INVESTOR BERHAD'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-001', 'KENANGA INVESTOR BERHAD', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train The Trainer (TTT)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-001', '0001', 'Train The Trainer (TTT)', 
  'Train The Trainer (TTT)', 'org-001', 'KENANGA INVESTOR BERHAD',
  'AI & Data Science', 'in_person', '2025-12-17', '2025-12-17',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MSSB/QT/TRA/2026/0001'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-002', 'prog-001', 'quotation', 'MSSB/QT/TRA/2026/0001',
  21000.00, '2025-12-17', 'accepted',
  'Nur Izzati Zailani', 'vl.victoryintelligence@gmal.com', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'SGS'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-002', 'SGS', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'In-House AI Training for 20 pax'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-002', '0002', 'In-House AI Training for 20 pax', 
  'In-House AI Training for 20 pax', 'org-002', 'SGS',
  'Non-Training', 'in_person', '2025-12-17', '2025-12-17',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MSSB/QT/TRA/2026/0002'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-003', 'prog-002', 'quotation', 'MSSB/QT/TRA/2026/0002',
  21000.00, '2025-12-17', 'accepted',
  'Nur Izzati Zailani', 'najib.othman@sgs.com', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MDEC'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-003', 'MDEC', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train The Trainer (TTT)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-003', '0003', 'Train The Trainer (TTT)', 
  'Train The Trainer (TTT)', 'org-003', 'MDEC',
  'AI & Data Science', 'in_person', '2025-12-17', '2025-12-17',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  10500.00, 9450.00, 8925.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MSSB/QT/TRA/2026/0003'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-004', 'prog-003', 'quotation', 'MSSB/QT/TRA/2026/0003',
  10500.00, '2025-12-17', 'accepted',
  'Nur Izzati Zailani', 'rajanur@mdec.com.my', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Sustainable Business Network Association Malaysia'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-004', 'Sustainable Business Network Association Malaysia', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-004', '0005', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-004', 'Sustainable Business Network Association Malaysia',
  'AI & Data Science', 'in_person', '2025-12-18', '2025-12-18',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  1990.00, 1791.00, 1691.50,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MSSB/QT/TRA/2026/0005'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-005', 'prog-004', 'quotation', 'MSSB/QT/TRA/2026/0005',
  1990.00, '2025-12-18', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', 'admin@sustainable-business.net', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train The Trainer (TTT)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-005', '0004', 'Train The Trainer (TTT)', 
  'Train The Trainer (TTT)', 'org-004', 'Sustainable Business Network Association Malaysia',
  'Non-Training', 'in_person', '2025-12-18', '2025-12-18',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  10500.00, 9450.00, 8925.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MSSB/QT/TRA/2026/0004'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-006', 'prog-005', 'quotation', 'MSSB/QT/TRA/2026/0004',
  10500.00, '2025-12-18', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', 'admin@sustainable-business.net', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Boh Plantation Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-005', 'Boh Plantation Sdn Bhd', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-006', '0006', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-005', 'Boh Plantation Sdn Bhd',
  'AI & Data Science', 'in_person', '2025-12-18', '2025-12-18',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  1990.00, 1791.00, 1691.50,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MSSB/QT/TRA/2026/0006'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-007', 'prog-006', 'quotation', 'MSSB/QT/TRA/2026/0006',
  1990.00, '2025-12-18', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', 'kiewcs@boh.com.my', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'In-House AI Training for 20 pax'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-007', '0007', 'In-House AI Training for 20 pax', 
  'In-House AI Training for 20 pax', 'org-005', 'Boh Plantation Sdn Bhd',
  'Non-Training', 'in_person', '2025-12-18', '2025-12-18',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MSSB/QT/TRA/2026/0007'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-008', 'prog-007', 'quotation', 'MSSB/QT/TRA/2026/0007',
  21000.00, '2025-12-18', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', 'kiewcs@boh.com.my', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Primalcom'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-006', 'Primalcom', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-008', '0008', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-006', 'Primalcom',
  'AI & Data Science', 'in_person', '2025-12-18', '2025-12-18',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  1990.00, 1791.00, 1691.50,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MSSB/QT/TRA/2026/0008'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-009', 'prog-008', 'quotation', 'MSSB/QT/TRA/2026/0008',
  1990.00, '2025-12-18', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', 'yslim@primal.com', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Ketengah'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-007', 'Ketengah', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'In-House AI Training for 20 pax'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-009', '0009', 'In-House AI Training for 20 pax', 
  'In-House AI Training for 20 pax', 'org-007', 'Ketengah',
  'Non-Training', 'in_person', '2025-12-29', '2025-12-29',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MSSB/QT/TRA/2026/0009'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-010', 'prog-009', 'quotation', 'MSSB/QT/TRA/2026/0009',
  21000.00, '2025-12-29', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', 'hazroll@ketengahgov.my', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'In-House AI Training for 300 pax'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-010', '0010', 'In-House AI Training for 300 pax', 
  'In-House AI Training for 300 pax', 'org-007', 'Ketengah',
  'Non-Training', 'in_person', '2025-12-29', '2025-12-29',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  252000.00, 226800.00, 214200.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MSSB/QT/TRA/2026/0010'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-011', 'prog-010', 'quotation', 'MSSB/QT/TRA/2026/0010',
  252000.00, '2025-12-29', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', 'hazroll@ketengahgov.my', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Universiti Teknologi Malaysia'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-008', 'Universiti Teknologi Malaysia', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train The Trainer (TTT)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-011', '0011', 'Train The Trainer (TTT)', 
  'Train The Trainer (TTT)', 'org-008', 'Universiti Teknologi Malaysia',
  'AI & Data Science', 'in_person', '2025-12-30', '2025-12-30',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  3500.00, 3150.00, 2975.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MSSB/QT/TRA/2026/0011'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-012', 'prog-011', 'quotation', 'MSSB/QT/TRA/2026/0011',
  3500.00, '2025-12-30', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', 'auzilnahari.kl@utm.my', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'TNB ILSAS'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-009', 'TNB ILSAS', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Gen AI'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-012', '0001', 'Gen AI', 
  'Gen AI', 'org-009', 'TNB ILSAS',
  'Non-Training', 'in_person', '2026-01-06', '2026-01-06',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  12000.00, 10800.00, 10200.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0001'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-013', 'prog-012', 'quotation', 'MASB/QT/TRA/2026/0001',
  12000.00, '2026-01-06', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Power BI with AI'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-013', '0002', 'Power BI with AI', 
  'Power BI with AI', 'org-009', 'TNB ILSAS',
  'Non-Training', 'in_person', '2026-01-06', '2026-01-06',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  18000.00, 16200.00, 15300.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0002'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-014', 'prog-013', 'quotation', 'MASB/QT/TRA/2026/0002',
  18000.00, '2026-01-06', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Workflow Automation'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-014', '0003', 'AI Workflow Automation', 
  'AI Workflow Automation', 'org-009', 'TNB ILSAS',
  'Non-Training', 'in_person', '2026-01-06', '2026-01-06',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  24000.00, 21600.00, 20400.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0003'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-015', 'prog-014', 'quotation', 'MASB/QT/TRA/2026/0003',
  24000.00, '2026-01-06', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI for Leaders'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-015', '0004', 'AI for Leaders', 
  'AI for Leaders', 'org-009', 'TNB ILSAS',
  'Non-Training', 'in_person', '2026-01-06', '2026-01-06',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  6000.00, 5400.00, 5100.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0004'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-016', 'prog-015', 'quotation', 'MASB/QT/TRA/2026/0004',
  6000.00, '2026-01-06', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI for Strategic Executives'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-016', '0005', 'AI for Strategic Executives', 
  'AI for Strategic Executives', 'org-009', 'TNB ILSAS',
  'Non-Training', 'in_person', '2026-01-06', '2026-01-06',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  12000.00, 10800.00, 10200.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0005'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-017', 'prog-016', 'quotation', 'MASB/QT/TRA/2026/0005',
  12000.00, '2026-01-06', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MyDigital ID'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-010', 'MyDigital ID', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'MyDigital ID Onboarding Services'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-017', '0001', 'MyDigital ID Onboarding Services', 
  'MyDigital ID Onboarding Services', 'org-010', 'MyDigital ID',
  'Non-Training', 'in_person', '2026-01-06', '2026-01-06',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  34354.80, 30919.32, 29201.58,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MSSB/QT/MYD/2026/0001'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-018', 'prog-017', 'quotation', 'MSSB/QT/MYD/2026/0001',
  34354.80, '2026-01-06', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', 'susie.tamin@myid.my', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'TATI'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-011', 'TATI', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'TTT In-House'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-018', '0020', 'TTT In-House', 
  'TTT In-House', 'org-011', 'TATI',
  'Non-Training', 'in_person', '2026-01-11', '2026-01-11',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  55000.00, 49500.00, 46750.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0020'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-019', 'prog-018', 'quotation', 'MASB/QT/TRA/2026/0020',
  55000.00, '2026-01-11', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'KPKT'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-012', 'KPKT', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'TTT In-House'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-019', '0007', 'TTT In-House', 
  'TTT In-House', 'org-012', 'KPKT',
  'Non-Training', 'in_person', '2026-01-11', '2026-01-11',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  75000.00, 67500.00, 63750.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0007'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-020', 'prog-019', 'quotation', 'MASB/QT/TRA/2026/0007',
  75000.00, '2026-01-11', 'accepted',
  'Nur Izzati Zailani', 'aaishah@kpkt.gov.my', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Intermediate & Advanced'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-020', '0008', 'AI Intermediate & Advanced', 
  'AI Intermediate & Advanced', 'org-012', 'KPKT',
  'Non-Training', 'in_person', '2026-01-11', '2026-01-11',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  32000.00, 28800.00, 27200.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0008'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-021', 'prog-020', 'quotation', 'MASB/QT/TRA/2026/0008',
  32000.00, '2026-01-11', 'accepted',
  'Nur Izzati Zailani', 'aaishah@kpkt.gov.my', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Embodera Group'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-013', 'Embodera Group', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI for Office Productivity: Training 
for Workspace (Beginner)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-021', '0009', 'AI for Office Productivity: Training 
for Workspace (Beginner)', 
  'AI for Office Productivity: Training 
for Workspace (Beginner)', 'org-013', 'Embodera Group',
  'AI & Data Science', 'in_person', '2026-01-11', '2026-01-11',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  6000.00, 5400.00, 5100.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0009'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-022', 'prog-021', 'quotation', 'MASB/QT/TRA/2026/0009',
  6000.00, '2026-01-11', 'accepted',
  'Nur Izzati Zailani', 'management@embodera.com', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MTDC'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-014', 'MTDC', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI for Office Productivity: Training 
for Workspace (Beginner)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-022', '0010', 'AI for Office Productivity: Training 
for Workspace (Beginner)', 
  'AI for Office Productivity: Training 
for Workspace (Beginner)', 'org-014', 'MTDC',
  'Non-Training', 'in_person', '2026-01-11', '2026-01-11',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0010'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-023', 'prog-022', 'quotation', 'MASB/QT/TRA/2026/0010',
  21000.00, '2026-01-11', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'SIRIM Academy'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-015', 'SIRIM Academy', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Overview of Semiconductor Industry for ISO and ESG consultants of SIRIM Academy'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-023', '0011', 'Overview of Semiconductor Industry for ISO and ESG consultants of SIRIM Academy', 
  'Overview of Semiconductor Industry for ISO and ESG consultants of SIRIM Academy', 'org-015', 'SIRIM Academy',
  'Non-Training', 'in_person', '2026-01-11', '2026-01-11',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  35000.00, 31500.00, 29750.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0011'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-024', 'prog-023', 'quotation', 'MASB/QT/TRA/2026/0011',
  35000.00, '2026-01-11', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MARA'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-016', 'MARA', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-024', '0012', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-016', 'MARA',
  'AI & Data Science', 'in_person', '2026-01-11', '2026-01-11',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  64000.00, 57600.00, 54400.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0012'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-025', 'prog-024', 'quotation', 'MASB/QT/TRA/2026/0012',
  64000.00, '2026-01-11', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MIGHT'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-017', 'MIGHT', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-025', '0013', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-017', 'MIGHT',
  'Non-Training', 'in_person', '2026-01-11', '2026-01-11',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0013'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-026', 'prog-025', 'quotation', 'MASB/QT/TRA/2026/0013',
  21000.00, '2026-01-11', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', 'saiful.hayaz@might.org.my', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UTM-MJIIT'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-018', 'UTM-MJIIT', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'ISO9001'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-026', '0014', 'ISO9001', 
  'ISO9001', 'org-018', 'UTM-MJIIT',
  'Non-Training', 'in_person', '2026-01-11', '2026-01-11',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  5000.00, 4500.00, 4250.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0014'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-027', 'prog-026', 'quotation', 'MASB/QT/TRA/2026/0014',
  5000.00, '2026-01-11', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', 'auzilnahari.kl@utm.my', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'TTT In-House'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-027', '0020REV1', 'TTT In-House', 
  'TTT In-House', 'org-011', 'TATI',
  'Non-Training', 'in_person', '2026-01-11', '2026-01-11',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  10000.00, 9000.00, 8500.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0020REV1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-028', 'prog-027', 'quotation', 'MASB/QT/TRA/2026/0020REV1',
  10000.00, '2026-01-11', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'JPN'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-019', 'JPN', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Chatbot Development Training (2 days)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-028', '0006', 'AI Chatbot Development Training (2 days)', 
  'AI Chatbot Development Training (2 days)', 'org-019', 'JPN',
  'Non-Training', 'in_person', '2026-01-10', '2026-01-10',
  NULL, 'Saidatul Farrah Muhammad Johar', 'Saidatul Farrah Muhammad Johar',
  16000.00, 14400.00, 13600.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0006'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-029', 'prog-028', 'quotation', 'MASB/QT/TRA/2026/0006',
  16000.00, '2026-01-10', 'accepted',
  'Saidatul Farrah Muhammad Johar', 'shaiful.annuar@jpn.gov.my', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'BMCCI'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-020', 'BMCCI', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'MIMOS IC Design Upskilling Program'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-029', '0015', 'MIMOS IC Design Upskilling Program', 
  'MIMOS IC Design Upskilling Program', 'org-020', 'BMCCI',
  'Non-Training', 'in_person', '2026-01-12', '2026-01-12',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  221800.00, 199620.00, 188530.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0015'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-030', 'prog-029', 'quotation', 'MASB/QT/TRA/2026/0015',
  221800.00, '2026-01-12', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Kementerian Belia & Sukan'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-021', 'Kementerian Belia & Sukan', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-030', '0016', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-021', 'Kementerian Belia & Sukan',
  'Non-Training', 'in_person', '2026-01-13', '2026-01-13',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  45000.00, 40500.00, 38250.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0016'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-031', 'prog-030', 'quotation', 'MASB/QT/TRA/2026/0016',
  45000.00, '2026-01-13', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train The Trainer (TTT)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-031', '0017', 'Train The Trainer (TTT)', 
  'Train The Trainer (TTT)', 'org-021', 'Kementerian Belia & Sukan',
  'Non-Training', 'in_person', '2026-01-13', '2026-01-13',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  75000.00, 67500.00, 63750.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0017'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-032', 'prog-031', 'quotation', 'MASB/QT/TRA/2026/0017',
  75000.00, '2026-01-13', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-032', '0018', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-021', 'Kementerian Belia & Sukan',
  'Non-Training', 'in_person', '2026-01-13', '2026-01-13',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  30000.00, 27000.00, 25500.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0018'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-033', 'prog-032', 'quotation', 'MASB/QT/TRA/2026/0018',
  30000.00, '2026-01-13', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'NUMIX'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-022', 'NUMIX', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-033', '0019', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-022', 'NUMIX',
  'AI & Data Science', 'in_person', '2026-01-13', '2026-01-13',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  3980.00, 3582.00, 3383.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0019'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-034', 'prog-033', 'quotation', 'MASB/QT/TRA/2026/0019',
  3980.00, '2026-01-13', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'PETRA'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-023', 'PETRA', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-034', '0021', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-023', 'PETRA',
  'Non-Training', 'in_person', '2026-01-13', '2026-01-13',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  45000.00, 40500.00, 38250.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0021'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-035', 'prog-034', 'quotation', 'MASB/QT/TRA/2026/0021',
  45000.00, '2026-01-13', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-035', '0022', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-023', 'PETRA',
  'Non-Training', 'in_person', '2026-01-13', '2026-01-13',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  30000.00, 27000.00, 25500.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0022'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-036', 'prog-035', 'quotation', 'MASB/QT/TRA/2026/0022',
  30000.00, '2026-01-13', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'TTT AI'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-036', '0023', 'TTT AI', 
  'TTT AI', 'org-023', 'PETRA',
  'Non-Training', 'in_person', '2026-01-13', '2026-01-13',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  75000.00, 67500.00, 63750.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0023'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-037', 'prog-036', 'quotation', 'MASB/QT/TRA/2026/0023',
  75000.00, '2026-01-13', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Kolej Ambitious'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-024', 'Kolej Ambitious', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Consultancy'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-037', '0024', 'Consultancy', 
  'Consultancy', 'org-024', 'Kolej Ambitious',
  'Non-Training', 'in_person', '2026-01-13', '2026-01-13',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  70000.00, 63000.00, 59500.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0024'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-038', 'prog-037', 'quotation', 'MASB/QT/TRA/2026/0024',
  70000.00, '2026-01-13', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-038', '0016REV1', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-021', 'Kementerian Belia & Sukan',
  'Non-Training', 'in_person', '2026-01-14', '2026-01-14',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  90000.00, 81000.00, 76500.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0016REV1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-039', 'prog-038', 'quotation', 'MASB/QT/TRA/2026/0016REV1',
  90000.00, '2026-01-14', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-039', '0018REV1', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-021', 'Kementerian Belia & Sukan',
  'Non-Training', 'in_person', '2026-01-14', '2026-01-14',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  60000.00, 54000.00, 51000.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0018REV1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-040', 'prog-039', 'quotation', 'MASB/QT/TRA/2026/0018REV1',
  60000.00, '2026-01-14', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-040', '0021REV1', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-023', 'PETRA',
  'Non-Training', 'in_person', '2026-01-14', '2026-01-14',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  90000.00, 81000.00, 76500.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0021REV1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-041', 'prog-040', 'quotation', 'MASB/QT/TRA/2026/0021REV1',
  90000.00, '2026-01-14', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-041', '0022REV1', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-023', 'PETRA',
  'Non-Training', 'in_person', '2026-01-14', '2026-01-14',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  60000.00, 54000.00, 51000.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0022REV1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-042', 'prog-041', 'quotation', 'MASB/QT/TRA/2026/0022REV1',
  60000.00, '2026-01-14', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Consultancy'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-042', '0024REV1', 'Consultancy', 
  'Consultancy', 'org-024', 'Kolej Ambitious',
  'Non-Training', 'in_person', '2026-01-14', '2026-01-14',
  NULL, 'Saidatul Farrah Muhammad Johar', 'Saidatul Farrah Muhammad Johar',
  75600.00, 68040.00, 64260.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0024REV1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-043', 'prog-042', 'quotation', 'MASB/QT/TRA/2026/0024REV1',
  75600.00, '2026-01-14', 'accepted',
  'Saidatul Farrah Muhammad Johar', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'POIS SDN BHD'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-025', 'POIS SDN BHD', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-043', '0025', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-025', 'POIS SDN BHD',
  'AI & Data Science', 'in_person', '2026-01-15', '2026-01-15',
  NULL, 'Nur Izzati Zailani', 'Nur Izzati Zailani',
  7960.00, 7164.00, 6766.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0025'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-044', 'prog-043', 'quotation', 'MASB/QT/TRA/2026/0025',
  7960.00, '2026-01-15', 'accepted',
  'Nur Izzati Zailani', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'eCEOs'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-026', 'eCEOs', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-044', '0026', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-026', 'eCEOs',
  'AI & Data Science', 'in_person', '2026-01-15', '2026-01-15',
  NULL, 'Ow Zi Qi', 'Ow Zi Qi',
  1000.00, 900.00, 850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-045', 'prog-044', 'quotation', 'MASB/QT/TRA/2026/0026',
  1000.00, '2026-01-15', 'accepted',
  'Ow Zi Qi', 'shakam6907@gmail.com', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MCMC L&D Department'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-027', 'MCMC L&D Department', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-045', '0027', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-027', 'MCMC L&D Department',
  'Non-Training', 'in_person', '2026-01-19', '2026-01-19',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0027'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-046', 'prog-045', 'quotation', 'MASB/QT/TRA/2026/0027',
  21000.00, '2026-01-19', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Dewan Perniagaan Islam Malaysia'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-028', 'Dewan Perniagaan Islam Malaysia', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training for Office Productivity (Asnaf)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-046', '0028', 'AI Training for Office Productivity (Asnaf)', 
  'AI Training for Office Productivity (Asnaf)', 'org-028', 'Dewan Perniagaan Islam Malaysia',
  'Non-Training', 'in_person', '2026-01-19', '2026-01-19',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  45000.00, 40500.00, 38250.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0028'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-047', 'prog-046', 'quotation', 'MASB/QT/TRA/2026/0028',
  45000.00, '2026-01-19', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for Office Productivity (Tenaga Pengajar)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-047', '0029', 'AI Training for Office Productivity (Tenaga Pengajar)', 
  'AI Training for Office Productivity (Tenaga Pengajar)', 'org-028', 'Dewan Perniagaan Islam Malaysia',
  'Non-Training', 'in_person', '2026-01-19', '2026-01-19',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  36000.00, 32400.00, 30600.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0029'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-048', 'prog-047', 'quotation', 'MASB/QT/TRA/2026/0029',
  36000.00, '2026-01-19', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for Office Productivity (Kakitangan DPIM)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-048', '0030', 'AI Training for Office Productivity (Kakitangan DPIM)', 
  'AI Training for Office Productivity (Kakitangan DPIM)', 'org-028', 'Dewan Perniagaan Islam Malaysia',
  'Non-Training', 'in_person', '2026-01-19', '2026-01-19',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  36000.00, 32400.00, 30600.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0030'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-049', 'prog-048', 'quotation', 'MASB/QT/TRA/2026/0030',
  36000.00, '2026-01-19', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MINDEF'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-029', 'MINDEF', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-049', '0031', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-029', 'MINDEF',
  'Non-Training', 'in_person', '2026-01-19', '2026-01-19',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  45000.00, 40500.00, 38250.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0031'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-050', 'prog-049', 'quotation', 'MASB/QT/TRA/2026/0031',
  45000.00, '2026-01-19', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train The Trainer (TTT) - In House'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-050', '0032', 'Train The Trainer (TTT) - In House', 
  'Train The Trainer (TTT) - In House', 'org-029', 'MINDEF',
  'Non-Training', 'in_person', '2026-01-19', '2026-01-19',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  157500.00, 141750.00, 133875.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0032'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-051', 'prog-050', 'quotation', 'MASB/QT/TRA/2026/0032',
  157500.00, '2026-01-19', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Kementerian Perdagangan Dalam Negeri dan Kos Sara Hidup (KPDN)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-030', 'Kementerian Perdagangan Dalam Negeri dan Kos Sara Hidup (KPDN)', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-051', '0033', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-030', 'Kementerian Perdagangan Dalam Negeri dan Kos Sara Hidup (KPDN)',
  'Non-Training', 'in_person', '2026-01-19', '2026-01-19',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0033'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-052', 'prog-051', 'quotation', 'MASB/QT/TRA/2026/0033',
  21000.00, '2026-01-19', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train The Trainer (TTT) - In House'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-052', '0034', 'Train The Trainer (TTT) - In House', 
  'Train The Trainer (TTT) - In House', 'org-030', 'Kementerian Perdagangan Dalam Negeri dan Kos Sara Hidup (KPDN)',
  'Non-Training', 'in_person', '2026-01-19', '2026-01-19',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  80000.00, 72000.00, 68000.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0034'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-053', 'prog-052', 'quotation', 'MASB/QT/TRA/2026/0034',
  80000.00, '2026-01-19', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-053', '0035', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-007', 'KETENGAH',
  'Non-Training', 'in_person', '2026-01-19', '2026-01-19',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0035'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-054', 'prog-053', 'quotation', 'MASB/QT/TRA/2026/0035',
  21000.00, '2026-01-19', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MIMOS Services Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-031', 'MIMOS Services Sdn Bhd', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Staff Development & Team Alignment Programme'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-054', '0036', 'Staff Development & Team Alignment Programme', 
  'Staff Development & Team Alignment Programme', 'org-031', 'MIMOS Services Sdn Bhd',
  'Non-Training', 'in_person', '2026-01-19', '2026-01-19',
  NULL, 'Adilah', 'Adilah',
  47800.00, 43020.00, 40630.00,
  'delivered'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0036'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-055', 'prog-054', 'quotation', 'MASB/QT/TRA/2026/0036',
  47800.00, '2026-01-19', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Efficient Frontier Consulting'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-032', 'Efficient Frontier Consulting', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Space Rental for K-Youth 2025 Graduation (Auditorium)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-055', '0037', 'Space Rental for K-Youth 2025 Graduation (Auditorium)', 
  'Space Rental for K-Youth 2025 Graduation (Auditorium)', 'org-032', 'Efficient Frontier Consulting',
  'Non-Training', 'in_person', '2026-01-19', '2026-01-19',
  NULL, 'Adilah', 'Adilah',
  2000.00, 1800.00, 1700.00,
  'delivered'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0037'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-056', 'prog-055', 'quotation', 'MASB/QT/TRA/2026/0037',
  2000.00, '2026-01-19', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'INSKEN'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-033', 'INSKEN', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train The Trainer (TTT) - In House'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-056', '0038', 'Train The Trainer (TTT) - In House', 
  'Train The Trainer (TTT) - In House', 'org-033', 'INSKEN',
  'Non-Training', 'in_person', '2026-01-19', '2026-01-19',
  NULL, 'Omar', 'Omar',
  540000.00, 486000.00, 459000.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0038'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-057', 'prog-056', 'quotation', 'MASB/QT/TRA/2026/0038',
  540000.00, '2026-01-19', 'accepted',
  'Omar', 'fais@insken.gov.my', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-057', '0039', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-033', 'INSKEN',
  'Non-Training', 'in_person', '2026-01-19', '2026-01-19',
  NULL, 'Omar', 'Omar',
  567000.00, 510300.00, 481950.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0039'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-058', 'prog-057', 'quotation', 'MASB/QT/TRA/2026/0039',
  567000.00, '2026-01-19', 'accepted',
  'Omar', 'fais@insken.gov.my', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MIMOS Berhad'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-034', 'MIMOS Berhad', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Applied AI for Office Productivity & Workflow Efficiency (Intermediate)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-058', '0040', 'Applied AI for Office Productivity & Workflow Efficiency (Intermediate)', 
  'Applied AI for Office Productivity & Workflow Efficiency (Intermediate)', 'org-034', 'MIMOS Berhad',
  'Non-Training', 'in_person', '2026-01-22', '2026-01-22',
  NULL, 'Adilah', 'Adilah',
  10500.00, 9450.00, 8925.00,
  'delivered'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0040'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-059', 'prog-058', 'quotation', 'MASB/QT/TRA/2026/0040',
  10500.00, '2026-01-22', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Finance for Strategic Decision Makers'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-059', '0041', 'Finance for Strategic Decision Makers', 
  'Finance for Strategic Decision Makers', 'org-034', 'MIMOS Berhad',
  'Non-Training', 'in_person', '2026-01-22', '2026-01-22',
  NULL, 'Adilah', 'Adilah',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0041'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-060', 'prog-059', 'quotation', 'MASB/QT/TRA/2026/0041',
  21000.00, '2026-01-22', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'nanoSkunkWorkX'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-035', 'nanoSkunkWorkX', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Wafer Fabrication Overview Site Visit'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-060', '0042', 'Wafer Fabrication Overview Site Visit', 
  'Wafer Fabrication Overview Site Visit', 'org-035', 'nanoSkunkWorkX',
  'Non-Training', 'in_person', '2026-01-27', '2026-01-27',
  NULL, 'Adilah', 'Adilah',
  648.00, 583.20, 550.80,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0042'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-061', 'prog-060', 'quotation', 'MASB/QT/TRA/2026/0042',
  648.00, '2026-01-27', 'accepted',
  'Adilah', 'adammohammad.zahanuddin@nanoskunkworkx.com', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'AJAI TECH SOLUTIONS'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-036', 'AJAI TECH SOLUTIONS', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-061', '0043', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-036', 'AJAI TECH SOLUTIONS',
  'AI & Data Science', 'in_person', NULL, NULL,
  NULL, NULL, NULL,
  1990.00, 1791.00, 1691.50,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0043'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-062', 'prog-061', 'quotation', 'MASB/QT/TRA/2026/0043',
  1990.00, NULL, 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Pahang Skills'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-037', 'Pahang Skills', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-062', '0044', 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 
  'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 'org-037', 'Pahang Skills',
  'Non-Training', 'in_person', '2026-03-02', '2026-03-02',
  NULL, NULL, NULL,
  22500.00, 20250.00, 19125.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0044'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-063', 'prog-062', 'quotation', 'MASB/QT/TRA/2026/0044',
  22500.00, '2026-03-02', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-063', '0044Rev1', 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 
  'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 'org-037', 'Pahang Skills',
  'Non-Training', 'in_person', '2026-03-03', '2026-03-03',
  NULL, NULL, NULL,
  15000.00, 13500.00, 12750.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0044Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-064', 'prog-063', 'quotation', 'MASB/QT/TRA/2026/0044Rev1',
  15000.00, '2026-03-03', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Malaysian Productivity Corporation'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-038', 'Malaysian Productivity Corporation', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System  Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-064', '0045', 'AI System  Thinking:Training for Efficiency', 
  'AI System  Thinking:Training for Efficiency', 'org-038', 'Malaysian Productivity Corporation',
  'Non-Training', 'in_person', '2026-03-08', '2026-03-08',
  NULL, 'Ainur', 'Ainur',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0045'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-065', 'prog-064', 'quotation', 'MASB/QT/TRA/2026/0045',
  22680.00, '2026-03-08', 'accepted',
  'Ainur', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Malaysian Productivity Corporation (Revised by Shol)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-039', 'Malaysian Productivity Corporation (Revised by Shol)', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System  Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-065', '0045Rev1', 'AI System  Thinking:Training for Efficiency', 
  'AI System  Thinking:Training for Efficiency', 'org-039', 'Malaysian Productivity Corporation (Revised by Shol)',
  'Non-Training', 'in_person', '2026-03-18', '2026-03-18',
  NULL, NULL, NULL,
  0.00, 0.00, 0.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0045Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-066', 'prog-065', 'quotation', 'MASB/QT/TRA/2026/0045Rev1',
  0.00, '2026-03-18', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Koperasi Universiti Tun Hussein Onn Malaysia'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-040', 'Koperasi Universiti Tun Hussein Onn Malaysia', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-066', '0046', 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 
  'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 'org-040', 'Koperasi Universiti Tun Hussein Onn Malaysia',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, NULL, NULL,
  5500.00, 4950.00, 4675.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0046'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-067', 'prog-066', 'quotation', 'MASB/QT/TRA/2026/0046',
  5500.00, NULL, 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UNIVERSITY COLLEGE TATI'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-041', 'UNIVERSITY COLLEGE TATI', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-067', '0047', 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 
  'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 'org-041', 'UNIVERSITY COLLEGE TATI',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, NULL, NULL,
  10000.00, 9000.00, 8500.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0047'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-068', 'prog-067', 'quotation', 'MASB/QT/TRA/2026/0047',
  10000.00, NULL, 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Roscil Systems Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-042', 'Roscil Systems Sdn Bhd', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-068', '0048', 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 
  'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 'org-042', 'Roscil Systems Sdn Bhd',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, NULL, NULL,
  5500.00, 4950.00, 4675.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0048'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-069', 'prog-068', 'quotation', 'MASB/QT/TRA/2026/0048',
  5500.00, NULL, 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Institut Koperasi Malaysia'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-043', 'Institut Koperasi Malaysia', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-069', '0049', 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 
  'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 'org-043', 'Institut Koperasi Malaysia',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, NULL, NULL,
  5500.00, 4950.00, 4675.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0049'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-070', 'prog-069', 'quotation', 'MASB/QT/TRA/2026/0049',
  5500.00, NULL, 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: ' Institute Aminuddin Baki'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-044', ' Institute Aminuddin Baki', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Vibe Coding'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-070', '0050', 'Vibe Coding', 
  'Vibe Coding', 'org-044', ' Institute Aminuddin Baki',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, NULL, NULL,
  27000.00, 24300.00, 22950.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0050'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-071', 'prog-070', 'quotation', 'MASB/QT/TRA/2026/0050',
  27000.00, NULL, 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MFZ Dynamic'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-045', 'MFZ Dynamic', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-071', '0051', 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 
  'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 'org-045', 'MFZ Dynamic',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, NULL, NULL,
  10500.00, 9450.00, 8925.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0051'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-072', 'prog-071', 'quotation', 'MASB/QT/TRA/2026/0051',
  10500.00, NULL, 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'JKR'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-046', 'JKR', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Project Management Professional (PMP)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-072', '0052', 'Project Management Professional (PMP)', 
  'Project Management Professional (PMP)', 'org-046', 'JKR',
  'AI & Data Science', 'in_person', '2026-06-03', '2026-06-03',
  NULL, NULL, NULL,
  40500.00, 36450.00, 34425.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0052'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-073', 'prog-072', 'quotation', 'MASB/QT/TRA/2026/0052',
  40500.00, '2026-06-03', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Frontken Malaysia Sdn. Bhd (Kulim Plant)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-047', 'Frontken Malaysia Sdn. Bhd (Kulim Plant)', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Advanced 8D Problem Solving For Operational Excellence'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-073', '0053', 'Advanced 8D Problem Solving For Operational Excellence', 
  'Advanced 8D Problem Solving For Operational Excellence', 'org-047', 'Frontken Malaysia Sdn. Bhd (Kulim Plant)',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Ainur', 'Ainur',
  34020.00, 30618.00, 28917.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0053'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-074', 'prog-073', 'quotation', 'MASB/QT/TRA/2026/0053',
  34020.00, NULL, 'accepted',
  'Ainur', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Effective Presentation Skills for Workplace Impact'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-074', '0054', 'Effective Presentation Skills for Workplace Impact', 
  'Effective Presentation Skills for Workplace Impact', 'org-047', 'Frontken Malaysia Sdn. Bhd (Kulim Plant)',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Ainur', 'Ainur',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0054'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-075', 'prog-074', 'quotation', 'MASB/QT/TRA/2026/0054',
  22680.00, NULL, 'accepted',
  'Ainur', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Tenaga Switchgear'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-048', 'Tenaga Switchgear', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Effective PM Practice'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-075', '0055', 'Effective PM Practice', 
  'Effective PM Practice', 'org-048', 'Tenaga Switchgear',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Please Choose', 'Please Choose',
  0.00, 0.00, 0.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0055'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-076', 'prog-075', 'quotation', 'MASB/QT/TRA/2026/0055',
  0.00, NULL, 'accepted',
  'Please Choose', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MOSTI'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-049', 'MOSTI', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'TTT AI'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-076', '0056', 'TTT AI', 
  'TTT AI', 'org-049', 'MOSTI',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Saidatul Farrah Muhammad Johar', 'Saidatul Farrah Muhammad Johar',
  55000.00, 49500.00, 46750.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0056'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-077', 'prog-076', 'quotation', 'MASB/QT/TRA/2026/0056',
  55000.00, NULL, 'accepted',
  'Saidatul Farrah Muhammad Johar', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'BPM Kementerian Sumber Manusia'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-050', 'BPM Kementerian Sumber Manusia', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Vibe Coding'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-077', '0057', 'Vibe Coding', 
  'Vibe Coding', 'org-050', 'BPM Kementerian Sumber Manusia',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  24000.00, 21600.00, 20400.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0057'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-078', 'prog-077', 'quotation', 'MASB/QT/TRA/2026/0057',
  24000.00, NULL, 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'TTT AI'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-078', '0058', 'TTT AI', 
  'TTT AI', 'org-050', 'BPM Kementerian Sumber Manusia',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Saidatul Farrah Muhammad Johar', 'Saidatul Farrah Muhammad Johar',
  55000.00, 49500.00, 46750.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0058'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-079', 'prog-078', 'quotation', 'MASB/QT/TRA/2026/0058',
  55000.00, NULL, 'accepted',
  'Saidatul Farrah Muhammad Johar', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'TM'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-051', 'TM', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-079', '0059', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-051', 'TM',
  'AI & Data Science', 'in_person', NULL, NULL,
  NULL, 'Ow Zi Qi', 'Ow Zi Qi',
  1990.00, 1791.00, 1691.50,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0059'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-080', 'prog-079', 'quotation', 'MASB/QT/TRA/2026/0059',
  1990.00, NULL, 'accepted',
  'Ow Zi Qi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UTM KL'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-052', 'UTM KL', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-080', '0060', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-052', 'UTM KL',
  'AI & Data Science', 'in_person', NULL, NULL,
  NULL, 'Ow Zi Qi', 'Ow Zi Qi',
  3000.00, 2700.00, 2550.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0060'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-081', 'prog-080', 'quotation', 'MASB/QT/TRA/2026/0060',
  3000.00, NULL, 'accepted',
  'Ow Zi Qi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Attune Consultants Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-053', 'Attune Consultants Sdn Bhd', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Printing Certificate'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-081', '0061', 'Printing Certificate', 
  'Printing Certificate', 'org-053', 'Attune Consultants Sdn Bhd',
  'Non-Training', 'in_person', '2026-02-04', '2026-02-04',
  NULL, 'Adilah', 'Adilah',
  2700.00, 2430.00, 2295.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0061'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-082', 'prog-081', 'quotation', 'MASB/QT/TRA/2026/0061',
  2700.00, '2026-02-04', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'INTURA'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-054', 'INTURA', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-082', '0062', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-054', 'INTURA',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Sholihin', 'Sholihin',
  24840.00, 22356.00, 21114.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0062'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-083', 'prog-082', 'quotation', 'MASB/QT/TRA/2026/0062',
  24840.00, NULL, 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-083', '0063', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-054', 'INTURA',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Sholihin', 'Sholihin',
  24840.00, 22356.00, 21114.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0063'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-084', 'prog-083', 'quotation', 'MASB/QT/TRA/2026/0063',
  24840.00, NULL, 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Overview of Semiconductor Industry for ISO and ESG consultants of SIRIM Academy'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-084', '0011Rev1', 'Overview of Semiconductor Industry for ISO and ESG consultants of SIRIM Academy', 
  'Overview of Semiconductor Industry for ISO and ESG consultants of SIRIM Academy', 'org-015', 'SIRIM Academy',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  20999.97, 18899.97, 17849.97,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0011Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-085', 'prog-084', 'quotation', 'MASB/QT/TRA/2026/0011Rev1',
  20999.97, NULL, 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', 'noora@sirim.my', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Dr Hamidah Karim'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-055', 'Dr Hamidah Karim', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System  Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-085', '0064', 'AI System  Thinking:Training for Efficiency', 
  'AI System  Thinking:Training for Efficiency', 'org-055', 'Dr Hamidah Karim',
  'AI & Data Science', 'in_person', NULL, NULL,
  NULL, 'Please Choose', 'Please Choose',
  1500.00, 1350.00, 1275.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0064'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-086', 'prog-085', 'quotation', 'MASB/QT/TRA/2026/0064',
  1500.00, NULL, 'accepted',
  'Please Choose', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-086', '0065', 'AI Training for Office Productivity', 
  'AI Training for Office Productivity', 'org-054', 'INTURA',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Sholihin', 'Sholihin',
  24840.00, 22356.00, 21114.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0065'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-087', 'prog-086', 'quotation', 'MASB/QT/TRA/2026/0065',
  24840.00, NULL, 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'ISO 9001:2015 INTERNAL AUDITORS TRAINING '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-087', '0067', 'ISO 9001:2015 INTERNAL AUDITORS TRAINING ', 
  'ISO 9001:2015 INTERNAL AUDITORS TRAINING ', 'org-047', 'Frontken Malaysia Sdn. Bhd (Kulim Plant)',
  'Non-Training', 'in_person', '2026-11-01', '2026-11-01',
  NULL, 'Ainur', 'Ainur',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0067'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-088', 'prog-087', 'quotation', 'MASB/QT/TRA/2026/0067',
  22680.00, '2026-11-01', 'accepted',
  'Ainur', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'ISO 14001:2015 INTERNAL AUDIT TRAINING'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-088', '0068', 'ISO 14001:2015 INTERNAL AUDIT TRAINING', 
  'ISO 14001:2015 INTERNAL AUDIT TRAINING', 'org-047', 'Frontken Malaysia Sdn. Bhd (Kulim Plant)',
  'Non-Training', 'in_person', '2026-11-01', '2026-11-01',
  NULL, 'Ainur', 'Ainur',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0068'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-089', 'prog-088', 'quotation', 'MASB/QT/TRA/2026/0068',
  22680.00, '2026-11-01', 'accepted',
  'Ainur', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Exzellent Profis Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-056', 'Exzellent Profis Sdn Bhd', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Awareness & Practical Applications for Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-089', '0069', 'AI Awareness & Practical Applications for Office Productivity', 
  'AI Awareness & Practical Applications for Office Productivity', 'org-056', 'Exzellent Profis Sdn Bhd',
  'Non-Training', 'in_person', '2026-02-10', '2026-02-10',
  NULL, 'Adilah', 'Adilah',
  11340.00, 10206.00, 9639.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0069'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-090', 'prog-089', 'quotation', 'MASB/QT/TRA/2026/0069',
  11340.00, '2026-02-10', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Elite Indigo Consulting (M) Plt'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-057', 'Elite Indigo Consulting (M) Plt', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Semiconductor Failure Analysis and Advanced Materials Characterization '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-090', '0071', 'Semiconductor Failure Analysis and Advanced Materials Characterization ', 
  'Semiconductor Failure Analysis and Advanced Materials Characterization ', 'org-057', 'Elite Indigo Consulting (M) Plt',
  'Non-Training', 'in_person', '2026-02-10', '2026-02-10',
  NULL, 'Adilah', 'Adilah',
  49999.80, 44999.82, 42499.83,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0071'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-091', 'prog-090', 'quotation', 'MASB/QT/TRA/2026/0071',
  49999.80, '2026-02-10', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Interscience Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-058', 'Interscience Sdn Bhd', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Space Rental for Semiconductor Seminar (Auditorium & 5G Room)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-091', '0072', 'Space Rental for Semiconductor Seminar (Auditorium & 5G Room)', 
  'Space Rental for Semiconductor Seminar (Auditorium & 5G Room)', 'org-058', 'Interscience Sdn Bhd',
  'Non-Training', 'in_person', '2026-02-12', '2026-02-12',
  NULL, 'Adilah', 'Adilah',
  2300.00, 2070.00, 1955.00,
  'delivered'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0072'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-092', 'prog-091', 'quotation', 'MASB/QT/TRA/2026/0072',
  2300.00, '2026-02-12', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train-The-Trainer: Certified AI Trainer Program'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-092', '0073', 'Train-The-Trainer: Certified AI Trainer Program', 
  'Train-The-Trainer: Certified AI Trainer Program', 'org-037', 'Pahang Skills',
  'AI & Data Science', 'in_person', '2026-02-18', '2026-02-18',
  NULL, 'Adilah', 'Adilah',
  15120.00, 13608.00, 12852.00,
  'delivered'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0073'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-093', 'prog-092', 'quotation', 'MASB/QT/TRA/2026/0073',
  15120.00, '2026-02-18', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-093', '0074', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-037', 'Pahang Skills',
  'AI & Data Science', 'in_person', '2026-02-18', '2026-02-18',
  NULL, 'Adilah', 'Adilah',
  2149.20, 1934.28, 1826.82,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0074'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-094', 'prog-093', 'quotation', 'MASB/QT/TRA/2026/0074',
  2149.20, '2026-02-18', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for PLC Students'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-094', '0075', 'AI Training for PLC Students', 
  'AI Training for PLC Students', 'org-037', 'Pahang Skills',
  'Non-Training', 'in_person', '2026-02-18', '2026-02-18',
  NULL, 'Adilah', 'Adilah',
  8640.00, 7776.00, 7344.00,
  'delivered'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0075'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-095', 'prog-094', 'quotation', 'MASB/QT/TRA/2026/0075',
  8640.00, '2026-02-18', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'BPM, MINDEF Cohort 1 (revised by Adilah)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-059', 'BPM, MINDEF Cohort 1 (revised by Adilah)', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train-The-Trainer: Certified AI Trainer Program'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-095', '0032rev2', 'Train-The-Trainer: Certified AI Trainer Program', 
  'Train-The-Trainer: Certified AI Trainer Program', 'org-059', 'BPM, MINDEF Cohort 1 (revised by Adilah)',
  'Non-Training', 'in_person', '2026-02-18', '2026-02-18',
  NULL, 'Adilah', 'Adilah',
  49990.00, 44991.00, 42491.50,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0032rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-096', 'prog-095', 'quotation', 'MASB/QT/TRA/2026/0032rev2',
  49990.00, '2026-02-18', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'PUNB'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-060', 'PUNB', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-096', '0076rev2', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-060', 'PUNB',
  'Non-Training', 'in_person', '2026-02-19', '2026-02-19',
  NULL, 'Adilah', 'Adilah',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0076rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-097', 'prog-096', 'quotation', 'MASB/QT/TRA/2026/0076rev2',
  21000.00, '2026-02-19', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Frontken Malaysia Sdn. Bhd (Kulim Plant) (revised by Shol)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-061', 'Frontken Malaysia Sdn. Bhd (Kulim Plant) (revised by Shol)', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'ISO 9001:2015 INTERNAL AUDITORS TRAINING '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-097', '0067Rev 1', 'ISO 9001:2015 INTERNAL AUDITORS TRAINING ', 
  'ISO 9001:2015 INTERNAL AUDITORS TRAINING ', 'org-061', 'Frontken Malaysia Sdn. Bhd (Kulim Plant) (revised by Shol)',
  'Non-Training', 'in_person', '2026-02-22', '2026-02-22',
  NULL, 'Sholihin', 'Sholihin',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0067Rev 1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-098', 'prog-097', 'quotation', 'MASB/QT/TRA/2026/0067Rev 1',
  22680.00, '2026-02-22', 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'ISO 14001:2015 INTERNAL AUDIT TRAINING'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-098', '0068Rev 1', 'ISO 14001:2015 INTERNAL AUDIT TRAINING', 
  'ISO 14001:2015 INTERNAL AUDIT TRAINING', 'org-061', 'Frontken Malaysia Sdn. Bhd (Kulim Plant) (revised by Shol)',
  'Non-Training', 'in_person', '2026-02-22', '2026-02-22',
  NULL, 'Sholihin', 'Sholihin',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0068Rev 1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-099', 'prog-098', 'quotation', 'MASB/QT/TRA/2026/0068Rev 1',
  22680.00, '2026-02-22', 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training (Vibe Coding for Programmers)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-099', '0069', 'AI Training (Vibe Coding for Programmers)', 
  'AI Training (Vibe Coding for Programmers)', 'org-021', 'Kementerian Belia & Sukan',
  'Non-Training', 'in_person', '2026-02-22', '2026-02-22',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  34000.00, 30600.00, 28900.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0069'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-100', 'prog-099', 'quotation', 'MASB/QT/TRA/2026/0069',
  34000.00, '2026-02-22', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for Management'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-100', '0070', 'AI Training for Management', 
  'AI Training for Management', 'org-023', 'PETRA',
  'Non-Training', 'in_person', '2026-02-22', '2026-02-22',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0070'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-101', 'prog-100', 'quotation', 'MASB/QT/TRA/2026/0070',
  21000.00, '2026-02-22', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UZMA'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-062', 'UZMA', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training for Management'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-101', '0071', 'AI Training for Management', 
  'AI Training for Management', 'org-062', 'UZMA',
  'Non-Training', 'in_person', '2026-02-22', '2026-02-22',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0071'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-102', 'prog-101', 'quotation', 'MASB/QT/TRA/2026/0071',
  21000.00, '2026-02-22', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'F&B'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-102', '0071', 'F&B', 
  'F&B', 'org-062', 'UZMA',
  'Non-Training', 'in_person', '2026-02-22', '2026-02-22',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  3000.00, 2700.00, 2550.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0071'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-103', 'prog-102', 'quotation', 'MASB/QT/TRA/2026/0071',
  3000.00, '2026-02-22', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Training Venue'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-103', '0071', 'Training Venue', 
  'Training Venue', 'org-062', 'UZMA',
  'Non-Training', 'in_person', '2026-02-22', '2026-02-22',
  NULL, 'Muhammad Fayyadh Muhammad Fahmi', 'Muhammad Fayyadh Muhammad Fahmi',
  1000.00, 900.00, 850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0071'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-104', 'prog-103', 'quotation', 'MASB/QT/TRA/2026/0071',
  1000.00, '2026-02-22', 'accepted',
  'Muhammad Fayyadh Muhammad Fahmi', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'KOOP TENTERA'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-063', 'KOOP TENTERA', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System  Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-104', '0072', 'AI System  Thinking:Training for Efficiency', 
  'AI System  Thinking:Training for Efficiency', 'org-063', 'KOOP TENTERA',
  'Non-Training', 'in_person', '2026-02-22', '2026-02-22',
  NULL, 'Omar', 'Omar',
  NULL, NULL, NULL,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0072'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-105', 'prog-104', 'quotation', 'MASB/QT/TRA/2026/0072',
  NULL, '2026-02-22', 'accepted',
  'Omar', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for Management'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-105', '0071Rev1', 'AI Training for Management', 
  'AI Training for Management', 'org-062', 'UZMA',
  'Non-Training', 'in_person', '2026-02-24', '2026-02-24',
  NULL, 'Saidatul Farrah Muhammad Johar', 'Saidatul Farrah Muhammad Johar',
  24000.00, 21600.00, 20400.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0071Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-106', 'prog-105', 'quotation', 'MASB/QT/TRA/2026/0071Rev1',
  24000.00, '2026-02-24', 'accepted',
  'Saidatul Farrah Muhammad Johar', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UniKL MIDI'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-064', 'UniKL MIDI', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Industrial Design Workshop'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-106', '0077', 'Industrial Design Workshop', 
  'Industrial Design Workshop', 'org-064', 'UniKL MIDI',
  'Non-Training', 'in_person', '2026-02-24', '2026-02-24',
  NULL, 'Adilah', 'Adilah',
  1123.20, 1010.88, 954.72,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0077'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-107', 'prog-106', 'quotation', 'MASB/QT/TRA/2026/0077',
  1123.20, '2026-02-24', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Vibe Coding'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-107', '0057REV1', 'Vibe Coding', 
  'Vibe Coding', 'org-050', 'BPM Kementerian Sumber Manusia',
  'Non-Training', 'in_person', '2026-02-02', '2026-02-02',
  NULL, 'Saidatul Farrah Muhammad Johar', 'Saidatul Farrah Muhammad Johar',
  24999.75, 22499.78, 21249.79,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0057REV1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-108', 'prog-107', 'quotation', 'MASB/QT/TRA/2026/0057REV1',
  24999.75, '2026-02-02', 'accepted',
  'Saidatul Farrah Muhammad Johar', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'VNTHoldings'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-065', 'VNTHoldings', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-108', '0079', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-065', 'VNTHoldings',
  'AI & Data Science', 'in_person', '2026-03-01', '2026-03-01',
  NULL, NULL, NULL,
  7960.00, 7164.00, 6766.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0079'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-109', 'prog-108', 'quotation', 'MASB/QT/TRA/2026/0079',
  7960.00, '2026-03-01', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train-The-Trainer: Certified AI Trainer Program'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-109', '0058REV1', 'Train-The-Trainer: Certified AI Trainer Program', 
  'Train-The-Trainer: Certified AI Trainer Program', 'org-050', 'BPM Kementerian Sumber Manusia',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Saidatul Farrah Muhammad Johar', 'Saidatul Farrah Muhammad Johar',
  108000.00, 97200.00, 91800.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0058REV1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-110', 'prog-109', 'quotation', 'MASB/QT/TRA/2026/0058REV1',
  108000.00, NULL, 'accepted',
  'Saidatul Farrah Muhammad Johar', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train The Trainer (TTT) - In House'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-110', '0032REV5', 'Train The Trainer (TTT) - In House', 
  'Train The Trainer (TTT) - In House', 'org-029', 'MINDEF',
  'Non-Training', 'in_person', '2026-01-03', '2026-01-03',
  NULL, 'Saidatul Farrah Muhammad Johar', 'Saidatul Farrah Muhammad Johar',
  49987.80, 44989.02, 42489.63,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0032REV5'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-111', 'prog-110', 'quotation', 'MASB/QT/TRA/2026/0032REV5',
  49987.80, '2026-01-03', 'accepted',
  'Saidatul Farrah Muhammad Johar', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Japan-Malaysia Technical Institute (JMTI) '
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-066', 'Japan-Malaysia Technical Institute (JMTI) ', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train-the-Trainer: Semiconductor Front-End Technologies'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-111', '0080', 'Train-the-Trainer: Semiconductor Front-End Technologies', 
  'Train-the-Trainer: Semiconductor Front-End Technologies', 'org-066', 'Japan-Malaysia Technical Institute (JMTI) ',
  'Non-Training', 'in_person', '2026-03-29', '2026-03-29',
  NULL, 'Adilah/Fuziah', 'Adilah/Fuziah',
  623700.00, 561330.00, 530145.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0080'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-112', 'prog-111', 'quotation', 'MASB/QT/TRA/2026/0080',
  623700.00, '2026-03-29', 'accepted',
  'Adilah/Fuziah', 'Muhamad Nabil Bin Mansor', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train-the-Trainer: Semiconductor Back-End Technologies'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-112', '0081', 'Train-the-Trainer: Semiconductor Back-End Technologies', 
  'Train-the-Trainer: Semiconductor Back-End Technologies', 'org-066', 'Japan-Malaysia Technical Institute (JMTI) ',
  'Non-Training', 'in_person', '2026-03-29', '2026-03-29',
  NULL, 'Adilah/Fuziah', 'Adilah/Fuziah',
  623700.00, 561330.00, 530145.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0081'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-113', 'prog-112', 'quotation', 'MASB/QT/TRA/2026/0081',
  623700.00, '2026-03-29', 'accepted',
  'Adilah/Fuziah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-113', '0082', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-038', 'Malaysian Productivity Corporation',
  'AI & Data Science', 'in_person', '2026-04-01', '2026-04-01',
  NULL, 'Fuziah / Sholihin', 'Fuziah / Sholihin',
  1990.00, 1791.00, 1691.50,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0082'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-114', 'prog-113', 'quotation', 'MASB/QT/TRA/2026/0082',
  1990.00, '2026-04-01', 'accepted',
  'Fuziah / Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Saga Advisory Services PLT'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-067', 'Saga Advisory Services PLT', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train-The-Trainer: Certified AI Trainer Program'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-114', '0082', 'Train-The-Trainer: Certified AI Trainer Program', 
  'Train-The-Trainer: Certified AI Trainer Program', 'org-067', 'Saga Advisory Services PLT',
  'AI & Data Science', 'in_person', '2026-08-03', '2026-08-03',
  NULL, 'Saidatul Farrah Muhammad Johar', 'Saidatul Farrah Muhammad Johar',
  10500.00, 9450.00, 8925.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0082'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-115', 'prog-114', 'quotation', 'MASB/QT/TRA/2026/0082',
  10500.00, '2026-08-03', 'accepted',
  'Saidatul Farrah Muhammad Johar', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MIMOS Solutions Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-068', 'MIMOS Solutions Sdn Bhd', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Leveraging Artificial Intelligence for Strategic Tender Responses'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-115', '0083', 'Leveraging Artificial Intelligence for Strategic Tender Responses', 
  'Leveraging Artificial Intelligence for Strategic Tender Responses', 'org-068', 'MIMOS Solutions Sdn Bhd',
  'Non-Training', 'in_person', '2026-08-03', '2026-08-03',
  NULL, 'Saidatul Farrah Muhammad Johar', 'Saidatul Farrah Muhammad Johar',
  43800.00, 39420.00, 37230.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0083'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-116', 'prog-115', 'quotation', 'MASB/QT/TRA/2026/0083',
  43800.00, '2026-08-03', 'accepted',
  'Saidatul Farrah Muhammad Johar', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-116', '0084', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-038', 'Malaysian Productivity Corporation',
  'AI & Data Science', 'in_person', '2026-04-08', '2026-04-08',
  NULL, 'Fuziah / Sholihin', 'Fuziah / Sholihin',
  1836.00, 1652.40, 1560.60,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0084'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-117', 'prog-116', 'quotation', 'MASB/QT/TRA/2026/0084',
  1836.00, '2026-04-08', 'accepted',
  'Fuziah / Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for Work Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-117', '0085', 'AI Training for Work Efficiency', 
  'AI Training for Work Efficiency', 'org-068', 'MIMOS Solutions Sdn Bhd',
  'Non-Training', 'in_person', '2026-04-09', '2026-04-09',
  NULL, NULL, NULL,
  5400.00, 4860.00, 4590.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0085'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-118', 'prog-117', 'quotation', 'MASB/QT/TRA/2026/0085',
  5400.00, '2026-04-09', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Sarawak Skills'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-069', 'Sarawak Skills', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI on Premise & Configuration for Sarawak Skills Centre of Excellence'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-118', '0086', 'AI on Premise & Configuration for Sarawak Skills Centre of Excellence', 
  'AI on Premise & Configuration for Sarawak Skills Centre of Excellence', 'org-069', 'Sarawak Skills',
  'Non-Training', 'in_person', '2026-04-08', '2026-04-08',
  NULL, 'Saidatul Farrah Muhammad Johar', 'Saidatul Farrah Muhammad Johar',
  117720.00, 105948.00, 100062.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/SER/2026/0086'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-119', 'prog-118', 'quotation', 'MASB/QT/SER/2026/0086',
  117720.00, '2026-04-08', 'accepted',
  'Saidatul Farrah Muhammad Johar', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-119', '0070rev4', 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 
  'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 'org-056', 'Exzellent Profis Sdn Bhd',
  'AI & Data Science', 'in_person', '2026-04-14', '2026-04-14',
  NULL, 'Adilah', 'Adilah',
  8750.00, 7875.00, 7437.50,
  'delivered'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0070rev4'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-120', 'prog-119', 'quotation', 'MASB/QT/TRA/2026/0070rev4',
  8750.00, '2026-04-14', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train-the-Trainer: Semiconductor Front-End Technologies Level 4'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-120', '0080rev2', 'Train-the-Trainer: Semiconductor Front-End Technologies Level 4', 
  'Train-the-Trainer: Semiconductor Front-End Technologies Level 4', 'org-066', 'Japan-Malaysia Technical Institute (JMTI) ',
  'Non-Training', 'in_person', '2026-04-14', '2026-04-14',
  NULL, 'Adilah/Fuziah', 'Adilah/Fuziah',
  0.00, 0.00, 0.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0080rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-121', 'prog-120', 'quotation', 'MASB/QT/TRA/2026/0080rev2',
  0.00, '2026-04-14', 'accepted',
  'Adilah/Fuziah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train-the-Trainer: Semiconductor Front-End Technologies Level 5'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-121', '0081rev2', 'Train-the-Trainer: Semiconductor Front-End Technologies Level 5', 
  'Train-the-Trainer: Semiconductor Front-End Technologies Level 5', 'org-066', 'Japan-Malaysia Technical Institute (JMTI) ',
  'Non-Training', 'in_person', '2026-04-14', '2026-04-14',
  NULL, 'Adilah/Fuziah', 'Adilah/Fuziah',
  0.00, 0.00, 0.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0081rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-122', 'prog-121', 'quotation', 'MASB/QT/TRA/2026/0081rev2',
  0.00, '2026-04-14', 'accepted',
  'Adilah/Fuziah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-122', '0035Rev1', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-007', 'KETENGAH',
  'Non-Training', 'in_person', '2026-05-19', '2026-05-19',
  NULL, NULL, NULL,
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0035Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-123', 'prog-122', 'quotation', 'MASB/QT/TRA/2026/0035Rev1',
  22680.00, '2026-05-19', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Kementerian Digital'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-070', 'Kementerian Digital', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-123', '0087', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-070', 'Kementerian Digital',
  'Non-Training', 'in_person', '2026-04-15', '2026-04-15',
  NULL, NULL, NULL,
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/SER/2026/0087'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-124', 'prog-123', 'quotation', 'MASB/QT/SER/2026/0087',
  22680.00, '2026-04-15', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-124', '0088', 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 
  'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 'org-070', 'Kementerian Digital',
  'Non-Training', 'in_person', '2026-04-15', '2026-04-15',
  NULL, NULL, NULL,
  56700.00, 51030.00, 48195.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/SER/2026/0088'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-125', 'prog-124', 'quotation', 'MASB/QT/SER/2026/0088',
  56700.00, '2026-04-15', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Majlis Agama Islam Selangor (MAIS)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-071', 'Majlis Agama Islam Selangor (MAIS)', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-125', '0089', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-071', 'Majlis Agama Islam Selangor (MAIS)',
  'AI & Data Science', 'in_person', '2026-04-15', '2026-04-15',
  NULL, 'Hariz', 'Hariz',
  1990.00, 1791.00, 1691.50,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/SER/2026/0089'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-126', 'prog-125', 'quotation', 'MASB/QT/SER/2026/0089',
  1990.00, '2026-04-15', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-126', '0090', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-015', 'SIRIM Academy',
  'AI & Data Science', 'in_person', '2026-04-19', '2026-04-19',
  NULL, NULL, NULL,
  42984.00, 38685.60, 36536.40,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0090'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-127', 'prog-126', 'quotation', 'MASB/QT/TRA/2026/0090',
  42984.00, '2026-04-19', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'KESUMA Kota Kinabalu'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-072', 'KESUMA Kota Kinabalu', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Vibe Coding'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-127', '0091', 'Vibe Coding', 
  'Vibe Coding', 'org-072', 'KESUMA Kota Kinabalu',
  'Non-Training', 'in_person', '2026-04-20', '2026-04-20',
  NULL, 'Adilah', 'Adilah',
  29376.00, 26438.40, 24969.60,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0091'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-128', 'prog-127', 'quotation', 'MASB/QT/TRA/2026/0091',
  29376.00, '2026-04-20', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'KESUMA Tawau'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-073', 'KESUMA Tawau', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Vibe Coding'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-128', '0092', 'Vibe Coding', 
  'Vibe Coding', 'org-073', 'KESUMA Tawau',
  'Non-Training', 'in_person', '2026-04-20', '2026-04-20',
  NULL, 'Adilah', 'Adilah',
  30024.00, 27021.60, 25520.40,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0092'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-129', 'prog-128', 'quotation', 'MASB/QT/TRA/2026/0092',
  30024.00, '2026-04-20', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'WICE Solution'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-074', 'WICE Solution', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Safety Carnival Soft Launch and New Product Launching event'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-129', '0093', 'Safety Carnival Soft Launch and New Product Launching event', 
  'Safety Carnival Soft Launch and New Product Launching event', 'org-074', 'WICE Solution',
  'Non-Training', 'in_person', '2026-04-20', '2026-04-20',
  NULL, 'Abu Said', 'Abu Said',
  1625.00, 1462.50, 1381.25,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0093'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-130', 'prog-129', 'quotation', 'MASB/QT/TRA/2026/0093',
  1625.00, '2026-04-20', 'accepted',
  'Abu Said', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training (Vibe Coding for Programmers)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-130', '0094', 'AI Training (Vibe Coding for Programmers)', 
  'AI Training (Vibe Coding for Programmers)', 'org-021', 'Kementerian Belia & Sukan',
  'Non-Training', 'in_person', '2026-04-21', '2026-04-21',
  NULL, 'Hariz', 'Hariz',
  23800.00, 21420.00, 20230.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0094'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-131', 'prog-130', 'quotation', 'MASB/QT/TRA/2026/0094',
  23800.00, '2026-04-21', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UniKL BMI'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-075', 'UniKL BMI', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Industrial Visit & Semiconductor Workshop (20 May 2026)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-131', '0078rev2', 'Industrial Visit & Semiconductor Workshop (20 May 2026)', 
  'Industrial Visit & Semiconductor Workshop (20 May 2026)', 'org-075', 'UniKL BMI',
  'Non-Training', 'in_person', '2026-04-22', '2026-04-22',
  NULL, 'Adilah', 'Adilah',
  1587.60, 1428.84, 1349.46,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0078rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-132', 'prog-131', 'quotation', 'MASB/QT/TRA/2026/0078rev2',
  1587.60, '2026-04-22', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Industrial Visit & Semiconductor Workshop (3 June 2026)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-132', '0095', 'Industrial Visit & Semiconductor Workshop (3 June 2026)', 
  'Industrial Visit & Semiconductor Workshop (3 June 2026)', 'org-075', 'UniKL BMI',
  'Non-Training', 'in_person', '2026-04-22', '2026-04-22',
  NULL, 'Adilah', 'Adilah',
  1587.60, 1428.84, 1349.46,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0095'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-133', 'prog-132', 'quotation', 'MASB/QT/TRA/2026/0095',
  1587.60, '2026-04-22', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UPM'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-076', 'UPM', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Ergonomics'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-133', '0096', 'Ergonomics', 
  'Ergonomics', 'org-076', 'UPM',
  'Non-Training', 'in_person', '2026-04-22', '2026-04-22',
  NULL, 'Adilah', 'Adilah',
  1085.00, 976.50, 922.25,
  'delivered'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0096'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-134', 'prog-133', 'quotation', 'MASB/QT/TRA/2026/0096',
  1085.00, '2026-04-22', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Takaful Ikhlas'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-077', 'Takaful Ikhlas', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-134', '0097', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-077', 'Takaful Ikhlas',
  'Non-Training', 'in_person', '2026-04-25', '2026-04-25',
  NULL, 'Adilah', 'Adilah',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0097'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-135', 'prog-134', 'quotation', 'MASB/QT/TRA/2026/0097',
  22680.00, '2026-04-25', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI for Manufacturing'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-135', '0098', 'AI for Manufacturing', 
  'AI for Manufacturing', 'org-015', 'SIRIM Academy',
  'Non-Training', 'in_person', '2026-04-27', '2026-04-27',
  NULL, 'Adilah', 'Adilah',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0098'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-136', 'prog-135', 'quotation', 'MASB/QT/TRA/2026/0098',
  22680.00, '2026-04-27', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-136', '0099', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-015', 'SIRIM Academy',
  'Non-Training', 'in_person', '2026-04-27', '2026-04-27',
  NULL, 'Adilah', 'Adilah',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0099'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-137', 'prog-136', 'quotation', 'MASB/QT/TRA/2026/0099',
  22680.00, '2026-04-27', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Candy Connection Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-078', 'Candy Connection Sdn Bhd', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI-Powered Video Content Creation'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-137', '0100', 'AI-Powered Video Content Creation', 
  'AI-Powered Video Content Creation', 'org-078', 'Candy Connection Sdn Bhd',
  'Non-Training', 'in_person', '2026-04-27', '2026-04-27',
  NULL, 'Adilah', 'Adilah',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0100'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-138', 'prog-137', 'quotation', 'MASB/QT/TRA/2026/0100',
  22680.00, '2026-04-27', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MPC Wilayah Utara'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-079', 'MPC Wilayah Utara', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Training Hall Rental (Half Day)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-138', '0101', 'Training Hall Rental (Half Day)', 
  'Training Hall Rental (Half Day)', 'org-079', 'MPC Wilayah Utara',
  'Non-Training', 'in_person', '2026-04-28', '2026-04-28',
  NULL, 'Abu Said', 'Abu Said',
  2150.00, 1935.00, 1827.50,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0101'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-139', 'prog-138', 'quotation', 'MASB/QT/TRA/2026/0101',
  2150.00, '2026-04-28', 'accepted',
  'Abu Said', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MCMC'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-080', 'MCMC', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Certified Data Scientist Practitioner'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-139', '0102', 'Certified Data Scientist Practitioner', 
  'Certified Data Scientist Practitioner', 'org-080', 'MCMC',
  'AI & Data Science', 'in_person', '2026-04-28', '2026-04-28',
  NULL, 'Adilah', 'Adilah',
  1500.00, 1350.00, 1275.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0102'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-140', 'prog-139', 'quotation', 'MASB/QT/TRA/2026/0102',
  1500.00, '2026-04-28', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Certified Data Scientist Practitioner'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-140', '0103', 'Certified Data Scientist Practitioner', 
  'Certified Data Scientist Practitioner', 'org-080', 'MCMC',
  'AI & Data Science', 'in_person', '2026-04-28', '2026-04-28',
  NULL, 'Adilah', 'Adilah',
  3000.00, 2700.00, 2550.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0103'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-141', 'prog-140', 'quotation', 'MASB/QT/TRA/2026/0103',
  3000.00, '2026-04-28', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UNISEL'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-081', 'UNISEL', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'TTT'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-141', '0104', 'TTT', 
  'TTT', 'org-081', 'UNISEL',
  'Non-Training', 'in_person', '2026-04-29', '2026-04-29',
  NULL, 'Omar', 'Omar',
  0.00, 0.00, 0.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0104'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-142', 'prog-141', 'quotation', 'MASB/QT/TRA/2026/0104',
  0.00, '2026-04-29', 'accepted',
  'Omar', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'In House'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-142', '0105', 'In House', 
  'In House', 'org-081', 'UNISEL',
  'Non-Training', 'in_person', '2026-04-29', '2026-04-29',
  NULL, 'Omar', 'Omar',
  0.00, 0.00, 0.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0105'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-143', 'prog-142', 'quotation', 'MASB/QT/TRA/2026/0105',
  0.00, '2026-04-29', 'accepted',
  'Omar', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Public Training'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-143', '0106', 'Public Training', 
  'Public Training', 'org-081', 'UNISEL',
  'AI & Data Science', 'in_person', '2026-04-29', '2026-04-29',
  NULL, 'Omar', 'Omar',
  0.00, 0.00, 0.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0106'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-144', 'prog-143', 'quotation', 'MASB/QT/TRA/2026/0106',
  0.00, '2026-04-29', 'accepted',
  'Omar', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'ERL Maintenance Support Sdn. Bhd.'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-082', 'ERL Maintenance Support Sdn. Bhd.', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Embedded Skills (Advanced Level – Multi-Platform IoT Systems)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-144', '0107', 'Embedded Skills (Advanced Level – Multi-Platform IoT Systems)', 
  'Embedded Skills (Advanced Level – Multi-Platform IoT Systems)', 'org-082', 'ERL Maintenance Support Sdn. Bhd.',
  'Non-Training', 'in_person', '2026-04-29', '2026-04-29',
  NULL, 'Adilah', 'Adilah',
  42000.00, 37800.00, 35700.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0107'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-145', 'prog-144', 'quotation', 'MASB/QT/TRA/2026/0107',
  42000.00, '2026-04-29', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Leveraging AI to Accelerate End-to-End Tender Preparation and Proposal Development'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-145', '0083rev2', 'Leveraging AI to Accelerate End-to-End Tender Preparation and Proposal Development', 
  'Leveraging AI to Accelerate End-to-End Tender Preparation and Proposal Development', 'org-068', 'MIMOS Solutions Sdn Bhd',
  'Non-Training', 'in_person', '2026-04-29', '2026-04-29',
  NULL, 'Adilah', 'Adilah',
  36000.00, 32400.00, 30600.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0083rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-146', 'prog-145', 'quotation', 'MASB/QT/TRA/2026/0083rev2',
  36000.00, '2026-04-29', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Project Management Professional'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-146', '0108', 'Project Management Professional', 
  'Project Management Professional', 'org-034', 'MIMOS Berhad',
  'Non-Training', 'in_person', '2026-04-29', '2026-04-29',
  NULL, 'Adilah', 'Adilah',
  63720.00, 57348.00, 54162.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0108'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-147', 'prog-146', 'quotation', 'MASB/QT/TRA/2026/0108',
  63720.00, '2026-04-29', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Binsen Plastic Ind. SB'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-083', 'Binsen Plastic Ind. SB', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '5S Implementation With AI-Driven Productivity (3Days)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-147', '0109', '5S Implementation With AI-Driven Productivity (3Days)', 
  '5S Implementation With AI-Driven Productivity (3Days)', 'org-083', 'Binsen Plastic Ind. SB',
  'Non-Training', 'in_person', '2026-05-04', '2026-05-04',
  NULL, 'Sholihin', 'Sholihin',
  31500.00, 28350.00, 26775.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0109'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-148', 'prog-147', 'quotation', 'MASB/QT/TRA/2026/0109',
  31500.00, '2026-05-04', 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Kementerian Perdagangan Dalam Negeri (KPDN)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-084', 'Kementerian Perdagangan Dalam Negeri (KPDN)', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Ai, Data Analitik & Programming (Beginner)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-148', '0110', 'Ai, Data Analitik & Programming (Beginner)', 
  'Ai, Data Analitik & Programming (Beginner)', 'org-084', 'Kementerian Perdagangan Dalam Negeri (KPDN)',
  'Non-Training', 'in_person', '2026-05-05', '2026-05-05',
  NULL, 'Hariz', 'Hariz',
  48600.00, 43740.00, 41310.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0110'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-149', 'prog-148', 'quotation', 'MASB/QT/TRA/2026/0110',
  48600.00, '2026-05-05', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'KRIMS Ventures Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-085', 'KRIMS Ventures Sdn Bhd', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Space Rental (Seminar Room 1 & 2)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-149', '0111', 'Space Rental (Seminar Room 1 & 2)', 
  'Space Rental (Seminar Room 1 & 2)', 'org-085', 'KRIMS Ventures Sdn Bhd',
  'Non-Training', 'in_person', '2026-05-05', '2026-05-05',
  NULL, 'Adilah', 'Adilah',
  100.00, 90.00, 85.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0111'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-150', 'prog-149', 'quotation', 'MASB/QT/TRA/2026/0111',
  100.00, '2026-05-05', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Universiti Malaya'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-086', 'Universiti Malaya', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-150', '0112', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-086', 'Universiti Malaya',
  'Non-Training', 'in_person', '2026-05-06', '2026-05-06',
  NULL, 'Hariz', 'Hariz',
  216.00, 194.40, 183.60,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0112'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-151', 'prog-150', 'quotation', 'MASB/QT/TRA/2026/0112',
  216.00, '2026-05-06', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'SEMI S22 – Safety Guideline for Electrical Design of Semiconductor 
Manufacturing Equipment '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-151', '0113', 'SEMI S22 – Safety Guideline for Electrical Design of Semiconductor 
Manufacturing Equipment ', 
  'SEMI S22 – Safety Guideline for Electrical Design of Semiconductor 
Manufacturing Equipment ', 'org-015', 'SIRIM Academy',
  'Non-Training', 'in_person', '2026-05-07', '2026-05-07',
  NULL, 'Hariz', 'Hariz',
  25920.00, 23328.00, 22032.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0113'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-152', 'prog-151', 'quotation', 'MASB/QT/TRA/2026/0113',
  25920.00, '2026-05-07', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'SEMI S22 – Safety Guideline for Electrical Design of Semiconductor 
Manufacturing Equipment '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-152', '0113REV1', 'SEMI S22 – Safety Guideline for Electrical Design of Semiconductor 
Manufacturing Equipment ', 
  'SEMI S22 – Safety Guideline for Electrical Design of Semiconductor 
Manufacturing Equipment ', 'org-015', 'SIRIM Academy',
  'Non-Training', 'in_person', '2026-05-07', '2026-05-07',
  NULL, 'Hariz', 'Hariz',
  15608.00, 14047.20, 13266.80,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0113REV1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-153', 'prog-152', 'quotation', 'MASB/QT/TRA/2026/0113REV1',
  15608.00, '2026-05-07', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: '5S Power Move (1Day)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-153', '0114', '5S Power Move (1Day)', 
  '5S Power Move (1Day)', 'org-083', 'Binsen Plastic Ind. SB',
  'Non-Training', 'in_person', '2026-05-04', '2026-05-04',
  NULL, 'Sholihin', 'Sholihin',
  10500.00, 9450.00, 8925.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0114'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-154', 'prog-153', 'quotation', 'MASB/QT/TRA/2026/0114',
  10500.00, '2026-05-04', 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: '5S Power Move (2Days)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-154', '0115', '5S Power Move (2Days)', 
  '5S Power Move (2Days)', 'org-083', 'Binsen Plastic Ind. SB',
  'Non-Training', 'in_person', '2026-05-04', '2026-05-04',
  NULL, 'Sholihin', 'Sholihin',
  19000.00, 17100.00, 16150.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0115'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-155', 'prog-154', 'quotation', 'MASB/QT/TRA/2026/0115',
  19000.00, '2026-05-04', 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'AIR BORNEO'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-087', 'AIR BORNEO', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-155', '0116', 'AI System Thinking', 
  'AI System Thinking', 'org-087', 'AIR BORNEO',
  'Non-Training', 'in_person', '2026-08-04', '2026-08-04',
  NULL, NULL, NULL,
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0116'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-156', 'prog-155', 'quotation', 'MASB/QT/TRA/2026/0116',
  22680.00, '2026-08-04', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI for Technical & Operations'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-156', '0117', 'AI for Technical & Operations', 
  'AI for Technical & Operations', 'org-087', 'AIR BORNEO',
  'Non-Training', 'in_person', '2026-08-04', '2026-08-04',
  NULL, NULL, NULL,
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0117'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-157', 'prog-156', 'quotation', 'MASB/QT/TRA/2026/0117',
  22680.00, '2026-08-04', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Hamadatec (M) Sdn. Bhd.'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-088', 'Hamadatec (M) Sdn. Bhd.', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'ISO 14001:2026 EMS Transition Ghange '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-157', '0118', 'ISO 14001:2026 EMS Transition Ghange ', 
  'ISO 14001:2026 EMS Transition Ghange ', 'org-088', 'Hamadatec (M) Sdn. Bhd.',
  'Non-Training', 'in_person', '2026-11-04', '2026-11-04',
  NULL, NULL, NULL,
  9500.00, 8550.00, 8075.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0118'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-158', 'prog-157', 'quotation', 'MASB/QT/TRA/2026/0118',
  9500.00, '2026-11-04', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-158', '0119', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-070', 'Kementerian Digital',
  'Non-Training', 'in_person', '2026-05-12', '2026-05-12',
  NULL, 'Hariz', 'Hariz',
  30239.89, 27215.90, 25703.91,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0119'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-159', 'prog-158', 'quotation', 'MASB/QT/TRA/2026/0119',
  30239.89, '2026-05-12', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-159', '0119REV1', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-070', 'Kementerian Digital',
  'Non-Training', 'in_person', '2026-05-12', '2026-05-12',
  NULL, 'Hariz', 'Hariz',
  27999.90, 25199.91, 23799.92,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0119REV1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-160', 'prog-159', 'quotation', 'MASB/QT/TRA/2026/0119REV1',
  27999.90, '2026-05-12', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Bank Kerjasama Rakyat'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-089', 'Bank Kerjasama Rakyat', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-160', '0120', 'AI System Thinking', 
  'AI System Thinking', 'org-089', 'Bank Kerjasama Rakyat',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Omar', 'Omar',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/SER/2026/0120'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-161', 'prog-160', 'quotation', 'MASB/QT/SER/2026/0120',
  22680.00, NULL, 'accepted',
  'Omar', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI for Technical & Operations'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-161', '0121', 'AI for Technical & Operations', 
  'AI for Technical & Operations', 'org-089', 'Bank Kerjasama Rakyat',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, NULL, NULL,
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/SER/2026/0121'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-162', 'prog-161', 'quotation', 'MASB/QT/SER/2026/0121',
  22680.00, NULL, 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'ASWARA, Ministry Tourism Art & Culture'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-090', 'ASWARA, Ministry Tourism Art & Culture', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-162', '0122', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-090', 'ASWARA, Ministry Tourism Art & Culture',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Adilah', 'Adilah',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/SER/2026/0122'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-163', 'prog-162', 'quotation', 'MASB/QT/SER/2026/0122',
  21000.00, NULL, 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Ekuiti Nasional Berhad'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-091', 'Ekuiti Nasional Berhad', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-163', '0123', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-091', 'Ekuiti Nasional Berhad',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Adilah', 'Adilah',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/SER/2026/0123'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-164', 'prog-163', 'quotation', 'MASB/QT/SER/2026/0123',
  21000.00, NULL, 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'BPM, MINDEF Cohort 2'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-092', 'BPM, MINDEF Cohort 2', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train-The-Trainer: Certified AI Trainer Program'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-164', '0124', 'Train-The-Trainer: Certified AI Trainer Program', 
  'Train-The-Trainer: Certified AI Trainer Program', 'org-092', 'BPM, MINDEF Cohort 2',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Adilah', 'Adilah',
  44990.00, 40491.00, 38241.50,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/SER/2026/0124'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-165', 'prog-164', 'quotation', 'MASB/QT/SER/2026/0124',
  44990.00, NULL, 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UIA'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-093', 'UIA', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Semiconductor Technology & Manufacturing Process '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-165', '0125', 'Semiconductor Technology & Manufacturing Process ', 
  'Semiconductor Technology & Manufacturing Process ', 'org-093', 'UIA',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Adilah', 'Adilah',
  9000.00, 8100.00, 7650.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/SER/2026/0125'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-166', 'prog-165', 'quotation', 'MASB/QT/SER/2026/0125',
  9000.00, NULL, 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Gen AI'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-166', '0001Rev1', 'Gen AI', 
  'Gen AI', 'org-009', 'TNB ILSAS',
  'Non-Training', 'in_person', '2026-03-05', '2026-03-05',
  NULL, 'Hariz', 'Hariz',
  12000.00, 10800.00, 10200.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0001Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-167', 'prog-166', 'quotation', 'MASB/QT/TRA/2026/0001Rev1',
  12000.00, '2026-03-05', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Power BI with AI'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-167', '0002Rev1', 'Power BI with AI', 
  'Power BI with AI', 'org-009', 'TNB ILSAS',
  'Non-Training', 'in_person', '2026-03-05', '2026-03-05',
  NULL, 'Hariz', 'Hariz',
  18000.00, 16200.00, 15300.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0002Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-168', 'prog-167', 'quotation', 'MASB/QT/TRA/2026/0002Rev1',
  18000.00, '2026-03-05', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Workflow Automation'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-168', '0003Rev1', 'AI Workflow Automation', 
  'AI Workflow Automation', 'org-009', 'TNB ILSAS',
  'Non-Training', 'in_person', '2026-03-05', '2026-03-05',
  NULL, 'Hariz', 'Hariz',
  24000.00, 21600.00, 20400.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0003Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-169', 'prog-168', 'quotation', 'MASB/QT/TRA/2026/0003Rev1',
  24000.00, '2026-03-05', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI for Leaders'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-169', '0004Rev1', 'AI for Leaders', 
  'AI for Leaders', 'org-009', 'TNB ILSAS',
  'Non-Training', 'in_person', '2026-03-05', '2026-03-05',
  NULL, 'Hariz', 'Hariz',
  6000.00, 5400.00, 5100.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0004Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-170', 'prog-169', 'quotation', 'MASB/QT/TRA/2026/0004Rev1',
  6000.00, '2026-03-05', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI for Strategic Executives'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-170', '0005Rev1', 'AI for Strategic Executives', 
  'AI for Strategic Executives', 'org-009', 'TNB ILSAS',
  'Non-Training', 'in_person', '2026-03-05', '2026-03-05',
  NULL, 'Hariz', 'Hariz',
  12000.00, 10800.00, 10200.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0005Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-171', 'prog-170', 'quotation', 'MASB/QT/TRA/2026/0005Rev1',
  12000.00, '2026-03-05', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Malaysia Productivity Corp (MPC)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-094', 'Malaysia Productivity Corp (MPC)', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-171', '0126', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-094', 'Malaysia Productivity Corp (MPC)',
  'Non-Training', 'in_person', '2026-04-05', '2026-04-05',
  NULL, 'Hariz', 'Hariz',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0126'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-172', 'prog-171', 'quotation', 'MASB/QT/TRA/2026/0126',
  22680.00, '2026-04-05', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Squarecloud'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-095', 'Squarecloud', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Space Rental (Seminar Room 1 & 2)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-172', '0127', 'Space Rental (Seminar Room 1 & 2)', 
  'Space Rental (Seminar Room 1 & 2)', 'org-095', 'Squarecloud',
  'Non-Training', 'in_person', '2026-04-05', '2026-04-05',
  NULL, 'Hariz', 'Hariz',
  1000.00, 900.00, 850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/SER/2026/0127'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-173', 'prog-172', 'quotation', 'MASB/QT/SER/2026/0127',
  1000.00, '2026-04-05', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'NotebookLM & AI System Thinking: Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-173', '0119REV2', 'NotebookLM & AI System Thinking: Training for Efficiency', 
  'NotebookLM & AI System Thinking: Training for Efficiency', 'org-070', 'Kementerian Digital',
  'Non-Training', 'in_person', '2026-06-08', '2026-06-08',
  NULL, 'Hariz', 'Hariz',
  27999.90, 25199.91, 23799.92,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0119REV2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-174', 'prog-173', 'quotation', 'MASB/QT/TRA/2026/0119REV2',
  27999.90, '2026-06-08', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Kobelco Digital Presicion'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-096', 'Kobelco Digital Presicion', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Patent Search Training'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-174', '0128', 'Patent Search Training', 
  'Patent Search Training', 'org-096', 'Kobelco Digital Presicion',
  'Non-Training', 'in_person', '2026-06-08', '2026-06-08',
  NULL, 'Hariz', 'Hariz',
  11340.00, 10206.00, 9639.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0128'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-175', 'prog-174', 'quotation', 'MASB/QT/TRA/2026/0128',
  11340.00, '2026-06-08', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Institut Aminuddin Baki'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-097', 'Institut Aminuddin Baki', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-175', '0129', 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 
  'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 'org-097', 'Institut Aminuddin Baki',
  'Non-Training', 'in_person', '2026-06-08', '2026-06-08',
  NULL, 'Hariz', 'Hariz',
  32400.00, 29160.00, 27540.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0129'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-176', 'prog-175', 'quotation', 'MASB/QT/TRA/2026/0129',
  32400.00, '2026-06-08', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI on Premise & Configuration for Institut Aminuddin Baki'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-176', '0130', 'AI on Premise & Configuration for Institut Aminuddin Baki', 
  'AI on Premise & Configuration for Institut Aminuddin Baki', 'org-097', 'Institut Aminuddin Baki',
  'Non-Training', 'in_person', '2026-06-09', '2026-06-09',
  NULL, 'Hariz', 'Hariz',
  33480.00, 30132.00, 28458.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0130'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-177', 'prog-176', 'quotation', 'MASB/QT/TRA/2026/0130',
  33480.00, '2026-06-09', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UiTM Perak Kampus Tapah'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-098', 'UiTM Perak Kampus Tapah', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Printing Certificate - Industrial Visit'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-177', '0131', 'Printing Certificate - Industrial Visit', 
  'Printing Certificate - Industrial Visit', 'org-098', 'UiTM Perak Kampus Tapah',
  'Non-Training', 'in_person', '2026-06-09', '2026-06-09',
  NULL, 'Adilah', 'Adilah',
  250.00, 225.00, 212.50,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/SER/2026/0131'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-178', 'prog-177', 'quotation', 'MASB/QT/SER/2026/0131',
  250.00, '2026-06-09', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Bulletproof Your Tech Business'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-178', '0132', 'Bulletproof Your Tech Business', 
  'Bulletproof Your Tech Business', 'org-034', 'MIMOS Berhad',
  'Non-Training', 'in_person', '2026-06-10', '2026-06-10',
  NULL, 'Adilah', 'Adilah',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0132'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-179', 'prog-178', 'quotation', 'MASB/QT/TRA/2026/0132',
  21000.00, '2026-06-10', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'NotebookLM & AI System Thinking: Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-179', '0119REV3', 'NotebookLM & AI System Thinking: Training for Efficiency', 
  'NotebookLM & AI System Thinking: Training for Efficiency', 'org-070', 'Kementerian Digital',
  'Non-Training', 'in_person', '2026-06-14', '2026-06-14',
  NULL, 'Hariz', 'Hariz',
  27999.00, 25199.10, 23799.15,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0119REV3'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-180', 'prog-179', 'quotation', 'MASB/QT/TRA/2026/0119REV3',
  27999.00, '2026-06-14', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UNIMAP'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-099', 'UNIMAP', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Industrial Design Workshop'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-180', '0133', 'Industrial Design Workshop', 
  'Industrial Design Workshop', 'org-099', 'UNIMAP',
  'Non-Training', 'in_person', '2026-06-14', '2026-06-14',
  NULL, 'Adilah', 'Adilah',
  2960.00, 2664.00, 2516.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0133'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-181', 'prog-180', 'quotation', 'MASB/QT/TRA/2026/0133',
  2960.00, '2026-06-14', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Ai, Data Analitik & Programming (Beginner)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-181', '0110Rev1', 'Ai, Data Analitik & Programming (Beginner)', 
  'Ai, Data Analitik & Programming (Beginner)', 'org-084', 'Kementerian Perdagangan Dalam Negeri (KPDN)',
  'Non-Training', 'in_person', '2026-06-14', '2026-06-14',
  NULL, 'Hariz', 'Hariz',
  51840.00, 46656.00, 44064.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0110Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-182', 'prog-181', 'quotation', 'MASB/QT/TRA/2026/0110Rev1',
  51840.00, '2026-06-14', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Ai, Data Analitik & Programming (Beginner)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-182', '0110Rev2', 'Ai, Data Analitik & Programming (Beginner)', 
  'Ai, Data Analitik & Programming (Beginner)', 'org-084', 'Kementerian Perdagangan Dalam Negeri (KPDN)',
  'Non-Training', 'in_person', '2026-06-15', '2026-06-15',
  NULL, 'Hariz', 'Hariz',
  49500.00, 44550.00, 42075.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0110Rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-183', 'prog-182', 'quotation', 'MASB/QT/TRA/2026/0110Rev2',
  49500.00, '2026-06-15', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Daffodil Bangladesh'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-100', 'Daffodil Bangladesh', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Training Proposal Of Train-The-Trainer: Front End Wafer Fabrication - Process & Manufacturing'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-183', '0134', 'Training Proposal Of Train-The-Trainer: Front End Wafer Fabrication - Process & Manufacturing', 
  'Training Proposal Of Train-The-Trainer: Front End Wafer Fabrication - Process & Manufacturing', 'org-100', 'Daffodil Bangladesh',
  'Non-Training', 'in_person', '2026-06-15', '2026-06-15',
  NULL, NULL, NULL,
  110496.96, 99447.26, 93922.42,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0134'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-184', 'prog-183', 'quotation', 'MASB/QT/TRA/2026/0134',
  110496.96, '2026-06-15', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Training Proposal Of Train-The-Trainer: Front End Wafer Fabrication - Process & Manufacturing'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-184', '0134', 'Training Proposal Of Train-The-Trainer: Front End Wafer Fabrication - Process & Manufacturing', 
  'Training Proposal Of Train-The-Trainer: Front End Wafer Fabrication - Process & Manufacturing', 'org-100', 'Daffodil Bangladesh',
  'Non-Training', 'in_person', '2026-06-15', '2026-06-15',
  NULL, NULL, NULL,
  263088.00, 236779.20, 223624.80,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0134'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-185', 'prog-184', 'quotation', 'MASB/QT/TRA/2026/0134',
  263088.00, '2026-06-15', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MTSB for DENSO (Malaysia) Sdn. Bhd. (DNMY) '
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-101', 'MTSB for DENSO (Malaysia) Sdn. Bhd. (DNMY) ', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-185', '0135a', 'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program', 
  'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program', 'org-101', 'MTSB for DENSO (Malaysia) Sdn. Bhd. (DNMY) ',
  'Non-Training', 'in_person', '2026-06-16', '2026-06-16',
  NULL, 'Adilah', 'Adilah',
  31188.02, 28069.22, 26509.82,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0135a'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-186', 'prog-185', 'quotation', 'MASB/QT/TRA/2026/0135a',
  31188.02, '2026-06-16', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-186', '0136a', 'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program', 
  'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program', 'org-101', 'MTSB for DENSO (Malaysia) Sdn. Bhd. (DNMY) ',
  'Non-Training', 'in_person', '2026-06-16', '2026-06-16',
  NULL, 'Adilah', 'Adilah',
  47316.64, 42584.97, 40219.14,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0136a'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-187', 'prog-186', 'quotation', 'MASB/QT/TRA/2026/0136a',
  47316.64, '2026-06-16', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-187', '0137a', 'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program', 
  'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program', 'org-101', 'MTSB for DENSO (Malaysia) Sdn. Bhd. (DNMY) ',
  'Non-Training', 'in_person', '2026-06-16', '2026-06-16',
  NULL, 'Adilah', 'Adilah',
  57716.32, 51944.69, 49058.87,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0137a'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-188', 'prog-187', 'quotation', 'MASB/QT/TRA/2026/0137a',
  57716.32, '2026-06-16', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MTSB for DENSO Philippines Corporation (DNPH)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-102', 'MTSB for DENSO Philippines Corporation (DNPH)', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-188', '0135b', 'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program', 
  'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program', 'org-102', 'MTSB for DENSO Philippines Corporation (DNPH)',
  'Non-Training', 'in_person', '2026-06-16', '2026-06-16',
  NULL, 'Adilah', 'Adilah',
  62376.05, 56138.44, 53019.64,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0135b'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-189', 'prog-188', 'quotation', 'MASB/QT/TRA/2026/0135b',
  62376.05, '2026-06-16', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-189', '0136b', 'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program', 
  'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program', 'org-102', 'MTSB for DENSO Philippines Corporation (DNPH)',
  'Non-Training', 'in_person', '2026-06-16', '2026-06-16',
  NULL, 'Adilah', 'Adilah',
  47316.64, 42584.97, 40219.14,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0136b'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-190', 'prog-189', 'quotation', 'MASB/QT/TRA/2026/0136b',
  47316.64, '2026-06-16', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-190', '0137b', 'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program', 
  'Comprehensive Semiconductor Manufacturing, Analytical Characterization and Failure Analysis Training Program', 'org-102', 'MTSB for DENSO Philippines Corporation (DNPH)',
  'Non-Training', 'in_person', '2026-06-16', '2026-06-16',
  NULL, 'Adilah', 'Adilah',
  38477.54, 34629.79, 32705.91,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0137b'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-191', 'prog-190', 'quotation', 'MASB/QT/TRA/2026/0137b',
  38477.54, '2026-06-16', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking (Intermediate)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-191', '0138', 'AI System Thinking (Intermediate)', 
  'AI System Thinking (Intermediate)', 'org-029', 'MINDEF',
  'Non-Training', 'in_person', '2026-06-17', '2026-06-17',
  NULL, 'Adilah', 'Adilah',
  29970.00, 26973.00, 25474.50,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0138'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-192', 'prog-191', 'quotation', 'MASB/QT/TRA/2026/0138',
  29970.00, '2026-06-17', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MIMOS Holdings Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-103', 'MIMOS Holdings Sdn Bhd', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Printing Certificate - Training'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-192', '0139', 'Printing Certificate - Training', 
  'Printing Certificate - Training', 'org-103', 'MIMOS Holdings Sdn Bhd',
  'Non-Training', 'in_person', '2026-06-17', '2026-06-17',
  NULL, NULL, NULL,
  5400.00, 4860.00, 4590.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/SER/2026/0139'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-193', 'prog-192', 'quotation', 'MASB/QT/SER/2026/0139',
  5400.00, '2026-06-17', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Pos Aviation'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-104', 'Pos Aviation', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-193', '0140', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-104', 'Pos Aviation',
  'Non-Training', 'in_person', '2026-06-18', '2026-06-18',
  NULL, NULL, NULL,
  0.00, 0.00, 0.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/SER/2026/0140'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-194', 'prog-193', 'quotation', 'MASB/QT/SER/2026/0140',
  0.00, '2026-06-18', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking (LMS)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-194', '0141', 'AI System Thinking (LMS)', 
  'AI System Thinking (LMS)', 'org-037', 'Pahang Skills',
  'Non-Training', 'in_person', '2026-06-18', '2026-06-18',
  NULL, NULL, NULL,
  0.00, 0.00, 0.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/SER/2026/0141'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-195', 'prog-194', 'quotation', 'MASB/QT/SER/2026/0141',
  0.00, '2026-06-18', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MPOB'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-105', 'MPOB', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-195', '0142', 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 
  'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 'org-105', 'MPOB',
  'Non-Training', 'in_person', '2026-06-21', '2026-06-21',
  NULL, 'Hariz', 'Hariz',
  56700.00, 51030.00, 48195.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0142'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-196', 'prog-195', 'quotation', 'MASB/QT/TRA/2026/0142',
  56700.00, '2026-06-21', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Ai, Data Analitik & Programming (Beginner)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-196', '0110Rev3', 'Ai, Data Analitik & Programming (Beginner)', 
  'Ai, Data Analitik & Programming (Beginner)', 'org-084', 'Kementerian Perdagangan Dalam Negeri (KPDN)',
  'Non-Training', 'in_person', '2026-06-21', '2026-06-21',
  NULL, 'Hariz', 'Hariz',
  49500.00, 44550.00, 42075.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0110Rev3'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-197', 'prog-196', 'quotation', 'MASB/QT/TRA/2026/0110Rev3',
  49500.00, '2026-06-21', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'IPGM'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-106', 'IPGM', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-197', '0143', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-106', 'IPGM',
  'Non-Training', 'in_person', '2026-06-21', '2026-06-21',
  NULL, NULL, NULL,
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0143'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-198', 'prog-197', 'quotation', 'MASB/QT/TRA/2026/0143',
  22680.00, '2026-06-21', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-198', '0144', 'Train-The-Trainer (TTT): Certified AI Trainer ', 
  'Train-The-Trainer (TTT): Certified AI Trainer ', 'org-106', 'IPGM',
  'Non-Training', 'in_person', '2026-06-21', '2026-06-21',
  NULL, NULL, NULL,
  52704.00, 47433.60, 44798.40,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0144'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-199', 'prog-198', 'quotation', 'MASB/QT/TRA/2026/0144',
  52704.00, '2026-06-21', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'KITAB, Penang'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-107', 'KITAB, Penang', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-199', '0145', 'Train-The-Trainer (TTT): Certified AI Trainer ', 
  'Train-The-Trainer (TTT): Certified AI Trainer ', 'org-107', 'KITAB, Penang',
  'Non-Training', 'in_person', '2026-06-22', '2026-06-22',
  NULL, 'Fuziah', 'Fuziah',
  56700.00, 51030.00, 48195.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0145'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-200', 'prog-199', 'quotation', 'MASB/QT/TRA/2026/0145',
  56700.00, '2026-06-22', 'accepted',
  'Fuziah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Unit Perancang Ekonomi Negeri Selangor (UPEN)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-108', 'Unit Perancang Ekonomi Negeri Selangor (UPEN)', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-200', '0146', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-108', 'Unit Perancang Ekonomi Negeri Selangor (UPEN)',
  'Non-Training', 'in_person', '2026-06-22', '2026-06-22',
  NULL, 'Hariz', 'Hariz',
  324000.00, 291600.00, 275400.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0146'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-201', 'prog-200', 'quotation', 'MASB/QT/TRA/2026/0146',
  324000.00, '2026-06-22', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-201', '0129REV1', 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 
  'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 'org-097', 'Institut Aminuddin Baki',
  'Non-Training', 'in_person', '2026-06-24', '2026-06-24',
  NULL, 'Hariz', 'Hariz',
  48000.00, 43200.00, 40800.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0129REV1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-202', 'prog-201', 'quotation', 'MASB/QT/TRA/2026/0129REV1',
  48000.00, '2026-06-24', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UiTM Shah Alam'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-109', 'UiTM Shah Alam', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Industrial Design Workshop'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-202', '0133b', 'Industrial Design Workshop', 
  'Industrial Design Workshop', 'org-109', 'UiTM Shah Alam',
  'Non-Training', 'in_person', '2026-06-28', '2026-06-28',
  NULL, 'Adilah', 'Adilah',
  3040.00, 2736.00, 2584.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0133b'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-203', 'prog-202', 'quotation', 'MASB/QT/TRA/2026/0133b',
  3040.00, '2026-06-28', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'HYBRID INTELLIGENCE SDN. BHD.'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-110', 'HYBRID INTELLIGENCE SDN. BHD.', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Fundamentals for Everyday Productivity: Beginner, Intermediate and Advanced Class'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-203', '0147', 'AI Fundamentals for Everyday Productivity: Beginner, Intermediate and Advanced Class', 
  'AI Fundamentals for Everyday Productivity: Beginner, Intermediate and Advanced Class', 'org-110', 'HYBRID INTELLIGENCE SDN. BHD.',
  'Non-Training', 'in_person', '2026-06-29', '2026-06-29',
  NULL, 'Hariz', 'Hariz',
  367200.00, 330480.00, 312120.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0147'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-204', 'prog-203', 'quotation', 'MASB/QT/TRA/2026/0147',
  367200.00, '2026-06-29', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-204', '0129REV2', 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 
  'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 'org-097', 'Institut Aminuddin Baki',
  'Non-Training', 'in_person', '2026-06-29', '2026-06-29',
  NULL, 'Hariz', 'Hariz',
  51840.00, 46656.00, 44064.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0129REV2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-205', 'prog-204', 'quotation', 'MASB/QT/TRA/2026/0129REV2',
  51840.00, '2026-06-29', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'TalentCorp'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-111', 'TalentCorp', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Comprehensive Programme'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-205', '0148', 'Comprehensive Programme', 
  'Comprehensive Programme', 'org-111', 'TalentCorp',
  'Non-Training', 'in_person', '2026-07-01', '2026-07-01',
  NULL, 'Hariz', 'Hariz',
  51840.00, 46656.00, 44064.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0148'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-206', 'prog-205', 'quotation', 'MASB/QT/TRA/2026/0148',
  51840.00, '2026-07-01', 'accepted',
  'Hariz', '48000', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Intensive Programme'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-206', '0149', 'Intensive Programme', 
  'Intensive Programme', 'org-111', 'TalentCorp',
  'Non-Training', 'in_person', '2026-07-01', '2026-07-01',
  NULL, 'Abu said', 'Abu said',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0149'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-207', 'prog-206', 'quotation', 'MASB/QT/TRA/2026/0149',
  22680.00, '2026-07-01', 'accepted',
  'Abu said', '21000', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Universiti Utara Malaysia, UUM Sintok'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-112', 'Universiti Utara Malaysia, UUM Sintok', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'UUM - Smart City & ESG Transformation Symposium 2026'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-207', '0150', 'UUM - Smart City & ESG Transformation Symposium 2026', 
  'UUM - Smart City & ESG Transformation Symposium 2026', 'org-112', 'Universiti Utara Malaysia, UUM Sintok',
  'Non-Training', 'in_person', '2026-07-01', '2026-07-01',
  NULL, 'Hariz', 'Hariz',
  8500.00, 7650.00, 7225.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0150'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-208', 'prog-207', 'quotation', 'MASB/QT/TRA/2026/0150',
  8500.00, '2026-07-01', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'INTAN'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-113', 'INTAN', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-208', '0151', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-113', 'INTAN',
  'Non-Training', 'in_person', '2026-07-02', '2026-07-02',
  NULL, 'Hariz', 'Hariz',
  10746.00, 9671.40, 9134.10,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0151'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-209', 'prog-208', 'quotation', 'MASB/QT/TRA/2026/0151',
  10746.00, '2026-07-02', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Jabatan Pendaftaran Negara (JPN)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-114', 'Jabatan Pendaftaran Negara (JPN)', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Penghasilan Montaj Berasaskan AI'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-209', '0152', 'Penghasilan Montaj Berasaskan AI', 
  'Penghasilan Montaj Berasaskan AI', 'org-114', 'Jabatan Pendaftaran Negara (JPN)',
  'AI & Data Science', 'in_person', '2026-07-02', '2026-07-02',
  NULL, 'Hariz', 'Hariz',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0152'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-210', 'prog-209', 'quotation', 'MASB/QT/TRA/2026/0152',
  21000.00, '2026-07-02', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Penghasilan Montaj Berasaskan AI'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-210', '0152Rev1', 'Penghasilan Montaj Berasaskan AI', 
  'Penghasilan Montaj Berasaskan AI', 'org-114', 'Jabatan Pendaftaran Negara (JPN)',
  'AI & Data Science', 'in_person', '2026-07-05', '2026-07-05',
  NULL, 'Hariz', 'Hariz',
  20000.00, 18000.00, 17000.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0152Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-211', 'prog-210', 'quotation', 'MASB/QT/TRA/2026/0152Rev1',
  20000.00, '2026-07-05', 'accepted',
  'Hariz', '10', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI For Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-211', '0153', 'AI For Office Productivity', 
  'AI For Office Productivity', 'org-049', 'MOSTI',
  'Non-Training', 'in_person', '2026-07-05', '2026-07-05',
  NULL, 'Hariz', 'Hariz',
  60000.00, 54000.00, 51000.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0153'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-212', 'prog-211', 'quotation', 'MASB/QT/TRA/2026/0153',
  60000.00, '2026-07-05', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI For Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-212', '0154', 'AI For Office Productivity', 
  'AI For Office Productivity', 'org-049', 'MOSTI',
  'Non-Training', 'in_person', '2026-07-05', '2026-07-05',
  NULL, 'Hariz', 'Hariz',
  50000.00, 45000.00, 42500.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0154'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-213', 'prog-212', 'quotation', 'MASB/QT/TRA/2026/0154',
  50000.00, '2026-07-05', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Koperasi Ladang Berhad'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-115', 'Koperasi Ladang Berhad', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-213', '0155', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-115', 'Koperasi Ladang Berhad',
  'Non-Training', 'in_person', '2026-07-05', '2026-07-05',
  NULL, 'Hariz', 'Hariz',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0155'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-214', 'prog-213', 'quotation', 'MASB/QT/TRA/2026/0155',
  22680.00, '2026-07-05', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-214', '0156', 'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 
  'Train-The-Trainer (TTT): Certified AI Trainer & AI Integration', 'org-115', 'Koperasi Ladang Berhad',
  'Non-Training', 'in_person', '2026-07-05', '2026-07-05',
  NULL, 'Hariz', 'Hariz',
  52919.73, 47627.76, 44981.77,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0156'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-215', 'prog-214', 'quotation', 'MASB/QT/TRA/2026/0156',
  52919.73, '2026-07-05', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Perbadanan Nasional Berhad (Pernas)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-116', 'Perbadanan Nasional Berhad (Pernas)', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-215', '0157', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-116', 'Perbadanan Nasional Berhad (Pernas)',
  'AI & Data Science', 'in_person', '2026-07-05', '2026-07-05',
  NULL, 'Sholihin', 'Sholihin',
  4298.40, 3868.56, 3653.64,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0157'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-216', 'prog-215', 'quotation', 'MASB/QT/TRA/2026/0157',
  4298.40, '2026-07-05', 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Pn. Hamidah Abd Karim'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-117', 'Pn. Hamidah Abd Karim', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-216', '0158', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-117', 'Pn. Hamidah Abd Karim',
  'AI & Data Science', 'in_person', '2026-07-05', '2026-07-05',
  NULL, 'Sholihin', 'Sholihin',
  108.00, 97.20, 91.80,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0158'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-217', 'prog-216', 'quotation', 'MASB/QT/TRA/2026/0158',
  108.00, '2026-07-05', 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-217', '0146Rev1', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-108', 'Unit Perancang Ekonomi Negeri Selangor (UPEN)',
  'Non-Training', 'in_person', '2026-07-06', '2026-07-06',
  NULL, 'Hariz', 'Hariz',
  129600.00, 116640.00, 110160.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0146Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-218', 'prog-217', 'quotation', 'MASB/QT/TRA/2026/0146Rev1',
  129600.00, '2026-07-06', 'accepted',
  'Hariz', '25', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Chatbot Development Training (2 days)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-218', '0006Rev1', 'AI Chatbot Development Training (2 days)', 
  'AI Chatbot Development Training (2 days)', 'org-019', 'JPN',
  'Non-Training', 'in_person', '2026-07-06', '2026-07-06',
  NULL, 'Hariz', 'Hariz',
  20000.00, 18000.00, 17000.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0006Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-219', 'prog-218', 'quotation', 'MASB/QT/TRA/2026/0006Rev1',
  20000.00, '2026-07-06', 'accepted',
  'Hariz', '8', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Gen AI'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-219', '0001Rev2', 'Gen AI', 
  'Gen AI', 'org-009', 'TNB ILSAS',
  'Non-Training', 'in_person', '2026-03-05', '2026-03-05',
  NULL, 'Hariz', 'Hariz',
  12000.00, 10800.00, 10200.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0001Rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-220', 'prog-219', 'quotation', 'MASB/QT/TRA/2026/0001Rev2',
  12000.00, '2026-03-05', 'accepted',
  'Hariz', '25', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Power BI with AI'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-220', '0002Rev2', 'Power BI with AI', 
  'Power BI with AI', 'org-009', 'TNB ILSAS',
  'Non-Training', 'in_person', '2026-03-05', '2026-03-05',
  NULL, 'Hariz', 'Hariz',
  18000.00, 16200.00, 15300.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0002Rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-221', 'prog-220', 'quotation', 'MASB/QT/TRA/2026/0002Rev2',
  18000.00, '2026-03-05', 'accepted',
  'Hariz', '25', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Workflow Automation'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-221', '0003Rev2', 'AI Workflow Automation', 
  'AI Workflow Automation', 'org-009', 'TNB ILSAS',
  'Non-Training', 'in_person', '2026-03-05', '2026-03-05',
  NULL, 'Hariz', 'Hariz',
  24000.00, 21600.00, 20400.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0003Rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-222', 'prog-221', 'quotation', 'MASB/QT/TRA/2026/0003Rev2',
  24000.00, '2026-03-05', 'accepted',
  'Hariz', '25', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI for Leaders'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-222', '0004Rev2', 'AI for Leaders', 
  'AI for Leaders', 'org-009', 'TNB ILSAS',
  'Non-Training', 'in_person', '2026-03-05', '2026-03-05',
  NULL, 'Hariz', 'Hariz',
  6000.00, 5400.00, 5100.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0004Rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-223', 'prog-222', 'quotation', 'MASB/QT/TRA/2026/0004Rev2',
  6000.00, '2026-03-05', 'accepted',
  'Hariz', '25', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI for Strategic Executives'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-223', '0005Rev2', 'AI for Strategic Executives', 
  'AI for Strategic Executives', 'org-009', 'TNB ILSAS',
  'Non-Training', 'in_person', '2026-03-05', '2026-03-05',
  NULL, 'Hariz', 'Hariz',
  12000.00, 10800.00, 10200.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0005Rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-224', 'prog-223', 'quotation', 'MASB/QT/TRA/2026/0005Rev2',
  12000.00, '2026-03-05', 'accepted',
  'Hariz', '25', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'BPM MINDEF'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-118', 'BPM MINDEF', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking (Intermediate)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-224', '0138rev2', 'AI System Thinking (Intermediate)', 
  'AI System Thinking (Intermediate)', 'org-118', 'BPM MINDEF',
  'Non-Training', 'in_person', '2026-07-08', '2026-07-08',
  NULL, 'Adilah', 'Adilah',
  33000.00, 29700.00, 28050.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0138rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-225', 'prog-224', 'quotation', 'MASB/QT/TRA/2026/0138rev2',
  33000.00, '2026-07-08', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UTP'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-119', 'UTP', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'IC design & Semiconductor Training'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-225', '0159', 'IC design & Semiconductor Training', 
  'IC design & Semiconductor Training', 'org-119', 'UTP',
  'AI & Data Science', 'in_person', '2026-07-09', '2026-07-09',
  NULL, 'Hariz', 'Hariz',
  81000.00, 72900.00, 68850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0159'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-226', 'prog-225', 'quotation', 'MASB/QT/TRA/2026/0159',
  81000.00, '2026-07-09', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'GTIC'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-120', 'GTIC', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking (Intermediate)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-226', '0160', 'AI System Thinking (Intermediate)', 
  'AI System Thinking (Intermediate)', 'org-120', 'GTIC',
  'Non-Training', 'in_person', '2026-07-13', '2026-07-13',
  NULL, 'Adilah', 'Adilah',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0160'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-227', 'prog-226', 'quotation', 'MASB/QT/TRA/2026/0160',
  21000.00, '2026-07-13', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Cybersecurity Awareness'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-227', '0161', 'Cybersecurity Awareness', 
  'Cybersecurity Awareness', 'org-120', 'GTIC',
  'Non-Training', 'in_person', '2026-07-13', '2026-07-13',
  NULL, NULL, NULL,
  10500.00, 9450.00, 8925.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0161'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-228', 'prog-227', 'quotation', 'MASB/QT/TRA/2026/0161',
  10500.00, '2026-07-13', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Training for Management'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-228', '0071Rev2', 'AI Training for Management', 
  'AI Training for Management', 'org-062', 'UZMA',
  'Non-Training', 'in_person', '2026-07-13', '2026-07-13',
  NULL, 'Hariz', 'Hariz',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0071Rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-229', 'prog-228', 'quotation', 'MASB/QT/TRA/2026/0071Rev2',
  22680.00, '2026-07-13', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'F&B'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-229', '0071Rev2', 'F&B', 
  'F&B', 'org-062', 'UZMA',
  'Non-Training', 'in_person', '2026-07-13', '2026-07-13',
  NULL, 'Hariz', 'Hariz',
  3240.00, 2916.00, 2754.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0071Rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-230', 'prog-229', 'quotation', 'MASB/QT/TRA/2026/0071Rev2',
  3240.00, '2026-07-13', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI For Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-230', '0162', 'AI For Office Productivity', 
  'AI For Office Productivity', 'org-049', 'MOSTI',
  'Non-Training', 'in_person', '2026-07-13', '2026-07-13',
  NULL, 'Hariz', 'Hariz',
  26800.00, 24120.00, 22780.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0162'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-231', 'prog-230', 'quotation', 'MASB/QT/TRA/2026/0162',
  26800.00, '2026-07-13', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'F&B'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-231', '0162', 'F&B', 
  'F&B', 'org-049', 'MOSTI',
  'Non-Training', 'in_person', '2026-07-13', '2026-07-13',
  NULL, 'Hariz', 'Hariz',
  22400.00, 20160.00, 19040.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0162'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-232', 'prog-231', 'quotation', 'MASB/QT/TRA/2026/0162',
  22400.00, '2026-07-13', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MTSB - MITRA Cohort 1.0'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-121', 'MTSB - MITRA Cohort 1.0', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'MTSB - TRAINING ROOM RENTAL – MITRA (COHORT 1)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-232', '0163', 'MTSB - TRAINING ROOM RENTAL – MITRA (COHORT 1)', 
  'MTSB - TRAINING ROOM RENTAL – MITRA (COHORT 1)', 'org-121', 'MTSB - MITRA Cohort 1.0',
  'Non-Training', 'in_person', '2026-07-14', '2026-07-14',
  NULL, 'Abu Said', 'Abu Said',
  8000.00, 7200.00, 6800.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0163'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-233', 'prog-232', 'quotation', 'MASB/QT/TRA/2026/0163',
  8000.00, '2026-07-14', 'accepted',
  'Abu Said', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Chatbot Development Training (2 days)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-233', '0006Rev2', 'AI Chatbot Development Training (2 days)', 
  'AI Chatbot Development Training (2 days)', 'org-019', 'JPN',
  'Non-Training', 'in_person', '2026-07-13', '2026-07-13',
  NULL, 'Hariz', 'Hariz',
  18600.00, 16740.00, 15810.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0006Rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-234', 'prog-233', 'quotation', 'MASB/QT/TRA/2026/0006Rev2',
  18600.00, '2026-07-13', 'accepted',
  'Hariz', '8', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'F&B'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-234', '0006Rev2', 'F&B', 
  'F&B', 'org-019', 'JPN',
  'Non-Training', 'in_person', '2026-07-13', '2026-07-13',
  NULL, 'Hariz', 'Hariz',
  1400.00, 1260.00, 1190.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0006Rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-235', 'prog-234', 'quotation', 'MASB/QT/TRA/2026/0006Rev2',
  1400.00, '2026-07-13', 'accepted',
  'Hariz', '8', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-235', '0163', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-070', 'Kementerian Digital',
  'Non-Training', 'in_person', '2026-07-13', '2026-07-13',
  NULL, 'Hariz', 'Hariz',
  59400.00, 53460.00, 50490.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0163'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-236', 'prog-235', 'quotation', 'MASB/QT/TRA/2026/0163',
  59400.00, '2026-07-13', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'APU'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-122', 'APU', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Professional Training, Technical Consultancy &  Semiconductor Wafer Fabrication Programme for Seven (7) Lecturers '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-236', '0164', 'Professional Training, Technical Consultancy &  Semiconductor Wafer Fabrication Programme for Seven (7) Lecturers ', 
  'Professional Training, Technical Consultancy &  Semiconductor Wafer Fabrication Programme for Seven (7) Lecturers ', 'org-122', 'APU',
  'Non-Training', 'in_person', '2026-07-13', '2026-07-13',
  NULL, 'Hariz', 'Hariz',
  52500.00, 47250.00, 44625.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0164'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-237', 'prog-236', 'quotation', 'MASB/QT/TRA/2026/0164',
  52500.00, '2026-07-13', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MAIS'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-123', 'MAIS', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-237', '0165', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-123', 'MAIS',
  'AI & Data Science', 'in_person', '2026-07-14', '2026-07-14',
  NULL, 'Hariz', 'Hariz',
  1990.00, 1791.00, 1691.50,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0165'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-238', 'prog-237', 'quotation', 'MASB/QT/TRA/2026/0165',
  1990.00, '2026-07-14', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-238', '0166', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-042', 'Roscil Systems Sdn Bhd',
  'AI & Data Science', 'in_person', '2026-07-14', '2026-07-14',
  NULL, 'Hariz', 'Hariz',
  200.00, 180.00, 170.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0166'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-239', 'prog-238', 'quotation', 'MASB/QT/TRA/2026/0166',
  200.00, '2026-07-14', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Professional Training, Technical Consultancy &  Semiconductor Wafer Fabrication Programme for Seven (7) Lecturers '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-239', '0164Rev1', 'Professional Training, Technical Consultancy &  Semiconductor Wafer Fabrication Programme for Seven (7) Lecturers ', 
  'Professional Training, Technical Consultancy &  Semiconductor Wafer Fabrication Programme for Seven (7) Lecturers ', 'org-122', 'APU',
  'Non-Training', 'in_person', '2026-07-15', '2026-07-15',
  NULL, 'Hariz', 'Hariz',
  52500.00, 47250.00, 44625.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0164Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-240', 'prog-239', 'quotation', 'MASB/QT/TRA/2026/0164Rev1',
  52500.00, '2026-07-15', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'HANNAN '
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-124', 'HANNAN ', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Training '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-240', '0167', 'AI Training ', 
  'AI Training ', 'org-124', 'HANNAN ',
  'Non-Training', 'in_person', '2026-07-16', '2026-07-16',
  NULL, 'Hariz', 'Hariz',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0167'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-241', 'prog-240', 'quotation', 'MASB/QT/TRA/2026/0167',
  22680.00, '2026-07-16', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Lam Research'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-125', 'Lam Research', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-241', '0168', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-125', 'Lam Research',
  'AI & Data Science', 'in_person', '2026-07-16', '2026-07-16',
  NULL, 'Hariz', 'Hariz',
  200.00, 180.00, 170.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0168'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-242', 'prog-241', 'quotation', 'MASB/QT/TRA/2026/0168',
  200.00, '2026-07-16', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-242', '0169', 'Train-The-Trainer (TTT): Certified AI Trainer ', 
  'Train-The-Trainer (TTT): Certified AI Trainer ', 'org-106', 'IPGM',
  'Non-Training', 'in_person', '2026-07-20', '2026-07-20',
  NULL, 'Adilah', 'Adilah',
  248400.00, 223560.00, 211140.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0169'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-243', 'prog-242', 'quotation', 'MASB/QT/TRA/2026/0169',
  248400.00, '2026-07-20', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI For Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-243', '0162Rev1', 'AI For Office Productivity', 
  'AI For Office Productivity', 'org-049', 'MOSTI',
  'Non-Training', 'in_person', '2026-07-13', '2026-07-13',
  NULL, 'Hariz', 'Hariz',
  26800.00, 24120.00, 22780.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0162Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-244', 'prog-243', 'quotation', 'MASB/QT/TRA/2026/0162Rev1',
  26800.00, '2026-07-13', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'F&B'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-244', '0162Rev1', 'F&B', 
  'F&B', 'org-049', 'MOSTI',
  'Non-Training', 'in_person', '2026-07-13', '2026-07-13',
  NULL, 'Hariz', 'Hariz',
  22400.00, 20160.00, 19040.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0162Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-245', 'prog-244', 'quotation', 'MASB/QT/TRA/2026/0162Rev1',
  22400.00, '2026-07-13', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Ai, Data Analitik & Programming (Beginner)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-245', '0110Rev4', 'Ai, Data Analitik & Programming (Beginner)', 
  'Ai, Data Analitik & Programming (Beginner)', 'org-084', 'Kementerian Perdagangan Dalam Negeri (KPDN)',
  'Non-Training', 'in_person', '2026-07-21', '2026-07-21',
  NULL, 'Hariz', 'Hariz',
  39600.00, 35640.00, 33660.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0110Rev4'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-246', 'prog-245', 'quotation', 'MASB/QT/TRA/2026/0110Rev4',
  39600.00, '2026-07-21', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Course Workbooks (20 Participants)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-246', '0110Rev4', 'Course Workbooks (20 Participants)', 
  'Course Workbooks (20 Participants)', 'org-084', 'Kementerian Perdagangan Dalam Negeri (KPDN)',
  'Non-Training', 'in_person', '2026-07-21', '2026-07-21',
  NULL, 'Hariz', 'Hariz',
  800.00, 720.00, 680.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0110Rev4'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-247', 'prog-246', 'quotation', 'MASB/QT/TRA/2026/0110Rev4',
  800.00, '2026-07-21', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Professional Fees for Two (2) Trainers'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-247', '0110Rev4', 'Professional Fees for Two (2) Trainers', 
  'Professional Fees for Two (2) Trainers', 'org-084', 'Kementerian Perdagangan Dalam Negeri (KPDN)',
  'Non-Training', 'in_person', '2026-07-21', '2026-07-21',
  NULL, 'Hariz', 'Hariz',
  9400.00, 8460.00, 7990.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0110Rev4'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-248', 'prog-247', 'quotation', 'MASB/QT/TRA/2026/0110Rev4',
  9400.00, '2026-07-21', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Latihan Pengaturcaraan dan Data Analitik Menggunakan Teknologi Kecerdasan Buatan (Artificial Intelligence – AI)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-248', '0110Rev5', 'Latihan Pengaturcaraan dan Data Analitik Menggunakan Teknologi Kecerdasan Buatan (Artificial Intelligence – AI)', 
  'Latihan Pengaturcaraan dan Data Analitik Menggunakan Teknologi Kecerdasan Buatan (Artificial Intelligence – AI)', 'org-084', 'Kementerian Perdagangan Dalam Negeri (KPDN)',
  'Non-Training', 'in_person', '2026-07-21', '2026-07-21',
  NULL, 'Hariz', 'Hariz',
  39600.00, 35640.00, 33660.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0110Rev5'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-249', 'prog-248', 'quotation', 'MASB/QT/TRA/2026/0110Rev5',
  39600.00, '2026-07-21', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Latihan Pengaturcaraan dan Data Analitik Menggunakan Teknologi Kecerdasan Buatan (Artificial Intelligence – AI)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-249', '0110Rev6', 'Latihan Pengaturcaraan dan Data Analitik Menggunakan Teknologi Kecerdasan Buatan (Artificial Intelligence – AI)', 
  'Latihan Pengaturcaraan dan Data Analitik Menggunakan Teknologi Kecerdasan Buatan (Artificial Intelligence – AI)', 'org-084', 'Kementerian Perdagangan Dalam Negeri (KPDN)',
  'Non-Training', 'in_person', '2026-07-21', '2026-07-21',
  NULL, 'Hariz', 'Hariz',
  40400.00, 36360.00, 34340.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0110Rev6'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-250', 'prog-249', 'quotation', 'MASB/QT/TRA/2026/0110Rev6',
  40400.00, '2026-07-21', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Latihan Pengaturcaraan dan Data Analitik Menggunakan Teknologi Kecerdasan Buatan (Artificial Intelligence – AI)'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-250', '0110Rev6', 'Latihan Pengaturcaraan dan Data Analitik Menggunakan Teknologi Kecerdasan Buatan (Artificial Intelligence – AI)', 
  'Latihan Pengaturcaraan dan Data Analitik Menggunakan Teknologi Kecerdasan Buatan (Artificial Intelligence – AI)', 'org-084', 'Kementerian Perdagangan Dalam Negeri (KPDN)',
  'Non-Training', 'in_person', '2026-07-21', '2026-07-21',
  NULL, 'Hariz', 'Hariz',
  9400.00, 8460.00, 7990.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0110Rev6'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-251', 'prog-250', 'quotation', 'MASB/QT/TRA/2026/0110Rev6',
  9400.00, '2026-07-21', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-251', '0170', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-069', 'Sarawak Skills',
  'Non-Training', 'in_person', '2026-07-27', '2026-07-27',
  NULL, 'Hariz', 'Hariz',
  32238.00, 29014.20, 27402.30,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0170'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-252', 'prog-251', 'quotation', 'MASB/QT/TRA/2026/0170',
  32238.00, '2026-07-27', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'KPJ Healthcare University'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-126', 'KPJ Healthcare University', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Digital Skills'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-252', '0171', 'Digital Skills', 
  'Digital Skills', 'org-126', 'KPJ Healthcare University',
  'Non-Training', 'in_person', '2026-07-27', '2026-07-27',
  NULL, 'Adilah', 'Adilah',
  19440.00, 17496.00, 16524.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0171'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-253', 'prog-252', 'quotation', 'MASB/QT/TRA/2026/0171',
  19440.00, '2026-07-27', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI & Digital Health in Clinical Practice'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-253', '0172', 'AI & Digital Health in Clinical Practice', 
  'AI & Digital Health in Clinical Practice', 'org-126', 'KPJ Healthcare University',
  'Non-Training', 'in_person', '2026-07-27', '2026-07-27',
  NULL, 'Adilah', 'Adilah',
  29160.00, 26244.00, 24786.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0172'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-254', 'prog-253', 'quotation', 'MASB/QT/TRA/2026/0172',
  29160.00, '2026-07-27', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Data Analytics'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-254', '0173', 'Data Analytics', 
  'Data Analytics', 'org-126', 'KPJ Healthcare University',
  'Non-Training', 'in_person', '2026-07-27', '2026-07-27',
  NULL, 'Adilah', 'Adilah',
  29160.00, 26244.00, 24786.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0173'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-255', 'prog-254', 'quotation', 'MASB/QT/TRA/2026/0173',
  29160.00, '2026-07-27', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI For Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-255', '0154Rev1', 'AI For Office Productivity', 
  'AI For Office Productivity', 'org-049', 'MOSTI',
  'Non-Training', 'in_person', '2026-07-30', '2026-07-30',
  NULL, 'Hariz', 'Hariz',
  50000.00, 45000.00, 42500.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0154Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-256', 'prog-255', 'quotation', 'MASB/QT/TRA/2026/0154Rev1',
  50000.00, '2026-07-30', 'accepted',
  'Hariz', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Asia E University'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-127', 'Asia E University', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-256', '0174', 'Train-The-Trainer (TTT): Certified AI Trainer ', 
  'Train-The-Trainer (TTT): Certified AI Trainer ', 'org-127', 'Asia E University',
  'Non-Training', 'in_person', '2026-07-30', '2026-07-30',
  NULL, NULL, NULL,
  0.00, 0.00, 0.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0174'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-257', 'prog-256', 'quotation', 'MASB/QT/TRA/2026/0174',
  0.00, '2026-07-30', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI For Office Productivity'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-257', '0175', 'AI For Office Productivity', 
  'AI For Office Productivity', 'org-127', 'Asia E University',
  'Non-Training', 'in_person', '2026-07-30', '2026-07-30',
  NULL, NULL, NULL,
  0.00, 0.00, 0.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0175'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-258', 'prog-257', 'quotation', 'MASB/QT/TRA/2026/0175',
  0.00, '2026-07-30', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Public'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-258', '0176', 'Public', 
  'Public', 'org-127', 'Asia E University',
  'AI & Data Science', 'in_person', '2026-07-30', '2026-07-30',
  NULL, NULL, NULL,
  0.00, 0.00, 0.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0176'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-259', 'prog-258', 'quotation', 'MASB/QT/TRA/2026/0176',
  0.00, '2026-07-30', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Vitalglow Essential Retail'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-128', 'Vitalglow Essential Retail', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-259', '0168Rev', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-128', 'Vitalglow Essential Retail',
  'AI & Data Science', 'in_person', '2026-07-30', '2026-07-30',
  NULL, NULL, NULL,
  200.00, 180.00, 170.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0168Rev'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-260', 'prog-259', 'quotation', 'MASB/QT/TRA/2026/0168Rev',
  200.00, '2026-07-30', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Sabah Ports Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-129', 'Sabah Ports Sdn Bhd', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-260', '0177', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-129', 'Sabah Ports Sdn Bhd',
  'Non-Training', 'in_person', '2026-08-02', '2026-08-02',
  NULL, 'Sholihin', 'Sholihin',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0177'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-261', 'prog-260', 'quotation', 'MASB/QT/TRA/2026/0177',
  21000.00, '2026-08-02', 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Cleanroom and Semiconductor Fabrication Processes'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-261', '0178', 'Cleanroom and Semiconductor Fabrication Processes', 
  'Cleanroom and Semiconductor Fabrication Processes', 'org-015', 'SIRIM Academy',
  'Non-Training', 'in_person', '2026-08-04', '2026-08-04',
  NULL, 'Adilah', 'Adilah',
  15608.70, 14047.83, 13267.40,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0178'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-262', 'prog-261', 'quotation', 'MASB/QT/TRA/2026/0178',
  15608.70, '2026-08-04', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Hanan Medicare'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-130', 'Hanan Medicare', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-262', '0179', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-130', 'Hanan Medicare',
  'Non-Training', 'in_person', '2026-08-04', '2026-08-04',
  NULL, 'Sholihin', 'Sholihin',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0179'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-263', 'prog-262', 'quotation', 'MASB/QT/TRA/2026/0179',
  21000.00, '2026-08-04', 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-263', '0155Rev1', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-115', 'Koperasi Ladang Berhad',
  'Non-Training', 'in_person', '2026-08-06', '2026-08-06',
  NULL, 'Sholihin', 'Sholihin',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0155Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-264', 'prog-263', 'quotation', 'MASB/QT/TRA/2026/0155Rev1',
  22680.00, '2026-08-06', 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-264', '0180', 'Train-The-Trainer (TTT): Certified AI Trainer ', 
  'Train-The-Trainer (TTT): Certified AI Trainer ', 'org-113', 'INTAN',
  'Non-Training', 'in_person', '2026-08-06', '2026-08-06',
  NULL, 'Sholihin', 'Sholihin',
  50000.00, 45000.00, 42500.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0180'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-265', 'prog-264', 'quotation', 'MASB/QT/TRA/2026/0180',
  50000.00, '2026-08-06', 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Institut Aminuddin Baki (IAB)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-131', 'Institut Aminuddin Baki (IAB)', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Canva AI & NotebookLM'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-265', '0181', 'Canva AI & NotebookLM', 
  'Canva AI & NotebookLM', 'org-131', 'Institut Aminuddin Baki (IAB)',
  'Non-Training', 'in_person', '2026-08-06', '2026-08-06',
  NULL, 'Sholihin', 'Sholihin',
  49500.00, 44550.00, 42075.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0181'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-266', 'prog-265', 'quotation', 'MASB/QT/TRA/2026/0181',
  49500.00, '2026-08-06', 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Malaysia Transformer'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-132', 'Malaysia Transformer', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-266', '0182', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-132', 'Malaysia Transformer',
  'Non-Training', 'in_person', '2026-08-06', '2026-08-06',
  NULL, 'Sholihin', 'Sholihin',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0182'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-267', 'prog-266', 'quotation', 'MASB/QT/TRA/2026/0182',
  22680.00, '2026-08-06', 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-267', '0183', 'Train-The-Trainer (TTT): Certified AI Trainer ', 
  'Train-The-Trainer (TTT): Certified AI Trainer ', 'org-132', 'Malaysia Transformer',
  'Non-Training', 'in_person', '2026-08-10', '2026-08-10',
  NULL, NULL, NULL,
  81000.00, 72900.00, 68850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0183'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-268', 'prog-267', 'quotation', 'MASB/QT/TRA/2026/0183',
  81000.00, '2026-08-10', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI for Training Aid & Assistant'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-268', '0184', 'AI for Training Aid & Assistant', 
  'AI for Training Aid & Assistant', 'org-037', 'Pahang Skills',
  'Non-Training', 'in_person', '2026-08-11', '2026-08-11',
  NULL, NULL, NULL,
  32400.00, 29160.00, 27540.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0184'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-269', 'prog-268', 'quotation', 'MASB/QT/TRA/2026/0184',
  32400.00, '2026-08-11', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-269', '0185', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-080', 'MCMC',
  'Non-Training', 'in_person', '2026-08-12', '2026-08-12',
  NULL, NULL, NULL,
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0185'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-270', 'prog-269', 'quotation', 'MASB/QT/TRA/2026/0185',
  22680.00, '2026-08-12', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MMU'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-133', 'MMU', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Train-The-Trainer (TTT): Certified AI Trainer '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-270', '0186', 'Train-The-Trainer (TTT): Certified AI Trainer ', 
  'Train-The-Trainer (TTT): Certified AI Trainer ', 'org-133', 'MMU',
  'Non-Training', 'in_person', '2026-08-12', '2026-08-12',
  NULL, NULL, NULL,
  52920.00, 47628.00, 44982.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0186'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-271', 'prog-270', 'quotation', 'MASB/QT/TRA/2026/0186',
  52920.00, '2026-08-12', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'APD'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-134', 'APD', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Semiconductor Industry Placement Programme for Undergraduates and Working Adults'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-271', '0187', 'Semiconductor Industry Placement Programme for Undergraduates and Working Adults', 
  'Semiconductor Industry Placement Programme for Undergraduates and Working Adults', 'org-134', 'APD',
  'Non-Training', 'in_person', '2026-08-13', '2026-08-13',
  NULL, 'Adilah', 'Adilah',
  11900.00, 10710.00, 10115.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0187'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-272', 'prog-271', 'quotation', 'MASB/QT/TRA/2026/0187',
  11900.00, '2026-08-13', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Semiconductor Manufacturing Process & Analysis Programme'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-272', '0188', 'Semiconductor Manufacturing Process & Analysis Programme', 
  'Semiconductor Manufacturing Process & Analysis Programme', 'org-134', 'APD',
  'Non-Training', 'in_person', '2026-08-13', '2026-08-13',
  NULL, 'Adilah', 'Adilah',
  35000.00, 31500.00, 29750.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0188'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-273', 'prog-272', 'quotation', 'MASB/QT/TRA/2026/0188',
  35000.00, '2026-08-13', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Semiconductor Fabrication Processes '
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-273', '0189', 'Semiconductor Fabrication Processes ', 
  'Semiconductor Fabrication Processes ', 'org-119', 'UTP',
  'Non-Training', 'in_person', '2026-08-13', '2026-08-13',
  NULL, 'Adilah', 'Adilah',
  17820.00, 16038.00, 15147.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0189'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-274', 'prog-273', 'quotation', 'MASB/QT/TRA/2026/0189',
  17820.00, '2026-08-13', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI Vibe Coding for Custom Application Development'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-274', '0190', 'AI Vibe Coding for Custom Application Development', 
  'AI Vibe Coding for Custom Application Development', 'org-060', 'PUNB',
  'Non-Training', 'in_person', '2026-08-14', '2026-08-14',
  NULL, 'Adilah', 'Adilah',
  31500.00, 28350.00, 26775.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0190'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-275', 'prog-274', 'quotation', 'MASB/QT/TRA/2026/0190',
  31500.00, '2026-08-14', 'accepted',
  'Adilah', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MHSB'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-135', 'MHSB', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Mastering Patient Complaint Management in Rehabilitation Services'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-275', '0191', 'Mastering Patient Complaint Management in Rehabilitation Services', 
  'Mastering Patient Complaint Management in Rehabilitation Services', 'org-135', 'MHSB',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Zalina', 'Zalina',
  0.00, 0.00, 0.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0191'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-276', 'prog-275', 'quotation', 'MASB/QT/TRA/2026/0191',
  0.00, NULL, 'accepted',
  'Zalina', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Tanzania'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-136', 'Tanzania', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'Digital Skills'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-276', '0192', 'Digital Skills', 
  'Digital Skills', 'org-136', 'Tanzania',
  'Non-Training', 'in_person', '2026-08-16', '2026-08-16',
  NULL, NULL, NULL,
  108000.00, 97200.00, 91800.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0192'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-277', 'prog-276', 'quotation', 'MASB/QT/TRA/2026/0192',
  108000.00, '2026-08-16', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-277', '0155Rev2', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-115', 'Koperasi Ladang Berhad',
  'Non-Training', 'in_person', '2026-08-16', '2026-08-16',
  NULL, 'Sholihin', 'Sholihin',
  22680.00, 20412.00, 19278.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0155Rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-278', 'prog-277', 'quotation', 'MASB/QT/TRA/2026/0155Rev2',
  22680.00, '2026-08-16', 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: 'Canva AI & NotebookLM'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-278', '0181Rev1', 'Canva AI & NotebookLM', 
  'Canva AI & NotebookLM', 'org-131', 'Institut Aminuddin Baki (IAB)',
  'Non-Training', 'in_person', '2026-08-16', '2026-08-16',
  NULL, NULL, NULL,
  29700.00, 26730.00, 25245.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0181Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-279', 'prog-278', 'quotation', 'MASB/QT/TRA/2026/0181Rev1',
  29700.00, '2026-08-16', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Institut Terjemahan & Buku Malaysia'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-137', 'Institut Terjemahan & Buku Malaysia', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-279', '0193', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-137', 'Institut Terjemahan & Buku Malaysia',
  'Non-Training', 'in_person', '2026-08-17', '2026-08-17',
  NULL, NULL, NULL,
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0193'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-280', 'prog-279', 'quotation', 'MASB/QT/TRA/2026/0193',
  21000.00, '2026-08-17', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'IKMA'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-138', 'IKMA', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI Thesis Writing for PhD & Master'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-280', '0194', 'AI Thesis Writing for PhD & Master', 
  'AI Thesis Writing for PhD & Master', 'org-138', 'IKMA',
  'Non-Training', 'in_person', '2026-08-17', '2026-08-17',
  NULL, NULL, NULL,
  11340.00, 10206.00, 9639.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0194'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-281', 'prog-280', 'quotation', 'MASB/QT/TRA/2026/0194',
  11340.00, '2026-08-17', 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UniKL (Dr Ismi)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-139', 'UniKL (Dr Ismi)', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AUTONOMOUS AI SYSTEMS DEVELOPMENT USING N8N, LOCAL LLMS AND AI AGENTS'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-281', '0195', 'AUTONOMOUS AI SYSTEMS DEVELOPMENT USING N8N, LOCAL LLMS AND AI AGENTS', 
  'AUTONOMOUS AI SYSTEMS DEVELOPMENT USING N8N, LOCAL LLMS AND AI AGENTS', 'org-139', 'UniKL (Dr Ismi)',
  'Non-Training', 'in_person', '2026-08-18', '2026-08-18',
  NULL, 'Zalina', 'Zalina',
  31500.00, 28350.00, 26775.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0195'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-282', 'prog-281', 'quotation', 'MASB/QT/TRA/2026/0195',
  31500.00, '2026-08-18', 'accepted',
  'Zalina', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Boustead Properties Berhad'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-140', 'Boustead Properties Berhad', 'Private', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: 'AI System Thinking:Training for Efficiency'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-282', '0196', 'AI System Thinking:Training for Efficiency', 
  'AI System Thinking:Training for Efficiency', 'org-140', 'Boustead Properties Berhad',
  'Non-Training', 'in_person', '2026-08-18', '2026-08-18',
  NULL, 'Sholihin', 'Sholihin',
  21000.00, 18900.00, 17850.00,
  'draft'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0196'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-283', 'prog-282', 'quotation', 'MASB/QT/TRA/2026/0196',
  21000.00, '2026-08-18', 'accepted',
  'Sholihin', NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MIMOS Berhad'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-001', 'MIMOS Berhad', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46028'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-001', '2026', '46028', 
  '46028', 'org-inv-001', 'MIMOS Berhad',
  'Non-Training', 'in_person', '2026-04-05', '2026-04-05',
  NULL, 'Adilah', 'Adilah',
  8500.00, 7650.00, 7225.00,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000016/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-002', 'prog-inv-001', 'invoice', '95000016/2026',
  8500.00, '2026-04-05', 'paid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MA/QT/2026(0001)'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-002', 'prog-inv-001', 'quotation', 'MA/QT/2026(0001)',
  8500.00, '2026-04-05', 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'FGV R&D Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-002', 'FGV R&D Sdn Bhd', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46051'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-002', '2026', '46051', 
  '46051', 'org-inv-002', 'FGV R&D Sdn Bhd',
  'Non-Training', 'in_person', '2026-04-08', '2026-04-08',
  NULL, 'Adilah', 'Adilah',
  1842.59, 1658.33, 1566.20,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000015/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-003', 'prog-inv-002', 'invoice', '95000015/2026',
  1842.59, '2026-04-08', 'paid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0038'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-003', 'prog-inv-002', 'quotation', 'MASB/QT/TRA/2026/0038',
  1842.59, '2026-04-08', 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'NUMIX Engineering Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-003', 'NUMIX Engineering Sdn Bhd', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46051'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-003', '2026', '46051', 
  '46051', 'org-inv-003', 'NUMIX Engineering Sdn Bhd',
  'Non-Training', 'in_person', '2026-04-12', '2026-04-12',
  NULL, 'Adilah', 'Adilah',
  7370.37, 6633.33, 6264.81,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000017/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-004', 'prog-inv-003', 'invoice', '95000017/2026',
  7370.37, '2026-04-12', 'paid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0042'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-004', 'prog-inv-003', 'quotation', 'MASB/QT/TRA/2026/0042',
  7370.37, '2026-04-12', 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Efficient Frontier Consulting'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-004', 'Efficient Frontier Consulting', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46067'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-004', '2026', '46067', 
  '46067', 'org-inv-004', 'Efficient Frontier Consulting',
  'Non-Training', 'in_person', '2026-01-30', '2026-01-30',
  NULL, 'Adilah', 'Adilah',
  2000.00, 1800.00, 1700.00,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000063/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-005', 'prog-inv-004', 'invoice', '95000063/2026',
  2000.00, '2026-01-30', 'paid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0037'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-005', 'prog-inv-004', 'quotation', 'MASB/QT/TRA/2026/0037',
  2000.00, '2026-01-30', 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'University College TATI'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-005', 'University College TATI', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46063'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-005', '2026', '46063', 
  '46063', 'org-inv-005', 'University College TATI',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Omar', 'Omar',
  4166.67, 3750.00, 3541.67,
  'unpaid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000019/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-006', 'prog-inv-005', 'invoice', '95000019/2026',
  4166.67, NULL, 'unpaid',
  'Omar', 'Omar', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0066'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-006', 'prog-inv-005', 'quotation', 'MASB/QT/TRA/2026/0066',
  4166.67, NULL, 'accepted',
  'Omar', 'Omar', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: '46086'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-006', '2026', '46086', 
  '46086', 'org-inv-001', 'MIMOS Berhad',
  'Non-Training', 'in_person', '2026-06-01', '2026-06-01',
  NULL, 'Adilah', 'Adilah',
  9722.22, 8750.00, 8263.89,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000047/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-007', 'prog-inv-006', 'invoice', '95000047/2026',
  9722.22, '2026-06-01', 'paid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0040'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-007', 'prog-inv-006', 'quotation', 'MASB/QT/TRA/2026/0040',
  9722.22, '2026-06-01', 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'SIRIM Academy'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-007', 'SIRIM Academy', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46087'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-007', '2026', '46087', 
  '46087', 'org-inv-007', 'SIRIM Academy',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Adilah', 'Adilah',
  19443.52, 17499.17, 16526.99,
  'unpaid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000024/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-008', 'prog-inv-007', 'invoice', '95000024/2026',
  19443.52, NULL, 'unpaid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0011rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-008', 'prog-inv-007', 'quotation', 'MASB/QT/TRA/2026/0011rev1',
  19443.52, NULL, 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Pahang Skills Development Center'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-008', 'Pahang Skills Development Center', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46092'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-008', '2026', '46092', 
  '46092', 'org-inv-008', 'Pahang Skills Development Center',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Adilah', 'Adilah',
  8000.00, 7200.00, 6800.00,
  'unpaid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000025/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-009', 'prog-inv-008', 'invoice', '95000025/2026',
  8000.00, NULL, 'unpaid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0075'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-009', 'prog-inv-008', 'quotation', 'MASB/QT/TRA/2026/0075',
  8000.00, NULL, 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UniKL MIDI'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-009', 'UniKL MIDI', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46118'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-009', '2026', '46118', 
  '46118', 'org-inv-009', 'UniKL MIDI',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Adilah', 'Adilah',
  1360.00, 1224.00, 1156.00,
  'unpaid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000026/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-010', 'prog-inv-009', 'invoice', '95000026/2026',
  1360.00, NULL, 'unpaid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0077rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-010', 'prog-inv-009', 'quotation', 'MASB/QT/TRA/2026/0077rev2',
  1360.00, NULL, 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MIMOS Services Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-010', 'MIMOS Services Sdn Bhd', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46115'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-010', '2026', '46115', 
  '46115', 'org-inv-010', 'MIMOS Services Sdn Bhd',
  'Non-Training', 'in_person', '2026-05-19', '2026-05-19',
  NULL, 'Adilah', 'Adilah',
  19444.44, 17500.00, 16527.77,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000251/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-011', 'prog-inv-010', 'invoice', '95000251/2026',
  19444.44, '2026-05-19', 'paid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0036rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-011', 'prog-inv-010', 'quotation', 'MASB/QT/TRA/2026/0036rev2',
  19444.44, '2026-05-19', 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Interscience Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-011', 'Interscience Sdn Bhd', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46133'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-011', '2026', '46133', 
  '46133', 'org-inv-011', 'Interscience Sdn Bhd',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Adilah', 'Adilah',
  2300.00, 2070.00, 1955.00,
  'unpaid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000252/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-012', 'prog-inv-011', 'invoice', '95000252/2026',
  2300.00, NULL, 'unpaid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0072'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-012', 'prog-inv-011', 'quotation', 'MASB/QT/TRA/2026/0072',
  2300.00, NULL, 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: '46115'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-012', '2026', '46115', 
  '46115', 'org-inv-010', 'MIMOS Services Sdn Bhd',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Adilah', 'Adilah',
  26800.00, 24120.00, 22780.00,
  'unpaid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '13000029/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-013', 'prog-inv-012', 'invoice', '13000029/2026',
  26800.00, NULL, 'unpaid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0036rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-013', 'prog-inv-012', 'quotation', 'MASB/QT/TRA/2026/0036rev2',
  26800.00, NULL, 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Exzellent Profis Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-013', 'Exzellent Profis Sdn Bhd', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46136'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-013', '2026', '46136', 
  '46136', 'org-inv-013', 'Exzellent Profis Sdn Bhd',
  'Non-Training', 'in_person', '2026-06-01', '2026-06-01',
  NULL, 'Adilah', 'Adilah',
  8101.85, 7291.67, 6886.57,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000048/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-014', 'prog-inv-013', 'invoice', '95000048/2026',
  8101.85, '2026-06-01', 'paid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0070rev4'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-014', 'prog-inv-013', 'quotation', 'MASB/QT/TRA/2026/0070rev4',
  8101.85, '2026-06-01', 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: '46136'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-014', '2026', '46136', 
  '46136', 'org-inv-008', 'Pahang Skills Development Center',
  'Non-Training', 'in_person', '2026-06-04', '2026-06-04',
  NULL, 'Adilah', 'Adilah',
  14000.00, 12600.00, 11900.00,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000049/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-015', 'prog-inv-014', 'invoice', '95000049/2026',
  14000.00, '2026-06-04', 'paid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0073'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-015', 'prog-inv-014', 'quotation', 'MASB/QT/TRA/2026/0073',
  14000.00, '2026-06-04', 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UPM'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-015', 'UPM', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46141'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-015', '2026', '46141', 
  '46141', 'org-inv-015', 'UPM',
  'Non-Training', 'in_person', '2026-04-27', '2026-04-27',
  NULL, 'Adilah', 'Adilah',
  1085.00, 976.50, 922.25,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000039/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-016', 'prog-inv-015', 'invoice', '95000039/2026',
  1085.00, '2026-04-27', 'paid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0096'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-016', 'prog-inv-015', 'quotation', 'MASB/QT/TRA/2026/0096',
  1085.00, '2026-04-27', 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'PPKS Ilmu Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-016', 'PPKS Ilmu Sdn Bhd', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '45996'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-016', '2026', '45996', 
  '45996', 'org-inv-016', 'PPKS Ilmu Sdn Bhd',
  'Non-Training', 'in_person', '2026-06-07', '2026-06-07',
  NULL, 'Adilah', 'Adilah',
  6944.44, 6250.00, 5902.77,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000040/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-017', 'prog-inv-016', 'invoice', '95000040/2026',
  6944.44, '2026-06-07', 'paid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'Last Year Quo by Farrah'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-017', 'prog-inv-016', 'quotation', 'Last Year Quo by Farrah',
  6944.44, '2026-06-07', 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Perbadanan Usahawan Nasional Berhad (PUNB)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-017', 'Perbadanan Usahawan Nasional Berhad (PUNB)', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46156'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-017', '2026', '46156', 
  '46156', 'org-inv-017', 'Perbadanan Usahawan Nasional Berhad (PUNB)',
  'Non-Training', 'in_person', '2026-05-25', '2026-05-25',
  NULL, 'Adilah', 'Adilah',
  19444.44, 17500.00, 16527.77,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000054/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-018', 'prog-inv-017', 'invoice', '95000054/2026',
  19444.44, '2026-05-25', 'paid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0076rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-018', 'prog-inv-017', 'quotation', 'MASB/QT/TRA/2026/0076rev2',
  19444.44, '2026-05-25', 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MINDEF'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-018', 'MINDEF', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46157'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-018', '2026', '46157', 
  '46157', 'org-inv-018', 'MINDEF',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Farrah', 'Farrah',
  46285.00, 41656.50, 39342.25,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000053/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-019', 'prog-inv-018', 'invoice', '95000053/2026',
  46285.00, NULL, 'paid',
  'Farrah', 'Farrah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0032rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-019', 'prog-inv-018', 'quotation', 'MASB/QT/TRA/2026/0032rev2',
  46285.00, NULL, 'accepted',
  'Farrah', 'Farrah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UniKL BMI (Cohort 1)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-019', 'UniKL BMI (Cohort 1)', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46162'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-019', '2026', '46162', 
  '46162', 'org-inv-019', 'UniKL BMI (Cohort 1)',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Adilah', 'Adilah',
  1470.00, 1323.00, 1249.50,
  'unpaid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000061/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-020', 'prog-inv-019', 'invoice', '95000061/2026',
  1470.00, NULL, 'unpaid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0078rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-020', 'prog-inv-019', 'quotation', 'MASB/QT/TRA/2026/0078rev2',
  1470.00, NULL, 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UniKL BMI (Cohort 2)'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-020', 'UniKL BMI (Cohort 2)', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46176'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-020', '2026', '46176', 
  '46176', 'org-inv-020', 'UniKL BMI (Cohort 2)',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Adilah', 'Adilah',
  1470.00, 1323.00, 1249.50,
  'unpaid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000062/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-021', 'prog-inv-020', 'invoice', '95000062/2026',
  1470.00, NULL, 'unpaid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0095'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-021', 'prog-inv-020', 'quotation', 'MASB/QT/TRA/2026/0095',
  1470.00, NULL, 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'MIMOS Solutions Sdn Bhd'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-021', 'MIMOS Solutions Sdn Bhd', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46178'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-021', '2026', '46178', 
  '46178', 'org-inv-021', 'MIMOS Solutions Sdn Bhd',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Adilah', 'Adilah',
  19444.44, 17500.00, 16527.77,
  'unpaid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000078/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-022', 'prog-inv-021', 'invoice', '95000078/2026',
  19444.44, NULL, 'unpaid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0083rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-022', 'prog-inv-021', 'quotation', 'MASB/QT/TRA/2026/0083rev2',
  19444.44, NULL, 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: '46178'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-022', 'Pending @ Fin', '46178', 
  '46178', 'org-inv-021', 'MIMOS Solutions Sdn Bhd',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Adilah', 'Adilah',
  15000.00, 13500.00, 12750.00,
  'unpaid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): 'Pending @ Fin'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-023', 'prog-inv-022', 'invoice', 'Pending @ Fin',
  15000.00, NULL, 'unpaid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0083rev2'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-023', 'prog-inv-022', 'quotation', 'MASB/QT/TRA/2026/0083rev2',
  15000.00, NULL, 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: '46163'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-023', '2026', '46163', 
  '46163', 'org-inv-021', 'MIMOS Solutions Sdn Bhd',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Adilah', 'Adilah',
  5000.00, 4500.00, 4250.00,
  'unpaid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '13000012/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-024', 'prog-inv-023', 'invoice', '13000012/2026',
  5000.00, NULL, 'unpaid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0085'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-024', 'prog-inv-023', 'quotation', 'MASB/QT/TRA/2026/0085',
  5000.00, NULL, 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Wice Solution'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-024', 'Wice Solution', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46155'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-024', '2026', '46155', 
  '46155', 'org-inv-024', 'Wice Solution',
  'Non-Training', 'in_person', '2026-05-10', '2026-05-10',
  NULL, 'Abu Said', 'Abu Said',
  1625.00, 1462.50, 1381.25,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000036/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-025', 'prog-inv-024', 'invoice', '95000036/2026',
  1625.00, '2026-05-10', 'paid',
  'Abu Said', 'Abu Said', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0093'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-025', 'prog-inv-024', 'quotation', 'MASB/QT/TRA/2026/0093',
  1625.00, '2026-05-10', 'accepted',
  'Abu Said', 'Abu Said', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Knowledgecom'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-025', 'Knowledgecom', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46387'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-025', '2026', '46387', 
  '46387', 'org-inv-025', 'Knowledgecom',
  'Non-Training', 'in_person', '2026-05-27', '2026-05-27',
  NULL, 'Abu Said', 'Abu Said',
  16900.37, 15210.33, 14365.31,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000199/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-026', 'prog-inv-025', 'invoice', '95000199/2026',
  16900.37, '2026-05-27', 'paid',
  'Abu Said', 'Abu Said', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'N/A Comission base'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-026', 'prog-inv-025', 'quotation', 'N/A Comission base',
  16900.37, '2026-05-27', 'accepted',
  'Abu Said', 'Abu Said', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: '45933'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-026', '2026', '45933', 
  '45933', 'org-inv-004', 'Efficient Frontier Consulting',
  'Non-Training', 'in_person', '2026-03-11', '2026-03-11',
  NULL, 'Adilah', 'Adilah',
  31111.11, 28000.00, 26444.44,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000052/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-027', 'prog-inv-026', 'invoice', '95000052/2026',
  31111.11, '2026-03-11', 'paid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: '45933'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-027', '2025', '45933', 
  '45933', 'org-inv-004', 'Efficient Frontier Consulting',
  'Non-Training', 'in_person', '2026-03-11', '2026-03-11',
  NULL, 'Adilah', 'Adilah',
  51851.85, 46666.67, 44074.07,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000748/2025'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-028', 'prog-inv-027', 'invoice', '95000748/2025',
  51851.85, '2026-03-11', 'paid',
  'Adilah', 'Adilah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'No quotation - price stated in TOE'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-028', 'prog-inv-027', 'quotation', 'No quotation - price stated in TOE',
  51851.85, '2026-03-11', 'accepted',
  'Adilah', 'Adilah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'KETENGAH'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-028', 'KETENGAH', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46182'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-028', '2026', '46182', 
  '46182', 'org-inv-028', 'KETENGAH',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Farrah', 'Farrah',
  21000.00, 18900.00, 17850.00,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000060/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-029', 'prog-inv-028', 'invoice', '95000060/2026',
  21000.00, NULL, 'paid',
  'Farrah', 'Farrah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'No quotation - price stated in TOE'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-029', 'prog-inv-028', 'quotation', 'No quotation - price stated in TOE',
  21000.00, NULL, 'accepted',
  'Farrah', 'Farrah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Kementerian Sumber Manusia'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-029', 'Kementerian Sumber Manusia', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46188'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-029', '2026', '46188', 
  '46188', 'org-inv-029', 'Kementerian Sumber Manusia',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Farrah', 'Farrah',
  23145.83, 20831.25, 19673.96,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000033/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-030', 'prog-inv-029', 'invoice', '95000033/2026',
  23145.83, NULL, 'paid',
  'Farrah', 'Farrah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0035Rev1'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-030', 'prog-inv-029', 'quotation', 'MASB/QT/TRA/2026/0035Rev1',
  23145.83, NULL, 'accepted',
  'Farrah', 'Farrah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Kementerian Digital'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-030', 'Kementerian Digital', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46199'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-030', '2026', '46199', 
  '46199', 'org-inv-030', 'Kementerian Digital',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Farrah', 'Farrah',
  25925.00, 23332.50, 22036.25,
  'completed'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000073/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-031', 'prog-inv-030', 'invoice', '95000073/2026',
  25925.00, NULL, 'paid',
  'Farrah', 'Farrah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'JMTI'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-031', 'JMTI', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46199'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-031', '2026', '46199', 
  '46199', 'org-inv-031', 'JMTI',
  'Non-Training', 'in_person', '2026-07-12', '2026-07-12',
  NULL, 'Fuziah', 'Fuziah',
  445500.00, 400950.00, 378675.00,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000070/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-032', 'prog-inv-031', 'invoice', '95000070/2026',
  445500.00, '2026-07-12', 'paid',
  'Fuziah', 'Fuziah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0119Rev3'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-032', 'prog-inv-031', 'quotation', 'MASB/QT/TRA/2026/0119Rev3',
  445500.00, '2026-07-12', 'accepted',
  'Fuziah', 'Fuziah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'KBS'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-032', 'KBS', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46189'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-032', '2026', '46189', 
  '46189', 'org-inv-032', 'KBS',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Farrah', 'Farrah',
  22037.04, 19833.34, 18731.48,
  'completed'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000076/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-033', 'prog-inv-032', 'invoice', '95000076/2026',
  22037.04, NULL, 'paid',
  'Farrah', 'Farrah', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0080'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-033', 'prog-inv-032', 'quotation', 'MASB/QT/TRA/2026/0080',
  22037.04, NULL, 'accepted',
  'Farrah', 'Farrah', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'INSKEN'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-033', 'INSKEN', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46183'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-033', '2026', '46183', 
  '46183', 'org-inv-033', 'INSKEN',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Omar', 'Omar',
  25000.00, 22500.00, 21250.00,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000063/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-034', 'prog-inv-033', 'invoice', '95000063/2026',
  25000.00, NULL, 'paid',
  'Omar', 'Omar', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'CPS-MIMOS'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-034', 'CPS-MIMOS', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '45846'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-034', '2026', '45846', 
  '45846', 'org-inv-034', 'CPS-MIMOS',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Zalina', 'Zalina',
  29650.00, 26685.00, 25202.50,
  'completed'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '13000022/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-035', 'prog-inv-034', 'invoice', '13000022/2026',
  29650.00, NULL, 'paid',
  'Zalina', 'Zalina', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: '46211'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-035', '2026', '46211', 
  '46211', 'org-inv-034', 'CPS-MIMOS',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Zalina', 'Zalina',
  10650.00, 9585.00, 9052.50,
  'completed'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '13000023/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-036', 'prog-inv-035', 'invoice', '13000023/2026',
  10650.00, NULL, 'paid',
  'Zalina', 'Zalina', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'Dr. Hamidah'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-036', 'Dr. Hamidah', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46062'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-036', '2026', '46062', 
  '46062', 'org-inv-036', 'Dr. Hamidah',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, NULL, NULL,
  1388.89, 1250.00, 1180.56,
  'paid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000008/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-037', 'prog-inv-036', 'invoice', '95000008/2026',
  1388.89, NULL, 'paid',
  NULL, NULL, 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0064'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-037', 'prog-inv-036', 'quotation', 'MASB/QT/TRA/2026/0064',
  1388.89, NULL, 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Organizer: 'UC TATI'
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES ('org-inv-037', 'UC TATI', 'Government', true)
ON CONFLICT (name) DO NOTHING;


-- Programme: '46136'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-037', '2026', '46136', 
  '46136', 'org-inv-037', 'UC TATI',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, NULL, NULL,
  9259.26, 8333.33, 7870.37,
  'completed'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000058/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-038', 'prog-inv-037', 'invoice', '95000058/2026',
  9259.26, NULL, 'paid',
  NULL, NULL, 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0047'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-038', 'prog-inv-037', 'quotation', 'MASB/QT/TRA/2026/0047',
  9259.26, NULL, 'accepted',
  NULL, NULL, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme: '46197'
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  'prog-inv-038', '2026', '46197', 
  '46197', 'org-inv-001', 'MIMOS Berhad',
  'Non-Training', 'in_person', NULL, NULL,
  NULL, 'Zalina', 'Zalina',
  19444.44, 17500.00, 16527.77,
  'unpaid'
) ON CONFLICT (programme_code) DO NOTHING;


-- Financial Doc (Invoice): '95000081/2026'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-inv-039', 'prog-inv-038', 'invoice', '95000081/2026',
  19444.44, NULL, 'unpaid',
  'Zalina', 'Zalina', 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Financial Doc (Quotation): 'MASB/QT/TRA/2026/0132'
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  'fin-qt-039', 'prog-inv-038', 'quotation', 'MASB/QT/TRA/2026/0132',
  19444.44, NULL, 'accepted',
  'Zalina', 'Zalina', 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;


-- Programme Cost: '95000060/2026'
INSERT INTO public.programme_costs (
  id, programme_id, cost_of_sales, mimos_academy_cost, net_profit, profit_percentage
) VALUES (
  'cost-025', 'prog-inv-019',
  NULL, NULL,
  NULL, NULL
) ON CONFLICT (programme_id) DO UPDATE SET
  cost_of_sales = EXCLUDED.cost_of_sales,
  mimos_academy_cost = EXCLUDED.mimos_academy_cost,
  net_profit = EXCLUDED.net_profit,
  profit_percentage = EXCLUDED.profit_percentage;


-- Programme Cost: '95000033/2026'
INSERT INTO public.programme_costs (
  id, programme_id, cost_of_sales, mimos_academy_cost, net_profit, profit_percentage
) VALUES (
  'cost-026', 'prog-inv-069',
  NULL, NULL,
  NULL, NULL
) ON CONFLICT (programme_id) DO UPDATE SET
  cost_of_sales = EXCLUDED.cost_of_sales,
  mimos_academy_cost = EXCLUDED.mimos_academy_cost,
  net_profit = EXCLUDED.net_profit,
  profit_percentage = EXCLUDED.profit_percentage;


-- Programme Cost: '95000073/2026'
INSERT INTO public.programme_costs (
  id, programme_id, cost_of_sales, mimos_academy_cost, net_profit, profit_percentage
) VALUES (
  'cost-027', 'prog-inv-050',
  NULL, NULL,
  NULL, NULL
) ON CONFLICT (programme_id) DO UPDATE SET
  cost_of_sales = EXCLUDED.cost_of_sales,
  mimos_academy_cost = EXCLUDED.mimos_academy_cost,
  net_profit = EXCLUDED.net_profit,
  profit_percentage = EXCLUDED.profit_percentage;


-- Programme Cost: '95000070/2026'
INSERT INTO public.programme_costs (
  id, programme_id, cost_of_sales, mimos_academy_cost, net_profit, profit_percentage
) VALUES (
  'cost-028', 'prog-inv-011',
  NULL, NULL,
  NULL, NULL
) ON CONFLICT (programme_id) DO UPDATE SET
  cost_of_sales = EXCLUDED.cost_of_sales,
  mimos_academy_cost = EXCLUDED.mimos_academy_cost,
  net_profit = EXCLUDED.net_profit,
  profit_percentage = EXCLUDED.profit_percentage;


-- Programme Cost: '95000076/2026'
INSERT INTO public.programme_costs (
  id, programme_id, cost_of_sales, mimos_academy_cost, net_profit, profit_percentage
) VALUES (
  'cost-029', 'prog-inv-004',
  NULL, NULL,
  NULL, NULL
) ON CONFLICT (programme_id) DO UPDATE SET
  cost_of_sales = EXCLUDED.cost_of_sales,
  mimos_academy_cost = EXCLUDED.mimos_academy_cost,
  net_profit = EXCLUDED.net_profit,
  profit_percentage = EXCLUDED.profit_percentage;


-- Programme Cost: '95000063/2026'
INSERT INTO public.programme_costs (
  id, programme_id, cost_of_sales, mimos_academy_cost, net_profit, profit_percentage
) VALUES (
  'cost-030', 'prog-inv-014',
  NULL, NULL,
  0.31, 0.31
) ON CONFLICT (programme_id) DO UPDATE SET
  cost_of_sales = EXCLUDED.cost_of_sales,
  mimos_academy_cost = EXCLUDED.mimos_academy_cost,
  net_profit = EXCLUDED.net_profit,
  profit_percentage = EXCLUDED.profit_percentage;


-- Programme Cost: '95000058/2026'
INSERT INTO public.programme_costs (
  id, programme_id, cost_of_sales, mimos_academy_cost, net_profit, profit_percentage
) VALUES (
  'cost-031', 'prog-inv-077',
  NULL, NULL,
  NULL, NULL
) ON CONFLICT (programme_id) DO UPDATE SET
  cost_of_sales = EXCLUDED.cost_of_sales,
  mimos_academy_cost = EXCLUDED.mimos_academy_cost,
  net_profit = EXCLUDED.net_profit,
  profit_percentage = EXCLUDED.profit_percentage;


-- Programme Cost: 'advance payment'
INSERT INTO public.programme_costs (
  id, programme_id, cost_of_sales, mimos_academy_cost, net_profit, profit_percentage
) VALUES (
  'cost-032', 'prog-inv-005',
  NULL, NULL,
  NULL, NULL
) ON CONFLICT (programme_id) DO UPDATE SET
  cost_of_sales = EXCLUDED.cost_of_sales,
  mimos_academy_cost = EXCLUDED.mimos_academy_cost,
  net_profit = EXCLUDED.net_profit,
  profit_percentage = EXCLUDED.profit_percentage;


-- Programme Cost: '95000008/2026'
INSERT INTO public.programme_costs (
  id, programme_id, cost_of_sales, mimos_academy_cost, net_profit, profit_percentage
) VALUES (
  'cost-034', 'prog-inv-055',
  NULL, NULL,
  NULL, NULL
) ON CONFLICT (programme_id) DO UPDATE SET
  cost_of_sales = EXCLUDED.cost_of_sales,
  mimos_academy_cost = EXCLUDED.mimos_academy_cost,
  net_profit = EXCLUDED.net_profit,
  profit_percentage = EXCLUDED.profit_percentage;

COMMIT;
