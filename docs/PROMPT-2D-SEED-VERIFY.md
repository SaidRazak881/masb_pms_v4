# PROMPT 2D — Cleanup Trigger Legacy + Verifikasi Akhir + Seed Data

> **Status:** Sedia digunakan SELEPAS laporan fasa 2C disemak dan diluluskan.
> Sasaran: projek Supabase **`lmenmfsbjgxfhnykkgow`**.
>
> **Keputusan semakan fasa 2C (disahkan terhadap fail repositori):**
> - ✅ 2C diterima: view legacy di-drop, 4× type conversion selesai, RPC
>   layer penuh (sync/governance/change-request) hidup & idempotent, trigger
>   audit rasmi dipasang, data tidak disentuh.
> - 🔴 **Risiko yang dikenal pasti semasa semakan:** `audit_logs.action`
>   adalah `NOT NULL` dalam skema rasmi, tetapi trigger LEGACY
>   `trg_audit_programme_costs`, `trg_audit_invoices` dan
>   `trg_audit_import_staging` (→ `private.write_audit_log()`) MASIH wujud.
>   Jika `write_audit_log()` tidak mengisi kolum `action`, maka setiap
>   INSERT/UPDATE pada `programme_costs` / `invoices` / `import_staging`
>   akan GAGAL dengan ralat NOT NULL — termasuk semasa seed dan semasa RPC
>   `sync_import_transaction` berjalan. **Ini mesti diselesaikan dahulu.**
> - ✅ Disahkan: fail seed `seed-v4-raw.sql` SERASI dengan skema semasa
>   (kolum rasmi, nilai enum sah, DO-guard type, fungsi `current_user_role`/
>   `log_audit` identik dengan rasmi, UUID tetap, jadual kosong).

---

## 📋 CARA GUNA

1. Salin keseluruhan kotak prompt di bawah (dari `--- MULA PROMPT ---`
   hingga `--- TAMAT PROMPT ---`).
2. Tampal ke ChatGPT (aktifkan **web browsing / code interpreter**).
3. ChatGPT melaksanakan fasa 2D dan melaporkan ikut FORMAT LAPORAN.
4. Selepas siap, tampal laporan itu semula kepada saya (pengguna) untuk
   semakan sebelum langkah seterusnya (Auth users + storage + Vercel).

---

## --- MULA PROMPT ---

> **Peranan kamu:** Jurutera pangkalan data yang teliti dan berhati-hati.
> Tugasan ini ialah **fasa 2D** pemasangan TPMS MIMOS Academy pada projek
> Supabase `lmenmfsbjgxfhnykkgow`.
>
> **Konteks:** Fasa 2C telah selesai (view legacy di-drop, 4 kolum ditukar
> ke enum, RPC layer penuh hidup). Semakan oleh pengguna menemui SATU
> risiko kritikal yang mesti diselesaikan sebelum seed:
>
> - `audit_logs.action` adalah `NOT NULL` (skema rasmi), tetapi trigger
>   LEGACY berikut masih wujud dan memanggil `private.write_audit_log()`:
>   `trg_audit_programme_costs`, `trg_audit_invoices`,
>   `trg_audit_import_staging`. Jika fungsi legacy itu tidak mengisi
>   `action`, operasi tulis pada ketiga-tiga jadual akan gagal.
>
> **KEPUTUSAN YANG TELAH DIBUAT & DILULUSKAN oleh pengguna:**
>
> 1. **DROP trigger legacy audit** pada `programme_costs`, `invoices`,
>    `import_staging` — DILULUSKAN. Rasional: (a) skema rasmi TIADA audit
>    trigger untuk ketiga-tiga jadual ini — audit rasmi untuk data import
>    berlaku melalui RPC `append_import_audit`/`log_audit`; (b) trigger
>    legacy menulis ke kolum legacy (`action_type`/`payload`) yang tidak
>    dibaca aplikasi; (c) ia berisiko menyebabkan NOT NULL violation pada
>    `audit_logs.action` (dalam seed dan semasa import). Fungsi
>    `private.write_audit_log()` KEKAL (jangan drop fungsi).
> 2. **Convert `programmes.lock_reason`** TEXT → `public.programme_lock_reason`
>    — DILULUSKAN (jadual kosong; selaras dengan RPC rasmi yang melakukan
>    `p_lock_reason::public.programme_lock_reason`; tetapkan NOT NULL
>    DEFAULT `'manual'`).
> 3. **RLS final diff** — DILULUSKAN untuk mencipta semula mana-mana polisi
>    RASMI yang tertinggal (daripada fail rasmi); polisi EXTRA di live:
>    hanya lapor, jangan drop.
> 4. **Seed `seed-v4-raw.sql`** — DILULUSKAN, TETAPI hanya selepas langkah
>    1–3 lulus. Jika mana-mana langkah 1–3 gagal, HENTIKAN dan laporkan —
>    jangan jalankan seed.
> 5. **KEKAL TIDAK DILULUSKAN:** Auth/users, storage, Vercel; buang kolum
>    legacy (B3/B6/B7); buang jadual/tipe/fungsi `private.*`; ubah data
>    selain daripada apa yang dinyatakan.
>
> **Sumber rasmi (MESTI muat turun SEMULA dari GitHub, branch
> `arena/01a05cd4-masb-pms-v4`, komit terkini — jangan guna cache):**
>
> 1. `lib/supabase/schema-master.sql`
> 2. `lib/supabase/schema-import-staging.sql`
> 3. `lib/supabase/governance-lock.sql`
> 4. `lib/supabase/change-requests.sql`
> 5. `lib/supabase/seed-v4-raw.sql`
>
> **Langkah 1 — Ujian rollback + rekod definisi trigger legacy:**
>
> a) Rekod definisi penuh trigger dan fungsi:
> ```sql
> select pg_get_triggerdef(oid) from pg_trigger
> where tgname in ('trg_audit_programme_costs','trg_audit_invoices',
>                  'trg_audit_import_staging');
>
> select pg_get_functiondef(oid) from pg_proc
> where proname = 'write_audit_log' and pronamespace = 'private'::regnamespace;
> ```
>
> b) Ujian selamat (rollback — TIADA perubahan kekal) untuk membuktikan
>    sama ada trigger legacy menyebabkan kegagalan:
> ```sql
> BEGIN;
> INSERT INTO public.programme_costs (programme_id, cost_of_sales)
> VALUES ('00000000-0000-4000-8000-100000000001', 100.00);
> ROLLBACK;
> ```
> ```sql
> BEGIN;
> INSERT INTO public.import_staging (
>   batch_id, source_file, source_sheet, source_row, entity_kind,
>   suggested_action, is_valid
> ) VALUES (
>   '00000000-0000-4000-9000-000000000001', 'ujian.xlsx', 'Sheet1', 1,
>   'unknown', 'pending', true
> );
> ROLLBACK;
> ```
> (Untuk `invoices`, jadual kosong dan tiada seed — ujian INSERT ke
> `invoices` juga boleh dibuat dengan ROLLBACK, guna nilai minimum yang
> memenuhi constraint.)
>
> Rekod HASIL sebenar setiap ujian (berjaya / ralat penuh).
>
> c) **DROP trigger legacy (DILULUSKAN)** — selepas definisi direkod:
> ```sql
> DROP TRIGGER IF EXISTS trg_audit_programme_costs ON public.programme_costs;
> DROP TRIGGER IF EXISTS trg_audit_invoices ON public.invoices;
> DROP TRIGGER IF EXISTS trg_audit_import_staging ON public.import_staging;
> ```
>
> **Langkah 2 — Convert `programmes.lock_reason` (DILULUSKAN):**
>
> ```sql
> ALTER TABLE public.programmes
>   ALTER COLUMN lock_reason DROP DEFAULT;
> ALTER TABLE public.programmes
>   ALTER COLUMN lock_reason TYPE public.programme_lock_reason
>   USING lock_reason::public.programme_lock_reason;
> ALTER TABLE public.programmes
>   ALTER COLUMN lock_reason SET DEFAULT 'manual'::public.programme_lock_reason;
> ALTER TABLE public.programmes
>   ALTER COLUMN lock_reason SET NOT NULL;
> ```
> Jika ada CHECK constraint yang menghalang, rekod, drop, jalankan, dan
> lapor sama ada perlu diwujudkan semula.
>
> **Langkah 3 — RLS final diff (DILULUSKAN):**
>
> a) Senaraikan polisi rasmi yang DIJANGKA daripada fail rasmi
>    (schema-master.sql: 10 jadual; schema-import-staging.sql:
>    import_batches + import_staging; governance-lock.sql:
>    programme_unlock_requests; change-requests.sql: change_requests).
> b) Bandingkan dengan polisi live:
> ```sql
> select schemaname, tablename, policyname, cmd
> from pg_policies where schemaname = 'public' order by tablename, policyname;
> ```
> c) Untuk setiap polisi RASMI yang TIDAK wujud di live: cipta mengikut
>    definisi fail rasmi (guna `DROP POLICY IF EXISTS` diikuti `CREATE
>    POLICY`).
> d) Polisi EXTRA di live (tiada dalam fail rasmi): SENARAIKAN sahaja
>    dalam laporan — jangan drop.
>
> **Langkah 4 — Seed (DILULUSKAN, hanya jika langkah 1–3 lulus):**
>
> Muat turun `lib/supabase/seed-v4-raw.sql` dan jalankan SEPENUHNYA sebagai
> SATU transaksi dalam SQL Editor.
>
> Nota yang telah disahkan oleh pengguna (jangan ubah):
> - Seed menggunakan UUID tetap (`00000000-...`) — jadual kosong, tiada
>   konflik.
> - Seed mentakrifkan semula `current_user_role()` dan `log_audit()` —
>   identik dengan versi rasmi (tandatangan sama), selamat.
> - Nilai kategori/delivery/status dalam seed adalah nilai enum rasmi.
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
> select programme_code, title, category, delivery_mode, status
> from public.programmes order by programme_code;
>
> -- Pastikan audit rasmi terhasil (bukan legacy):
> select action, table_name, count(*)
> from public.audit_logs group by action, table_name order by table_name;
> ```
>
> Bandingkan dengan jangkaan: organizers=4, programmes=4, financial_docs=6,
> programme_costs=2, participants=4, cost_items=4. Audit rasmi dijangka
> mengandungi `created` untuk programmes(4), participants(4),
> financial_docs(6).
>
> **Larangan keras:**
> - JANGAN cipta Auth users / user_profiles / storage / Vercel dalam
>   tugasan ini.
> - JANGAN buang kolum legacy, jadual, tipe, atau fungsi `private.*`.
> - JANGAN panggil RPC yang menulis data perniagaan (`lock_programme`,
>   `submit_change_request`, `sync_import_transaction`) melainkan untuk
>   ujian rollback yang dinyatakan.
> - Jika seed GAGAL, HENTIKAN dan laporkan ralat penuh — jangan cuba
>   "baik pulih" sendiri tanpa kebenaran.
>
> **FORMAT LAPORAN (WAJIB PENUH):**
>
> ```text
> 📋 LAPORAN FASA 2D — CLEANUP + VERIFIKASI + SEED
> ================================================
> 0. RINGKASAN EKSEKUTIF
>    - Status: ✅ BERJAYA / ⚠️ SEBAHAGIAN / ❌ GAGAL
>    - Langkah 1 (trigger): ✅ | Langkah 2 (lock_reason): ✅ |
>      Langkah 3 (RLS diff): ✅ | Langkah 4 (seed): ✅ / TIDAK DIJALANKAN
>      (jika tidak, sebab)
>
> 1. TRIGGER LEGACY
>    - Definisi trigger (pg_get_triggerdef): (3 blok)
>    - Definisi private.write_audit_log (pg_get_functiondef): (blok)
>    - Ujian rollback: (per jadual: hasil sebenar — berjaya/ralat)
>    - TINDAKAN: ✅ DROP 3 trigger (senarai) / ⛔ tidak di-drop + sebab
>
> 2. LOCK_REASON CONVERSION
>    - JENIS LAMA → BARU | DEFAULT → 'manual' | NOT NULL
>    - STATUS: ✅ / ❌ + ralat
>    - QUERY PENGESAHAN + OUTPUT: (sebenar)
>
> 3. RLS FINAL DIFF
>    - Polisi rasmi dijangka: (N) | Wujud: (N) | Dicipta semula: (N)
>    - Polisi extra di live: (senarai — tidak di-drop)
>
> 4. SEED
>    - STATUS: ✅ / ❌ (ralat penuh jika gagal)
>    - Kiraan sebenar vs jangkaan (jadual perbandingan)
>    - Audit rasmi terhasil: (action | table | count)
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

- Selepas laporan 2D diterima, semak: (1) 3 trigger legacy di-drop dengan
  definisi direkod, (2) ujian rollback didokumenkan (jika ia gagal sebelum
  drop, itu bukti risiko itu nyata), (3) `lock_reason` kini enum + NOT NULL
  DEFAULT 'manual', (4) RLS rasmi lengkap, (5) seed berjaya dengan kiraan
  betul (4/4/6/2/4/4) dan audit rasmi `created` terhasil.
- Selepas laporan 2D diluluskan, langkah seterusnya ialah **Prompt #2E**
  (`docs/PROMPT-2E-AUDIT-LEGACY-FIX.md`): fix kolum legacy NOT NULL yang
  menghalang audit rasmi (action_type dll.), ujian rollback audit, kemudian
  seed. **Nota:** seed sebenar mengandungi 12 organizers (bukan 4).
