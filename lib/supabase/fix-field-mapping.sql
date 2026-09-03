-- =====================================================================
-- FIX-FIELD-MAPPING.sql
-- Pembetulan kecacatan pemetaan data — GAP-ANALISIS §4.1–4.4
-- =====================================================================
--
-- KEPUTUSAN PENGGUNA (2026-09-04): "baiki kerosakan data" dahulu.
--
-- MASALAH YANG DIBETULKAN
-- -----------------------
-- Import Excel menulis MAKNA YANG SALAH ke lajur yang betul:
--
--   1. `trainer` (jurulatih)          → `invoices.account_manager`
--   2. `client_name` (nama SYARIKAT)  → `invoices.pic_name` (INDIVIDU)
--   3. amaun quotation                → `invoices.po_value_excl_tax`
--   4. `SST 8% Amount` (amaun CUKAI)  → `amount` — nilai RM1,555.56
--      disimpan sebagai nilai sebut harga yang sepatutnya RM21,000
--      (ralat 13.5×)
--
-- Punca (1)–(3): lajur perniagaan sebenar dalam fail sumber TIDAK PERNAH
-- ditangkap oleh parser, jadi RPC terpaksa meneka daripada medan yang ada.
-- Punca (4): alias `"amount"` memadankan "SST 8% Amount" dengan skor 115
-- (padanan tepat + bonus), mengalahkan "Final Price" (skor 85).
--
-- (1)–(4) telah dibetulkan dalam `lib/excel-parser.ts`. Fail ini
-- menyediakan lajur DB supaya nilai yang BETUL ada tempat untuk disimpan.
--
-- SKOP FAIL INI
-- -------------
-- ✅ HANYA tambah lajur baharu (ALTER TABLE ... ADD COLUMN IF NOT EXISTS)
-- ✅ Idempoten — selamat dijalankan berulang kali
-- ❌ TIDAK DROP apa-apa objek
-- ❌ TIDAK ubah data sedia ada (tiada UPDATE/DELETE)
-- ❌ TIDAK ubah RLS, trigger, atau polisi
-- ❌ TIDAK cipta jadual `quotations` — itu Fasa seterusnya (GAP-ANALISIS §3.1)
--
-- NOTA REKA BENTUK (keputusan pengguna #1, 2026-09-04)
-- ----------------------------------------------------
-- Quotation wujud SEBELUM program diluluskan, jadi ia mesti jadi entiti
-- berdiri sendiri dengan `programme_id` boleh NULL. Itu kerja Fasa
-- seterusnya. Buat masa ini quotation masih menumpang `invoices`;
-- pembetulan di bawah memastikan sekurang-kurangnya NILAI yang disimpan
-- adalah betul, dan §4.4 (perlanggaran UNIQUE) tidak lagi menggagalkan
-- keseluruhan batch.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. import_staging — lajur untuk data perniagaan yang kini ditangkap
-- ---------------------------------------------------------------------
-- Sebelum ini parser hanya ada 11 medan kanonik, jadi 44 daripada 49 lajur
-- Quotation Tracker dibuang (hanya tinggal dalam `raw_payload` JSON yang
-- tidak boleh dicapai oleh laporan atau UI).

ALTER TABLE public.import_staging
  ADD COLUMN IF NOT EXISTS final_price      numeric(14,2),
  ADD COLUMN IF NOT EXISTS unit_price       numeric(14,2),
  ADD COLUMN IF NOT EXISTS quantity         numeric(14,2),
  ADD COLUMN IF NOT EXISTS sst_amount       numeric(14,2),
  ADD COLUMN IF NOT EXISTS discount_pct     numeric(8,4),
  ADD COLUMN IF NOT EXISTS total_incl_sst   numeric(14,2),
  ADD COLUMN IF NOT EXISTS total_excl_sst   numeric(14,2),
  ADD COLUMN IF NOT EXISTS account_manager  text,
  ADD COLUMN IF NOT EXISTS pic_name         text,
  ADD COLUMN IF NOT EXISTS pic_contact_no   text,
  ADD COLUMN IF NOT EXISTS pic_email        text,
  ADD COLUMN IF NOT EXISTS po_no            text,
  ADD COLUMN IF NOT EXISTS quotation_ref    text,
  ADD COLUMN IF NOT EXISTS payment_status_raw text,
  ADD COLUMN IF NOT EXISTS net_profit       numeric(14,2),
  ADD COLUMN IF NOT EXISTS commission       numeric(14,2),
  ADD COLUMN IF NOT EXISTS prepared_by      text;

COMMENT ON COLUMN public.import_staging.sst_amount IS
  'Amaun CUKAI (SST). TIDAK PERNAH digunakan sebagai amaun rekod — lihat GAP-ANALISIS §4.1.';
COMMENT ON COLUMN public.import_staging.final_price IS
  'Nilai muktamad sebut harga (selepas diskaun, termasuk SST). Keutamaan #1 untuk amount.';
COMMENT ON COLUMN public.import_staging.pic_name IS
  'Individu bertanggungjawab (Person In Charge). BUKAN nama syarikat pelanggan.';
COMMENT ON COLUMN public.import_staging.account_manager IS
  'Pengurus akaun. BUKAN nama jurulatih — lihat GAP-ANALISIS §4.1.';

-- ---------------------------------------------------------------------
-- 2. invoices — lajur pelanggan & butiran PIC
-- ---------------------------------------------------------------------
-- `invoices` tiada lajur pelanggan langsung; nama syarikat pelanggan
-- ditulis ke `pic_name` (medan individu) sebagai ganti.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS client_name    text,
  ADD COLUMN IF NOT EXISTS pic_contact_no text,
  ADD COLUMN IF NOT EXISTS pic_email      text,
  ADD COLUMN IF NOT EXISTS sst            numeric(10,2),
  ADD COLUMN IF NOT EXISTS quantity       numeric(14,2),
  ADD COLUMN IF NOT EXISTS unit_price     numeric(14,2);

COMMENT ON COLUMN public.invoices.client_name IS
  'Nama syarikat PELANGGAN. Berbeza daripada pic_name (individu). Lihat GAP-ANALISIS §3.5.';

-- `sst` sedia ada dalam schema-master.sql:718 tetapi mungkin tiada di live
-- jika jadual dicipta daripada versi terawal — ALTER di atas idempoten.

-- ---------------------------------------------------------------------
-- 3. financial_docs — butiran PIC yang sama
-- ---------------------------------------------------------------------
-- `financial_docs` sudah ada pic_name/pic_email/pic_phone dan
-- account_manager (schema-master.sql:641–646), jadi tiada lajur baharu.
-- Disahkan untuk mengelak ALTER yang tidak perlu.

-- =====================================================================
-- PENGESAHAN (read-only — jalankan selepas pemasangan)
-- =====================================================================
-- Jangkaan: 17 baris untuk import_staging, 6 baris untuk invoices.
--
-- SELECT 'mapping_fix_columns' AS check_name,
--        table_name, column_name, data_type, is_nullable
--   FROM information_schema.columns
--  WHERE table_schema = 'public'
--    AND (
--      (table_name = 'import_staging' AND column_name IN (
--        'final_price','unit_price','quantity','sst_amount','discount_pct',
--        'total_incl_sst','total_excl_sst','account_manager','pic_name',
--        'pic_contact_no','pic_email','po_no','quotation_ref','payment_status_raw',
--        'net_profit','commission','prepared_by'))
--      OR
--      (table_name = 'invoices' AND column_name IN (
--        'client_name','pic_contact_no','pic_email','sst','quantity','unit_price'))
--    )
--  ORDER BY table_name, column_name;
--
-- Dan sahkan TIADA data sedia ada yang berubah (mesti 0):
--
-- SELECT 'rows_untouched' AS check_name,
--        (SELECT count(*) FROM public.import_staging) AS staging_rows,
--        (SELECT count(*) FROM public.invoices)       AS invoice_rows;
-- -- Bandingkan dengan kiraan SEBELUM pemasangan; mesti sama.
