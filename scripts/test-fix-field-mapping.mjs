/**
 * test-fix-field-mapping.mjs — Ujian PGlite untuk fix-field-mapping.sql
 * =====================================================================
 *
 * MENGAPA UJIAN INI WUJUD
 * -----------------------
 * `docs/GAP-ANALISIS-FUNGSI-BELUM-ADA.md` §4 menemui bahawa import Excel
 * menulis MAKNA YANG SALAH ke lajur yang betul:
 *
 *   §4.1  `trainer` (jurulatih)         → `invoices.account_manager`
 *   §4.2  `client_name` (nama SYARIKAT) → `invoices.pic_name` (INDIVIDU)
 *   §4.3  amaun quotation               → `invoices.po_value_excl_tax`
 *   §4.4  import quotation kemudian invois dengan quotation_no sama
 *         → `unique_violation` (23505) → kerana sync ATOMIK,
 *           SELURUH batch gagal
 *
 * Ujian ini membuktikan keempat-empatnya telah dibetulkan, menggunakan
 * nilai SEBENAR daripada baris 1 `V4 RAW/00. Quotation Tracker (1).xlsx`
 * dan `V4 RAW/invoice_2026.xlsx` supaya ia menguji data nyata, bukan
 * data rekaan.
 *
 * Ia juga menguji bahawa fix-field-mapping.sql:
 *   - IDEMPOTEN (boleh dijalankan berulang kali tanpa ralat)
 *   - hanya MENAMBAH lajur (tidak DROP, tidak UPDATE, tidak DELETE)
 *   - tidak menyentuh data sedia ada
 *
 * Jalankan: node scripts/test-fix-field-mapping.mjs
 */
import fs from 'fs';
import { PGlite } from '@electric-sql/pglite';

let pass = 0;
let fail = 0;
const ok = (m) => { pass++; console.log(`  ✅ ${m}`); };
const bad = (m) => { fail++; console.log(`  ❌ ${m}`); };
const eq = (a, e, m) =>
  a === e ? ok(`${m} = ${JSON.stringify(a)}`)
          : bad(`${m}: dapat ${JSON.stringify(a)}, jangkaan ${JSON.stringify(e)}`);

const UID = '11111111-1111-4111-8111-111111111111';
const BATCH = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BATCH2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const BOOTSTRAP = `
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT '${UID}'::uuid $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
END $$;
INSERT INTO auth.users (id, email) VALUES ('${UID}'::uuid, 'staff@mimos.my') ON CONFLICT DO NOTHING;
`;

const FILES = [
  'lib/supabase/schema-master.sql',
  'lib/supabase/schema-import-staging.sql',
  'lib/supabase/sync-import-transaction.sql',
];

// Nilai SEBENAR baris 1 Quotation Tracker (disahkan menentang Excel lajur
// [4],[6],[8],[9],[10],[11],[13],[14],[16],[17],[18],[20],[24]).
const QT = {
  quotationNo: 'MSSB/QT/TRA/2026/0001',
  client: 'KENANGA INVESTOR BERHAD',
  title: 'Train The Trainer (TTT)',
  accountManager: 'Farrah',           // lajur [7] kosong pada baris 1; guna nilai baris 31
  picName: 'Ms Liyana Ayunni',        // lajur [9]
  picContact: '6012-227 0011',        // lajur [10]
  picEmail: 'vl.victoryintelligence@gmal.com', // lajur [11]
  preparedBy: 'Nur Izzati Zailani',   // lajur [24]
  trainer: 'DR. CALON',               // SENGAJA berbeza — mesti TIDAK masuk account_manager
  unitPrice: 9722.22,                 // lajur [14]
  quantity: 2,                        // lajur [13]
  totalExclSst: 19444.44,             // lajur [16]
  totalInclSst: 21000,                // lajur [17]
  sst: 1555.56,                       // lajur [18]
  finalPrice: 21000,                  // lajur [20]
  docDate: '2025-12-18',
};

// Nilai SEBENAR baris 1 invoice_2026.xlsx
const INV = {
  invoiceNo: '95000016/2026',
  quotationRef: 'MA/QT/2026(0001)',
  client: 'MIMOS Berhad',
  accountManager: 'Adilah',
  picName: 'Adilah',
  sst: 680,
  total: 9180,
  docDate: '2026-03-27',
};

const db = new PGlite();

try {
  await db.exec(BOOTSTRAP);
  for (const f of FILES) {
    await db.exec('BEGIN');
    await db.exec(fs.readFileSync(f, 'utf8'));
    await db.exec('COMMIT');
  }
  await db.exec(`INSERT INTO public.user_profiles (id, full_name, email, role)
                 VALUES ('${UID}'::uuid, 'Staff Test', 'staff@mimos.my', 'staff');`);
  ok('skema asas dipasang');

  // -------------------------------------------------------------------
  console.log('\n=== 1. fix-field-mapping.sql: lajur baharu wujud ===');
  // -------------------------------------------------------------------
  await db.exec(fs.readFileSync('lib/supabase/fix-field-mapping.sql', 'utf8'));
  ok('fix-field-mapping.sql dijalankan tanpa ralat');

  const q = async (sql) => (await db.query(sql)).rows;

  const stagingCols = await q(`SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='import_staging'`);
  const stagingSet = new Set(stagingCols.map((r) => r.column_name));
  for (const c of ['final_price','unit_price','quantity','sst_amount','discount_pct',
                   'total_incl_sst','total_excl_sst','account_manager','pic_name',
                   'pic_contact_no','pic_email','po_no','quotation_ref',
                   'payment_status_raw','net_profit','commission','prepared_by']) {
    if (stagingSet.has(c)) ok(`import_staging.${c} wujud`);
    else bad(`import_staging.${c} HILANG`);
  }

  const invCols = await q(`SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='invoices'`);
  const invSet = new Set(invCols.map((r) => r.column_name));
  for (const c of ['client_name','pic_contact_no','pic_email','sst','quantity','unit_price']) {
    if (invSet.has(c)) ok(`invoices.${c} wujud`);
    else bad(`invoices.${c} HILANG`);
  }

  // -------------------------------------------------------------------
  console.log('\n=== 2. IDEMPOTEN — jalankan 2 kali lagi ===');
  // -------------------------------------------------------------------
  let idempoten = true;
  for (const kali of [2, 3]) {
    try {
      await db.exec(fs.readFileSync('lib/supabase/fix-field-mapping.sql', 'utf8'));
    } catch (e) {
      idempoten = false;
      bad(`laksanaan ke-${kali} GAGAL: ${e.message.split('\n')[0]}`);
    }
  }
  if (idempoten) ok('fix-field-mapping.sql idempoten (3× tanpa ralat)');

  // -------------------------------------------------------------------
  console.log('\n=== 3. Tiada objek DIGUGURKAN / data diusik ===');
  // -------------------------------------------------------------------
  const sqlText = fs.readFileSync('lib/supabase/fix-field-mapping.sql', 'utf8');
  const tanpaKomen = sqlText.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  for (const kata of ['DROP ', 'DELETE ', 'TRUNCATE', 'UPDATE ']) {
    if (new RegExp(`\\b${kata.trim()}\\b`, 'i').test(tanpaKomen)) bad(`fail mengandungi ${kata.trim()} (selain komen)`);
    else ok(`tiada ${kata.trim()} dalam fail (selain komen)`);
  }
  const alters = (tanpaKomen.match(/ALTER TABLE/gi) || []).length;
  eq(alters, 2, 'bilangan ALTER TABLE (import_staging + invoices)');
  const addCols = (tanpaKomen.match(/ADD COLUMN IF NOT EXISTS/gi) || []).length;
  eq(addCols, 23, 'bilangan ADD COLUMN IF NOT EXISTS (17 staging + 6 invoices)');

  // -------------------------------------------------------------------
  console.log('\n=== 4. §4.1–4.3: sync QUOTATION menulis ke lajur BETUL ===');
  // -------------------------------------------------------------------
  await db.exec(`
    INSERT INTO public.import_batches (id, source_file, file_name, status)
    VALUES ('${BATCH}', 'qt.xlsx', 'qt.xlsx', 'staged');
    INSERT INTO public.import_staging (batch_id, source_file, source_sheet, source_row,
      entity_kind, programme_title, client_name, reference_no, amount, is_valid,
      suggested_action, final_price, unit_price, quantity, sst_amount,
      total_incl_sst, total_excl_sst, account_manager, pic_name, pic_contact_no,
      pic_email, prepared_by, trainer, doc_date)
    VALUES ('${BATCH}', 'qt.xlsx', 'Quotation Tracker', 2, 'quotation',
      '${QT.title}', '${QT.client}', '${QT.quotationNo}', ${QT.finalPrice}, true,
      'sync_confirmed', ${QT.finalPrice}, ${QT.unitPrice}, ${QT.quantity}, ${QT.sst},
      ${QT.totalInclSst}, ${QT.totalExclSst}, '${QT.accountManager}', '${QT.picName}',
      '${QT.picContact}', '${QT.picEmail}', '${QT.preparedBy}', '${QT.trainer}',
      '${QT.docDate}');
  `);
  const st1 = await q(`SELECT id FROM public.import_staging WHERE batch_id='${BATCH}'`);
  const rowQT = {
    entity_kind: 'quotation', action: 'sync_confirmed',
    programme_title: QT.title, client_name: QT.client, reference_no: QT.quotationNo,
    amount: QT.finalPrice, doc_date: QT.docDate, trainer: QT.trainer,
    account_manager: QT.accountManager, pic_name: QT.picName,
    pic_contact_no: QT.picContact, pic_email: QT.picEmail, prepared_by: QT.preparedBy,
    final_price: QT.finalPrice, unit_price: QT.unitPrice, quantity: QT.quantity,
    sst_amount: QT.sst, total_incl_sst: QT.totalInclSst, total_excl_sst: QT.totalExclSst,
    staging_id: st1[0].id,
  };
  const r1 = await q(`SELECT public.sync_import_transaction('${BATCH}'::uuid,
    '${JSON.stringify([rowQT]).replace(/'/g, "''")}'::jsonb) AS r`);
  ok(`sync quotation berjaya: ${JSON.stringify(r1[0].r)}`);

  const inv1 = (await q(`SELECT * FROM public.invoices`))[0];
  console.log('  -- nilai sebenar dalam invoices --');
  // §4.1: account_manager mesti = Account Manager, BUKAN trainer
  eq(inv1.account_manager, QT.accountManager, '§4.1 account_manager');
  if (inv1.account_manager === QT.trainer) bad('§4.1 REGRESI: trainer masih ditulis ke account_manager');
  // §4.2: pic_name mesti = individu, BUKAN nama syarikat
  eq(inv1.pic_name, QT.picName, '§4.2 pic_name (individu)');
  if (inv1.pic_name === QT.client) bad('§4.2 REGRESI: nama syarikat masih ditulis ke pic_name');
  eq(inv1.client_name, QT.client, '§4.2 client_name (syarikat, lajur BAHARU)');
  eq(inv1.pic_contact_no, QT.picContact, '§4.2 pic_contact_no');
  eq(inv1.pic_email, QT.picEmail, '§4.2 pic_email');
  // §4.3: nilai quotation mesti ke lajur nilai, BUKAN po_value_excl_tax
  eq(Number(inv1.po_value_excl_tax), 0, '§4.3 po_value_excl_tax (kekal DEFAULT 0, bukan amaun quotation)');
  if (Number(inv1.po_value_excl_tax) === QT.finalPrice) bad('§4.3 REGRESI: amaun quotation masih ke po_value_excl_tax');
  eq(Number(inv1.invoice_value_excl_tax), QT.totalExclSst, '§4.3 invoice_value_excl_tax (total tanpa SST)');
  eq(Number(inv1.total_value), QT.totalInclSst, '§4.3 total_value (total dengan SST)');
  // §4.1: SST mesti disimpan BERASINGAN, bukan sebagai amaun
  eq(Number(inv1.sst), QT.sst, '§4.1 sst (cukai disimpan berasingan)');
  eq(Number(inv1.quantity), QT.quantity, 'quantity');
  eq(Number(inv1.unit_price), QT.unitPrice, 'unit_price');
  eq(inv1.quotation_no, QT.quotationNo, 'quotation_no');
  eq(inv1.notes, QT.preparedBy, 'notes (Prepared by)');

  // -------------------------------------------------------------------
  console.log('\n=== 5. §4.4: invois selepas quotation TIDAK melanggar UNIQUE ===');
  // -------------------------------------------------------------------
  // Cipta indeks UNIQUE yang wujud di live (schema-master.sql:746).
  await db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_quotation_no_unique
    ON public.invoices (quotation_no) WHERE quotation_no IS NOT NULL;`);
  const progId = inv1.programme_id;
  const bilSebelum = (await q(`SELECT count(*)::int AS n FROM public.invoices`))[0].n;

  await db.exec(`
    INSERT INTO public.import_batches (id, source_file, file_name, status)
    VALUES ('${BATCH2}', 'inv.xlsx', 'inv.xlsx', 'staged');
    INSERT INTO public.import_staging (batch_id, source_file, source_sheet, source_row,
      entity_kind, programme_title, client_name, reference_no, amount, is_valid,
      suggested_action, quotation_ref, sst_amount, total_incl_sst, account_manager,
      pic_name, doc_date)
    VALUES ('${BATCH2}', 'inv.xlsx', 'invoice_2026', 2, 'invoice',
      '${QT.title}', '${INV.client}', '${INV.invoiceNo}', ${INV.total}, true,
      'sync_confirmed', '${QT.quotationNo}', ${INV.sst}, ${INV.total},
      '${INV.accountManager}', '${INV.picName}', '${INV.docDate}');
  `);
  const st2 = await q(`SELECT id FROM public.import_staging WHERE batch_id='${BATCH2}'`);
  const rowINV = {
    entity_kind: 'invoice', action: 'sync_confirmed',
    programme_title: QT.title, client_name: INV.client, reference_no: INV.invoiceNo,
    amount: INV.total, doc_date: INV.docDate, quotation_ref: QT.quotationNo,
    sst_amount: INV.sst, total_incl_sst: INV.total,
    account_manager: INV.accountManager, pic_name: INV.picName,
    staging_id: st2[0].id,
  };

  let pelanggaran = null;
  try {
    await q(`SELECT public.sync_import_transaction('${BATCH2}'::uuid,
      '${JSON.stringify([rowINV]).replace(/'/g, "''")}'::jsonb) AS r`);
  } catch (e) {
    pelanggaran = e.message;
  }
  if (pelanggaran) {
    if (/23505|unique/i.test(pelanggaran)) bad(`§4.4 REGRESI: unique_violation masih berlaku — ${pelanggaran.split('\n')[0]}`);
    else bad(`§4.4 sync invois GAGAL: ${pelanggaran.split('\n')[0]}`);
  } else {
    ok('§4.4 sync invois berjaya tanpa unique_violation (23505)');
  }

  const bilSelepas = (await q(`SELECT count(*)::int AS n FROM public.invoices`))[0].n;
  eq(bilSelepas, bilSebelum, '§4.4 bilangan baris invoices (satu baris dikemaskini, bukan baris kedua dicipta)');

  const inv2 = (await q(`SELECT * FROM public.invoices WHERE quotation_no='${QT.quotationNo}'`))[0];
  if (inv2) {
    eq(inv2.invoice_no, INV.invoiceNo, '§4.4 invoice_no diisi pada baris quotation sedia ada');
    eq(inv2.quotation_no, QT.quotationNo, '§4.4 quotation_no dikekalkan');
    eq(inv2.client_name, INV.client, '§4.4 client_name dikemaskini');
    eq(inv2.account_manager, INV.accountManager, '§4.4 account_manager dikemaskini');
    eq(Number(inv2.sst), INV.sst, '§4.4 sst dikemaskini');
    console.log('  → Kitaran Quotation → Invoice dikemaskini pada SATU baris ✅');
  } else {
    bad('§4.4 baris dengan quotation_no tidak dijumpai selepas sync invois');
  }

  // -------------------------------------------------------------------
  console.log('\n=== 6. §4.1: amaun CUKAI tidak pernah jadi amaun rekod ===');
  // -------------------------------------------------------------------
  // Simulasi baris staging LAMA (parser versi terawal) yang menyimpan SST
  // sebagai amount. RPC mesti tetap mengutamakan final_price/total_incl_sst.
  await db.exec(`
    INSERT INTO public.import_batches (id, source_file, file_name, status)
    VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'lama.xlsx', 'lama.xlsx', 'staged');
    INSERT INTO public.import_staging (batch_id, source_file, source_sheet, source_row,
      entity_kind, programme_title, client_name, reference_no, amount, is_valid,
      suggested_action, final_price, sst_amount)
    VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'lama.xlsx', 'S1', 2, 'quotation',
      'Program Lama', 'SYARIKAT LAMA', 'QT-LAMA-001', ${QT.sst}, true,
      'sync_confirmed', ${QT.finalPrice}, ${QT.sst});
  `);
  const st3 = await q(`SELECT id FROM public.import_staging WHERE reference_no='QT-LAMA-001'`);
  const rowLama = {
    entity_kind: 'quotation', action: 'sync_confirmed',
    programme_title: 'Program Lama', client_name: 'SYARIKAT LAMA',
    reference_no: 'QT-LAMA-001', amount: QT.sst, final_price: QT.finalPrice,
    sst_amount: QT.sst, staging_id: st3[0].id,
  };
  await q(`SELECT public.sync_import_transaction('cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,
    '${JSON.stringify([rowLama]).replace(/'/g, "''")}'::jsonb) AS r`);
  const inv3 = (await q(`SELECT * FROM public.invoices WHERE quotation_no='QT-LAMA-001'`))[0];
  eq(Number(inv3.total_value), QT.finalPrice, 'jaring keselamatan DB: final_price menang atas amount (=SST)');
  if (Number(inv3.total_value) === QT.sst) bad('REGRESI: nilai SST masih menjadi amaun rekod');
  eq(Number(inv3.sst), QT.sst, 'sst kekal disimpan berasingan');
} catch (e) {
  bad(`RALAT tidak dijangka: ${e.message.split('\n').slice(0, 3).join(' | ')}`);
  console.log(e.stack?.split('\n').slice(0, 6).join('\n'));
} finally {
  await db.close();
}

console.log(`\n${fail === 0 ? '🎉' : '💥'} fix-field-mapping: lulus ${pass}, gagal ${fail}`);
process.exit(fail === 0 ? 0 : 1);
