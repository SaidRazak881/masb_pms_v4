# PROMPT 4E — FIX DB LIVE UNTUK LOCK + NAMA PENGGUNA

> **Konteks:** Ujian manual UI (ACTION 4C) GAGAL: nama pengguna tidak muncul (hanya email) dan
> fungsi lock/edit tidak berfungsi. Siasatan kod selesai — punca terbahagi DUA:
>
> **Punca A (DB live — ANDA kena betulkan):** RPC governance (`lock_programme`,
> `review_programme_unlock`, `request_programme_unlock`, `review_change_request`) memanggil
> `public.current_role_name()` melalui `is_unlock_approver()`, tetapi fungsi itu TIDAK wujud di DB
> live → semua operasi lock/unlock/approve akan gagal dengan ralat "function ... does not exist".
> (Fungsi ini sudah ditambah ke `lib/supabase/schema-master.sql` dalam repo, tetapi belum dipasang
> di Supabase live.)
>
> **Punca B (DB live — anda perlu sahkan & betulkan):** `user_profiles.full_name` mungkin NULL
> (dan `auth.users.raw_user_meta_data.full_name` mungkin tiada) → UI jatuh ke fallback email.
>
> **Punca C (kod — SUDAH DIBETULKAN & DI-DEPLOY):** tiada butang "Kunci Program" langsung;
> butang "Sunting Program" hiasan sahaja; role `head_governance` tidak diiktiraf (nizar menjadi
> "viewer"). Commit `34f1069` sudah push — Vercel akan deploy ke production.
>
> **Kelulusan anda (tampal prompt ini = lulus):** menjalankan SQL di bawah pada Supabase live.
> **TIDAK diluluskan:** apa-apa perubahan lain.

---

## 1. Tugasan

### 1.1 Pasang fungsi `current_role_name()` (PENTING — punca lock gagal)

```sql
-- FIX A: fungsi alias nama peranan (TEXT) — dirujuk oleh RPC governance
CREATE OR REPLACE FUNCTION public.current_role_name()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT up.role::text FROM public.user_profiles up WHERE up.id = auth.uid()),
    'viewer'
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_role_name() TO authenticated;
```

Sahkan: `SELECT to_regprocedure('public.current_role_name()');` → bukan NULL.

### 1.2 Siasat & betulkan `full_name` (nama pengguna)

**Diagnostik (read-only) — jalankan dan laporkan hasil:**
```sql
SELECT id, email, full_name, role FROM public.user_profiles ORDER BY email;
SELECT email, raw_user_meta_data->>'full_name' AS meta_name FROM auth.users ORDER BY email;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'user_profiles';
```

**Jika `full_name` NULL / kosong, jalankan fix berikut** (nama rasmi dari `V4 RAW/User Profiles Mapping.xlsx`):
```sql
UPDATE public.user_profiles AS up
SET full_name = v.full_name
FROM (VALUES
  ('zalina@mimos.my',          'Zalina Sayuti'),
  ('sitisarah.ramli@mimos.my', 'Siti Sarah'),
  ('abu.razak@mimos.my',       'Abu Sa''id'),
  ('qusyairi.zolkefle@mimos.my','Qusyairi'),
  ('fuziah.rahim@mimos.my',    'Fuziah'),
  ('adilah.nisman@mimos.my',   'Adilah'),
  ('aisyah.alias@mimos.my',    'Aisyah'),
  ('nizar.harun@mimos.my',     'Dr. Ahmad Nizar'),
  ('farrah.johar@mimos.my',    'Farrah'),
  ('sholihin.abdullah@mimos.my','Sholihin'),
  ('muhammadafiq.azmi@mimos.my','Dr. Afiq'),
  ('ainur.rodzi@mimos.my',     'Ainur Najwa'),
  ('suhairi.soobni@mimos.my',  'Mohd Suhairi'),
  ('omar.azmi@mimos.my',       'Omar'),
  ('fatin.pata@mimos.my',      'Fatin Firzana'),
  ('amalia.rizam@mimos.my',    'Amalia Adriana'),
  ('aleeya.amran@mimos.my',    'Nur Aleeya'),
  ('yusuf.zolkipli@mimos.my',  'Muhammad Yusuf'),
  ('saidrazak881@gmail.com',   'Admin')
) AS v(email, full_name)
WHERE up.email = v.email;
```

Sokong metadata auth (supaya fallback layout turut berfungsi):
```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('full_name', v.full_name)
FROM (VALUES
  ('zalina@mimos.my',          'Zalina Sayuti'),
  ('sitisarah.ramli@mimos.my', 'Siti Sarah'),
  ('abu.razak@mimos.my',       'Abu Sa''id'),
  ('qusyairi.zolkefle@mimos.my','Qusyairi'),
  ('fuziah.rahim@mimos.my',    'Fuziah'),
  ('adilah.nisman@mimos.my',   'Adilah'),
  ('aisyah.alias@mimos.my',    'Aisyah'),
  ('nizar.harun@mimos.my',     'Dr. Ahmad Nizar'),
  ('farrah.johar@mimos.my',    'Farrah'),
  ('sholihin.abdullah@mimos.my','Sholihin'),
  ('muhammadafiq.azmi@mimos.my','Dr. Afiq'),
  ('ainur.rodzi@mimos.my',     'Ainur Najwa'),
  ('suhairi.soobni@mimos.my',  'Mohd Suhairi'),
  ('omar.azmi@mimos.my',       'Omar'),
  ('fatin.pata@mimos.my',      'Fatin Firzana'),
  ('amalia.rizam@mimos.my',    'Amalia Adriana'),
  ('aleeya.amran@mimos.my',    'Nur Aleeya'),
  ('yusuf.zolkipli@mimos.my',  'Muhammad Yusuf'),
  ('saidrazak881@gmail.com',   'Admin')
) AS v(email, full_name)
WHERE auth.users.email = v.email;
```

**Jika polisi RLS `user_profiles` tiada** (dari pg_policies di atas), laporkan dahulu — jangan cipta
tanpa pengesahan lanjut (sepatutnya wujud: "Pengguna boleh lihat profil sendiri").

### 1.3 Sahkan deploy kod baharu (commit `34f1069`)

- Deployment Vercel terbaru → READY, Target: Production, commit `34f1069`.
- (Tiada ujian UI diperlukan daripada anda — pengguna akan uji selepas laporan ini.)

## 2. Larangan

1. JANGAN ubah skema/RLS/RPC/trigger/seed lain selain SQL FIX di atas.
2. JANGAN reset/ubah password mana-mana akaun.
3. JANGAN panggil RPC tulis perniagaan (`sync_import_transaction`, `lock_programme`,
   `unlock_programme`, `request_programme_unlock`, `submit_change_request`,
   `review_change_request`) — pengguna akan uji melalui UI selepas ini.
4. JANGAN guna `service_role` key dalam REST (SQL editor adalah OK untuk fix).
5. JANGAN merge ke `main` / tukar Production Branch.
6. JANGAN tampal anon key penuh / rahsia dalam laporan.

## 3. FORMAT LAPORAN (6 seksyen)

**Seksyen 1 — Fix A (current_role_name):** hasil `to_regprocedure` + bukti function definition wujud.
**Seksyen 2 — Diagnostik full_name:** jadual hasil SELECT (19 baris: email, full_name, role) —
sebelum & selepas fix; jumlah baris dikemaskini.
**Seksyen 3 — Polisi RLS user_profiles:** senarai pg_policies.
**Seksyen 4 — Deploy kod:** status deployment Vercel commit `34f1069` (READY/Production).
**Seksyen 5 — Isu / Blocker:** 🔴/🟠/🟢 + bukti verbatim.
**Seksyen 6 — Kesimpulan & Langkah Seterusnya:** pengesahan bahawa DB live kini sedia untuk
ujian semula UI (Kunci Program, Sunting Program, nama pengguna di header) oleh pengguna.
