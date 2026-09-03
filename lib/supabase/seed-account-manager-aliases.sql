-- =====================================================================
-- SEED-ACCOUNT-MANAGER-ALIASES.sql
-- Keputusan pengguna 2026-09-04 (Panel DP-8) — direkodkan sebagai data
-- =====================================================================
--
-- PRASYARAT: `client-master.sql` (8A) dan `account-manager-resolution.sql`
-- (8A-2) MESTI sudah dipasang.
--
-- KEPUTUSAN PENGGUNA YANG DIREKODKAN DI SINI
-- -------------------------------------------
-- Pengguna (2026-09-04), menjawab soalan terbuka Panel DP-8:
--
--     "Untuk dp8, dua dua tu masukkan Fuzy aka Fuziah"
--
-- Tafsiran yang dilaksanakan:
--   1. `Fuzy`              -> Fuziah   (pengesahan nama panggilan)
--   2. `Fuzy / Dila`       -> Fuziah   (sel berbilang orang)
--   3. `Fuzy / Sholihin `  -> Fuziah   (sel berbilang orang, ruang hujung)
--
-- KESAN YANG MESTI DIFAHAMI (direkodkan, bukan disembunyikan)
-- -----------------------------------------------------------
-- * `Fuzy` (8 baris invois + 1 baris staging) kini diagih kepada Fuziah.
-- * `Fuzy / Dila` (4 baris) diagih SEPENUHNYA kepada Fuziah — **Dila
--   (Adilah) tidak menerima kredit** untuk 4 baris itu.
-- * `Fuzy / Sholihin ` (2 baris) diagih SEPENUHNYA kepada Fuziah —
--   **Sholihin tidak menerima kredit** untuk 2 baris itu.
-- * Ini akan mempengaruhi laporan komisen Fasa 8F. Jejak audit merekodkan
--   `sel_berbilang_orang = true` untuk kedua-duanya supaya ia boleh
--   diaudit atau dibatalkan kemudian melalui `am_revoke_alias()`.
--
-- `Ow Zi Qi` (3 baris) TIDAK termasuk dalam keputusan ini dan KEKAL NULL —
-- nama itu tiada dalam senarai 18 staf `User Profiles Mapping.xlsx`.
--
-- SKOP
-- ----
-- ✅ INSERT ... ON CONFLICT sahaja (idempoten)
-- ✅ Menyelesaikan Fuziah melalui nama, bukan UUID keras — jadi ia berfungsi
--    pada mana-mana persekitaran tanpa perlu tahu id-nya
-- ❌ TIADA UPDATE/DELETE pada data perniagaan
-- ❌ TIDAK mengisi `account_manager_id` — itu kerja
--    `am_backfill_account_manager()`, di bawah HARD GATE berasingan
-- =====================================================================

DO $$
DECLARE
  v_fuziah uuid;
  v_who    uuid;
  v_raw    text;
  v_bil    integer;
BEGIN
  -- Selesaikan Fuziah melalui nama. Jika tiada, BERHENTI dengan ralat yang
  -- jelas — jangan senyap-senyap memetakan kepada orang yang salah.
  SELECT up.id INTO v_fuziah
    FROM public.user_profiles up
   WHERE public.normalize_person_name(up.full_name) = 'fuziah';

  IF v_fuziah IS NULL THEN
    RAISE EXCEPTION 'Fuziah tidak ditemui dalam user_profiles — seed DP-8 dibatalkan. Sahkan nama staf di live dahulu.'
      USING ERRCODE = 'P0002';
  END IF;

  IF (SELECT count(*) FROM public.user_profiles up
       WHERE public.normalize_person_name(up.full_name) = 'fuziah') > 1 THEN
    RAISE EXCEPTION 'Lebih daripada satu staf bernama Fuziah — seed DP-8 dibatalkan kerana kabur.'
      USING ERRCODE = '22023';
  END IF;

  -- Siapa yang merekodkan keputusan ini
  v_who := public.current_user_id();

  FOREACH v_raw IN ARRAY ARRAY['Fuzy', 'Fuzy / Dila', 'Fuzy / Sholihin']
  LOOP
    INSERT INTO public.account_manager_aliases
      (raw_text, user_id, confirmed_by, notes)
    VALUES
      (v_raw, v_fuziah, v_who,
       'Keputusan pengguna 2026-09-04 (Panel DP-8): "dua dua tu masukkan Fuzy aka Fuziah"')
    ON CONFLICT (raw_text) DO UPDATE
      SET user_id      = EXCLUDED.user_id,
          confirmed_by = EXCLUDED.confirmed_by,
          confirmed_at = now(),
          notes        = EXCLUDED.notes;

    PERFORM public.log_audit(
      'account_manager_aliases',
      (SELECT al.id FROM public.account_manager_aliases al
        WHERE al.raw_text = v_raw LIMIT 1),
      'created',
      NULL,
      jsonb_build_object('raw_text', v_raw, 'user_id', v_fuziah,
                         'full_name', 'Fuziah'),
      jsonb_build_object('fasa', '8A-2', 'fungsi', 'seed_dp8',
                         'asas', 'keputusan pengguna 2026-09-04',
                         'sel_berbilang_orang', (v_raw LIKE '%/%'))
    );
  END LOOP;

  SELECT count(*) INTO v_bil FROM public.account_manager_aliases;
  RAISE NOTICE 'seed DP-8 selesai: 3 alias direkodkan (jumlah alias kini %)', v_bil;
END
$$;


-- =====================================================================
-- PENGESAHAN (read-only)
-- =====================================================================
-- S1: ketiga-tiga alias wujud dan menunjuk Fuziah
-- SELECT 'S1' AS check_name, al.raw_text, up.full_name, al.notes
--   FROM public.account_manager_aliases al
--   JOIN public.user_profiles up ON up.id = al.user_id
--  ORDER BY al.raw_text;
-- Jangkaan: 3 baris, semua full_name = 'Fuziah'
--
-- S2: penyelesai kini mengembalikan Fuziah untuk ketiga-tiganya
-- SELECT 'S2' AS check_name, k.raw,
--        (SELECT up.full_name FROM public.user_profiles up
--          WHERE up.id = public.resolve_account_manager(k.raw)) AS kepada
--   FROM (VALUES ('Fuzy'), ('Fuzy / Dila'), ('Fuzy / Sholihin'),
--                ('Fuzy / Sholihin '), ('  FUZY  ')) AS k(raw);
-- Jangkaan: KELIMA-LIMANYA 'Fuziah'
-- (baris ke-4 membuktikan ruang hujung data sebenar dikendali;
--  baris ke-5 membuktikan varian huruf besar/kecil)
--
-- S3: liputan keseluruhan selepas seed
-- SELECT 'S3' AS check_name, kategori, count(*) AS bilangan,
--        sum(jumlah_baris) AS jumlah_baris
--   FROM public.am_unresolved_values() GROUP BY kategori ORDER BY kategori;
-- Jangkaan: SELESAI = 11 nilai; TIADA_PADANAN = 1 nilai ('Ow Zi Qi', 3 baris);
--           BERBILANG_ORANG = 0
