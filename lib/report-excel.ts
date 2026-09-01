/**
 * report-excel.ts — Pengeksport Excel bagi Report Builder (Langkah 6).
 *
 * Lapisan ini menukar `ReportResult` (daripada `lib/reporting.ts`) kepada
 * fail `.xlsx` menggunakan SheetJS (`xlsx`), konsisten dengan parser import
 * sedia ada (`lib/excel-parser.ts`).
 *
 * PERHATIAN: fungsi `downloadReport()` menggunakan API pelayar
 * (`XLSX.writeFile` → Blob + pautan muat turun), jadi ia MESTI dipanggil
 * daripada Client Component sahaja (mis. `components/reports/report-builder.tsx`).
 * Pembinaan workbook (`buildWorkbook`) adalah tulen dan selamat diuji.
 */

import * as XLSX from "xlsx";

import type { ReportResult } from "@/lib/reporting";

/** Lebar kolom Excel lalai mengikut jenis data (aksara). */
function estimateColumnWidth(
  report: ReportResult,
  key: string,
): number {
  const headerLen = report.columns.find((c) => c.key === key)?.label.length ?? 8;
  let max = headerLen;
  for (const row of report.rows) {
    const v = row[key];
    const len = v == null ? 0 : String(v).length;
    if (len > max) max = len;
  }
  // Had munasabah supaya lajur teks panjang tidak meletup.
  return Math.min(Math.max(max + 2, 10), 48);
}

/** Bina satu worksheet daripada struktur laporan (pengepala + baris). */
export function buildSheet(report: ReportResult): XLSX.WorkSheet {
  const header = report.columns.map((c) => c.label);
  const body = report.rows.map((row) =>
    report.columns.map((c) => row[c.key] ?? ""),
  );

  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);

  // Lebar kolom mengikut isi.
  ws["!cols"] = report.columns.map((c) => ({
    wch: estimateColumnWidth(report, c.key),
  }));

  return ws;
}

/** Bina workbook lengkap (satu sheet "Laporan" + metadata). */
export function buildWorkbook(report: ReportResult): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildSheet(report), "Laporan");
  return wb;
}

/**
 * Muat turun laporan sebagai fail Excel.
 * @param report  hasil laporan daripada `buildReport()`.
 * @param filename nama fail (cth. daripada `buildReportFilename()`).
 */
export function downloadReport(report: ReportResult, filename: string): void {
  const wb = buildWorkbook(report);
  XLSX.writeFile(wb, filename);
}
