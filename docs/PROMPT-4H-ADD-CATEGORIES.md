# PROMPT 4H — PASANG KATEGORI PROGRAM BAHARU DI DB LIVE

> **Konteks:** Dua pembaikan kod telah dibuat & di-deploy (commit `8066e95`):
> 1. **Butang "Program Baharu" kini berfungsi** — borang sebenar (tajuk, pelanggan, kod auto,
>    kategori, mod, tarikh, lokasi, jurulatih, pengurus) → server action `createProgramme` →
>    insert ke Supabase. Sebelum ini ia hiasan mock.
> 2. **Kategori baharu**: `Room Rental`, `Consultancy`, `Certification` ditambah ke
>    jenis TypeScript, senarai UI (Program Baharu, Sunting Program, Laporan) dan pemetaan RPC
>    import (`rental`, `consultancy`, `consulting`, `certificate`, `certification`).
>
> **Satu-satunya langkah DB yang tinggal:** enum `programme_category` di Supabase live mungkin
> belum mempunyai nilai `Consultancy` (dan pastikan `Room Rental` / `Certification` wujud).
> **Kelulusan anda:** menjalankan SQL fix di bawah (fail rasmi). Tiada perubahan lain.

---

## 1. Jalankan SQL fix (idempotent)

Buka Supabase Dashboard → SQL Editor → New query, salin penuh kandungan fail:
`lib/supabase/fix-add-programme-categories.sql`
dari GitHub: https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/lib/supabase/fix-add-programme-categories.sql
(klik "Raw" → salin → jalankan). JANGAN ubah kandungan.

## 2. Pengesahan

```sql
SELECT e.enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'programme_category' AND t.typnamespace = 'public'::regnamespace
ORDER BY e.enumsortorder;
```
Jangkaan mesti mengandungi: `Room Rental`, `Consultancy`, `Certification`.

## 3. Sahkan deploy kod

- Deployment Vercel terbaru (commit `8066e95`) → READY, Target: Production.

## 4. Minta pengguna retest (production: https://masb-pms-v4.vercel.app)

Login `saidrazak881@gmail.com` / `masb.12345`:

| # | Ujian | Jangkaan |
|---|---|---|
| A | **Program Latihan** → **Program Baharu** | Dialog sebenar terbuka (bukan mock) |
| B | Isi tajuk, pilih kategori **Consultancy** (atau Room Rental / Certification), pilih mod, klik **Simpan Draf** | Mesej "Program berjaya dicipta"; program baharu muncul dalam senarai; klik buka detail → kategori betul |
| C | **Sunting Program** pada program baharu | Senarai kategori termasuk Room Rental / Consultancy / Certification |
| D | **Laporan** → penapis kategori | Kategori baharu tersedia |

## 5. FORMAT LAPORAN (5 seksyen)

1. **Pemasangan SQL:** output penuh / bukti tiada error; boleh jalankan dua kali (idempotent).
2. **Pengesahan enum:** senarai nilai (mesej termasuk 3 kategori baharu).
3. **Deploy:** status commit `8066e95`.
4. **Retest A–D:** ✅/❌ + bukti ringkas (mesej, tangkapan skrin).
5. **Isu & Kesimpulan:** sebarang ralat verbatim + cadangan.

## 6. Larangan

1. JANGAN ubah skema/RLS/RPC/trigger/seed/password lain selain fail fix di atas.
2. JANGAN panggil RPC tulis dari tool — ujian melalui UI pengguna sahaja.
3. JANGAN guna `service_role`.
4. JANGAN merge ke `main` / tukar Production Branch.
5. JANGAN tampal rahsia dalam laporan.
