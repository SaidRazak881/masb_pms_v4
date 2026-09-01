# ACTION 4A — SETUP VERCEL (TINDAKAN MANUAL ANDA)

> **Konteks:** Laporan GPT Fasa 4 disemak & **disahkan benar** oleh semakan bebas:
> `https://masb-pms-v4.vercel.app/programmes` memaparkan *"Paparan mock: 0 daripada 0 program"* —
> env Supabase belum wujud di Vercel, jadi app berjalan dalam Mod Demo.
> Dua blocker: (1) Production Branch masih `main`; (2) env `NEXT_PUBLIC_SUPABASE_URL` /
> `NEXT_PUBLIC_SUPABASE_ANON_KEY` tiada.
>
> Dokumen ini = tindakan MANUAL di dashboard Vercel (bukan tugasan GPT).
> Selepas siap, sambung E2E dengan `docs/PROMPT-4B-E2E-VERIFY.md` di ChatGPT.

---

## Langkah 1 — Production Branch → `arena/01a05cd4-masb-pms-v4`

1. Buka: <https://vercel.com/saidrazak881-5747/masb-pms-v4/settings/git>
2. **Production Branch** → tukar kepada: `arena/01a05cd4-masb-pms-v4` → **Save**.
3. Vercel akan auto-deploy branch itu sebagai **Production** (target: `production`).
   - JANGAN merge ke `main`. Branch `arena/01a05cd4-masb-pms-v4` ialah branch rasmi fasa ini.

## Langkah 2 — Environment Variables (3 scopes)

1. Buka: <https://vercel.com/saidrazak881-5747/masb-pms-v4/settings/environment-variables>
2. Tambah dua (2) variable, setiap satu dengan **Environments: Production + Preview + Development**:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://lmenmfsbjgxfhnykkgow.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<anon key anda>` — Supabase Dashboard → Project Settings → **API Keys** → salin `anon` `public` key |

   ⚠️ **Larangan:**
   - JANGAN guna `service_role` key (ia bypass RLS & bahaya di frontend).
   - JANGAN tampal anon key ke GitHub / kod sumber / mesej (ia public key, tetapi kekal dalam Vercel sahaja lebih bersih).

## Langkah 3 — Redeploy

1. Vercel → **Deployments** → pilih deployment branch `arena/01a05cd4-masb-pms-v4` → menu ⋯ → **Redeploy**.
2. Jika ditanya environment → pilih **Production**.
3. Status yang dikehendaki: `Target: Production` · `State: READY` · commit `e8c70f3` (atau lebih baru).

## Langkah 4 — Pengesahan pantas (2 minit)

| Ujian | Jangkaan |
|---|---|
| Buka `https://masb-pms-v4.vercel.app` (belum login) | Redirect ke `/login` (bukan dashboard) |
| Login `zalina@mimos.my` / `masb.12345` | Masuk `/dashboard`; header: **Zalina Sayuti · Pentadbir Sistem · Log Keluar**; TIADA banner "Mod Demo" |
| `/programmes` | 4 program seed (bukan "Paparan mock") |

- Jika login gagal dengan `masb.12345` → **jangan reset sendiri**; teruskan ke ChatGPT dengan `docs/PROMPT-4B-E2E-VERIFY.md` — GPT akan minta kelulusan reset SATU admin sahaja.
- Nota: preview deployment (`*-git-arena-*.vercel.app`) akan minta login Vercel (Deployment Protection) — itu **normal**, bukan blocker; ujian guna domain production sahaja.

---

## Selepas siap

Tampal `docs/PROMPT-4B-E2E-VERIFY.md` ke ChatGPT → jalankan → kongsikan laporan di sini untuk semakan.

**Peringatan kekal:** password lalai `masb.12345` WAJIB ditukar untuk semua 19 pengguna selepas live disahkan.
