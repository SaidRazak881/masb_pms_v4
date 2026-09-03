/**
 * excel-parser.ts — Modul Import Excel Pintar (TPMS MIMOS Academy)
 *
 * Parser berasaskan SheetJS (`xlsx`) yang membaca dua jenis fail operasi
 * MIMOS Academy:
 *
 *   1. Quotation Tracker  — senarai Sebut Harga / Quotation
 *      (cth. `00. Quotation Tracker (1).xlsx`)
 *   2. Income Statement   — invois / pendapatan dan Cost of Sale
 *      (cth. `R1 MIMOS_Academy_INCOME_STATEMENT.xlsx`)
 *
 * Ciri utama:
 *  - Pengesanan jenis sheet secara automatik berdasarkan nama sheet +
 *    kandungan tajuk/pengepala.
 *  - Pengepala "fuzzy": satu medan kanonik menerima banyak variasi nama
 *    lajur (Bahasa Melayu & English, huruf besar/kecil, singkatan).
 *  - Menyokong berbilang jadual bertindih dalam SATU sheet (cth. bahagian
 *    "INVOICE" diikuti banner "COST OF SALE" dengan pengepala sendiri).
 *  - Melangkau baris "JUMLAH / TOTAL / GRAND TOTAL" dan baris kosong.
 *  - Mengesahkan lajur wajib dan mengumpul ralat/amaran peringkat baris.
 *  - Mengesan kemungkinan pendua terhadap data induk (program/quotation/
 *    invois sedia ada) beserta skor keyakinan.
 *  - Output dipetakan terus kepada bentuk baris jadual `import_staging`.
 */

import * as XLSX from "xlsx";

/* ============================ Jenis awam ============================ */

export type EntityKind = "quotation" | "invoice" | "cost" | "unknown";

export type RecordAction =
  | "pending"
  | "sync_confirmed"
  | "merged"
  | "created_new"
  | "discarded";

export type DuplicateConfidence = "high" | "medium" | "none";

export type ParseWarningCode =
  | "MISSING_QUOTATION_NO"
  | "MISSING_INVOICE_NO"
  | "MISSING_AMOUNT"
  | "MISSING_CLIENT"
  | "MISSING_PROGRAMME"
  | "MISSING_DATE"
  | "DUPLICATE_SUSPECTED"
  | "DUPLICATE_REF"
  | "UNMAPPED_SHEET"
  | "NO_DATA"
  /** Baris amaun tanpa pengecam — kemungkinan baris JUMLAH (GAP-ANALISIS). */
  | "UNIDENTIFIED_AMOUNT_ROW";

export interface FieldWarning {
  code: ParseWarningCode;
  message: string;
  /** Nama medan kanonik yang terjejas, jika berkaitan. */
  field?: CanonicalField;
}

export interface DuplicateMatch {
  /** Rujukan rekod induk (programme id / quotation no / invoice no). */
  matchId: string;
  /** Label mesra pengguna untuk paparan. */
  label: string;
  confidence: DuplicateConfidence;
  /** Skor persamaan 0–1 (untuk rujukan / penggunaan dalaman). */
  score: number;
  /** Sebab padanan ditentukan, cth. "Rujukan invois sama". */
  reason: string;
  /** Nilai medan rekod induk untuk paparan side-by-side. */
  masterValues: Record<string, string>;
}

export interface StagingRecord {
  /** ID unik sementara (tempatan) untuk rujukan UI. */
  id: string;
  sourceFile: string;
  sheetName: string;
  /** Nombor baris fizikal dalam fail Excel (1-based). */
  rowNumber: number;

  entityKind: EntityKind;

  // ---- Data perniagaan (dinormalisasikan) ----
  programmeTitle: string;
  clientName: string;
  referenceNo: string;
  referenceType: string;
  amount: number | null;
  currency: string;
  docDate: string | null; // ISO yyyy-mm-dd
  year: number | null;
  category: string;
  trainer: string;
  mode: string;
  status: string;
  description: string;

  // ---- Data kewangan terperinci (GAP-ANALISIS §3.1, §4.1–4.3) ----
  /** Nilai muktamad (selepas diskaun, termasuk SST). Keutamaan amaun #1. */
  finalPrice: number | null;
  unitPrice: number | null;
  quantity: number | null;
  /** Amaun CUKAI. TIDAK PERNAH digunakan sebagai amaun rekod. */
  sstAmount: number | null;
  discountPct: number | null;
  totalInclSst: number | null;
  totalExclSst: number | null;
  accountManager: string;
  /** Individu bertanggungjawab — BUKAN nama syarikat pelanggan. */
  picName: string;
  picContactNo: string;
  picEmail: string;
  poNo: string;
  /** Nombor sebut harga yang dirujuk oleh invois ini (lajur "Quotation"). */
  quotationRef: string;
  paymentStatus: string;
  netProfit: number | null;
  commission: number | null;
  preparedBy: string;

  // ---- Pengesahan & keputusan ----
  isValid: boolean;
  errors: FieldWarning[];
  warnings: FieldWarning[];
  duplicate: DuplicateMatch | null;
  action: RecordAction;

  /** Nilai mentah asal (teks) untuk paparan audit. */
  raw: Record<string, string>;
}

export interface SheetParseSummary {
  sheetName: string;
  entityKind: EntityKind;
  recordCount: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
}

export interface ParsedWorkbook {
  fileName: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  sheets: SheetParseSummary[];
  records: StagingRecord[];
  /** Amaran peringkat workbook. */
  warnings: FieldWarning[];
}

/** Bentuk ringkas rekod induk yang diperlukan untuk pengesanan pendua. */
export interface MasterProgrammeLike {
  id: string;
  title: string;
  client: string;
  code: string;
  codeLabel?: string;
  status: string;
  statusLabel?: string;
  year: number;
  contractedAmount: number;
  category: string;
  trainer: string;
}

export interface MasterRecords {
  programmes?: MasterProgrammeLike[];
  /** Rujukan sebut harga sedia ada, cth. ["MAC/QT/2025/001"]. */
  quotationRefs?: string[];
  /** Rujukan invois sedia ada, cth. ["MAC/INV/2024/014"]. */
  invoiceRefs?: string[];
}

/* ========================== Medan kanonik ========================== */

type CanonicalField =
  | "programmeTitle"
  | "clientName"
  | "referenceNo"
  | "referenceType"
  | "amount"
  | "docDate"
  | "category"
  | "trainer"
  | "mode"
  | "status"
  | "description"
  // ---- Medan kewangan (GAP-ANALYSIS §4.1–4.3) ----
  // Diperkenalkan kerana lajur perniagaan sebenar dalam V4 RAW tidak
  // pernah ditangkap; akibatnya `trainer` ditulis ke `account_manager`
  // dan `client_name` (syarikat) ditulis ke `pic_name` (individu).
  | "finalPrice"
  | "unitPrice"
  | "quantity"
  | "sstAmount"
  | "discountPct"
  | "totalInclSst"
  | "totalExclSst"
  | "accountManager"
  | "picName"
  | "picContactNo"
  | "picEmail"
  | "poNo"
  | "quotationRef"
  | "paymentStatus"
  | "netProfit"
  | "commission"
  | "preparedBy";

const CANONICAL_FIELDS: CanonicalField[] = [
  "programmeTitle",
  "clientName",
  "referenceNo",
  "referenceType",
  "amount",
  "docDate",
  "category",
  "trainer",
  "mode",
  "status",
  "description",
  "finalPrice",
  "unitPrice",
  "quantity",
  "sstAmount",
  "discountPct",
  "totalInclSst",
  "totalExclSst",
  "accountManager",
  "picName",
  "picContactNo",
  "picEmail",
  "poNo",
  "quotationRef",
  "paymentStatus",
  "netProfit",
  "commission",
  "preparedBy",
];

/**
 * Alias pengepala bagi setiap medan kanonik. Semua ditukar ke bentuk
 * ternormal (huruf kecil, buang aksara bukan alfanumerik) sebelum dipadan.
 */
const FIELD_ALIASES: Record<CanonicalField, string[]> = {
  programmeTitle: [
    "programme",
    "program",
    "programme name",
    "program name",
    "title",
    "training programme",
    "course name",
    "training title",
    "nama program",
    "program latihan",
    "tajuk program",
    "programme title",
    "kursus",
    "nama kursus",
  ],
  clientName: [
    "client",
    "customer",
    "client name",
    "customer name",
    "company",
    "organisation",
    "organization",
    "agency",
    "pelanggan",
    "nama pelanggan",
    "syarikat",
    "agensi",
    "kementerian",
    "dept",
    "jabatan",
  ],
  referenceNo: [
    "quotation no",
    "quotation number",
    "quote no",
    "qt no",
    "quotation ref",
    "quotation reference",
    "invoice no",
    "invoice number",
    "inv no",
    "inv.",
    "invoice ref",
    "reference",
    "reference no",
    "reference number",
    "ref no",
    "doc no",
    "document no",
    "sebut harga",
    "no sebut harga",
    "no invois",
    "nombor rujukan",
  ],
  referenceType: [
    // "type" dan "jenis" BARE sengaja TIDAK disenaraikan: ia merampas
    // lajur "Quotation Type" / "Training Type" (Quotation Tracker) dan
    // lajur "Type" (R3 Funnel = nama unit, cth. "MIMOS Academy").
    // Lihat GAP-ANALYSIS §4.
    "document type",
    "doc type",
    "jenis dokumen",
    "category type",
    "reference type",
    "jenis rujukan",
  ],
  amount: [
    "amount",
    "value",
    "total",
    "total amount",
    "rm",
    "rm amount",
    "quoted amount",
    "quotation amount",
    "invoice amount",
    "price",
    "cost",
    "cost amount",
    "nilai",
    "jumlah",
    "amaun",
    "nilai kontrak",
    "nilai sebut harga",
    "nilai invois",
    "jumlah kos",
    "kos jualan",
  ],
  docDate: [
    "date",
    "quotation date",
    "quote date",
    "invoice date",
    "doc date",
    "document date",
    "issued date",
    "issue date",
    "tarikh",
    "tarikh sebut harga",
    "tarikh invois",
    "tarikh dokumen",
  ],
  category: [
    "category",
    "programme category",
    "training category",
    "kategori",
    "kategori program",
    "bidang",
    "domain",
  ],
  trainer: [
    "trainer",
    "trainer name",
    "facilitator",
    "instructor",
    "vendor",
    "vendor name",
    "vendor / trainer",
    "jurulatih",
    "nama jurulatih",
    "penceramah",
    "pembekal",
  ],
  finalPrice: [
    "final price",
    "harga muktamad",
    "harga akhir",
    "final amount",
    "net price",
  ],
  unitPrice: [
    "unit price",
    "harga seunit",
    "harga unit",
    "rate per unit",
    "price per unit",
  ],
  quantity: [
    "no of unit",
    "number of unit",
    "qty",
    "quantity",
    "bilangan unit",
    "kuantiti",
    "no of pax",
    "number of pax",
  ],
  sstAmount: [
    "sst 8% amount",
    "sst amount",
    "sst 8",
    "sst",
    "tax amount",
    "amount of sst",
    "cukai",
    "jumlah sst",
    "amaun sst",
  ],
  discountPct: [
    "discount",
    "discount %",
    "diskaun",
    "diskaun %",
    "discount percentage",
  ],
  totalInclSst: [
    "total price with sst 8",
    "total price with sst",
    "total with sst",
    "total incl sst",
    "total including sst",
    "jumlah termasuk sst",
  ],
  totalExclSst: [
    "total price without sst",
    "total without sst",
    "total excl sst",
    "total excluding sst",
    "jumlah tanpa sst",
  ],
  accountManager: [
    "account manager",
    "am name",
    "sales manager",
    "pengurus akaun",
    "pengurus jualan",
  ],
  picName: [
    "pic - full name",
    "pic full name",
    "pic name",
    "pic",
    "person in charge",
    "contact person",
    "nama pic",
  ],
  picContactNo: [
    "pic - contact no",
    "pic contact no",
    "pic contact",
    "contact no",
    "contact number",
    "phone",
    "telefon",
    "no telefon",
  ],
  picEmail: [
    "pic - email add",
    "pic email",
    "email add",
    "e mail",
    "emel",
  ],
  poNo: [
    "po no",
    "po number",
    "po",
    "purchase order",
    "purchase order no",
    "no po",
    "nombor po",
  ],
  quotationRef: [
    // Lajur "Quotation" dalam invoice_2026.xlsx / R1 Invoice sheet: ia
    // merujuk NOMBOR SEBUT HARGA yang invois ini bilakan, dan BERBEZA
    // daripada lajur "Invoice No". Tanpa medan ini, invoices.quotation_no
    // tidak pernah diisi untuk import invois, jadi
    // idx_invoices_quotation_no_unique boleh dilanggar (GAP-ANALISIS §4.4).
    //
    // SENGAJA hanya padanan TEPAT disenaraikan. Versi awal turut ada
    // "quotation ref" / "quotation reference", dan itu merampas lajur
    // "Training Type" dalam Quotation Tracker:
    //     a = "quotation ref" ; h = "training type"
    //     a.includes(h) → "quotation training type".includes("training type")
    //     → true → skor 70 → quotationRef = "Training" (SALAH)
    //
    // "quotation no" juga TIDAK disenaraikan — ia milik referenceNo, supaya
    // sheet sebut harga tidak kehilangan rujukan utamanya.
    "quotation",
    "rujukan quotation",
    "quotation number billed",
  ],
  paymentStatus: [
    "payment status",
    "status pembayaran",
    "status bayaran",
    "payment state",
  ],
  netProfit: [
    "net profit",
    "profit",
    "untung bersih",
    "keuntungan bersih",
    "net margin",
  ],
  commission: [
    "commission",
    "komisen",
    "bro incentive",
    "incentive",
    "insentif",
  ],
  preparedBy: [
    "prepared by",
    "disediakan oleh",
    "provider",
    "issuer",
  ],
  mode: [
    "mode",
    "training mode",
    "delivery mode",
    "mod",
    "mod latihan",
    "kaedah",
    "kaedah latihan",
  ],
  status: [
    "status",
    "payment status",
    "invoice status",
    "quotation status",
    "keadaan",
    "payment status",
    "status bayaran",
    "status invois",
    "progress",
  ],
  description: [
    "description",
    "remarks",
    "remark",
    "notes",
    "note",
    "keterangan",
    "penerangan",
    "catatan",
    "maklumat",
    "butiran",
    "details",
    "cost description",
    "item",
    "perkara",
    "butiran kos",
  ],
};

/* ============================ Utiliti ============================ */

/** Tukar teks kepada bentuk ternormal untuk pemadanan longgar. */
function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // buang tanda diakritik (combining marks)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(value: string): Set<string> {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((t) => t.length > 1),
  );
}

/** Persamaan token (Jaccard) — digunakan untuk padanan gelaran program. */
function tokenSimilarity(a: string, b: string): number {
  const STOP = new Set([
    "the",
    "and",
    "for",
    "dan",
    "untuk",
    "dengan",
    "dalam",
    "of",
    "to",
    "in",
    "program",
    "programme",
    "latihan",
    "training",
    "kursus",
    "kursus",
    "sistem",
    "anjung",
  ]);
  const ta = [...tokenize(a)].filter((t) => !STOP.has(t));
  const tb = [...tokenize(b)].filter((t) => !STOP.has(t));
  if (!ta.length || !tb.length) return 0;
  const setA = new Set(ta);
  const setB = new Set(tb);
  let inter = 0;
  setA.forEach((t) => {
    if (setB.has(t)) inter++;
  });
  const union = new Set([...ta, ...tb]).size;
  return inter / union;
}

/**
 * Sama ada `phrase` muncul dalam `text` mengikut SEMPADAN PERKATAAN.
 *
 * Diperlukan kerana `String.includes` ialah padanan subrentetan tulen:
 * `"notes".includes("no") === true`, yang menyebabkan lajur urutan "No"
 * dirampas oleh alias "notes" (medan `description`). Kedua-dua `text` dan
 * `phrase` dijangka sudah dinormalisasi oleh `normalizeText` (huruf kecil,
 * bukan-alfanumerik → ruang).
 */
function containsPhrase(text: string, phrase: string): boolean {
  if (!text || !phrase) return false;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${escaped}($|\\s)`).test(text);
}

/** Skor pemadanan pengepala lajur → medan kanonik. */
function scoreHeader(
  header: string,
  aliases: string[],
): { score: number; exact: boolean } {
  const h = normalizeText(header);
  if (!h) return { score: 0, exact: false };

  let best = 0;
  let exact = false;

  for (const alias of aliases) {
    const a = normalizeText(alias);
    if (a === h) {
      best = Math.max(best, 100);
      exact = true;
      continue;
    }
    // Alias terkandung dalam pengepala (atau sebaliknya).
    //
    // DUA syarat, dan kedua-duanya perlu:
    //
    // (i) `substantial` — alias cukup panjang (≥4 aksara) atau berbilang
    //     perkataan. Elak perkataan pendek generik (cth. "kos", "rm")
    //     menembusi pengepala lain seperti "Tarikh Sebut Harga".
    //
    // (ii) `containsPhrase` — padanan mesti mengikut SEMPADAN PERKATAAN.
    //     SYARAT INI DITAMBAH kerana (i) sahaja tidak mencukupi: ia
    //     mengawal panjang ALIAS tetapi membenarkan pengepala PENDEK
    //     menembusi alias panjang. Bukti nyata:
    //         a = "notes" (6 aksara → substantial = true)
    //         h = "no"
    //         "notes".includes("no") === true  → skor 70
    //     Akibatnya lajur urutan "No" dalam Quotation Tracker dipetakan ke
    //     `description`, menjadikan description = "285" (nombor urutan),
    //     yang kemudiannya lulus pemeriksaan `hasData` dan mencipta 14
    //     REKOD HANTU (baris 286–299, semua lajur lain kosong).
    //     Kes sama: "po no", "no of unit", "pic - contact no" dan
    //     "quotation no" semuanya turut menuntut lajur "No" dengan skor 70.
    const substantial = a.length >= 4 || a.includes(" ");
    if (substantial && containsPhrase(h, a)) {
      best = Math.max(best, 70);
    }
    // Pertindihan token.
    const ht = tokenize(h);
    const at = tokenize(a);
    if (ht.size && at.size) {
      let inter = 0;
      ht.forEach((t) => {
        if (at.has(t)) inter++;
      });
      const jaccard = inter / new Set([...ht, ...at]).size;
      if (jaccard >= 0.5) {
        best = Math.max(best, Math.round(40 + jaccard * 40));
      }
    }
  }
  return { score: best, exact };
}

/**
 * Bina pemetaan: indeks lajur (0-based) → medan kanonik.
 *
 * Setiap medan kanonik mengambil LAJUR TERBAIKNYA (bukan lajur merampas
 * medan lain), dengan bonus isyarat kontekstual:
 *  - lajur amaun yang mengandungi "(RM)"/"$"/"%" diberi bonus,
 *  - lajur rujukan yang mengandungi "No./Ref/Number" diberi bonus,
 *  - lajur tarikh yang mengandungi "Date/Tarikh" diberi bonus.
 * Medan yang tidak berkaitan dengan jenis entiti (cth. rujukan pada
 * jadual kos) diabaikan supaya tidak merampas lajur "Programme / Ref".
 */
function buildColumnMapping(
  headerRow: unknown[],
  kind: EntityKind = "unknown",
): Map<number, CanonicalField> {
  const allowedFields = CANONICAL_FIELDS.filter((f) => {
    if (kind === "cost") {
      // Jadual Cost of Sale tidak mempunyai no. rujukan dokumen /
      // jenis dokumen — "Programme / Ref" kekal milik tajuk program.
      return f !== "referenceNo" && f !== "referenceType";
    }
    return true;
  });

  interface Candidate {
    col: number;
    field: CanonicalField;
    score: number;
  }
  const candidates: Candidate[] = [];

  headerRow.forEach((cell, col) => {
    const header = String(cell ?? "").trim();
    if (!header) return;
    const h = normalizeText(header);

    // Pengepala urutan tulen ("No", "No.", "Bil", "#") BUKAN medan data.
    // Tanpa pengawal ini lajur tersebut dirampas oleh poNo / quantity /
    // picContactNo / referenceNo / description, semuanya pada skor 70.
    // Pengecualian: "PO No", "Invoice No", "Quotation No", "No of Unit"
    // dan seumpamanya KEKAL dipetakan kerana ia mengandungi perkataan lain.
    if (/^(no|nombor|bil|bilangan|number|num|#)$/.test(h)) return;

    // Pengawal GAP-ANALISIS §4.1: lajur CUKAI / DISKAUN tidak boleh
    // menjadi `amount`. Tanpa pengawal ini, "SST 8% Amount" menang dengan
    // skor 115 (padanan tepat "amount" + bonus) dan nilai cukai RM1,555.56
    // disimpan sebagai nilai sebut harga yang sepatutnya RM21,000.
    const isTaxOrDiscountCol =
      /\bsst\b|\btax\b|cukai|diskaun|discount|deposit|downpayment|down payment/.test(h);
    // Lajur JENIS/KATEGORI bukan rujukan dokumen. Tanpa pengawal ini
    // "Quotation Type" dirampas oleh quotationRef (containment "quotation",
    // skor 70) setelah referenceNo memenangi "Quotation No" (skor 100),
    // menyebabkan quotationRef = "Training" untuk 118 rekod.
    const isTypeOrCategoryCol =
      /\btype\b|\bjenis\b|\bcategory\b|\bkategori\b|\bclass\b/.test(h);

    for (const field of allowedFields) {
      let { score } = scoreHeader(header, FIELD_ALIASES[field]);
      if (score < 35) continue;

      if (field === "amount" && isTaxOrDiscountCol) {
        score = 0;
        continue;
      }
      if (field === "quotationRef" && isTypeOrCategoryCol) {
        score = 0;
        continue;
      }

      let bonus = 0;
      if (field === "amount" && !isTaxOrDiscountCol
          && /\(rm\)|\brm\b|\$|amount|amaun|jumlah|nilai/.test(h)) {
        // `%` dikeluarkan daripada isyarat bonus: ia menarik "Discount %"
        // dan "SST 8%" ke arah `amount`.
        bonus += 15;
      }
      // `finalPrice` ialah nilai muktamad yang sepatutnya menjadi amaun
      // utama sebut harga — beri bonus supaya ia menang apabila wujud.
      if (field === "finalPrice") bonus += 12;
      // Nyahkabur "Quotation" mengikut JENIS ENTITI:
      //  - sheet INVOICE/COST: lajur "Quotation" ialah rujukan silang ke
      //    sebut harga asal → quotationRef mesti menang.
      //  - sheet QUOTATION: lajur "Quotation No" ialah rujukan UTAMA →
      //    referenceNo mesti menang, jadi TIADA bonus diberi.
      // Tanpa pembezaan ini kedua-dua medan seri pada skor 100 dan
      // pemenang dipilih mengikut susunan medan, bukan maksud lajur.
      if (field === "quotationRef" && kind !== "quotation" && /^quotation$/.test(h)) {
        bonus += 25;
      }
      if (field === "referenceNo" && /no|ref|number|nombor|bil\.?/.test(h)) {
        bonus += 10;
      }
      if (field === "docDate" && /date|tarikh/.test(h)) {
        bonus += 15;
      }
      candidates.push({ col, field, score: score + bonus });
    }
  });

  // Setiap medan memilih lajur dengan skor tertinggi.
  const bestByField = new Map<CanonicalField, Candidate>();
  for (const c of candidates) {
    const cur = bestByField.get(c.field);
    if (!cur || c.score > cur.score) bestByField.set(c.field, c);
  }

  // Selesaikan perebutan lajur: medan dengan skor tertinggi menang.
  const winners = [...bestByField.values()].sort((a, b) => b.score - a.score);
  const usedCols = new Set<number>();
  const mapping = new Map<number, CanonicalField>();
  for (const w of winners) {
    if (usedCols.has(w.col)) continue;
    mapping.set(w.col, w.field);
    usedCols.add(w.col);
  }
  return mapping;
}

/**
 * Tentukan jenis entiti (quotation / invoice / cost) berdasarkan teks
 * konteks — nama sheet, tajuk banner atau kandungan pengepala.
 */
function detectKindFromText(text: string): EntityKind | null {
  const t = normalizeText(text);
  if (!t) return null;

  const has = (...words: string[]) => words.some((w) => t.includes(w));

  // Cost of Sale diutamakan berbandung "amount/cost".
  if (
    has("cost of sale", "cost of sales", "kos jualan", "kos operasi", "expense", "expenses", "perbelanjaan")
  ) {
    return "cost";
  }
  if (
    has(
      "income",
      "invoice",
      "invois",
      "hasil",
      "pendapatan",
      "pembayaran",
      "payment received",
      "terimaan",
    )
  ) {
    return "invoice";
  }
  if (
    has(
      "quotation",
      "sebut harga",
      "sebutharga",
      "quote",
      "tracker",
      "penyebut harga",
      "tawaran",
    )
  ) {
    return "quotation";
  }
  return null;
}

function inferKindFromHeader(mapping: Map<number, CanonicalField>, headerRow: unknown[]): EntityKind | null {
  const fields = new Set(mapping.values());
  const headerText = headerRow.map((c) => String(c ?? "")).join(" ");
  if (normalizeText(headerText).includes("invoice") || normalizeText(headerText).includes("invois")) {
    return "invoice";
  }
  if (normalizeText(headerText).includes("quotation") || normalizeText(headerText).includes("sebut")) {
    return "quotation";
  }
  if (fields.has("referenceNo") && fields.has("amount")) {
    // Tanpa konteks lain: rujukan + amaun cenderung kepada quotation.
    return "quotation";
  }
  return null;
}

/** Adakah baris ini banner seksyen (cth. "COST OF SALE")? */
function detectSectionBanner(row: unknown[]): { isBanner: boolean; kind: EntityKind | null; label: string } {
  const nonEmpty = row
    .map((c) => String(c ?? "").trim())
    .filter(Boolean);
  if (nonEmpty.length === 0 || nonEmpty.length > 3) {
    return { isBanner: false, kind: null, label: "" };
  }
  const label = nonEmpty.join(" ");
  const upper = label.toUpperCase();
  const kindHints = [
    "QUOTATION",
    "SEBUT HARGA",
    "SEBUTHARGA",
    "QUOTE",
    "INVOICE",
    "INVOIS",
    "INCOME",
    "PENDAPATAN",
    "HASIL",
    "COST OF SALE",
    "KOS JUALAN",
    "EXPENSE",
    "PERBELANJAAN",
    "COST",
    "KOS",
  ];
  const hit = kindHints.some((k) => upper.includes(k));
  // Baris tajuk jadual yang sebenar biasanya mengandungi >3 lajur; banner
  // pendek & tidak mengandungi "amount/rm/jumlah" sebagai sel lajur.
  if (!hit) return { isBanner: false, kind: null, label };
  return { isBanner: true, kind: detectKindFromText(label), label };
}

/** Baris penjumlahan yang harus dilangkau. */
function isTotalRow(row: unknown[]): boolean {
  const nonEmpty = row.map((c) => String(c ?? "").trim()).filter(Boolean);
  if (nonEmpty.length === 0) return false;
  const joined = normalizeText(nonEmpty.join(" "));
  return [
    "total",
    "jumlah",
    "grand total",
    "jumlah keseluruhan",
    "jumlah besar",
    "subtotal",
    "sub total",
    "sum",
  ].some((t) => joined.startsWith(t) || joined === t);
}

function rowIsEmpty(row: unknown[]): boolean {
  return row.every((c) => String(c ?? "").trim() === "");
}

/**
 * Adakah baris ini kelihatan seperti baris pengepala?
 *
 * Peraturan ketat supaya baris DATA pertama (cth. "MAC/INV/2024/014")
 * tidak disilap sebagai pengepala:
 *  - sekurang-kurangnya 2 sel padan kuat (skor ≥ 70) dengan nama medan,
 *  - sel mestilah teks BUKAN nombor/tarikh,
 *  - sel rujukan hanya dikira jika mengandungi isyarat "No/Ref/Number".
 */
function looksLikeHeaderRow(
  row: unknown[],
  kind: EntityKind = "unknown",
): boolean {
  const allowedFields = CANONICAL_FIELDS.filter((f) =>
    kind === "cost" ? f !== "referenceNo" && f !== "referenceType" : true,
  );
  let hits = 0;
  let dataLike = 0;
  /**
   * Bilangan sel yang BERTIPE data (nombor atau Date). Berbeza daripada
   * `dataLike`, yang juga mengira sel TEKS yang tidak memadankan sebarang
   * alias. Pembezaan ini penting: header sheet lebar mempunyai BANYAK sel
   * teks yang tidak dipetakan ("Quotation Type", "Training Type", "Duration
   * - Days", "% Profit", "BRO Incentive") tetapi SIFAR sel nombor/tarikh.
   */
  let typedData = 0;

  for (const cell of row) {
    const raw = String(cell ?? "").trim();
    if (!raw) continue;

    if (cell instanceof Date || typeof cell === "number") {
      dataLike++;
      typedData++;
      continue;
    }

    let bestField: CanonicalField | null = null;
    let bestScore = 0;
    for (const field of allowedFields) {
      const { score, exact } = scoreHeader(raw, FIELD_ALIASES[field]);
      // Untuk rujukan, baris data seperti "MAC/INV/2024/014" boleh
      // terpadan separa — hanya terima jika ada isyarat pengepala.
      if (field === "referenceNo") {
        const hasNoSignal = /\bno\b|\bref\b|number|nombor|sebut|invois|quotation|invoice/i.test(
          raw,
        );
        if (!hasNoSignal) continue;
      }
      if (score >= 70 && score > bestScore) {
        bestScore = score;
        bestField = field;
      }
    }
    if (bestField) hits++;
    else dataLike++;
  }

  // GAP-ANALISIS §4.6 — dua kecacatan berbeza, dua pengawal berbeza:
  //
  // (a) Syarat asal `hits > dataLike` terlalu KETAT untuk sheet lebar.
  //     cost_of_sales_2026.xlsx ada 16 lajur tetapi hanya 6 dipetakan ke
  //     model data (10 lajur kewangan tidak dikenali) → 6 > 10 = false →
  //     header tidak pernah dikesan → 23 baris dibuang SECARA SENYAP.
  //     Dilonggarkan kepada `hits >= 4`.
  //
  // (b) Tetapi kelonggaran itu SAHAJA tidak cukup — ia memperkenalkan
  //     regresi: baris DATA pertama Quotation Tracker
  //     [1, 2025-12-18, "Training", "Training", "MSSB/QT/TRA/2026/0001",
  //      "Public Training", "KENANGA INVESTOR BERHAD", ...]
  //     turut lulus sebagai header, kerana "Training" ≈ "Training Type",
  //     "MSSB/QT/..." mengandungi "QT NO", dan "KENANGA INVESTOR BERHAD"
  //     mengandungi "INVESTOR". Akibatnya nama lajur diambil daripada
  //     NILAI DATA dan semua 266 rekod rosak.
  //     Pengawalnya: baris header sebenar TIDAK mengandungi sel nombor
  //     atau Date, jadi `typedData <= 1`. PERHATIAN: pengawal ini mesti
  //     guna `typedData`, BUKAN `dataLike` — `dataLike` turut mengira sel
  //     teks yang tidak dipetakan, dan header sheet lebar ada banyak
  //     daripadanya (Quotation Tracker: 49 lajur, hanya ~25 dipetakan),
  //     jadi `dataLike <= 1` menolak header yang sah dan menghasilkan
  //     0 rekod. Kesilapan ini dibuat dan dibetulan semasa kerja ini.
  //
  // Nota: kecacatan (b) SEBENARNYA sudah ada dalam parser asal — bukti:
  // label `raw` yang asal ("SST 8% Amount", "Company/Client", "Project
  // Title", "Status", "Date", "Quotation No", "No") semuanya ialah NILAI
  // baris 1, bukan nama lajur baris 0. Parser asal juga mengambil baris
  // data sebagai header; ia cuma menghasilkan amaun yang kelihatan masuk
  // akal (RM1,555.56) jadi tiada siapa perasan.
  return hits >= 2 && typedData <= 1 && (hits > dataLike || hits >= 4);
}

/* ==================== Pengekstrakan nilai sel ==================== */

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return toISODate(value);
  }
  if (typeof value === "number") {
    // Elak notasi saintifik / perpuluhan pelik.
    return Number.isInteger(value)
      ? String(value)
      : value.toFixed(2).replace(/\.?0+$/, "");
  }
  return String(value).trim();
}

function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value * 100) / 100;
  const text = String(value)
    .replace(/[RMrm$€£,\s]/g, "")
    .replace(/[()]/g, "-") // (1,200) → -1200 (angka kurungan = negatif)
    .trim();
  const num = parseFloat(text);
  return Number.isFinite(num) ? Math.round(num * 100) / 100 : null;
}

const MALAY_MONTHS: Record<string, number> = {
  jan: 0, januari: 0, january: 0,
  feb: 1, februari: 1, february: 1,
  mac: 2, mar: 2, march: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  ogos: 7, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  okt: 9, oct: 9, october: 9,
  nov: 10, november: 10,
  dis: 11, dec: 11, december: 11, disember: 11,
};

function parseDateValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  // Nombor siri tarikh Excel.
  if (value instanceof Date) {
    return toISODate(value);
  }
  if (typeof value === "number") {
    // Epoch sistem tarikh 1900.
    const parsed = XLSX.SSF ? XLSX.SSF.parse_date_code(value) : null;
    if (parsed && parsed.y > 1990) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
    return null;
  }

  const text = String(value).trim();

  // yyyy-mm-dd atau yyyy/mm/dd
  const iso = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }
  // dd/mm/yyyy atau dd-mm-yyyy (format lazim Malaysia).
  const dmy = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }
  // 15 Jun 2025 / 15 Jun 25
  const m = text.match(/(\d{1,2})[^\w]+([A-Za-z]{3,9})[^\w]+(\d{2,4})/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = MALAY_MONTHS[m[2].toLowerCase()];
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    if (month !== undefined && year > 1990) {
      return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  const fallback = new Date(text);
  if (!Number.isNaN(fallback.getTime())) return toISODate(fallback);
  return null;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ======================== Pengesahan rekod ======================== */

function validateRecord(
  record: StagingRecord,
): { errors: FieldWarning[]; warnings: FieldWarning[] } {
  const errors: FieldWarning[] = [];
  const warnings: FieldWarning[] = [];

  const isCost = record.entityKind === "cost";

  if (!isCost) {
    // Rujukan wajib untuk sebut harga & invois sahaja.
    if (!record.referenceNo) {
      errors.push({
        code:
          record.entityKind === "invoice"
            ? "MISSING_INVOICE_NO"
            : "MISSING_QUOTATION_NO",
        message:
          record.entityKind === "invoice"
            ? "No. Invois wajib diisi."
            : "No. Sebut Harga wajib diisi.",
        field: "referenceNo",
      });
    }
    if (!record.clientName) {
      errors.push({
        code: "MISSING_CLIENT",
        message: "Nama pelanggan / agensi wajib diisi.",
        field: "clientName",
      });
    }
  }

  if (record.amount === null) {
    errors.push({
      code: "MISSING_AMOUNT",
      message: isCost
        ? "Jumlah kos wajib diisi."
        : "Jumlah amaun wajib diisi.",
      field: "amount",
    });
  }

  // Untuk cost: butiran kos (Cost Item / description) menggantikan
  // tajuk program; sekurang-kurangnya salah satu perlu ada.
  if (!record.programmeTitle && !(isCost && record.description)) {
    errors.push({
      code: "MISSING_PROGRAMME",
      message: isCost
        ? "Rujukan program atau butiran item kos wajib diisi."
        : "Tajuk program wajib diisi.",
      field: "programmeTitle",
    });
  }
  if (!record.docDate) {
    warnings.push({
      code: "MISSING_DATE",
      message:
        "Tarikh dokumen tidak dapat dikesan (format tarikh mungkin tidak standard).",
      field: "docDate",
    });
  }
  if (record.duplicate) {
    const code: ParseWarningCode =
      record.duplicate.reason.includes("Rujukan")
        ? "DUPLICATE_REF"
        : "DUPLICATE_SUSPECTED";
    warnings.push({
      code,
      message: `Kemungkinan pendua: ${record.duplicate.reason}`,
    });
  }

  return { errors, warnings };
}

/* ======================== Pengesanan pendua ======================= */

function normalizeRef(ref: string): string {
  return normalizeText(ref).replace(/\s+/g, "");
}

function findDuplicate(
  record: StagingRecord,
  master: MasterRecords,
): DuplicateMatch | null {
  // 1) Padanan rujukan tepat (quotation/invoice sahaja) → keyakinan tinggi.
  const ref =
    record.entityKind === "cost" ? "" : normalizeRef(record.referenceNo);
  if (ref) {
    const refs =
      record.entityKind === "invoice"
        ? master.invoiceRefs ?? []
        : master.quotationRefs ?? [];
    const hit = refs.find((r) => normalizeRef(r) === ref);
    if (hit) {
      return {
        matchId: hit,
        label: hit,
        confidence: "high",
        score: 1,
        reason: `Rujukan ${record.entityKind === "invoice" ? "invois" : "sebut harga"} "${hit}" sudah wujud dalam sistem.`,
        masterValues: {
          Rujukan: hit,
          Program: "(rekod sedia ada)",
        },
      };
    }
  }

  // 2) Padanan gelaran program terhadap senarai program induk.
  if (record.programmeTitle && master.programmes?.length) {
    let best: { p: MasterProgrammeLike; score: number } | null = null;
    for (const p of master.programmes) {
      const score = tokenSimilarity(record.programmeTitle, p.title);
      if (!best || score > best.score) best = { p, score };
    }
    if (best && best.score >= 0.5) {
      const p = best.p;
      const high = best.score >= 0.8;
      return {
        matchId: p.id,
        label: `${p.code} — ${p.title}`,
        confidence: high ? "high" : "medium",
        score: best.score,
        reason: high
          ? `Tajuk program sepadan dengan program sedia ada ${p.code} (${Math.round(best.score * 100)}%).`
          : `Tajuk program hampir sama dengan program sedia ada ${p.code} (${Math.round(best.score * 100)}%). Sila semak sebelum simpan.`,
        masterValues: {
          Program: p.title,
          Pelanggan: p.client,
          Rujukan: p.code,
          "Nilai Kontrak (RM)": p.contractedAmount.toLocaleString("ms-MY", {
            minimumFractionDigits: 2,
          }),
          Tahun: String(p.year),
          Status: p.statusLabel ?? p.status,
        },
      };
    }
  }
  return null;
}

/* ========================== Teras parser ========================== */

interface HeaderState {
  mapping: Map<number, CanonicalField>;
  headerLabels: Map<CanonicalField, string>;
  kind: EntityKind;
  headerRowIndex: number;
}

function extractRecord(
  row: unknown[],
  state: HeaderState,
  sourceFile: string,
  sheetName: string,
  rowIndex: number, // 0-based
): StagingRecord {
  const get = (field: CanonicalField): string => {
    for (const [col, f] of state.mapping) {
      if (f === field) return asText(row[col]);
    }
    return "";
  };

  // Keutamaan amaun (GAP-ANALISIS §4.1): nilai MUKTAMAD dahulu, kemudian
  // jumlah termasuk SST, kemudian amaun generik, kemudian harga seunit.
  // `amount` generik diletak TERAKHIR kerana ia paling kabur — dalam
  // Quotation Tracker ia boleh bermakna apa sahaja.
  const amount =
    parseAmount(get("finalPrice")) ??
    parseAmount(get("totalInclSst")) ??
    parseAmount(get("amount")) ??
    parseAmount(get("unitPrice"));
  const docDate = parseDateValue(get("docDate"));
  const programmeTitle = get("programmeTitle");
  const clientName = get("clientName");
  const referenceNo = get("referenceNo");
  const referenceType = get("referenceType");

  const raw: Record<string, string> = {};
  state.mapping.forEach((field, col) => {
    const label = state.headerLabels.get(field) ?? field;
    raw[label] = asText(row[col]);
  });

  const record: StagingRecord = {
    id: `${sheetName}-${rowIndex + 1}-${Math.random().toString(36).slice(2, 8)}`,
    sourceFile,
    sheetName,
    rowNumber: rowIndex + 1,
    entityKind: state.kind,
    programmeTitle,
    clientName,
    referenceNo,
    referenceType,
    amount,
    currency: "MYR",
    docDate,
    year: docDate ? Number(docDate.slice(0, 4)) : null,
    category: get("category"),
    trainer: get("trainer"),
    mode: get("mode"),
    status: get("status"),
    description: get("description"),
    finalPrice: parseAmount(get("finalPrice")),
    unitPrice: parseAmount(get("unitPrice")),
    quantity: parseAmount(get("quantity")),
    sstAmount: parseAmount(get("sstAmount")),
    discountPct: parseAmount(get("discountPct")),
    totalInclSst: parseAmount(get("totalInclSst")),
    totalExclSst: parseAmount(get("totalExclSst")),
    accountManager: get("accountManager"),
    picName: get("picName"),
    picContactNo: get("picContactNo"),
    picEmail: get("picEmail"),
    poNo: get("poNo"),
    quotationRef: get("quotationRef"),
    paymentStatus: get("paymentStatus"),
    netProfit: parseAmount(get("netProfit")),
    commission: parseAmount(get("commission")),
    preparedBy: get("preparedBy"),
    isValid: false,
    errors: [],
    warnings: [],
    duplicate: null,
    action: "pending",
    raw,
  };

  return record;
}

/**
 * Parse satu worksheet kepada rekod staging. Menyokong berbilang jadual
 * (dipisahkan banner seksyen) dalam satu sheet.
 */
function parseSheet(
  sheetName: string,
  rows: unknown[][],
  sourceFile: string,
): StagingRecord[] {
  const records: StagingRecord[] = [];

  let state: HeaderState | null = null;
  const fallbackKind = detectKindFromText(sheetName) ?? "unknown";

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (rowIsEmpty(row)) continue;
    if (isTotalRow(row)) continue;

    const banner = detectSectionBanner(row);
    if (banner.isBanner) {
      // Banner seksyen menukar konteks jenis; pengepala baharu dijangka
      // pada baris berikutnya.
      if (banner.kind) {
        state = {
          mapping: new Map(),
          headerLabels: new Map(),
          kind: banner.kind,
          headerRowIndex: -1,
        };
      }
      continue;
    }

    // Jenis entiti semasa (daripada banner sebelumnya atau nama sheet).
    const currentKind: EntityKind =
      state && state.kind !== "unknown" ? state.kind : fallbackKind;

    if (looksLikeHeaderRow(row, currentKind)) {
      const mapping = buildColumnMapping(row, currentKind);
      if (mapping.size === 0) continue;
      const headerLabels = new Map<CanonicalField, string>();
      mapping.forEach((field, col) => {
        headerLabels.set(field, String(row[col] ?? "").trim());
      });
      const inferred = inferKindFromHeader(mapping, row);
      state = {
        mapping,
        headerLabels,
        kind: inferred ?? currentKind,
        headerRowIndex: i,
      };
      continue;
    }

    if (!state || state.mapping.size === 0) {
      // Belum jumpa pengepala — abaikan baris bebas di bahagian atas.
      continue;
    }

    const record = extractRecord(row, state, sourceFile, sheetName, i);
    // Rekod perlu mempunyai sekurang-kurangnya satu nilai bermakna.
    //
    // GAP-ANALISIS: syarat asal `record.amount !== null` menerima amount = 0
    // sebagai "ada data". Akibatnya 14 BARIS HANTU di hujung Quotation
    // Tracker (baris 286–299: hanya nombor urutan 285–298, semua lajur
    // lain kosong) menjadi rekod staging dengan amount = 0.
    //
    // Dua kelas baris bukan-data yang perlu ditolak:
    //
    // (A) BARIS HANTU — Quotation Tracker baris 286–299 hanya ada nombor
    //     urutan (285–298), semua lajur lain kosong. Sebelum pembetulan ini
    //     ia menjadi 14 rekod dengan amount = 0. Punca asal: lajur "No"
    //     dirampas oleh alias "notes" (≥ sempadan perkataan, kini dibetulkan
    //     dalam `containsPhrase`), jadi description = "285" dan hasData lulus.
    //
    // (B) BARIS JUMLAH — Quotation Tracker baris 299 ada
    //     `Final Price = 11,191,349.41` dan TIADA lajur lain. `isTotalRow`
    //     tidak menangkapnya kerana ia menyemak sama ada teks bergabung
    //     BERMULA dengan "total", sedangkan baris ini bermula dengan "1"
    //     (nombor urutan). Sekiranya disegerakkan, ia mencipta SATU rekod
    //     quotation hantu bernilai RM 11.19 juta — menggembungkan setiap
    //     laporan kewangan dan dashboard.
    //
    // Peraturan: rekod mesti ada PENGECAM (tajuk / pelanggan / rujukan /
    // keterangan). Amaun tanpa pengecam ialah baris jumlah atau baris
    // kosong yang mengandungi formula. Sebut harga bernilai sifar yang SAH
    // masih diterima kerana ia ada referenceNo (cth. MASB/QT/TRA/2026/0055)
    // — 22 rekod sedemikian wujud dan telah disahkan menentang Excel.
    const hasIdentifier =
      record.programmeTitle ||
      record.clientName ||
      record.referenceNo ||
      record.description;
    if (hasIdentifier) records.push(record);
    else if (record.amount !== null && record.amount !== 0) {
      // Amaun yang besar tanpa pengecam — lapor, jangan telan senyap.
      record.warnings.push({
        code: "UNIDENTIFIED_AMOUNT_ROW",
        message:
          `Baris ${record.rowNumber}: amaun ${record.amount} dijumpai tanpa ` +
          `pelanggan/rujukan/tajuk — kemungkinan baris JUMLAH. Baris ini ` +
          `tidak disimpan sebagai rekod.`,
        field: "amount",
      });
    }
  }

  return records;
}

/**
 * Parse keseluruhan workbook Excel kepada rekod `import_staging` lengkap
 * dengan pengesahan dan pengesanan pendua.
 *
 * @param data  Buffer / Uint8Array / ArrayBuffer fail .xlsx
 * @param fileName  Nama fail sumber
 * @param master  Rekod induk untuk pengesanan pendua (pilihan)
 */
export function parseExcelWorkbook(
  data: ArrayBuffer | Uint8Array,
  fileName: string,
  master: MasterRecords = {},
): ParsedWorkbook {
  const workbook = XLSX.read(data, {
    type: "array",
    cellDates: true,
    raw: true,
  });

  const allRecords: StagingRecord[] = [];
  const warnings: FieldWarning[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // header:1 → tatasusunan baris; defval → sel kosong jadi "";
    // raw:true + cellDates → tarikh kekal Date, amaun kekal nombor.
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: true,
      blankrows: false,
    }) as unknown[][];

    if (!rows.length) continue;

    const records = parseSheet(sheetName, rows, fileName);

    if (records.length === 0) {
      const kindGuess = detectKindFromText(sheetName);
      if (!kindGuess) {
        warnings.push({
          code: "UNMAPPED_SHEET",
          message: `Sheet "${sheetName}": tiada jadual data yang dikenali.`,
        });
      } else {
        warnings.push({
          code: "NO_DATA",
          message: `Sheet "${sheetName}": tiada baris data dijumpai.`,
        });
      }
      continue;
    }

    for (const record of records) {
      if (record.entityKind === "unknown") {
        record.entityKind =
          detectKindFromText(sheetName) ??
          detectKindFromText(fileName) ??
          "unknown";
      }
      record.duplicate = findDuplicate(record, master);
      const { errors, warnings: w } = validateRecord(record);
      record.errors = errors;
      record.warnings = w;
      record.isValid = errors.length === 0;
    }

    allRecords.push(...records);
  }

  if (allRecords.length === 0) {
    warnings.push({
      code: "NO_DATA",
      message: "Tiada satu baris data pun dapat diekstrak daripada fail ini.",
    });
  }

  const sheets: SheetParseSummary[] = workbook.SheetNames.map((sheetName) => {
    const recs = allRecords.filter((r) => r.sheetName === sheetName);
    // Jika sheet mengandungi berbilang jenis entiti (cth. Invois + Cost
    // of Sale), laporan jenis pertama; statistik tetap merangkumi semua.
    return {
      sheetName,
      entityKind: recs[0]?.entityKind ?? "unknown",
      recordCount: recs.length,
      validCount: recs.filter((r) => r.isValid).length,
      invalidCount: recs.filter((r) => !r.isValid).length,
      duplicateCount: recs.filter((r) => r.duplicate).length,
    };
  }).filter((s) => s.recordCount > 0 || allRecords.length === 0);

  return {
    fileName,
    totalRows: allRecords.length,
    validCount: allRecords.filter((r) => r.isValid).length,
    invalidCount: allRecords.filter((r) => !r.isValid).length,
    duplicateCount: allRecords.filter((r) => r.duplicate).length,
    sheets,
    records: allRecords,
    warnings,
  };
}

/* ================== Pemetaan ke jadual import_staging ================== */

/**
 * Bentuk baris jadual Supabase `import_staging` (lihat
 * `lib/supabase/schema-import-staging.sql`).
 */
export interface ImportStagingRow {
  source_file: string;
  source_sheet: string;
  source_row: number;
  entity_kind: EntityKind;
  programme_title: string;
  client_name: string;
  reference_no: string;
  reference_type: string;
  amount: number | null;
  currency: string;
  doc_date: string | null;
  fiscal_year: number | null;
  category: string;
  trainer: string;
  delivery_mode: string;
  status_raw: string;
  description: string;
  // ---- Medan perniagaan (GAP-ANALISIS §4.1–4.3) ----
  final_price: number | null;
  unit_price: number | null;
  quantity: number | null;
  /** Amaun CUKAI. TIDAK PERNAH menjadi amaun rekod. */
  sst_amount: number | null;
  discount_pct: number | null;
  total_incl_sst: number | null;
  total_excl_sst: number | null;
  account_manager: string;
  /** Individu bertanggungjawab — BUKAN nama syarikat pelanggan. */
  pic_name: string;
  pic_contact_no: string;
  pic_email: string;
  po_no: string;
  quotation_ref: string;
  payment_status_raw: string;
  net_profit: number | null;
  commission: number | null;
  prepared_by: string;
  is_valid: boolean;
  validation_errors: string[];
  warnings: string[];
  duplicate_match_id: string | null;
  duplicate_confidence: DuplicateConfidence | null;
  suggested_action: RecordAction;
  raw_payload: Record<string, string>;
}

export function toStagingRows(
  result: ParsedWorkbook,
): ImportStagingRow[] {
  return result.records.map((r) => ({
    source_file: r.sourceFile,
    source_sheet: r.sheetName,
    source_row: r.rowNumber,
    entity_kind: r.entityKind,
    programme_title: r.programmeTitle,
    client_name: r.clientName,
    reference_no: r.referenceNo,
    reference_type: r.referenceType,
    amount: r.amount,
    currency: r.currency,
    doc_date: r.docDate,
    fiscal_year: r.year,
    category: r.category,
    trainer: r.trainer,
    delivery_mode: r.mode,
    status_raw: r.status,
    description: r.description,
    final_price: r.finalPrice,
    unit_price: r.unitPrice,
    quantity: r.quantity,
    sst_amount: r.sstAmount,
    discount_pct: r.discountPct,
    total_incl_sst: r.totalInclSst,
    total_excl_sst: r.totalExclSst,
    account_manager: r.accountManager,
    pic_name: r.picName,
    pic_contact_no: r.picContactNo,
    pic_email: r.picEmail,
    po_no: r.poNo,
    quotation_ref: r.quotationRef,
    payment_status_raw: r.paymentStatus,
    net_profit: r.netProfit,
    commission: r.commission,
    prepared_by: r.preparedBy,
    is_valid: r.isValid,
    validation_errors: r.errors.map((e) => e.message),
    warnings: r.warnings.map((w) => w.message),
    duplicate_match_id: r.duplicate?.matchId ?? null,
    duplicate_confidence: r.duplicate?.confidence ?? null,
    suggested_action: r.action,
    raw_payload: r.raw,
  }));
}

/* ===================== Label paparan mesra pengguna ===================== */

export const ENTITY_KIND_LABEL: Record<EntityKind, string> = {
  quotation: "Sebut Harga",
  invoice: "Invois",
  cost: "Kos (Cost of Sale)",
  unknown: "Tidak Dikenali",
};

export const ACTION_LABEL: Record<RecordAction, string> = {
  pending: "Menunggu Keputusan",
  sync_confirmed: "Disahkan & Disegerak",
  merged: "Digabungkan",
  created_new: "Program Baharu",
  discarded: "Dibuang",
};
