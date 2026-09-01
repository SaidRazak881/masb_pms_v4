# PROMPT 4D — VERIFICATION AKHIR & PENUTUPAN FASA 4

> **Konteks:** Laporan 4C diterima (infrastruktur/DB/RLS/Auth = LULUS; manual UI menunggu pengguna).
> Pengguna TELAH menjalankan senarai semak manual UI (Test 2–9) — lihat jawapan pengguna dalam
> perbualan ini untuk status setiap test. Dua fix baharu telah di-push ke production (commit `609a4e5`):
> (1) fungsi `public.current_role_name()` ditambah ke skema (rujukan RPC `review_change_request`);
> (2) detail program papar user id sebenar.
>
> **Kelulusan sedia ada:** DDL kecil di bawah (SATU fungsi baharu) — diluluskan oleh pengguna dengan
> menampal prompt ini. Tiada kelulusan lain. **Jangan ubah apa-apa selain itu.**

---

## 1. Tugasan

1. **Sahkan deploy baharu:** deployment production commit `609a4e5` → READY, Target `production`.
2. **Pasang fungsi yang hilang** (SANGAT PENTING — RPC `review_change_request` memanggilnya tetapi ia belum wujud di DB live). Jalankan SQL ini sekali:
   ```sql
   -- FIX: fungsi alias nama peranan (TEXT) untuk RPC change-request legacy
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
   ```
   Sahkan: `SELECT to_regprocedure('public.current_role_name()');` → bukan NULL.
   JANGAN ubah RPC lain, skema, RLS, trigger, seed, atau storage.
3. **Verification DB read-only** selepas ujian manual pengguna:
   - Kesan import Test 5: rekod staging (bilangan, status), peserta/program baharu di destination,
     rekod audit import baharu — LAPORKAN sebenar (bukan jangkaan).
   - `change_requests` & `unlock_requests`: senarai rekod (status, requested_by, programme).
   - `audit_logs`: jumlah rekod & taburan action.
   - Lock state: program yang dikunci (locked=true, lock_reason).
   - RLS masih aktif pada jadual utama; anonymous simulation = 0 rekod.
   - Auth: 19 auth users / 19 identities / 19 profiles; peranan tidak berubah.
   - **Larangan:** jangan panggil RPC tulis (`sync_import_transaction`, `lock_programme`,
     `unlock_programme`, `submit_change_request`, `review_change_request`, `request_programme_unlock`).

## 2. FORMAT LAPORAN (6 seksyen — mesti penuh)

**Seksyen 1 — Status Deployment & Fix**
- Deploy `609a4e5` READY/Production; `to_regprocedure('public.current_role_name()')` wujud.
- Kesan fix UI: sahkan detail program production tidak papar "current-user" (boleh sahkan dari
  HTML/SSR halaman detail dengan sesi pengguna).

**Seksyen 2 — Keputusan Ujian Manual Pengguna (jadual)**
- Test 2–9: Status ✅/❌/⏳ + bukti dari laporan pengguna (ringkaskan).

**Seksyen 3 — Verification DB (read-only) — jadual**
- Import (staging/destination/audit), change_requests, unlock_requests, audit_logs, lock state,
  RLS, auth — setiap satu: nilai sebenar yang anda lihat.

**Seksyen 4 — Isu / Blocker**
- 🔴/🟠/🟢 + penerangan + bukti verbatim + cadangan.

**Seksyen 5 — Pengesahan Penuh**
- Login Supabase sebenar ✅, data seed (bukan mock) ✅, RLS ✅, middleware ✅, import E2E ✅/❌,
  governance UI ✅/❌, staff locked-programme UI ✅/❌.

**Seksyen 6 — Kesimpulan & Langkah Seterusnya**
- Fasa 4: **LULUS** / SEBAHAGIAN / GAGAL + justifikasi.
- Cadangan konkrit Fasa 5 (saya akan semak & sediakan prompt):
  1. Tukar password lalai `masb.12345` untuk SEMUA 19 akaun (janakan password rawak setiap akaun
     + cara serah selamat kepada pengguna).
  2. Aktifkan MFA untuk admin + head_governance.
  3. Domain kustom (pilihan).
  4. Ujian regression berkala + monitoring Vercel.

## 3. Larangan

1. JANGAN reset/ubah password mana-mana akaun (Fasa 5, dengan prompt berasingan).
2. JANGAN ubah skema/RLS/RPC/trigger/seed/storage selain SQL fix di atas.
3. JANGAN guna `service_role` dalam ujian.
4. JANGAN panggil RPC tulis perniagaan.
5. JANGAN merge ke `main` / tukar Production Branch.
6. JANGAN tampal anon key penuh / sebarang rahsia dalam laporan.
