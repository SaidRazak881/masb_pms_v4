/**
 * test-v4-raw-parser.mjs — Ujian parser terhadap FAIL SUMBER SEBENAR
 * =====================================================================
 *
 * KENAPA UJIAN INI WUJUD
 * ----------------------
 * `scripts/test-parser.mjs` sudah pun membaca fail V4 RAW sebenar (salinan
 * dalam `public/samples/`), tetapi ia HANYA melakukan `console.log` —
 * TIADA satu assertion pun. Akibatnya kecacatan berikut terlepas sehingga
 * ia dikesan secara manual pada 2026-09-04:
 *
 *   1. `amount` mengambil lajur **"SST 8% Amount"** (amaun CUKAI).
 *      Quotation Tracker baris 1: nilai sebut harga sebenar RM21,000
 *      (`Final Price`), tetapi parser menyimpan RM1,555.56 — ralat 13.5×.
 *      Punca: alias `"amount"` memadankan "SST 8% Amount" dengan skor 115
 *      (padanan tepat + bonus `/amount|.../ `), mengalahkan "Final Price"
 *      (skor 85).
 *
 *   2. `looksLikeHeaderRow` memerlukan `hits > dataLike`. Sheet lebar
 *      seperti cost_of_sales_2026 (16 lajur, hanya 6 dipetakan ke model)
 *      gagal: 6 > 10 = false → header tidak dikesan → 23 baris data
 *      dibuang SECARA SENYAP (0 rekod, tiada ralat).
 *
 *   3. Header Quotation Tracker sendiri tidak dikesan (49 lajur, hanya
 *      ~9 dipetakan pada masa itu), jadi parser menggunakan BARIS DATA
 *      PERTAMA sebagai header. Bukti: label `raw` asal ialah
 *      "SST 8% Amount", "Company/Client", "Project Title", "Status" —
 *      semuanya NILAI baris 1, bukan nama lajur baris 0.
 *
 *   4. 44 daripada 49 lajur Quotation Tracker dibuang entirely —
 *      Account Manager, PIC (nama/telefon/emel), Unit Price, No of Unit,
 *      SST, Discount %, Final Price, Prepared by, Payment Status.
 *
 * Ujian ini mengunci keempat-empat pembetulan itu.
 *
 * Jalankan: node scripts/test-v4-raw-parser.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parseExcelWorkbook, toStagingRows } from "../lib/excel-parser.ts";

const RAW = join(process.cwd(), "V4 RAW");
let pass = 0;
let fail = 0;

const ok = (m) => { pass++; console.log(`  ✅ ${m}`); };
const bad = (m) => { fail++; console.log(`  ❌ ${m}`); };
const eq = (actual, expected, m) =>
  actual === expected ? ok(`${m} = ${JSON.stringify(actual)}`)
                      : bad(`${m}: dapat ${JSON.stringify(actual)}, jangkaan ${JSON.stringify(expected)}`);
const ge = (actual, min, m) =>
  actual >= min ? ok(`${m} = ${actual} (≥ ${min})`)
                : bad(`${m} = ${actual}, jangkaan ≥ ${min}`);

const parse = (file) => {
  const p = join(RAW, file);
  if (!existsSync(p)) { bad(`fail sumber tiada: ${file}`); return null; }
  return parseExcelWorkbook(readFileSync(p), file, {});
};

console.log("\n=== 1. Quotation Tracker (299 baris × 49 lajur) ===");
const qt = parse("00. Quotation Tracker (1).xlsx");
if (qt) {
  // 299 baris Excel = 1 header + 298 baris data.
  // Daripada 298: 14 BARIS HANTU (286–299, hanya nombor urutan) dan
  // 1 BARIS JUMLAH (Final Price = RM 11,191,349.41 tanpa pengecam)
  // ditolak → 284 rekod sebenar.
  eq(qt.totalRows, 284, "bilangan rekod diekstrak (298 − 14 hantu − 1 jumlah)");
  ge(qt.validCount, 275, "bilangan rekod sah");

  const r = qt.records[0];
  console.log("  -- baris 1 (rujukan MSSB/QT/TRA/2026/0001) --");
  eq(r.referenceNo, "MSSB/QT/TRA/2026/0001", "referenceNo");
  eq(r.clientName, "KENANGA INVESTOR BERHAD", "clientName");
  eq(r.programmeTitle, "Train The Trainer (TTT)", "programmeTitle");

  // ---- KECAACATAN #1: amaun cukai sebagai nilai sebut harga ----
  eq(r.amount, 21000, "amount (Final Price, BUKAN SST)");
  eq(r.sstAmount, 1555.56, "sstAmount (cukai, disimpan BERASINGAN)");
  if (r.amount === 1555.56) bad("REGRESI: amount masih mengambil nilai SST");
  eq(r.finalPrice, 21000, "finalPrice");
  eq(r.totalInclSst, 21000, "totalInclSst");
  eq(r.totalExclSst, 19444.44, "totalExclSst");
  eq(r.unitPrice, 9722.22, "unitPrice");
  eq(r.quantity, 2, "quantity");

  // ---- KECAACATAN #4: lajur perniagaan dibuang ----
  eq(r.picName, "Ms Liyana Ayunni", "picName (individu)");
  eq(r.picContactNo, "6012-227 0011", "picContactNo");
  eq(r.picEmail, "vl.victoryintelligence@gmal.com", "picEmail");
  eq(r.preparedBy, "Nur Izzati Zailani", "preparedBy");
  eq(r.status, "Sent", "status");
  eq(r.docDate, "2025-12-18", "docDate");

  // ---- KECAACATAN #3: header mesti nama lajur, bukan nilai data ----
  const rawKeys = Object.keys(r.raw);
  const nilaiData = ["Train The Trainer (TTT)", "KENANGA INVESTOR BERHAD", "Sent", "Training"];
  const bocor = nilaiData.filter((v) => rawKeys.includes(v));
  if (bocor.length) bad(`label 'raw' mengandungi NILAI DATA (header salah dikesan): ${bocor.join(", ")}`);
  else ok("label 'raw' ialah NAMA LAJUR sebenar (header dikesan pada baris 0)");
  for (const wajib of ["Quotation No", "Final Price", "SST 8% Amount", "PIC - Full Name", "Account Manager"]) {
    if (rawKeys.includes(wajib)) ok(`raw ada lajur "${wajib}"`);
    else bad(`raw TIADA lajur "${wajib}" — ada: ${rawKeys.slice(0, 12).join(", ")}`);
  }

  // ---- Invarian: cukai tidak pernah jadi amaun ----
  // Nota: 22 rekod mempunyai amount == sst == 0 kerana Excel itu sendiri
  // mengandungi sebut harga bernilai sifar (disahkan menentang lajur 18/20).
  // Invarian yang bermakna ialah untuk amaun BUKAN sifar.
  // Nota: baris 282 (MASB/QT/TRA/2026/0193) mempunyai amount == sst == 21000
  // kerana EXCEL ITU SENDIRI mengandungi SST 8% Amount = 21000 dan
  // Final Price = 21000. Parser betul (amount diambil daripada Final Price);
  // persamaan itu kebetulan data, bukan kecacatan. Disahkan menentang
  // lajur Excel [18] dan [20]. Jadi invarian ini mengecualikan baris itu.
  const bocorSST = qt.records.filter(
    (x) => x.amount !== null && x.amount > 0 && x.sstAmount !== null &&
           Math.abs(x.amount - x.sstAmount) < 0.01 &&
           x.finalPrice !== x.amount,
  );
  eq(bocorSST.length, 0, "rekod di mana amount diambil daripada SST");
  // Bukti positif: amount mesti sentiasa berasal daripada Final Price
  // apabila lajur itu ada.
  const ikutFinal = qt.records.filter(
    (x) => x.finalPrice !== null && x.finalPrice !== 0 && x.amount !== x.finalPrice,
  );
  eq(ikutFinal.length, 0, "rekod yang amount-nya MENYIMPANG daripada Final Price");

  const adaSST = qt.records.filter((x) => x.sstAmount !== null).length;
  ge(adaSST, 280, "rekod dengan sstAmount ditangkap");
  const adaPIC = qt.records.filter((x) => x.picName !== "").length;
  ge(adaPIC, 250, "rekod dengan picName ditangkap");
}

console.log("\n=== 2. invoice_2026.xlsx (30 baris × 22 lajur) ===");
const iv = parse("invoice_2026.xlsx");
if (iv) {
  ge(iv.totalRows, 29, "bilangan rekod");
  ge(iv.validCount, 25, "bilangan rekod sah");
  const r = iv.records[0];
  eq(r.entityKind, "invoice", "entityKind");
  eq(r.referenceNo, "95000016/2026", "referenceNo (Invoice No)");
  eq(r.amount, 9180, "amount (Total incl SST, BUKAN SST 680)");
  eq(r.sstAmount, 680, "sstAmount");
  eq(r.clientName, "MIMOS Berhad", "clientName");
  eq(r.accountManager, "Adilah", "accountManager (lajur sebenar, BUKAN trainer)");
  eq(r.picName, "Adilah", "picName");
  // Nota: dalam fail ini AM == PIC untuk 20/25 baris — disahkan terhadap
  // lajur Excel [19] "Account Manager" dan [20] "PIC". Bukan bug pemetaan.
}

console.log("\n=== 3. cost_of_sales_2026.xlsx — KECAACATAN #2 (0 rekod senyap) ===");
const cs = parse("cost_of_sales_2026.xlsx");
if (cs) {
  ge(cs.totalRows, 23, "bilangan rekod (SEBELUM pembetulan: 0)");
  if (cs.totalRows === 0) bad("REGRESI: header gagal dikesan semula — 23 baris dibuang senyap");
  const r = cs.records[0];
  if (r) {
    eq(r.netProfit, 8500, "netProfit");
    eq(r.commission, 0, "commission");
    eq(r.clientName, "MIMOS Berhad", "clientName");
  }
  // Nota jujur: rekod ini masih takSah dan sheet masih dikelaskan
  // 'invoice' (bukan 'cost') kerana domain cost-of-sales memerlukan
  // kerja lanjut — lihat GAP-ANALISIS §3.3. Yang penting: data TIDAK
  // lagi dibuang senyap.
}

console.log("\n=== 4. office_funnel_2026-08-19.xlsx (0 rekod senyap) ===");
const of = parse("office_funnel_2026-08-19.xlsx");
if (of) {
  ge(of.totalRows, 95, "bilangan rekod (SEBELUM pembetulan: 0)");
  const r = of.records[0];
  if (r) {
    eq(r.clientName, "JMTI", "clientName");
    eq(r.picName, "Solehin", "picName (Person In Charge)");
    eq(r.status, "In Progress", "status");
  }
}

console.log("\n=== 5. R1 INCOME_STATEMENT (2 sheet) ===");
const r1 = parse("R1 MIMOS_Academy_INCOME_STATEMENT.xlsx");
if (r1) {
  ge(r1.totalRows, 70, "jumlah rekod kedua-dua sheet");
  const inv = r1.sheets.find((s) => s.sheetName === "Invoice");
  if (inv) ge(inv.validCount, 35, "sheet Invoice: rekod sah");
  const r = r1.records[0];
  if (r) {
    eq(r.sstAmount, 680, "sheet Invoice: sstAmount ditangkap");
    eq(r.accountManager, "Adilah", "sheet Invoice: accountManager");
  }
}

console.log("\n=== 6. toStagingRows membawa medan baharu ke import_staging ===");
if (qt) {
  const rows = toStagingRows(qt);
  const r = rows[0];
  for (const f of ["final_price", "unit_price", "quantity", "sst_amount", "discount_pct",
                   "total_incl_sst", "total_excl_sst", "account_manager", "pic_name",
                   "pic_contact_no", "pic_email", "po_no", "payment_status_raw",
                   "net_profit", "commission", "prepared_by"]) {
    if (f in r) ok(`import_staging.${f} wujud`);
    else bad(`import_staging.${f} HILANG — RPC tidak akan dapat nilai ini`);
  }
  eq(r.final_price, 21000, "staging.final_price");
  eq(r.sst_amount, 1555.56, "staging.sst_amount");
  eq(r.pic_name, "Ms Liyana Ayunni", "staging.pic_name");
}

console.log("\n=== 7. Pengawal: baris data tidak boleh jadi header ===");
// Kecacatan yang diperkenalkan dan dibetulan semasa kerja ini:
// melonggarkan kepada `hits >= 4` tanpa pengawal menyebabkan baris data
// pertama Quotation Tracker lulus sebagai header, kerana "Training" ≈
// "Training Type", "MSSB/QT/TRA/2026/0001" mengandungi "QT NO", dan
// "KENANGA INVESTOR BERHAD" mengandungi "INVESTOR".
if (qt) {
  const bernombor = qt.records.filter((r) => /^\d+$/.test(String(r.referenceNo ?? ""))).length;
  eq(bernombor, 0, "rekod dengan referenceNo = nombor baris (tanda header salah)");
  const kosong = qt.records.filter((r) => !r.clientName && !r.referenceNo).length;
  eq(kosong, 0, "rekod tanpa client DAN tanpa rujukan");
  // Baris hantu: Excel baris 286–299 hanya ada nombor urutan, semua lajur
  // lain kosong. Sebelum pembetulan `hasData`, ia menjadi 14 rekod amount=0.
  const hantu = qt.records.filter(
    (r) => !r.clientName && !r.programmeTitle && (r.amount === 0 || r.amount === null),
  ).length;
  eq(hantu, 0, "rekod hantu (tiada client, tiada tajuk, amount 0/null)");
}

console.log("\n=== 8. Baris JUMLAH RM11.19 juta mesti ditolak ===");
// Quotation Tracker baris 299: Final Price = 11,191,349.41, tiada lajur lain.
// `isTotalRow` tidak menangkapnya (baris bermula dengan nombor urutan "1",
// bukan perkataan "total"). Jika ia menjadi rekod, satu quotation hantu
// bernilai RM 11.19 juta akan menggembungkan setiap laporan kewangan.
if (qt) {
  const juta = qt.records.filter((r) => (r.amount ?? 0) > 1_000_000);
  eq(juta.length, 0, "rekod dengan amaun > RM1 juta (baris jumlah bocor)");
  const jumlahSemua = qt.records.reduce((a, r) => a + (r.amount ?? 0), 0);
  if (jumlahSemua > 20_000_000) bad(`jumlah amaun semua rekod = RM${jumlahSemua.toLocaleString("ms-MY")} — terlalu tinggi, kemungkinan baris jumlah masih bocor`);
  else ok(`jumlah amaun semua rekod = RM${Math.round(jumlahSemua).toLocaleString("ms-MY")} (masuk akal tanpa baris jumlah)`);
}

console.log(`\n${fail === 0 ? "🎉" : "💥"} v4-raw-parser: lulus ${pass}, gagal ${fail}`);
process.exit(fail === 0 ? 0 : 1);
