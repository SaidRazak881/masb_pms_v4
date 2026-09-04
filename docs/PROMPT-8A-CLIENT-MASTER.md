# PROMPT 8A — Pasang `client-master.sql` (Induk Pelanggan + Penyelesaian Pengurus Akaun)

> ## 🔴 HARD GATE — JANGAN JALANKAN SEBELUM PENGGUNA MELULUSKAN
>
> Prompt ini mengandungi **SQL yang mengubah skema pangkalan data LIVE**
> (`lmenmfsbjgxfhnykkgow`). Ia menambah 6 lajur, 1 jadual baharu, 3 indeks,
> 2 fungsi dan 4 polisi RLS.
>
> **Sebab gate ini wujud:** perubahan skema pada pangkalan data produksi tidak
> boleh dibatalkan secara senyap, dan lajur yang ditambah akan diwarisi oleh
> Fasa 8C (quotation), 8E (pipeline) dan 8F (P&L/komisen). Jika gate ini perlu
> dibatalkan, ia hanya boleh dibatalkan oleh pengguna secara bertulis.
>
> **Status:** ⏳ MENUNGGU KELULUSAN PENGGUNA
>
> **Yang boleh ChatGPT lakukan SEKARANG tanpa kelulusan:** TUGASAN 1 sahaja
> (query J1 — **read-only sepenuhnya**). Laporkan J1, kemudian BERHENTI.

---

## BLOK 1 — PERSONA

Baca fail persona di
https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/docs/personas/PERSONA-SQL-ARCHITECT.md
(klik **Raw**) dan **AMALKAN** persona itu sepanjang tugasan.

Persona kedua (untuk kriteria keselamatan J4/J10): baca juga
https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/docs/personas/PERSONA-SECURITY-REVIEW.md

## BLOK 2 — PETA KOD

Baca peta kod terkini di
https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/docs/CODEBASE-MAP.md
(klik **Raw**). Gunakan sebagai konteks struktur sistem — modul mana yang wujud,
jadual/RPC mana yang ada, fail mana masih mock/demo. **JANGAN** cadangkan perkara
yang sudah wujud.

Rekod keputusan panel yang mewajibkan fasa ini (konteks reka bentuk):
https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/docs/PANEL-PAKAR-TPMS.md
— baca **DP-1** (roadmap 8A–8H), **DP-2** (reka bentuk induk pelanggan),
**DP-2a** (peraturan token pertama), **DP-3** (penomboran semula),
**DP-4** (allowlist W1), **DP-5** (tingkah laku fungsi `STABLE`).

---

## BLOK 3 — KONTEKS: apa yang rosak dan kenapa ia mesti dibaiki dahulu

### 3.1 Penemuan yang diukur (bukan dijangka)

Lajur **H "Account Manager"** dalam `V4 RAW/00. Quotation Tracker (1).xlsx`
mengandungi **teks bebas** yang merujuk kepada orang sebenar:

| Nilai mentah (verbatim) | Bilangan baris | Realiti |
|---|---|---|
| `Abu Said` | 3 | Satu orang — `Abu Sa'id` |
| `Abu said` | 1 | **Orang yang sama**, huruf besar/kecil berbeza |
| `Adilah` | 53 | `Adilah` |
| `Farrah` | 148 | `Farrah` |
| `Fuziah` | 7 | `Fuziah` |
| `Fuzy` | 8 | **Mungkin** `Fuziah` — TIDAK pasti |
| `Fuzy / Dila` | 4 | **DUA orang** dalam satu sel |
| `Fuzy / Sholihin ` (ruang hujung) | 2 | **DUA orang** dalam satu sel |
| `Omar` | 26 | `Omar` |
| `Ow Zi Qi` | 3 | **Tiada** dalam senarai staf |
| `Sholihin` | 3 | `Sholihin` |
| `Zalina` | 7 | `Zalina Sayuti` |

**12 rentetan unik, 265 baris, tetapi hanya ~8 orang sebenar.**
Senarai staf sebenar (18 orang bernama) diambil daripada
`V4 RAW/User Profiles Mapping.xlsx`.

### 3.2 Kenapa ini menghalang fasa seterusnya

Lajur ini kini **TEXT mentah**. Setiap laporan "mengikut pengurus akaun" akan
mengira `Abu Said` dan `Abu said` sebagai **dua orang berbeza**, dan akan
mengagihkan baris `Fuzy / Dila` kepada **seorang sahaja** (atau tiada siapa).

Fasa **8C** (quotation), **8E** (pipeline/funnel) dan **8F** (komisen) semuanya
mengagih hasil kerja kepada pengurus akaun. Jika ia dibina di atas lajur ini,
ralat itu akan **diwarisi dan disembunyikan** di dalam tiga domain baharu.

Oleh itu Panel DP-1 meletakkannya sebagai **prasyarat 8A**.

### 3.3 Prinsip reka bentuk (veto panel yang MESTI dipatuhi)

**Sistem MENGINGAT keputusan manusia; ia TIDAK MENEKA.**

- Nilai mentah TEXT **dikekalkan** (jejak audit — tidak boleh diubah)
- Pautan UUID **selesai** ditambah (untuk laporan)
- Bila kabur → **NULL**. Tiada padanan "terdekat".
- `Fuzy` → **NULL**, bukan `Fuziah`. Hanya selepas manusia mengesahkannya ia
  masuk `account_manager_aliases`, dan selepas itu ia selesai secara konsisten.
- Sel berbilang orang (`Fuzy / Dila`) → **NULL** selagi tiada manusia
  memutuskannya. **Sistem** tidak akan memilih seorang daripada dua (veto
  Pakar Kewangan §2.4, masih berkuat kuasa).
- **KEMASKINI DP-8 (keputusan pengguna 2026-09-04):** pengguna memutuskan
  `'Fuzy'`, `'Fuzy / Dila'` dan `'Fuzy / Sholihin '` **ketiga-tiganya** diagih
  kepada **Fuziah**. Jadi alias manusia kini mempunyai keutamaan TERTINGGI
  dalam `resolve_account_manager()` — ia diperiksa **SEBELUM** penolakan
  berbilang-orang. Veto §2.4 kekal hidup untuk semua nilai yang belum
  diputuskan manusia (dibuktikan: `'Faiz / Siti'` tanpa alias → NULL).
  Keputusan ini direkodkan sebagai DATA oleh
  `lib/supabase/seed-account-manager-aliases.sql` (prompt 8A-3 berasingan).
  **Liputan kini 11/12 nilai**; hanya `'Ow Zi Qi'` (3 baris) kekal terbuka.

### 3.4 Apa yang Arena sudah bina dan uji dalam repo

| Fail | Kandungan | Status |
|---|---|---|
| `lib/supabase/client-master.sql` | 371 baris. 6 `ADD COLUMN`, 1 `CREATE TABLE`, 3 indeks, 2 fungsi, 4 polisi RLS, 6 `COMMENT ON`. **Sifar** DROP/DELETE/UPDATE/TRUNCATE/RENAME. | ✅ ditulis |
| `scripts/test-client-master.mjs` | **83/83 LULUS** dalam PGlite, menggunakan 18 nama staf SEBENAR dan 12 nilai SEBENAR di atas. | ✅ hijau |
| `docs/PROMPT-6C-AUDIT-LEGACY-TABLES.md` | Allowlist `W1_public_tables` dikemas kini 15 → **16** jadual rasmi (lihat DP-4). | ✅ dikemas kini |

Seluruh suite SQL repo: **15/15 suite lulus**, `tsc --noEmit` bersih.

### 3.5 Apa yang fail ini TIDAK lakukan (sempadan skop)

- ❌ **TIDAK** mengisi `account_manager_id` pada mana-mana baris sedia ada.
      Itu **migrasi data berasingan** yang memerlukan keputusan manusia untuk
      4 nilai kabur. Ia akan menjadi prompt 8A-2, **bukan** prompt ini.
- ❌ **TIDAK** menamakan semula `organizers` → `clients`. Ditangguhkan ke
      **Fasa 8H** (Panel DP-2/DP-3).
- ❌ **TIDAK** mencipta jadual `clients` selari — itu akan menghasilkan dua
      induk dan melanggar keputusan pengguna #2 ("satu entiti Pelanggan").
- ❌ **TIDAK** menyentuh quotation, invois, atau data perniagaan lain.

---

## 4. TUGASAN 1 — Query KEADAAN SEBELUM (J1) 🔴 WAJIB, JALANKAN DAN LAPORKAN **DAHULU**

> **ARAHAN EKSPLISIT (pelajaran #10):** jalankan **SEMUA** query J1 di bawah
> **SEKARANG**, dan **masukkan hasilnya ke dalam laporan SEBELUM** anda melakukan
> apa-apa tindakan lain. J1 ialah **read-only sepenuhnya** — tiada `INSERT`,
> `UPDATE`, `DELETE`, `DDL`, `GRANT` atau `REVOKE`. Ia **tidak memerlukan
> kelulusan pengguna**.
>
> **JANGAN** teruskan ke TUGASAN 2 sehingga J1 dilaporkan.

```sql
-- J1a: adakah 6 lajur baharu SUDAH wujud? (jangkaan: 0 baris)
SELECT 'J1a_new_columns' AS check_name, c.table_name, c.column_name, c.data_type
  FROM information_schema.columns c
 WHERE c.table_schema = 'public'
   AND (   (c.table_name = 'organizers'      AND c.column_name IN
             ('client_code','sst_registration_no','billing_address','payment_terms_days'))
        OR (c.table_name = 'invoices'        AND c.column_name = 'account_manager_id')
        OR (c.table_name = 'import_staging'  AND c.column_name = 'account_manager_id'))
 ORDER BY c.table_name, c.column_name;

-- J1b: adakah jadual alias SUDAH wujud? (jangkaan: 'BELUM WUJUD')
SELECT 'J1b_aliases_table' AS check_name,
       CASE WHEN to_regclass('public.account_manager_aliases') IS NULL
            THEN 'BELUM WUJUD' ELSE 'SUDAH WUJUD' END AS keadaan;

-- J1c: adakah 2 fungsi SUDAH wujud? (jangkaan: 2 baris 'BELUM WUJUD')
SELECT 'J1c_functions' AS check_name, f.fname,
       CASE WHEN to_regprocedure('public.' || f.fname) IS NULL
            THEN 'BELUM WUJUD' ELSE 'SUDAH WUJUD' END AS keadaan
  FROM (VALUES ('normalize_person_name(text)'),
               ('resolve_account_manager(text)')) AS f(fname);

-- J1d: NILAI ENUM app_role SEBENAR di live.
--      JANGKAAN: LAPAN (8) nilai — viewer, executive, manager, admin, staff,
--      finance, head_governance, super_admin.
--      'super_admin' DITAMBAH oleh lib/supabase/user-management.sql Bahagian 1a
--      (ALTER TYPE ... ADD VALUE 'super_admin'), dan Fasa 6 SUDAH dipasang
--      di live (PROMPT-6G ✅ SELESAI).
--      NOTA: schema-master.sql:202 mencipta enum dengan TUJUH nilai sahaja,
--      jadi repo dan live BERBEZA di sini secara sengaja (drift terkawal).
--      Super Admin juga dilindungi DI DALAM has_role() (schema-master.sql:274),
--      yang mengembalikan true untuk SEMUA peranan bila role = 'super_admin'.
SELECT 'J1d_app_role_enum' AS check_name, e.enumlabel, e.enumsortorder
  FROM pg_enum e
  JOIN pg_type t ON t.oid = e.enumtypid
 WHERE t.typname = 'app_role'
 ORDER BY e.enumsortorder;

-- J1e: BASELINE bilangan baris — diperlukan untuk membuktikan J7
--      (pemasangan tidak mengubah data). Simpan angka ini.
SELECT 'J1e_row_counts' AS check_name, t.tbl,
       (xpath('/row/cnt/text()',
         query_to_xml(format('SELECT count(*) AS cnt FROM %I.%I', t.sch, t.tbl),
                      false, true, '')))[1]::text::bigint AS row_count
  FROM (VALUES ('public','organizers'), ('public','invoices'),
               ('public','import_staging'), ('public','user_profiles'),
               ('public','programmes'), ('public','audit_logs')) AS t(sch, tbl)
 ORDER BY t.tbl;

-- J1f: BASELINE nilai Account Manager MENTAH yang sudah ada di live.
--      Ini membandingkan data live dengan 12 nilai Excel yang diukur di §3.1.
SELECT 'J1f_raw_invoices' AS check_name, 'invoices' AS sumber,
       account_manager AS nilai_mentah, count(*) AS bilangan
  FROM public.invoices
 WHERE account_manager IS NOT NULL AND btrim(account_manager) <> ''
 GROUP BY account_manager
UNION ALL
SELECT 'J1f_raw_staging', 'import_staging', account_manager, count(*)
  FROM public.import_staging
 WHERE account_manager IS NOT NULL AND btrim(account_manager) <> ''
 GROUP BY account_manager
 ORDER BY 2, 3;

-- J1g: BASELINE inventori jadual public — jangkaan 15 rasmi + 3 warisan = 18.
--      Selepas pemasangan: 16 rasmi + 3 warisan = 19 (lihat DP-4).
SELECT 'J1g_public_tables' AS check_name, count(*) AS bilangan_jadual
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r'
   AND c.relname NOT IN ('schema_migrations','spatial_ref_sys');

-- J1h: adakah lajur MENTAH account_manager wujud (mesti KEKAL selepas pemasangan)?
SELECT 'J1h_raw_columns' AS check_name, c.table_name, c.column_name, c.data_type
  FROM information_schema.columns c
 WHERE c.table_schema = 'public'
   AND c.column_name = 'account_manager'
   AND c.table_name IN ('invoices','import_staging')
 ORDER BY c.table_name;
```

**Selepas melaporkan J1, BERHENTI dan tunggu kelulusan pengguna untuk TUGASAN 2.**

---

## 5. TUGASAN 2 — Pasang `lib/supabase/client-master.sql` 🟢 (hanya selepas kelulusan pengguna)

### Langkah 1 — Ambil fail dan sahkan integriti

Ambil fail daripada branch sesi:
https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/lib/supabase/client-master.sql
(klik **Raw**)

**Sahkan SHA-256 fail yang anda ambil SEPADAN:**

```
d394398dc075f92c61db13077be568e907fb77989ef1175146682ce251418542
```

Jika **tidak sepadan**: JANGAN jalankan. Laporkan SHA yang anda dapat dan berhenti.

### Langkah 2 — Jalankan keseluruhan fail pada pangkalan data LIVE

Jalankan fail itu **apa adanya**, dalam **satu** pelaksanaan. Jangan ubah suai,
jangan pilih sebahagian, jangan tambah kenyataan.

### Langkah 3 — Sahkan pemasangan dengan kriteria J2–J10 (§6)

---

## 6. Kriteria J — laporan SELEPAS pemasangan

Setiap kriteria di bawah **diterbitkan daripada ujian automatik PGlite**
(`scripts/test-client-master.mjs`, 83/83 lulus), bukan daripada kiraan manual
(pelajaran #1). **Skop setiap kriteria dinyatakan secara eksplisit.**

### J2 — 6 lajur baharu wujud, dengan jenis dan kebolehan-null yang betul

```sql
SELECT 'J2' AS j, c.table_name, c.column_name, c.data_type, c.is_nullable
  FROM information_schema.columns c
 WHERE c.table_schema='public'
   AND (   (c.table_name='organizers' AND c.column_name IN
             ('client_code','sst_registration_no','billing_address','payment_terms_days'))
        OR (c.table_name IN ('invoices','import_staging') AND c.column_name='account_manager_id'))
 ORDER BY c.table_name, c.column_name;
```
**Jangkaan:** tepat **6 baris**. `client_code`/`sst_registration_no`/`billing_address`
= `text`; `payment_terms_days` = `integer`; kedua-dua `account_manager_id` = `uuid`.
Semua `is_nullable = YES` (tiada lajur NOT NULL baharu — tidak akan memecahkan
INSERT sedia ada).

### J3 — lajur MENTAH masih wujud (jejak audit tidak rosak)

Gunakan query **J1h** semula. **Jangkaan:** 2 baris, `data_type = text`,
**tidak berubah** daripada J1h.

### J4 — jadual alias + RLS + 4 polisi

```sql
SELECT 'J4a_table' AS j, to_regclass('public.account_manager_aliases') AS regclass,
       (SELECT relrowsecurity FROM pg_class
         WHERE oid='public.account_manager_aliases'::regclass) AS rls_enabled;

SELECT 'J4b_policies' AS j, p.polname,
       CASE p.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
                     WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE'
                     WHEN '*' THEN 'ALL' END AS command,
       pg_get_expr(p.polqual, p.polrelid)     AS using_expr,
       pg_get_expr(p.polwithcheck, p.polrelid) AS check_expr
  FROM pg_policy p
 WHERE p.polrelid = 'public.account_manager_aliases'::regclass
 ORDER BY p.polname;
```
**Jangkaan:** J4a → `regclass` bukan NULL, `rls_enabled = true`.
J4b → tepat **4 baris**: `am_aliases_read` (SELECT), `am_aliases_write` (INSERT),
`am_aliases_update` (UPDATE), `am_aliases_delete` (DELETE).
`am_aliases_read` → `USING (true)`. Yang lain → mengandungi `has_role`.

> **NOTA ENUM (DP-2/DP-3/DP-6):** polisi-polisi ini memanggil `has_role('admin')`,
> `has_role('head_governance')`, `has_role('finance')` — dan **sengaja tidak**
> memanggil `has_role('super_admin')`.
>
> Di live, `super_admin` **MEMANG** satu nilai enum (ditambah oleh
> `user-management.sql` Bahagian 1a; Fasa 6 sudah dipasang). Tetapi Super Admin
> tetap dilindungi kerana `has_role()` sendiri (schema-master.sql:274)
> mengembalikan `true` untuk **SEMUA** peranan apabila
> `current_user_role()::text = 'super_admin'`.
>
> **Pembetulan Arena:** draf awal menulis `'super_admin'::public.app_role` dalam
> polisi, yang gagal dengan ralat **22P02** semasa ujian PGlite kerana
> `schema-master.sql:202` mencipta enum dengan hanya tujuh nilai. Ia dibetulkan
> sebelum prompt ini dihantar. Dibuktikan oleh
> `scripts/test-prompt-8a-j1-queries.mjs` seksyen [5].

### J5 — 2 fungsi: tandatangan, `SECURITY DEFINER`, `search_path` terkunci, grant

```sql
SELECT 'J5' AS j, p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       pg_get_function_result(p.oid)             AS returns,
       p.prosecdef                               AS security_definer,
       p.provolatile                             AS volatility,
       p.proconfig                               AS config,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon_can_exec,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can_exec
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname='public'
   AND p.proname IN ('normalize_person_name','resolve_account_manager')
 ORDER BY p.proname;
```
**Jangkaan (2 baris):**

| fungsi | returns | security_definer | volatility | config | anon | authenticated |
|---|---|---|---|---|---|---|
| `normalize_person_name` | `text` | `false` | `i` (IMMUTABLE) | `{search_path=public}` | `false` | `true` |
| `resolve_account_manager` | `uuid` | `true` | `s` (STABLE) | `{search_path=public}` | `false` | `true` |

**Kenapa `resolve_account_manager` ialah `SECURITY DEFINER` (veto Keselamatan §2.8):**
ia perlu membaca `user_profiles` merentasi RLS kerana staf biasa tidak boleh
melihat senarai staf penuh, tetapi perlu melihat pengurus akaun pada invois yang
boleh mereka akses. **Pendedahan diminimumkan: ia mengembalikan HANYA satu UUID** —
tiada nama, peranan, `account_status` atau e-mel staf. `REVOKE ... FROM PUBLIC`
menghalang `anon`.

### J6 — UJIAN BERKELAKUAN terhadap 12 nilai SEBENAR (kriteria paling penting)

Jalankan fungsi terhadap **12 nilai mentah sebenar** daripada §3.1 dan bandingkan
dengan keputusan PGlite. **Ini read-only** — tiada data ditulis.

```sql
WITH kes(raw_text, jangkaan) AS (VALUES
  ('Abu Said',          'Abu Sa'id'),
  ('Abu said',          'Abu Sa''id'),
  ('Adilah',            'Adilah'),
  ('Farrah',            'Farrah'),
  ('Fuziah',            'Fuziah'),
  ('Fuzy',              NULL),
  ('Fuzy / Dila',       NULL),
  ('Fuzy / Sholihin ',  NULL),
  ('Omar',              'Omar'),
  ('Ow Zi Qi',          NULL),
  ('Sholihin',          'Sholihin'),
  ('Zalina',            'Zalina Sayuti'))
SELECT 'J6' AS j,
       k.raw_text                                   AS nilai_mentah,
       p.full_name                                  AS diselesaikan_kepada,
       k.jangkaan                                   AS jangkaan_pglite,
       CASE WHEN p.full_name IS NOT DISTINCT FROM k.jangkaan
            THEN 'SEPADAN' ELSE '❌ BEZA' END       AS keputusan
  FROM kes k
  LEFT JOIN LATERAL (
        SELECT up.full_name
          FROM public.user_profiles up
         WHERE up.id = public.resolve_account_manager(k.raw_text)
         LIMIT 1) p ON true
 ORDER BY k.raw_text;
```

**Jangkaan:** 12 baris, **SEMUA `SEPADAN`** — iaitu **8 selesai**, **4 NULL**.

> **NOTA DP-8:** jangkaan di atas mengandaikan `account_manager_aliases`
> **KOSONG** (keadaan sebaik sahaja 8A dipasang). Selepas seed DP-8
> (`seed-account-manager-aliases.sql`, prompt 8A-3 berasingan) dijalankan,
> `Fuzy`, `Fuzy / Dila` dan `Fuzy / Sholihin ` akan menyelesaikan kepada
> **Fuziah** → liputan menjadi **11/12**. Jika J6 dijalankan **selepas** seed
> itu, jangkaannya berbeza; laporkan yang mana satu berlaku.

> ⚠️ **NULL DI SINI IALAH JAWAPAN YANG BETUL, BUKAN KEGAGALAN.**
> `Fuzy`, `Fuzy / Dila`, `Fuzy / Sholihin ` dan `Ow Zi Qi` **mesti** NULL.
> Jika mana-mana satunya kembali kepada seorang staf, itu bermakna sistem
> **meneka** — laporkan sebagai 🔴.

> ⚠️ **Jangkaan bergantung pada senarai staf live.** Query di atas membandingkan
> dengan `user_profiles` **live**. Jika live mengandungi staf yang **tiada** dalam
> 18 nama `User Profiles Mapping.xlsx` (contohnya dua orang bernama `Nur ...`),
> beberapa nilai yang dijangka selesai boleh kembali NULL kerana **syarat keunikan**
> menolaknya. Itu tingkah laku **betul**, bukan ralat. Jika ia berlaku:
> **JANGAN** ubah jangkaan secara senyap — laporkan nama staf tambahan itu dalam
> Seksyen 5 supaya Arena boleh mengemas kini ujian.

### J6b — Syarat keunikan (veto QA §2.7), tanpa menulis data

```sql
WITH kes(raw_text) AS (VALUES ('Ain'), ('Nur'), ('arah'), ('Siti Sar'))
SELECT 'J6b' AS j, k.raw_text,
       (SELECT count(*) FROM public.user_profiles up
         WHERE up.id = public.resolve_account_manager(k.raw_text)) AS bilangan_selesai,
       (SELECT up.full_name FROM public.user_profiles up
         WHERE up.id = public.resolve_account_manager(k.raw_text) LIMIT 1) AS kepada
  FROM kes k ORDER BY k.raw_text;
```
**Jangkaan dalam PGlite:** `Ain` → 0 (had panjang minimum 4 aksara),
`arah` → 0 (2 staf mengandungi substring), `Siti Sar` → 1 (`Siti Sarah`),
`Nur` → bergantung pada bilangan staf live bertoken pertama `nur`
(**0 atau 1, tidak boleh >1**). Laporkan nilai sebenar.

### J6c — Ujian alias **TANPA meninggalkan data** (`BEGIN … ROLLBACK`)

> 🔴 **NOTA TINGKAH LAKU POSTGRESQL — BACA SEBELUM MENJALANKAN (DP-5).**
> `resolve_account_manager` ialah **`STABLE`**. Fungsi `STABLE` menggunakan
> **snapshot yang sama** dengan kenyataan pemanggilnya, jadi ia **TIDAK NAMPAK**
> baris yang dimasukkan oleh kenyataan itu sendiri.
>
> **JANGAN** tulis begini — ia akan mengembalikan NULL dan kelihatan seperti
> kegagalan palsu:
> ```sql
> INSERT INTO public.account_manager_aliases (...) VALUES (...)
> RETURNING (SELECT public.resolve_account_manager('Fuzy'));   -- ❌ SALAH
> ```
> **MESTI** pisahkan kepada dua kenyataan, seperti di bawah.

Ambil `<UUID_FUZIAH>` daripada:
```sql
SELECT id, full_name FROM public.user_profiles WHERE full_name = 'Fuziah';
```

Kemudian jalankan **tiga kenyataan ini dalam satu transaksi**:
```sql
BEGIN;
INSERT INTO public.account_manager_aliases (raw_text, user_id, confirmed_by, notes)
VALUES ('Fuzy', '<UUID_FUZIAH>', auth.uid(), 'UJIAN 8A — akan dibatalkan dengan ROLLBACK');

SELECT public.resolve_account_manager('Fuzy') AS selepas_alias;   -- kenyataan BERASINGAN

ROLLBACK;
```

Kemudian sahkan tiada apa tertinggal:
```sql
SELECT 'J6c_bersih' AS j,
       count(*) AS bilangan_alias,
       (SELECT public.resolve_account_manager('Fuzy')) AS selepas_rollback
  FROM public.account_manager_aliases;
```
**Jangkaan:** `selepas_alias` = `<UUID_FUZIAH>` (alias mengatasi kekaburan);
`bilangan_alias` = **0**; `selepas_rollback` = **NULL**.

Jika alat anda tidak menyokong `BEGIN`/`ROLLBACK` berbilang kenyataan, laporkan
**operasi spesifik** yang tiada dan **JANGAN** gantikan dengan INSERT kekal —
tanda J6c sebagai `⏳ MENUNGGU PENGGUNA`.

### J7 — Pemasangan TIDAK mengubah data (bandingkan dengan J1e)

Jalankan query **J1e** semula. **Jangkaan:** setiap `row_count` **TEPAT SAMA**
dengan J1e. Sebarang perbezaan = 🔴.

### J8 — Inventori jadual: 15 → 16 rasmi (DP-4)

Jalankan query **J1g** semula. **Jangkaan:** `bilangan_jadual` = nilai J1g **+ 1**
(jadual `account_manager_aliases`). Secara nominal **18 → 19**.

### J9 — Idempotensi: jalankan fail KALI KEDUA

Jalankan keseluruhan `client-master.sql` **sekali lagi**, tanpa pengubahsuaian.
**Jangkaan:** **tiada ralat**. Kemudian jalankan J2 semula — masih **6 baris**
(bukan 12), dan J7 semula — bilangan baris masih tidak berubah.

### J10 — `anon` tidak boleh melaksanakan fungsi

Sudah diliputi dalam J5 (`anon_can_exec = false` untuk kedua-dua fungsi).
Laporkan nilai verbatim.

---

## 7. Larangan

1. **JANGAN** ubah skema/RLS/RPC/trigger/seed/storage/password selain apa yang
   terkandung dalam `lib/supabase/client-master.sql` seperti yang diluluskan.
2. **JANGAN** guna `service_role` dalam sebarang ujian atau query.
3. **JANGAN** panggil RPC tulis perniagaan (`sync_import_transaction`,
   `lock_programme`, `unlock_programme`, `request_programme_unlock`,
   `submit_change_request`, `review_change_request`).
4. **JANGAN** reset atau ubah kata laluan mana-mana akaun.
5. **JANGAN** merge ke `main`. **Production Branch Vercel hanya boleh ditukar
   apabila prompt ini meluluskannya secara EKSPLISIT.** Prompt ini **TIDAK**
   meluluskannya — jadi ia **dilarang**.
6. **JANGAN** tampal anon key penuh atau sebarang rahsia dalam laporan.
7. **JANGAN** mereka-reka bukti. Setiap ✅ mesti ada bukti verbatim. Jika tidak
   dapat diuji, tulis `⏳ MENUNGGU PENGGUNA`.
8. **JANGAN** layan preview local (Mod Demo) sebagai production.
9. **JANGAN** berhenti senyap apabila alat gagal. Namakan **operasi spesifik**
   yang dicuba, tampal ralat penuh, kemudian teruskan bahagian lain yang boleh.
10. **JANGAN** DROP objek yang tidak diluluskan dalam prompt ini. (Fail SQL ini
    mengandungi `DROP POLICY IF EXISTS` untuk idempotensi RLS — itu **dibenarkan**
    dan diperlukan. Larangan ini berskop kepada **objek**, bukan kata kerja mutlak.)
11. **JANGAN** mengisi `account_manager_id` pada mana-mana baris sedia ada.
    Prompt ini **hanya** memasang struktur. Pengisian data ialah **prompt 8A-2**
    yang berasingan dan memerlukan keputusan manusia untuk 4 nilai kabur.
12. **JANGAN** masukkan baris kekal ke `account_manager_aliases`. Ujian J6c
    **mesti** berakhir dengan `ROLLBACK`.
13. **JANGAN** namakan semula `organizers` → `clients`. Ditangguhkan ke Fasa 8H.
14. **JANGAN** ubah jangkaan J6/J6b supaya ia "lulus". Jika keputusan live
    berbeza daripada PGlite, laporkan perbezaan itu — itu ialah penemuan,
    bukan kegagalan untuk disembunyikan.

---

## 8. FORMAT LAPORAN (6 seksyen)

### Seksyen 1 — Konteks & Status
Nama projek, pangkalan data (`lmenmfsbjgxfhnykkgow`), branch yang failnya
diambil, SHA-256 fail yang anda sahkan, dan sama ada pengguna sudah meluluskan
TUGASAN 2.

### Seksyen 2 — J1: keadaan SEBELUM (mesti diisi DAHULU)
Jadual: `J1a … J1h` | output verbatim | tafsiran.
**J1e (baseline baris) dan J1g (baseline jadual) MESTI ada** — J7 dan J8
membandingkan dengannya.

### Seksyen 3 — Tindakan yang diambil
Langkah sebenar + output/bukti verbatim. Nyatakan jika TUGASAN 2 **tidak**
dijalankan kerana menunggu kelulusan.

### Seksyen 4 — Keputusan kriteria J2–J10 (jadual)
`Kriteria` | `Status ✅/❌/⏳` | `Bukti verbatim` | `Jangkaan` | `Catatan`.
Untuk **J6**, tampal **kesemua 12 baris** — jangan ringkaskan.

### Seksyen 5 — Isu / Blocker / penemuan tak dijangka
🔴/🟠/🟢 + penerangan + bukti + cadangan.
**Wajib nyatakan secara eksplisit:**
- adakah senarai staf live **TEPAT 18** seperti `User Profiles Mapping.xlsx`,
  atau berbeza (senaraikan perbezaan)
- adakah `J1d` mengesahkan `super_admin` **ADA** dalam enum `app_role`
  (jangkaan: ADA, 8 nilai — kerana Fasa 6 sudah dipasang)
- adakah nilai `Account Manager` **live** (J1f) sepadan dengan 12 nilai Excel

### Seksyen 6 — Pengesahan pematuhan larangan
Senarai semak: setiap larangan 1–14 | dipatuhi ✅ / tidak ❌ | bukti.

---

## Nota untuk Arena (bukan untuk ChatGPT)

### Kenapa skop prompt ini SEMPIT
Hanya struktur. Tiada pengisian data, tiada rename, tiada UI. Sebab: pengisian
`account_manager_id` memerlukan keputusan manusia untuk 4 nilai kabur
(`Fuzy`, `Fuzy / Dila`, `Fuzy / Sholihin `, `Ow Zi Qi`) — dan panel DP-2
memutuskan sistem **tidak boleh meneka**. Mencampurkan kedua-duanya akan
memaksa kelulusan satu gate untuk dua jenis risiko yang berbeza.

### Perkara yang Arena sendiri rosakkan dan betulkan semasa kerja ini
Direkodkan supaya ia tidak berulang:

1. **`'super_admin'::public.app_role` → ralat 22P02.** Arena mereka-reka nilai
   enum. `schema-master.sql:202` mencipta enum dengan **tujuh** nilai:
   `viewer, executive, manager, admin, staff, finance, head_governance`.
   Dikesan oleh PGlite, bukan oleh live.

   **Susulan (DP-6):** pembetulan pertama Arena keterlaluan ke arah lain — ia
   menulis dalam prompt bahawa `super_admin` **tiada** dalam enum di live.
   Itu **salah**: `user-management.sql` Bahagian 1a menjalankan
   `ALTER TYPE public.app_role ADD VALUE 'super_admin'`, dan Fasa 6 **sudah**
   dipasang. Jadi live ada **lapan** nilai. Repo dan live berbeza di sini
   secara **sengaja dan terkawal**. Kedua-dua prompt dibetulkan, dan
   `scripts/test-prompt-8a-j1-queries.mjs` kini memuatkan `user-management.sql`
   supaya bootstrap ujian sepadan live (seksyen [3] + [5]).
2. **Perlanggaran penamaan fasa.** "7A" sudah digunakan oleh
   `PROMPT-7A-FIX-FIELD-MAPPING` yang sudah dilaksanakan. Roadmap DP-1
   dinomborkan semula ke **8A–8H** (DP-3).
3. **Regresi allowlist W1.** Menambah jadual baharu memecahkan
   `test-preflight-b-sql.mjs` §8. Ditetapkan kepada 16 (DP-4). Ujian sedia ada
   berfungsi seperti direka — ia menangkap kesilapan itu.
4. **Dua jangkaan ujian yang salah** — `'Nur'` (DP-2a) dan ujian substring
   `'Bin Sholihin'` yang sebenarnya unik. Kedua-duanya ialah kesilapan jangkaan
   Arena, bukan kesilapan kod.
5. **Dakwaan `INSERT … RETURNING (SELECT fungsi_STABLE(...))`** — salah.
   Dibuktikan di PGlite, direkodkan sebagai DP-5 dan pelajaran #11 templat.

### Status selepas prompt ini dijalankan
Jika J2–J10 semua ✅: struktur 8A **siap di live**. Langkah seterusnya ialah
**8A-2** (prompt pengisian data + pengesahan manusia untuk 4 nilai kabur),
kemudian **8B** (simpanan fail sumber + parse-semula).
