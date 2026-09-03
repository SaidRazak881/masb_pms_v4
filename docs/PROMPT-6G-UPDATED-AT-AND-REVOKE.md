# PROMPT 6G — Pasang `updated-at-triggers.sql` + REVOKE privilej tulis jadual warisan

> ## ✅ STATUS: **SELESAI — dilaksanakan 2026-09-04, SEMUA kriteria PASS**
>
> Fasa 6 telah **SELESAI dan disahkan di Production** (E1–E9 = 9/9 PASS,
> UAT A–K semua lulus). Prompt ini pada mulanya **ditangguhkan** oleh pengguna,
> kemudian **DILULUSKAN** pada tarikh yang sama. **HARD GATE sudah dibuka —
> §2 dan §3 boleh dijalankan sekarang.**
>
> ### Keputusan (laporan ChatGPT, 2026-09-04)
>
> | Kriteria | Keputusan |
> | -------- | --------- |
> | **G1** | 🟢 **12/12** trigger → `public.set_updated_at()` |
> | **G2** | 🟢 `baki_rujukan private.set_updated_at()` = **0** |
> | **G3** | 🟢 `user_profiles.updated_at` `2026-09-02 17:05:46` → `2026-09-03 17:28:54` (ROLLBACK) |
> | **H1** | ⏳ **tidak dapat direkodkan** — ChatGPT menjalankan §2 dahulu, jadi snapshot sebelum-REVOKE terlepas. **Tidak direka** (tindakan yang betul) |
> | **H3** | 🟢 **6/6** = hanya `SELECT` |
> | **I1** | 🟢 ketiga-tiga kolum wujud: `governance_lock_status` (text, NOT NULL), `is_locked` (boolean, NOT NULL), `unlock_expires_at` (timestamptz, nullable) |
> | **I2** | 🟢 **0** trigger memanggil `validate_programme_lock()` |
> | Runtime | 🟢 `No runtime errors found` (Vercel, 2 jam) |
>
> **Blob SHA yang dipasang:** `5254fd84cdaba647495e9ef60fe41b06b8348d50` —
> **tepat sama** dengan yang diuji. Kandungan SQL tidak diubah.
>
> ### ⚠️ Dua pembetulan ChatGPT terhadap prompt ini (Arena menerima kedua-duanya)
>
> **1. Larangan 3 ("JANGAN DROP apa-apa") TERLALU LUAS — kesilapan Arena.**
> Fail `updated-at-triggers.sql` **sendiri** mengandungi `DROP TRIGGER IF EXISTS`
> (diperlukan untuk mengikat semula trigger). ChatGPT enggan mendakwa "zero DROP
> statement executed" kerana itu tidak benar, dan membezakan dengan tepat: tiada
> `DROP TABLE` / `DROP FUNCTION` / `DROP POLICY` / pemadaman data — hanya
> `DROP TRIGGER` sebagai sebahagian penggantian yang diluluskan. Larangan itu
> sepatutnya berbunyi "JANGAN DROP **objek yang tidak diluluskan dalam prompt ini**".
>
> **2. Query G1 asal ROSAK — kesilapan Arena.** Ia mengelaskan skema fungsi
> daripada `information_schema.triggers.action_statement`, tetapi Postgres **hanya
> mengkualifikasikan** nama fungsi apabila ia bukan dalam `search_path` lalai. Jadi
> `public.set_updated_at()` dipaparkan sebagai `EXECUTE FUNCTION set_updated_at()`
> **tanpa skema**, dan pengelasan asal memulangkan `⚪ tidak dikualifikasi` untuk
> kesemua 12 trigger — kriteria "semua 🟢 repo" akan **GAGAL walaupun kerja
> itu betul**. ChatGPT menangkap ini dan mengesahkan identiti fungsi melalui katalog
> PostgreSQL. **G1 dalam dokumen ini sudah diganti** dengan query `pg_trigger` +
> `pg_proc` + `pg_namespace` yang sah, dan `scripts/test-updated-at-triggers.mjs`
> kini membuktikan kecacatan itu (`12/12 tanpa skema`) serta pembetulannya
> (semua `function_schema = public`). **Nota: G2 asal masih sah** — fungsi
> `private` memang dikualifikasikan dalam `action_statement`.
>
> **Keputusan pengguna yang berkaitan (2026-09-04):**
> | Perkara | Keputusan |
> | ------- | --------- |
> | PROMPT-6G (hardening SQL) | 🟢 **DILULUSKAN** (pada mulanya TANGGUH, kemudian diluluskan pada 2026-09-04) |
> | **DROP** sisa pra-repo (4 fungsi `private.*`, 3 jadual warisan, 8 polisi) | ⏸️ **KEKAL DITANGGUH** — pengguna setuju ia bukan risiko aktif. **§2 dan §3 TIDAK drop apa-apa**, jadi ia selaras dengan keputusan ini |
> | Rollout 19 pengguna | ✅ Pengguna maklumkan sendiri, tiada tindakan teknikal |
> | D1 `Confirm email` | ✅ **OFF** |
> | Akaun ujian dari UAT D4 | ✅ **SEKAT** melalui UI Super Admin |
>
> ### ⚠️ Keadaan SEMASA live (sebelum §2/§3 dijalankan) — inilah yang prompt ini betulkan
>
> **`lib/supabase/updated-at-triggers.sql` wujud dalam repo tetapi TIDAK
> dipasang di live.** Jadi:
>
> - **Di live:** 6 jadual rasmi masih ada kolum `updated_at` yang **tidak pernah
>   dikemas kini** (`app_settings`, `cost_items`, `financial_docs`, `organizers`,
>   `programme_documents`, `user_profiles`), dan 5 jadual + `profiles` masih
>   bergantung kepada `private.set_updated_at()` pra-repo.
> - **Untuk pemasangan BERSIH daripada repo:** fail ini **WAJIB** dijalankan,
>   jika tidak `updated_at` tidak berfungsi langsung. Lihat
>   `docs/SETUP-SUPABASE.md`.
> - **REVOKE pada 3 jadual warisan juga tidak dilakukan**, jadi `authenticated`
>   masih mempunyai privilej tulis penuh (`INSERT/UPDATE/DELETE/TRUNCATE/
>   REFERENCES/TRIGGER`) pada `profiles`, `programme_participants`, `user_roles`.
>   Ini **tidak exploitable** (WITH CHECK menolak INSERT bukan-admin, dan W6/Z3
>   membuktikan tiada fungsi atau polisi Fasa 6 membaca jadual ini), tetapi
>   ia permukaan yang tidak perlu dan **masih terbuka**.
>
> **Selepas §2/§3 dijalankan**, keadaan di atas akan berubah:
> - 12 jadual → `public.set_updated_at()`, **0** rujukan `private.set_updated_at()`
> - `private.set_updated_at()` menjadi **yatim** (tetapi **TIDAK** di-drop)
> - 3 jadual warisan → `authenticated`/`anon` hanya ada **SELECT**
>
> **Nota G3:** pengguna **sudah log masuk** semasa UAT, jadi `user_profiles`
> kini ada sekurang-kurangnya 1 baris. G3 akan memberi bukti yang bermakna
> (sebelum ini ia berisiko mengembalikan `NULL` dan tidak membuktikan apa-apa).
>
> **Di luar skop prompt ini (tugas pengguna melalui UI, bukan ChatGPT):**
> - **D1** `Confirm email` = **OFF** (Supabase Dashboard → Auth → Providers → Email)
> - **Sekat akaun ujian** dari UAT D4 (`/admin/users` → butang **Sekat**)

> **⛔ HARD GATE — prompt ini hanya boleh dijalankan SELEPAS pengguna memberi
> kelulusan eksplisit.** Ia mengandungi **live SQL** (DDL + REVOKE), yang
> memerlukan kelulusan berasingan mengikut perjanjian gate proyek.
>
> **Persona kamu:** Jurutera pangkalan data yang teliti dan berhati-hati
> (`docs/personas/PERSONA-SQL-ARCHITECT.md`).
>
> **Keadaan:** PROMPT-6F dijalankan. **Z1–Z5 🟢 selesai sepenuhnya** termasuk
> `prosrc` — laporan anda sangat baik. **E = 0/9** (Production masih Fasa 5).
> D1/D3/D4 belum boleh dibaca melalui operasi connector yang tersedia.
>
> **Keputusan Arena terhadap laporan Z anda:**
> 1. ✅ **Senario A anda betul, tetapi skopnya berbeza daripada yang Arena
>    takuti.** `programmes_enforce_lock` → `public.enforce_programme_lock()`
>    (fungsi repo) — **governance lock SELAMAT**. Yang masih pra-repo ialah
>    `trg_audit_programme_participants` → `private.write_audit_log()`.
> 2. 🔴 **Z4 mendedahkan kecacatan dalam REPO, bukan dalam live.** Lihat §1 —
>    ini penemuan terpenting dalam Fasa 6 setakat ini.
> 3. ✅ **Pembetulan Arena terhadap analisisnya sendiri:** Arena pada mulanya
>    menyangka `private.has_role()` membolehkan escalation melalui INSERT ke
>    `user_roles`. **Itu salah** — `WITH CHECK` yang gagal **menolak** INSERT,
>    jadi bukan-admin tidak boleh menambah baris admin. Lihat §3 untuk penilaian
>    risiko yang betul.
> 4. 🟢 **Dua tindakan diluluskan** (selepas pengguna setuju): §2 dan §3.
> 5. ⛔ **TIADA DROP.** Termasuk `private.set_updated_at()`, walaupun ia akan
>    menjadi yatim selepas §2.

---

## 1. Penemuan terpenting: repo tidak pernah mencipta trigger `updated_at`

Z4 anda menyenaraikan 6 jadual yang trigger `updated_at`nya memanggil
`private.set_updated_at()`, dan 6 jadual lain yang **ada kolum `updated_at`
tetapi 0 trigger**.

Arena menyiasat repo dan mendapati **punca sebenarnya ialah kecacatan repo**:

```
$ git grep -niE "create trigger.*updated_at|set_updated_at" HEAD -- '*.sql'
❌ TIADA

$ # kolum updated_at dicipta pada 10 jadual rasmi:
schema-master.sql   : cost_items, financial_docs, invoices, organizers,
                      participants, programme_costs, programme_documents,
                      programmes, user_profiles
user-management.sql : app_settings
```

**Repo mencipta kolum `updated_at` pada 10 jadual rasmi tetapi tidak pernah
mencipta fungsi atau trigger untuk mengemas kininya.**

### Akibatnya

| # | Akibat | Bukti |
|---|--------|-------|
| 1 | **Pemasangan bersih daripada repo tidak mempunyai fungsi `updated_at` langsung.** Kolum itu kekal pada nilai INSERT selama-lamanya. | `git grep` di atas = kosong |
| 2 | **Di live, 6 jadual rasmi ada `updated_at` tetapi 0 trigger** — `updated_at` mereka **tidak pernah dikemas kini**, walaupun di live | Z4 anda: `app_settings`, `cost_items`, `financial_docs`, `organizers`, `programme_documents`, `user_profiles` |
| 3 | 5 jadual rasmi berfungsi **hanya** kerana `private.set_updated_at()` dicipta manual pra-repo | Z2/Z4 anda |
| 4 | App tidak menyelamatkannya secara konsisten — hanya **satu** tempat menulis `updated_at` secara manual | `lib/actions/programme-actions.ts:303` |

**Ini bukan sisa warisan. Ini fungsi yang hilang daripada repo, dan live
menampungnya dengan kod manual yang tidak terkawal.** `user_profiles` ialah
jadual teras Fasa 6 (menyimpan `role`, `is_active`, `must_change_password`) dan
`updated_at`nya **tidak pernah dikemas kini**.

### Pembetulan yang Arena sudah tulis dan uji

**`lib/supabase/updated-at-triggers.sql`** — fail baharu, diuji dalam
`scripts/test-updated-at-triggers.mjs` (**13/13 lulus**):

- Cipta `public.set_updated_at()` — badan serupa dengan `private.set_updated_at()`
  yang anda sahkan dalam Z5 (`NEW.updated_at = now(); RETURN NEW;`)
- Alih **6 trigger pra-repo** (5 rasmi + `profiles` warisan) kepada fungsi repo
- Tambah trigger kepada **6 jadual** yang tiada trigger di live
- Hasil: **12 jadual**, semua → `public.set_updated_at()`, **0** rujukan
  `private.set_updated_at()`
- **Idempoten** (pasang 2x → tetap 12 trigger, tiada berganda)
- **Tidak DROP apa-apa** — `private.set_updated_at()` dibiarkan wujud tetapi yatim
- **Tidak menyentuh** RLS, polisi, privilej, atau data

Ujian itu membina DB tiruan yang **meniru keadaan live** (6 trigger pra-repo),
memasang fail, dan mengesahkan **secara berkelakuan** bahawa `updated_at`
benar-benar berubah pada UPDATE — termasuk pada jadual yang dahulunya tiada
trigger.

---

## 2. TUGASAN 1 — Pasang `lib/supabase/updated-at-triggers.sql` 🟢 (selepas kelulusan pengguna)

1. Dapatkan fail itu daripada branch `arena/01a06274-masb-pms-v4`.
   **Sahkan blob SHA-nya dan laporkan** — jangan guna hash komit sebagai
   kriteria.
2. Jalankan pada projek `lmenmfsbjgxfhnykkgow`.
3. Jalankan **kedua-dua query pengesahan** yang ada di hujung fail itu
   (komen `PENGESAHAN (read-only)`), dan **query G1–G3 di bawah**.

```sql
-- G1 (VERSI BETUL). Skema fungsi setiap trigger updated_at.
--
-- ⚠️ G1 asal Arena menggunakan information_schema.triggers.action_statement
--    dan mengelaskan mengikut sama ada teks itu mengandungi 'private.' atau
--    'public.'. ITU ROSAK: Postgres hanya mengkualifikasikan nama fungsi
--    apabila ia BUKAN dalam search_path lalai, jadi
--    `public.set_updated_at()` dipaparkan TANPA skema. Selepas migrasi,
--    pengelasan asal memulangkan "⚪ tidak dikualifikasi" untuk kesemua 12
--    trigger dan kriteria "semua 🟢 repo" GAGAL walaupun kerja itu betul.
--    ChatGPT yang menangkap ini semasa pelaksanaan dan mengesahkan melalui
--    katalog. Query di bawah ialah pembetulan sah.
SELECT 'G1_updated_at_triggers' AS check_name,
       n.nspname AS function_schema,
       p.proname AS function_name,
       c.relname AS table_name,
       tg.tgname AS trigger_name,
       CASE WHEN n.nspname = 'private' THEN '🔴 PRA-REPO'
            WHEN n.nspname = 'public'  THEN '🟢 repo'
            ELSE '⚪ ' || n.nspname END AS origin
  FROM pg_trigger tg
  JOIN pg_class c     ON c.oid = tg.tgrelid
  JOIN pg_proc p      ON p.oid = tg.tgfoid
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE NOT tg.tgisinternal
   AND c.relnamespace = 'public'::regnamespace
   AND p.proname = 'set_updated_at'
 ORDER BY origin DESC, c.relname;
```

> **Nota G2:** G2 asal (`information_schema.triggers ... ILIKE
> '%private.set_updated_at%'`) **masih sah** — kerana fungsi `private`
> **memang** dikualifikasikan dalam `action_statement`. Yang rosak hanya
> pengelasan positif (`public`). Jangkaan G2 = `0` tidak berubah.


```sql
-- G2. Baki rujukan kepada private.set_updated_at() — JANGKAAN: 0
SELECT 'G2_baki_private_set_updated_at' AS check_name,
       count(*)::int AS baki_rujukan
  FROM information_schema.triggers
 WHERE trigger_schema = 'public'
   AND action_statement ILIKE '%private.set_updated_at%';
```

```sql
-- G3. Bukti BERKELAKUAN pada 3 jadual yang DULU tiada trigger.
--     ⚠️ Ini MENULIS data ujian ke jadual live. Arena meluluskannya secara
--        eksplisit kerana ia satu-satunya cara membuktikan trigger berfungsi.
--        Ia dikembalikan (ROLLBACK) — tiada perubahan kekal.
BEGIN;
SELECT 'G3_behaviour_before' AS check_name, 'user_profiles' AS tbl,
       (SELECT updated_at FROM public.user_profiles LIMIT 1) AS updated_at_sebelum;
UPDATE public.user_profiles SET updated_at = updated_at WHERE true;
SELECT 'G3_behaviour_after' AS check_name, 'user_profiles' AS tbl,
       (SELECT updated_at FROM public.user_profiles LIMIT 1) AS updated_at_selepas;
ROLLBACK;
```

> **Nota G3:** jika `user_profiles` kosong, `updated_at` akan `NULL` pada
> kedua-dua baris dan G3 **tidak membuktikan apa-apa**. Dalam kes itu laporkan
> `⏳ TIDAK DAPAT DIUJI — jadual kosong` dan **jangan** reka keputusan.
> `UPDATE ... SET updated_at = updated_at` sengaja tidak mengubah nilai supaya
> trigger boleh diuji tanpa merosakkan data — dan ia tetap di-ROLLBACK.

### Kriteria G

| # | Jangkaan | Jika tidak |
|---|----------|-----------|
| G1 | **12 baris**, semua `function_schema = public` / `origin = 🟢 repo` | 🔴 laporkan jadual mana yang masih 🔴 |
| G2 | `baki_rujukan = 0` | 🔴 pengalihan tidak lengkap |
| G3 | `updated_at_selepas` **lebih baharu** daripada `updated_at_sebelum` | 🔴 trigger tidak berfungsi |

---

## 3. TUGASAN 2 — REVOKE privilej tulis pada 3 jadual warisan 🟢 (selepas kelulusan pengguna)

### Penilaian risiko yang BETUL (pembetulan Arena)

Z5 anda mendedahkan badan `private.has_role()`:

```sql
SELECT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = requested_role
);
```

Bersama Z1 (`SECURITY DEFINER`, owner `postgres`, `rolbypassrls = true`,
`proacl = postgres, authenticated`) dan X4 (`authenticated` ada
`INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES` pada ketiga-tiga jadual warisan),
Arena pada mulanya menyangka ini membolehkan escalation:

> bukan-admin INSERT baris `admin` ke `user_roles` → `has_role('admin')` jadi
> true → dapat akses `profiles` (PII).

**Itu SALAH, dan Arena membetulkannya sebelum prompt ini dihantar.**
`user_roles_admin_write` ialah `cmd = ALL` dengan
`WITH CHECK (private.has_role('admin'))`. Bagi INSERT oleh bukan-admin,
`WITH CHECK` dinilai **sebelum** baris baharu kelihatan kepada `EXISTS`, jadi ia
`false` → **INSERT DITOLAK**. Anda juga mengesahkan kedua-dua polisi adalah
`PERMISSIVE` dan hanya ada **2** polisi pada `user_roles`, jadi tiada laluan
lain.

**Penilaian yang betul:**

| Aspek | Penilaian |
|-------|-----------|
| Exploitable sekarang? | ❌ **Tidak** — WITH CHECK menolak INSERT bukan-admin |
| Reka bentuk berbahaya? | ⚠️ **Ya** — autorisasi membaca **stor yang sama** yang dikawalnya (self-referential). Sebarang kelonggaran polisi pada masa depan akan membuka escalation serta-merta |
| Kesan jika berjaya? | Terhad — `profiles` = 1 baris, `programme_participants` = 0 baris, dan **W6/Z3 membuktikan tiada fungsi `public` atau polisi Fasa 6 membaca jadual ini**. Kebenaran app dibaca melalui `public.current_user_role()` → `user_profiles` |
| Privilej `TRUNCATE`/`REFERENCES` untuk `authenticated`? | 🔴 **Tidak boleh diterima** walau apa pun — ini corak **lalai Supabase**, bukan keputusan reka bentuk |

**Justeru: REVOKE ialah pengerasan (hardening), bukan pemadaman kebakaran.**
Ia patut dibuat kerana murah, selamat, dan boleh dipulihkan — bukan kerana ada
serangan aktif.

### SQL yang diluluskan

```sql
-- H1. KEADAAN SEBELUM — laporkan verbatim
SELECT 'H1_sebelum' AS check_name, grantee, table_name,
       string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privs
  FROM information_schema.table_privileges
 WHERE table_schema='public'
   AND table_name IN ('profiles','programme_participants','user_roles')
   AND grantee IN ('authenticated','anon')
 GROUP BY grantee, table_name
 ORDER BY table_name, grantee;
```

```sql
-- H2. REVOKE — tulis SAHAJA. SELECT DIKEKALKAN (lihat sebab di bawah).
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.profiles               FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.programme_participants FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.user_roles             FROM authenticated, anon;
```

```sql
-- H3. KEADAAN SELEPAS — JANGKAAN: hanya SELECT tinggal
SELECT 'H3_selepas' AS check_name, grantee, table_name,
       string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privs
  FROM information_schema.table_privileges
 WHERE table_schema='public'
   AND table_name IN ('profiles','programme_participants','user_roles')
   AND grantee IN ('authenticated','anon')
 GROUP BY grantee, table_name
 ORDER BY table_name, grantee;
```

### Kenapa `SELECT` DIKEKALKAN (keputusan sedar, bukan kelalaian)

Arena **sengaja tidak** REVOKE `SELECT`:

1. Jika ada kebergantungan yang **terlepas** daripada audit (W6, Z3, Z5),
   mengekalkan `SELECT` bermakna ia **terus berfungsi** dan kami akan
   menemuinya melalui log/bukti — bukan melalui kerosakan senyap.
2. `private.has_role()` ialah `SECURITY DEFINER` dengan owner `postgres`, jadi
   ia **tidak memerlukan** privilej `SELECT` pihak pemanggil. REVOKE SELECT
   tidak akan memecahkannya — tetapi juga tidak menambah keselamatan yang
   bermakna selagi 8 polisi itu wujud.
3. Pembersihan penuh (REVOKE SELECT + DROP polisi + DROP jadual + DROP fungsi)
   ialah **satu langkah berasingan** yang memerlukan bukti bahawa tiada apa-apa
   pecah selepas REVOKE tulis.

### Kriteria H

| # | Jangkaan |
|---|----------|
| H1 | 6 baris (3 jadual × 2 grantee), setiap satu mengandungi `DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE` |
| H3 | 6 baris, setiap satu **hanya** `SELECT` |
| Selepas H3 | Tiada ralat dalam log aplikasi; `/login` dan `/dashboard` masih berfungsi |

> **Jika H3 menunjukkan lebih atau kurang daripada `SELECT`, laporkan verbatim
> dan JANGAN cuba "membaikinya" sendiri.**

---

## 4. TUGASAN 3 — Laporan, BUKAN tindakan

Untuk tiga perkara ini, **laporkan sahaja. JANGAN ubah apa-apa.**

| Perkara | Apa yang Arena perlu tahu | Kenapa belum bertindak |
|---------|---------------------------|------------------------|
| `private.validate_programme_lock()` | Adakah kolum `governance_lock_status` **masih wujud** pada `programmes` di live? (fungsi lama merujuknya; fungsi repo `enforce_programme_lock()` merujuk `is_locked`) | Jika kolum itu tiada, fungsi lama akan **ralat** jika dipanggil. Ia tidak dipanggil (Z2), jadi ia mati — tetapi Arena perlu tahu sama ada ia **boleh** ralat |
| `private.write_audit_log()` | Trigger `trg_audit_programme_participants` masih memanggilnya. `programme_participants` ada **0 baris** | Jika jadual itu di-DROP kelak, trigger hilang bersamanya dan fungsi jadi yatim. Tiada sebab mendesak untuk mengikat semula kepada fungsi repo |
| `private.has_role()` + 8 polisi | Sudah diketahui (Z3/Z5). **Jangan DROP** | Selagi 8 polisi itu wujud, `pg_depend` akan menyebabkan `DROP FUNCTION` **gagal** tanpa `CASCADE` |

```sql
-- I1. Adakah kolum governance_lock_status masih wujud? (read-only)
SELECT 'I1_governance_lock_columns' AS check_name,
       column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='programmes'
   AND column_name IN ('governance_lock_status','is_locked','unlock_expires_at')
 ORDER BY column_name;
```

```sql
-- I2. Sahkan private.validate_programme_lock tidak terikat pada mana-mana trigger
SELECT 'I2_validate_lock_bindings' AS check_name,
       count(*)::int AS bilangan_trigger
  FROM information_schema.triggers
 WHERE action_statement ILIKE '%validate_programme_lock%';
```

---

## 5. Tentang E dan D — status semasa

**E (Production Branch):** anda sudah mencuba **dua kali** dan kedua-duanya
menamakan operasi yang tiada (`deploy_to_vercel` tidak mendedahkan kawalan
Production Branch). Mengikut peraturan §0 PROMPT-6F, itu **bukan** berhenti
senyap — anda sudah lakukan yang betul. Arena akan menyerahkannya kepada
pengguna sebagai **satu** tindakan manual yang spesifik. **Jangan cuba lagi
dalam prompt ini.**

**D1/D3/D4:** anda melaporkan operasi Auth configuration tidak tersedia. Arena
**menerima** itu. **Jangan cuba lagi dalam prompt ini** — pengguna akan
menanganinya melalui Dashboard.

**Jadi prompt ini HANYA tentang §2, §3 dan §4.**

---

## 6. Larangan

1. JANGAN jalankan prompt ini sebelum pengguna meluluskannya secara eksplisit.
2. JANGAN ubah apa-apa SQL dalam §2 dan §3. Jalankan **tepat** seperti tertulis.
3. JANGAN `DROP` apa-apa — termasuk `private.set_updated_at()` walaupun ia
   menjadi yatim selepas §2.
4. JANGAN REVOKE `SELECT` (keputusan sedar, lihat §3).
5. JANGAN sentuh `private.has_role()`, `private.write_audit_log()`,
   `private.validate_programme_lock()`, atau 8 polisi warisan.
6. JANGAN ubah RLS, `ALTER TABLE`, atau data.
7. JANGAN guna `service_role`.
8. JANGAN panggil RPC perniagaan atau `admin_*`.
9. JANGAN merge ke `main`.
10. JANGAN tukar Production Branch (lihat §5).
11. JANGAN cuba D1/D3/D4 lagi (lihat §5).
12. JANGAN tampal anon key / secret penuh.
13. JANGAN cetak PII atau `default_password`.
14. JANGAN reka bukti — jika G3 tidak dapat diuji, katakan `⏳`.
15. JANGAN anggap Mod Demo tempatan sebagai produksi.
16. **G3 mesti dalam transaksi yang di-ROLLBACK.** Jika anda tidak boleh
    menjamin ROLLBACK, **langkau G3** dan laporkan `⏳`.

---

## 7. FORMAT LAPORAN (6 seksyen)

```
📋 LAPORAN PROMPT-6G — updated_at triggers + REVOKE warisan
===========================================================

1. CONTEXT & STATUS
   - Status keseluruhan: 🟢 / 🟡 / 🔴
   - Kelulusan pengguna direkodkan? (tarikh/masa)
   - §2 siap? §3 siap? §4 siap?

2. ACTIONS TAKEN
   - §2: blob SHA fail updated-at-triggers.sql; bagaimana ia dijalankan
   - §3: pernyataan REVOKE yang dijalankan
   - §4: query I1/I2

3. VERIFICATION TABLE
   a) G1 | jadual | trigger | executes | origin |   (jangkaan 12, semua 🟢)
   b) G2 | baki_rujukan |                            (jangkaan 0)
   c) G3 | tbl | updated_at_sebelum | selepas | berubah? |
   d) H1 | grantee | jadual | privs SEBELUM |
   e) H3 | grantee | jadual | privs SELEPAS |          (jangkaan hanya SELECT)
   f) I1 | kolum | wujud? |
   g) I2 | bilangan_trigger |                          (jangkaan 0)

4. ISSUES / BLOCKERS
   - G1/G2/G3/H3 yang tidak sepadan jangkaan (verbatim)
   - I1: adakah governance_lock_status masih wujud?
   - Sebarang ralat penuh (ERROR/DETAIL/HINT/CONTEXT/SQLSTATE)

5. COMPLIANCE CHECKLIST
   - 16 larangan: 🟢/🔴 setiap satu
   - Pengesahan eksplisit: TIADA DROP, TIADA REVOKE SELECT,
     private.has_role/write_audit_log/validate_programme_lock TIDAK disentuh

6. CONCLUSION & NEXT STEP
   - Adakah updated_at kini berfungsi untuk SEMUA jadual rasmi?
   - Adakah permukaan tulis warisan sudah ditutup?
   - private.set_updated_at() kini yatim — apa cadangan anda?
   - Apa yang Arena perlu tulis seterusnya?
```

---

## Nota untuk Arena (bukan untuk ChatGPT)

### Tindakan pengguna — tiga perkara

**1. 🟢 Luluskan prompt ini** (HARD GATE). Ia mengandungi live SQL:
   - DDL: 1 fungsi + 12 trigger (`updated-at-triggers.sql`)
   - REVOKE: privilej tulis pada 3 jadual warisan

**2. 🔴 Tukar Production Branch di Vercel — ini HANYA anda boleh buat.**
   ChatGPT sudah mencuba **dua kali** dan kedua-duanya menamakan operasi yang
   tiada (`deploy_to_vercel` tidak mendedahkan kawalan Production Branch).
   Mengikut peraturan yang Arena sendiri tetapkan dalam PROMPT-6F §0, ia sudah
   melakukan yang betul — menamakan operasi dan ralat, bukan berhenti senyap.
   Jadi pemindahan ini **disokong oleh bukti**, bukan andaian:

```
https://vercel.com → projek masb-pms-v4
  → Settings → Git → Production Branch
  → arena/01a06274-masb-pms-v4
  → Save
```

   Kemudian beritahu ChatGPT untuk jalankan semula **E1–E9**.

**3. 🟡 D1/D3/D4 melalui Supabase Dashboard** — ChatGPT melaporkan operasi Auth
   configuration tidak tersedia (dua sesi berturut-turut).
   `https://supabase.com/dashboard/project/lmenmfsbjgxfhnykkgow/auth`
   - **D1** Providers → Email: pastikan ON; `Confirm email` → **OFF** dicadangkan
     (ChatGPT dan Arena bersetuju). **Keputusan milik anda.**
   - **D3** Email Templates → Reset Password: sahkan ada `{{ .ConfirmationURL }}`
   - **D4** Rate Limits: biarkan lalai
   - **D2** sudah anda buat ✅

### Rekod: kenapa `private.validate_programme_lock()` bukan ancaman

Z5 menunjukkan fungsi lama melindungi **9 kolum** pada program berkunci dan
membenarkan edit kolum lain, menggunakan `governance_lock_status`.

Repo `public.enforce_programme_lock()` menggunakan **reka bentuk berbeza dan
lebih ketat**: ia menolak **sebarang** perubahan pada program berkunci kecuali
melalui tetingkap buka kunci (`unlock_expires_at`), dan merujuk `is_locked`.

| | Fungsi lama (`private`) | Fungsi repo (`public`) |
|---|---|---|
| Kolum kunci | `governance_lock_status` | `is_locked` |
| Strategi | Lindungi 9 kolum, benarkan yang lain | **Kunci semua**, benarkan hanya melalui tetingkap buka kunci |
| Pengecualian | `private.has_role('head_governance')` → baca `user_roles` | RPC `SECURITY DEFINER` + `review_programme_unlock` |
| Status live | **Tidak terikat pada mana-mana trigger** (Z2) | **Aktif** melalui `programmes_enforce_lock` |

**Jadi fungsi lama ialah kod mati, dan reka bentuk baharu lebih ketat.** Tiada
tindakan diperlukan selain I1 (mengetahui sama ada kolum lama masih wujud).

### Rekod pengajaran Fasa 6 — kini 6 kesilapan/jurang

| # | Jenis | Perkara | Dikesan oleh |
|---|-------|---------|--------------|
| 1 | Kriteria | V3 `policy_count = 9` | ChatGPT |
| 2 | Kriteria | W1 allowlist 13 jadual (`grep` peka huruf besar) | ChatGPT |
| 3 | Proses | Gate "D sebelum E" tanpa sebab tertulis | ChatGPT |
| 4 | Kriteria | "pg_depend tidak jejak polisi RLS" — tidak diuji | **Arena sendiri** |
| 5 | Proses | "Alat tidak boleh" → pindahkan tugas kepada pengguna | **Pengguna** |
| 6 | Kriteria | "private.has_role() boleh escalate melalui INSERT" — **WITH CHECK menolak INSERT** | **Arena sendiri**, sebelum prompt dihantar |

**Jurang 5 (audit bermula dari repo, bukan live) ialah punca penemuan §1.**
Jika audit Fasa 6 bermula daripada `information_schema.triggers` di live pada
bulan pertama, kecacatan `updated_at` ini akan ditemui jauh lebih awal — dan
repo tidak akan pernah dihantar tanpa trigger yang live sudah ada.
