# PROMPT 8A-3 / L1 — Langkah 1 — `client-master.sql` (Fasa 8A)

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

**Prasyarat:** Tiada. Ini langkah pertama. J0 sudah LULUS dan **tidak perlu diulang**.

**Objek yang dipasang langkah ini:** 6 lajur induk pelanggan + jadual `account_manager_aliases` + 2 fungsi (`normalize_person_name`, `resolve_account_manager`).



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
| **Lapis 1 — Git blob SHA** | `37b8d8b8fa882b65645cf32e2c37d55590ec6cf2` |
| Lapis 2 — bait (UTF-8) | **17210** |
| Lapis 2 — baris | **384** |
| Lapis 2 — aksara (titik kod Unicode) | **17159** |
| Lapis 2 — `CREATE TABLE` / `FUNCTION` / `POLICY` / `INDEX` | **1 / 2 / 4 / 2** |
| Lapis 2 — baris pertama | `-- =====================================================================` |
| Lapis 2 — baris terakhir (bukan kosong) | `-- NULL di sini ialah jawapan yang BETUL, bukan kegagalan.` |
| Pilihan — SHA-256 | `d394398dc075f92c61db13077be568e907fb77989ef1175146682ce251418542` |

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
separa. Rujuk fail asal untuk perbandingan: https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/lib/supabase/client-master.sql

---

## 3. SQL PENUH — jalankan ini apa adanya

Kandungan fail ialah **semua baris di antara pagar pembuka dan penutup**, tepat
seperti ada. Fail asal: `lib/supabase/client-master.sql`

````sql
-- =====================================================================
-- CLIENT-MASTER.sql  —  Fasa 8A (Panel DP-2, 2026-09-04)
-- Induk Pelanggan + Penyelesaian Pengurus Akaun
-- =====================================================================
--
-- KATA PUTUS DP-2 YANG FAIL INI LAKSANAKAN
-- -----------------------------------------
-- 1. RENAME `organizers` -> `clients` DITANGGUHKAN ke Fasa 7H. Sebab:
--    faedah berfungsi sifar (lapisan TS sudah berkata "client" —
--    `programme-mapper.ts:57`, `master-records.ts:159`), dan rename
--    memerlukan audit `change_request_allowed_fields` di live (ia
--    menyimpan teks 'organizer_name') + penyelarasan 18 rujukan dalam
--    `schema-master.sql` dan `seed-v4-raw.sql`.
--    HUTANG PENAMAAN DIREKODKAN, TIDAK DILUPAKAN.
-- 2. Jadual `clients` SELARI DITOLAK — dua induk melanggar keputusan
--    pengguna #2 ("satu entiti Pelanggan").
-- 3. Jadi 8A ialah ADDITIF: medan induk yang quotation/invois perlukan,
--    dan penyelesaian pengurus akaun.
--
-- MASALAH YANG DISELESAIKAN (bukti diukur, bukan dijangka)
-- --------------------------------------------------------
-- `Account Manager` dalam Quotation Tracker ada 12 rentetan unik untuk
-- ~8 orang sebenar:
--     "Abu Said" / "Abu said" / "Abu Sa'id"  -> SATU orang (3 varian)
--     "Fuziah" / "Fuzy"                      -> mungkin satu, TIDAK pasti
--     "Fuzy / Dila", "Fuzy / Sholihin"       -> BERBILANG orang dalam satu sel
--     "Ow Zi Qi"                             -> tiada dalam senarai 19 staf
-- Akibatnya setiap laporan "mengikut pengurus akaun" KINI SALAH secara
-- senyap — dan 7C/7E/7F (quotation, pipeline, komisen) akan mewarisi
-- ralat itu jika ia tidak dibaiki dahulu.
--
-- PRINSIP REKA BENTUK (veto Pakar Kewangan §2.4 + QA §2.7)
-- --------------------------------------------------------
-- Sistem MENGINGAT keputusan manusia; ia TIDAK MENEKA.
--   - Nilai mentah TEXT dikekalkan (jejak audit)
--   - Pautan UUID selesai ditambah (untuk laporan)
--   - Bila kabur -> NULL. TIADA padanan "terdekat".
--   - "Fuzy" -> NULL, BUKAN "Fuziah". Jika manusia sahkan ia Fuziah,
--     ia masuk `account_manager_aliases` dan selepas itu selesai.
--
-- SKOP
-- ----
-- ✅ Hanya tambah lajur / cipta jadual baharu / cipta fungsi
-- ✅ Idempoten — selamat dijalankan berulang kali
-- ❌ TIADA DROP, UPDATE, DELETE, TRUNCATE
-- ❌ TIDAK menamakan semula apa-apa
-- ❌ TIDAK mengisi `account_manager_id` — itu kerja migrasi data berasingan
--    yang memerlukan keputusan manusia (lihat §5)
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Medan induk pelanggan yang quotation/invois perlukan
-- ---------------------------------------------------------------------
-- `organizers` sudah ada: name, short_name, email, phone, address, city,
-- state, postcode, sector, industry, organization_type, is_active, notes,
-- website. Yang tiada ialah medan PERDAGANGAN yang diperlukan untuk
-- menyebut harga dan mengebil.

ALTER TABLE public.organizers
  ADD COLUMN IF NOT EXISTS client_code          text,
  ADD COLUMN IF NOT EXISTS sst_registration_no  text,
  ADD COLUMN IF NOT EXISTS billing_address      text,
  ADD COLUMN IF NOT EXISTS payment_terms_days   integer;

COMMENT ON TABLE public.organizers IS
  'INDUK PELANGGAN (client master). Nama jadual "organizers" adalah HUTANG '
  'PENAMAAN yang ditangguhkan ke Fasa 7H (Panel DP-2): kandungannya ialah '
  'pelanggan — MIMOS Berhad, PETRONAS, Bank Negara Malaysia, Kenanga Investor '
  'Berhad. Lapisan TypeScript sudah memetakannya sebagai "client" '
  '(programme-mapper.ts:57). JANGAN cipta jadual clients selari — itu akan '
  'menghasilkan dua induk dan melanggar keputusan pengguna #2.';

COMMENT ON COLUMN public.organizers.sst_registration_no IS
  'Nombor pendaftaran SST pelanggan. Diperlukan untuk invois B2B Malaysia. '
  'Ditambah oleh Fasa 8A (Panel DP-2).';

COMMENT ON COLUMN public.organizers.payment_terms_days IS
  'Terma pembayaran dalam hari (cth. 30). Sumber: lajur "Payment Terms" dalam '
  'R1 INCOME_STATEMENT dan invoice_2026.xlsx. Diperlukan untuk pengiraan aging.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizers_client_code_unique
  ON public.organizers (client_code) WHERE client_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizers_name_lower
  ON public.organizers (lower(btrim(name)));


-- ---------------------------------------------------------------------
-- 2. Pautan pengurus akaun yang SELESAI (mentah dikekalkan)
-- ---------------------------------------------------------------------
-- `invoices.account_manager` dan `import_staging.account_manager` (TEXT)
-- KEKAL sebagai nilai mentah daripada Excel — itu jejak audit dan tidak
-- boleh diubah. `account_manager_id` ialah pautan yang sudah selesai.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS account_manager_id uuid REFERENCES public.user_profiles (id);

ALTER TABLE public.import_staging
  ADD COLUMN IF NOT EXISTS account_manager_id uuid REFERENCES public.user_profiles (id);

COMMENT ON COLUMN public.invoices.account_manager_id IS
  'Pautan SELESAI ke user_profiles, diisi oleh public.resolve_account_manager(). '
  'NULL bermakna TIDAK DAPAT DISELESAIKAN (kabur, berbilang orang, atau tiada '
  'padanan) — BUKAN bermakna tiada pengurus akaun. Nilai mentah kekal dalam '
  'lajur account_manager TEXT. Lihat Panel DP-2.';


-- ---------------------------------------------------------------------
-- 3. Alias yang DISAHKAN MANUSIA
-- ---------------------------------------------------------------------
-- "Fuzy" -> "Fuziah" ialah pengetahuan manusia, bukan sesuatu yang boleh
-- dikira. Sistem mengingat keputusan itu di sini supaya ia tidak perlu
-- ditanya dua kali. Hanya peranan yang boleh mengurus pengguna boleh menulis.

CREATE TABLE IF NOT EXISTS public.account_manager_aliases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  raw_text      text NOT NULL,
  user_id       uuid NOT NULL REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  confirmed_by  uuid REFERENCES auth.users (id),
  confirmed_at  timestamptz NOT NULL DEFAULT now(),
  notes         text,
  CONSTRAINT account_manager_aliases_raw_unique UNIQUE (raw_text)
);

COMMENT ON TABLE public.account_manager_aliases IS
  'Pemetaan nilai mentah Account Manager -> staf, DISAHKAN OLEH MANUSIA. '
  'Wujud kerana prinsip Panel DP-2: sistem mengingat keputusan manusia, ia '
  'tidak meneka. Cth. "Fuzy" -> Fuziah hanya selepas manusia mengesahkannya.';

CREATE INDEX IF NOT EXISTS idx_am_aliases_user ON public.account_manager_aliases (user_id);

ALTER TABLE public.account_manager_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "am_aliases_read" ON public.account_manager_aliases;
CREATE POLICY "am_aliases_read" ON public.account_manager_aliases
  FOR SELECT TO authenticated USING (true);

-- Veto Keselamatan §2.8: hanya peranan pengurusan boleh menulis pemetaan
-- identiti staf. Baca dibenarkan (ia hanya teks + UUID, tiada peranan atau
-- status akaun staf didedahkan).
--
-- NOTA ENUM: `super_admin` BUKAN nilai enum public.app_role. Enum sebenar
-- ialah viewer, executive, manager, admin, staff, finance, head_governance
-- (schema-master.sql:202). Super Admin dikendali DI DALAM has_role() sendiri
-- (schema-master.sql:274): ia mengembalikan true untuk SEMUA peranan bila
-- current_user_role()::text = 'super_admin'. Jadi has_role('admin') SUDAH
-- meliputi Super Admin — jangan cast 'super_admin'::app_role (ralat 22P02).
DROP POLICY IF EXISTS "am_aliases_write" ON public.account_manager_aliases;
CREATE POLICY "am_aliases_write" ON public.account_manager_aliases
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('admin'::public.app_role)
    OR public.has_role('head_governance'::public.app_role)
    OR public.has_role('finance'::public.app_role)
  );

DROP POLICY IF EXISTS "am_aliases_update" ON public.account_manager_aliases;
CREATE POLICY "am_aliases_update" ON public.account_manager_aliases
  FOR UPDATE TO authenticated
  USING (
    public.has_role('admin'::public.app_role)
    OR public.has_role('head_governance'::public.app_role)
    OR public.has_role('finance'::public.app_role)
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "am_aliases_delete" ON public.account_manager_aliases;
CREATE POLICY "am_aliases_delete" ON public.account_manager_aliases
  FOR DELETE TO authenticated
  USING (
    public.has_role('admin'::public.app_role)
  );


-- ---------------------------------------------------------------------
-- 4. Penormalan nama orang
-- ---------------------------------------------------------------------
-- Membuang: huruf besar/kecil, apostrofu, titik, gelaran kehormat, dan
-- ruang berlebihan. Ini menyelesaikan "Abu Said" / "Abu said" / "Abu Sa'id"
-- kepada satu bentuk.
--
-- SENGAJA TIDAK membuat: padanan kabur, singkatan nama, atau tekaan
-- nama panggilan. Itu kerja `account_manager_aliases` (manusia).

CREATE OR REPLACE FUNCTION public.normalize_person_name(p_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(
    btrim(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            lower(coalesce(p_input, '')),
            '[''’.`\-]', ' ', 'g'          -- apostrofu, titik, tanda pisah -> ruang
          ),
          '\s+', ' ', 'g'                   -- runtuhkan ruang berlebihan
        ),
        -- gelaran kehormat Malaysia + antarabangsa, hanya di permulaan
        '^(dr|pn|en|ms|mr|mrs|puan|encik|tuan|datuk|datin|hajah|haji|prof|ir|ar|sr|tun|tan sri|puan sri)\s+',
        '', 'g'
      )
    ),
  '');
$$;

COMMENT ON FUNCTION public.normalize_person_name(text) IS
  'Menormalkan nama orang untuk perbandingan: huruf kecil, buang apostrofu/'
  'titik/tanda pisah, runtuhkan ruang, buang gelaran di permulaan. IMMUTABLE '
  'supaya boleh digunakan dalam indeks fungsi. TIDAK membuat padanan kabur.';


-- ---------------------------------------------------------------------
-- 5. Penyelesai pengurus akaun
-- ---------------------------------------------------------------------
-- Keturutan penyelesaian (dikemas kini oleh Panel DP-8, 2026-09-04):
--   1. NULL / kosong                       -> NULL
--   2. Alias disahkan manusia              -> user_id  (KEUTAMAAN TERTINGGI)
--   3. Berbilang orang ('/' atau ',')      -> NULL   (SISTEM jangan pilih seorang)
--   4. Padanan tepat nama penuh normal     -> user_id (jika TEPAT satu)
--   5. Padanan token pertama, tepat satu   -> user_id
--   6. Padanan substring, TEPAT SATU staf  -> user_id
--   7. Selain itu                          -> NULL
--
-- Langkah 6 diperlukan kerana data sebenar mengandungi bentuk terpotong:
-- "Adilah" ialah "Nur Adilah". Ini BUKAN padanan kabur — ia penyertaan
-- teks tepat dengan syarat keunikan. Jika lebih daripada satu staf
-- mengandungi substring itu, hasilnya NULL (cth. "Nur" padan 5 staf -> NULL).
--
-- Langkah 4, 5 dan 6 mengembalikan NULL jika LEBIH DARIPADA SATU staf padan —
-- kekaburan tidak pernah diselesaikan secara rawak.
--
-- LANGKAH 2 DIDAHULUKAN atas keputusan pengguna (DP-8): alias manusia ialah
-- KEPUTUSAN, bukan tekaan, jadi ia mengatasi peraturan berbilang-orang.
-- Peraturan berbilang-orang kekal berkuat kuasa untuk semua nilai yang
-- BELUM disahkan manusia — sistem masih tidak pernah meneka.

CREATE OR REPLACE FUNCTION public.resolve_account_manager(p_raw text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm      text;
  v_result    uuid;
  v_count     integer;
BEGIN
  v_norm := public.normalize_person_name(p_raw);

  -- 1. kosong
  IF v_norm IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. ALIAS YANG DISAHKAN MANUSIA — keutamaan TERTINGGI (Panel DP-8).
  --    Diletakkan SEBELUM penolakan berbilang-orang dengan sengaja:
  --    peraturan berbilang-orang wujud untuk menghalang SISTEM daripada
  --    meneka. Ia bukan untuk menghalang MANUSIA daripada memutuskan.
  --    Keputusan pengguna 2026-09-04: 'Fuzy / Dila' dan 'Fuzy / Sholihin'
  --    kedua-duanya diagih kepada Fuziah. Tanpa susunan ini, keputusan itu
  --    tidak boleh dilaksanakan sama sekali.
  SELECT a.user_id INTO v_result
    FROM public.account_manager_aliases a
   WHERE public.normalize_person_name(a.raw_text) = v_norm
   LIMIT 1;
  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  -- 3. berbilang orang dalam satu sel: "Fuzy / Dila", "Faiz, Siti"
  --    Veto Kewangan §2.4 (DIBATALKAN oleh keputusan pengguna DP-8 untuk
  --    kes yang disahkan manusia; masih berkuat kuasa untuk semua kes lain):
  --    SISTEM jangan pilih seorang daripada berbilang.
  IF v_norm LIKE '%/%' OR v_norm LIKE '%,%' OR v_norm LIKE '% dan %' OR v_norm LIKE '% & %' THEN
    RETURN NULL;
  END IF;

  -- 4. padanan tepat pada nama penuh yang dinormalkan
  SELECT count(*) INTO v_count
    FROM public.user_profiles p
   WHERE public.normalize_person_name(p.full_name) = v_norm;
  IF v_count = 1 THEN
    SELECT p.id INTO v_result
      FROM public.user_profiles p
     WHERE public.normalize_person_name(p.full_name) = v_norm
     LIMIT 1;
    RETURN v_result;
  END IF;
  IF v_count > 1 THEN
    RETURN NULL;   -- kabur: dua staf bernama sama
  END IF;

  -- 5. padanan token pertama (cth. "Zalina" -> "Zalina Sayuti")
  --    Hanya jika TEPAT SATU staf berkongsi token pertama itu.
  SELECT count(*) INTO v_count
    FROM public.user_profiles p
   WHERE split_part(public.normalize_person_name(p.full_name), ' ', 1)
         = split_part(v_norm, ' ', 1);
  IF v_count = 1 THEN
    SELECT p.id INTO v_result
      FROM public.user_profiles p
     WHERE split_part(public.normalize_person_name(p.full_name), ' ', 1)
           = split_part(v_norm, ' ', 1)
     LIMIT 1;
    RETURN v_result;
  END IF;

  -- 6. padanan substring, TEPAT SATU staf sahaja
  --    Diperlukan untuk bentuk terpotong sebenar: "Adilah" -> "Nur Adilah".
  --    Bukan padanan kabur: penyertaan teks tepat + syarat keunikan.
  --    Contoh penolakan: "Nur" mengandungi 5 staf -> NULL.
  -- Had panjang minimum 4 aksara: menghalang nilai terlalu pendek seperti
  -- "Ain" daripada padan "Ainur Najwa" secara salah.
  IF length(v_norm) >= 4 THEN
  SELECT count(*) INTO v_count
    FROM public.user_profiles p
   WHERE public.normalize_person_name(p.full_name) LIKE '%' || v_norm || '%';
  IF v_count = 1 THEN
    SELECT p.id INTO v_result
      FROM public.user_profiles p
     WHERE public.normalize_person_name(p.full_name) LIKE '%' || v_norm || '%'
     LIMIT 1;
    RETURN v_result;
  END IF;
  IF v_count > 1 THEN
    RETURN NULL;   -- kabur: beberapa staf mengandungi substring itu
  END IF;
  END IF;   -- penutup had panjang minimum

  -- 7. tiada penyelesaian yang boleh dipertahankan
  RETURN NULL;
END;
$$;

-- PENJUSTIFIKASIAN `SECURITY DEFINER` (veto Keselamatan §2.8)
-- -----------------------------------------------------------
-- Fungsi ini perlu membaca `user_profiles` merentasi RLS kerana staf biasa
-- tidak semestinya boleh melihat senarai staf penuh, tetapi mereka perlu
-- melihat pengurus akaun pada invois yang boleh mereka akses.
--
-- Pendedahan diminimumkan: ia mengembalikan **HANYA satu UUID**. Ia TIDAK
-- mengembalikan nama, peranan, `account_status`, e-mel, atau sebarang medan
-- `user_profiles` yang lain. Jadi tiada laluan untuk membaca peranan atau
-- status staf melalui fungsi ini — syarat veto §2.8 dipenuhi.
--
-- `STABLE` (bukan IMMUTABLE) kerana ia membaca jadual.
-- `SET search_path = public` menghalang pintasan skema.

REVOKE ALL ON FUNCTION public.resolve_account_manager(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_account_manager(text) TO authenticated;

REVOKE ALL ON FUNCTION public.normalize_person_name(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_person_name(text) TO authenticated;


-- =====================================================================
-- PENGESAHAN (read-only)
-- =====================================================================
-- Jangkaan: 4 lajur baharu pada organizers, 1 pada invoices, 1 pada
-- import_staging, jadual account_manager_aliases wujud, 2 fungsi wujud.
--
-- SELECT '7a_columns' AS check_name, table_name, column_name
--   FROM information_schema.columns
--  WHERE table_schema='public'
--    AND ((table_name='organizers' AND column_name IN
--          ('client_code','sst_registration_no','billing_address','payment_terms_days'))
--      OR (table_name='invoices' AND column_name='account_manager_id')
--      OR (table_name='import_staging' AND column_name='account_manager_id'))
--  ORDER BY table_name, column_name;
--
-- Ujian berkelakuan terhadap 12 nilai SEBENAR daripada Quotation Tracker
-- dan 19 staf SEBENAR daripada User Profiles Mapping.xlsx dijalankan oleh
-- `scripts/test-client-master.mjs`.
--
-- NOTA: `resolve_account_manager()` dijangka menyelesaikan 8 daripada 12
-- nilai sebenar dan mengembalikan NULL untuk 4 yang kabur
-- ("Fuzy", "Fuzy / Dila", "Fuzy / Sholihin", "Ow Zi Qi").
-- NULL di sini ialah jawapan yang BETUL, bukan kegagalan.
````

---

## 4. Cara melaksanakan

1. Sahkan integriti (Seksyen 2).
2. Hantar **keseluruhan** teks SQL di atas kepada `Supabase.apply_migration`
   sebagai **satu** migration, dalam **satu** pelaksanaan.
   Nama cadangan: `8a3-l1-client-master`.
3. Jika migration **gagal**, laporkan teks ralat **penuh** (termasuk kod SQLSTATE
   dan baris). **JANGAN** cuba "memperbaiki" SQL itu sendiri — itu kerja Arena.
4. Jalankan query pengesahan di Seksyen 5 (read-only) dan laporkan output
   **verbatim**.

---

## 5. Pengesahan SELEPAS pemasangan (read-only)

-- L1a: lajur baharu wujud
SELECT 'L1a' AS check_name,
       table_name || '.' || column_name AS lajur, data_type
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND (table_name, column_name) IN (VALUES
             ('organizers', 'client_code'),
             ('organizers', 'sst_registration_no'),
             ('organizers', 'billing_address'),
             ('organizers', 'payment_terms_days'),
             ('invoices', 'account_manager_id'),
             ('import_staging', 'account_manager_id'))
 ORDER BY table_name, column_name;
-- Jangkaan: 6 baris

-- L1b: jadual baharu wujud
SELECT 'L1b' AS check_name, relname AS jadual,
       relrowsecurity AS rls_aktif
  FROM pg_class
 WHERE relnamespace = 'public'::regnamespace
   AND relname IN ('account_manager_aliases')
 ORDER BY relname;
-- Jangkaan: 1 baris, rls_aktif = true

-- L1c: fungsi baharu wujud
SELECT 'L1c' AS check_name, p.proname AS fungsi,
       pg_get_function_identity_arguments(p.oid) AS argumen
  FROM pg_proc p
 WHERE p.pronamespace = 'public'::regnamespace
   AND p.proname IN ('normalize_person_name', 'resolve_account_manager')
 ORDER BY p.proname;
-- Jangkaan: 2 baris

-- L1d: polisi RLS baharu wujud
SELECT 'L1d' AS check_name, tablename, policyname, cmd
  FROM pg_policies
 WHERE schemaname = 'public'
   AND policyname IN ('am_aliases_read', 'am_aliases_write', 'am_aliases_update', 'am_aliases_delete')
 ORDER BY tablename, policyname;
-- Jangkaan: 4 baris

-- L1e: indeks baharu wujud
SELECT 'L1e' AS check_name, tablename, indexname
  FROM pg_indexes
 WHERE schemaname = 'public'
   AND indexname IN ('idx_organizers_name_lower', 'idx_am_aliases_user')
 ORDER BY indexname;
-- Jangkaan: 2 baris

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

**Seksyen 1 — Konteks & Status:** project ref yang digunakan, **Git blob SHA** dan **cap jari struktur** bagi setiap fail (Lapis 1 + Lapis 2), SHA-256 **penuh**
yang anda sahkan bagi setiap fail, dan pengesahan kelulusan pengguna.

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
`client-master.sql` **sudah dipasang**, dan sertakan cap jari yang anda sahkan
(bersama `⏳` bagi yang tidak dapat dikira).

**Berhenti selepas laporan.** Jangan mula langkah berikutnya sehingga Arena
menyemak laporan ini.
