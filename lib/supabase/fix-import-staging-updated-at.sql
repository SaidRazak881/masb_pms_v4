-- =====================================================================
-- FIX-IMPORT-STAGING-UPDATED-AT.sql  —  pembaikan 🔴 DP-7 (2026-09-04)
-- =====================================================================
--
-- KECACATAN YANG DIBETULKAN
-- -------------------------
-- `lib/supabase/updated-at-triggers.sql` (Fasa 6G) memasang trigger
-- `set_updated_at` BEFORE UPDATE pada senarai jadual yang termasuk
-- **`import_staging`**. Tetapi `schema-import-staging.sql` **TIDAK**
-- mentakrifkan lajur `updated_at` pada jadual itu.
--
-- Badan trigger ialah:
--     CREATE OR REPLACE FUNCTION public.set_updated_at() ... AS $$
--     BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
--
-- Jadi pada pangkalan data di mana `import_staging` tiada `updated_at`,
-- **SETIAP** UPDATE ke atas jadual itu gagal dengan:
--
--     ERROR: record "new" has no field "updated_at"   (SQLSTATE 42703)
--
-- KESAN KEPADA SISTEM
-- -------------------
-- `sync_import_transaction` — RPC teras import Excel — meng-UPDATE
-- `import_staging` pada **dua** tempat:
--     lib/supabase/sync-import-transaction.sql:321
--     lib/supabase/sync-import-transaction.sql:727
--
-- Maka jika lajur ini hilang di live, **aliran import Excel gagal
-- sepenuhnya** (sync adalah ATOMIK, jadi seluruh batch gagal).
--
-- Fasa 6G dilaporkan ✅ SELESAI dengan **G1 = 12/12** trigger dipasang.
-- Senarai sasaran dalam fail itu ialah 11 jadual + `profiles` = **12**,
-- jadi G1=12/12 menunjukkan trigger **memang** dipasang pada
-- `import_staging` di live.
--
-- ⚠️ **TETAPI** sama ada live benar-benar rosak bergantung kepada sama ada
-- `import_staging` di live mempunyai lajur `updated_at` yang **tiada dalam
-- repo**. Repo ini sudah diketahui mempunyai drift sedemikian — contohnya
-- `invoices.sst_amount` wujud di live tetapi tidak ditakrifkan dalam repo
-- (laporan PROMPT-7A, J1b). Jadi ia MESTI disahkan dengan bukti, bukan
-- diandaikan. Query K1/K2/K3 dalam `docs/PROMPT-8A-J1-READONLY.md`
-- disediakan tepat untuk tujuan itu.
--
-- JENIS PEMBAIKAN
-- ---------------
-- ADDITIF sepenuhnya:
--   ✅ 1 ADD COLUMN IF NOT EXISTS
--   ❌ tiada DROP, tiada DELETE, tiada TRUNCATE, tiada RENAME
--   ❌ tidak menyentuh data perniagaan
-- Idempoten: selamat dijalankan berulang kali.
--
-- NOTA REKA BENTUK: lajur ditambah sebagai NOT NULL DEFAULT now(), jadi
-- baris sedia ada menerima cap masa pemasangan. Ini sedikit mengelirukan
-- secara semantik (baris lama tidak benar-benar "dikemas kini" pada masa
-- itu), tetapi ia sengaja dipilih kerana alternatifnya — mengisi daripada
-- `created_at` dengan UPDATE — TIDAK BOLEH berfungsi: trigger BEFORE UPDATE
-- akan menimpa nilai itu dengan now() juga. Menambah lajur tidak mencetus
-- trigger, jadi laluan ini adalah yang paling selamat dan paling ringkas.
-- =====================================================================

ALTER TABLE public.import_staging
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN public.import_staging.updated_at IS
  'Ditambah oleh pembaikan DP-7 (2026-09-04). Diperlukan kerana '
  'updated-at-triggers.sql (Fasa 6G) memasang trigger BEFORE UPDATE '
  'set_updated_at pada jadual ini; tanpa lajur ini setiap UPDATE gagal '
  'dengan "record new has no field updated_at", yang memecahkan '
  'sync_import_transaction (baris 321 & 727). Baris sedia ada menerima '
  'cap masa pemasangan.';


-- =====================================================================
-- PENGESAHAN (read-only)
-- =====================================================================
-- K1: lajur wujud?
-- SELECT 'K1' AS check_name, column_name, data_type, is_nullable, column_default
--   FROM information_schema.columns
--  WHERE table_schema='public' AND table_name='import_staging'
--    AND column_name='updated_at';
-- Jangkaan SELEPAS pembaikan: 1 baris, timestamptz, NO, now()
-- Jangkaan SEBELUM pembaikan: 0 baris  ← ini bermakna live ROSAK
--
-- K2: trigger dipasang pada import_staging?
-- SELECT 'K2' AS check_name, tg.tgname,
--        p.proname AS fungsi, n.nspname AS skema_fungsi
--   FROM pg_trigger tg
--   JOIN pg_class c    ON c.oid = tg.tgrelid
--   JOIN pg_namespace cn ON cn.oid = c.relnamespace
--   JOIN pg_proc p     ON p.oid = tg.tgfoid
--   JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE cn.nspname='public' AND c.relname='import_staging' AND NOT tg.tgisinternal;
--
-- K3: bukti berkelakuan — UPDATE mesti berjaya SELEPAS pembaikan.
--     (Jalankan HANYA selepas kelulusan; ini menulis data.)
-- BEGIN;
-- UPDATE public.import_staging SET record_action = record_action LIMIT 1;
-- ROLLBACK;
-- Jangkaan SELEPAS pembaikan: tiada ralat.
-- Jangkaan SEBELUM pembaikan: ERROR record "new" has no field "updated_at"
