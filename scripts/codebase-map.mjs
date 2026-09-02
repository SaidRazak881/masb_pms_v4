#!/usr/bin/env node
/**
 * codebase-map.mjs — Penjana "Peta Kod" TPMS (Fasa A).
 *
 * Menghasilkan docs/CODEBASE-MAP.md — ringkasan satu halaman struktur sistem
 * yang dilampirkan pada setiap prompt GPT supaya pembantu AI memahami:
 *   • modul app/components/lib yang wujud
 *   • jadual, enum, RPC & polisi SQL (sumber: lib/supabase/*.sql)
 *   • status mock vs live
 *   • isu terbuka & senarai prompt/dokumen
 *
 * Guna:  node scripts/codebase-map.mjs
 * KEMASKINI PETA sebelum setiap fasa GPT baharu.
 */

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, basename } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "docs", "CODEBASE-MAP.md");

/* ---------- utiliti kecil ---------- */
function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry.startsWith(".") || entry === "node_modules" || entry === ".next") continue;
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function rel(path) {
  return relative(ROOT, path).split("\\").join("/");
}

/* ---------- 1. Modul aplikasi ---------- */
const appPages = walk(join(ROOT, "app"))
  .filter((f) => f.endsWith("page.tsx") || f.endsWith("route.ts"))
  .map(rel)
  .sort();
const components = walk(join(ROOT, "components"))
  .filter((f) => f.endsWith(".tsx"))
  .map(rel)
  .sort();
const libFiles = walk(join(ROOT, "lib"))
  .filter((f) => /\.(ts|tsx)$/.test(f))
  .map(rel)
  .sort();

/* ---------- 2. Ringkasan SQL ---------- */
const sqlSummary = [];
const sqlFiles = walk(join(ROOT, "lib", "supabase"))
  .filter((f) => f.endsWith(".sql"))
  .sort();

const TABLE_RE = /CREATE TABLE(?: IF NOT EXISTS)?\s+(?:public\.)?([a-z_]+)/gi;
const TYPE_RE = /CREATE TYPE(?:\s+IF NOT EXISTS)?\s+(?:public\.)?([a-z_]+)/gi;
const FN_RE = /CREATE OR REPLACE FUNCTION\s+(?:public|private)\.([a-z_]+)/gi;
const POLICY_RE = /CREATE POLICY\s+"?([^"\n]+)"?/gi;
const VIEW_RE = /CREATE(?: OR REPLACE)? VIEW\s+(?:public\.)?([a-z_]+)/gi;
const TRIGGER_RE = /CREATE TRIGGER\s+([a-z_]+)/gi;

for (const file of sqlFiles) {
  const content = readFileSync(file, "utf8");
  const tables = [...content.matchAll(TABLE_RE)].map((m) => m[1]);
  const types = [...content.matchAll(TYPE_RE)].map((m) => m[1]);
  const fns = [...content.matchAll(FN_RE)].map((m) => m[1]);
  const policies = [...content.matchAll(POLICY_RE)].map((m) => m[1]);
  const views = [...content.matchAll(VIEW_RE)].map((m) => m[1]);
  const triggers = [...content.matchAll(TRIGGER_RE)].map((m) => m[1]);
  sqlSummary.push({
    file: rel(file),
    tables: [...new Set(tables)],
    types: [...new Set(types)],
    fns: [...new Set(fns)],
    policies: [...new Set(policies)],
    views: [...new Set(views)],
    triggers: [...new Set(triggers)],
  });
}

/* ---------- 3. Status mock vs live ---------- */
const mockRefs = [];
const allTs = [...libFiles, ...components, ...appPages];
for (const f of allTs) {
  const content = readFileSync(join(ROOT, f), "utf8");
  if (/mock-data|Mod Demo|mod demo|simulated|Zarina Abu Bakar|"current-user"/i.test(content)) {
    mockRefs.push(f);
  }
}

/* ---------- 4. Docs & prompt inventory ---------- */
const docsDir = join(ROOT, "docs");
const docs = existsSync(docsDir)
  ? readdirSync(docsDir).filter((f) => f.endsWith(".md")).sort()
  : [];

/* ---------- 5. Info git ---------- */
let gitInfo = "N/A";
try {
  gitInfo = execSync("git log --oneline -1 && git branch --show-current", {
    encoding: "utf8",
  }).trim();
} catch {
  /* repo mungkin tiada git */
}

/* ---------- Tulis dokumen ---------- */
const now = new Date().toISOString().slice(0, 10);
const lines = [];
lines.push("# CODEBASE MAP — TPMS MIMOS Academy");
lines.push("");
lines.push(`> Dijana: ${now} · Arahan kemaskini: ` + "`node scripts/codebase-map.mjs`");
lines.push(`> Git: ${gitInfo.replace(/\n/g, " · ")}`);
lines.push("");
lines.push("> **Nota penggunaan:** Dokumen ini ialah KONTEKS RINGKAS untuk pembantu AI. Ia bukan spec penuh — rujuk fail sebenar apabila perlu butiran.");
lines.push("");
lines.push("## 1. Seni Bina");
lines.push("");
lines.push("- **Frontend/Backend:** Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui");
lines.push("- **Data & Auth:** Supabase (PostgreSQL, RLS, Auth, Storage) — production di Vercel");
lines.push("- **Mod demo:** bila `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` tiada, sistem guna mock-data");
lines.push("- **Dokumen rujukan:** `README.md`, `docs/SETUP-SUPABASE.md`, `docs/DEPLOY-VERCEL.md`");
lines.push("");

/* 1. app routes */
function routeOf(file) {
  let r = file.replace(/^app\//, "/");
  r = r.replace(/\([^)]+\)\//g, ""); // buang route groups (auth)/(dashboard)
  r = r.replace(/\/page\.tsx$/, "").replace(/\/route\.ts$/, "");
  r = r.replace(/\[([^\]]+)\]/g, ":$1");
  if (r === "") return file.includes("route.ts") ? "/api" : "/";
  return r;
}
lines.push("## 2. Laluan Aplikasi (app/)");
lines.push("");
for (const p of appPages) {
  lines.push(`- ${routeOf(p)}  \`(${p})\``);
}
lines.push("");

/* komponen */
lines.push("## 3. Komponen Utama (components/)");
lines.push("");
for (const c of components) lines.push(`- \`${c}\``);
lines.push("");

/* lib */
lines.push("## 4. Modul Logik (lib/)");
lines.push("");
for (const l of libFiles) lines.push(`- \`${l}\``);
lines.push("");

/* SQL */
lines.push("## 5. Pangkalan Data — Skema SQL (lib/supabase/)");
lines.push("");
for (const s of sqlSummary) {
  lines.push(`### \`${s.file}\``);
  if (s.tables.length) lines.push(`- **Jadual:** ${s.tables.join(", ")}`);
  if (s.types.length) lines.push(`- **Enum:** ${s.types.join(", ")}`);
  if (s.fns.length) lines.push(`- **Fungsi/RPC:** ${s.fns.join(", ")}`);
  if (s.policies.length) lines.push(`- **Polisi RLS:** ${s.policies.join(" · ")}`);
  if (s.views.length) lines.push(`- **View:** ${s.views.join(", ")}`);
  if (s.triggers.length) lines.push(`- **Trigger:** ${s.triggers.join(", ")}`);
  lines.push("");
}

/* mock refs */
lines.push("## 6. Fail dengan Rujukan Mock / Demo (perlu perhatian bila 'live')");
lines.push("");
if (mockRefs.length) {
  for (const m of mockRefs) lines.push(`- \`${m}\``);
} else {
  lines.push("- (tiada)");
}
lines.push("");
lines.push("## 7. Dokumen & Prompt GPT (docs/)");
lines.push("");
for (const d of docs) lines.push(`- \`${d}\``);
lines.push("");
lines.push("## 8. Fasa 6 — Pengesahan & Pengurusan Pengguna (TERKINI)");
lines.push("");
lines.push("**MFA/TOTP telah DIBUANG sepenuhnya.** Sistem kini menggunakan e-mel + kata laluan sahaja.");
lines.push("");
lines.push("- Kata laluan lalai pertama: `masb.12345` (`lib/auth.ts` DEFAULT_PASSWORD,");
lines.push("  `public.app_settings.default_password` di DB). Pengguna WAJIB tukar selepas");
lines.push("  log masuk (`must_change_password` → redirect `/security?required=1`).");
lines.push("- Master Admin / Super Admin: `saidrazak881@gmail.com` → role `super_admin`,");
lines.push("  dashboard khusus `/admin/users`.");
lines.push("- Pendaftaran sendiri: `/register` → trigger `on_auth_user_created` cipta profil");
lines.push("  `pending` + role `viewer` → Super Admin luluskan.");
lines.push("- Lupa kata laluan: `/forgot-password` → e-mel pemulihan → `/security?reset=1`.");
lines.push("- Status akaun: `pending` / `active` / `blocked`. Dikuatkuasakan sisi pelayan di");
lines.push("  `app/(dashboard)/layout.tsx` + `components/security/account-guard.tsx`.");
lines.push("- SQL: `lib/supabase/user-management.sql` (RPC `admin_*`, column-level GRANT");
lines.push("  menghalang eskalasi role, audit log setiap tindakan).");
lines.push("- Ujian SQL (PGlite): `node scripts/test-user-management-sql.mjs`");
lines.push("  → pemasangan DB kosong + 12 kumpulan ujian fungsi.");
lines.push("");
lines.push("## 9. Isu Terbuka & Perhatian");
lines.push("");
lines.push("- **Sejarah git telah ditulis semula** (komit \"Add files via upload\"): semua hash");
lines.push("  komit yang dirujuk dalam `docs/PROMPT-*.md` fasa terdahulu (21f18cb, 13078f2,");
lines.push("  8066e95, 8057579, 536ccc9) TIDAK lagi wujud. Rujuk kandungan fail semasa, bukan hash.");
lines.push("- Branch produksi Vercel perlu dikemas kini kepada branch semasa (lihat");
lines.push("  `docs/PROMPT-6-INSTALL-USER-MANAGEMENT.md`).");
lines.push("- Pengesahan akhir: `npm run build` + `node scripts/test-user-management-sql.mjs`");
lines.push("  sebelum push.");
lines.push("");

const md = lines.join("\n");
import { writeFileSync } from "node:fs";
writeFileSync(OUT, md, "utf8");
console.log(`✅ Peta kod ditulis: ${rel(OUT)} (${md.length} aksara)`);
