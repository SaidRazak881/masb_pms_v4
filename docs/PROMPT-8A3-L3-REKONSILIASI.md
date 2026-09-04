# PROMPT 8A-3 / L3-R — Rekonsiliasi Langkah 3 (read-only)

> **Untuk:** ChatGPT (mempunyai akses penuh Supabase + Vercel + GitHub)
> **Projek Supabase:** `lmenmfsbjgxfhnykkgow`
> **Repo:** `SaidRazak881/masb_pms_v4` · **Branch:** `arena/01a06274-masb-pms-v4`
> **Keadaan:** Langkah 1 ✅ dipasang + direkonsiliasi (DP-14) · Langkah 2 ✅ dipasang (DP-15) · **Langkah 3 ✅ dipasang, rekonsiliasi INI** · Langkah 4 ⏳ belum
> **Sifat:** **READ-ONLY sepenuhnya.** Tiada DDL, tiada DML, tiada `service_role`, tiada kelulusan pengguna diperlukan.

---

## 0. Mengapa prompt ini wujud

Anda mendedahkan dengan jujur dalam laporan Langkah 3:

> "aku menghantar **implementation SQL yang semantically equivalent tetapi bukan
> byte-for-byte keseluruhan 539-line file**. Jadi aku **tidak akan claim bahawa
> migration ini ialah exact byte-for-byte execution daripada fail asal**."

**Terima kasih — itu pendedahan yang betul, dan kami tidak akan menandakan
"exact file execution" sebagai terbukti.** Ini pengulangan keadaan Langkah 1
(DP-13.2), dan kata putusnya sama: **apabila input tidak boleh dipercayai
byte-for-byte, sahkan melalui KELAKUAN, bukan teks.**

Perbandingan teks terhadap `pg_get_functiondef` **tidak boleh dipakai** kerana
komen dokumentasi di dalam blok `$$` menjadikan ia tidak stabil — ia akan
menghasilkan positif palsu dan mendorong "pembaikan" kepada production yang
tidak rosak.

### Apa yang SUDAH anda sahkan (JANGAN ulang)

Laporan L3 anda sudah membuktikan, dan kami terima:

| Sudah disahkan | Bukti anda |
|---|---|
| 7 fungsi wujud, nama + argumen tepat | L3c verbatim, 7/7 |
| Semua 7 `SECURITY DEFINER` + `search_path = public` | L3x definisi |
| K6: 12 nilai berkelakuan betul pra-seed | 12 baris verbatim |
| K8 = 0 baris; `am_backfill_account_manager()` tidak dipanggil | `[]` |
| Data perniagaan tidak berubah; `audit_logs` 44 → 44 | counts verbatim |
| **Live = PostgreSQL 17.6** | L3v verbatim |

### Apa yang BELUM disahkan — dan diuji di sini

Laporan L3 tidak menyentuh **badan** tujuh fungsi itu. Yang belum disahkan:

1. **Pendedahan minimum** `am_list_staff()` — veto Keselamatan §2.8
2. **Pengawal kuasa** dalam setiap fungsi yang boleh menulis
3. **Postur GRANT/REVOKE** — `authenticated` vs `anon`
4. **Deny-by-default** — tiada kebocoran apabila tiada identiti
5. **Cubaan tulis tanpa kuasa** mesti ditolak **dan tidak menulis apa-apa**

> 🔴 **Ini mesti selesai SEBELUM Langkah 4.** L4 (seed) akan memanggil
> `am_confirm_alias()` dan `am_confirm_external()` untuk **benar-benar menulis**
> alias DP-8 dan klasifikasi luar DP-9, serta baris `audit_logs`. Jika badan
> fungsi itu berbeza daripada yang diluluskan, L4 akan menulis data yang salah
> dan jejak audit yang salah. **Mengesahkan badan fungsi sebelum menulis ialah
> urutan yang betul; selepas menulis ialah pembersihan.**

---

## 1. Peraturan

1. **READ-ONLY sepenuhnya.** Semua query di bawah ialah `SELECT`, kecuali **S5**
   yang **dijangka GAGAL** dengan ralat `42501`. Tiada `INSERT`, `UPDATE`,
   `DELETE`, `DDL`, `GRANT` atau `REVOKE`.
2. **JANGAN** tetapkan `request.jwt.claims` dan **JANGAN** cuba mendapatkan
   identiti pengguna. Probe ini **sengaja** menguji sisi *deny-by-default*.
   Ujian kuasa positif (admin → `true`, alias ditulis) dilakukan oleh **seed
   Langkah 4**, yang sudah menetapkan claims kepada Super Admin dan menaikkan
   ralat diagnostik jika `can_resolve_account_managers()` masih `false`.
3. **JANGAN** jalankan Langkah 4 sehingga rekonsiliasi ini disemak.
4. **JANGAN** panggil `am_backfill_account_manager()`. Gate itu 8C.
5. **JANGAN** "memperbaiki" apa-apa di live. Jika sesuatu probe tidak sepadan,
   **BERHENTI** dan laporkan. Menentukan sama ada ia kecacatan atau artifak
   ialah kerja Arena — dan dalam dua rekonsiliasi lepas, **kedua-dua** perbezaan
   yang dibendera ternyata artifak pada sisi Arena (DP-14.1 versi PostgreSQL,
   DP-14.2 fixture tidak lengkap), **bukan** kecacatan live.
6. **JANGAN reka bukti.** Jika sesuatu tidak dapat dikira atau dipanggil,
   laporkan `⏳` dengan sebabnya. Anda sudah melakukannya dengan betul dalam
   L2 dan L3 — teruskan.

### Tentang cap jari `⏳` (DP-11, dijelaskan semula dalam DP-15.3)

Gate integriti ialah **Lapis 1 (Git blob SHA) + Lapis 2 (cap jari struktur)**.
**SHA-256 ialah PILIHAN** kerana runtime anda terbukti tiada byte-stream fail
tempatan. Anda sudah melaporkan blob SHA `afcdc600efda…` **sepadan** — itu
memadai. **Tiada** tindakan lanjut diperlukan mengenai `⏳` tersebut.

---

## 2. PROBE

### S1 — Pendedahan MINIMUM — lajur hasil 7 fungsi (veto §2.8) 🔴 MESTI SEPADAN

🔴 **Yang paling penting di sini ialah `am_list_staff`.** Veto Keselamatan §2.8
mengkehendaki pemilih staf mendedahkan **HANYA** `id` dan `full_name` —
**bukan** `role`, `account_status`, `email`, `designation` atau `department`,
kerana pautan antara data kewangan dan identiti staf tidak boleh membocorkan
peranan staf kepada pengguna yang hanya boleh melihat invois.

Jangkaan tepat bagi `am_list_staff`: `TABLE(id uuid, full_name text)`.
Jika live memulangkan lajur tambahan, itu **pelanggaran §2.8** → 🔴 BERHENTI.

Probe ini membaca **katalog**, jadi ia tidak memerlukan kuasa untuk memanggil
fungsi itu — dan ia tidak bergantung pada komen di dalam badan fungsi,
jadi ia stabil walaupun SQL yang dipasang bukan byte-for-byte (DP-13.2).

```sql
SELECT p.proname AS fungsi,
       pg_get_function_result(p.oid) AS hasil
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('am_backfill_account_manager','am_backfill_preview','am_confirm_alias',
       'am_list_staff','am_revoke_alias','am_unresolved_values',
       'can_resolve_account_managers')
 ORDER BY p.proname;
```

**Jangkaan (dikira dalam PGlite daripada fail SQL yang diluluskan):**

| fungsi | hasil |
|---|---|
| am_backfill_account_manager | TABLE(jadual text, baris_diisi bigint, baris_kekal_null bigint) |
| am_backfill_preview | TABLE(jadual text, jumlah_baris bigint, ada_nilai_mentah bigint, akan_diisi bigint, kekal_null bigint, sudah_dipautkan bigint) |
| am_confirm_alias | TABLE(raw_text text, user_id uuid, full_name text, tindakan text) |
| am_list_staff | TABLE(id uuid, full_name text) |
| am_revoke_alias | TABLE(raw_text text, former_user_id uuid, tindakan text) |
| am_unresolved_values | TABLE(raw_text text, jumlah_baris bigint, dari_invoices bigint, dari_staging bigint, resolved_id uuid, resolved_name text, kategori text, alias_wujud boolean) |
| can_resolve_account_managers | boolean |

---

### S2 — Postur GRANT — `authenticated` boleh, `anon` tidak 🔴 MESTI SEPADAN

Ketujuh-tujuh fungsi mesti `authenticated = true` dan **`anon = false`**.
Ini mengesahkan pasangan `REVOKE ALL ... FROM PUBLIC` + `GRANT EXECUTE ... TO
authenticated` benar-benar terpakai, bukan sekadar hadir dalam teks SQL.

Jika mana-mana satu memberi `anon = true`, fungsi itu boleh dipanggil oleh
pelawat tanpa log masuk → 🔴 BERHENTI dan laporkan.

```sql
SELECT p.proname AS fungsi,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated,
       has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('am_backfill_account_manager','am_backfill_preview','am_confirm_alias',
       'am_list_staff','am_revoke_alias','am_unresolved_values',
       'can_resolve_account_managers')
 ORDER BY p.proname;
```

**Jangkaan (dikira dalam PGlite daripada fail SQL yang diluluskan):**

| fungsi | authenticated | anon |
|---|---|---|
| am_backfill_account_manager | true | false |
| am_backfill_preview | true | false |
| am_confirm_alias | true | false |
| am_list_staff | true | false |
| am_revoke_alias | true | false |
| am_unresolved_values | true | false |
| can_resolve_account_managers | true | false |

---

### S3 — Pengawal kuasa dalam 4 fungsi yang boleh menulis / mendedahkan 🟠 MAKLUMAN

🟠 **MAKLUMAN — sokongan, bukan bukti utama.** DP-13.2 menetapkan bahawa
perbandingan TEKS penuh `pg_get_functiondef` tidak boleh dipakai (komen di
dalam `$$` menjadikannya tidak stabil). Probe ini **tidak** membandingkan
teks penuh — ia hanya menguji **kehadiran** rentetan pengawal, yang stabil.

Jangkaan: `ada_pengawal = true` bagi **keempat-empat** fungsi.
`ada_errcode = true` bagi `am_confirm_alias`, `am_revoke_alias` dan
`am_backfill_account_manager` — tetapi **`false` bagi `am_backfill_preview`**,
kerana preview yang tanpa kuasa **memulangkan kosong** (`RETURN;`) dan bukan
menaikkan ralat. Itu sengaja: fungsi baca tidak patut mendedahkan sama ada
pemanggilnya berkuasa.

**Bukti utama ialah S5 dan S6** (kelakuan sebenar), bukan probe ini.

```sql
SELECT p.proname AS fungsi,
       (pg_get_functiondef(p.oid) LIKE '%can_resolve_account_managers%') AS ada_pengawal,
       (pg_get_functiondef(p.oid) LIKE '%42501%')                        AS ada_errcode
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('am_confirm_alias','am_revoke_alias',
                     'am_backfill_preview','am_backfill_account_manager')
 ORDER BY p.proname;
```

**Jangkaan (dikira dalam PGlite daripada fail SQL yang diluluskan):**

| fungsi | ada_pengawal | ada_errcode |
|---|---|---|
| am_backfill_account_manager | true | true |
| am_backfill_preview | true | false |
| am_confirm_alias | true | true |
| am_revoke_alias | true | true |

---

### S4 — Deny-by-default — tiga fungsi baca tanpa identiti 🔴 MESTI SEPADAN

🔴 **Ini kawalan keselamatan yang paling penting dalam rekonsiliasi ini.**
Jalankan probe ini **TANPA** menetapkan `request.jwt.claims` — iaitu dalam
konteks `Supabase.execute_sql` biasa, yang memang tiada identiti pengguna.

Dalam konteks itu `auth.uid()` ialah NULL, jadi `current_user_role()`
memulangkan `viewer` dan `can_resolve_account_managers()` memulangkan
`false`. Ketiga-tiga fungsi mesti memulangkan **0 baris**.

> 🟢 **Sudah diperhatikan dalam laporan L3.** Probe `L3x` anda memulangkan
> `boleh_selesai = false` bagi **semua** profil — termasuk `Admin`
> (super_admin), `Zalina Sayuti` (admin), `Adilah` dan `Farrah` (finance),
> `Dr. Ahmad Nizar` (head_governance). Anda mentafsirnya dengan **betul**:
> ia bukan bukti bahawa kebenaran rosak, kerana tiada sesi pengguna.
> Sebaliknya ia **bukti bahawa fungsi ini tidak membocorkan kuasa kepada
> konteks tanpa identiti** — iaitu kelakuan yang kita mahukan.
> Arahan asal prompt L3 (jangkaan `= true`) yang **salah**, dan ia telah
> dibaiki; lihat DP-17.3.

Jika mana-mana fungsi memulangkan **lebih daripada 0 baris** tanpa identiti,
itu kebocoran → 🔴 BERHENTI.

🟠 **Jika anda mendapat "permission denied for function ..."** — itu
bermakna peranan `execute_sql` anda bukan `postgres`/pemilik dan tidak
mempunyai GRANT. Laporkan mesej itu **verbatim** sebagai `⏳ tidak dapat
dipanggil dalam peranan ini`. **JANGAN** simpulkan bahawa fungsi itu rosak,
dan **JANGAN** cuba `GRANT` apa-apa.

```sql
SELECT 'am_list_staff' AS fungsi, count(*) AS baris
  FROM public.am_list_staff()
UNION ALL
SELECT 'am_unresolved_values', count(*) FROM public.am_unresolved_values()
UNION ALL
SELECT 'am_backfill_preview',  count(*) FROM public.am_backfill_preview()
 ORDER BY fungsi;
```

**Jangkaan (dikira dalam PGlite daripada fail SQL yang diluluskan):**

| fungsi | baris |
|---|---|
| am_backfill_preview | 0 |
| am_list_staff | 0 |
| am_unresolved_values | 0 |

---

### S5 — Cubaan tulis TANPA kuasa mesti ditolak (42501) 🔴 MESTI SEPADAN

🔴 **Jangkaan: query ini MESTI GAGAL dengan ralat `42501`.** Kegagalan itu
ialah **kejayaan** probe ini. Mesej yang dijangka:

```text
tiada kuasa: pengesahan alias memerlukan peranan admin, head_governance atau finance
```

**Reka bentuk probe ini sengaja selamat walaupun pengawal kuasa itu HILANG.**
UUID `99999999-…` **tidak wujud** dalam `user_profiles`, jadi:
1. Jika pengawal kuasa ada → ia naik **dahulu**, sebelum sebarang tulis.
2. Jika pengawal kuasa hilang → pemeriksaan kewujudan profil naik seterusnya.
3. Jika kedua-duanya hilang → kekangan kekunci asing
   `account_manager_aliases_user_id_fkey` menolak baris itu.

Jadi **tiada keadaan** di mana probe ini boleh menulis baris. Lapisan ketiga
itu penting kerana inilah satu-satunya probe yang memanggil fungsi tulis.

🟠 Jalankan probe ini sebagai **panggilan berasingan**, kerana ralat mungkin
membatalkan keseluruhan kelompok jika ia dihantar bersama query lain.
Laporkan mesej ralat **verbatim**.

```sql
SELECT * FROM public.am_confirm_alias(
         'Probe Rekonsiliasi Tanpa Kuasa',
         '99999999-9999-4999-8999-999999999999'::uuid);
```

**Jangkaan (dikira dalam PGlite daripada fail SQL yang diluluskan):**

🔴 **Jangkaan: query ini GAGAL.** Mesej ralat yang dikira:

```text
tiada kuasa: pengesahan alias memerlukan peranan admin, head_governance atau finance
```

---

### S6 — Tiada kesan sampingan — kiraan mesti kekal sifar 🔴 MESTI SEPADAN

Jalankan **SELEPAS** S5. Jangkaan: `alias = 0`, `external = 0` (kerana L4
belum dijalankan), dan `audit = 44` — **tidak berubah** daripada baseline.

Ini menutup gelung S5: ia membuktikan bahawa cubaan tulis yang ditolak itu
**benar-benar tidak menulis apa-apa**, termasuk baris audit. Jika `audit`
bertambah, fungsi itu menulis sebelum pengawal kuasa naik → 🔴.

```sql
SELECT (SELECT count(*) FROM public.account_manager_aliases)   AS alias,
       (SELECT count(*) FROM public.external_account_managers) AS external,
       (SELECT count(*) FROM public.audit_logs)               AS audit;
```

**Jangkaan (dikira dalam PGlite daripada fail SQL yang diluluskan):**

| alias | external | audit |
|---|---|---|
| 0 | 0 | 0 |

---

## 3. FORMAT LAPORAN

**Seksyen 1 — Status:** project ref, migration L3, dan pengesahan bahawa probe
ini read-only (tiada DDL/DML/`service_role`, tiada `set_config`).

**Seksyen 2 — Keputusan probe (jadual):**
`Probe | Ketat? | Jangkaan PGlite | Dapat di live | Status 🟢/🟠/🔴`.
Tampal output **verbatim** bagi setiap probe. Bagi **S5**, tampal **mesej ralat
penuh** — ralat itu ialah keputusan yang diharapkan, jadi jangan ringkaskannya.

**Seksyen 3 — Perbezaan:** bagi setiap 🟠/🔴, nyatakan (a) nilai jangkaan,
(b) nilai live, (c) sama ada ia kelihatan seperti **kecacatan** atau **artifak
platform/versi**, dan (d) **apa yang anda TIDAK ubah**.

**Seksyen 4 — Soalan keselamatan yang anda bangkitkan, dijawab.** Dalam laporan
L3 anda menulis:

> "`SECURITY DEFINER` dalam `public` mempunyai implikasi keselamatan yang
> perlu dinilai terhadap model auth sebenar."

Sahkan sama ada S1–S6 menjawab kebimbangan itu, atau nyatakan apa yang masih
terbuka. **Jangan ubah apa-apa** — jawapan Arena direkodkan dalam DP-17.4.

**Seksyen 5 — Keputusan akhir:** nyatakan sama ada badan 7 fungsi Langkah 3
**disahkan setara** dengan SQL yang diluluskan, dan sama ada **Langkah 4 boleh
diteruskan**.

**Berhenti selepas laporan.** Jangan mula Langkah 4.

---

## Nota untuk Arena (bukan untuk ChatGPT)

* Penjana: `scripts/generate-8a3-l3-reconciliation.mjs` (deterministik).
* Fixture: `scripts/lib/fixture-live.mjs` — **dikongsi** dengan penjana L1-R
  supaya dua fixture tidak boleh drift antara satu sama lain.
* Pengawal penjana: S1 mesti 7 fungsi dengan `am_list_staff` =
  `TABLE(id uuid, full_name text)`; S2 mesti `authenticated=true`/`anon=false`;
  S4 mesti 3 baris semuanya 0; **S5 mesti gagal dengan 42501** — jika ia tidak
  gagal, penjanaan berhenti kerana pengawal kuasa telah hilang daripada SQL.
* **Fail SQL TIDAK diubah** oleh penjana ini.
