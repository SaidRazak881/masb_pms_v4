# PROMPT 6B — BLOCKER C13: `has_role()` live tidak sedar `super_admin`

> **Persona kamu:** Jurutera pangkalan data yang teliti dan berhati-hati
> (`docs/personas/PERSONA-SQL-ARCHITECT.md`). Baca `docs/CODEBASE-MAP.md`
> sebagai konteks.
>
> **Keadaan:** Langkah C Fasa 6 telah dijalankan pada projek Supabase
> `lmenmfsbjgxfhnykkgow`. C1–C12 dan C14 **LULUS**. **C13 GAGAL** 🔴 dan
> anda (ChatGPT) berhenti dengan betul. D dan E **belum** dijalankan.
>
> **Kelulusan yang diberi oleh prompt ini:** menjalankan **satu** fail rasmi —
> `lib/supabase/fix-rls-recursion.sql` — di Supabase live, dan menjalankan
> query pengesahan **read-only** yang disenaraikan. **Tiada kelulusan lain.**

---

## 1. Blocker: apa yang salah

Bukti live yang anda laporkan:

```
proname         = has_role
super_admin_pos = 0
prosrc          = SELECT public.current_user_role() = p_role;
```

Itu ialah `has_role()` versi **asal** (`LANGUAGE sql`, satu baris). Versi rasmi
semasa dalam repositori — di **kedua-dua** `schema-master.sql` (baris 274–289)
dan `fix-rls-recursion.sql` (baris 48–63) — ialah:

```sql
CREATE OR REPLACE FUNCTION public.has_role(p_role public.app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  v_role := public.current_user_role();
  IF v_role::text = 'super_admin' THEN
    RETURN true;
  END IF;
  RETURN v_role = p_role;
END;
$$;
```

## 2. Punca akar — **kesilapan reka bentuk PROMPT-6, diakui oleh Arena**

Fasa 6 menambah cawangan `super_admin` ke dalam `has_role()` di
`schema-master.sql` **dan** `fix-rls-recursion.sql`. Tetapi PROMPT-6
Langkah A menyenaraikan hanya **`user-management.sql`** sebagai fail untuk
dimuat turun dan dipasang; kedua-dua fail lain ditandakan *"rujukan sahaja,
JANGAN jalankan semula — sudah dipasang pada fasa lepas"*.

Arahan itu **salah**. Produksi memasang kedua-dua fail itu semasa Fasa 1–5,
iaitu **sebelum** cawangan `super_admin` wujud, jadi `has_role()` live kekal
versi lama. Bukti git: pada branch Fasa 5 (`arena/01a05cd4-masb-pms-v4`),
kedua-dua fail mengandungi `LANGUAGE sql` + `SELECT public.current_user_role() = p_role;`.

**Ini bukan kecuaian pelaksana — ia kecuaian arahan.** Anda mengikut PROMPT-6
dengan tepat.

## 3. Kenapa ini kritikal (bukan sekadar kosmetik)

Bahagian 8a `user-management.sql` telah menaikkan taraf Master Admin
`saidrazak881@gmail.com` daripada `admin` → **`super_admin`**. Dengan
`has_role()` versi lama:

```
has_role('admin')            = (super_admin = admin)            = FALSE
has_role('head_governance')  = (super_admin = head_governance)  = FALSE
has_role('manager')          = FALSE     ... dan seterusnya
has_role('super_admin')      = TRUE      (satu-satunya yang true)
```

Terdapat **9 polisi RLS** yang bergantung pada `has_role()`, antaranya:

| Polisi | Kesan kepada Master Admin sekarang |
| ------ | ---------------------------------- |
| `"Admin boleh lihat semua profil"` (user_profiles SELECT) | Hanya nampak profil sendiri — **kehilangan keupayaan lihat semua pengguna** |
| `"Pengguna boleh kemaskini programmes jika tidak dikunci"` | **Tidak boleh** kemaskini program yang `is_locked = true` |
| `"Pengguna boleh kemaskini participants jika program tidak dikunci"` | **Tidak boleh** kemaskini peserta program terkunci |
| Polisi `invoices`, `financial_docs`, `programme_costs`, `cost_items`, `programme_documents` | Kehilangan hak kemaskini peringkat admin |

**Kerosakan ini SENYAP di UI pengurusan:** `can_manage_users()` **tidak**
menggunakan `has_role()` (ia menyemak `role = 'super_admin'` ATAU e-mel Master
Admin), jadi `/admin/users` masih berfungsi sepenuhnya. Master Admin akan
melihat dashboard pengurusan yang sihat sambil **kehilangan akses data modul
lain** — gabungan yang paling berbahaya.

## 4. Tugasan kamu

### Langkah 1 — Muat turun fail pembaikan

Ambil dari HEAD branch `arena/01a06274-masb-pms-v4` (klik **Raw**):

`https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/lib/supabase/fix-rls-recursion.sql`

Sahkan cap jari kandungan **sebelum** menjalankan:

| Cap jari | Jangkaan |
| -------- | -------- |
| `CREATE OR REPLACE FUNCTION` dalam fail | **tepat 3** (`current_user_role`, `current_role_name`, `has_role`) |
| `DROP POLICY IF EXISTS` | **tepat 9** |
| `CREATE POLICY` | **tepat 9** |
| `GRANT EXECUTE ON FUNCTION` | **tepat 3** |
| `GRANT`/`REVOKE` privilej **jadual** | **sifar** — fail ini tidak menyentuh column grant Fasa 6 |
| Definisi `has_role` | `LANGUAGE plpgsql` + mengandungi `'super_admin'` |

Jika mana-mana cap jari tidak sepadan → **BERHENTI** dan laporkan.

### Langkah 2 — Jalankan di Supabase live

Supabase Dashboard → projek `lmenmfsbjgxfhnykkgow` → **SQL Editor** → tampal
**seluruh** fail → Run.

- Fail ini **idempotent** (`DROP POLICY IF EXISTS` → `CREATE POLICY`,
  `CREATE OR REPLACE FUNCTION`) — selamat dijalankan berulang kali.
- Fail ini **tidak** mengandungi `COMMIT;` dan **tidak** menambah nilai enum,
  jadi tiada sempadan transaksi diperlukan.
- **Jangan** balut dalam `BEGIN; ... COMMIT;` tambahan.
- **Jangan** jalankan `schema-master.sql` sebagai ganti — ia jauh lebih besar
  dan tidak diperlukan.

### Langkah 3 — Pengesahan (read-only)

Jalankan dan tampal output **verbatim**:

```sql
-- V1. Definisi has_role() mesti sedar super_admin (C13)
SELECT 'V1_has_role' AS check_name,
       l.lanname AS language,
       position('super_admin' in p.prosrc) AS super_admin_pos,
       p.prosecdef AS security_definer,
       p.prosrc
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l ON l.oid = p.prolang
 WHERE n.nspname = 'public' AND p.proname = 'has_role';

-- V2. Ujian pewarisan SEMUA role bagi Master Admin (bukan hanya 'admin')
SELECT 'V2_master_admin_inheritance' AS check_name, r.role_name,
       public.has_role(r.role_name::public.app_role) AS returns_true
  FROM (VALUES ('super_admin'),('admin'),('head_governance'),('manager'),
               ('executive'),('finance'),('staff'),('viewer')) AS r(role_name)
 ORDER BY r.role_name;

-- V3. 9 polisi RLS yang bergantung pada has_role() masih wujud
SELECT 'V3_rls_policies_using_has_role' AS check_name,
       count(*)::int AS policy_count,
       string_agg(pol.tablename || '.' || pol.cmd, ', ' ORDER BY pol.tablename, pol.cmd) AS policies
  FROM pg_policies pol
 WHERE pol.schemaname = 'public'
   AND (pol.qual LIKE '%has_role(%' OR pol.with_check LIKE '%has_role(%');

-- V4. Column grant Fasa 6 MESTI tidak berubah (regresi Bahagian 7d)
SELECT 'V4_column_grants' AS check_name,
       coalesce(string_agg(cp.privilege_type || '(' || cp.column_name || ')',
                           ', ' ORDER BY cp.privilege_type, cp.column_name),
                '(tiada)') AS grants
  FROM information_schema.column_privileges cp
 WHERE cp.table_schema = 'public' AND cp.table_name = 'user_profiles'
   AND cp.grantee = 'authenticated'
   AND cp.privilege_type IN ('INSERT','UPDATE','DELETE');

-- V5. Objek Fasa 6 MESTI tidak berubah (regresi)
SELECT 'V5_fasa6_objects' AS check_name,
       (SELECT count(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='public' AND p.proname LIKE 'admin\_%') AS admin_rpc,
       (SELECT count(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='public' AND p.proname='has_role') AS has_role_count,
       (SELECT count(*)::int FROM information_schema.columns
         WHERE table_schema='public' AND table_name='user_profiles'
           AND column_name IN ('account_status','must_change_password')) AS kolum_fasa6,
       (SELECT md5(value) FROM public.app_settings WHERE key='default_password') AS md5_default_password,
       (SELECT count(*)::int FROM pg_trigger WHERE tgrelid='auth.users'::regclass
         AND NOT tgisinternal) AS auth_triggers;

-- V6. RLS masih aktif pada semua jadual perniagaan (C14 semula)
SELECT 'V6_rls_active' AS check_name,
       count(*)::int AS jadual_public,
       count(*) FILTER (WHERE NOT relrowsecurity)::int AS rls_mati
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r'
   AND c.relname NOT IN ('schema_migrations','spatial_ref_sys');

-- V7. Master Admin masih super_admin + active (tiada regresi data)
SELECT 'V7_master_admin' AS check_name, up.email, up.role::text AS role,
       up.account_status::text AS account_status, up.is_active,
       up.must_change_password
  FROM public.user_profiles up
 WHERE lower(up.email) = 'saidrazak881@gmail.com';

-- V8. Tiada perubahan bilangan pengguna / kata laluan
SELECT 'V8_no_data_change' AS check_name,
       (SELECT count(*)::int FROM public.user_profiles) AS profil,
       (SELECT count(*)::int FROM auth.users) AS auth_users,
       (SELECT count(*)::int FROM public.user_profiles WHERE must_change_password) AS wajib_tukar;
```

### Langkah 4 — Kriteria lulus

| # | Kriteria | Jangkaan |
|---|----------|----------|
| V1 | `language` | `plpgsql` |
| V1 | `super_admin_pos` | **> 0** (bukan 0) |
| V1 | `security_definer` | `true` |
| V2 | `returns_true` | **`true` untuk SEMUA 8 role** — inilah pewarisan super_admin |
| V3 | `policy_count` | ~~9~~ **DIBETULKAN → lihat bawah** |
| V4 | `grants` | tepat `UPDATE(avatar_url), UPDATE(department), UPDATE(designation), UPDATE(full_name), UPDATE(phone), UPDATE(updated_at)` — **tiada** `role`, `account_status`, `is_active` |
| V5 | `admin_rpc` | **8** |
| V5 | `has_role_count` | **1** (tiada fungsi bertindan) |
| V5 | `kolum_fasa6` | **2** |
| V5 | `md5_default_password` | `cc3d4118520072361b5318c6d3441873` |
| V5 | `auth_triggers` | **2** |
| V6 | `rls_mati` | **0** |
| V7 | `role` / `account_status` | `super_admin` / `active` |
| V8 | `profil` / `auth_users` / `wajib_tukar` | **19 / 19 / 19** — tidak berubah |

> ⚠️ **KESILAPAN ARENA — V3 telah dibetulkan (2026-09-03).** Kriteria asal
> menetapkan `policy_count = 9`. Angka `9` **betul bagi pemasangan bersih**
> (disahkan automatik: tepat 9, semuanya dari `fix-rls-recursion.sql`), tetapi
> **salah sebagai kriteria live** kerana query V3 mengira **semua** polisi
> dalam skema `public` yang merujuk `has_role(`, termasuk polisi pada jadual
> yang bukan ciptaan SQL rasmi repo. Live membalas **17** = 9 rasmi + 8 milik
> tiga jadual warisan (`profiles`, `programme_participants`, `user_roles`) yang
> **tiada dalam repo**.
>
> **Kriteria V3 yang betul:** `policy_count` ≥ 9, **dan** kesemua 9 entri rasmi
> hadir (`cost_items.UPDATE`, `financial_docs.UPDATE`, `invoices.UPDATE`,
> `participants.UPDATE`, `programme_costs.UPDATE`,
> `programme_documents.UPDATE`, `programmes.UPDATE` ×2,
> `user_profiles.SELECT`). Bilangan tambahan **diterima** dan mesti diaudit —
> lihat **`docs/PROMPT-6C-AUDIT-LEGACY-TABLES.md`**.
>
> **Peraturan pengajaran:** jangan tetapkan kriteria penerimaan berdasarkan
> satu fail apabila query mengira keseluruhan skema. Baseline `9` kini
> diterbitkan secara automatik oleh `scripts/test-preflight-b-sql.mjs`.

Jika **mana-mana** kriteria lain gagal → **BERHENTI**, laporkan sebagai blocker,
jangan cuba membetulkan sendiri.

### Langkah 5 — Selepas V1–V8 lulus

**BERHENTI dan laporkan.** Jangan jalankan:

- ❌ Langkah D (konfigurasi Supabase Auth)
- ❌ Langkah E (Vercel Production Branch)
- ❌ sebarang merge ke `main`
- ❌ sebarang RPC pengurusan (`admin_*`) — termasuk "ujian" reset kata laluan
- ❌ sebarang `UPDATE`/`INSERT`/`DELETE` yang tidak disenaraikan di atas

Arena akan menyemak V1–V8 dan memberi kelulusan bertulis untuk D, kemudian E.

## 5. Larangan (kekal dari PROMPT-6 asal)

1. JANGAN ubah suai logik perniagaan dalam SQL.
2. JANGAN ubah skema / RLS / RPC / trigger selain menjalankan fail rasmi
   `fix-rls-recursion.sql` apa adanya.
3. JANGAN guna `service_role`.
4. JANGAN panggil RPC perniagaan atau `admin_*` dari alat kamu.
5. JANGAN merge ke `main` atau tukar Vercel Production Branch.
6. JANGAN tampal anon key / secret penuh dalam laporan.
7. JANGAN cetak nilai `default_password` — guna cap jari md5 sahaja.
8. JANGAN reka bukti. Jika tidak menjalankannya, katakan tidak.
9. JANGAN anggap Mod Demo tempatan sebagai produksi.
10. JANGAN jalankan `schema-master.sql` atau `user-management.sql` semula —
    hanya `fix-rls-recursion.sql`.
11. JANGAN teruskan ke D atau E tanpa kelulusan bertulis Arena.
12. JANGAN rujuk hash komit lama (sejarah pernah ditulis semula) — gunakan
    cap jari kandungan.

## 6. FORMAT LAPORAN (6 seksyen)

```
📋 LAPORAN PROMPT-6B — PEMBAIKAN BLOCKER C13
=============================================

1. CONTEXT & STATUS
   - Status keseluruhan: 🟢 C13 DIPERBAIKI / 🔴 MASIH BLOCKER
   - Fail yang dijalankan + cap jari kandungan yang disahkan

2. ACTIONS TAKEN
   - Langkah yang benar-benar dilaksanakan (jujur: jika berperingkat kerana
     had payload alat, nyatakan)

3. VERIFICATION TABLE — V1 hingga V8
   | Semakan | Status ✅/❌ | Bukti verbatim |

4. ISSUES / BLOCKERS
   - Apa-apa yang gagal, dengan ralat penuh
     (ERROR / DETAIL / HINT / CONTEXT / SQLSTATE)

5. COMPLIANCE CHECKLIST
   - 12 larangan: 🟢/🔴 setiap satu

6. CONCLUSION & NEXT STEP
   - Adakah C13 kini LULUS?
   - Pengesahan bahawa D dan E TIDAK dijalankan
   - Apa yang kamu cadangkan Arena lakukan seterusnya
```

---

## Nota untuk Arena (bukan untuk ChatGPT)

**Pengajaran proses — direkodkan supaya tidak berulang:**

1. **Apabila Fasa N mengubah fail SQL milik Fasa <N, fail itu MESTI disenaraikan
   sebagai "perlu dijalankan semula"**, bukan "rujukan sahaja". Fasa 6 mengubah
   `has_role()` dalam dua fail Fasa 1/4F tetapi PROMPT-6 tidak menyuruh
   menjalankan semula mana-mana satu.
2. **Tambah semakan pra-pemasangan** bagi fungsi yang diubah oleh fasa baharu
   tetapi tinggal di fail lama (`has_role` ialah kes pertama).
3. **PGlite tidak boleh mengesahkan RLS** — `postgres` ialah superuser dengan
   `rolbypassrls = true`. `scripts/test-c13-has-role-drift.mjs` menguji logik
   `has_role()` + bilangan polisi bergantung sahaja; pengesahan RLS
   hujung-ke-hujung mesti di Supabase live.
