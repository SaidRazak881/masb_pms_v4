# PROMPT 6H — E1–E9 dengan kriteria redirect yang TEPAT

> **Persona kamu:** Jurutera pangkalan data yang teliti dan berhati-hati
> (`docs/personas/PERSONA-SQL-ARCHITECT.md`).
>
> **Keadaan:** Anda melaporkan Production deployment kini pada commit
> `ac0587173820e88c683b0440511d13d92d0952b1`, **READY**, dari branch
> `arena/01a06274-masb-pms-v4`, dan `/register` kini **HTTP 200 dengan UI
> Fasa 6** (sebelum ini 404).
>
> **Keputusan Arena:**
> 1. ✅ **E-1 (Production Branch) DISAHKAN SELESAI.** Arena mengesahkan secara
>    bebas: `git ls-remote origin arena/01a06274-masb-pms-v4` =
>    `ac0587173820e88c683b0440511d13d92d0952b1` — **tepat sama** dengan commit
>    deployment Production yang anda laporkan, dan ia **hujung branch semasa**.
>    Kriteria hash PROMPT-6F §1(4) **dipenuhi**.
> 2. ✅ **Bukti anda sudah mencukupi untuk menunjukkan Fasa 6 berada di
>    Production.** `/register` = 404 → **200 dengan UI Fasa 6** tidak boleh
>    berlaku tanpa penukaran branch.
> 3. 🔧 **Sebab anda menahan E1–E9 ialah kriteria Arena yang tidak tepat, bukan
>    bukti yang tidak mencukupi.** Lihat §1 — ini kesilapan Arena, dan ia
>    kesilapan #7.
> 4. ⛔ **PROMPT-6G masih menunggu kelulusan pengguna.** Jangan jalankannya.

---

## 1. Pembetulan kriteria E1–E9 (kesilapan Arena #7)

### Apa yang anda lihat

> `/admin/users` sekarang **HTTP 200**, tetapi kandungannya masih `/login`,
> jadi belum authenticated.

> Aku belum boleh declare E1–E9 PASS sebab Production masih belum menunjukkan
> keseluruhan flow authenticated Fasa 6.

### Kenapa itu sebenarnya **LULUS**

Kod middleware (`lib/supabase/middleware.ts`, pada commit `ac05871`):

```ts
const PROTECTED_PREFIXES = [
  "/dashboard", "/programmes", "/import", "/participants",
  "/reports", "/security", "/admin",
];

if (!user && isProtected) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirect", path);
  return NextResponse.redirect(loginUrl);
}
```

`NextResponse.redirect` membalas **3xx** dengan `Location: /login?redirect=...`.
Jika alat HTTP anda **mengikut redirect** (kelakuan lalai kebanyakan klien),
anda akan melihat:

```
HTTP 200          ← daripada /login SELEPAS mengikuti redirect
kandungan /login  ← halaman log masuk
```

**Itu tepat apa yang anda laporkan untuk `/admin/users` dan `/programmes`.**
Jadi kedua-duanya **berkelakuan betul**. Yang hilang dalam laporan anda ialah
**URL akhir selepas redirect** — itu bukti yang menentukan.

### Kesilapan Arena

Kriteria E1–E9 dalam PROMPT-6/6E/6F ditulis sebagai:

> `E2 | /admin/users | redirect ke /login?redirect=%2Fadmin%2Fusers`

Perkataan "redirect ke" **tidak menyatakan** sama ada ia bermaksud
**status 3xx mentah** atau **URL akhir selepas redirect diikuti**. Arena juga
tidak menyatakan bahawa **E1–E9 ialah semakan tanpa log masuk sepenuhnya** —
jadi anda menahan PASS kerana menjangkakan "flow authenticated", yang
**memang tidak akan pernah kelihatan** dalam E1–E9.

**Peraturan pengajaran:** kriteria yang melibatkan HTTP redirect mesti
menyatakan **sama ada redirect diikuti**, dan **medan mana** yang menjadi bukti
(status mentah, `Location` header, atau URL akhir).

---

## 2. E1–E9 dengan kriteria TEPAT

**Sila jalankan semula kesemua E1–E9 dan laporkan SEMUA medan ini bagi setiap
satu:**

| Medan | Apa yang perlu dilaporkan |
|-------|---------------------------|
| `status_mentah` | Kod status **sebelum** mengikuti redirect (3xx jika ada). Jika alat anda tidak boleh melumpuhkan pengikutan redirect, tulis `tidak tersedia` |
| `location_header` | Nilai header `Location` bagi 3xx. `tiada` jika 200 terus |
| `url_akhir` | **URL penuh selepas semua redirect** — ini bukti utama |
| `status_akhir` | Kod status selepas mengikuti redirect |
| `kandungan` | Rentetan yang ditemui / tidak ditemui |

### Kriteria

| # | URL | LULUS jika |
|---|-----|-----------|
| **E1** | `/programmes` | `url_akhir` = `https://masb-pms-v4.vercel.app/login?redirect=%2Fprogrammes` (atau `?redirect=/programmes`) **dan** `status_akhir` = 200 |
| **E2** | `/admin/users` | `url_akhir` = `.../login?redirect=%2Fadmin%2Fusers` (atau `?redirect=/admin/users`) **dan** `status_akhir` = 200 |
| **E3** | `/login` | `status_akhir` = 200, `url_akhir` = `/login` (tiada redirect), **dan** kandungan mengandungi **kesemua**: `masb.12345`, `Daftar Akaun Baharu`, `Lupa kata laluan?` |
| **E4** | `/register` | `status_akhir` = 200 **dan** kandungan mengandungi **kedua-dua**: `Daftar Akaun Baharu`, `Menunggu Kelulusan` |
| **E5** | `/forgot-password` | `status_akhir` = 200 **dan** kandungan mengandungi `Lupa Kata Laluan` |
| **E6** | `/pending-approval` | `status_akhir` = 200 **dan** kandungan mengandungi `Menunggu Kelulusan` |
| **E7** | `/account-blocked` | `status_akhir` = 200 **dan** kandungan mengandungi `Akaun Disekat` |
| **E8** | `/security` | `url_akhir` = `.../login?redirect=%2Fsecurity` (atau `?redirect=/security`) **dan** `status_akhir` = 200. **Nota:** `/security` ada dalam `PROTECTED_PREFIXES`, jadi tanpa sesi ia **mesti** redirect ke `/login` |
| **E9** | `/login`, `/register`, `/security` (selepas redirect → `/login`), `/forgot-password` | **TIADA SATU PUN** rentetan berikut muncul dalam HTML: `authenticator`, `Pengesahan 2-Langkah`, `kod 6 digit`, `TOTP`, `MFA`, `MfaGuard` |

### Yang **BUKAN** kriteria (jangan tahan PASS kerana ini)

- ❌ **"Flow authenticated"** — E1–E9 sengaja **tanpa log masuk**. Aliran
  bersesi diuji oleh **pengguna** melalui `docs/ACTION-6-UAT-AUTH-USERS.md`
  (A–K), bukan oleh anda.
- ❌ **Kandungan dashboard/admin** — tanpa sesi, anda **patut** melihat halaman
  log masuk. Itu bukti middleware berfungsi, bukan kegagalan.
- ❌ **Data pangkalan data** — E1–E9 hanya menguji routing + middleware + build.

### Jika E3 gagal

E3 ialah satu-satunya yang menguji **kandungan** halaman log masuk. Jika
`masb.12345` atau `Daftar Akaun Baharu` atau `Lupa kata laluan?` tiada, itu
**kegagalan sebenar** — laporkan rentetan yang **ada** supaya Arena boleh
bandingkan dengan `app/(auth)/login/page.tsx` pada `ac05871`.

### Bukti tambahan yang Arena minta (bukan kriteria lulus/gagal)

```
S1. Binaan: adakah Production build ID 4IMuVAXaR3CuAwoQ1MYtx membina
    commit ac05871? (Anda sudah melaporkan ya — sahkan semula.)
S2. Environment Variables: NEXT_PUBLIC_SUPABASE_URL dan
    NEXT_PUBLIC_SUPABASE_ANON_KEY wujud untuk Production dan Preview?
    (PROMPT-6F §1(5) — anda belum dapat mengesahkannya. Cuba lagi; jika
    masih tidak boleh, namakan operasi yang dicuba.)
    JANGAN papar nilai.
S3. /api atau server function: adakah sebarang ralat dalam Runtime Logs
    Vercel untuk deployment ini? Laporkan 5 ralat terkini jika ada.
```

**S2 penting secara diagnostik:** jika `NEXT_PUBLIC_SUPABASE_URL` **tiada**,
middleware akan masuk ke **Mod Demo** (`if (!url || !anonKey) → next()` tanpa
pengalihan), dan E1/E2/E8 akan membalas **200 dengan kandungan sebenar**, bukan
redirect ke `/login`. Memandangkan anda **melihat** redirect ke `/login`, itu
**bukti tidak langsung bahawa env vars sudah wujud**. Sila sahkan secara
langsung jika boleh.

---

## 3. Status PROMPT-6G

**⛔ Jangan jalankan PROMPT-6G.** Ia mengandungi live SQL (DDL + REVOKE) dan
masih **menunggu kelulusan eksplisit pengguna** — itu HARD GATE mengikut
perjanjian proyek.

PROMPT-6G tetap sah dan tidak berubah. Ringkasan untuk rujukan:

- §2 pasang `lib/supabase/updated-at-triggers.sql` (kriteria G1–G3)
- §3 REVOKE privilej tulis 3 jadual warisan, **SELECT dikekalkan** (H1–H3)
- §4 laporan sahaja: I1 (`governance_lock_status` masih wujud?), I2 (0 binding)

---

## 4. Larangan

1. JANGAN jalankan PROMPT-6G (menunggu kelulusan pengguna).
2. JANGAN jalankan sebarang DDL/DML/GRANT/REVOKE.
3. JANGAN guna `service_role`.
4. JANGAN panggil RPC perniagaan atau `admin_*`.
5. JANGAN merge ke `main`.
6. JANGAN tukar Production Branch — **ia sudah betul**, dan menukarnya akan
   merosakkan keadaan.
7. JANGAN cuba **log masuk** ke Production. E1–E9 ialah semakan tanpa sesi;
   log masuk sebenar ialah tugas **pengguna** (UAT).
8. JANGAN tampal anon key / secret penuh.
9. JANGAN cetak PII atau `default_password`.
10. JANGAN reka bukti — jika sesuatu medan tidak tersedia, tulis
    `tidak tersedia`.
11. JANGAN anggap Mod Demo tempatan sebagai produksi.
12. JANGAN tahan PASS E1–E9 kerana sebab yang disenaraikan dalam §2
    "Yang BUKAN kriteria".

---

## 5. FORMAT LAPORAN

```
📋 LAPORAN PROMPT-6H — E1–E9 (KRITERIA TEPAT)
==============================================

1. CONTEXT & STATUS
   - Status keseluruhan: 🟢 / 🟡 / 🔴
   - E1-E9: berapa PASS?
   - Pengesahan: Production commit == hujung branch (git ls-remote)

2. ACTIONS TAKEN
   - Alat/kaedah fetch; sama ada redirect diikuti atau tidak

3. VERIFICATION TABLE — satu baris per E, SEMUA medan
   | # | URL | status_mentah | location_header | url_akhir | status_akhir | kandungan | Status |

   E9: senaraikan setiap rentetan MFA dan sama ada ia ditemui, per halaman.

4. ADDITIONAL EVIDENCE
   - S1 build ID + commit
   - S2 env vars (wujud/tidak — TANPA nilai), atau operasi yang tiada
   - S3 ralat Runtime Logs terkini (jika ada)

5. ISSUES / BLOCKERS
   - E yang GAGAL, dengan url_akhir + kandungan sebenar (verbatim)
   - Jika E3 gagal: rentetan yang ADA dalam /login

6. COMPLIANCE CHECKLIST + CONCLUSION
   - 12 larangan: 🟢/🔴
   - Adakah Fasa 6 kini di Production? (bukti: E4 + E9)
   - Adakah MFA terbukti dibuang dari Production? (E9)
   - Apa yang pengguna perlu buat seterusnya?
```

---

## Nota untuk Arena (bukan untuk ChatGPT)

### Pengesahan bebas yang Arena lakukan

```
$ git ls-remote origin arena/01a06274-masb-pms-v4
ac0587173820e88c683b0440511d13d92d0952b1   ← hujung branch

Production deployment commit (laporan ChatGPT):
ac0587173820e88c683b0440511d13d92d0952b1   ← SAMA
```

Maka **Production Branch sudah ditukar** dan Vercel membina hujung branch
semasa. Tiada kerja Vercel yang tinggal kecuali mengesahkan env vars (S2).

### Nota operasi sandbox (rekod, bukan isu kod)

Sandbox Arena **reset semula** ke komit pangkal `535fb13` buat kali kedua
dalam sesi ini, dengan semua kerja Fasa 6 muncul sebagai perubahan tidak
dikomit. Arena **tidak** terus komit (itu akan menghasilkan komit mengelirukan).
Sebaliknya:

1. `git fetch` → sahkan remote = `ac05871`
2. Sahkan **10/10 fail kritikal mempunyai blob SHA yang IDENTIKAL** dengan
   `ac05871`
3. `git reset --mixed ac05871` → penunjuk branch dibetulkan, fail tidak disentuh
4. Pokok bersih, 0 perubahan tertunggak

**Remote tidak pernah rosak.** Ini isu persekitaran sandbox, bukan isu repo atau
deployment.

### Rekod pengajaran Fasa 6 — kini 7 kesilapan Arena

| # | Jenis | Perkara | Dikesan oleh |
|---|-------|---------|--------------|
| 1 | Kriteria | V3 `policy_count = 9` | ChatGPT |
| 2 | Kriteria | W1 allowlist 13 jadual (`grep` peka huruf besar) | ChatGPT |
| 3 | Proses | Gate "D sebelum E" tanpa sebab tertulis | ChatGPT |
| 4 | Kriteria | "`pg_depend` tidak jejak polisi RLS" — tidak diuji | **Arena sendiri** |
| 5 | Proses | "Alat tidak boleh" → pindahkan tugas kepada pengguna | **Pengguna** |
| 6 | Kriteria | "`private.has_role()` boleh escalate melalui INSERT" — WITH CHECK menolak INSERT | **Arena sendiri** |
| 7 | Kriteria | E1–E9 "redirect ke" tidak menyatakan sama ada redirect **diikuti**, dan tidak menyatakan bahawa ia semakan **tanpa log masuk** — menyebabkan ChatGPT menahan PASS yang sepatutnya lulus | **ChatGPT** (menahan dengan betul) + Arena (mentafsir) |

**Corak yang jelas:** 5 daripada 7 kesilapan Arena ialah **kriteria yang tidak
tepat**, bukan kod yang salah. Kod dan SQL Fasa 6 berfungsi; yang berulang kali
gagal ialah **cara Arena menyatakan apa yang dikira lulus**. Ini mengukuhkan
peraturan dalam `docs/PROMPT-TEMPLATE-FASA.md`: kriteria mesti diterbitkan
daripada ujian automatik, dan mesti menyatakan **skop** serta **medan bukti**
secara eksplisit.

### Baki tindakan pengguna

1. **Luluskan PROMPT-6G** (HARD GATE) — `updated-at-triggers.sql` + REVOKE
2. **D1/D3/D4** melalui Supabase Dashboard (D2 ✅ sudah dibuat).
   **D1 `Confirm email`: OFF atau ON?** Keputusan milik anda; Arena + ChatGPT
   kedua-duanya mencadangkan **OFF**.
3. Selepas E1–E9 hijau: **log masuk** `saidrazak881@gmail.com` / `masb.12345`
   → akan diarah ke `/security?required=1` → tukar kata laluan →
   `docs/ACTION-6-UAT-AUTH-USERS.md` (A–K)
4. Edarkan arahan kepada 19 pengguna: semua kata laluan kini `masb.12345`,
   wajib ditukar pada log masuk pertama
