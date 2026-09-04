# PROMPT 8A-3 / L4 — Langkah 4 — `seed-account-manager-aliases.sql` (keputusan DP-8 + DP-9)

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

**Prasyarat:** **Langkah 1, 2 dan 3 mesti sudah dipasang.** Fail ini memanggil `am_confirm_alias()` (Langkah 1/3) dan `am_confirm_external()` (Langkah 2/3).

**Objek yang dipasang langkah ini:** Merekodkan keputusan manusia sebagai **data**: 3 alias DP-8 (`Fuzy`, `Fuzy / Dila`, `Fuzy / Sholihin ` → **Fuziah**) dan 1 klasifikasi luar DP-9 (`Ow Zi Qi` = orang luar, `account_manager_id` kekal NULL).

> 🔴 **Jalankan SELURUH fail sebagai SATU pelaksanaan.**
> Fail ini mengandungi **blok identiti** di permulaannya: `am_confirm_alias()` dan
> `am_confirm_external()` memerlukan `auth.uid()`, tetapi SQL Editor Supabase
> berjalan sebagai pemilik pangkalan data **tanpa JWT** → `auth.uid()` = NULL →
> setiap INSERT gagal dengan `42501 tiada kuasa`. Blok itu menetapkan
> `request.jwt.claims` kepada akaun Super Admin untuk tempoh skrip dan
> **memulihkannya** di hujung.
>
> Jika tiada akaun Super Admin ditemui, seed **membatalkan dirinya** dengan
> `P0002` — ia tidak akan menulis NULL secara paksa.
>
> **Kesan yang diingini:** `audit_logs.user_id` merekodkan Super Admin sebenar
> sebagai pengesah keputusan DP-8/DP-9. Itulah sebabnya `audit_logs` dijangka
> **bertambah** daripada 44 (K10).
>
> 🔴 **Jika `42501 tiada kuasa` muncul: BERHENTI dan laporkan teks ralat penuh.**
> **JANGAN** longgarkan RLS. **JANGAN** tukar `SECURITY DEFINER`.
> **JANGAN** guna `service_role`. Itu melanggar larangan tetap.

> 🟢 **J0d sudah mengesahkan `Fuziah` UNIK di live** (`bilangan = 1`), jadi
> seed **tidak** dijangka berhenti kerana kabur. Teruskan.

> 🟢 **J1f/J0 sudah mengesahkan live mempunyai SIFAR nilai `Account Manager`.**
> Maka selepas seed, **K8 dijangka 0 baris** dan `am_backfill_account_manager()`
> (bila ia dibuka kelak) akan mengisi **0 baris**. **0 = LULUS**, bukan kegagalan.
> Jangan "memperbaiki" angka ini.

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
| **Lapis 1 — Git blob SHA** | `22fc847e470831b250a943e425c80fa04fdf5542` |
| Lapis 2 — bait (UTF-8) | **12284** |
| Lapis 2 — baris | **283** |
| Lapis 2 — aksara (titik kod Unicode) | **12229** |
| Lapis 2 — `CREATE TABLE` / `FUNCTION` / `POLICY` / `INDEX` | **0 / 0 / 0 / 0** |
| Lapis 2 — baris pertama | `-- =====================================================================` |
| Lapis 2 — baris terakhir (bukan kosong) | `END $$;` |
| Pilihan — SHA-256 | `0bcc03a80fbea51cfb0e8079a35c4be582b418c195e21020a636148e1c67f5df` |

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
separa. Rujuk fail asal untuk perbandingan: https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/lib/supabase/seed-account-manager-aliases.sql

---

## 3. SQL PENUH — jalankan ini apa adanya

Kandungan fail ialah **semua baris di antara pagar pembuka dan penutup**, tepat
seperti ada. Fail asal: `lib/supabase/seed-account-manager-aliases.sql`

````sql
-- =====================================================================
-- SEED-ACCOUNT-MANAGER-ALIASES.sql
-- Keputusan pengguna 2026-09-04 (Panel DP-8) — direkodkan sebagai data
-- =====================================================================
--
-- PRASYARAT: `client-master.sql` (8A), `account-manager-resolution.sql`
-- (8A-2) dan `external-account-managers.sql` (DP-9) MESTI sudah dipasang.
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
-- `Ow Zi Qi` (3 baris invois + 1 baris staging) dikendalikan oleh **DP-9**
-- di bahagian bawah fail ini: pengguna memutuskan ia **orang luar**, bukan
-- staf MIMOS Academy — jadi ia KEKAL tidak diagih tetapi direkodkan sebagai
-- SUDAH diputuskan (kategori `LUAR`), bukan sebagai `TIADA_PADANAN`.
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

-- ---------------------------------------------------------------------
-- 0. TETAPKAN IDENTITI — WAJIB SEBELUM SEBARANG TULISAN
-- ---------------------------------------------------------------------
-- 🔴 MASALAH OPERASI YANG DIBETULKAN DI SINI (dikesan oleh
--    scripts/test-prompt-8a3-install.mjs):
--
-- `am_confirm_alias()` dan `am_confirm_external()` memanggil
-- `can_resolve_account_managers()`, yang bergantung kepada `auth.uid()`.
-- Tetapi **Supabase SQL Editor / connector menjalankan SQL sebagai PEMILIK
-- pangkalan data TANPA JWT**, jadi `auth.uid()` = NULL dan kedua-dua fungsi
-- menaikkan:
--     tiada kuasa: ... memerlukan peranan admin, head_governance atau finance
--
-- Tanpa bahagian ini, seed akan GAGAL di live walaupun fail 8A/8A-2/DP-9
-- dipasang dengan betul — iaitu blocker palsu pada pemasangan yang SUDAH
-- diluluskan pengguna.
--
-- Penyelesaian: tetapkan `request.jwt.claims` kepada Super Admin SEBELUM
-- menulis. Ini juga memberikan `audit_logs.user_id` provenans yang sebenar
-- (bukannya NULL), jadi jejak audit menunjukkan SIAPA yang merekodkan
-- keputusan DP-8/DP-9.

DO $$
DECLARE
  v_admin uuid;
  v_prev  text;
BEGIN
  -- Simpan identiti sesi SEMASA supaya ia boleh dipulihkan di hujung skrip.
  -- Skrip ini tidak boleh memadam identiti yang telah ditetapkan oleh
  -- pemanggil (contohnya harness ujian atau sesi admin yang sah) — ia hanya
  -- meminjam identiti Super Admin untuk tempoh seed ini sahaja.
  v_prev := current_setting('request.jwt.claims', true);
  PERFORM set_config('tpms.seed_prev_jwt_claims', coalesce(v_prev, ''), false);

  SELECT up.id INTO v_admin
    FROM public.user_profiles up
   WHERE up.role::text = 'super_admin'
   ORDER BY up.created_at
   LIMIT 1;

  IF v_admin IS NULL THEN
    SELECT up.id INTO v_admin
      FROM public.user_profiles up
     WHERE lower(btrim(up.email)) = 'saidrazak881@gmail.com'
     LIMIT 1;
  END IF;

  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'seed DP-8/DP-9: tiada akaun Super Admin ditemui (role=super_admin atau saidrazak881@gmail.com). Seed dibatalkan kerana identiti pengesah tidak boleh ditentukan — JANGAN paksa dengan menulis NULL.'
      USING ERRCODE = 'P0002';
  END IF;

  PERFORM set_config('request.jwt.claims',
                     jsonb_build_object('sub', v_admin, 'role', 'authenticated')::text,
                     false);

  IF NOT public.can_resolve_account_managers() THEN
    RAISE EXCEPTION 'seed DP-8/DP-9: identiti Super Admin ditetapkan tetapi can_resolve_account_managers() masih false. Periksa has_role() dan peranan profil %.', v_admin
      USING ERRCODE = '42501';
  END IF;

  RAISE NOTICE 'seed DP-8/DP-9: identiti ditetapkan kepada Super Admin %', v_admin;
END
$$;

-- =====================================================================
-- BAHAGIAN 1 — DP-8: 'Fuzy', 'Fuzy / Dila', 'Fuzy / Sholihin' -> Fuziah
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

-- =====================================================================
-- BAHAGIAN 2 — DP-9: `Ow Zi Qi` ialah ORANG LUAR
-- =====================================================================
-- Keputusan pengguna 2026-09-04, apabila ditanya siapa `Ow Zi Qi`:
--     "Orang luar — bukan staf MIMOS Academy. Biarkan NULL dan
--      laporkan berasingan."
--
-- Ini BERBEZA daripada sekadar membiarkannya NULL. Tanpa rekod ini,
-- `Ow Zi Qi` kelihatan sama seperti nilai yang BELUM diputuskan, dan
-- laporan akan sentiasa menunjukkan baki "perlu tindakan" yang sebenarnya
-- sudah selesai. Dengan rekod ini, `am_unresolved_values()` melaporkannya
-- sebagai kategori `LUAR`.
--
-- `account_manager_id` KEKAL NULL — orang luar tidak dipautkan ke
-- `user_profiles` kerana mereka bukan staf.

DO $$
DECLARE
  v_who uuid;
BEGIN
  v_who := public.current_user_id();

  PERFORM public.am_confirm_external(
    'Ow Zi Qi',
    'Ow Zi Qi (luar)',
    'bukan staf MIMOS Academy',
    'Keputusan pengguna 2026-09-04 (Panel DP-9): orang luar, kekal tidak diagih, laporkan berasingan'
  );

  RAISE NOTICE 'seed DP-9 selesai: Ow Zi Qi diklasifikasikan sebagai LUAR';
END
$$;

-- `am_confirm_external()` idempoten secara dalaman: panggilan kedua
-- mengemas kini baris yang sama (ON the same raw_text) dan diaudit sebagai
-- 'updated', jadi fail ini selamat dijalankan berulang kali.


-- =====================================================================
-- PENGESAHAN DP-9 (read-only)
-- =====================================================================
-- S4: klasifikasi luar wujud
-- SELECT 'S4' AS check_name, raw_text, display_name, reason, notes
--   FROM public.external_account_managers ORDER BY raw_text;
-- Jangkaan: 1 baris — 'Ow Zi Qi'
--
-- S5: rumusan akhir — setiap satu daripada 12 nilai ada keputusan manusia
-- SELECT 'S5' AS check_name, kategori, count(*) AS bilangan_nilai,
--        sum(jumlah_baris) AS jumlah_baris
--   FROM public.am_unresolved_values() GROUP BY kategori ORDER BY kategori;
-- Jangkaan: SELESAI = 11 nilai (262 baris), LUAR = 1 nilai (4 baris),
--           TIADA_PADANAN = 0, BERBILANG_ORANG = 0, PERLU_PENGESAHAN = 0

-- ---------------------------------------------------------------------
-- PULIHKAN identiti sesi supaya tiada kenyataan kemudian dalam sesi yang
-- sama secara tidak sengaja mewarisi kuasa Super Admin, dan supaya identiti
-- asal pemanggil (jika ada) tidak terpadam.
-- ---------------------------------------------------------------------
-- ⚠️ MESTI '{}' dan BUKAN rentetan kosong ''.
-- auth.uid() dan can_resolve_account_managers() membaca
--     current_setting('request.jwt.claims', true)::jsonb
-- Tetapan yang telah DISET kepada '' masih "wujud" dalam sesi, jadi cast
-- ::jsonb ke atas rentetan kosong gagal dengan
--     "invalid input syntax for type json" dan memecahkan SETIAP panggilan
-- selepas ini. '{}' ialah JSON sah yang menghasilkan auth.uid() = NULL,
-- iaitu keadaan asal sebelum skrip ini.
-- (Dikesan oleh scripts/test-account-manager-resolution.mjs.)
DO $$
DECLARE
  v_prev text;
BEGIN
  v_prev := current_setting('tpms.seed_prev_jwt_claims', true);
  IF v_prev IS NOT NULL AND btrim(v_prev) <> '' THEN
    -- Pulihkan identiti asal pemanggil SEBAGAIMANA ADANYA.
    PERFORM set_config('request.jwt.claims', v_prev, false);
  ELSE
    -- Tiada identiti sebelum skrip ini (keadaan biasa di SQL Editor Supabase).
    -- Guna '{}' dan BUKAN '' — lihat amaran di atas.
    PERFORM set_config('request.jwt.claims', '{}', false);
  END IF;
  PERFORM set_config('tpms.seed_prev_jwt_claims', '', false);
END $$;
````

---

## 3B. S2-F SUDAH DIJAWAB (DP-20) — jangan ulang probe, TERUSKAN kepada Seksyen 4

> 🟢 **Probe F1–F4 sudah dijalankan pada 2026-09-05 dan sudah dilaporkan.**
> Ia read-only dan **tidak** mengawal seed ini. **Jangan jalankannya semula.**
> Bahagian ini wujud supaya fakta itu ada dalam konteks anda dan anda tidak
> perlu meneka atau menunggu semakan Arena.

**Keputusan live (daripada laporan anda sendiri):**

| Probe | Keputusan |
|---|---|
| F1 — `pg_default_acl` (`public`, ditetapkan `postgres`) | `{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}` |
| F2 — fungsi Langkah 3 | 7 fungsi · `anon_boleh` = **7** · `auth_boleh` = 7 |
| F2 — fungsi pra-Langkah 3 | 46 fungsi · `anon_boleh` = **46** · `auth_boleh` = 46 |
| F3 — keahlian peranan | `anon` **bukan** ahli `authenticated` |
| F4 — simulasi `anon` | `uid = NULL` · staf dilihat = **0** · nilai dilihat = **0** |

**Kesimpulan (DP-20.2) mengikut pra-daftar DP-18.3 → A (artifak platform).**
`anon = true` berpunca daripada `ALTER DEFAULT PRIVILEGES` yang ditetapkan
Supabase di luar mana-mana fail repo, dan ia **sistemik** (46/46 fungsi pra-L3
sama), jadi S2 dalam laporan L3-R **bukan** bukti Langkah 3 dipasang berbeza
daripada fail yang diluluskan. Maka: **S2 🔴 → 🟠 · L3-R DIPUASKAN · L4 DIBUKA.**

`anon` boleh **MEMANGGIL** fungsi, tetapi F4 menunjukkan ia tidak
**MENDAPATKAN** data (0 baris, `uid = NULL`). Soalan *least-privilege*
(`REVOKE … FROM anon`) **tidak** ditutup di sini — ia gate **8C** (DP-18.4),
satu migration aditif yang juga membawa DP-14.2 dan DP-17.4(a)(b).
**Jangan `REVOKE`, `GRANT` atau `ALTER DEFAULT PRIVILEGES` semasa L4.**

> 🔴 **ARAHAN ALIRAN — TERUSKAN.** Selepas membaca bahagian ini, **LAKSANAKAN
> Seksyen 4** (hantar `seed-account-manager-aliases.sql` kepada
> `Supabase.apply_migration`), kemudian jalankan Seksyen 5 dan laporkan
> Seksyen 6–8 seperti biasa, dalam **satu** laporan. **JANGAN berhenti di sini
> dan JANGAN tunggu semakan Arena sebelum seed.** Arahan "Berhenti selepas
> laporan" di hujung fail ini bermaksud *selepas seed dijalankan*, bukan
> sebelumnya.

> ⛔ **Satu-satunya keadaan yang membenarkan anda tidak meneruskan seed:** jika
> seed itu sendiri gagal (contoh `42501`, `P0002` kerana tiada Super Admin,
> atau kekangan FK). Dalam kes itu laporkan teks ralat **penuh** dan jangan
> longgarkan RLS, jangan tukar `SECURITY DEFINER`, jangan guna `service_role`.

> 🟠 **Nota sejarah (DP-20.5) — supaya anda tidak menyalahkan diri sendiri.
> Versi prompt ini yang terdahulu membundelkan probe S2-F bersama format
> laporannya, dan format itu membawa sekali arahan penutupnya sendiri yang
> menyuruh pembaca berhenti selepas melapor dan tidak memulakan Langkah 4.
> Arahan penutup itu bercanggah dengan niat Seksyen 3B dalam dokumen yang
> sama. Anda mengikutinya — **betul mengikut teks, salah mengikut niat Arena.**
> Kecacatan itu milik Arena, bukan anda. Ayat imperatif itu sengaja TIDAK
> dipetik di sini: model yang membacanya boleh mematuhinya semula walaupun ia
> berada dalam tanda petik. Percanggahan itu kini dibuang dan dikunci oleh
> pengawal boleh uji dalam `scripts/test-prompt-8a3-install.mjs`.

---
## 4. Cara melaksanakan

1. Sahkan integriti (Seksyen 2).
2. Hantar **keseluruhan** teks SQL di atas kepada `Supabase.apply_migration`
   sebagai **satu** migration, dalam **satu** pelaksanaan.
   Nama cadangan: `8a3-l4-seed-account-manager-aliases`.
3. Jika migration **gagal**, laporkan teks ralat **penuh** (termasuk kod SQLSTATE
   dan baris). **JANGAN** cuba "memperbaiki" SQL itu sendiri — itu kerja Arena.
4. Jalankan query pengesahan di Seksyen 5 (read-only) dan laporkan output
   **verbatim**.

---

## 5. Pengesahan SELEPAS pemasangan (read-only)

## 6. Kriteria K — laporan SELEPAS pemasangan

Setiap kriteria diterbitkan daripada ujian PGlite automatik
(`test-client-master.mjs` 85/85, `test-account-manager-resolution.mjs` 145/145).
**Skop setiap kriteria dinyatakan secara eksplisit.**

### K1 — 6 lajur baharu
```sql
SELECT 'K1' AS k, c.table_name, c.column_name, c.data_type, c.is_nullable
  FROM information_schema.columns c
 WHERE c.table_schema='public'
   AND (   (c.table_name='organizers' AND c.column_name IN
             ('client_code','sst_registration_no','billing_address','payment_terms_days'))
        OR (c.table_name IN ('invoices','import_staging') AND c.column_name='account_manager_id'))
 ORDER BY c.table_name, c.column_name;
```
**Jangkaan: tepat 6 baris**, semua `is_nullable = YES`.

### K2 — 2 jadual baharu + RLS + 8 polisi
```sql
SELECT 'K2a' AS k, t.tbl,
       to_regclass('public.' || t.tbl) IS NOT NULL AS wujud,
       (SELECT relrowsecurity FROM pg_class
         WHERE oid = ('public.' || t.tbl)::regclass) AS rls
  FROM (VALUES ('account_manager_aliases'),('external_account_managers')) AS t(tbl);

SELECT 'K2b' AS k, c.relname AS jadual, p.polname,
       CASE p.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
                     WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE'
                     WHEN '*' THEN 'ALL' END AS command
  FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
 WHERE c.relname IN ('account_manager_aliases','external_account_managers')
 ORDER BY c.relname, p.polname;
```
**Jangkaan:** K2a → kedua-duanya `wujud = true`, `rls = true`.
K2b → **tepat 8 baris** (4 setiap jadual).

### K3 — lajur MENTAH masih utuh
```sql
SELECT 'K3' AS k, c.table_name, c.column_name, c.data_type
  FROM information_schema.columns c
 WHERE c.table_schema='public' AND c.column_name='account_manager'
   AND c.table_name IN ('invoices','import_staging') ORDER BY c.table_name;
```
**Jangkaan: 2 baris, `text`** — tidak berubah daripada J1h.

### K4 — 12 fungsi: keselamatan (veto §2.8)
```sql
SELECT 'K4' AS k, p.proname,
       pg_get_function_result(p.oid) AS returns,
       p.prosecdef                   AS security_definer,
       p.provolatile                 AS volatility,
       p.proconfig                   AS config,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon_exec,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname='public'
   AND (p.proname LIKE 'am\_%'
        OR p.proname IN ('can_resolve_account_managers','is_external_account_manager',
                         'normalize_person_name','resolve_account_manager'))
 ORDER BY p.proname;
```
**Jangkaan: tepat 12 baris.** Untuk **SEMUA**:
`security_definer = true` **kecuali** `normalize_person_name` (ia `false`,
`IMMUTABLE`, `volatility = 'i'`); `config` mengandungi `search_path=public`;
`anon_exec = false`; `auth_exec = true`.

`resolve_account_manager` → `returns = uuid`, `volatility = 's'`.
`am_list_staff` → `returns = TABLE(id uuid, full_name text)` — **HANYA dua
kolum itu**. Jika ia mengembalikan `role`, `account_status` atau `email`,
itu **pelanggaran veto §2.8** → laporkan 🔴.

### K5 — integriti rujukan
```sql
SELECT 'K5' AS k, c.conrelid::regclass AS jadual, ref.relname AS rujukan_ke,
       c.confdeltype AS on_delete
  FROM pg_constraint c JOIN pg_class ref ON ref.oid = c.confrelid
 WHERE c.contype='f'
   AND (SELECT a.attname FROM pg_attribute a
         WHERE a.attrelid=c.conrelid AND a.attnum=c.conkey[1]) = 'account_manager_id'
 ORDER BY 2;
```
**Jangkaan: 2 baris**, kedua-duanya `rujukan_ke = user_profiles`,
`on_delete = 'a'` (**NO ACTION** — bukan CASCADE, supaya sejarah invois tidak
boleh terhapus apabila staf dibuang).

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

### K6b — veto §2.4 masih hidup untuk nilai TANPA keputusan manusia
```sql
SELECT 'K6b' AS k, k.raw_text,
       public.resolve_account_manager(k.raw_text) AS id
  FROM (VALUES ('Faiz / Siti'), ('Ali, Abu'), ('X dan Y')) AS k(raw_text);
```
**Jangkaan: ketiga-tiganya NULL.** Jika mana-mana satunya menyelesaikan kepada
seorang staf, veto §2.4 **rosak** → 🔴.

### K7 — seed DP-8/DP-9 direkodkan
```sql
SELECT 'K7a' AS k, al.raw_text, up.full_name AS kepada, al.notes
  FROM public.account_manager_aliases al
  JOIN public.user_profiles up ON up.id = al.user_id ORDER BY al.raw_text;

SELECT 'K7b' AS k, raw_text, display_name, reason, notes
  FROM public.external_account_managers ORDER BY raw_text;
```
**Jangkaan:** K7a → **3 baris**, semua `kepada = Fuziah`
(`Fuzy`, `Fuzy / Dila`, `Fuzy / Sholihin`). K7b → **1 baris**: `Ow Zi Qi`.

### K8 — rumusan kategori: tiada baki senyap
```sql
SELECT 'K8' AS k, kategori, count(*) AS bilangan_nilai, sum(jumlah_baris) AS baris
  FROM public.am_unresolved_values() GROUP BY kategori ORDER BY kategori;
```
**Jangkaan di live: 0 BARIS** — kerana J1f membuktikan live tiada nilai
`Account Manager` (§2.3). **Ini betul, bukan kegagalan.**

### K9 — kebenaran
```sql
SELECT 'K9' AS k,
       public.can_resolve_account_managers() AS saya_berkuasa,
       (SELECT count(*) FROM public.am_list_staff()) AS bilangan_staf_dilihat,
       (SELECT count(*) FROM public.am_unresolved_values()) AS bilangan_nilai;
```
Jalankan sebagai **Super Admin** dan, jika boleh, sebagai pengguna ber-peranan
`staff`/`viewer`.
**Jangkaan:** Super Admin → `saya_berkuasa = true`, `bilangan_staf_dilihat = 20`
(atau bilangan profil `is_active = true` daripada J0a). Pengguna `viewer` →
`false` dan **0** untuk kedua-dua bilangan.

> **Jangan** cuba menulis sebagai `viewer` — `am_confirm_alias()` akan menaikkan
> `42501`, dan percubaan itu akan masuk jejak audit. Laporkan K9 sebagai
> bacaan sahaja; kawalan tulis sudah dibuktikan dalam PGlite.

### K10 — pemasangan TIDAK mengubah data perniagaan
Jalankan **J0e** semula dan bandingkan dengan baseline J1 anda:

| Jadual | Jangkaan |
|---|---|
| `import_staging` | **1124** (tidak berubah) |
| `invoices` | **6** (tidak berubah) |
| `organizers` | **12** (tidak berubah) |
| `programmes` | **14** (tidak berubah) |
| `user_profiles` | **20** (tidak berubah) |
| `audit_logs` | **> 44** — **BERTAMBAH adalah DIJANGKA** (seed menulis jejak audit). Laporkan angka baharu. |

Sebarang perubahan pada lima jadual pertama = 🔴.

### K11 — inventori jadual: 18 → 20
```sql
SELECT 'K11' AS k, count(*) AS bilangan_jadual
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname='public' AND c.relkind='r'
   AND c.relname NOT IN ('schema_migrations','spatial_ref_sys');
```
**Jangkaan: 20** (17 rasmi + 3 warisan).

### K12 — idempotensi
Jalankan **Langkah 1, 2 dan 3 sekali lagi** (bukan Langkah 4).
**Jangkaan: tiada ralat.** Kemudian jalankan K1 semula → masih **6 baris**;
K4 → masih **12 baris**; K10 → data tidak berubah.

> Langkah 4 **boleh** dijalankan semula dengan selamat (ia idempoten melalui
> `ON CONFLICT` / `am_confirm_external`), tetapi tidak perlu.

---

---

### L4v — versi platform (read-only, 🔴 LAPORKAN)
```sql
SELECT 'versi' AS check_name, current_setting('server_version') AS server_version,
       version() AS versi_penuh,
       current_setting('server_version_num')::int AS versi_num,
       (SELECT count(*) FROM pg_constraint
         WHERE connamespace = 'public'::regnamespace AND contype = 'n') AS kekangan_not_null_bernama;
```
**Jangkaan:** `kekangan_not_null_bernama` = **0** jika live lebih lama daripada
PostgreSQL 18, dan **> 0** jika live PG 18. Kedua-duanya SAH — yang penting ialah
nilai itu **direkodkan**, kerana ia menentukan sama ada perbezaan katalog seperti
R6b (DP-14.1) ialah artifak versi atau kecacatan sebenar.
> 🟢 **Laporkan nombor versi ini walaupun ia kelihatan tidak relevan.** Ia bukan
> kriteria lulus/gagal; ia fakta platform yang Arena perlukan untuk mentafsir
> sebarang perbezaan katalog pada langkah seterusnya.


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
`seed-account-manager-aliases.sql` **sudah dipasang**, dan sertakan cap jari yang anda sahkan
(bersama `⏳` bagi yang tidak dapat dikira).

**Berhenti selepas laporan.** Jangan mula langkah berikutnya sehingga Arena
menyemak laporan ini.
