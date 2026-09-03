# TPMS — Training Programme Management System

Sistem Pengurusan Program Latihan untuk **MIMOS Academy**.
Dibina dengan **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**,
komponen **shadcn/ui** (Radix UI) dan **Supabase** (PostgreSQL, Auth, RLS,
Storage). Aplikasi berjalan dalam **Mod Demo** (mock data) tanpa env
Supabase dan bertukar kepada data sebenar sebaik sahaja env diisi.

## Modul Sistem

| Modul | Halaman | Penerangan |
| ----- | ------- | ---------- |
| Dashboard | `/dashboard` | KPI program mengikut status, program aktif bulan ini, import tertunda, program dikunci, invois belum bayar, pecahan kategori & penganjur, ringkasan kewangan, aktiviti terkini, kelulusan belum diputuskan |
| Program | `/programmes` | Senarai program (My / All), carian & penapis; perincian program dengan tab Overview, Financial, Participants, Costs, Documents, Audit Trail, Change Requests |
| Import Excel | `/import` | Muat naik Excel pintar → staging → semakan → sync atomik; tab **Sejarah Import** memaparkan semua batch & baris staging |
| Peserta | `/participants` | Senarai peserta merentas program, penapis status Bumiputera (deklarasi), organisasi, kehadiran & sijil |
| Laporan | `/reports` | 8 jenis laporan + eksport **Excel (.xlsx)** |
| Governance | dalam `/programmes/[id]` | Lock/unlock program, permohonan buka kunci, **Change Requests** (mohon ubah data program terkunci) + kelulusan Head Governance |
| Audit | dalam `/programmes/[id]` | Audit trail bagi create, update, import, lock, change request |
| Pengesahan | `/login`, `/register`, `/forgot-password`, `/security` | E-mel + kata laluan sahaja (**tiada MFA**); kata laluan lalai `masb.12345` dengan tuntutan wajib tukar; pendaftaran sendiri (menunggu kelulusan); set semula kata laluan |
| Admin Pengguna | `/admin/users` | **Khas Super Admin** — lulus permohonan, sekat/nyahsekat, set semula kata laluan, tukar role, wajibkan tukar kata laluan |

## Struktur Projek

```
.
├── app/
│   ├── layout.tsx                    # Root layout (html, metadata, font)
│   ├── page.tsx                      # Redirect ke /dashboard
│   ├── globals.css                   # Design tokens (CSS variables) + Tailwind
│   ├── (auth)/
│   │   ├── layout.tsx                # Layout berpusat untuk halaman auth
│   │   ├── login/page.tsx            # Log masuk (e-mel + kata laluan sahaja)
│   │   ├── register/page.tsx         # Pendaftaran akaun baharu → status pending
│   │   ├── forgot-password/page.tsx  # Set semula kata laluan melalui e-mel
│   │   ├── pending-approval/page.tsx # Status: menunggu kelulusan Super Admin
│   │   └── account-blocked/page.tsx  # Status: akaun disekat
│   └── (dashboard)/
│       ├── layout.tsx                # Shell: sidebar + header
│       ├── dashboard/page.tsx        # Dashboard KPI + aktiviti
│       ├── programmes/
│       │   ├── page.tsx              # Senarai program (My / All, filter)
│       │   └── [id]/page.tsx         # Perincian program + 7 tab
│       ├── participants/page.tsx     # Senarai peserta seluruh organisasi
│       ├── import/page.tsx           # Muat naik Excel (tab) + Sejarah Import
│       ├── reports/page.tsx          # Report Builder & Export Excel
│       ├── security/page.tsx         # Tukar kata laluan (wajib jika masih lalai)
│       └── admin/users/page.tsx      # Dashboard Super Admin — pengurusan pengguna
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
│   ├── governance/                   # Modul Governance Lock, Unlock & Change Requests
│   │   ├── lock-banner.tsx           # Banner kunci program
│   │   ├── request-unlock-dialog.tsx # Dialog permohonan buka kunci
│   │   ├── unlock-approval-card.tsx  # Kad lulus/tolak permohonan
│   │   ├── unlock-request-history.tsx# Sejarah permohonan
│   │   ├── change-request-dialog.tsx # Borang mohon ubah data (program terkunci)
│   │   ├── change-request-inbox.tsx  # Kad kelulusan Head Governance
│   │   ├── change-request-history.tsx# Sejarah permohonan ubah data
│   │   ├── governance-panel.tsx      # Panel tadbir urus gabungan
│   │   └── index.ts                  # Barrel eksport
│   ├── admin/
│   │   └── user-management.tsx       # Dashboard Super Admin (KPI, kelulusan,
│   │                                 #   sekat, role, reset kata laluan)
│   ├── security/
│   │   └── account-guard.tsx         # Semakan semula status akaun (sisi klien)
│   ├── reports/                      # Modul Report Builder & Export Excel
│   │   ├── report-builder.tsx        # Wizard laporan: jenis → filter → preview
│   │   └── index.ts                  # Barrel eksport
│   └── import/                       # Modul Import Excel Pintar
│       ├── smart-excel-import.tsx    # Wizard: muat naik → review → sync
│       ├── review-panel.tsx          # Jadual preview + penapis + tindakan
│       ├── duplicate-compare-dialog.tsx # Perbandingan side-by-side
│       ├── import-history.tsx        # Sejarah batch import (kembang/tutup)
│       └── import-types.ts           # Jenis kongsi (Summary)
├── lib/
│   ├── auth.ts                       # Role, status akaun, polisi kata laluan,
│   │                                 #   terjemahan ralat Auth (Fasa 6)
│   ├── auth-client.ts                # Aliran log masuk bersama + routing status
│   ├── user-management.ts            # Jenis & logik tulen pengurusan pengguna
│   ├── actions/user-management-actions.ts # Server Actions → RPC admin_*
│   ├── programme-mapper.ts           # Pemetaan row Supabase → type Programme
│   ├── dashboard-data.ts             # Agregasi KPI dashboard (hibrid)
│   ├── participants-data.ts          # Agregasi peserta seluruh organisasi
│   ├── excel-parser.ts               # Parser SheetJS + pemetaan import_staging
│   ├── import-api.ts                 # Sambungan UI → POST /api/import/sync
│   ├── import-shared.ts              # Jenis & label kongsi import (bukan server)
│   ├── master-records.ts             # Data induk (Supabase / mock) untuk pendua
│   ├── governance.ts                 # Logik tulen Governance Lock (Langkah 5)
│   ├── governance-actions.ts         # Server Actions Governance (Langkah 5)
│   ├── change-requests.ts            # Logik tulen Change Requests (Langkah 4)
│   ├── change-request-actions.ts     # Server Actions Change Requests
│   ├── reporting.ts                  # Logik tulen Report Builder (8 jenis laporan)
│   ├── report-excel.ts               # Pengeksport SheetJS → .xlsx
│   ├── supabase/
│   │   ├── client.ts                 # Browser client (@supabase/ssr)
│   │   ├── server.ts                 # Server client (cookies)
│   │   ├── middleware.ts             # Refresh sesi + proteksi laluan
│   │   ├── schema-master.sql         # Skema induk + RLS + trigger audit
│   │   ├── schema-import-staging.sql # Skema jadual import_staging
│   │   ├── sync-import-transaction.sql # RPC transaksi atomic sync_import_transaction
│   │   ├── governance-lock.sql       # Modul Governance lock/unlock
│   │   ├── change-requests.sql       # Modul Change Requests (RPC + RLS)
│   │   └── user-management.sql       # Fasa 6: super_admin, account_status,
│   │                                 #   RPC admin_*, trigger pendaftaran
│   ├── types.ts                      # Entiti domain (Programme, Participant, ...)
│   ├── mock-data.ts                  # Data mock (6 program lengkap)
│   ├── format.ts                     # formatMYR, formatDate, ...
│   └── utils.ts                      # cn() helper (shadcn)
├── public/samples/                   # Fail Excel contoh untuk ujian parser
│   ├── 00. Quotation Tracker (1).xlsx
│   └── R1 MIMOS_Academy_INCOME_STATEMENT.xlsx
├── scripts/
│   ├── generate-sample-excel.mjs     # Jana fail Excel contoh
│   ├── test-parser.mjs               # Ujian parser terhadap fail contoh
│   ├── test-sql-pglite.mjs           # Ujian pemasangan skema + idempotensi
│   ├── test-sql-functional.mjs       # Ujian fungsi RPC (sync, lock, CR)
│   ├── test-seed-after-master.mjs    # Ujian seed selepas skema induk
│   ├── test-user-management-sql.mjs  # Ujian SQL Fasa 6 (14 kumpulan)
│   ├── test-preflight-b-sql.mjs      # Sahkan blok preflight Langkah B (PROMPT-6)
│   ├── test-c13-has-role-drift.mjs   # Regresi blocker C13: has_role() sedar super_admin
│   └── codebase-map.mjs              # Jana semula docs/CODEBASE-MAP.md
├── .claude/skills/                   # Agent Skills (arahan proses tambahan)
│   └── vibe-coding-workflow/SKILL.md # Spec→Plan→Build→Test→Review→Clean→Release
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

## Modul Governance Lock, Request Unlock & Change Requests (Langkah 5)

Program yang telah dikunci (`locked = true`) adalah rekod audit yang tidak boleh
disunting terus. Dua laluan untuk perubahan:

1. **Permohonan Buka Kunci** — dibuka dengan justifikasi, diluluskan oleh
   peranan berautoriti (Manager/Admin, tanpa self-approval), lalu membuka
   tetingkap suntingan bertempoh (default 24 jam).
2. **Change Request (Mohon Ubah Data)** — staff memilih medan, nilai lama,
   nilai baharu dan sebab; **Head Governance** meluluskan/menolak; semua
   keputusan direkod dalam `audit_logs`. Tiada penulisan terus ke jadual
   `change_requests` dari klien — semua melalui RPC `SECURITY DEFINER`.

- **`lib/governance.ts`** — logik tulen: hierarki peranan, pengesahan permohonan,
  peralihan keadaan, pengiraan tamat tempoh, dan peraturan *no self-approval*.
- **`lib/governance-actions.ts`** — Server Actions (`mohon`, `lulus/tolak`,
  `kunci semula`, `batal`) yang memanggil RPC atomik dalam
  `lib/supabase/governance-lock.sql`; mod demo tanpa Supabase.
- **`lib/change-requests.ts`** — logik tulen: medan dibenarkan, pengesahan borang,
  label status.
- **`lib/change-request-actions.ts`** — Server Actions (`hantar`, `lulus/tolak`,
  `batal`, `senarai`) memanggil RPC dalam `lib/supabase/change-requests.sql`.
- **`components/governance/*`** — `LockBanner`, `RequestUnlockDialog`,
  `UnlockApprovalCard`, `UnlockRequestHistory`, `ChangeRequestDialog`,
  `ChangeRequestInbox`, `ChangeRequestHistory` dan `GovernancePanel`.
- **`app/(dashboard)/programmes/[id]/page.tsx`** — integrasi panel tadbir urus,
  tab **Change Requests** dan keadaan *boleh sunting* program.

## Modul Report Builder & Export Excel (Langkah 6)

Halaman **/reports** membina laporan program latihan dan mengeksportnya ke fail
Excel (.xlsx) menggunakan SheetJS (`xlsx`) — konsisten dengan parser import.

- **`lib/reporting.ts`** — logik tulen: **8 jenis laporan** — `programme_summary`
  (Ringkasan Program), `financial` (Kewangan), `participants` (Peserta),
  `costs` (Kos), `monthly_summary` (Ringkasan Bulanan), `governance_locked`
  (Program Terkunci), `certificate_eligibility` (Kelayakan Sijil) dan
  `demographic` (Demografi Peserta — data sensitif, kawalan RLS).
  Penapis (tahun/kategori/status), metrik ringkasan dan struktur `ReportResult`
  (kolom + baris) yang agnostik medium.
- **`lib/report-excel.ts`** — `buildSheet()` / `buildWorkbook()` / `downloadReport()`
  menukar `ReportResult` kepada fail `.xlsx` (satu sheet "Laporan").
- **`components/reports/report-builder.tsx`** — wizard laporan: pilih jenis →
  penapis → kad metrik → jadual preview → butang **Eksport Excel**.

## Dashboard & Peserta

- **`/dashboard`** — `lib/dashboard-data.ts` mengagregat KPI daripada
  `programmes` (Supabase, jatuh balik ke mock): status, program aktif bulan
  ini, kunci governance, import tertunda (`import_batches`), invois belum
  bayar, pecahan kategori & penganjur, margin, aktiviti terkini dan kelulusan
  belum diputuskan. Komponen: `components/dashboard/dashboard-overview.tsx`.
- **`/participants`** — `lib/participants-data.ts` meratakan peserta daripada
  semua program (seorang peserta boleh hadir berbilang program) dan menyediakan
  ringkasan Bumiputera. Komponen: `components/participants/participants-browser.tsx`.

## Sejarah Import

Tab **Sejarah Import** di `/import` membaca `import_batches` + `import_staging`
melalui `lib/actions/import-actions.ts` (`getImportBatches`, `getStagingRows`).
Jenis & label kongsi berada dalam `lib/import-shared.ts` (modul biasa — fail
server actions tidak boleh mengeksport fungsi sinkron).

## Pengesahan & Pengurusan Pengguna (Fasa 6)

**Sistem ini menggunakan e-mel + kata laluan SAHAJA.** MFA/TOTP yang dibina
pada Fasa 5 telah dibuang sepenuhnya (`lib/mfa.ts` dan
`components/security/mfa-guard.tsx` dipadam).

### Model pengesahan

| Perkara | Nilai |
| ------- | ----- |
| Kaedah log masuk | E-mel + kata laluan (`signInWithPassword`) |
| Kata laluan lalai pertama | `masb.12345` |
| Tuntutan tukar kata laluan | `user_profiles.must_change_password` → pengguna dialih ke `/security?required=1` dan **tidak boleh** membuka modul lain sehingga kata laluan ditukar |
| Polisi kata laluan baharu | ≥ 8 aksara, ada huruf + nombor, **tidak boleh** sama dengan kata laluan lalai |
| Master Admin / Super Admin | `saidrazak881@gmail.com` → role `super_admin` |
| Status akaun | `pending` (menunggu kelulusan) · `active` · `blocked` |
| Lupa kata laluan | `/forgot-password` → e-mel pemulihan → `/security?reset=1`; alternatif: Super Admin reset ke lalai |

### Pendaftaran pengguna baharu

`/register` memanggil `supabase.auth.signUp()`. Oleh kerana `auth.users` tidak
boleh dibaca melalui RLS, profil dicipta secara automatik oleh trigger
**`on_auth_user_created`** dengan `role = 'viewer'`,
`account_status = 'pending'` dan `must_change_password = true`. Pengguna tidak
boleh memilih role sendiri. Selepas Super Admin meluluskan, barulah akaun boleh
mengakses modul.

### Dashboard Super Admin (`/admin/users`)

KPI (jumlah, menunggu, aktif, disekat, masih guna kata laluan lalai, bilangan
Super Admin) + tindakan:

- **Luluskan** permohonan (serta role yang ditetapkan)
- **Sekat / Nyahsekat** — sebab wajib direkod; refresh token pengguna dipadam
  supaya semua sesi aktif tamat
- **Tukar role** — `super_admin` tidak boleh diberi melalui UI (hanya SQL)
- **Set semula kata laluan** ke lalai + wajibkan tukar
- **Wajibkan / batalkan** tuntutan tukar kata laluan

### Penguatkuasaan berlapis (bukan di UI sahaja)

1. **Column-level GRANT** — `authenticated` hanya boleh menulis kolum profil
   bukan sensitif (`full_name`, `phone`, `designation`, `department`,
   `avatar_url`, `updated_at`). `role`, `account_status`,
   `must_change_password`, `approved_*`, `blocked_*` **tidak boleh** disentuh
   dari klien, jadi eskalasi kuasa melalui PATCH terus adalah mustahil.
2. **RPC `SECURITY DEFINER`** — setiap tindakan pengurusan memanggil
   `assert_can_manage_users()` dan menulis `audit_logs`.
3. **Guard sisi pelayan** — `app/(dashboard)/layout.tsx` membaca status akaun
   semasa render dan menolak pengguna `pending`/`blocked`; kata laluan lalai
   mengalihkan ke `/security`.
4. **Guard sisi klien** — `components/security/account-guard.tsx` menyemak
   semula semasa navigasi SPA supaya sekatan yang dikenakan selepas log masuk
   tetap berkuat kuasa.
5. **Peraturan keselamatan dalam RPC** — tidak boleh sekat diri sendiri, tidak
   boleh reset kata laluan sendiri, sekurang-kurangnya satu Super Admin aktif
   mesti kekal, `super_admin` tidak boleh diberi/diturun taraf sembarangan.

`public.has_role()` kini **sedar-super_admin** (memulangkan `true` untuk
sebarang role), jadi Super Admin mewarisi semua kuasa `admin`,
`head_governance`, `manager` dan `finance` tanpa perlu menyunting
berpuluh-puluh polisi RLS.

## Dokumentasi

| Dokumen | Kandungan |
| ------- | --------- |
| `docs/SETUP-SUPABASE.md` | Pasang skema SQL mengikut urutan, cipta pengguna & peranan, storage, ujian RLS |
| `docs/DEPLOY-VERCEL.md` | Sambung GitHub → Vercel, env variables, checklist UAT, troubleshooting |
| `docs/GPT-ASSISTANT-PROMPTS.md` | Prompt siap-tampal untuk ChatGPT + format laporan wajib |
| `docs/PROMPT-6-INSTALL-USER-MANAGEMENT.md` | **Fasa 6 — ✅ SELESAI & DISAHKAN DI PRODUCTION** (E1–E9 = 9/9, UAT A–K semua lulus). Pasang `user-management.sql` di Supabase live, kemas kini Production Branch Vercel, verifikasi |
| `docs/PROMPT-6B-FIX-C13-HAS-ROLE.md` | **Blocker C13** — `has_role()` live tidak sedar `super_admin`; pasang `fix-rls-recursion.sql` + kriteria V1–V8 |
| `docs/PROMPT-6C-AUDIT-LEGACY-TABLES.md` | **V3 dibetulkan** + audit READ-ONLY **3** jadual warisan (`profiles`, `programme_participants`, `user_roles`) yang tiada dalam repo — W1–W8 |
| `docs/PROMPT-6D-AUTH-VERCEL-LEGACY.md` | **DIGANTIKAN SEBAHAGIAN** (D mustahil via alat → manual pengguna): Langkah D (Auth config) + Langkah E (Production Branch → `arena/01a06274-masb-pms-v4`) + X1–X5 read-only untuk menutup penemuan W5 (`private.has_role()` bukan ciptaan repo). **Tiada** kelulusan DROP/REVOKE |
| `docs/PROMPT-6E-VERCEL-PRODUCTION-PRIVATE-HAS-ROLE.md` | **DILULUSKAN & AKTIF:** Langkah E (Production Branch → `arena/01a06274-masb-pms-v4`) **dinyahganding** dari D + E1–E9 + **Y1–Y4** (katalog sahaja) untuk kenal pasti `private.has_role()`. Penemuan: fungsi itu **dirujuk** oleh `main` tetapi **tidak pernah ditakrifkan** dalam sejarah git = sisa pra-repo. **Tiada** kelulusan DROP/REVOKE |
| `docs/PROMPT-6F-AUDIT-PRIVATE-SCHEMA-DRIFT.md` | **AKTIF — prompt semasa:** Langkah E (Production Branch) + baki D (D1–D4) + Z1–Z5 (read-only) dalam satu pusingan. §0 membatalkan pemindahan tugas kepada pengguna. Z menyiasat **4 fungsi `private.*` pra-repo** yang tidak wujud dalam mana-mana komit git — `has_role`, `set_updated_at`, `validate_programme_lock`, `write_audit_log`. Persoalan utama: adakah **governance lock** dan **audit log** live masih dikuatkuasakan oleh kod pra-repo? |
| `lib/supabase/updated-at-triggers.sql` | **Fasa 6G — 🟢 DILULUSKAN (2026-09-04), menunggu pemasangan di live. WAJIB untuk pemasangan bersih.** Membetulkan kecacatan repo: repo mencipta kolum `updated_at` pada 10 jadual rasmi tetapi **tidak pernah** mencipta trigger. Cipta `public.set_updated_at()`, alih 6 trigger pra-repo, tambah 6 trigger baharu → 12 jadual. Idempoten. ✅ **DIPASANG DI LIVE 2026-09-04** (G1 12/12, G2 0). Tidak DROP fungsi/jadual/polisi — hanya `DROP TRIGGER` untuk pengikatan semula |
| `docs/PROMPT-6G-UPDATED-AT-AND-REVOKE.md` | **✅ SELESAI (2026-09-04)** — G1 **12/12** trigger → `public.set_updated_at()`, G2 **0** baki `private`, G3 `updated_at` benar-benar berubah (ROLLBACK), H3 **6/6** hanya `SELECT`, I1 ketiga-tiga kolum wujud, I2 **0** binding. Mengandungi **2 pembetulan ChatGPT terhadap kriteria Arena**: (a) G1 asal guna `action_statement` yang tidak mengkualifikasikan fungsi `public` — diganti dengan query katalog; (b) larangan "JANGAN DROP apa-apa" terlalu luas kerana fail SQL sendiri ada `DROP TRIGGER IF EXISTS`. H1 ⏳ tidak direkodkan (ChatGPT jalankan §2 dahulu) dan **tidak direka** |
| `docs/GAP-ANALYSIS-FUNGSI-BELUM-ADA.md` | **Analisis jurang (2026-09-04).** Bandingkan 8 fail Excel sumber `V4 RAW/` terhadap skema DB/parser/RPC/UI/laporan. **4 domain perniagaan tiada langsung** (sebut harga, pipeline/funnel, P&L/aging, tugasan pejabat) = 715 baris data aktif tanpa tempat. **§4.1–4.4 DIBETULKAN**; §4.5 + domain baharu = Fasa 2. 4 keputusan pengguna direkodkan |
| `docs/PROMPT-7A-FIX-FIELD-MAPPING.md` | **🟢 DILULUSKAN oleh pengguna (2026-09-04) — PROMPT AKTIF.** HARD GATE dibuka; blob SHA `d393e4628521` (fix-field-mapping) + `5ba925f7ef6a` (sync RPC) disahkan **tiada drift** sejak komit `f121ac2`. Pasang 23 lajur baharu + ganti RPC `sync_import_transaction`. Kriteria J1–J10: snapshot SEBELUM diarahkan eksplisit (pengajaran #10), pengesahan guna `pg_proc.prosrc` **bukan** `action_statement` (pengajaran #8). **Sengaja TIDAK** meminta ujian berfungsi di live — sudah diuji **55/55** dalam PGlite |
| `lib/supabase/fix-field-mapping.sql` | **23 lajur baharu** (17 `import_staging` + 6 `invoices`). Idempoten (diuji 3×). **Tiada** DROP/UPDATE/DELETE/TRUNCATE — disahkan oleh `test-fix-field-mapping.mjs` §3 |
| `docs/PROMPT-6H-E1-E9-PRECISE-CRITERIA.md` | **AKTIF:** E1–E9 dengan kriteria redirect yang TEPAT. `NextResponse.redirect` = 3xx, jadi klien yang **mengikuti** redirect melihat 200 + kandungan `/login` — itu **LULUS**, bukan gagal. Menyatakan medan bukti (`status_mentah`, `location_header`, `url_akhir`) dan apa yang **BUKAN** kriteria |
| `docs/ACTION-6-UAT-AUTH-USERS.md` | Senarai semak ujian manual Fasa 6 (log masuk, wajib tukar kata laluan, pendaftaran, kelulusan, sekatan, reset) — **✅ LULUS semua A–K pada 2026-09-04 di Production** |
| `docs/CODEBASE-MAP.md` | Peta kod ringkas untuk konteks pembantu AI (jana semula: `node scripts/codebase-map.mjs`) |
| `docs/PROMPT-TEMPLATE-FASA.md` | Templat wajib prompt GPT: Persona + Peta Kod + Tugasan + Larangan + Format Laporan |
| `docs/SKILLS.md` | Daftar Agent Skill tambahan + pemetaan kepada aliran Fasa projek dan penyesuaian khusus (pengajaran daripada blocker A7 & preflight B) |

## Bermula

```bash
npm install
cp .env.example .env.local   # isikan URL & anon key Supabase (pilihan untuk mock)
npm run dev
```

Buka http://localhost:3000 — halaman utama akan mengalih ke `/dashboard`.
Log masuk boleh diakses di `/login` (borang demo; klik "Log Masuk" untuk
meneruskan tanpa pelayan Supabase).

## Nota Integrasi Supabase

- `lib/supabase/client.ts` — guna dalam Client Components / event handler.
- `lib/supabase/server.ts` — guna dalam Server Components & Server Actions.
- `lib/supabase/middleware.ts` — menyegarkan token sesi dan melindungi laluan
  `/dashboard`, `/programmes`, `/import`, `/participants`. Tanpa env Supabase,
  aplikasi berjalan dalam mod demo (semua laluan dibenarkan).
- Pola **hibrid**: setiap halaman cuba baca Supabase dahulu; jika env tiada atau
  ralat, jatuh balik ke `lib/mock-data.ts`. Sertakan `isDemo` untuk paparan
  "Mod demo" dalam UI.
- Fail berlabel `"use server"` (server actions) hanya boleh mengeksport fungsi
  async. Logik tulen (mapper, label, jenis) diletakkan dalam modul biasa:
  `lib/programme-mapper.ts`, `lib/import-shared.ts`, `lib/change-requests.ts`,
  `lib/governance.ts`, `lib/reporting.ts`.

## Skrip

| Arahan         | Penerangan                          |
| -------------- | ----------------------------------- |
| `npm run dev`  | Pelayan pembangunan                 |
| `npm run build`| Binaan pengeluaran                  |
| `npm start`    | Jalankan binaan pengeluaran         |
| `npm run lint` | Lint ESLint                         |
| `node scripts/test-user-management-sql.mjs` | Ujian SQL Fasa 6 (PostgreSQL sebenar via PGlite): pemasangan pada DB kosong + 12 kumpulan ujian fungsi |
| `node scripts/test-preflight-b-sql.mjs` | Sahkan blok preflight **Langkah B** dalam PROMPT-6: read-only, kalis ralat pada DB sebelum/selepas Fasa 6, tiada kata laluan bocor |
| `node scripts/test-c13-has-role-drift.mjs` | Regresi **blocker C13**: lakukan semula drift `has_role()` versi Fasa 5, buktikan super_admin kehilangan 7 role, sahkan `fix-rls-recursion.sql` memulihkan |
| `node scripts/test-prompt-6e-y-queries.mjs` | Sahkan blok SQL **Y1–Y4** dalam PROMPT-6E: sintaks sah, benar-benar read-only, tidak melaksanakan `private.has_role()`, dan **jangkaan Arena diuji sebelum prompt dihantar**. Ujian inilah yang mendedahkan kesilapan kriteria Y3 Arena |
| `node scripts/test-prompt-6f-z-queries.mjs` | Sahkan blok SQL **Z1–Z5** dalam PROMPT-6F terhadap persekitaran tiruan **Senario A** (trigger governance masih pada `private.*`). Menguji bahawa Z2 mendedahkan `programmes_enforce_lock → private.validate_programme_lock()` dan Z4 **tidak** menghasilkan positif palsu |
| `node scripts/test-updated-at-triggers.mjs` | **17/17.** Sahkan `updated-at-triggers.sql`: tiru keadaan live (6 trigger pra-repo), pasang, bukti **berkelakuan** bahawa `updated_at` berubah pada UPDATE (termasuk jadual yang dahulunya tiada trigger), idempoten, tidak DROP apa-apa |
| `node scripts/test-prompt-6g-revoke.mjs` | Sahkan pernyataan REVOKE dalam PROMPT-6G: hasilkan **hanya SELECT** untuk 6 kombinasi grantee×jadual, tidak menyentuh jadual rasmi, dan **reversibel** |
| `node scripts/test-prompt-6h-e-criteria.mjs` | **Terbitkan** kriteria E1–E9 daripada `PROTECTED_PREFIXES` sebenar dalam `lib/supabase/middleware.ts`: sahkan laluan redirect memang dilindungi, laluan 200 memang tidak, middleware benar-benar melakukan `NextResponse.redirect` + `?redirect=`, dan kod Fasa 6 bebas `MfaGuard`/`lib/mfa` (E9) |
| `node scripts/test-sql-pglite.mjs` | Ujian pemasangan skema induk + idempotensi |
| `node scripts/test-sql-functional.mjs` | Ujian fungsi RPC (import sync, lock, change request) |
| `node scripts/test-v4-raw-parser.mjs` | **73/73.** Ujian parser terhadap **8 fail Excel sumber SEBENAR** dalam `V4 RAW/`. Mengunci 4 kecacatan: amaun mengambil lajur **cukai** (`SST 8% Amount` RM1,555.56 dan bukan `Final Price` RM21,000), header sheet lebar gagal dikesan (23 baris dibuang **senyap**), baris data dijadikan header, dan 44/49 lajur perniagaan dibuang. Termasuk pengawal **14 baris hantu** dan **baris JUMLAH RM11.19 juta** |
| `node scripts/test-fix-field-mapping.mjs` | **55/55.** Ujian PGlite untuk `fix-field-mapping.sql` + RPC `sync_import_transaction` yang dibetulkan. Bukti **berkelakuan** bahawa `account_manager` menerima pengurus akaun (bukan jurulatih), `pic_name` menerima individu (bukan syarikat), `po_value_excl_tax` tidak lagi menerima amaun quotation, dan senario `unique_violation` §4.4 menghasilkan **1 baris, bukan 2** |
| `node scripts/codebase-map.mjs` | Jana semula `docs/CODEBASE-MAP.md` |
