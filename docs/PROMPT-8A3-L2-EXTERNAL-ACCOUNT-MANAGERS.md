# PROMPT 8A-3 / L2 — Langkah 2 — `external-account-managers.sql` (DP-9)

> **Untuk:** ChatGPT (mempunyai akses penuh Supabase + Vercel + GitHub)
> **Daripada:** Arena (menulis kod/SQL/ujian; **tidak** melaksanakan kerja produksi)
> **Tarikh:** 2026-09-04
> **Repo:** `SaidRazak881/masb_pms_v4` · **Branch:** `arena/01a06274-masb-pms-v4`
> **Projek Supabase:** `lmenmfsbjgxfhnykkgow` (20 aksara)
> **Jenis:** 🔴 **HARD GATE — pemasangan live. Sudah DILULUSKAN pengguna.**
> **Dijana oleh:** `node scripts/generate-8a3-install-prompts.mjs` — **jangan
> sunting tangan**; SQL di bawah ditulis terus daripada bait fail.

---

## 0. Mengapa SQL dibenamkan dalam prompt ini (DP-12)

Anda melaporkan dengan betul bahawa connector GitHub **memotong kandungan fail
panjang**, jadi anda tidak dapat memperoleh byte-stream penuh untuk dihantar ke
`Supabase.apply_migration` — dan anda enggan membina semula SQL daripada
potongan. Itu betul.

**Maka SQL penuh dibenamkan di bawah (Seksyen 3).** Anda kini memegang teks
penuh dalam konteks, jadi:

1. Tiada lagi kebergantungan pada connector untuk kandungan.
2. **Lapis 2 akhirnya boleh anda kira sendiri** — tulis teks itu ke sandbox anda
   (jika ada) dan ukur bait / aksara / baris / kiraan `CREATE`, malah SHA-256
   yang sebelum ini mustahil.
3. Rantai integriti ditutup di hujung Arena: `scripts/test-doc-references.mjs`
   seksyen [7] mengekstrak SQL daripada prompt ini dan menegaskan **blob SHA,
   SHA-256, bait, baris, aksara dan kiraan CREATE sama dengan fail sebenar**.

**Prasyarat:** **Langkah 1 mesti sudah dipasang dan dilaporkan.** Fail ini tidak bergantung pada fungsi Langkah 1, tetapi urutan 1→2→3→4 adalah wajib supaya laporan boleh dijejak.

**Objek yang dipasang langkah ini:** Jadual `external_account_managers` + 3 fungsi + 4 polisi RLS + 2 indeks. Merekodkan "orang luar" sebagai **sudah diputuskan**, berbeza daripada "belum diputuskan".



---

## 1. Keadaan live yang SUDAH disahkan (jangan ulang)

Daripada J0 dan J1 yang anda sendiri jalankan terhadap live
`lmenmfsbjgxfhnykkgow`:

| Fakta | Nilai | Implikasi |
|---|---|---|
| `user_profiles` | **20** | 18 staf Excel + `Admin` (super_admin) + `test` (blocked). **Bukan anomali.** |
| J0b nama ternormal berulang | `[]` | tiada kabur pada padanan tepat |
| J0c token pertama berulang | `[]` | tiada kabur pada langkah token |
| J0d `Fuziah` | `bilangan = 1` (unik) | seed Langkah 4 tidak akan berhenti |
| `audit_logs` | **44** | K10 dijangka **> 44** selepas seed |
| `import_staging` / `invoices` / `organizers` / `programmes` | 1124 / 6 / 12 / 14 | **mesti TIDAK berubah** |
| Nilai `Account Manager` live | **SIFAR** (J1f = `[]`) | **K8 = 0 baris = LULUS** |
| `import_staging.updated_at` | **WUJUD** (`timestamptz`, `NOT NULL`, `now()`) | DP-7 **ditutup**; Langkah 5 **LANGKAU** |
| Jadual `public` | **18** | K11 dijangka **20** selepas semua 4 langkah |
| Blob SHA keempat-empat fail | **sepadan** | Lapis 1 **LULUS** (anda sudah laporkan) |

**JANGAN jalankan J0 semula. JANGAN jalankan `fix-import-staging-updated-at.sql`.**

---

## 2. SAHKAN integriti teks di bawah SEBELUM menjalankan

Bandingkan dengan teks yang anda terima dalam Seksyen 3.

| Cap jari | Nilai jangkaan |
|---|---|
| **Lapis 1 — Git blob SHA** | `1e555af8f78472fe7427a513b4682a8ccbc5f381` |
| Lapis 2 — bait (UTF-8) | **13526** |
| Lapis 2 — baris | **336** |
| Lapis 2 — aksara (titik kod Unicode) | **13498** |
| Lapis 2 — `CREATE TABLE` / `FUNCTION` / `POLICY` / `INDEX` | **1 / 3 / 4 / 2** |
| Lapis 2 — baris pertama | `-- =====================================================================` |
| Lapis 2 — baris terakhir (bukan kosong) | `-- Ujian berkelakuan: scripts/test-account-manager-resolution.mjs seksyen [Q].` |
| Pilihan — SHA-256 | `a124b9cfa9f086b6079977b2fca1140a9d06aa565e24c553a3735bdecf772793` |

**Cara mengesahkan:**

- **Jika anda ada sandbox/kod:** tulis teks antara pagar di Seksyen 3 ke fail
  **tepat sebagaimana adanya** (jangan tambah atau buang baris kosong terakhir),
  kemudian kira `sha256sum`, `wc -c`, `wc -l`, dan
  `git hash-object`. Bandingkan semua dengan jadual di atas.
- **Jika tiada sandbox:** sahkan sekurang-kurangnya **baris pertama**,
  **baris terakhir**, dan bahawa tiada bahagian yang kelihatan terpotong
  (contohnya komen yang terhenti separuh ayat). Kemudian laporkan
  `⏳ cap jari tidak dikira — tiada sandbox` dan **teruskan**.

> ⚠️ **Pengesan integriti ≠ kelulusan kandungan.** Kandungan diluluskan oleh
> **pengguna**; cap jari hanya mengesahkan ia tiba tanpa rosak. Jangan guna
> "integriti disahkan" sebagai alasan untuk melonggarkan mana-mana larangan.

🔴 **Jika mana-mana cap jari TIDAK sepadan: BERHENTI.** Laporkan nilai yang anda
dapat vs jangkaan, saiz bait, dan baris terakhir yang anda lihat. **JANGAN**
lengkapkan bahagian yang hilang, **JANGAN** bina semula, **JANGAN** jalankan SQL
separa. Rujuk fail asal untuk perbandingan: https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/lib/supabase/external-account-managers.sql

---

## 3. SQL PENUH — jalankan ini apa adanya

Kandungan fail ialah **semua baris di antara pagar pembuka dan penutup**, tepat
seperti ada. Fail asal: `lib/supabase/external-account-managers.sql`

````sql
-- =====================================================================
-- EXTERNAL-ACCOUNT-MANAGERS.sql  —  Fasa 8A-2 (Panel DP-9, 2026-09-04)
-- Pengurus akaun LUAR — orang yang sengaja TIDAK diagih kepada staf
-- =====================================================================
--
-- KEPUTUSAN PENGGUNA YANG MENCETUSKAN FAIL INI
-- ---------------------------------------------
-- Selepas Panel DP-8 menyelesaikan 11 daripada 12 nilai `Account Manager`,
-- hanya `'Ow Zi Qi'` (3 baris invois + 1 baris staging) yang tinggal. Nama
-- itu tiada dalam senarai 18 staf `User Profiles Mapping.xlsx`.
--
-- Ditanya siapa itu, pengguna memutuskan (2026-09-04):
--     **Orang luar — bukan staf MIMOS Academy. Biarkan NULL dan
--       laporkan berasingan.**
--
-- KENAPA PERLU JADUAL BAHARU (bukan sekadar biarkan NULL)
-- -------------------------------------------------------
-- Tanpa fail ini, `'Ow Zi Qi'` dan `'Fuzy'`-sebelum-disahkan kelihatan
-- **SERUPA** dalam laporan: kedua-duanya `account_manager_id IS NULL`.
-- Tetapi maksudnya berbeza sepenuhnya:
--
--   `'Ow Zi Qi'`  = SUDAH diputuskan manusia: orang luar, sengaja tidak
--                   diagih. Tiada tindakan lanjut diperlukan.
--   nilai lain     = BELUM diputuskan: sistem tidak tahu, perlu perhatian.
--
-- Jika kedua-duanya dicampur, laporan akan sentiasa menunjukkan "4 baris
-- tidak diagih" tanpa membezakan yang **selesai** daripada yang **terbuka**.
-- Itu menghalang Fasa 8E (pipeline) dan 8F (komisen) daripada tahu sama ada
-- baki itu perlu tindakan atau tidak.
--
-- Dengan fail ini, `am_unresolved_values()` melaporkan kategori `LUAR`
-- berasingan daripada `TIADA_PADANAN`, dan **setiap satu daripada 12 nilai
-- sebenar kini mempunyai keputusan manusia di belakangnya**.
--
-- PRASYARAT
-- ---------
-- `client-master.sql` (8A) dan `account-manager-resolution.sql` (8A-2).
--
-- SKOP
-- ----
-- ✅ 1 jadual + RLS + 4 polisi + 2 fungsi + 3 indeks
-- ✅ Idempoten
-- ✅ Setiap tulis diaudit
-- ❌ TIADA DROP/DELETE/TRUNCATE pada jadual perniagaan
-- ❌ TIDAK menambah nilai enum audit_action (guna created/updated/deleted)
--
-- NOTA DP-7: jadual ini MENTAKRIFKAN lajur `updated_at` walaupun ia TIDAK
-- disenaraikan dalam `targets` `updated-at-triggers.sql`. Dua sebab:
--   1. konsistensi dengan semua jadual repo yang lain
--   2. jika ia kelak ditambah ke `targets`, ia tidak akan menghadapi
--      kecacatan DP-7 (trigger dipasang pada jadual tanpa lajur)
-- Ia sengaja TIDAK ditambah ke `targets` sekarang kerana itu akan mengubah
-- bilangan trigger di live (G1=12/12 dalam laporan PROMPT-6G) dan
-- memerlukan pengesahan semula baseline itu.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Jadual
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.external_account_managers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  raw_text      text NOT NULL,
  display_name  text NOT NULL,
  reason        text,
  confirmed_by  uuid REFERENCES auth.users (id),
  confirmed_at  timestamptz NOT NULL DEFAULT now(),
  notes         text,
  CONSTRAINT external_account_managers_raw_unique UNIQUE (raw_text)
);

COMMENT ON TABLE public.external_account_managers IS
  'Nilai Account Manager yang DISAHKAN MANUSIA sebagai orang LUAR (bukan staf '
  'MIMOS Academy), dan oleh itu SENGAJA tidak diagih kepada mana-mana '
  'user_profiles. Wujud supaya laporan boleh membezakan "sudah diputuskan: '
  'orang luar" daripada "belum diputuskan: sistem tidak tahu" — kedua-duanya '
  'kelihatan sebagai account_manager_id IS NULL tanpa jadual ini. '
  'Keputusan pertama direkodkan oleh Panel DP-9 (2026-09-04): "Ow Zi Qi". '
  'LIHAT JUGA: public.account_manager_aliases (untuk orang DALAM staf).';

COMMENT ON COLUMN public.external_account_managers.display_name IS
  'Nama untuk dipaparkan dalam laporan, cth. "Ow Zi Qi (luar)". Tidak dipaut '
  'ke user_profiles kerana orang ini bukan staf.';

COMMENT ON COLUMN public.external_account_managers.reason IS
  'Sebab klasifikasi luar, cth. "ejen", "rakan kongsi", "staf klien", '
  '"bekas staf". Diperlukan untuk laporan Fasa 8F (komisen) supaya baris '
  'yang dikecualikan boleh dijelaskan.';

CREATE INDEX IF NOT EXISTS idx_ext_am_raw_lower
  ON public.external_account_managers (public.normalize_person_name(raw_text));

CREATE INDEX IF NOT EXISTS idx_ext_am_display
  ON public.external_account_managers (display_name);


-- ---------------------------------------------------------------------
-- 2. RLS — sama seperti account_manager_aliases
-- ---------------------------------------------------------------------
ALTER TABLE public.external_account_managers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ext_am_read" ON public.external_account_managers;
CREATE POLICY "ext_am_read" ON public.external_account_managers
  FOR SELECT TO authenticated USING (true);

-- Veto Keselamatan §2.8: baca dibenarkan (teks + UUID pengesah sahaja, tiada
-- peranan atau status staf). Tulis hanya untuk peranan pengurusan.
-- NOTA ENUM (DP-6): 'super_admin' BUKAN nilai enum dalam schema-master.sql:202,
-- tetapi ADA di live kerana user-management.sql Bahagian 1a menambahnya.
-- has_role() sendiri mengembalikan true untuk SEMUA peranan bila
-- role='super_admin', jadi Super Admin sudah dilindungi tanpa cast itu.
DROP POLICY IF EXISTS "ext_am_write" ON public.external_account_managers;
CREATE POLICY "ext_am_write" ON public.external_account_managers
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('admin'::public.app_role)
    OR public.has_role('head_governance'::public.app_role)
    OR public.has_role('finance'::public.app_role)
  );

DROP POLICY IF EXISTS "ext_am_update" ON public.external_account_managers;
CREATE POLICY "ext_am_update" ON public.external_account_managers
  FOR UPDATE TO authenticated
  USING (
    public.has_role('admin'::public.app_role)
    OR public.has_role('head_governance'::public.app_role)
    OR public.has_role('finance'::public.app_role)
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "ext_am_delete" ON public.external_account_managers;
-- Padan dengan am_aliases_delete: hanya admin (Super Admin dilindungi oleh
-- has_role() sendiri, lihat DP-6).
CREATE POLICY "ext_am_delete" ON public.external_account_managers
  FOR DELETE TO authenticated
  USING (public.has_role('admin'::public.app_role));


-- ---------------------------------------------------------------------
-- 3. adakah nilai ini sudah diklasifikasikan sebagai luar?
-- ---------------------------------------------------------------------
-- IMMUTABLE-ish helper supaya boleh digunakan dalam query laporan.
-- STABLE kerana membaca jadual.

CREATE OR REPLACE FUNCTION public.is_external_account_manager(p_raw text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text;
BEGIN
  v_norm := public.normalize_person_name(p_raw);
  IF v_norm IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.external_account_managers e
     WHERE public.normalize_person_name(e.raw_text) = v_norm
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_external_account_manager(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_external_account_manager(text) TO authenticated;


-- ---------------------------------------------------------------------
-- 4. Klasifikasikan nilai sebagai orang luar (keputusan manusia)
-- ---------------------------------------------------------------------
-- DUA PENOLAKAN PENTING:
--   * jika nilai itu SUDAH menyelesaikan kepada staf -> tolak. Gunakan
--     am_confirm_alias() untuk membetulkannya, jangan labelkannya luar.
--   * jika nilai itu sel berbilang orang -> tolak. Satu klasifikasi luar
--     ialah untuk SATU orang; 'Fuzy / Dila' bukan seorang orang luar.

CREATE OR REPLACE FUNCTION public.am_confirm_external(
  p_raw_text     text,
  p_display_name text,
  p_reason       text DEFAULT NULL,
  p_notes        text DEFAULT NULL
)
RETURNS TABLE (raw_text text, display_name text, tindakan text)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm      text;
  v_existing  uuid;
  v_action    public.audit_action;
  v_old       jsonb;
BEGIN
  IF NOT public.can_resolve_account_managers() THEN
    RAISE EXCEPTION 'tiada kuasa: klasifikasi luar memerlukan peranan admin, head_governance atau finance'
      USING ERRCODE = '42501';
  END IF;

  v_norm := public.normalize_person_name(p_raw_text);
  IF v_norm IS NULL THEN
    RAISE EXCEPTION 'raw_text tidak boleh kosong' USING ERRCODE = '22023';
  END IF;

  IF public.normalize_person_name(p_display_name) IS NULL THEN
    RAISE EXCEPTION 'display_name tidak boleh kosong' USING ERRCODE = '22023';
  END IF;

  -- Tolak jika nilai ini sudah menyelesaikan kepada staf
  IF public.resolve_account_manager(p_raw_text) IS NOT NULL THEN
    RAISE EXCEPTION 'nilai ini sudah menyelesaikan kepada seorang staf — guna am_confirm_alias() untuk membetulkannya, jangan klasifikasikannya sebagai luar'
      USING ERRCODE = '22023';
  END IF;

  -- Tolak sel berbilang orang
  IF v_norm LIKE '%/%' OR v_norm LIKE '%,%'
     OR v_norm LIKE '% dan %' OR v_norm LIKE '% & %' THEN
    RAISE EXCEPTION 'sel berbilang orang tidak boleh diklasifikasikan sebagai SATU orang luar'
      USING ERRCODE = '22023';
  END IF;

  SELECT e.id,
         jsonb_build_object('display_name', e.display_name, 'reason', e.reason)
    INTO v_existing, v_old
    FROM public.external_account_managers e
   WHERE public.normalize_person_name(e.raw_text) = v_norm
   LIMIT 1;

  IF v_existing IS NULL THEN
    INSERT INTO public.external_account_managers
      (raw_text, display_name, reason, confirmed_by, notes)
    VALUES
      (btrim(p_raw_text), btrim(p_display_name), p_reason,
       public.current_user_id(), p_notes)
    RETURNING external_account_managers.id INTO v_existing;
    v_action := 'created';
  ELSE
    UPDATE public.external_account_managers e
       SET display_name = btrim(p_display_name),
           reason       = p_reason,
           confirmed_by = public.current_user_id(),
           confirmed_at = now(),
           notes        = coalesce(p_notes, e.notes)
     WHERE e.id = v_existing;
    v_action := 'updated';
  END IF;

  PERFORM public.log_audit(
    'external_account_managers',
    v_existing,
    v_action,
    v_old,
    jsonb_build_object('raw_text', btrim(p_raw_text),
                       'display_name', btrim(p_display_name),
                       'reason', p_reason),
    jsonb_build_object('fasa', '8A-2', 'fungsi', 'am_confirm_external',
                       'asas', 'Panel DP-9: keputusan pengguna 2026-09-04')
  );

  RETURN QUERY SELECT btrim(p_raw_text), btrim(p_display_name), v_action::text;
END;
$$;

REVOKE ALL ON FUNCTION public.am_confirm_external(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.am_confirm_external(text, text, text, text) TO authenticated;


-- ---------------------------------------------------------------------
-- 5. Batalkan klasifikasi luar
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.am_revoke_external(p_raw_text text)
RETURNS TABLE (raw_text text, former_display_name text, tindakan text)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text;
  v_row  public.external_account_managers%ROWTYPE;
BEGIN
  IF NOT public.can_resolve_account_managers() THEN
    RAISE EXCEPTION 'tiada kuasa: pembatalan klasifikasi luar memerlukan peranan admin, head_governance atau finance'
      USING ERRCODE = '42501';
  END IF;

  v_norm := public.normalize_person_name(p_raw_text);

  SELECT * INTO v_row
    FROM public.external_account_managers e
   WHERE public.normalize_person_name(e.raw_text) = v_norm
   LIMIT 1;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'tiada klasifikasi luar untuk nilai ini' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.external_account_managers e WHERE e.id = v_row.id;

  PERFORM public.log_audit(
    'external_account_managers',
    v_row.id,
    'deleted',
    jsonb_build_object('raw_text', v_row.raw_text,
                       'display_name', v_row.display_name,
                       'reason', v_row.reason,
                       'confirmed_at', v_row.confirmed_at),
    NULL,
    jsonb_build_object('fasa', '8A-2', 'fungsi', 'am_revoke_external')
  );

  RETURN QUERY SELECT v_row.raw_text, v_row.display_name, 'deleted'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.am_revoke_external(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.am_revoke_external(text) TO authenticated;


-- =====================================================================
-- PENGESAHAN (read-only)
-- =====================================================================
-- 3 fungsi baharu: is_external_account_manager, am_confirm_external,
-- am_revoke_external. Semua SECURITY DEFINER, search_path=public.
--
-- ⚠️ DP-4: jadual `external_account_managers` ialah jadual rasmi repo.
--    Allowlist `W1_public_tables` dalam `docs/PROMPT-6C-AUDIT-LEGACY-TABLES.md`
--    MESTI dikemas kini 16 -> 17, jika tidak `test-preflight-b-sql.mjs` §8
--    akan gagal.
--
-- Ujian berkelakuan: scripts/test-account-manager-resolution.mjs seksyen [Q].
````

---

## 4. Cara melaksanakan

1. Sahkan integriti (Seksyen 2).
2. Hantar **keseluruhan** teks SQL di atas kepada `Supabase.apply_migration`
   sebagai **satu** migration, dalam **satu** pelaksanaan.
   Nama cadangan: `8a3-l2-external-account-managers`.
3. Jika migration **gagal**, laporkan teks ralat **penuh** (termasuk kod SQLSTATE
   dan baris). **JANGAN** cuba "memperbaiki" SQL itu sendiri — itu kerja Arena.
4. Jalankan query pengesahan di Seksyen 5 (read-only) dan laporkan output
   **verbatim**.

---

## 5. Pengesahan SELEPAS pemasangan (read-only)

-- L2b: jadual baharu wujud
SELECT 'L2b' AS check_name, relname AS jadual,
       relrowsecurity AS rls_aktif
  FROM pg_class
 WHERE relnamespace = 'public'::regnamespace
   AND relname IN ('external_account_managers')
 ORDER BY relname;
-- Jangkaan: 1 baris, rls_aktif = true

-- L2c: fungsi baharu wujud
SELECT 'L2c' AS check_name, p.proname AS fungsi,
       pg_get_function_identity_arguments(p.oid) AS argumen
  FROM pg_proc p
 WHERE p.pronamespace = 'public'::regnamespace
   AND p.proname IN ('is_external_account_manager', 'am_confirm_external', 'am_revoke_external')
 ORDER BY p.proname;
-- Jangkaan: 3 baris

-- L2d: polisi RLS baharu wujud
SELECT 'L2d' AS check_name, tablename, policyname, cmd
  FROM pg_policies
 WHERE schemaname = 'public'
   AND policyname IN ('ext_am_read', 'ext_am_write', 'ext_am_update', 'ext_am_delete')
 ORDER BY tablename, policyname;
-- Jangkaan: 4 baris

-- L2e: indeks baharu wujud
SELECT 'L2e' AS check_name, tablename, indexname
  FROM pg_indexes
 WHERE schemaname = 'public'
   AND indexname IN ('idx_ext_am_raw_lower', 'idx_ext_am_display')
 ORDER BY indexname;
-- Jangkaan: 2 baris

---

### K6 — 🔴 kriteria paling penting: 12 nilai SEBENAR

> **TAFSIRAN BERGANTUNG KEPADA J0.** Jangkaan di bawah berasal daripada
> **18 staf** `User Profiles Mapping.xlsx`. Jika J0a/J0b/J0c menunjukkan live
> berbeza (nama penuh berbeza, atau perlanggaran token), beberapa nilai yang
> dijangka selesai akan kembali **NULL** kerana **syarat keunikan** menolaknya.
> Itu tingkah laku **BETUL**, bukan ralat.
>
> **JANGAN ubah jangkaan secara senyap.** Laporkan kedua-duanya: nilai sebenar
> **dan** perbezaan daripada jangkaan, dengan merujuk baris J0 yang
> menjelaskannya.

```sql
WITH kes(raw_text, jangkaan_18_staf) AS (VALUES
  ('Abu Said',          'Abu Sa''id'),
  ('Abu said',          'Abu Sa''id'),
  ('Adilah',            'Adilah'),
  ('Farrah',            'Farrah'),
  ('Fuziah',            'Fuziah'),
  ('Fuzy',              'Fuziah'),
  ('Fuzy / Dila',       'Fuziah'),
  ('Fuzy / Sholihin ',  'Fuziah'),
  ('Omar',              'Omar'),
  ('Ow Zi Qi',          NULL),
  ('Sholihin',          'Sholihin'),
  ('Zalina',            'Zalina Sayuti'))
SELECT 'K6' AS k, kes.raw_text AS nilai_mentah,
       up.full_name            AS diselesaikan_kepada,
       kes.jangkaan_18_staf    AS jangkaan_pglite,
       CASE WHEN up.full_name IS NOT DISTINCT FROM kes.jangkaan_18_staf
            THEN 'SEPADAN' ELSE '⚠️ BEZA' END AS keputusan,
       public.is_external_account_manager(kes.raw_text) AS diklasifikasi_luar
  FROM kes
  LEFT JOIN LATERAL (
        SELECT p.full_name FROM public.user_profiles p
         WHERE p.id = public.resolve_account_manager(kes.raw_text) LIMIT 1) up ON true
 ORDER BY kes.raw_text;
```

**Jangkaan SELEPAS seed Langkah 4 (11 selesai + 1 luar):**

| nilai | jangkaan | sebab |
|---|---|---|
| `Abu Said`, `Abu said` | `Abu Sa'id` | token pertama `abu` unik |
| `Adilah`, `Farrah`, `Fuziah`, `Omar`, `Sholihin` | nama sendiri | padanan tepat |
| `Zalina` | `Zalina Sayuti` | token pertama `zalina` unik |
| `Fuzy` | **`Fuziah`** | alias DP-8 |
| `Fuzy / Dila`, `Fuzy / Sholihin ` | **`Fuziah`** | alias DP-8 (keputusan pengguna) |
| `Ow Zi Qi` | **NULL** + `diklasifikasi_luar = true` | DP-9: orang luar |

**Nota penting:** `'Fuzy / Dila'` dan `'Fuzy / Sholihin '` menyelesaikan kepada
`Fuziah` **hanya kerana** alias DP-8 wujud. **Tanpa** Langkah 4, kedua-duanya
**NULL** — itu bukti veto Kewangan §2.4 masih hidup untuk nilai yang belum
diputuskan manusia.

> 🔴 **K6 PADA LANGKAH INI — L4 (seed) BELUM dijalankan.** Jadual "Jangkaan
> SELEPAS seed Langkah 4" di atas ialah rujukan untuk L4, **BUKAN** jangkaan
> anda sekarang. Jangkaan SEBENAR pada langkah ini:
>
> - `Abu Said` dan `Abu said` → `Abu Sa'id` (token pertama `abu` unik)
> - `Adilah`, `Farrah`, `Fuziah`, `Omar`, `Sholihin` → nama sendiri (padanan tepat)
> - `Zalina` → `Zalina Sayuti` (token pertama `zalina` unik)
> - `Fuzy`, `Fuzy / Dila`, `Fuzy / Sholihin ` → **NULL** — alias DP-8 belum
>   disemai, jadi veto Kewangan §2.4 **masih hidup**. Ini **betul**, bukan kegagalan.
> - `Ow Zi Qi` → **NULL** dan `diklasifikasi_luar` = **false** — jadual
>   `external_account_managers` masih kosong; L4 yang mengisinya (DP-9).
>
> **Laporkan 12 baris itu VERBATIM sebagaimana query mengembalikannya.**
> **JANGAN** bina semula senarai daripada ingatan, **JANGAN** gabungkan baris,
> **JANGAN** tambah nilai yang tiada dalam `VALUES` query di atas.
> Khususnya: `Abu Said` dan `Abu said` ialah **DUA baris berasingan** (bukti
> kes-kepekaan), dan `Afiq` / `Ahmad Nizar` **BUKAN** nilai Account Manager
> Excel — kedua-duanya probe diskriminatif rekonsiliasi L1 (DP-13.2).
> Jika anda tidak dapat menjalankan query K6 pada langkah ini, laporkan
> `⏳ K6 tidak dijalankan pada langkah ini` — **jangan** gantikannya dengan
> senarai yang dibina semula.

---

## 7. Larangan

1. **JANGAN** jalankan mana-mana fail SQL selain empat (atau lima, jika anda
   memilih Langkah 5) yang disenaraikan di §5.
2. **JANGAN** guna `service_role`.
3. **JANGAN** panggil RPC tulis perniagaan (`sync_import_transaction`,
   `lock_programme`, `unlock_programme`, `request_programme_unlock`,
   `submit_change_request`, `review_change_request`).
4. **JANGAN** jalankan `am_backfill_account_manager()`. Ia akan mengisi 0 baris
   di live (§2.3) dan **prompt ini tidak meluluskannya**. Ia akan dipanggil
   selepas Quotation Tracker diimport dalam Fasa 8C.
5. **JANGAN** reset atau ubah kata laluan mana-mana akaun.
6. **JANGAN** merge ke `main`. **JANGAN** tukar Production Branch Vercel —
   prompt ini **tidak** meluluskannya.
7. **JANGAN** tampal anon key penuh atau sebarang rahsia.
8. **JANGAN** mereka-reka bukti. Setiap ✅ mesti ada bukti verbatim. Jika tidak
   dapat diuji, tulis `⏳ MENUNGGU PENGGUNA` dan **namakan operasi spesifik**
   yang tiada.
9. **JANGAN** layan preview local (Mod Demo) sebagai production.
10. **JANGAN** berhenti senyap apabila alat gagal. Tampal ralat penuh, kemudian
    teruskan bahagian lain yang boleh.
11. **JANGAN** DROP objek yang tidak diluluskan dalam prompt ini. Fail-fail ini
    mengandungi `DROP POLICY IF EXISTS` untuk idempotensi RLS — itu
    **dibenarkan**. Larangan ini berskop kepada **objek**, bukan kata kerja.
12. **JANGAN** namakan semula `organizers` → `clients` (ditangguh ke Fasa 8H).
13. **JANGAN** ubah jangkaan K6 supaya ia "lulus". Jika keputusan live berbeza
    daripada jangkaan 18-staf, **laporkan perbezaan itu beserta baris J0 yang
    menjelaskannya** — itu penemuan, bukan kegagalan untuk disembunyikan.
14. **JANGAN** tambah alias atau klasifikasi luar selain tiga + satu yang
    terkandung dalam seed Langkah 4. Keputusan lain memerlukan kelulusan
    pengguna.

---

---

## 8. FORMAT LAPORAN (6 seksyen)

**Seksyen 1 — Konteks & Status:** project ref yang digunakan, **Git blob SHA** dan **cap jari struktur** bagi setiap fail (Lapis 1 + Lapis 2), SHA-256 bagi setiap fail
(**jika** anda dapat mengiranya), dan pengesahan kelulusan pengguna.

> 🟢 **DP-11 — kriteria K1 yang SAH.** Gate integriti ialah **Lapis 1 (Git blob
> SHA) + Lapis 2 (cap jari struktur)**. **SHA-256 ialah PILIHAN**, kerana telah
> dibuktikan bahawa runtime anda tidak mempunyai byte-stream fail tempatan untuk
> mengiranya. Maka:
> - blob SHA **sepadan** + baris pertama/terakhir **sepadan** ⇒ **K1 = 🟢 LULUS**.
> - Laporan `⏳ SHA-256 tidak dikira` **BUKAN** pengurangan markah dan **BUKAN**
>   sebab menjadikan K1 🟠. Menandakan 🟠 untuk kriteria yang sudah digantikan
>   ialah **positif palsu** — ia menyembunyikan isyarat sebenar.
> - Yang **wajib** 🟠/🔴 ialah jika blob SHA **tidak sepadan**, atau cap jari
>   struktur **berbeza**, atau kandungan kelihatan **terpotong**.
>
> Melaporkan `⏳` dan **tidak mereka** nilai ialah pematuhan penuh terhadap
> larangan #8. Terima kasih — teruskan begitu.

**Seksyen 2 — J0 (mesti diisi DAHULU):** J0a (tampal **kesemua 20 baris**),
J0b, J0c, J0d, J0e. **J0b dan J0c adalah kritikal** — jika ada perlanggaran,
K6 akan berbeza dan anda mesti menjelaskan mengapa.

**Seksyen 3 — Tindakan yang diambil:** urutan langkah sebenar + bukti verbatim.

**Seksyen 4 — Keputusan K1–K12 (jadual):**
`Kriteria | Status ✅/❌/⏳ | Jangkaan | Bukti verbatim | Catatan`.
Untuk **K6**, tampal **kesemua 12 baris** — jangan ringkaskan.

**Seksyen 5 — Isu / Blocker / penemuan:** 🔴/🟠/🟢 + bukti + cadangan.
**Wajib nyatakan secara eksplisit:**
- adakah 20 profil live **mengandungi** 18 nama Excel, dan siapa 2 yang tambahan
- adakah `Fuziah` **unik** (J0d) — dan jika tidak, Langkah 4 dilangkau
- adakah K8 mengembalikan 0 baris (dijangka, §2.3)
- adakah `audit_logs` bertambah, dan berapa

**Seksyen 6 — Pengesahan pematuhan larangan:** setiap larangan 1–14 |
dipatuhi ✅ / tidak ❌ | bukti.

---

**Tambahan wajib untuk langkah ini:** nyatakan dengan jelas sama ada
`external-account-managers.sql` **sudah dipasang**, dan sertakan cap jari yang anda sahkan
(bersama `⏳` bagi yang tidak dapat dikira).

**Berhenti selepas laporan.** Jangan mula langkah berikutnya sehingga Arena
menyemak laporan ini.
