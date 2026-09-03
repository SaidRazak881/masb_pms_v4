# PROMPT 6F — E (Production Branch) + baki D + Z1–Z5 (audit `private.*` pra-repo)

> **Persona kamu:** Jurutera pangkalan data yang teliti dan berhati-hati
> (`docs/personas/PERSONA-SQL-ARCHITECT.md`).
>
> **Keadaan:** PROMPT-6E dijalankan. **E = 0/9 PASS** dengan bukti live bahawa
> Production masih **Fasa 5** (`MfaGuard` masih dimuatkan; `/register`,
> `/forgot-password`, `/admin/users` = 404). **Y1–Y4 selesai.** D2 sudah dibuat
> oleh pengguna.
>
> **Semua diluluskan dalam prompt ini:**
> 1. 🟢 **LANGKAH E** — tukar Production Branch + sahkan env vars + **E1–E9**.
> 2. 🟢 **BAKI LANGKAH D** — D2 (sahkan), D1, D3, D4.
> 3. 🟢 **Z1–Z5 (READ-ONLY)** — audit 4 fungsi `private.*` pra-repo.
> 4. ⛔ **TIADA** kelulusan DROP / REVOKE / ALTER / CREATE pada skema.
>
> **Baca §0 dahulu — ia membatalkan arahan yang Arena berikan dalam PROMPT-6E.**

---

## 0. PEMBETULAN ARAHAN — baca sebelum buat apa-apa

Dalam PROMPT-6E, Arena menulis bahawa penukaran Production Branch ialah "kerja
manual pengguna" dan bahawa Langkah D "dipindahkan kepada pengguna" serta
"anda tidak perlu cuba lagi".

**Kedua-dua arahan itu DIBATALKAN.**

**Punca kesilapan Arena:** dalam sesi PROMPT-6D/6E, anda melaporkan bahawa
connector yang tersedia dalam **sesi itu** tiada operasi untuk Supabase Auth
configuration dan Vercel Git settings. Arena **membuat kesimpulan bahawa had itu
kekal**, lalu memindahkan tugas kepada pengguna dan menulis semula prompt
berdasarkan andaian tersebut.

**Fakta sebenar (disahkan oleh pengguna):** ChatGPT mempunyai **capaian penuh**
terhadap Vercel dan Supabase, dan boleh melakukan semuanya **melainkan ChatGPT
sendiri memaklumkan bahawa ia tidak boleh** dalam kes tertentu.

**Jadi:** had yang anda laporkan ialah sifat **sesi/operasi tertentu**, bukan
sempadan keupayaan yang kekal. Arena sepatutnya **bertanya operasi mana yang
tiada** dan mencuba laluan lain, bukan menyerah dan memindahkan tugas.

**Peraturan proses baharu (direkodkan sebagai kesilapan Arena #5):**
> Apabila pembantu melaporkan "alat saya tidak boleh buat X", jawapan pertama
> ialah **"operasi spesifik mana yang tiada, dan adakah laluan lain?"** —
> bukan pemindahan tugas kepada manusia. Memindahkan tugas berdasarkan had alat
> dalam **satu** sesi ialah kesimpulan yang tidak disokong oleh bukti.

**Apa yang kekal betul daripada PROMPT-6E:** pembahagian kerja asal — **Arena
tidak pernah mempunyai capaian kepada Vercel atau Supabase**; Arena hanya menulis
kod/SQL dalam repo dan menyediakan prompt. Yang salah ialah kesimpulan bahawa
kerana ChatGPT (pada satu sesi) tidak dapat, maka **pengguna** yang mesti buat.

**Nota tentang D2:** pengguna **sudah** menambah
`https://masb-pms-v4.vercel.app/security**` ke Redirect URLs. Anda hanya perlu
**mengesahkannya** (D2 di bawah), bukan membuatnya semula.

---

## 1. LANGKAH E — DILULUSKAN, anda jalankan 🟢

### E-1. Tukar Production Branch

1. Vercel Dashboard → projek `masb-pms-v4` → **Settings → Git → Production
   Branch** → tukar kepada **`arena/01a06274-masb-pms-v4`** → Save.
2. **Laporkan nilai SEMASA dahulu** (jangkaan: `arena/01a05cd4-masb-pms-v4`)
   supaya boleh dipulangkan jika perlu.
3. Sahkan deployment mencapai **READY** dengan **`Target: Production`**. Anda
   sudah melaporkan deployment branch ini READY tetapi `target=null` — selepas
   penukaran, `target` **mesti** menjadi `production`.
4. **Kriteria hash (kalis kendiri — jangan guna hash tetap):** jalankan
   `git ls-remote origin arena/01a06274-masb-pms-v4` dan bandingkan dengan hash
   deployment. Keduanya **mesti sama**. Jika berbeza atau lebih lama, laporkan
   sebagai isu.
5. Sahkan **Environment Variables** `NEXT_PUBLIC_SUPABASE_URL` dan
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` wujud untuk **Production dan Preview**.
   **JANGAN papar nilai** — sahkan kewujudan sahaja. Dalam PROMPT-6E anda
   melaporkan ini "tidak dapat disahkan melalui connector"; sila cuba lagi, dan
   jika masih tidak boleh, **namakan operasi spesifik** yang tiada.
6. Nyatakan sama ada redeploy manual diperlukan selepas tukar branch.

> **Jika anda benar-benar tidak dapat menukar Production Branch**, jangan
> berhenti senyap: laporkan **nama operasi/API yang anda cuba** dan **ralat
> penuhnya**. Itu membezakan "alat tiada" daripada "saya tidak cuba cara lain".

### E-2. Pengesahan tanpa log masuk (E1–E9)

Jalankan **selepas** Production Branch ditukar dan deployment READY.

| # | URL | Jangkaan |
|---|-----|----------|
| E1 | `/programmes` | redirect ke `/login?redirect=%2Fprogrammes` |
| E2 | `/admin/users` | redirect ke `/login?redirect=%2Fadmin%2Fusers` |
| E3 | `/login` | 200; mengandungi `masb.12345`, `Daftar Akaun Baharu`, `Lupa kata laluan?` |
| E4 | `/register` | 200; mengandungi `Daftar Akaun Baharu`, `Menunggu Kelulusan` |
| E5 | `/forgot-password` | 200; mengandungi `Lupa Kata Laluan` |
| E6 | `/pending-approval` | 200; mengandungi `Menunggu Kelulusan` |
| E7 | `/account-blocked` | 200; mengandungi `Akaun Disekat` |
| E8 | `/security` | redirect ke `/login` |
| E9 | mana-mana halaman | **TIADA** teks `authenticator`, `Pengesahan 2-Langkah`, `kod 6 digit`, `TOTP`, `MFA`, `MfaGuard` |

**E9 ialah bukti MFA benar-benar dibuang dari produksi.** Anda sudah membuktikan
dalam PROMPT-6E bahawa E9 **gagal** selagi Production masih Fasa 5 — jadi E9
ialah penentu bahawa penukaran branch benar-benar berkesan.

> **Nota E5:** halaman `/forgot-password` dijangka 200 dan memaparkan borang.
> Pautan dalam e-mel pula bergantung kepada D2 (sudah dibuat oleh pengguna) —
> sila **sahkan** D2 dalam §2.

---

## 2. BAKI LANGKAH D — DILULUSKAN, anda jalankan 🟢

| # | Menu Supabase | Tindakan | Status |
|---|---------------|----------|--------|
| **D2** | **Authentication → URL Configuration** | **SAHKAN** `Site URL` = `https://masb-pms-v4.vercel.app` dan `Redirect URLs` mengandungi `https://masb-pms-v4.vercel.app/security**`. Pengguna melaporkan sudah menambahnya — **sahkan dan laporkan nilai sebenar**. Jika tiada, tambah. | 🔴 wajib untuk `/forgot-password` |
| **D1** | **Authentication → Providers → Email** | Pastikan **Enable Email provider = ON**. Laporkan nilai semasa **`Confirm email`**. **Cadangan Arena + ChatGPT (dari PROMPT-6E): OFF** untuk rollout pertama — 19/19 akaun sedia ada sudah `email_confirmed_at IS NOT NULL`, dan `app/(auth)/register/page.tsx` mengendalikan kedua-dua kes. **Tetapi JANGAN tukar tanpa melaporkannya dahulu** — keputusan akhir milik pengguna. | sederhana |
| **D3** | **Authentication → Email Templates → Reset Password** | Sahkan template mengandungi `{ .ConfirmationURL }`. Laporkan subjek + sama ada ia Bahasa Melayu atau Inggeris. Jika organisasi mahu Bahasa Melayu, **sediakan teks cadangan** (subjek + badan) dalam laporan — **jangan tukar template** tanpa kelulusan. | rendah |
| **D4** | **Authentication → Rate Limits** | Laporkan nilai semasa. Nyatakan sama ada perubahan diperlukan untuk 19 pengguna. **JANGAN cadangkan melumpuhkan sebarang perlindungan.** | rendah |

**Untuk setiap D: laporkan NILAI SEMASA → NILAI BAHARU**, supaya sebarang
perubahan boleh dipulangkan.

---

## 3. Kenapa Z wujud — penemuan Arena daripada Y2 anda

Y2 anda menyenaraikan **5 fungsi** dalam skema `private`:

```
append_import_audit, has_role, set_updated_at,
validate_programme_lock, write_audit_log
```

Arena menyiasat sejarah git dan mendapati:

| Fungsi | Ditakrifkan dalam repo? | Dirujuk dalam repo? |
| ------ | ----------------------- | ------------------- |
| `private.append_import_audit` | ✅ Ya (`sync-import-transaction.sql`) | ✅ Ya |
| `private.has_role` | ❌ **Tidak pernah** (mana-mana komit, mana-mana ref) | ✅ Ya pada `main` (5 baris), **tidak** pada branch Arena |
| `private.set_updated_at` | ❌ **Tidak pernah** | ❌ Tidak |
| `private.validate_programme_lock` | ❌ **Tidak pernah** | ❌ Tidak |
| `private.write_audit_log` | ❌ **Tidak pernah** | ❌ Tidak |

**Empat daripada lima fungsi `private` tidak wujud dalam repo sama sekali.**
Mereka dicipta secara manual sebelum projek ini dimuat naik ke git (sejarah
bermula dengan `535fb13 "Add files via upload"`).

### Kenapa ini berbahaya — bukan sekadar sisa kosmetik

Repo mentakrifkan **padanan berfungsi** bagi tiga daripadanya, tetapi dengan
**nama dan skema yang berbeza**:

| Pra-repo (live) | Repo (branch Arena) | Fungsi sistem |
| --------------- | ------------------- | ------------- |
| `private.validate_programme_lock()` | `public.enforce_programme_lock()` | **Governance lock** — diikat sebagai trigger `programmes_enforce_lock` |
| `private.write_audit_log()` | `public.log_audit()` | **Audit log** — spec teras: "immutable audit log" |
| `private.set_updated_at()` | *(tiada padanan bernama)* | Kemungkinan trigger `updated_at` pada jadual |
| `private.has_role(text)` | `public.has_role(app_role)` | Kawalan kebenaran RLS |

**`CREATE OR REPLACE` hanya menggantikan fungsi yang signature-nya SEPADAN.**
Kerana nama **dan** skema berbeza, memasang SQL Fasa 1–6 **tidak menyentuh**
fungsi `private.*` yang lama. Kedua-dua set wujud **serentak** dalam live.

### Persoalan yang Z mesti jawab

Jika **trigger** pada `programmes` masih terikat kepada
`private.validate_programme_lock()`, maka:

> **Governance lock — kawalan keselamatan paling penting dalam spec — sedang
> dikuatkuasakan oleh kod pra-repo yang tidak terkawal, tidak diuji, dan tidak
> dikemas kini oleh mana-mana pemasangan SQL kami.**

Begitu juga jika audit trigger masih memanggil `private.write_audit_log()`.

**Ini kelas drift C13 yang sama** (blocker yang telah memaksa kami membetulkan
`has_role()`), tetapi pada dua kawalan yang lebih kritikal. C13 dikesan kerana
ia **menghentikan log masuk**. Drift ini **tidak akan menghentikan apa-apa** —
ia akan **senyap-senyap menguatkuasakan peraturan lama**. Itu lebih berbahaya.

### Penurunan taraf yang Arena sudah buat (supaya anda tidak terkeliru)

Y1 anda melaporkan `private.has_role` ialah **`SECURITY DEFINER = true`**,
`STABLE`, `proacl = postgres, authenticated`, dan mengambil **`requested_role text`**
(bukan `app_role`).

- **`SECURITY DEFINER` + tiada `search_path` terkunci** ialah corak yang
  berpotensi membenarkan fungsi itu membaca **semua** baris, memintas RLS.
  Tetapi kerana **tiada fungsi `public` membaca 3 jadual warisan** (W6), dan
  kebenaran aplikasi dibaca melalui `public.current_user_role()` →
  `user_profiles`, **ia tidak memberi kuasa dalam aplikasi semasa**.
- **Signature `text` vs `app_role`** bermakna `private.has_role` dan
  `public.has_role` ialah **overload berbeza**, bukan fungsi yang sama. Ia tidak
  boleh saling menggantikan tanpa cast.

**Jadi `private.has_role()` = risiko terkawal. Yang belum diketahui ialah
`validate_programme_lock` dan `write_audit_log` — dan itu tujuan Z2.**

---

---

## 4. Z1–Z5 — READ-ONLY 🟢

**Reka bentuk (DIKEMAS KINIKAN selepas pembetulan §0):** Z1–Z4 asalnya direka
untuk menggunakan **katalog sahaja** kerana dalam sesi PROMPT-6E anda
melaporkan `pg_proc.prosrc` tidak tersedia. Memandangkan anda mempunyai capaian
penuh Supabase, **Z5 kini bukti UTAMA** — badan sebenar kelima-lima fungsi
`private.*` ialah satu-satunya cara mengetahui apa yang
`validate_programme_lock` dan `write_audit_log` **lakukan**.

Z1–Z4 tetap berguna sebagai **struktur dan kebergantungan** (siapa pemilik,
trigger mana terikat, polisi mana merujuk). Jalankan **kesemuanya**.

**Tiada DDL/DML/GRANT/REVOKE. Tiada pelaksanaan fungsi `private.*`.**

```sql
-- Z1. Kelima-lima fungsi private: signature, PEMILIK, dan sama ada
--     search_path dikunci (proconfig). Katalog sahaja — tiada prosrc.
--
--     Kenapa proowner penting: fungsi SECURITY DEFINER melaksanakan dengan
--     kebenaran PEMILIKNYA. Jika pemilik = postgres (biasanya rolbypassrls),
--     fungsi itu memintas RLS.
--     Kenapa proconfig penting: SECURITY DEFINER TANPA `SET search_path`
--     ialah kelemahan yang diketahui — penghijackan search_path.
SELECT 'Z1_private_function_metadata' AS check_name,
       p.proname                                   AS function_name,
       pg_catalog.pg_get_function_identity_arguments(p.oid) AS args,
       l.lanname                                   AS language,
       p.prosecdef                                 AS security_definer,
       p.provolatile                               AS volatility,
       r.rolname                                   AS owner_role,
       r.rolsuper                                  AS owner_is_superuser,
       r.rolbypassrls                              AS owner_bypasses_rls,
       p.proconfig::text                           AS function_settings,
       (p.proconfig::text LIKE '%search_path%')    AS has_locked_search_path,
       p.proacl::text                              AS execute_acl,
       pg_catalog.pg_get_function_result(p.oid)    AS return_type
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language  l ON l.oid = p.prolang
  JOIN pg_roles     r ON r.oid = p.proowner
 WHERE n.nspname = 'private'
 ORDER BY p.proname;
```

```sql
-- Z2. ⭐ SOALAN PALING PENTING DALAM PROMPT INI.
--     Trigger mana yang terikat kepada fungsi skema `private`?
--
--     information_schema.triggers.maction_statement mendedahkan
--     `EXECUTE FUNCTION skema.nama()` — jadi ia menjawab soalan ini
--     TANPA memerlukan prosrc.
--
--     Jangkaan yang Arena TAKUTI: trigger `programmes_enforce_lock` masih
--     memanggil private.validate_programme_lock(), bermakna governance lock
--     dikuatkuasakan oleh kod pra-repo.
SELECT 'Z2_trigger_bindings' AS check_name,
       t.event_object_schema  AS schema_name,
       t.event_object_table   AS table_name,
       t.trigger_name,
       t.event_manipulation   AS event,
       t.action_timing        AS timing,
       t.action_statement     AS executes,
       CASE
         WHEN t.action_statement ILIKE '%private.%' THEN '🔴 PRA-REPO (private)'
         WHEN t.action_statement ILIKE '%public.%'  THEN '🟢 repo (public)'
         ELSE '⚪ tidak dikualifikasi'
       END                    AS origin
  FROM information_schema.triggers t
 WHERE t.trigger_schema NOT IN ('pg_catalog','information_schema')
 ORDER BY origin DESC, t.event_object_table, t.trigger_name;
```

```sql
-- Z3. Ungkapan polisi RLS yang merujuk fungsi `private.*`.
--     pg_policies.qual / with_check ialah TEKS terbitan katalog, jadi ia boleh
--     dibaca walaupun prosrc tidak boleh.
--
--     Y3 anda membuktikan 8 polisi bergantung kepada private.has_role().
--     Z3 menambah: adakah mana-mana polisi bergantung kepada private.* LAIN?
SELECT 'Z3_policies_referencing_private' AS check_name,
       pol.schemaname AS schema_name,
       pol.tablename  AS table_name,
       pol.policyname,
       pol.cmd,
       pol.roles::text AS applies_to,
       pol.qual       AS using_expr,
       pol.with_check AS check_expr
  FROM pg_policies pol
 WHERE pol.schemaname = 'public'
   AND (pol.qual LIKE '%private.%' OR pol.with_check LIKE '%private.%')
 ORDER BY pol.tablename, pol.cmd, pol.policyname;
```

```sql
-- Z4. Adakah private.set_updated_at terikat sebagai trigger updated_at?
--
--     PENTING — query ini mengkelaskan TRIGGER updated_at YANG SPESIFIK,
--     bukan semua trigger pada jadual. Arena pada mulanya menulis versi yang
--     mengimbas SEMUA trigger, dan ujiannya mendedahkan bahawa ia mengelas
--     `programmes` sebagai "guna private" semata-mata kerana
--     programmes_enforce_lock (private) wujud pada jadual yang sama — positif
--     palsu yang akan mengelirukan keputusan live.
--
--     Z4 juga mendedahkan drift senyap jenis kedua: jadual yang ADA kolum
--     updated_at tetapi TIADA trigger mengemas kininya.
SELECT 'Z4_updated_at_coverage' AS check_name,
       c.table_name,
       (SELECT count(*)::int
          FROM information_schema.triggers t
         WHERE t.event_object_schema = 'public'
           AND t.event_object_table  = c.table_name
           AND t.action_timing       = 'BEFORE'
           AND t.event_manipulation  = 'UPDATE'
           AND (t.trigger_name ILIKE '%updated_at%'
                OR t.action_statement ILIKE '%set_updated_at%'))  AS updated_at_trigger_count,
       (SELECT string_agg(t.trigger_name || ' → ' || t.action_statement, ' | ')
          FROM information_schema.triggers t
         WHERE t.event_object_schema = 'public'
           AND t.event_object_table  = c.table_name
           AND t.action_timing       = 'BEFORE'
           AND t.event_manipulation  = 'UPDATE'
           AND (t.trigger_name ILIKE '%updated_at%'
                OR t.action_statement ILIKE '%set_updated_at%'))  AS updated_at_triggers,
       CASE
         WHEN NOT EXISTS (SELECT 1 FROM information_schema.triggers t
                           WHERE t.event_object_schema='public'
                             AND t.event_object_table=c.table_name
                             AND t.action_timing='BEFORE'
                             AND t.event_manipulation='UPDATE'
                             AND (t.trigger_name ILIKE '%updated_at%'
                                  OR t.action_statement ILIKE '%set_updated_at%'))
              THEN '⚪ TIADA trigger updated_at'
         WHEN EXISTS (SELECT 1 FROM information_schema.triggers t
                       WHERE t.event_object_schema='public'
                         AND t.event_object_table=c.table_name
                         AND t.action_timing='BEFORE'
                         AND t.event_manipulation='UPDATE'
                         AND (t.trigger_name ILIKE '%updated_at%'
                              OR t.action_statement ILIKE '%set_updated_at%')
                         AND t.action_statement ILIKE '%private.%')
              THEN '🔴 trigger updated_at GUNA private.set_updated_at'
         ELSE '🟢 trigger updated_at bukan private'
       END AS updated_at_origin,
       (SELECT count(*)::int FROM information_schema.triggers t
         WHERE t.event_object_schema='public'
           AND t.event_object_table=c.table_name)                 AS semua_trigger_count
  FROM information_schema.columns c
 WHERE c.table_schema = 'public' AND c.column_name = 'updated_at'
 ORDER BY updated_at_origin DESC, c.table_name;
```

```sql
-- Z5. PERCUBAAN TERAKHIR untuk prosrc kelima-lima fungsi private.
--     Jika connector menghalang ini, tampal RALAT PENUH dan TERUSKAN —
--     Z1-Z4 sudah cukup untuk membuat keputusan. JANGAN hentikan laporan.
SELECT 'Z5_private_function_source' AS check_name,
       p.proname AS function_name,
       pg_catalog.pg_get_function_identity_arguments(p.oid) AS args,
       p.prosrc  AS source
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'private'
 ORDER BY p.proname;
```

### Kriteria Z — apa yang Arena perlu tahu

| # | Persoalan | Kenapa ia menentukan tindakan |
|---|-----------|-------------------------------|
| Z1 | `owner_role`, `owner_bypasses_rls`, `has_locked_search_path` bagi setiap fungsi | `SECURITY DEFINER` + owner bypassrls + **tiada** `search_path` terkunci = corak berisiko. Menentukan sama ada fungsi ini boleh dibaca/dipengaruhi oleh pemanggil |
| **Z2** | **Trigger mana memanggil `private.*`?** | ⭐ **Jika `programmes_enforce_lock` → `private.validate_programme_lock()`, governance lock sedang dikuatkuasakan oleh kod pra-repo.** Itu penemuan keselamatan, bukan kosmetik |
| Z3 | Polisi mana merujuk `private.*` selain `has_role`? | Menentukan skop penuh kebergantungan sebelum sebarang REVOKE/DROP |
| Z4 | `updated_at_origin` bagi setiap jadual ber-`updated_at`: 🔴 private / 🟢 bukan private / ⚪ tiada trigger | Drift senyap jenis kedua — kolum yang tidak pernah dikemas kini. **Klasifikasi ini khusus kepada trigger `updated_at`, bukan semua trigger pada jadual** |
| **Z5** | **Badan sebenar (`prosrc`) kelima-lima fungsi `private.*`** | ⭐ **Bukti UTAMA, bukan cubaan terakhir.** Ini satu-satunya cara mengetahui apa yang `validate_programme_lock` dan `write_audit_log` **sebenarnya** lakukan. Anda mempunyai capaian penuh Supabase, jadi ini patut boleh dibaca. Jika gagal, namakan **operasi spesifik** yang anda cuba dan ralatnya |

**Jika mana-mana Z gagal dengan ralat kebenaran, tampal ralat PENUH**
(ERROR / DETAIL / HINT / CONTEXT / SQLSTATE) dan **teruskan ke Z seterusnya**.
Jangan hentikan keseluruhan laporan.

**Semua query Z telah diuji oleh Arena terhadap PGlite** dalam
`scripts/test-prompt-6f-z-queries.mjs` (sah secara sintaks, read-only, tidak
melaksanakan fungsi). Jika ada yang gagal di live, puncanya ialah **kebenaran
connector**, bukan sintaks.

---

**Jika mana-mana Z gagal, tampal ralat PENUH** (ERROR / DETAIL / HINT /
CONTEXT / SQLSTATE) **dan namakan operasi yang anda cuba**, kemudian **teruskan
ke Z seterusnya**. Jangan hentikan keseluruhan laporan.

**Semua query Z telah diuji oleh Arena terhadap PGlite** dalam
`scripts/test-prompt-6f-z-queries.mjs` (26/26 lulus: sintaks sah, read-only,
tidak melaksanakan fungsi, dan Z2 terbukti mendedahkan Senario A). Jika ada yang
gagal di live, puncanya ialah **kebenaran**, bukan sintaks.

---

## 5. Rancangan Arena selepas Z (BELUM diluluskan)

Bergantung kepada Z2:

### Senario A — Z2 menunjukkan trigger governance/audit masih pada `private.*`

Ini bermakna **kawalan keselamatan teras spec sedang dijalankan oleh kod yang
kami tidak kawal**. Arena akan:

1. **Tidak** drop apa-apa.
2. Menulis **satu fail SQL baharu** yang mengikat semula trigger kepada fungsi
   `public.*` yang sudah diuji dalam repo, dalam **satu transaksi**, dengan
   pengesahan sebelum/selepas.
3. Memberikannya sebagai **PROMPT-6G** dengan kriteria yang diuji terlebih
   dahulu oleh `scripts/test-*.mjs`.
4. **Hanya selepas** itu mempertimbangkan pembersihan fungsi `private.*` yatim.

### Senario B — Z2 menunjukkan semua trigger sudah pada `public.*`

Maka kelima-lima fungsi `private.*` ialah **yatim sepenuhnya** (hanya 8 polisi
warisan bergantung kepada `private.has_role()`). Arena akan merancang
**REVOKE → DROP TABLE → DROP FUNCTION** untuk 3 jadual warisan, dalam urutan
itu, kerana Y3 membuktikan `pg_depend` menjejak polisi → `DROP FUNCTION` tanpa
`CASCADE` akan gagal.

**Dalam kedua-dua senario, tiada tindakan diluluskan sekarang.**

---

## 6. Status 3 jadual warisan (kekal TANGGUH)

Bukti anda setakat ini:

| Jadual | Baris (W3/Y4) | Privilej `authenticated` (X4) | Polisi (X5/Y3) | Status |
| ------ | ------------- | ------------------------------ | -------------- | ------ |
| `programme_participants` | 0 | FULL (termasuk TRUNCATE, REFERENCES) | 4 polisi → `private.has_role()` | 🟠 Kandidat DROP paling bersih — **TANGGUH** |
| `profiles` | 1 | FULL | 3 polisi → `private.has_role()` | 🟡 Perlu tahu sama ada 1 baris itu salinan lapuk `user_profiles` — **TANGGUH** |
| `user_roles` | 1 (`role = admin`) | FULL | 2 polisi → `private.has_role()` | 🟡 **TANGGUH** — anda betul tidak mencetak PII |

**Arena bersetuju dengan kesimpulan anda:** ketiga-tiganya belum boleh
diputuskan. Z2/Z3 mungkin mendedahkan kebergantungan tambahan.

---

---

## 7. Larangan

1. JANGAN ubah logik perniagaan dalam SQL.
2. JANGAN jalankan sebarang DDL/DML/GRANT/REVOKE pada Supabase.
   **Z1–Z5 read-only sepenuhnya.** Langkah D dan E ialah **konfigurasi melalui
   UI/API** (Auth settings, Production Branch) — itu sahaja yang diluluskan.
3. JANGAN `DROP`/`TRUNCATE`/`DELETE`/`ALTER` jadual warisan **atau** mana-mana
   fungsi `private.*`.
4. JANGAN guna `service_role`.
5. JANGAN panggil RPC perniagaan atau `admin_*`.
6. JANGAN merge ke `main`.
7. JANGAN tukar Production Branch ke branch selain
   **`arena/01a06274-masb-pms-v4`**.
8. JANGAN tukar **`Confirm email`** (D1) tanpa melaporkannya dahulu — keputusan
   milik pengguna.
9. JANGAN tukar **Email Templates** (D3) tanpa kelulusan — sediakan cadangan
   teks sahaja.
10. JANGAN lumpuhkan sebarang **Rate Limit** atau perlindungan Auth (D4).
11. JANGAN tampal anon key / secret penuh.
12. JANGAN cetak PII, `default_password`, atau kolum sensitif. **Anda sudah
    melakukan ini dengan betul dalam Y4 — teruskan.**
13. JANGAN reka bukti — terutamanya E1–E9 dan Z1–Z5.
14. JANGAN anggap Mod Demo tempatan sebagai produksi.
15. JANGAN guna hash komit tetap sebagai kriteria.
16. **JANGAN melaksanakan mana-mana fungsi `private.*`** — Z hanya **membaca**
    badan fungsi, tidak memanggilnya.
17. **JANGAN berhenti senyap apabila alat gagal.** Namakan operasi yang dicuba
    dan ralat penuhnya, kemudian teruskan bahagian lain.

---

## 8. FORMAT LAPORAN (6 seksyen)

```
📋 LAPORAN PROMPT-6F — E + BAKI D + Z1–Z5
==========================================

1. CONTEXT & STATUS
   - Status keseluruhan: 🟢 / 🟡 / 🔴
   - E siap? E1-E9 berapa lulus? (jangkaan 9/9 selepas branch ditukar)
   - D1-D4 siap?
   - Z1-Z5 siap? Mana yang gagal, dan operasi apa yang dicuba?
   - Pengesahan: §0 dibaca — arahan "kerja manual pengguna" DIBATALKAN

2. ACTIONS TAKEN
   - E: Production Branch SEMASA → BAHARU; hash deployment vs git ls-remote;
        target deployment; env vars (wujud/tidak, TANPA nilai); redeploy?
   - D: setiap tetapan — nilai SEMASA → BAHARU
   - Z: query yang dijalankan

3. VERIFICATION TABLE
   a) E1-E9 | URL | Jangkaan | Keputusan sebenar | Status ✅/❌ |
   b) D1-D4 | Tetapan | Nilai semasa | Nilai baharu | Status |
   c) Z1 | fungsi | owner | bypassrls | search_path terkunci? | ACL |
   d) Z2 | jadual | trigger | executes | origin (private/public) |
      ⭐ NYATAKAN SECARA EKSPLISIT: adakah mana-mana trigger memanggil
         private.validate_programme_lock() atau private.write_audit_log()?
   e) Z3 | jadual | polisi | ungkapan | fungsi private yang dirujuk |
   f) Z4 | jadual | updated_at_origin | semua_trigger_count |
   g) Z5 | fungsi | BADAN PENUH (prosrc) |

4. ISSUES / BLOCKERS
   - ⭐ Jawapan Z2 + Z5: governance lock & audit log dikuatkuasakan oleh kod
     mana, dan apa yang kod itu SEBENARNYA lakukan?
   - Z1: fungsi mana SECURITY DEFINER + owner bypassrls + TIADA search_path?
   - E1-E9 yang gagal (dengan respons sebenar)
   - Sebarang operasi yang anda tidak dapat lakukan: NAMA operasi + ralat penuh
     (ERROR/DETAIL/HINT/CONTEXT/SQLSTATE)

5. COMPLIANCE CHECKLIST
   - 17 larangan: 🟢/🔴 setiap satu
   - Pengesahan eksplisit: TIADA DROP/TRUNCATE/DELETE/ALTER/GRANT/REVOKE, dan
     TIADA fungsi private.* dilaksanakan (hanya dibaca)

6. CONCLUSION & NEXT STEP
   - Adakah produksi kini Fasa 6? (E1-E9, terutama E9)
   - Senario A atau Senario B (§5)? Berikan bukti Z2 + Z5 sebagai asas.
   - Adakah terdapat risiko keselamatan AKTIF, atau hanya sisa yatim?
   - Status D1: cadangan OFF/ON dan keputusan yang anda perlukan dari pengguna
   - Apa yang Arena perlu tulis seterusnya?
```

---

## Nota untuk Arena (bukan untuk ChatGPT)

### Urutan yang Arena cadangkan kepada pengguna

**Semua langkah di bawah ialah kerja ChatGPT, melainkan yang ditandai 👤.**

1. **Hantar PROMPT-6F kepada ChatGPT.** Ia mengandungi E + baki D + Z dalam
   satu pusingan — tiada lagi pemindahan tugas kepada pengguna.
2. Selepas E1–E9 hijau (terutama **E9**): 👤 log masuk
   `saidrazak881@gmail.com` / `masb.12345` → akan diarah ke
   `/security?required=1` → tukar kata laluan.
3. 👤 Jalankan `docs/ACTION-6-UAT-AUTH-USERS.md` (A–K, termasuk A3b/A3c).
4. 👤 Edarkan arahan kepada 19 pengguna: semua kata laluan kini `masb.12345`,
   wajib ditukar pada log masuk pertama.
5. Selepas Z2 + Z5 dilaporkan: Arena tulis **PROMPT-6G** mengikut Senario A
   (ikat semula trigger) atau Senario B (REVOKE → DROP TABLE → DROP FUNCTION).

**D1 (`Confirm email`) memerlukan keputusan pengguna** — ChatGPT diarahkan
melaporkan nilai semasa + cadangan, **bukan** menukarnya.

### Rekod pengajaran Fasa 6 — REKOD INDUK (kini 10 kesilapan Arena)

| # | Kesilapan | Punca | Dikesan oleh |
|---|-----------|------|--------------|
| 1 | V3 `policy_count = 9` | Angka dari satu fail; query mengira seluruh skema | ChatGPT |
| 2 | W1 allowlist 13 jadual | `grep "CREATE TABLE"` peka huruf besar | ChatGPT |
| 3 | Gate "D sebelum E" | Gate tanpa sebab tertulis → sekatan membuta tuli | ChatGPT (berhenti dengan betul) |
| 4 | Nota Y3 "`pg_depend` tidak jejak polisi RLS" | Dakwaan tingkah laku Postgres **tanpa diuji** | **Arena sendiri**, melalui `test-prompt-6e-y-queries.mjs` |
| 5 | "D kerja manual pengguna" + "Production Branch kerja manual pengguna" | **Membuat kesimpulan bahawa had alat dalam SATU sesi ialah sempadan keupayaan yang kekal**, lalu memindahkan tugas kepada manusia | **Pengguna** |
| 6 | Kriteria | "`private.has_role()` boleh escalate melalui INSERT ke `user_roles`" — **salah**: `WITH CHECK` yang gagal **menolak** INSERT bukan-admin | **Arena sendiri**, sebelum PROMPT-6G dihantar |
| 7 | Kriteria | E1–E9 "redirect ke" tidak menyatakan sama ada redirect **dikuti**, dan tidak menyatakan ia semakan **tanpa log masuk** — ChatGPT menahan PASS yang sepatutnya lulus | **ChatGPT** (menahan dengan betul) |
| 8 | Kriteria | Pengelasan `origin` Z2/G1 guna `information_schema.triggers.action_statement`. Postgres **tidak** mengkualifikasikan fungsi dalam `search_path` lalai, jadi selepas migrasi semua trigger kelihatan "tidak dikualifikasi" dan kriteria **GAGAL walaupun kerja betul** | **ChatGPT** (di live, semasa melaksanakan 6G) |
| 9 | Larangan | "JANGAN DROP apa-apa" terlalu luas — fail SQL yang diluluskan **sendiri** mengandungi `DROP TRIGGER IF EXISTS`. ChatGPT enggan mendakwa pematuhan literal kerana ia tidak benar | **ChatGPT** |
| 10 | Proses | H1 (snapshot SEBELUM) disenaraikan sebelum H2 tetapi prompt tidak mengarahkan ia **dijalankan dan dilapor dahulu**. ChatGPT menjalankan §2 dahulu, jadi bukti sebelum-REVOKE hilang | **ChatGPT** (melaporkannya sendiri, tidak merekanya) |

**Corak:** 7 daripada 10 ialah **kriteria yang tidak tepat**, bukan kod yang salah.
Kod dan SQL Fasa 6 berfungsi; yang berulang kali gagal ialah **cara Arena
menyatakan apa yang dikira lulus**. Hanya #4, #6 dan #8 yang Arena kesan sendiri,
dan #4 serta #6 hanya kerana Arena mula **menguji kriteria sebelum menghantar
prompt** — amalan yang kini wajib (lihat `docs/PROMPT-TEMPLATE-FASA.md`).
#8 dikesan oleh ChatGPT **di live**, iaitu tempat yang tidak boleh dicapai oleh
ujian PGlite: perbezaan tingkah laku antara PGlite dan Postgres sebenar.

### Jurang proses (bukan kesilapan kriteria)

**Jurang 5 — Arena hanya mengaudit objek yang repo cipta.** Semua audit Fasa 1–6
bermula daripada fail SQL repo. Empat fungsi `private.*` tidak pernah muncul
dalam mana-mana fail, jadi ia **tidak pernah diaudit** — sehingga Y2 ChatGPT
tersenarai skema `private` sepenuhnya. **Peraturan:** audit mesti bermula dari
**live**, bukan repo.

**Jurang 6 — `CREATE OR REPLACE` tidak melindungi apabila nama berbeza.** C13
berlaku kerana signature **sepadan** tetapi fail lama tidak dijalankan semula.
Drift ini lebih senyap: signature **tidak sepadan** (`private.*` vs `public.*`),
jadi pemasangan repo **langsung tidak menyentuh** fungsi lama, dan tiada ralat
yang akan memberitahu kami.

**Jurang 7 — "alat tidak boleh" ≠ "manusia mesti buat".** Apabila pembantu
melaporkan had alat, soalan pertama ialah **operasi mana** dan **adakah laluan
lain**, bukan pemindahan tugas. Pemindahan yang tidak disokong bukti membuang
masa manusia dan menyembunyikan punca sebenar.
