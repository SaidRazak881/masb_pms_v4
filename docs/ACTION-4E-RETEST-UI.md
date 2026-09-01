# ACTION 4E — RETEST UI PRODUCTION (SELEPAS FIX)

> **Konteks:** Laporan 4E disemak & diterima — DB live kini FIXED:
> ✅ `current_role_name()` wujud · ✅ `full_name` 19/19 pengguna · ✅ auth metadata · ✅ RLS tidak diubah ·
> ✅ deploy production = commit `59eeddd` (READY).
> Kod UI (butang Kunci Program, dialog Sunting, role head_governance) = commit `34f1069` (dalam `59eeddd`).
>
> Tugas anda: **ulang ujian UI di production** — kali pertama hampir semua gagal; sekarang patut berfungsi.

---

## A. Persediaan

1. Pastikan anda login di <https://masb-pms-v4.vercel.app> (log keluar dahulu jika masih ada sesi lama).
2. Password semua akaun masih lalai: **`masb.12345`**.

## B. Retest keutamaan (dari laporan 4E) — Test A → D

| # | Ujian | Langkah | Jangkaan | Lulus? |
|---|---|---|---|---|
| **A** | **Nama pengguna** | Login `zalina@mimos.my` / `masb.12345` | Header kanan atas: **Zalina Sayuti · Pentadbir Sistem · Log Keluar** (BUKAN `zalina@mimos.my`, tiada "current-user") | ☐ |
| **B** | **Kunci Program** | Login `nizar.harun@mimos.my` / `masb.12345` → `/programmes` → buka satu program (cth. `MSSB/QT/TRA/2026/0002`) | Ada butang **"Kunci Program"** (untuk program tidak dikunci). Klik → pilih sebab → Kunci Sekarang → banner merah "Program Berkunci" muncul | ☐ |
| **C** | **Sunting Program** | Kekal sebagai `nizar.harun@mimos.my` (atau `zalina@mimos.my`) → buka program **tidak dikunci** → klik **"Sunting Program"** | Dialog borang sebenar terbuka (13 medan). Ubah satu medan → **Simpan Perubahan** → mesej "Perubahan berjaya disimpan" → nilai baharu kelihatan | ☐ |
| **D** | **Staff + program dikunci** | Logout → login `abu.razak@mimos.my` / `masb.12345` → buka program yang **dikunci** (yang anda kunci di Test B) | **Tiada** butang "Sunting Program". Ada kawasan **"Permohonan Ubah Data"** + butang **"Mohon Ubah Data"** | ☐ |

> Nota Test D: "Mohon Ubah Data" muncul hanya untuk program **dikunci**. Jika tiada program dikunci, kunci dahulu di Test B.

## C. Retest penuh baki (Test 2–9 dari ACTION 4C) — untuk tutup Fasa 4

| # | Ujian | Jangkaan | Lulus? |
|---|---|---|---|
| 2 | Login `zalina@mimos.my` | Dashboard; header nama sebenar; TIADA "Mod Demo" | ☐ |
| 3 | Dashboard KPI | 4 program · 12 penganjur · 4 peserta · 6 dokumen kewangan · 2 kos program | ☐ |
| 4 | Detail program | Tab Overview/Financial/Participants/Costs/Documents/Audit Trail berfungsi; nama user betul | ☐ |
| 5 | **Import Excel** | `public/samples/00. Quotation Tracker (1).xlsx` → upload → staging → **Confirm Sync (anda klik)** → Sejarah Import | ☐ |
| 6 | Laporan | `/reports` — semua jenis preview + **Export Excel** berfungsi | ☐ |
| 7 | Logout | Kembali `/login`; `/dashboard` selepas logout → redirect `/login` | ☐ |
| 8 | Login `nizar.harun@mimos.my` | Panel governance (lock/unlock/permohonan) berfungsi | ☐ |
| 9 | Login `abu.razak@mimos.my` | Pada program dikunci: "Mohun Ubah Data" (bukan "Sunting") | ☐ |

## D. Laporkan balik

Kongsi kepada saya (ringkas):
1. Test A–D: ✅/❌ + apa yang anda nampak.
2. Test 2–9: ✅/❌.
3. Jika ada ralat (terutama Test B/C/D atau import): **salin teks ralat penuh**.
4. Tangkapan skrin pilihan (2–3).

**Jika semua lulus → Fasa 4 selesai → saya sediakan Prompt Fasa 5 (tukar password lalai `masb.12345` + MFA).**
