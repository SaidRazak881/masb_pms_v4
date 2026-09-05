# PROMPT 6C — Betulkan kriteria V3 + audit jadual warisan (READ-ONLY)

> **⚠️ PEMBETULAN Arena (selepas prompt ini dijalankan):** dokumen ini asalnya
> menyebut empat (4) jadual warisan kerana allowlist W1 Arena tersalah
> klasifikasi `import_batches` + `import_staging` (grep peka huruf besar).
> Bilangan **betul = 3**: `profiles`, `programme_participants`, `user_roles`.
> Lihat §1 dan `docs/PROMPT-6D-AUTH-VERCEL-LEGACY.md` §1.

> **Persona kamu:** Jurutera pangkalan data yang teliti dan berhati-hati
> (`docs/personas/PERSONA-SQL-ARCHITECT.md`).
>
> **Keadaan:** PROMPT-6B telah dijalankan. **V1 ✅ dan V2 ✅ — blocker C13
> SUDAH DIPERBAIKI.** `has_role()` kini `plpgsql`, `super_admin_pos=97`,
> `SECURITY DEFINER=true`, dan **semua 8/8 role** membalas `true` untuk Master
> Admin. Anda berhenti pada V3 dengan betul.
>
> **Keputusan Arena: V3 = 9 ialah KRITERIA ARENA YANG SALAH, bukan keadaan
> live yang salah.** Anda tidak perlu membetulkan apa-apa pada RLS. Butiran di
> §1.
>
> **Kelulusan yang diberi oleh prompt ini:** menjalankan query **READ-ONLY**
> yang disenaraikan sahaja. **Tiada DDL, tiada DROP, tiada DELETE, tiada
> GRANT/REVOKE, tiada perubahan apa pun.**

---

## 1. V3 dibetulkan — pengakuan kesilapan Arena

Kriteria asal V3 dalam PROMPT-6B menetapkan `policy_count = 9`. Angka `9`
itu **betul bagi pemasangan bersih** — tetapi **salah sebagai kriteria
penerimaan untuk projek live anda**, kerana skop query V3 berbeza daripada
skop angka itu.

`scripts/test-preflight-b-sql.mjs` kini membuktikan baseline secara automatik:
pada pemasangan bersih hanya ada **tepat 9** polisi bergantung `has_role()`,
dan **kesemua 9** berasal dari `fix-rls-recursion.sql` (polisi `has_role` dalam
`schema-master.sql` digugurkan dan dicipta semula oleh fix tersebut, jadi ia
tidak menambah bilangan).

Query V3 pula mengira **SEMUA** polisi dalam skema `public` yang merujuk
`has_role(` — termasuk polisi pada jadual yang **bukan** ciptaan SQL rasmi
repo. Projek live anda ada **3** jadual warisan sedemikian, menghasilkan
**17 = 9 + 8**.

Pengiraan semula terhadap bukti verbatim anda (17 entri `string_agg`):

| Kategori | Bilangan | Butiran |
| -------- | -------- | ------- |
| Polisi dari `fix-rls-recursion.sql` (rasmi) | **9** | `cost_items.UPDATE`, `financial_docs.UPDATE`, `invoices.UPDATE`, `participants.UPDATE`, `programme_costs.UPDATE`, `programme_documents.UPDATE`, `programmes.UPDATE` **×2** (dua polisi berbeza pada cmd sama: *"…jika tidak dikunci"* dan *"Pengguna terauth boleh kemaskini programmes"*), `user_profiles.SELECT` |
| Polisi dari jadual **TIADA dalam repo** | **8** | `profiles.INSERT/SELECT/UPDATE`, `programme_participants.DELETE/INSERT/UPDATE`, `user_roles.ALL/SELECT` |
| **Jumlah** | **17** | = `policy_count` yang anda laporkan ✅ |

**Bukti bahawa 8 polisi itu bukan milik repo** (disahkan Arena):

```
grep -rl "CREATE TABLE[^;]*\bprofiles\b"                 lib/supabase/  → 0 fail
grep -rl "CREATE TABLE[^;]*\bprogramme_participants\b"   lib/supabase/  → 0 fail
grep -rl "CREATE TABLE[^;]*\buser_roles\b"               lib/supabase/  → 0 fail
sebutan dalam app/ lib/ components/ (*.ts, *.tsx)                       → 0
```

Repo hanya mencipta **13** jadual `public`:
`app_settings, audit_logs, change_requests, cost_items, financial_docs,
invoices, organizers, participants, programme_costs, programme_documents,
programme_unlock_requests, programmes, user_profiles`.
Anda melihat **18** jadual `public` ber-RLS (W1) → **3 jadual warisan**
(allowlist asal 13 adalah salah; yang betul 15 — lihat nota pembetulan di atas).

**Kriteria V3 yang BETUL:**

| # | Kriteria | Jangkaan |
|---|----------|----------|
| V3a | `policy_count` **pada pemasangan bersih** (hanya SQL rasmi repo) | **tepat 9**, semuanya dari `fix-rls-recursion.sql` — dibuktikan automatik oleh `scripts/test-preflight-b-sql.mjs` |
| V3b | `policy_count` **live semasa** | **17** = 9 rasmi + 8 warisan. **Ini diterima.** |
| V3c | 9 polisi rasmi mesti hadir | semua 9 entri di baris pertama jadual di atas wujud |

➡️ **V3 = ✅ LULUS (dibetulkan).** Anda tidak perlu mengubah RLS.

---

## 2. Kenapa 3 jadual warisan itu mesti diaudit (bukan diabaikan)

| Jadual warisan | Polisi | Kenapa ia penting |
| -------------- | ------ | ----------------- |
| `user_roles` | `ALL`, `SELECT` | Nama amat mirip fungsi kebenaran. Perlu dipastikan ia **tidak** menyuap mana-mana fungsi |
| `profiles` | `INSERT`, `SELECT`, `UPDATE` | Nama amat mirip `user_profiles` — risiko kekeliruan audit & laporan |
| `programme_participants` | `DELETE`, `INSERT`, `UPDATE` | Nama amat mirip `participants` — risiko data peserta bertindan |

**Penilaian risiko awal Arena (perlu disahkan oleh audit anda):**

- ✅ **Bukan vektor kebenaran.** `public.current_user_role()` hanya membaca
  `public.user_profiles` (baris 244–245 `schema-master.sql`). Rantaian
  `auth.uid()` → `current_user_role()` → `has_role()` → 17 polisi RLS **tidak
  menyentuh** ketiga-tiga jadual warisan. Jadi pewarisan `super_admin` yang
  anda buktikan di V2 tidak terjejas.
- ⚠️ **Risiko baki:** (a) jika `authenticated` ada privilej tulis pada
  `user_roles` atau `profiles`, ia lubang tulis yang tidak perlu walaupun tidak
  menjejaskan kebenaran; (b) data perniagaan bertindan atau lapuk boleh
  menyesatkan laporan; (c) kekeliruan audit berterusan.

**Arena TIDAK akan meluluskan sebarang DROP sehingga audit ini selesai.**

---

## 3. Tugasan kamu

### Langkah 0 — Selesaikan V4–V8 yang tertangguh

Jalankan **V4, V5, V6, V7, V8** tepat seperti yang tertulis dalam
`docs/PROMPT-6B-FIX-C13-HAS-ROLE.md` §3. Ia semua **read-only** dan **tiada
satu pun** bergantung kepada bilangan polisi, jadi V3 tidak menghalangnya.

Kriteria lulus (tidak berubah):

| # | Jangkaan |
|---|----------|
| V4 | tepat `UPDATE(avatar_url), UPDATE(department), UPDATE(designation), UPDATE(full_name), UPDATE(phone), UPDATE(updated_at)` — **tiada** `role`, `account_status`, `is_active` |
| V5 | `admin_rpc = 8`, `has_role_count = 1`, `kolum_fasa6 = 2`, `md5_default_password = cc3d4118520072361b5318c6d3441873`, `auth_triggers = 2` |
| V6 | `rls_mati = 0` |
| V7 | `role = super_admin`, `account_status = active` |
| V8 | `19 / 19 / 19` — tidak berubah |

### Langkah 1 — Senarai penuh jadual `public` (W1)

```sql
-- W1. Semua jadual public: which rasmi repo, which warisan
SELECT 'W1_public_tables' AS check_name,
       c.relname AS table_name,
       c.reloptions::text AS options,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced,
       pg_catalog.obj_description(c.oid, 'pg_class') AS table_comment,
       (SELECT count(*)::int FROM information_schema.columns ic
         WHERE ic.table_schema='public' AND ic.table_name=c.relname) AS column_count,
       -- ⚠️ PEMBETULAN Arena (selepas PROMPT-6C dijalankan): allowlist asal
       --    hanya 13 jadual kerana diterbitkan dengan grep PEKA HURUF BESAR,
       --    sedangkan schema-import-staging.sql menulis `create table` dalam
       --    huruf kecil. BILANGAN BETUL = 15. ChatGPT yang mengesan kesilapan
       --    ini melalui W1: import_batches + import_staging ialah jadual
       --    rasmi. Jadual warisan sebenar = profiles, programme_participants,
       --    user_roles (3), dan 15 + 3 = 18 = tepat bilangan jadual public
       --    ber-RLS yang dilaporkan live.
       --
       -- ⚠️ KEMASKINI FASA 8A (2026-09-04, Panel DP-2/DP-4): `account_manager_aliases`
       --    ditambah oleh `lib/supabase/client-master.sql`. Ia JADUAL RASMI repo
       --    (bukan warisan). Bilangan rasmi 15 -> 16.
       -- ⚠️ KEMASKINI FASA 8A-2 (2026-09-04, Panel DP-9): `external_account_managers`
       --    ditambah oleh `lib/supabase/external-account-managers.sql`.
       --    Bilangan rasmi 16 -> 17.
       -- ⚠️ KEMASKINI FASA 8C (2026-09-05, Panel DP-23): `backfill_authorizations`
       --    ditambah oleh `lib/supabase/privilege-hardening.sql` — jadual token
       --    sekali-guna yang menggate `am_backfill_account_manager()`
       --    (DP-17.4(b)). Ia JADUAL RASMI repo, ber-RLS, dengan polisi
       --    SELECT/INSERT terhad kepada Super Admin. Bilangan rasmi 17 -> 18.
       --    NOTA: PROMPT-6C SUDAH dijalankan sebelum ini, jadi laporan lama
       --    mengira 15. Jika W1 dijalankan SEMULA selepas Fasa 8C dipasang di
       --    live, jangkaan = 18 rasmi + 3 warisan = 21 jadual public ber-RLS.
       CASE WHEN c.relname IN (
              'account_manager_aliases','app_settings','audit_logs',
              'backfill_authorizations',
              'change_requests','cost_items','external_account_managers',
              'financial_docs','import_batches','import_staging','invoices',
              'organizers','participants','programme_costs',
              'programme_documents','programme_unlock_requests','programmes',
              'user_profiles')
            THEN 'RASMI (repo)'
            ELSE '⚠️ WARISAN (bukan dari repo)'
       END AS origin
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r'
   AND c.relname NOT IN ('schema_migrations','spatial_ref_sys')
 ORDER BY origin DESC, c.relname;
```

### Langkah 2 — Struktur + isi 3 jadual warisan (W2, W3)

```sql
-- W2. Kolum setiap jadual warisan (nama + jenis SAHAJA, tiada data)
SELECT 'W2_legacy_columns' AS check_name,
       c.table_name, c.ordinal_position AS pos,
       c.column_name, c.data_type, c.is_nullable,
       c.column_default
  FROM information_schema.columns c
 WHERE c.table_schema = 'public'
   AND c.table_name IN ('profiles','programme_participants','user_roles')
 ORDER BY c.table_name, c.ordinal_position;
```

```sql
-- W3. Bilangan baris + cap jari isi (BUKAN data sebenar)
SELECT 'W3_legacy_rowcounts' AS check_name, x.tbl AS table_name,
       (xpath('/row/cnt/text()',
              query_to_xml(format('SELECT count(*) AS cnt FROM public.%I', x.tbl),
                           true, false, '')))[1]::text::int AS row_count,
       md5((xpath('/row/h/text()',
              query_to_xml(format(
                'SELECT coalesce(md5(string_agg(t::text, ''|'' ORDER BY t::text)),''(kosong'') AS h
                   FROM (SELECT to_jsonb(r) AS t FROM public.%I r) q', x.tbl),
                true, false, '')))[1]::text) AS content_fingerprint
  FROM (VALUES ('profiles'),('programme_participants'),('user_roles'),
               ('user_profiles'),('participants')) AS x(tbl)
 ORDER BY x.tbl;
```

> `user_profiles` dan `participants` disertakan dalam W3 sebagai **pembanding**
> supaya Arena boleh lihat sama ada isi jadual warisan serupa dengan jadual
> rasmi (tanda data pernah disalin/dipindah).

### Langkah 3 — Privilej & polisi pada jadual warisan (W4, W5)

```sql
-- W4. Privilej authenticated/anon pada jadual warisan
SELECT 'W4_legacy_privileges' AS check_name,
       t.tbl AS table_name,
       coalesce((SELECT string_agg(DISTINCT tp.privilege_type, ', ' ORDER BY tp.privilege_type)
                   FROM information_schema.table_privileges tp
                  WHERE tp.table_schema='public' AND tp.table_name=t.tbl
                    AND tp.grantee='authenticated'), '(tiada)') AS authenticated_table_privs,
       coalesce((SELECT string_agg(tp.privilege_type || '(' || tp.column_name || ')',
                                   ', ' ORDER BY tp.privilege_type, tp.column_name)
                   FROM information_schema.column_privileges tp
                  WHERE tp.table_schema='public' AND tp.table_name=t.tbl
                    AND tp.grantee='authenticated'
                    AND tp.privilege_type IN ('INSERT','UPDATE','DELETE')),
                '(tiada)') AS authenticated_write_columns
  FROM (VALUES ('profiles'),('programme_participants'),('user_roles')) AS t(tbl)
 ORDER BY t.tbl;
```

```sql
-- W5. Definisi penuh polisi pada jadual warisan
SELECT 'W5_legacy_policies' AS check_name,
       pol.tablename AS table_name, pol.policyname, pol.cmd,
       pol.roles::text AS applies_to,
       pol.qual AS using_expr, pol.with_check AS check_expr
  FROM pg_policies pol
 WHERE pol.schemaname = 'public'
   AND pol.tablename IN ('profiles','programme_participants','user_roles')
 ORDER BY pol.tablename, pol.cmd, pol.policyname;
```

### Langkah 4 — Bukti jadual warisan TIDAK menyuap fungsi (W6, W7)

```sql
-- W6. Sumber SEMUA fungsi public: adakah mana-mana merujuk jadual warisan?
SELECT 'W6_functions_referencing_legacy' AS check_name,
       p.proname AS function_name, l.lanname AS language, p.prosecdef AS security_definer,
       CASE WHEN p.prosrc ~ '(^|[^a-z_])profiles([^a-z_]|$)'                 THEN 'profiles '        ELSE '' END
    || CASE WHEN p.prosrc ~ 'user_roles'                                      THEN 'user_roles '      ELSE '' END
    || CASE WHEN p.prosrc ~ 'programme_participants'                          THEN 'programme_participants' ELSE '' END
       AS merujuk_jadual_warisan
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l  ON l.oid = p.prolang
 WHERE n.nspname = 'public'
 ORDER BY (p.prosrc ~ 'user_roles|programme_participants|(^|[^a-z_])profiles([^a-z_]|$)') DESC,
          p.proname;
```

> **Jangkaan Arena:** TIADA satu pun fungsi menandakan jadual warisan, kerana
> `current_user_role()` membaca `public.user_profiles` sahaja. **Jika ada
> fungsi yang merujuk `user_roles` atau `profiles`, itu 🔴 BLOCKER** —
> berhenti dan laporkan serta-merta, kerana ia bermakna rantaian kebenaran
> mungkin melalui jadual yang tidak terkawal.

```sql
-- W7. Pergantungan objek (siapa bergantung pada jadual warisan?)
SELECT 'W7_legacy_dependents' AS check_name,
       cl.relname AS legacy_table,
       coalesce(string_agg(DISTINCT dep.refclassid::regclass::text || ':' ||
                 coalesce(dep2.proname, depcl.relname, '(lain)'), ', '),
                '(tiada tanggungan)') AS dependents
  FROM pg_class cl
  JOIN pg_namespace n ON n.oid = cl.relnamespace
  LEFT JOIN pg_depend dep ON dep.refobjid = cl.oid AND dep.refclassid = 'pg_class'::regclass
  LEFT JOIN pg_proc dep2  ON dep2.oid = dep.objid AND dep.classid = 'pg_proc'::regclass
  LEFT JOIN pg_class depcl ON depcl.oid = dep.objid AND dep.classid = 'pg_class'::regclass
 WHERE n.nspname = 'public'
   AND cl.relname IN ('profiles','programme_participants','user_roles')
 GROUP BY cl.relname
 ORDER BY cl.relname;
```

### Langkah 5 — Kolum sensitif pada jadual warisan (W8)

```sql
-- W8. Adakah jadual warisan menyimpan kolum sensitif? (nama kolum SAHAJA)
SELECT 'W8_legacy_sensitive_columns' AS check_name,
       c.table_name,
       coalesce(string_agg(c.column_name, ', ' ORDER BY c.column_name), '(tiada)') AS kolum_sensitif
  FROM information_schema.columns c
 WHERE c.table_schema = 'public'
   AND c.table_name IN ('profiles','programme_participants','user_roles')
   AND (c.column_name ~* 'password|secret|token|hash|otp|mfa|totp|salt|key|role|status|ic|nric|identification')
 GROUP BY c.table_name
 ORDER BY c.table_name;
```

> **JANGAN** `SELECT` isi kolum sensitif. Nama kolum sahaja.

### Langkah 6 — Laporan + cadangan

Setelah W1–W8 selesai, berikan:

1. Jadual W1–W8 dengan bukti **verbatim**.
2. **Cadangan bertulis** bagi setiap jadual warisan:
   - **KEKAL** (jika ada tanggungan / data unik yang diperlukan), atau
   - **CADANG DROP** (jika kosong, tiada tanggungan, tiada fungsi merujuk), atau
   - **PERLU SIASATAN LANJUT** (jika ada data tetapi tiada pengguna jelas).
3. Untuk setiap cadangan DROP, nyatakan **bukti** yang menyokongnya
   (`row_count`, `dependents`, `merujuk_jadual_warisan`).
4. Nyatakan sama ada mana-mana jadual warisan mempunyai **kolum sensitif**
   (W8) yang mendedahkan data.

**⛔ JANGAN jalankan `DROP TABLE`, `TRUNCATE`, `DELETE`, `ALTER`, `GRANT` atau
`REVOKE` pada jadual warisan.** Arena akan meluluskan tindakan secara bertulis
selepas meneliti W1–W8, melalui prompt berasingan.

---

## 4. Larangan (kekal)

1. JANGAN ubah logik perniagaan dalam SQL.
2. JANGAN jalankan sebarang DDL/DML — **prompt ini read-only sepenuhnya**.
3. JANGAN `DROP`/`TRUNCATE`/`DELETE` jadual warisan walaupun ia kelihatan tidak berguna.
4. JANGAN guna `service_role`.
5. JANGAN panggil RPC perniagaan atau `admin_*`.
6. JANGAN merge ke `main` atau tukar Vercel Production Branch.
7. JANGAN tampal anon key / secret penuh dalam laporan.
8. JANGAN cetak nilai `default_password` atau isi kolum sensitif — nama kolum dan cap jari md5 sahaja.
9. JANGAN reka bukti. Jika tidak menjalankannya, katakan tidak.
10. JANGAN anggap Mod Demo tempatan sebagai produksi.
11. JANGAN teruskan ke **D** (Auth config) atau **E** (Vercel Production Branch) tanpa kelulusan bertulis Arena.
12. JANGAN rujuk hash komit lama — gunakan cap jari kandungan / blob SHA.

---

## 5. FORMAT LAPORAN (6 seksyen)

```
📋 LAPORAN PROMPT-6C — V3 DIBETULKAN + AUDIT JADUAL WARISAN
============================================================

1. CONTEXT & STATUS
   - Status keseluruhan: 🟢 V4-V8 LULUS + AUDIT SELESAI / 🔴 BLOCKER
   - Pengesahan bahawa prompt ini dijalankan READ-ONLY sepenuhnya

2. ACTIONS TAKEN
   - V4-V8 yang dilengkapkan
   - W1-W8 yang dijalankan

3. VERIFICATION TABLE
   a) V4-V8  | Semakan | Status ✅/❌ | Bukti verbatim |
   b) W1-W8  | Semakan | Status | Bukti verbatim |

4. ISSUES / BLOCKERS
   - W6: adakah mana-mana fungsi merujuk jadual warisan? (jika ya → 🔴)
   - W8: adakah kolum sensitif terdedah?
   - Sebarang ralat penuh (ERROR / DETAIL / HINT / CONTEXT / SQLSTATE)

5. COMPLIANCE CHECKLIST
   - 12 larangan: 🟢/🔴 setiap satu
   - Pengesahan eksplisit: TIADA DROP/TRUNCATE/DELETE/ALTER/GRANT/REVOKE dijalankan

6. CONCLUSION & NEXT STEP
   - Cadangan bagi setiap jadual warisan: KEKAL / CADANG DROP / SIASAT LANJUT
     + bukti sokongan
   - Pengesahan bahawa D dan E TIDAK dijalankan
   - Apa yang kamu cadangkan Arena lakukan seterusnya
```

---

## Nota untuk Arena (bukan untuk ChatGPT)

**Kesilapan kriteria yang perlu dielak:** jangan tetapkan kriteria penerimaan
berdasarkan **satu fail** apabila query mengira **keseluruhan skema**. `9`
ialah bilangan polisi dalam `fix-rls-recursion.sql`; `17` ialah bilangan polisi
bergantung `has_role()` dalam skema `public` live. Keduanya benar untuk soalan
yang berbeza.

**Peraturan baharu:** setiap kriteria penerimaan yang mengira objek mestilah
**diterbitkan secara automatik** daripada pemasangan bersih dalam ujian, bukan
diteka — **dan** skop query mesti dinyatakan (satu fail vs keseluruhan skema).
`scripts/test-preflight-b-sql.mjs` kini menjadi sumber baseline: pemasangan
bersih = tepat 9 polisi bergantung `has_role()`.

**Status 3 jadual warisan:** belum diketahui puncanya (kemungkinan kerja Fasa 1–3
manual sebelum skema dirasmikan). `current_user_role()` hanya membaca
`user_profiles`, jadi ia **bukan** vektor kebenaran — tetapi W6 mesti
mengsahkannya sebelum Arena meluluskan sebarang DROP.
