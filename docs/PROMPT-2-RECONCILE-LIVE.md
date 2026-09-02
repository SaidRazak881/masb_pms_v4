# PROMPT 2 — Reconcile Pangkalan Data Supabase Live dengan SQL Rasmi Repo

> **Status:** Sedia digunakan — semua fail SQL rasmi telah dibetulkan,
> diuji pada PostgreSQL sebenar (PGlite) dan di-push ke branch
> `arena/01a06274-masb-pms-v4` (komit terkini `2d9baa6`).
>
> **Selepas semakan laporan GPT fasa 1 (9 blocker):** SEMUA blocker
> (A–I) telah diselesaikan dalam komit `9309291` — lihat senarai di bawah.
> GPT MESTI muat turun semula fail (jangan guna cache bacaan fasa 1).

Sasaran: projek Supabase **`lmenmfsbjgxfhnykkgow`** (sama seperti Prompt #1).

---

## 📋 CARA GUNA

1. Salin keseluruhan kotak prompt di bawah (dari `--- MULA PROMPT ---`
   hingga `--- TAMAT PROMPT ---`).
2. Tampal ke ChatGPT (aktifkan **web browsing / code interpreter** supaya
   ia boleh akses GitHub dan membaca fail SQL).
3. ChatGPT akan menyemak, menyediakan skrip aditif, dan **melaksanakan
   bahagian yang selamat** — kemudian melaporkan ikut FORMAT LAPORAN di bawah.
4. Selepas ChatGPT siap, tampal laporan itu semula kepada saya (pengguna)
   untuk semakan sebelum keputusan seterusnya.
5. JANGAN teruskan ke langkah lain (seed, Auth, storage, deploy) sebelum
   laporan ini disemak dan diluluskan.

---

## Nota semakan laporan GPT fasa 1 — SEMUA blocker telah dibetulkan

Laporan fasa 1 menyenaraikan 9 blocker. Semuanya telah diselesaikan dalam
komit `9309291` (branch `arena/01a06274-masb-pms-v4`), dan disahkan pada
PostgreSQL sebenar (PGlite). Jangan biarkan GPT mengulangi siasatan lama
atau menunggu kebenaran untuk perkara yang sudah selesai:

| Blocker fasa 1 | Status sekarang |
| -------------- | --------------- |
| A: `private.has_role` | ✅ Sync kini guna `public.has_role` (4 lokasi) |
| B: `Engineering`/`Semiconductor` tiada dalam enum | ✅ Ditambah ke `programme_category`; sync peta `ai`→`AI & Data Science`, `engineering`→`Engineering` |
| C: jadual `invoices` tiada | ✅ Dicipta dalam `schema-master.sql` (Bahagian 7) lengkap dengan `payment_status`, `invoice_no`, `quotation_no`, `po_value_excl_tax`, `invoice_value_excl_tax`, `account_manager`, `pic_name` |
| D: `programme_costs.cost_of_sales` | ✅ Ada dalam master + reconciliation `ADD COLUMN IF NOT EXISTS` dalam sync |
| E: `audit_logs` (action/changed_fields/metadata) | ✅ Ada dalam master + reconciliation aditif untuk DB lama |
| F: `lock_programme(uuid,text)` return type | ✅ Fail rasmi kini mengandungi `DROP FUNCTION IF EXISTS public.lock_programme(uuid, text)` (dan RPC unlock lain) SEBELUM `CREATE OR REPLACE` — jadi ia BOLEH dilaksanakan (Pendekatan A), TIDAK perlu kebenaran khas |
| G: `p.code` | ✅ Ditukar ke `p.programme_code` |
| H: nilai `unlock_*` dalam `audit_action` | ✅ Master kini ada 18 nilai (termasuk `import_sync`, `import_discard`, `unlock_requested/approved/rejected/cancelled`, `change_requested/reviewed`, `deleted`) + DO guard `ADD VALUE` untuk DB lama |
| I: `schema-import-staging.sql` tidak idempotent | ✅ Enum dalam DO guard; FK `import_staging_batch_fk` dalam guard `pg_constraint` |
| Sintaks tidak sah lain | ✅ `CREATE TYPE IF NOT EXISTS` = 0 kemunculan; `with_check` = 0; polisi RLS guna blok `DROP POLICY IF EXISTS`; trigger audit guna subquery `jsonb_each` (bukan `jsonb_object_agg(OLD,NEW)`) |

**Arahan kepada GPT:** muat turun SEMULA kelima-lima fail daripada branch
(komit terkini `2d9baa6`) — jangan guna versi yang dibaca pada fasa 1.
`DROP FUNCTION IF EXISTS` yang ada di dalam fail rasmi adalah sebahagian
skrip rasmi dan boleh dilaksanakan; ia hanya menyasarkan fungsi TPMS
dengan tandatangan lama (cth. `lock_programme`), bukan fungsi lain.

---

## --- MULA PROMPT ---

> **Peranan kamu:** Jurutera pangkalan data yang teliti dan berhati-hati.
> Tugasan ini adalah **fasa 2 pemasangan** sistem TPMS MIMOS Academy.
>
> **Konteks:** Pada fasa 1, kamu cuba memasang skema dari repositori
> `SaidRazak881/masb_pms_v4` ke projek Supabase saya
> (`lmenmfsbjgxfhnykkgow`) dan kamu berhenti serta melaporkan blocker.
> Sejak itu, **semua fail SQL rasmi telah dibetulkan, diuji pada
> PostgreSQL sebenar, dan di-commit** ke repositori yang sama pada
> branch `arena/01a06274-masb-pms-v4`, commit terbaru `2d9baa6`.
> Semua blocker fasa 1 (A–I) telah dibetulkan — muat turun SEMULA fail
> dari commit ini, jangan guna cache fasa 1.
> Tugasan kamu sekarang ialah **menyelaraskan (reconcile) pangkalan data
> live dengan fail SQL rasmi yang sudah dibetulkan**, secara ADITIF sahaja.
>
> **Sumber rasmi (MESTI muat turun dari GitHub, branch
> `arena/01a06274-masb-pms-v4`, commit `9309291`):**
>
> 1. `lib/supabase/schema-master.sql` — skema induk (jadual, enum, fungsi
>    asas, trigger audit, RLS, jadual `invoices`)
> 2. `lib/supabase/schema-import-staging.sql` — jadual staging import
> 3. `lib/supabase/sync-import-transaction.sql` — RPC `sync_import_transaction`
> 4. `lib/supabase/governance-lock.sql` — RPC lock/unlock + trigger
>    penguatkuasaan kunci + RLS
> 5. `lib/supabase/change-requests.sql` — RPC change request
> 6. `lib/supabase/seed-v4-raw.sql` — data contoh dari folder `V4 RAW`
>
> **Langkah 1 — Semak baca sahaja (read-only):**
>
> - Jalankan query di Supabase SQL Editor (atau psql) untuk mendapatkan
>   senarai penuh objek live: jadual, kolum setiap jadual (nama + jenis +
>   default + nullable), enum + nilainya, fungsi + tandatangan + return
>   type, trigger, polisi RLS, indeks.
> - Untuk SETIAP objek dalam fail rasmi, bandingkan dengan live dan
>   rekodkan status: ✅ sama / ⚠️ beza / ❌ tiada.
> - Untuk objek yang ada di live tetapi TIDAK ada dalam fail rasmi,
>   rekodkan sahaja (jangan buang).
>
> **Langkah 2 — Sediakan skrip reconciliation:**
>
> - Pendekatan **A (ADITIF — kamu BOLEH laksanakan terus):**
>   - `CREATE TABLE IF NOT EXISTS` untuk jadual rasmi yang tiada di live.
>   - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` untuk kolum rasmi yang
>     tiada di live (jenis, default ikut fail rasmi).
>   - `CREATE OR REPLACE FUNCTION` untuk fungsi rasmi (tandatangan + body
>     ikut fail rasmi SEPENUHNYA — jangan ubah logik).
>   - Tambah nilai enum yang tiada dengan corak DO guard yang SAMA seperti
>     dalam fail rasmi, contoh:
>     ```sql
>     DO $$
>     BEGIN
>       IF NOT EXISTS (
>         SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
>         WHERE t.typname = 'audit_action' AND e.enumlabel = 'import_sync'
>       ) THEN
>         ALTER TYPE public.audit_action ADD VALUE 'import_sync';
>       END IF;
>     END $$;
>     ```
>   - `CREATE INDEX IF NOT EXISTS` untuk indeks rasmi.
>   - Polisi RLS: `DROP POLICY IF EXISTS` diikuti `CREATE POLICY` (PostgreSQL
>     tidak menyokong `CREATE POLICY IF NOT EXISTS`) — polisi ikut fail rasmi.
>   - Trigger: `DROP TRIGGER IF EXISTS` diikuti `CREATE TRIGGER`.
>   - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` jika belum diaktifkan.
> - Pendekatan **B (MEMERLUKAN KEBENARAN — JANGAN laksanakan, hanya
>   senaraikan dalam laporan):**
>   - Sebarang `DROP TABLE`, `DROP TYPE`, `DROP COLUMN`, `ALTER COLUMN ...
>     TYPE` (ubah jenis kolum sedia ada), `DROP VALUE` enum, atau pemadaman
>     /pengubahan data sedia ada.
>   - Menukar kontrak fungsi sedia ada yang dipanggil aplikasi lain.
>   - Menggantikan jadual sedia ada yang berbeza struktur.
>
> **Langkah 3 — Laksanakan pendekatan A:**
>
> - Laksanakan skrip pendekatan A dalam Supabase SQL Editor, satu blok
>   pada satu masa (elakkan jalankan semua serentak supaya mudah kesan).
> - Setiap blok MESTI idempotent (boleh dijalankan semula tanpa ralat).
> - Selepas selesai, jalankan semula query semakan (langkah 1) dan sahkan
>   status per-objek bertukar kepada ✅.
>
> **Larangan keras:**
>
> - JANGAN guna `CREATE TYPE IF NOT EXISTS` (sintaks ini TIDAK sah dalam
>   PostgreSQL — guna corak DO guard seperti di atas).
> - JANGAN guna `with_check` (garis bawah) — sintaks sah ialah `with check`.
> - JANGAN guna `jsonb_object_agg(OLD, NEW)` (ralat "key value must be
>   scalar") — trigger audit rasmi guna subquery `jsonb_each`; salin sahaja
>   dari fail rasmi.
> - JANGAN cipta semula fungsi/trigger/polisi yang sudah ada dengan logik
>   baharu — guna kod dari fail rasmi apa adanya.
> - JANGAN jalankan `seed-v4-raw.sql` dalam tugasan ini (data contoh akan
>   dipasang berasingan selepas pengesahan laporan).
> - JANGAN ubah, padam, atau set semula data sedia ada (programmes, dll.)
> - JANGAN sentuh Auth/users, storage bucket, atau Vercel dalam tugasan ini.
>
> **Isu yang diketahui (sahkan statusnya di live, jangan andaikan):**
>
> - `audit_logs` di live mungkin guna kolum `action_type`/`payload` manakala
>   rasmi guna `action`/`old_data`/`new_data`/`changed_fields`/`metadata` —
>   jika beza, tambah kolum rasmi secara aditif; jangan buang kolum lama.
> - `programme_costs` di live mungkin tiada `cost_of_sales` — tambah secara
>   aditif.
> - `lock_programme(uuid, text)` di live mungkin `RETURNS programmes`
>   sedangkan rasmi `RETURNS void` — FAIL RASMI sudah ada
>   `DROP FUNCTION IF EXISTS` untuk ini; laksanakan sahaja fail rasmi
>   (ia menyasarkan fungsi TPMS dengan tandatangan lama).
> - Enum `programme_category` mungkin tiada `Engineering`/`Semiconductor`;
>   `payment_status` mungkin tiada `pending` — tambah nilai secara aditif.
> - Pastikan fungsi `public.has_role`, `public.current_user_role`,
>   `public.current_user_id`, `public.log_audit` wujud dengan tandatangan
>   yang sama seperti schema-master.
> - Pastikan RLS aktif pada semua jadual rasmi dan polisi rasmi wujud.
>
> **FORMAT LAPORAN (WAJIB PENUH, jangan tinggal kosong):**
>
> ```text
> 📋 LAPORAN RECONCILE SUPABASE (FASA 2)
> =====================================
> 0. RINGKASAN EKSEKUTIF
>    - Bilangan objek diperiksa: (N)
>    - ✅ sama: (N) | ⚠️ beza: (N) | ❌ tiada: (N) | +live sahaja: (N)
>    - Pendekatan A dilaksanakan: (N blok) — SEMUA BERJAYA / ADA GAGAL
>    - Menunggu kebenaran (Pendekatan B): (N item)
>
> 1. JADUAL (per jadual, contoh setiap satu):
>    OBJEK: public.<nama_jadual>
>    STATUS LIVE: (wujud/tiada + senarai kolum)
>    STATUS RASMI: (senarai kolum)
>    PERBEZAAN: (+kolum tambah | jenis beza | tiada beza)
>    TINDAKAN: (aditif / menunggu kebenaran)
>    SKRIP SQL: (blok sedia tampal — kosongkan jika tiada tindakan)
>    QUERY PENGESAHAN: (SELECT yang membuktikan status)
>    ISU TERBUKA: (senarai atau "-")
>
> 2. ENUM (per enum): nama, nilai live vs rasmi, nilai ditambah, skrip,
>    query pengesahan.
>
> 3. FUNGSI (per fungsi): nama + tandatangan, status live vs rasmi,
>    tindakan, skrip, query pengesahan.
>
> 4. TRIGGER (per trigger): jadual, fungsi trigger, status, tindakan.
>
> 5. POLISI RLS (per polisi): jadual, nama polisi, status, tindakan.
>
> 6. INDEKS (per indeks): jadual, nama, status, tindakan.
>
> 7. SENARAI TINDAKAN YANG TELAH DILAKSANAKAN (kronologi, ringkas)
>
> 8. MENUNGGU KEBENARAN (Pendekatan B) — setiap item dengan:
>    - objek + sebab
>    - cadangan skrip (sedia tampal)
>    - risiko jika tidak dibuat
>
> 9. ISU/AMARAN LAIN: (sebarang perkara yang mencurigakan di live)
>
> 10. LANGKAH SETERUSNYA (cadangan, mengikut urutan — JANGAN laksanakan
>     sendiri: seed, Auth users + user_profiles, storage bucket, deploy
>     Vercel, ujian end-to-end)
> ```
>
> **Penting:** Laporan mesti lengkap dengan skrip SQL dan query pengesahan
> untuk SETIAP objek — supaya saya boleh semak dan, jika perlu, jalankan
> semula secara manual tanpa bergantung pada kamu.

---

## --- TAMAT PROMPT ---

---

## Nota untuk pengguna (bukan sebahagian prompt)

- **Jangan lupa lampirkan** akses kepada Supabase SQL Editor — ChatGPT
  tidak boleh masuk ke projek Supabase sendiri; skrip disediakan untuk
  anda salin-tampal, ATAU jika ChatGPT guna integrasi/mcp, pastikan ia
  hanya menjalankan pendekatan A dan bertanya sebelum pendekatan B.
- Selepas laporan diterima, semak item **8 (Menunggu Kebenaran)** dahulu —
  itu keputusan anda.
- Selepas laporan 2A diluluskan, langkah seterusnya ialah **Prompt #2B**
  (`docs/PROMPT-2B-INSTALL-RPC.md`): type conversion (B1/B2/B4/B5) +
  pasang RPC layer penuh (sync, governance, change-requests).
- Selepas laporan 2B diluluskan, barulah **Prompt #3**: seed data
  (jalankan `seed-v4-raw.sql`), cipta Auth users + `user_profiles` (guna
  role rasmi: viewer, executive, manager, admin, staff, finance,
  head_governance), dan bucket storage.
