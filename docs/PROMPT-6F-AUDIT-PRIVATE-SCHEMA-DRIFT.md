# PROMPT 6F — Z1–Z5: adakah `private.*` pra-repo masih memegang governance lock & audit log?

> **Persona kamu:** Jurutera pangkalan data yang teliti dan berhati-hati
> (`docs/personas/PERSONA-SQL-ARCHITECT.md`).
>
> **Keadaan:** PROMPT-6E dijalankan. **E = 0/9 PASS** dan anda membuktikan
> dengan bukti live bahawa Production masih Fasa 5 (`MfaGuard` masih dimuatkan,
> `/register` `/forgot-password` `/admin/users` = 404). **Y1–Y4 selesai.**
> Anda berhenti dengan betul apabila connector tiada operasi untuk menukar
> Vercel Production Branch.
>
> **Arena menerima laporan anda tanpa pengecualian.** Anda tidak mereka apa-apa,
> dan anda mengesahkan empat fail Fasa 6 wujud pada branch sasaran melalui SHA
> blob — itu pengesahan kandungan, bukan andaian.
>
> **Keputusan Arena:**
> 1. 🔴 **E masih blocked.** Penukaran Production Branch ialah **kerja manual
>    pengguna di Vercel Dashboard** — bukan kerja Arena, dan bukan kerja anda.
>    Lihat §1.
> 2. 🟢 **Z1–Z5 DILULUSKAN (READ-ONLY).** Y2 anda mendedahkan sesuatu yang lebih
>    besar daripada `private.has_role()`. Lihat §2 — ini sebab prompt ini wujud.
> 3. ⛔ **TIADA kelulusan DROP / REVOKE / ALTER / CREATE.** Termasuk kelima-lima
>    fungsi `private`.
> 4. ✅ **D2 sudah selesai** — pengguna telah menambah
>    `https://masb-pms-v4.vercel.app/security**` ke Redirect URLs.

---

## 1. Blocker E — siapa buat apa

Anda menulis: *"Arena perlu buat satu perkara sahaja untuk meneruskan E: tukar
Vercel → Settings → Git → Production Branch."*

**Pembetulan penting tentang pembahagian kerja:** Arena **tidak pernah**
mempunyai capaian kepada Vercel atau Supabase. Arena hanya menulis kod/SQL dalam
repo GitHub dan menyediakan prompt. **Semua kerja Vercel dan Supabase ialah
tanggungjawab anda dan pengguna** — itu perjanjian operasi projek ini.

Oleh kerana connector anda tiada operasi mutation untuk Git settings, tugas itu
jatuh kepada **pengguna, secara manual**:

```
Vercel Dashboard → projek masb-pms-v4
  → Settings → Git → Production Branch
  → tukar kepada: arena/01a06274-masb-pms-v4
  → Save
```

**Selepas pengguna melakukannya, anda jalankan semula E1–E9.** Jangan jalankan
E1–E9 sebelum pengguna mengesahkan penukaran itu — ia akan gagal semula dengan
cara yang sama dan membazir satu pusingan.

**Yang anda boleh buat sekarang tanpa menunggu: Z1–Z5.**

---

## 2. Kenapa Z wujud — penemuan Arena daripada Y2 anda

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

## 3. Z1–Z5 — READ-ONLY, katalog dahulu

**Reka bentuk:** anda membuktikan dalam PROMPT-6E bahawa connector anda boleh
baca `pg_proc` metadata (Y1/Y2 berjaya) tetapi **`pg_proc.prosrc` tidak
tersedia** (X2 gagal). Jadi **Z1–Z4 menggunakan katalog sahaja** dan **Z5 ialah
percubaan terakhir** untuk `prosrc` — jika dihalang, laporkan ralat dan
**teruskan**.

**Tiada DDL/DML/GRANT/REVOKE. Tiada pelaksanaan fungsi.**

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
| Z5 | Badan sebenar kelima-lima fungsi | Jawapan muktamad. Jika dihalang, Z1–Z4 tetap mencukupi untuk merancang |

**Jika mana-mana Z gagal dengan ralat kebenaran, tampal ralat PENUH**
(ERROR / DETAIL / HINT / CONTEXT / SQLSTATE) dan **teruskan ke Z seterusnya**.
Jangan hentikan keseluruhan laporan.

**Semua query Z telah diuji oleh Arena terhadap PGlite** dalam
`scripts/test-prompt-6f-z-queries.mjs` (sah secara sintaks, read-only, tidak
melaksanakan fungsi). Jika ada yang gagal di live, puncanya ialah **kebenaran
connector**, bukan sintaks.

---

## 4. Rancangan Arena selepas Z (BELUM diluluskan)

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

## 5. Status 3 jadual warisan (kekal TANGGUH)

Bukti anda setakat ini:

| Jadual | Baris (W3/Y4) | Privilej `authenticated` (X4) | Polisi (X5/Y3) | Status |
| ------ | ------------- | ------------------------------ | -------------- | ------ |
| `programme_participants` | 0 | FULL (termasuk TRUNCATE, REFERENCES) | 4 polisi → `private.has_role()` | 🟠 Kandidat DROP paling bersih — **TANGGUH** |
| `profiles` | 1 | FULL | 3 polisi → `private.has_role()` | 🟡 Perlu tahu sama ada 1 baris itu salinan lapuk `user_profiles` — **TANGGUH** |
| `user_roles` | 1 (`role = admin`) | FULL | 2 polisi → `private.has_role()` | 🟡 **TANGGUH** — anda betul tidak mencetak PII |

**Arena bersetuju dengan kesimpulan anda:** ketiga-tiganya belum boleh
diputuskan. Z2/Z3 mungkin mendedahkan kebergantungan tambahan.

---

## 6. Larangan (kekal)

1. JANGAN ubah logik perniagaan dalam SQL.
2. JANGAN jalankan sebarang DDL/DML/GRANT/REVOKE. **Z1–Z5 read-only sepenuhnya.**
3. JANGAN `DROP`/`TRUNCATE`/`DELETE`/`ALTER` jadual warisan **atau** mana-mana
   fungsi `private.*`.
4. JANGAN guna `service_role`.
5. JANGAN panggil RPC perniagaan atau `admin_*`.
6. JANGAN merge ke `main`.
7. JANGAN tukar Production Branch (ia kerja manual pengguna; dan jika connector
   anda dapat keupayaan itu kelak, **jangan** guna tanpa Arahan baharu).
8. JANGAN tampal anon key / secret penuh.
9. JANGAN cetak PII, `default_password`, atau kolum sensitif. **Anda sudah
   melakukan ini dengan betul dalam Y4 — teruskan.**
10. JANGAN reka bukti — terutamanya E1–E9 dan Z1–Z5.
11. JANGAN anggap Mod Demo tempatan sebagai produksi.
12. JANGAN guna hash komit tetap sebagai kriteria.
13. JANGAN cuba menjalankan D.
14. **JANGAN melaksanakan mana-mana fungsi `private.*`** — Z hanya baca katalog.
15. **JANGAN jalankan semula E1–E9 sehingga pengguna mengesahkan Production
    Branch telah ditukar.**

---

## 7. FORMAT LAPORAN (6 seksyen)

```
📋 LAPORAN PROMPT-6F — Z1–Z5 (DRIFT PRA-REPO)
==============================================

1. CONTEXT & STATUS
   - Status keseluruhan: 🟢 / 🟡 / 🔴
   - Z1-Z5: mana selesai, mana dihalang connector?
   - Production Branch sudah ditukar oleh pengguna? (ya/tidak)
   - Pengesahan: E1-E9 TIDAK diulang jika branch belum ditukar

2. ACTIONS TAKEN
   - Query Z yang dijalankan

3. VERIFICATION TABLE
   a) Z1 | fungsi | owner | bypassrls | search_path terkunci? | ACL |
   b) Z2 | jadual | trigger | executes | origin (private/public) |
      ⭐ NYATAKAN SECARA EKSPLISIT: adakah mana-mana trigger memanggil
         private.validate_programme_lock() atau private.write_audit_log()?
   c) Z3 | jadual | polisi | ungkapan | fungsi private yang dirujuk |
   d) Z4 | jadual | trigger_count | ada private? |
   e) Z5 | fungsi | source (atau ralat penuh jika dihalang) |

4. ISSUES / BLOCKERS
   - ⭐ Jawapan Z2: governance lock & audit log dikuatkuasakan oleh kod mana?
   - Z1: fungsi mana SECURITY DEFINER + owner bypassrls + TIADA search_path?
   - Z5: jika dihalang, ralat penuh (ERROR/DETAIL/HINT/CONTEXT/SQLSTATE)
   - Adakah Z2/Z3 mendedahkan kebergantungan private.* yang BAHARU
     (selain has_role)?

5. COMPLIANCE CHECKLIST
   - 15 larangan: 🟢/🔴 setiap satu
   - Pengesahan eksplisit: TIADA DROP/TRUNCATE/DELETE/ALTER/GRANT/REVOKE,
     dan TIADA fungsi private.* dilaksanakan

6. CONCLUSION & NEXT STEP
   - Senario A atau Senario B (§4)? Berikan bukti Z2 sebagai asas.
   - Adakah terdapat risiko keselamatan aktif, atau hanya sisa yatim?
   - Apa yang Arena perlu tulis seterusnya?
   - Status E: apa yang masih menghalang?
```

---

## Nota untuk Arena (bukan untuk ChatGPT)

### Tindakan pengguna — dua perkara

**1. Tukar Production Branch di Vercel (ini mengunblock E):**

```
https://vercel.com  → projek masb-pms-v4
  → Settings → Git → Production Branch
  → arena/01a06274-masb-pms-v4
  → Save
```

Sambil berada di **Settings → Environment Variables**, sahkan sendiri
(kerana ChatGPT tidak dapat mengesahkannya melalui connector):
`NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` wujud untuk
**Production** dan **Preview**. Jangan kongsi nilainya dengan sesiapa.

**2. Hantar PROMPT-6F kepada ChatGPT** — Z1–Z5 boleh dijalankan **serta-merta**,
tidak perlu menunggu penukaran branch.

**Selepas branch ditukar:** beritahu ChatGPT, dan ia akan jalankan semula
E1–E9. Kemudian log masuk `saidrazak881@gmail.com` / `masb.12345` →
`/security?required=1` → tukar kata laluan → `docs/ACTION-6-UAT-AUTH-USERS.md`.

### Rekod pengajaran Fasa 6 (kini 4 kesilapan Arena)

| # | Kesilapan | Punca | Dikesan oleh |
|---|-----------|------|--------------|
| 1 | V3 `policy_count = 9` | Angka dari satu fail; query mengira seluruh skema | ChatGPT |
| 2 | W1 allowlist 13 jadual | `grep "CREATE TABLE"` peka huruf besar | ChatGPT |
| 3 | Gate "D sebelum E" | Gate tanpa sebab tertulis → sekatan membuta tuli | ChatGPT (berhenti dengan betul) |
| 4 | Nota Y3 "`pg_depend` tidak jejak polisi RLS" | Dakwaan tingkah laku Postgres **tanpa diuji** | **Arena sendiri**, melalui `test-prompt-6e-y-queries.mjs` sebelum prompt dihantar |

### Pengajaran baharu daripada PROMPT-6E (bukan kesilapan Arena, tetapi jurang proses)

**Jurang 5 — Arena hanya mengaudit objek yang repo cipta, bukan objek yang live
mempunyai.** Semua audit Fasa 1–6 bermula daripada fail SQL repo. Empat fungsi
`private.*` tidak pernah muncul dalam mana-mana fail, jadi ia **tidak pernah
diaudit** — sehingga Y2 ChatGPT tersenarai skema `private` sepenuhnya.

**Peraturan baharu:** audit mesti bermula dari **live** (`\df private.*`,
`information_schema.triggers`), bukan dari repo. Repo memberitahu apa yang
**kami** cipta; live memberitahu apa yang **sebenar** ada. Jurang antara
keduanya ialah tempat drift sembunyi.

**Jurang 6 — `CREATE OR REPLACE` tidak melindungi kami apabila nama berbeza.**
C13 berlaku kerana signature **sepadan** tetapi fail lama tidak dijalankan
semula. Drift ini lebih senyap: signature **tidak sepadan** (`private.*` vs
`public.*`), jadi pemasangan repo **langsung tidak menyentuh** fungsi lama, dan
tiada ralat yang akan memberitahu kami.
