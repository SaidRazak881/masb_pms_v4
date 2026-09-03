# ANALISIS JURANG — FUNGSI YANG DIMINTA TETAPI BELUM ADA DALAM SISTEM

> **Tarikh:** 4 September 2026
> **Kaedah:** Bandingkan **8 fail Excel sumber** dalam `V4 RAW/` (keperluan sebenar
> pengguna) terhadap **skema DB, parser, RPC, komponen UI dan 8 jenis laporan**
> yang wujud dalam repo. Setiap dakwaan di bawah disertai bukti fail+baris.
> **Tiada kod diubah** — dokumen ini untuk keputusan anda sahaja.
>
> **Ringkasan:** Fasa 1–6 membina **teras pengurusan program + tadbir urus +
> keselamatan** dengan kukuh. Tetapi **4 domain perniagaan penuh** yang wujud
> dalam fail sumber anda **tidak ada dalam sistem langsung**, dan import
> kewangan yang sedia ada **menyimpan data ke lajur yang salah**.

---

## 1. Apa yang SUDAH ada (disahkan berfungsi di live)

| Domain | Status | Bukti |
| --- | --- | --- |
| Master Programme Registry (`programme_id` tak berubah) | ✅ | `schema-master.sql` `programmes`; import cipta kod `IMP-<md5>` deterministik (`sync-import-transaction.sql:309`) |
| Import Excel 3 peringkat (staging → semakan → sync atomik) | ✅ | `schema-import-staging.sql`, `excel-parser.ts`, `/api/import/sync`, `sync_import_transaction()` |
| Padanan bertingkat sebagai **cadangan** sahaja | ✅ | `duplicate_confidence` ENUM(`high`,`medium`,`none`), `suggested_action`, `duplicate-compare-dialog.tsx` |
| Governance lock di peringkat DB | ✅ | `governance-lock.sql`, `enforce_programme_lock()`, `expire_stale_unlocks()` |
| Change Request + kelulusan Head Governance | ✅ | `change-requests.sql`, `submit/review/cancel_change_request()` |
| Audit log tak boleh ubah | ✅ | `audit_logs`, `log_audit()`, 3 trigger audit |
| Status Bumiputera **hanya dari deklarasi** | ✅ | `bumi_status` + `bumi_verified` + `bumi_verification_date/notes` |
| Laporan demografi terhad peranan | ✅ | `reporting.ts` jenis `demografi` + RLS |
| Auth e-mel+kata laluan, tukar kata laluan wajib, pendaftaran+kelulusan | ✅ | Fasa 6, disahkan live 2026-09-04 |
| Dashboard Super Admin (block/lulus/reset/role) | ✅ | `/admin/users`, 8 RPC `admin_*` |
| Trigger `updated_at` semua 12 jadual | ✅ | PROMPT-6G, G1 12/12 |

**Ini bukan kecil.** Teras tadbir urus + keselamatan itu **siap dan diverifikasi**.

---

## 2. Liputan 8 fail Excel sumber

| Fail sumber | Baris × Lajur | Sistem boleh simpan? | Nota |
| --- | --- | --- | --- |
| `00. Quotation Tracker (1).xlsx` | **299 × 49** | 🔴 **~5 lajur sahaja** | Tiada jadual `quotations`. Lihat §3.1 + §4 |
| `R1 MIMOS_Academy_INCOME_STATEMENT.xlsx` → *Invoice* | 47 × 26 | 🟡 separa | Perlu `programme_id`; R1 adalah P&L bebas program |
| `R1 …INCOME_STATEMENT.xlsx` → *Cost of Sale* | 37 × 16 | 🟡 separa | `programme_costs` ada lajur betul, tetapi `programme_id NOT NULL` |
| `R2 Overall Report 2026 (1).xlsx` → *Overall* | 49 × 32 | 🟡 | Tiada lajur pendaftaran/Bumi/hasil per kohort |
| `R2 …` → *Attendance list* | 47 × 12 | 🔴 | **`Cert No` tiada** — hanya `certificate_issued` boolean |
| `R2 …` → *quotation* | 12 × 7 | 🔴 | Tiada jadual quotations |
| `R3 Group 2026 Funnel Tracker.xlsx` → *Dr Nizar* | **159 × 24** | 🔴 **0%** | Tiada domain pipeline langsung |
| `R3 …` → *AI Projects Summary* | 113 × 4 | 🔴 | Tiada entiti projek/peluang |
| `User Profiles Mapping.xlsx` | 20 × 5 | ✅ | 19 pengguna + `masb.12345` — sudah dipasang |
| `cost_of_sales_2026.xlsx` | 24 × 16 | 🟡 | Lajur wujud dalam `programme_costs`, terikat program |
| `invoice_2026.xlsx` | 30 × 22 | 🟡 | Lajur wujud dalam `invoices`, terikat program |
| `office_funnel_2026-08-19.xlsx` | **101 × 13** | 🔴 **0%** | Tiada entiti tugasan/action item |
| `sales_report_2026-08-19.xlsx` | **157 × 10** | 🔴 **0%** | Tiada forecast/weighted/sector/salesman |

**Kesimpulan: 4 daripada 8 fail sumber (Quotation Tracker, R3 Funnel, office_funnel,
sales_report) — iaitu 715 baris data perniagaan — tiada tempat dalam sistem.**

---

## 3. 🔴 EMPAT DOMAIN YANG TIADA LANGSUNG

### 3.1 Sebut Harga / Quotation (keperluan terbesar)

**Sumber:** `00. Quotation Tracker (1).xlsx` — **299 baris × 49 lajur**.

**Apa yang tiada:**

| Tiada | Kesan |
| --- | --- |
| Jadual `quotations` | Sebut harga bukan entiti. Ia **menumpang** jadual `invoices` |
| `unit_price`, `quantity` (`No of Unit`) | Harga seunit & kuantiti hilang |
| `sst_amount`, `total_incl_sst` | Pengiraan SST 8% tidak wujud |
| `discount_pct`, `final_price` | Diskaun & harga muktamad hilang |
| `quotation_type`, `training_type` | `Public Training` vs lain tidak boleh ditapis |
| `payment_status` sebut harga | Hanya `invoices.payment_status` wujud |
| `project_status`, `prepared_by` | Siapa sediakan, status projek hilang |
| `pic_contact_no`, `pic_email` | Hanya `pic_name` (itu pun salah isi — §4) |

**Lajur Quotation Tracker yang parser KENALI: 0.** Disahkan dengan
`grep -ic` pada `lib/excel-parser.ts`: `Account Manager`=0, `PIC`=0, `SST`=0,
`Discount`=0, `Unit Price`=0, `No of Unit`=0, `Final Price`=0, `Prepared by`=0.

Perbendaharaan parser yang sebenarnya (`excel-parser.ts`) hanyalah:
`No/Ref/Number`, `Date/Tarikh`, `amount/amaun/JUMLAH`, `Programme/Ref`,
`Nilai Kontrak (RM)`, `Kos (Cost of Sale)`, jenis/kategori, status, jurulatih.

### 3.2 Pipeline Jualan / Funnel / CRM

**Sumber:** `R3 Group 2026 Funnel Tracker.xlsx` (159×24 + 113×4) dan
`sales_report_2026-08-19.xlsx` (157×10).

**Langsung tiada.** `grep -rlw` ke atas semua `.ts/.tsx/.sql` = **0 fail** untuk:
`forecast`, `weighted`, `probability`, `opportunity`, `pipeline`, `funnel`,
`salesman`, `client_id`, `company_name`.

| Konsep sumber | Status |
| --- | --- |
| Peluang/Opportunity (`Project/Opportunities`) | 🔴 tiada entiti |
| `Forecast Value (RM)` | 🔴 |
| `Probability of success (%)` | 🔴 |
| `Weighted Forecast Value (RM)` | 🔴 (ini `forecast × probability` — pengiraan teras funnel) |
| `Speed to market (PO/Contract)` — suku tahun | 🔴 |
| `PO / Secured New Order Book (RM)` | 🔴 |
| `Sector` (Government / Private) | 🟡 ada **hanya** pada `organizers.sector`, tiada pada peluang |
| `Salesman` / pemilik peluang | 🔴 |
| Pelanggan sebagai entiti (`clients`) | 🔴 lihat §3.5 |

**Kesan:** anda tidak boleh jawab "berapa nilai pipeline suku ini?", "peluang mana
kebarangkalian >70%?", "julat forecast→PO berapa hari?" — soalan yang fail R3
dan sales_report wujud untuk jawab.

### 3.3 Penyata Pendapatan / P&L / Untung Bersih

**Sumber:** `R1 MIMOS_Academy_INCOME_STATEMENT.xlsx` (2 sheet) dan
`cost_of_sales_2026.xlsx`.

**Lajur DB wujud tetapi terikat program** — `programme_costs` ada
`cost_of_sales`, `mimos_academy_cost`, `commission`, `bro_incentive`,
`net_profit`, `profit_percentage` (`schema-master.sql:789–794`). **Tetapi:**

```sql
programme_id UUID NOT NULL REFERENCES public.programmes (id) ON DELETE CASCADE
```

R1 dan `cost_of_sales_2026` ialah **penyata kewangan peringkat syarikat**, bukan
kos satu program. Ia tidak boleh disimpan tanpa program.

**8 jenis laporan yang wujud** (`lib/reporting.ts:143–171`):
Ringkasan Program · Laporan Kewangan · Laporan Peserta · Laporan Kos ·
Ringkasan Bulanan · Program Terkunci · Kelayakan Sijil · Demografi Peserta.

**Tiada satu pun** ialah: Penyata Pendapatan · Untung Bersih & Margin ·
Komisen/BRO Incentive · Aging Invois Tertunggak · Forecast vs Sebenar.

Nota: `Days Outstanding` ada dalam R1 (26 lajur) — `grep -rlw days_outstanding` = **0**.
(`aging` nampak seperti 18 padanan dalam `excel-parser.ts`, tetapi semuanya
positif palsu daripada perkataan "st**aging**".)

### 3.4 Funnel Pejabat / Tugasan & Aging

**Sumber:** `office_funnel_2026-08-19.xlsx` — 101 baris × 13 lajur:
`Client · Service · Action Item · Person In Charge · Person Email · Due Date ·
Status · Potential Revenue · Aging (Days) · Notes · Created By · Created At · Updated At`.

**Langsung tiada.** `action_item` = 0 fail, `aging_days` = 0 fail.
Tiada modul tugasan, tiada pengiraan aging, tiada amaran tarikh akhir.

### 3.5 Induk Pelanggan (Client Master)

Ini **kekeliruan penamaan yang membawa kesan data**. Jadual `organizers`
sebenarnya mengandungi **pelanggan**, bukan penganjur:

```sql
-- seed-v4-raw.sql
'MIMOS Berhad','Government' · 'FGV R&D Sdn Bhd','Private'
'Kementerian Sumber Manusia','Government' · 'KENANGA INVESTOR BERHAD','Private'
'PETRONAS','Private' · 'Bank Negara Malaysia','Government'
```

Ini semua **pelanggan yang membayar**. Tetapi:
- `programmes.organizer_name TEXT NOT NULL` — dilabel "Penganjur"
- `programmes` **tiada** `client_id` atau `client_name`
- UI sudah mula betulkan label: `create-programme-dialog.tsx:220` =
  `"Pelanggan / Penganjur"` — **dua konsep berbeza dalam satu medan**

**Kesan:** anda tidak boleh bezakan "siapa anjur" dengan "siapa bayar", tidak
boleh lapor hasil **mengikut pelanggan**, dan tidak boleh kesan pelanggan
ulangan merentas program.

### 3.6 Sijil — Nombor Sijil

**Sumber:** `R2 …Attendance list` ada lajur `Cert No` dengan nilai sebenar
seperti `MIMOS MA CoC 2024-0038`.

**Sistem ada:** `certificate_issued BOOLEAN`, `certificate_issue_date DATE`
(`schema-master.sql`, participants).
**Sistem tiada:** `certificate_no` / `cert_no` — `grep -rlw` = **0 fail**.

**Kesan:** sijil tidak boleh dicari, disemak ketulenan, atau dilaporkan
mengikut nombor. Laporan "Kelayakan Sijil" hanya kira boolean.

---

## 4. ✅ KECACATAN PEMETAKAN — **DIBETULKAN 2026-09-04** (menunggu pemasangan live)

> **STATUS: DIBETULKAN dalam repo, diuji, MENUNGGU kelulusan pengguna untuk
> dipasang di live** melalui `docs/PROMPT-7A-FIX-FIELD-MAPPING.md`.
>
> | Kecacatan | Status | Bukti |
> | --------- | ------ | ----- |
> | §4.1 `trainer` → `account_manager` | ✅ dibetulkan | `test-fix-field-mapping.mjs` §4: `account_manager = "Farrah"` |
> | §4.1b `SST 8% Amount` → `amount` (ralat 13.5×) | ✅ dibetulkan | `test-v4-raw-parser.mjs`: `amount = 21000`, `sstAmount = 1555.56` |
> | §4.2 `client_name` → `pic_name` | ✅ dibetulkan | `pic_name = "Ms Liyana Ayunni"`, `client_name = "KENANGA INVESTOR BERHAD"` |
> | §4.3 amaun quotation → `po_value_excl_tax` | ✅ dibetulkan | `po_value_excl_tax = 0` (DEFAULT), nilai ke `invoice_value_excl_tax`/`total_value` |
> | §4.4 `unique_violation` gagalkan batch | ✅ dibetulkan | padanan dua langkah GLOBAL; ujian §5: 0 × 23505, 1 baris bukan 2 |
> | §4.5 `programme_id NOT NULL` → program hantu | ⏳ **MASIH TERBUKA** | perlu jadual `quotations` berdiri sendiri = Fasa 2 |
>
> Dua kecacatan tambahan ditemui SEMASA pembetulan (tiada dalam laporan asal):
>
> | Kecacatan | Kesan | Status |
> | --------- | ----- | ------ |
> | **14 baris hantu** (Quotation Tracker 286–299: hanya nombor urutan, semua lajur lain kosong) menjadi rekod staging | 14 rekod kosong per import | ✅ dibetulkan (`hasIdentifier`) |
> | **Baris JUMLAH RM 11,191,349.41** (baris 299) menjadi satu rekod quotation | **Menggembungkan setiap laporan kewangan** dengan RM11.19 juta | ✅ dibetulkan + amaran `UNIDENTIFIED_AMOUNT_ROW` |
>
> **Bukti pengesahan silang:** jumlah amaun 284 quotation = **RM 11,214,029**
> vs baris jumlah Excel **RM 11,191,349** — beza RM 22,680 (sebut harga yang
> ditolak sebagai tidak sah). Jika baris jumlah masih bocor, jumlah itu akan
> ~RM 22.4 juta.
>
> **Kesan pada fail sumber sebenar (diukur, bukan dianggarkan):**
>
> | Fail | SEBELUM | SELEPAS |
> | ---- | ------- | ------- |
> | Quotation Tracker | 297 rekod, `amount`=**cukai** RM1,555.56, 44/49 lajur dibuang | **284** rekod, `amount`=**RM21,000**, 16 medan kewangan ditangkap |
> | `invoice_2026.xlsx` | 29 rekod, **0 sah** (`MISSING_AMOUNT`) | 29 rekod, **27 sah**, SST+AM+quotationRef ditangkap |
> | `cost_of_sales_2026.xlsx` | **0 rekod** — 23 baris dibuang **secara senyap** | **23 rekod** |
> | `office_funnel_2026-08-19.xlsx` | **0 rekod** (senyap) | **100 rekod** |
> | `R1 INCOME_STATEMENT` | — | **77 rekod** (Invoice 38 sah) |

Ini **berbeza daripada "fungsi belum ada"**: fungsi itu ada, tetapi ia
menyimpan makna yang salah. Dikesan dalam `lib/supabase/sync-import-transaction.sql`.

### 4.1 `trainer` → `account_manager`

```sql
-- baris ~381 (INSERT) dan ~402 (UPDATE), blok quotation
account_manager,            -- lajur sasaran
NULLIF(trim(v_row->>'trainer'), '')   -- nilai sumber: JURULATIH
```

Quotation Tracker ada lajur **`Account Manager`** yang sebenar
(ctoh. `Train The Trainer (TTT…)`). Parser tidak menangkapnya (§3.1), jadi
**nama jurulatih ditulis ke lajur pengurus akaun**.

### 4.2 `client_name` → `pic_name`

```sql
pic_name = COALESCE(v_client, pic_name)   -- baris 403 dan 455
```

`v_client` ialah **nama syarikat pelanggan** (`sync-import-transaction.sql:254`).
`pic_name` bermaksud **Person In Charge — individu**. Quotation Tracker ada
tiga lajur PIC berasingan: `PIC - Full Name`, `PIC - Contact No`,
`PIC - Email Add` (cth. `Ms Liyana Ayunni`, `6012-227 0011`).

**Kesan:** lajur individu diisi dengan nama syarikat. Data PIC sebenar
(dalam `raw_payload` JSON) tidak boleh dicapai oleh laporan atau UI.

### 4.3 Amaun quotation → `po_value_excl_tax`

```sql
po_value_excl_tax = v_amount   -- baris ~392 / ~401
```

Nilai **sebut harga** disimpan sebagai **nilai Pesanan Belian (PO)**. Itu dua
dokumen berbeza dalam kitaran jualan: Quotation → PO → Invoice. Komen dalam kod
mengakui ini (`-- quotation_no / po_value_excl_tax in invoices`), jadi ia
**keputusan reka bentuk**, tetapi ia bermakna nilai PO sebenar dari lajur
`PO value excl. tax (RM)` R1/invoice_2026 **tidak pernah diisi**.

### 4.4 🔴 Risiko `UNIQUE` — sebut harga dan invois berlanggar

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_quotation_no_unique
  ON public.invoices (quotation_no) WHERE quotation_no IS NOT NULL;
```

Aliran sebenar: **satu quotation → satu invois**. Tetapi sync quotation
**mencipta baris `invoices`** dengan `quotation_no` diisi dan `invoice_no` NULL.
Apabila invois sebenar tiba, padanan invois mencari `invoice_no = v_ref`
(bukan `quotation_no`), jadi ia **cuba INSERT baris `invoices` kedua** dengan
`quotation_no` yang sama → **`unique_violation` (23505)** → kerana
`sync_import_transaction` adalah **atomik**, **seluruh batch gagal**.

**Ini belum diuji dengan data sebenar.** Perlu disahkan sebelum anda import
Quotation Tracker + invoice_2026 serentak.

### 4.5 `programme_id NOT NULL` menghalang kewangan bebas

`invoices` dan `programme_costs` kedua-duanya `programme_id UUID NOT NULL`.
R1 INCOME_STATEMENT, `cost_of_sales_2026`, dan 299 baris Quotation Tracker
mengandungi rekod yang **tidak semestinya sepadan dengan satu program**
(ctoh. quotation yang belum jadi program, kos peringkat syarikat).

Sync mencipta program sintetik `IMP-<md5>` apabila tiada padanan
(`sync-import-transaction.sql:309`) — jadi data **tidak ditolak**, tetapi ia
**mencipta program palsu** untuk setiap quotation. 299 quotation berpotensi
menjadi 299 program hantu dalam Master Programme Registry.

---

## 5. "Intelligent" — apa yang diminta vs apa yang ada

| Kemampuan | Diminta dari awal | Status |
| --- | --- | --- |
| **Import Excel pintar** (3 peringkat + semakan manusia) | Ya | ✅ **ADA** |
| **Padanan bertingkat sebagai cadangan** (`high`/`medium`/`none`) | Ya | ✅ **ADA** — deterministik, boleh diaudit |
| **AI tidak memutuskan** merge kewangan / status Bumi / padam / kunci | Ya (kekangan) | ✅ **DIPATUHI** |
| **Fasa A** — persona tetap + peta kod | Ya (`EVALUASI-ALAT-AI-TPMS.md`) | ✅ **ADA** — 4 persona + `codebase-map.mjs` |
| **Fasa B** — MCP Server "TPMS Data" baca-sahaja | Ya (diluluskan sebagai *pilihan*) | 🔴 **BELUM** |
| **Saluran "tanya data" untuk staf** | Ya — disenarai sebagai kesakitan (e) | 🔴 **BELUM** |
| **Fasa C** — Graft / Codebase Memory / Figma MCP | Pilihan | 🔴 belum (perlu IDE agent / fail Figma) |
| **Fasa D** — OpenMontage (video), LangGraph/CrewAI, Dify | Pilihan perniagaan | 🔴 ditolak buat masa ini (AGPL / stack berat) |
| Ramalan AI, pengesanan anomali LLM | **Tidak pernah diminta** | — dan **sepatutnya tidak**, kerana ia akan langgar kekangan "AI tidak memutuskan kewangan" |

**Penilaian jujur:** bahagian "intelligent" yang **diminta** untuk sistem ini
(import pintar + padanan bercadangan) **sudah ada dan reka bentuknya betul** —
deterministik, boleh diaudit, manusia memutuskan. Yang belum ada ialah
**Fasa B (MCP read-only)** dan **saluran tanya-data untuk staf**, kedua-duanya
alat *pembangunan/analisis*, bukan fungsi teras sistem.

**Tetapi** "pintar" tidak bermakna apa-apa jika **domain datanya tiada**:
import pintar yang hanya kenal 3 jenis entiti (`quotation`,`invoice`,`cost`)
tidak boleh jadi pintar tentang 715 baris funnel, peluang jualan dan tugasan
pejabat yang tiada tempat untuk pergi.

---

## 6. Keutamaan yang saya cadangkan

| # | Kerja | Kenapa dahulu | Saiz |
| --- | --- | --- | --- |
| **1** | ✅ **SELESAI** — Betulkan §4.1–4.3 (petakan `Account Manager`, `PIC`, `SST`, `Discount`, `Unit Price`, `Qty`, `Final Price` ke lajur betul) | **Kerosakan data aktif.** Setiap import kini menulis makna salah ke lajur betul. Murah dibetulkan sekarang, mahal selepas 299 baris masuk | Sederhana |
| **2** | ✅ **SELESAI** — Sahkan & betulkan §4.4 (`UNIQUE quotation_no` berlanggar) | **Boleh gagalkan seluruh batch** — dan kegagalan itu atomik, jadi tiada separa selamat | Kecil (uji dahulu) |
| **3** | **Keputusan reka bentuk §4.5**: adakah quotation **program-independent**? | Menentukan sama ada jadual `quotations` berdiri sendiri atau terikat `programme_id`. **Ini keputusan perniagaan anda, bukan teknikal** | Keputusan |
| **4** | **Domain Quotation penuh** (§3.1) — jadual `quotations` + parser + UI + laporan | 299 baris sumber terbesar; kitaran jualan Quotation→PO→Invoice tidak boleh ditutup tanpa ini | Besar |
| **5** | **Induk Pelanggan** (§3.5) — pisahkan `clients` daripada `organizers` | Prasyarat untuk #6 dan untuk lapor hasil mengikut pelanggan | Sederhana |
| **6** | **Domain Pipeline/Funnel** (§3.2) + **P&L/Aging** (§3.3) | 316 baris sumber; soalan pengurusan ("pipeline suku ini?", "invois tertunggak?") | Besar |
| **7** | **`certificate_no`** (§3.6) + **Funnel Pejabat/tugasan** (§3.4) | Kecil tetapi jelas; 101 baris tugasan + nombor sijil boleh dicari | Kecil–Sederhana |
| **8** | Fasa B MCP read-only + saluran tanya-data staf | Nilai pembangunan/analisis; **selepas** domain data lengkap, jika tidak MCP mendedahkan sistem yang separa | Sederhana |

**Nota tentang #8:** MCP read-only paling bernilai **selepas** #4–#6. Sekarang ia
hanya boleh mendedahkan data program — soalan funnel dan P&L yang anda mahu
tanya **tiada jawapan dalam DB** untuk didedahkan.

---

## 7. Keputusan pengguna — **DIBERIKAN 2026-09-04**

| # | Soalan | Jawapan pengguna | Kesan |
| - | ------ | ---------------- | ----- |
| 1 | Adakah quotation bebas program? | **Ya — wujud SEBELUM program diluluskan** | `quotations` mesti entiti berdiri sendiri dengan `programme_id` **boleh NULL**. → Fasa 2 |
| 2 | Satu entiti "Pelanggan"? | **Ya — satu entiti "Pelanggan"** | `organizers` → `clients`; buang kekaburan "Pelanggan / Penganjur" (6 tempat dalam kod). → Fasa 2 |
| 3 | Keutamaan | **Baiki kerosakan data dahulu** | → §4 DIBETULKAN, `docs/PROMPT-7A-FIX-FIELD-MAPPING.md` |
| 4 | 4 fail tanpa tempat masih aktif? | **Ya — masih aktif diguna** | 715 baris data perniagaan aktif **tiada tempat**. → Fasa 2 jadi keperluan sebenar, bukan pilihan |

### Sejarah (soalan asal sebelum dijawab)

1. **Adakah quotation bebas program?** (Quotation Tracker ada 299 baris; adakah
   setiap satu mesti jadi program, atau quotation wujud **sebelum** program
   diluluskan?) → menentukan #3 dan bentuk #4.
2. **Adakah `organizers` sepatutnya jadi `clients`?** Anda mahu satu entiti
   "Pelanggan" (yang bayar) dan satu "Penganjur/Jurulatih" (yang menyampaikan), atau
   satu entiti sahaja?
3. **Keutamaan:** betulkan kerosakan data (#1–#2) dahulu, atau bina domain
   baharu (#4–#6) dahulu?
4. **Adakah 4 fail yang tiada tempat itu** (Quotation Tracker, R3 Funnel,
   office_funnel, sales_report) **masih digunakan secara aktif** oleh pasukan,
   atau sudah digantikan oleh fail lain?

> **Nota proses:** seperti biasa, saya tidak akan jalankan apa-apa di live.
> Sebarang kerja SQL akan jadi prompt untuk ChatGPT mengikut
> `docs/PROMPT-TEMPLATE-FASA.md`, dan saya akan **uji kriteria dalam PGlite
> dahulu** sebelum menghantar — pengajaran daripada 10 kesilapan yang
> direkodkan dalam `docs/PROMPT-6F-AUDIT-PRIVATE-SCHEMA-DRIFT.md`.
