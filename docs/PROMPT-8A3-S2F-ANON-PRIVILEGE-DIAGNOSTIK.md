# PROMPT 8A-3 / S2-F — Diagnostik `anon = true` (read-only, 4 query)

> **Untuk:** ChatGPT (mempunyai akses penuh Supabase + Vercel + GitHub)
> **Projek Supabase:** `lmenmfsbjgxfhnykkgow`
> **Repo:** `SaidRazak881/masb_pms_v4` · **Branch:** `arena/01a06274-masb-pms-v4`
> **Berikutan daripada:** laporan **L3-R** anda, yang melaporkan **S2 🔴** —
> `has_function_privilege('anon', …, 'EXECUTE') = true` bagi **7/7** fungsi
> Langkah 3, sedangkan jangkaan PGlite ialah `false`.
> **Sifat:** **READ-ONLY sepenuhnya.** 4 query katalog. Tiada DDL, tiada DML,
> tiada `GRANT`/`REVOKE`, tiada `service_role`, tiada kelulusan pengguna diperlukan.

> 🟢 **STATUS 2026-09-05 (DP-20.2): prompt ini SUDAH DILAKSANAKAN dan SUDAH
> DIJAWAB. JANGAN kongsi atau jalankan semula.** Keputusan F1–F4 direkodkan
> sebagai jadual dalam `docs/PROMPT-8A3-L4-SEED-ALIASES.md` Seksyen 3B, dan
> kesimpulannya dipadankan dengan pra-daftar DP-18.3 → **A (artifak platform)**.
> Fail ini dikekalkan sebagai **rekod sejarah** probe itu sahaja.
>
> Pengajarannya (DP-20.5): versi L4 yang terdahulu MEMOTONG bahagian FORMAT
> LAPORAN di bawah ke dalam dirinya, dan baris penutup "Berhenti selepas
> laporan. Jangan mula Langkah 4." bercanggah dengan arahan teruskan di dokumen
> yang sama — menyebabkan satu pusingan hilang. **Apabila membundel kandungan
> daripada prompt lain, potong bahagian KANDUNGAN sahaja; jangan bawa arahan
> penutupnya.** Kini dikunci oleh pengawal boleh uji dalam
> `scripts/test-prompt-8a3-install.mjs`.

---

## 0. Apa yang anda lakukan dengan betul — dan mengapa prompt ini wujud

**Anda betul pada setiap titik yang penting:**

* Anda **tidak** `REVOKE`, **tidak** `GRANT`, **tidak** `ALTER FUNCTION`, **tidak**
  ubah badan fungsi, **tidak** ubah RLS, **tidak** jalankan migration pembetulan.
* Anda **tidak** menyimpulkan bahawa L3 "setara" apabila satu probe ketat gagal.
* Anda **menyekat Langkah 4** dan menyerahkannya kepada Arena.
* Anda membezakan dengan tepat: *"Ini bukan bermakna S5 boleh bypass — S5
  menunjukkan ia tidak boleh. Tetapi prinsip least-privilege … tidak dipenuhi."*

Itu pemisahan yang betul antara **kelakuan** (S4/S5 lulus) dan **postur
privilej** (S2 gagal). Terima kasih.

### Mengapa Arena tidak terus membatalkan S2

Arena mempunyai **bukti mekanikal** bahawa jangkaan S2 itu sendiri mungkin salah,
dan bukannya live yang salah. Diukur dalam PGlite:

| Keadaan | `anon` ada EXECUTE? |
|---|---|
| A. Fixture PGlite **tanpa** *default privileges* | **0 / 7** ← inilah yang Arena kira sebagai jangkaan |
| B. Fixture PGlite **+** `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated` | **7 / 7** ← **tepat seperti live anda** |
| C. Dalam keadaan B, `REVOKE ALL ON FUNCTION … FROM PUBLIC` **diulang** | **masih `true`** |

**Dua perkara mengikuti daripada ini:**

1. **`REVOKE ALL … FROM PUBLIC` tidak membuang grant langsung kepada `anon`.**
   `PUBLIC` ialah pseudo-role; `anon` ialah peranan **berasingan**. Hanya
   `REVOKE … FROM anon` membuangnya — diukur: `true` → `false`.
2. Maka **SQL yang diluluskan pun, jika dilaksanakan byte-for-byte di Supabase,
   tetap menghasilkan `anon = true`** — *jika* projek ini mempunyai
   *default privileges* yang memberi EXECUTE kepada `anon` bagi fungsi baharu
   dalam `public`.

**Itu bermakna S2 🔴 mungkin BUKAN bukti bahawa pemasangan L3 tidak setia.**
Ia mungkin **artifak fixture** — kelas kecacatan yang sama yang Arena sudah
lakukan tiga kali: DP-14.1 (versi PostgreSQL), DP-14.2 (fixture kurang 2 profil),
DP-17.5 (trigger `on_auth_user_created` membatalkan atribut semaian).

### Tetapi Arena **tidak** akan mengisytiharkan itu berdasarkan PGlite sahaja

Eksperimen di atas membuktikan mekanisme itu **mencukupi** untuk menghasilkan
`anon = true`. Ia **tidak** membuktikan mekanisme itu **punca sebenar** di live
anda. Maka prompt ini mengukurnya di live. **Fakta dahulu, kata putus kemudian.**

> 🔴 **JANGAN ubah apa-apa.** Jangan `REVOKE`, jangan `GRANT`, jangan
> `ALTER DEFAULT PRIVILEGES`. Jika anda "memperbaiki" ini sebelum punca
> disahkan, kita akan kehilangan keupayaan untuk mengetahui sama ada ia
> sistemik atau khusus kepada Langkah 3 — dan mungkin memecahkan 17 fungsi
> Fasa 6 yang menggunakan corak yang sama.

---

## 1. PROBE

### F1 — Adakah projek ini mempunyai *default privileges* untuk fungsi?

Ini **bukti langsung**. `pg_default_acl` dengan `defaclobjtype = 'f'` menyimpan
privilej yang **automatik** diberi kepada fungsi yang dicipta kemudian.

```sql
SELECT 'F1' AS check_name,
       d.defaclrole::regrole::text      AS ditetapkan_oleh,
       coalesce(d.defaclnamespace::regnamespace::text, '(semua skema)') AS skema,
       d.defaclacl::text                AS acl
  FROM pg_default_acl d
 WHERE d.defaclobjtype = 'f'
 ORDER BY 2, 3;
```

**Cara membaca `acl`:** setiap entri berbentuk `ROLE=HAK/PEMBERI`.
`X` bermaksud **EXECUTE**. Jadi `anon=X/postgres` bermaksud *"fungsi baharu
dalam skema ini automatik memberi EXECUTE kepada `anon`"*.

* Jika anda melihat **`anon=X/…`** → **hipotesis DISAHKAN**: `anon = true`
  datang daripada platform, bukan daripada pemasangan L3.
* Jika **tiada baris**, atau tiada `anon=X` → **hipotesis DITOLAK**; punca lain
  dan S2 🔴 ialah penemuan sebenar yang memerlukan tindakan.

### F2 — Sistemik, atau khusus kepada Langkah 3?

Ini **pembeza paling kuat**. `user-management.sql` (Fasa 6, dipasang lebih awal)
mempunyai **19 fungsi**, dan **17** daripadanya menggunakan corak
`REVOKE ALL ON FUNCTION … FROM PUBLIC` + `GRANT EXECUTE … TO authenticated`
yang **sama persis** dengan Langkah 3.

```sql
SELECT 'F2' AS check_name,
       CASE WHEN p.proname IN (
              'am_backfill_account_manager','am_backfill_preview','am_confirm_alias',
              'am_list_staff','am_revoke_alias','am_unresolved_values',
              'can_resolve_account_managers')
            THEN 'L3 (baharu)' ELSE 'pra-L3 (sedia ada)' END AS kumpulan,
       count(*)::int                                                            AS bilangan_fungsi,
       count(*) FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE'))::int          AS anon_boleh,
       count(*) FILTER (WHERE has_function_privilege('authenticated', p.oid, 'EXECUTE'))::int AS auth_boleh
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
 GROUP BY 1
 ORDER BY 1;
```

* Jika **`pra-L3` juga `anon_boleh ≈ bilangan_fungsi`** → **sistemik**. Ia
  bukan kesan pemasangan L3; ia keadaan seluruh projek. S2 tidak boleh
  digunakan sebagai bukti ketidaksetiaan L3.
* Jika **`pra-L3` `anon_boleh = 0` tetapi `L3 = 7`** → **khusus kepada L3**,
  dan itu **🔴 penemuan sebenar** tentang cara L3 dipasang. Berhenti dan
  laporkan.

### F3 — Penjelasan alternatif: adakah `anon` ahli `authenticated`?

Satu lagi cara `anon` boleh mewarisi EXECUTE ialah **keahlian peranan**. Ini
menutup penjelasan itu supaya ia tidak kekal sebagai kemungkinan terbuka.

```sql
SELECT 'F3' AS check_name,
       m.rolname AS ahli,
       r.rolname AS ahli_kepada
  FROM pg_auth_members am
  JOIN pg_roles r ON r.oid = am.roleid
  JOIN pg_roles m ON m.oid = am.member
 WHERE r.rolname IN ('anon','authenticated','service_role')
    OR m.rolname IN ('anon','authenticated','service_role')
 ORDER BY 1, 2;
```

* Jika `anon` **ahli kepada** `authenticated` → grant kepada `authenticated`
  juga memberi kuasa kepada `anon`, dan itu penjelasan **berbeza** daripada
  F1. Laporkan kedua-duanya.
* Jika tiada baris melibatkan `anon` sebagai ahli → keahlian **bukan** punca.

### F4 — 🟠 PILIHAN: apa yang `anon` **sebenarnya** dapat lihat?

S4 sudah menunjukkan bahawa tanpa identiti ketiga-tiga fungsi baca memulangkan
**0 baris**, dan S5 menunjukkan fungsi tulis **menolak dengan 42501**. Oleh
kerana `anon` tidak mempunyai JWT, `auth.uid()` juga NULL bagi `anon` — jadi S4
sudah **memodelkan** pandangan `anon`. Probe ini mengesahkannya secara langsung.

```sql
SET ROLE anon;
SELECT 'F4' AS check_name,
       auth.uid()::text                            AS uid,
       (SELECT count(*) FROM public.am_list_staff())          AS staf_dilihat,
       (SELECT count(*) FROM public.am_unresolved_values())   AS nilai_dilihat;
RESET ROLE;
```

* Jangkaan: `uid = NULL`, `staf_dilihat = 0`, `nilai_dilihat = 0`.
* 🟠 Jika alat anda **tidak menyokong** `SET ROLE` atau kenyataan berbilang,
  laporkan `⏳ tidak dapat dijalankan` dengan mesej verbatim. **Jangan**
  simpulkan apa-apa daripadanya — probe ini **sokongan**, bukan penentu.
* 🔴 Jika `staf_dilihat > 0` sebagai `anon` → itu **kebocoran sebenar**.
  **BERHENTI** dan laporkan serta-merta.

---

## 2. FORMAT LAPORAN

**Seksyen 1 — Status:** project ref, pengesahan bahawa 4 probe ini read-only
(tiada DDL/DML/`GRANT`/`REVOKE`/`ALTER DEFAULT PRIVILEGES`/`service_role`), dan
pengesahan bahawa **tiada apa-apa diubah** di live.

**Seksyen 2 — Keputusan F1–F4:** tampal output **verbatim** bagi setiap probe.
Jangan ringkaskan `acl` dalam F1 — rentetan itu ialah bukti utama.

**Seksyen 3 — Penilaian punca.** Jawab tiga soalan ini secara eksplisit:

1. Adakah `pg_default_acl` mengandungi `anon=X/…`? (ya / tidak)
2. Adakah fungsi **pra-L3** juga `anon = true`? (ya / tidak / berapa)
3. Adakah `anon` ahli kepada `authenticated`? (ya / tidak)

Kemudian nyatakan **satu** kesimpulan:

* **A — artifak platform:** F1 ada `anon=X` **atau** F2 menunjukkan pra-L3 juga
  `true`. Maka `anon = true` **bukan** kesan pemasangan L3, dan **S2 dijangka
  gagal pada mana-mana projek Supabase** dengan SQL yang diluluskan ini.
* **B — penemuan sebenar khusus L3:** F2 menunjukkan pra-L3 `anon = false`
  tetapi L3 `anon = true`. Maka cara L3 dipasang **berbeza** daripada fail yang
  diluluskan, dan ini **🔴**.
* **C — tidak dapat ditentukan:** nyatakan apa yang menghalang.

**Seksyen 4 — Kesan keselamatan semasa.** Berdasarkan S4/S5 yang **sudah**
lulus dan F4 (jika dijalankan), nyatakan sama ada `anon` boleh **mendapat data**
atau **menulis** melalui mana-mana daripada 7 fungsi itu. Bezakan dengan jelas
antara *"anon boleh MEMANGGIL"* dan *"anon boleh MENDAPATKAN sesuatu"*.

**Seksyen 5 — Apa yang anda TIDAK ubah.** Senaraikan.

**Berhenti selepas laporan.** Jangan mula Langkah 4. Jangan `REVOKE`.

---

## 3. Apa yang Arena akan lakukan dengan jawapan anda

Direkodkan lebih awal supaya anda tahu kesimpulan ini **bukan** dicipta
selepas melihat data:

* **Jika A (artifak platform):** S2 diturunkan daripada 🔴 ketat kepada 🟠
  makluman, dengan **sebab diukur**. Fixture PGlite akan ditambah
  `ALTER DEFAULT PRIVILEGES` supaya ia **setara live** — ini kali keempat
  fixture Arena tidak setara live, dan pengawalnya akan diperketat supaya
  ia tidak boleh berlaku senyap sekali lagi. **L3-R akan diisytiharkan
  DIPUASKAN** (S1, S3, S4, S5, S6 semua 🟢) dan **Langkah 4 dibuka**.
* **Jika B (khusus L3):** L3-R **kekal 🔴**, dan Arena akan mengeluarkan
  fail pembetulan yang diluluskan. **Langkah 4 kekal disekat.**
* **Dalam kedua-dua kes,** soalan *least-privilege* yang anda bangkitkan
  **tidak ditutup** — ia diasingkan sebagai keputusan tadbir urus tersendiri
  (DP-18.4), kerana "pemasangan setia" dan "postur privilej yang kita mahu"
  ialah **dua soalan berbeza**. Yang kedua mungkin memerlukan
  `REVOKE EXECUTE … FROM anon` sebagai **migration aditif** — tetapi itu
  memerlukan kata putus panel dan kelulusan pengguna, dan **bukan** sesuatu
  yang anda patut lakukan sekarang.

---

## Nota untuk Arena (bukan untuk ChatGPT)

* Bukti mekanikal (PGlite, diukur): tanpa *default privileges* `anon = 0/7`;
  dengan `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO
  anon, authenticated` → `anon = 7/7`; dan `REVOKE ALL … FROM PUBLIC` **tidak**
  mengubahnya (hanya `REVOKE … FROM anon` yang berbuat demikian).
* **Tiada `ALTER DEFAULT PRIVILEGES` dalam mana-mana fail `lib/supabase/*.sql`**
  — jadi jika F1 mengesahkan, ia datang daripada **platform Supabase**, bukan
  daripada repo. Fixture PGlite tidak boleh menirunya daripada fail repo sahaja.
* **Tiada kod aplikasi memanggil mana-mana daripada 7 fungsi ini** (diukur:
  `grep` dalam `app/`, `lib/`, `components/` = kosong). Maka `REVOKE EXECUTE
  … FROM anon` **tidak memecahkan apa-apa hari ini** — tetapi UI 8A-2 akan
  memanggil `am_list_staff()` sebagai pengguna `authenticated`, jadi sebarang
  pembetulan mesti mengekalkan grant kepada `authenticated`.
* `user-management.sql`: **19 fungsi, 17 dengan `REVOKE ALL ON FUNCTION`** —
  itulah sebabnya F2 ialah pembeza paling kuat.
