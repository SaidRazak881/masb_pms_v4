# Panduan Pemasangan Supabase — TPMS MIMOS Academy

Dokumen ini menerangkan **urutan tepat** untuk memasang pangkalan data TPMS
di Supabase. Ikut langkah di bawah dari atas ke bawah — urutan penting
kerana jadual dan fungsi dirujuk silang.

---

## 1. Cipta projek Supabase

1. Log masuk ke https://supabase.com/dashboard
2. Klik **New project**
   - Nama: `mimos-academy-tpms`
   - Database password: simpan dengan selamat
   - Region: **Singapore (ap-southeast-1)** — paling hampir dengan Malaysia
3. Selepas siap, buka **Project Settings → API**
   - Salin **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Salin **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Letakkan nilai tersebut dalam fail `.env.local` di root repositori:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> ⚠️ JANGAN masukkan `service_role` key dalam kod frontend. Ia hanya untuk
> pentadbiran dan mesti dirahsiakan.

---

## 2. Jalankan fail SQL mengikut urutan

Buka **SQL Editor** di Supabase Dashboard, tampal dan jalankan fail-fail
berikut **SATU PER SATU mengikut urutan**:

| Urutan | Fail | Fungsi |
| ------ | ---- | ------ |
| 1 | `lib/supabase/schema-master.sql` | Skema induk: enum, jadual (profiles, organizers, programmes, participants, financial_docs, costs, documents, audit_logs), fungsi bantu, trigger audit, RLS |
| 2 | `lib/supabase/schema-import-staging.sql` | Jadual staging import (`import_batches`, `import_staging`) + RLS |
| 3 | `lib/supabase/sync-import-transaction.sql` | RPC transaksi atomik `sync_import_transaction()` |
| 4 | `lib/supabase/governance-lock.sql` | Modul Governance: lock/unlock, `programme_unlock_requests`, RPC `request_programme_unlock`, `review_programme_unlock`, `lock_programme` |
| 5 | `lib/supabase/change-requests.sql` | Modul Change Requests: jadual `change_requests`, RPC `submit_change_request`, `review_change_request`, `cancel_change_request` |
| 6 | `lib/supabase/fix-rls-recursion.sql` | **WAJIB** — betulkan RLS infinite recursion pada `user_profiles` (ganti subquery dengan `has_role()` SECURITY DEFINER) |
| 7 | `lib/supabase/fix-add-programme-categories.sql` | Tambah kategori `Room Rental`, `Consultancy`, `Certification` ke enum |
| 8 | `lib/supabase/user-management.sql` | **Fasa 6** — enum `super_admin` + `account_status`, kolum `must_change_password`, RPC `admin_*`, trigger `on_auth_user_created`, column-level GRANT, reset semua kata laluan ke `masb.12345` |
| 9 | `lib/supabase/seed-v4-raw.sql` | (PILIHAN) Data awal dari V4 RAW |
| 10 | `lib/supabase/migrations/v4-raw-data-inserts.sql` | (PILIHAN) INSERT data V4 RAW yang diproses |

> Jika anda mahu data contoh yang telah diproses daripada fail Excel V4 RAW,
> jalankan 9 dan 10. Jika mahu bermula kosong, langkau kedua-duanya.
>
> **Nota Fasa 6:** fail 8 (`user-management.sql`) mengandungi `COMMIT;` di
> tengah skrip. Ini **wajib** kerana PostgreSQL tidak membenarkan nilai enum
> yang baru ditambah (`super_admin`) digunakan dalam transaksi yang sama.
> Jangan buang `COMMIT;` tersebut, dan jangan pecahkan fail itu kepada
> bahagian yang dijalankan berasingan tanpa urutan yang betul.
>
> **Ujian tempatan sebelum pasang ke Supabase:**
> ```bash
> node scripts/test-user-management-sql.mjs
> ```
> Skrip ini memasang SEMUA 8 fail ke pangkalan data PostgreSQL sebenar
> (PGlite WASM) yang kosong, kemudian menjalankan 12 kumpulan ujian fungsi
> (kelulusan, sekatan, tukar role, reset kata laluan, guard anti-eskalasi,
> audit, idempotensi).

### Semakan selepas pasang

Jalankan dalam SQL Editor untuk mengesahkan:

```sql
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Jadual yang dijangka wujud:
`audit_logs`, `change_requests`, `cost_items`, `financial_docs`,
`import_batches`, `import_staging`, `organizers`, `participants`,
`programme_costs`, `programme_documents`, `programme_unlock_requests`,
`programmes`, `user_profiles`.

---

## 3. Cipta pengguna & profil

Sistem menggunakan **Supabase Auth** (e-mel + kata laluan). Pengguna perlu
dicipta dahulu, kemudian profil dengan peranan.

### 3.1 Cipta pengguna (Auth)

**Dashboard → Authentication → Users → Add user**. Cipta mengikut senarai
`V4 RAW/User Profiles Mapping.xlsx`:

| Nama | E-mel | Peranan cadangan |
| ---- | ----- | ---------------- |
| Zalina Sayuti | zalina@mimos.my | admin |
| Siti Sarah | sitisarah.ramli@mimos.my | executive |
| Abu Sa'id | abu.razak@mimos.my | staff |
| Qusyairi | qusyairi.zolkefle@mimos.my | staff |
| Fuziah | fuziah.rahim@mimos.my | staff |
| Adilah | adilah.nisman@mimos.my | finance |
| Aisyah | aisyah.alias@mimos.my | staff |
| Dr. Ahmad Nizar | nizar.harun@mimos.my | head_governance |

### 3.2 Cipta profil & peranan

Jalankan SQL berikut (gantikan UUID dengan ID pengguna sebenar daripada
Auth):

```sql
insert into public.user_profiles (id, full_name, email, role, is_active)
values
  ('<UUID-ZALINA>', 'Zalina Sayuti', 'zalina@mimos.my', 'admin', true),
  ('<UUID-NIZAR>', 'Dr. Ahmad Nizar', 'nizar.harun@mimos.my', 'head_governance', true),
  ('<UUID-ADILAH>', 'Adilah Nisman', 'adilah.nisman@mimos.my', 'finance', true),
  ('<UUID-SITI>', 'Siti Sarah', 'sitisarah.ramli@mimos.my', 'executive', true);
```

### Peranan yang disokong (`app_role`)

| Peranan | Kuasa |
| ------- | ----- |
| `viewer` | Baca sahaja, eksport laporan yang dibenarkan |
| `staff` | Cipta & edit program yang tidak dikunci |
| `finance` | Edit quotation, PO, DO, invoice, kos, payment status |
| `executive` | Lihat keseluruhan, laporan |
| `manager` | Lulus permohonan buka kunci |
| `admin` | Import, cipta program, urus template laporan |
| `head_governance` | **Lock/unlock program**, lulus change request |
| `super_admin` | **Master Admin** — semua kuasa di atas + urus akaun pengguna (lulus, sekat, reset kata laluan, tukar role). Diberi melalui SQL sahaja, bukan UI |

> `public.has_role()` **sedar-super_admin**: ia memulangkan `true` untuk
> sebarang role yang diminta jika pengguna semasa ialah `super_admin`.
> Jadi Super Admin mewarisi semua kuasa `admin`, `head_governance`,
> `manager` dan `finance` tanpa perlu menyunting polisi RLS satu per satu.

---

## 4. Storage (fail dokumen) — pilihan

Untuk muat naik dokumen (quotation, PO, DO, invoice, sijil):

1. **Dashboard → Storage → New bucket**
   - Nama: `programme-documents`
   - Public: **No** (private)
2. RLS untuk bucket (SQL Editor):

```sql
create policy "Authenticated boleh muat naik dokumen program"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'programme-documents');

create policy "Authenticated boleh baca dokumen program"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'programme-documents');
```

URL fail boleh disimpan dalam medan `document_url` (financial_docs),
`file_path` (programme_documents) atau `supporting_document_url`
(change_requests).

---

## 5. Ujian RLS & lock governance

### 5.1 Ujian deny — lock berfungsi

```sql
-- Log masuk sebagai staff (bukan head_governance), cuba update program terkunci:
update public.programmes
set title = 'HACK'
where programme_code = 'MIMOS-TRN-2026-0001'
  and is_locked = true;
-- JANGAN pulangkan baris (0 rows) kerana RLS menolak.
```

### 5.2 Ujian allow — change request

```sql
select public.submit_change_request(
  '<PROGRAMME_UUID>',     -- program yang DIKUNCI
  'title',                -- medan dibenarkan
  'Tajuk Lama',
  'Tajuk Baharu',
  'Sebab perubahan yang lengkap sekurang-kurangnya 10 aksara'
);
-- Sebagai head_governance:
select public.review_change_request('<REQUEST_UUID>', true, 'Diluluskan');
```

### 5.3 Ujian audit trail

```sql
select * from public.audit_logs
where table_name = 'change_requests'
order by created_at desc limit 5;
```

---

## 6. Penyelesaian masalah biasa

| Masalah | Punca | Penyelesaian |
| ------- | ----- | ------------ |
| `relation "public.programmes" does not exist` | Skema belum dijalankan | Jalankan `schema-master.sql` dahulu |
| `function public.sync_import_transaction() does not exist` | RPC belum dipasang | Jalankan `sync-import-transaction.sql` |
| `type public.change_request_status does not exist` | Fail 5 belum dijalankan | Jalankan `change-requests.sql` |
| RLS menolak INSERT pada `import_staging` | Polisi belum wujud | Jalankan `schema-import-staging.sql` |
| `42601: permission denied` | Guna anon key untuk operasi pentadbiran | Guna **SQL Editor** (service role) atau log masuk sebagai pengguna berkenaan |
| Halaman papar "Mod demo" walaupun env diisi | Env tidak dibaca | Sahkan `.env.local` dan **restart** `npm run dev` |
| `function public.has_role(app_role) does not exist` semasa pasang `schema-master.sql` | Fail lama (pra-Fasa 6) — fungsi pembantu ditakrif selepas ia dirujuk polisi RLS | Guna `schema-master.sql` semasa; blok FUNGSI PEMBANTU sudah dipindah ke hadapan |
| `unsafe use of new value of enum type "app_role"` | `COMMIT;` tengah fail `user-management.sql` dibuang | Kekalkan `COMMIT;` selepas Bahagian 1 (lihat nota di atas) |
| `function public.can_manage_users() does not exist` | `user-management.sql` belum dipasang | Jalankan fail 8 |
| Pendaftaran baharu tiada baris dalam `user_profiles` | Trigger `on_auth_user_created` tiada | Jalankan fail 8; semak `select tgname from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal` |
| Semua pengguna terkunci di `/security` selepas pasang Fasa 6 | `must_change_password = true` untuk semua (niat: kata laluan lalai) | Ini **dijangka** — setiap pengguna log masuk dengan `masb.12345` kemudian tukar kata laluan |

---

## 7. Pengesahan & kata laluan (Fasa 6)

Sistem menggunakan **e-mel + kata laluan sahaja** — MFA/TOTP telah dibuang.

| Perkara | Tetapan |
| ------- | ------- |
| Kata laluan lalai | `masb.12345` (disimpan dalam `public.app_settings.default_password`) |
| Akaun Master Admin | `saidrazak881@gmail.com` → role `super_admin` |
| Wajib tukar kata laluan | `user_profiles.must_change_password = true` → UI alihkan ke `/security?required=1` |
| Pendaftaran sendiri | `/register` → profil auto-cipta dengan `account_status = 'pending'` |
| Lupa kata laluan | `/forgot-password` → `resetPasswordForEmail()` → `/security?reset=1` |

**Tetapan wajib di Supabase Dashboard → Authentication:**

1. **Providers → Email**: aktifkan. `Confirm email` boleh **dimatikan** supaya
   pengguna baharu boleh log masuk terus selepas diluluskan (trigger tetap
   mencipta profil `pending`). Jika anda biarkan ia hidup, pengguna perlu klik
   pautan pengesahan e-mel dahulu — kedua-dua cara disokong.
2. **URL Configuration**:
   - `Site URL` = `https://masb-pms-v4.vercel.app`
   - `Redirect URLs` = tambah `https://masb-pms-v4.vercel.app/security**`
     (diperlukan oleh aliran set semula kata laluan)
3. **Attack Protection**: biarkan kadar-had lalai Supabase aktif.

> Oleh kerana MFA dibuang, kawalan pampasan ialah: kata laluan lalai **wajib**
> ditukar, polisi kata laluan dikuatkuasakan di pangkalan data
> (`assert_password_acceptable`), dan Super Admin boleh menyekat akaun serta
> menamatkan semua sesinya serta-merta.

---

## 8. Nota keselamatan

- **Jangan** gunakan `service_role` dalam aplikasi frontend.
- RLS diaktifkan pada semua jadual utama — polisi `UPDATE` pada
  `programmes` hanya membenarkan edit jika `is_locked = false` ATAU
  `unlock_expires_at > now()` ATAU pengguna adalah head_governance/admin.
- Semua tulis pada `change_requests` melalui RPC `SECURITY DEFINER` —
  tiada polisi INSERT/UPDATE terus, jadi lock tidak boleh dipintas melalui
  API.
- Audit log dijana automatik oleh trigger untuk create/update/delete pada
  jadual utama.
- **Pengurusan pengguna (Fasa 6):** `authenticated` TIDAK mempunyai privilege
  `UPDATE` pada kolum sensitif `user_profiles` (`role`, `account_status`,
  `must_change_password`, `approved_*`, `blocked_*`). Hanya kolum profil
  selamat (`full_name`, `phone`, `designation`, `department`, `avatar_url`,
  `updated_at`) boleh ditulis sendiri. Semua tindakan pengurusan melalui RPC
  `admin_*` (SECURITY DEFINER) yang menyemak `can_manage_users()` dan menulis
  audit log. Semak dengan:
  ```sql
  select column_name from information_schema.column_privileges
   where table_schema='public' and table_name='user_profiles'
     and grantee='authenticated' and privilege_type='UPDATE'
   order by 1;
  ```
  Jawapan yang betul: `avatar_url, department, designation, full_name, phone,
  updated_at` — **tiada** `role` atau `account_status`.

### 8.1 Audit keselamatan kendiri Fasa 6 (dilaksanakan di Arena)

Perkara yang telah **disemak dalam kod** dan keputusannya:

| # | Perkara disemak | Keputusan |
|---|-----------------|-----------|
| 1 | Setiap RPC `admin_*` (8 fungsi) memanggil `assert_can_manage_users()` | ✅ 8/8 — kuasa disemak di DB, bukan di UI |
| 2 | Column-level GRANT menghalang pengguna menaikkan `role` / `account_status` sendiri | ✅ `REVOKE UPDATE` penuh, kemudian `GRANT UPDATE` hanya 6 kolum selamat |
| 3 | `app_settings` (tempat `default_password`) tidak boleh ditulis klien | ✅ `REVOKE INSERT, UPDATE, DELETE` dari `authenticated` & `anon` |
| 4 | Open redirect melalui `?redirect=` / `?next=` | ✅ Kedua-duanya ditolak jika tidak bermula `/` atau bermula `//` |
| 5 | Tukar kata laluan tanpa bukti identiti | ✅ `/security` log masuk semula dengan kata laluan semasa sebelum `updateUser` (kecuali aliran token e-mel `?reset=1`) |
| 6 | Server Actions boleh dipanggil melangkau UI | ✅ Setiap action memanggil `can_manage_users()`; DB tetap menolak bukan Super Admin |
| 7 | Pendaftaran sendiri memilih role sendiri | ✅ Tidak mungkin — trigger `on_auth_user_created` paksa `viewer` + `pending`; sesi dibuang serta-merta selepas daftar |
| 8 | Pengesahan di middleware Edge sahaja | ✅ Tidak — diulang sisi pelayan di `app/(dashboard)/layout.tsx` + lapis klien `AccountGuard` |
| 9 | `super_admin` boleh diberi melalui UI | ✅ Ditolak — tidak tersenarai dalam `ASSIGNABLE_ROLES`; DB juga `RAISE 'ROLE_NOT_ALLOWED'` |

**Risiko baki yang diterima secara sedar (fail-open di lapis aplikasi):**

- Jika RPC `my_account_status` / `my_password_change_required` **belum
  dipasang** atau mengembalikan `null`, aplikasi menganggap akaun `active`
  dan tidak memaksa tukar kata laluan. Ini sengaja supaya sistem tidak
  terkunci semasa pemasangan separa. Penguat kuasa sebenar tetap di DB:
  pengguna `pending`/`blocked` ditolak oleh `can_manage_users()`, RLS dan
  RPC perniagaan. **Tindakan wajib:** pasang `user-management.sql` sepenuhnya
  dan sahkan C1–C14 dalam `docs/PROMPT-6-INSTALL-USER-MANAGEMENT.md`.
- Mod demo (tiada env Supabase) memintas semua pengesahan dan mengembalikan
  "berjaya" untuk tindakan pengurusan. **Jangan** deploy Production tanpa
  `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Selepas Bahagian 8c, semua 19 pengguna berkongsi `masb.12345` sehingga
  masing-masing menukarnya. Edarkan arahan tukar kata laluan serta-merta.
