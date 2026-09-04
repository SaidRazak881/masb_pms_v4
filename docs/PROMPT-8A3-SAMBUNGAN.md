# PROMPT 8A-3 (SAMBUNGAN) — Teruskan pemasangan live selepas J0

> **Untuk:** ChatGPT (mempunyai akses penuh Supabase + Vercel + GitHub)
> **Daripada:** Arena (menulis kod/SQL/ujian; **tidak** melaksanakan kerja produksi)
> **Tarikh:** 2026-09-04
> **Jenis:** 🔴 **HARD GATE — pemasangan live. Sudah DILULUSKAN pengguna.**
> **Prasyarat:** J0 **sudah selesai** dan bersih. **JANGAN ulang J0.**

---

## 0. APA YANG BERLAKU — dan mengapa anda terhenti

Anda berhenti sebelum Langkah 1 dan itu **keputusan yang betul**. Anda
melaporkan:

```text
1. Cuba baca PERSONA-SQL-ARCHITECT.md      -> 404 Not Found
2. Cuba baca PERSONA-SECURITY-REVIEW.md    -> 404 Not Found
3. Cuba baca PANEL-PAKAR-TPMS.md           -> 404 Not Found
6. Cuba dapatkan client-master.sql         -> 404 Not Found
```

**Puncanya ialah kesilapan Arena, bukan anda.** Semua URL dalam prompt yang
anda terima menggunakan nama repo dengan **HYPHEN**:

| | Nilai |
|---|---|
| ❌ Dalam prompt lama | `SaidRazak881/masb-pms-v4` |
| ✅ **Nama repo sebenar** | **`SaidRazak881/masb_pms_v4`** (UNDERSCORE) |

Keempat-empat fail itu **sememangnya wujud**. Arena telah mengesahkannya
melalui GitHub API dan mengesahkan **SHA-256 kandungan di origin sepadan
tepat** dengan fail tempatan bagi keempat-empat fail SQL.

Anda **tidak** mereka-reka kandungan fail dan **tidak** menjalankan SQL yang
tidak dapat disahkan — itu pematuhan tepat terhadap larangan #8. Rekod ini
disimpan sebagai **DP-10.11** dalam `docs/PANEL-PAKAR-TPMS.md`.

**Semua URL di bawah telah dibetulkan.** Guna yang ini.

---

## 1. J0 — KEPUTUSAN ANDA SENDIRI (sahkan, jangan ulang)

Anda sudah melaporkan J0 dan ia **bersih sepenuhnya**:

| Query | Keputusan anda | Status |
|---|---|---|
| J0a | **20 profil** — 18 staf Excel + `Admin` (super_admin) + `test` (blocked) | ✅ |
| J0b | `[]` — tiada perlanggaran nama ternormal | ✅ |
| J0c | `[]` — tiada perlanggaran token pertama | ✅ |
| J0d | `bilangan=1`, `nama=Fuziah` — **unik** | ✅ |
| J0e | `44 / 1124 / 6 / 12 / 14 / 20` | ✅ sepadan J1 |

**Implikasi yang sudah diputuskan — jangan buka semula:**

1. `Fuziah` unik ⇒ **Langkah 4 TIDAK perlu dilangkau.** Teruskan.
2. J0b/J0c kosong ⇒ tiada blocker terhadap `resolve_account_manager()`.
3. `user_profiles = 20` **bukan** anomali: dua profil tambahan ialah `Admin`
   dan `test`, kedua-duanya bukan staf Excel. **Tiada keputusan manusia
   baharu diperlukan.**
4. J0e `audit_logs = 44` ⇒ **K10 dijangka `> 44`** selepas seed, kerana seed
   menulis jejak audit. Itu **lulus**, bukan kegagalan.
5. `Account Manager` live = **sifar nilai** (J1f = `[]`) ⇒ **K8 dijangka
   0 baris** dan `am_backfill_account_manager()` akan mengisi **0 baris**.
   Itu **lulus**, bukan kegagalan. Jangan "memperbaiki" angka ini.

**JANGAN jalankan J0 semula.** Terus ke Seksyen 2.

---

## 2. PERSONA — baca dahulu (URL dibetulkan)

```text
https://raw.githubusercontent.com/SaidRazak881/masb_pms_v4/arena/01a06274-masb-pms-v4/docs/personas/PERSONA-SQL-ARCHITECT.md
https://raw.githubusercontent.com/SaidRazak881/masb_pms_v4/arena/01a06274-masb-pms-v4/docs/personas/PERSONA-SECURITY-REVIEW.md
```

Prompt penuh (J0 + Langkah 1–5 + K1–K12 + 14 larangan + format laporan):

```text
https://raw.githubusercontent.com/SaidRazak881/masb_pms_v4/arena/01a06274-masb-pms-v4/docs/PROMPT-8A3-INSTALL.md
```

Rekod panel — **baca DP-10** (fakta live yang mengubah jangkaan):

```text
https://raw.githubusercontent.com/SaidRazak881/masb_pms_v4/arena/01a06274-masb-pms-v4/docs/PANEL-PAKAR-TPMS.md
```

> Jika `raw.githubusercontent.com` gagal, guna bentuk HTML dan klik **Raw**:
> `https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/<laluan>`
>
> ⚠️ **Perangkap: repo guna UNDERSCORE, branch guna HYPHEN.**
> `SaidRazak881/masb_pms_v4` tetapi `arena/01a06274-masb-pms-v4` — kedua-duanya
> muncul dalam URL yang sama. Jangan seragamkan salah satu.
>
> **Perhatikan UNDERSCORE dalam `masb_pms_v4`.** Jika anda mendapat `404`,
> periksa nama repo dahulu sebelum menyimpulkan fail itu tiada — dan
> **laporkan**, jangan reka kandungan.

---

## 3. SAHKAN INTEGRITI — gate dua lapis (DIGANTIKAN daripada SHA-256)

### 3.0 Mengapa bahagian ini berubah

Anda melaporkan dengan betul bahawa anda **tidak dapat mengira SHA-256
byte-for-byte**: connector GitHub memberikan *blob SHA Git*, dan runtime anda
tiada DNS/internet keluar untuk mengambil raw dan menghashnya. Anda juga betul
enggan menganggap SHA yang tertulis dalam prompt sebagai SHA yang anda kira
sendiri.

**Itu kecacatan reka bentuk prompt Arena, bukan kegagalan anda.** Arena
mengenakan gate yang anda secara struktur tidak boleh lulusi. Ia kini
digantikan. Direkodkan sebagai **DP-11**.

**Berita baiknya: anda SUDAH mempunyai nilai yang diperlukan.**

Git blob SHA ialah `SHA-1("blob " + <panjang_bait> + "\0" + <kandungan>)`.
Arena mengesahkannya tiga cara dan ketiga-tiganya sepadan tepat:
`git hash-object` (lokal), `gh api …/contents` → `.sha` (origin), dan pengiraan
SHA-1 langsung dalam Python. `git ls-tree` pada commit `6afabe1` melaporkan
nilai yang sama, jadi ia **terikat kepada commit**.

Oleh itu gate baharu ialah **perbandingan, bukan pengiraan**:

> Baca blob SHA yang connector anda **sudah** berikan, dan bandingkan dengan
> nilai jangkaan di bawah. **Tiada alat hash diperlukan.**

Kerana panjang bait adalah sebahagian daripada input hash, sebarang pemotongan
atau perubahan satu bait pun menukar nilainya — ia sensitif **byte-for-byte**.

⚠️ **Pengesan integriti ≠ kawalan keselamatan.** Blob SHA ialah SHA-1 dan lemah
terhadap perlanggaran yang *disengajakan*. Ia di sini untuk mengesan kerosakan
atau pemotongan **tidak sengaja** semasa pengambilan. Kelulusan kandungan datang
daripada **pengguna**, dan kawalan terhadap SQL jahat datang daripada allowlist
fail + larangan DROP/rename/RLS + semakan Arena selepas pelaksanaan.
**Jangan sesekali menggunakan "integriti disahkan" sebagai alasan untuk
melonggarkan mana-mana larangan lain.**

---

### 3.1 LAPIS 1 (UTAMA) — bandingkan Git blob SHA

| # | Fail | **Blob SHA Git (jangkaan)** |
|---|---|---|
| 1 | `client-master.sql` | `37b8d8b8fa882b65645cf32e2c37d55590ec6cf2` |
| 2 | `external-account-managers.sql` | `1e555af8f78472fe7427a513b4682a8ccbc5f381` |
| 3 | `account-manager-resolution.sql` | `afcdc600efda41bc4e1928c60fe71dd6be2880ba` |
| 4 | `seed-account-manager-aliases.sql` | `22fc847e470831b250a943e425c80fa04fdf5542` |

Ambil daripada branch `arena/01a06274-masb-pms-v4` pada commit `6afabe1`
atau lebih baharu.

### 3.2 LAPIS 2 (SOKONGAN) — cap jari struktur

Lapis ini **bebas** daripada lapis 1: ia dikira daripada **kandungan yang anda
baca**, bukan daripada medan `.sha`. Jika connector rosak pada satu medan,
lapis ini masih menangkapnya.

| # | Fail | Bait | Baris | Aksara | `CREATE` TABLE / FUNCTION / POLICY / INDEX |
|---|---|---|---|---|---|
| 1 | `client-master.sql` | 17210 | 384 | 17159 | 1 / 2 / 4 / 2 |
| 2 | `external-account-managers.sql` | 13526 | 336 | 13498 | 1 / 3 / 4 / 2 |
| 3 | `account-manager-resolution.sql` | 21276 | 539 | 21237 | 0 / 7 / 0 / 0 |
| 4 | `seed-account-manager-aliases.sql` | 12284 | 283 | 12229 | 0 / 0 / 0 / 0 |

**Baris pertama** keempat-empat fail ialah:

```text
-- =====================================================================
```

**Baris terakhir bukan-kosong** (ini mengesan pemotongan hujung fail):

| # | Fail | Baris terakhir |
|---|---|---|
| 1 | `client-master.sql` | `-- NULL di sini ialah jawapan yang BETUL, bukan kegagalan.` |
| 2 | `external-account-managers.sql` | `-- Ujian berkelakuan: scripts/test-account-manager-resolution.mjs seksyen [Q].` |
| 3 | `account-manager-resolution.sql` | `-- Ujian berkelakuan: scripts/test-account-manager-resolution.mjs` |
| 4 | `seed-account-manager-aliases.sql` | `END $$;` |

> Nota: `bait` = bilangan bait UTF-8; `aksara` = bilangan aksara. Kedua-duanya
> berbeza kerana fail mengandungi aksara bukan-ASCII (é, →, ⚠). Jika alat anda
> hanya memberi satu daripada keduanya, laporkan yang mana anda ada.

### 3.3 SHA-256 — PILIHAN, bukan lagi gate

Jika anda mempunyai mana-mana alat yang boleh menghash (sandbox Python,
`sha256sum`, dan sebagainya), kira SHA-256 dan bandingkan sebagai pengesahan
silang:

```text
client-master.sql                d394398dc075f92c61db13077be568e907fb77989ef1175146682ce251418542
external-account-managers.sql    a124b9cfa9f086b6079977b2fca1140a9d06aa565e24c553a3735bdecf772793
account-manager-resolution.sql   fb32d1d00f89322dd091f70df82984196c007b1b2040b79823c2ea5073752120
seed-account-manager-aliases.sql 0bcc03a80fbea51cfb0e8079a35c4be582b418c195e21020a636148e1c67f5df
```

**Jika anda tiada alat hash, itu BUKAN blocker.** Lapis 1 + Lapis 2 mencukupi.
Tandakan SHA-256 sebagai `⏳ tidak dikira — tiada alat hash` dalam laporan dan
**teruskan**.

### 3.4 Peraturan

- ✅ **Kedua-dua** Lapis 1 dan Lapis 2 sepadan ⇒ jalankan fail itu.
- 🔴 **Mana-mana** lapisan tidak sepadan ⇒ **BERHENTI**. Jangan jalankan.
  Laporkan: nilai yang anda dapat, nilai jangkaan, saiz bait, dan baris terakhir
  yang anda lihat. **Jangan** cuba "memperbaiki" fail itu, **jangan** bina semula
  daripada kandungan separa, **jangan** jalankan berdasarkan andaian.
- 🔴 Jika anda tidak dapat membaca kandungan fail langsung ⇒ **BERHENTI** dan
  laporkan. Jangan reka kandungan (larangan #8).
- **Urutan WAJIB:** 1 → 2 → 3 → 4. Fail 3 bergantung pada jadual dari fail 2;
  fail 4 bergantung pada fungsi dari fail 1 dan 3.

### 3.5 Langkah 5 — LANGKAU

`fix-import-staging-updated-at.sql` **tidak diperlukan di live**. J1i/J1j anda
sendiri membuktikan `import_staging.updated_at` **WUJUD** (`timestamptz`,
`NOT NULL`, default `now()`) dan triggernya sepadan. DP-7 **ditutup**.
**Jangan jalankannya.**

---

## 4. NOTA PENTING TENTANG LANGKAH 4 (seed)

`seed-account-manager-aliases.sql` mengandungi **blok identiti** di
permulaannya. Ini **disengajakan dan sudah diluluskan**:

- `am_confirm_alias()` dan `am_confirm_external()` memanggil
  `can_resolve_account_managers()`, yang memerlukan `auth.uid()`.
- Supabase SQL Editor berjalan sebagai **pemilik pangkalan data tanpa JWT**,
  jadi `auth.uid()` = NULL dan setiap INSERT gagal dengan `42501 tiada kuasa`.
- Blok itu mencari akaun **Super Admin** (`role = 'super_admin'`, jatuh balik
  kepada `saidrazak881@gmail.com`), menetapkan `request.jwt.claims` untuk
  tempoh skrip, dan **memulihkannya** di hujung.
- Jika tiada akaun Super Admin ditemui, seed **membatalkan dirinya** dengan
  `P0002` — ia tidak akan menulis NULL secara paksa.

**Jalankan SELURUH fail seed sebagai SATU pelaksanaan.** SQL Editor Supabase
membungkusnya dalam satu transaksi; menjalankan kenyataan satu demi satu akan
kehilangan identiti dan mencetuskan `42501` semula.

**Kesan yang diingini:** `audit_logs.user_id` merekodkan Super Admin sebenar
sebagai pengesah keputusan DP-8/DP-9. Itulah sebabnya `audit_logs` bertambah
(K10).

🔴 **Jika anda melihat `42501 tiada kuasa`, JANGAN longgarkan RLS, JANGAN
tukar `SECURITY DEFINER`, dan JANGAN guna `service_role`.** Itu melanggar
larangan tetap. **BERHENTI dan laporkan** teks ralat penuh.

---

## 5. SELEPAS PEMASANGAN — jalankan K1–K12

Query K1–K12 yang **sepatutnya** dijalankan ada dalam Seksyen prompt penuh
(`PROMPT-8A3-INSTALL.md`, URL di Seksyen 2). Semuanya **read-only**.

Ringkasan jangkaan — **angka ini sudah dilaraskan kepada fakta live yang anda
sendiri ukur**:

| K | Jangkaan | Nota |
|---|---|---|
| K1 | 6 lajur baharu wujud | |
| K2 | 2 jadual + RLS + 8 polisi | |
| K3 | 2 lajur `account_manager` kekal `text` | J1h anda: dua-duanya `text` |
| K4 | 12 fungsi wujud | |
| K5 | 2 FK → `user_profiles`, `NO ACTION` | |
| K6 | **11 SELESAI + 1 LUAR** | J0b/J0c kosong ⇒ tiada blocker |
| K6b | semua `account_manager_id` **NULL** | backfill belum dijalankan |
| K7 | 3 alias + 1 klasifikasi luar | J0d: `Fuziah` unik |
| K8 | **0 baris** | J1f = `[]` ⇒ sifar nilai live. **0 = LULUS** |
| K9 | Super Admin `true`; viewer `false` | |
| K10 | baris perniagaan **tidak berubah**; `audit_logs > 44` | audit bertambah = dijangka |
| K11 | **20 jadual** public | live semasa 18 + 2 baharu |
| K12 | idempotent — ulang Langkah 1–4 tanpa ralat | |

**Jalankan juga pengesahan baseline (J0e semula, read-only):**
`audit_logs` mesti `> 44`; `import_staging = 1124`, `invoices = 6`,
`organizers = 12`, `programmes = 14`, `user_profiles = 20` mesti
**TIDAK BERUBAH**.

---

## 6. LARANGAN (kekal berkuat kuasa — 14 perkara)

Yang paling relevan untuk langkah ini:

1. Hanya 4 fail SQL yang disenaraikan. **Tiada fail lain.**
2. **Langkau** `fix-import-staging-updated-at.sql`.
3. Jangan guna `service_role` atau mana-mana kunci rahsia.
4. **Jangan** panggil `am_backfill_account_manager()` — ia gate berasingan
   selepas import 8C.
5. Jangan reset atau ubah mana-mana kata laluan.
6. Jangan merge ke `main`; jangan tukar Vercel Production Branch.
7. Jangan dedahkan anon key atau mana-mana secret.
8. **Jangan reka bukti.** Jika sesuatu tidak dapat disahkan, tandakan
   `⏳ MENUNGGU PENGGUNA` — seperti yang anda lakukan dengan betul untuk J0.
9. Jangan anggap Mod Demo sebagai production.
10. **Jangan berhenti senyap** jika alat gagal — laporkan ralat penuh.
11. Jangan `DROP` mana-mana objek yang tidak diluluskan.
12. **Jangan rename `organizers` → `clients`** (ditangguh ke Fasa 8H).
13. **Jangan ubah jangkaan K6/K8** untuk menjadikannya lulus.
14. Jangan tambah alias atau klasifikasi luar baharu di luar DP-8/DP-9.

---

## 7. FORMAT LAPORAN (wajib, 6 seksyen)

1. **Konteks & Status** — ref projek yang digunakan; pengesahan SHA-256 bagi
   setiap 4 fail (SHA yang anda kira vs jangkaan, saiz bait); apa yang
   dipasang; apa yang dilangkau.
2. **Keputusan K1–K12** — jadual: kriteria | status 🟢/🔴/⏳ | output verbatim
   | tafsiran. **Termasuk output penuh K6** (12 nilai) dan **K12**.
3. **Tindakan yang diambil** — urutan sebenar, termasuk sebarang ralat dan
   bagaimana ia ditangani.
4. **Pengesahan baseline tidak berubah** — jadual J0e sebelum/selepas.
5. **Isu / Blocker / Penemuan** — termasuk sebarang perkara yang tidak
   sepadan jangkaan, **walaupun ia kelihatan kecil**.
6. **Pengesahan pematuhan larangan 1–14** — jadual dengan bukti.

**Berhenti selepas laporan.** Jangan mula Fasa 8B, jangan bina UI, jangan
jalankan backfill.

---

## 8. RUMUSAN ARAHAN

```text
1. Baca persona + PROMPT-8A3-INSTALL.md + DP-10 (URL UNDERSCORE, Seksyen 2).
2. Ambil 4 fail SQL. SAHKAN INTEGRITI dua lapis (Seksyen 3):
   Lapis 1 = bandingkan Git blob SHA yang connector anda SUDAH beri.
   Lapis 2 = bait/baris/aksara/kiraan CREATE/baris terakhir.
   SHA-256 = PILIHAN sahaja; tiada alat hash BUKAN blocker.
   Mana-mana lapisan tidak sepadan -> BERHENTI + lapor kedua-dua nilai.
3. Jalankan Langkah 1 -> 2 -> 3 -> 4 dalam urutan itu.
   Langkah 4 = SATU pelaksanaan penuh. Langkah 5 = LANGKAU.
4. Jalankan K1-K12 read-only + pengesahan baseline.
5. Laporkan dalam format 6 seksyen. BERHENTI.
```
