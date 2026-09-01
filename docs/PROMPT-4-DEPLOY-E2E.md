# PROMPT 4 — Deploy Vercel + Ujian End-to-End (E2E)

> **Status:** Sedia digunakan SELEPAS laporan fasa 3 disemak dan diluluskan
> (19 auth users + 19 user_profiles + bucket storage siap).
>
> **PENTING — pembetulan kod telah dibuat sebelum prompt ini:**
> - Halaman login kini menggunakan **Supabase Auth sebenar**
>   (`signInWithPassword`) apabila env diisi; fallback mod demo tanpa env.
> - Header dashboard memaparkan **user & role sebenar** dari sesi; ada butang
>   **Log Keluar**.
> - Middleware kini melindungi SEMUA halaman dashboard (`/dashboard`,
>   `/programmes`, `/import`, `/participants`, `/reports`).
> - Komit terkini branch: `56bc392`.

---

## 📋 CARA GUNA

1. **Sebelum tampal prompt:** buka Supabase Dashboard → **Project Settings →
   API** → salin **Project URL** dan **anon public key** (bukan service_role!).
2. Salin keseluruhan kotak prompt di bawah (dari `--- MULA PROMPT ---`
   hingga `--- TAMAT PROMPT ---`) dan gantikan `<ANON_KEY_ANDA>` dengan
   anon key yang disalin.
3. Tampal ke ChatGPT (aktifkan **web browsing / code interpreter**).
4. ChatGPT memberi arahan deploy + melaksanakan ujian API yang boleh
   dijalankannya, kemudian menyediakan senarai semak manual untuk anda.
5. Selepas siap, tampal laporan itu semula kepada saya (pengguna) untuk
   semakan akhir.

---

## --- MULA PROMPT ---

> **Peranan kamu:** Jurutera deployment & QA yang teliti.
>
> **Tugas:** Fasa 4 (TERAKHIR) pemasangan TPMS MIMOS Academy: deploy
> aplikasi Next.js ke **Vercel** dan jalankan **ujian end-to-end**.
>
> **Konteks sedia ada:**
> - Repositori GitHub: `SaidRazak881/masb_pms_v4`
> - Branch aktif: **`arena/01a05cd4-masb-pms-v4`** (komit terkini `56bc392`)
> - Supabase: projek `lmenmfsbjgxfhnykkgow`, URL
>   `https://lmenmfsbjgxfhnykkgow.supabase.co`, anon key:
>   `<ANON_KEY_ANDA>`
> - DB siap: 14 jadual, RLS aktif, RPC penuh, seed (12 organizers, 4
>   programmes, 6 financial_docs, 2 programme_costs, 4 participants, 4
>   cost_items), 19 auth users + 19 user_profiles, bucket
>   `programme-documents` (private).
>
> **LANGKAH 1 — Sediakan arahan deploy Vercel (pengguna akan laksanakan):**
>
> Berikan arahan langkah demi langkah yang TEPAT (boleh salin-tampal):
>
> 1. Buka https://vercel.com/new → Import Git Repository → pilih
>    `masb_pms_v4`.
> 2. **PENTING — Production Branch:** Vercel secara lalai menetapkan
>    `main` sebagai production branch, tetapi repositori ini menggunakan
>    branch `arena/01a05cd4-masb-pms-v4`. Arahkan pengguna: di **Project
>    Settings → Git → Production Branch**, tetapkan
>    `arena/01a05cd4-masb-pms-v4` (ATAU pilih branch tersebut semasa
>    import). Jangan minta pengguna merge ke main tanpa kelulusan.
> 3. **Environment Variables** (di Vercel):
>    - `NEXT_PUBLIC_SUPABASE_URL` = `https://lmenmfsbjgxfhnykkgow.supabase.co`
>    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<ANON_KEY_ANDA>`
>    - Skop: Production, Preview, Development.
> 4. Framework Preset: `Next.js` (auto); Build Command: `npm run build`.
> 5. Klik **Deploy**; tunggu **Ready**; catat URL production.
>
> Sertakan nota: setiap push ke branch tersebut akan auto-deploy; PR akan
> mendapat Preview URL.
>
> **LANGKAH 2 — Sahkan kelayakan login untuk ujian E2E:**
>
> 19 auth users telah wujud (tidak di-reset). Tanya pengguna: adakah kata
> laluan akaun-akaun ini diketahui (cth. `masb.12345`)? Berikan SQL berikut
> sebagai PILIHAN (JANGAN jalankan tanpa kelulusan pengguna) untuk reset
> kata laluan SATU akaun pentadbir bagi tujuan ujian:
>
> ```sql
> -- Hanya jika pengguna bersetuju (reset password akaun admin ujian)
> create extension if not exists pgcrypto with schema extensions;
> update auth.users
> set encrypted_password = extensions.crypt('masb.12345', extensions.gen_salt('bf')),
>     email_confirmed_at = now(),
>     updated_at = now()
> where email = 'saidrazak881@gmail.com';
> ```
>
> Jika pengguna memberikan kata laluan sedia ada, guna terus tanpa reset.
>
> **LANGKAH 3 — Ujian API Supabase end-to-end (BOLEH laksanakan sendiri):**
>
> Guna anon key untuk ujian REST berikut (semua melalui
> `https://lmenmfsbjgxfhnykkgow.supabase.co`). Catat RESPONS SEBENAR.
>
> a) **Log masuk (Auth):**
> ```bash
> curl -s -X POST 'https://lmenmfsbjgxfhnykkgow.supabase.co/auth/v1/token?grant_type=password' \
>   -H 'apikey: <ANON_KEY_ANDA>' \
>   -H 'Content-Type: application/json' \
>   -d '{"email":"zalina@mimos.my","password":"<password>"}'
> ```
> Simpan `access_token` (JWT). Jika gagal (invalid login), cuba akaun lain
> atau laporkan — jangan reset tanpa kebenaran.
>
> b) **Baca data (RLS):** dengan `Authorization: Bearer <JWT>`:
> ```bash
> curl -s 'https://lmenmfsbjgxfhnykkgow.supabase.co/rest/v1/programmes?select=programme_code,title,category,status&order=programme_code' \
>   -H 'apikey: <ANON_KEY_ANDA>' -H 'Authorization: Bearer <JWT>'
> ```
> Jangkaan: 4 baris (MA/QT/2026(0001), MASB/QT/TRA/2026/0038,
> MSSB/QT/TRA/2026/0001, MSSB/QT/TRA/2026/0002).
>
> c) **Peserta:** `participants?select=name,email,bumi_status,status` →
> jangkaan 4 baris.
>
> d) **Audit:** `audit_logs?select=action,table_name&order=created_at` →
> jangkaan 14 baris `created`.
>
> e) **Ujian RPC governance (guna akaun head_governance nizar.harun@mimos.my
> untuk review; guna akaun staff untuk submit):**
> - `rpc/request_programme_unlock` (staff, pada program `completed` yang
>   belum dikunci → JANGKAN ralat PROGRAMME_NOT_LOCKED — ini bukti RPC
>   hidup dan peraturan betul; JANGAN panggil lock_programme tanpa
>   kelulusan kerana ia mengubah data).
> - `rpc/change_request_allowed_fields` (baca-sahaja) → jangkaan senarai 14
>   medan.
>
> f) **Storage:** `storage/v1/bucket`? Hanya sahkan kewujudan bucket melalui
> laporan fasa 3; jangan muat naik fail ujian tanpa kebenaran.
>
> **LANGKAH 4 — Senarai semak manual UI (untuk pengguna):**
>
> Sediakan senarai semak berikut (dengan arahan tepat apa yang perlu
> dilihat/klik) selepas deploy selesai:
>
> 1. Buka URL production → sepatutnya redirect ke `/login` (bukan
>    dashboard) kerana belum log masuk.
> 2. Log masuk sebagai `zalina@mimos.my` → sepatutnya masuk `/dashboard`.
>    Header kanan atas papar "Zalina Sayuti / Pentadbir Sistem" + butang
>    Log Keluar. TIADA banner "Mod demo".
> 3. Dashboard: KPI menunjukkan 4 program; pecahan kategori/penganjur;
>    tiada data mock.
> 4. Program Latihan: 4 program seed; buka satu → tab Overview,
>    Financial (quotation/invoice/PO), Participants (peserta),
>    Costs, Documents, Audit Trail (14 rekod).
> 5. Import: muat naik `public/samples/00. Quotation Tracker (1).xlsx` →
>    staging review → Confirm Sync (sebagai admin) → Sejarah Import
>    menunjukkan batch.
> 6. Peserta: 4 peserta dengan status Bumiputera.
> 7. Laporan: 8 jenis laporan; cuba Eksport Excel.
> 8. Log keluar → kembali ke /login.
> 9. Log masuk sebagai `nizar.harun@mimos.my` (head_governance) → buka
>    program → cuba kunci program (jika UI menyokong) / sahkan panel
>    governance kelihatan.
> 10. Log masuk sebagai staff (cth. `abu.razak@mimos.my`) → buka program
>     yang dikunci → butang "Mohon Ubah Data" (bukan "Sunting").
>
> **LANGKAH 5 — Penyelesaian masalah (jika perlu):**
>
> - Jika halaman masih papar "Mod demo": env var tidak dibaca pada build —
>    semak Vercel env + Redeploy.
> - Jika login gagal: sahkan password; jika perlu reset (dengan kelulusan
>    pengguna) guna SQL di Langkah 2.
> - Jika halaman protected boleh diakses tanpa login: laporkan segera
>    (sepatutnya tidak — middleware kini melindungi semua).
> - Jika import sync gagal: sahkan `sync_import_transaction` wujud dan
>    role pengguna (admin/staff/finance/head_governance).
>
> **Larangan keras:**
> - JANGAN reset password SEMUA pengguna — hanya satu akaun ujian dengan
>   kelulusan.
> - JANGAN buang/ubah jadual, kolum, RLS, atau data seed.
> - JANGAN panggil `lock_programme` / `submit_change_request` /
>   `review_change_request` / `sync_import_transaction` melainkan sebagai
>   ujian yang jelas dinyatakan dan tidak merosakkan data.
> - JANGAN masukkan service_role key atau kata laluan ke dalam kod/GitHub.
>
> **FORMAT LAPORAN (WAJIB PENUH):**
>
> ```text
> 📋 LAPORAN FASA 4 — DEPLOY VERCEL + E2E
> =======================================
> 0. RINGKASAN EKSEKUTIF
>    - Status: ✅ BERJAYA / ⚠️ SEBAHAGIAN / ❌ GAGAL
>    - Deploy: ✅ / ⏳ menunggu pengguna | URL: <url>
>    - Ujian API: (N) lulus / (N) gagal
>
> 1. ARAHAN DEPLOY (langkah penuh — untuk pengguna laksanakan)
>
> 2. KELAYAKAN LOGIN
>    - Password disahkan / reset (akaun mana) / tidak diketahui
>
> 3. UJIAN API (setiap satu: arahan + RESPONS SEBENAR + status)
>    a) Auth login
>    b) SELECT programmes
>    c) SELECT participants
>    d) SELECT audit_logs
>    e) RPC governance (read-only / jangkaan ralat)
>
> 4. SENARAI SEMAK MANUAL UI (untuk pengguna — setiap item dengan arahan)
>
> 5. ISU / AMARAN (sebarang ralat atau anomali)
>
> 6. CADANGAN AKHIR (cth. tukar kata laluan lalai, MFA, domain sendiri)
> ```
>
> **Penting:** Laporan mesti lengkap dengan arahan, respons sebenar dan
> status setiap ujian — supaya saya boleh semak tanpa bergantung pada anda.

---

## --- TAMAT PROMPT ---

---

## Nota untuk pengguna (bukan sebahagian prompt)

- **Sebelum tampal:** salin anon key dari Supabase Dashboard → Project
  Settings → API, dan gantikan `<ANON_KEY_ANDA>` dalam prompt. JANGAN guna
  service_role key.
- Selepas laporan 4 diterima, semak: (1) URL production berfungsi, (2) login
  sebenar berjaya, (3) data seed kelihatan (bukan mock), (4) semua laluan
  dilindungi, (5) ujian API lulus.
- Selepas sistem live: tukar kata laluan lalai `masb.12345` untuk semua
  pengguna secepat mungkin.
