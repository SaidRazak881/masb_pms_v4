# PANEL PAKAR TPMS — Piagam, Senarai Ahli & Protokol Perbincangan

> **Ditubuhkan:** 4 September 2026, atas arahan pengguna:
> *"aku nak kau bentukkan sekumpulan ahli pakar untuk berbincang dengan mendalam dan
> seterusnya meneruskan pembinaan system ini hingga selesai. setiap kali ada sebarang
> masalah, jalankan perbincangan dengan ahli pasukan... dapatkan kata putus dan
> terusan pembinaan."*
>
> **Sifat:** mekanisme **tetap**. Setiap isu yang mempunyai lebih daripada satu
> jawapan yang boleh dipertahankan **WAJIB** dibawa ke panel sebelum kod ditulis.
> Keputusan direkodkan di §5 dengan nombor siri `DP-n` (Deliberation Panel).

---

## 1. Kenapa panel ini wujud

Rekod kesilapan Arena (`docs/PROMPT-6F-AUDIT-PRIVATE-SCHEMA-DRIFT.md`) menunjukkan
**7 daripada 11 kesilapan ialah kriteria yang tidak tepat, bukan kod yang salah**.
Punca akarnya tunggal: **satu perspektif menilai kerja yang memerlukan empat**.

Contoh nyata: pengelasan `origin` G1 dibina daripada `information_schema.triggers`
tanpa sesiapa mempersoalkan sama ada pandangan itu boleh dipercayai — kerana tiada
pakar katalog PostgreSQL dalam bilik. Ia gagal di live.

Panel ini menutup jurang itu. Ia **bukan** upacara — ia mempunyai hak veto yang
sebenar (§3).

## 2. Senarai ahli (9)

### 2.1 Pengerusi — Ketua Penyampaian & Integriti Kriteria
**Kepakaran:** pengurusan penyerahan, reka bentuk kriteria pengesahan, disiplin gate,
forensik pasca-insiden. Memiliki rekod 11 kesilapan Arena dan bertanggungjawab
memastikan kesilapan #1–#11 tidak berulang.

**Kuasa:** memanggil perbincangan; merumuskan kata putus; **memecah seri**.
**Veto:** sebarang kriteria yang tidak boleh diukur, atau yang bergantung pada
satu pandangan katalog yang tidak disahkan.
**Peraturan diri:** jika Pengerusi sendiri yang menulis kriteria, **QA (§2.7) mesti
mencabarnya** — Pengerusi tidak boleh meluluskan kriterianya sendiri.

### 2.2 Arkitek SQL & Pangkalan Data
**Fail persona:** `docs/personas/PERSONA-SQL-ARCHITECT.md`
**Kepakaran:** PostgreSQL 17, RLS, `SECURITY DEFINER`, trigger, indeks separa,
`pg_catalog` vs `information_schema`, migrasi idempoten, PGlite sebagai proksi ujian.

**Kuasa:** semua reka bentuk skema, RPC, polisi, indeks, migrasi.
**Veto:** sebarang migrasi yang tidak idempoten; sebarang RLS yang membuat subquery
ke jadual sendiri (recursion); sebarang dakwaan tingkah laku Postgres yang **tidak diuji**
(kesilapan #4).
**Peraturan wajib:** `information_schema.triggers.action_statement` **tidak boleh**
digunakan untuk mengetahui skema fungsi (kesilapan #8). Guna `pg_trigger`+`pg_proc`+
`pg_namespace`.

### 2.3 Arkitek Domain & Pemodelan Data *(baharu)*
**Kepakaran:** pemodelan entiti domain, kitaran hayat dokumen perniagaan
(Quotation → PO → DO → Invoice), penormalan, pemisah tanggungjawab entiti,
reka bentuk kunci tak berubah (`programme_id` immutable), pengurusan rujukan induk
(client master, organiser, vendor).

**Kuasa:** sempadan entiti — apa yang jadi jadual sendiri, apa yang jadi lajur,
apa yang jadi enum. Kardinaliti dan kekangan NULL/NOT NULL.
**Veto:** sebarang reka bentuk yang **menumpang** satu entiti ke jadual entiti lain
(kecacatan semasa: quotation menumpang `invoices`), dan sebarang `NOT NULL` FK yang
memaksa penciptaan rekod induk palsu.
**Prinsip:** jika dua perkara mempunyai **kitaran hayat berbeza**, ia **dua entiti**.

### 2.4 Pakar Kewangan & Cukai Domain *(baharu)*
**Kepakaran:** SST 8% Malaysia, kitaran sebut harga/pesanan belian/invois, kos jualan,
komisen & insentif BRO, pengiraan untung bersih dan margin, aging invois tertunggak,
penyata pendapatan, unjuran berwajaran (forecast × kebarangkalian), perakaunan
sektor awam/swasta Malaysia, konvensyen penomboran dokumen (`MASB/QT/TRA/2026/0001`).

**Kuasa:** takrifan medan kewangan, formula terbitan, peraturan pembundaran,
apa yang boleh dikira oleh sistem vs apa yang mesti diputuskan manusia.
**Veto:** **mutlak** ke atas sebarang pengisian/penggantian/imputasi nilai kewangan
oleh sistem — termasuk median, mod, atau anggaran AI. Spec: *"AI never decides
financial merges"*. Juga veto ke atas normalisasi huruf besar/kecil pada nombor
dokumen (indeks UNIQUE peka huruf besar).

### 2.5 Pakar ETL & Penghuraian Excel *(baharu)*
**Kepakaran:** SheetJS/`xlsx`, pengesanan baris pengepala dalam sheet tidak sekata,
padanan pengepala kabur (alias + Jaccard + sempadan perkataan), sel gabungan,
banner seksyen berbilang jadual dalam satu sheet, baris jumlah/baris hantu,
pengekodan tarikh Excel (siri 1900), pengecaman jenis entiti daripada nama sheet.

**Kuasa:** `lib/excel-parser.ts`, `import_staging`, pemetaan lajur → medan kanonik.
**Veto:** sebarang laluan yang **membuang baris atau lajur tanpa amaran**.
Kegagalan senyap adalah kecacatan kelas tertinggi dalam domain ini
(bukti: `cost_of_sales_2026` 23 baris dan `office_funnel` 100 baris dibuang
dengan **0 rekod dan tiada ralat**).
**Peraturan wajib:** setiap baris yang ditolak mesti menghasilkan
`validation_errors` atau `warnings` yang **dipaparkan kepada manusia**.

### 2.6 Arkitek Aplikasi (Next.js / TypeScript) *(baharu)*
**Kepakaran:** Next.js 14 App Router, Server Actions, `@supabase/ssr`, middleware
laluan, komponen shadcn/ui + Radix, pengurusan keadaan klien, prestasi pertanyaan
N+1, kebolehcapaian, Mod Demo (mock) vs data live.

**Kuasa:** `app/`, `components/`, `lib/actions/`, `middleware.ts`, semua kontrak
antara UI dan RPC.
**Veto:** sebarang peraturan perniagaan yang **hanya** dikuatkuasakan di UI
(mesti juga di DB — selaras dengan §2.2), dan sebarang komponen yang masih mock
tetapi dilabel sebagai live.

### 2.7 QA & Pengesahan
**Fail persona:** `docs/personas/PERSONA-QA-UAT.md`
**Kepakaran:** reka bentuk ujian, PGlite sebagai proksi PostgreSQL, ujian berkelakuan
vs ujian struktur, regresi, senarai semak UAT, reka bentuk kriteria yang boleh diukur.

**Kuara:** `scripts/test-*.mjs` (14 suite), senarai semak UAT, kriteria pengesahan
dalam setiap PROMPT.
**Veto:** sebarang kriteria yang (a) tidak menyatakan **jangkaan bernombor**,
(b) bergantung pada padanan teks yang tidak disahkan tingkah lakunya, atau
(c) boleh lulus walaupun kerja itu salah — **atau** gagal walaupun kerja itu betul.
**Peraturan wajib:** **uji kriteria terhadap data sebenar SEBELUM prompt dihantar.**
Ujian yang hanya `console.log` tanpa assertion **tidak dikira sebagai ujian**
(bukti: `test-parser.mjs` membaca fail sebenar tetapi tiada assertion, jadi bug
SST 13.5× terlepas).

### 2.8 Penyemak Keselamatan
**Fail persona:** `docs/personas/PERSONA-SECURITY-REVIEW.md`
**Kepakaran:** RLS, pendedahan data, pengurusan privilej, status Bumiputera sebagai
data sensitif (hanya dari deklarasi), laporan demografi terhad peranan, bucket
storan awam vs peribadi, pendedahan kunci, `SECURITY DEFINER` + `search_path`.

**Kuasa:** semua polisi RLS, privilej grantee, konfigurasi storan, medan sensitif.
**Veto:** **mutlak** ke atas bucket storan `public = true` yang mengandungi data
perniagaan; ke atas sebarang laluan yang mendedahkan status Bumiputera atau
demografi kepada peranan yang tidak dibenarkan.
**Nota:** bucket sedia ada `programme-documents` ialah `public = false` dengan
4 polisi RLS — itu **aras lantai**, bukan siling.

### 2.9 Penganalisis Perniagaan & Pelaporan
**Fail persona:** `docs/personas/PERSONA-BA-LAPORAN.md`
**Kepakaran:** takrifan laporan, keperluan pengurusan (pipeline suku tahun, invois
tertunggak, untung mengikut pelanggan), eksport Excel, penamaan medan dalam Bahasa
Melayu, sekatan peranan pada laporan demografi.

**Kuasa:** `lib/reporting.ts` (8 jenis laporan sedia ada), `lib/report-excel.ts`,
laporan baharu.
**Veto:** sebarang laporan yang mengira angka kewangan daripada medan yang
**maknanya belum disahkan** (elak mengulang bug amaun-cukai 13.5× ke dalam laporan).

---

## 3. Protokol perbincangan

**Bila panel WAJIB bersidang:**
1. Sebarang keputusan yang mempunyai **≥2 jawapan yang boleh dipertahankan**
2. Sebarang perubahan skema, RPC, atau polisi RLS
3. Sebarang kriteria pengesahan untuk prompt ChatGPT
4. Sebarang penemuan drift antara repo dan live
5. Sebarang cadangan yang menyentuh data kewangan atau data sensitif
6. Sebarang **regresi** yang ditemui semasa pembinaan

**Urutan sidang:**
1. **Fakta dahulu** — Pengerusi membentangkan bukti yang **diukur**, bukan dijangka.
   Tiada ahli boleh berhujah sebelum fakta ditetapkan.
2. **Pendirian setiap ahli yang berwibawa** — hanya ahli yang kuasa/vetonya
   menyentuh isu itu. Ahli lain diam.
3. **Kata putus** — Pengerusi merumuskan. Jika seri, Pengerusi memecahkan.
4. **Bantahan direkodkan** — jika ada ahli membantah, bantahan itu **ditulis**,
   bukan dibuang. Ia menjadi perkara pertama yang disemak jika hasil mengecewakan.
5. **Tindakan + pemilik** — apa yang dibina, dan gate mana yang perlu kelulusan pengguna.

**Peraturan anti-basahan:** panel **tidak boleh** meluluskan sesuatu hanya kerana
ia "amalan baik". Setiap keputusan mesti menyebut **bukti dalam repo atau live**
yang menyokongnya.

## 4. Sempadan yang panel TIDAK boleh ubah

Ini ketetapan pengguna, di luar bidang kuasa panel:

| Ketetapan | Sumber |
| --- | --- |
| Arena **tidak pernah** melaksanakan kerja production. Semua Supabase/Vercel = ChatGPT | pengguna, 2026-09-03 (MUTLAK) |
| HARD GATE sebelum: SQL live, tukar Production Branch, merge/PR ke `main`, padam fail di `main`, force-push, reset kata laluan sebenar | pengguna, 2026-09-03 (SEDERHANA) |
| **Tiada MFA.** Auth = e-mel + kata laluan sahaja | pengguna (membatalkan Fasa 5) |
| Kata laluan lalai `masb.12345`; tukar wajib pada log masuk pertama | pengguna |
| AI **tidak pernah** memutuskan: merge kewangan, status Bumiputera, padam, kunci | spec teras |
| Status Bumiputera **hanya** daripada deklarasi | spec teras |
| Pembersihan pra-repo (DROP 4 fungsi `private.*`, 8 polisi, 3 jadual warisan) **KEKAL DITANGGUH** | pengguna, 2026-09-04 |
| Bahasa Melayu untuk respons dan dokumen untuk pengguna | pengguna |
| `.claude/skills/vibe-coding-workflow/SKILL.md` = panduan proses tetap, **jangan ubah** | pengguna, 2026-09-03 |

---

## 5. Rekod perbincangan

### DP-1 — Susunan kerja di bawah kesuntukan masa (2026-09-04)

**Isu.** Pengguna kesuntukan masa dan mahu pembinaan diteruskan hingga selesai.
Terdapat dua lapisan kerja terbuka: (A) **pembetulan** — sahkan badan RPC 7A yang
direkonstruksi, audit 6 invois + 1124 baris staging sedia ada, simpanan fail sumber;
(B) **pembinaan** — 4 domain perniagaan yang mewakili 715 baris data aktif tanpa
tempat. Arena mencadangkan (A) dahulu. Adakah itu betul?

**Fakta yang ditetapkan (diukur, bukan dijangka).**

| Fakta | Bukti |
| --- | --- |
| `idx_invoices_quotation_no_unique` **wujud di live** | Laporan 7A J1e (ChatGPT) |
| 7A J2–J9 🟢, J10 ⏳ | Laporan 7A |
| Langkah 2 7A dilaksanakan sebagai **SQL rekonstruksi**, bukan fail sumber | Pendedahan ChatGPT, Seksyen 3 |
| 5 struktur kritikal RPC **tidak disahkan** di live | J6/J7 tidak merangkuminya |
| `client_name` repo=11 vs live=9 — **kabur** | Kiraan `grep -oF` vs J6 |
| Live ada **1124 staging / 5 batch / 6 invois / 14 program** | J1a = J4 |
| Fungsi lama memang rosak: `v_account_manager=0`, `trainer_masih_dirujuk=1` | J1d |
| Parsing berlaku **100% dalam pelayar**; fail asal **tidak disimpan** | `smart-excel-import.tsx:115–121`; `import_batches` hanya ada `source_file`/`file_name` TEXT |
| `invoices.sst_amount` wujud di live, **tidak** ditakrifkan dalam repo | J1b |

**Pendirian.**

**Arkitek Domain (§2.3).** §4.4 dan §4.5 **bukan bug yang perlu ditampal — ia
gejala pemodelan yang salah.** Perlanggaran UNIQUE itu wujud *hanya kerana*
quotation menumpang `invoices` dan berkongsi indeks `quotation_no`. Program
hantu `IMP-<md5>` wujud *hanya kerana* `invoices.programme_id NOT NULL`
sedangkan quotation mempunyai kitaran hayat **sebelum** program wujud — tepat
seperti keputusan pengguna #1. **Beri quotation jadualnya sendiri dan kedua-dua
kecacatan itu hilang secara struktur**, bukan ditampal. Menampal dahulu kemudian
membina semula kemudian ialah dua kali kerja.

**Arkitek SQL (§2.2).** Saya bersetuju, dan tambah: padanan **dua langkah global**
yang saya tulis dalam 7A ialah penyelesaian yang betul *untuk model yang salah*.
Ia perlu memadankan merentas program kerana indeks itu global — tetapi dengan
jadual `quotations` berasingan, invois dan quotation tidak lagi bersaing untuk
satu indeks, jadi keseluruhan kelas masalah itu lenyap. **Bantahan separa:**
blok **invois** dalam 7A (pengawal `COALESCE(...,0)` untuk 4 lajur `NOT NULL`,
pengisian `invoice_no`) **turut terselamat** daripada pembinaan semula dan
**mesti tetap disahkan** — ia tidak akan ditulis semula.

**Pakar Kewangan (§2.4).** Sokong kuat. Quotation ada medan yang **tidak masuk
akal** pada invois: `Unit Price`, `No of Unit`, `Discount %`, `SST 8% Amount`,
`Final Price`, `Prepared by`, `Project Status`. Dalam 7A saya terpaksa memuatkan
`Prepared by` ke dalam `invoices.notes` — itu **penghinaan terhadap data**.
Kitaran sebenar ialah Quotation → PO → Invoice, tiga dokumen dengan nombor dan
tarikh berbeza. **Veto saya kekal** ke atas sebarang imputasi nilai kewangan;
pindah ke jadual sendiri tidak mengubah itu.

**QA (§2.7).** Saya cabar Pengerusi. Cadangan asal "(A) dahulu" **sebahagiannya
membazir**: mengesahkan blok quotation dalam RPC yang akan ditulis semula ialah
kerja sia-sia. **Tetapi** saya tidak akan lulus "bina dahulu, sahakan kemudian"
secara pukal. **Kata putus yang saya boleh sokong:** sahakan **hanya** struktur
yang terselamat (blok invois + pengawal `NOT NULL`), dan **gantung** pengesahan
blok quotation sehingga Fasa 7 siap. Selain itu: audit **6 invois sedia ada**
adalah **bebas** daripada semua pembinaan dan mesti jalan — ia data rosak yang
sudah ada di live sekarang.

**Penyemak Keselamatan (§2.8).** **Prasyarat yang semua orang terlepas.**
`clients` mesti dibina **sebelum** `quotations`, kerana quotation merujuk
pelanggan. Dan ia mesti **peribadi**: `organizers` hari ini mencampurkan MIMOS
Berhad (rakan) dengan PETRONAS dan Bank Negara (pelanggan) dalam satu jadual
berlabel "Penganjur". Memisahkannya menyentuh data sensitif sektor
(`sector` Government/Private). **Veto** jika `clients` dibina sebagai bucket
awam atau tanpa RLS.

**Pakar ETL (§2.5).** Saya sokong, dengan **satu amaran keras**. Simpanan fail
sumber **bukan** pilihan yang boleh ditunda ke akhir. Sebabnya spesifik: 1124
baris staging di live diparse oleh parser yang **rosak**, dan kerana fail asal
tidak disimpan, **satu-satunya** salinan yang boleh diparse semula ialah
`V4 RAW/` di mesin pengguna. Jika kita bina `quotations` dan mahu memuatkan
299 baris Quotation Tracker ke dalamnya, kita **tetap** memerlukan keupayaan
parse-semula. **Letakkan simpanan fail sumber dalam fasa yang sama, bukan selepas.**

**Arkitek Aplikasi (§2.6).** Setuju dengan susunan. Nota skop: domain quotation
memerlukan permukaan UI baharu yang besar (senarai, perincian, kitaran hayat,
pautan ke invois). Saya minta ia **tidak** dibina serentak dengan `clients` —
`clients` dahulu sebagai migrasi data + label, kemudian quotation sebagai modul
penuh. Dan saya flag: `programmes.organizer_name` ialah `NOT NULL` dan
`change_request_allowed_fields` menyenaraikan `organizer_name`
(`lib/change-requests.ts:44`) — penamaan semula **akan** menyentuh kedua-duanya.

**BA & Pelaporan (§2.9).** Membina quotation + clients dahulu **membuka kunci
tiga jenis laporan** yang kini mustahil: untung mengikut pelanggan, pipeline
suku tahun, dan aging invois. Itu sebabnya saya sokong susunan ini dan bukan
"laporan dahulu". **Veto saya:** tiada laporan kewangan baharu sehingga makna
medan disahkan — saya tidak akan mengulang ralat 13.5× ke dalam laporan pengurusan.

**Kata putus (Pengerusi).**

Cadangan asal Arena — "(A) pembetulan dahulu, kemudian (B) pembinaan" —
**DITOLAK sebahagian**. Panel mendapati (A) dan (B) **sebahagiannya bertindan**:
pembinaan domain quotation **sendiri** ialah pembetulan struktur bagi §4.4 dan
§4.5. Membina tampalan dahulu kemudian membina semula ialah dua kali kerja.

**Susunan yang diluluskan:**

| Fasa | Kandungan | Kenapa di sini |
| --- | --- | --- |
| **7A** | **Client master** (`clients`) — pisahkan pelanggan daripada `organizers`, `programmes.client_id`, label UI | Prasyarat §2.8: quotation, pipeline dan tugasan **semua** merujuk pelanggan |
| **7B** | **Simpanan fail sumber** (bucket **peribadi**) + keupayaan **parse-semula** batch | §2.5: tanpa ini, 1124 baris lama tidak boleh dibaiki dan 299 baris quotation tidak boleh dimuatkan |
| **7C** | **Domain Quotation berdiri sendiri** — jadual `quotations` (`programme_id` **NULL-able**), parser entity kind, routing RPC, UI, laporan | Menghapuskan §4.4 + §4.5 **secara struktur**; keputusan pengguna #1 |
| **7D** | Audit + baiki **6 invois** dan **1124 baris staging** sedia ada | Bergantung pada 7B (parse-semula) dan 7C (destinasi betul) |
| **7E** | **Pipeline / Funnel** (forecast, weighted, probability, sector, salesman) | 316 baris sumber; bergantung pada `clients` |
| **7F** | **P&L / Aging / Kos Jualan / Komisen** | Bergantung pada quotations + invoices yang sudah dipisah |
| **7G** | **Tugasan pejabat** + **`certificate_no`** | Kecil, jelas, 101 baris |
| **7H** | Pengesahan akhir, UAT penuh, dokumentasi | Penutup |

**Bertindak selari (tidak menyekat pembinaan):** satu prompt **baca-sahaja**
kepada ChatGPT yang **hanya** menutup: (i) struktur blok **invois** 7A yang
terselamat daripada pembinaan semula, (ii) audit 6 invois sedia ada,
(iii) siasatan drift `invoices.sst_amount`. **Pengesahan blok quotation
DIGANTUNG** sehingga 7C — ia akan ditulis semula.

**Bantahan direkodkan.** Tiada bantahan penuh. **Bantahan separa QA (§2.7)**
diterima dan diserap: pengesahan dihadkan kepada struktur yang terselamat.
**Amaran §2.5** (simpanan fail sumber tidak boleh ditunda) **diterima** dan
mengubah susunan — 7B dinaikkan **sebelum** 7C, walaupun cadangan asal Arena
meletakkannya di hujung.

**Gate.** 7A, 7B dan 7C semuanya memerlukan **migrasi SQL live** → HARD GATE.
Arena akan menulis kod + ujian PGlite + prompt; **pengguna meluluskan**,
ChatGPT melaksanakan.

---

*Sila tambah rekod `DP-2`, `DP-3`, … di bawah seksyen ini bagi setiap sidang
seterusnya. Jangan padam rekod lama — ia jejak audit keputusan.*
