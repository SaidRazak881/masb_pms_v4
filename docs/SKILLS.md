# SKILL REGISTER — Kemahiran Tambahan Agen Arena

Fail di `.claude/skills/<nama>/SKILL.md` ialah **Agent Skill** standard
(frontmatter `name` + `description`, diikuti arahan proses). Agen Arena
membacanya sebagai arahan operasi tambahan apabila pencetusnya padan.

| Skill | Laluan | Bila aktif | Sumber |
| ----- | ------ | ---------- | ------ |
| `vibe-coding-workflow` | `.claude/skills/vibe-coding-workflow/SKILL.md` | Kerja ciri baharu / perubahan bukan remeh / permintaan kurang jelas. **Bukan** untuk bug fix yang sudah ada langkah reproduksi jelas, perubahan satu baris, atau soalan kajian. | `vibe-coding-workflow.zip` di branch `main` (komit `69829fd`), dipasang **verbatim** |

## Peraturan

1. **Jangan ubah kandungan `SKILL.md`.** Ia dipasang verbatim daripada sumber
   yang diberi pengguna supaya tidak hanyut. Sebarang penyesuaian kepada
   projek ini ditulis di fail **ini**, bukan di dalam `SKILL.md`.
2. **Skill tidak mengatasi arahan pengguna.** Jika pengguna minta langkau fasa,
   ikut pengguna — tetapi catatkan penyimpangan itu dalam laporan.
3. **Skill tidak mengatasi larangan sedia ada** dalam
   `docs/PROMPT-TEMPLATE-FASA.md` dan `docs/GPT-ASSISTANT-PROMPTS.md`
   (tiada `service_role`, tiada ubah skema/RLS tanpa kelulusan, tiada merge ke
   `main`, tiada tukar Vercel Production Branch oleh ChatGPT tanpa arahan,
   tiada bukti rekaan).

## Pemetaan `vibe-coding-workflow` kepada amalan sedia ada projek ini

Skill ini **serasi** dengan aliran Fasa yang sudah kita pakai. Pemetaannya:

| Fasa skill | Padanan dalam projek TPMS | Bukti yang sudah kita hasilkan |
| ---------- | ------------------------- | ------------------------------ |
| 1 Clarify | Perbualan pengguna + ringkasan Task | Soalan jelas sebelum mula (cth. pembatalan MFA Fasa 5) |
| 2 Spec | `docs/PROMPT-*-*.md` (Tugasan + Larangan) | `docs/PROMPT-6-INSTALL-USER-MANAGEMENT.md` |
| 3 Plan | Langkah A→E bernombor + kriteria A1–A9 / C1–C14 | Langkah A–E dalam PROMPT-6 |
| 4 Build | Komit kecil berasingan dalam branch Arena | `806bf95` → `e7e0b3a` → `dec55c2` → `e47bf94` → `55b700b` |
| 5 Test | Skrip ujian dalam `scripts/` | 5 suite SQL; `test-preflight-b-sql.mjs` |
| 6 Review & Clean | Audit keselamatan kendiri + pembetulan | `docs/SETUP-SUPABASE.md` §8.1, §8.2 |
| 7 Release Prep | `docs/ACTION-*-UAT-*.md` + deploy Vercel | `docs/ACTION-6-UAT-AUTH-USERS.md` |

## Penyesuaian khusus projek ini (penting)

Perkara yang skill ini **menguatkan**, berdasarkan kesilapan sebenar yang
berlaku dalam projek ini:

1. **"Evidence over vibes" — bukti mesti boleh dikira, bukan anggaran.**
   Audit Arena sendiri pernah melepaskan blocker A7 kerana mengira
   `grep -c assert_can_manage_users` = 10 dan **menganggap** itu mencukupi,
   sedangkan 3 occurrence ialah baris `CREATE FUNCTION` / `REVOKE` / `GRANT`.
   Nombor baris yang ChatGPT laporkan juga tersilap 1–2 baris bagi 5 daripada
   8 fungsi. **Peraturan kini:** cap jari kandungan yang boleh dikira
   (bilang kejadian tepat, blob SHA, md5) — bukan nombor baris, bukan anggaran.

2. **"Surface assumptions early" — sahkan andaian terhadap persekitaran
   sasaran sebelum menghantar kerja kepada orang lain.**
   Blok preflight Langkah B yang ChatGPT jana akan **meruntuhkan keseluruhan
   output** di Supabase kerana andaian tersirat bahawa objek Fasa 6 sudah
   wujud. Arena sendiri jatuh ke perangkap yang sama dua kali (membalut rujukan
   jadual dengan `CASE`, kemudian dengan CTE `to_jsonb()`) sebelum sedar bahawa
   PostgreSQL mengikat nama jadual pada waktu **PARSE**.
   **Peraturan kini:** setiap blok SQL yang dihantar kepada ChatGPT mesti
   **diuji pada kedua-dua keadaan** — sebelum dan selepas objek baharu wujud.
   `scripts/test-preflight-b-sql.mjs` melakukan ini secara automatik dengan
   mengekstrak blok terus daripada dokumen, supaya ujian tidak boleh hanyut
   daripada dokumen.

3. **"Never invent requirements" + "Human remains in the loop".**
   ChatGPT bertindak **betul** apabila berhenti pada blocker A7 tanpa mereka-reka
   pembetulan dan tanpa menyentuh produksi. Itu contoh pematuhan skill yang
   baik dan mesti dikekalkan.

4. **"One phase at a time."**
   Jangan pasang SQL (Langkah C) sebelum output Langkah B disahkan. Jangan tukar
   Vercel Production Branch (Langkah E) sebelum SQL dipasang dan C1–C14 lulus.

## Ketetapan pengguna (2026-09-03) — TERIKAT untuk semua sesi

Dua keputusan pengguna yang mesti dipatuhi oleh mana-mana agen Arena yang
meneruskan kerja ini:

### 1. Ketat pintu gerbang: **SEDERHANA**

- **Bebas tanpa bertanya:** fasa Build + Test + Review & Clean dalam satu
  pusingan kerja — tulis kod, tambah/baiki ujian, jalankan semua suite, audit
  kendiri, betulkan bug yang dijumpai, kemas kini dokumen.
- **GERBANG KERAS — wajib berhenti dan tunggu kebenaran eksplisit pengguna**
  sebelum apa-apa yang menyentuh produksi atau tidak boleh dipulihkan:
  - memasang / mengubah SQL di Supabase live (termasuk meminta ChatGPT
    melakukannya)
  - menukar Vercel **Production Branch**
  - merge ke `main`, atau membuka PR ke `main`
  - memadam apa-apa fail di `main` atau mana-mana data perniagaan
  - `git push --force` ke branch yang bukan branch sesi Arena semasa
  - menetapkan semula kata laluan sebenar pengguna
- **Nota:** agen Arena **tidak boleh** mencapai Supabase atau Vercel dari
  sandbox (rangkaian ke `*.vercel.app` dan `raw.githubusercontent.com`
  disekat). Semua tindakan produksi dilaksanakan oleh **ChatGPT** melalui
  prompt, atau oleh pengguna sendiri.

### 2. Zip `vibe-coding-workflow.zip` di branch `main`: **CADANG PADAM**

Kandungan zip sudah dipasang di `.claude/skills/vibe-coding-workflow/SKILL.md`
pada branch `arena/01a06274-masb-pms-v4` (verbatim, disahkan dengan `diff`).
Dua salinan = dua sumber kebenaran yang boleh berhanyut.

- **Agen TIDAK AKAN memadamnya** — `main` dilindungi oleh larangan sedia ada
  dan pemadaman adalah tindakan tidak boleh dipulihkan.
- Pengguna yang memutuskan dan melaksanakan pemadaman sendiri (arahan di
  bawah).
- Sehingga ia dipadam, **`.claude/skills/vibe-coding-workflow/SKILL.md` ialah
  sumber kebenaran**. Jangan baca semula zip itu.

Arahan pemadaman (pilih salah satu):

```bash
# Cara 1 — CLI (dari checkout tempatan anda)
git checkout main && git pull
git rm vibe-coding-workflow.zip
git commit -m "chore: buang zip skill (kandungan kini di .claude/skills/)"
git push origin main

# Cara 2 — UI GitHub
# main → vibe-coding-workflow.zip → ikon tong sampah → Commit changes
```

Selepas pemadaman, sahkan skill masih ada:
`.claude/skills/vibe-coding-workflow/SKILL.md` pada branch arena (ia akan
masuk ke `main` bersama Fasa 6 apabila anda meluluskan merge kelak).

---

## Cara agen patut memulakan skill ini

Apabila pengguna meminta ciri baharu atau perubahan bukan remeh:

1. Sahkan: *"Kita akan ikut aliran vibe-coding berstruktur
   (Spec → Plan → Build → Test → Review → Clean → Release). Mula dengan
   memperjelaskan idea?"*
2. Jalankan Fasa 1. **Senaraikan andaian secara eksplisit** dan minta
   pengesahan sebelum menulis apa-apa kod.
3. Pada akhir setiap fasa: rumuskan hasil, tunjukkan bukti, dan **minta
   kebenaran eksplisit** untuk ke fasa seterusnya.
4. Hasilkan artefak di tempat yang projek ini sudah tetapkan — spec/prompt di
   `docs/`, ujian di `scripts/`, nota keselamatan di `docs/SETUP-SUPABASE.md`,
   senarai semak UAT di `docs/ACTION-*-UAT-*.md`.
5. Laporan akhir dalam **Bahasa Melayu**, mengikut FORMAT LAPORAN 6 seksyen
   dalam `docs/PROMPT-TEMPLATE-FASA.md`.
