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

## ⭐ FASA 6 (TERKINI) — Pengesahan & Pengurusan Pengguna

**MFA/TOTP telah DIBUANG.** Sistem kini menggunakan **e-mel + kata laluan
sahaja**, dengan kata laluan lalai `masb.12345` yang **wajib** ditukar pada
log masuk pertama, pendaftaran sendiri yang memerlukan kelulusan, dan
dashboard **Super Admin** (`saidrazak881@gmail.com`) di `/admin/users`.

| Keperluan | Dokumen |
| --------- | ------- |
| Prompt GPT untuk pasang SQL Fasa 6 + tukar Production Branch Vercel | **`docs/PROMPT-6-INSTALL-USER-MANAGEMENT.md`** |
| **Blocker C13** — `has_role()` live tidak sedar `super_admin` | **`docs/PROMPT-6B-FIX-C13-HAS-ROLE.md`** |
| **V3 dibetulkan** + audit **3** jadual warisan (read-only) | **`docs/PROMPT-6C-AUDIT-LEGACY-TABLES.md`** |
| D + E diluluskan + audit warisan (X1–X5) — ~~D: manual pengguna~~ **DIBATALKAN, D dikembalikan kepada ChatGPT** | `docs/PROMPT-6D-AUTH-VERCEL-LEGACY.md` |
| E diluluskan (dinyahganding dari D) + Y1–Y4 — **E=0/9, Production masih Fasa 5; Production Branch kena tukar MANUAL oleh pengguna** | `docs/PROMPT-6E-VERCEL-PRODUCTION-PRIVATE-HAS-ROLE.md` |
| E + baki D + Z1–Z5 — **Z 🟢 selesai (governance lock SELAMAT; kecacatan repo ditemui: tiada trigger updated_at). E=0/9: ChatGPT sudah cuba 2× dan namakan operasi yang tiada → Production Branch kini tugas pengguna** | `docs/PROMPT-6F-AUDIT-PRIVATE-SCHEMA-DRIFT.md` |
| ✅ **SELESAI (2026-09-04)** — pasang `updated-at-triggers.sql` (G1 **12/12**, G2 **0**, G3 berubah) + REVOKE tulis 3 jadual warisan (H3 **6/6** hanya SELECT) + I1–I2. Mengandungi **2 pembetulan ChatGPT terhadap kriteria Arena** | **`docs/PROMPT-6G-UPDATED-AT-AND-REVOKE.md`** |
| 🟢 **DILULUSKAN & DILAKSANAKAN (2026-09-04), J2–J9 🟢 / J10 ⏳:** pasang `fix-field-mapping.sql` (23 lajur) + ganti RPC `sync_import_transaction` (kriteria J1–J10). Betulkan §4.1–4.4: `trainer`→`account_manager`, syarikat→`pic_name`, SST jadi amaun (ralat 13.5×), `unique_violation` gagalkan batch. Blob SHA `d393e4628521` + `5ba925f7ef6a` disahkan tiada drift | **`docs/PROMPT-7A-FIX-FIELD-MAPPING.md`** |
| ✅ **SELESAI & DIPUASKAN (2026-09-04, DP-14) — JANGAN KONGSI SEMULA:** Rekonsiliasi L1 telah dijalankan ChatGPT (semua probe read-only, tiada DDL/DML/`service_role`). 6/8 probe 🟢 terus; dua dibendera — **R2 🔴** (`test`→`test`, `Admin`→`Admin`) dan **R6b 🟠** (live 4 kekangan bernama vs PGlite 9). **Kedua-duanya artifak, BUKAN kecacatan live:** R6b = ciri **PostgreSQL 18** (PGlite 18.3; `*_not_null` bernama tiada dalam versi live — semantik sudah disahkan ketat oleh R6 `is_nullable = NO`), dan R2 = **fixture Arena tidak lengkap** (hanya 18 staf Excel; live ada **20** profil termasuk `Admin` super_admin + `test` blocked). ChatGPT **berhenti dengan betul** dan tidak mengubah production. Fixture dibaiki (20 profil, `user-management.sql` dipasang kerana **DP-6**: `schema-master.sql` hanya ada 7 nilai `app_role`, live 8 termasuk `super_admin`); jangkaan R2 kini **tepat sama** dengan output live yang dilaporkan, jadi **semua 8 probe dipenuhi secara retroaktif — tiada ulangan di live diperlukan**. Persoalan tadbir urus yang timbul direkodkan sebagai **DP-14.2** (gate 8C). **Sejarah (sebab prompt ini wujud):** **Langkah 1 SUDAH TERPASANG DI LIVE** (migration `8a3_l1_client_master`, `{"success":true}`; L1a–L1e semua 🟢). Tetapi ChatGPT mendedahkan dengan jujur bahawa SQL yang dihantar **bukan byte-for-byte** (komen dokumentasi dibuang) — jadi L1a–L1e hanya mengesahkan **kewujudan+nama**, bukan **definisi**: badan fungsi, `qual`/`with_check` polisi, ungkapan indeks, `is_nullable`/`default`, dan FK masih belum disahkan. Perbandingan teks **tidak boleh dipakai** kerana badan fungsi mengandungi komen `--` **di dalam** blok `$$`. **Penyelesaian DP-13.2: sahkan melalui KELAKUAN.** 8 probe R1–R7 (read-only), jangkaan dikira dalam PGlite daripada fail yang diluluskan atas 18 staf yang **sama namanya dengan J0a live**. Termasuk probe **diskriminatif** `resolve_account_manager('Afiq')`→`'Dr. Afiq'` yang gagal jika regexp gelaran hilang (probe `normalize_person_name('Dr. Afiq')` sahaja **lulus secara palsu** kerana kedua-dua sisi gagal bersama) | **`docs/PROMPT-8A3-L1-REKONSILIASI.md`** |
| 🔴 **DP-13.3 — PENEMUAN BAHARU: positif palsu Langkah 5 (DIREKODKAN, bukan kecacatan):** `resolve_account_manager('Siti Nurhaliza')` → **`'Siti Sarah'`** walaupun Siti Nurhaliza bukan staf — token pertama `siti` unik, jadi Langkah 5 menyelesaikannya. Kelakuan **direka** (DP-2a) untuk kes `Zalina`→`Zalina Sayuti`; ia gagal untuk **orang berbeza yang berkongsi nama pertama**. **Risiko LATEN, bukan aktif**: live ada SIFAR nilai AM, 0 daripada 12 nilai Excel mencetuskannya, dan backfill kekal gate berasingan dengan `am_backfill_preview()`. **`client-master.sql` TIDAK diubah** (sudah terpasang; mengubah akan wujudkan drift + batalkan blob SHA yang baru LULUS). Dua peraturan ketat yang obvious **kedua-duanya pecahkan kes sebenar** `Abu Said`→`Abu Sa'id` (diuji, bukan diandaian). **Ditangguh ke 8C/8F** apabila ada data untuk diukur kadar ralat. Dikunci kekal oleh `test-client-master.mjs` [F2] | **DP-13 dalam `docs/PANEL-PAKAR-TPMS.md`** |
| ✅ **LANGKAH 4 SELESAI — FASA 8A LENGKAP. SETERUSNYA: 8C (HARD GATE, prompt belum dikeluarkan).** Seed live `8a3_l4_seed_account_manager_aliases` `{"success":true}`: **3 alias DP-8** → Fuziah, **1 klasifikasi luar DP-9** (`Ow Zi Qi`), `audit_logs` **44 → 48 (+4)**, data perniagaan `1124/6/12/14/20` **tidak berubah**, K6 **12/12 SEPADAN**, K6b **3/3 NULL** (veto §2.4 hidup), K8 `[]`, K9 Super Admin `true/19/0` · viewer `false/0/0`, K11 20 jadual, PostgreSQL **17.6**. Cap jari disahkan Arena: blob `22fc847e4708…`, bait 12284, aksara 12229, SHA-256 `0bcc03a8…`. **DP-21.4:** GPT mendedahkan sendiri payload pertama **bukan byte-for-byte** (komen dibuang) — kejadian KETIGA selepas DP-13.2/DP-17.2; diterima **secara fungsi** (K1–K11 menolak pemendekan kod), dan dua kawalan baharu ditetapkan untuk 8C: **(a)** laporkan **panjang bait payload yang dihantar**, **(b)** SHA-256 boleh dikira **tanpa rangkaian** kerana teks sudah ada dalam konteks. **DP-21.3 (K12 dijawab Arena di PGlite, bukan di live):** seed **idempoten untuk DATA** (alias kekal 3, kunci tidak berubah) tetapi **TIDAK untuk AUDIT** (+4 lagi, 6 peristiwa `created` bagi 3 alias) — **jangan jalankan seed dua kali di live**; pembetulan masuk 8C. **DP-21.2:** baris 142 seed menulis `'Fuzy / Sholihin'` **tanpa** ruang hujung sedangkan Excel/komen menggunakan bentuk beruang; **resolusi tidak terjejas** (kedua-dua belah dinormalkan) tetapi UI **terjejas** kerana `am_unresolved_values()` mengenakan `btrim()` — dibaiki dengan `kunciNama()` (cermin `normalize_person_name`, 22 kes sepadan SQL). **DP-21.5:** `/account-managers` akan kelihatan **kosong** pada live (sifar nilai mentah) — itu betul, keputusan pra-rekod terpakai automatik bila data 8B/8D masuk; UI kini menerangkannya. **Skop 8C kini berangka:** `REVOKE … FROM anon` (53 fungsi `public` boleh dipanggil tanpa log masuk: 46 pra-L3 + 7 L3), DP-14.2, DP-17.4(a)(b), dan idempotensi audit seed. Sejarah S2 🔴: **L4 TIDAK LAGI DISEKAT.** Prompt L4 kini mengandungi **Seksyen 3B**: probe F1–F4 yang read-only, dijalankan DAHULU dan dilaporkan dalam **SATU laporan** yang sama sebelum seed. Bundel ini sah kerana L4 dilaksanakan sebagai pemilik pangkalan data, jadi postur `anon` tidak mengubah hasilnya; **satu** syarat berhenti dikekalkan — jika `anon` memegang grant TULISAN ke atas objek `public`, GPT mesti berhenti sebelum seed. Prompt S2-F berasingan **tidak** perlu dikongsi lagi. **8A-2 UI SIAP** (halaman `/account-managers`, 9 Server Action, ujian kontrak 160 penegasan) — selepas seed L4, keputusan DP-8/DP-9 boleh diaudit dan dibatalkan oleh staf tanpa menulis SQL. Pra-daftar DP-18.3 (A/B/C) tetap dijawab oleh jawapan F1–F4; jangan tafsir di hujung GPT. Sejarah S2 🔴: Rekonsiliasi L3 sudah dijalankan: **5/6 probe 🟢** — S1 pendedahan minimum §2.8 (`am_list_staff` = `TABLE(id uuid, full_name text)`, tiada role/email/status), S3 pengawal kuasa 4/4 + errcode tepat, S4 deny-by-default 0 baris, S5 **42501** verbatim (`am_confirm_alias(text,uuid,text) line 11 at RAISE`), S6 alias 0 / external 0 / **audit 44 → 44**. **S2 🔴:** `has_function_privilege('anon', …, 'EXECUTE') = **true** bagi 7/7 fungsi` sedangkan jangkaan PGlite `false`. ChatGPT **menyekat L4**, tidak `REVOKE`/`GRANT`/`ALTER`, dan membezakan dengan tepat antara *kelakuan* (S4/S5 lulus) dan *postur privilej* (S2 gagal). **DP-18.1 — bukti mekanikal (diukur dalam PGlite, bukan dihujahkan):** tanpa *default privileges* `anon = 0/7`; dengan `ALTER DEFAULT PRIVILEGES IN SCHEMA PUBLIC GRANT ALL ON FUNCTIONS TO anon, authenticated` → **`7/7`, tepat seperti live**; dan `REVOKE ALL … FROM PUBLIC` **TIDAK** membuangnya (hanya `REVOKE … FROM anon` yang berbuat demikian). Maka **fail yang diluluskan pun, byte-for-byte, tetap memberi `anon = true` di Supabase** — jadi S2 🔴 mungkin **bukan** bukti pemasangan tidak setia. Sokongan repo: **tiada `ALTER DEFAULT PRIVILEGES` dalam mana-mana `lib/supabase/*.sql`** (ia datang daripada platform, jadi fixture PGlite tidak boleh menirunya daripada fail repo); **tiada kod aplikasi memanggil 7 fungsi itu**; `user-management.sql` ada **19 fungsi, 17 dengan corak `REVOKE FROM PUBLIC` yang sama**. **DP-18.2: panel MENOLAK untuk mengisytiharkan "artifak" berdasarkan PGlite sahaja** — mekanisme itu terbukti *mencukupi*, bukan terbukti *punca*. **F2 ialah pembeza paling kuat:** jika 17 fungsi pra-L3 **juga** `anon = true` → sistemik (bukan kesan L3); jika pra-L3 `false` tetapi L3 `7/7 true` → 🔴 cara L3 dipasang berbeza. **DP-18.3 kesimpulan PRA-DAFTAR** (A artifak → S2 jadi 🟠, fixture ditambah *default privileges*, **L3-R DIPUASKAN, L4 dibuka** · B khusus-L3 → **L4 kekal disekat** · C tidak ditentukan → kekal disekat). **DP-18.4:** soalan *least-privilege* **DIASINGKAN** daripada soalan kesetiaan dan **tidak ditutup** oleh mana-mana jawapan; tiada kebocoran ditunjukkan (S4/S5/S6), risiko sebenar ialah *systemic* (setiap fungsi baharu mewarisi capaian `anon`), maka `REVOKE … FROM anon` **dibundel ke gate 8C** bersama DP-14.2 + DP-17.4(a)(b) sebagai satu migration aditif — **bukan** tindakan sampingan semasa rekonsiliasi. Konvensyen baharu direkodkan: setiap fungsi `public` mesti ada `REVOKE FROM PUBLIC` **dan** `REVOKE FROM anon` **dan** `GRANT TO authenticated`. **Sejarah Langkah 3:** **Langkah 3 DIPASANG** — migration `8a3_l3_account_manager_resolution` `{"success":true}`; blob SHA `afcdc600efda…` sepadan; L3c **7/7** fungsi + argumen tepat; semua 7 `SECURITY DEFINER` + `search_path=public`; K6 **12 baris verbatim** (8 SEPADAN + 3 `Fuzy*` NULL + `Ow Zi Qi` NULL — pra-seed betul); K8 `[]`; counts kekal `44/1124/6/12/14/20`, **audit 44 → 44**; `am_backfill_account_manager()` tidak dipanggil; larangan 1–14 ✅. **L3v: live = PostgreSQL 17.6, `kekangan_not_null_bernama = 0` — DP-14.1 kini TERBUKTI oleh ukuran, bukan kesimpulan.** Kedua-dua pembetulan DP-15 disahkan berkesan oleh laporan ini sendiri: K6 kini betul (tiada `Abu said` digugurkan, tiada `Afiq / Ahmad Nizar` direka) dan **K1 kini 🟢** bukan 🟠 kekal. 🔴 **DP-17.2: ChatGPT mendedahkan pemasangan L3 "semantically equivalent tetapi bukan byte-for-byte" — DP-13.2 BERULANG.** Kata putus: sahkan melalui KELAKUAN. **`docs/PROMPT-8A3-L3-REKONSILIASI.md` MESTI dikongsi dan selesai SEBELUM L4**, kerana L4 akan menulis alias DP-8/DP-9 + baris audit menggunakan fungsi yang badannya belum disahkan. 6 probe S1–S6 read-only, **tanpa** manipulasi `request.jwt.claims` (ujian kuasa positif = kerja seed L4). S5 memanggil fungsi tulis tetapi **direka selamat walaupun pengawal kuasa hilang** (UUID tidak wujud → 3 lapisan penolakan: pengawal → kewujudan profil → FK). 🔴 **DP-17.3:** probe `L3x` asal membuat **kesilapan kategori** — `can_resolve_account_managers()` mengambil sifar argumen dan menilai identiti PEMANGGIL, bukan baris yang disenaraikan, jadi jangkaan `= true` mustahil dalam `execute_sql`. ChatGPT betul; prompt Arena salah. Dipisah kepada `L3x_inventori` + `L3x_sesi`. 🟠 **DP-17.4 menjawab soalan keselamatan ChatGPT dengan ukuran:** 6 kawalan SAH (`search_path` dipin, `anon=false`, pengawal dalaman, pendedahan minimum §2.8 `TABLE(id uuid, full_name text)`, deny-by-default 0 baris, `LAST_SUPER_ADMIN`) — **dan DUA jurang sebenar dijumpai**: (a) `current_user_role()` tidak menapis `is_active`, jadi akaun blocked berperanan `admin`/`finance` masih `can_resolve = true` (dimitigasi oleh pemadaman `auth.refresh_tokens`; jendela = JWT sedia terbit); (b) `am_backfill_account_manager()` **tiada gate 8C dalam SQL** dan tiada penapis DP-14.2 — gate itu selama ini **prosedur sahaja**. Kedua-duanya **DITANGGUH ke migration aditif 8C** (HARD GATE), bukan diedit pada fail yang sudah dipasang. 🔴 **DP-17.5: pepijat FIXTURE Arena dijumpai** — trigger `on_auth_user_created` mencipta profil sebagai `viewer`/tidak aktif dan `ON CONFLICT DO UPDATE SET full_name` hanya mengemas kini nama, jadi **semua 20 profil** fixture salah atribut. Pengawal kiraan (=20) **lulus** walaupun begitu. **L1-R DISAHKAN tidak terjejas secara empirikal** (`resolve_account_manager()` tidak menapis `is_active`; output penjana L1-R **byte-identik** selepas pembetulan). Fixture kini dikongsi di `scripts/lib/fixture-live.mjs` dengan pengawal **atribut** (19 aktif, 1 super_admin, peranan diukur dari L3x). **Sejarah (DP-12):** **Langkah 2 DIPASANG & DITERIMA** — migration `8a3_l2_external_account_managers` `{"success":true}`; blob SHA `1e555af8f784…` sepadan; L2b RLS aktif, L2c **3/3** fungsi (+ argumen tepat), L2d **4/4** polisi, L2e **2/2** indeks; `public_tables = 20`; data perniagaan kekal `44/1124/6/12/14/20` dengan **audit_logs +0**; `external_account_managers = 0` (L4 belum); `am_backfill_account_manager()` tidak dipanggil; larangan 1–14 semua ✅. **Dua kecacatan PROMPT Arena ditemui oleh laporan itu (DP-15):** (a) FORMAT menuntut "K6, kesemua 12 baris" tetapi 12 nilai itu hanya disuntik ke L4 — jadi ChatGPT membina semula senarai dan tersilap (`Abu said` digugurkan, `Afiq / Ahmad Nizar` direka); blok K6 kini diekstrak dari induk dan disuntik ke L2/L3 **dengan nota pra-seed**, dan L1 dikecualikan kerana `is_external_account_manager()` belum wujud pada L1; (b) K1 ditanda 🟠 untuk SHA-256 yang **DP-11 sudah jadikan PILIHAN** — FORMAT kini menyatakan blob SHA + baris pertama/terakhir sepadan ⇒ **K1 = 🟢**. **DP-16.3:** probe versi PostgreSQL live (`L3v`/`L4v`, read-only) ditambah ke L3/L4 untuk menutup kebutaan versi yang menyebabkan DP-14.1. Prompt L1/L2 yang sudah dilaksanakan **kekal tidak berubah saiz** (29,077 / 28,584 bait). **Sejarah (DP-12):** ChatGPT melaporkan **Lapis 1 LULUS** (connector memberi blob SHA tepat, keempat-empat sepadan) tetapi **pemasangan tetap tidak berlaku**: connector **memotong kandungan fail panjang**, jadi tiada byte-stream penuh untuk dihantar ke `Supabase.apply_migration` yang hanya menerima teks SQL. ChatGPT **betul** menolak bina semula daripada potongan. **Penyelesaian: SQL penuh dibenamkan dalam prompt**, dijana oleh `scripts/generate-8a3-install-prompts.mjs` (deterministik — sifar transkripsi tangan/model). Setiap prompt berdiri sendiri: konteks, keputusan J0 (jangan ulang), jadual cap jari, SQL penuh, arahan `apply_migration`, larangan, format laporan. **L4 membawa K1–K12 penuh.** Saiz 24–32 KB setiap satu (ChatGPT terbukti boleh baca 26–55 KB). **Fail SQL TIDAK diubah** — blob SHA Lapis 1 yang sudah LULUS kekal sah. Penjana adalah **deterministik** (cop commit dibuang — ia sentiasa lapuk satu commit dan menyebabkan diff palsu; kandungan sudah dipin oleh blob SHA yang content-addressed). Kongsi **satu demi satu**, tunggu laporan setiap langkah | ~~`docs/PROMPT-8A3-L1-CLIENT-MASTER.md`~~ ✅ → ~~`docs/PROMPT-8A3-L2-EXTERNAL-ACCOUNT-MANAGERS.md`~~ ✅ → ~~`docs/PROMPT-8A3-L3-ACCOUNT-MANAGER-RESOLUTION.md`~~ ✅ → ~~`docs/PROMPT-8A3-L3-REKONSILIASI.md`~~ ✅ 5/6 (S2 🔴) → ~~`docs/PROMPT-8A3-L4-SEED-ALIASES.md`~~ ✅ **DIPASANG** → **8C: prompt belum dikeluarkan** (HARD GATE; skop = `REVOKE … FROM anon` + DP-14.2 + DP-17.4(a)(b) + idempotensi audit seed) | **`-L3-ACCOUNT-MANAGER-RESOLUTION.md`** → **`-L4-SEED-ALIASES.md`** |
| 🔴 **DP-11 — GATE INTEGRITI DIGANTI (blocker ChatGPT diselesaikan):** ChatGPT melaporkan ia **tidak dapat mengira SHA-256** (connector hanya memberi *blob SHA Git*; runtime tiada DNS keluar) dan enggan menganggap SHA dalam prompt sebagai bukti — jadi gate Arena **tidak boleh dilulusi secara struktur**. Itu kecacatan reka bentuk prompt, bukan kegagalan ChatGPT. **Penyelesaian: ChatGPT SUDAH mempunyai nilai yang diperlukan.** Arena membuktikan `Git blob SHA = SHA-1('blob <bait>\0' + kandungan)` dan ia sepadan tepat tiga cara (`git hash-object` ↔ `gh api .sha` ↔ Python) serta terikat commit melalui `git ls-tree`. Gate baharu = **dua lapis**: L1 bandingkan blob SHA (perbandingan, bukan pengiraan) + L2 cap jari struktur (bait/baris/aksara/kiraan CREATE/baris terakhir — bebas daripada medan `.sha`). **SHA-256 kini PILIHAN, bukan blocker.** Fail SQL **tidak diubah** (tiada sentinel) supaya yang diluluskan pengguna kekal byte-for-byte | **DP-11 dalam `docs/PANEL-PAKAR-TPMS.md`** |
| ⚠️ **DIGANTIKAN oleh 4 PROMPT LANGKAH (DP-12) — jangan kongsi lagi:** PROMPT SAMBUNGAN 8A-3: ChatGPT sudah menjalankan **J0 = BERSIH** (20 profil; J0b `[]`; J0c `[]`; `Fuziah` unik; baseline `44/1124/6/12/14/20`) tetapi **berhenti sebelum Langkah 1** kerana setiap URL dalam prompt memberi `404` — Arena menulis nama repo dengan HYPHEN (`SaidRazak881/masb-pms-v4`) sedangkan remote sebenar `SaidRazak881/masb_pms_v4` (UNDERSCORE). **DP-10.11.** Prompt sambungan ini: membetulkan semua URL, merakamkan keputusan J0 supaya **tidak diulang**, menyenaraikan **gate dua lapis DP-11** (blob SHA Git + cap jari struktur; SHA-256 kini pilihan) yang **disahkan sepadan origin↔lokal**, menerangkan blok identiti seed + amaran `42501`, dan melaraskan K8/K10 kepada fakta live (**K8 = 0 baris = LULUS**, `audit_logs > 44` = LULUS). Diuji **31/31** | **`docs/PROMPT-8A3-SAMBUNGAN.md`** |
| 🔴 **PROMPT SEDIA DIKONGSI — HARD GATE DILULUSKAN PENGGUNA (2026-09-04):** **Pemasangan 8A-3 di live** — J0 read-only DAHULU (5 query: 20 nama profil sebenar + nama ternormal + semakan perlanggaran + keunikan `Fuziah` + baseline), kemudian **4 langkah pasang** dalam urutan `client-master.sql` → `external-account-managers.sql` → `account-manager-resolution.sql` → `seed-account-manager-aliases.sql`. **12 kriteria K1–K12**, 14 larangan, format laporan 6 seksyen. SHA-256 penuh keempat-empat fail dicetak dalam prompt. Langkah 5 (`fix-import-staging-updated-at.sql`) = **PILIHAN/SKIP** — DP-7 sudah ditutup di live (10.2). Setiap query J0 + K1–K12 dilaksanakan sebenar dalam PGlite oleh `scripts/test-prompt-8a3-install.mjs` (**103/103**). ⚠️ **J0 sudah dijalankan oleh ChatGPT (bersih)** — guna `PROMPT-8A3-SAMBUNGAN.md` untuk meneruskan, jangan kongsi semula fail ini untuk mengulang J0 | **`docs/PROMPT-8A3-INSTALL.md`** |
| ✅ **SELESAI (2026-09-04) — ChatGPT sudah melaporkannya:** `docs/PROMPT-8A-J1-READONLY.md` — 10 query J1a–J1j mengumpul keadaan live. **Keputusan mengubah rancangan:** `import_staging.updated_at` **WUJUD** di live (DP-7 ditutup, 10.2); **SIFAR** nilai `Account Manager` di live (10.3); `user_profiles` = **20** baris bukan 18 (10.4); J1j memberi **positif palsu** kerana kecacatan query Arena — kini dibaiki dengan `to_regclass()` (10.5). Diuji oleh `scripts/test-prompt-8a-j1-queries.mjs` (**69/69**) |
| 🟢 **DP-7 DITUTUP DI LIVE (2026-09-04, laporan J1i/J1j):** `import_staging.updated_at` **WUJUD** di live (`timestamptz`, `NOT NULL`, default `now()`) — live sihat, ini drift **live→repo**, bukan kecacatan pengeluaran. Pembaikan punca akar dalam repo (`schema-import-staging.sql` + `updated-at-triggers.sql`) **kekal sah dan perlu**. `lib/supabase/fix-import-staging-updated-at.sql` **tidak diperlukan di live** — ditandakan PILIHAN/SKIP dalam PROMPT-8A3 |
| ✅ **DP-9 DIPUTUSKAN (2026-09-04):** `Ow Zi Qi` = **orang luar**, kekal NULL tetapi direkodkan sebagai SUDAH diputuskan. Baharu: `lib/supabase/external-account-managers.sql` (jadual + RLS + 3 fungsi) dan kategori `LUAR` dalam `am_unresolved_values()` — membezakan "sudah diputuskan: orang luar" daripada "belum diputuskan". **Kini semua 12 nilai ada keputusan manusia: 11 SELESAI + 1 LUAR, sifar baki senyap.** Allowlist W1 16→17. Ujian **145/145** |
| ✅ **Fasa 8A-2 SQL SIAP, PROMPT = PROMPT-8A3-INSTALL:** `lib/supabase/account-manager-resolution.sql` (7 fungsi) + `lib/supabase/seed-account-manager-aliases.sql` (284 baris) merekodkan keputusan DP-8/DP-9 sebagai data. **Seed kini mengandungi blok identiti** (10.9) — menetapkan `request.jwt.claims` kepada Super Admin kerana SQL Editor berjalan tanpa JWT (`auth.uid()` NULL → `42501`), dan **memulihkan** identiti asal pemanggil di hujung (10.8b). Ujian `scripts/test-account-manager-resolution.mjs` (**145/145**) |
| ⚠️ **DIGANTIKAN oleh PROMPT-8A3-INSTALL (2026-09-04):** `docs/PROMPT-8A-CLIENT-MASTER.md` kekal sebagai rujukan reka bentuk 8A (6 lajur induk pelanggan, jadual `account_manager_aliases`, `normalize_person_name`, `resolve_account_manager`) tetapi **jangan kongsi lagi** — PROMPT-8A3 menggabungkan keempat-empat fail + J0 pra-penerbangan + K1–K12 dalam satu aliran. SHA-256 `client-master.sql` = `d394398dc075…` (ref projek dibetulkan kepada 20 aksara, 10.1) |
| 🛡️ **PENJAGA RUJUKAN DOKUMEN (baharu, lahir daripada DP-10.11):** `scripts/test-doc-references.mjs` (**121/121**) membaca setiap pengecam daripada **sumber autoritatif** — nama repo ← `git remote get-url origin`, branch ← `git ls-remote --heads origin`, laluan fail ← `fs.existsSync`, ref Supabase ← mesti 20 aksara, **SHA-256 dalam prompt ← mesti sepadan fail semasa**. Mengimbas 45 fail markdown. **Seksyen [6] mengesahkan setiap nilai gate DP-11 yang DITERBITKAN dalam prompt (blob SHA, bait, baris, aksara, kiraan CREATE) terhadap fail sebenar** — termasuk membuktikan definisi `SHA1('blob <bait>\0'+kandungan)` == `git hash-object`. **Seksyen [7] mengekstrak SQL inline daripada 4 prompt langkah dan menegaskan ia BYTE-IDENTIK dengan fail sebenar** (perbandingan bait langsung + blob SHA + SHA-256), menutup rantai integriti DP-12.4(6). Kawalan negatif mengesahkan ia menangkap nama repo salah, laluan tidak wujud, ref bukan-20-aksara, blob SHA lapuk, kiraan bait lapuk, **satu ruang tambahan dalam SQL inline, newline terakhir yang hilang, dan suntingan tangan senyap pada prompt yang sudah dijana (seksyen [8] menjalankan penjana dengan `--check`, yang membina dokumen dalam ingatan tanpa menulis)** | **`scripts/test-doc-references.mjs`** |
| 🧑‍⚖️ **PANEL PAKAR TPMS** — 9 pakar (Pengerusi, SQL Architect, Domain Architect, Kewangan/Cukai, ETL/Excel, Frontend, QA, Keselamatan, BA) + protokol deliberasi + §4 kekangan tidak boleh ubah. Rekod keputusan: **DP-1** (roadmap 8A–8H), **DP-2** (reka bentuk induk pelanggan), **DP-2a** (peraturan token pertama), **DP-3** (penomboran semula 7A–7H→8A–8H), **DP-4** (allowlist W1 15→16), **DP-5** (fungsi `STABLE` + snapshot kenyataan), **DP-6** (drift enum `app_role`: live 8 nilai, repo 7), **DP-7** (🔴 kecacatan pengeluaran `import_staging.updated_at`), **DP-8** (✅ DIPUTUSKAN: `Fuzy`, `Fuzy / Dila`, `Fuzy / Sholihin` → Fuziah), **DP-9** (✅ DIPUTUSKAN: `Ow Zi Qi` orang luar → kategori `LUAR`), **DP-10** (🔴 keputusan J1 live: ref projek typo, DP-7 ditutup, sifar nilai AM, `user_profiles`=20, positif palsu J1j, baseline live, **+2 kecacatan PROMPT-8A3 ditemui oleh ujian: penghampiran J0 tidak buang gelaran & `set_config('' )` memecahkan `::jsonb`**, blok identiti seed), **DP-10.11** (🔴 nama repo GitHub HYPHEN vs UNDERSCORE — 14 kemunculan dalam 3 prompt, ChatGPT dapat `404` pada semua fail dan berhenti sebelum Langkah 1; lahirkan penjaga `test-doc-references.mjs`), **DP-10.12** (✅ J0 live bersih — `Dr. Afiq`→`afiq` & `Dr. Ahmad Nizar`→`ahmad` membuktikan pembetulan 10.8(a) berkesan; misteri `user_profiles=20` terselesaikan: `Admin` + `test`), **DP-11** (🔴 gate SHA-256 tidak boleh dilulusi ChatGPT → diganti gate dua lapis blob SHA Git + cap jari struktur; SHA-256 jadi pilihan; fail SQL tidak diubah; 4 pengajaran baharu 13–16; bantahan Keselamatan direkodkan: pengesahan integriti ≠ kelulusan kandungan) | **`docs/PANEL-PAKAR-TPMS.md`** (1333 baris) |
| 📋 **Analisis jurang** — 4 domain perniagaan tiada (quotation, pipeline/funnel, P&L/aging, tugasan) + kecacatan pemetaan. 4 keputusan pengguna direkodkan | `docs/GAP-ANALYSIS-FUNGSI-BELUM-ADA.md` |
| **PROMPT AKTIF: E1–E9 kriteria tepat** — Production Branch DISAHKAN bertukar (commit `ac05871` == hujung branch). `/admin/users` 200 + kandungan `/login` ialah **LULUS** (redirect diikuti) | **`docs/PROMPT-6H-E1-E9-PRECISE-CRITERIA.md`** |
| Senarai semak ujian manual (log masuk, pendaftaran, kelulusan, sekatan, reset, regresi) | **`docs/ACTION-6-UAT-AUTH-USERS.md`** |
| Urutan pemasangan SQL penuh (10 fail) | `docs/SETUP-SUPABASE.md` |
| Konteks struktur sistem untuk GPT | `docs/CODEBASE-MAP.md` (Bahagian 8) |

**Branch semasa: `arena/01a06274-masb-pms-v4`.**
Branch Fasa 5 (`arena/01a05cd4-...`) dan semua hash komit lama yang disebut
dalam prompt di bawah **tidak lagi sah** (sejarah git ditulis semula).

> ⛔ `docs/PROMPT-5-RESET-PASSWORDS.md` dan `docs/ACTION-5-UAT-MFA.md`
> **TIDAK lagi digunakan** — kedua-duanya digantikan oleh Fasa 6.

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
>    `SaidRazak881/masb_pms_v4` (folder `lib/supabase/`) — urutan rasmi
>    terkini ada 10 fail, lihat `docs/SETUP-SUPABASE.md`:
>    - `schema-master.sql`
>    - `schema-import-staging.sql`
>    - `sync-import-transaction.sql`
>    - `governance-lock.sql`
>    - `change-requests.sql`
>    - `fix-rls-recursion.sql`          ← ditambah selepas prompt ini ditulis
>    - `fix-add-programme-categories.sql`
>    - `user-management.sql`            ← Fasa 6 (pengesahan & pengguna)
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
