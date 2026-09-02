# PROMPT 4F — FIX RLS INFINITE RECURSION + RETEST

> **Konteks:** Ujian UI pengguna mendedahkan ralat sebenar semasa "Simpan" perubahan program:
> **`infinite recursion detected in policy for relation "user_profiles"`**.
>
> **Punca (disahkan dari kod):** polisi RLS yang mengandungi subquery ke `public.user_profiles`
> (cth. "Admin boleh lihat semua profil", "Pengguna boleh kemaskini programmes jika tidak dikunci")
> menyebabkan rantaian recursion: UPDATE `programmes` → polisi UPDATE → subquery `user_profiles` →
> polisi SELECT `user_profiles` → subquery `user_profiles` lagi → recursion. Kesan sampingan:
> semua UPDATE ke jadual business gagal, dan `getCurrentGovernanceRole()` gagal → role jadi
> "viewer" → butang "Kunci Program" tidak muncul untuk nizar.
>
> **Fix (SUDAH DIBUAT dalam repo, commit `8057579`):** semua subquery `user_profiles` dalam polisi
> diganti dengan fungsi **`public.has_role(...)` (SECURITY DEFINER)** — fungsi SECURITY DEFINER
> tidak tertakluk kepada RLS, jadi recursion terputus. Fail rasmi:
> `lib/supabase/fix-rls-recursion.sql` (idempotent, 9 polisi dibaiki + fungsi bantuan dipastikan wujud).
>
> **Tugasan anda:** jalankan fail fix tersebut di Supabase live, sahkan, kemudian minta pengguna
> retest. **Kelulusan:** menjalankan SQL fix di bawah (fail rasmi). **Tiada kelulusan lain.**

---

## 1. Pasang fix di Supabase live

1. Buka Supabase Dashboard → SQL Editor → New query.
2. **Salin penuh kandungan fail ini dari GitHub:**
   `https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/lib/supabase/fix-rls-recursion.sql`
   (klik "Raw" untuk salin teks penuh — jangan sunting apa-apa).
3. Jalankan sekali. Fail idempotent — boleh jalankan dua kali untuk bukti.
4. **JANGAN** ubah apa-apa selain fail tersebut.

## 2. Pengesahan selepas pasang

```sql
-- a) Tiada polisi lagi yang merujuk user_profiles secara subquery
SELECT p.tablename, p.policyname
FROM pg_policies p
WHERE pg_get_expr(p.polqual, p.polrelid)::text LIKE '%user_profiles%'
  AND pg_get_expr(p.polqual, p.polrelid)::text LIKE '%SELECT 1 FROM public.user_profiles%';
-- Jangkaan: 0 baris

-- b) Fungsi bantuan wujud
SELECT to_regprocedure('public.has_role(public.app_role)') IS NOT NULL AS has_role_ok,
       to_regprocedure('public.current_role_name()') IS NOT NULL AS role_name_ok;

-- c) Ujian recursion (SELECT sahaja — TIADA tulis)
SELECT count(*) FROM public.user_profiles;  -- patut 19, TIADA ralat recursion
```

## 3. Ujian RLS tulis (read-only? TIDAK — ini ujian write PALING SELAMAT & BOLEH DIUNDUR)

Untuk membuktikan recursion sudah hilang, jalankan ujian terkawal berikut (dalam SATU transaksi yang
di-ROLLBACK — tiada kesan kekal):

```sql
BEGIN;
UPDATE public.programmes SET title = title WHERE id = (SELECT id FROM public.programmes LIMIT 1);
SELECT 'UPDATE OK — tiada recursion' AS result;
ROLLBACK;
```

Jalankan dua kali: sekali sebagai postgres (SQL editor) dan sekali dengan cara lain jika boleh.
Jika `UPDATE OK` muncul → fix berjaya.

**Larangan:** jangan buat UPDATE kekal (tanpa ROLLBACK) pada data perniagaan; jangan panggil
RPC tulis; jangan reset password; jangan ubah polisi lain.

## 4. Sahkan deploy kod

- Deployment Vercel terbaru (commit `8057579`) → READY, Target: Production.
- (Kod UI tidak berubah dalam commit ini — hanya SQL. UI sedia ada mencukupi.)

## 5. Minta pengguna retest (sediakan senarai ini dalam laporan anda)

Minta pengguna ulang di `https://masb-pms-v4.vercel.app`:

| # | Ujian | Jangkaan |
|---|---|---|
| A | Login `zalina@mimos.my` / `masb.12345` | Header: Zalina Sayuti · Pentadbir Sistem |
| B | Buka program → **Sunting Program** → ubah satu medan → **Simpan** | **Tiada ralat recursion**; mesej "Perubahan berjaya disimpan" |
| C | Login `nizar.harun@mimos.my` | Butang **"Kunci Program"** kelihatan pada program tidak dikunci → kunci → banner merah muncul |
| D | Login `abu.razak@mimos.my` → program dikunci | "Mohun Ubah Data" (bukan "Sunting") |
| E | Import Excel `public/samples/00. Quotation Tracker (1).xlsx` → Confirm Sync (pengguna klik) | Berjaya; Sejarah Import ada rekod |

## 6. FORMAT LAPORAN (6 seksyen)

**Seksyen 1 — Pemasangan:** bukti fail dijalankan (output SQL editor), dua kali jika ada.
**Seksyen 2 — Pengesahan:** hasil query (a) 0 baris, (b) kedua-dua fungsi TRUE, (c) count 19.
**Seksyen 3 — Ujian UPDATE terkawal:** output "UPDATE OK — tiada recursion" + ROLLBACK berjaya.
**Seksyen 4 — Deploy:** status Vercel commit `8057579`.
**Seksyen 5 — Retest pengguna:** Test A–E (✅/❌ + bukti ringkas).
**Seksyen 6 — Kesimpulan:** Fasa 4 kini layak ditutup? Isu terbuka lain?

## 7. Larangan

1. JANGAN ubah skema/RLS/RPC/trigger/seed lain selain fail fix di atas.
2. JANGAN reset/ubah password mana-mana akaun.
3. JANGAN panggil RPC tulis perniagaan (`sync_import_transaction`, `lock_programme`,
   `unlock_programme`, `request_programme_unlock`, `submit_change_request`,
   `review_change_request`) — ujian melalui UI oleh pengguna.
4. JANGAN guna `service_role` key dalam REST.
5. JANGAN merge ke `main` / tukar Production Branch.
6. JANGAN tampal anon key penuh / rahsia dalam laporan.
