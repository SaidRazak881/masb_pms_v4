# PROMPT 4C — LENGKAPKAN VERIFIKASI E2E (SAMBUNGAN LAPORAN 4B)

> **Konteks:** Laporan 4B yang diterima hanya mengandungi Seksyen 1 (Status Deployment) — tidak lengkap.
> Deployment production disahkan OK (semakan bebas: `https://masb-pms-v4.vercel.app/programmes`
> redirect ke `/login?redirect=%2Fprogrammes` → middleware & env Supabase AKTIF).
> Tugasan: **sambung dari titik semasa** — jangan ulang Seksyen 1, teruskan ujian API & manual,
> dan hantar laporan penuh 6 seksyen.

---

## 1. Status yang sudah disahkan (jangan ulangi — ringkaskan sahaja)

- Production: `https://masb-pms-v4.vercel.app` · Target `production` · READY · commit `9a80408` (= HEAD branch `arena/01a05cd4-masb-pms-v4`).
- Env Supabase aktif (bukti: middleware redirect `/programmes` → `/login?redirect=%2Fprogrammes`; `/login` papar borang sebenar, tiada "Mod Demo").
- Password ujian **`masb.12345` MASIH SAH** (pengesahan pengguna).

## 2. Tugasan (urutan ketat)

### A. Ujian API (curl/REST) — lengkapkan sekarang
1. Login Auth sebenar:
   `POST https://lmenmfsbjgxfhnykkgow.supabase.co/auth/v1/token?grant_type=password`
   body `{"email":"zalina@mimos.my","password":"masb.12345"}` + header `apikey: <anon key>` + `Content-Type: application/json`.
   Simpan `access_token`. **Jangan reset password** (password disahkan sah).
2. RLS SELECT dengan `Authorization: Bearer <access_token>`:
   - `/rest/v1/programmes?select=*` → jangkaan 4 rekod (sertakan 4 kod program dalam laporan).
   - `/rest/v1/participants?select=*` → 4 rekod.
   - `/rest/v1/audit_logs?select=*` → 14 rekod.
   - `/rest/v1/organizers?select=*` → 12 rekod.
3. RLS negatif: tanpa token → jangkaan 401/`permission denied`.
4. RPC read-only:
   - `POST /rest/v1/rpc/current_user_role` → jangkaan `"admin"`.
   - `POST /rest/v1/rpc/change_request_allowed_fields` (jika wujud) → senarai field.
   - Jika error `function does not exist` / ralat lain → lapor VERBATIM (isu terbuka `current_role_name()`).

### B. Ujian Manual (pengguna lakukan di browser; anda sahkan dari laporan + DB)
Minta pengguna laksanakan 9 test di bawah, kemudian sahkan kesan di DB (SELECT) dan laporkan:

| # | Ujian | Jangkaan |
|---|---|---|
| 1 | Buka `https://masb-pms-v4.vercel.app` (belum login) | Redirect `/login` |
| 2 | Login `zalina@mimos.my` / `masb.12345` | `/dashboard`; header nama sebenar + "Pentadbir Sistem"; TIADA "Mod Demo" |
| 3 | Dashboard KPI | 4 program · 12 organizer · 4 peserta · 6 financial docs · 2 programme costs |
| 4 | `/programmes` → buka detail program | 4 program seed; tab Overview/Financial/Participants/Costs/Documents/Audit Trail; nama user BETUL (bukan "current-user") |
| 5 | Import `public/samples/00. Quotation Tracker (1).xlsx` | Upload → staging → pengguna klik Confirm Sync → Sejarah Import; sahkan kesan di DB |
| 6 | `/reports` | Semua jenis laporan preview + Export Excel |
| 7 | Log Keluar | Kembali `/login`; `/dashboard` selepas logout → redirect `/login` |
| 8 | Login `nizar.harun@mimos.my` / `masb.12345` | Akses/laluan governance head |
| 9 | Login `abu.razak@mimos.my` / `masb.12345` | Program dikunci: butang "Mohun Ubah Data" (bukan "Sunting") |

### C. Laporan penuh — FORMAT 6 SEKSYEN (mesti penuh, bukan 1 seksyen sahaja)

**Seksyen 1 — Status Deployment** (ringkasan 3 baris sahaja, sudah disahkan)
**Seksyen 2 — Keputusan Ujian API (jadual)**: setiap ujian = Status LULUS/GAGAL + bukti (HTTP code, JSON ringkas, error verbatim).
**Seksyen 3 — Keputusan Senarai Semak Manual (jadual 9 baris)**: Test 1–9 = Status + bukti.
**Seksyen 4 — Isu / Blocker**: 🔴/🟠/🟢 + penerangan + bukti verbatim + cadangan.
**Seksyen 5 — Pengesahan Penuh**: login Supabase sebenar, data seed (bukan mock), RLS aktif, middleware aktif, import manual berjaya (jika selesai).
**Seksyen 6 — Kesimpulan & Langkah Seterusnya**: Fasa 4 LULUS/SEBAHAGIAN/GAGAL + justifikasi + cadangan (tukar password lalai, MFA, domain kustom, Prompt 5).

## 3. Larangan

1. JANGAN reset password mana-mana akaun (password disahkan sah; tiada kelulusan reset).
2. JANGAN ubah skema/RLS/RPC/trigger/seed/storage.
3. JANGAN guna `service_role`.
4. JANGAN panggil RPC tulis (`sync_import_transaction`, `lock_programme`, `unlock_programme`, `request_programme_unlock`) — Test 5 Confirm Sync dilakukan pengguna manual di UI.
5. JANGAN merge ke `main` / tukar Production Branch.
6. JANGAN tampal anon key penuh dalam laporan (mask separa).
