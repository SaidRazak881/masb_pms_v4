# ACTION 6 — UJIAN MANUAL FASA 6 (Log Masuk, Kata Laluan, Pendaftaran, Super Admin)

> ## ✅ KEPUTUSAN: LULUS — semua ujian (A–K)
>
> **Tarikh:** 2026-09-04 · **Persekitaran:** Production `https://masb-pms-v4.vercel.app`
> **Deployment:** commit `ac0587173820e88c683b0440511d13d92d0952b1`, READY,
> Production Branch = `arena/01a06274-masb-pms-v4`
>
> **Dilaporkan oleh pengguna: semua lulus.** Termasuk:
> - Log masuk pertama + wajib tukar kata laluan (A1–A11)
> - MFA dibuang sepenuhnya (B1–B4)
> - Lupa kata laluan (C1–C6)
> - Pendaftaran + menunggu kelulusan (D1–D6)
> - Dashboard Super Admin (E1–E5)
> - Lulus / role / sekat / reset (F)
> - Peraturan keselamatan, audit trail, status akaun, maklumat akaun (G–J)
> - Regresi Fasa 1–5 (K)
>
> **Didahului oleh:** `docs/PROMPT-6H-E1-E9-PRECISE-CRITERIA.md` — E1–E9 = **9/9
> PASS**, E9 membuktikan 24/24 rentetan MFA tidak ditemui, Runtime Logs 24 jam
> `No logs found`.
>
> **Fasa 6 SELESAI dan disahkan di Production.**

> **Prasyarat:** `docs/PROMPT-6-INSTALL-USER-MANAGEMENT.md` telah dijalankan dan
> laporan GPT berstatus **LULUS** untuk Langkah C (SQL) dan E (Vercel).
>
> **Keadaan awal selepas pemasangan Fasa 6:**
> - SEMUA akaun (termasuk `saidrazak881@gmail.com`) menggunakan kata laluan
>   `masb.12345`.
> - SEMUA akaun ada `must_change_password = true` → log masuk pertama akan
>   membawa anda ke `/security` dan **menghalang** modul lain sehingga kata
>   laluan ditukar.
> - `saidrazak881@gmail.com` = `super_admin` dan satu-satunya akaun yang boleh
>   membuka `/admin/users`.
>
> **Cara guna:** jalankan ujian di production `https://masb-pms-v4.vercel.app`
> mengikut urutan. Tandakan ✅/❌ dan sertakan **mesej ralat penuh** jika gagal.
> Ujian A–D wajib; E–J wajib untuk Super Admin; K regresi.

---

## A. Log masuk pertama + wajib tukar kata laluan

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| A1 | Buka `/login` | Borang e-mel + kata laluan. **TIADA** medan "Kod Authenticator". Ada nota kata laluan lalai `masb.12345`, butang **Daftar Akaun Baharu** dan pautan **Lupa kata laluan?** | ☐ |
| A2 | Log masuk `saidrazak881@gmail.com` / `masb.12345` | Berjaya, tetapi dialih ke `/security?required=1&next=%2Fdashboard` dengan kad ambar **"Anda wajib menukar kata laluan"** | ☐ |
| A3 | Cuba buka `/dashboard` secara terus (URL) | Dihalang — dialih ke `/security?required=1&next=%2Fdashboard` | ☐ |
| A3b | Selepas log keluar, buka terus `https://masb-pms-v4.vercel.app/reports` → log masuk | URL menjadi `/security?required=1&next=%2Freports`; selepas kata laluan ditukar, pengguna dihantar ke **`/reports`** (bukan `/dashboard`) | ☐ |
| A3c | Semasa masih wajib tukar kata laluan, cuba buka `/admin/users` | **Dibenarkan** (halaman `/admin` & `/security` dikecualikan) supaya Super Admin boleh meluluskan pengguna walaupun kata laluan beliau masih lalai | ☐ |
| A4 | Di `/security`, cuba kata laluan baharu `masb.12345` | Ditolak: "tidak boleh sama dengan kata laluan lalai sistem" | ☐ |
| A5 | Cuba `abcdefg` (7 aksara) | Ditolak: sekurang-kurangnya 8 aksara | ☐ |
| A6 | Cuba `abcdefghijkl` (tiada nombor) | Ditolak: mesti mengandungi nombor | ☐ |
| A7 | Kata laluan baharu ≠ pengesahan | Ditolak: tidak sepadan | ☐ |
| A8 | Masukkan **Kata Laluan Semasa** = `masb.12345`, kata laluan baharu sah (cth. `SayaBaru2026`) + pengesahan | Mesej hijau "Kata laluan berjaya ditukar", kemudian (~1.2 saat) dialih ke halaman dalam parameter `next=` | ☐ |
| A9 | Selepas A8, buka `/dashboard` | Dashboard dibuka tanpa halangan | ☐ |
| A10 | Log keluar → log masuk semula dengan `masb.12345` | **Ditolak** (kata laluan lama tidak sah lagi) | ☐ |
| A11 | Log masuk dengan kata laluan baharu | Terus ke dashboard — **tiada** lagi tuntutan tukar kata laluan | ☐ |

## B. MFA telah dibuang sepenuhnya

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| B1 | Log masuk sebagai `admin` (cth. `zalina@mimos.my` / `masb.12345`) | **Tiada** halaman "Pengesahan 2-Langkah", tiada permintaan kod 6 digit | ☐ |
| B2 | Buka `/security` selepas log masuk | Tiada butang "Sediakan MFA", tiada QR code, tiada panel status MFA. Hanya **Tukar Kata Laluan** + **Maklumat Akaun** | ☐ |
| B3 | Log masuk `nizar.harun@mimos.my` (head_governance) | Tiada MFA; panel governance (lock/unlock, change request) berfungsi seperti Fasa 4 | ☐ |
| B4 | Cari perkataan `authenticator` / `TOTP` / `MFA` di seluruh UI | Tidak dijumpai di mana-mana halaman | ☐ |

## C. Lupa kata laluan

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| C1 | Dari `/login`, klik **Lupa kata laluan?** | Halaman `/forgot-password` dengan medan e-mel | ☐ |
| C2 | Masukkan e-mel berdaftar → **Hantar Pautan Set Semula** | Skrin "Semak E-mel Anda" + nota bahawa Super Admin boleh reset secara manual | ☐ |
| C3 | Masukkan e-mel **tidak** berdaftar | Tiada pendedahan maklumat — skrin yang sama dipaparkan (Supabase tidak membocorkan kewujudan akaun) | ☐ |
| C4 | Semak peti masuk e-mel | E-mel "Reset Your Password" diterima (jika template e-mel Supabase dikonfigurasi). Jika tiada dalam 5 minit, tandakan ⏳ dan guna laluan Super Admin (F1) | ☐ |
| C5 | Klik pautan dalam e-mel | Dibawa ke `/security?reset=1` — borang kata laluan baharu **tanpa** medan "Kata Laluan Semasa" | ☐ |
| C6 | Tetapkan kata laluan baharu yang sah | Mesej hijau, kemudian dialih ke dashboard | ☐ |

## D. Pendaftaran akaun baharu

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| D1 | Dari `/login`, klik **Daftar Akaun Baharu** | Borang `/register`: Nama Penuh, E-mel, Telefon, Jawatan, Jabatan, Kata Laluan, Sahkan | ☐ |
| D2 | Nota pada borang | Menyatakan akaun baharu diberi role **Pemerhati (viewer)** dan status **Menunggu Kelulusan** | ☐ |
| D3 | Cuba guna `masb.12345` sebagai kata laluan | Ditolak: "Jangan guna kata laluan lalai sistem semasa mendaftar" | ☐ |
| D4 | Isi borang lengkap dengan kata laluan sah → **Hantar Permohonan** | Skrin **"Permohonan Dihantar"** dengan penjelasan 3 langkah seterusnya | ☐ |
| D5 | Cuba log masuk dengan akaun baharu itu | Kata laluan sah, tetapi dialih ke `/pending-approval` — **"Menunggu Kelulusan"**, dan **tiada** akses ke dashboard/program | ☐ |
| D6 | Daftar e-mel yang sama sekali lagi | Ditolak: "E-mel ini sudah berdaftar" | ☐ |

## E. Super Admin — akses dashboard pengurusan

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| E1 | Log masuk `saidrazak881@gmail.com` | Sidebar memaparkan item **Admin Pengguna** dengan badge "Super" | ☐ |
| E2 | Buka `/admin/users` | Dashboard pengurusan: 6 kad KPI (Jumlah, Menunggu Kelulusan, Aktif, Disekat, Guna Kata Laluan Lalai, Super Admin) | ☐ |
| E3 | KPI "Menunggu Kelulusan" | Mengira akaun `pending` (termasuk pendaftaran dari D4) | ☐ |
| E4 | Tab **Menunggu Kelulusan** | Menyenaraikan permohonan baharu dengan butang **Luluskan** dan **Luluskan + Role** | ☐ |
| E5 | Carian nama/e-mel/jabatan | Jadual ditapis; penapis Status (Semua/Menunggu/Aktif/Disekat) berfungsi | ☐ |

## F. Super Admin — lulus, role, sekat, reset

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| F1 | **Luluskan** akaun dari D4 (role lalai) | Status → **Aktif**, role → Staf. Akaun itu kini boleh log masuk dan mengakses modul | ☐ |
| F2 | **Luluskan + Role** → pilih `finance` | Dialog memaparkan penerangan kuasa role; selepas lulus, role = Kewangan | ☐ |
| F3 | Semak pilihan role dalam dialog | **TIADA** pilihan `super_admin` dalam senarai | ☐ |
| F4 | Log masuk akaun yang baru diluluskan | Berjaya; dialih ke `/security?required=1` (kata laluan lalai masih dipakai) → tukar → masuk | ☐ |
| F5 | **Tukar role** akaun aktif kepada `head_governance` | Badge role dikemas kini serta-merta | ☐ |
| F6 | **Set semula kata laluan** akaun itu | Kad ambar memaparkan `masb.12345`; pengguna itu log keluar dari semua sesi | ☐ |
| F7 | Log masuk akaun itu dengan kata laluan **lama** (yang ditukar di F4) | Ditolak | ☐ |
| F8 | Log masuk dengan `masb.12345` | Berjaya → wajib tukar semula | ☐ |
| F9 | **Sekat** akaun tanpa sebab | Ditolak: sebab wajib (≥5 aksara) untuk rekod audit | ☐ |
| F10 | **Sekat** dengan sebab `Kontrak tamat — akses ditarik balik` | Status → **Disekat**; baris memaparkan sebab | ☐ |
| F11 | Akaun yang disekat itu cuba log masuk | Dialih ke `/account-blocked` dan **sebab sekatan dipaparkan** | ☐ |
| F12 | Jika akaun itu ada sesi terbuka sebelum disekat | Sesi tidak boleh menulis lagi (refresh token dipadam); selepas muat semula → dihalang | ☐ |
| F13 | **Nyahsekat** | Status → Aktif; sebab/tarikh sekatan dibersihkan dari profil | ☐ |
| F14 | **Wajibkan Tukar** pada akaun aktif | Kolum Kata Laluan → "Lalai — wajib tukar"; log masuk seterusnya dialih ke `/security` | ☐ |
| F15 | **Batal Wajib** | Bendera dipadam | ☐ |

## G. Peraturan keselamatan Super Admin

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| G1 | Cuba **sekat** akaun sendiri (`saidrazak881@gmail.com`) | Butang Sekat dilumpuhkan; jika dipaksa → ralat "Anda tidak boleh menyekat akaun sendiri" | ☐ |
| G2 | Cuba **reset** kata laluan sendiri | Butang Reset dilumpuhkan; mesej mengarah guna halaman Keselamatan | ☐ |
| G3 | Cuba tukar **role** sendiri | Butang Role dilumpuhkan (role Super Admin hanya melalui SQL) | ☐ |
| G4 | Log masuk sebagai pengguna **bukan** Super Admin → cuba buka `/admin/users` | Paparan **"Akses Ditolak"** — tiada data pengguna didedahkan | ☐ |
| G5 | Pengguna bukan Super Admin: sidebar | **Tiada** item "Admin Pengguna" | ☐ |
| G6 | (Pilihan, guna alat pembangun) Sebagai pengguna biasa, cuba `PATCH /rest/v1/user_profiles?id=eq.<id-sendiri>` dengan `{"role":"super_admin"}` menggunakan anon key + token sesi | **Ditolak** oleh column-level GRANT (`42501 permission denied` untuk kolum `role`) | ☐ |
| G7 | (Pilihan) Sebagai pengguna biasa, cuba `PATCH` `{"account_status":"active"}` | Ditolak — `account_status` tiada dalam grant | ☐ |
| G8 | (Pilihan) Sebagai pengguna biasa, cuba `INSERT` baris ke `user_profiles` | Ditolak — INSERT di-revoke | ☐ |

## H. Audit trail

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| H1 | Jalankan di SQL Editor (read-only): `select metadata->>'action' as action, count(*) from audit_logs where metadata->>'action' in ('APPROVE_USER','BLOCK_USER','UNBLOCK_USER','CHANGE_ROLE','RESET_PASSWORD','CHANGE_OWN_PASSWORD','REQUIRE_PASSWORD_CHANGE') group by 1 order by 1;` | Setiap tindakan dari F1–F15 muncul dengan kiraan ≥1 | ☐ |
| H2 | `select table_name, action, metadata->>'email' from audit_logs where metadata->>'action'='RESET_PASSWORD' order by created_at desc limit 5;` | E-mel sasaran + siapa yang melakukan direkod | ☐ |

## I. Status akaun & navigasi

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| I1 | Buka `/pending-approval` secara terus (tanpa log masuk) | 200, paparan "Menunggu Kelulusan" dengan butang kembali ke log masuk | ☐ |
| I2 | Buka `/account-blocked` secara terus | 200, paparan "Akaun Disekat"; tanpa `?reason=` ia memaparkan "Tiada sebab direkodkan" | ☐ |
| I3 | Buka `/dashboard` tanpa log masuk | Redirect ke `/login?redirect=%2Fdashboard` | ☐ |
| I4 | Buka `/admin/users` tanpa log masuk | Redirect ke `/login?redirect=%2Fadmin%2Fusers` | ☐ |
| I5 | Log keluar → cuba `/admin/users` | Redirect ke `/login` | ☐ |

## J. Maklumat akaun

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| J1 | `/security` → kad **Maklumat Akaun** | Memaparkan Nama, E-mel, **Peranan** (label BM betul, cth. "Super Admin"), **Status akaun** (Aktif) | ☐ |
| J2 | Header dashboard | Nama + role sebenar pengguna (bukan "Zarina Abu Bakar" mock) | ☐ |

## K. Regresi Fasa 1–5 (mesti masih berfungsi)

| # | Ujian | Jangkaan | Status |
|---|-------|----------|--------|
| K1 | `/dashboard` | KPI, pecahan kategori & penganjur, aktiviti terkini, kelulusan belum diputuskan | ☐ |
| K2 | `/programmes` | Senarai My/All, carian & penapis, butang **Program Baharu** berfungsi | ☐ |
| K3 | `/programmes/<id>` | 7 tab (Overview, Financial, Participants, Costs, Documents, Audit Trail, Change Requests) | ☐ |
| K4 | Sunting program → **Simpan** | Berjaya — **tiada** ralat `infinite recursion detected in policy` | ☐ |
| K5 | Governance: kunci program (head_governance/super_admin) → staf cuba sunting | Dihalang; butang bertukar **Mohon Ubah Data** → hantar Change Request | ☐ |
| K6 | Change Request diluluskan oleh head_governance | Berjaya (super_admin juga boleh, kerana mewarisi kuasa) | ☐ |
| K7 | `/import` → muat naik Excel → semakan → **Confirm & Sync to Master** | Berjaya; tab **Sejarah Import** memaparkan batch | ☐ |
| K8 | `/participants` | Senarai peserta + penapis status Bumiputera | ☐ |
| K9 | `/reports` | 8 jenis laporan + **Eksport Excel** menghasilkan fail `.xlsx` | ☐ |
| K10 | Kategori program | `Room Rental`, `Consultancy`, `Certification` tersedia dalam borang & penapis | ☐ |

---

## Format laporan balas

1. **Status deploy** — Vercel Production Branch = `arena/01a06274-masb-pms-v4`,
   deployment READY, commit terkini.
2. **Jadual keputusan** — `Ujian | Status ✅/❌/⏳ | Catatan/bukti`
   (mesej ralat **penuh** jika ❌).
3. **Isu / Blocker** — 🔴 / 🟠 / 🟢 + penerangan + cadangan.
4. **Kesimpulan** — LULUS / SEBAHAGIAN / GAGAL + langkah seterusnya.

> **Jangan kongsi kata laluan baharu anda dalam laporan** — nyatakan sahaja
> bahawa pertukaran berjaya.
