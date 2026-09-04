# PROMPT 8A-3 — Pasang Fasa 8A + 8A-2 + DP-9 (Induk Pelanggan & Penyelesaian Pengurus Akaun)

> ## 🟢 DILULUSKAN OLEH PENGGUNA (2026-09-04)
>
> Pengguna meluluskan pemasangan fail SQL Fasa 8A secara bertulis:
> > "Aku meluluskan 5 fail sql."
>
> **Satu perubahan skop yang perlu anda tahu:** fail ke-5
> (`fix-import-staging-updated-at.sql`) **disyorkan LANGKAU** — lihat §2.4.
> Bukti J1i daripada laporan anda sendiri menunjukkan lajur itu **sudah wujud**
> di live, jadi fail itu ialah no-op yang terbukti. Ia disenaraikan sebagai
> **Langkah 5 PILIHAN** di bawah, bukan dibuang senyap.
>
> **Project ref live yang BETUL:** `lmenmfsbjgxfhnykkgow` (20 aksara).
> Dua fail prompt 8A yang terdahulu mengandungi ref 21-aksara yang salah
> (`lmenmfsbjgxcfhnykkgow`) — itu typo Arena dan sudah dibetulkan. Anda
> mengesannya sendiri melalui `ZodError ... ref must be exactly 20 characters
> long`. Terima kasih; ia direkodkan sebagai DP-10.1.

---

## 1. PERSONA

Baca dan **AMALKAN** persona di
https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/docs/personas/PERSONA-SQL-ARCHITECT.md
(klik **Raw**).

Untuk kriteria keselamatan (K4, K9): baca juga
https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/docs/personas/PERSONA-SECURITY-REVIEW.md

Peta kod:
https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/docs/CODEBASE-MAP.md

Rekod panel (DP-1 … DP-10) — **baca DP-10 terlebih dahulu**, ia mengandungi
fakta live yang mengubah jangkaan:
https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/docs/PANEL-PAKAR-TPMS.md

---

## 2. KONTEKS — apa yang sudah diketahui daripada J1

### 2.1 Keadaan live yang anda sendiri laporkan

| Perkara | Nilai live | Implikasi untuk prompt ini |
|---|---|---|
| `app_role` enum | **8 nilai**, termasuk `super_admin` | ✅ Andaian DP-6 sah |
| `import_staging.updated_at` | **WUJUD** (`timestamptz`, NOT NULL, `now()`) | ✅ DP-7 **bukan** kecacatan live |
| Nilai `Account Manager` (J1f) | **`[]` — SIFAR** dalam `invoices` **dan** `import_staging` | 🔴 **mengubah jangkaan backfill** — lihat §2.3 |
| `user_profiles` | **20** baris | 🟠 ujian Arena mengandaikan 18 — lihat §2.2 |
| jadual `public` | **18** (15 rasmi + 3 warisan) | selepas pemasangan → **20** |
| baseline baris | `audit_logs=44`, `import_staging=1124`, `invoices=6`, `organizers=12`, `programmes=14`, `user_profiles=20` | diperlukan untuk K10 |

### 2.2 🟠 20 profil vs 18 nama — sebab J0 wujud

`resolve_account_manager()` bergantung kepada **syarat keunikan**: bila lebih
daripada satu staf padan, ia mengembalikan **NULL** (sistem enggan meneka).
Jadi bilangan dan nama profil live **menentukan** hasil K6.

Ujian PGlite Arena (`scripts/test-account-manager-resolution.mjs`, 145/145)
menyamai **18 staf bernama** daripada `V4 RAW/User Profiles Mapping.xlsx`.
Live ada **20**. Anda **betul** apabila enggan mereka-reka perbandingan itu
dalam laporan J1.

**J0 di §4 menyelesaikan ini dengan bukti, sebelum pemasangan.**

### 2.3 🔴 Jangkaan backfill yang BETUL (jangan lapor ini sebagai kegagalan)

Oleh kerana J1f = `[]`, live **tiada** nilai `Account Manager` untuk diisi:

| Fungsi | Jangkaan SEBENAR di live |
|---|---|
| `am_unresolved_values()` | **0 baris** |
| `am_backfill_preview()` | `akan_diisi = 0`, `kekal_null = 0`, `sudah_dipautkan = 0` |
| `am_backfill_account_manager()` | **`baris_diisi = 0`** untuk kedua-dua jadual |

**Ini BUKAN kegagalan.** 12 nilai `Account Manager` yang diukur wujud **hanya
dalam fail Excel sumber** (`V4 RAW/00. Quotation Tracker (1).xlsx`), yang
**belum pernah dimuatkan ke live**. Quotation Tracker akan dimuat dalam Fasa 8C.

**Jadi seed DP-8/DP-9 (Langkah 4) masih bernilai:** ia **pra-daftar** keputusan
pengguna supaya apabila Quotation Tracker diimport kelak, kesemua 12 nilai
selesai dengan serta-merta — tanpa perlu sesiapa mengingat keputusan itu semula.

### 2.4 Kenapa `fix-import-staging-updated-at.sql` disyorkan LANGKAU

DP-7 ialah **drift live→repo**: `schema-import-staging.sql` tidak mentakrifkan
`updated_at`, tetapi live **ada** lajur itu. Repo sudah dibetulkan supaya
pemasangan **baharu** tidak menghasilkan pangkalan data yang rosak.

Di live, fail itu ialah `ADD COLUMN IF NOT EXISTS` → **no-op yang terbukti**.
Menjalankan DDL yang tidak diperlukan pada produksi mengambil kunci
`ACCESS EXCLUSIVE` sebentar tanpa faedah. **Panel memutuskan: langkau**,
melainkan anda atau pengguna mahukannya sebagai langkah berjaga-jaga.

### 2.5 Apa yang fail-fail ini TIDAK lakukan

- ❌ TIDAK menamakan semula `organizers` → `clients` (ditangguh ke **Fasa 8H**)
- ❌ TIDAK mencipta jadual `clients` selari (melanggar keputusan pengguna #2)
- ❌ TIDAK menyentuh quotation, invois, atau data perniagaan
- ❌ TIDAK menambah nilai enum
- ❌ TIDAK mengubah Production Branch Vercel

---

## 3. RINGKASAN OBJEK YANG AKAN DICIPTA

| Fail | Objek |
|---|---|
| `client-master.sql` | 6 lajur, 1 jadual, 3 indeks, 2 fungsi, 4 polisi |
| `external-account-managers.sql` | 1 jadual, 2 indeks, 3 fungsi, 4 polisi |
| `account-manager-resolution.sql` | 7 fungsi |
| `seed-account-manager-aliases.sql` | 3 alias + 1 klasifikasi luar + jejak audit |
| **JUMLAH** | **2 jadual, 12 fungsi, 8 polisi, 6 lajur, 5 indeks** |

---

## 4. TUGASAN 1 — J0 (read-only, 🔴 JALANKAN DAN LAPORKAN **DAHULU**)

> **ARAHAN EKSPLISIT:** jalankan J0 **SEKARANG** dan masukkan hasilnya ke dalam
> laporan **SEBELUM** sebarang pemasangan. J0 read-only sepenuhnya.

```sql
-- J0a: SEMUA profil live — nama sebenar, bukan bilangan.
--
-- ⚠️ `norm` di bawah ialah SALINAN SETIA bagi public.normalize_person_name()
-- (fungsi itu belum dipasang, jadi ia dikira inline). Ia MESTI mengandungi
-- keempat-empat langkah, termasuk pembuangan gelaran:
--   1. lower()
--   2. apostrofu / titik / backtick / tanda pisah  ->  ruang
--   3. runtuhkan ruang berlebihan + btrim
--   4. buang gelaran di permulaan (dr, pn, en, datuk, ...)
--
-- Tanpa langkah 4, 'Dr. Ahmad Nizar' dan 'Dr. Afiq' kedua-duanya kelihatan
-- bertoken pertama 'dr' dan J0c melaporkan PERLANGGARAN PALSU — sedangkan
-- fungsi sebenar menormalkannya kepada 'ahmad nizar' dan 'afiq'.
-- (Dikesan oleh scripts/test-prompt-8a3-install.mjs.)
WITH ternormal AS (
  SELECT up.id, up.full_name, up.role::text AS role, up.is_active,
         up.account_status::text AS account_status, up.email,
         btrim(regexp_replace(
           regexp_replace(
             regexp_replace(lower(coalesce(up.full_name, '')),
                            '[''’.`\-]', ' ', 'g'),
             '\s+', ' ', 'g'),
           '^(dr|pn|en|ms|mr|mrs|puan|encik|tuan|datuk|datin|hajah|haji|prof|ir|ar|sr|tun|tan sri|puan sri)\s+',
           '', 'g')) AS norm
    FROM public.user_profiles up
)
SELECT 'J0a_profiles' AS check_name,
       id, full_name, norm,
       split_part(norm, ' ', 1) AS token_pertama,
       role, is_active, account_status, email
  FROM ternormal
 ORDER BY full_name;

-- J0b: PERLANGGARAN nama ternormal — jika >0 baris, padanan tepat menjadi
--      KABUR dan resolve_account_manager() akan mengembalikan NULL untuknya.
WITH ternormal AS (
  SELECT up.full_name,
         btrim(regexp_replace(
           regexp_replace(
             regexp_replace(lower(coalesce(up.full_name, '')),
                            '[''’.`\-]', ' ', 'g'),
             '\s+', ' ', 'g'),
           '^(dr|pn|en|ms|mr|mrs|puan|encik|tuan|datuk|datin|hajah|haji|prof|ir|ar|sr|tun|tan sri|puan sri)\s+',
           '', 'g')) AS norm
    FROM public.user_profiles up
)
SELECT 'J0b_dup_norm' AS check_name, norm, count(*) AS bilangan,
       string_agg(full_name, ' | ' ORDER BY full_name) AS nama
  FROM ternormal
 GROUP BY norm HAVING count(*) > 1
 ORDER BY norm;

-- J0c: PERLANGGARAN token pertama — menjejaskan langkah 5 penyelesai.
--      Jangkaan bagi 18 staf Excel: 0 baris.
WITH ternormal AS (
  SELECT up.full_name,
         split_part(btrim(regexp_replace(
           regexp_replace(
             regexp_replace(lower(coalesce(up.full_name, '')),
                            '[''’.`\-]', ' ', 'g'),
             '\s+', ' ', 'g'),
           '^(dr|pn|en|ms|mr|mrs|puan|encik|tuan|datuk|datin|hajah|haji|prof|ir|ar|sr|tun|tan sri|puan sri)\s+',
           '', 'g')), ' ', 1) AS token_pertama
    FROM public.user_profiles up
)
SELECT 'J0c_dup_token' AS check_name, token_pertama, count(*) AS bilangan,
       string_agg(full_name, ' | ' ORDER BY full_name) AS nama
  FROM ternormal
 GROUP BY token_pertama HAVING count(*) > 1
 ORDER BY token_pertama;

-- J0d: adakah 'Fuziah' wujud dan UNIK? seed DP-8 bergantung kepadanya dan
--      akan BERHENTI dengan ralat jika kabur atau tiada.
SELECT 'J0d_fuziah' AS check_name, count(*) AS bilangan,
       string_agg(up.full_name, ' | ' ORDER BY up.full_name) AS nama
  FROM public.user_profiles up
 WHERE btrim(regexp_replace(
         regexp_replace(
           regexp_replace(lower(coalesce(up.full_name, '')),
                          '[''’.`\-]', ' ', 'g'),
           '\s+', ' ', 'g'),
         '^(dr|pn|en|ms|mr|mrs|puan|encik|tuan|datuk|datin|hajah|haji|prof|ir|ar|sr|tun|tan sri|puan sri)\s+',
         '', 'g')) LIKE '%fuziah%';

-- J0e: baseline baris — sahkan ia masih sepadan laporan J1 anda.
SELECT 'J0e_baseline' AS check_name, t.tbl,
       (xpath('/row/cnt/text()',
         query_to_xml(format('SELECT count(*) AS cnt FROM %I.%I', 'public', t.tbl),
                      false, true, '')))[1]::text::bigint AS row_count
  FROM (VALUES ('audit_logs'),('import_staging'),('invoices'),
               ('organizers'),('programmes'),('user_profiles')) AS t(tbl)
 ORDER BY t.tbl;
```

**Selepas melaporkan J0, teruskan ke TUGASAN 2** — pemasangan sudah diluluskan.

---

## 5. TUGASAN 2 — Pasang 4 fail 🟢 DILULUSKAN

Ambil setiap fail daripada branch sesi dan **sahkan integritinya SEBELUM
menjalankan** — gate **dua lapis** (DP-11):

- **Lapis 1 (utama) — Git blob SHA.** Connector GitHub anda **sudah** memberikan
  nilai ini. Git blob SHA = `SHA-1("blob " + <panjang_bait> + "\0" + <kandungan>)`,
  jadi ia sensitif **byte-for-byte**: sebarang pemotongan atau perubahan satu
  bait menukarnya. Anda **membandingkan**, bukan mengira — tiada alat hash
  diperlukan.
- **Lapis 2 (sokongan) — cap jari struktur.** Dikira daripada kandungan yang
  anda baca: bait, baris, aksara, kiraan objek `CREATE`, dan baris terakhir
  bukan-kosong. Lapis ini **bebas** daripada medan `.sha`, jadi satu kerosakan
  connector tidak akan meluluskan kedua-duanya.
- **SHA-256 = PILIHAN.** Jika anda ada alat hash, kira dan bandingkan sebagai
  pengesahan silang. **Tiada alat hash BUKAN blocker** — tandakan
  `⏳ tidak dikira` dan teruskan.

🔴 Jika **mana-mana** lapisan tidak sepadan: **JANGAN jalankan**. Laporkan nilai
yang anda dapat, nilai jangkaan, saiz bait, dan baris terakhir yang anda lihat.
Jangan bina semula SQL daripada kandungan separa.

⚠️ **Pengesan integriti ≠ kawalan keselamatan.** Blob SHA ialah SHA-1 dan lemah
terhadap perlanggaran yang *disengajakan*; ia di sini untuk mengesan kerosakan
*tidak sengaja*. Kelulusan kandungan datang daripada pengguna. **Jangan guna
"integriti disahkan" sebagai alasan untuk melonggarkan mana-mana larangan lain.**

### Langkah 1 — `lib/supabase/client-master.sql`

https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/lib/supabase/client-master.sql

```
Lapis 1 — Git blob SHA (bandingkan dengan nilai connector anda):
         37b8d8b8fa882b65645cf32e2c37d55590ec6cf2

Lapis 2 — cap jari struktur (kira daripada kandungan yang anda baca):
         bait      = 17210
         baris     = 384
         aksara    = 17159
         CREATE TABLE / FUNCTION / POLICY / INDEX = 1 / 2 / 4 / 2
         baris pertama        = -- =====================================================================
         baris terakhir       = -- NULL di sini ialah jawapan yang BETUL, bukan kegagalan.

Pilihan  — SHA-256 (hanya jika anda ada alat hash; BUKAN blocker):
         d394398dc075f92c61db13077be568e907fb77989ef1175146682ce251418542
```

Jalankan keseluruhan fail apa adanya, dalam satu pelaksanaan.

### Langkah 2 — `lib/supabase/external-account-managers.sql`

https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/lib/supabase/external-account-managers.sql

```
Lapis 1 — Git blob SHA (bandingkan dengan nilai connector anda):
         1e555af8f78472fe7427a513b4682a8ccbc5f381

Lapis 2 — cap jari struktur (kira daripada kandungan yang anda baca):
         bait      = 13526
         baris     = 336
         aksara    = 13498
         CREATE TABLE / FUNCTION / POLICY / INDEX = 1 / 3 / 4 / 2
         baris pertama        = -- =====================================================================
         baris terakhir       = -- Ujian berkelakuan: scripts/test-account-manager-resolution.mjs seksyen [Q].

Pilihan  — SHA-256 (hanya jika anda ada alat hash; BUKAN blocker):
         a124b9cfa9f086b6079977b2fca1140a9d06aa565e24c553a3735bdecf772793
```

### Langkah 3 — `lib/supabase/account-manager-resolution.sql`

https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/lib/supabase/account-manager-resolution.sql

```
Lapis 1 — Git blob SHA (bandingkan dengan nilai connector anda):
         afcdc600efda41bc4e1928c60fe71dd6be2880ba

Lapis 2 — cap jari struktur (kira daripada kandungan yang anda baca):
         bait      = 21276
         baris     = 539
         aksara    = 21237
         CREATE TABLE / FUNCTION / POLICY / INDEX = 0 / 7 / 0 / 0
         baris pertama        = -- =====================================================================
         baris terakhir       = -- Ujian berkelakuan: scripts/test-account-manager-resolution.mjs

Pilihan  — SHA-256 (hanya jika anda ada alat hash; BUKAN blocker):
         fb32d1d00f89322dd091f70df82984196c007b1b2040b79823c2ea5073752120
```

### Langkah 4 — `lib/supabase/seed-account-manager-aliases.sql`

https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/lib/supabase/seed-account-manager-aliases.sql

```
Lapis 1 — Git blob SHA (bandingkan dengan nilai connector anda):
         22fc847e470831b250a943e425c80fa04fdf5542

Lapis 2 — cap jari struktur (kira daripada kandungan yang anda baca):
         bait      = 12284
         baris     = 283
         aksara    = 12229
         CREATE TABLE / FUNCTION / POLICY / INDEX = 0 / 0 / 0 / 0
         baris pertama        = -- =====================================================================
         baris terakhir       = END $$;

Pilihan  — SHA-256 (hanya jika anda ada alat hash; BUKAN blocker):
         0bcc03a80fbea51cfb0e8079a35c4be582b418c195e21020a636148e1c67f5df
```

> 🔴 **Langkah 4 boleh GAGAL dengan sengaja.** `seed` menaikkan ralat jika
> `Fuziah` **tiada** atau **kabur** dalam `user_profiles` (`P0002` / `22023`).
> Itu **ciri keselamatan**, bukan kecacatan — ia mengelakkan keputusan
> pengguna dipetakan kepada orang yang salah.
>
> **J0d sudah memberitahu anda sama ada ia akan berjaya.** Jika J0d
> menunjukkan `bilangan <> 1`, **JANGAN jalankan Langkah 4** — laporkan dan
> berhenti. Jika Langkah 4 gagal, **tampal ralat penuh** dan nyatakan sama ada
> Langkah 1–3 perlu dibatalkan (jawapan panel: **tidak perlu** — ia additif
> dan tidak berbahaya tanpa seed).

### Langkah 5 — PILIHAN, **disyorkan LANGKAU**

`lib/supabase/fix-import-staging-updated-at.sql` — no-op terbukti (§2.4).
Jika anda memilih untuk menjalankannya, laporkan bahawa ia no-op dan sahkan
K10 tidak berubah.

---

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

## Nota untuk Arena (bukan untuk ChatGPT)

### Kenapa `am_backfill` TIDAK diluluskan dalam prompt ini
Live ada **sifar** nilai `Account Manager` (J1f = `[]`). Menjalankan backfill
sekarang akan mengisi 0 baris — tiada faedah, dan ia menambah satu operasi
tulis pada produksi tanpa sebab. Ia patut dijalankan **selepas** Quotation
Tracker diimport (Fasa 8C), apabila 265 baris sebenar wujud.

### Yang perlu Arena lakukan selepas laporan ini diterima
1. **Semak J0a terhadap 18 nama Excel.** Jika live menggunakan **nama penuh
   rasmi** (cth. `Adilah Binti Nisman`) dan bukan nama pendek, kemas kini
   `STAFF` dalam `scripts/test-account-manager-resolution.mjs` supaya ujian
   menyamai realiti live.
2. **Semak J0b/J0c untuk perlanggaran.** Jika ada dua staf berkongsi token
   pertama, jangkaan K6 mesti dikemas kini **sebelum** Fasa 8C.
3. **Kenal pasti 2 profil tambahan** (20 live vs 18 Excel). Kemungkinan:
   Master Admin `saidrazak881@gmail.com` + akaun UAT yang disekat. Jika salah
   satunya bernama seperti staf (cth. `Nur …`), ia boleh menjejaskan keunikan.
4. Jika K6 menunjukkan perbezaan, **jangan** betulkan dengan menambah alias
   secara pukal — setiap alias ialah keputusan manusia yang memerlukan
   kelulusan pengguna.

### Status selepas prompt ini
Jika K1–K12 ✅: **struktur 8A + 8A-2 + DP-9 siap di live**, dan keputusan
DP-8/DP-9 pra-daftar. Seterusnya mengikut DP-1:
**8B** (simpanan fail sumber + parse-semula) → **8C** (quotation berdiri sendiri,
import Quotation Tracker, kemudian `am_backfill`).
