# EVALUASI ALAT AI & MCP — CADANGAN PENAMBAHBAIKAN TPMS

> **Tarikh:** 2 September 2026 · **Semakan:** langsung dari GitHub API (metadata, lesen, tarikh push, bintang) + kajian struktur repo TPMS (`/home/user/masb_pms_v4`) + rekod fasa pembangunan.
> **Tujuan:** study semua alat yang dicadangkan, nilaikan kesan SEBELUM vs SELEPAS guna, dan beri pelan tindakan untuk keputusan anda. Tiada kod diubah — dokumen ini untuk semakan sahaja.

---

## 1. Ringkasan Eksekutif

Daripada 9 repositori dinilai, hanya **2 patut diguna segera dengan kos hampir sifar**, **1–2 patut dipertimbang selepas Fasa 5 (keselamatan)**, dan selebihnya **tunda / tidak sesuai** untuk sistem dalaman TPMS pada masa ini:

| Keputusan | Alat | Sebab ringkas |
|---|---|---|
| ✅ **GUNA SEKARANG** | **Agency Agents** (persona prompts) | Paling mudah, MIT, 149k★ — terus tingkatkan kualiti aliran kerja GPT kita tanpa pasang apa-apa |
| ✅ **GUNA SEKARANG** | **Peta kod ringan sendiri** (alternatif Graft/Codebase-Memory) | Skrip kecil `codebase-map` → dokumen konteks utk prompt GPT — selesaikan masalah "GPT tersasar" tanpa server MCP |
| 🟡 **PILIHAN FASA B** (selepas keselamatan) | **MCP Server "TPMS Data" read-only** (SDK MCP rasmi) | GPT/Claude boleh tanya data Supabase live secara selamat — kurangkan tekaan & laporan palsu |
| 🟡 **TUNDA** | **Graft**, **Codebase Memory MCP** | Berguna hanya bila anda guna IDE agents (Claude Code/Cursor) — bukan aliran semasa |
| 🔴 **TUNDA/TOLAK kini** | **OpenMontage** (AGPL, video), **LangGraph/CrewAI**, **Dify** | Domain berbeza / stack berat; nilai rendah utk sistem pengurusan dalaman sekarang |
| 🔴 **SIMPAN** | **Figma-Context-MCP** | Aktifkan hanya bila ada aliran reka bentuk Figma (tiada sekarang) |

> ⚠️ Nota kejujuran: dakwaan penjimatan token (~40–99%) dan kelajuan adalah **dakwaan pemasaran repo** — perlu diuji sendiri dalam konteks kita sebelum percaya.

---

## 2. Konteks Sistem Semasa (yang dinilai)

**TPMS MIMOS Academy** — Next.js 14 (App Router, TS), Tailwind + shadcn, Supabase (PostgreSQL, RLS, Auth, Storage), deploy Vercel. Modul: program, peserta, kewangan (quotation/invoice/cost), import Excel pintar, laporan & eksport, governance lock/change-request, 19 pengguna dengan peranan.

**Aliran kerja pembangunan sekarang:**
1. Saya (agent arena) ubah kod & SQL di repo → push → Vercel auto-deploy.
2. Untuk kerja DB live / ujian luar, anda tampal **prompt GPT** (folder `docs/PROMPT-*.md`) ke ChatGPT → GPT jalankan & lapor → saya semak laporan → next action.
3. UAT manual anda di production mendedahkan bug (cth. RLS recursion, butang mock, crash tarikh kosong).

**Kesakitan sebenar yang boleh dikurangkan oleh alat:**
- (a) Laporan GPT kadang-kala tersasar/tersilap (blocker palsu fasa 1; RLS recursion hanya dikesan di UAT lewat).
- (b) Setiap prompt perlu bawa konteks repo secara manual → panjang & tidak lengkap.
- (c) GPT tidak boleh baca DB live sendiri → terpaksa bergantung pada SQL yang anda tampal balik.
- (d) Tiada spec visual (Figma) — UI dibina terus.
- (e) Data program wujud tetapi tiada saluran "tanya data" untuk staf (semua melalui laporan sedia ada).

---

## 3. Jadual Metadata Alat (semakan langsung GitHub, 2026-09-02)

| Repositori | Fungsi | Bahasa | Lesen | Bintang | Aktif |
|---|---|---|---|---|---|
| GLips/Figma-Context-MCP | Baca layout Figma utk coding agents | TypeScript | MIT | ~15.8k | Ya |
| trailhq/Graft | Code graph utk jimat token agent (Claude Code/Cursor/Codex/Gemini) | TypeScript | MIT | ~5.4k | Ya |
| calesthio/OpenMontage | Sistem produksi video agentic (12 pipeline, 100+ tools) | Python | **AGPL-3.0** | ~55k | Ya |
| DeusData/codebase-memory-mcp | Knowledge graph kod, sub-ms queries (158 bahasa, binary tunggal) | C | MIT | ~42k | Ya |
| msitarzewski/agency-agents | 200+ persona ejen pakar (markdown prompts) | Shell/MD | MIT | ~150k | Ya |
| langchain-ai/langgraph | Orkestrasi ejen berdaya tahan (Python) | Python | MIT | ~41k | Ya |
| crewAIInc/crewAI | Framework ejen peranan kolaboratif | Python | MIT | ~58k | Ya |
| modelcontextprotocol/python-sdk | SDK MCP rasmi | Python | MIT | ~24k | Ya |
| langgenius/dify | Platform aplikasi LLM visual (RAG, workflow) | TypeScript | NOASSERTION | ~154k | Ya |

> Nota: **OpenMontage = AGPL-3.0** (copyleft kuat) & **Dify = NOASSERTION** (lesen tidak jelas) — penting untuk sebarang integrasi produk.

---

## 4. Penilaian Demi Alat — SEBELUM vs SELEPAS

### 4.1 Agency Agents — ✅ GUNA SEKARANG (kos ~0)

| | |
|---|---|
| **Apa dia** | Koleksi 200+ peranan ejen lengkap dengan *system prompt*, personaliti, proses & *deliverable* (format markdown). MIT. |
| **SEBELUM guna** | Prompt GPT kita panjang tetapi **struktur persona tidak tetap** — GPT boleh "lupa" peranan (cth. laporan fasa 1 penuh blocker palsu; lintasan RLS terlepas hingga UAT). Setiap prompt ditulis dari kosong. |
| **SELEPAS guna** | Kita adaptasi persona pakar menjadi **templat prompt tetap** dalam repo (cth. `PERSONA-SQL-ARCHITECT.md`, `PERSONA-QA-UAT.md`, `PERSONA-SECURITY.md`, `PERSONA-BA-REPORT.md`). Setiap fasa GPT bermula dengan persona tetap + deliverable format → output lebih konsisten, kurang tersasar. |
| **Usaha** | ~1 hari (salin + adaptasi 3–4 persona ke dalam gaya dokumen kita). Tiada dependency, tiada server. |
| **Risiko** | Sangat rendah (hanya teks). Perlu disiplin guna templat. |

### 4.2 Peta Kod Ringan Sendiri (alternatif Graft / Codebase-Memory) — ✅ GUNA SEKARANG

| | |
|---|---|
| **Apa dia** | Skrip `scripts/codebase-map.mjs` (Node, guna fail sedia ada) menjana `docs/CODEBASE-MAP.md`: senarai modul app/components/lib, jadual & RPC Supabase, titik integrasi (login/RLS/import/governance), status komponen mock vs live. |
| **SEBELUM guna** | Prompt GPT hanya bawa konteks yang anda salin manual → GPT tak nampak keseluruhan sistem → tersilap cadang (cth. cadang polisi yang bertindih, tak tahu butang masih mock). |
| **SELEPAS guna** | Setiap prompt GPT bermula dengan lampiran **peta kod terkini** (1–2 halaman) → GPT faham sempadan modul, tahu apa yang live vs mock, kurang cipta benda tak wujud. Boleh dikemaskini bila-bila (1 arahan). |
| **Usaha** | ~0.5 hari (skrip + jana pertama + arahan kemaskini). |
| **Risiko** | Rendah. Peta boleh lapuk jika tak dikemaskini — jadi jadikan langkah wajib sebelum setiap fasa GPT. |

> **Kenapa bukan Graft/Codebase-Memory MCP terus?** Kedua-duanya direka untuk **IDE agents yang menyokong MCP** (Claude Desktop, Cursor, VS Code+Copilot). Aliran semasa kita = ChatGPT web + agent sandbox, yang tidak menjalankan MCP server. Faedah terasnya (konteks padat utk agent) boleh kita peroleh dengan peta kod ringan — tanpa pasang binary/Go/C toolchain. Bila anda mula guna Cursor/Claude Code, barulah nilai sebenar Graft (jimat token) & Codebase-Memory (graf kekal) masuk — MIT, sedia untuk dicuba.

### 4.3 MCP Server "TPMS Data" (read-only) — 🟡 PILIHAN FASA B

| | |
|---|---|
| **Apa dia** | Server MCP kecil (guna **SDK MCP rasmi** — wujud versi TypeScript selari stack kita) yang dedahkan **tool baca-sahaja** ke Supabase: `cari_program`, `statistik_dashboard`, `cari_invoice`, `senarai_peserta`, `laporan_ringkas`, dsb. Disambung ke klien MCP (Claude Desktop / Cursor). |
| **SEBELUM guna** | GPT bantu urus sistem **buta** terhadap data live — setiap semakan DB mesti melalui SQL yang anda tampal balik; laporan kadang-kala salah angka/tekaan. |
| **SELEPAS guna** | GPT boleh **query data sebenar secara langsung** (melalui tool terkawal, bukan SQL bebas) → laporan lebih tepat, diagnosis pantas (cth. "berapa program active?", "invoice tertunggak siapa?"). Tool baca-sahaja + RLS + audit = selamat; tiada tool tulis. |
| **Usaha** | ~2–3 hari (server + auth + ujian + dokumen). Hosting: Vercel (MCP Streamable HTTP) atau VPS kecil. |
| **Risiko / Syarat** | Data sensitif — WAJIB selepas Fasa 5 (password+MFA); hadkan tool; log akses. Perlukan klien MCP yang anda sedia guna. |

### 4.4 Graft — 🟡 TUNDA (guna bila ada IDE agents)

| | |
|---|---|
| **SEBELUM** | Jika guna Claude Code/Cursor utk ubah kod, agent membaca banyak fail → token tinggi, lambat. |
| **SELEPAS** | Graft (MIT, TS, npm) bina graf kod; agent minta konteks relevan sahaja. Dakwaan vendor: ~40% kurang token. |
| **Usaha/Risiko** | Pasang + biasakan; peta perlu dikemaskini bila kod berubah. Kesan mesti diukur sendiri. **Tidak berguna sekarang** kerana tiada IDE agent dalam aliran. |

### 4.5 Codebase Memory MCP — 🟡 TUNDA

| | |
|---|---|
| **SEBELUM** | Agent/onboarding perlu faham struktur kod dari awal setiap sesi. |
| **SELEPAS** | Graf pengetahuan kekal (158 bahasa, sub-ms) — MIT, binary tunggal. |
| **Usaha/Risiko** | Perlu MCP client + indeks dikemaskini. Sama seperti Graft — relevan bila aliran berpindah ke IDE agents. |

### 4.6 Figma-Context-MCP — 🔴 SIMPAN DULU

| | |
|---|---|
| **SEBELUM** | UI dibina terus dengan shadcn/Tailwind tanpa spec visual → susah pastikan selari mockup jika ada. |
| **SELEPAS** | Agent baca struktur/layout/style Figma terus (MIT, TS, 15.8k★) → implementasi tepat dari reka bentuk. |
| **Syarat** | Perlukan **fail Figma + token API** dan aliran "design → code". Tiada fail Figma dalam projek sekarang → **aktifkan bila** MIMOS Academy mula reka UI baharu dalam Figma. |

### 4.7 OpenMontage — 🔴 TUNDA (keputusan perniagaan, bukan teknikal)

| | |
|---|---|
| **SEBELUM** | Video promosi/rekap program dibuat manual (jika ada) — tiada saluran dari TPMS. |
| **SELEPAS** | 12 pipeline + 100+ tools (Python, ffmpeg, ejen): jana teaser, rekap acara, video pengumuman dari data program. |
| **Risiko penting** | **(1) Lesen AGPL-3.0** — jika dipautkan/diagihkan sebagai sebahagian produk, kod terbitan mungkin perlu dibuka sumber; integrasi selamat ialah sebagai **servis berasingan**. (2) Infrastruktur berat (GPU/ffmpeg/API video). (3) **Bukan keperluan teras sistem pengurusan dalaman.** |
| **Cadangan** | Simpan sebagai projek berasingan (bukan dalam repo TPMS) jika MIMOS Academy mahu automasi video pemasaran — selepas teras stabil. |

### 4.8 LangGraph / CrewAI — 🔴 TUNDA

| | |
|---|---|
| **SEBELUM** | Tiada aplikasi ejen; urusan sistem = manusia + GPT prompt. |
| **SELEPAS** | Boleh bina "AI Ops Assistant" berbilang ejen (PM agent, QA agent, report agent) dengan workflow loops. |
| **Risiko** | Stack **Python** baharu (TPMS = TS/Node), hosting tambahan, kos LLM. Nilai tinggi hanya jika mahu produk AI berasingan. Cadangan: **jangan sekarang**; jika perlu, bina sebagai servis kecil berasingan (bukan dalam Next.js). |

### 4.9 Dify — 🔴 TOLAK BUAT MASA INI

| | |
|---|---|
| **SEBELUM** | Semua aliran LLM diurus manual (prompt GPT). |
| **SELEPAS** | Platform visual (RAG, workflow, model) untuk bina aplikasi AI tanpa kod. |
| **Risiko** | Lesen NOASSERTION (tidak jelas), self-host berat, overkill untuk pasukan kecil + sistem dalaman. |

### 4.10 MCP SDK (FastMCP / python-sdk / TS SDK) — ✅ Asas untuk Fasa B

Bukan aplikasi, tetapi **standard sambungan** — jika Fasa B diluluskan, guna **SDK MCP TypeScript rasmi** (`@modelcontextprotocol/sdk`) selari stack sedia ada. (python-sdk juga MIT jika lebih selesa.)

---

## 5. Pelan Tindakan Bercadang

### Fasa A — "Asas Pintar" (kos ~0, 1–1.5 hari, BOLEH MULA SEKARANG)
1. **Persona tetap** (adaptasi Agency Agents): `docs/PERSONA-SQL-ARCHITECT.md`, `docs/PERSONA-QA-UAT.md`, `docs/PERSONA-SECURITY-REVIEW.md`, `docs/PERSONA-BA-LAPORAN.md` — setiap prompt GPT fasa depan WAJIB rujuk persona.
2. **Skrip `scripts/codebase-map.mjs`** → jana `docs/CODEBASE-MAP.md` (modul, jadual, RPC, mock vs live, isu terbuka) — lampiran standard setiap prompt GPT.
3. Kemas kini `docs/GPT-ASSISTANT-PROMPTS.md` dengan format baharu (persona + peta + laporan).

**Kesan SELEPAS Fasa A:** GPT faham sistem lebih tepat dari mesej pertama; output lebih konsisten; kurang pusingan betulkan; **langsung mengurangkan risiko bug ala RLS-recursion/mock terlepas** (kerana peta kod menanda status live/mock dengan jelas).

### Fasa B — "TPMS Data MCP" (pilihan, 2–3 hari, SELEPAS Fasa 5)
1. Server MCP **read-only** (TS SDK) — tool terkawal ke Supabase (RLS + audit).
2. Dokumen sambungan ke Claude Desktop / Cursor.
3. Ujian: "berapa program aktif 2026?", "invoice belum bayar", "peserta program X".

**Kesan SELEPAS Fasa B:** GPT/agent boleh sahkan fakta terus dari data live → laporan angka tepat; diagnosis pantas tanpa tampal SQL manual.

### Fasa C — "IDE Agents" (pilihan, bila anda mula guna Cursor/Claude Code)
- Pasang **Graft** (jimat token) + **Codebase Memory MCP** (graf kod) → ukur kesan sendiri.
- Aktifkan **Figma-Context-MCP** bila ada fail Figma.

### Fasa D — Opsyen perniagaan (keputusan pengurusan, bukan sekarang)
- **OpenMontage** sebagai servis video berasingan (perhatian AGPL) jika MIMOS Academy mahu automasi video promosi/rekap program.
- **LangGraph/CrewAI** hanya jika mahu produk "AI Ops Assistant" berbilang ejen.

---

## 6. Keputusan Yang Anda Perlu Buat

1. **Fasa A — luluskan?** (Saya siapkan 4 persona + skrip peta kod + kemas kini aliran GPT. Kos ~0.)
2. **Fasa B — berminat?** Perlukan klien MCP (Claude Desktop/Cursor) di sisi anda; atau anda mahu versi "chat dalaman" web (berbeza — guna LangGraph/Next, lebih besar)?
3. **Video (OpenMontage)** — adakah MIMOS Academy ada keperluan sebenar automasi video promosi/rekap program? Jika ya, saya boleh sediakan kertas spesifikasi berasingan (servis luar TPMS).
4. **Figma** — adakah UI akan direka dalam Figma? Jika ya, senarai Figma-Context-MCP jadi keutamaan.

> Cadangan saya: **Lulus Fasa A sekarang** (meningkatkan kualiti aliran GPT serta-merta, kos sifar, tiada risiko), **siapkan Fasa 5 keselamatan dulu** (password + MFA), kemudian nilai Fasa B. OpenMontage/LangGraph/Dify — jangan sekarang.
