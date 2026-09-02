# Prompt Lengkap untuk ChatGPT — Pemasangan & Pentadbiran TPMS

Dokumen ini mengandungi **prompt siap-tampal** untuk dihantar kepada ChatGPT
setiap kali bantuan diperlukan untuk:

1. Menarik fail dari repositori GitHub
2. Memasang skema pangkalan data di Supabase
3. Men-deploy ke Vercel
4. Menyemak/membaiki ralat
5. Menjana data ujian

Setiap prompt diakhiri dengan **FORMAT LAPORAN** yang MESTI ChatGPT penuhi
selepas selesai tugasan — supaya hasilnya boleh disemak dengan cepat.

---

## CARA GUNA

1. Salin prompt yang sesuai.
2. Tampal di ChatGPT (sebaiknya dengan **web browsing / code interpreter**
   diaktifkan supaya ia boleh akses GitHub dan menyemak fail).
3. Selepas ChatGPT siap, semak laporannya mengikut format yang diminta.
4. Jika ada langkah yang gagal, hantar semula prompt yang sama + minta
   ChatGPT tampal log ralat penuh.

---

## ALIRAN FASA A (WAJIB) — Persona + Peta Kod

> **Mulai fasa ini, SETIAP prompt baharu MESTI mengikut**
> `docs/PROMPT-TEMPLATE-FASA.md`:
>
> 1. **Persona tetap** (`docs/personas/`) — pilih ikut jenis tugasan
>    (SQL-Architect / QA-UAT / Security-Review / BA-Laporan).
> 2. **Peta kod terkini** (`docs/CODEBASE-MAP.md`) — lampirkan sebagai konteks
>    (jana semula dengan `node scripts/codebase-map.mjs` sebelum setiap fasa).
> 3. **Blok tugasan + larangan + FORMAT LAPORAN 6 seksyen** seperti templat.
>
> Prompt lama di bawah (Prompt 1 dan seterusnya) kekal sebagai rujukan
> sejarah — guna templat Fasa A untuk tugasan baharu.

---

## PROMPT 1 — Pasang Pangkalan Data di Supabase (Tugasan Utama)

> **Peranan kamu:** Jurutera pangkalan data yang teliti dan berhati-hati.
>
> **Tugas:** Pasang skema pangkalan data untuk sistem TPMS MIMOS Academy
> dari repositori GitHub `SaidRazak881/masb_pms_v4` ke projek Supabase saya.
>
> **Langkah:**
>
> 1. Muat turun fail-fail SQL berikut dari repositori GitHub
>    `SaidRazak881/masb_pms_v4` (folder `lib/supabase/`):
>    - `schema-master.sql`
>    - `schema-import-staging.sql`
>    - `sync-import-transaction.sql`
>    - `governance-lock.sql`
>    - `change-requests.sql`
>    - (pilihan) `seed-v4-raw.sql`
>    - (pilihan) `migrations/v4-raw-data-inserts.sql`
> 2. Baca SETIAP fail SQL dengan teliti dan senaraikan:
>    - jenis (enum) yang dicipta
>    - jadual yang dicipta
>    - fungsi/RPC yang dicipta
>    - polisi RLS yang dicipta
>    - rujukan silang antara fail (cth. fungsi yang memanggil fungsi lain)
> 3. Sediakan **skrip SQL gabungan** yang menjalankan fail-fail tersebut
>    dalam urutan yang betul (schema-master → import-staging →
>    sync-import-transaction → governance-lock → change-requests).
>    Setiap bahagian mesti dibalut dengan `BEGIN; ... COMMIT;` dan
>    `CREATE ... IF NOT EXISTS` untuk boleh dijalankan semula dengan selamat.
> 4. Berikan saya skrip tersebut dalam satu blok kod, sedia untuk ditampal
>    ke Supabase SQL Editor.
> 5. Senaraikan dengan jelas: (a) bahagian yang perlu saya jalankan manual
>    (cth. create user di Auth), (b) apa yang perlu disemak selepas
>    pemasangan.
>
> **AMARAN:**
> - JANGAN ubah suai logik perniagaan dalam SQL (nama jadual, polisi RLS,
>   peraturan lock, fungsi audit).
> - JANGAN gunakan `DROP TABLE` atau `DROP TYPE` tanpa kebenaran.
> - Jika anda menemui ralat dalam SQL (cth. fungsi yang dipanggil tetapi
>   tidak wujud), JANGAN senyap — hentikan dan laporkan dengan jelas.
>
> **FORMAT LAPORAN YANG MESTI DIKUMPULKAN:**
>
> ```
> 📋 LAPORAN PEMASANGAN SUPABASE
> ==============================
> 1. STATUS: ✅ BERJAYA / ❌ GAGAL / ⚠️ SEBAHAGIAN
>
> 2. FAIL YANG DIBACA:
>    - [ ] schema-master.sql (X jadual, Y enum, Z polisi RLS)
>    - [ ] schema-import-staging.sql (...)
>    - [ ] sync-import-transaction.sql (...)
>    - [ ] governance-lock.sql (...)
>    - [ ] change-requests.sql (...)
>
> 3. URUTAN PELAKSANAAN YANG DISARANKAN:
>    1) schema-master.sql
>    2) schema-import-staging.sql
>    3) sync-import-transaction.sql
>    4) governance-lock.sql
>    5) change-requests.sql
>
> 4. SKRIP SQL GABUNGAN: (blok kod penuh di bawah)
>
> 5. LANGKAH MANUAL YANG PERLU SAYA BUAT:
>    - [ ] Cipta pengguna di Authentication
>    - [ ] Insert user_profiles
>    - [ ] Cipta storage bucket
>
> 6. SEMAKAN SELEPAS PASANG (SQL yang perlu saya jalankan):
>    (senarai query SELECT untuk mengesahkan jadual/wujud)
>
> 7. ISU/RISIKO YANG DITEMUI:
>    - (senaraikan apa-apa ralat atau kebergantungan yang tidak lengkap)
> ```

---

## PROMPT 2 — Semak Keadaan Pangkalan Data Selepas Pemasangan

> **Peranan kamu:** Juruaudit pangkalan data.
>
> **Tugas:** Saya telah menjalankan skrip pemasangan TPMS di Supabase SQL
> Editor. Saya akan tampal output/ralat di bawah. Semak sama ada pemasangan
> lengkap dan selamat.
>
> **(Tampal di sini: output SQL Editor / mesej ralat)**
>
> **FORMAT LAPORAN:**
>
> ```
> 📋 LAPORAN AUDIT PEMASANGAN
> ===========================
> 1. STATUS: ✅ LENGKAP / ❌ TIDAK LENGKAP
> 2. JADUAL DISAHKAN WUJUD:
>    - [ ] programmes
>    - [ ] organizers
>    - [ ] participants
>    - [ ] financial_docs
>    - [ ] programme_costs
>    - [ ] programme_documents
>    - [ ] audit_logs
>    - [ ] import_batches / import_staging
>    - [ ] programme_unlock_requests
>    - [ ] change_requests
>    - [ ] user_profiles
> 3. FUNGSI/RPC DISAHKAN:
>    - [ ] sync_import_transaction
>    - [ ] request_programme_unlock / review_programme_unlock / lock_programme
>    - [ ] submit_change_request / review_change_request / cancel_change_request
>    - [ ] current_user_id / current_user_role / log_audit
> 4. RLS: (senarai jadual yang RLS diaktifkan)
> 5. RALAT YANG DITEMUI: (senaraikan + cara membetulkan)
> 6. CADANGAN: (langkah seterusnya)
> ```

---

## PROMPT 3 — Deploy ke Vercel (Tugasan Utama)

> **Peranan kamu:** Jurutera deployment yang teliti.
>
> **Tugas:** Saya mahu men-deploy aplikasi Next.js TPMS MIMOS Academy dari
> repositori GitHub `SaidRazak881/masb_pms_v4` ke Vercel, disambungkan
> dengan Supabase.
>
> **Langkah:**
>
> 1. Baca `package.json`, `next.config.mjs`, `.env.example`, `middleware.ts`
>    dan `lib/supabase/server.ts` dari repositori.
> 2. Berikan arahan **langkah demi langkah** (tepat, boleh salin-tampal)
>    untuk:
>    a. Import repositori ke Vercel (vercel.com/new)
>    b. Tetapkan Environment Variables yang diperlukan:
>       - `NEXT_PUBLIC_SUPABASE_URL`
>       - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
>    c. Menjalankan deploy pertama
> 3. Berikan **senarai semak selepas deploy** (halaman yang perlu diuji:
>    /login, /dashboard, /programmes, /import, /participants, /reports).
> 4. Jika build gagal, minta saya tampal log dan analisa punca.
>
> **FORMAT LAPORAN:**
>
> ```
> 📋 LAPORAN DEPLOY VERCEL
> ========================
> 1. STATUS: ✅ SIAP / ❌ GAGAL
> 2. KEPERLUAN ENV: (jadual nama env + nilai contoh + skop)
> 3. LANGKAH DEPLOY: (nombor langkah yang jelas)
> 4. URL PRODUCTION: (bila siap)
> 5. SEMAKAN SELEPAS DEPLOY: (senarai semak)
> 6. ISU & PENYELESAIAN: (jika ada)
> ```

---

## PROMPT 4 — Analisis Ralat Build / Runtime

> **Peranan kamu:** Jurutera debugging Next.js + Supabase.
>
> **Tugas:** Aplikasi TPMS saya menghadapi ralat berikut. Analisa punca dan
> berikan penyelesaian tepat (fail mana yang perlu diubah + kod gantian).
>
> **Konteks teknologi:** Next.js 14 (App Router), TypeScript, Tailwind,
> shadcn/ui, Supabase (@supabase/ssr), SheetJS (xlsx). Server actions
> diletakkan dalam fail dengan `"use server"` — ingat: fail sebegini TIDAK
> boleh mengeksport fungsi sinkron; logik tulen mesti berada dalam modul
> biasa (cth. `lib/programme-mapper.ts`, `lib/import-shared.ts`).
>
> **(Tampal di sini: mesej ralat penuh / log build / log runtime)**
>
> **FORMAT LAPORAN:**
>
> ```
> 📋 LAPORAN DEBUG
> ===============
> 1. PUNCA UTAMA: (satu ayat jelas)
> 2. FAIL TERJEJAS: (senarai laluan fail)
> 3. PENYELESAIAN: (langkah + kod gantian, jika perlu)
> 4. UJIAN UNTUK SAHKAN:
>    - (arahan npm/build/curl untuk mengesahkan)
> 5. RISIKO SAMPINGAN: (kesan perubahan pada modul lain)
> ```

---

## PROMPT 5 — Isi Data Ujian / Semak Konsistensi Data

> **Peranan kamu:** Jurutera data.
>
> **Tugas:** Saya perlu menyemak/mengisi data ujian untuk TPMS MIMOS
> Academy. Fail Excel mentah berada dalam folder `V4 RAW` repositori
> `SaidRazak881/masb_pms_v4`:
>
> - `00. Quotation Tracker (1).xlsx` — senarai quotation
> - `R1 MIMOS_Academy_INCOME_STATEMENT.xlsx` — invois + cost of sale
> - `R2 Overall Report 2026 (1).xlsx` — kehadiran & Bumiputera
> - `R3 Group 2026 Funnel Tracker.xlsx` — sales funnel
> - `invoice_2026.xlsx` — invois 2026
> - `cost_of_sales_2026.xlsx` — kos jualan
> - `User Profiles Mapping.xlsx` — pengguna sistem
>
> **Langkah:**
> 1. Muat turun fail-fail tersebut dan baca strukturnya.
> 2. Semak sama ada data dalam `lib/supabase/seed-v4-raw.sql` dan
>    `lib/supabase/migrations/v4-raw-data-inserts.sql` konsisten dengan
>    fail Excel (bilangan baris, nilai invois, nama organisasi).
> 3. Lapor sebarang percanggahan (cth. jumlah tidak sama, ejaan berbeza).
> 4. Jika perlu, jana SQL INSERT pembetulan.
>
> **FORMAT LAPORAN:**
>
> ```
> 📋 LAPORAN SEMAKAN DATA V4 RAW
> ==============================
> 1. SENARAI FAIL + SHEET: (nama fail | sheet | bilangan baris data)
> 2. PERBANDINGAN DENGAN SEED SQL:
>    | Sumber Excel | Dalam SQL? | Catatan |
>    |--------------|------------|---------|
> 3. PERCANGGAHAN DITEMUI: (senarai)
> 4. SQL PEMBETULAN (jika ada): (blok kod)
> 5. STATUS: ✅ KONSISTEN / ⚠️ PERLUKAN PEMBETULAN
> ```

---

## PROMPT 6 — Tambah Medan / Jadual Baharu (Perubahan Skema)

> **Peranan kamu:** Jurutera pangkalan data yang berhati-hati.
>
> **Tugas:** Saya perlu menambah <terangkan perubahan: medan/jadual/fungsi
> baharu> pada sistem TPMS MIMOS Academy.
>
> **Konteks:** Skema sedia ada dalam `lib/supabase/schema-master.sql`
> (jadual: programmes, participants, financial_docs, dll.). Peraturan
> sistem:
> - Setiap perubahan mesti menggunakan `ALTER TABLE ... ADD COLUMN IF NOT
>   EXISTS` supaya boleh dijalankan semula dengan selamat.
> - Audit log: setiap perubahan data mesti melalui `public.log_audit()`.
> - RLS: polisi `SELECT` untuk authenticated; `UPDATE` hanya jika program
>   tidak dikunci ATAU pengguna head_governance/admin.
> - Perubahan skema mesti disertakan SQL rollback (untuk ujian).
>
> **(Terangkan perubahan yang dikehendaki di sini)**
>
> **FORMAT LAPORAN:**
>
> ```
> 📋 LAPORAN PERUBAHAN SKEMA
> ==========================
> 1. PERUBAHAN: (ringkasan)
> 2. SQL MIGRASI (forward): (blok kod)
> 3. SQL ROLLBACK: (blok kod)
> 4. KESAN PADA MODUL LAIN:
>    - Types (lib/types.ts): (medan yang perlu ditambah)
>    - Server actions: (fungsi yang perlu dikemas kini)
>    - UI: (komponen yang terjejas)
> 5. UJIAN CADANGAN: (query/arahan untuk mengesahkan)
> ```

---

## PROMPT 7 — Tutorial / Penjelasan Aliran Sistem (untuk team)

> **Peranan kamu:** Jurulatih sistem yang berpengalaman.
>
> **Tugas:** Terangkan aliran kerja berikut dalam TPMS MIMOS Academy dengan
> bahasa Melayu yang mudah difahami, untuk team MIMOS Academy (bukan
> programmer):
>
> 1. Staff menerima fail Excel quotation/invois dari penganjur → apa yang
>    berlaku apabila dimuat naik di /import?
> 2. Apakah itu "confidence score" dan apa perbezaan tindakan pada
>    100% / 90–99% / 70–89% / bawah 70%?
> 3. Apakah itu staging area dan kenapa data tidak terus masuk ke jadual
>    utama?
> 4. Apakah itu lock governance dan bagaimana staff memohon ubah data?
> 5. Bagaimana Head Governance meluluskan permohonan?
> 6. Apakah perbezaan "My Programmes" dan "All Programmes"?
>
> Gunakan analogi mudah dan contoh senario sebenar (cth. program
> "Train The Trainer (TTT)" untuk KENANGA INVESTOR BERHAD).
>
> **FORMAT LAPORAN:**
>
> ```
> 📋 PANDUAN TEAM (BAHASA MELAYU)
> ===============================
> 1. ALIRAN IMPORT EXCEL: (langkah bernombor + gambar rajah teks)
> 2. CONFIDENCE SCORE: (jadual skor → tindakan)
> 3. STAGING AREA: (kenapa perlu 3 peringkat)
> 4. LOCK & CHANGE REQUEST: (aliran langkah demi langkah)
> 5. SOALAN LAZIM (FAQ): (5 soalan + jawapan)
> ```

---

## PROMPT 8 — Eksport Data / Laporan Baharu (untuk admin)

> **Peranan kamu:** Jurutera laporan.
>
> **Tugas:** Saya mahu menambah jenis laporan baharu pada modul /reports
> TPMS MIMOS Academy: <nama laporan + senarai kolum + penapis yang dikehendaki>.
>
> **Konteks:** Laporan dibina dalam `lib/reporting.ts` menggunakan corak:
> - `ReportType` (union type) — tambah nilai baharu
> - `REPORT_TYPES` (metadata: label + description)
> - `REPORT_TYPE_ORDER` (urutan tab)
> - fungsi `buildXxxRows(programmes)` — bina `ReportRow[]`
> - `COLUMNS` (definisi kolum) + `ROW_BUILDERS` (pemetaan)
> - Eksport Excel automatik melalui `lib/report-excel.ts` (SheetJS).
>
> Berikan kod lengkap untuk setiap bahagian di atas, dan sahkan tiada
> bahagian lain yang perlu diubah.
>
> **FORMAT LAPORAN:**
>
> ```
> 📋 LAPORAN LAPORAN BAHARU
> =========================
> 1. NAMA JENIS: (cth. "executive_summary")
> 2. KOD PERUBAHAN:
>    - lib/reporting.ts (blok kod penuh untuk setiap bahagian)
> 3. KOLUM: (senarai)
> 4. PENAPIS YANG BERKENAAN: (senarai)
> 5. CONTOH OUTPUT: (jadual contoh 3 baris)
> 6. SEMAKAN: (arahan build/ujian)
> ```

---

## Format Laporan Am (jika ChatGPT tidak ikut format di atas)

Jika ChatGPT memberikan jawapan tanpa format, hantar mesej ini:

> Sila semak semula jawapan anda dan susun mengikut FORMAT LAPORAN yang
> saya minta sebelum ini. Ia mesti mengandungi:
> 1. STATUS: ✅/❌/⚠️
> 2. Apa yang telah dilakukan (senarai)
> 3. Fail yang terjejas/berkenaan
> 4. Langkah seterusnya yang perlu saya buat secara manual (jika ada)
> 5. Isu/risiko yang ditemui
> Jangan tinggalkan mana-mana bahagian kosong.
