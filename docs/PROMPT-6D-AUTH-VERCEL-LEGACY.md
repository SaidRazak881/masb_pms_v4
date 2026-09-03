# PROMPT 6D — KELULUSAN D + E, dan penutup audit warisan (X1–X5)

> **⚠️ DIGANTIKAN SEBAHAGIAN oleh `docs/PROMPT-6E-VERCEL-PRODUCTION-PRIVATE-HAS-ROLE.md`**
> 
> Laporan ChatGPT untuk prompt ini menunjukkan **connector sesi tiada operasi
> untuk Supabase Auth configuration**, jadi **Langkah D mustahil dijalankan oleh
> mana-mana alat**. ChatGPT berhenti dengan betul dan enggan mereka nilai.
> 
> Akibatnya:
> - **Langkah D** → pada mulanya dipindahkan kepada **pengguna** (manual).
>   **PEMINDAHAN ITU DIBATALKAN.** Pengguna mengesahkan ChatGPT mempunyai
>   **capaian penuh** terhadap Supabase dan Vercel; had yang dilaporkan ialah
>   sifat **sesi itu**, bukan sempadan keupayaan kekal. D dikembalikan kepada
>   ChatGPT dalam **`docs/PROMPT-6F-AUDIT-PRIVATE-SCHEMA-DRIFT.md` §2**.
> - **Langkah E** → **dinyahganding** dari D dan diluluskan dalam **PROMPT-6E**,
>   kemudian **dikembalikan kepada ChatGPT** dalam **PROMPT-6F §1** selepas
>   pembetulan yang sama (Arena tersilap menganggap penukaran Production Branch
>   ialah kerja manual pengguna).
>   Gate "D sebelum E" Arena ialah kesilapan proses: ia menyekat pemulihan
>   produksi kerana sebab yang tidak berkaitan.
> - **X1–X5** → X4/X5 berjaya (bukti digunakan dalam PROMPT-6E §6). X1 tidak
>   lengkap; X2/X3 dihalang kerana bergantung kepada `pg_proc.prosrc` dan
>   pelaksanaan fungsi. Digantikan oleh **Y1–Y4** (panduan katalog sahaja).
> 
> **Dokumen ini dikekalkan sebagai rekod.** Jangan jalankan semula.

> **Persona kamu:** Jurutera pangkalan data yang teliti dan berhati-hati
> (`docs/personas/PERSONA-SQL-ARCHITECT.md`).
>
> **Keadaan:** PROMPT-6C selesai. **V1–V8 = 8/8 PASS. W1–W8 selesai. W6 PASS**
> (tiada fungsi `public` merujuk jadual warisan). Tiada tindakan destruktif
> dilakukan. D dan E belum dijalankan.
>
> **Keputusan Arena:**
> 1. ✅ **C13 ditutup sepenuhnya.** V1–V8 semua lulus.
> 2. ✅ **Anda betul tentang W1** — allowlist Arena tersalah klasifikasi
>    `import_batches` dan `import_staging`. Lihat §1.
> 3. 🟢 **LANGKAH D DILULUSKAN.**
> 4. 🟢 **LANGKAH E DILULUSKAN** — **tetapi hanya selepas D selesai dan
>    dilaporkan.** Ini laluan kritikal: produksi kini dalam keadaan separa
>    (SQL Fasa 6 sudah dipasang, tetapi Vercel masih kod lama).
> 5. 🔎 **X1–X5 diluluskan (READ-ONLY)** — untuk menutup penemuan W5 bahawa
>    polisi jadual warisan menggunakan **`private.has_role()`**, fungsi yang
>    **bukan** ciptaan repo.
> 6. ⛔ **TIADA kelulusan DROP / REVOKE / ALTER** pada jadual warisan. Lihat §4.

---

## 1. Pembetulan W1 — pengakuan kesilapan Arena

Arena mengesahkan dakwaan anda dengan bukti:

```
lib/supabase/schema-import-staging.sql:76   create table if not exists import_batches (
lib/supabase/schema-import-staging.sql      create table if not exists import_staging (
```

**Punca kesilapan Arena:** allowlist W1 diterbitkan daripada
`grep "CREATE TABLE IF NOT EXISTS"` — **peka huruf besar**. Fail
`schema-import-staging.sql` menulis `create table if not exists` dalam
**huruf kecil**, jadi kedua-dua jadual itu terlepas dan allowlist menjadi 13,
bukan **15**.

**Bilangan jadual rasmi repo yang BETUL = 15:**

```
app_settings, audit_logs, change_requests, cost_items, financial_docs,
import_batches, import_staging, invoices, organizers, participants,
programme_costs, programme_documents, programme_unlock_requests, programmes,
user_profiles
```

**Aritmetik yang kini tertutup rapat:** 15 rasmi + 3 warisan = **18** = tepat bilangan
jadual `public` ber-RLS yang anda laporkan dalam W1. ✅

**Jadual warisan yang sah = 3:** `profiles`, `programme_participants`,
`user_roles`. Ini selaras dengan 8 polisi tambahan dalam V3 (17 = 9 + 8).

**Peraturan pengajaran (direkodkan):** `grep` untuk mengira objek SQL mesti
**case-insensitive** (`grep -i`), dan allowlist yang diterbitkan secara manual
mesti disahkan oleh ujian automatik. Kedua-dua punca ini telah menyebabkan
dua kriteria salah dalam Fasa 6 (V3 = 9, W1 = 13).

---

## 2. LANGKAH D — DILULUSKAN 🟢

Jalankan **Langkah D** tepat seperti tertulis dalam
`docs/PROMPT-6-INSTALL-USER-MANAGEMENT.md`:

1. **Authentication → Providers → Email** — pastikan aktif. Laporkan kesan
   `Confirm email` ON vs OFF untuk aliran `/register`, dan berikan
   **cadangan + sebab**.
   - **Panduan Arena:** bukti B5 menunjukkan **19/19** akaun sedia ada
     mempunyai `email_confirmed_at` **IS NOT NULL**. Ini konsisten dengan
     `Confirm email = OFF` sekarang. Kod app di `app/(auth)/register/page.tsx`
     **menangani kedua-dua kes** — jika `signUp()` tidak membalas sesi, ia
     memaparkan "e-mel perlu disahkan"; jika sesi dibalas, ia **membuang sesi**
     dan memaparkan "Menunggu Kelulusan". Jadi OFF lebih lancar untuk aliran
     kelulusan Super Admin, tetapi ON menambah pertahanan terhadap pendaftaran
     e-mel palsu. **Nyatakan cadangan anda dan biarkan pengguna memutuskan.**
2. **Authentication → URL Configuration**
   - `Site URL` = `https://masb-pms-v4.vercel.app`
   - `Redirect URLs` = tambah `https://masb-pms-v4.vercel.app/security**`
     (diperlukan oleh aliran `/forgot-password` → `/security?reset=1`)
   - **Laporkan nilai SEMASA sebelum mengubah**, supaya boleh dipulihkan.
3. **Authentication → Email Templates** — sahkan template "Reset Password"
   menggunakan `{{ .ConfirmationURL }}`. Jika mahu Bahasa Melayu, sediakan
   teks cadangan (subjek + badan). **Jangan tukar template tanpa melaporkannya.**
4. **Rate Limits** — nyatakan sama ada perubahan diperlukan.
   **JANGAN** cadangkan melumpuhkan sebarang perlindungan.

**Berhenti dan laporkan D sebelum mula E.**

---

## 3. LANGKAH E — DILULUSKAN 🟢 (selepas D dilaporkan)

Jalankan **Langkah E** tepat seperti tertulis dalam
`docs/PROMPT-6-INSTALL-USER-MANAGEMENT.md`:

1. Vercel Dashboard → projek `masb-pms-v4` → **Settings → Git → Production
   Branch** → tukar kepada **`arena/01a06274-masb-pms-v4`** → Save.
   - **Laporkan nilai SEMASA dahulu** (jangkaan: branch Fasa 5
     `arena/01a05cd4-masb-pms-v4`) supaya boleh dipulangkan jika perlu.
2. Sahkan deployment baharu mencapai **READY** dengan `Target: Production`.
   Laporkan **hash komit** yang di-deploy.
   **Kriteria (kalis kendiri — jangan guna hash tetap):** jalankan
   `git ls-remote origin arena/01a06274-masb-pms-v4` dan bandingkan.
   Hash deployment **mesti sama** dengan hujung branch itu. Jika berbeza
   atau lebih lama, **laporkan sebagai isu** — ia bermakna Vercel menarik
   komit yang salah atau deployment belum selesai.
   *(Semasa prompt ini ditulis hujung branch ialah `c51b39d`, tetapi angka
   ini akan bergerak; gunakan `git ls-remote` sebagai sumber benar.)*
   **Pengesahan kandungan yang lebih penting daripada hash:** deployment
   mesti mengandungi `lib/auth.ts`, `app/(auth)/register/page.tsx`,
   `app/(dashboard)/admin/users/page.tsx` dan
   `components/admin/user-management.tsx`. Jika E3/E4 gagal, semak
   keberadaan fail ini dahulu.
3. Sahkan **Environment Variables** `NEXT_PUBLIC_SUPABASE_URL` dan
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` wujud untuk **Production dan Preview**.
   **JANGAN papar nilai** — sahkan kewujudan sahaja.
4. Nyatakan sama ada redeploy manual diperlukan selepas tukar branch.
5. Jalankan **E1–E9** (semakan tanpa log masuk):

| # | URL | Jangkaan |
|---|-----|----------|
| E1 | `/programmes` | redirect ke `/login?redirect=%2Fprogrammes` |
| E2 | `/admin/users` | redirect ke `/login?redirect=%2Fadmin%2Fusers` |
| E3 | `/login` | 200; mengandungi `masb.12345`, `Daftar Akaun Baharu`, `Lupa kata laluan?` |
| E4 | `/register` | 200; mengandungi `Daftar Akaun Baharu`, `Menunggu Kelulusan` |
| E5 | `/forgot-password` | 200; mengandungi `Lupa Kata Laluan` |
| E6 | `/pending-approval` | 200; mengandungi `Menunggu Kelulusan` |
| E7 | `/account-blocked` | 200; mengandungi `Akaun Disekat` |
| E8 | `/security` | redirect ke `/login` |
| E9 | mana-mana halaman | **TIADA** teks `authenticator`, `Pengesahan 2-Langkah`, `kod 6 digit`, `TOTP`, `MFA` |

**E9 ialah bukti bahawa MFA benar-benar dibuang dari produksi.**

> Nota: sandbox Arena **tidak boleh** mencapai `*.vercel.app` (rangkaian
> disekat), jadi E1–E9 **mesti** anda jalankan sendiri. Jangan reka keputusan.
> Jika anda tidak dapat fetch, katakan demikian.

---

## 4. X1–X5 — Penutup audit warisan (READ-ONLY) 🟢

**Sebab:** W5 anda mendedahkan bahawa polisi ketiga-tiga jadual warisan
menggunakan **`private.has_role()`**. Arena mengesahkan fungsi ini **bukan**
ciptaan repo — satu-satunya objek skema `private` dalam repo ialah
`private.append_import_audit` (`sync-import-transaction.sql:11`). Jadi
`private.has_role()` ialah fungsi warisan yang **tidak terkawal oleh repo**,
dan ia mungkin mempunyai drift `super_admin` yang sama seperti C13.

**X1–X5 READ-ONLY sepenuhnya. Tiada DDL/DML/GRANT/REVOKE.**

```sql
-- X1. Inventori SEMUA fungsi (bukan hanya public) + sama ada ia baca
--     user_profiles dan sama ada ia sedar super_admin.
SELECT 'X1_function_inventory' AS check_name,
       n.nspname AS schema_name, p.proname AS function_name,
       l.lanname AS language, p.prosecdef AS security_definer,
       (p.prosrc ~ 'user_profiles')          AS reads_user_profiles,
       (p.prosrc ~ 'super_admin')            AS super_admin_aware,
       (p.prosrc ~ 'user_roles')             AS reads_user_roles,
       (p.prosrc ~ '(^|[^a-z_.])profiles([^a-z_]|$)') AS reads_legacy_profiles
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l  ON l.oid = p.prolang
 WHERE n.nspname IN ('public','private')
 ORDER BY (p.prosrc ~ 'super_admin'), n.nspname, p.proname;
```

```sql
-- X2. Definisi + metafungsi private.has_role()
SELECT 'X2_private_has_role' AS check_name,
       l.lanname AS language, p.prosecdef AS security_definer,
       p.provolatile AS volatility,
       position('super_admin' in p.prosrc) AS super_admin_pos,
       p.prosrc
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l  ON l.oid = p.prolang
 WHERE n.nspname = 'private' AND p.proname = 'has_role';
```

```sql
-- X3. Ujian TINGKAH LAKU private.has_role() bagi Master Admin (super_admin).
--     Read-only: hanya SELECT, tiada perubahan data.
SELECT 'X3_private_has_role_behaviour' AS check_name,
       public.current_user_role()::text AS public_current_role,
       (SELECT count(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='private' AND p.proname='has_role') AS private_fn_wujud,
       (SELECT string_agg(t.r, ', ' ORDER BY t.r) FROM
          (SELECT r, (private.has_role(r::public.app_role))::text AS v
             FROM (VALUES ('admin'),('head_governance'),('manager'),('executive'),
                          ('finance'),('staff'),('viewer'),('super_admin')) AS x(r)) t
        WHERE t.v = 'true') AS private_roles_true;
```

> **Jangkaan Arena:** jika `private.has_role()` **tidak** sedar `super_admin`,
> `private_roles_true` akan mengandungi **hanya `super_admin`** — iaitu drift
> C13 yang sama, tetapi pada fungsi warisan. Jika ia **sedar**, semua 8 akan
> true. **Laporkan apa adanya; jangan betulkan.**
>
> Jika X3 menimbulkan ralat (cth. `private.has_role` tidak boleh dilaksanakan
> oleh role semasa), **tampal ralat penuh** (ERROR / DETAIL / HINT / CONTEXT /
> SQLSTATE) dan teruskan ke X4 — jangan hentikan keseluruhan laporan.

```sql
-- X4. Privilej JADUAL bagi authenticated/anon pada 3 jadual warisan
--     + semua jadual rasmi (perbandingan).
SELECT 'X4_table_privileges' AS check_name, tp.grantee, tp.table_name,
       string_agg(tp.privilege_type, ', ' ORDER BY tp.privilege_type) AS table_privs,
       CASE WHEN tp.table_name IN ('profiles','programme_participants','user_roles')
            THEN '⚠️ WARISAN' ELSE 'rasmi' END AS origin
  FROM information_schema.table_privileges tp
 WHERE tp.table_schema = 'public'
   AND tp.grantee IN ('authenticated','anon')
 GROUP BY tp.grantee, tp.table_name
 ORDER BY origin DESC, tp.grantee, tp.table_name;
```

```sql
-- X5. Definisi PENUH polisi pada jadual warisan (nama fungsi + ungkapan)
SELECT 'X5_legacy_policy_definitions' AS check_name,
       pol.tablename AS table_name, pol.policyname, pol.cmd,
       pol.roles::text AS applies_to,
       pol.qual AS using_expr, pol.with_check AS check_expr
  FROM pg_policies pol
 WHERE pol.schemaname = 'public'
   AND pol.tablename IN ('profiles','programme_participants','user_roles')
 ORDER BY pol.tablename, pol.cmd, pol.policyname;
```

### Kriteria X

| # | Apa yang Arena perlu tahu | Kenapa |
|---|---------------------------|------|
| X1 | Senarai fungsi di `public` **dan** `private`; tandakan mana `super_admin_aware = false` tetapi `reads_user_profiles = true` | Fungsi sebegitu ialah calon drift C13 yang seterusnya |
| X2 | `language`, `security_definer`, `super_admin_pos`, `prosrc` penuh `private.has_role()` | Menentukan sama ada ia boleh menaik taraf kebenaran |
| X3 | `private_roles_true` bagi Master Admin | Bukti tingkah laku sebenar |
| X4 | Jadual warisan mana ada `INSERT`/`UPDATE`/`DELETE` untuk `authenticated` | Menentukan sama ada REVOKE diperlukan |
| X5 | Ungkapan `USING` / `WITH CHECK` penuh, termasuk **nama polisi** | Arena perlu lihat `user_roles_admin_write` yang anda sebut |

---

## 5. Keputusan Arena tentang 3 jadual warisan

| Jadual | Cadangan anda | Keputusan Arena | Sebab |
| ------ | ------------- | --------------- | ----- |
| `programme_participants` | 🟠 CADANG DROP | **TANGGUH** — tunggu X4/X5 | 0 baris, tiada tanggungan fungsi, tiada kolum sensitif. Kandidat drop paling bersih, tetapi `DROP TABLE` **tidak boleh dipulihkan** dan tiada desakan. Ia tidak menjejaskan kebenaran (W6 PASS). |
| `profiles` | 🟡 SIASAT LANJUT | **TANGGUH** — tunggu X4/X5 | 1 baris. Perlu tahu sama ada ia salinan lapuk `user_profiles` atau data unik. |
| `user_roles` | 🟡 SIASAT LANJUT | **TANGGUH** — tunggu X2/X3/X5 | 1 baris, `authenticated` ada tulis pada `role`/`user_id`. **Risiko tertinggi** kerana namanya menyerupai stor kebenaran. Tetapi W6 membuktikan tiada fungsi `public` membacanya, jadi ia **tidak** memberi kuasa dalam sistem semasa. |

**Arena bersetuju dengan anda: jangan drop tanpa pengesahan tambahan.**

**Rancangan Arena selepas X1–X5** (akan diluluskan melalui prompt
berasingan, kemungkinan **PROMPT-6E**):

1. Jika X4 mengesahkan `authenticated` ada tulis pada jadual warisan →
   **`REVOKE` dahulu** (boleh dipulihkan, menutup permukaan tulis yang tidak
   perlu) **sebelum** mempertimbangkan `DROP`.
2. Jika X3 menunjukkan `private.has_role()` tidak sedar `super_admin` **dan**
   X5 menunjukkan ia mengawal tulis → pertimbangkan membetulkan atau membuang
   polisi itu bersama jadualnya.
3. `DROP TABLE` hanya untuk jadual yang **kosong** ATAU yang 1 barisnya telah
   disahkan salinan lapuk — dan hanya selepas pengguna meluluskan secara
   eksplisit.

**Tiada tindakan ini diluluskan sekarang.**

---

## 6. Larangan (kekal)

1. JANGAN ubah logik perniagaan dalam SQL.
2. JANGAN jalankan sebarang DDL/DML/GRANT/REVOKE kecuali yang **diperlukan
   oleh Langkah D dan E** (konfigurasi Auth melalui UI Supabase, dan tukar
   Production Branch melalui UI Vercel). **X1–X5 read-only sepenuhnya.**
3. JANGAN `DROP`/`TRUNCATE`/`DELETE` jadual warisan.
4. JANGAN guna `service_role`.
5. JANGAN panggil RPC perniagaan atau `admin_*`.
6. JANGAN merge ke `main`.
7. JANGAN tukar Production Branch ke branch selain
   `arena/01a06274-masb-pms-v4`.
8. JANGAN tampal anon key / secret penuh dalam laporan.
9. JANGAN cetak nilai `default_password` atau isi kolum sensitif.
10. JANGAN reka bukti — terutamanya E1–E9. Jika tidak dapat fetch, katakan.
11. JANGAN anggap Mod Demo tempatan sebagai produksi.
12. JANGAN rujuk hash komit lama — guna cap jari kandungan / blob SHA.
13. **JANGAN mula E sebelum D dilaporkan.**

---

## 7. FORMAT LAPORAN (6 seksyen)

```
📋 LAPORAN PROMPT-6D — D + E + PENUTUP AUDIT WARISAN
=====================================================

1. CONTEXT & STATUS
   - Status keseluruhan: 🟢 / 🔴
   - D siap? E siap? X1-X5 siap?
   - Pengesahan urutan: D dilaporkan SEBELUM E dijalankan

2. ACTIONS TAKEN
   - D: setiap tetapan Auth — nilai SEMASA → nilai BAHARU
   - E: Production Branch SEMASA → BAHARU, hash komit deploy, status READY
   - X: query yang dijalankan

3. VERIFICATION TABLE
   a) D1-D4  | Tetapan | Nilai semasa | Nilai baharu | Status |
   b) E1-E9  | URL | Jangkaan | Keputusan sebenar | Status ✅/❌ |
   c) X1-X5  | Semakan | Bukti verbatim |

4. ISSUES / BLOCKERS
   - E1-E9 yang gagal (dengan respons sebenar)
   - X3: adakah private.has_role() sedar super_admin?
   - X1: fungsi mana super_admin_aware=false tetapi reads_user_profiles=true?
   - Ralat penuh (ERROR / DETAIL / HINT / CONTEXT / SQLSTATE)

5. COMPLIANCE CHECKLIST
   - 13 larangan: 🟢/🔴 setiap satu
   - Pengesahan eksplisit: TIADA DROP/TRUNCATE/DELETE pada jadual warisan

6. CONCLUSION & NEXT STEP
   - Adakah produksi kini berfungsi (E1-E9)?
   - Rumusan X1-X5: adakah private.has_role() satu lagi drift C13?
   - Cadangan anda untuk 3 jadual warisan berdasarkan bukti X
   - Apa yang Arena perlu buat seterusnya
```

---

## Nota untuk Arena (bukan untuk ChatGPT)

**Selepas E lulus (E1–E9 hijau), pengguna perlu:**

1. Log masuk ke `https://masb-pms-v4.vercel.app` sebagai
   `saidrazak881@gmail.com` / `masb.12345`.
2. Beliau **akan** diarah ke `/security?required=1&next=%2Fdashboard` — wajib
   tukar kata laluan.
3. Kemudian jalankan **`docs/ACTION-6-UAT-AUTH-USERS.md`** (A–K, termasuk
   A3b/A3c).
4. Edarkan arahan kepada 19 pengguna: kata laluan semua akaun kini
   `masb.12345`, wajib ditukar pada log masuk pertama.

**Dua kriteria salah yang Arena buat dalam Fasa 6 (rekod pengajaran):**

| Kriteria | Salah kerana | Pembetulan |
| -------- | ------------ | ---------- |
| V3 `policy_count = 9` | Angka diambil dari satu fail, tetapi query mengira seluruh skema | Baseline automatik dalam `scripts/test-preflight-b-sql.mjs`; kriteria = "9 rasmi hadir + lebihan diaudit" |
| W1 allowlist 13 jadual | `grep "CREATE TABLE"` **peka huruf besar**; `schema-import-staging.sql` guna huruf kecil | 15 jadual rasmi; `grep -i` wajib |

Kedua-duanya dikesan oleh **ChatGPT**, bukan oleh Arena. Ini mengesahkan nilai
gate "evidence over vibes" dalam skill `vibe-coding-workflow`.
