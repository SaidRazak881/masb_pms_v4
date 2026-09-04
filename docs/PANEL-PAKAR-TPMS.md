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

---

## DP-13 — Langkah 1 TERPASANG di live; jurang pengesahan definisi; dan positif palsu Langkah 5 (2026-09-04)

### 13.1 🟢 Langkah 1 berjaya — pemasangan production pertama Fasa 8A

ChatGPT memasang `client-master.sql` ke live `lmenmfsbjgxfhnykkgow`:

```text
Migration : 8a3_l1_client_master
Result    : {"success":true}
```

| Probe | Keputusan live | Status |
|---|---|---|
| L1a 6 lajur | `import_staging.account_manager_id uuid`, `invoices.account_manager_id uuid`, `organizers.billing_address text`, `organizers.client_code text`, `organizers.payment_terms_days integer`, `organizers.sst_registration_no text` | 🟢 6/6 |
| L1b RLS | `account_manager_aliases \| true` | 🟢 |
| L1c fungsi | `normalize_person_name(p_input text)`, `resolve_account_manager(p_raw text)` | 🟢 2/2 |
| L1d polisi | `am_aliases_delete/read/update/write` | 🟢 4/4 |
| L1e indeks | `idx_am_aliases_user`, `idx_organizers_name_lower` | 🟢 2/2 |

**Senarai objek L1a–L1e itu DITERBITKAN daripada fail SQL itu sendiri** oleh
`generate-8a3-install-prompts.mjs`, bukan direka — dan ia sepadan tepat, termasuk
"6 lajur" K1 (4 `organizers` + 1 `invoices` + 1 `import_staging`).

ChatGPT berhenti selepas laporan, tidak menjalankan Langkah 2–4, tidak
`fix-import-staging-updated-at.sql`, tidak backfill, tidak rename. Pematuhan
penuh.

### 13.2 🟠 Pendedahan jujur: SQL yang dihantar bukan byte-for-byte

> "SQL yang dihantar ke `apply_migration` ialah implementation SQL yang sama
> secara semantik, tetapi **bukan salinan byte-for-byte penuh** termasuk semua
> komen dokumentasi."

**Ini pendedahan yang betul, bukan pelanggaran.** ChatGPT menandakan setiap cap
jari yang tidak dapat dikira sebagai `⏳` dan **tidak** mendakwa pengesahan
bebas. Ia mematuhi larangan #8.

Tetapi ia mendedahkan **jurang sebenar**: L1a–L1e mengesahkan **kewujudan dan
nama**, bukan **definisi**.

| Objek | Disahkan di live | **Belum disahkan** |
|---|---|---|
| 6 lajur | nama + `data_type` | `is_nullable`, `column_default`, FK |
| `account_manager_aliases` | wujud + `rls_aktif` | lajur, `NOT NULL`, `UNIQUE`, kekangan |
| 2 fungsi | nama + argumen | **BADAN FUNGSI — logik padanan** |
| 4 polisi | nama + `cmd` | **`qual` / `with_check` — KESELAMATAN** |
| 2 indeks | nama | ungkapan indeks |

**Mengapa perbandingan teks TIDAK boleh dipakai.** Badan fungsi dalam fail
mengandungi komen `--` **di dalam** blok `$$ … $$`:

```sql
AS $$
  SELECT NULLIF(
    btrim(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            lower(coalesce(p_input, '')),
            '[''’.`\-]', ' ', 'g'          -- apostrofu, titik, tanda pisah -> ruang
          ),
          '\s+', ' ', 'g'                   -- runtuhkan ruang berlebihan
        ),
        -- gelaran kehormat Malaysia + antarabangsa, hanya di permulaan
        '^(dr|pn|en|ms|…|tan sri|puan sri)\s+',
```

Jika komen dibuang, `pg_get_functiondef()` di live berbeza secara **teks**
walaupun betul secara **semantik**. Membandingkan teks akan memberi **positif
palsu** dan mendorong seseorang "memperbaiki" production supaya sepadan — lebih
berbahaya daripada jurang itu sendiri.

**Kata putus 13.2: sahkan melalui KELAKUAN, bukan teks.**

`scripts/generate-8a3-l1-reconciliation.mjs` memasang fail yang **diluluskan** ke
dalam PGlite atas 18 staf yang **sama namanya dengan J0a live**, menjalankan 8
probe (R1–R7), dan menerbitkan output PGlite sebagai **jangkaan**. ChatGPT
menjalankan probe yang sama di live dan membandingkan. Kerana probe menguji
input→output, ia **kalis** terhadap pembuangan komen, ruang kosong dan susun
atur — tetapi **tidak kalis** terhadap logik yang berubah.

Hasil: `docs/PROMPT-8A3-L1-REKONSILIASI.md` — **8 probe, semuanya read-only**.

| Probe | Ketat? | Baris | Apa yang ditutup |
|---|---|---|---|
| R1 `normalize_person_name` | 🔴 | 11 | keempat-empat langkah penormalan |
| R2 `resolve_account_manager` | 🔴 | 16 | seluruh logik berperingkat |
| R3 `pg_policies` `qual`/`with_check` | 🔴 | 4 | **keselamatan RLS** |
| R4 `pg_get_indexdef` | 🟠 maklum | 2 | ungkapan indeks (render berbeza antara versi) |
| R5 6 lajur `is_nullable`/`default` | 🔴 | 6 | kebolehubahan lajur |
| R6 lajur `account_manager_aliases` | 🔴 | 7 | struktur jadual |
| R6b kekangan | 🔴 | 9 | `UNIQUE(raw_text)`, `NOT NULL`, FK |
| R7 FK → `user_profiles` | 🔴 | 2 | **K5: `NO ACTION`** |

**Probe diskriminatif dipilih dengan sengaja.** `normalize_person_name('Dr. Afiq')`
→ `afiq` **sahaja tidak mencukupi**: jika regexp gelaran hilang, profil
`Dr. Afiq` juga menjadi `dr afiq` dan kedua-dua sisi gagal **bersama-sama**, jadi
padanan tepat masih berlaku dan probe itu **lulus secara palsu**. Probe yang
sebenarnya diskriminatif ialah:

```text
resolve_account_manager('Afiq')        -> 'Dr. Afiq'        (hanya lulus jika gelaran dibuang pada sisi PROFIL)
resolve_account_manager('Ahmad Nizar') -> 'Dr. Ahmad Nizar'  (sama)
```

Kedua-duanya dikira dalam PGlite dan **lulus**, mengesahkan fungsi yang dipasang
di repo benar-benar membuang gelaran.

**Anotasi ditambah supaya perbezaan yang DIJANGKA tidak ditandakan sebagai
kegagalan:**

- **R7:** `pg_get_constraintdef()` **membuang** `ON DELETE NO ACTION` kerana ia
  lalai PostgreSQL. Ketiadaan `ON DELETE` dalam output **ialah** `NO ACTION` yang
  K5 tuntut. Tanpa anotasi ini, ChatGPT akan menandanya 🔴.
- **R3:** `am_aliases_read` mempunyai `qual = true` **dengan sengaja** — komen
  fail menyatakan Veto Keselamatan §2.8 mengehadkan **menulis**, bukan membaca.
  Bacaan dibuka kepada `authenticated`; tulisan kepada
  `admin`/`head_governance`/`finance`.
- **R4:** PostgreSQL boleh merender `lower(btrim(name))` sedikit berbeza antara
  versi — perbezaan kosmetik bukan kegagalan.

**Kecacatan penjana yang ditemui semasa membina ini:** probe R1 dan R2 pada
mulanya mengembalikan **1 baris** dan bukan 11/16 — kurungan luar berlebihan
dalam `VALUES ((…),(…))` menghasilkan satu baris komposit. Rekonsiliasi itu akan
sia-sia secara senyap (ChatGPT membandingkan 11 baris live dengan 1 baris
jangkaan). Dibetulkan, dan **penjaga ditambah**: penjana kini menaikkan ralat
jika bilangan baris probe tidak sama bilangan vektor.

### 13.3 🔴 Penemuan baharu: positif palsu Langkah 5 (padanan token pertama)

Probe negatif yang Arena reka — `Siti Nurhaliza`, seorang yang **bukan** staf —
**tidak** mengembalikan NULL:

```text
resolve_account_manager('Siti Nurhaliza')  ->  'Siti Sarah'
```

**Punca (diukur, daripada badan fungsi):** Langkah 5 memadankan **token pertama**
dengan syarat **tepat satu** staf berkongsi token itu. `siti` unik dalam kalangan
18 staf (hanya `Siti Sarah`), jadi `Siti Nurhaliza` menyelesaikan kepadanya.

**Ini BUKAN kecacatan pelaksanaan — ia kelakuan yang DIREKA.** Komen dalam fail
menyatakan Langkah 5 wujud untuk `Zalina` → `Zalina Sayuti`, dan DP-2a
memutuskan peraturan token pertama. Ia berfungsi betul untuk **bentuk pendek
orang yang sama**. Ia **gagal** untuk **orang berbeza yang berkongsi nama
pertama**.

**Sama ada ia berbahaya SEKARANG — diukur:**

| Fakta | Nilai | Sumber |
|---|---|---|
| Nilai `Account Manager` di live | **SIFAR** | J1f = `[]` |
| Daripada 12 nilai Excel sebenar, berapa yang mencetus positif palsu ini | **0** | semua 12 ada keputusan manusia (11 SELESAI + 1 LUAR) |
| `account_manager_id` diisi oleh | `am_backfill_account_manager()` sahaja | reka bentuk |
| Backfill boleh dijalankan sekarang? | **TIDAK** — gate berasingan selepas import 8C | larangan #4 |
| Ada pratinjau? | **YA** — `am_backfill_preview()` | `account-manager-resolution.sql` |

**Jadi risiko ini LATEN, bukan AKTIF.** Tiada baris live boleh terjejas hari ini.

**Mengapa Arena TIDAK memperketat Langkah 5 sekarang — diuji, bukan diandaian.**
Dua peraturan ketat yang obvious **kedua-duanya memecahkan kes sebenar**:

| Peraturan dicadangkan | `Siti Nurhaliza` (mahu NULL) | `Abu Said` → `Abu Sa'id` (kes SEBENAR, mahu padan) | `Zalina` → `Zalina Sayuti` (kes sebenar) |
|---|---|---|---|
| Mentakrif semula: raw mesti **awalan** nama calon | ✅ NULL | ❌ **PECAH** — `abu said` bukan awalan `abu sa id` | ✅ lulus |
| Mentakrif semula: raw mesti **satu token** sahaja | ✅ NULL | ❌ **PECAH** — `Abu Said` dua token | ✅ lulus |

Kedua-duanya akan **merosakkan padanan sebenar** yang fail itu direka untuk
selesaikan. Membezakan `Abu Said`/`Abu Sa'id` (orang sama, bezanya apostrofu)
daripada `Siti Nurhaliza`/`Siti Sarah` (orang berbeza, bezanya token kedua)
memerlukan padanan **kabur** — dan `normalize_person_name()` secara eksplisit
berdokumentasi "**TIDAK membuat padanan kabur**". Melanggar itu akan melanggar
spec sistem.

**Kata putus 13.3:**

1. **`client-master.sql` TIDAK diubah.** Ia **sudah dipasang di live**. Mengubah
  inya sekarang akan (a) mewujudkan drift live↔repo yang baru sahaja kita tutup,
   (b) membatalkan blob SHA `37b8d8b8fa88…` yang baru sahaja LULUS, dan
   (c) memerlukan pemasangan semula tanpa kelulusan baharu. **Tiada perubahan.**
2. **Risiko diterima sebagai keterbatasan yang DIREKODKAN**, dengan mitigasi yang
   sudah wujud dalam reka bentuk:
   - `am_backfill_preview()` **mesti** disemak manusia sebelum
     `am_backfill_account_manager()` — ia bukan pilihan.
   - Backfill kekal **gate berasingan** selepas import 8C (larangan #4).
   - `account_manager_id` kekal **NULL** sehingga backfill; laporan tidak
     bergantung kepadanya sebelum itu.
3. **Tetapkan semula keputusan bila ada data untuk diukur.** Kita mempunyai
   **sifar** nilai live, jadi kadar positif palsu **tidak boleh diukur**.
   Memperketat tanpa ukuran ialah meneka — melanggar protokol anti-handwave.
   Isu ini **ditangguh ke Fasa 8C/8F**, apabila import sebenar menghasilkan
   nilai yang boleh diukur, dan pratinjau backfill boleh mendedahkan setiap
   padanan token-pertama untuk semakan manusia.
4. **Probe ini dikekalkan secara kekal** dalam `test-client-master.mjs` dan dalam
   rekonsiliasi, supaya sebarang perubahan masa depan terhadap Langkah 5
   **dikesan**, bukan dilupakan.

### 13.4 Pengajaran direkodkan

21. **Mengesahkan kewujudan objek bukan mengesahkan objek itu betul.** L1a–L1e
    lulus sepenuhnya dan masih meninggalkan badan fungsi, `qual` polisi, dan
    ungkapan indeks **tidak disahkan**. Katalog memberi nama dengan murah;
    definisi memerlukan usaha.
22. **Apabila input tidak boleh dipercayai byte-for-byte, sahkan OUTPUT.**
    Perbandingan teks terhadap SQL yang telah dibuang komennya menghasilkan
    positif palsu dan mendorong "pembaikan" production. Probe kelakuan
    menguji apa yang sebenarnya penting dan kalis terhadap format.
23. **Probe mesti direka untuk MEMBEZAKAN, bukan sekadar menguji.**
    `normalize_person_name('Dr. Afiq')` lulus secara palsu jika regexp gelaran
    hilang, kerana kedua-dua sisi gagal bersama. Hanya
    `resolve_account_manager('Afiq')` membezakannya.
24. **Probe negatif yang "gagal" mungkin penemuan, bukan kesilapan.**
    `Siti Nurhaliza` → `Siti Sarah` kelihatan seperti probe yang salah; ia
    sebenarnya mendedahkan keterbatasan reka bentuk yang sebenar dan kini
    direkodkan. Jangan padam probe yang mengejutkan — fahaminya dahulu.
25. **Jangan perketat peraturan tanpa mengukur kadar ralatnya.** Dua peraturan
    ketat yang kelihatan jelas kedua-duanya memecahkan kes sebenar. Dengan sifar
    nilai live, tiada asas empirikal untuk memilih. Tangguh sehingga ada data.

---

## DP-14 — Rekonsiliasi L1: kedua-dua perbezaan ialah artifak, dan persoalan tadbir urus yang ia dedahkan (2026-09-04)

**Pencetus:** Laporan ChatGPT `L1-R` diterima. 6 daripada 8 probe 🟢; dua dibendera:
**R2 🔴** (`test`→`test`, `Admin`→`Admin` sedangkan fixture meramalkan `NULL`) dan
**R6b 🟠** (live ada 4 kekangan bernama, PGlite ada 9). ChatGPT **berhenti dengan
betul**, tidak mengubah apa-apa di production, dan menyerahkan persoalan itu
kepada Arena: *"jangan ubah fungsi production berdasarkan probe ini."*

Panel bersidang untuk menetapkan punca sebelum sebarang pembetulan ditulis.

### 14.1 🟢 R6b — artifak VERSI PostgreSQL, bukan kecacatan

**Fakta diukur (bukan diandaikan):**

| Perkara | Nilai | Sumber |
|---|---|---|
| Versi PGlite | **PostgreSQL 18.3** | `SHOW server_version` dalam penjana |
| Kekangan bernama `*_not_null` dalam `pg_constraint` | ciri **PG 18** | 5 baris ekstra hanya wujud di PGlite |
| Kekangan bernama di live | **4** — pkey, raw_unique, 2 fkey | laporan GPT R6b |
| `is_nullable = NO` bagi lajur yang sama | **lulus 🟢** | laporan GPT R6 |

Kekangan `NOT NULL` **bernama** diperkenalkan dalam PostgreSQL 18; versi lebih
lama merepresentasikannya sebagai metadata lajur sahaja. Live menjalankan versi
lebih lama. Maka perbezaan bilangan baris R6b **dijangka mengikut versi**.

**Yang penting:** semantik `NOT NULL` sudah disahkan **secara ketat** oleh R6
(`is_nullable = NO`, 🔴 MESTI SEPADAN, dan live **lulus**). R6b hanya mengira
nama kekangan — ia menguji *representasi katalog*, bukan *kelakuan*.

**Kata putus 14.1:** R6b **diturunkan** daripada 🔴 ketat kepada 🟠 makluman.
Empat kekangan yang **mesti** sepadan walau apa pun versi (pkey, `raw_unique`,
`user_id_fkey`, `confirmed_by_fkey`) dikekalkan 🔴 dan **live lulus semuanya**.
Lima `*_not_null` ditandai *"DIJANGKA TIADA di live"* dengan arahan: jika live
ada juga, laporkan — itu bermakna andaian versi lain perlu dikemas kini.

### 14.2 🔴 R2 — fixture TIDAK LENGKAP, dan ia mendedahkan ketidakselarasan reka bentuk sebenar

**Punca R2:** fixture PGlite hanya menyemai **18 staf Excel**. Live ada **20
profil** (J0a): 18 staf + `Admin` (super_admin, aktif) + `test` (staff,
**blocked**). Fungsi live **betul**; **ramalan Arena yang salah**.

Fixture dibaiki: 20 profil, dan pengawal ditambah (`count = 20` atau penjana
gagal). Jangkaan R2 kini `test` → `test` dan `Admin` → `Admin` — **tepat sama
dengan output live yang GPT laporkan**. Maka R2 **terpenuhi secara retroaktif**;
**tiada keperluan menjalankan semula rekonsiliasi di live**.

**Tetapi pendedahan itu membuka isu tadbir urus yang sebenar.** Diukur pada
dua fail yang **sama-sama diluluskan**:

| Fungsi | Menapis `is_active`? | Menapis `role`? |
|---|---|---|
| `am_list_staff()` | ✅ **YA** (`WHERE is_active = true`) | tidak |
| `resolve_account_manager()` | ❌ **TIDAK** | ❌ **TIDAK** |

Kedua-duanya dalam `client-master.sql` yang sudah dipasang. Maka sistem boleh
**menyenaraikan** satu set staf dan **menyelesaikan** kepada set yang lebih
besar — termasuk akaun blocked dan akaun Super Admin.

**Kedudukan yang dibenarkan:**

- **A — Tadbir urus/Kewangan:** pengikat data perniagaan kepada akaun **blocked**
  ialah lubang tadbir urus; kepada **Super Admin** pula salah secara semantik
  (akaun pentadbiran, bukan AM perniagaan). Resolver **mesti** menapis.
- **B — Kejuruteraan data:** jangan ubah semantik sekarang. Kesan live **sifar**
  (tiada nilai `account_manager_id` diisi; backfill masih di-gate). Memperketat
  tanpa mengukur kadar ralat **mengulangi kesilapan DP-13.3** (Siti Nurhaliza).
  Tangguh ke 8C apabila data wujud.
- **C — Tengah:** jangan sempitkan *carian*; kawal *penulisan*. Resolver ialah
  carian nama→identiti yang tulen; **tindakan tadbir urus ialah WRITE**, jadi
  pengawal milik fungsi backfill, bukan resolver.

**Kata putus 14.2:** **Kedudukan C**, dengan tiga sebab diukur:

1. **Jangan edit `client-master.sql` yang sudah dipasang** (preseden DP-13.2 +
   larangan berdiri). Sebarang perubahan mesti **migration aditif** pada gate
   yang betul.
2. **Menyempitkan resolver menyembunyikan masalah.** Jika resolver mula
   memulangkan `NULL` untuk `test`, nilai Excel yang merujuk kepada akaun
   blocked akan **senyap-senyap hilang**. Jika backfill yang menolak, nilai itu
   muncul dalam **laporan pengecualian** — boleh dilihat, boleh dibetulkan.
   Data yang salah mesti **bising**, bukan senyap.
3. **Kesan kini sifar, jadi ini bukan kecemasan.** Ia mesti diikat kepada gate
   backfill (**8C**), di mana risiko itu benar-benar wujud, dan diuji dengan
   data sebenar.

**Tindakan berjadual (BUKAN sekarang):**
- 8C: `am_backfill_account_manager()` **MESTI** menolak `user_id` yang profilnya
  `is_active = false` **atau** `role = 'super_admin'`, dan **melaporkannya**
  sebagai pengecualian (bukan NULL senyap).
- 8A-2 UI: paparan pengesahan alias **MESTI** menandai calon yang blocked /
  Super Admin, kerana `am_list_staff()` tidak akan menyenaraikannya tetapi
  resolver boleh menjananya.
- Ketidakselarasan `am_list_staff()` ↔ `resolve_account_manager()` **direkodkan
  dan diterima buat masa ini** — ia sengaja, kerana kedua-duanya menjawab
  soalan berbeza ("siapa boleh dipilih" vs "nama ini milik siapa").

**Bantahan direkodkan:** Posisi A berpendapat lubang tadbir urus tidak patut
dibiarkan terbuka walaupun kesannya sifar, kerana backfill boleh dijalankan
orang lain kelak. **Diterima sebagai risiko terkawal:** gate 8C ialah HARD GATE
dan tidak boleh dilangkau tanpa kata putus baharu; DP-14.2 dirujuk secara
eksplisit dalam prompt 8C supaya ia tidak boleh dilupakan.

### 14.3 🟠 DP-6 muncul semula — kali ini di dalam fixture

Membaiki 14.2 mendedahkan drift lama. Untuk menyemai `Admin` sebagai
`super_admin`, fixture memerlukan nilai enum itu — tetapi:

- `schema-master.sql` (repo) mentakrifkan **7** nilai `app_role`:
  `viewer, executive, manager, admin, staff, finance, head_governance`
- Live ada **8** (J1d) — termasuk `super_admin`
- `super_admin` ditambah oleh **`user-management.sql`** (Fasa 6, memang
  dipasang di live)

Fixture rekonsiliasi hanya memasang `schema-master.sql` +
`schema-import-staging.sql`, jadi ia **tidak setara live**. Ini **DP-6**
(drift enum `app_role`) muncul semula dalam bentuk baharu: bukan sebagai
masalah production, tetapi sebagai **punca ramalan ujian yang salah**.

**Kata putus 14.3:** fixture rekonsiliasi **MESTI** memasang
`user-management.sql` — fail Fasa 6 yang **sebenar** — dan **BUKAN** mentadbir
enum dengan tangan (`ALTER TYPE ... ADD VALUE`), kerana enum yang ditadbir
tangan akan mewujudkan **drift ketiga**. Tiga pengawal kekal ditambah dalam
penjana supaya kegagalan ini **tidak boleh berulang senyap**:

1. `count(*) app_role = 8` — sepadan J1d live (atau penjana gagal)
2. `count(*) user_profiles = 20` — sepadan J0a live (atau penjana gagal)
3. stub `auth.users`/`auth.identities` diperkayakan + pgcrypto (atau stub
   deterministik yang **disalin** dari `test-user-management-sql.mjs`, supaya
   kelakuan fixture tidak bercabang dua)

### 14.4 Status rekonsiliasi selepas pembetulan

| Probe | Ketat? | Laporan GPT (live) | Jangkaan dibaiki | Status |
|---|---|---|---|---|
| R1 `normalize_person_name` | 🔴 11 | 11/11 | 11 | 🟢 |
| R2 `resolve_account_manager` | 🔴 16 | `test`→`test`, `Admin`→`Admin` | **sama** | 🟢 retroaktif |
| R3 polisi RLS | 🔴 4 | 4/4 | 4 | 🟢 |
| R4 indeks | 🟠 2 | 2/2 | 2 | 🟢 |
| R5 lajur `organizers` | 🔴 6 | 6/6 | 6 | 🟢 |
| R6 lajur alias (`is_nullable`) | 🔴 7 | lulus | 7 | 🟢 |
| R6b kekangan bernama | 🟠 (dahulu 🔴 9) | 4 bernama | **4 wajib + 5 dijangka tiada** | 🟢 |
| R7 kekangan FK | 🔴 2 | 2/2 | 2 | 🟢 |

**Kata putus 14.4:** **L1 DISAHKAN TERPASANG DAN SETARA dengan SQL yang
diluluskan.** Semua 8 probe kini dipenuhi oleh laporan GPT yang **sudah ada** —
**tiada** keperluan menjalankan semula rekonsiliasi di live. Ini disimpulkan
daripada bukti, bukan andaian: setiap baris 🔴 dalam jadual di atas dipadankan
baris-demi-baris dengan nilai yang GPT laporkan.

### 14.5 Pengajaran direkodkan

26. **Sebelum mempercayai ramalan ujian, sahkan fixture setara dengan
    production.** R2 🔴 kelihatan seperti kecacatan live; ia sebenarnya
    kekurangan fixture. Jika Arena "memperbaiki" production mengikut ramalan
    itu, fungsi yang betul akan dirosakkan. **Ramalan yang salah lebih
    berbahaya daripada tiada ramalan.**
27. **Bezakan *kelakuan* daripada *representasi katalog*.** R6 menguji
    `is_nullable` (kelakuan, stabil merentas versi); R6b menguji nama kekangan
    (representasi, berubah pada PG 18). Probe yang menguji representasi **mesti**
    ditanda 🟠, bukan 🔴, atau ia akan menghasilkan positif palsu setiap kali
    versi berbeza.
28. **Drift repo↔live tidak hilang selepas ia direkodkan — ia berpindah.**
    DP-6 direkodkan sebagai drift enum; ia muncul semula sebagai punca fixture
    tidak setara. Satu-satunya pertahanan ialah **pasang fail yang sebenarnya
    dipasang di live** dalam fixture, dan **kunci** kesetaraan itu dengan
    pengawal (`= 8`, `= 20`).
29. **Apabila dua fungsi diluluskan tidak selaras, tanya dahulu sama ada ia
    sengaja.** `am_list_staff()` menapis `is_active`, resolver tidak. Itu
    **bukan** ralat semudah itu: keduanya menjawab soalan berbeza. Tindakan
    yang betul ialah mengawal **WRITE** (tempat risiko sebenar), bukan
    menyelaraskan dua carian secara kosmetik.
30. **Data yang salah mesti bising.** Menapis keluar akaun blocked di dalam
    resolver akan menukarkan masalah tadbir urus menjadi `NULL` yang senyap.
    Menolaknya di backfill menghasilkan **laporan pengecualian**. Pilih reka
    bentuk yang mendedahkan, bukan yang menyembunyikan.

---

## DP-15 — Langkah 2 dipasang; dan dua kecacatan PROMPT Arena yang laporan itu dedahkan (2026-09-04)

**Pencetus:** Laporan ChatGPT `L2` diterima — `external-account-managers.sql`
dipasang, migration `8a3_l2_external_account_managers` `{"success":true}`.
ChatGPT berhenti selepas L2 seperti diarahkan.

### 15.1 🟢 L2 DISAHKAN — pemasangan betul

| Perkara | Laporan live | Jangkaan | Keputusan |
|---|---|---|---|
| Git blob SHA | `1e555af8f78472fe7427a513b4682a8ccbc5f381` | sama | 🟢 **Lapis 1 LULUS** |
| L2b jadual + RLS | `rls_aktif: true` | wujud + RLS | 🟢 |
| L2c fungsi | 3/3 (`am_confirm_external`, `am_revoke_external`, `is_external_account_manager`) + senarai argumen tepat | 3 | 🟢 |
| L2d polisi | 4/4 (`ext_am_read`/`write`/`update`/`delete`) | 4 | 🟢 |
| L2e indeks | 2/2 (`idx_ext_am_display`, `idx_ext_am_raw_lower`) | 2 | 🟢 |
| K11 inventori | `public_tables = 20` | 18 + L1 + L2 = 20 | 🟢 |
| K10 data perniagaan | 44 / 1124 / 6 / 12 / 14 / 20 | tidak berubah | 🟢 **audit_logs +0** |
| K8 nilai AM live | 0 baris | 0 | 🟢 |
| K12 / L4 seed | `external_account_managers = 0` | belum | ⏳ **betul** |
| Larangan 1–14 | semua ✅ | — | 🟢 |

`am_backfill_account_manager()` **tidak dipanggil**; tiada seed; tiada
klasifikasi `Ow Zi Qi`. **L2 diterima.**

### 15.2 🔴 Kecacatan K6 — dan puncanya ialah PROMPT ARENA, bukan ChatGPT

ChatGPT melaporkan jadual "K6 — 12 nilai Account Manager" yang **tidak sepadan**
senarai sah:

| | Senarai sah (12 rentetan unik, 265 baris) | Jadual ChatGPT |
|---|---|---|
| `Abu Said` (3 baris) | ✅ ada | ✅ ada |
| **`Abu said`** (1 baris, huruf kecil) | ✅ **ada — satu-satunya bukti kes-kepekaan** | 🔴 **DIGUGURKAN** |
| `Afiq`, `Ahmad Nizar` | ❌ **BUKAN nilai Excel** (probe diskriminatif rekonsiliasi L1, DP-13.2) | 🔴 **DIREKA**, digabung jadi 1 baris `Afiq / Ahmad Nizar` |

Ini melanggar **larangan #13** ("JANGAN ubah jangkaan K6") dan arahan FORMAT
("tampal **kesemua 12 baris** — jangan ringkaskan").

**Tetapi panel menetapkan punca sebenar ialah Arena.** Diukur pada penjana:

* `FORMAT` diekstrak dari prompt induk dan **dikongsi semua langkah** — ia
  menuntut 12 baris K6.
* 12 nilai itu **hanya** wujud dalam `SEKSYEN_K`, dan `SEKSYEN_K` hanya disuntik
  ke langkah `kPenuh` — iaitu **L4 sahaja**.
* Maka **L2 dan L3 diminta melaporkan 12 baris yang tidak pernah diberikan
  kepada mereka.** `grep -c "'Abu Said'"` pada prompt L2 sebelum pembetulan = **0**.

ChatGPT tidak mereka bukti secara sengaja (larangan #8 dipatuhi — ia menanda `⏳`
pada cap jari yang tidak dapat dikira). Ia **membina semula** senarai daripada
konteks, dan tersilap. **Arahan yang tidak boleh dipenuhi daripada kandungan
prompt itu sendiri ialah kecacatan prompt** — kelas yang sama dengan DP-10.11
(nama repo hyphen/underscore) dan DP-12 (connector memotong fail).

**Kata putus 15.2:**
1. Blok K6 **diekstrak daripada prompt induk** (`potong('### K6 — ', '### K6b — ')`)
   — **bukan** disalin tangan, supaya tiada drift transkripsi — dan disuntik ke
   langkah yang boleh menjalankannya.
2. **L1 dikecualikan**: query K6 memanggil `is_external_account_manager()` yang
   hanya dicipta oleh L2. Menyuntiknya ke L1 akan menghasilkan query yang ralat.
   Ayat FORMAT untuk L1 dikhususkan: laporkan `⏳ tidak dijalankan pada Langkah 1`.
3. **Nota pra-seed** ditambah pada L2/L3, kerana jadual "Jangkaan SELEPAS seed
   Langkah 4" akan dibaca sebagai jangkaan semasa: `Fuzy*` → **NULL** (veto §2.4
   masih hidup), `Ow Zi Qi` → NULL dengan `diklasifikasi_luar = **false**`
   (jadual external masih kosong sehingga L4).
4. Nota itu **menamakan kesilapan yang telah berlaku** (`Abu said` dua baris
   berasingan; `Afiq`/`Ahmad Nizar` bukan nilai Excel) dan mengarah: jika tidak
   dapat menjalankan query, laporkan `⏳` — **jangan** ganti dengan senarai binaan.
5. **Prompt L1 dan L2 yang sudah dilaksanakan dikekalkan tidak berubah saiz**
   (29,077 / 28,584 bait) supaya laporan lepas masih boleh dipadan; probe baharu
   hanya masuk ke L3/L4 yang belum dijalankan.

### 15.3 🟠 K1 ditanda 🟠 untuk kriteria yang SUDAH DIGANTIKAN (DP-11)

ChatGPT menanda K1 🟠 kerana SHA-256/bait/baris/aksara `⏳`. **Ia betul tidak
mereka nilai** — tetapi DP-11 sudah menetapkan bahawa **gate ialah Lapis 1 (blob
SHA) + Lapis 2 (cap jari struktur)**, dan **SHA-256 ialah PILIHAN** kerana
runtime ChatGPT terbukti tiada byte-stream fail tempatan.

Blob SHA **sepadan**, baris pertama/terakhir **sepadan** ⇒ **K1 sepatutnya 🟢.**

Punca: FORMAT masih berbunyi "SHA-256 **penuh** yang anda sahkan" — kedengaran
wajib, dan bercanggah dengan label "Pilihan — SHA-256" dalam jadual cap jari.
Ini menghasilkan **🟠 kekal yang palsu**, iaitu isyarat yang mengganggu: jika
setiap laporan ada 🟠 yang tidak bermakna, 🟠 yang sebenar akan diabaikan.

**Kata putus 15.3:** FORMAT dinyatakan semula — blob SHA + baris pertama/terakhir
sepadan ⇒ **K1 = 🟢 LULUS**; `⏳ SHA-256` **bukan** pengurangan markah; 🟠/🔴
hanya jika blob SHA tidak sepadan, cap jari struktur berbeza, atau kandungan
kelihatan terpotong.

### 15.4 Pengajaran direkodkan

31. **Setiap arahan dalam prompt mesti boleh dipenuhi daripada kandungan prompt
    itu sendiri.** "Tampal kesemua 12 baris" tanpa menyenaraikan 12 baris itu
    bukan arahan — ia jemputan untuk mereka. Penjana kini diuji untuk
    percanggahan ini (seksyen [11]: jika prompt menuntut 12 baris, ia mesti
    menyenaraikannya).
32. **Model yang patuh akan mengisi jurang dengan binaan semula, dan binaan
    semula itu kelihatan sah.** Jadual ChatGPT mempunyai 12 baris dan lajur
    yang betul; hanya perbandingan baris-demi-baris dengan senarai sah
    mendedahkan `Abu said` hilang dan `Afiq / Ahmad Nizar` direka. **Mengira
    baris tidak mencukupi — kandungannya mesti dipadan.**
33. **Kriteria yang sudah digantikan mesti dibuang daripada format laporan.**
    DP-11 menggantikan SHA-256 dengan blob SHA, tetapi FORMAT tidak dikemas
    kini, jadi setiap laporan kini membawa 🟠 palsu. Amaran yang sentiasa
    berbunyi akan dilatih untuk diabaikan.
34. **Jangan suntik probe ke langkah yang belum mempunyai objeknya.** K6 pada
    L1 akan ralat kerana `is_external_account_manager()` belum wujud. Kebolehlaksanaan
    probe mengikut langkah mesti ditentukan, bukan diandaikan.

---

## DP-16 — Penilaian cadangan MCP/connector untuk sistem ini (2026-09-04)

**Pencetus:** Pengguna mengemukakan senarai cadangan MCP skills/connectors
(Azure Databricks, Dataverse, Dynamics 365, SharePoint, Power Platform,
Monday.com, Skyvia, K2view, Vectara, Notion, Google Workspace, Slack, n8n,
Docusign, Lucid, Smartsheet, ClickHouse, Redis, MySQL/MariaDB, Prisma,
JPA/Hibernate, Multi-Tenant, Zero-Downtime Migrations, PostgreSQL Optimization,
Supabase Patterns, GitHub MCP) berserta seni bina "Skills Control Plane"
(Skill Registry + RBAC/ABAC Policy Engine + Audit Logs), dengan arahan
*"sekiranya sesuai dan dapat membantu"*.

Panel menilai **berdasarkan bukti repo dan persekitaran yang diukur**, bukan
berdasarkan kecenderungan.

### 16.1 Bukti yang diukur

**(a) Stack sebenar repo** — `package.json` dependencies:
`next`, `react`, `react-dom`, `@supabase/supabase-js`, `@supabase/ssr`,
`xlsx`, `@radix-ui/*`, `tailwindcss-animate`, `class-variance-authority`,
`clsx`, `tailwind-merge`, `lucide-react`.

Jejak teknologi yang dicadangkan, dikira dengan `grep -rli` (kecualikan
`node_modules`/`package-lock`):

| Teknologi dicadangkan | Fail dalam repo |
|---|---|
| Prisma, Redis, ClickHouse, MySQL, MariaDB, Hibernate | **0** setiap satu |
| Notion, Slack, Dataverse, Dynamics, Databricks | **0** setiap satu |
| Skyvia, Vectara, Docusign | **0** setiap satu |
| n8n | 1 — **positif palsu** (subrentetan dalam `lib/supabase/migrations/v4-raw-data-inserts.sql`, bukan dependensi) |

**(b) Sumber data sebenar** — `V4 RAW/`: `00. Quotation Tracker (1).xlsx`,
`R1 MIMOS_Academy_INCOME_STATEMENT.xlsx`, `R2 Overall Report 2026 (1).xlsx`,
`R3 Group 2026 Funnel Tracker.xlsx`, `User Profiles Mapping.xlsx`,
`cost_of_sales_2026.xlsx`, `invoice_2026.xlsx`. **Fail Excel tempatan.**
Tiada SaaS sumber, tiada API masuk.

**(c) Rangkaian sandbox Arena — diukur, bukan diandaikan:**

```
curl https://lmenmfsbjgxfhnykkgow.supabase.co/rest/v1/  -> (35) SSL_ERROR_SYSCALL
curl https://example.com                               -> (35) SSL_ERROR_SYSCALL
curl https://api.github.com                            -> HTTP 200
```

`example.com` **pun** gagal. Maka sandbox ini **tiada TLS keluar langsung**
kecuali proksi GitHub yang dibenarkan. **Sebarang MCP berasaskan rangkaian —
PostgreSQL, Supabase, Skyvia, Notion, Slack, n8n — tidak boleh dicapai dari
sisi Arena**, walau apa pun yang dikonfigurasikan.

**(d) Tadbir urus sedia ada** — sistem ini **sudah** mempunyai ketiga-tiga
lapisan yang "Control Plane" itu cadangkan, dalam bentuk yang lebih kuat kerana
ia diikat pada pangkalan data dan bukan pada alat luaran:

| Lapisan dicadangkan | Padanan sedia ada (lebih kuat) |
|---|---|
| Skill Registry (versi, pemilik, persekitaran) | Git + blob SHA gate (DP-11) + `test-doc-references.mjs` (146 pengawal) |
| RBAC/ABAC Policy Engine | RLS Supabase + `public.has_role()` + **DB-level governance lock** |
| Audit Logs & Trace Correlation | `audit_logs` **tidak boleh diubah** + panel kata putus DP-1…DP-15 |

### 16.2 Kata putus

**TOLAK senarai connector itu untuk sistem ini.** Alasan mengikut kumpulan:

1. **Stack tidak wujud (bukti 16.1a/b):** MySQL/MariaDB, Prisma, JPA/Hibernate,
   ClickHouse, Redis, SQLite, Azure Databricks, Dataverse, Dynamics 365,
   Power Platform, SharePoint/OneDrive, Monday.com, Smartsheet — **sifar fail
   dalam repo** dan tiada dalam `package.json`. Menambah connector kepada
   sistem yang tidak wujud ialah **scope creep** yang menambah permukaan
   kredensial tanpa menambah keupayaan.
2. **Bercanggah dengan rantai pengawal sedia ada:** Notion / Google Workspace /
   Slack sebagai tempat dokumen akan **memecahkan** `test-doc-references.mjs`,
   yang mengesahkan SHA-256, blob SHA, dan SQL terbenam **dalam repo**.
   Rekod keputusan (DP-1…DP-15) mesti kekal boleh-diff dan boleh-uji.
3. **Tidak boleh dicapai dari sisi Arena (bukti 16.1c):** semua MCP rangkaian
   gagal pada lapisan TLS. Ini **penghalang teknikal**, bukan pilihan dasar.
4. **Bercanggah dengan larangan berdiri:** Skyvia/K2view/n8n/Zapier memegang
   kredensial DB dan boleh menulis — sedangkan larangan berdiri melarang
   `service_role`, RPC tulis perniagaan, dan sebarang perubahan skema tanpa
   kelulusan. Vectara (RAG) pula akan meletakkan penghalaan keputusan pada
   carian semantik, sedangkan spesifikasi menetapkan **AI tidak pernah
   memutuskan gabungan kewangan / Bumiputera / padam / kunci**.
5. **Spekulatif:** Docusign — Fasa 8G ialah `certificate_no` (medan **nombor**),
   bukan tandatangan elektronik. Lucid — rekod seni bina ialah markdown dalam
   repo. Multi-Tenant — sistem ini **satu** akademi, 20 pengguna.
6. **Control Plane = over-engineering:** ia akan menjadi lapisan tadbir urus
   **kedua** dengan mod kegagalannya sendiri, sedangkan lapisan pertama sudah
   diikat pada DB dan diuji 146 kali setiap perubahan.

**Satu-satunya kelas yang genuinely bernilai — dan mengapa ia tetap ditolak
buat masa ini:** MCP **PostgreSQL/Supabase baca-sahaja untuk Arena** akan
menyelesaikan mod kegagalan paling mahal yang diukur dalam sesi ini, iaitu
**kebutaan terhadap keadaan live**. Ia punca langsung DP-14.2 (fixture 18 vs 20
profil → R2 🔴 palsu) dan punca DP-6 berulang (enum `app_role` 7 vs 8). **Tetapi
bukti 16.1c menunjukkan ia tidak boleh bersambung dari sandbox ini.** Maka ia
ditolak atas sebab teknikal, dan **akan dinilai semula serta-merta jika**
persekitaran Arena memperoleh laluan rangkaian ke Supabase.

### 16.3 Tindakan yang dilaksanakan (tanpa MCP)

Kerana punca sebenar ialah **kebutaan versi dan keadaan live**, panel memilih
tindakan yang **boleh** dilaksanakan sekarang:

1. **Probe versi PostgreSQL live (DP-16.3, DILAKSANAKAN).** Satu query
   read-only ditambah ke L3 dan L4 (`### L3v`, `### L4v`):
   `server_version`, `version()`, `server_version_num`, dan kiraan
   `pg_constraint contype = 'n'` (kekangan `NOT NULL` bernama). Ia menutup
   punca DP-14.1 secara kekal: selepas L3, **versi live akan diketahui**, jadi
   perbezaan katalog masa depan boleh **diramal** dan bukan disalah tafsir
   sebagai kecacatan. Kos: satu query. Risiko: sifar (read-only).
2. **ChatGPT kekal sebagai satu-satunya penderia live Arena.** Corak J0/J1/L2b–L2e
   yang sedia ada **ialah** "connector" yang berfungsi: probe read-only
   bernombor, jangkaan dikira dalam PGlite, jawapan verbatim. Ia sudah
   menangkap DP-7, DP-10, DP-13.3 dan DP-14.2 — bukti bahawa corak itu
   berkesan tanpa alat baharu.
3. **Satu-satunya keupayaan yang berbaloi ditambah pada sisi ChatGPT** ialah
   **pelaksanaan kod** (code interpreter), supaya ia boleh mengira SHA-256
   daripada SQL yang terbenam dalam prompt dan menutup jurang cap jari DP-11.
   **Tiada** connector daripada senarai ini memberi kesan itu.

### 16.4 Syarat penilaian semula

Senarai ini akan dinilai semula **hanya** jika bukti baharu muncul:

* Sandbox Arena memperoleh capaian rangkaian ke Supabase → MCP baca-sahaja
  dinilai semula serta-merta (keutamaan tertinggi; menyelesaikan punca DP-14.2/DP-6).
* MIMOS Academy benar-benar menggunakan Dynamics 365 / Dataverse / SharePoint
  untuk data pelajar → connector berkaitan dinilai semula **bersama** fail
  bukti (bukan anggaran).
* Fasa 8B (penyimpanan fail sumber) memutuskan storan luar Supabase Storage →
  connector storan dinilai semula.
* Skala pengguna naik melebihi satu akademi (multi-tenant sebenar) → pola
  Multi-Tenant dinilai semula.

Sehingga salah satu bukti itu wujud, **tiada MCP akan ditambah**.

### 16.5 Pengajaran direkodkan

35. **Senarai alat yang panjang bukan pelan.** 25+ cadangan dinilai, dan bukti
    repo menunjukkan **sifar** jejak bagi hampir semua teknologi yang disebut.
    Menilai cadangan bermakna mengiranya dalam repo, bukan menimbangnya secara
    abstrak.
36. **Ukur persekitaran sebelum mencadangkan integrasi.** Satu `curl` ke
    `example.com` (gagal, exit 35) membatalkan keseluruhan kelas cadangan.
    Tanpa ukuran itu, panel akan membuang masa merekabentuk sesuatu yang tidak
    boleh bersambung.
37. **Jangan tambah lapisan tadbir urus kedua apabila lapisan pertama sudah
    diuji.** "Control Plane" mencadangkan Skill Registry + Policy Engine +
    Audit; sistem ini sudah ada Git+blob SHA, RLS+governance lock, dan
    `audit_logs` yang tidak boleh diubah. Lapisan kedua menambah permukaan
    kegagalan, bukan keyakinan.
38. **Selesaikan punca, bukan gejala, dengan alat termurah yang berfungsi.**
    DP-14.1 berpunca daripada buta versi. Penyelesaiannya bukan MCP data
    fabric — ia **satu query `SELECT version()`**.

---

## DP-17 — Langkah 3 dipasang; versi live diketahui; dan empat penemuan yang laporan itu dedahkan (2026-09-04)

**Pencetus:** Laporan ChatGPT `L3` diterima — `account-manager-resolution.sql`
dipasang, migration `8a3_l3_account_manager_resolution` `{"success":true}`,
7 fungsi disahkan, K6 12 baris verbatim, dan **probe versi L3v berjaya**.
ChatGPT berhenti sebelum L4 seperti diarahkan.

### 17.1 🟢 L3 diterima — dan DP-14.1 kini TERBUKTI, bukan lagi kesimpulan

| Perkara | Laporan live | Keputusan |
|---|---|---|
| blob SHA | `afcdc600efda41bc4e1928c60fe71dd6be2880ba` | 🟢 sepadan |
| L3c 7 fungsi | 7/7 + senarai argumen tepat | 🟢 |
| `prosecdef` / `search_path` | semua 7 `true` / `public` | 🟢 |
| K6 | **12 baris verbatim**, 8 SEPADAN + 3 `Fuzy*` NULL + `Ow Zi Qi` NULL | 🟢 pra-seed betul |
| K8 / counts / audit | `[]` / `44·1124·6·12·14·20` / **44 → 44** | 🟢 |
| K1 | 🟢 | ✅ **pembetulan DP-15.3 berkesan** |
| **L3v versi platform** | **PostgreSQL 17.6**, `versi_num 170006`, `kekangan_not_null_bernama = 0` | 🟢 |

**Dua pembetulan DP-15 disahkan berkesan oleh laporan ini sendiri:**

1. **K6 kini betul.** ChatGPT menampal **12 baris verbatim** termasuk
   `Abu Said` **dan** `Abu said` sebagai dua baris berasingan, dan **tiada**
   `Afiq / Ahmad Nizar` yang direka. Tiga `Fuzy*` dilaporkan `⚠️ BEZA` terhadap
   lajur `jangkaan_pglite` (yang memang jangkaan *selepas* seed) **tanpa**
   "memperbaiki" apa-apa — larangan #13 dipatuhi. Bandingkan dengan laporan L2
   yang menggugurkan `Abu said` dan mereka satu baris: **pembetulan itu berkesan.**
2. **K1 kini 🟢**, bukan 🟠 kekal. Penjelasan DP-11 dalam FORMAT berfungsi.

**DP-14.1 kini terbukti, bukan disimpulkan.** Panel sebelum ini *mengambil
kesimpulan* bahawa R6b ialah artifak versi kerana PGlite berjalan 18.3 dan live
"lebih lama". L3v memberikan **fakta**: live = **PostgreSQL 17.6** dan
`kekangan_not_null_bernama = 0`. Kata putus DP-14.1 **disahkan oleh ukuran**,
dan probe yang direka dalam DP-16.3 membayar kosnya pada penggunaan pertama.

### 17.2 🔴 DP-13.2 BERULANG — pemasangan bukan byte-for-byte

ChatGPT mendedahkan:

> "aku menghantar **implementation SQL yang semantically equivalent tetapi bukan
> byte-for-byte keseluruhan 539-line file**. Jadi aku **tidak akan claim bahawa
> migration ini ialah exact byte-for-byte execution daripada fail asal**."

Ini **pengulangan tepat** DP-13.2 (Langkah 1). Pendedahan itu betul dan
dihargai; ia juga bermakna **badan** tujuh fungsi itu belum disahkan. Yang
sudah disahkan hanyalah *kewujudan*, *nama*, *argumen* dan *metadata* — iaitu
katalog, bukan kelakuan.

**Kata putus 17.2:** ikut DP-13.2 — **sahkan melalui KELAKUAN**. Dikeluarkan
`docs/PROMPT-8A3-L3-REKONSILIASI.md` (penjana
`scripts/generate-8a3-l3-reconciliation.mjs`, 6 probe S1–S6, semua jangkaan
dikira dalam PGlite daripada fail yang diluluskan).

**🔴 L3-R MESTI selesai SEBELUM Langkah 4.** Alasan, bukan keutamaan selera:
L4 akan memanggil `am_confirm_alias()` dan `am_confirm_external()` untuk
**benar-benar menulis** alias DP-8, klasifikasi luar DP-9, dan baris
`audit_logs`. Jika badan fungsi itu berbeza daripada yang diluluskan, L4 menulis
**data salah dan jejak audit salah**. Mengesahkan badan fungsi *sebelum* menulis
ialah verifikasi; *selepas* menulis ialah pembersihan.

**Reka bentuk L3-R (keputusan yang disengajakan):**
* **Read-only sepenuhnya, dan TIDAK memanipulasi `request.jwt.claims`.**
  Ujian kuasa **positif** (admin → `true`, alias ditulis) **sudah** dilakukan
  oleh seed L4, yang menetapkan claims kepada Super Admin dan menaikkan ralat
  diagnostik jika `can_resolve_account_managers()` masih `false`. Mengulanginya
  di L3-R menambah risiko tulis tanpa menambah maklumat.
* Maka L3-R menguji sisi **negatif** — *deny-by-default* — yang justru sisi
  keselamatan paling penting dan boleh diuji tanpa identiti.
* **S5 (satu-satunya probe yang memanggil fungsi tulis) direka supaya selamat
  walaupun pengawal kuasa itu HILANG.** Ia menghantar UUID
  `99999999-9999-4999-8999-999999999999` yang **tidak wujud**: (1) pengawal
  kuasa naik dahulu → `42501`; (2) jika pengawal hilang → pemeriksaan kewujudan
  profil naik; (3) jika kedua-duanya hilang → FK
  `account_manager_aliases_user_id_fkey` menolak baris. **Tiada keadaan** di
  mana probe ini boleh menulis.
* Penjana mempunyai pengawal: **jika S5 tidak gagal, penjanaan berhenti** —
  kerana itu bermakna pengawal kuasa telah hilang daripada SQL yang diluluskan.

### 17.3 🔴 Kecacatan prompt L3x — kesilapan KATEGORI, dan ChatGPT yang betul

Prompt L3 mengandungi probe `L3x` yang menyenaraikan profil berkuasa dan
meletakkan `can_resolve_account_managers()` sebagai **lajur**, dengan jangkaan
`super_admin / admin / head_governance / finance = true`.

**Itu kesilapan kategori.** `can_resolve_account_managers()` mengambil **sifar
argumen** dan menilai identiti **PEMANGGIL** (`auth.uid()` → `current_user_role()`),
**bukan** baris yang disenaraikan. Jadi setiap baris memulangkan nilai yang
**sama**, dan dalam `Supabase.execute_sql` — yang tiada `request.jwt.claims` —
nilai itu sentiasa `false`.

ChatGPT mendapat `false` bagi kelima-lima baris (`Admin`, `Zalina Sayuti`,
`Adilah`, `Farrah`, `Dr. Ahmad Nizar`), **mentafsirnya dengan betul** ("tidak
boleh digunakan sebagai bukti bahawa authorization aplikasi rosak"), dan **tidak
mengubah apa-apa**. Ia kemudian membenderanya untuk perhatian Arena. **Tindak
balas yang tepat terhadap prompt yang salah.**

**Kata putus 17.3:** probe itu dipisah kepada dua fakta berbeza —
`L3x_inventori` (peranan live yang **akan** berkuasa apabila log masuk) dan
`L3x_sesi` (kuasa sesi semasa, **satu** nilai), dengan jangkaan `false` +
`uid = NULL` dinyatakan sebagai **bukti deny-by-default, bukan kecacatan**, dan
larangan eksplisit untuk menetapkan claims "bagi memperbaikinya".

> **Keputusan `false` itu sebenarnya penemuan keselamatan yang positif.** Ia
> membuktikan fungsi ini **tidak** membocorkan kuasa kepada konteks tanpa
> identiti — direkodkan sebagai kawalan yang **lulus**, bukan anomali.

### 17.4 🟠 Soalan keselamatan ChatGPT DIJAWAB dengan ukuran

ChatGPT menulis: *"`SECURITY DEFINER` dalam `public` mempunyai implikasi
keselamatan yang perlu dinilai terhadap model auth sebenar."* Panel menilai
dengan **ukuran dalam PGlite**, bukan dengan jaminan.

**Yang SAH (diukur):**

| Kawalan | Bukti |
|---|---|
| `search_path` dipin | semua 7: `proconfig = {search_path=public}` → tiada *search_path hijack* |
| Tiada capaian awam | semua 7: `REVOKE ALL FROM PUBLIC` + `GRANT EXECUTE TO authenticated`; diukur `authenticated=true`, **`anon=false`** |
| Kuasa dikawal **di dalam** | `am_confirm_alias`, `am_revoke_alias`, `am_backfill_account_manager` naik `42501`; `am_list_staff`, `am_unresolved_values`, `am_backfill_preview` **pulangan kosong** (bukan ralat) |
| Pendedahan minimum §2.8 | `am_list_staff` → `TABLE(id uuid, full_name text)` — **tiada** `role`, `email`, `account_status`, `designation`, `department` |
| Deny-by-default | tanpa identiti: ketiga-tiga fungsi baca → **0 baris** (diukur) |
| `LAST_SUPER_ADMIN` | `admin_set_user_blocked` menolak sekatan Super Admin terakhir |

`SECURITY DEFINER` di sini ialah **corak yang betul**, bukan kelemahan: ia
diperlukan supaya pengawal peranan dinilai secara konsisten dan supaya fungsi
boleh menulis ke jadual yang pemanggil tidak mempunyai capaian tulis langsung.
Bahaya biasanya (*privilege escalation*) ditutup oleh pengawal dalaman + pin
`search_path` + `REVOKE FROM PUBLIC`.

**Jadual kebenaran yang diukur** (identiti ditukar dalam fixture):

| peranan | `can_resolve` | `am_list_staff` |
|---|---|---|
| `super_admin`, `admin`, `head_governance`, `finance` | **true** | disenaraikan |
| `manager`, `executive`, `staff`, `viewer` | **false** | 0 baris |
| tiada identiti | **false** | 0 baris |

**DUA jurang SEBENAR yang dijumpai — dan kedua-duanya ditangguh, bukan diabaikan:**

**(a) 🟠 `current_user_role()` tidak menapis `is_active`.** Diukur: akaun
**blocked** (`is_active = false`, `account_status = 'blocked'`) dengan peranan
`admin` atau `finance` **masih** memulangkan `can_resolve_account_managers() =
true` dan **masih** boleh menyenaraikan 19 staf.

*Mitigasi sedia ada (diukur):* `admin_set_user_blocked` **memadam
`auth.refresh_tokens`** pengguna itu (log keluar paksa), jadi jendela pendedahan
terhad kepada **JWT capaian yang sudah diterbitkan** sehingga ia luput.

*Kata putus:* **TANGGUH** ke 8C sebagai **migration aditif**, dengan gate.
Sebab: `current_user_role()` dipanggil oleh **polisi RLS di seluruh sistem**
(Fasa 6), jadi menukarnya menyentuh permukaan yang jauh lebih besar daripada
Fasa 8A dan memerlukan suite penuh dijalankan semula. Ia **bukan** kecemasan
kerana penamatan sesi sudah menutup vektor utama. **Jangan** edit
`user-management.sql` yang sudah dipasang.

**(b) 🟠 `am_backfill_account_manager()` tiada gate 8C dalam SQL, dan tiada
penapis DP-14.2.** Diukur pada badan fungsi: pengawal **hanya**
`can_resolve_account_managers()`. Tiada semakan `is_active`, tiada semakan
`role = 'super_admin'`, dan **tiada mekanisme** yang menghalang `admin` /
`finance` / `head_governance` daripada memanggilnya **hari ini**. Gate 8C
sepanjang ini adalah **prosedur sahaja** (larangan #4 dalam prompt).

*Kesan semasa: **sifar*** — kerana live mempunyai **sifar** nilai
`account_manager` (K8 = `[]`), jadi `UPDATE` akan mengisi 0 baris.
Selepas import 8C, memanggilnya awal akan mengikat nilai **tanpa** penapis
DP-14.2, termasuk kepada akaun blocked atau Super Admin.

*Kata putus:* **kekalkan kata putus DP-14.2** dan **ikat kedua-duanya bersama**
dalam migration aditif 8C: (1) tolak `user_id` yang `is_active = false` atau
`role = 'super_admin'`, (2) **laporkan** penolakan itu sebagai pengecualian
(bukan `NULL` senyap), dan (3) tambah **gate 8C sebenar dalam SQL** supaya
backfill tidak boleh dijalankan sebelum import 8C — menukar gate prosedur
kepada gate yang **dikuatkuasakan**.

**Bantahan direkodkan:** Keselamatan berpendapat (a) patut ditutup sekarang
kerana ia lubang kebenaran, bukan kebersihan data. **Diterima sebagai risiko
terkawal:** penamatan refresh token menutup vektor utama; perubahan itu
menyentuh RLS seluruh sistem; dan 8C ialah **HARD GATE** yang merujuk DP-14.2
dan DP-17.4 secara eksplisit supaya ia tidak boleh dilupakan.

### 17.5 🔴 Pepijat FIXTURE dijumpai semasa membina L3-R — dan mengapa L1-R tidak terjejas

Semasa mengukur jangkaan L3-R, `Admin` (super_admin) memulangkan
`can_resolve_account_managers() = **false**` dalam fixture. Siasatan mendapati
**pepijat dalam fixture Arena sendiri**:

* `user-management.sql` memasang trigger **`on_auth_user_created`** pada
  `auth.users` yang **mencipta** baris `user_profiles` dengan
  `('viewer', is_active=false, 'pending', must_change_password=true)` dan
  `ON CONFLICT (id) DO NOTHING`.
* INSERT fixture kemudian melanggar kekangan unik, dan
  `ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name` yang lama
  **hanya mengemas kini nama** — jadi `role`, `is_active` dan `account_status`
  **kekal pada default trigger**.
* Akibatnya **semua 20 profil** fixture adalah `viewer` + **tidak aktif**, dan
  `am_list_staff()` (yang menapis `is_active = true`) memulangkan **0 baris**.

**Mengapa pengawal sedia ada tidak menangkapnya:** pengawal DP-14.3 mengira
**bilangan** profil (`= 20`) dan bilangan enum (`= 8`). Kedua-duanya **lulus**
walaupun setiap atribut salah. **Mengira baris tidak mengesahkan baris.**

**Adakah L1-R terjejas? TIDAK — dan ini diukur, bukan diandaikan.**
`resolve_account_manager()` **tidak menapis** `is_active` (itulah penemuan
DP-14.2), jadi R1/R2 tidak bergantung kepadanya; R3–R7 menguji katalog.
Selepas fixture dibaiki, penjana L1-R dijana semula dan outputnya
**byte-identik** (`diff` kosong, `--check` lulus). **Kesimpulan rekonsiliasi L1
yang ChatGPT sudah puaskan KEKAL SAH.**

**Pembetulan:**
1. Semaian kini menetapkan `role`, `is_active`, `account_status` secara
   eksplisit melalui `ON CONFLICT DO UPDATE` yang **lengkap**.
2. **Pengawal atribut** ditambah, bukan hanya kiraan: `19` profil aktif
   (20 − `test`), tepat `1` `super_admin`, dan setiap peranan dalam
   `ROLE_DIUKUR_LIVE` mesti sepadan.
3. `ROLE_DIUKUR_LIVE` mengandungi **hanya** peranan yang **diukur daripada
   live** (L3x: `Admin`=super_admin, `Zalina Sayuti`=admin, `Adilah`=finance,
   `Farrah`=finance, `Dr. Ahmad Nizar`=head_governance, `test`=staff). Baki 14
   staf **tidak diketahui** peranannya daripada mana-mana laporan live, jadi
   mereka disemai `viewer` — iaitu **kurang kuasa**, yang tidak boleh
   menghasilkan positif palsu "kuasa ada".
4. Sebab itu **jangkaan L3-R dinyatakan sebagai PERATURAN** (peranan → boleh /
   tidak), bukan sebagai nilai tetap per pengguna: peraturan boleh disahkan
   baris-demi-baris terhadap live **tanpa** Arena perlu mengetahui peranan live
   terlebih dahulu. Ini pengajaran DP-14.2 dipakai, bukan diulang.

**Fixture diekstrak ke modul dikongsi** `scripts/lib/fixture-live.mjs`, dipakai
oleh **kedua-dua** penjana L1-R dan L3-R. Sebab: dua fixture yang diselenggara
berasingan akan **drift antara satu sama lain**, dan kedua-duanya akan kelihatan
"lulus" — kegagalan berganda yang lebih sukar dikesan daripada yang asal.

### 17.6 Pengajaran direkodkan

39. **Probe yang memulangkan satu nilai per SESI tidak boleh disenaraikan per
    BARIS.** `can_resolve_account_managers()` mengambil sifar argumen;
    meletakkannya sebagai lajur dalam senarai profil menghasilkan N salinan
    jawapan yang sama dan jangkaan yang mustahil. **Semak ariti dan skop fungsi
    sebelum menulis jangkaan per baris.**
40. **Fungsi berkuasa tanpa argumen menilai PEMANGGIL.** Dalam konteks
    `execute_sql` tiada pemanggil, jadi jawapannya sentiasa "tidak berkuasa".
    Ujian kuasa **positif** memerlukan identiti; ujian **negatif** tidak.
    Reka probe mengikut apa yang konteks pelaksanaan boleh sediakan.
41. **Trigger pemasangan boleh membatalkan semaian anda secara senyap.**
    `ON CONFLICT DO UPDATE` yang menyenaraikan **satu** lajur meninggalkan
    lajur lain pada nilai default trigger. Jika semaian menetapkan atribut,
    **pengawal mesti mengesahkan atribut itu**, bukan bilangan baris.
42. **Apabila fixture dibaiki, sahkan semula kesimpulan lama secara eksplisit.**
    Arena tidak *mengandaikan* L1-R tidak terjejas — penjana dijana semula dan
    outputnya dibandingkan bait-demi-bait (`diff` kosong). Itu yang menukar
    "mungkin tidak terjejas" kepada "tidak terjejas".
43. **Jangkaan berasaskan PERATURAN lebih tahan daripada berasaskan NILAI
    apabila fakta live tidak lengkap.** Arena hanya mengetahui 6 daripada 20
    peranan live. Meneka 14 yang lain akan mengulangi DP-14.2; menyatakan
    peraturan (peranan → keputusan) membolehkan live disahkan tanpa tekaan.
44. **Probe yang memanggil fungsi tulis mesti selamat walaupun kawalan yang
    diujinya hilang.** S5 menghantar UUID yang tidak wujud supaya tiga lapisan
    (pengawal kuasa → pemeriksaan kewujudan → FK) masing-masing boleh
    menolaknya. Tanpa itu, probe keselamatan boleh **menjadi** kejadian
    keselamatan.
45. **Jawapan kepada kebimbangan keselamatan mesti diukur, bukan dijamin.**
    ChatGPT membangkitkan `SECURITY DEFINER`. Jawapannya bukan "ia selamat" —
    ia jadual kebenaran yang diukur, enam kawalan yang disahkan, **dan dua
    jurang sebenar yang ditemui semasa menjawabnya.** Menjawab soalan
    keselamatan dengan jujur sering mendedahkan lebih banyak daripada yang
    ditanya.

---

## DP-18 — L3-R: S2 🔴 `anon = true`; bukti mekanikal bahawa jangkaan Arena yang salah, dan mengapa ia tetap belum diputuskan (2026-09-04)

**Pencetus:** Laporan ChatGPT `L3-R` diterima. **5 daripada 6 probe 🟢** —
S1 (pendedahan minimum §2.8: `am_list_staff` = `TABLE(id uuid, full_name text)`),
S3 (pengawal kuasa 4/4 + errcode tepat), S4 (deny-by-default 0 baris),
S5 (**42501** verbatim, `PL/pgSQL function am_confirm_alias(text,uuid,text) line 11 at RAISE`),
S6 (alias 0, external 0, **audit 44 → 44**). **S2 🔴:**
`has_function_privilege('anon', …, 'EXECUTE') = **true** bagi 7/7 fungsi`,
sedangkan jangkaan PGlite `false`.

ChatGPT **menyekat Langkah 4**, tidak `REVOKE`/`GRANT`/`ALTER`, dan membezakan
dengan tepat: *"Ini bukan bermakna S5 boleh bypass — S5 menunjukkan ia tidak
boleh. Tetapi prinsip least-privilege … tidak dipenuhi."*

### 18.1 Bukti mekanikal — diukur dalam PGlite, bukan dihujahkan

| Keadaan | `anon` ada EXECUTE |
|---|---|
| **A.** Fixture PGlite tanpa *default privileges* | **0 / 7** ← jangkaan yang Arena kira |
| **B.** A + `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated` | **7 / 7** ← **tepat seperti live** |
| **C.** Dalam B, `REVOKE ALL ON FUNCTION … FROM PUBLIC` **diulang** | **masih `true`** |
| **D.** Dalam C, `REVOKE ALL ON FUNCTION … FROM **anon**` | **`false`** |

`pg_default_acl` bagi `defaclobjtype = 'f'` dalam keadaan B:
`{authenticated=X/postgres,anon=X/postgres}` — `X` = EXECUTE.

**Dua kesimpulan mengikuti:**

1. **`REVOKE ALL … FROM PUBLIC` tidak membuang grant langsung kepada `anon`.**
   `PUBLIC` ialah pseudo-role; `anon` peranan berasingan. Hanya `REVOKE … FROM
   anon` membuangnya (D).
2. Maka **fail yang diluluskan pun, jika dilaksanakan byte-for-byte di Supabase,
   tetap menghasilkan `anon = true`** — *jika* projek itu mempunyai *default
   privileges* yang memberi EXECUTE kepada `anon` bagi fungsi baharu dalam
   `public`.

**Sokongan daripada repo (diukur):**
* **Tiada `ALTER DEFAULT PRIVILEGES` dalam mana-mana `lib/supabase/*.sql`.**
  Jadi jika ia wujud di live, ia datang daripada **platform Supabase**, bukan
  repo — dan **fixture PGlite tidak boleh menirunya daripada fail repo sahaja**.
  Inilah punca S2: **fixture ≠ live**, kali **keempat**.
* **Tiada kod aplikasi memanggil mana-mana daripada 7 fungsi** (`grep` dalam
  `app/`, `lib/`, `components/` = kosong).
* `user-management.sql`: **19 fungsi, 17 dengan `REVOKE ALL ON FUNCTION`** —
  corak **sama persis** dengan Langkah 3.

### 18.2 🔴 Mengapa panel **TIDAK** terus membatalkan S2

Eksperimen 18.1 membuktikan mekanisme itu **mencukupi** untuk menghasilkan
`anon = true`. Ia **tidak** membuktikan mekanisme itu **punca sebenar** di live.
Mengisytiharkan "artifak, teruskan" berdasarkan PGlite sahaja ialah **tepat
kesilapan yang panel ini wujud untuk elak** — dan ia akan menjadi kali keempat
Arena membuat kesimpulan tentang live tanpa mengukurnya.

**Kata putus 18.2:** keluarkan **`docs/PROMPT-8A3-S2F-ANON-PRIVILEGE-DIAGNOSTIK.md`** *(kemas kini DP-19.4: prompt itu kini **dibundel** ke dalam L4 Seksyen 3B dan L4 **tidak lagi disekat**; probe tetap dijalankan, hanya caranya yang berubah)*
(4 query read-only). **Langkah 4 KEKAL DISEKAT** sehingga ia kembali. Kos:
satu pusingan; nilai: menukar "hipotesis kuat" kepada "fakta diukur".

**F2 ialah pembeza paling kuat.** Jika fungsi **pra-L3** (17 fungsi Fasa 6 dengan
corak `REVOKE FROM PUBLIC` yang sama) **juga** `anon = true`, maka ia
**sistemik** — keadaan seluruh projek, bukan kesan pemasangan L3, dan S2 **tidak
boleh** dijadikan bukti ketidaksetiaan L3. Jika pra-L3 `anon = false` tetapi
L3 `7/7 true`, maka cara L3 dipasang **berbeza** daripada fail yang diluluskan
dan S2 🔴 ialah penemuan sebenar.

### 18.3 Kesimpulan PRA-DAFTAR (direkodkan SEBELUM data live dilihat)

Supaya kata putus tidak boleh direka selepas melihat hasil, panel mengikat
dirinya sekarang:

* **A — artifak platform** (F1 ada `anon=X`, **atau** F2 menunjukkan pra-L3 juga
  `true`): S2 **diturunkan** 🔴 → 🟠 dengan sebab diukur. Fixture PGlite
  **ditambah** `ALTER DEFAULT PRIVILEGES` supaya setara live, dengan pengawal
  baharu. **L3-R diisytiharkan DIPUASKAN** (S1, S3, S4, S5, S6 🟢) dan
  **Langkah 4 dibuka**.
* **B — khusus L3** (pra-L3 `false`, L3 `7/7 true`): **L3-R kekal 🔴**; Arena
  mengeluarkan fail pembetulan yang diluluskan; **Langkah 4 kekal disekat**.
* **C — tidak dapat ditentukan:** kekal disekat, punca diselidik semula.

### 18.4 🟠 Soalan *least-privilege* DIASINGKAN daripada soalan kesetiaan

Ini pemisahan yang ChatGPT buat dengan betul, dan panel mengekalkannya:

1. **"Adakah L3 dipasang setia?"** — soalan **rekonsiliasi**. Dijawab oleh S2-F.
2. **"Adakah postur privilej ini yang kita mahu?"** — soalan **tadbir urus**.
   **Tidak** ditutup oleh mana-mana jawapan kepada (1).

Fakta untuk (2), diukur:

* **Kesan semasa: tiada kebocoran ditunjukkan.** S4 membuktikan ketiga-tiga
  fungsi baca memulangkan **0 baris** tanpa identiti; S5 membuktikan fungsi tulis
  **menolak dengan 42501** dan S6 membuktikan **tiada** baris alias/external/audit
  terhasil. Oleh kerana `anon` tiada JWT, `auth.uid()` juga NULL bagi `anon` —
  jadi S4 **sudah memodelkan** pandangan `anon`.
* **Yang dilanggar ialah prinsip, bukan data:** `anon` boleh **memanggil**
  (EXECUTE) walaupun ia tidak boleh **mendapatkan** apa-apa.
* **Risiko sistemik sebenar:** *default privileges* bermakna **setiap fungsi
  baharu** dalam `public` automatik boleh dipanggil oleh `anon`. Fungsi masa
  depan yang **lupa** pengawal dalaman akan mewarisi capaian itu. Pertahanan
  kini bergantung **sepenuhnya** kepada disiplin pengawal dalaman, bukan kepada
  privilej.

**Kedudukan yang dibenarkan:**

* **Keselamatan:** `REVOKE EXECUTE … FROM anon` bagi 7 fungsi ini sekarang, dan
  pertimbangkan untuk seluruh `public`. *Least privilege* ialah pertahanan
  berlapis; bergantung pada satu lapisan (pengawal dalaman) ialah rapuh.
* **Kejuruteraan:** jangan lakukan REVOKE satu-per-satu — *default privileges*
  akan memberi semula grant pada **setiap fungsi baharu**, jadi ia menjadi
  kerja berulang tanpa penyelesaian. Pembetulan yang betul ialah di **punca**:
  `ALTER DEFAULT PRIVILEGES … REVOKE` **atau** `REVOKE … FROM anon` yang
  eksplisit dalam **setiap fail pemasangan** sebagai konvensyen.
* **Kewangan/BA:** tiada kesan fungsian — tiada pemanggil aplikasi hari ini.

**Kata putus 18.4 (tertakluk kepada 18.3):**
1. **Jangan** `REVOKE` sekarang. Ia **migration** yang menyentuh permukaan
   privilej **17 fungsi Fasa 6** jika dilakukan secara sistemik, dan ia mesti
   pergi sebagai **fail aditif yang diluluskan**, bukan tindakan sampingan
   semasa rekonsiliasi.
2. **Bundel dengan gate 8C** bersama DP-14.2 dan DP-17.4(a)(b) — ketiga-tiganya
   ialah *hardening* yang menyentuh objek yang sudah dipasang, dan ketiga-tiganya
   mempunyai **sifar kesan semasa**. Satu migration aditif, satu ujian penuh,
   satu gate.
3. **Konvensyen baharu direkodkan sekarang** supaya ia tidak perlu diputuskan
   semula: **setiap** fungsi baharu dalam `public` mesti mengandungi
   `REVOKE ALL … FROM PUBLIC` **dan** `REVOKE ALL … FROM anon` **dan**
   `GRANT EXECUTE … TO authenticated` — kerana yang pertama **tidak**
   meliputi yang kedua (diukur, 18.1 C/D).
4. `REVOKE … FROM anon` **selamat hari ini** (tiada pemanggil aplikasi), tetapi
   **mesti mengekalkan** grant kepada `authenticated` — UI 8A-2 akan memanggil
   `am_list_staff()` sebagai pengguna `authenticated`.
5. **Bantahan Keselamatan direkodkan:** ia berpendapat menunggu sehingga 8C
   meninggalkan jendela di mana fungsi baharu boleh ditambah tanpa penolakan
   `anon`. **Diterima sebagai risiko terkawal** kerana (i) tiada kebocoran
   ditunjukkan (S4/S5/S6), (ii) tiada fungsi baharu akan ditambah sebelum 8C —
   L4 hanya *seed*, dan (iii) konvensyen dalam (3) sudah direkodkan dan akan
   diuji oleh pengawal.

### 18.5 Pengajaran direkodkan

46. **`REVOKE … FROM PUBLIC` bukan `REVOKE … FROM <peranan>`.** `PUBLIC` ialah
    pseudo-role. Grant langsung kepada `anon` tidak tersentuh olehnya. Ramalan
    privilej yang mengabaikan perbezaan ini akan salah pada **setiap** platform
    yang mempunyai *default privileges*.
47. **Fixture yang dibina daripada fail repo sahaja tidak boleh meniru
    *default privileges* platform.** Ia bukan kekurangan fail repo — tiada fail
    repo mengandungi `ALTER DEFAULT PRIVILEGES`. Ini kelas **kelima** jurang
    fixture↔live (selepas versi PG, data profil, enum, trigger), dan semuanya
    berkongsi satu punca: **fixture dibina daripada repo, tetapi live dibina
    daripada repo + platform.**
48. **Bukti bahawa mekanisme itu MENCUKUPI bukan bukti bahawa ia PUNCA.**
    PGlite menunjukkan `anon = 7/7` boleh dihasilkan oleh *default privileges*.
    Ia tidak menunjukkan live mempunyai *default privileges*. Perbezaan itu
    ialah seluruh sebab probe F1/F2 wujud.
49. **Pra-daftarkan kesimpulan sebelum data tiba.** DP-18.3 mengikat A/B/C
    **sebelum** laporan S2-F dilihat. Tanpa itu, mudah untuk memilih tafsiran
    yang membolehkan kerja diteruskan — dan itu cara projek mati.
50. **Asingkan "adakah ia dipasang setia?" daripada "adakah reka bentuk ini yang
    kita mahu?".** ChatGPT membuat pemisahan ini sendiri dan dengan tepat.
    Menjawab yang pertama "ya" **tidak** menjawab yang kedua, dan menjawap yang
    kedua "tidak memuaskan" **tidak** bermakna yang pertama gagal.

---

## DP-19 — Permintaan pengguna "dah nak guna": apa yang dihantar sekarang, bagaimana L4 dinyahsekat tanpa melangkau S2-F, dan di mana invarian `raw_text` sebenarnya berada (2026-09-05)

**Pencetus.** Pengguna menulis: *"Please lengkapkan proses pembinaan system. Dah nak guna ni."*
Ini bukan gangguan kepada proses — ia **keperluan**. Panel mesti memutuskan apa
yang dihantar dalam pusingan ini, kerana sehingga sekarang 8A mempunyai SQL yang
lengkap (L1–L3 dipasang, L3-R 5/6 🟢) tetapi **tiada permukaan manusia**: satu-
satunya cara merekodkan keputusan alias ialah menulis SQL. Staf kewangan tidak
boleh menggunakan sistem yang memerlukan mereka menulis `SELECT`.

### 19.1 Fakta yang ditetapkan SEBELUM sebarang keputusan

| Fakta | Sumber |
|---|---|
| 14 halaman + 5 modul Server Action sudah wujud | inventori `app/`, `lib/actions/` |
| `lib/mock-data.ts` ialah **fallback** sahaja, ditandakan `isDemo` — bukan sumber utama | `dashboard-data`, `master-records`, `participants-data` |
| 7 fungsi L3 + 3 fungsi L2 sudah dipasang di live | laporan L3-R S1, `external-account-managers.sql` |
| L3-R = 5/6 🟢; S2 🔴 (`anon = true` 7/7) | laporan GPT 2026-09-05 |
| S4/S5/S6: 0 baris bocor, `42501` pada baris 11 SEBELUM INSERT, 0/0/44 | laporan L3-R |
| L4 (seed) belum dijalankan; prompt sudah dijana | `PROMPT-8A3-L4-SEED-ALIASES.md` |

**Bacaan panel:** sistem ini **sudah boleh digunakan** untuk kebanyakan aliran.
Yang menghalang "boleh guna" bagi 8A bukanlah kekurangan SQL — ia kekurangan UI.

### 19.2 Keputusan A — hantar permukaan 8A-2 sekarang

Dibina dalam pusingan ini:

| Fail | Peranan |
|---|---|
| `lib/account-manager.ts` | helper **tulen** (kategori, DP-8/DP-9, validator, ringkasan) — tiada I/O |
| `lib/actions/account-manager-actions.ts` | 9 Server Action → 8 RPC; DB menguatkuasakan kuasa |
| `app/(dashboard)/account-managers/page.tsx` | gate peranan — **menanya DB**, bukan meneka |
| `components/account-managers/alias-confirmation.tsx` | UI: kad ringkasan, tab, jadual, 3 dialog |
| `components/layout/sidebar-nav.tsx` | pautan "Pengurus Akaun" (4 peranan) |
| `scripts/test-account-manager-ui.mjs` | **ujian kontrak** TS↔SQL, 160 penegasan |

Reka bentuk yang tidak boleh dirunding (semuanya sudah ada dalam kod):

1. **Sistem tidak pernah mengesahkan sendiri.** Manusia memilih; sistem mengingati.
2. **Veto Kewangan §2.4** menghalang *sistem* daripada memilih seorang daripada
   sel berbilang orang — ia **tidak** menghalang *manusia*. DP-8 ialah keputusan
   manusia, jadi UI **mewajibkan nota** (≥12 aksara) untuk nilai berbilang orang:
   nota itulah jejak audit yang membezakan "manusia memutuskan" daripada
   "sistem meneka".
3. **Setiap keputusan boleh dibatalkan** (syarat QA dalam DP-8) — dialog batal
   untuk alias dan untuk orang luar.
4. **Pendedahan minimum §2.8** — pemilih staf hanya `id` + `full_name`, sepadan
   dengan `am_list_staff()` yang disahkan live oleh probe S1.
5. **Mod demo: baca dibenarkan, tulisan DITOLAK.** Data palsu tidak boleh
   disalah anggap sebagai keputusan manusia yang direkodkan.

### 19.3 Keputusan B — mengapa ujian kontrak, bukan ujian unit

`tsc` dan `next build` **lulus** walaupun nama RPC salah eja, kerana
`.rpc("nama")` menerima sebarang rentetan. Ralat itu hanya muncul apabila
pengguna menekan butang — tepat pada saat sistem mula digunakan. Maka
`test-account-manager-ui.mjs` membandingkan kod TS **terus kepada fail SQL**:

- setiap nama `.rpc()` mesti ditakrifkan dalam `lib/supabase/*.sql`
- setiap kunci argumen mesti parameter yang diisytihar
- setiap parameter **tanpa `DEFAULT`** mesti dibekalkan

Ujian ini serta-merta membuktikan 8/8 nama dan semua nama parameter sepadan —
termasuk tiga fungsi yang tinggal di fail berbeza (`am_confirm_external`,
`am_revoke_external`, `is_external_account_manager` dalam
`external-account-managers.sql`, bukan `account-manager-resolution.sql`).
Tanpa ujian ini, perbezaan fail itu kelihatan seperti nama fungsi yang hilang.

Bahagian C ujian mengunci satu lagi invarian yang mahal jika tersilap:
**set peranan nav tolak `super_admin` mesti SAMA TEPAT dengan set `has_role()`
dalam `can_resolve_account_managers()`.** Jika keduanya berbeza, pengguna melihat
pautan yang kemudian menolak mereka — ralat yang memalukan dan sukar dikesan.

### 19.4 Keputusan C — L4 dinyahsekat dengan MEMBUNDEL S2-F, bukan melangkauinya

DP-18.2 mengeluarkan probe F1–F4 sebagai prompt berasingan dan L4 ditandakan
BLOCKED. Pengguna kini mahu sistem digunakan. Panel memilih **bundel**:

> Probe S2-F (read-only) disuntik ke dalam prompt L4 sebagai **Seksyen 3B**,
> dijalankan DAHULU, dilaporkan dalam laporan yang SAMA, kemudian seed L4.

**Mengapa bundel ini sah, dan bila ia tidak sah.** Bundel hanya sah kerana
kedua-dua kerja **tidak bersandaran**: L4 dilaksanakan sebagai pemilik pangkalan
data melalui SQL Editor, jadi postur `anon` tidak mengubah hasilnya. S4/S5/S6
sudah menunjukkan tiada pendedahan. Jika suatu langkah kelak bergantung kepada
*JAWAPAN* probe, ia mesti dipisah semula — bundel bukan alasan untuk melangkau
keputusan.

**Apa yang TIDAK dikorbankan:**

- S2-F **tetap dijalankan**, jadi pra-daftar DP-18.3 (A/B/C) tetap boleh dijawab.
- Kandungan probe **dipotong** daripada `PROMPT-8A3-S2F-…md`, bukan disalin —
  satu sumber kebenaran; `--check` mengesan drift.
- Prompt L1/L2/L3 yang **sudah dilaksanakan tidak disentuh langsung** (disahkan
  `git diff`: hanya L4 berubah, +172 baris), supaya laporan lepas kekal boleh
  dipadan.
- Rantai integriti DP-12 utuh: blob SHA seed tidak berubah (`22fc847e4708…`),
  dan probe sengaja kekal berpagar 3-backtick supaya pengekstrak 4-backtick
  dalam `test-doc-references.mjs` seksyen [7] tidak boleh terkeliru. Penjana
  malah **membaling ralat** jika probe mula mengandungi pagar 4-backtick.
- Prompt mengandungi **satu** syarat berhenti: jika `anon` memegang grant
  TULISAN (`INSERT`/`UPDATE`/`DELETE`/`TRUNCATE`/`REFERENCES`/`TRIGGER`) ke
  atas objek `public`, GPT mesti berhenti sebelum seed. Itu pendedahan sebenar —
  berbeza daripada sisihan *least-privilege* yang sudah diasingkan dalam DP-18.4.

**Bantahan Keselamatan (direkodkan):** membundel bermakna seed berjalan sebelum
Arena melihat jawapan F1–F4. **Diterima sebagai risiko terkawal** kerana seed
tidak menyentuh grant, dijalankan sebagai pemilik, dan boleh dibatalkan
(`am_revoke_alias`); syarat berhenti di atas menutup satu-satunya senario yang
dapat menjadikan bundel itu berbahaya.

**Bantahan QA (direkodkan):** dua perkara dalam satu laporan meningkatkan risiko
GPT meringkaskan separuh daripadanya. **Diterima** dengan mitigasi: format
laporan S2-F dipotong sekali dan diletakkan di dalam prompt, dengan arahan
eksplisit supaya jawapan probe muncul di bawah tajuk `## S2-F` **sebelum**
bahagian L4, dan angka dilaporkan **mentah** tanpa tafsiran (melindungi
pra-daftar DP-18.3).

### 19.5 Keputusan D — di mana invarian `raw_text` sebenarnya berada

Ujian menangkap satu `raw_text.trim()` dalam UI. Dua bacaan yang boleh
dipertahankan:

- **QA/integriti:** `Fuzy / Sholihin ` (ruang hujung) ialah kunci sebenar dalam
  DB. Sebarang pemangkasan menjadikan pengesahan tidak sepadan → data rosak
  senyap. Larang `trim()` sepenuhnya.
- **UX:** `trim()` itu berada pada **nama paparan pra-isi** untuk orang luar —
  medan baharu yang dicipta manusia, bukan kunci. Memaksa pengguna memadam ruang
  hujung ialah geseran tanpa faedah.

**Kata putus 19.5:** invarian yang betul ialah **LALUAN HANTAR**, bukan kehadiran
token. Ditetapkan:

1. Keempat-empat laluan hantar (`confirmAlias`, `confirmExternal`, `revokeAlias`,
   `revokeExternal`) mesti menghantar `raw_text` **tanpa pemangkasan** — diuji
   dengan mengekstrak argumen pertama setiap panggilan.
2. **Tepat satu** `.trim()` pada `raw_text` dibenarkan, dan ia dinamakan dalam
   komen di tempatnya (nama paparan pra-isi). Bilangan itu dikunci oleh ujian,
   jadi `trim()` kedua akan gagal.
3. UI mengekalkan ruang putih secara visual (`whitespace-pre-wrap`) supaya
   pengguna **nampak** ruang hujung itu wujud.

**Susunan yang penting:** laluan hantar disemak **DAHULU**, dan hanya selepas
ia terbukti bait-identik barulah assertion yang terlalu ketat itu dilonggarkan.
Melonggarkan ujian sebelum membuktikan laluan sebenar selamat adalah cara
pepijat disembunyikan.

### 19.6 Keputusan E — apa yang TIDAK dihantar, dinyatakan tanpa berselindung

8A-2 menutup 8A. Yang berikut **belum** dibina dan tidak boleh dituntut sebagai
siap: **8B** quotation, **8C** pengetatan privilej (termasuk `anon`),
**8D** pembaikan invois, **8E** pipeline, **8F** P&L/komisen, **8G** penugasan,
**8H** penamaan semula + pembersihan. Empat fail sumber yang belum dipetakan
masih digunakan aktif (keputusan pengguna 2026-09-04), jadi 8B–8E masih
mempunyai kerja pemetaan data, bukan sekadar kerja UI.

### 19.7 Pengajaran direkodkan

51. **"Dah nak guna" ialah keperluan, bukan gangguan.** Permukaan yang boleh
    digunakan oleh manusia bukan-pembangun adalah sebahagian daripada definisi
    *siap*. SQL yang lengkap tanpa UI ialah kerja separuh siap yang kelihatan
    lengkap dalam laporan.
52. **Sempadan antara bahasa tidak disemak oleh compiler.** `.rpc("nama")` ialah
    rentetan; TypeScript tidak dapat membantu. Setiap sempadan TS↔SQL
    memerlukan ujian kontraknya sendiri yang membaca **fail SQL**, bukan
    salinan jangkaan.
53. **Nyatakan invarian pada sempadan yang betul.** "Tiada `trim()` di
    mana-mana" gagal pada kod yang betul; "nilai yang dihantar mesti
    bait-identik" menangkap kod yang salah. Ujian yang terlalu ketat pada
    tempat yang salah menghasilkan tekanan untuk melonggarkannya secara
    membuta tuli.
54. **Bundel hanya sah bila tiada kebergantungan keputusan.** Menjimatkan satu
    pusingan GPT tidak boleh membayar harga satu keputusan yang dibuat dengan
    maklumat yang belum ada. Di sini bundel sah kerana L4 dijalankan sebagai
    pemilik pangkalan data — fakta, bukan harapan.
55. **Jangan sentuh prompt yang sudah dilaksanakan.** Menambah satu baris kosong
    kepada L1/L2/L3 akan memutuskan padanan dengan laporan lepas. Suntikan
    bersyarat mesti menghasilkan **sifar bait** perbezaan apabila tidak aktif.

---

## DP-20 — S2-F dijawab di live: pra-daftar DP-18.3 → **A**; fixture kelas-5 dibaiki; dan kecacatan Arena yang menghilangkan satu pusingan (2026-09-05)

**Pencetus.** ChatGPT menjalankan probe S2-F secara read-only dan melaporkan
keputusannya, kemudian **berhenti sebelum seed L4**, menyatakan ia mengikut
"arahan eksplisit prompt". Panel terpaksa memutuskan tiga perkara berasingan:
apa maksud angka itu, apa yang perlu dibaiki, dan siapa yang sebenarnya salah.

### 20.1 Angka live (verbatim daripada laporan, tidak ditafsir di hujung GPT)

| Probe | Keputusan live |
|---|---|
| **F1** `pg_default_acl` (`public`, ditetapkan `postgres`) | `{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}` |
| **F1** (`public`, ditetapkan `supabase_admin`) | `{postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin}` |
| **F2** fungsi Langkah 3 | 7 fungsi · `anon_boleh` = **7** · `auth_boleh` = 7 |
| **F2** fungsi pra-Langkah 3 | **46** fungsi · `anon_boleh` = **46** · `auth_boleh` = 46 |
| **F3** keahlian peranan | `authenticator`, `postgres`, `supabase_realtime_admin` → ahli `anon`/`authenticated`/`service_role`. **Tiada baris `anon` → `authenticated`.** |
| **F4** simulasi `anon` | `uid = NULL` · staf dilihat = **0** · nilai dilihat = **0** |

Cap jari `seed-account-manager-aliases.sql` yang GPT kutip disahkan semula oleh
Arena terhadap fail sebenar: bait **12284** ✅ · aksara **12229** ✅ · SHA-256
`0bcc03a8…` ✅ · blob SHA `22fc847e4708…` ✅ · `CREATE` 0/0/0/0 ✅.
(Baris: prompt menyebut **283** kerana penjana mengira *newline*; `split('\n')`
memberi 284 elemen bagi fail yang berakhir dengan newline. Konvensyen berbeza,
fail sama — **bukan** percanggahan.) GPT menandakan ⏳ bagi nilai yang tidak
dapat dikiranya sendiri dalam runtime dan **tidak mereka** angka. Itu betul.

### 20.2 Pemadanan dengan pra-daftar DP-18.3 → **kesimpulan A**

DP-18.3 mengikat tiga tafsiran **sebelum** data live dilihat:

> **A** artifak platform → S2 jadi 🟠, fixture ditambah *default privileges*,
> **L3-R DIPUASKAN, L4 DIBUKA** · **B** khusus-L3 → L4 kekal disekat ·
> **C** tidak ditentukan → kekal disekat.

Ukuran memenuhi **A** melalui **dua** cabang yang berasingan, dan cabang itu
saling mengesahkan:

1. **F1** menunjukkan mekanismenya wujud di live: `anon=X/postgres` dalam
   `pg_default_acl` bagi skema `public`. Ini tepat mekanisme yang Arena buktikan
   *mencukupi* dalam PGlite (DP-18.1) — kini terbukti **hadir**, bukan sekadar
   mungkin.
2. **F2** adalah pembeza yang DP-18.2 namakan paling kuat: **46/46 fungsi
   pra-L3** juga `anon = true`. Maka keadaan ini **sistemik**, bukan kesan cara
   Langkah 3 dipasang.
3. **F3** menutup penjelasan alternatif: `anon` **bukan** ahli `authenticated`,
   jadi `anon = true` bukan warisan keahlian peranan.

**Kata putus 20.2:** **S2 🔴 → 🟠 (artifak platform). L3-R DIPUASKAN. L4
DIBUKA.** Laporan asal GPT **kekal sah** — ia tidak perlu dijalankan semula, dan
jangkaannya yang lama (`anon = false`) adalah salah **fixture**, bukan salah
pemasangan. Ini menutup kelas jurang fixture↔live **kelima** dengan ukuran,
bukan dengan hujah.

**Yang TIDAK ditutup oleh A (DP-18.4 kekal berkuat kuasa):** soalan
*least-privilege*. F4 menunjukkan `anon` boleh **MEMANGGIL** tetapi tidak
**MENDAPATKAN** data (0 baris, `uid = NULL`), dan tiada percubaan tulisan dibuat.
Jadi tiada kebocoran ditunjukkan — tetapi F2 menjadikan risikonya **berangka**:
**53 fungsi `public`** (46 pra-L3 + 7 L3) boleh dipanggil tanpa log masuk, dan
setiap satu mesti menjaga dirinya sendiri. Itulah skop sebenar gate **8C**,
bersama DP-14.2 dan DP-17.4(a)(b).

### 20.3 Fixture dibaiki — dan pengawal yang dahulunya punca merah palsu

`scripts/lib/fixture-live.mjs` kini memodelkan *default privileges* platform:

```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;
```

Kesan yang diukur, bukan diandaikan:

* **L1-R TIDAK terjejas** — `--check`: tiada drift selepas baris ditambah.
  `resolve_account_manager()` tidak membaca privilej, jadi jangkaan rekonsiliasi
  L1 kekal bait-identik.
* **L3-R berubah di satu tempat sahaja** — pengawal penjana yang dahulunya
  menuntut `anon = false` kini menuntut `anon = true`. Pengawal itu **punca
  langsung** merah palsu S2; ia kini diterbalikkan dan, jika baris fixture itu
  hilang kelak, penjana **gagal dengan sengaja** supaya jurang kelas-5 tidak
  boleh kembali secara senyap.
* **Prompt L3-R dijana semula** dengan banner **SUDAH DILAKSANAKAN, JANGAN
  ULANG** yang menerangkan bahawa jangkaan S2 dibetulkan *selepas* laporan tiba.
  Prompt L1/L2/L3 pemasangan **tidak berubah walau satu bait** (disahkan
  `git diff`).

**Kata putus 20.3:** menjana semula prompt yang **sudah dilaksanakan** biasanya
dilarang (DP-19.4: laporan lepas mesti kekal boleh dipadan). Ia dibenarkan di
sini **hanya** kerana (i) perubahan itu terhad kepada satu jangkaan yang kini
diketahui salah, (ii) banner menyatakan dengan jelas bahawa laporan asal kekal
sah dan tiada apa perlu diulang, dan (iii) teks jangkaan lama direkodkan di sini
sebagai rekod audit: *"Ketujuh-tujuh fungsi mesti `authenticated = true` dan
`anon = false`. Jika mana-mana satu memberi `anon = true` … 🔴 BERHENTI."*
Tanpa ketiga-tiga syarat itu, penjanaan semula akan menjadi pemalsuan sejarah.

### 20.4 🔴 Kecacatan Arena: membundel **arahan penutup** prompt lain

Prompt L4 versi DP-19.4 memotong bahagian `## 1. PROBE` **dan** `## 2. FORMAT
LAPORAN` daripada prompt S2-F yang berdiri sendiri. Format laporan itu berakhir
dengan arahan penutupnya sendiri — menyuruh pembaca berhenti selepas melapor dan
tidak memulakan Langkah 4. Di dalam dokumen L4, baris itu **bercanggah terus**
dengan Seksyen 3B yang menyuruh teruskan kepada seed.

ChatGPT mematuhi arahan yang lebih khusus dan lebih akhir, berhenti sebelum seed,
dan melaporkannya dengan jujur. **Ia betul.** Tiada data direka, tiada gate
dilangkau, tiada perubahan live (14 perkara disenaraikan sebagai tidak dilakukan).
Yang hilang ialah **satu pusingan**, dan puncanya milik Arena.

**Kata putus 20.4:** apabila membundel kandungan daripada prompt lain, potong
bahagian **KANDUNGAN** sahaja. Arahan aliran — mula, berhenti, teruskan, jangan
ulang — mesti **milik dokumen yang menerima**, kerana hanya dokumen itu tahu
apa yang berlaku seterusnya. Prompt S2-F tidak tahu ia akan disuntik ke dalam
dokumen yang mempunyai Langkah 4 selepasnya.

**Penemuan kedua yang lebih halus.** Pembetulan pertama Arena *memetik* ayat
imperatif itu di dalam nota sejarah ("Berhenti selepas laporan. Jangan mula
Langkah 4."), dan pengawal baharu serta-merta gagal — dua kali kemunculan frasa itu.
Ini bukan sekadar artifak ujian: **model yang membaca ayat imperatif boleh
mematuhinya semula walaupun ia berada dalam tanda petik.** Maka ayat itu
**diolah secara deskriptif** (menerangkan bahawa arahan penutup itu wujud dan
bercanggah) tanpa memetik bentuk imperatifnya. Peraturan am: dalam prompt yang
ditujukan kepada model, jangan petik arahan yang anda tidak mahu dipatuhi —
terangkan ia.

**Pengawal boleh uji ditambah** (`scripts/test-prompt-8a3-install.mjs`, seksyen
DP-20.5, 26 penegasan; 140 → 166): tiada frasa berhenti sebelum Seksyen 4;
tiada blok ` ```sql ` dalam 3B (probe tidak boleh dijalankan semula secara tidak
sengaja); arahan TERUSKAN hadir; keputusan F1–F4 + kesimpulan A + pengasingan 8C
direkodkan; dan **setiap** prompt langkah mempunyai **tepat satu** arahan
"Berhenti selepas laporan".

### 20.5 Bentuk baharu Seksyen 3B

3B kini **rekod**, bukan arahan: jadual keputusan F1–F4, kesimpulan A mengikut
pra-daftar, pemisahan eksplisit antara *boleh memanggil* dan *boleh mendapatkan
data*, pengasingan *least-privilege* ke 8C, dan satu arahan aliran yang tidak
boleh disalah tafsir — laksanakan Seksyen 4 dalam pusingan yang sama. Satu
satunya keadaan yang membenarkan tidak meneruskan seed ialah **seed itu sendiri
gagal** (`42501`, `P0002` tiada Super Admin, kekangan FK), dan dalam kes itu
teks ralat penuh mesti dilaporkan tanpa melonggarkan RLS, `SECURITY DEFINER`
atau menggunakan `service_role`.

### 20.6 Pengajaran direkodkan

56. **Jangan bundel arahan penutup.** Potong kandungan; tulis semula arahan
    aliran. Dokumen sumber tidak tahu apa yang datang selepasnya dalam dokumen
    penerima.
57. **Jangan petik imperatif yang anda tidak mahu dipatuhi.** Tanda petik tidak
    meneutralkan arahan bagi model yang membacanya. Terangkan, jangan petik.
58. **Pengawal yang terlalu khusus ialah punca merah palsu yang paling mahal.**
    Pengawal S2 (`anon = false`) kelihatan seperti pengesahan kesetiaan, tetapi
    ia sebenarnya mengesahkan **andaian fixture**. Pengawal mesti menyatakan
    *fakta platform yang diukur*, bukan *jangkaan yang belum diuji*.
59. **Pra-daftar membayar balik.** DP-18.3 mengikat A/B/C sebelum data tiba,
    jadi apabila F1/F2/F3 sampai, pemadanan mengambil satu perenggan — tiada
    ruang untuk memilih tafsiran yang membolehkan kerja diteruskan.
60. **Laporan yang berhenti boleh lebih bernilai daripada laporan yang selesai.**
    ChatGPT kehilangan satu pusingan tetapi mendedahkan percanggahan arahan yang
    akan terus menjejaskan setiap prompt bundel kelak. Berhenti dengan sebab
    yang dinyatakan ialah kelakuan yang betul, dan ia harus direkodkan sebagai
    kejayaan proses, bukan kegagalan jadual.

---

## DP-21 — L4 diterima: ruang hujung yang tidak merosakkan resolusi tetapi merosakkan UI, idempotensi mengikut dimensi, dan halaman yang akan kelihatan kosong (2026-09-05)

**Pencetus.** ChatGPT melaporkan seed L4 **berjaya dipasang** di live
(`8a3_l4_seed_account_manager_aliases`, `{"success":true}`), dengan pendedahan
sukarela bahawa payload pertamanya bukan byte-for-byte. Panel mesti memutuskan:
apa yang diterima, apa yang perlu dibaiki di sisi Arena, dan apa yang mesti
diberitahu kepada pengguna sebelum mereka membuka halaman baharu itu.

### 21.1 Apa yang live laporkan — dan diterima

| Perkara | Live |
|---|---|
| Migration | `20260904071437 8a3_l4_seed_account_manager_aliases` · `{"success":true}` |
| Alias DP-8 | **3** → Fuziah (`Fuzy`, `Fuzy / Dila`, `Fuzy / Sholihin`) |
| Klasifikasi luar DP-9 | **1** (`Ow Zi Qi`, `display_name` = "Ow Zi Qi (luar)", sebab "bukan staf MIMOS Academy") |
| `audit_logs` | **44 → 48 (+4)** — tepat 4 keputusan |
| Data perniagaan | `1124/6/12/14/20` **tidak berubah** |
| K6 / K6b / K8 | 12/12 SEPADAN · 3/3 NULL (veto §2.4 hidup) · `[]` |
| K9 | Super Admin `true/19/0` · viewer `false/0/0` |
| L4v | PostgreSQL **17.6**, `kekangan_not_null_bernama = 0` |
| K4 | 🟠 `anon_exec = true` bagi 12 fungsi — **dijangka** mengikut DP-20.2, tidak diubah di L4, kekal gate 8C |
| K12 | ⏳ tidak dijalankan (Larangan 1) → **dijawab oleh Arena di PGlite, lihat 21.3** |

Cap jari disahkan semula oleh Arena terhadap fail sebenar: blob
`22fc847e4708…` ✅ · bait `12284` ✅ · aksara `12229` ✅ · SHA-256 `0bcc03a8…` ✅
· `CREATE 0/0/0/0` ✅.

**Pengesahan sampingan yang berharga:** K9 melaporkan **19** staf dilihat oleh
Super Admin daripada **20** profil. Itu **pengesahan live pertama** bagi pengawal
*atribut* fixture yang ditambah selepas DP-17.5 (19 aktif, 1 `super_admin`,
`test` blocked). Fixture kini terbukti setara live dalam dimensi itu, bukan
sekadar dikira baris.

**Kata putus 21.1:** **Fasa 8A SELESAI.** L1–L4 dipasang, direkonsiliasi, dan
keputusan manusia DP-8/DP-9 kini hidup sebagai **data** yang boleh diaudit dan
dibatalkan melalui `/account-managers`.

### 21.2 🔴 Percanggahan ruang hujung — selamat untuk resolusi, pepijat untuk UI

Baris 142 fail seed menulis kunci **tanpa** ruang hujung:

```sql
FOREACH v_raw IN ARRAY ARRAY['Fuzy', 'Fuzy / Dila', 'Fuzy / Sholihin']
```

sedangkan komen seed sendiri (baris 18, 25), query verifikasinya (baris 190),
`account-manager-resolution.sql` (baris 20) dan `KEPUTUSAN_DP8` dalam
`lib/account-manager.ts` semuanya menggunakan bentuk **dengan** ruang
(`'Fuzy / Sholihin '`) — iaitu bait sebenar lajur H Excel.

Diukur dalam PGlite (`scripts/test-seed-l4-idempoten.mjs`, 48 penegasan),
bukan dihujahkan:

* **Resolusi TIDAK terjejas.** `resolve_account_manager('Fuzy / Sholihin ')` →
  UUID Fuziah ✅, begitu juga `'  FUZY  '` dan dua ruang hujung. Sebabnya:
  carian alias menormalkan **kedua-dua** belah
  (`normalize_person_name(a.raw_text) = v_norm`), dan `btrim()` membuang ruang.
* **UI TERJEJAS — dan ini pepijat milik Arena.** `am_unresolved_values()`
  mengenakan `btrim()` pada nilai mentah, jadi UI menerima
  **`'Fuzy / Sholihin'`**. `isKeputusanPengguna()` membandingkan **rentetan
  tepat** terhadap set Excel yang mengandungi bentuk beruang hujung → padanan
  **gagal secara senyap** → lencana "keputusan pengguna DP-8" dan nota auditnya
  **tidak muncul** untuk baris yang sebenarnya sudah diputuskan manusia. Itulah
  maklumat yang menghalang pembatalan sambil lewa.

**Pembetulan:** `kunciNama()` ditambah sebagai cermin TS bagi
`normalize_person_name` (huruf kecil → buang `' ’ . \` -` → runtuhkan ruang →
buang gelaran → trim). Set Excel **dikekalkan sebagai dokumen** (ia mencatat
bait sebenar sumber) tetapi **padanan melalui kunci ternormal**, dan set kunci
**diterbitkan** daripada set Excel — bukan ditaip dua kali, jadi keduanya tidak
boleh drift. Cermin itu dikunci oleh Bahagian G ujian: **22 kes** (12 nilai Excel
+ 10 kes tepi termasuk `Dr. Afiq`, `Abu Sa'id`, `Tan Sri Ali`, kosong, ruang
sahaja) **sepadan SQL tepat**.

**Kesan yang TIDAK perlu dibaiki:** kunci alias di live kekal tanpa ruang
hujung. Jika pengguna mengesahkan nilai yang sama melalui UI, kunci yang
disimpan ialah bentuk tertrim yang **sama** → tiada baris keempat, tiada
duplikasi. Normalisasi menjadikan kedua-dua bentuk setara, jadi menukar kunci
live hanya menambah risiko tanpa faedah.

### 21.3 K12 dijawab tanpa menyentuh live: idempoten mengikut **dimensi**

GPT dengan betul tidak menjalankan semula seed (Larangan 1). Soalan itu dijawab
di PGlite dengan melaksanakan fail seed **dua kali**:

| Dimensi | Larian 2 |
|---|---|
| `account_manager_aliases` | **kekal 3**, set kunci tidak berubah (tiada baris keempat) ✅ |
| `external_account_managers` | **kekal 1** ✅ |
| Resolusi | masih betul ✅ |
| `audit_logs` | 🔴 **+4 lagi** (jumlah +8, bukan +4) |
| Peristiwa `created` | 🔴 **6** bagi 3 alias — larian kedua melabel baris **sedia ada** sebagai `created` |

Puncanya dilihat dalam fail: `PERFORM public.log_audit(… 'created' …)` dipanggil
**tanpa syarat** di dalam gelung `FOREACH`, selepas `ON CONFLICT DO UPDATE`.

**Kata putus 21.3:**

1. **Jangan jalankan seed ini dua kali di live.** Ia tidak merosakkan data
   perniagaan, tetapi mencemarkan jejak audit — dan jejak audit ialah seluruh
   sebab DP-8 menuntut keputusan manusia boleh diaudit.
2. Pembetulan (audit bersyarat: hanya log apabila baris benar-benar berubah, dan
   tindakan `updated` pada laluan `ON CONFLICT`) dimasukkan ke **migration aditif
   8C**, bersama `REVOKE … FROM anon`, DP-14.2 dan DP-17.4(a)(b). **Bukan**
   suntingan pada fail yang sudah dipasang.
3. Ini juga menjelaskan mengapa K12 tidak boleh ditutup dengan "rerun sahaja":
   L1–L3 idempoten (`CREATE OR REPLACE`, `IF NOT EXISTS`), **L4 tidak** dalam
   dimensi audit.

### 21.4 🟠 Byte-for-byte: kejadian **ketiga**, dan dua kawalan baharu

GPT mendedahkan sendiri: *"payload pertama bukan salinan penuh byte-for-byte fail
asal kerana saya mengecualikan komen/pengabsahan yang tidak dieksekusi"* — lalu
menandakan functional 🟢 tetapi strict byte-for-byte 🟠. Ini corak: DP-13.2 (L1),
DP-17.2 (L3), kini L4.

**Kata putus 21.4:** terima **secara fungsi**. Bukti kelakuan sudah lengkap
(K6 12/12, K7 3+1 dengan provenans Admin, K10 +4 audit, K11 20 jadual, data
perniagaan tidak berubah), dan kata putus DP-13.2/DP-17.2 sudah menetapkan
apabila input tidak boleh dipercayai byte-for-byte, sahkan melalui kelakuan.
Komen tidak dieksekusi, jadi membuangnya **tidak mengubah** keadaan pangkalan
data; yang berbahaya ialah pemendekan **kod**, dan K1–K11 menolak kemungkinan itu.

**Tetapi pendedahan sukarela mesti dibalas dengan kawalan yang boleh mengesan,
bukan tuntutan yang tidak boleh dipatuhi.** Dua kawalan baharu untuk prompt 8C
dan seterusnya:

* **(a) Laporkan panjang bait payload yang sebenarnya dihantar.** Murah, dan
  serta-merta mendedahkan pemendekan (`12284` vs kurang).
* **(b) Nyatakan bahawa SHA-256 boleh dikira TANPA rangkaian.** GPT dua kali
  melaporkan ⏳ dengan sebab "sandbox tidak mempunyai akses rangkaian untuk
  menarik raw GitHub" — itu **salah faham**: teks SQL sudah ada dalam konteks
  prompt, jadi tiada muat turun diperlukan untuk menulisnya ke fail dan
  menghiranya.

### 21.5 🔴 Fakta penggunaan: halaman `/account-managers` akan kelihatan KOSONG

Live mempunyai **sifar** nilai `Account Manager` mentah (J1f; K9
`bilangan_nilai = 0`; K8 `[]`). Maka halaman baharu itu akan memaparkan
**senarai kosong walaupun seed berjaya**.

**Itu betul, bukan kerosakan.** Tiga alias dan satu klasifikasi luar ialah
keputusan **pra-rekod**: ia akan terpakai **secara automatik** sebaik sahaja data
quotation/invoice yang mengandungi nilai-nilai itu masuk melalui 8B/8D. Tanpa
fakta ini dinyatakan, pengguna akan melihat halaman kosong dan menyimpulkan
sistem rosak — jadi ia mesti disebut bersama pengumuman kejayaan, bukan
sebagai nota kaki.

### 21.6 🟠 `42703` semasa probe tambahan yang tidak diminta

GPT melaporkan ralat `42703` (lajur tidak wujud) semasa "probe tambahan",
memperbetulkannya sendiri, dan menyatakan ia tidak menjejaskan seed. Direkodkan;
tiada tindakan diperlukan. **Perhatian proses:** probe tambahan yang tidak
diminta menambah permukaan ralat dan menyukarkan pemadanan laporan. Prompt 8C
akan menyatakan secara eksplisit: jalankan probe yang disenaraikan sahaja; jika
anda percaya probe tambahan diperlukan, **cadangkan** ia dalam laporan, jangan
jalankan.

### 21.7 Pengajaran direkodkan

61. **Semak transformasi VIEW sebelum membandingkan rentetan di klien.** Nilai
    yang disimpan, nilai dalam jadual sumber, dan nilai yang **sampai ke UI**
    boleh menjadi tiga bait berbeza. Di sini `btrim()` dalam view memisahkan
    ketiganya, dan perbandingan tepat di klien gagal secara senyap.
62. **Idempotensi ialah sifat per-DIMENSI, bukan per-skrip.** "Data idempoten,
    audit tidak" ialah jawapan yang berguna; "ya/tidak" bukan.
63. **Jawab ⏳ pihak lain dengan ukuran, bukan soalan semula.** K12 boleh
    dijawab sepenuhnya dalam PGlite tanpa menyentuh live — lebih cepat, lebih
    selamat, dan tidak menggunakan satu pusingan GPT.
64. **Pendedahan sukarela layak dibalas dengan kawalan, bukan tuntutan.** GPT
    mengaku memendekkan payload; jawapan yang berguna ialah "laporkan panjang
    bait yang anda hantar", bukan "jangan lakukan lagi".
65. **"Berjaya dipasang" ≠ "pengguna nampak sesuatu".** Status data live (sifar
    nilai mentah) mesti diumumkan bersama kejayaan pemasangan, atau kejayaan itu
    akan kelihatan seperti kerosakan kepada orang yang membuka halaman.

### 21.8 🔴 Insiden persekitaran: `.git` direset ke titik cabang, fail kerja kekal

Semasa mahu commit kerja DP-21, `git status` menunjukkan perubahan yang **bukan
 Arena buat** pada giliran itu (`README.md`, `app/(auth)/login/page.tsx`,
`components/security/mfa-guard.tsx` dipadam, dan puluhan fail lain).

**Diagnosis (diukur, bukan diteka):**

| Semakan | Keputusan |
|---|---|
| `git log --oneline -1` | `535fb13 Add files via upload` — **bukan** `385ae63` |
| `git cat-file -t 385ae63` | `fatal: Not a valid object name` — stor objek tempatan kehilangan commit itu |
| `git ls-remote origin arena/01a06274-masb-pms-v4` | `385ae6317ebf5813fdff6dde716461b83fe47e43` — **remote UTUH** |
| `git ls-files \| wc -l` vs `git ls-tree -r FETCH_HEAD` | indeks **153** fail vs commit **219** fail |
| `git merge-base --is-ancestor 535fb13 FETCH_HEAD` | **YA** |
| fail di cakera (`wc -l`) | `PANEL-PAKAR-TPMS.md` 3128 · `alias-confirmation.tsx` 818 · `account-manager.ts` 359 — **semua terkini** |

Maka: **HEAD + indeks direset ke titik cabang, tetapi fail kerja kekal.** Itulah
sebabnya `git diff FETCH_HEAD` melaporkan 66 fail sebagai "dipadam" (29,800
baris) — fail itu **wujud di cakera** tetapi **tiada dalam indeks**, dan
`git diff <commit>` menyenaraikan fail mengikut indeks.

**Pemulihan (fail kerja tidak disentuh):**

```
git fetch origin arena/01a06274-masb-pms-v4
git diff --stat FETCH_HEAD          # sahkan skop SEBELUM bertindak
git reset --mixed FETCH_HEAD        # HEAD + indeks <- 385ae63; working tree KEKAL
git status --short                  # kini tepat: hanya kerja giliran ini
```

`--mixed` (bukan `--hard`) adalah penting: `--hard` akan **menimpa** fail kerja
dengan pokok commit dan memusnahkan kerja DP-21 yang belum di-commit.

**Nyaris bencana yang dielakkan:** `git add -A && git commit` secara buta pada
keadaan itu akan menghasilkan satu commit yang **memadam 66 fail / 29,800 baris**
— termasuk `docs/PANEL-PAKAR-TPMS.md` (2,950 baris ketika itu), semua
`lib/supabase/*.sql` yang sudah dipasang di live, dan semua 21 fail ujian. Ia
akan kelihatan seperti kerja sah kerana ia di-commit ke branch yang betul.

**Pengajaran 66.** **Sahkan `HEAD` sebelum setiap commit, bukan selepas.**
`git log --oneline -1` + `git status --short` mengambil satu saat. Apabila
`git status` menunjukkan perubahan yang anda **tidak ingat membuat**, itu bukan
bunyi latar — itu tanda sama ada (a) persekitaran berubah di bawah anda, atau
(b) anda tersilap fail. Kedua-duanya memerlukan berhenti, bukan `git add -A`.

**Pengajaran 67.** **`git diff <commit>` menyenaraikan fail mengikut INDEKS.**
Fail yang wujud di cakera tetapi tiada dalam indeks dilaporkan sebagai
**dipadam**, bukan sebagai tidak dijejak. Sebelum mempercayai "pemadaman besar",
sahkan dengan `ls`/`wc -l` dan `git ls-files | wc -l` — tiga semakan yang
membaca keadaan sebenar, bukan satu `diff` yang dibaca melalui indeks yang
mungkin sudah lapuk.

**Pengajaran 68.** **Remote ialah salinan keselamatan yang sebenar.** Semua
commit giliran lepas sudah ditolak, jadi reset tempatan boleh dipulihkan
sepenuhnya. Amalan mendorong setiap giliran — yang sebelum ini kelihatan seperti
kebersihan sahaja — itulah yang menjadikan insiden ini boleh dipulihkan dalam
empat arahan dan bukan kehilangan kerja.

---

## DP-22 — Prinsip pengguna: data bermasalah ditonjolkan di **paparan utama**, dan cara termudah melaksanakannya bagi 8A (2026-09-05)

**Arahan pengguna (verbatim):**

> "Dalam syatem, data yang tidak lengkap atau bermasalah akan dihighlight pada
> paparan utama sistem untuk user kemaskini dan membuat pwngesahan manual. So
> cari pendekatan paling sesuai dan paling mudah untuk di apply bagi 8A"

Ini **prinsip reka bentuk**, bukan pilihan susunan fasa. Ia mengubah satu
andaian tersirat dalam reka bentuk 8A-2: bahawa pengguna akan **pergi** ke
`/account-managers`. Pengguna sebenarnya mahu sistem **datang** kepada mereka —
di halaman yang mereka buka setiap hari.

### 22.1 Tiga syarat yang terkandung dalam arahan itu

1. **Ditonjolkan di paparan utama** — bukan disembunyikan di halaman khusus.
2. **Untuk user kemaskini** — pengguna yang bertindak, bukan sistem.
3. **Pengesahan manual** — tiada pengesahan automatik; selaras dengan prinsip
   asal DP-2 ("sistem mengingati keputusan manusia, ia tidak meneka") dan veto
   Kewangan §2.4.

Syarat (3) penting kerana "highlight untuk kemaskini" boleh disalah tafsir
sebagai "sediakan butang baiki semua". Panel ini **tidak** menawarkan tindakan
pukal: setiap nilai diputuskan satu per satu, dengan nota wajib bagi sel
berbilang orang (DP-8).

### 22.2 Kata putus — pendekatan termudah yang **sah**

**Guna `am_unresolved_values()`, RPC yang SUDAH dipasang di live** (Langkah 3;
disahkan L3-R S1/S3/S4 dan kini seed L4). Akibatnya:

* **TIADA SQL baharu → TIADA migration → TIADA HARD GATE.**
* **TIADA pusingan ChatGPT/Supabase** diperlukan untuk menghantar ciri ini.
* **Kuasa kekal di pangkalan data.** RPC menolak sendiri (`42501`) dan
  memulangkan kosong bagi peranan yang tidak dibenarkan; panel **menyembunyikan
  dirinya** dalam kes itu dan tidak pernah menjadi pihak berkuasa.

**Alternatif yang dipertimbang dan ditolak:**

| Alternatif | Sebab ditolak |
|---|---|
| RPC ringkasan baharu `am_ringkasan_perlu_tindakan()` | Lebih murah satu baris SQL, tetapi memerlukan migration live + satu pusingan GPT + HARD GATE. Bertentangan terus dengan "paling mudah untuk di-apply". **Boleh dipertimbang semula** jika bacaan penuh menjadi mahal pada data besar. |
| Panel sebagai komponen klien (`"use client"`) yang memanggil action sendiri | Menambah JavaScript ke pelayar, menambah satu lagi permintaan selepas muatan, dan membuka permukaan di mana tulisan boleh berlaku tanpa disedari. Tidak perlu — data sudah tersedia di pelayan. |
| Mengira semula kategori di TS daripada baris mentah | Mencabari prinsip "pangkalan data ialah satu-satunya sumber kebenaran" dan mengulangi logik SQL di dua tempat (kelas ralat DP-13.2). |

### 22.3 Reka bentuk yang dihantar

`components/dashboard/data-attention-panel.tsx` + tiga baris wayar dalam
`app/(dashboard)/dashboard/page.tsx`:

* **Dua keadaan, bukan satu.** Ada tindakan → kad **amber** dengan kiraan
  mengikut kategori, 5 nilai teratas (mengikut `jumlah_baris` terbesar), dan
  butang "Sahkan sekarang". Tiada tindakan → satu baris **tenang** dengan
  pautan kecil. Menonjol hanya apabila memang ada yang perlu diputuskan.
* **Keadaan tenang menerangkan DP-21.5.** Kerana live hari ini mempunyai sifar
  nilai `Account Manager` mentah, baris tenang itu menyatakan bahawa keputusan
  DP-8/DP-9 **sudah pra-rekod** dan akan terpakai automatik apabila data
  quotation/invoice masuk (8B/8D). Tanpa ayat ini, dashboard kosong kelihatan
  seperti sistem rosak.
* **Server Component, bukan klien.** Bukti: saiz route `/dashboard` **tidak
  berubah** (3.71 kB) selepas panel ditambah — sifar bait JavaScript tambahan
  dihantar ke pelayar.
* **Ruang putih dikekalkan** (`whitespace-pre-wrap`) supaya `Fuzy / Sholihin `
  kelihatan seperti bait Excel sebenar.
* **Dua panggilan serentak** (`Promise.all`) kerana `loadDashboardData()` dan
  `listUnresolvedValues()` tidak bersandaran antara satu sama lain.

**Disahkan berkelakuan, bukan hanya dibina:** `curl /dashboard` dalam mod demo
memulangkan HTTP 200 dengan teks "Perlu pengesahan anda", nilai `Fuzy / Dila`
dan `Fuzy / Sholihin`, lencana "Berbilang orang", "Sahkan sekarang", "baris
terjejas", "Mod demo", dan "tidak akan meneka".

### 22.4 Ini menjadi corak bagi fasa seterusnya

Prinsip pengguna ini bukan khusus 8A. Apabila 8B (quotation), 8D (invois) dan
8E (pipeline) dibina, setiap satu akan mempunyai **jenis data bermasalahnya
sendiri** (quotation tanpa pelanggan, invois tanpa program, tarikh tidak
konsisten). Kata putus: **tambahkan jenis itu ke panel yang sama** di paparan
utama — jangan bina halaman baharu yang pengguna perlu cari. Satu tempat untuk
semua tindakan tertunda; setiap jenis membawa pautannya sendiri.

### 22.5 🟠 Insiden persekitaran kedua dalam giliran yang sama

Selepas insiden `.git` (DP-21.8), `node_modules` didapati **kosong dua kali**
dalam satu giliran: pertama sebelum ujian PGlite (dipasang semula, 11 saat),
kemudian sekali lagi selepas `npm ci` berjaya dan `next build` lulus — yang
menjadikan pemeriksaan ikon `lucide-react` mustahil dan mematikan dev server.

**Tindakan yang diambil:**

* Nama ikon diputuskan berdasarkan **apa yang sudah terbukti dalam kodbase**
  (`CheckCircle2`, digunakan di `dashboard-overview.tsx`) dan **bukan** nama
  baharu yang tidak dapat disahkan (`CircleCheckBig`) — kerana versi tidak boleh
  diperiksa semasa `node_modules` hilang.
* `.gitignore` disahkan mengecualikan `/node_modules` dan `/.next/` **sebelum**
  `git add -A`, supaya pemasangan semula tidak boleh masuk ke dalam commit
  (berkaitan terus dengan nyaris-bencana DP-21.8).
* Pengesahan (`tsc` + `build` + `curl`) dijalankan **sejurus** selepas setiap
  pemasangan, dan commit dibuat awal.

### 22.6 Pengajaran direkodkan

69. **Arahan UX pengguna boleh dipenuhi tanpa menyentuh pangkalan data.**
    Sebelum mereka bentuk RPC baharu, senaraikan RPC yang **sudah dipasang** —
    di sini satu fungsi sedia ada mencukupi untuk seluruh ciri, jadi ia boleh
    dihantar tanpa HARD GATE dan tanpa pusingan GPT.
70. **Assertion kehadiran/ketiadaan token mesti menguji KOD, bukan prosa.**
    Dokumentasi komponen yang baik menerangkan apa yang **sengaja tidak**
    dibuat, dan dengan itu mengandungi token yang dilarang. Dua assertion gagal
    pada kod yang betul kerana ia membaca komen. Penyelesaian: buang komen
    sebelum memadankan token, dan — jika alternatif yang ditolak itu penting —
    tambah assertion **positif** bahawa ia didokumentasikan.
71. **Apabila persekitaran tidak stabil, pilih pilihan yang boleh disahkan
    tanpa persekitaran.** `CheckCircle2` dipilih kerana ia sudah digunakan di
    tempat lain dalam repo; `CircleCheckBig` mungkin betul tetapi tidak dapat
    disahkan semasa `node_modules` hilang. Dalam ketidaktentuan, bukti dalam
    repo mengalahkan anggapan tentang versi pakej.

### 22.7 🔴 Reset `.git` KEDUA — kali ini di tengah giliran, dan push ditolak

Selepas DP-22 dibina, disahkan (22/22 ujian, `tsc`, `build`, `curl`) dan
di-commit, `git push` **DITOLAK** sebagai *non-fast-forward*. Semakan
menunjukkan `HEAD` telah direset semula ke `535fb13` **sebelum** commit dibuat,
jadi commit itu (`acdd5b8`) terbina di atas titik cabang dan bukan di atas
`1f820c4` yang sudah ditolak.

**Apa yang penyelamatan itu cegah.** `acdd5b8` mengandungi **semua** kandungan
kerja (kerana fail kerja tidak direset), jadi ia kelihatan "betul". Tetapi
menolaknya memerlukan **force-push**, dan itu akan menggugurkan **lima commit**
daripada sejarah branch — `2ae019a`, `633c14f`, `25254fa`, `385ae63`, `1f820c4`
— iaitu keseluruhan rekod DP-18 hingga DP-21 dalam bentuk commit. Kandungan
tidak hilang, tetapi **jejak audit** hilang, dan projek ini bergantung pada
jejak itu.

**Pemulihan yang digunakan (tanpa force-push):**

```
git log -1 --format=%B > /tmp/dp22.msg   # selamatkan mesej SEBELUM reset
git fetch origin arena/01a06274-masb-pms-v4
git reset --mixed FETCH_HEAD             # HEAD <- 1f820c4; working tree KEKAL
git status --short                       # sahkan: hanya 6 item DP-22
git add -A && git commit -F /tmp/dp22.msg
git push origin arena/01a06274-masb-pms-v4   # fast-forward 1f820c4..32e1b7f
```

Hasil disahkan: `parent: 1f820c4`, remote `32e1b7f`, dan `git log --oneline -5`
menunjukkan kelima-lima commit granular masih ada.

**Pengajaran 72.** **Penolakan push ialah pengawal keselamatan, bukan halangan.**
Apabila `git push` ditolak sebagai *non-fast-forward*, itu bermaksud sejarah
tempatan dan remote telah **bercabang** — dan jawapannya hampir tidak pernah
`--force`. Jawapannya: `fetch`, `reset --mixed` kepada commit remote, sahkan
`git status` menunjukkan hanya kerja yang dimaksudkan, commit semula, push.
Force-push menukar masalah kecil (commit tersilap induk) kepada kehilangan
besar (sejarah granular seluruh fasa).

**Pengajaran 73.** **Selamatkan mesej commit SEBELUM `reset`.** Selepas reset,
commit asal menjadi tidak boleh dicapai dan mesejnya (77 baris, mengandungi
bukti dan kata putus) perlu ditulis semula daripada ingatan — iaitu peluang
untuk rekod itu menjadi kurang tepat. Satu arahan `git log -1 --format=%B`
mengelakkannya.

**Pengajaran 74.** **Dalam persekitaran yang boleh direset pada bila-bila masa,
rapatkan jarak antara pengesahan dan push.** Semua pengesahan (ujian, `tsc`,
`build`, `curl`) dijalankan dahulu, kemudian `git log` + `add` + `commit` +
`push` dalam **satu** blok arahan. Jendela di mana reset boleh memisahkan
commit daripada push adalah beberapa saat, bukan beberapa minit.
