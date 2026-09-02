# PROMPT 5 — RESET KATA LALUAN 19 AKAUN (DB LIVE) + NOTA MFA

> **Salin keseluruhan bahagian "PROMPT" di bawah ke ChatGPT** (dengan web browsing
> diaktifkan supaya ia boleh muat turun fail persona & peta kod dari GitHub).
>
> **Konteks:** Semua 19 akaun TPMS masih menggunakan kata laluan lalai
> `masb.12345` — risiko keselamatan. Fasa 5 yang diluluskan:
> (a) **setiap akaun diberi kata laluan rawak unik** (DB live), dan
> (b) **MFA TOTP untuk admin & head_governance** — diaktifkan melalui UI aplikasi
> (bukan SQL) pada `/security` selepas kata laluan baharu diagihkan.
>
> **Kelulusan anda (tampal prompt ini = lulus):** menjalankan SQL reset kata laluan
> yang dijana GPT pada Supabase live (SQL Editor).
> **TIDAK diluluskan:** apa-apa perubahan lain (skema/RLS/RPC/trigger/seed/storage).

---

## PROMPT (salin sehingga "TAMAT PROMPT")

> **Persona (WAJIB baca & amalkan):**
> Baca fail persona di
> https://raw.githubusercontent.com/SaidRazak881/masb_pms_v4/arena/01a05cd4-masb-pms-v4/docs/personas/PERSONA-SQL-ARCHITECT.md
> dan AMALKAN persona "Arkitek SQL & Pangkalan Data TPMS" sepanjang tugasan.
>
> **Peta kod (WAJIB baca):**
> Baca peta kod terkini di
> https://raw.githubusercontent.com/SaidRazak881/masb_pms_v4/arena/01a05cd4-masb-pms-v4/docs/CODEBASE-MAP.md
> sebagai konteks struktur sistem.
>
> **Tugas:** Sediakan pelan reset kata laluan UNTUK 19 akaun TPMS MIMOS Academy di
> projek Supabase pengeluaran. Sistem ini menggunakan Supabase Auth (GoTrue) —
> pengguna wujud di `auth.users`, profil & peranan di `public.user_profiles`.
>
> **Senarai rasmi 19 akaun (e-mel — nama — role):**
>
> | # | E-mel | Nama | Role |
> |---|-------|------|------|
> | 1 | saidrazak881@gmail.com | Admin | `admin` |
> | 2 | zalina@mimos.my | Zalina Sayuti | `admin` |
> | 3 | nizar.harun@mimos.my | Dr. Ahmad Nizar | `head_governance` |
> | 4 | sitisarah.ramli@mimos.my | Siti Sarah | `executive` |
> | 5 | adilah.nisman@mimos.my | Adilah | `finance` |
> | 6 | farrah.johar@mimos.my | Farrah | `finance` |
> | 7 | abu.razak@mimos.my | Abu Sa'id | `staff` |
> | 8 | qusyairi.zolkefle@mimos.my | Qusyairi | `staff` |
> | 9 | fuziah.rahim@mimos.my | Fuziah | `staff` |
> | 10 | aisyah.alias@mimos.my | Aisyah | `staff` |
> | 11 | sholihin.abdullah@mimos.my | Sholihin | `staff` |
> | 12 | muhammadafiq.azmi@mimos.my | Dr. Afiq | `staff` |
> | 13 | ainur.rodzi@mimos.my | Ainur Najwa | `staff` |
> | 14 | suhairi.soobni@mimos.my | Mohd Suhairi | `staff` |
> | 15 | omar.azmi@mimos.my | Omar | `staff` |
> | 16 | fatin.pata@mimos.my | Fatin Firzana | `staff` |
> | 17 | amalia.rizam@mimos.my | Amalia Adriana | `staff` |
> | 18 | aleeya.amran@mimos.my | Nur Aleeya | `staff` |
> | 19 | yusuf.zolkipli@mimos.my | Muhammad Yusuf | `staff` |
>
> **Langkah 1 — Sahkan senarai:** Muat turun
> https://raw.githubusercontent.com/SaidRazak881/masb_pms_v4/arena/01a05cd4-masb-pms-v4/V4%20RAW/User%20Profiles%20Mapping.xlsx
> (atau dokumen `docs/PROMPT-3-AUTH-STORAGE.md` dalam repo yang sama) dan pastikan
> senarai 19 e-mel di atas padan dengan sumber rasmi. Laporkan sebarang beza.
>
> **Langkah 2 — Jana kata laluan:** Cipta SATU kata laluan rawak UNIK untuk setiap
> akaun dengan ciri: 16–18 aksara; gabungan huruf besar, huruf kecil, angka dan
> simbol; TANPA aksara mengelirukan (0/O, 1/l/I); TANPA kaitan nama/e-mel/pengguna;
> SEMUA 19 kata laluan BERBEZA antara satu sama lain dan BERBEZA daripada
> `masb.12345`. Gunakan penjanaan rawak sebenar (bukan corak).
>
> **Langkah 3 — Sediakan SQL idempotent** untuk dijalankan di Supabase SQL Editor
> (Dashboard → SQL Editor). SQL MESTI:
>
> 1. Mengemas kini `auth.users.encrypted_password` menggunakan pgcrypto
>    (`crypt('<password>', gen_salt('bf', 10))`) — hash bcrypt `$2a$10$` yang
>    diterima GoTrue — dan `updated_at = now()`, dipadankan `WHERE email = ...`.
>    Sertakan satu blok untuk SEMUA 19 akaun.
> 2. Menamatkan semua sesi sedia ada 19 akaun itu (supaya sesi lama `masb.12345`
>    terbatal serta-merta):
>    `DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email = ANY(...));`
> 3. Idempotent: selamat dijalankan lebih daripada sekali (UPDATE + DELETE tidak
>    merosakkan jika diulang).
> 4. TIDAK menyentuh skema, RLS, RPC, trigger, `user_profiles`, storage, atau
>    e-mel pengguna.
>
> **Langkah 4 — Sediakan query pengesahan (read-only)** untuk pengguna jalankan
> SELEPAS SQL reset: (a) `SELECT email, updated_at FROM auth.users WHERE email = ANY(...)` —
> semua 19 baris mesti menunjukkan `updated_at` baharu; (b) kiraan sesi sebelum
> vs selepas; (c) pengesahan `auth.users.email_confirmed_at` masih tidak NULL
> (e-mel kekal disahkan).
>
> **Langkah 5 — JANGAN cuba aktifkan MFA melalui SQL.** MFA TOTP tidak boleh
> didaftarkan melalui SQL — ia diaktifkan oleh PEMILIK akaun melalui aplikasi
> (halaman `/security`, kod aplikasi sudah di-deploy commit `21f18cb`). Untuk
> akaun `admin` (2) & `head_governance` (1), selepas reset, pengguna log masuk
> dengan kata laluan baharu dan sistem WAJIBKAN mereka mendaftar MFA sebelum
> menggunakan aplikasi. Nyatakan ini dalam laporan anda sebagai langkah seterusnya.
>
> **Cara pelaksanaan (saya akan jalankan selepas jawapan anda):**
> Saya akan buka Supabase → SQL Editor → jalankan blok SQL anda → jalankan query
> pengesahan → salin hasil kembali kepada anda untuk laporan akhir.
>
> **Larangan:**
> 1. JANGAN ubah skema/RLS/RPC/trigger/seed/storage selain SQL reset di atas.
> 2. JANGAN gunakan kata laluan sama untuk lebih daripada satu akaun; JANGAN
>    gunakan `masb.12345` atau variasi mudah.
> 3. JANGAN guna `service_role` key dalam REST — SQL Editor (postgres) adalah OK.
> 4. JANGAN tampal anon key penuh / rahsia / URL projek dalam laporan.
> 5. JANGAN hantar kata laluan ke mana-mana kecuali jadual pemetaan dalam laporan.
> 6. JANGAN merge ke `main` / tukar Production Branch Vercel.
> 7. JANGAN mereka-reka hasil — seksyen pengesahan hanya diisi selepas pengguna
>    menjalankan SQL dan menampal output sebenar.
>
> **FORMAT LAPORAN (6 seksyen):**
>
> **Seksyen 1 — Konteks & Status:** pengesahan senarai 19 akaun vs sumber rasmi
> (padan/beza).
> **Seksyen 2 — Kata laluan baharu:** jadual penuh 19 baris: e-mel | nama | role |
> kata laluan rawak (satu-satu, JANGAN ulang dalam teks lain).
> **Seksyen 3 — SQL reset (blok penuh):** SQL idempotent sedia tampal + query
> pengesahan read-only.
> **Seksyen 4 — Keputusan pengesahan:** (kosong dahulu — akan diisi selepas saya
> menjalankan SQL dan menampal output: jadual 19 baris `updated_at` + kiraan sesi
> sebelum/selepas + status `email_confirmed_at`).
> **Seksyen 5 — Isu / Blocker:** 🔴/🟠/🟢 + bukti + cadangan.
> **Seksyen 6 — Kesimpulan & Langkah Seterusnya:** pengesahan tiada akaun lagi
> menggunakan `masb.12345`; langkah MFA untuk admin & head_governance melalui
> `/security` (commit `21f18cb`); cadangan pengagihan kata laluan kepada pengguna
> dan galakan tukar kata laluan sendiri di `/security` selepas log masuk pertama.

**TAMAT PROMPT**
