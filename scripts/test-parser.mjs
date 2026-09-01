/** Ujian cepat parser terhadap fail contoh (node --experimental-strip-types). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseExcelWorkbook,
  toStagingRows,
  ENTITY_KIND_LABEL,
} from "../lib/excel-parser.ts";

const samples = join(process.cwd(), "public", "samples");

const master = {
  programmes: [
    {
      id: "prog-001",
      title:
        "Pensijilan Profesional AI & Machine Learning untuk Penjawat Awam",
      client: "Kementerian Pengangkutan Malaysia",
      code: "MAC/2025/001",
      status: "completed",
      statusLabel: "Selesai",
      year: 2025,
      contractedAmount: 126000,
      category: "AI & Data Science",
      trainer: "Dr. Hafiz Noor",
    },
    {
      id: "prog-002",
      title: "Keselamatan Siber & Tindak Balas Insiden (CSIRT) Tahap Pertengahan",
      client: "CyberSecurity Malaysia",
      code: "MAC/2025/002",
      status: "active",
      statusLabel: "Aktif",
      year: 2025,
      contractedAmount: 98500,
      category: "Cybersecurity",
      trainer: "Ir. Khairul Anwar Shaari",
    },
    {
      id: "prog-003",
      title: "Transformasi Digital & Awan untuk Sektor Awam",
      client: "MAMPU",
      code: "MAC/2025/003",
      status: "active",
      statusLabel: "Aktif",
      year: 2025,
      contractedAmount: 74000,
      category: "Digital Transformation",
      trainer: "Pn. Amirah Hassan",
    },
    {
      id: "prog-004",
      title: "Pembinaan Penyelesaian IoT & Sistem Terbenam",
      client: "Lembaga Pelabuhan Klang",
      code: "MAC/2025/004",
      status: "draft",
      statusLabel: "Draf",
      year: 2025,
      contractedAmount: 88000,
      category: "IoT & Embedded Systems",
      trainer: "Ts. Shahrul Nizam Idris",
    },
    {
      id: "prog-005",
      title: "Kepimpinan Eksekutif & Pengurusan Perubahan Digital",
      client: "PETRONAS",
      code: "MAC/2024/014",
      status: "completed",
      statusLabel: "Selesai",
      year: 2024,
      contractedAmount: 142000,
      category: "Leadership & Management",
      trainer: "Dr. Rozita Mansor",
    },
    {
      id: "prog-006",
      title: "Analitik Data Raya & Visualisasi untuk Pembuat Dasar",
      client: "Bank Negara Malaysia",
      code: "MAC/2024/009",
      status: "on_hold",
      statusLabel: "Ditangguh",
      year: 2024,
      contractedAmount: 65500,
      category: "AI & Data Science",
      trainer: "Dr. Hafiz Noor",
    },
  ],
  quotationRefs: ["MAC/QT/2025/001"],
  invoiceRefs: ["MAC/INV/2025/001", "MAC/INV/2024/014"],
};

for (const file of [
  "00. Quotation Tracker (1).xlsx",
  "R1 MIMOS_Academy_INCOME_STATEMENT.xlsx",
]) {
  console.log("\n══════════════════════════════════════════");
  console.log("FAIL:", file);
  const buf = readFileSync(join(samples, file));
  const result = parseExcelWorkbook(buf, file, master);
  console.log(
    `Total: ${result.totalRows} | Valid: ${result.validCount} | Invalid: ${result.invalidCount} | Duplicate: ${result.duplicateCount}`,
  );
  for (const s of result.sheets) {
    console.log(
      `  Sheet "${s.sheetName}" → ${ENTITY_KIND_LABEL[s.entityKind]} (${s.recordCount} baris)`,
    );
  }
  for (const r of result.records) {
    console.log(
      `\n  [Baris ${r.rowNumber}] ${ENTITY_KIND_LABEL[r.entityKind]} ${r.referenceNo || "(tiada rujukan)"} | ${r.docDate ?? "tarikh?"} | RM ${r.amount ?? "—"} | ${r.status}`,
    );
    console.log(
      `    Program : ${r.programmeTitle || "(KOSONG)"}`,
    );
    console.log(`    Pelanggan: ${r.clientName || "(KOSONG)"}`);
    for (const e of r.errors) console.log("    ✖ RALAT :", e.message);
    for (const w of r.warnings) console.log("    ⚠ AMARAN:", w.message);
    if (r.duplicate) {
      console.log(
        `    ⇄ PENDUA [${r.duplicate.confidence}]: ${r.duplicate.label} — ${r.duplicate.reason}`,
      );
    }
  }
  const staging = toStagingRows(result);
  console.log(`\n  → Dipetakan ke ${staging.length} baris import_staging.`);
}
