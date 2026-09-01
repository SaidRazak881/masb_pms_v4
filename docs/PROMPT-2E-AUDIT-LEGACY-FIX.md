# PROMPT 2E — Fix Kolum Legacy NOT NULL + Ujian Audit Rasmi + Seed

> **Status:** Sedia digunakan SELEPAS laporan fasa 2D disemak dan diluluskan.
> Sasaran: projek Supabase **`lmenmfsbjgxfhnykkgow`**.
>
> **Keputusan semakan fasa 2D:**
> - ✅ 2D diterima: 3 trigger legacy audit di-drop (dengan definisi direkod
>   dan ujian rollback yang membuktikan masalah), `lock_reason` → enum
>   `programme_lock_reason` NOT NULL DEFAULT `'manual'`, RLS rasmi 38/38.
> - 🔴 **Blocker yang ditemui GPT (SAH):** kolum legacy `audit_logs.action_type`
>   adalah `NOT NULL` tanpa default di live, tetapi laluan audit RASMI
>   (`log_audit`) tidak mengisinya → setiap INSERT ke `programmes`/
>   `participants`/`financial_docs` GAGAL (ERROR 23502). Ini menghalang seed
>   DAN semua tulis runtime.
> - 🔴 **Risiko lanjutan yang dikenal pasti semasa semakan saya:** kolum
>   legacy lain pada jadual terurus mungkin juga `NOT NULL` tanpa default
>   dan TIDAK diisi oleh kod rasmi — contoh: `participants.full_name`/
>   `organization`/`bumiputera_status` (seed & aplikasi hanya guna `name`/
>   `organisation`/`bumi_status`), `invoices.status`/`amount`/`sst_amount`/
>   `total_value_incl_sst` (sync import tidak mengisinya). Semua ini perlu
>   diperiksa DALAM SATU LALUAN supaya tidak tersadung blocker berulang kali.
> - ✅ Disahkan: seed sebenar mengandungi **12 organizers** (bukan 4),
>   4 programmes, 6 financial_docs, 2 programme_costs, 4 participants,
>   4 cost_items.

---

## 📋 CARA GUNA

1. Salin keseluruhan kotak prompt di bawah (dari `--- MULA PROMPT ---`
   hingga `--- TAMAT PROMPT ---`).
2. Tampal ke ChatGPT (aktifkan **web browsing / code interpreter**).
3. ChatGPT melaksanakan fasa 2E dan melaporkan ikut FORMAT LAPORAN.
4. Selepas siap, tampal laporan itu semula kepada saya (pengguna) untuk
   semakan sebelum langkah seterusnya (Auth users + storage + Vercel).

---

## --- MULA PROMPT ---

> **Peranan kamu:** Jurutera pangkalan data yang teliti dan berhati-hati.
> Tugasan ini ialah **fasa 2E** pemasangan TPMS MIMOS Academy pada projek
> Supabase `lmenmfsbjgxfhnykkgow`.
>
> **Konteks:** Fasa 2D menemui blocker: `audit_logs.action_type` (kolum
> LEGACY) adalah `NOT NULL` tanpa default, manakala audit RASMI
> (`log_audit`) tidak mengisinya → semua tulis rasmi gagal dengan ERROR
> 23502. Pengguna telah meluluskan penyelesaian konservatif: **jadikan
> kolum legacy yang menghalang itu NULLABLE** (jangan buang kolum, jangan
> buang data, jangan ubah kolum rasmi).
>
> **KEPUTUSAN YANG TELAH DIBUAT & DILULUSKAN:**
>
> 1. `audit_logs.action_type`: **DROP NOT NULL — DILULUSKAN** (khusus,
>    seperti yang dicadangkan).
> 2. **Pemeriksaan menyeluruh (scan) kolum legacy NOT NULL tanpa default**
>    pada SEMUA jadual terurus — DILULUSKAN untuk dijalankan (read-only).
> 3. Bagi mana-mana kolum LEGACY lain yang didapati `NOT NULL` tanpa
>    default DAN tidak diisi oleh kod rasmi (fail rasmi / seed): **DROP
>    NOT NULL — DILULUSKAN secara bersyarat** — tetapi setiap satu MESTI
>    dilaporkan dengan justifikasi dalam laporan. Jangan ubah kolum RASMI.
> 4. Ujian rollback audit rasmi — DILULUSKAN (BEGIN; INSERT; ROLLBACK;).
> 5. **Seed `seed-v4-raw.sql` — DILULUSKAN** hanya jika langkah 1–4 lulus.
> 6. **KEKAL TIDAK DILULUSKAN:** Auth/users, storage, Vercel; buang kolum;
>    buang jadual/tipe/fungsi `private.*`; ubah data perniagaan.
>
> **Sumber rasmi (MESTI muat turun SEMULA dari GitHub, branch
> `arena/01a05cd4-masb-pms-v4`, komit terkini):**
>
> - `lib/supabase/schema-master.sql`
> - `lib/supabase/sync-import-transaction.sql`
> - `lib/supabase/governance-lock.sql`
> - `lib/supabase/change-requests.sql`
> - `lib/supabase/seed-v4-raw.sql`
>
> **Langkah 1 — Scan kolum legacy (read-only):**
>
> ```sql
> select table_name, column_name, data_type, is_nullable, column_default
> from information_schema.columns
> where table_schema = 'public'
>   and is_nullable = 'NO'
>   and (column_default is null or btrim(column_default) = '')
>   and table_name in (
>     'audit_logs','participants','invoices','programme_costs',
>     'import_staging','import_batches','programmes','financial_docs',
>     'cost_items','organizers','programme_documents','change_requests',
>     'programme_unlock_requests','user_profiles'
>   )
> order by table_name, ordinal_position;
> ```
>
> Untuk SETIAP baris hasil, tentukan:
> - Adakah kolum itu RASMI (wujud dalam `schema-master.sql` /
>   `schema-import-staging.sql` / `governance-lock.sql` /
>   `change-requests.sql`)? → JANGAN ubah; laporkan sebagai "rasmi".
> - Adakah ia LEGACY (tiada dalam fail rasmi)? Semak sama ada mana-mana
>   kod rasmi atau seed mengisinya (periksa INSERT statements dalam fail
>   rasmi + seed). Jika TIDAK diisi → ia berpotensi menghalang tulis →
>   senaraikan sebagai calon DROP NOT NULL.
>
> **Langkah 2 — Laksanakan fix (DILULUSKAN):**
>
> a) `audit_logs.action_type` (kelulusan khusus):
> ```sql
> ALTER TABLE public.audit_logs ALTER COLUMN action_type DROP NOT NULL;
> ```
>
> b) Untuk calon LEGACY lain (daripada Langkah 1, yang TIDAK diisi kod
>    rasmi/seed): laksanakan satu persatu:
> ```sql
> ALTER TABLE public.<jadual> ALTER COLUMN <kolum> DROP NOT NULL;
> ```
> Rekod setiap satu (jadual, kolum, sebab) dalam laporan. Jika ada keraguan
> sama ada sesuatu kolum diisi oleh kod rasmi, HENTIKAN dan tanya — jangan
> andaikan.
>
> **Langkah 3 — Ujian rollback audit rasmi (DILULUSKAN):**
>
> ```sql
> BEGIN;
> INSERT INTO public.organizers (name, sector, is_active)
> VALUES ('UJIAN-AUDIT', 'Private', true);
> ROLLBACK;
> ```
> ```sql
> BEGIN;
> INSERT INTO public.programmes (
>   programme_code, title, organizer_name, category, delivery_mode, status
> ) VALUES (
>   'TEST/AUDIT/0001', 'Ujian Audit', 'UJIAN-AUDIT',
>   'Non-Training'::public.programme_category,
>   'physical'::public.delivery_mode, 'draft'
> );
> ROLLBACK;
> ```
> Kedua-dua MESTI berjaya (rollback) TANPA ralat. Jika masih ada ralat,
> HENTIKAN dan laporkan penuh.
>
> **Langkah 4 — Seed (DILULUSKAN, hanya jika langkah 2–3 lulus):**
>
> Muat turun `lib/supabase/seed-v4-raw.sql` dan jalankan SEPENUHNYA sebagai
> SATU transaksi.
>
> Nota disahkan pengguna (jangan ubah):
> - Seed mengandungi **12 organizers** (bukan 4), 4 programmes,
>   6 financial_docs, 2 programme_costs, 4 participants, 4 cost_items.
> - Seed mentakrifkan semula `current_user_role()`/`log_audit()` — identik
>   dengan rasmi, selamat.
>
> **Langkah 5 — Pengesahan selepas seed:**
>
> ```sql
> select 'organizers' as tbl, count(*) from public.organizers
> union all select 'programmes', count(*) from public.programmes
> union all select 'financial_docs', count(*) from public.financial_docs
> union all select 'programme_costs', count(*) from public.programme_costs
> union all select 'participants', count(*) from public.participants
> union all select 'cost_items', count(*) from public.cost_items
> union all select 'audit_logs', count(*) from public.audit_logs;
>
> select action, table_name, count(*)
> from public.audit_logs group by action, table_name order by table_name;
>
> select programme_code, title, category, delivery_mode, status
> from public.programmes order by programme_code;
> ```
>
> Jangkaan: organizers=12, programmes=4, financial_docs=6,
> programme_costs=2, participants=4, cost_items=4. Audit rasmi dijangka
> mengandungi `created` untuk programmes(4), participants(4),
> financial_docs(6) — dan `action_type` legacy dibiarkan NULL.
>
> **Larangan keras:**
> - JANGAN cipta Auth users / user_profiles / storage / Vercel.
> - JANGAN buang kolum, jadual, tipe, atau fungsi `private.*`.
> - JANGAN ubah kolum RASMI (hanya DROP NOT NULL pada kolum LEGACY yang
>   menghalang).
> - JANGAN panggil RPC yang menulis data perniagaan (`lock_programme`,
>   `submit_change_request`, `sync_import_transaction`).
> - Jika seed GAGAL, HENTIKAN dan laporkan ralat penuh.
>
> **FORMAT LAPORAN (WAJIB PENUH):**
>
> ```text
> 📋 LAPORAN FASA 2E — LEGACY NOT NULL FIX + AUDIT TEST + SEED
> ============================================================
> 0. RINGKASAN EKSEKUTIF
>    - Status: ✅ BERJAYA / ⚠️ SEBAHAGIAN / ❌ GAGAL
>    - Scan: (N) kolum NOT NULL tanpa default ditemui | (N) legacy | (N) rasmi
>    - DROP NOT NULL dilaksanakan: (N) | Seed: ✅ / TIDAK DIJALANKAN (+sebab)
>
> 1. HASIL SCAN (jadual penuh: table | column | type | nullable | default |
>    rasmi/legacy | diisi oleh kod rasmi? | tindakan)
>
> 2. TINDAKAN DILAKSANAKAN — per kolum:
>    KOLUM: public.<jadual>.<kolum> | JENIS: <type>
>    STATUS: ✅ DROP NOT NULL / ⛔ tidak diubah (+sebab)
>    JUSTIFIKASI: (kod rasmi/seed mana yang tidak mengisinya)
>    QUERY PENGESAHAN + OUTPUT: (is_nullable kini YES)
>
> 3. UJIAN ROLLBACK AUDIT RASMI:
>    - organizers INSERT: ✅ / ❌ (output)
>    - programmes INSERT: ✅ / ❌ (output)
>
> 4. SEED:
>    - STATUS: ✅ / ❌ (ralat penuh)
>    - Kiraan sebenar vs jangkaan (12/4/6/2/4/4) — jadual
>    - Audit rasmi: (action | table | count) — pastikan action_type NULL
>    - Program dimuatkan: (senarai 4 baris)
>
> 5. ISU / AMARAN: (sebarang perkara mencurigakan)
>
> 6. LANGKAH SETERUSNYA (cadangan, JANGAN laksana sendiri):
>    Auth users + user_profiles → storage bucket → deploy Vercel →
>    ujian end-to-end
> ```
>
> **Penting:** Laporan mesti lengkap dengan skrip, query pengesahan dan
> OUTPUT SEBENAR — supaya saya boleh semak tanpa bergantung pada anda.

---

## --- TAMAT PROMPT ---

---

## Nota untuk pengguna (bukan sebahagian prompt)

- Selepas laporan 2E diterima, semak: (1) senarai kolum legacy yang diubah
  munasabah dan tiada kolum rasmi tersentuh, (2) ujian rollback lulus,
  (3) seed berjaya dengan kiraan betul (12/4/6/2/4/4), (4) audit rasmi
  `created` terhasil dengan `action_type` NULL.
- Selepas laporan 2E diluluskan, langkah seterusnya ialah **Prompt #3**
  (`docs/PROMPT-3-AUTH-STORAGE.md`): cipta 19 Auth users + `user_profiles`
  (role: 2 admin, 1 head_governance, 1 executive, 2 finance, 13 staff) +
  bucket storage `programme-documents`. Semak jadual PEMETAAN ROLE dalam
  prompt sebelum tampal.
