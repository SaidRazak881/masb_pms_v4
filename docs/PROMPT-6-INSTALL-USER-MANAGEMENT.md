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

Rujukan (baca jika perlu, JANGAN jalankan semula — sudah dipasang pada fasa
lepas):

2. `lib/supabase/schema-master.sql`
3. `lib/supabase/fix-rls-recursion.sql`
4. `lib/supabase/governance-lock.sql`
5. `lib/supabase/change-requests.sql`

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
| A7 | Setiap RPC `admin_*` memanggil `assert_can_manage_users()` dan menulis `log_audit(...)` |
| A8 | `has_role()` dalam `schema-master.sql` / `fix-rls-recursion.sql` memulangkan `true` untuk sebarang role jika pengguna ialah `super_admin` |

Jika mana-mana kenyataan A1–A8 **TIDAK** benar, BERHENTI dan laporkan sebagai
blocker 🔴 — jangan teruskan ke Langkah B.

---

#### LANGKAH B — Semak keadaan live (READ-ONLY)

Sediakan SATU blok SQL read-only untuk saya jalankan dahulu. Ia mesti
melaporkan:

1. Senarai `user_profiles`: bilangan baris, pecahan mengikut `role`.
2. Sama ada kolum `account_status` / `must_change_password` **sudah** wujud
   (untuk mengesan sama ada Fasa 6 pernah dipasang separa).
3. Sama ada nilai enum `super_admin` sudah wujud dalam `app_role`.
4. Sama ada akaun `saidrazak881@gmail.com` wujud dalam `auth.users` **dan**
   `user_profiles`, dan apakah role semasanya.
5. Bilangan baris dalam `auth.users` dan berapa yang ada
   `email_confirmed_at IS NOT NULL`.
6. Senarai trigger pada `auth.users`
   (`select tgname from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal`).
7. Sama ada fungsi `public.can_manage_users`, `public.admin_list_users`,
   `public.my_account_status`, `public.mark_password_changed` sudah wujud.
8. Column privileges semasa `authenticated` pada `user_profiles`
   (INSERT/UPDATE/DELETE).
9. Nilai semasa `public.app_settings` **jika** jadual itu wujud.

**Jangan** sertakan sebarang kata laluan, hash, atau anon/service key dalam
blok ini.

Saya akan tampal outputnya. Berdasarkan output itu, nyatakan sama ada
pemasangan adalah **bersih** (Fasa 6 belum pernah dipasang) atau
**ulang-pasang** (sebahagian objek sudah wujud) — dan sahkan bahawa fail itu
selamat dijalankan dalam kedua-dua kes.

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
| C9 | RPC Fasa 6 wujud | 10 fungsi `admin_*` + `can_manage_users`, `is_super_admin`, `my_account_status`, `my_password_change_required`, `mark_password_changed`, `default_password`, `assert_password_acceptable`, `assert_can_manage_users`, `handle_new_auth_user`, `sync_auth_user_update` |
| C10 | Column grant | `authenticated` hanya ada UPDATE pada `avatar_url, department, designation, full_name, phone, updated_at` |
| C11 | `authenticated` tiada INSERT/DELETE pada `user_profiles` | 0 baris |
| C12 | `app_settings` | `default_password = masb.12345`, `super_admin_email = saidrazak881@gmail.com` |
| C13 | `has_role` sedar-super_admin | `prosrc` mengandungi `super_admin` |
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
GRANT/REVOKE, dan kesan Bahagian 8 terhadap data live). Jadual A1–A8 dengan
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
