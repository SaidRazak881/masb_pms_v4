# TEMPLAT PROMPT GPT — ALIRAN FASA A (Persona + Peta Kod)

> **Tujuan:** Setiap prompt GPT fasa depan (Fasa 5 dan seterusnya) MESTI menggunakan templat
> ini: **Persona** + **Peta Kod** + **Tugasan** + **Larangan** + **FORMAT LAPORAN**.
>
> Ini menjadikan output ChatGPT konsisten, tepat konteks, dan mudah disemak — mengurangkan
> blocker palsu dan pusingan betulkan.

---

## BLOK 1 — PERSONA (pilih SATU, tampal penuh)

| Jenis tugasan | Fail persona |
|---|---|
| SQL / Supabase / RLS / RPC / trigger / seed | `docs/personas/PERSONA-SQL-ARCHITECT.md` |
| Ujian / verifikasi / E2E / QA / UAT | `docs/personas/PERSONA-QA-UAT.md` |
| Keselamatan / kebenaran / audit RLS | `docs/personas/PERSONA-SECURITY-REVIEW.md` |
| Analisis perniagaan / spesifikasi / laporan keputusan | `docs/personas/PERSONA-BA-LAPORAN.md` |

> Arahan kepada ChatGPT: *"Baca fail persona di
> https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/{PATH}
> (klik Raw) dan AMALKAN persona itu sepanjang tugasan."*

## BLOK 2 — PETA KOD (lampiran standard)

> Arahan: *"Baca peta kod terkini di
> https://github.com/SaidRazak881/masb_pms_v4/blob/arena/01a06274-masb-pms-v4/docs/CODEBASE-MAP.md
> (klik Raw). Gunakan sebagai konteks struktur sistem — modul mana yang wujud, jadual/RPC mana
> yang ada, fail mana masih mock/demo. JANGAN cadangkan perkara yang sudah wujud."*
>
> (Nota dalaman: peta dikemas kini dengan `node scripts/codebase-map.mjs` sebelum setiap fasa.)

## BLOK 3 — TUGASAN (nyatakan)

1. Konteks & matlamat fasa ini.
2. Skop tepat (fail/SQL/UI mana yang terlibat).
3. Urutan langkah (jika ada).

## BLOK 4 — LARANGAN (standard, sesuaikan)

1. JANGAN ubah skema/RLS/RPC/trigger/seed/storage/password tanpa kelulusan eksplisit.
2. JANGAN guna `service_role` dalam sebarang ujian.
3. JANGAN panggil RPC tulis perniagaan dari tool anda (`sync_import_transaction`,
   `lock_programme`, `unlock_programme`, `request_programme_unlock`,
   `submit_change_request`, `review_change_request`) — ujian tulis melalui UI pengguna.
4. JANGAN reset/ubah password mana-mana akaun (Fasa 5 khas, dengan prompt berasingan).
5. JANGAN merge ke `main` / tukar Production Branch Vercel (`arena/01a06274-masb-pms-v4`).
6. JANGAN tampal anon key penuh / rahsia dalam laporan.
7. JANGAN mereka-reka bukti — setiap LULUS mesti ada bukti verbatim; jika tidak dapat uji,
   tulis `⏳ MENUNGGU PENGGUNA`.
8. JANGAN layan preview local (Mod Demo) sebagai production.

## BLOK 5 — FORMAT LAPORAN (standard 6 seksyen)

**Seksyen 1 — Konteks & Status:** apa yang disemak/disahkan (deploy commit, DB, dsb.).
**Seksyen 2 — Tindakan yang diambil:** langkah sebenar + output/bukti verbatim.
**Seksyen 3 — Keputusan ujian (jadual):** ujian | status ✅/❌/⏳ | bukti.
**Seksyen 4 — Isu / Blocker:** 🔴/🟠/🟢 + penerangan + bukti + cadangan.
**Seksyen 5 — Pengesahan penuh:** senarai semak dipatuhi (persona, larangan, mock vs live).
**Seksyen 6 — Kesimpulan & langkah seterusnya:** keputusan + cadangan.

---

## Senarai Semak Penyedia Prompt (saya/agent)

- [ ] Peta kod dikemas kini (`node scripts/codebase-map.mjs` → commit)
- [ ] Persona dipilih & pautan Raw disertakan
- [ ] Tugasan menyebut fail/komit berkaitan terkini
- [ ] Larangan lengkap
- [ ] FORMAT LAPORAN 6 seksyen disertakan
- [ ] Pengesahan kelulusan pengguna untuk sebarang perubahan DB/keselamatan
