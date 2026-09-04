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

---

## DP-9 — KATA PUTUS: `Ow Zi Qi` ialah orang luar (2026-09-04)

**Status: ✅ DIPUTUSKAN OLEH PENGGUNA**

### Soalan
Selepas DP-8 menyelesaikan 11 daripada 12 nilai `Account Manager`, hanya
`'Ow Zi Qi'` (3 baris invois + 1 baris staging) yang tinggal. Nama itu tiada
dalam senarai 18 staf `User Profiles Mapping.xlsx`. Panel bertanya: staf baharu,
orang luar, atau ejaan berbeza bagi staf sedia ada?

### Keputusan pengguna
> **Orang luar — bukan staf MIMOS Academy. Biarkan NULL dan laporkan berasingan.**

### Masalah reka bentuk yang timbul daripada keputusan ini
Sekilas, "biarkan NULL" memerlukan **tiada** kerja. Tetapi itu salah:

Tanpa rekod, `'Ow Zi Qi'` dan nilai yang **belum** diputuskan kelihatan
**SERUPA** dalam laporan — kedua-duanya `account_manager_id IS NULL`. Maksudnya
berbeza sepenuhnya:

| Keadaan | Makna | Tindakan |
|---|---|---|
| `'Ow Zi Qi'` | **SUDAH** diputuskan manusia: orang luar | tiada |
| nilai belum disahkan | **BELUM** diputuskan: sistem tidak tahu | perlu perhatian |

Jika dicampur, laporan Fasa 8E (pipeline) dan 8F (komisen) akan sentiasa
menunjukkan baki "tidak diagih" tanpa membezakan yang **selesai** daripada yang
**terbuka** — jadi tiada siapa tahu sama ada baki itu perlu tindakan.

### Kata putus pelaksanaan
1. **Jadual baharu `public.external_account_managers`**
   (`lib/supabase/external-account-managers.sql`) — rekod nilai yang disahkan
   manusia sebagai orang luar, dengan `display_name` untuk laporan dan `reason`
   (ejen / rakan kongsi / staf klien / bekas staf) supaya pengecualian komisen
   boleh dijelaskan.
2. **Kategori `LUAR`** ditambah kepada `am_unresolved_values()`, berasingan
   daripada `TIADA_PADANAN`. Susunan keutamaan: `SELESAI` → `LUAR` →
   `BERBILANG_ORANG` → `TIADA_PADANAN` → `PERLU_PENGESAHAN`.
3. **`account_manager_id` KEKAL NULL** untuk orang luar — mereka tidak dipaut
   ke `user_profiles` kerana mereka bukan staf. Ini mematuhi keputusan pengguna
   secara harfiah.
4. **Tiga fungsi:** `is_external_account_manager()`, `am_confirm_external()`,
   `am_revoke_external()`. Semua `SECURITY DEFINER`, `search_path=public`,
   dikawal `can_resolve_account_managers()`, dan diaudit.
5. **Dua penolakan pertahanan** dalam `am_confirm_external()`:
   - nilai yang **sudah menyelesaikan kepada staf** → tolak (22023). Jangan
     labelkan staf sebagai luar; guna `am_confirm_alias()`.
   - **sel berbilang orang** → tolak (22023). Satu klasifikasi luar ialah untuk
     SATU orang; `'Fuzy / Dila'` bukan seorang orang luar.
6. **Keputusan direkodkan sebagai DATA** dalam
   `lib/supabase/seed-account-manager-aliases.sql` Bahagian 2 — idempoten.
7. **Allowlist W1 dikemas kini 16 → 17** jadual rasmi (pelajaran DP-4:
   menambah jadual baharu WAJIB menyemak allowlist dokumen sedia ada, jika
   tidak `test-preflight-b-sql.mjs` §8 gagal).

### Hasil akhir
**Setiap satu daripada 12 nilai `Account Manager` sebenar kini mempunyai
keputusan manusia di belakangnya:**

| Kategori | Bilangan nilai | Baris |
|---|---|---|
| `SELESAI` (diagih kepada staf) | 11 | 262 invois + 4 staging |
| `LUAR` (sengaja tidak diagih) | 1 | 3 invois + 1 staging |
| `TIADA_PADANAN` / `BERBILANG_ORANG` / `PERLU_PENGESAHAN` | **0** | **0** |

Tiada lagi baki senyap.

### Kedudukan pakar
* **BA (§2.9):** menyokong kuat — pemisahan `LUAR` vs `TIADA_PADANAN` ialah
  perkara yang membolehkan laporan "perlu tindakan" menjadi bermakna.
* **Kewangan (§2.4):** menerima — `reason` memberikan asas audit untuk
  mengecualikan baris luar daripada komisen.
* **Keselamatan (§2.8):** menerima — jadual ini mendedahkan hanya teks dan UUID
  pengesah; tiada peranan atau status staf. Polisi tulis dihadkan kepada
  admin / head_governance / finance, padan dengan `account_manager_aliases`.
* **SQL Architect (§2.2):** memilih jadual berasingan daripada menambah lajur
  penanda pada `account_manager_aliases`, kerana `user_id` di sana ialah
  `NOT NULL REFERENCES user_profiles` — orang luar tidak boleh memenuhinya
  tanpa melemahkan kekangan itu.

### Pengesahan
`scripts/test-account-manager-resolution.mjs`: **145/145 LULUS**, termasuk
seksyen [Q] yang menguji ketiga-tiga fungsi DP-9, kedua-dua penolakan
pertahanan, kawalan kebenaran, jejak audit, dan idempotensi.

### Nota sandbox
Reset sandbox #7 berlaku semasa kerja DP-9 (`node_modules` dikosongkan, git
terpusing ke `535fb13`). Semua fail kerja terselamat; dipulihkan dengan
`git fetch` + `git reset --mixed` ke `b79769e` kemudian `npm install`.
Tiada kerja hilang.

---

## DP-10 — Keputusan J1 live: tiga penemuan yang mengubah rancangan pemasangan (2026-09-04)

**Sumber:** laporan ChatGPT untuk `docs/PROMPT-8A-J1-READONLY.md`, dijalankan
terhadap pangkalan data live. Semua nilai di bawah adalah **bukti verbatim daripada live**,
bukan andaian.

### 10.1 🔴 Ref projek dalam dua fail Arena adalah SALAH (typo Arena)

| | Nilai | Panjang |
|---|---|---|
| Ditulis oleh Arena dalam 2 fail 8A | `lmenmfsbjgxcfhnykkgow` | **21** aksara |
| Ref live yang sah | `lmenmfsbjgxfhnykkgow` | **20** aksara |

ChatGPT menerima `ZodError ... ref must be exactly 20 characters long`,
kemudian menyambung dengan ref yang betul.

**Semakan repo membuktikan ini salah Arena, bukan salah dokumentasi lama:**
SEMUA prompt terdahulu (2E, 3, 4, 4B, 6, 6B, 6G, …) sudah menggunakan ref
20-aksara yang **betul**. Hanya `PROMPT-8A-CLIENT-MASTER.md` dan
`PROMPT-8A-J1-READONLY.md` — kedua-duanya dicipta dalam sesi ini — mengandungi
varian 21-aksara.

**Tindakan:** kedua-dua fail dibetulkan; imbasan seluruh repo mengesahkan
**sifar** baki. Ref 21-aksara itu berasal daripada konteks sesi Arena yang
rosak, bukan daripada repo.

### 10.2 🟢 DP-7 DITUTUP — bukan kecacatan live (drift live→repo)

| Bukti live | Nilai |
|---|---|
| `import_staging.updated_at` | **WUJUD**, `timestamp with time zone`, `NOT NULL`, default `now()` |
| trigger pada `import_staging` | `bilangan_trigger = 1`, `ada_lajur_updated_at = true` → 🟢 OK |
| 11 jadual lain dalam `targets` | semua 🟢 OK |

**Kesimpulan:** live **TIDAK** rosak. Import Excel berfungsi.

**Tetapi pembaikan repo Arena tetap BETUL dan tetap diperlukan** — kerana
`schema-import-staging.sql` **tidak** mentakrifkan lajur itu, sedangkan live
ada. Itu ialah drift **live→repo**: pemasangan baharu daripada repo akan
menghasilkan pangkalan data yang **rosak** (DP-7), walaupun live semasa sihat.
Repo kini sepadan live.

**`fix-import-staging-updated-at.sql` TIDAK perlu dijalankan di live** — ia
akan menjadi no-op (`ADD COLUMN IF NOT EXISTS`). Panel memutuskan untuk
**MENGECUALIKANNA** daripada prompt pemasangan: menjalankan SQL yang tidak
diperlukan pada produksi ialah risiko yang boleh dielakkan.

### 10.3 🟠 Live mempunyai SIFAR nilai `Account Manager`

**J1f mengembalikan `[]`** — tiada nilai `account_manager` yang bukan-null dan
bukan-kosong dalam **`invoices` (6 baris)** mahupun **`import_staging` (1124 baris)**.

Ini **mengubah jangkaan pelaksanaan** secara material:

| Fungsi | Jangkaan SEMULA |
|---|---|
| `am_backfill_account_manager()` | akan mengisi **0 baris** — bukan kegagalan |
| `am_backfill_preview()` | `akan_diisi = 0`, `kekal_null = 0` |
| `am_unresolved_values()` | **0 baris** — tiada apa untuk diputuskan |
| seed DP-8/DP-9 | masih **BERNILAI**: ia pra-daftar keputusan supaya apabila Quotation Tracker **diimport kelak**, 12 nilai itu selesai dengan serta-merta |

**Ini mengesahkan urutan yang betul:** seed alias **SEBELUM** import Quotation
Tracker, bukan selepas.

12 nilai `Account Manager` yang diukur (DP-2) wujud **hanya dalam fail Excel
sumber**, bukan dalam pangkalan data live. Itu selaras dengan DP-1 Fasa 8B
(simpanan fail sumber + parse-semula) — Quotation Tracker belum pernah
dimuatkan ke live.

### 10.4 🟠 `user_profiles` = 20 baris, bukan 18

Ujian PGlite Arena menyemai **18 staf bernama** daripada
`User Profiles Mapping.xlsx`. Live ada **20** profil.

**Yang belum diketahui:** nama sebenar 20 profil itu. J1 tidak memintanya.
Ini penting kerana `resolve_account_manager()` bergantung kepada **syarat
keunikan** — jika live mengandungi dua staf yang berkongsi token pertama atau
substring, beberapa nilai yang dijangka selesai akan kembali **NULL**.

ChatGPT **enggan mereka-reka** perbandingan ini dan menandanya
`⏳ MENUNGGU PENGGUNA` — tingkah laku yang betul.

**Tindakan:** query **J0** ditambah kepada prompt pemasangan untuk
menyenaraikan 20 nama live + bentuk ternormal + analisis keunikan, **sebelum**
pemasangan. Dengan itu J6 boleh ditafsir berdasarkan realiti live, bukan
andaian 18 nama.

### 10.5 🟠 Kecacatan query J1j Arena — positif palsu (ChatGPT mengesannya)

CASE dalam J1j tidak membezakan **"jadual tidak wujud"** daripada
**"jadual wujud + trigger ada + lajur tiada"**. `account_manager_aliases`
memang belum wujud (selaras J1b), jadi `bilangan_trigger = 0` — tetapi query
melabelnya 🔴.

ChatGPT **menolak tafsiran itu dengan betul** dan tidak mengubah skema.

**Tindakan:** J1j ditulis semula menggunakan `to_regclass()` dengan **empat**
keadaan berbeza (⚪ tidak wujud / 🔴 DP-7 sebenar / 🟢 lajur wujud / ⚪ tiada
trigger tiada lajur). `scripts/test-prompt-8a-j1-queries.mjs` kini mengandungi
regression test yang memastikan positif palsu ini **tidak boleh berulang**.

### 10.6 Baseline live yang direkodkan (untuk J7 — pengesahan tiada perubahan data)

| Jadual | Baris |
|---|---|
| `audit_logs` | 44 |
| `import_staging` | 1124 |
| `invoices` | 6 |
| `organizers` | 12 |
| `programmes` | 14 |
| `user_profiles` | 20 |
| **jadual `public`** | **18** (15 rasmi + 3 warisan) |

Selepas pemasangan 8A + 8A-2 + DP-9: **18 → 20** jadual public
(`account_manager_aliases` + `external_account_managers`), iaitu
**17 rasmi + 3 warisan**.

`audit_logs` akan **bertambah** (seed DP-8/DP-9 menulis jejak audit) — itu
dijangka dan mesti dilaporkan, bukan disembunyikan.

### 10.7 Pengajaran direkodkan

1. **Jangan percaya konteks sesi sendiri untuk pengecam infrastruktur.**
   Ref projek mesti disalin daripada repo, bukan daripada ingatan.
2. **Query diagnostik mesti membezakan "tidak wujud" daripada "rosak".**
   Guna `to_regclass()`.
3. **Drift boleh ke dua arah.** DP-7 ialah drift **live→repo** (live sihat,
   repo akan menghasilkan DB rosak). DP-6 ialah drift **repo→live** yang
   sengaja (Fasa 6 menambah nilai enum). Kedua-duanya memerlukan bukti,
   bukan andaian.
4. **Ukur data live SEBELUM meramalkan kesan pelaksanaan.** Jangkaan
   "backfill akan mengisi 262 baris" adalah **salah** — live ada sifar nilai.

### 10.8 🔴 Dua kecacatan ditemui semasa mengesahkan PROMPT-8A3 (bukan oleh ChatGPT)

Kedua-duanya dikesan oleh `scripts/test-prompt-8a3-install.mjs` (103 ujian)
sebelum prompt dihantar kepada ChatGPT. Kedua-duanya akan menyebabkan
pemasangan live **gagal atau mengelirukan**.

**(a) Penghampiran inline J0 tidak membuang gelaran → perlanggaran PALSU**

Query J0 mengira nama ternormal secara inline kerana
`normalize_person_name()` belum dipasang. Versi asal hanya melakukan tiga
langkah (lower, gantikan tanda baca, runtuhkan ruang) dan **tertinggal
langkah keempat** — pembuangan gelaran.

Kesan yang diukur dalam PGlite dengan set 18 staf Excel:

| Profil | token pertama (inline lama) | token pertama (fungsi sebenar) |
|---|---|---|
| Dr. Ahmad Nizar | `dr` | `ahmad` |
| Dr. Afiq | `dr` | `afiq` |

J0c melaporkan **1 perlanggaran token pertama** yang tidak wujud dalam
penyelesai sebenar. Di live, ChatGPT akan melaporkan "🔴 perlanggaran" dan
panel akan menghabiskan masa menyiasat masalah hantu — atau lebih buruk,
K6 akan dilaraskan berdasarkan ramalan yang salah.

**Pembetulan:** blok J0 kini mengandungi salinan **setia** empat langkah
`normalize_person_name()`, termasuk regexp gelaran
`^(dr|pn|en|ms|mr|mrs|puan|encik|tuan|datuk|datin|hajah|haji|prof|ir|ar|sr|tun|tan sri|puan sri)\s+`.
Selepas pembetulan: J0c = 0 perlanggaran, seperti yang dijangka.

**(b) `set_config('request.jwt.claims', '', …)` memecahkan `::jsonb`**

`seed-account-manager-aliases.sql` kini menetapkan identiti Super Admin di
permulaan (lihat 10.9). Blok pembersihan asalnya menetapkan semula kepada
**rentetan kosong**. Tetapi `auth.uid()` dan
`can_resolve_account_managers()` membaca:

```sql
current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
```

Tetapan yang telah DISET kepada `''` masih **wujud** dalam sesi, jadi
`current_setting(..., true)` mengembalikan `''` dan bukan NULL — dan
`''::jsonb` gagal dengan `invalid input syntax for type json`. Setiap
panggilan selepas seed akan terhenti.

**Pembetulan (dua bahagian):**

1. Guna `'{}'` dan bukannya `''` — JSON sah yang menghasilkan
   `auth.uid() = NULL`, iaitu keadaan asal di SQL Editor.
2. Blok pembersihan kini **memulihkan** identiti asal pemanggil (disimpan
   dalam `tpms.seed_prev_jwt_claims` semasa blok identiti), bukan
   mengosongkannya. Skrip tidak berhak memadam identiti yang ditetapkan
   oleh pemanggil yang sah — ia hanya **meminjam** identiti Super Admin
   untuk tempoh seed.

Nota: bug `''` yang sama turut wujud dalam harness ujian
(`test-account-manager-resolution.mjs` baris 218). Ia tidak menghalang
ujian kerana laluan yang memerlukan `auth.uid()` sentiasa menetapkan id
sebenar, tetapi ia kekal sebagai perangkap untuk sesiapa yang menyalinnya.

### 10.9 🔴 Blok identiti dalam seed — keperluan yang terlepas pandang

`am_confirm_alias()` dan `am_confirm_external()` memanggil
`can_resolve_account_managers()`, yang memerlukan `auth.uid()` bukan NULL.
Supabase SQL Editor melaksanakan skrip sebagai **pemilik pangkalan data
tanpa JWT**, jadi `auth.uid()` = NULL dan setiap INSERT gagal dengan
`42501 tiada kuasa`.

Tanpa pembetulan ini, pemasangan yang telah **diluluskan pengguna** akan
gagal pada Langkah 4 dengan ralat kuasa yang kelihatan seperti penolakan
RLS — dan ChatGPT mungkin "memperbaikinya" dengan melonggarkan RLS, yang
melanggar larangan tetap.

**Penyelesaian dalam seed:** satu blok `DO` di permulaan yang
1. mencari Super Admin (`role = 'super_admin'`, jatuh balik kepada
   `saidrazak881@gmail.com`),
2. `RAISE EXCEPTION 'P0002'` jika tiada — seed **dibatalkan**, bukan
   dipaksa dengan NULL,
3. menetapkan `request.jwt.claims` kepada `{"sub": <id>, "role": "authenticated"}`,
4. mengesahkan `can_resolve_account_managers()` benar-benar true selepas itu.

Kesan sampingan yang **diingini**: `audit_logs.user_id` kini merekodkan
Super Admin sebenar sebagai pengesah keputusan DP-8/DP-9, bukannya NULL —
asal-usul (provenance) yang boleh diaudit.

### 10.10 Pengajaran direkodkan (sambungan daripada 10.7)

5. **Query pra-penerbangan mesti SETIA kepada fungsi yang akan dipasangnya.**
   Sebarang penghampiran inline yang kurang satu langkah akan menghasilkan
   ramalan palsu — dan ramalan palsu lebih berbahaya daripada tiada ramalan,
   kerana ia dilihat sebagai bukti.
6. **`set_config` kepada rentetan kosong ≠ tidak ditetapkan.** Untuk GUC
   yang dibaca sebagai `::jsonb`, guna `'{}'`.
7. **Skrip yang meminjam identiti mesti memulihkannya.** Jangan biarkan
   skrip utiliti memadam keadaan sesi pemanggilnya.
8. **Ujian yang mengesahkan PROMPT (bukan hanya SQL) menangkap kecacatan
   yang tiada ujian lain akan nampak.** `test-prompt-8a3-install.mjs`
   menjalankan setiap query J0 dan K1–K12 sebenar daripada dokumen prompt
   terhadap PGlite — ia menemui (a) dan (b) di atas, kedua-duanya dalam
   artefak yang akan dihantar kepada ChatGPT.

### 10.11 🔴 Nama repo GitHub dalam prompt adalah SALAH — pemasangan live TERSEKAT

**Kelas ralat yang sama seperti 10.1, berulang.** Selepas 10.1 merakamkan
pengajaran "jangan percaya konteks sesi sendiri untuk pengecam infrastruktur",
Arena melakukan kesilapan yang sama terhadap pengecam yang **lebih besar**.

| | Nilai |
|---|---|
| `git remote get-url origin` (autoritatif) | `https://github.com/SaidRazak881/masb_pms_v4.git` |
| Nama repo sebenar | `SaidRazak881/masb_pms_v4` — **UNDERSCORE** |
| Ditulis oleh Arena dalam 3 fail prompt | `SaidRazak881/masb-pms-v4` — **HYPHEN** |
| Kemunculan | **14** (8 dalam PROMPT-8A3-INSTALL, 5 dalam PROMPT-8A-CLIENT-MASTER, 1 dalam PROMPT-8A-J1-READONLY) |
| Dokumen lama yang betul | `ACTION-4C`, `DEPLOY-VERCEL`, `GPT-ASSISTANT-PROMPTS`, `PROMPT-2/4/4F/4H/5/6/6B…` — semuanya underscore |

**Perangkap yang menjelaskan mengapa typo ini mudah berlaku:**

```text
nama repo  : SaidRazak881/masb_pms_v4            <- UNDERSCORE
nama branch: arena/01a06274-masb-pms-v4          <- HYPHEN
```

Kedua-dua pengecam muncul **bersebelahan dalam URL yang sama**:

```text
https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/docs/...
                             ^^^^^^^^^^^ underscore   ^^^^^^^^^^^ hyphen
```

Mata (dan model) cenderung **menyeragamkan** kedua-duanya kepada satu bentuk.
Arena menyeragamkan kepada hyphen kerana branch — yang lebih kerap dilihat dalam
sesi kerja — menggunakan hyphen. Inilah sebabnya penjaga automatik
(`scripts/test-doc-references.mjs`) membandingkan nama repo terhadap
`git remote get-url origin` dan **bukan** terhadap sebarang nilai yang diingati.

**Kesan yang diukur daripada laporan ChatGPT (8A-3, J0):**

ChatGPT mematuhi larangan #8 (jangan reka bukti) dan **berhenti sebelum
Langkah 1**. Ralat yang dilaporkan:

```text
1. Cuba baca PERSONA-SQL-ARCHITECT.md      -> 404 Not Found
2. Cuba baca PERSONA-SECURITY-REVIEW.md    -> 404 Not Found
3. Cuba baca PANEL-PAKAR-TPMS.md           -> 404 Not Found
6. Cuba dapatkan client-master.sql         -> 404 Not Found
```

Keempat-empat fail itu **sememangnya wujud** di branch
`arena/01a06274-masb-pms-v4` (disahkan melalui `gh api` selepas itu). 404
berpunca semata-mata daripada nama repo. Kerana ChatGPT tidak dapat membaca
fail SQL, ia tidak dapat mengira SHA-256 bebas — dan prompt mengarahkannya
berhenti jika SHA tidak dapat disahkan. **Pemasangan yang sudah diluluskan
pengguna tersekat sepenuhnya oleh satu typo.**

Tingkah laku ChatGPT di sini adalah **betul dan patut dipuji**: ia tidak
meneka kandungan fail, tidak menjalankan SQL tanpa pengesahan, dan melaporkan
404 secara terbuka (larangan #10). Kegagalan ini milik Arena, bukan ChatGPT.

**Pembetulan:**
1. Ketiga-tiga fail prompt dibetulkan kepada `SaidRazak881/masb_pms_v4`.
   Nama repo dibaca daripada `git remote get-url origin`, bukan ditaip.
2. Baharu: `scripts/test-doc-references.mjs` (**25/25**) — penjaga kekal yang
   membaca setiap pengecam daripada sumber autoritatif:
   - nama repo ← `git remote get-url origin`
   - branch ← `git ls-remote --heads origin` (mesti benar-benar wujud)
   - laluan fail ← `fs.existsSync` (mesti benar-benar wujud)
   - ref projek Supabase ← mesti 20 aksara; kemunculan bukan-kanonik hanya
     dibenarkan pada baris yang menandakannya sebagai typo
   - **SHA-256 keempat-empat fail pemasangan mesti sepadan fail semasa** —
     inilah yang akan menangkap SHA lapuk sebelum ia menghantar ChatGPT
     ke dalam jalan buntu yang sama

**Kecacatan kecil lain yang turut dibaiki daripada laporan yang sama:**
prompt J1 mendakwa "lapan query" tetapi mengandungi **J1a–J1j = 10 SELECT**.
ChatGPT mengiranya dengan betul dan menjalankan kesemua 10. Teks kini
"sepuluh query".

### 10.12 Keputusan J0 live — pengesahan bahawa pembetulan 10.8(a) berfungsi

J0 dijalankan terhadap live dan **bersih sepenuhnya**:

| Query | Keputusan live | Tafsiran |
|---|---|---|
| J0a | **20 profil** disenaraikan dengan nama sebenar | 18 staf Excel + `Admin` (super_admin) + `test` (blocked) |
| J0b | `[]` | tiada perlanggaran nama ternormal |
| J0c | `[]` | **tiada perlanggaran token pertama** |
| J0d | `bilangan=1`, `nama=Fuziah` | **unik** — Langkah 4 tidak akan berhenti |
| J0e | `44 / 1124 / 6 / 12 / 14 / 20` | sepadan baseline J1 — tiada drift |

**Bukti langsung bahawa pembetulan 10.8(a) perlu dan berkesan:**

| Profil | J0c versi LAMA (tanpa buang gelaran) | J0c versi live (selepas pembetulan) |
|---|---|---|
| `Dr. Afiq` | `dr` | `afiq` |
| `Dr. Ahmad Nizar` | `dr` | `ahmad` |

Versi lama akan melaporkan **1 perlanggaran palsu** dan mencetuskan siasatan
panel terhadap masalah hantu. Versi yang dihantar melaporkan `[]` — betul.

Misteri `user_profiles = 20` (10.4) kini **terselesaikan dengan bukti**: dua
profil tambahan itu ialah `Admin` (akaun Super Admin, `role=super_admin`) dan
`test` (akaun ujian, `is_active=false`, `account_status=blocked`) — kedua-duanya
bukan staf Excel. **Tiada perlanggaran, tiada nama baharu yang perlu diputuskan.**

### 10.10 Pengajaran direkodkan (sambungan kedua)

9.  **Pengajaran yang direkodkan tetapi tidak diuji akan diulang.** 10.1 sudah
    merakamkan "salin pengecam daripada repo, bukan ingatan" — dan 10.11
    melanggarnya dalam dokumen yang sama. Pengajaran prose tanpa penjaga
    automatik adalah hiasan, bukan kawalan.
10. **Nama repo dan ref projek ialah pengecam yang sama bahayanya.** Kedua-duanya
    gagal secara senyap di hujung yang lain: satu memberi `ZodError`, satu lagi
    memberi `404`. Tiada satu pun menyebut "anda salah menaip nama repo".
11. **Larangan "jangan reka bukti" berfungsi seperti yang direka — dan itu
    bermakna typo Arena menjadi blocker keras.** ChatGPT berhenti daripada
    memasang SQL yang tidak dapat disahkannya. Ini betul. Kosnya ialah satu
    pusingan tambahan, dan ia jauh lebih murah daripada memasang SQL yang
    kandungannya tidak pernah dibaca.
12. **Prompt mesti mengandungi SHA-256 yang semasa, dan sesuatu mesti
    mengesahkannya.** Ujian baharu membandingkan SHA dalam prompt dengan hash
    fail semasa setiap kali ia dijalankan.

---

## DP-11 — Gate SHA-256 tidak boleh dipenuhi oleh alat ChatGPT: ganti mekanisme, kekalkan kawalan (2026-09-04)

### 11.1 Isu

PROMPT-8A3 meletakkan syarat keras: *"Sahkan SHA-256 sebelum menjalankan
setiap fail. Jika SHA tidak dapat disahkan: jangan jalankan."*

ChatGPT melaporkan ia **tidak dapat memenuhi syarat itu**:

> "connector GitHub yang tersedia memberikan kandungan fail/blob SHA Git, tetapi
> tidak memberikan mekanisme yang membolehkan aku memperoleh SHA-256
> byte-for-byte penuh… network runtime tidak mempunyai DNS/internet keluar."
>
> "Jadi aku tidak akan menganggap SHA yang tertulis dalam prompt sebagai SHA
> yang telah aku kira sendiri. Itu akan melanggar larangan #8."

**Ini bukan kegagalan ChatGPT. Ia kecacatan reka bentuk prompt Arena:** Arena
mengenakan gate yang pelaksana **secara struktur tidak boleh lulusi**, kemudian
menjadikannya penghalang keras. Dua pusingan kerja sudah terbazir (DP-10.11
`404`, kemudian gate SHA-256).

Tingkah laku ChatGPT adalah betul dan patut dikekalkan: ia tidak menggunakan
SHA Git sebagai SHA-256, tidak menganggap SHA dalam prompt sebagai bukti, tidak
membina semula SQL daripada kandungan separa, dan tidak menjalankan SQL
berdasarkan andaian.

### 11.2 Fakta diukur (bukan andaian)

**Fakta 1 — Git blob SHA boleh dikira oleh Arena dan sudah dimiliki ChatGPT.**

Git blob SHA ialah `SHA-1("blob " + <panjang_bait> + "\0" + <kandungan>)`.
Arena mengesahkannya tiga cara, dan ketiga-tiganya **sepadan tepat**:

| Fail | `git hash-object` (lokal) | `gh api …contents` → `.sha` (origin) | `SHA1('blob <bait>\0'+kandungan)` (Python) |
|---|---|---|---|
| `client-master.sql` | `37b8d8b8fa88…` | `37b8d8b8fa88…` | `37b8d8b8fa88…` |
| `external-account-managers.sql` | `1e555af8f784…` | `1e555af8f784…` | `1e555af8f784…` |
| `account-manager-resolution.sql` | `afcdc600efda…` | `afcdc600efda…` | `afcdc600efda…` |
| `seed-account-manager-aliases.sql` | `22fc847e4708…` | `22fc847e4708…` | `22fc847e4708…` |

`git ls-tree HEAD` pada commit `6afabe1` melaporkan blob SHA yang sama, jadi
nilai ini **terikat kepada commit**, bukan kepada salinan kerja.

**Implikasi menentukan:** ChatGPT **sudah menerima** nilai ini daripada
connectornya. Ia tidak perlu mengira apa-apa. Ia hanya **membandingkan** dua
rentetan. Gate yang sebelum mustahil kini **boleh dipenuhi tanpa alat baharu**.

**Fakta 2 — blob SHA sensitif byte-for-byte.** Kerana panjang bait adalah
sebahagian daripada input hash, sebarang pemotongan, tambahan, atau perubahan
satu bait pun menukar nilainya. Untuk model ancaman kita — **kerosakan atau
pemotongan tidak sengaja** semasa pengambilan — ia setanding dengan SHA-256.

**Fakta 3 — SHA-1 lemah terhadap perlanggaran yang disengajakan.** Ini
diakui dan diterima: pihak yang boleh menulis semula fail di branch itu juga
boleh mengira semula blob SHA. Kawalan terhadap *itu* ialah **kelulusan
pengguna** dan **senarai allowlist fail**, bukan fungsi hash. Hash di sini
ialah pengesan kerosakan, bukan tandatangan keselamatan.

**Fakta 4 — cap jari struktur boleh dikira ChatGPT daripada kandungan sahaja.**
Bilangan baris, bilangan bait/aksara, baris pertama, baris terakhir, dan kiraan
objek DDL semuanya boleh dibaca tanpa alat hash.

### 11.3 Kedudukan pakar

**Pengerusi.** Tujuan gate ialah memastikan SQL yang dilaksanakan di production
**tepat sama** dengan yang diluluskan pengguna. SHA-256 ialah *mekanisme*, bukan
*tujuan*. Apabila mekanisme tidak boleh dilaksanakan, ganti mekanismenya —
jangan buang kawalannya, dan jangan paksa pelaksana memalsukannya.

**SQL Architect.** Blob SHA terikat kepada commit melalui `git ls-tree`. Itu
lebih kuat daripada SHA-256 yang dikira daripada salinan kerja, kerana ia
mengaitkan kandungan kepada objek Git yang tidak boleh diubah. Saya sokong
blob SHA sebagai lapis utama.

**Keselamatan.** Saya bersetuju dengan syarat: **jangan sesekali menggambarkan
blob SHA sebagai kawalan keselamatan kriptografi.** Ia pengesan integriti
tidak sengaja. Kawalan sebenar terhadap SQL jahat ialah: (a) pengguna
meluluskan fail tertentu, (b) allowlist fail dalam prompt, (c) larangan
DROP/rename/RLS, (d) laporan selepas pelaksanaan yang Arena semak. Saya mahu
perkara ini dinyatakan secara eksplisit dalam prompt supaya tiada sesiapa
melonggarkan larangan lain kerana "SHA sudah disahkan".

**QA.** Lapis kedua mesti **bebas** daripada lapis pertama. Jika kedua-duanya
bergantung kepada connector yang sama, satu kerosakan connector akan
meluluskan kedua-duanya. Cap jari struktur (baris/bait/baris terakhir/kiraan
DDL) dikira daripada **kandungan yang dibaca**, jadi ia bebas daripada
medan `.sha`. Saya juga mahu ujian repo mengesahkan kedua-dua lapisan itu
sepadan fail sebenar — jika tidak, kita mengulang DP-10.11 (nilai lapuk
diterbitkan).

**BA.** Kos pusingan ketiga sudah tidak boleh diterima. Penyelesaian mestilah
sesuatu yang ChatGPT boleh lakukan **dengan alat yang ia sudah ada**, tanpa
pengguna menyalin 1,200 baris SQL ke dalam chat.

**ETL/Excel.** Setuju. Saya juga cadangkan kita **tidak mengubah fail SQL
itu sendiri** untuk menambah sentinel — menambah satu baris komen akan menukar
blob SHA dan bermakna fail yang diluluskan pengguna bukan lagi fail yang
dimuat turun. Guna baris terakhir yang **sedia ada** sebagai cap jari.

### 11.4 Kata putus

**Gate SHA-256 digantikan dengan gate dua lapis. Kawalan dikekalkan; mekanisme
ditukar kepada yang boleh dilaksanakan.**

**LAPIS 1 — UTAMA: Git blob SHA (perbandingan, bukan pengiraan).**
ChatGPT membaca blob SHA yang connectornya sudah berikan dan membandingkannya
dengan nilai jangkaan yang Arena terbitkan. Tiada alat hash diperlukan.

**LAPIS 2 — SOKONGAN: cap jari struktur.**
Dikira daripada kandungan yang dibaca: bilangan baris, bilangan bait, baris
pertama, baris terakhir bukan-kosong, dan kiraan objek `CREATE`. Mengesan
pemotongan walaupun medan `.sha` tidak tersedia. **Bebas** daripada lapis 1.

**SHA-256 dikekalkan sebagai PILIHAN** — jika ChatGPT mempunyai alat yang boleh
menghash, ia boleh mengiranya dan membandingkan. Ia **bukan lagi gate**.

**Fail SQL TIDAK diubah.** Tiada sentinel ditambah. Kandungan yang diluluskan
pengguna kekal byte-for-byte.

**Peraturan berhenti dikekalkan:** jika **mana-mana** lapisan tidak sepadan,
BERHENTI dan laporkan kedua-dua nilai (dapat vs jangkaan) beserta saiz bait.
Jangan jalankan, jangan "baiki", jangan bina semula.

### 11.5 Nilai gate yang diterbitkan (commit `6afabe1`)

| # | Fail | Blob SHA (Git) | Bait | Baris | Aksara | CREATE TABLE / FUNCTION / POLICY / INDEX | Baris terakhir (bukan kosong) |
|---|---|---|---|---|---|---|---|
| 1 | `client-master.sql` | `37b8d8b8fa882b65645cf32e2c37d55590ec6cf2` | 17210 | 384 | 17159 | 1 / 2 / 4 / 2 | `-- NULL di sini ialah jawapan yang BETUL, bukan kegagalan.` |
| 2 | `external-account-managers.sql` | `1e555af8f78472fe7427a513b4682a8ccbc5f381` | 13526 | 336 | 13498 | 1 / 3 / 4 / 2 | `-- Ujian berkelakuan: scripts/test-account-manager-resolution.mjs seksyen [Q].` |
| 3 | `account-manager-resolution.sql` | `afcdc600efda41bc4e1928c60fe71dd6be2880ba` | 21276 | 539 | 21237 | 0 / 7 / 0 / 0 | `-- Ujian berkelakuan: scripts/test-account-manager-resolution.mjs` |
| 4 | `seed-account-manager-aliases.sql` | `22fc847e470831b250a943e425c80fa04fdf5542` | 12284 | 283 | 12229 | 0 / 0 / 0 / 0 | `END $$;` |

SHA-256 (pilihan, untuk rujukan silang):
`d394398dc075f92c61db13077be568e907fb77989ef1175146682ce251418542`,
`a124b9cfa9f086b6079977b2fca1140a9d06aa565e24c553a3735bdecf772793`,
`fb32d1d00f89322dd091f70df82984196c007b1b2040b79823c2ea5073752120`,
`0bcc03a80fbea51cfb0e8079a35c4be582b418c195e21020a636148e1c67f5df`.

### 11.6 Bantahan direkodkan

**Keselamatan (separa):** menerima kata putus, tetapi membantah sebarang
penggunaan frasa "SHA disahkan" sebagai justifikasi untuk melonggarkan
larangan lain. Dicatatkan dalam prompt sebagai amaran eksplisit:
**pengesahan integriti ≠ kelulusan kandungan.** Kandungan diluluskan oleh
pengguna; hash hanya mengesahkan ia tiba tanpa rosak.

Tiada bantahan lain.

### 11.7 Pengajaran direkodkan

13. **Gate mesti direka terhadap alat yang pelaksana SEBENARNYA ada.** Arena
    menulis "sahkan SHA-256" tanpa pernah mengesahkan bahawa ChatGPT boleh
    mengiranya. Gate yang tidak boleh dilulusi bukan kawalan — ia blocker yang
    kelihatan seperti kawalan.
14. **Apabila pelaksana melaporkan ia tidak dapat memenuhi gate, soalan pertama
    ialah "adakah gate itu boleh dilaksanakan?", bukan "bagaimana membuatnya
    mematuhinya?".** ChatGPT betul; prompt yang salah.
15. **Nilai pengesahan yang diterbitkan mesti sendiri disahkan oleh ujian.**
    `scripts/test-doc-references.mjs` kini mengesahkan blob SHA, bait, baris,
    aksara, kiraan DDL, dan baris terakhir yang diterbitkan dalam prompt
    terhadap fail sebenar — supaya nilai lapuk tidak pernah diterbitkan lagi.
16. **Bezakan pengesan integriti daripada kawalan keselamatan.** Blob SHA
    (SHA-1) mengesan kerosakan tidak sengaja; ia tidak menentang penyerang.
    Mengelirukan kedua-duanya akan melahirkan keyakinan palsu.

---

## DP-12 — Tiada laluan selamat "fail GitHub disahkan → teks SQL penuh": benamkan SQL dalam prompt (2026-09-04)

### 12.1 Isu

DP-11 menyelesaikan gate integriti. ChatGPT melaporkannya dan **Lapis 1 LULUS**:
connector GitHub memberikan blob SHA yang tepat dan keempat-empatnya sepadan.
Tetapi pemasangan **masih tidak berlaku**, atas sebab yang berbeza dan lebih
asas:

> "Aku masih tidak mempunyai mekanisme selamat untuk menghantar **kandungan
> penuh fail yang telah disahkan** daripada GitHub connector ke
> `Supabase.apply_migration`. Tool Supabase menerima SQL sebagai teks penuh; ia
> tidak menerima GitHub file reference/path."
>
> "connector mengehadkan kandungan fail panjang. Ia tidak memberi aku
> byte-stream penuh yang boleh aku ukur secara bebas."
>
> "Kalau aku bina semula SQL daripada potongan connector, itu tepat-tepat
> melanggar arahan: *Jangan bina semula SQL daripada kandungan separa.*"

**ChatGPT betul sepenuhnya.** Ini bukan masalah disiplin — ia **masalah
seni bina alat**: pengesahan (blob SHA) berjaya, tetapi **pengangkutan**
kandungan penuh ke alat pelaksanaan tidak wujud. Gate yang lulus tidak berguna
jika bait yang disahkan tidak boleh sampai ke `apply_migration`.

Tiga pusingan kini telah digunakan: `404` (DP-10.11) → gate SHA-256 (DP-11) →
pengangkutan kandungan (DP-12). **Pusingan keempat tidak boleh berlaku.**

### 12.2 Fakta diukur

| Fakta | Nilai | Sumber |
|---|---|---|
| Lapis 1 di hujung ChatGPT | **LULUS** — keempat-empat blob SHA sepadan | laporan ChatGPT |
| Lapis 2 di hujung ChatGPT | **⏳ tidak boleh** — connector memotong fail panjang | laporan ChatGPT |
| Baris pertama/terakhir | boleh dibaca | laporan ChatGPT |
| `apply_migration` | menerima **teks SQL penuh**, bukan rujukan fail | laporan ChatGPT |
| Runtime ChatGPT | tiada DNS/internet keluar | laporan ChatGPT |
| Persona + PROMPT-8A3 + Panel | **berjaya dibaca** (dokumen ~26–55 KB) | laporan ChatGPT |

**Fakta yang diukur Arena dalam repo (menentukan kebolehlaksanaan):**

| Fail SQL | pagar ` ``` ` | baris ber-backtick tunggal | penghujung | CRLF |
|---|---|---|---|---|
| `client-master.sql` | **0** | 22 | newline | tiada |
| `external-account-managers.sql` | **0** | 16 | newline | tiada |
| `account-manager-resolution.sql` | **0** | 13 | newline | tiada |
| `seed-account-manager-aliases.sql` | **0** | 27 | newline | tiada |

**Tiada fail mengandungi pagar ` ``` `** — hanya backtick tunggal dalam komen
(contoh `` `organizers` ``). Maka keempat-empat fail **boleh dibenamkan dalam
blok berpagar tanpa mengubah satu bait pun**, dan kerana semuanya LF serta
berakhir dengan newline, pengekstrakan semula adalah **byte-tepat**.

**Saiz (menentukan 1 prompt vs 4):**

| Komponen | Bait |
|---|---|
| `client-master.sql` | 17,210 |
| `external-account-managers.sql` | 13,526 |
| `account-manager-resolution.sql` | 21,276 |
| `seed-account-manager-aliases.sql` | 12,284 |
| **Jumlah 4 fail SQL** | **64,296** |
| Seksyen 6 PROMPT-8A3 (K1–K12) | 9,417 |
| Seksyen 7 (Larangan) | 1,880 |
| Seksyen 8 (Format laporan) | 2,764 |

ChatGPT **sudah berjaya membaca** dokumen bersaiz 26 KB (`PROMPT-8A3-INSTALL`)
dan 55 KB (`PANEL-PAKAR-TPMS`), jadi sasaran **≤ ~30 KB setiap prompt** adalah
dalam lingkungan yang terbukti boleh dibaca.

### 12.3 Kedudukan pakar

**Pengerusi.** Kita telah menukar gate (DP-11) tetapi tidak pernah mempersoalkan
**laluan penghantaran**. Soalan sebenar: bagaimana bait yang diluluskan sampai
ke alat pelaksanaan tanpa melalui pengangkutan yang memotongnya? Jawapan paling
ringkas ialah **jangan guna pengangkutan itu** — hantar baitnya bersama prompt.

**SQL Architect.** Saya sokong benamkan inline, dengan syarat **satu penjana
deterministik** yang menulisnya, bukan tangan manusia atau model. Saya telah
melihat model menyalin SQL dan "memperbaiki" ruang kosong. Penjana yang membaca
bait fail dan menulisnya terus ke markdown menghilangkan kelas ralat itu, dan
ujian boleh membuktikan hasilnya byte-identik.

**Keselamatan.** Benamkan SQL dalam prompt **tidak melemahkan** kawalan — ia
sebenarnya mengukuhkannya. Rantai baharu: fail diluluskan → penjana menulis bait
tepat → **ujian mengesahkan kandungan inline menghasilkan blob SHA yang sama** →
pengguna menampal → ChatGPT mengira cap jari daripada teks penuh yang kini ia
pegang → `apply_migration`. Setiap mata boleh disahkan. Saya juga mahu ChatGPT
diberitahu secara eksplisit: **jika teks yang diterima tidak sepadan cap jari,
BERHENTI** — jangan "lengkapkan" bahagian yang hilang.

**QA.** Saya mahu **4 prompt berasingan**, bukan satu prompt 64 KB. Tiga sebab:
(1) tampalan kecil kurang berisiko terpotong; (2) satu gate per langkah padan
urutan wajib 1→2→3→4 dengan titik berhenti semula jadi; (3) jika Langkah 3
gagal, Langkah 1–2 sudah dipasang dan direkodkan — kita tidak kehilangan semua
kerja. Saya juga mahu Lapis 2 **akhirnya boleh dikira**: dengan teks penuh dalam
konteks, ChatGPT boleh menulisnya ke sandbox dan mengira bait/aksara/baris/
CREATE **dan** SHA-256.

**ETL/Excel.** Setuju. Dan saya tekankan: **fail SQL itu sendiri mesti kekal
tidak diubah.** Jangan tambah sentinel, jangan "kemas kini" komen. Kandungan
yang diluluskan pengguna mesti kekal byte-for-byte, supaya blob SHA yang sudah
LULUS di Lapis 1 terus sah.

**BA.** Kos kepada pengguna ialah **empat tampalan**, bukan satu. Itu boleh
diterima berbanding pusingan keempat yang gagal. Setiap prompt mesti
**berdiri sendiri** — pengguna tidak sepatutnya perlu membuka tiga dokumen lain.

**Frontend.** Tiada kesan UI. Saya hanya mahu memastikan kita tidak memperkenalkan
tabiat "benamkan semua perkara dalam prompt" sebagai pola umum — ia wajar di
sini kerana ada gate pelaksanaan production, bukan untuk kerja rutin.

### 12.4 Kata putus

**SQL dibenamkan secara inline dalam 4 prompt pemasangan berasingan, dijana oleh
skrip deterministik, dan diuji byte-identik dengan fail yang diluluskan.**

1. **Penjana:** `scripts/generate-8a3-install-prompts.mjs` membaca bait fail SQL
   dan menulisnya ke dalam prompt. **Tiada penyalinan oleh manusia atau model.**
2. **4 fail prompt**, satu per langkah, dalam urutan wajib:
   - `docs/PROMPT-8A3-L1-CLIENT-MASTER.md`
   - `docs/PROMPT-8A3-L2-EXTERNAL-ACCOUNT-MANAGERS.md`
   - `docs/PROMPT-8A3-L3-ACCOUNT-MANAGER-RESOLUTION.md`
   - `docs/PROMPT-8A3-L4-SEED-ALIASES.md`
3. **Setiap prompt berdiri sendiri:** konteks, keputusan J0 (supaya tidak
   diulang), jadual pengesahan (blob SHA + SHA-256 + bait/baris/aksara/CREATE +
   baris pertama/terakhir), SQL penuh inline, arahan `apply_migration`, larangan,
   format laporan.
4. **L4 membawa K1–K12 penuh** (seksyen 6 dipindahkan apa adanya) kerana ia
   langkah terakhir; L1–L3 membawa semakan objek minimum spesifik langkah.
5. **Fail SQL TIDAK diubah.** Sifar bait berbeza. Blob SHA Lapis 1 yang sudah
   LULUS kekal sah.
6. **Gelung integriti ditutup oleh ujian:** `test-doc-references.mjs` seksyen [7]
   mengekstrak SQL daripada setiap prompt inline dan menegaskan blob SHA,
   SHA-256, bait, baris, aksara dan kiraan CREATE **sama dengan fail sebenar**.
7. **Lapis 2 kini boleh dikira oleh ChatGPT** kerana ia memegang teks penuh.
   Prompt mengarahkannya menulis teks itu ke sandbox (jika ada) dan mengira
   semua cap jari — termasuk SHA-256 yang sebelum ini mustahil.

### 12.5 Peraturan berhenti yang dikekalkan

🔴 Jika teks SQL yang ChatGPT terima **tidak sepadan** mana-mana cap jari:
**BERHENTI**. Laporkan nilai dapat vs jangkaan. **Jangan** lengkapkan bahagian
yang hilang, **jangan** bina semula, **jangan** jalankan SQL separa.

🔴 Jika `42501 tiada kuasa` muncul semasa L4: **BERHENTI dan laporkan** teks
ralat penuh. **Jangan** longgarkan RLS, **jangan** tukar `SECURITY DEFINER`,
**jangan** guna `service_role`.

### 12.6 Bantahan direkodkan

**Frontend (separa):** menerima kata putus tetapi membantahnya dijadikan pola
umum. Dicatatkan: benamkan inline wajar **hanya** di mana ada gate pelaksanaan
production dan pengangkutan yang memotong kandungan. Untuk kerja pembangunan
rutin, rujukan fail kekal cara biasa.

Tiada bantahan lain.

### 12.7 Pengajaran direkodkan

17. **Gate integriti dan laluan penghantaran ialah dua masalah berbeza.** DP-11
    menyelesaikan "adakah bait ini betul?" tetapi tidak bertanya "bagaimana bait
    ini sampai ke alat pelaksanaan?". Mengesahkan sesuatu yang tidak boleh
    dihantar adalah sia-sia.
18. **Apabila pelaksana berkata "aku tidak boleh", percaya laporannya dan ukur
    persekitarannya — jangan tambah lagi syarat.** Tiga pusingan berturut-turut
    berpunca daripada Arena mereka-reka keadaan alat ChatGPT tanpa mengukurnya.
19. **Saiz dokumen ialah kekangan kejuruteraan yang boleh diukur.** ChatGPT
    sudah membuktikan ia boleh membaca ~26–55 KB. Sasaran ≤ ~30 KB setiap prompt
    berasal daripada bukti itu, bukan daripada tekaan.
20. **Penjanaan deterministik + ujian byte-identik lebih selamat daripada
    penyalinan teliti.** Manusia dan model kedua-duanya "memperbaiki" ruang
    kosong semasa menyalin. Skrip tidak.
