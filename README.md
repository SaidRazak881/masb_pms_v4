# TPMS — Training Programme Management System

Sistem Pengurusan Program Latihan untuk **MIMOS Academy** (fasa asas / Mock UI).
Dibina dengan **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS** dan
komponen **shadcn/ui** (Radix UI).

## Struktur Projek

```
.
├── app/
│   ├── layout.tsx                    # Root layout (html, metadata, font)
│   ├── page.tsx                      # Redirect ke /programmes
│   ├── globals.css                   # Design tokens (CSS variables) + Tailwind
│   ├── (auth)/
│   │   ├── layout.tsx                # Layout berpusat untuk halaman auth
│   │   └── login/page.tsx            # Halaman log masuk (mock Supabase Auth)
│   └── (dashboard)/
│       ├── layout.tsx                # Shell: sidebar + header
│       ├── programmes/
│       │   ├── page.tsx              # Senarai program (My / All, filter)
│       │   └── [id]/page.tsx         # Perincian program + 6 tab
│       ├── import/page.tsx           # Staging Area pintar muat naik Excel
│       └── reports/page.tsx          # Report Builder & Export Excel
├── components/
│   ├── ui/                           # Komponen shadcn/ui
│   │   ├── button.tsx  card.tsx  badge.tsx  input.tsx  label.tsx
│   │   ├── select.tsx  tabs.tsx  table.tsx  dialog.tsx
│   ├── layout/sidebar-nav.tsx        # Navigasi sidebar (active state)
│   ├── programmes/
│   │   ├── programmes-browser.tsx    # Tab + filter + jadual senarai
│   │   ├── programme-detail-tabs.tsx # Tab container halaman perincian
│   │   ├── status-badges.tsx         # Badge status (program / kewangan / Bumi)
│   │   └── detail/
│   │       ├── overview-tab.tsx      # Overview + statistik
│   │       ├── financial-tab.tsx     # Quotation / PO / Invoice
│   │       ├── participants-tab.tsx  # Peserta + pengesahan Bumiputera
│   │       ├── costs-tab.tsx         # Bajet vs sebenar + varians
│   │       ├── documents-tab.tsx     # Senarai dokumen
│   │       └── audit-trail-tab.tsx   # Garis masa audit
│   ├── governance/                   # Modul Governance Lock & Request Unlock
│   │   ├── lock-banner.tsx           # Banner kunci program
│   │   ├── request-unlock-dialog.tsx # Dialog permohonan buka kunci
│   │   ├── unlock-approval-card.tsx  # Kad lulus/tolak permohonan
│   │   ├── unlock-request-history.tsx# Sejarah permohonan
│   │   ├── governance-panel.tsx      # Panel tadbir urus gabungan
│   │   └── index.ts                  # Barrel eksport
│   ├── reports/                      # Modul Report Builder & Export Excel
│   │   ├── report-builder.tsx        # Wizard laporan: jenis → filter → preview
│   │   └── index.ts                  # Barrel eksport
│   └── import/                       # Modul Import Excel Pintar
│       ├── smart-excel-import.tsx    # Wizard: muat naik → review → sync
│       ├── review-panel.tsx          # Jadual preview + penapis + tindakan
│       ├── duplicate-compare-dialog.tsx # Perbandingan side-by-side
│       └── import-types.ts           # Jenis kongsi (Summary)
├── lib/
│   ├── excel-parser.ts               # Parser SheetJS + pemetaan import_staging
│   ├── import-api.ts                 # Sambungan UI → POST /api/import/sync
│   ├── master-records.ts             # Data induk (Supabase / mock) untuk pendua
│   ├── governance.ts                 # Logik tulen Governance Lock (Langkah 5)
│   ├── governance-actions.ts         # Server Actions Governance (Langkah 5)
│   ├── reporting.ts                  # Logik tulen Report Builder (Langkah 6)
│   └── report-excel.ts               # Pengeksport SheetJS → .xlsx (Langkah 6)
│   ├── supabase/
│   │   ├── client.ts                 # Browser client (@supabase/ssr)
│   │   ├── server.ts                 # Server client (cookies)
│   │   ├── middleware.ts             # Refresh sesi + proteksi laluan
│   │   ├── schema-import-staging.sql # Skema jadual import_staging
│   │   └── sync-import-transaction.sql # RPC transaksi atomic sync_import_transaction
│   ├── types.ts                      # Entiti domain (Programme, Participant, ...)
│   ├── mock-data.ts                  # Data mock (6 program lengkap)
│   ├── format.ts                     # formatMYR, formatDate, ...
│   └── utils.ts                      # cn() helper (shadcn)
├── public/samples/                   # Fail Excel contoh untuk ujian parser
│   ├── 00. Quotation Tracker (1).xlsx
│   └── R1 MIMOS_Academy_INCOME_STATEMENT.xlsx
├── scripts/
│   ├── generate-sample-excel.mjs     # Jana fail Excel contoh
│   └── test-parser.mjs               # Ujian parser terhadap fail contoh
├── middleware.ts                     # Entry middleware Next.js
├── components.json                   # Konfigurasi shadcn/ui CLI
├── tailwind.config.ts
├── tsconfig.json
└── .env.example
```

## Modul Import Excel Pintar

Halaman **/import** menerima fail Excel operasi MIMOS Academy dan
menyediakannya dalam Staging Area sebelum ditulis ke pangkalan data induk.

**Parser (`lib/excel-parser.ts`, berasaskan `xlsx`/SheetJS):**

- **Pengesanan automatik jenis sheet** — `Quotation Tracker` (sebut harga),
  `Income Statement` (invois) atau `Cost of Sale`, berdasarkan nama sheet
  + teks banner/pengepala.
- **Pemetaan pengepala fuzzy** — setiap medan kanonik menerima berpuluh-puluh
  variasi nama lajur (BM & English, cth. "No. Sebut Harga", "Invoice No",
  "Nilai (RM)", "Tarikh", "Amaun") dengan sistem skor + bonus isyarat
  (RM/$/No./Tarikh).
- **Berbilang jadual dalam satu sheet** — cth. sheet Income Statement yang
  mengandungi seksyen INVOICE diikuti banner "COST OF SALES" dengan pengepala
  tersendiri; baris "JUMLAH/TOTAL" dan baris kosong dilangkau.
- **Pengesanan data bertindih** — padanan rujukan tepat (quotation/invoice
  yang sudah wujud, keyakinan tinggi) dan persamaan gelaran program
  (token Jaccard, ≥80% tinggi / ≥50% sederhana) terhadap data induk.
- **Pengesahan lajur wajib** mengikut jenis entiti (sebut harga/invois
  perlukan rujukan + pelanggan + amaun + program; kos perlukan amaun +
  program/item).
- **Output** dipetakan terus kepada jadual `import_staging`
  (lihat `toStagingRows()` dan skema SQL di
  `lib/supabase/schema-import-staging.sql`).

**Staging Review Screen (`/import`):**

- Jadual preview setiap baris: jenis entiti, rujukan, program, pelanggan,
  amaun, tarikh + ralat/amaran (lajur wajib kosong ditanda merah).
- Butang amaran pendua membuka **Dialog Perbandingan Side-by-Side**
  (data Excel vs rekod induk, medan berbeza diserlahkan).
- Tindakan manual per-baris & pukal:
  **Confirm & Sync to Master**, **Merge with Existing Record**,
  **Create New Programme**, **Discard** (dengan Buat Asal).
- Penapis: Semua / Sah / Bermasalah / Disyaki pendua.

### Penyegerakan ke Jadual Induk (Langkah 4.5)

UI import kini dipautkan terus kepada API transaksi atomic. Aliran penuh
butang **Confirm & Sync to Master**:

```
Excel → parser → import_batches + import_staging
      → POST /api/import/sync → RPC sync_import_transaction() → jadual induk
```

- **`lib/import-api.ts`** — satu-satunya lapisan yang bercakap dengan
  pelayan. Ia mementaskan batch ke Supabase, memetakan `StagingRecord`
  kepada kontrak JSON API (`camelCase` → `snake_case` diuruskan oleh route),
  mengesahkan payload di klien (cermin `validateBody()` pelayan), dan
  menterjemah kod ralat kepada mesej Bahasa Melayu.
- **`lib/master-records.ts`** — `fetchMasterRecords()` membaca `programmes`
  + `invoices` sebenar daripada Supabase supaya pengesanan pendua
  membandingkan fail Excel dengan data pengeluaran. Ini penting kerana
  `matchId` menjadi **UUID sebenar**, membolehkan tindakan *Merge*
  menghantar `duplicateMatchId` yang sah (RPC menolak nilai bukan-UUID).
- **Pengendalian ralat** — `UNAUTHENTICATED` (401), `RLS_OR_ROLE_DENIED`
  (403), `GOVERNANCE_LOCKED` (409, program dikunci Governance),
  `DUPLICATE_ERROR` / `FOREIGN_KEY_ERROR` (409),
  `DATA_VALIDATION_ERROR` (422) dan `SYNC_TRANSACTION_FAILED` (500)
  dipaparkan beserta panduan pemulihan. Kegagalan **tidak** menukar fasa
  wizard — pengguna kekal di panel review untuk membetulkan dan mencuba
  semula, kerana transaksi atomic bermakna tiada perubahan separa disimpan.
- **Mod demo** — tanpa env Supabase, aliran yang sama dijalankan secara
  simulasi tempatan supaya UI kekal boleh diuji tanpa pangkalan data.

Pasang RPC dengan menjalankan `lib/supabase/schema-import-staging.sql`
diikuti `lib/supabase/sync-import-transaction.sql` dalam Supabase SQL Editor.

Gagal tanpa fail sebenar: dua fail contoh disediakan di `public/samples/`
(klik "Cuba" pada halaman import). Jana semula dengan
`node scripts/generate-sample-excel.mjs`; uji parser dengan
`node --experimental-strip-types scripts/test-parser.mjs`.

## Modul Governance Lock & Request Unlock (Langkah 5)

Program yang telah dikunci (`locked = true`) adalah rekod audit yang tidak boleh
disunting terus. Untuk menyunting, pengguna menghantar *Permohonan Buka Kunci*
dengan justifikasi, diluluskan oleh peranan berautoriti (Manager/Admin, tanpa
self-approval), lalu membuka tetingkap suntingan bertempoh (default 24 jam).

- **`lib/governance.ts`** — logik tulen: hierarki peranan, pengesahan permohonan,
  peralihan keadaan, pengiraan tamat tempoh, dan peraturan *no self-approval*.
- **`lib/governance-actions.ts`** — Server Actions (`mohon`, `lulus/tolak`,
  `kunci semula`, `batal`) yang memanggil RPC atomik dalam
  `lib/supabase/governance-lock.sql`; mod demo tanpa Supabase.
- **`components/governance/*`** — `LockBanner`, `RequestUnlockDialog`,
  `UnlockApprovalCard`, `UnlockRequestHistory` dan `GovernancePanel`.
- **`app/(dashboard)/programmes/[id]/page.tsx`** — integrasi panel tadbir urus
  dan keadaan *boleh sunting* program.

## Modul Report Builder & Export Excel (Langkah 6)

Halaman **/reports** membina laporan program latihan dan mengeksportnya ke fail
Excel (.xlsx) menggunakan SheetJS (`xlsx`) — konsisten dengan parser import.

- **`lib/reporting.ts`** — logik tulen: empat jenis laporan (`programme_summary`,
  `financial`, `participants`, `costs`), penapis (tahun/kategori/status), metrik
  ringkasan dan struktur `ReportResult` (kolom + baris) yang agnostik medium.
- **`lib/report-excel.ts`** — `buildSheet()` / `buildWorkbook()` / `downloadReport()`
  menukar `ReportResult` kepada fail `.xlsx` (satu sheet "Laporan").
- **`components/reports/report-builder.tsx`** — wizard laporan: pilih jenis →
  penapis → kad metrik → jadual preview → butang **Eksport Excel**.
- **`app/(dashboard)/reports/page.tsx`** — halaman laporan; item "Laporan" dalam
  sidebar kini aktif (dahulunya `disabled`).

## Bermula

```bash
npm install
cp .env.example .env.local   # isikan URL & anon key Supabase (pilihan untuk mock)
npm run dev
```

Buka http://localhost:3000 — halaman utama akan mengalih ke `/programmes`.
Log masuk boleh diakses di `/login` (borang demo; klik "Log Masuk" untuk
meneruskan tanpa pelayan Supabase).

## Nota Integrasi Supabase

- `lib/supabase/client.ts` — guna dalam Client Components / event handler.
- `lib/supabase/server.ts` — guna dalam Server Components & Server Actions.
- `lib/supabase/middleware.ts` — menyegarkan token sesi dan melindungi laluan
  `/programmes`, `/import`, `/dashboard`. Tanpa env Supabase, aplikasi berjalan
  dalam mod demo (semua laluan dibenarkan).
- Semua data paparan ketika ini datang daripada `lib/mock-data.ts` dan akan
  digantikan dengan query Supabase (jadual `programmes`, `participants`,
  `financial_docs`, `cost_items`, `documents`, `audit_logs`).

## Skrip

| Arahan         | Penerangan                          |
| -------------- | ----------------------------------- |
| `npm run dev`  | Pelayan pembangunan                 |
| `npm run build`| Binaan pengeluaran                  |
| `npm start`    | Jalankan binaan pengeluaran         |
| `npm run lint` | Lint ESLint                         |
