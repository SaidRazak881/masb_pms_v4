/**
 * Jana dua fail Excel contoh untuk menguji parser pintar:
 *  - public/samples/00. Quotation Tracker (1).xlsx
 *  - public/samples/R1 MIMOS_Academy_INCOME_STATEMENT.xlsx
 *
 * Fail ini meniru struktur sebenar MIMOS Academy (pengesanan automatik
 * melalui nama sheet + pengepala) dan sengaja mengandungi:
 *  - variasi nama pengepala (BM/English),
 *  - baris tajuk/ banner seksyen / baris JUMLAH,
 *  - baris dengan lajur wajib kosong (ralat pengesahan),
 *  - rekod pendua & hampir-hampir (untuk UI side-by-side),
 *  - format tarikh & mata wang yang pelbagai.
 */
import * as XLSX from "xlsx";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "samples");
mkdirSync(outDir, { recursive: true });

const dateMDY = (s) => {
  // s = "yyyy-mm-dd" → Date tengah hari (elak isu DST)
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};

const RM = (n) => n;

/* ------------------------------------------------------------------ */
/* Fail 1: Quotation Tracker                                           */
/* ------------------------------------------------------------------ */

const qtSummary = [
  ["MIMOS ACADEMY — QUOTATION TRACKER 2025"],
  ["Dikemaskini: 1 Sep 2025"],
  [],
];

const qtHeader = [
  "Bil",
  "Tarikh Sebut Harga",
  "No. Sebut Harga",
  "Nama Program",
  "Pelanggan / Agensi",
  "Nilai Sebut Harga (RM)",
  "Status",
  "Catatan",
];

const qtRows = [
  [1, dateMDY("2025-02-10"), "MAC/QT/2025/001", "Pensijilan Profesional AI & Machine Learning untuk Penjawat Awam", "Kementerian Pengangkutan Malaysia", RM(126000), "Diterima", "Pendua rujukan — sudah ada dalam sistem"],
  [2, dateMDY("2025-03-02"), "MAC/QT/2025/007", "Keselamatan Siber & Tindak Balas Insiden (CSIRT) Tahap Pertengahan", "CyberSecurity Malaysia", RM(98500), "Dihantar", "Program sedia ada — padanan tinggi"],
  [3, dateMDY("2025-03-18"), "MAC/QT/2025/008", "Transformasi Digital dan Awan untuk Sektor Awam", "MAMPU", RM(74000), "Draf", "Tajuk hampir sama (medium)"],
  [4, dateMDY("2025-04-05"), "MAC/QT/2025/009", "Bengkel Pembinaan Prototip IoT & Sistem Terbenam", "Lembaga Pelabuhan Klang", RM(88000), "Dihantar", "Tajuk hampir sama (medium)"],
  [5, dateMDY("2025-04-22"), "MAC/QT/2025/010", "Pembelajaran Mendalam (Deep Learning) untuk Jurutera", "Tenaga Nasional Berhad", RM(112000), "Diterima", "Pelanggan baharu — tiada pendua"],
  [6, dateMDY("2025-05-08"), "MAC/QT/2025/011", "Pengurusan Projek Agile untuk Pasukan IT", "Petronas Carigali", "", "Draf", "RALAT: lajur nilai kosong"],
  [7, dateMDY("2025-06-14"), "MAC/QT/2025/012", "", "Lembaga Hasil Dalam Negeri", RM(66500), "Dihantar", "RALAT: nama program kosong"],
  [8, dateMDY("2025-07-01"), "MAC/QT/2025/013", "Keselamatan Awan & Kawalan Pematuhan ISO27001", "Bank Negara Malaysia", RM(84000), "Diterima", "Program baharu"],
];

const qtTotal = [
  ["", "", "", "", "JUMLAH", RM(649000), "", ""],
];

const qtSheet = [...qtSummary, qtHeader, ...qtRows, [], ...qtTotal];

/* ------------------------------------------------------------------ */
/* Fail 2: Income Statement (Invois + Cost of Sale)                    */
/* ------------------------------------------------------------------ */

const isTitle = [
  ["R1 — MIMOS ACADEMY INCOME STATEMENT"],
  ["Tahun Kewangan: 2025"],
  [],
];

const invBanner = [["INVOICE / PENDAPATAN (INCOME)"]];

const invHeader = [
  "Invoice No",
  "Invoice Date",
  "Programme",
  "Client",
  "Amount (RM)",
  "Status Bayaran",
];

const invRows = [
  ["MAC/INV/2025/001", dateMDY("2025-05-20"), "Pensijilan Profesional AI & Machine Learning untuk Penjawat Awam", "Kementerian Pengangkutan Malaysia", RM(126000), "Dibayar"],
  ["MAC/INV/2024/014", dateMDY("2024-11-20"), "Kepimpinan Eksekutif & Pengurusan Perubahan Digital", "PETRONAS", RM(142000), "Dibayar"],
  ["MAC/INV/2025/005", dateMDY("2025-08-11"), "Analitik Data Raya dan Visualisasi untuk Pembuat Dasar", "Bank Negara Malaysia", RM(65500), "Tertunggak"],
  ["MAC/INV/2025/006", "", "Literasi Data & Asas Kecerdasan Buatan untuk Pengurus", "Suruhanjaya Komunikasi dan Multimedia", RM(58000), "Dibayar"],
  ["MAC/INV/2025/007", dateMDY("2025-09-02"), "", "Kementerian Kerja Raya", RM(47000), "Dihantar"],
];

const invTotal = [["", "", "TOTAL INCOME", "", RM(438500), ""]];

const costBanner = [["COST OF SALES / KOS JUALAN"]];

const costHeader = [
  "Date",
  "Programme / Ref",
  "Cost Item",
  "Vendor / Trainer",
  "Amount (RM)",
];

const costRows = [
  [dateMDY("2025-06-20"), "Pensijilan Profesional AI & Machine Learning untuk Penjawat Awam", "Yuran Jurulatih", "Dr. Hafiz Noor", RM(41200)],
  [dateMDY("2025-06-21"), "Pensijilan Profesional AI & Machine Learning untuk Penjawat Awam", "Sewa Dewan & Katering", "TPM Venue Services", RM(18600)],
  [dateMDY("2024-11-12"), "Kepimpinan Eksekutif dan Pengurusan Perubahan Digital", "Yuran Fasilitator", "Dr. Rozita Mansor", RM(52000)],
  [dateMDY("2025-09-10"), "", "Lesen Platform Latihan (Awan)", "CloudProvider Sdn Bhd", RM(12400)],
];

const costTotal = [["", "", "TOTAL COST OF SALES", "", RM(124200)]];

const isSheet = [
  ...isTitle,
  ...invBanner,
  [],
  invHeader,
  ...invRows,
  [],
  ...invTotal,
  [],
  [],
  ...costBanner,
  [],
  costHeader,
  ...costRows,
  [],
  ...costTotal,
];

/* ------------------------------------------------------------------ */
/* Tulis workbook                                                      */
/* ------------------------------------------------------------------ */

function writeWorkbook(path, sheets) {
  const wb = XLSX.utils.book_new();
  for (const { name, rows, widths } of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    if (widths) ws["!cols"] = widths;
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  XLSX.writeFile(wb, path);
  console.log("✔", path);
}

writeWorkbook(join(outDir, "00. Quotation Tracker (1).xlsx"), [
  {
    name: "Quotation Tracker 2025",
    rows: qtSheet,
    widths: [
      { wch: 5 }, { wch: 18 }, { wch: 20 }, { wch: 52 },
      { wch: 32 }, { wch: 20 }, { wch: 12 }, { wch: 40 },
    ],
  },
]);

writeWorkbook(join(outDir, "R1 MIMOS_Academy_INCOME_STATEMENT.xlsx"), [
  {
    name: "Income Statement 2025",
    rows: isSheet,
    widths: [
      { wch: 18 }, { wch: 52 }, { wch: 28 }, { wch: 28 }, { wch: 16 }, { wch: 16 },
    ],
  },
]);

console.log("Selesai.");
