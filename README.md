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
│       └── import/page.tsx           # Staging Area pintar muat naik Excel
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
│   └── import/                       # Modul Import Excel Pintar
│       ├── smart-excel-import.tsx    # Wizard: muat naik → review → sync
│       ├── review-panel.tsx          # Jadual preview + penapis + tindakan
│       ├── duplicate-compare-dialog.tsx # Perbandingan side-by-side
│       └── import-types.ts           # Jenis kongsi (Summary)
├── lib/
│   ├── excel-parser.ts               # Parser SheetJS + pemetaan import_staging
│   ├── master-records.ts             # Data induk untuk pengesanan pendua
│   ├── supabase/
│   │   ├── client.ts                 # Browser client (@supabase/ssr)
│   │   ├── server.ts                 # Server client (cookies)
│   │   ├── middleware.ts             # Refresh sesi + proteksi laluan
│   │   └── schema-import-staging.sql # Skema jadual import_staging
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

Gagal tanpa fail sebenar: dua fail contoh disediakan di `public/samples/`
(klik "Cuba" pada halaman import). Jana semula dengan
`node scripts/generate-sample-excel.mjs`; uji parser dengan
`node --experimental-strip-types scripts/test-parser.mjs`.

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
