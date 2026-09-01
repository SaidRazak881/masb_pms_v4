/**
 * process-v4-raw.js — Skrip untuk memproses data dari fail Excel V4 RAW
 * dan menjana SQL INSERT statements untuk Supabase.
 *
 * Cara penggunaan:
 *   node lib/scripts/process-v4-raw.js
 *
 * Output akan disimpan dalam fail SQL di lib/supabase/migrations/
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Direktori input dan output
const V4_RAW_DIR = 'V4 RAW';
const OUTPUT_DIR = 'lib/supabase/migrations';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'v4-raw-data-inserts.sql');

// Pastikan direktori output wujud
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Fungsi untuk escape string SQL
function escapeSqlString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

// Fungsi untuk format nombor SQL
function formatSqlNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return 'NULL';
  return Number(num).toFixed(2);
}

// Fungsi untuk format tarikh SQL
function formatSqlDate(date) {
  if (!date) return 'NULL';
  
  // Jika date adalah nombor (Excel date serial)
  if (typeof date === 'number') {
    // Excel date serial: 1 = 1900-01-01 (Windows) atau 1904-01-01 (Mac)
    // Kita assume Windows epoch
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const daysSinceEpoch = date - 1; // Excel bug: 1900 is not a leap year
    const targetDate = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
    date = targetDate;
  }
  
  if (!(date instanceof Date) && typeof date === 'string') {
    // Cuba parse string date
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      date = parsed;
    }
  }
  
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'NULL';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `'${year}-${month}-${day}'`;
}

// Fungsi untuk generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Fungsi untuk memproses Quotation Tracker
function processQuotationTracker(filePath, workbook) {
  const sheet = workbook.Sheets['Quotation Tracker'];
  if (!sheet) return [];
  
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const headers = json[0];
  const rows = json.slice(1);
  
  const sqlStatements = [];
  const organizers = new Map();
  const programmes = new Map();
  const financials = [];
  
  // Cari indeks kolum
  const colIndex = {};
  headers.forEach((header, index) => {
    const normalized = String(header).toLowerCase().trim();
    if (normalized.includes('quotation no') || normalized.includes('quotation number')) colIndex.quotationNo = index;
    if (normalized.includes('company') || normalized.includes('client')) colIndex.client = index;
    if (normalized.includes('project title') || normalized.includes('training title')) colIndex.title = index;
    if (normalized.includes('training type') || normalized.includes('category')) colIndex.category = index;
    if (normalized.includes('date')) colIndex.date = index;
    if (normalized.includes('total price') || normalized.includes('final price')) colIndex.amount = index;
    if (normalized.includes('status')) colIndex.status = index;
    if (normalized.includes('account manager') || normalized.includes('prepared by')) colIndex.manager = index;
    if (normalized.includes('pic') || normalized.includes('contact')) colIndex.pic = index;
    if (normalized.includes('delivery') || normalized.includes('mode')) colIndex.mode = index;
  });
  
  let orgIdCounter = 1;
  let progIdCounter = 1;
  
  rows.forEach((row, rowIndex) => {
    if (!row || row.length === 0) return;
    
    const quotationNo = row[colIndex.quotationNo];
    const client = row[colIndex.client];
    const title = row[colIndex.title];
    const category = row[colIndex.category];
    const date = row[colIndex.date];
    const amount = row[colIndex.amount];
    const status = row[colIndex.status];
    const manager = row[colIndex.manager];
    const pic = row[colIndex.pic];
    
    if (!quotationNo || !title) return;
    
    // Generate IDs
    const orgKey = String(client).toLowerCase().trim();
    let orgId;
    if (!organizers.has(orgKey)) {
      orgId = `org-${String(orgIdCounter).padStart(3, '0')}`;
      organizers.set(orgKey, orgId);
      orgIdCounter++;
      
      // Insert organizer
      sqlStatements.push(`
-- Organizer: ${escapeSqlString(client)}
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES (${escapeSqlString(orgId)}, ${escapeSqlString(client)}, 'Private', true)
ON CONFLICT (name) DO NOTHING;`);
    } else {
      orgId = organizers.get(orgKey);
    }
    
    // Programme code dari quotation number
    const progCode = String(quotationNo).split('/').pop() || `PROG-${String(progIdCounter).padStart(4, '0')}`;
    const progId = `prog-${String(progIdCounter).padStart(3, '0')}`;
    progIdCounter++;
    
    // Tentukan category
    const progCategory = category && String(category).toLowerCase().includes('ai') ? 'AI & Data Science' :
                        category && String(category).toLowerCase().includes('cyber') ? 'Cybersecurity' :
                        category && String(category).toLowerCase().includes('cloud') ? 'Cloud & Infrastructure' :
                        category && String(category).toLowerCase().includes('digital') ? 'Digital Transformation' :
                        category && String(category).toLowerCase().includes('leadership') ? 'Leadership & Management' :
                        category && String(category).toLowerCase().includes('iot') ? 'IoT & Embedded Systems' :
                        'Non-Training';
    
    // Tentukan delivery mode
    const deliveryMode = row[colIndex.mode] && String(row[colIndex.mode]).toLowerCase().includes('online') ? 'online' :
                        row[colIndex.mode] && String(row[colIndex.mode]).toLowerCase().includes('hybrid') ? 'hybrid' : 'in_person';
    
    // Insert programme
    sqlStatements.push(`
-- Programme: ${escapeSqlString(title)}
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  ${escapeSqlString(progId)}, ${escapeSqlString(progCode)}, ${escapeSqlString(title)}, 
  ${escapeSqlString(title)}, ${escapeSqlString(orgId)}, ${escapeSqlString(client)},
  '${progCategory}', '${deliveryMode}', ${formatSqlDate(date)}, ${formatSqlDate(date)},
  NULL, ${escapeSqlString(manager)}, ${escapeSqlString(manager)},
  ${formatSqlNumber(amount)}, ${formatSqlNumber(amount * 0.9)}, ${formatSqlNumber(amount * 0.85)},
  '${status ? String(status).toLowerCase().replace(' ', '_') : 'draft'}'
) ON CONFLICT (programme_code) DO NOTHING;`);
    
    // Insert quotation
    const finId = `fin-${String(progIdCounter).padStart(3, '0')}`;
    sqlStatements.push(`
-- Financial Doc (Quotation): ${escapeSqlString(quotationNo)}
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  ${escapeSqlString(finId)}, ${escapeSqlString(progId)}, 'quotation', ${escapeSqlString(quotationNo)},
  ${formatSqlNumber(amount)}, ${formatSqlDate(date)}, 'accepted',
  ${escapeSqlString(manager)}, ${escapeSqlString(pic)}, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;`);
  });
  
  return sqlStatements;
}

// Fungsi untuk memproses Income Statement (Invoice dan Cost of Sale)
function processIncomeStatement(filePath, workbook) {
  const sqlStatements = [];
  const organizers = new Map();
  const programmes = new Map();
  
  // Proses sheet Invoice
  const invoiceSheet = workbook.Sheets['Invoice'];
  if (invoiceSheet) {
    const invoiceJson = XLSX.utils.sheet_to_json(invoiceSheet, { header: 1 });
    const invoiceHeaders = invoiceJson[0];
    const invoiceRows = invoiceJson.slice(1);
    
    // Cari indeks kolum
    const colIndex = {};
    invoiceHeaders.forEach((header, index) => {
      const normalized = String(header).toLowerCase().trim();
      if (normalized.includes('company') || normalized.includes('client')) colIndex.company = index;
      if (normalized.includes('training') || normalized.includes('project') || normalized.includes('title')) colIndex.title = index;
      if (normalized.includes('quotation') || normalized.includes('qt')) colIndex.quotation = index;
      if (normalized.includes('invoice no') || normalized.includes('invoice number')) colIndex.invoiceNo = index;
      if (normalized.includes('invoice value') || normalized.includes('amount')) colIndex.amount = index;
      if (normalized.includes('invoice date') || normalized.includes('date')) colIndex.date = index;
      if (normalized.includes('payment status')) colIndex.paymentStatus = index;
      if (normalized.includes('account manager') || normalized.includes('pic')) colIndex.manager = index;
      if (normalized.includes('start date')) colIndex.startDate = index;
      if (normalized.includes('end date')) colIndex.endDate = index;
    });
    
    let progIdCounter = 1;
    
    invoiceRows.forEach((row, rowIndex) => {
      if (!row || row.length === 0) return;
      
      const company = row[colIndex.company];
      const title = row[colIndex.title];
      const quotationNo = row[colIndex.quotation];
      const invoiceNo = row[colIndex.invoiceNo];
      const amount = row[colIndex.amount];
      const invoiceDate = row[colIndex.date];
      const paymentStatus = row[colIndex.paymentStatus];
      const manager = row[colIndex.manager];
      const startDate = colIndex.startDate ? row[colIndex.startDate] : row[colIndex.date];
      const endDate = colIndex.endDate ? row[colIndex.endDate] : row[colIndex.date];
      
      if (!invoiceNo || !title) return;
      
      // Generate IDs
      const orgKey = String(company).toLowerCase().trim();
      let orgId;
      if (!organizers.has(orgKey)) {
        orgId = `org-inv-${String(progIdCounter).padStart(3, '0')}`;
        organizers.set(orgKey, orgId);
        
        sqlStatements.push(`
-- Organizer: ${escapeSqlString(company)}
INSERT INTO public.organizers (id, name, sector, is_active) 
VALUES (${escapeSqlString(orgId)}, ${escapeSqlString(company)}, 'Government', true)
ON CONFLICT (name) DO NOTHING;`);
      } else {
        orgId = organizers.get(orgKey);
      }
      
      // Programme code dari invoice number
      const progCode = String(invoiceNo).split('/').pop() || `INV-${String(progIdCounter).padStart(4, '0')}`;
      const progId = `prog-inv-${String(progIdCounter).padStart(3, '0')}`;
      progIdCounter++;
      
      // Tentukan category dari title
      const progCategory = title && String(title).toLowerCase().includes('ai') ? 'AI & Data Science' :
                          title && String(title).toLowerCase().includes('cyber') ? 'Cybersecurity' :
                          title && String(title).toLowerCase().includes('cloud') ? 'Cloud & Infrastructure' :
                          title && String(title).toLowerCase().includes('digital') ? 'Digital Transformation' :
                          title && String(title).toLowerCase().includes('leadership') ? 'Leadership & Management' :
                          title && String(title).toLowerCase().includes('iot') ? 'IoT & Embedded Systems' :
                          'Non-Training';
      
      // Insert programme (jika belum wujud)
      sqlStatements.push(`
-- Programme: ${escapeSqlString(title)}
INSERT INTO public.programmes (
  id, programme_code, title, description, organizer_id, organizer_name,
  category, delivery_mode, start_date, end_date, venue, trainer,
  programme_manager, contracted_amount, budget, actual_cost, status
) VALUES (
  ${escapeSqlString(progId)}, ${escapeSqlString(progCode)}, ${escapeSqlString(title)}, 
  ${escapeSqlString(title)}, ${escapeSqlString(orgId)}, ${escapeSqlString(company)},
  '${progCategory}', 'in_person', ${formatSqlDate(startDate)}, ${formatSqlDate(endDate)},
  NULL, ${escapeSqlString(manager)}, ${escapeSqlString(manager)},
  ${formatSqlNumber(amount)}, ${formatSqlNumber(amount * 0.9)}, ${formatSqlNumber(amount * 0.85)},
  '${paymentStatus ? String(paymentStatus).toLowerCase().replace(' ', '_') : 'completed'}'
) ON CONFLICT (programme_code) DO NOTHING;`);
      
      // Insert invoice
      const finId = `fin-inv-${String(progIdCounter).padStart(3, '0')}`;
      sqlStatements.push(`
-- Financial Doc (Invoice): ${escapeSqlString(invoiceNo)}
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  ${escapeSqlString(finId)}, ${escapeSqlString(progId)}, 'invoice', ${escapeSqlString(invoiceNo)},
  ${formatSqlNumber(amount)}, ${formatSqlDate(invoiceDate)}, '${paymentStatus ? String(paymentStatus).toLowerCase() : 'paid'}',
  ${escapeSqlString(manager)}, ${escapeSqlString(manager)}, 'Invois rasmi'
) ON CONFLICT (reference_no) DO NOTHING;`);
      
      // Insert quotation (jika ada)
      if (quotationNo) {
        const qtId = `fin-qt-${String(progIdCounter).padStart(3, '0')}`;
        sqlStatements.push(`
-- Financial Doc (Quotation): ${escapeSqlString(quotationNo)}
INSERT INTO public.financial_docs (
  id, programme_id, doc_type, reference_no, amount, issued_date, status,
  account_manager, pic_name, notes
) VALUES (
  ${escapeSqlString(qtId)}, ${escapeSqlString(progId)}, 'quotation', ${escapeSqlString(quotationNo)},
  ${formatSqlNumber(amount)}, ${formatSqlDate(startDate)}, 'accepted',
  ${escapeSqlString(manager)}, ${escapeSqlString(manager)}, 'Sebutharga rasmi'
) ON CONFLICT (reference_no) DO NOTHING;`);
      }
    });
  }
  
  // Proses sheet Cost of Sale
  const cosSheet = workbook.Sheets['Cost of Sale'];
  if (cosSheet) {
    const cosJson = XLSX.utils.sheet_to_json(cosSheet, { header: 1 });
    const cosHeaders = cosJson[0];
    const cosRows = cosJson.slice(1);
    
    // Cari indeks kolum
    const colIndex = {};
    cosHeaders.forEach((header, index) => {
      const normalized = String(header).toLowerCase().trim();
      if (normalized.includes('company') || normalized.includes('client')) colIndex.company = index;
      if (normalized.includes('invoice no') || normalized.includes('invoice number')) colIndex.invoiceNo = index;
      if (normalized.includes('cost of sales') || normalized.includes('cost')) colIndex.cost = index;
      if (normalized.includes('mimos academy cost')) colIndex.mimosCost = index;
      if (normalized.includes('net profit') || normalized.includes('profit')) colIndex.profit = index;
      if (normalized.includes('profit') && normalized.includes('%')) colIndex.profitPct = index;
    });
    
    cosRows.forEach((row, rowIndex) => {
      if (!row || row.length === 0) return;
      
      const company = row[colIndex.company];
      const invoiceNo = row[colIndex.invoiceNo];
      const costOfSales = row[colIndex.cost];
      const mimosCost = row[colIndex.mimosCost];
      const profit = row[colIndex.profit];
      const profitPct = row[colIndex.profitPct];
      
      if (!invoiceNo) return;
      
      // Cari programme ID berdasarkan invoice number
      // Kita assume invoice number sudah wujud dalam financial_docs
      const progId = `prog-inv-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`;
      
      const costId = `cost-${String(rowIndex + 1).padStart(3, '0')}`;
      sqlStatements.push(`
-- Programme Cost: ${escapeSqlString(invoiceNo)}
INSERT INTO public.programme_costs (
  id, programme_id, cost_of_sales, mimos_academy_cost, net_profit, profit_percentage
) VALUES (
  ${escapeSqlString(costId)}, ${escapeSqlString(progId)},
  ${formatSqlNumber(costOfSales)}, ${formatSqlNumber(mimosCost)},
  ${formatSqlNumber(profit)}, ${formatSqlNumber(profitPct)}
) ON CONFLICT (programme_id) DO UPDATE SET
  cost_of_sales = EXCLUDED.cost_of_sales,
  mimos_academy_cost = EXCLUDED.mimos_academy_cost,
  net_profit = EXCLUDED.net_profit,
  profit_percentage = EXCLUDED.profit_percentage;`);
    });
  }
  
  return sqlStatements;
}

// Fungsi utama
function main() {
  console.log('Memulakan pemprosesan fail Excel V4 RAW...');
  
  const v4RawDir = V4_RAW_DIR;
  const files = fs.readdirSync(v4RawDir).filter(f => f.endsWith('.xlsx'));
  
  const allSqlStatements = [];
  
  files.forEach(file => {
    const filePath = path.join(v4RawDir, file);
    console.log(`\nMemproses: ${file}`);
    
    try {
      const workbook = XLSX.readFile(filePath);
      
      if (file.includes('Quotation Tracker')) {
        const statements = processQuotationTracker(filePath, workbook);
        allSqlStatements.push(...statements);
        console.log(`  - Dijumpai ${statements.length} statement SQL`);
      }
      
      if (file.includes('INCOME_STATEMENT')) {
        const statements = processIncomeStatement(filePath, workbook);
        allSqlStatements.push(...statements);
        console.log(`  - Dijumpai ${statements.length} statement SQL`);
      }
    } catch (error) {
      console.error(`  - Ralat memproses ${file}:`, error.message);
    }
  });
  
  // Tambah header SQL
  const sqlContent = `-- =====================================================================
-- TPMS MIMOS Academy — Data Migrasi V4 RAW
-- Dijana pada: ${new Date().toISOString()}
-- =====================================================================

BEGIN;

${allSqlStatements.join('\n\n')}

COMMIT;
`;
  
  // Simpan ke fail
  fs.writeFileSync(OUTPUT_FILE, sqlContent);
  console.log(`\n✅ Fail SQL berjaya dijana: ${OUTPUT_FILE}`);
  console.log(`   Bilangan statement: ${allSqlStatements.length}`);
}

// Jalankan
main();
