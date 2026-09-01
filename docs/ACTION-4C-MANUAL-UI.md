# ACTION 4C — SENARAI SEMAK MANUAL UI (ANDA, DI BROWSER)

> **Konteks:** Laporan 4C disemak & diterima. Infrastruktur/DB/RLS/Auth-readiness = LULUS.
> Yang tinggal untuk menutup Fasa 4 ialah ujian manual UI (Test 2–9) — hanya anda boleh buat di browser.
> **Dua fix baharu sudah di-push (commit `609a4e5`) dan akan auto-deploy ke production:**
> (1) fungsi `current_role_name()` ditambah (rujukan RPC `review_change_request`);
> (2) detail program kini papar user id SEBENAR (bukan "current-user").
>
> Urutan: (A) tunggu deploy baharu READY → (B) jalankan test manual di bawah → (C) balas kepada
> ChatGPT dengan PROMPT-4D untuk verification DB + penutupan Fasa 4.

---

## A. Sahkan deploy baharu

1. Buka <https://vercel.com/saidrazak881-5747/masb-pms-v4/deployments> — deployment terbaru (commit `609a4e5`) mesti `READY`, Target: `Production`.
2. Buka <https://masb-pms-v4.vercel.app/programmes> semasa belum login → mesti redirect ke `/login`.

## B. Kredential ujian (password lalai rasmi: `masb.12345`)

| Akaun | Peranan | Guna untuk |
|---|---|---|
| `zalina@mimos.my` | admin | Test 2–7 (utama) |
| `nizar.harun@mimos.my` | head_governance | Test 8 |
| `abu.razak@mimos.my` | staff | Test 9 |

## C. Test 2 → 9 (ikut urutan)

| # | Langkah | Jangkaan | Lulus? |
|---|---|---|---|
| 2 | Buka `https://masb-pms-v4.vercel.app` (belum login) → mesti redirect `/login`. Login `zalina@mimos.my` / `masb.12345` | Masuk `/dashboard`. Header kanan atas: **Zalina Sayuti · Pentadbir Sistem · Log Keluar**. TIADA banner "Mod Demo" | ☐ |
| 3 | Dashboard | KPI: **4 program · 12 penganjur · 4 peserta · 6 dokumen kewangan · 2 kos program** (angka dari DB, bukan mock) | ☐ |
| 4 | `/programmes` → senarai 4 program → buka satu (cth. `MA/QT/2026(0001)`) | Detail lengkap: Overview / Financial / Participants / Costs / Documents / Audit Trail. **Nama/ID pengguna BETUL** (bukan teks "current-user") | ☐ |
| 5 | **Import Excel (paling penting)** | Lihat langkah D di bawah | ☐ |
| 6 | `/reports` | Semua jenis laporan boleh preview; **Export Excel** berfungsi (fail muat turun) | ☐ |
| 7 | Klik **Log Keluar** | Kembali ke `/login`. Buka `/dashboard` selepas logout → redirect `/login` | ☐ |
| 8 | Login `nizar.harun@mimos.my` / `masb.12345` | Akses panel/laluan governance (lock/unlock & permohonan ubah data) nampak seperti sepatutnya | ☐ |
| 9 | Logout, login `abu.razak@mimos.my` / `masb.12345`, buka program yang **dikunci** | Butang **"Mohun Ubah Data"** (bukan "Sunting Program") | ☐ |

## D. Test 5 — Import Excel + Confirm Sync (langkah demi langkah)

1. Login sebagai `zalina@mimos.my` (Test 2).
2. Menu **Import** → pilih fail **`public/samples/00. Quotation Tracker (1).xlsx`** (fail ini berada dalam repo, folder `public/samples/`; jika tiada di komputer anda, muat turun dari GitHub: `SaidRazak881/masb_pms_v4` → folder `public/samples/`).
3. Upload → semak **Staging Review** (papar rekod yang dipadankan/dicadangkan).
4. Klik **Confirm Sync** (ini operasi tulis — ANDA yang klik, bukan GPT).
5. Periksa **Sejarah Import** — ada rekod baharu.
6. Jangan ubah apa-apa lagi selepas ini.

> Nota: jika mesej ralat muncul semasa Confirm Sync, **salin teks ralat penuh** dan laporkan — jangan cuba betulkan sendiri.

## E. Laporan balas (kepada saya / ChatGPT)

Selepas selesai, kongsikan:
1. Status setiap Test 2–9 (☐ → ✅/❌) + apa yang anda nampak.
2. Untuk Test 5: hasil Confirm Sync (berjaya / ralat — salin mesej).
3. Tangkapan skrin (pilihan, 2–3 sahaja: dashboard, detail program, import selesai).

Kemudian tampal `docs/PROMPT-4D-FINAL-VERIFY.md` ke ChatGPT (perbualan yang sama) — GPT akan
buat verification DB read-only terhadap kesan import + sahkan fix `current_role_name()` + tutup Fasa 4.
