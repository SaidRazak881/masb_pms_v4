# PROMPT 2C — Blocker Resolution: View Legacy + Type Conversion + RPC Layer

> **Status:** Sedia digunakan SELEPAS laporan fasa 2B disemak dan diluluskan.
> Sasaran: projek Supabase **`lmenmfsbjgxfhnykkgow`**.
>
> **Keputusan semakan fasa 2B (blocker `view_programme_reports`):**
> - ✅ Disahkan: `view_programme_reports` TIDAK wujud dalam mana-mana fail
>   SQL rasmi repositori dan TIDAK dirujuk oleh kod aplikasi TPMS — ia
>   objek legacy semata-mata pada database live.
> - ✅ Disahkan: fungsi rasmi `public.enforce_programme_lock()` MENGHORMATI
>   unlock window (`unlock_expires_at > now()` dibenarkan update) dan
>   menggantikan keperluan trigger legacy `private.validate_programme_lock()`.
> - ✅ Disahkan: `import_entity_kind` mengandungi nilai `'unknown'`
>   (default live `entity_kind` sah); `import_record_action` TIDAK
>   mengandungi `'new'` (default live `suggested_action` perlu diurus).
> - ✅ **DILULUSKAN dengan syarat** (di bawah) — drop view legacy, type
>   conversion, pasang RPC layer, dan ganti trigger legacy.

---

## 📋 CARA GUNA

1. Salin keseluruhan kotak prompt di bawah (dari `--- MULA PROMPT ---`
   hingga `--- TAMAT PROMPT ---`).
2. Tampal ke ChatGPT (aktifkan **web browsing / code interpreter**).
3. ChatGPT melaksanakan fasa 2C dan melaporkan ikut FORMAT LAPORAN.
4. Selepas siap, tampal laporan itu semula kepada saya (pengguna) untuk
   semakan sebelum langkah seterusnya (seed + Auth + storage + Vercel).

---

## --- MULA PROMPT ---

> **Peranan kamu:** Jurutera pangkalan data yang teliti dan berhati-hati.
> Tugasan ini ialah **fasa 2C (blocker resolution)** pemasangan TPMS MIMOS
> Academy pada projek Supabase `lmenmfsbjgxfhnykkgow`.
>
> **Konteks:** Fasa 2B dihentikan pada blocker: `view_programme_reports`
> (view legacy) bergantung pada `programmes.category`, menyebabkan
> PostgreSQL menolak type conversion. Keputusan berikut telah DIBUAT dan
> DILULUSKAN oleh pengguna selepas semakan kod:
>
> 1. `view_programme_reports` ialah objek LEGACY — tiada dalam fail SQL
>    rasmi, tiada rujukan dalam aplikasi. **DILULUSKAN untuk di-drop**
>    (dengan syarat: rekod definisi penuh dahulu; semak dependency).
> 2. Type conversion 4 kolum (B1/B2/B4/B5) **DILULUSKAN** — jadual
>    berkaitan kosong (0 baris).
> 3. RPC layer penuh (sync, governance, change-requests) **DILULUSKAN**
>    untuk dipasang as-is daripada fail rasmi.
> 4. Trigger legacy audit bertindih + `trg_validate_programme_lock`
>    **DILULUSKAN untuk diganti** (fungsi `private.*` KEKAL, jangan drop).
> 5. **KEKAL TIDAK DILULUSKAN:** seed, Auth/users, storage, Vercel, buang
>    kolum legacy (B3/B6/B7), buang jadual/tipe/fungsi `private.*`, ubah
>    data sedia ada.
>
> **Sumber rasmi (MESTI muat turun SEMULA dari GitHub, branch
> `arena/01a05cd4-masb-pms-v4`, komit terkini — jangan guna cache):**
>
> 1. `lib/supabase/schema-master.sql`
> 2. `lib/supabase/schema-import-staging.sql`
> 3. `lib/supabase/sync-import-transaction.sql`
> 4. `lib/supabase/governance-lock.sql`
> 5. `lib/supabase/change-requests.sql`
>
> **Langkah 1 — Rekod & semak view legacy (READ-ONLY dahulu):**
>
> ```sql
> -- Definisi penuh view
> select pg_get_viewdef('public.view_programme_reports', true);
>
> -- Objek yang BERGANTUNG pada view ini (adakah apa-apa lagi guna ia?)
> select distinct dependent.relname as dependent_object,
>        dependent.relkind,
>        ns.nspname as dependent_schema
> from pg_depend d
> join pg_rewrite r on r.oid = d.objid
> join pg_class dependent on dependent.oid = r.ev_class
> join pg_namespace ns on ns.oid = dependent.relnamespace
> where d.refobjid = 'public.view_programme_reports'::regclass;
>
> -- Senarai view lain yang mungkin legacy (untuk rekod sahaja)
> select table_name from information_schema.views
> where table_schema = 'public' order by table_name;
> ```
>
> Rekodkan semua output dalam laporan.
>
> **KEPUTUSAN BERSYARAT (diluluskan):**
> - Jika TIDAK ada objek lain yang bergantung pada `view_programme_reports`
>   (selain objek legacy yang juga akan dibuang/tiada kaitan), maka
>   **DROP view**:
>   ```sql
>   DROP VIEW IF EXISTS public.view_programme_reports;
>   ```
>   JANGAN cipta semula — ia bukan sebahagian skema rasmi.
> - Jika ADA objek bukan-legacy yang bergantung padanya, JANGAN drop —
>   hentikan dan laporkan.
> - View legacy lain yang didapati dalam `information_schema.views`:
>   JANGAN sentuh, hanya rekod dalam laporan.
>
> **Langkah 2 — Type conversion (DILULUSKAN):**
>
> Jalankan sebagai SATU transaksi:
>
> ```sql
> BEGIN;
>
> -- 2a. programmes.category
> ALTER TABLE public.programmes
>   ALTER COLUMN category DROP DEFAULT;
> ALTER TABLE public.programmes
>   ALTER COLUMN category TYPE public.programme_category
>   USING category::public.programme_category;
> ALTER TABLE public.programmes
>   ALTER COLUMN category SET DEFAULT 'Non-Training'::public.programme_category;
>
> -- 2b. programmes.delivery_mode
> ALTER TABLE public.programmes
>   ALTER COLUMN delivery_mode DROP DEFAULT;
> ALTER TABLE public.programmes
>   ALTER COLUMN delivery_mode TYPE public.delivery_mode
>   USING delivery_mode::public.delivery_mode;
> ALTER TABLE public.programmes
>   ALTER COLUMN delivery_mode SET DEFAULT 'physical'::public.delivery_mode;
>
> -- 2c. import_staging.entity_kind (default 'unknown' ialah nilai enum sah)
> ALTER TABLE public.import_staging
>   ALTER COLUMN entity_kind DROP DEFAULT;
> ALTER TABLE public.import_staging
>   ALTER COLUMN entity_kind TYPE public.import_entity_kind
>   USING entity_kind::public.import_entity_kind;
> ALTER TABLE public.import_staging
>   ALTER COLUMN entity_kind SET DEFAULT 'unknown'::public.import_entity_kind;
>
> -- 2d. import_staging.suggested_action (default 'new' BUKAN nilai enum rasmi
> --     -> tukar default kepada 'pending' mengikut fail rasmi)
> ALTER TABLE public.import_staging
>   ALTER COLUMN suggested_action DROP DEFAULT;
> ALTER TABLE public.import_staging
>   ALTER COLUMN suggested_action TYPE public.import_record_action
>   USING suggested_action::public.import_record_action;
> ALTER TABLE public.import_staging
>   ALTER COLUMN suggested_action SET DEFAULT 'pending'::public.import_record_action;
>
> COMMIT;
> ```
>
> - Jika ada CHECK constraint yang menghalang conversion, rekod definisinya,
>   drop constraint tersebut, jalankan conversion, dan lapor sama ada
>   constraint itu perlu diwujudkan semula (biasanya tidak perlu kerana
>   enum sudah menguatkuasakan nilai sah). JANGAN pilih nilai enum bagi
>   pihak data — jika cast gagal, HENTIKAN dan laporkan nilai yang
>   menyebabkan kegagalan (jadual dijangka kosong).
> - Jika transaksi gagal, JANGAN cuba alternatif sendiri — laporkan ralat
>   penuh dan hentikan.
>
> **Langkah 3 — Pasang RPC layer (DILULUSKAN, as-is):**
>
> Jalankan fail-fail berikut SEPENUHNYA mengikut urutan (setiap satu
> sebagai transaksi berasingan):
>
> 1. `lib/supabase/schema-master.sql` — re-run penuh (idempotent):
>    menyeragamkan polisi RLS rasmi pada 10 jadual terurus, trigger audit
>    rasmi (programmes/participants/financial_docs), enum DO-guard.
> 2. `lib/supabase/schema-import-staging.sql` — re-run penuh (idempotent):
>    polisi RLS rasmi import_batches/import_staging.
> 3. `lib/supabase/sync-import-transaction.sql` — pasang
>    `private.append_import_audit` + `public.sync_import_transaction`.
> 4. `lib/supabase/governance-lock.sql` — pasang semua RPC lock/unlock +
>    `current_role_name` + `is_unlock_approver` + `programme_is_editable`
>    + trigger `programmes_enforce_lock`. Fail ini mengandungi
>    `DROP FUNCTION IF EXISTS public.lock_programme(uuid, text)` dan RPC
>    unlock lain — ia sebahagian fail rasmi dan DILULUSKAN (menggantikan
>    kontrak legacy `RETURNS programmes` dengan `RETURNS void`).
> 5. `lib/supabase/change-requests.sql` — pasang semua RPC change request.
>
> Selepas SETIAP fail, jalankan semula fail tersebut SEKALI LAGI untuk
> membuktikan ia idempotent (tiada ralat pada run kedua). Rekod hasil.
>
> **Langkah 4 — Ganti trigger legacy (DILULUSKAN dengan syarat):**
>
> Selepas Langkah 3, pada jadual yang kini mempunyai trigger audit RASMI,
> buang trigger audit LEGACY yang memanggil `private.write_audit_log()`
> untuk mengelak audit DUPLIKAT. Untuk SETIAP trigger: rekod definisi asal
> (`pg_get_triggerdef`) dahulu, kemudian:
>
> ```sql
> DROP TRIGGER IF EXISTS trg_audit_programmes ON public.programmes;
> DROP TRIGGER IF EXISTS trg_audit_participants ON public.participants;
> DROP TRIGGER IF EXISTS trg_audit_import_staging ON public.import_staging;
> DROP TRIGGER IF EXISTS trg_audit_invoices ON public.invoices;
> DROP TRIGGER IF EXISTS trg_audit_programme_costs ON public.programme_costs;
> ```
>
> (Sesuaikan senarai dengan apa yang wujud — jangan andaikan. Trigger pada
> jadual yang TIDAK ada trigger audit rasmi: laporkan sahaja, jangan buang.)
>
> Untuk `trg_validate_programme_lock`:
> - Rekod definisi penuh `private.validate_programme_lock()` dan
>   `pg_get_triggerdef` trigger tersebut dalam laporan.
> - **DILULUSKAN untuk DROP** trigger ini kerana ia digantikan oleh
>   `programmes_enforce_lock` RASMI (yang menghormati unlock window
>   `unlock_expires_at > now()`):
>   ```sql
>   DROP TRIGGER IF EXISTS trg_validate_programme_lock ON public.programmes;
>   ```
> - Fungsi `private.validate_programme_lock()` KEKAL (jangan drop fungsi).
>
> Trigger `*_updated_at` (private.set_updated_at): **KEKALKAN SEMUA** —
> jangan buang, ia berguna dan tidak bertindih.
>
> Fungsi `private.write_audit_log`, `private.set_updated_at`,
> `private.validate_programme_lock`: **KEKALKAN** (jangan drop fungsi).
>
> **Langkah 5 — Pengesahan penuh (read-only):**
>
> ```sql
> -- 1. Jenis kolum selepas conversion
> select table_name, column_name, data_type, udt_name, column_default
> from information_schema.columns
> where (table_name = 'programmes' and column_name in ('category','delivery_mode'))
>    or (table_name = 'import_staging' and column_name in ('entity_kind','suggested_action'));
>
> -- 2. RPC rasmi wujud
> select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid),
>        pg_get_function_result(p.oid)
> from pg_proc p join pg_namespace n on n.oid = p.pronamespace
> where p.proname in (
>   'sync_import_transaction','append_import_audit',
>   'current_role_name','is_unlock_approver','programme_is_editable',
>   'request_programme_unlock','review_programme_unlock','lock_programme',
>   'cancel_programme_unlock','expire_stale_unlocks','enforce_programme_lock',
>   'change_request_allowed_fields','submit_change_request',
>   'review_change_request','cancel_change_request'
> ) order by n.nspname, p.proname;
>
> -- 3. Trigger rasmi
> select event_object_table, trigger_name
> from information_schema.triggers
> where trigger_name in ('programmes_audit_trigger','participants_audit_trigger',
>   'financial_docs_audit_trigger','programmes_enforce_lock');
>
> -- 4. Trigger legacy yang tinggal pada jadual terurus
> select event_object_table, trigger_name
> from information_schema.triggers
> where event_object_table in ('programmes','participants','financial_docs',
>   'import_staging','invoices','programme_costs')
> order by 1,2;
>
> -- 5. View legacy masih wujud?
> select table_name from information_schema.views where table_schema = 'public';
>
> -- 6. Ujian baca-sahaja (JANGAN panggil RPC yang menulis data)
> select public.current_role_name();
> select public.current_user_role();
> select public.has_role('admin'::public.app_role);
> select public.change_request_allowed_fields();
> ```
>
> Rekod SEMUA output sebenar dalam laporan.
>
> **Larangan keras:**
> - JANGAN jalankan seed, JANGAN sentuh Auth/users/storage/Vercel.
> - JANGAN buang kolum legacy (B3/B6/B7), jadual, tipe, atau fungsi
>   `private.*`.
> - JANGAN panggil RPC yang menulis data (`lock_programme`,
>   `submit_change_request`, `review_change_request`,
>   `sync_import_transaction`) — ujian hanya baca sahaja.
> - JANGAN guna `CREATE TYPE IF NOT EXISTS` / `with_check` / tulis semula
>   logik rasmi — guna fail rasmi apa adanya.
>
> **FORMAT LAPORAN (WAJIB PENUH):**
>
> ```text
> 📋 LAPORAN FASA 2C — BLOCKER RESOLUTION
> =======================================
> 0. RINGKASAN EKSEKUTIF
>    - Status: ✅ BERJAYA / ⚠️ SEBAHAGIAN / ❌ GAGAL
>    - Blok: view drop, type conversion, RPC layer, trigger cleanup, verification
>    - Setiap blok: ✅ / ❌
>
> 1. VIEW LEGACY
>    - Definisi penuh view_programme_reports (pg_get_viewdef)
>    - Objek bergantung: (hasil query pg_depend — kosong/senarai)
>    - View lain di live (rekod sahaja): (senarai)
>    - TINDAKAN: ✅ DROP (definisi disimpan di atas) / ⛔ tidak di-drop + sebab
>
> 2. TYPE CONVERSION — per kolum:
>    KOLUM: ... | JENIS LAMA → BARU | DEFAULT LAMA → BARU
>    STATUS: ✅ / ❌
>    SKRIP: (yang dijalankan) | QUERY PENGESAHAN + OUTPUT: (sebenar)
>
> 3. RPC LAYER — per fail (termasuk bukti idempotent: run kedua tiada ralat):
>    FAIL: ... | STATUS: ✅ | FUNGSI: (senarai)
>
> 4. TRIGGER:
>    - Dibuang (dengan definisi asal): (senarai)
>    - Dikekalkan (*_updated_at): (senarai)
>    - validate_programme_lock: definisi penuh + analisis + tindakan
>    - Trigger rasmi disahkan: (senarai)
>
> 5. POLISI RLS: ringkasan polisi rasmi pada jadual terurus
>
> 6. UJIAN BACA-SAHAJA: (panggilan + output sebenar)
>
> 7. ISU / AMARAN: (sebarang ralat, atau perkara mencurigakan)
>
> 8. LANGKAH SETERUSNYA (cadangan, JANGAN laksana sendiri):
>    seed-v4-raw.sql → Auth users + user_profiles → storage bucket →
>    deploy Vercel → ujian end-to-end
> ```
>
> **Penting:** Laporan mesti lengkap dengan skrip, query pengesahan dan
> OUTPUT SEBENAR — supaya saya boleh semak tanpa bergantung pada anda.

---

## --- TAMAT PROMPT ---

---

## Nota untuk pengguna (bukan sebahagian prompt)

- Selepas laporan 2C diterima, semak: (1) view legacy di-drop + definisi
  direkod, (2) keempat-empat kolum bertukar ke enum dengan default betul,
  (3) semua RPC wujud + fail idempotent (run kedua lulus), (4) trigger
  audit legacy dibuang, trigger `programmes_enforce_lock` wujud, (5) tiada
  RPC write dipanggil semasa ujian.
- Selepas laporan 2C diluluskan, langkah seterusnya ialah **Prompt #3**:
  jalankan `seed-v4-raw.sql`, cipta Auth users + `user_profiles`, dan
  bucket storage. (Prompt #3 akan disediakan selepas laporan 2C disemak.)
