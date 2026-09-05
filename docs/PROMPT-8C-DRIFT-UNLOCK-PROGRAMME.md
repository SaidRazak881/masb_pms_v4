# PROMPT 8C-DRIFT — Rakam `unlock_programme` (READ-ONLY)

> 🟢 **TIADA HARD GATE.** Kelima-lima query di bawah adalah **read-only** — tiada
> DDL, tiada DML, tiada `REVOKE`/`GRANT`, tiada `DROP`. Boleh dijalankan
> serta-merta. **Jangan** jalankan apa-apa selain query dalam fail ini.

---

## 1. PERSONA

Anda ialah **jurutera pangkalan data PostgreSQL/Supabase kanan** yang bekerja
pada projek produksi. Anda teliti, konservatif, dan **tidak pernah** mereka-reka
bukti. Anda menampal output sebenar walaupun ia bercanggah dengan jangkaan.

## 2. KONTEKS — mengapa probe ini wujud (Panel DP-24, 2026-09-05)

Fasa 8C sudah dipasang di live dan diterima: `anon` turun **53 → 0** (K1:
`jumlah=56, anon=0, auth=56`), akaun blocked kehilangan kuasa (K3), gate token
backfill berfungsi (K5/K6), 21 jadual / 21 ber-RLS (K11).

Semasa pemasangan, laporan drift menunjukkan **satu fungsi live di luar inventori
repo**: `unlock_programme`. Siasatan Arena mengesahkan:

* **SIFAR** definisi dalam repo (`grep` merentas `*.sql`, `*.ts`, `*.tsx`, `*.mjs`).
* **SIFAR** pemanggil dalam kod aplikasi.
* Dirujuk dalam **8 dokumen prompt** (Fasa 4B hingga 8A3) sebagai RPC tulis yang
  dilarang dipanggil — jadi kewujudannya di live sudah lama diandaikan.
* Semua adik-beradiknya **ada** dalam `lib/supabase/governance-lock.sql`
  (`lock_programme`, `request_programme_unlock`, `review_programme_unlock`,
  `cancel_programme_unlock`) — hanya `unlock_programme` yang tiada.

**Tujuan probe ini:** merakam **definisi sebenar** fungsi itu daripada live supaya
ia boleh di-commit ke repo dan inventori repo setara live. Keputusan untuk
`DROP`-kannya **ditangguhkan** (cleanup legacy pre-repo kekal ditangguh oleh
pengguna) dan **bukan** sebahagian prompt ini.

## 3. QUERY (read-only — jalankan semua, tampal semua output)

### P1 — Definisi penuh fungsi

```sql
SELECT pg_get_functiondef(p.oid) AS definisi
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'unlock_programme';
```

**Tampal definisi itu VERBATIM dan LENGKAP** — jangan ringkaskan, jangan buang
komen, jangan "kemas kini" format. Inilah nilai utama probe ini.

### P2 — Metadata + postur privilej

```sql
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS argumen,
       pg_get_function_result(p.oid)             AS jenis_pulangan,
       r.rolname                                 AS pemilik,
       p.provolatile                             AS volatility,
       p.prosecdef                               AS security_definer,
       p.proconfig::text                         AS search_path_pin,
       p.proacl::text                            AS privilej,
       obj_description(p.oid, 'pg_proc')         AS komen
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_roles r ON r.oid = p.proowner
 WHERE n.nspname = 'public' AND p.proname = 'unlock_programme';
```

**Yang Arena cari:** `security_definer` (true/false), `search_path_pin`
(ada `search_path=public` atau NULL), `volatility`, dan `privilej` — adakah
`anon` benar-benar sudah dibuang dan `authenticated` memegang EXECUTE.

### P3 — Katalog penuh fungsi `public` (untuk diff terhadap inventori repo)

```sql
SELECT p.proname,
       count(*)::int AS bilangan_tanda_tangan,
       bool_or(has_function_privilege('anon', p.oid, 'EXECUTE'))          AS anon,
       bool_or(has_function_privilege('authenticated', p.oid, 'EXECUTE')) AS authenticated
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
 GROUP BY p.proname
 ORDER BY p.proname;
```

**Tampal SEMUA baris** (jangkaan ≈56). Ini membolehkan Arena mengesan objek
yatim **lain** dalam satu larian, bukan satu demi satu.

### P4 — Pergantungan: adakah apa-apa bergantung kepadanya?

```sql
SELECT d.classid::regclass::text AS kelas_bergantung,
       d.objid::text             AS objek,
       d.deptype                 AS jenis_pergantungan
  FROM pg_depend d
 WHERE d.refid = (SELECT p.oid
                    FROM pg_proc p
                    JOIN pg_namespace n ON n.oid = p.pronamespace
                   WHERE n.nspname = 'public' AND p.proname = 'unlock_programme'
                   LIMIT 1);
```

**Tujuan:** mengetahui sama ada fungsi ini boleh di-DROP dengan selamat pada fasa
cleanup kelak, atau sama ada ada trigger/polisi/objek lain bergantung kepadanya.
**Jangan DROP apa-apa** berdasarkan output ini.

### P5 — Adakah ia muncul dalam mana-mana polisi RLS atau trigger?

```sql
SELECT 'polisi' AS jenis, schemaname AS skema, tablename AS jadual, policyname AS nama
  FROM pg_policies
 WHERE qual ILIKE '%unlock_programme%' OR with_check ILIKE '%unlock_programme%'
UNION ALL
SELECT 'trigger', trigger_schema, event_object_table, trigger_name
  FROM information_schema.triggers
 WHERE action_statement ILIKE '%unlock_programme%'
UNION ALL
SELECT 'fungsi_lain', n.nspname, p.proname, ''
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE p.proname <> 'unlock_programme'
   AND pg_get_functiondef(p.oid) ILIKE '%unlock_programme%';
```

**Nota:** baris ketiga mengimbas badan semua fungsi lain — ia mungkin perlahan
pada katalog besar, tetapi read-only dan selamat.

## 4. LARANGAN

1. 🔴 **READ-ONLY SAHAJA.** JANGAN `DROP`, `ALTER`, `CREATE`, `REVOKE`, `GRANT`,
   `UPDATE`, `DELETE`, `INSERT`, atau jalankan mana-mana RPC.
2. JANGAN panggil `unlock_programme` untuk "melihat apa yang berlaku" — ia RPC
   **tulis** dan badannya belum disemak.
3. JANGAN guna `service_role`.
4. JANGAN reset/ubah password mana-mana akaun.
5. JANGAN merge ke `main` atau tukar Production Branch Vercel. Prompt ini **tidak**
   meluluskannya.
6. JANGAN tampal anon key penuh / sebarang rahsia.
7. JANGAN mereka-reka bukti — setiap nilai mesti output sebenar; jika query gagal,
   tampal ralat penuh dan teruskan query lain.
8. JANGAN betulkan atau "rapikan" definisi P1. Ia mesti byte-for-byte daripada live.

## 5. FORMAT LAPORAN (WAJIB — 6 seksyen)

**Seksyen 1 — Konteks & Status:** projek Supabase, sama ada 8C masih pada keadaan
  yang dilaporkan (K1 `anon=0`).
**Seksyen 2 — Tindakan yang diambil:** P1–P5 dengan output verbatim.
**Seksyen 3 — Keputusan (jadual):** `P1..P5` | status ✅/❌/⏳ | bukti.
**Seksyen 4 — Isu / Blocker:** 🔴/🟠/🟢 — terutamanya sebarang objek yatim
  **tambahan** yang P3 dedahkan.
**Seksyen 5 — Pengesahan penuh:** 8 larangan dipatuhi; tiada DDL/DML dijalankan.
**Seksyen 6 — Kesimpulan & langkah seterusnya.**

**Berhenti selepas laporan.** Jangan mula 8B/8D, dan jangan cuba menyelesaikan
drift itu sendiri — itu keputusan Arena + pengguna selepas definisi diperoleh.

---

## Nota untuk Arena (bukan sebahagian prompt)

* Selepas P1 diperoleh: commit definisi itu ke repo (cadangan:
  `lib/supabase/legacy-unlock-programme.sql`) dengan anotasi **"dirakam daripada
  live 2026-09-05, bukan direka"**, supaya `test-konvensyen-privilej.mjs` dan
  inventori Seksyen 2 setara live. Kemudian tambah namanya kepada `v_inventori`
  dalam migration **additif** seterusnya (jangan sunting fail 8C yang sudah
  dipasang).
* Jika P2 menunjukkan `security_definer = true` tanpa `search_path` pin, atau P4/P5
  menunjukkan tiada pergantungan — bawa ke panel sebagai calon DROP pada fasa
  cleanup (keputusan itu milik pengguna, ditangguh sejak sebelum 8C).
* Diff P3 (≈56 nama) terhadap inventori repo 55 nama + `unlock_programme`. Sebarang
  nama tambahan = drift baharu yang mesti direkodkan, bukan disapu senyap.
