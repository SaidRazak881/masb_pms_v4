# PROMPT 4B — VERIFIKASI E2E PRODUCTION (SELEPAS SETUP VERCEL)

> **Status fasa:** Prompt 4 (deploy Vercel) selesai sebahagian — build lulus, tetapi env Supabase &
> Production Branch belum disahkan. Tindakan manual (ACTION 4A) telah disiapkan oleh pengguna.
> Prompt ini = sambungan E2E penuh di production.
>
> **Rujukan:** `docs/PROMPT-4-DEPLOY-E2E.md` (prompt asal), `docs/ACTION-4A-VERCEL-SETUP.md`.
> **Kelulusan sedia ada:** skema DB, RLS, RPC, seed, auth (19 pengguna), storage — semua TIDAK perlu diubah lagi.
> **Larangan kekal:** jangan reset password selain kelulusan eksplisit; jangan ubah skema/RLS/RPC;
> jangan guna `service_role`; jangan panggil RPC tulis perniagaan tanpa arahan; jangan merge ke `main`.

---

## 1. Konteks

- Production URL: `https://masb-pms-v4.vercel.app` (domain tidak berubah; cuma target/branch berubah).
- Production Branch Vercel: `arena/01a06274-masb-pms-v4` (commit `e8c70f3`).
- Env Vercel: `NEXT_PUBLIC_SUPABASE_URL=https://lmenmfsbjgxfhnykkgow.supabase.co` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon key).
- Supabase: projek `lmenmfsbjgxfhnykkgow` — 14 jadual, RLS aktif, seed: 12 organizer, 4 program, 6 financial docs, 2 programme costs, 4 peserta, 4 cost items; audit_logs 14 rekod `created`; 19 auth users + 19 `user_profiles`.
- Password lalai rasmi semua akaun (dari `V4 RAW/User Profiles Mapping.xlsx`): **`masb.12345`**.
- ✅ **PENGESAHAN PENGUNA: password `masb.12345` MASIH SAH** untuk akaun ujian (disahkan semasa menyediakan prompt ini) — jalankan Laluan A terus; laluan 3.2-B (reset) hanya relevan jika login tiba-tiba gagal.

## 2. Tugasan

Sahkan deployment production benar-benar live dengan Supabase sebenar dan laksanakan verifikasi
E2E penuh mengikut urutan di bawah. **Jangan mengubah apa-apa di database** kecuali langkah 3.2 (reset, jika diluluskan).

## 3. Ujian API (curl / REST)

### 3.1 Sahkan deployment
- `GET https://masb-pms-v4.vercel.app/` tanpa auth → jangkaan redirect ke `/login?redirect=%2F...` (middleware aktif).
- Sahkan tiada teks "Mod Demo" / "Paparan mock" dalam HTML `/programmes` (tanpa auth, sepatutnya redirect dulu).

### 3.2 Login Auth sebenar (Auth E2E)
- Panggil `POST https://lmenmfsbjgxfhnykkgow.supabase.co/auth/v1/token?grant_type=password`
  dengan `{ "email": "zalina@mimos.my", "password": "masb.12345" }` + `apikey` = anon key + `Content-Type: application/json`.
- **Laluan A — berjaya:** simpan `access_token`; teruskan ke 3.3.
- **Laluan B — gagal (invalid login credentials):** JANGAN reset tanpa kelulusan.
  HENTIKAN ujian API, teruskan bahagian manual hanya untuk halaman awam, dan dalam laporan
  minta kelulusan eksplisit pengguna untuk reset password SATU admin sahaja (`saidrazak881@gmail.com`)
  menggunakan SQL di bawah — hanya selepas pengguna berkata "lulus" barulah jalankan:
  ```sql
  -- RESET SATU ADMIN SAHAJA (dengan kelulusan pengguna sahaja)
  select set_config('app.allow_user_update', 'on', false);  -- jika guard wujud
  update auth.users
     set encrypted_password = crypt('masb.12345', gen_salt('bf')),
         updated_at = now()
   where email = 'saidrazak881@gmail.com';
  -- kemudian ulang 3.2 dengan saidrazak881@gmail.com / masb.12345
  ```
  (Jika guard `app.allow_user_update` tidak wujud, lapor dan tanya sebelum guna alternatif.)

### 3.3 RLS SELECT (guna JWT dari 3.2)
- `GET {SUPABASE_URL}/rest/v1/programmes?select=*` + `Authorization: Bearer {access_token}` + `apikey`:
  jangkaan **4 rekod** — `MA/QT/2026(0001)`, `MASB/QT/TRA/2026/0038`, `MSSB/QT/TRA/2026/0001`, `MSSB/QT/TRA/2026/0002`.
- `GET /rest/v1/participants?select=*`: jangkaan **4 rekod**.
- `GET /rest/v1/audit_logs?select=*`: jangkaan **14 rekod**, semua `action='created'`.
- `GET /rest/v1/organizers?select=*`: jangkaan **12 rekod**.
- **Sahkan RLS aktif:** tanpa token → jangkaan `401`/`permission denied` (bukan data bocor).

### 3.4 RPC read-only
- `POST /rest/v1/rpc/current_user_role` → jangkaan `"admin"` untuk zalina@mimos.my.
- `POST /rest/v1/rpc/change_request_allowed_fields` (jika wujud) → jangkaan senarai field.
  - **Jika error `function ... does not exist` atau sebarang ralat** — lapor VERBATIM; ini isu terbuka
    (`current_role_name()` mungkin tiada) yang akan dibaiki di repo.
- **LARANGAN:** jangan panggil `sync_import_transaction`, `lock_programme`, `unlock_programme`,
  `request_programme_unlock` atau sebarang RPC tulis.

## 4. Senarai Semak Manual (pengguna lakukan di browser; anda semak & sahkan laporan)

| # | Ujian | Jangkaan |
|---|---|---|
| 1 | Buka `https://masb-pms-v4.vercel.app` (belum login) | Redirect `/login` |
| 2 | Login `zalina@mimos.my` / `masb.12345` (atau `saidrazak881@gmail.com` jika reset diluluskan) | `/dashboard`; header nama sebenar + role; TIADA "Mod Demo" |
| 3 | Dashboard | KPI: 4 program, 12 organizer, 4 peserta, 6 financial docs, 2 programme costs |
| 4 | `/programmes` | 4 program seed; buka detail program: Overview / Financial / Participants / Costs / Documents / Audit Trail — nama user betul (BUKAN "current-user") |
| 5 | Import `public/samples/00. Quotation Tracker (1).xlsx` | Upload → staging review → **pengguna klik Confirm Sync secara manual** → Sejarah Import ada rekod → peserta/program baharu nampak (anda semak di DB selepas itu) |
| 6 | `/reports` | Semua jenis laporan boleh preview + Export Excel |
| 7 | Log Keluar | Kembali `/login`; buka `/dashboard` → redirect `/login` |
| 8 | Login `nizar.harun@mimos.my` / `masb.12345` | Panel/laluan governance head |
| 9 | Login `abu.razak@mimos.my` / `masb.12345` | Pada program dikunci: butang "Mohon Ubah Data" (bukan "Sunting") |

- Untuk Test 5, anda tidak boleh menekan butang UI; minta pengguna melakukannya, kemudian
  sahkan kesan di DB (SELECT staging + destination + audit) dan laporkan.

## 5. Larangan

1. JANGAN reset password mana-mana akaun tanpa kelulusan eksplisit pengguna (hanya laluan 3.2-B dibenarkan, satu akaun sahaja).
2. JANGAN ubah skema, RLS, RPC, trigger, seed, atau storage.
3. JANGAN guna `service_role` key dalam sebarang ujian.
4. JANGAN panggil RPC tulis perniagaan (sync, lock/unlock, change request) — kecuali pengguna
   melakukannya manual di UI (Test 5).
5. JANGAN merge ke `main` atau tukar Production Branch.
6. JANGAN tampal anon key penuh dalam laporan — rujuk sebagai `anon` (mask separa `sb_publishable_...`/`eyJ...`).

## 6. FORMAT LAPORAN (6 seksyen — mesti diikuti)

**Seksyen 1 — Status Deployment**
- Production URL, target (`production`), branch, commit, state READY; bukti (log build / tangkapan skrin).

**Seksyen 2 — Keputusan Ujian API (jadual)**
- Baris: 3.1 redirect, 3.2 login (Laluan A/B), 3.3 SELECT programmes/participants/audit_logs/organizers (bilangan rekod + 2 kod program contoh), 3.3 RLS tanpa token, 3.4 RPC.
- Setiap baris: Status LULUS/GAGAL + bukti (HTTP code, JSON ringkas, error verbatim).

**Seksyen 3 — Keputusan Senarai Semak Manual (jadual 9 baris)**
- Test 1–9: Status LULUS/GAGAL + bukti (penerangan ringkas / tangkapan skrin).

**Seksyen 4 — Isu / Blocker**
- Setiap isu: 🔴/🟠/🟢 + penerangan + bukti verbatim + cadangan penyelesaian.

**Seksyen 5 — Pengesahan Penuh**
- Pengesahan bahawa: login guna Supabase sebenar, data = seed (bukan mock), RLS berfungsi,
  middleware melindungi laluan, import manual berjaya (jika selesai).

**Seksyen 6 — Kesimpulan & Langkah Seterusnya**
- Fasa 4: LULUS / SEBAHAGIAN / GAGAL + justifikasi + cadangan langkah seterusnya
  (cth. tukar password lalai semua pengguna, MFA, domain kustom, Prompt 5).
