-- ============================================================================
-- FIX: TAMBAH KATEGORI PROGRAM — Room Rental / Consultancy / Certification
-- ----------------------------------------------------------------------------
-- Tujuan: pastikan enum `programme_category` di DB live mempunyai nilai
-- 'Room Rental', 'Consultancy' dan 'Certification' supaya borang "Program
-- Baharu" (kategori baharu) tidak ditolak oleh PostgreSQL.
--
-- Fail ini IDEMPOTENT — selamat dijalankan berulang kali.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'programme_category' AND t.typnamespace = 'public'::regnamespace
      AND e.enumlabel = 'Room Rental'
  ) THEN
    ALTER TYPE public.programme_category ADD VALUE 'Room Rental';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'programme_category' AND t.typnamespace = 'public'::regnamespace
      AND e.enumlabel = 'Consultancy'
  ) THEN
    ALTER TYPE public.programme_category ADD VALUE 'Consultancy';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'programme_category' AND t.typnamespace = 'public'::regnamespace
      AND e.enumlabel = 'Certification'
  ) THEN
    ALTER TYPE public.programme_category ADD VALUE 'Certification';
  END IF;
END
$$;

-- ============================================================================
-- PENGESAHAN
-- ============================================================================
-- SELECT e.enumlabel
-- FROM pg_enum e
-- JOIN pg_type t ON e.enumtypid = t.oid
-- WHERE t.typname = 'programme_category' AND t.typnamespace = 'public'::regnamespace
-- ORDER BY e.enumsortorder;
-- Jangkaan termasuk: ... 'Room Rental', 'Consultancy', 'Certification'
