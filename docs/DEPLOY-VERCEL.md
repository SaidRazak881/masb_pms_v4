# Panduan Deploy Vercel — TPMS MIMOS Academy

Dokumen ini menerangkan cara menyambungkan repositori GitHub ke Vercel,
menetapkan environment variables, dan menguji Preview Deployment.

---

## 0. Keadaan produksi SEMASA (Fasa 6)

| Perkara | Nilai |
| ------- | ----- |
| URL produksi | `https://masb-pms-v4.vercel.app` |
| **Production Branch** | **`arena/01a06274-masb-pms-v4`** |
| Projek Supabase | `lmenmfsbjgxfhnykkgow` |
| Model pengesahan | E-mel + kata laluan **sahaja** (MFA dibuang pada Fasa 6) |
| Kata laluan lalai | `masb.12345` — wajib ditukar pada log masuk pertama |
| Super Admin | `saidrazak881@gmail.com` → `/admin/users` |

> **Penting:** projek ini **tidak** deploy dari `main`. `main` ketinggalan
> (keadaan pra-Fasa 5). Setiap sesi Arena menggunakan branch
> `arena/<id>-masb-pms-v4` yang tersendiri, jadi **Production Branch mesti
> dikemas kini** setiap kali kerja berpindah ke branch baharu — lihat
> `docs/PROMPT-6-INSTALL-USER-MANAGEMENT.md` Langkah E.
>
> **Tetapan Supabase Auth yang diperlukan oleh Fasa 6:**
> Authentication → URL Configuration → `Site URL` =
> `https://masb-pms-v4.vercel.app`, dan tambah Redirect URL
> `https://masb-pms-v4.vercel.app/security**` (untuk aliran
> `/forgot-password` → `/security?reset=1`).

---

## 1. Prasyarat

- Repositori GitHub: `SaidRazak881/masb_pms_v4`
- Projek Supabase sudah siap (lihat `docs/SETUP-SUPABASE.md`)
- Akaun Vercel: https://vercel.com (log masuk guna akaun GitHub)

---

## 2. Import repositori ke Vercel

1. Buka https://vercel.com/new
2. Pilih **Import Git Repository**
3. Pilih repositori `masb_pms_v4`
4. Vercel akan mengesan Next.js secara automatik:
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next` (lalai)

### 2.1 Environment Variables

Klik **Environment Variables** dan tambah:

| Nama | Nilai | Skop |
| ---- | ----- | ---- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Production, Preview, Development |

> `NEXT_PUBLIC_*` dibaca pada masa **build**, jadi jika nilai berubah,
> deploy semula diperlukan.

5. Klik **Deploy**
6. Tunggu sehingga status **Ready** — aplikasi boleh diakses di
   `https://masb-pms-v4.vercel.app` (nama auto).

---

## 3. Aliran pembangunan (GitHub → Vercel)

Sambungan Vercel-for-GitHub memberikan automatik:

| Acara | Tindakan Vercel |
| ----- | --------------- |
| Push ke `main` | Deploy Production |
| Buka/update Pull Request | Deploy Preview (`masb-pms-v4-git-xxx.vercel.app`) |
| Merge PR | Deploy Production + markah Preview sebagai "ready" |

### Aliran kerja yang disyorkan

```text
1. Branch baharu:  git checkout -b feature/xxx
2. Ubah kod + commit + push
3. Buka Pull Request di GitHub
4. Ujian UAT pada Preview URL (dari komen PR)
5. Merge PR → Production
```

---

## 4. Post-deploy checklist

- [ ] `/login` boleh diakses dan log masuk berfungsi
- [ ] `/dashboard` memaparkan KPI (bukan "Mod demo" jika env diisi)
- [ ] `/programmes` memaparkan senarai program
- [ ] `/programmes/[id]` — tab Overview/Financial/Participants/Costs/Documents/Audit/Change Requests
- [ ] `/import` — muat naik fail contoh dari `public/samples/`
- [ ] `/import` → tab **Sejarah Import** menunjukkan batch
- [ ] `/participants` memaparkan senarai peserta
- [ ] `/reports` — 8 jenis laporan + **Eksport Excel**
- [ ] Program dikunci: butang Edit hilang, digantikan **Mohon Ubah Data**
- [ ] Head Governance boleh lulus/tolak change request

---

## 5. Domain sendiri (pilihan)

1. Vercel → Project → **Settings → Domains**
2. Tambah domain (cth. `tpms.mimos.my`)
3. Ikut arahan DNS (A record `76.76.21.21` atau CNAME `cname.vercel-dns.com`)

---

## 6. Troubleshooting

| Masalah | Penyelesaian |
| ------- | ------------ |
| Build gagal `Server actions must be async functions` | Pastikan fail `"use server"` hanya mengeksport fungsi async — logik tulen letak dalam modul biasa (cth. `lib/programme-mapper.ts`, `lib/import-shared.ts`) |
| Halaman masih "Mod demo" selepas deploy | Sahkan env var di **Settings → Environment Variables**, kemudian **Redeploy** |
| `Your project's URL and Key are required` | `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` tidak diisi atau build sebelum env disimpan |
| API `/api/import/sync` pulang 401 | Pengguna belum log masuk di Supabase Auth |
| Preview URL tidak muncul di PR | Semak Vercel → Project → **Settings → Git** → "Create preview deployments for pull requests" |
| RLS menolak data di Production tetapi OK di local | Pastikan pengguna wujud dalam Auth + `user_profiles` (lihat SETUP-SUPABASE.md §3) |

---

## 7. Log & monitoring

- **Vercel Logs**: Project → **Deployments** → pilih deploy → **Logs**
- **Supabase Logs**: Dashboard → **Logs** (API, Postgres, Auth)
- Untuk ralat runtime, lihat `console.error` dalam log Vercel (fungsi
  aplikasi sudah menulis ralat dengan konteks modul).
