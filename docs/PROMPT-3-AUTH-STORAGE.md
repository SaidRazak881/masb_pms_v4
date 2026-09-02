# PROMPT 3 — Auth Users + User Profiles + Storage Bucket

> **Status:** Sedia digunakan SELEPAS laporan fasa 2E disemak dan diluluskan
> (seed berjaya: 12 organizers, 4 programmes, 6 financial_docs, 2
> programme_costs, 4 participants, 4 cost_items; audit rasmi berfungsi).
> Sasaran: projek Supabase **`lmenmfsbjgxfhnykkgow`**.
>
> **Sumber pengguna sebenar:** `V4 RAW/User Profiles Mapping.xlsx` (19
> pengguna, kata laluan lalai `masb.12345`). Role sistem (`app_role`):
> `viewer`, `executive`, `manager`, `admin`, `staff`, `finance`,
> `head_governance`.

---

## 📋 CARA GUNA

1. Salin keseluruhan kotak prompt di bawah (dari `--- MULA PROMPT ---`
   hingga `--- TAMAT PROMPT ---`).
2. **PENTING:** Semak jadual "Pemetaan Role" dalam prompt — jika anda mahu
   ubah role mana-mana pengguna, ubah jadual itu DAHULU sebelum tampal ke
   ChatGPT.
3. Tampal ke ChatGPT (aktifkan **web browsing / code interpreter**).
4. ChatGPT melaksanakan fasa 3 dan melaporkan ikut FORMAT LAPORAN.
5. Selepas siap, tampal laporan itu semula kepada saya (pengguna) untuk
   semakan sebelum deploy Vercel.

---

## --- MULA PROMPT ---

> **Peranan kamu:** Jurutera platform yang teliti dan berhati-hati
> (Supabase Auth + PostgreSQL + Storage).
>
> **Tugas:** Fasa 3 pemasangan TPMS MIMOS Academy pada projek Supabase
> `lmenmfsbjgxfhnykkgow`: cipta **Auth users**, **user_profiles** (dengan
> role) dan **storage bucket**. Deployment Vercel adalah fasa BERASINGAN —
> jangan sentuh.
>
> **Konteks:** Pangkalan data sudah siap (14 jadual rasmi, 17 enum, RLS
> aktif, RPC penuh, seed dimuatkan: 12 organizers, 4 programmes, 6
> financial_docs, 2 programme_costs, 4 participants, 4 cost_items, 14
> audit_logs).
>
> **Sumber (MESTI muat turun dari GitHub, branch
> `arena/01a06274-masb-pms-v4`):**
>
> 1. `V4 RAW/User Profiles Mapping.xlsx` — senarai pengguna rasmi (19
>    pengguna, kolum: Bil, staff_name, role, email, Defauls Password)
> 2. `lib/supabase/schema-master.sql` — struktur `public.user_profiles`
>    dan RLS (untuk rujukan sahaja)
>
> **PEMETAAN ROLE (DILULUSKAN — jadual ini muktamad):**
>
> | E-mel | Nama | Role Sistem |
> | ----- | ---- | ----------- |
> | saidrazak881@gmail.com | Admin | `admin` |
> | zalina@mimos.my | Zalina Sayuti | `admin` |
> | nizar.harun@mimos.my | Dr. Ahmad Nizar | `head_governance` |
> | sitisarah.ramli@mimos.my | Siti Sarah | `executive` |
> | adilah.nisman@mimos.my | Adilah | `finance` |
> | farrah.johar@mimos.my | Farrah | `finance` |
> | abu.razak@mimos.my | Abu Sa'id | `staff` |
> | qusyairi.zolkefle@mimos.my | Qusyairi | `staff` |
> | fuziah.rahim@mimos.my | Fuziah | `staff` |
> | aisyah.alias@mimos.my | Aisyah | `staff` |
> | sholihin.abdullah@mimos.my | Sholihin | `staff` |
> | muhammadafiq.azmi@mimos.my | Dr. Afiq | `staff` |
> | ainur.rodzi@mimos.my | Ainur Najwa | `staff` |
> | suhairi.soobni@mimos.my | Mohd Suhairi | `staff` |
> | omar.azmi@mimos.my | Omar | `staff` |
> | fatin.pata@mimos.my | Fatin Firzana | `staff` |
> | amalia.rizam@mimos.my | Amalia Adriana | `staff` |
> | aleeya.amran@mimos.my | Nur Aleeya | `staff` |
> | yusuf.zolkipli@mimos.my | Muhammad Yusuf | `staff` |
>
> **Langkah 1 — Muat turun & sahkan:**
>
> Muat turun `User Profiles Mapping.xlsx` dan semak senarai 19 pengguna di
> atas padan dengan fail (nama, e-mel). Jika ada beza, gunakan fail sebagai
> sumber utama untuk nama/e-mel, dan laporkan perbezaan. Kata laluan lalai:
> `masb.12345` untuk semua (daripada fail).
>
> **Langkah 2 — Semak struktur auth (read-only):**
>
> ```sql
> select column_name, data_type, is_nullable, column_default
> from information_schema.columns
> where table_schema = 'auth' and table_name = 'users'
> order by ordinal_position;
>
> select column_name, data_type, is_nullable, column_default
> from information_schema.columns
> where table_schema = 'auth' and table_name = 'identities'
> order by ordinal_position;
> ```
>
> **Langkah 3 — Blok A: Cipta Auth users (DILULUSKAN):**
>
> Sediakan SATU skrip yang, untuk setiap 19 pengguna:
> - Insert ke `auth.users` dengan:
>   - `instance_id = '00000000-0000-0000-0000-000000000000'`
>   - `aud = 'authenticated'`, `role = 'authenticated'`
>   - `email` (lowercase), `encrypted_password = crypt('<password>',
>     gen_salt('bf'))` — guna `extensions.crypt`/`extensions.gen_salt`
>     jika perlu; pastikan pgcrypto aktif:
>     `create extension if not exists pgcrypto with schema extensions;`
>   - `email_confirmed_at = now()` (supaya boleh log masuk terus tanpa
>     verifikasi e-mel)
>   - `raw_app_meta_data = jsonb_build_object('provider','email',
>     'providers', array['email'])`
>   - `raw_user_meta_data = jsonb_build_object('full_name', '<nama>')`
>   - Guard: `on conflict (email) do nothing`
> - Insert ke `auth.identities` (untuk log masuk e-mel/kata laluan) dengan
>   `provider = 'email'`, `provider_id = email`,
>   `identity_data = jsonb_build_object('sub', user_id::text, 'email',
>   email, 'email_verified', true)`, guard `on conflict (provider_id,
>   provider) do nothing`.
> - Gunakan hanya kolum yang wujud (daripada Langkah 2); jangan andaikan.
>
> Jalankan skrip di SQL Editor. JANGAN gunakan `service_role` key di
> tempat lain.
>
> **Langkah 4 — Blok B: Cipta user_profiles (DILULUSKAN):**
>
> ```sql
> insert into public.user_profiles (id, full_name, email, role, is_active)
> select u.id, <nama>, u.email, '<role>'::public.app_role, true
> from auth.users u where u.email = '<email>'
> on conflict (id) do update
>   set role = excluded.role,
>       full_name = excluded.full_name,
>       is_active = true,
>       updated_at = now();
> ```
>
> Ulang untuk kesemua 19 pengguna mengikut PEMETAAN ROLE di atas. Guard
> `on conflict (id) do update` membolehkan skrip dijalankan semula dengan
> selamat (dan memudahkan ubah role kemudian).
>
> **Langkah 5 — Blok C: Storage bucket (DILULUSKAN):**
>
> ```sql
> insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
> values ('programme-documents', 'programme-documents', false, null, null)
> on conflict (id) do nothing;
>
> drop policy if exists "programme_documents_read" on storage.objects;
> create policy "programme_documents_read" on storage.objects
>   for select to authenticated
>   using (bucket_id = 'programme-documents');
>
> drop policy if exists "programme_documents_insert" on storage.objects;
> create policy "programme_documents_insert" on storage.objects
>   for insert to authenticated
>   with check (bucket_id = 'programme-documents');
>
> drop policy if exists "programme_documents_update" on storage.objects;
> create policy "programme_documents_update" on storage.objects
>   for update to authenticated
>   using (bucket_id = 'programme-documents')
>   with check (bucket_id = 'programme-documents');
>
> drop policy if exists "programme_documents_delete" on storage.objects;
> create policy "programme_documents_delete" on storage.objects
>   for delete to authenticated
>   using (bucket_id = 'programme-documents');
> ```
>
> **Langkah 6 — Pengesahan (read-only):**
>
> ```sql
> select count(*) as auth_users from auth.users;
> select count(*) as profiles from public.user_profiles;
> select count(*) as identities from auth.identities;
>
> -- Padanan: profil tanpa user auth / user auth tanpa profil
> select u.email as auth_email, p.email as profile_email
> from auth.users u full outer join public.user_profiles p on p.id = u.id
> where u.email is null or p.email is null;
>
> -- Ringkasan role
> select role, count(*) from public.user_profiles group by role order by role;
>
> -- Bucket
> select id, name, public from storage.buckets where id = 'programme-documents';
>
> -- Polisi storage
> select policyname, cmd from pg_policies
> where schemaname = 'storage' and tablename = 'objects'
> order by policyname;
> ```
>
> Jangkaan: auth_users = 19, profiles = 19, identities = 19, tiada
> padanan tergantung, role = 2 admin + 1 head_governance + 1 executive +
> 2 finance + 13 staff, bucket wujud (public = false), 4 polisi storage.
>
> **Larangan keras:**
> - JANGAN sentuh jadual `public.*` lain (data seed dll.) — hanya
>   `auth.users`, `auth.identities`, `public.user_profiles`,
>   `storage.buckets`, `storage.objects` (polisi).
> - JANGAN reset password pengguna sedia ada. Jika e-mel sudah wujud dalam
>   `auth.users` sebelum skrip (contoh: pengguna pernah dicipta manual),
>   LAPORKAN — jangan ubah, jangan padam. (Skrip `on conflict do nothing`
>   akan biarkan ia; pastikan profil tetap dicipta dengan ID auth sedia
>   ada.)
> - JANGAN deploy Vercel, JANGAN buang kolum/jadual/tipe/fungsi `private.*`.
> - JANGAN panggil RPC perniagaan (`lock_programme`, `sync_import_transaction`,
>   `submit_change_request`).
>
> **Amaran keselamatan (untuk laporan sahaja):** semua pengguna berkongsi
> kata laluan lalai `masb.12345`. Selepas sistem beroperasi, setiap
> pengguna WAJIB menukar kata laluan. Sertakan ini dalam bahagian cadangan
> laporan.
>
> **FORMAT LAPORAN (WAJIB PENUH):**
>
> ```text
> 📋 LAPORAN FASA 3 — AUTH USERS + PROFILES + STORAGE
> ===================================================
> 0. RINGKASAN EKSEKUTIF
>    - Status: ✅ BERJAYA / ⚠️ SEBAHAGIAN / ❌ GAGAL
>    - Auth users dicipta: (N) | Profil dicipta: (N) | Identities: (N)
>    - Storage bucket: ✅ / ❌
>
> 1. PENGESAHAN SENARAI PENGGUNA
>    - Bilangan pengguna dalam fail Excel: (N)
>    - Perbezaan dengan jadual pemetaan: (senarai / tiada)
>
> 2. AUTH USERS
>    - Skrip: (blok penuh yang dijalankan)
>    - Pengguna dicipta baharu: (senarai e-mel)
>    - Pengguna sedia ada (tidak disentuh): (senarai e-mel, jika ada)
>    - QUERY PENGESAHAN + OUTPUT: (count + sebarang anomali)
>
> 3. USER PROFILES
>    - Skrip: (blok penuh)
>    - Ringkasan role: (role | count)
>    - QUERY PENGESAHAN + OUTPUT: (padanan auth ↔ profil)
>
> 4. STORAGE
>    - Bucket: (id, name, public)
>    - Polisi: (senarai 4 + status)
>
> 5. ISU / AMARAN: (sebarang ralat, anomali, atau pengguna sedia ada)
>
> 6. CADANGAN KESELAMATAN: (termasuk tukar kata laluan lalai)
>
> 7. LANGKAH SETERUSNYA (cadangan, JANGAN laksana sendiri):
>    deploy Vercel → ujian end-to-end (login, dashboard, import,
>    governance, laporan)
> ```
>
> **Penting:** Laporan mesti lengkap dengan skrip, query pengesahan dan
> OUTPUT SEBENAR — supaya saya boleh semak tanpa bergantung pada anda.

---

## --- TAMAT PROMPT ---

---

## Nota untuk pengguna (bukan sebahagian prompt)

- **Sebelum tampal:** semak jadual PEMETAAN ROLE — ubah jika perlu
  (contoh: siapa patut jadi `head_governance`, `finance`, `admin`).
- Selepas laporan 3 diterima, semak: (1) 19/19 pengguna + profil + identity,
  (2) tiada pengguna sedia ada di-reset, (3) role betul, (4) bucket private
  + 4 polisi.
- Selepas laporan 3 diluluskan, langkah seterusnya ialah **Prompt #4**
  (`docs/PROMPT-4-DEPLOY-E2E.md`): deploy Vercel (Production Branch =
  `arena/01a06274-masb-pms-v4`; env: `NEXT_PUBLIC_SUPABASE_URL` +
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`) + ujian API & senarai semak manual.
  **Nota:** login page kini guna Supabase Auth sebenar (komit `56bc392`).
