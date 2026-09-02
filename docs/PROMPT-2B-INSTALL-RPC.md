# PROMPT 2B — Pasang RPC Layer & Selesaikan Type Conflicts (Fasa 2B/2C)

> **Status:** Sedia digunakan SELEPAS laporan fasa 2A disemak dan diluluskan.
> Sasaran: projek Supabase **`lmenmfsbjgxfhnykkgow`**.
>
> **Keputusan semakan fasa 2A:**
> - ✅ Additive reconciliation fasa 2A diterima (14 jadual, 17 enum, RLS aktif).
> - ✅ **DILULUSKAN (Pendekatan A):** type conversion B1, B2, B4, B5
>   (text → enum) kerana SEMUA jadual berkaitan kosong (0 baris data).
> - ✅ **DILULUSKAN:** pasang penuh `sync-import-transaction.sql`,
>   `governance-lock.sql` dan `change-requests.sql` (fail rasmi sudah ada
>   guard `DROP FUNCTION IF EXISTS` / `DROP TRIGGER IF EXISTS` untuk
>   menggantikan kontrak legacy dengan selamat — termasuk `lock_programme`).
> - ⛔ **KEKAL TIDAK DILULUSKAN:** seed data, Auth users, storage, Vercel,
>   buang kolum legacy (B3/B6/B7), buang jadual/tipe.

---

## 📋 CARA GUNA

1. Salin keseluruhan kotak prompt di bawah (dari `--- MULA PROMPT ---`
   hingga `--- TAMAT PROMPT ---`).
2. Tampal ke ChatGPT (aktifkan **web browsing / code interpreter**).
3. ChatGPT melaksanakan fasa 2B dan melaporkan ikut FORMAT LAPORAN.
4. Selepas siap, tampal laporan itu semula kepada saya (pengguna) untuk
   semakan sebelum langkah seterusnya (seed + Auth + storage + Vercel).

---

## --- MULA PROMPT ---

> **Peranan kamu:** Jurutera pangkalan data yang teliti dan berhati-hati.
> Tugasan ini ialah **fasa 2B pemasangan** sistem TPMS MIMOS Academy.
>
> **Konteks:** Fasa 2A (additive reconciliation) telah selesai pada projek
> Supabase `lmenmfsbjgxfhnykkgow`: 14 jadual rasmi, 17 enum, RLS aktif,
> helper functions (`current_user_id`, `current_user_role`, `has_role`,
> `log_audit`) telah dipasang, dan SEMUA jadual berkaitan masih kosong
> (0 baris). Laporan fasa 2A telah disemak dan DILULUSKAN dengan keputusan
> berikut:
>
> 1. **DILULUSKAN — type conversion (Pendekatan A):** tukar jenis kolum
>    berikut daripada TEXT kepada enum rasmi (selamat kerana 0 baris data):
>    - `programmes.category` → `public.programme_category`
>    - `programmes.delivery_mode` → `public.delivery_mode`
>    - `import_staging.entity_kind` → `public.import_entity_kind`
>    - `import_staging.suggested_action` → `public.import_record_action`
> 2. **DILULUSKAN — pasang RPC layer penuh** (fail rasmi, as-is):
>    - `sync-import-transaction.sql` (RPC `sync_import_transaction` +
>      `private.append_import_audit`)
>    - `governance-lock.sql` (semua RPC lock/unlock + trigger
>      `programmes_enforce_lock` + `current_role_name` +
>      `is_unlock_approver` + `programme_is_editable`)
>    - `change-requests.sql` (RPC `submit_change_request`,
>      `review_change_request`, `cancel_change_request`,
>      `change_request_allowed_fields`)
> 3. **KEKAL TIDAK DILULUSKAN:** jangan jalankan seed, jangan sentuh
>    Auth/users, storage, Vercel; jangan buang kolum legacy (participants
>    `full_name`/`organization`/`bumiputera_status`, audit_logs
>    `action_type`/`payload`, invoices `status`); jangan buang jadual/tipe;
>    jangan ubah data sedia ada.
>
> **Sumber rasmi (MESTI muat turun SEMULA dari GitHub, branch
> `arena/01a06274-masb-pms-v4`, komit terkini):**
>
> 1. `lib/supabase/schema-master.sql`
> 2. `lib/supabase/schema-import-staging.sql`
> 3. `lib/supabase/sync-import-transaction.sql`
> 4. `lib/supabase/governance-lock.sql`
> 5. `lib/supabase/change-requests.sql`
>
> Muat turun SEMULA — jangan guna versi lama/cache. Semua fail rasmi kini
> idempotent (boleh dijalankan semula tanpa ralat).
>
> **Langkah 1 — Semakan read-only ringkas:**
>
> Jalankan query ini dan catat hasilnya dalam laporan:
> - Jenis semasa 4 kolum yang akan ditukar (`information_schema.columns`).
> - Senarai TRIGGER pada `programmes`, `participants`, `financial_docs`,
>   `import_staging`, `invoices`, `programme_costs` termasuk definisi penuh
>   (`pg_get_triggerdef`).
> - Senarai polisi RLS pada `import_batches`, `import_staging`,
>   `programme_unlock_requests`, `change_requests` (untuk semakan selepas).
>
> **Langkah 2 — Laksanakan mengikut urutan ini (setiap blok idempotent):**
>
> **Blok 1 — Re-run `schema-master.sql`** (as-is, penuh). Ia mengandungi
> DROP POLICY loop + CREATE POLICY rasmi, DROP TRIGGER + CREATE TRIGGER
> audit rasmi, DO-guard enum, CREATE TABLE/INDEX IF NOT EXISTS. Tujuan:
> memastikan polisi RLS dan trigger audit pada 10 jadual utama adalah
> TEPAT 1:1 dengan fail rasmi (membersihkan polisi legacy yang bertindih).
>
> **Blok 2 — Re-run `schema-import-staging.sql`** (as-is, penuh) supaya
> polisi RLS pada `import_batches`/`import_staging` tepat 1:1 rasmi.
>
> **Blok 3 — Type conversion (DILULUSKAN):**
>
> ```sql
> ALTER TABLE public.programmes
>   ALTER COLUMN category TYPE public.programme_category
>   USING category::public.programme_category;
>
> ALTER TABLE public.programmes
>   ALTER COLUMN delivery_mode TYPE public.delivery_mode
>   USING delivery_mode::public.delivery_mode;
>
> ALTER TABLE public.import_staging
>   ALTER COLUMN entity_kind TYPE public.import_entity_kind
>   USING entity_kind::public.import_entity_kind;
>
> ALTER TABLE public.import_staging
>   ALTER COLUMN suggested_action TYPE public.import_record_action
>   USING suggested_action::public.import_record_action;
> ```
>
> Nota teknikal:
> - Jika mana-mana kolum ada DEFAULT dalam bentuk teks yang menghalang
>   conversion, DROP DEFAULT dahulu, tukar jenis, kemudian SET DEFAULT
>   semula mengikut fail rasmi (cth. `suggested_action` default `'pending'`).
> - Jika ada CHECK constraint yang menghalang, catat definisinya dalam
>   laporan, DROP constraint tersebut, tukar jenis, dan pastikan constraint
>   yang masih perlu diwujudkan semula (atau sahkan ia tidak diperlukan
>   kerana enum sudah menguatkuasakan nilai sah).
> - JANGAN pilih nilai enum bagi pihak data legacy — jadual kosong, jadi
>   sebarang kegagalan cast bermakna ADA data/nilai yang perlu dilaporkan,
>   bukan diubah senyap.
>
> **Blok 4 — Pasang `sync-import-transaction.sql`** (as-is, penuh).
> **Blok 5 — Pasang `governance-lock.sql`** (as-is, penuh). Ini termasuk
> `DROP FUNCTION IF EXISTS public.lock_programme(uuid, text)` dan RPC
> unlock lain — ia adalah sebahagian fail rasmi dan DILULUSKAN untuk
> dilaksanakan (menggantikan kontrak legacy `RETURNS programmes` dengan
> rasmi `RETURNS void`).
> **Blok 6 — Pasang `change-requests.sql`** (as-is, penuh).
>
> **Blok 7 — Trigger legacy audit yang bertindih:**
>
> - Jika jadual `programmes`, `participants` atau `financial_docs` masih
>   mempunyai trigger legacy yang memanggil fungsi `private.write_audit_log`
>   (iaitu trigger audit LAMA yang menulis ke kolum legacy `action_type`/
>   `payload`), DROP trigger tersebut sahaja (bukan fungsinya) kerana
>   trigger audit RASMI kini sudah dipasang oleh Blok 1 — mengekalkan kedua-
>   duanya akan menghasilkan audit DUPLIKAT. Catat definisi asal trigger
>   yang dibuang dalam laporan (untuk tujuan pemulihan).
> - Trigger `private.set_updated_at` (jika ada): KEKALKAN (ia berguna dan
>   tidak bertindih).
> - Trigger `private.validate_programme_lock` (jika ada): JANGAN drop dulu.
>   Catat definisi penuhnya dalam laporan dan analisis: adakah ia mengambil
>   kira tetingkap `unlock_expires_at > now()`? Jika TIDAK, ia bercanggah
>   dengan model rasmi (suntingan dibenarkan semasa tetingkap unlock) —
>   laporkan ini sebagai isu + cadangan, JANGAN drop tanpa kebenaran.
>
> **Langkah 3 — Pengesahan selepas pemasangan:**
>
> Jalankan dan catat hasil:
> 1. Jenis kolum selepas conversion:
>    ```sql
>    select table_name, column_name, data_type, udt_name
>    from information_schema.columns
>    where (table_name = 'programmes' and column_name in ('category','delivery_mode'))
>       or (table_name = 'import_staging' and column_name in ('entity_kind','suggested_action'));
>    ```
> 2. Fungsi/RPC rasmi wujud (nama + tandatangan + return type):
>    ```sql
>    select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid),
>           pg_get_function_result(p.oid)
>    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
>    where p.proname in (
>      'sync_import_transaction','append_import_audit',
>      'current_role_name','is_unlock_approver','programme_is_editable',
>      'request_programme_unlock','review_programme_unlock','lock_programme',
>      'cancel_programme_unlock','expire_stale_unlocks','enforce_programme_lock',
>      'change_request_allowed_fields','submit_change_request',
>      'review_change_request','cancel_change_request'
>    ) order by n.nspname, p.proname;
>    ```
> 3. Trigger rasmi:
>    ```sql
>    select event_object_table, trigger_name
>    from information_schema.triggers
>    where trigger_name in ('programmes_audit_trigger','participants_audit_trigger',
>      'financial_docs_audit_trigger','programmes_enforce_lock');
>    ```
> 4. Polisi RLS rasmi pada jadual terurus.
> 5. **Ujian fungsi yang SELAMAT** (tiada perubahan data — JANGAN panggil
>    `lock_programme`, `submit_change_request`, `sync_import_transaction`
>    atau sebarang RPC yang menulis data):
>    ```sql
>    select public.current_role_name();
>    select public.current_user_role();
>    select public.has_role('admin'::public.app_role);
>    select public.change_request_allowed_fields();
>    select public.programme_is_editable('<uuid-sebuah-program>'); -- jika ada
>    ```
>    Catat output setiap satu (ralat pun perlu dilaporkan).
>
> **Larangan keras:**
> - JANGAN jalankan `seed-v4-raw.sql` dalam tugasan ini.
> - JANGAN cipta Auth users / user_profiles / storage bucket / Vercel.
> - JANGAN buang kolum legacy (B3/B6/B7) atau jadual/tipe.
> - JANGAN ubah/padam data sedia ada.
> - JANGAN panggil RPC yang menulis data (lock_programme, submit_*,
>   review_*, sync_import_transaction) — ujian hanya baca sahaja.
> - JANGAN guna `CREATE TYPE IF NOT EXISTS` atau `with_check` (sintaks
>   tidak sah) — semua fail rasmi sudah menggunakan corak yang betul.
>
> **FORMAT LAPORAN (WAJIB PENUH):**
>
> ```text
> 📋 LAPORAN FASA 2B — RPC LAYER & TYPE CONVERSION
> ================================================
> 0. RINGKASAN EKSEKUTIF
>    - Status keseluruhan: ✅ BERJAYA / ⚠️ SEBAHAGIAN / ❌ GAGAL
>    - Blok dilaksanakan: (N) berjaya / (N) gagal
>    - RPC rasmi dipasang: (N) daripada (N)
>    - Menunggu kebenaran: (N) item
>
> 1. TYPE CONVERSION (B1/B2/B4/B5) — per kolum:
>    KOLUM: public.<jadual>.<kolum>
>    JENIS LAMA: text → JENIS BARU: <enum>
>    STATUS: ✅ ditukar / ❌ gagal (serta sebab)
>    SKRIP: (blok SQL yang dijalankan)
>    QUERY PENGESAHAN + OUTPUT: (hasil sebenar)
>    ISU: (cth. default/constraint yang terpaksa diuruskan)
>
> 2. RPC LAYER — per fail:
>    FAIL: sync-import-transaction.sql
>    STATUS: ✅ / ❌ + ralat
>    FUNGSI DIPASANG: (senarai + tandatangan + return type)
>    FAIL: governance-lock.sql
>    STATUS: ... (termasuk lock_programme: konfirmasi return type kini void)
>    FAIL: change-requests.sql
>    STATUS: ...
>
> 3. TRIGGER:
>    - Trigger rasmi disahkan: (senarai)
>    - Trigger legacy dibuang (dengan definisi asal): (senarai)
>    - Trigger legacy dikekalkan: (senarai + sebab)
>    - validate_programme_lock: definisi penuh + analisis konflik + cadangan
>
> 4. POLISI RLS: per jadual terurus — senarai polisi rasmi wujud; polisi
>    legacy yang dibuang oleh Blok 1/2 (jika ada)
>
> 5. UJIAN FUNGSI SELAMAT: (senarai panggilan + output sebenar)
>
> 6. ISU / AMARAN: (sebarang ralat atau perkara mencurigakan)
>
> 7. LANGKAH SETERUSNYA (cadangan, JANGAN laksana sendiri):
>    seed-v4-raw.sql → Auth users + user_profiles → storage bucket →
>    deploy Vercel → ujian end-to-end
> ```
>
> **Penting:** Laporan mesti lengkap dengan skrip, query pengesahan dan
> OUTPUT SEBENAR untuk setiap blok — supaya saya boleh semak tanpa
> bergantung pada anda.

---

## --- TAMAT PROMPT ---

---

## Nota untuk pengguna (bukan sebahagian prompt)

- Selepas laporan 2B diterima, semak: (1) keempat-empat kolum bertukar ke
  enum, (2) semua RPC wujud, (3) trigger `programmes_enforce_lock` wujud,
  (4) tiada RPC write dipanggil semasa ujian, (5) isu `validate_programme_lock`.
- Selepas laporan 2B diluluskan, langkah seterusnya ialah **Prompt #3**:
  jalankan `seed-v4-raw.sql`, cipta Auth users + `user_profiles` (role:
  viewer, executive, manager, admin, staff, finance, head_governance),
  dan bucket storage. (Prompt #3 akan disediakan selepas laporan 2B disemak.)
