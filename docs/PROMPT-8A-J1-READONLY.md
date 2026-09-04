# PROMPT 8A-J1 — Query KEADAAN SEBELUM (read-only) 🟢 TIADA KELULUSAN DIPERLUKAN

> ## 🟢 INI BUKAN HARD GATE
>
> Prompt ini **READ-ONLY SEPENUHNYA**. Ia mengandungi **sepuluh query SELECT sahaja (J1a–J1j)** —
> tiada `INSERT`, `UPDATE`, `DELETE`, `DDL`, `GRANT` atau `REVOKE`. Ia **tidak
> mengubah apa-apa** di pangkalan data `lmenmfsbjgxfhnykkgow`.
>
> **Ia TIDAK memasang apa-apa.** `client-master.sql` **TIDAK** diluluskan oleh
> prompt ini dan **MESTI TIDAK** dijalankan. Prompt ini hanya mengumpul
> **keadaan live sebenar** supaya pemasangan Fasa 8A (prompt berasingan,
> `docs/PROMPT-8A-CLIENT-MASTER.md`) boleh diputuskan berdasarkan bukti,
> bukan andaian.
>
> **Kenapa ia perlu dijalankan dahulu:** kriteria J6 dalam prompt 8A membandingkan
> fungsi penyelesai dengan **18 nama staf** daripada `User Profiles Mapping.xlsx`.
> Jika senarai staf **live** berbeza, syarat keunikan fungsi akan menolak beberapa
> nilai — dan kita perlu tahu itu **sebelum** memasang, bukan selepas.

---

## 1. PERSONA

Baca fail persona di
https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/docs/personas/PERSONA-SQL-ARCHITECT.md
(klik **Raw**) dan **AMALKAN** persona itu sepanjang tugasan.

## 2. KONTEKS — apa yang kami ukur dalam fail sumber

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


**Kenapa ini penting untuk J1:** lajur ini kini TEXT mentah. `Abu Said` dan
`Abu said` dikira sebagai **dua orang berbeza**; `Fuzy / Dila` (dua orang)
diagih kepada seorang atau tiada siapa.

> **KEMASKINI DP-8 (keputusan pengguna 2026-09-04):** `'Fuzy'`,
> `'Fuzy / Dila'` dan `'Fuzy / Sholihin '` **ketiga-tiganya** diputuskan
> pengguna untuk diagih kepada **Fuziah**. Ini **belum** dipasang di live —
> jadi J1f masih akan menunjukkan nilai mentah asal. Hanya **`Ow Zi Qi`**
> (3 baris) yang masih tiada keputusan. Fasa 8A menambah pautan UUID yang
**selesai** supaya laporan boleh mengagih dengan betul — tanpa membuang nilai
mentah (jejak audit).

Query J1f di bawah membandingkan **nilai live** dengan 12 nilai Excel ini.

---

## 3. TUGASAN — Query J1 (read-only)

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

-- =====================================================================
-- 🔴 J1i + J1j — KEUTAMAAN TERTINGGI: siasatan kecacatan DP-7
-- =====================================================================
-- `updated-at-triggers.sql` (Fasa 6G, dilaporkan ✅ SELESAI dengan G1=12/12)
-- memasang trigger BEFORE UPDATE `set_updated_at` pada jadual yang
-- TERMASUK `import_staging`. Tetapi `schema-import-staging.sql` TIDAK
-- mentakrifkan lajur `updated_at` pada jadual itu.
--
-- Jika lajur itu juga tiada di live, maka SETIAP UPDATE ke atas
-- import_staging gagal dengan  record "new" has no field "updated_at"
-- dan `sync_import_transaction` (yang meng-UPDATE import_staging pada
-- baris 321 & 727) GAGAL SEPENUHNYA — kerana sync adalah ATOMIK,
-- seluruh batch import Excel akan gagal.
--
-- DUA query di bawah menjawabnya dengan bukti. Kedua-duanya read-only.

-- J1i: adakah lajur updated_at wujud pada import_staging di live?
SELECT 'J1i_staging_updated_at' AS check_name,
       c.column_name, c.data_type, c.is_nullable, c.column_default,
       CASE WHEN c.column_name IS NULL
            THEN '🔴 TIADA — import Excel di live MUNGKIN ROSAK'
            ELSE '🟢 WUJUD — import tidak terjejas oleh DP-7' END AS kesan
  FROM (VALUES ('updated_at')) AS want(col)
  LEFT JOIN information_schema.columns c
         ON c.table_schema='public' AND c.table_name='import_staging'
        AND c.column_name = want.col;

-- J1j: adakah trigger set_updated_at DIPASANG pada import_staging?
--      (dan pada jadual lain yang mungkin tiada lajur updated_at)
-- ⚠️ PEMBETULAN ARENA (selepas laporan J1): versi asal query ini menghasilkan
-- 🔴 PALSU untuk `account_manager_aliases` kerana CASE-nya tidak membezakan
-- "jadual tidak wujud" daripada "jadual wujud + trigger ada + lajur tiada".
-- ChatGPT mengesan ini dan menolaknya dengan betul (bilangan_trigger=0).
-- Kini `to_regclass()` digunakan untuk membezakan empat keadaan.
SELECT 'J1j_trigger_vs_column' AS check_name,
       t.tbl AS jadual,
       (to_regclass('public.' || t.tbl) IS NOT NULL) AS jadual_wujud,
       (SELECT count(*) FROM pg_trigger tg
          JOIN pg_class cc ON cc.oid = tg.tgrelid
          JOIN pg_namespace nn ON nn.oid = cc.relnamespace
         WHERE nn.nspname='public' AND cc.relname = t.tbl
           AND NOT tg.tgisinternal
           AND tg.tgname IN ('set_updated_at','trg_' || t.tbl || '_updated_at')
       ) AS bilangan_trigger,
       EXISTS (SELECT 1 FROM information_schema.columns c
                WHERE c.table_schema='public' AND c.table_name = t.tbl
                  AND c.column_name='updated_at') AS ada_lajur_updated_at,
       CASE
         WHEN to_regclass('public.' || t.tbl) IS NULL
           THEN '⚪ JADUAL TIDAK WUJUD — bukan DP-7 (tiada apa hendak dicetus)'
         WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns c
                           WHERE c.table_schema='public' AND c.table_name = t.tbl
                             AND c.column_name='updated_at')
              AND EXISTS (SELECT 1 FROM pg_trigger tg
                            JOIN pg_class cc ON cc.oid = tg.tgrelid
                            JOIN pg_namespace nn ON nn.oid = cc.relnamespace
                           WHERE nn.nspname='public' AND cc.relname = t.tbl
                             AND NOT tg.tgisinternal
                             AND tg.tgname IN ('set_updated_at',
                                               'trg_' || t.tbl || '_updated_at'))
           THEN '🔴 DP-7: TRIGGER DIPASANG TETAPI LAJUR TIADA — sebarang kemas kini akan gagal'
         WHEN EXISTS (SELECT 1 FROM information_schema.columns c
                       WHERE c.table_schema='public' AND c.table_name = t.tbl
                         AND c.column_name='updated_at')
           THEN '🟢 OK — lajur updated_at wujud'
         ELSE '⚪ tiada trigger dan tiada lajur — tidak berisiko DP-7'
       END AS keadaan
  FROM (VALUES ('import_staging'),('invoices'),('participants'),
               ('programme_costs'),('programmes'),('app_settings'),
               ('cost_items'),('financial_docs'),('organizers'),
               ('programme_documents'),('user_profiles'),
               ('account_manager_aliases')) AS t(tbl)
 ORDER BY keadaan, t.tbl;
```


---

## 4. APA YANG MESTI DILAPORKAN

**Selepas menjalankan kesemua sepuluh query, BERHENTI.** Jangan pasang apa-apa.
Jangan cadangkan SQL untuk dijalankan. Laporkan sahaja.

### Seksyen 1 — Konteks & Status
Pangkalan data (`lmenmfsbjgxfhnykkgow`), cara anda menyambung, dan pengesahan
bahawa **hanya SELECT** dijalankan.

### Seksyen 2 — Keputusan J1 (jadual)
| Kriteria | Output verbatim | Tafsiran |
|---|---|---|
| J1a lajur baharu | … | jangkaan **0 baris** |
| J1b jadual alias | … | jangkaan `BELUM WUJUD` |
| J1c 2 fungsi | … | jangkaan 2 baris `BELUM WUJUD` |
| J1d enum app_role | … | senaraikan **semua** nilai |
| J1e baseline baris | … | **6 angka** — J7 akan bandingkan |
| J1f Account Manager mentah | … | senaraikan **semua** nilai + bilangan |
| J1g baseline jadual | … | jangkaan **18** |
| J1h lajur mentah | … | jangkaan **2 baris** `text` |
| **J1i** `import_staging.updated_at` | … | 🔴 **KEUTAMAAN** — jangkaan **WUJUD**; jika TIADA, import live mungkin rosak |
| **J1j** trigger vs lajur | … | 🔴 **KEUTAMAAN** — setiap jadual mesti `🟢 OK` |

### Seksyen 3 — Tindakan yang diambil
Query sebenar yang dijalankan + bukti verbatim.

### Seksyen 4 — Empat soalan yang MESTI dijawab secara eksplisit
1. **Adakah senarai staf live TEPAT 18** seperti `User Profiles Mapping.xlsx`?
   Jika berbeza, **senaraikan perbezaannya** (nama yang ada di live tetapi tiada
   dalam Excel, dan sebaliknya). Ini menentukan sama ada jangkaan J6 dalam
   prompt 8A masih sah.
2. **Adakah `super_admin` ADA dalam enum `app_role`** (J1d)?
   Jangkaan: **ADA** (8 nilai keseluruhan), kerana Fasa 6 sudah dipasang.
   Jika ia **TIADA**, itu bermakna Fasa 6 belum/tidak lengkap di live —
   laporkan sebagai 🔴 kerana `client-master.sql` mengandaikan `has_role()`
   versi Fasa 6 yang sedia ada.
3. **Adakah nilai `Account Manager` live (J1f) sepadan dengan 12 nilai Excel**
   di §2? Senaraikan mana-mana nilai live yang **tiada** dalam senarai 12 itu.
4. **Adakah mana-mana daripada 6 lajur / 1 jadual / 2 fungsi sudah wujud?**
   Jika ya, pemasangan 8A masih selamat (fail itu idempoten) tetapi kami perlu
   tahu punca ia sudah ada.
5. 🔴 **DP-7: adakah `import_staging` di live mempunyai lajur `updated_at`?**
   (J1i). Jika **TIADA**, nyatakan dengan jelas bahawa **aliran import Excel
   di live mungkin rosak sekarang**, dan sertakan output J1j verbatim
   (jadual mana yang ada trigger tetapi tiada lajur).
   **JANGAN** cuba membaikinya — pembaikan ialah fail berasingan
   (`lib/supabase/fix-import-staging-updated-at.sql`) yang memerlukan
   kelulusan pengguna.

### Seksyen 5 — Isu / Blocker / penemuan tak dijangka
🔴/🟠/🟢 + penerangan + bukti + cadangan.

### Seksyen 6 — Pengesahan pematuhan larangan
Senarai semak: setiap larangan di bawah | dipatuhi ✅ / tidak ❌ | bukti.

---

## 5. Larangan

1. **JANGAN** jalankan `client-master.sql` atau mana-mana fail SQL lain.
   Prompt ini **hanya** mengumpul keadaan.
2. **JANGAN** jalankan sebarang `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`,
   `ALTER`, `CREATE`, `DROP`, `GRANT` atau `REVOKE`.
3. **JANGAN** guna `service_role`.
4. **JANGAN** ubah skema/RLS/RPC/trigger/seed/storage/password.
5. **JANGAN** reset atau ubah kata laluan mana-mana akaun.
6. **JANGAN** merge ke `main`, dan **JANGAN** tukar Production Branch Vercel.
   Prompt ini **tidak** meluluskannya.
7. **JANGAN** tampal anon key penuh atau sebarang rahsia dalam laporan.
8. **JANGAN** mereka-reka bukti. Setiap ✅ mesti ada bukti verbatim. Jika tidak
   dapat diuji, tulis `⏳ MENUNGGU PENGGUNA`.
9. **JANGAN** layan preview local (Mod Demo) sebagai production.
10. **JANGAN** berhenti senyap apabila alat gagal. Namakan **operasi spesifik**
    yang dicuba, tampal ralat penuh, kemudian teruskan query lain yang boleh.
11. **JANGAN** ubah query J1 supaya ia "lulus". Jika output berbeza daripada
    jangkaan, **laporkan perbezaan itu** — ia ialah penemuan, bukan kegagalan
    untuk disembunyikan.

---

## Nota untuk Arena (bukan untuk ChatGPT)

Prompt ini **dipisahkan** daripada `docs/PROMPT-8A-CLIENT-MASTER.md` atas
keputusan pengguna (2026-09-04): pengguna mahu melihat **keadaan live sebenar**
dahulu sebelum meluluskan pemasangan skema.

Selepas laporan J1 diterima, Arena mesti menyemak:
- senarai staf live vs 18 nama Excel → kemas kini `scripts/test-client-master.mjs`
  jika berbeza, **sebelum** prompt 8A diluluskan
- `super_admin` dalam enum atau tidak → sahkan andaian polisi RLS dalam
  `client-master.sql`
- nilai `Account Manager` live vs 12 nilai Excel → jika ada nilai baharu,
  tambah kes ujiannya

**HARD GATE untuk pemasangan skema masih BERTUTUP.** Ia hanya dibuka oleh
pengguna secara bertulis.
