-- =====================================================================
-- EVIDENCE FILE — RECORDED FROM LIVE, NOT AUTHORED. DO NOT RUN.
-- =====================================================================
-- Sumber    : Supabase production `lmenmfsbjgxfhnykkgow`, probe P1
-- Tarikh    : 2026-09-05 (PROMPT-8C-DRIFT-UNLOCK-PROGRAMME.md)
-- Kaedah    : `pg_get_functiondef()`, ditampal verbatim oleh ChatGPT
-- Panel     : DP-24.3 (Posisi C — probe, rekod, kemudian putuskan)
--
-- MENGAPA FAIL INI WUJUD
-- ----------------------
-- `public.unlock_programme` wujud di production tetapi TIADA definisinya di
-- mana-mana fail repo (grep *.sql/*.ts/*.tsx/*.mjs = sifar), walaupun ia
-- dirujuk dalam 8 dokumen prompt sejak Fasa 4B sebagai RPC tulis terlarang.
-- Selagi repo tidak setara live, ramalan Arena akan terus salah — kelas
-- kesilapan yang sama yang melahirkan DP-14.2.
--
-- Fail ini diletakkan dalam `lib/supabase/legacy/` (BUKAN `lib/supabase/`)
-- dengan SENGAJA:
--   * ia tidak dipasang oleh mana-mana urutan migration;
--   * ia tidak diimbas oleh `scripts/test-konvensyen-privilej.mjs` (pengawal
--     itu mengimbas `lib/supabase/*.sql` sahaja), jadi ia tidak mencemarkan
--     BASELINE konvensyen;
--   * ia tidak menambah `unlock_programme` kepada inventori Seksyen 2 — itu
--     keputusan berasingan (DP-25) yang memerlukan migration aditif.
--
-- 🔴 JANGAN jalankan fail ini. Ia akan mencipta semula satu RPC tulis yang
--    memintas aliran `request_programme_unlock` -> `review_programme_unlock`
--    dan TIDAK menulis `log_audit()`.
--
-- DUA PENEMUAN DARIPADA DEFINISI INI (lihat DP-25)
-- -------------------------------------------------
--   1. Ia memanggil `private.has_role('head_governance')` — skema `private`
--      TIDAK wujud dalam repo. Kerana fungsi ini SECURITY INVOKER, ia tidak
--      mewarisi rantaian `public.current_user_role()` yang 8C keraskan. Jadi
--      DP-17.4(a) (akaun blocked kehilangan kuasa) BELUM terbukti tertutup
--      untuk laluan ini — tertakluk kepada definisi `private.has_role`.
--   2. Tiada panggilan `log_audit()` dan tiada baris
--      `programme_unlock_requests` → unlock tanpa jejak audit, memintas
--      aliran governance yang direkodkan dalam `governance-lock.sql`.
--
-- Postur privilej (P2, live): pemilik=postgres, volatility=v,
--   security_definer=false, search_path=public,pg_temp (dipin),
--   privilej={postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}
--   → anon TIDAK mempunyai EXECUTE (ditutup oleh sapuan 8C).
-- =====================================================================

CREATE OR REPLACE FUNCTION public.unlock_programme(p_programme_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS programmes
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$ DECLARE v_programme public.programmes; BEGIN IF NOT private.has_role('head_governance') THEN RAISE EXCEPTION 'Only head_governance can unlock a programme.' USING ERRCODE='42501'; END IF; UPDATE public.programmes SET governance_lock_status='unlocked',locked_at=NULL,locked_by=NULL,lock_reason=p_reason,updated_at=now() WHERE id=p_programme_id RETURNING * INTO v_programme; IF NOT FOUND THEN RAISE EXCEPTION 'Programme % was not found.',p_programme_id USING ERRCODE='P0002'; END IF; RETURN v_programme; END; $function$
