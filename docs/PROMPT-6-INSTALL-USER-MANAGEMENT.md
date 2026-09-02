# PROMPT 6 — Pasang Pengurusan Pengguna (Fasa 6) + Tukar Production Branch Vercel

> **Status:** Sedia digunakan. Kod Fasa 6 telah di-push ke branch
> **`arena/01a06274-masb-pms-v4`** dan diuji:
> - `npm run build` → lulus, 16 laluan (termasuk `/register`, `/forgot-password`,
>   `/pending-approval`, `/account-blocked`, `/admin/users`).
> - `node scripts/test-user-management-sql.mjs` → **SEMUA UJIAN LULUS**
>   (pemasangan pada PostgreSQL kosong + 12 kumpulan ujian fungsi + idempotensi).
> - `node scripts/test-sql-pglite.mjs` dan `test-sql-functional.mjs` → masih lulus
>   (regresi Fasa 1–5 tidak rosak).
>
> **Sasaran:** projek Supabase **`lmenmfsbjgxfhnykkgow`** ·
> Vercel **`https://masb-pms-v4.vercel.app`**
>
> **Fasa 6 menggantikan Fasa 5 (MFA).** MFA/TOTP telah dibuang sepenuhnya dari
> kod. `docs/PROMPT-5-RESET-PASSWORDS.md` dan `docs/ACTION-5-UAT-MFA.md`
> **TIDAK lagi digunakan** — reset kata laluan kini dilakukan oleh fail SQL
> Fasa 6 (Bahagian 8c) dan selepas itu melalui dashboard `/admin/users`.

---

## ⚠️ Baca dahulu — 3 perkara yang akan berubah pada sistem live

1. **SEMUA kata laluan akaun akan diset semula kepada `masb.12345`.**
   Ini membatalkan reset kata laluan rawak Fasa 5 (jika ia telah dijalankan).
   Setiap pengguna akan **diwajibkan** menukar kata laluan sebaik sahaja log
   masuk — mereka tidak boleh membuka modul lain sehingga menukarnya.
2. **`saidrazak881@gmail.com` dinaik taraf kepada `super_admin`** dan menjadi
   satu-satunya akaun yang boleh mengakses `/admin/users`.
3. **Production Branch Vercel mesti ditukar** daripada
   `arena/01a05cd4-masb-pms-v4` kepada `arena/01a06274-masb-pms-v4`.
   Tanpa langkah ini, Fasa 6 **tidak akan** sampai ke production.

**Urutan wajib: SQL dahulu (Langkah A–C), kemudian Vercel (Langkah D).**
Jika Vercel ditukar dahulu, kod Fasa 6 akan memanggil RPC yang belum wujud.

---

## 📋 CARA GUNA

1. Pastikan kod Fasa 6 sudah di-push (semak di GitHub: branch
   `arena/01a06274-masb-pms-v4` mengandungi `lib/supabase/user-management.sql`).
2. Salin keseluruhan kotak prompt di bawah ke ChatGPT (aktifkan **web
   browsing** supaya ia boleh muat turun fail dari GitHub).
3. ChatGPT menyediakan SQL + arahan; **anda** yang jalankan di Supabase SQL
   Editor dan tampal output kembali kepadanya.
4. Selepas laporan diterima, tampal laporan itu kepada saya (agent Arena) untuk
   semakan sebelum meneruskan `docs/ACTION-6-UAT-AUTH-USERS.md`.

---

## --- MULA PROMPT ---

### BLOK 1 — PERSONA

Baca fail persona di
https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/docs/personas/PERSONA-SQL-ARCHITECT.md
(klik **Raw**) dan AMALKAN persona itu sepanjang tugasan.

### BLOK 2 — PETA KOD

Baca peta kod terkini di
https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/docs/CODEBASE-MAP.md
(klik **Raw**). Bahagian 8 menerangkan Fasa 6. Gunakan sebagai konteks —
JANGAN cadangkan perkara yang sudah wujud.

### BLOK 3 — TUGASAN

**Konteks.** TPMS MIMOS Academy sudah live: skema (14 jadual), RPC penuh
(import sync, governance lock, change requests), RLS 38/38, seed data,
19 pengguna Auth + profil, storage bucket, dan deployment Vercel production.
Fasa 6 menukar model pengesahan:

- **BUANG MFA/TOTP** — log masuk kini e-mel + kata laluan sahaja.
- Kata laluan lalai pertama = `masb.12345`; pengguna **wajib** tukar selepas
  log masuk.
- Pendaftaran sendiri → akaun `pending` → **Super Admin** luluskan.
- Super Admin = `saidrazak881@gmail.com`, dashboard khas `/admin/users`
  (lulus, sekat/nyahsekat, reset kata laluan, tukar role).

Tugas anda: **sediakan dan pandu pemasangan SQL Fasa 6 pada Supabase live,
konfigurasikan Supabase Auth, kemudian tukar Production Branch Vercel.**
Anda TIDAK mempunyai capaian terus ke projek saya — saya yang akan jalankan
SQL dan tampal output kepada anda.

**PENTING — branch.** Repositori menggunakan branch
`arena/01a06274-masb-pms-v4` (BUKAN `main`, dan BUKAN branch Fasa 5
`arena/01a05cd4-...`). Semua URL di bawah sudah betul — jangan tukar.

> Nota: sejarah git repositori telah ditulis semula kepada satu komit
> ("Add files via upload"). Hash komit lama yang disebut dalam dokumen fasa
> terdahulu (21f18cb, 536ccc9, 13078f2, 8066e95, 8057579) **tidak wujud lagi**.
> Jangan cuba `git show`/`git checkout` hash tersebut — rujuk kandungan fail
> semasa sahaja.

---

#### LANGKAH A — Muat turun & semak fail SQL

Muat turun fail ini (klik **Raw**):

1. https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/lib/supabase/user-management.sql

> ⚠️ **Semak cap jari kandungan SEBELUM memulakan audit** — jangan bergantung
> pada hash komit (sejarah repositori ini pernah ditulis semula, jadi hash
> mudah mati). Ambil `user-management.sql` dari HEAD branch
> `arena/01a06274-masb-pms-v4`, kemudian sahkan ketiga-tiga cap jari ini:
>
> | Cap jari | Jangkaan |
> | -------- | -------- |
> | Carian `PERFORM public.assert_can_manage_users();` | muncul **tepat 8 kali** |
> | Dalam badan `admin_reset_all_passwords_to_default()` | ada `PERFORM public.assert_can_manage_users();` **diikuti** `IF NOT public.is_super_admin() THEN` (dwi-pengawal) |
> | Carian `assert_can_manage_users` (semua occurrence) | **tepat 11 kali** — 8 PERFORM + 1 CREATE FUNCTION + 1 REVOKE + 1 GRANT |
>
> Jika cap jari tidak sepadan (cth. hanya 7 PERFORM), anda sedang membaca
> versi lama yang mengandungi **blocker A7**. BERHENTI, laporkan, dan muat
> semula fail — jangan jalankan apa-apa.

Rujukan (baca jika perlu):

2. `lib/supabase/schema-master.sql`
3. `lib/supabase/fix-rls-recursion.sql`
4. `lib/supabase/governance-lock.sql`
5. `lib/supabase/change-requests.sql`

> ⚠️ **PEMBETULAN SELEPAS INSIDEN C13 (2026-09-03) — ARAHAN LAMA DI BAWAH
> ADALAH SALAH.** Versi asal prompt ini menulis *"JANGAN jalankan semula —
> sudah dipasang pada fasa lepas"*. Itu menyebabkan blocker C13 di produksi.
>
> **Sebenarnya:** Fasa 6 **mengubah** `public.has_role()` dalam
> `schema-master.sql` **dan** `fix-rls-recursion.sql` (menambah cawangan
> `IF v_role::text = 'super_admin' THEN RETURN true`). Produksi memasang
> kedua-dua fail itu semasa Fasa 1–5, **sebelum** cawangan itu wujud, jadi
> `has_role()` live kekal versi lama dan Master Admin kehilangan 7 role
> selepas Bahagian 8a menaik taraf beliau ke `super_admin`.
>
> **Peraturan baharu:** apabila satu fasa mengubah fail SQL milik fasa
> terdahulu, fail itu **MESTI dijalankan semula**. Bagi Fasa 6, jalankan
> **`lib/supabase/fix-rls-recursion.sql`** (fail paling kecil dan selamat:
> 3 fungsi + 9 polisi, sifar GRANT/REVOKE privilej jadual). Lihat
> **`docs/PROMPT-6B-FIX-C13-HAS-ROLE.md`**.
>
> **Semakan pra-pemasangan (WAJIB sebelum Langkah C):**
> ```sql
> SELECT l.lanname AS language,
>        position('super_admin' in p.prosrc) AS super_admin_pos
>   FROM pg_proc p
>   JOIN pg_namespace n ON n.oid = p.pronamespace
>   JOIN pg_language l ON l.oid = p.prolang
>  WHERE n.nspname = 'public' AND p.proname = 'has_role';
> ```
> Jika `super_admin_pos = 0` → jalankan `fix-rls-recursion.sql` **selepas**
> `user-management.sql`, kemudian sahkan C13.

Selepas membaca `user-management.sql`, senaraikan dalam laporan anda:

- **Enum:** nilai baharu yang ditambah.
- **Jadual:** jadual baharu + kolum baharu pada jadual sedia ada.
- **Fungsi/RPC:** semua fungsi, tandakan mana yang `SECURITY DEFINER`.
- **Polisi RLS:** polisi yang dicipta/digugurkan.
- **Trigger:** nama + jadual sasaran + bila ia firing.
- **GRANT/REVOKE:** apa yang ditarik daripada role `authenticated`.
- **Bahagian 8 (data):** senaraikan TEPAT apa yang ia ubah pada data live.

Kemudian **sahkan atau nafikan** setiap kenyataan ini (berikan bukti baris):

| # | Kenyataan |
|---|-----------|
| A1 | Fail mengandungi `COMMIT;` di tengah skrip, sejurus selepas enum `super_admin` ditambah |
| A2 | `COMMIT;` itu wajib kerana PostgreSQL tidak membenarkan nilai enum baharu digunakan dalam transaksi yang sama |
| A3 | Fail ini **idempotent** — selamat dijalankan lebih daripada sekali |
| A4 | Tiada `DROP TABLE` / `DROP POLICY` yang memusnahkan data perniagaan (programmes, invoices, participants, audit_logs) |
| A5 | `admin_reset_user_password` dan Bahagian 8c menulis ke `auth.users.encrypted_password` menggunakan `extensions.crypt(...)` |
| A6 | Column-level `GRANT UPDATE` kepada `authenticated` TIDAK termasuk `role`, `account_status`, `must_change_password`, `approved_by`, `approved_at`, `blocked_by`, `blocked_at`, `is_active` |
| A7 | **Kesemua lapan (8)** RPC `admin_*` memanggil `PERFORM public.assert_can_manage_users();` dan menulis `log_audit(...)` |
| A8 | `has_role()` dalam `schema-master.sql` / `fix-rls-recursion.sql` memulangkan `true` untuk sebarang role jika pengguna ialah `super_admin` |
| A9 | `admin_reset_all_passwords_to_default()` mempunyai **dwi-pengawal**: `assert_can_manage_users()` DAN `IF NOT public.is_super_admin() THEN` |

**Cara mengira A7 dengan tepat (elak kesilapan audit):** jalankan carian
`PERFORM public.assert_can_manage_users();` dalam fail — mesti muncul **tepat
8 kali**. Jangan kira occurrences `assert_can_manage_users` secara kasar
(seperti `grep -c`) dan terus membuat kesimpulan, kerana 3 lagi occurrence
ialah baris `CREATE FUNCTION`, `REVOKE` dan `GRANT` (jumlah 11). Kesilapan
kiraan inilah yang menyebabkan audit Arena sendiri terlepas blocker A7 pada
mulanya. Senaraikan **nombor baris** bagi setiap 8 fungsi `admin_*` sebagai
bukti dalam laporan anda.

> **Sejarah A7 (sudah diperbaiki).** Audit pertama pada 2026-09-02 menemui
> bahawa `admin_reset_all_passwords_to_default()` hanya menyemak
> `is_super_admin()`, yang TIDAK menyemak `account_status`. Akibatnya Super
> Admin yang telah **disekat** masih boleh mereset kata laluan semua pengguna.
> Ia telah diperbaiki (dwi-pengawal) dan kini dilindungi oleh dua ujian
> automatik: UJIAN 13 (berfungsi) dan UJIAN 14 (pengawal struktur sumber)
> dalam `scripts/test-user-management-sql.mjs`.

Jika mana-mana kenyataan A1–A9 **TIDAK** benar, BERHENTI dan laporkan sebagai
blocker 🔴 — jangan teruskan ke Langkah B.

---

#### LANGKAH B — Semak keadaan live (READ-ONLY)

Jalankan blok SQL di bawah di **Supabase Dashboard → projek
`lmenmfsbjgxfhnykkgow` → SQL Editor** dan tampel **keseluruhan** output.

> **Blok ini telah ditetapkan oleh Arena — guna APA ADANYA, jangan tulis
> semula.** Dua syarat reka bentuk yang wajib dipatuhi:
>
> 1. **Kalis ralat.** Pada pemasangan bersih, kolum `account_status`, jadual
>    `app_settings`, fungsi `admin_*` dan trigger Fasa 6 **belum wujud**.
>    Supabase SQL Editor menjalankan semua kenyataan sebagai **satu transaksi**
>    dan **berhenti pada ralat pertama**, jadi satu rujukan rosak memusnahkan
>    **keseluruhan** output B1–B10. Tiga perangkap berbeza, tiga penyelesaian
>    berbeza:
>
>    | Objek belum wujud | Cara SELAMAT | Cara yang GAGAL |
>    | --------------- | ------------ | --------------- |
>    | **Kolum** (`up.account_status`) | `to_jsonb(up)->>'account_status'` — diselesaikan pada runtime | `up.account_status` terus dalam SELECT |
>    | **Jadual** (`public.app_settings`) | `to_regclass('public.app_settings')` + `pg_attribute` — jadual **langsung tidak dinamakan** dalam FROM/JOIN | `FROM`/`JOIN public.app_settings`, **walaupun** dibalut `CASE` atau diberi syarat `AND to_regclass(...) IS NOT NULL` — PostgreSQL mengikat nama jadual pada waktu **PARSE** (ralat `42P01`) |
>    | **Fungsi** (`my_account_status()`) | semak kewujudan melalui katalog `pg_proc` | `SELECT public.my_account_status()` |
>
> 2. **Tiada kata laluan dalam laporan Langkah B.** B9 **tidak membaca nilai**
>    `default_password` sama sekali — ia hanya melaporkan kewujudan jadual dan
>    senarai kolum melalui katalog. Cap jari `md5` kata laluan lalai disahkan
>    di **Langkah C** (C-x) selepas pemasangan, apabila jadual itu memang sudah
>    wujud dan rujukan terus adalah selamat.
>
> Blok ini **read-only sepenuhnya** — tiada INSERT/UPDATE/DELETE/DDL, tiada
> `service_role`, tiada reset kata laluan, tiada panggilan RPC pengurusan.

```sql
-- ============================================================
-- FASA 6 — LANGKAH B: READ-ONLY LIVE PREFLIGHT (v3, kalis ralat)
-- Tiada WRITE. Tiada kata laluan/hash/key dalam output.
-- DISAHKAN oleh scripts/test-preflight-b-sql.mjs pada DUA keadaan:
--   (a) sebelum Fasa 6 dipasang  (b) selepas Fasa 6 dipasang
-- Selamat dijalankan SEBELUM Fasa 6 dipasang.
-- ============================================================

-- B1. Bilangan + pecahan role dalam user_profiles
SELECT 'B1_role_breakdown' AS check_name,
       COALESCE(up.role::text, '(tiada profil)') AS role,
       count(*)::int AS user_count
  FROM public.user_profiles up
 GROUP BY up.role
 ORDER BY 2;

-- B2. Kolum Fasa 6 pada user_profiles: wujud atau belum
SELECT 'B2_fasa6_columns' AS check_name, t.col AS column_name,
       CASE WHEN c.column_name IS NULL THEN '❌ BELUM WUJUD'
            ELSE '✅ wujud (' || c.data_type || ')' END AS status
  FROM (VALUES ('account_status'),('must_change_password'),
               ('password_changed_at'),('approved_by'),('approved_at'),
               ('blocked_by'),('blocked_at'),('block_reason')) AS t(col)
  LEFT JOIN information_schema.columns c
         ON c.table_schema='public' AND c.table_name='user_profiles'
        AND c.column_name=t.col
 ORDER BY t.col;

-- B3. Enum super_admin dalam app_role
SELECT 'B3_super_admin_enum' AS check_name,
       CASE WHEN EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid
                          JOIN pg_namespace n ON n.oid=t.typnamespace
                          WHERE n.nspname='public' AND t.typname='app_role'
                            AND e.enumlabel='super_admin')
            THEN '✅ super_admin wujud' ELSE '❌ BELUM ditambah' END AS status;

-- B4. Master Admin dalam auth.users (+ profil jika ada).
--     Guna to_jsonb() supaya TIDAK ralat jika account_status belum wujud.
SELECT 'B4_master_admin' AS check_name, au.email,
       CASE WHEN up.id IS NULL THEN '❌ profil TIDAK wujud'
            ELSE '✅ profil wujud' END AS profile_exists,
       COALESCE(up.role::text,'(tiada)') AS current_role,
       COALESCE(to_jsonb(up)->>'account_status','(kolum belum wujud)') AS current_account_status,
       COALESCE(to_jsonb(up)->>'must_change_password','(kolum belum wujud)') AS must_change_password
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.id = au.id
 WHERE lower(au.email) = 'saidrazak881@gmail.com';

-- B5. Bilangan auth.users + pengesahan e-mel
SELECT 'B5_auth_users' AS check_name, count(*)::int AS auth_users_count,
       count(*) FILTER (WHERE email_confirmed_at IS NOT NULL)::int AS email_confirmed_count
  FROM auth.users;

-- B6. Trigger bukan-dalaman pada auth.users
SELECT 'B6_auth_users_triggers' AS check_name,
       coalesce(string_agg(t.tgname, ', ' ORDER BY t.tgname), '(tiada trigger)') AS triggers
  FROM pg_trigger t
 WHERE t.tgrelid = 'auth.users'::regclass AND NOT t.tgisinternal;

-- B7. Fungsi Fasa 6: wujud atau belum (katalog sahaja, tiada panggilan)
SELECT 'B7_function_presence' AS check_name, f.fn AS function_name,
       CASE WHEN p.oid IS NULL THEN '❌ BELUM wujud' ELSE '✅ wujud' END AS status,
       CASE WHEN p.oid IS NULL THEN NULL ELSE p.prosecdef END AS security_definer
  FROM (VALUES ('can_manage_users'),('is_super_admin'),('assert_can_manage_users'),
               ('my_account_status'),('my_password_change_required'),
               ('mark_password_changed'),('default_password'),
               ('admin_list_users'),('admin_user_summary'),('admin_approve_user'),
               ('admin_set_user_blocked'),('admin_change_user_role'),
               ('admin_reset_user_password'),
               ('admin_reset_all_passwords_to_default'),
               ('admin_require_password_change')) AS f(fn)
  LEFT JOIN pg_proc p ON p.proname = f.fn
   AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname='public')
 ORDER BY f.fn;

-- B8. Privilej kolum 'authenticated' pada user_profiles (INSERT/UPDATE/DELETE)
SELECT 'B8_column_privileges' AS check_name,
       coalesce(string_agg(cp.privilege_type || '(' || cp.column_name || ')',
                           ', ' ORDER BY cp.privilege_type, cp.column_name),
                '(tiada privilej tulis langsung)') AS grants
  FROM information_schema.column_privileges cp
 WHERE cp.table_schema='public' AND cp.table_name='user_profiles'
   AND cp.grantee='authenticated'
   AND cp.privilege_type IN ('INSERT','UPDATE','DELETE');

-- B9. app_settings: kewujudan melalui KATALOG SAHAJA.
--     PENTING — perangkap yang MESTI dielak: nama `public.app_settings`
--     TIDAK BOLEH muncul sama sekali dalam kenyataan ini, walaupun di dalam
--     subkuari CASE atau CTE. PostgreSQL mengikat nama jadual pada waktu
--     PARSE, jadi `relation "public.app_settings" does not exist` (42P01)
--     tetap berlaku dan meruntuhkan SELURUH output B1–B10 pada pemasangan
--     bersih. `to_regclass()` + `pg_attribute` diselesaikan pada RUNTIME
--     dan tidak memerlukan jadual itu dinamakan.
--     Nilai `default_password` TIDAK dibaca di sini (tiada kata laluan dalam
--     laporan Langkah B). Cap jari md5 disahkan di Langkah C selepas pasang.
SELECT 'B9_app_settings' AS check_name,
       CASE WHEN to_regclass('public.app_settings') IS NULL
            THEN '❌ jadual BELUM wujud (jangkaan bagi pemasangan bersih)'
            ELSE '✅ jadual wujud' END AS table_status,
       CASE WHEN to_regclass('public.app_settings') IS NULL THEN '(n/a)'
            ELSE coalesce((SELECT string_agg(a.attname, ', '
                              ORDER BY a.attnum)
                       FROM pg_attribute a
                      WHERE a.attrelid = to_regclass('public.app_settings')
                        AND a.attnum > 0 AND NOT a.attisdropped), '(tiada kolum)')
       END AS columns,
       (SELECT count(*)::int FROM information_schema.columns c
         WHERE c.table_schema='public' AND c.table_name='app_settings'
           AND c.column_name IN ('key','value')) AS kolum_key_value_daripada_2;

-- B10. Ringkasan pemasangan (satu baris keputusan)
SELECT 'B10_rumusan' AS check_name,
       (SELECT count(*) FROM public.user_profiles)::int AS profil_users,
       (SELECT count(*) FROM auth.users)::int AS auth_users,
       (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='public' AND p.proname LIKE 'admin\_%')::int AS admin_rpc_wujud,
       (SELECT count(*) FROM information_schema.columns
         WHERE table_schema='public' AND table_name='user_profiles'
           AND column_name IN ('account_status','must_change_password'))::int AS kolum_fasa6_daripada_2,
       CASE WHEN to_regclass('public.app_settings') IS NULL
            THEN 'app_settings: tiada' ELSE 'app_settings: ada' END AS app_settings;
```

**Selepas menerima output, laporkan:**

- Jadual **B1–B10** dengan status 🟢/🟡/🔴 dan tafsiran setiap satu.
- Keputusan **CLEAN INSTALL** (Fasa 6 belum pernah dipasang) atau
  **REINSTALL / ULANG-PASANG** (sebahagian objek sudah wujud), dengan sebab.
- Pengesahan bahawa `user-management.sql` **selamat** dijalankan dalam keadaan
  itu (idempoten — A3).
- Jangkaan **tepat** apa yang akan berubah pada data live selepas Bahagian 8
  (8a promosi Master Admin, 8b aktifkan akaun pending sedia ada, 8c reset
  SEMUA kata laluan ke lalai).
- Jika Supabase membalas ralat: **JANGAN** betulkan sendiri. Tampel ralat penuh
  (ERROR / DETAIL / HINT / CONTEXT / SQLSTATE) dan berhenti.

**Jangan** sertakan sebarang kata laluan, hash kata laluan, atau
anon/service key dalam laporan anda.

---

#### LANGKAH C — Pasang SQL Fasa 6

Arahan kepada saya:

1. Buka Supabase Dashboard → projek `lmenmfsbjgxfhnykkgow` → **SQL Editor**.
2. Tampal **keseluruhan** kandungan `lib/supabase/user-management.sql`.
3. Jalankan.

**Amaran yang MESTI anda ulang dalam laporan:**

- Jangan buang atau "kemas kini" baris `COMMIT;` / `BEGIN;` di tengah fail.
- Jangan pecahkan fail kepada beberapa bahagian dan jalankan dalam urutan
  berbeza.
- Jangan tambah `DROP` sendiri.
- Jika berlaku ralat, **tampal mesej ralat penuh verbatim** (termasuk
  `DETAIL`, `HINT`, `CONTEXT`, `SQL state`) kepada anda sebelum cuba apa-apa
  pembetulan.

Selepas itu, sediakan **SATU blok SQL pengesahan read-only** yang menyemak:

| # | Semakan | Jangkaan |
|---|---------|----------|
| C1 | `app_role` mengandungi `super_admin` | 8 nilai enum |
| C2 | `account_status` wujud | `pending, active, blocked` |
| C3 | Kolum baharu pada `user_profiles` | 8 kolum (account_status, must_change_password, password_changed_at, approved_by, approved_at, blocked_by, blocked_at, block_reason) |
| C4 | `saidrazak881@gmail.com` | `role = super_admin`, `account_status = active` |
| C5 | Pecahan `account_status` semua profil | semua `active`, **0** `pending`, **0** `blocked` |
| C6 | `must_change_password` | `true` untuk SEMUA akaun |
| C7 | Kata laluan lalai | semua `auth.users.encrypted_password` memadani `extensions.crypt('masb.12345', encrypted_password)` — laporkan **kiraan** sahaja, JANGAN papar hash |
| C8 | Trigger pada `auth.users` | `on_auth_user_created`, `on_auth_user_updated` |
| C9 | RPC Fasa 6 wujud | **tepat 8** fungsi `admin_*` (`admin_list_users`, `admin_user_summary`, `admin_approve_user`, `admin_set_user_blocked`, `admin_change_user_role`, `admin_reset_user_password`, `admin_reset_all_passwords_to_default`, `admin_require_password_change`) — semua `SECURITY DEFINER` — + `can_manage_users`, `is_super_admin`, `my_account_status`, `my_password_change_required`, `mark_password_changed`, `default_password`, `assert_password_acceptable`, `assert_can_manage_users`, `handle_new_auth_user`, `sync_auth_user_update` |
| C10 | Column grant | `authenticated` hanya ada UPDATE pada `avatar_url, department, designation, full_name, phone, updated_at` — **tiada** `role`, `account_status`, `must_change_password`, `is_active`, `approved_*`, `blocked_*`. Laporkan **SEBELUM** (dari B8: grant lama termasuk `role`/`is_active`) dan **SELEPAS** untuk membuktikan lubang eskalasi privilege §8.1a telah ditutup. Jika `role` masih boleh ditulis selepas pasang → 🔴 BLOCKER, berhenti |
| C11 | `authenticated` tiada INSERT/DELETE pada `user_profiles` | 0 baris |
| C12 | `app_settings` | Kedua-dua key wujud. **JANGAN cetak nilai `default_password`.** Sahkan dengan cap jari: `SELECT key, length(value) AS panjang, md5(value) AS cap_jari FROM public.app_settings ORDER BY key;` → `default_password` mesti `panjang=10`, `cap_jari=cc3d4118520072361b5318c6d3441873` (disahkan oleh `scripts/test-preflight-b-sql.mjs` sebagai cap jari kata laluan lalai rasmi). `super_admin_email` boleh dicetak (bukan rahsia). |
| C13 | `has_role` sedar-super_admin | `lanname = plpgsql`, `super_admin_pos > 0`, `prosrc` mengandungi `super_admin`. **Jika gagal → 🔴 BLOCKER, berhenti dan guna `docs/PROMPT-6B-FIX-C13-HAS-ROLE.md`.** Ini benar-benar gagal pada pemasangan live 2026-09-03 kerana punca di nota Langkah A |
| C14 | RLS masih aktif pada semua jadual perniagaan | tiada jadual dengan `relrowsecurity = false` |

Sediakan juga **satu ujian fungsian read-only** yang membuktikan RPC menolak
bukan-Super Admin, tanpa mengubah data:

```sql
-- Tanpa menetapkan request.jwt.claims (tiada identiti), semua RPC admin_*
-- mesti GAGAL dengan ACCESS_DENIED. Jalankan setiap satu dan sahkan ralat.
select public.admin_user_summary();
```

Nyatakan dengan jelas bahawa kegagalan (`ACCESS_DENIED`) di sini ialah
keputusan yang **BETUL**.

Saya akan tampal semua output. Isi jadual C1–C14 dengan ✅/❌ berdasarkan
output SEBENAR — jangan isi sebelum saya menghantarnya.

---

#### LANGKAH D — Konfigurasi Supabase Auth (arahan manual kepada saya)

Berikan arahan langkah-demi-langkah yang TEPAT (nama menu semasa Supabase)
untuk:

1. **Authentication → Providers → Email**: pastikan aktif. Nyatakan kesan
   `Confirm email` ON vs OFF untuk aliran pendaftaran `/register`:
   - OFF → `signUp()` terus mencipta `auth.users`; trigger mencipta profil
     `pending`; pengguna boleh cuba log masuk serta-merta (akan nampak
     "Menunggu Kelulusan").
   - ON → pengguna mesti klik pautan e-mel dahulu.
   Berikan **cadangan** anda dan sebabnya.
2. **Authentication → URL Configuration**:
   - `Site URL` = `https://masb-pms-v4.vercel.app`
   - `Redirect URLs` = tambah `https://masb-pms-v4.vercel.app/security**`
     (perlu untuk aliran `/forgot-password` → `/security?reset=1`)
3. **Authentication → Email Templates**: sahkan template "Reset Password"
   menggunakan pautan `{{ .ConfirmationURL }}`. Jika organisasi mahu template
   dalam Bahasa Melayu, sediakan teks cadangan (subjek + badan).
4. Nyatakan sama ada sebarang perubahan **Rate Limits** diperlukan.
   JANGAN cadangkan melumpuhkan sebarang perlindungan.

---

#### LANGKAH E — Tukar Production Branch Vercel

Hanya SELEPAS Langkah C disahkan ✅ sepenuhnya.

Berikan arahan TEPAT untuk:

1. Vercel Dashboard → projek `masb-pms-v4` → **Settings → Git → Production
   Branch** → tukar kepada `arena/01a06274-masb-pms-v4` → Save.
2. Sahkan deployment baharu bermula dan mencapai **READY** dengan
   `Target: Production`.
3. Semak **Environment Variables** masih ada
   `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (Production **dan** Preview). JANGAN papar nilainya — sahkan kewujudan
   sahaja.
4. Nyatakan sama ada redeploy manual diperlukan selepas menukar branch.

Kemudian berikan **senarai semak pengesahan tanpa log masuk** (boleh anda
semak sendiri melalui fetch, kerana ia tidak memerlukan sesi):

| # | URL | Jangkaan |
|---|-----|----------|
| E1 | `/programmes` | redirect ke `/login?redirect=%2Fprogrammes` (middleware + env aktif) |
| E2 | `/admin/users` | redirect ke `/login?redirect=%2Fadmin%2Fusers` |
| E3 | `/login` | 200; mengandungi teks `masb.12345`, `Daftar Akaun Baharu`, `Lupa kata laluan?` |
| E4 | `/register` | 200; mengandungi `Daftar Akaun Baharu`, `Menunggu Kelulusan` |
| E5 | `/forgot-password` | 200; mengandungi `Lupa Kata Laluan` |
| E6 | `/pending-approval` | 200; mengandungi `Menunggu Kelulusan` |
| E7 | `/account-blocked` | 200; mengandungi `Akaun Disekat` |
| E8 | `/security` | redirect ke `/login` (laluan dilindungi) |
| E9 | mana-mana halaman | **TIADA** teks `authenticator`, `Pengesahan 2-Langkah`, `kod 6 digit`, `TOTP`, `MFA` |

E9 ialah pengesahan bahawa MFA benar-benar dibuang dari production.

---

### BLOK 4 — LARANGAN

1. JANGAN ubah skema/RLS/RPC/trigger/seed/storage **selain** menjalankan
   `lib/supabase/user-management.sql` seperti adanya.
2. JANGAN tulis semula, "kemas kini", ringkaskan atau bahagikan semula fail
   SQL itu. Jika anda percaya ada bug, laporkan sebagai blocker — jangan
   betulkan sendiri.
3. JANGAN guna `service_role` key dalam apa jua ujian. SQL Editor (postgres)
   adalah OK.
4. JANGAN panggil RPC tulis perniagaan (`sync_import_transaction`,
   `lock_programme`, `request_programme_unlock`, `submit_change_request`,
   `review_change_request`) — ujian tulis melalui UI pengguna.
5. JANGAN panggil `admin_approve_user`, `admin_set_user_blocked`,
   `admin_change_user_role`, `admin_reset_user_password`,
   `admin_reset_all_passwords_to_default` — tindakan ini milik Super Admin
   melalui UI dan akan diuji dalam `ACTION-6`.
6. JANGAN reset atau ubah kata laluan mana-mana akaun di luar fail SQL Fasa 6.
7. JANGAN merge ke `main`. JANGAN tukar Production Branch kepada apa-apa
   selain `arena/01a06274-masb-pms-v4`.
8. JANGAN padam akaun, profil, atau data perniagaan.
9. JANGAN tampal anon/service key penuh, hash kata laluan, atau rahsia dalam
   laporan.
10. JANGAN mereka-reka bukti. Setiap ✅ mesti ada output verbatim. Jika tidak
    dapat uji, tulis `⏳ MENUNGGU PENGGUNA`.
11. JANGAN layan preview local (Mod Demo) sebagai production.
12. JANGAN rujuk hash komit lama (lihat nota di Blok 3).

---

### BLOK 5 — FORMAT LAPORAN (6 seksyen, wajib lengkap)

**Seksyen 1 — Konteks & Status**
Branch + fail yang dimuat turun (dengan pengesahan anda membaca kandungan
sebenar, bukan cache). Ringkasan objek dalam `user-management.sql` (enum,
jadual, kolum, fungsi + SECURITY DEFINER ya/tidak, polisi RLS, trigger,
GRANT/REVOKE, dan kesan Bahagian 8 terhadap data live). Jadual A1–A9 dengan
✅/❌ + bukti baris.

**Seksyen 2 — Tindakan yang diambil**
Blok SQL read-only Langkah B yang anda sediakan, dan (selepas saya tampal
output) penilaian anda: pemasangan **bersih** atau **ulang-pasang**.
Kemudian status pelaksanaan Langkah C, D, E.

**Seksyen 3 — Keputusan pengesahan (jadual)**
C1–C14 dan E1–E9: `Semakan | Status ✅/❌/⏳ | Bukti verbatim`.
Biarkan kosong/`⏳` sehingga saya menghantar output sebenar.

**Seksyen 4 — Isu / Blocker**
🔴 / 🟠 / 🟢 + penerangan + bukti + cadangan tindakan. Asingkan isu
daripada fail SQL rasmi (jangan betulkan sendiri) daripada isu konfigurasi.

**Seksyen 5 — Pengesahan pematuhan**
Senarai semak: persona diamalkan · peta kod dibaca · semua 12 larangan
dipatuhi (nyatakan satu per satu) · tiada kata laluan/hash/kongsi rahsia dalam
laporan · tiada RPC tulis perniagaan dipanggil · Production Branch betul.

**Seksyen 6 — Kesimpulan & Langkah Seterusnya**
Keputusan: **LULUS / SEBAHAGIAN / GAGAL**. Nyatakan sama ada sistem bersedia
untuk `docs/ACTION-6-UAT-AUTH-USERS.md`, dan senaraikan maklumat yang perlu
saya sampaikan kepada pengguna (cth. semua kata laluan kini `masb.12345`,
wajib tukar pada log masuk pertama, Super Admin perlu log masuk dan meluluskan
permohonan).

## --- TAMAT PROMPT ---
