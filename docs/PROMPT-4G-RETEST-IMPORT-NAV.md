# PROMPT 4G — RETEST IMPORT + NAVIGASI (SELEPAS FIX KOD)

> **Konteks:** Laporan 4F: A–D LULUS ✅; Import Excel FAIL ❌; Navigasi "Main Page" FAIL/UX ❌.
> Siasatan kod selesai. Punca paling mungkin Import: selepas muat naik, SEMUA rekod berstatus
> `pending` — jika pengguna terus klik "Confirm & Sync" tanpa memilih tindakan, sistem menolak
> dengan "Tiada rekod berkeputusan untuk disegerakkan" (CLIENT_VALIDATION_ERROR).
>
> **Fix kod SUDAH dibuat & di-deploy (commit `13078f2`):**
> 1. Auto-keputusan: rekod SAH (quotation/invoice/cost) kini terus ditanda `sync_confirmed`
>    selepas parse — pengguna boleh terus klik "Confirm & Sync".
> 2. Navigasi: butang **"Kembali ke Dashboard"** ditambah di halaman Import (atas) dan pada
>    skrin "Penyegerakan Selesai" (sebelum ini hanya "Muat Naik Fail Lain").
> 3. Teks kad "Fail Contoh" dikemas kini (sebelum ini menyatakan fail "tidak wujud" — lapuk).
>
> **Tugasan anda:** tiada perubahan DB/RLS/schema. Hanya sahkan deploy + minta pengguna retest
> dan laporkan dengan tepat.

---

## 1. Sahkan deploy

- Deployment Vercel terbaru → READY, Target: Production, commit `13078f2`.

## 2. Minta pengguna retest (production: https://masb-pms-v4.vercel.app)

Login sebagai `zalina@mimos.my` / `masb.12345`, kemudian:

### Test E1 — Import (ulang)
1. Buka **Import Data**.
2. Klik **"Cuba"** pada kad `00. Quotation Tracker (1).xlsx` (atau muat naik fail itu secara manual).
3. Jangkaan BAHARU: selepas parse, rekod sah terus bertanda **"sync_confirmed"** di panel semakan
   (tidak perlu pilih per baris).
4. Klik **"Confirm & Sync to Master"**.
5. Jangkaan: mesej **"Penyegerakan Selesai"** dengan bilangan diproses/dicipta; Sejarah Import ada
   rekod baharu.

### Test E2 — Navigasi
1. Pada skrin "Penyegerakan Selesai" → klik **"Kembali ke Dashboard"** → jangkaan ke `/dashboard`.
2. Di halaman Import (atas) → pautan **"Kembali ke Dashboard"** → jangkaan ke `/dashboard`.

## 3. Jika Import MASIH GAGAL — WAJIB kumpul bukti tepat

Jangan teka. Minta pengguna:
1. **Salin teks mesej ralat penuh** yang muncul (merah/amber) — contohnya "Tiada rekod
   berkeputusan...", "Batch import gagal dicipta: ...", "Baris staging gagal disimpan: ...",
   "Penyegerakan gagal dengan status HTTP ...", atau mesej RPC.
2. Nyatakan pada peringkat mana: selepas "Cuba" (parse error) / selepas Confirm (sync error) /
   halaman tidak berubah.
3. Jika ada, tangkapan skrin panel semakan (Review) sebelum Confirm.

Seterusnya (hanya jika perlu), semak Vercel runtime logs untuk `/api/import/sync` (Functions →
masb-pms-v4 → Logs) dan lampirkan error verbatim.

## 4. FORMAT LAPORAN (6 seksyen)

1. **Deploy:** status `13078f2` READY/Production.
2. **Test E1 (Import):** ✅/❌ + langkah yang diambil pengguna + output tepat.
3. **Test E2 (Navigasi):** ✅/❌ + apa yang berlaku.
4. **Isu/Blocker:** 🔴/🟠/🟢 + bukti verbatim (mesej ralat penuh, logs).
5. **Pengesahan:** Fasa 4 (A–E + navigasi) layak ditutup? Ya/Tidak + justifikasi.
6. **Kesimpulan & Langkah Seterusnya:** cadangan (cth. Fasa 5 — tukar password lalai `masb.12345`
   untuk 19 akaun + MFA admin/head_governance).

## 5. Larangan

1. JANGAN ubah skema/RLS/RPC/trigger/seed/storage/password.
2. JANGAN panggil RPC tulis dari tool anda — Confirm Sync hanya melalui UI pengguna.
3. JANGAN guna `service_role`.
4. JANGAN merge ke `main` / tukar Production Branch.
5. JANGAN tampal rahsia (anon key penuh) dalam laporan.
