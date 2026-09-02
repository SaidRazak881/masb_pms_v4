# ACTION 5 — UJIAN MANUAL FAS 5 (MFA + KATA LALUAN)

> **Konteks:** Kod Fasa 5 (commit `21f18cb`) — MFA TOTP untuk admin/head_governance,
> log masuk 2-langkah, halaman `/security` — telah di-push dan Vercel auto-deploy ke
> production. SQL reset kata laluan 19 akaun dijalankan melalui
> `docs/PROMPT-5-RESET-PASSWORDS.md` (Supabase SQL Editor).
>
> **Cara guna:** jalankan ujian di production
> (https://masb-pms-v4.vercel.app) mengikut urutan di bawah. Tandakan ☐/✅/❌ dan
> laporkan kembali (sertakan mesej ralat penuh jika gagal).

## Sebelum mula

- [ ] Vercel: deployment terbaru READY (Target: Production, commit `21f18cb`).
- [ ] SQL reset PROMPT-5 sudah dijalankan & laporan GPT diterima
      (19 kata laluan baharu di tangan).
- [ ] Sediakan aplikasi authenticator di telefon (cth. Google Authenticator).

## Ujian

### A. Kata laluan lama ditolak (selepas reset)

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| A1 | Login `zalina@mimos.my` / `masb.12345` | Ralat log masuk (kata laluan lama ditolak) | ☐ |
| A2 | Login `sitisarah.ramli@mimos.my` / `masb.12345` | Ralat log masuk | ☐ |

### B. MFA wajib untuk admin & head_governance

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| B1 | Login `zalina@mimos.my` + kata laluan baharu (dari laporan GPT) | Selepas log masuk → dialih ke `/security?required=1`; banner ambar "MFA wajib untuk peranan admin" | ☐ |
| B2 | Di `/security`: klik **Sediakan MFA** | Kod QR + kunci rahsia dipaparkan | ☐ |
| B3 | Imbas QR dengan Google Authenticator, masukkan kod 6 digit, klik **Aktifkan MFA** | Mesej hijau "MFA berjaya diaktifkan"; panel status MFA aktif | ☐ |
| B4 | Klik **Selesai — Ke Dashboard** | Dashboard dibuka; tiada lagi pengalihan ke /security | ☐ |
| B5 | Log keluar → login semula `zalina@mimos.my` + password baharu | Halaman "Pengesahan 2-Langkah" muncul (bukan terus ke dashboard) | ☐ |
| B6 | Masukkan kod SALAH (6 digit rawak) | Ralat kod tidak sah — tidak masuk | ☐ |
| B7 | Masukkan kod BETUL dari authenticator | Dashboard dibuka | ☐ |
| B8 | Ulang B1–B7 untuk `nizar.harun@mimos.my` (head_governance) | Sama — selepas masuk, panel governance (lock/unlock) berfungsi seperti biasa | ☐ |

### C. Akaun biasa — tiada MFA, boleh tukar kata laluan sendiri

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| C1 | Login `sitisarah.ramli@mimos.my` (executive) + kata laluan baharu | Terus ke dashboard — TIADA permintaan MFA | ☐ |
| C2 | Menu **Keselamatan** | Mesej "Akaun anda tidak memerlukan MFA"; borang Tukar Kata Laluan ada | ☐ |
| C3 | Tukar kata laluan kepada password sendiri (≥8 aksara) | Mesej hijau "Kata laluan berjaya ditukar" | ☐ |
| C4 | Log keluar → login dengan kata laluan baharu | Berjaya masuk | ☐ |
| C5 | Login dengan kata laluan lama (dari laporan GPT) | Ditolak (sudah bertukar) | ☐ |

### D. Keselamatan lanjut (pilihan)

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| D1 | Login `zalina@mimos.my` (lengkap MFA) → Keselamatan → Tukar Kata Laluan | Borang minta kod authenticator; tanpa kod → amaran; dengan kod betul → berjaya tukar | ☐ |
| D2 | (Amaran: JANGAN uji melainkan anda pasti) Lumpuhkan MFA | Minta kod → berjaya; login seterusnya tanpa kod MFA | ☐ |

### E. Regresi asas

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| E1 | Halaman /login dimuat (sebelum log masuk) | Tiada perubahan visual aneh | ☐ |
| E2 | Preview local (Mod Demo) — login simulasi | Masih berfungsi (tanpa Supabase, tiada MFA) | ☐ |
| E3 | Logout → cuba buka /dashboard | Dialih ke /login (perlindungan middleware kekal) | ☐ |

## Format laporan balas

1. Status deploy (Vercel READY/Production commit `21f18cb`).
2. Jadual keputusan: Ujian | Status ✅/❌/⏳ | Catatan/bukti (mesej ralat penuh jika ❌).
3. Isu/Blocker: 🔴/🟠/🟢 + penerangan + cadangan.
4. Kesimpulan: LULUS / SEBAHAGIAN / GAGAL + langkah seterusnya.
