# PROMPT 7A — Pasang `fix-field-mapping.sql` + ganti RPC `sync_import_transaction`

> ## 🟢 STATUS: **DILULUSKAN oleh pengguna (2026-09-04) — SILA JALANKAN**
>
> **HARD GATE DIBUKA.** Pengguna meluluskan prompt ini pada 2026-09-04 dengan
> arahan: *"hantar PROMPT-7A kepada ChatGPT sekarang"*. Gate SEDERHANA
> (2026-09-03) memerlukan kelulusan eksplisit kerana prompt ini menyentuh
> **SQL live** dan **mengganti satu RPC `SECURITY DEFINER`** — kelulusan itu
> **kini telah diberikan**.
>
> **Pengesahan integriti pada masa pengaktifan (2026-09-04):** 6/6 fail
> berkaitan disahkan **identik** dengan komit `f121ac2` melalui perbandingan
> blob SHA (`git rev-parse f121ac2:<fail>` vs `git hash-object <fail>`).
> Pokok kerja bersih, hujung remote = `f121ac2`. **Tiada suntingan kandungan
> dibuat semasa pengaktifan ini** — hanya banner status dan rekod kelulusan.
>
> | Fail | SHA (12 aksara pertama) | Drift? |
> | ---- | ----------------------- | ------ |
> | `lib/supabase/fix-field-mapping.sql` | `d393e4628521` | ✅ tiada |
> | `lib/supabase/sync-import-transaction.sql` | `5ba925f7ef6a` | ✅ tiada |
> | `lib/supabase/schema-import-staging.sql` | `23c629377512` | ✅ tiada |
> | `lib/excel-parser.ts` | `290d5caebdee` | ✅ tiada |
> | `scripts/test-fix-field-mapping.mjs` | `f73132e411e7` | ✅ tiada |
> | `scripts/test-v4-raw-parser.mjs` | `17bf142681a9` | ✅ tiada |
>
> **Nota skop:** hanya **2** fail yang dipasang (§4 Langkah 1 dan 2).
> `schema-import-staging.sql`, `excel-parser.ts` dan kedua-dua suite ujian
> disenaraikan di atas sebagai **rujukan integriti sahaja** — ia kod sisi
> aplikasi yang sampai ke production melalui **Vercel auto-deploy**, bukan
> melalui tangan kamu. **Jangan pasangnya di Supabase.**
>
> **Ujian Arena (PGlite, semua hijau sebelum prompt ini ditulis):**
>
> | Suite | Keputusan |
> | ----- | --------- |
> | `scripts/test-fix-field-mapping.mjs` | **55/55** ✅ |
> | `scripts/test-v4-raw-parser.mjs` | **73/73** ✅ |
> | 12 suite sedia ada yang lain | semua ✅ |
> | `next build` | ✅ lulus |
>
> **Sila sahkan SHA kedua-dua fail yang dipasang (lihat jadual integriti di
> atas) SEBELUM dan SELEPAS pemasangan.** Jika berbeza, **BERHENTI** dan
> laporkan — jangan teruskan.

---

## BLOK 1 — PERSONA

Kamu ialah **Jurutera Pangkalan Data PostgreSQL** yang teliti dan berhati-hati
(`docs/personas/PERSONA-SQL-ARCHITECT.md`). Kamu mempunyai akses penuh kepada
Supabase (projek `lmenmfsbjgxfhnykkgow`) dan Vercel
(`https://masb-pms-v4.vercel.app`).

Prinsip yang kamu pegang:

1. **Kamu tidak pernah mereka bukti.** Jika satu kriteria tidak dapat diukur,
   laporkan `⏳ TIDAK DAPAT DIREKODKAN` dan terangkan kenapa. Itu jawatan yang
   betul — bukan meneka nilai daripada ingatan atau daripada laporan fasa lepas.
2. **Kamu membezakan "tiada perubahan" daripada "tidak diukur".**
3. **Kamu menjalankan query KEADAAN SEBELUM dahulu dan melaporkannya dahulu.**
   Lihat kriteria J1 — ia **wajib** dijalankan dan dilaporkan **SEBELUM** §3.
4. **Kamu tidak meluaskan skop.** Hanya fail yang disenaraikan. Jika kamu rasa
   ada benda lain yang patut dibetulkan, **catatkan dalam laporan**, jangan
   betulkan.

---

## BLOK 2 — KONTEKS: apa yang rosak dan kenapa

### Penemuan

`docs/GAP-ANALYSIS-FUNGSI-BELUM-ADA.md` (komit `bd74a6f` dan selepasnya)
membandingkan **8 fail Excel sumber** dalam `V4 RAW/` terhadap skema DB, parser
dan RPC. Ia menemui bahawa import Excel **menulis makna yang salah ke lajur
yang betul**:

| # | Kecacatan | Bukti dalam kod (SEBELUM pembetulan) |
| - | --------- | ------------------------------------ |
| **§4.1** | `trainer` (nama **jurulatih**) ditulis ke `invoices.account_manager` | `sync-import-transaction.sql`: `account_manager ← NULLIF(trim(v_row->>'trainer'),'')` |
| **§4.2** | `client_name` (nama **syarikat**) ditulis ke `invoices.pic_name` (medan **individu**) | `pic_name ← v_client` |
| **§4.3** | Amaun **sebut harga** ditulis ke `invoices.po_value_excl_tax` (medan **Pesanan Belian**) | `po_value_excl_tax ← v_amount` |
| **§4.1b** | `amount` mengambil lajur **`SST 8% Amount`** — amaun **cukai** | Quotation Tracker baris 1: `amount = 1555.56` sedangkan nilai sebenar `Final Price = 21000`. **Ralat 13.5×** |
| **§4.4** | Import quotation kemudian invois → `unique_violation` (23505) → **seluruh batch gagal** | `idx_invoices_quotation_no_unique` ialah indeks UNIQUE **GLOBAL** (tidak termasuk `programme_id`), tetapi padanan invois hanya mencari `invoice_no` dalam program yang sama |

### Punca akar §4.1b (penting untuk difahami)

Parser memadankan pengepala lajur menggunakan `String.includes`, yang ialah
padanan **subrentetan tulen**:

```
alias "notes"  (6 aksara → melepasi pengawal "substantial")
header "No"
"notes".includes("no") === true   →  skor 70
```

Akibatnya lajur urutan **`No`** dirampas oleh medan `description`, menjadikan
`description = "285"` (nombor urutan), yang kemudiannya lulus pemeriksaan
`hasData` dan mencipta **14 rekod hantu** (Quotation Tracker baris 286–299,
semua lajur lain kosong).

Kecacatan yang sama menyebabkan alias `"amount"` memadankan
`"SST 8% Amount"` dengan skor **115** (padanan tepat + bonus
`/amount|amaun|jumlah|nilai/` → +15), mengalahkan `"Final Price"` (skor 85).

### Apa yang Arena sudah betulkan (dalam repo, sudah diuji)

**`lib/excel-parser.ts`** — 16 medan kanonik baharu (`finalPrice`, `unitPrice`,
`quantity`, `sstAmount`, `discountPct`, `totalInclSst`, `totalExclSst`,
`accountManager`, `picName`, `picContactNo`, `picEmail`, `poNo`, `quotationRef`,
`paymentStatus`, `netProfit`, `commission`, `preparedBy`), serta:

- `containsPhrase()` — padanan containment kini mengikut **sempadan perkataan**
- pengawal `isTaxOrDiscountCol` → lajur cukai/diskaun **tidak boleh** jadi `amount`
- pengawal `isTypeOrCategoryCol` → lajur jenis/kategori tidak boleh jadi `quotationRef`
- pengepala urutan tulen (`No`, `No.`, `Bil`, `#`) dikecualikan daripada pemetaan
- keutamaan amaun: `finalPrice` → `totalInclSst` → `amount` → `unitPrice`
- `hasIdentifier` → menolak 14 baris hantu **dan** baris JUMLAH
  (baris 299: `Final Price = RM 11,191,349.41` tanpa pengecam — akan mencipta
  satu quotation hantu bernilai RM 11.19 juta)

**`lib/supabase/fix-field-mapping.sql`** — 23 lajur baharu (17 `import_staging`
+ 6 `invoices`). **Hanya tambah. Tiada DROP / UPDATE / DELETE / TRUNCATE.**

**`lib/supabase/sync-import-transaction.sql`** — pemetaan dibetulkan + padanan
invois **dua langkah** (langkah 2 global pada `quotation_no`).

### Kesan yang sudah diukur pada fail sumber sebenar

| Fail | SEBELUM | SELEPAS |
| ---- | ------- | ------- |
| `00. Quotation Tracker (1).xlsx` | 297 rekod, `amount = 1555.56` (**cukai**), 44/49 lajur dibuang, 14 baris hantu, 1 baris jumlah RM11.19 juta bocor | **284 rekod**, `amount = 21000` (**Final Price**), SST/unit/qty/PIC/AM/preparedBy semua ditangkap, 0 hantu, 0 baris jumlah |
| `invoice_2026.xlsx` | 29 rekod, **0 sah** (`MISSING_AMOUNT`) | 29 rekod, **27 sah**, `sst = 680`, `Account Manager = Adilah`, `quotationRef = MA/QT/2026(0001)` |
| `cost_of_sales_2026.xlsx` | **0 rekod** (header gagal dikesan → 23 baris dibuang **secara senyap**) | **23 rekod**, `netProfit`/`commission` ditangkap |
| `office_funnel_2026-08-19.xlsx` | **0 rekod** (senyap) | **100 rekod** |
| `R1 …INCOME_STATEMENT.xlsx` | — | 77 rekod (sheet Invoice 38 sah), SST + Account Manager ditangkap |

**Jumlah amaun 284 quotation = RM 11,214,029**, berbanding baris jumlah Excel
**RM 11,191,349** — saling mengesahkan bahawa baris jumlah tidak lagi
dikira sebagai rekod.

---

## 3. TUGASAN 1 — Query KEADAAN SEBELUM (J1) 🔴 WAJIB DAHULU

> **Jalankan dan laporkan seksyen ini SEBELUM sebarang pemasangan.**
> Ini pengajaran daripada PROMPT-6G: H1 (snapshot sebelum) disenaraikan
> sebelum H2 tetapi tidak diarahkan secara eksplisit, jadi ia terlepas dan
> bukti sebelum-keadaan hilang. **Jangan ulang kesilapan itu.**

```sql
-- J1a. Kiraan baris SEBELUM (untuk membuktikan tiada data diusik)
SELECT 'J1a_row_counts_before' AS check_name,
       (SELECT count(*)::int FROM public.import_staging) AS staging_rows,
       (SELECT count(*)::int FROM public.import_batches) AS batch_rows,
       (SELECT count(*)::int FROM public.invoices)       AS invoice_rows,
       (SELECT count(*)::int FROM public.programmes)     AS programme_rows;

-- J1b. Lajur yang SUDAH ada sebelum pemasangan
SELECT 'J1b_existing_columns_before' AS check_name,
       table_name, column_name, data_type
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name IN ('import_staging','invoices')
   AND column_name IN (
     'final_price','unit_price','quantity','sst_amount','discount_pct',
     'total_incl_sst','total_excl_sst','account_manager','pic_name',
     'pic_contact_no','pic_email','po_no','quotation_ref',
     'payment_status_raw','net_profit','commission','prepared_by',
     'client_name','sst','unit_price')
 ORDER BY table_name, column_name;

-- J1c. Keadaan RPC SEBELUM
SELECT 'J1c_rpc_before' AS check_name,
       n.nspname AS schema, p.proname AS function_name,
       p.prosecdef AS security_definer,
       (SELECT count(*) FROM pg_config p2 WHERE false) AS dummy,
       pg_get_function_identity_arguments(p.oid) AS args
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'sync_import_transaction';

-- J1d. Adakah badan RPC semasa masih ada pemetaan SALAH?
-- Jangkaan SEBELUM: v_account_manager = 0 (tidak wujud),
--                   trainer_ke_account_manager >= 1 (bug masih ada)
SELECT 'J1d_rpc_body_before' AS check_name,
       (length(p.prosrc) - length(replace(p.prosrc,'v_account_manager','')))
         / length('v_account_manager')::numeric(10,2) AS v_account_manager,
       (length(p.prosrc) - length(replace(p.prosrc,'v_quotation_ref','')))
         / length('v_quotation_ref')::numeric(10,2)   AS v_quotation_ref,
       (p.prosrc ~ 'account_manager,')::int            AS ada_senarai_lajur,
       (p.prosrc LIKE '%v_row->>''trainer''%')::int    AS trainer_masih_dirujuk
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname='public' AND p.proname='sync_import_transaction';

-- J1e. Indeks UNIQUE yang menyebabkan §4.4
SELECT 'J1e_unique_index' AS check_name,
       indexname, indexdef
  FROM pg_indexes
 WHERE schemaname = 'public' AND tablename = 'invoices'
   AND indexdef ILIKE '%UNIQUE%';
```

> **Nota tentang J1e:** jika `idx_invoices_quotation_no_unique` **tidak wujud**
> di live, laporkan begitu. §4.4 kemudian adalah risiko **potensi**, bukan
> aktif — dan pembetulan Arena tetap betul (ia tidak bergantung pada indeks itu
> wujud), tetapi nilaian risikonya berbeza. **Jangan cipta indeks itu.**

---

## 4. TUGASAN 2 — Pasang dua fail 🟢 (selepas kelulusan pengguna)

**Urutan wajib:**

### Langkah 1 — `lib/supabase/fix-field-mapping.sql`

Fail ini **hanya menambah lajur**. Ia idempoten (sudah diuji 3× berturut-turut
dalam PGlite). Ia mengandungi:

- **2** penyataan `ALTER TABLE`
- **23** klausa `ADD COLUMN IF NOT EXISTS` (17 `import_staging` + 6 `invoices`)
- **0** `DROP`, **0** `DELETE`, **0** `TRUNCATE`, **0** `UPDATE`
- 4 `COMMENT ON COLUMN`

> ⚠️ **Jangan keliru dengan PROMPT-6G.** Di sana larangan "JANGAN DROP apa-apa"
> terlalu luas kerana fail `updated-at-triggers.sql` sendiri mengandungi
> `DROP TRIGGER IF EXISTS`. **Fail ini tidak mengandungi sebarang DROP** —
> jadi kamu boleh melaporkannya secara literal.

### Langkah 2 — `lib/supabase/sync-import-transaction.sql`

Fail ini **mengganti** fungsi `public.sync_import_transaction(uuid, jsonb)`
menerusi `CREATE OR REPLACE FUNCTION`. Ia juga mengandungi blok penyesuaian
skema defensif (`IF NOT EXISTS … ALTER TABLE … ADD COLUMN IF NOT EXISTS`) yang
kini mencakupi 9 lajur `invoices` — jadi **Langkah 2 boleh bertahan walaupun
Langkah 1 dilangkau**, tetapi kedua-duanya tetap diarahkan.

Fail ini juga mengandungi objek lain yang sedia ada (grant,
`private.append_import_audit`). **Itu kandungan asal fail, bukan skop baharu.**

### Langkah 3 — Sahkan SHA selepas pemasangan

Laporkan SHA kedua-dua fail yang kamu pasang, dan sahkan ia sepadan dengan
jadual di atas.

---

## 5. Kriteria J — laporan SELEPAS pemasangan

> **PENTING tentang kaedah pengesahan (pengajaran kesilapan Arena #8).**
> Jangan guna `information_schema.routines.routine_definition` atau
> `pg_get_functiondef` untuk mencari **skema** sesuatu fungsi — Postgres tidak
> mengkualifikasikan fungsi dalam `search_path` lalai, jadi teks itu mengelirukan.
> Kriteria di bawah sengaja menggunakan **`pg_proc.prosrc`** (teks mentah badan
> fungsi) dan **`information_schema.columns`**, yang kedua-duanya tidak mempunyai
> masalah itu.

| Kriteria | Query | Jangkaan |
| -------- | ----- | -------- |
| **J2** | Kira lajur baharu | **17** dalam `import_staging`, **6** dalam `invoices` → **23** jumlah |
| **J3** | Jalankan `fix-field-mapping.sql` **kali kedua** | **0 ralat** (idempoten) |
| **J4** | Ulang **J1a** | **Semua kiraan IDENTIKAL** — tiada baris ditambah/dibuang/diubah |
| **J5** | `pg_proc`: `prosecdef`, `pronamespace`, `proargtypes` | `security_definer = true`, schema `public`, argumen `(uuid, jsonb)` — **tidak berubah** |
| **J6** | Kira kemunculan dalam `prosrc` | `v_account_manager` ≥ **4**, `v_quotation_ref` ≥ **4**, `v_pic_name` ≥ **4**, `client_name` ≥ **2** |
| **J7** | Cari corak **salah** dalam `prosrc` | `NULLIF(trim(v_row->>'trainer'), '')` bersebelahan `account_manager` = **0**; `pic_name` menerima `v_client` = **0** |
| **J8** | Ulang **J1b** | Semua 23 lajur kini **wujud** |
| **J9** | `pg_indexes` untuk `invoices` | Laporkan **apa adanya**. **JANGAN cipta, ubah atau buang** sebarang indeks |
| **J10** | Vercel → Runtime Logs, 2 jam | Tiada ralat baharu |

### Query untuk J2, J6, J7

```sql
-- J2. Bilangan lajur baharu
SELECT 'J2_new_columns' AS check_name, table_name, count(*)::int AS bilangan
  FROM information_schema.columns
 WHERE table_schema='public'
   AND (
     (table_name='import_staging' AND column_name IN (
       'final_price','unit_price','quantity','sst_amount','discount_pct',
       'total_incl_sst','total_excl_sst','account_manager','pic_name',
       'pic_contact_no','pic_email','po_no','quotation_ref',
       'payment_status_raw','net_profit','commission','prepared_by'))
     OR
     (table_name='invoices' AND column_name IN (
       'client_name','pic_contact_no','pic_email','sst','quantity','unit_price'))
   )
 GROUP BY table_name ORDER BY table_name;

-- J6 + J7. Kandungan badan RPC
SELECT 'J6_J7_rpc_body' AS check_name,
       -- J6: pemetaan BETUL mesti wujud
       (length(prosrc)-length(replace(prosrc,'v_account_manager','')))/17.0 AS j6_account_manager,
       (length(prosrc)-length(replace(prosrc,'v_quotation_ref','')))/15.0   AS j6_quotation_ref,
       (length(prosrc)-length(replace(prosrc,'v_pic_name','')))/10.0        AS j6_pic_name,
       (length(prosrc)-length(replace(prosrc,'client_name','')))/11.0       AS j6_client_name,
       -- J7: pemetaan SALAH mesti HILANG
       (prosrc LIKE '%NULLIF(trim(v_row->>''trainer''), '''')%')::int        AS j7_trainer_masih_ada,
       (prosrc ~ 'pic_name[^,]*,\s*v_client')::int                          AS j7_client_ke_pic
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='sync_import_transaction';
```

> **Nota J6:** pembahagi (17, 15, 10, 11) ialah panjang rentetan carian.
> Jika hasilnya bukan nombor bulat, laporkan nilai mentah — **jangan bundarkan
> senyap**.
>
> **Nota J7:** `j7_trainer_masih_ada` mungkin **1** dan itu **BOLEH DITERIMA**,
> kerana RPC masih membaca `v_row->>'trainer'` untuk medan `trainer` yang sah
> (ia ditulis ke `programmes.trainer`, bukan ke `account_manager`). Yang
> **mesti 0** ialah `trainer` muncul **bersebelahan** `account_manager`.
> Jika ragu-ragu, **tampalkan petikan `prosrc` yang sepadan** dalam laporan
> supaya Arena boleh menilainya sendiri. **Jangan buat kesimpulan bagi pihak
> Arena.**

### Tentang ujian berfungsi di live — **JANGAN jalankan**

Arena **sengaja tidak** meminta kamu menjalankan `sync_import_transaction`
di live, walaupun dalam `BEGIN … ROLLBACK`. Sebabnya:

1. RPC memerlukan `auth.uid()` bukan-NULL dan role `admin/staff/finance/
   head_governance`. Untuk memenuhinya kamu perlu **mengganti
   `auth.uid()`** atau **mengubah `user_profiles`** — kedua-duanya menyentuh
   objek kongsi di production.
2. Ia juga perlu **mencipta baris `import_batches` / `import_staging`** dan
   akan **mencipta program sintetik** `IMP-<md5>` yang nyata.
3. `CREATE OR REPLACE FUNCTION` adalah DDL dan **tidak boleh di-ROLLBACK
   dengan selamat** dalam konteks ini.

Semua tingkah laku berfungsi **sudah diuji dalam PGlite** oleh
`scripts/test-fix-field-mapping.mjs` (**55/55**), termasuk senario §4.4 yang
sebenar (quotation KENANGA → invois MIMOS Berhad dengan `quotation_no` sama,
indeks UNIQUE global dicipta, terbukti **0** `23505` dan **1** baris — bukan 2).

**Tugasan kamu ialah struktur, bukan tingkah laku.** Jika kamu berpendapat
satu ujian berfungsi di live tetap perlu, **cadangkannya dalam laporan** —
jangan reka dan jalankannya sendiri.

---

## 6. Larangan

1. **JANGAN DROP sebarang objek** — tiada `DROP TABLE`, `DROP FUNCTION`,
   `DROP POLICY`, `DROP INDEX`, `DROP TRIGGER`. Fail yang diluluskan
   **tidak mengandungi DROP**; jika kamu rasa satu DROP diperlukan,
   **catatkan dalam laporan, jangan laksanakannya.**
2. **JANGAN ubah data.** Tiada `UPDATE`, `DELETE`, `TRUNCATE`, `INSERT`
   ke jadual perniagaan. (J3 menjalankan DDL idempoten sahaja.)
3. **JANGAN cipta, ubah atau buang sebarang indeks** — termasuk
   `idx_invoices_quotation_no_unique`. J9 ialah **laporan sahaja**.
4. **JANGAN ubah RLS, polisi, trigger, atau role.**
5. **JANGAN sentuh 3 jadual warisan pra-repo atau skema `private`.**
   Pembersihan itu **KEKAL DITANGGUH** atas keputusan pengguna.
6. **JANGAN ganti `auth.uid()`** atau ubah `user_profiles`, walaupun
   sementara dan walaupun dalam transaksi.
7. **JANGAN jalankan `sync_import_transaction`** di live (lihat §5).
8. **JANGAN guna `service_role` key.**
9. **JANGAN merge ke `main`, ubah Production Branch, atau buka PR.**
10. **JANGAN tampal anon key atau sebarang rahsia** dalam laporan.
11. **JANGAN reka bukti.** Jika satu kriteria tidak dapat diukur →
    `⏳ TIDAK DAPAT DIREKODKAN` + sebab. **Ini jawatan yang betul.**
    (Dalam PROMPT-6G kamu melaporkan H1 sebagai ⏳ dan enggan mengisinya
    daripada ingatan — **itu tindakan yang tepat** dan Arena merekodkannya
    sebagai pengajaran, bukan sebagai kegagalan kamu.)
12. **JANGAN tukar apa-apa di Vercel** selain membaca Runtime Logs.

---

## 7. FORMAT LAPORAN (6 seksyen)

### Seksyen 1 — Status keseluruhan

`🟢 BERJAYA` / `🟡 SEBAHAGIAN` / `🔴 GAGAL` — satu baris + sebab.

### Seksyen 2 — J1: keadaan SEBELUM (mesti diisi DAHULU)

| Check | Nilai |
| ----- | ----- |
| J1a `staging_rows` / `batch_rows` / `invoice_rows` / `programme_rows` | … |
| J1b lajur yang **sudah** wujud sebelum pemasangan | senarai atau "tiada" |
| J1c `security_definer` / schema / args | … |
| J1d `v_account_manager` / `v_quotation_ref` / `trainer_masih_dirujuk` | … |
| J1e indeks UNIQUE pada `invoices` | `indexdef` penuh, atau "tiada" |

> Jika seksyen ini kosong, **seluruh laporan dianggap tidak lengkap** —
> kerana tanpa keadaan SEBELUM, J4 ("tiada data diusik") tidak boleh dibuktikan.

### Seksyen 3 — Pemasangan

| Langkah | Fail | SHA dipasang | Padan dengan jadual? | Ralat? |
| ------- | ---- | ------------ | -------------------- | ------ |
| 1 | `fix-field-mapping.sql` | … | … | … |
| 2 | `sync-import-transaction.sql` | … | … | … |

### Seksyen 4 — Kriteria J2–J10

| # | Jangkaan | SEBENAR | Keputusan |
| - | -------- | ------- | --------- |
| J2 | 17 + 6 = 23 | … | 🟢/🔴 |
| J3 | 0 ralat pada pelaksanaan ke-2 | … | 🟢/🔴 |
| J4 | semua kiraan **identikal** dengan J1a | … | 🟢/🔴 |
| J5 | `prosecdef=true`, `public`, `(uuid,jsonb)` | … | 🟢/🔴 |
| J6 | ≥4 / ≥4 / ≥4 / ≥2 | … | 🟢/🔴 |
| J7 | corak salah = 0 | … | 🟢/🔴 |
| J8 | 23 lajur wujud | … | 🟢/🔴 |
| J9 | laporan sahaja | … | — |
| J10 | tiada ralat runtime baharu | … | 🟢/🔴 |

### Seksyen 5 — Penemuan tak dijangka / cadangan

Apa-apa yang kamu nampak tetapi **tidak** kamu sentuh. Termasuk:
perbezaan antara skema live dan `schema-master.sql` dalam repo, lajur
warisan, indeks yang tidak dijangka, atau kesan sampingan yang kamu
ramalkan tetapi tidak uji.

### Seksyen 6 — Pengesahan pematuhan larangan

Senarai semak 1–12, setiap satu `✅ dipatuhi` atau penjelasan.

---

## Nota untuk Arena (bukan untuk ChatGPT)

### Kenapa skop prompt ini SEMPIT

Keputusan pengguna #3 (2026-09-04) ialah **"baiki kerosakan data"** dahulu.
Jadi prompt ini **hanya** memasang pembetulan §4.1–§4.4. Ia **sengaja tidak**
termasuk:

- **Jadual `quotations` berdiri sendiri** — keputusan pengguna #1 mengesahkan
  quotation wujud **sebelum** program diluluskan, jadi `programme_id` mesti
  boleh NULL. Itu **Fasa 2**. Buat masa ini quotation masih menumpang
  `invoices`, tetapi sekurang-kurangnya **nilainya kini betul**.
- **Penamaan semula `organizers` → `clients`** — keputusan pengguna #2
  (satu entiti "Pelanggan"). Ini menyentuh `programmes.organizer_name`
  (NOT NULL), `change_request_allowed_fields` (`lib/change-requests.ts:44`
  menyenaraikan `organizer_name`), seed, dan **6 tempat dalam UI** termasuk
  label `"Pelanggan / Penganjur"`. Ia **bukan** pembetulan kerosakan data,
  jadi ia ditunda ke Fasa 2 supaya skop #3 kekal bersih.
- **Domain Pipeline/Funnel, P&L/Aging, tugasan pejabat, `certificate_no`** —
  §3.2–§3.4, §3.6. Belum disentuh.

### Perkara yang Arena sendiri rosakkan dan betulkan semasa kerja ini

Direkodkan supaya tidak diulang:

1. **Melonggarkan `looksLikeHeaderRow` kepada `hits >= 4` tanpa pengawal**
   menyebabkan **baris data pertama** Quotation Tracker lulus sebagai header
   (`"Training"` ≈ `"Training Type"`, `"MSSB/QT/TRA/2026/0001"` mengandungi
   `"QT NO"`, `"KENANGA INVESTOR BERHAD"` mengandungi `"INVESTOR"`).
   **266 rekod rosak.** Dibetulkan dengan `typedData <= 1` (sel nombor/Date).
2. **Pengawal pertama cuba guna `dataLike <= 1`** — salah, kerana `dataLike`
   turut mengira **sel teks** yang tidak dipetakan, dan header sheet lebar ada
   banyak daripadanya. Menghasilkan **0 rekod** untuk semua fail.
   Dibetulkan dengan pemboleh ubah `typedData` yang berasingan.
3. **Menyenaraikan `sst` / `invoice_value_excl_tax` / `total_value` dalam
   INSERT dengan nilai boleh-NULL** — menyebut lajur `NOT NULL DEFAULT 0`
   dengan NULL **membatalkan DEFAULT** dan melanggar kekangan.
   **Ditangkap oleh `test-sql-functional`** (bukti suite sedia ada berguna).
   Dibetulkan dengan `COALESCE(..., 0)`.
4. **Alias `quotationRef` versi pertama** (`"quotation ref"`,
   `"quotation reference"`) merampas `"Training Type"` → `quotationRef =
   "Training"` untuk **118 rekod**. Dibetulkan dengan alias tepat +
   pengawal `isTypeOrCategoryCol` + bonus bersyarat `kind !== 'quotation'`.
5. **Fallback §4.4 versi pertama** masih menapis `programme_id =
   v_programme_id`, tetapi indeks UNIQUE itu **GLOBAL**. Quotation KENANGA
   dan invois MIMOS Berhad menyelesaikan ke program sintetik **berbeza**,
   jadi fallback tidak pernah padan dan `23505` tetap berlaku.
   **Ditangkap oleh `test-fix-field-mapping.mjs` §5.** Dibetulkan dengan
   padanan dua langkah (langkah 2 global).
6. **UPDATE fallback tidak mengisi `invoice_no`**, jadi baris kekal
   "quotation-sahaja" dan akan dipadankan semula oleh import invois
   seterusnya — invois kedua akan menimpa yang pertama tanpa amaran.
   Ditangkap oleh ujian yang sama.

**Corak:** 4 daripada 6 dikesan oleh **ujian**, bukan oleh penalaran.
Itu pengesahan langsung pengajaran #4 dan #8 dalam
`docs/PROMPT-6F-AUDIT-PRIVATE-SCHEMA-DRIFT.md`.

### Status selepas prompt ini dijalankan

`updated_at` ✅ (6G) · auth ✅ (Fasa 6) · pemetaan data ✅ (7A) ·
**Fasa 2 masih terbuka:** quotations berdiri sendiri, clients, pipeline/funnel,
P&L/aging, tugasan, certificate_no.
