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
Terdapat dua lapisan kerja terbuka: (A) **pembetulan** — sahkan badan RPC 8A yang
direkonstruksi, audit 6 invois + 1124 baris staging sedia ada, simpanan fail sumber;
(B) **pembinaan** — 4 domain perniagaan yang mewakili 715 baris data aktif tanpa
tempat. Arena mencadangkan (A) dahulu. Adakah itu betul?

**Fakta yang ditetapkan (diukur, bukan dijangka).**

| Fakta | Bukti |
| --- | --- |
| `idx_invoices_quotation_no_unique` **wujud di live** | Laporan 8A J1e (ChatGPT) |
| 7A J2–J9 🟢, J10 ⏳ | Laporan 7A |
| Langkah 2 8A dilaksanakan sebagai **SQL rekonstruksi**, bukan fail sumber | Pendedahan ChatGPT, Seksyen 3 |
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
yang saya tulis dalam 8A ialah penyelesaian yang betul *untuk model yang salah*.
Ia perlu memadankan merentas program kerana indeks itu global — tetapi dengan
jadual `quotations` berasingan, invois dan quotation tidak lagi bersaing untuk
satu indeks, jadi keseluruhan kelas masalah itu lenyap. **Bantahan separa:**
blok **invois** dalam 8A (pengawal `COALESCE(...,0)` untuk 4 lajur `NOT NULL`,
pengisian `invoice_no`) **turut terselamat** daripada pembinaan semula dan
**mesti tetap disahkan** — ia tidak akan ditulis semula.

**Pakar Kewangan (§2.4).** Sokong kuat. Quotation ada medan yang **tidak masuk
akal** pada invois: `Unit Price`, `No of Unit`, `Discount %`, `SST 8% Amount`,
`Final Price`, `Prepared by`, `Project Status`. Dalam 8A saya terpaksa memuatkan
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
| **8A** | **Client master** (`clients`) — pisahkan pelanggan daripada `organizers`, `programmes.client_id`, label UI | Prasyarat §2.8: quotation, pipeline dan tugasan **semua** merujuk pelanggan |
| **8B** | **Simpanan fail sumber** (bucket **peribadi**) + keupayaan **parse-semula** batch | §2.5: tanpa ini, 1124 baris lama tidak boleh dibaiki dan 299 baris quotation tidak boleh dimuatkan |
| **8C** | **Domain Quotation berdiri sendiri** — jadual `quotations` (`programme_id` **NULL-able**), parser entity kind, routing RPC, UI, laporan | Menghapuskan §4.4 + §4.5 **secara struktur**; keputusan pengguna #1 |
| **8D** | Audit + baiki **6 invois** dan **1124 baris staging** sedia ada | Bergantung pada 8B (parse-semula) dan 8C (destinasi betul) |
| **8E** | **Pipeline / Funnel** (forecast, weighted, probability, sector, salesman) | 316 baris sumber; bergantung pada `clients` |
| **8F** | **P&L / Aging / Kos Jualan / Komisen** | Bergantung pada quotations + invoices yang sudah dipisah |
| **8G** | **Tugasan pejabat** + **`certificate_no`** | Kecil, jelas, 101 baris |
| **8H** | Pengesahan akhir, UAT penuh, dokumentasi | Penutup |

**Bertindak selari (tidak menyekat pembinaan):** satu prompt **baca-sahaja**
kepada ChatGPT yang **hanya** menutup: (i) struktur blok **invois** 8A yang
terselamat daripada pembinaan semula, (ii) audit 6 invois sedia ada,
(iii) siasatan drift `invoices.sst_amount`. **Pengesahan blok quotation
DIGANTUNG** sehingga 8C — ia akan ditulis semula.

**Bantahan direkodkan.** Tiada bantahan penuh. **Bantahan separa QA (§2.7)**
diterima dan diserap: pengesahan dihadkan kepada struktur yang terselamat.
**Amaran §2.5** (simpanan fail sumber tidak boleh ditunda) **diterima** dan
mengubah susunan — 8B dinaikkan **sebelum** 8C, walaupun cadangan asal Arena
meletakkannya di hujung.

**Gate.** 8A, 8B dan 8C semuanya memerlukan **migrasi SQL live** → HARD GATE.
Arena akan menulis kod + ujian PGlite + prompt; **pengguna meluluskan**,
ChatGPT melaksanakan.

---

*Sila tambah rekod `DP-2`, `DP-3`, … di bawah seksyen ini bagi setiap sidang
seterusnya. Jangan padam rekod lama — ia jejak audit keputusan.*

### DP-2 — Reka bentuk induk pelanggan & pengurus akaun (2026-09-04, Fasa 8A)

**Isu.** Keputusan pengguna #2 ialah **satu entiti "Pelanggan"**. Bagaimana ia
dimodelkan: (a) `ALTER TABLE organizers RENAME TO clients`, (b) jadual `clients`
baharu + migrasi + `organizers` jadi pandangan susulan, (c) jadual `clients`
baharu selari, atau (d) kekalkan jadual, betulkan semantik?

**Fakta yang ditetapkan (diukur).**

| Fakta | Bukti |
| --- | --- |
| **Tiada** badan RPC merujuk jadual `public.organizers` | `grep "public.organizers\|FROM organizers\|JOIN organizers"` → hanya `schema-master.sql` (10) + `seed-v4-raw.sql` (8); **0** dalam `sync-import-transaction.sql` / `change-requests.sql` |
| **Tiada** pertanyaan TS `.from('organizers')` | `grep` → **0** padanan |
| Lapisan TS **sudah** bercakap "client" | `programme-mapper.ts:57` → `client: row.organizer_name`; `master-records.ts:159` → `client: p.organizer_name` |
| `organizers` sudah ada medan induk yang betul | `name, short_name, email, phone, address, city, state, postcode, sector, industry, organization_type, is_active, notes, website` |
| `programmes.organizer_id` **boleh NULL**; `organizer_name` **NOT NULL** | `schema-master.sql:423–424` |
| `change_request_allowed_fields` menyimpan **teks** `'organizer_name'` | `lib/change-requests.ts:44` |
| **12** rentetan unik `Account Manager` dalam Quotation Tracker | diukur terus daripada fail |
| **19** staf dalam `User Profiles Mapping.xlsx` | diukur terus |
| `Abu Said` / `Abu said` / `Abu Sa'id` = **3 varian, 1 orang** | perbandingan langsung |
| `Fuzy / Dila`, `Fuzy / Sholihin` = **berbilang orang dalam satu sel** | perbandingan langsung |
| `Fuzy` tiada dalam senarai staf (kemungkinan nama panggilan `Fuziah`) | perbandingan langsung |
| `Ow Zi Qi` tiada dalam senarai staf | perbandingan langsung |

**Pendirian.**

**Arkitek Domain (§2.3).** `organizers` **sudah** merupakan induk pelanggan yang
betul dari segi struktur — `sector`, `industry`, `organization_type`, medan
hubungan, `is_active`. Masalahnya **hanya nama**. Mencipta jadual `clients`
**selari** akan menghasilkan **DUA induk**, yang secara langsung melanggar
keputusan pengguna #2 ("satu entiti"). Jadi (b) dan (c) **ditolak**.

**Arkitek SQL (§2.2).** `ALTER TABLE … RENAME` dalam PostgreSQL **secara automatik**
mengikut FK, indeks, polisi RLS dan grant — jadi (a) lebih selamat daripada
yang dijangka, dan fakta bahawa **tiada badan RPC merujuk jadual itu** membuang
risiko terbesar. **Tetapi** dua bahaya kekal: (i) `change_request_allowed_fields`
menyimpan `'organizer_name'` sebagai **teks**, jadi menamakan semula **lajur**
akan anak-yatimkan baris change_request sedia ada di live — dan kita **tidak
tahu** berapa banyak kerana ia belum diaudit; (ii) `schema-master.sql` dan
`seed-v4-raw.sql` (18 rujukan) akan menjadi **basi**, jadi sebarang pemasangan
semula skema akan **mencipta semula** `organizers` sebagai jadual yatim.

**Pengerusi.** Kedua-dua bahaya §2.2 boleh diurus, tetapi kedua-duanya
**kosmetik di lapisan DB** manakala lapisan TS sudah betul. Di bawah kesuntukan
masa, soalan sebenar ialah: **mana yang memberi faedah berfungsi?**

**Pakar Kewangan (§2.4).** **Di sini faedah berfungsi itu berada, dan ia bukan
pada nama jadual.** 12 rentetan → ~8 orang sebenar bermakna **setiap laporan
"mengikut pengurus akaun" kini salah secara senyap**. `Fuzy / Dila` bukan
satu orang. `Fuzy` mungkin `Fuziah` — tetapi **"mungkin" ialah tekaan, dan saya
veto tekaan pada atribusi yang memacu laporan komisen.** Nota: pengurus akaun
bukan *nilai* kewangan, jadi veto mutlak saya tidak terpakai; tetapi prinsip
"jangan reka" kekal.

**QA (§2.7).** Saya boleh uji penyelesaian nama terhadap **12 nilai sebenar vs
19 staf sebenar** dalam PGlite. Itu kriteria bernombor yang kuat. **Syarat:**
fungsi penyelesai mesti **mengembalikan NULL bila kabur**, bukan memilih yang
terdekat. `Fuzy` → **NULL**, bukan `Fuziah`.

**Penyemak Keselamatan (§2.8).** `account_manager_id` yang merujuk
`user_profiles` mencipta **pautan antara data kewangan dan identiti staf**.
Ia mesti mewarisi RLS `user_profiles` dan **tidak** boleh mendedahkan peranan
atau status akaun staf kepada pengguna yang hanya boleh lihat invois.
**Veto** jika pautan itu didedahkan tanpa semakan peranan.

**Arkitek Aplikasi (§2.6).** Setuju tangguhkan rename. Nota: `programme-actions.ts:123`
menapis `p.client` menggunakan `query.organizer` — **percampuran nama dalam satu
baris**. Saya akan betulkan penamaan dalaman TS (kosmetik, tiada risiko live)
supaya hutang itu tidak merebak ke modul quotation.

**BA & Pelaporan (§2.9).** Sokong kuat penumpuan pada pengurus akaun. Tanpa
penyelesaian itu, tiga laporan yang 8C/8E/8F akan hasilkan — untung mengikut
pelanggan, pipeline mengikut pengurus, komisen — **semuanya akan mewarisi
ralat 12→8**. Baiki **sebelum** laporan dibina, bukan selepas.

**Kata putus (Pengerusi).**

1. **(a) RENAME jadual DITANGGUHKAN ke Fasa 8H** (tetingkap UAT penuh). Sebab:
   faedah berfungsi sifar (TS sudah berkata "client"), dan ia memerlukan
   audit `change_request_allowed_fields` di live + penyelarasan 18 rujukan
   dalam 2 fail skema. **Hutang penamaan DIREKODKAN, tidak dilupakan.**
2. **(b)/(c) DITOLAK** — dua induk melanggar keputusan pengguna #2.
3. **8A dilaksanakan sebagai ADDITIF:**
   - Medan induk pelanggan yang **diperlukan oleh quotation/invois** tetapi
     tiada: `client_code`, `sst_registration_no`, `billing_address`,
     `payment_terms_days`
   - **Penyelesaian pengurus akaun**: kekalkan `account_manager` TEXT (nilai
     mentah, untuk audit) **+** tambah `account_manager_id` (pautan selesai)
   - **Jadual alias yang disahkan manusia** `account_manager_aliases` —
     kerana `Fuzy`→`Fuziah` ialah pengetahuan manusia, bukan sesuatu yang
     boleh dikira. Sistem **mengingat** keputusan manusia; ia tidak **meneka**.
   - `COMMENT ON TABLE` yang menyatakan `organizers` **ialah** induk pelanggan
4. **Penyelesai mesti NULL bila kabur.** Sel berbilang orang (`/`, `,`) → NULL.
   Tiada padanan → NULL. **Tiada padanan kabur "terdekat".**
5. **Veto §2.8 diterima:** pautan `account_manager_id` tidak boleh mendedahkan
   peranan/status staf melalui laluan invois.

**Bantahan direkodkan.** Tiada. **Hutang teknikal direkodkan:** rename
`organizers`→`clients` + `organizer_name`→`client_name` di Fasa 8H, tertakluk
kepada audit `change_request_allowed_fields` di live.

**Gate.** Migrasi 8A = **SQL live** → HARD GATE. Arena tulis kod + ujian
PGlite + prompt; pengguna meluluskan; ChatGPT melaksanakan.

---

## DP-2a — Peraturan padanan token pertama (2026-09-04, semasa pelaksanaan Fasa 8A)

**Isu timbul semasa ujian, bukan semasa reka bentuk.** `scripts/test-client-master.mjs`
menemui bahawa `'Nur'` MENYELESAI ke `Nur Aleeya`, sedangkan jangkaan asal ialah NULL.

**Fakta diukur:**
- Dalam 18 staf sebenar, HANYA SATU staf mempunyai token pertama `nur`
  (`Ainur Najwa` bermula dengan `ainur`, bukan `nur`).
- Peraturan token-pertama yang sama inilah yang menyelesaikan `'Abu Said'` →
  `Abu Sa'id` (4 baris) dan `'Zalina'` → `Zalina Sayuti` (7 baris) dalam data sebenar.
- Menggugurkan peraturan ini menurunkan liputan automatik **8/12 → 6/12**.

**Kedudukan:**
- *QA (§2.7):* menentang — "Nur" ialah serpihan nama, menyelesaikannya ialah tekaan.
- *BA (§2.9):* menyokong — padanan token pertama yang TEPAT dan UNIK bukan tekaan;
  ia satu-satunya tafsiran yang mungkin dalam senarai staf semasa.
- *SQL Architect (§2.2):* sifat keselamatan yang sebenar ialah **SYARAT KEUNIKAN**,
  dan ia boleh diuji secara langsung.

**KATA PUTUS:** Peraturan token-pertama **DIPERTAHANKAN**. Jangkaan ujian yang
salah, bukan kod. Sifat keselamatan sebenar diuji secara eksplisit:
- `'Nur'` → `Nur Aleeya` (unik) ✅
- selepas staf kedua `Nur Batrisyia` ditambah → `'Nur'` → **NULL** ✅
- `'arah'` (2 staf mengandungi substring) → **NULL** ✅
- `'Ain'` (3 aksara) → **NULL** — had panjang minimum 4 menghalang padanan serpihan ✅

**Tindakan:** tiada perubahan kod; ujian diperbetulkan + 3 kes keunikan ditambah.

---

## DP-3 — Penomboran semula roadmap: 7A–7H → 8A–8H (2026-09-04)

**Fakta:** `docs/PROMPT-7A-FIX-FIELD-MAPPING.md` SUDAH wujud, SUDAH 🟢 DILULUSKAN,
dan SUDAH dilaksanakan di live (J2–J9 🟢). Roadmap DP-1 menggunakan label "7A"
untuk *client master* — perlanggaran penamaan yang Arena sendiri cipta.

**KATA PUTUS:** Roadmap DP-1 **dinomborkan semula kepada 8A–8H**. Label 7A
KEKAL merujuk `PROMPT-7A-FIX-FIELD-MAPPING` yang sudah dilaksanakan — sejarah
tidak ditulis semula. 31 rujukan dalam dokumen ini dikemas kini; 1 rujukan
sejarah (`| 7A J2–J9 🟢, J10 ⏳ | Laporan 7A |`) sengaja dikekalkan.

| Lama | Baharu | Skop |
|---|---|---|
| 7A | **8A** | Induk pelanggan + penyelesaian pengurus akaun |
| 7B | **8B** | Simpanan fail sumber + parse-semula |
| 7C | **8C** | Domain quotation berdiri sendiri |
| 7D | **8D** | Audit + baiki 6 invois & 1124 baris staging |
| 7E | **8E** | Pipeline / Funnel |
| 7F | **8F** | P&L / Aging / Kos Jualan / Komisen |
| 7G | **8G** | Tugasan pejabat + `certificate_no` |
| 7H | **8H** | Rename `organizers`→`clients`, cleanup, UAT penuh |

---

## DP-4 — Regresi allowlist W1 dikesan oleh ujian sedia ada (2026-09-04)

**Fakta:** `scripts/test-preflight-b-sql.mjs` §8 mengira inventori jadual rasmi
repo dan membandingkannya dengan allowlist `W1_public_tables` dalam
`docs/PROMPT-6C-AUDIT-LEGACY-TABLES.md`. Menambah `account_manager_aliases`
(8A) menjadikan inventori **16** jadual, tetapi allowlist masih **15** → ujian
GAGAL dengan tepat.

**Kata putus:** allowlist W1 dikemas kini kepada 16, dengan anotasi bahawa
PROMPT-6C sudah dijalankan sebelum ini (laporan lama mengira 15) dan bahawa
jangkaan W1 SEMULA selepas 8A dipasang = **16 rasmi + 3 warisan = 19**.

**Pengajaran direkodkan:** menambah jadual baharu WAJIB menyemak allowlist
dokumen sedia ada. Ujian §8 wujud tepat untuk menangkap kesilapan ini —
ia berfungsi seperti direka.

---

## DP-5 — Fungsi `STABLE` tidak nampak baris daripada kenyataan yang sama (2026-09-04)

**Diuji di PGlite, bukan dijangka** (pelajaran #4 templat prompt).

Dakwaan asal dalam draf ujian Fasa 8A: alias boleh diuji dengan
`INSERT ... RETURNING (SELECT resolve_account_manager(...))` dalam satu kenyataan.

**Keputusan PGlite:** mengembalikan **NULL**, bukan `user_id`.

**Punca:** `resolve_account_manager` diisytiharkan `STABLE`. Fungsi `STABLE`
menggunakan **snapshot yang sama** dengan kenyataan pemanggilnya, jadi ia tidak
nampak baris yang dimasukkan oleh kenyataan itu sendiri. Baris itu hanya kelihatan
pada kenyataan **seterusnya**.

**Kata putus:** ujian alias di live MESTI memisahkan `INSERT` dan `SELECT` kepada
dua kenyataan dalam transaksi yang sama, kemudian `ROLLBACK`:

```sql
BEGIN;
INSERT INTO public.account_manager_aliases (raw_text, user_id, confirmed_by, notes)
VALUES ('Fuzy', '<uuid_fuziah>', auth.uid(), 'ujian — akan dibatalkan');
SELECT public.resolve_account_manager('Fuzy');   -- kenyataan BERASINGAN
ROLLBACK;
```

**Kenapa ia penting:** tanpa nota ini, ChatGPT akan melaporkan kriteria J6 GAGAL
di live walaupun kod betul — blocker palsu, iaitu tepat perkara yang templat
prompt ini wujud untuk elakkan.

**Tindakan:** seksyen [L] dalam `scripts/test-client-master.mjs` membuktikan
kedua-dua bentuk; nota amaran dimasukkan ke dalam `docs/PROMPT-8A-CLIENT-MASTER.md`.

---

## DP-6 — Drift enum `app_role` antara repo dan live adalah TERKAWAL (2026-09-04)

**Dikesan semasa membina 8A-2, sebelum prompt J1 dihantar kepada pengguna.**

**Fakta:**
- `schema-master.sql:202` mencipta `app_role` dengan **7** nilai:
  `viewer, executive, manager, admin, staff, finance, head_governance`.
- `user-management.sql` Bahagian 1a menjalankan
  `ALTER TYPE public.app_role ADD VALUE 'super_admin'` → **8** nilai.
- Fasa 6 **sudah dipasang** di live (PROMPT-6G ✅ SELESAI), jadi **live = 8**.

**Kesilapan Arena (dua langkah, kedua-duanya dibetulkan):**
1. Draf `client-master.sql` menulis `'super_admin'::public.app_role` dalam
   polisi RLS → **ralat 22P02** dalam PGlite (bootstrap hanya memuatkan
   `schema-master.sql`).
2. Pembetulan pertama keterlaluan ke arah lain: prompt J1 memberitahu ChatGPT
   bahawa `super_admin` **dijangka TIADA** di live. Itu akan menghasilkan
   **penemuan palsu** — ChatGPT akan melaporkan 🔴 untuk keadaan yang betul.

**Punca akar kedua-duanya sama:** ujian PGlite memuatkan **sebahagian** fail
skema, jadi ia mengesahkan keadaan yang **tidak sama** dengan live.

**KATA PUTUS:**
1. `client-master.sql` **KEKAL** tanpa `'super_admin'::app_role`. Super Admin
   dilindungi oleh `has_role()` sendiri (`schema-master.sql:274`), yang
   mengembalikan `true` untuk SEMUA peranan bila `role = 'super_admin'`.
   Dibuktikan secara langsung oleh seksyen [5] ujian J1.
2. **Peraturan baharu untuk semua ujian PGlite:** bootstrap MESTI memuatkan
   **set fail skema yang sama seperti urutan pemasangan live**
   (`schema-master` → `schema-import-staging` → `sync-import-transaction` →
   `governance-lock` → `change-requests` → `fix-rls-recursion` →
   `fix-add-programme-categories` → `user-management` → `updated-at-triggers` →
   `client-master` → `account-manager-resolution`). Ujian yang memuatkan
   sebahagian sahaja **mesti menyatakan** bahawa ia berbuat demikian dan
   **tidak boleh** membuat dakwaan tentang keadaan live.
3. Jangkaan J1d dibetulkan kepada **8 nilai, `super_admin` ADA**.

**Tindakan:** kedua-dua prompt dikemas kini; `test-prompt-8a-j1-queries.mjs`
kini memuatkan `user-management.sql` dan menguji `has_role()` untuk
`super_admin` secara langsung. **56/56 lulus.**

---

## DP-7 — 🔴 KECACATAN PENGELUARAN: trigger `set_updated_at` pada `import_staging` yang tiada lajur `updated_at` (2026-09-04)

**Dikesan oleh `scripts/test-account-manager-resolution.mjs`** — iaitu ujian
pertama yang memuatkan **set fail skema penuh mengikut urutan pemasangan live**
(seperti diwajibkan oleh DP-6). Ujian sebelumnya memuatkan hanya sebahagian fail,
jadi interaksi antara dua fail ini **tidak pernah diuji**.

### Fakta (diukur, bukan dijangka)

| Perkara | Bukti |
|---|---|
| `updated-at-triggers.sql` menyenaraikan `import_staging` dalam `targets` | baris 95–99, 11 jadual + `profiles` = **12** |
| `set_updated_at()` menulis `NEW.updated_at = now()` | baris 71–78 |
| `schema-import-staging.sql` **TIDAK** mentakrifkan `updated_at` | `grep -ic updated_at` = **0** |
| `sync_import_transaction` **MENG-UPDATE** `import_staging` | baris **321** dan **727** |
| Fasa 6G dilaporkan ✅ SELESAI dengan **G1 = 12/12** | laporan GPT PROMPT-6G |
| Ralat sebenar yang dihasilkan | `record "new" has no field "updated_at"` (42703) — **direproduksi dalam PGlite** |

### Kesimpulan bersyarat

Jika `import_staging` di live **tiada** lajur `updated_at`, maka **SETIAP**
kemas kini baris staging gagal. Kerana `sync_import_transaction` adalah
**ATOMIK**, **seluruh batch import Excel gagal**.

**Ini belum disahkan di live.** Repo ini sudah diketahui mempunyai drift di
mana live ada lajur yang repo tidak takrifkan (contoh: `invoices.sst_amount`,
laporan PROMPT-7A J1b). Jadi `import_staging.updated_at` **mungkin** wujud di
live. Panel menolak untuk mengandaikan sama ada arah.

**Tindakan bukti:** query **J1i** dan **J1j** ditambah kepada
`docs/PROMPT-8A-J1-READONLY.md` (read-only, tiada kelulusan diperlukan).

### Kata putus

1. **Punca akar dibetulkan dalam repo** — `updated-at-triggers.sql` kini
   mempunyai **GUARD**: ia melangkau mana-mana jadual dalam `targets` yang
   tiada lajur `updated_at`, dengan `RAISE NOTICE`. Ini menghapuskan **kelas**
   ralat ini, bukan hanya contoh ini.
2. **`schema-import-staging.sql`** kini mentakrifkan
   `updated_at timestamptz not null default now()` supaya pemasangan baharu
   konsisten.
3. **`lib/supabase/fix-import-staging-updated-at.sql`** disediakan untuk live:
   **ADDITIF sepenuhnya** (1 `ADD COLUMN IF NOT EXISTS`), idempoten, tiada
   DROP/DELETE/TRUNCATE. **HARD GATE** — memerlukan kelulusan pengguna dan
   hanya patut dijalankan **selepas** J1i mengesahkan lajur itu tiada.
4. **Alternatif ditolak:** mengisi `updated_at` daripada `created_at` dengan
   UPDATE **tidak boleh berfungsi** — trigger BEFORE UPDATE menimpanya dengan
   `now()` juga. Menambah lajur tidak mencetus trigger, jadi ia satu-satunya
   laluan bersih. Baris sedia ada menerima cap masa pemasangan; ini
   **direkodkan sebagai kompromi semantik yang sedar**, bukan oversight.
5. **Alternatif ditolak:** `DROP TRIGGER` pada `import_staging`. Ia membuang
   keupayaan audit yang memang diingini, dan ia operasi merosakkan pada
   produksi.

### Pengajaran (ditambah kepada peraturan DP-6)

Ujian PGlite yang memuatkan **sebahagian** fail skema bukan sahaja boleh
menghasilkan jangkaan salah tentang live — ia boleh **menyembunyikan kecacatan
pengeluaran** yang hanya muncul apabila dua fail berinteraksi. Set penuh wajib.

---

## DP-8 — KATA PUTUS: sel berbilang orang diagih kepada Fuziah (2026-09-04)

**Status: ✅ DIPUTUSKAN OLEH PENGGUNA** (sebelumnya TERBUKA)

### Soalan asal
`'Fuzy / Dila'` (4 baris) dan `'Fuzy / Sholihin '` (2 baris) masing-masing
mengandungi **dua orang**. Veto Kewangan §2.4 melarang **sistem** memilih
seorang, jadi 6 baris itu tidak akan pernah diagih kepada sesiapa — termasuk
untuk laporan komisen Fasa 8F.

### Keputusan pengguna (verbatim)
> "Untuk dp8, dua dua tu masukkan Fuzy aka Fuziah"

### Tafsiran yang dilaksanakan
| Nilai mentah | Baris | Diagih kepada |
|---|---|---|
| `Fuzy` | 8 invois + 1 staging | **Fuziah** (pengesahan nama panggilan) |
| `Fuzy / Dila` | 4 | **Fuziah** |
| `Fuzy / Sholihin ` | 2 | **Fuziah** |

Keputusan ini **turut menyelesaikan** nilai `Fuzy` yang sebelum ini kabur —
pengguna secara eksplit menyatakan "Fuzy **aka** Fuziah".

### Kesan yang direkodkan (tidak disembunyikan)
* **Dila (Adilah) tidak menerima kredit** untuk 4 baris `Fuzy / Dila`.
* **Sholihin tidak menerima kredit** untuk 2 baris `Fuzy / Sholihin `.
* Ini akan mempengaruhi laporan komisen Fasa 8F.
* `Ow Zi Qi` (3 baris invois + 1 staging) **KEKAL tanpa agihan** — nama itu
  tiada dalam senarai 18 staf, dan pengguna **tidak** membuat keputusan
  mengenainya. ⏳ masih terbuka.

**Liputan selepas DP-8: 11 daripada 12 nilai selesai.** Hanya `Ow Zi Qi` kekal.

### Kedudukan pakar
* **Kewangan (§2.4):** membantah pengagihan penuh kepada seorang — Dila dan
  Sholihin kehilangan kredit untuk kerja yang mereka turut lakukan. **Bantahan
  DIREKODKAN.** Namun veto ini terpakai kepada **sistem**, dan pengguna ialah
  pihak berkuasa tertinggi untuk keputusan perniagaan.
* **BA (§2.9):** menyokong — lebih baik diagih kepada seorang yang dikenal
  pasti daripada tidak diagih langsung; 6 baris kini boleh dilaporkan.
* **QA (§2.7):** menerima, dengan syarat keputusan itu **boleh diaudit dan
  boleh dibatalkan**. Syarat dipenuhi.
* **SQL Architect (§2.2):** melaksanakan dengan menukar **susunan** logik,
  bukan dengan melemahkan mana-mana peraturan.

### Kata putus pelaksanaan
1. **`resolve_account_manager()` ditukar susunan:** alias yang disahkan manusia
   kini diperiksa **SEBELUM** penolakan berbilang-orang (langkah 2, bukan 3).
   Alasan: peraturan berbilang-orang wujud untuk menghalang **sistem** meneka.
   Ia bukan untuk menghalang **manusia** memutuskan. Tanpa susunan ini,
   keputusan pengguna tidak boleh dilaksanakan sama sekali.
2. **Veto §2.4 KEKAL berkuat kuasa untuk semua nilai yang belum disahkan
   manusia.** Dibuktikan oleh ujian: `'Faiz / Siti'` (tiada alias) → NULL.
3. **`am_confirm_alias()` TIDAK LAGI menolak** sel berbilang orang (ralat 22023
   dibuang). Sebagai gantinya ia merekodkan `sel_berbilang_orang = true` dan
   `asas = 'Panel DP-8: keputusan pengguna 2026-09-04'` dalam jejak audit,
   supaya keputusan ini boleh diaudit atau dibatalkan kemudian melalui
   `am_revoke_alias()`.
4. **`am_unresolved_values()` ditukar susunan kategori:** `SELESAI` kini
   didahulukan, jadi sel berbilang orang yang sudah diputuskan manusia
   dilaporkan sebagai `SELESAI`, bukan `BERBILANG_ORANG`.
5. **Keputusan direkodkan sebagai DATA, bukan kod:**
   `lib/supabase/seed-account-manager-aliases.sql` — idempoten, menyelesaikan
   Fuziah melalui **nama** (bukan UUID keras), dan **berhenti dengan ralat
   yang jelas** jika nama itu kabur atau tiada.

### Pengesahan
* `scripts/test-client-master.mjs`: **85/85** — termasuk bukti bahawa
  `'Faiz / Siti'` tanpa alias **kekal NULL** (veto §2.4 masih hidup)
* `scripts/test-account-manager-resolution.mjs`: **142/142** — termasuk
  seksyen [P] yang menjalankan seed DP-8 dua kali (idempoten) dan mengesahkan
  kelima-lima varian (`Fuzy`, `Fuzy / Dila`, `Fuzy / Sholihin`,
  `Fuzy / Sholihin ` dengan ruang hujung, `  FUZY  `) menyelesaikan ke Fuziah

### Yang masih terbuka
⏳ **`Ow Zi Qi`** — 3 baris invois + 1 baris staging, tiada padanan staf.
Perlu keputusan pengguna: staf baharu yang belum didaftarkan, orang luar
(bukan staf MIMOS Academy), atau ejaan berbeza bagi staf sedia ada?
