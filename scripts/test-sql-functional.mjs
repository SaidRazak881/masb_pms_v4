/**
 * Ujian berfungsi RPC TPMS (PGlite): sync_import_transaction,
 * submit_change_request, review_change_request, lock_programme.
 */
import fs from 'fs';
import { PGlite } from '@electric-sql/pglite';

const FILES = [
  'lib/supabase/schema-master.sql',
  'lib/supabase/schema-import-staging.sql',
  'lib/supabase/sync-import-transaction.sql',
  'lib/supabase/governance-lock.sql',
  'lib/supabase/change-requests.sql',
];

const db = new PGlite();
const UID = '11111111-1111-4111-8111-111111111111';
const HG  = '22222222-2222-4222-8222-222222222222';

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
INSERT INTO auth.users (id, email) VALUES ('${UID}'::uuid, 'staff@mimos.my'), ('${HG}'::uuid, 'nizar@mimos.my')
ON CONFLICT DO NOTHING;
`;
// (user_profiles diisi selepas skema dipasang)

let failed = 0;
try {
  await db.exec(BOOTSTRAP);
  for (const f of FILES) {
    await db.exec('BEGIN'); await db.exec(fs.readFileSync(f, 'utf8')); await db.exec('COMMIT');
  }
  await db.exec(`INSERT INTO public.user_profiles (id, full_name, email, role) VALUES
    ('${UID}'::uuid, 'Staff Test', 'staff@mimos.my', 'staff'),
    ('${HG}'::uuid, 'Head Gov', 'nizar@mimos.my', 'head_governance');`);
  console.log('✅ Skema dipasang + profil pengguna');

  // 1. Sync import (staff): buat batch + staging, panggil sync
  await db.exec(`
    INSERT INTO public.import_batches (id, source_file, file_name, status)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'test.xlsx', 'test.xlsx', 'staged');
    INSERT INTO public.import_staging (batch_id, source_file, source_sheet, source_row, entity_kind,
      programme_title, client_name, reference_no, amount, is_valid, suggested_action)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'test.xlsx', 'Sheet1', 2, 'invoice',
      'AI Prompt Skills', 'MIMOS Berhad', 'INV-001', 8500, true, 'pending');
  `);
  const staging = await db.query(`SELECT id FROM public.import_staging LIMIT 1`);
  const stagingId = staging.rows[0].id;
  const sync = await db.query(
    `SELECT public.sync_import_transaction(
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
       '[{"entity_kind":"invoice","action":"sync_confirmed","programme_title":"AI Prompt Skills","client_name":"MIMOS Berhad","reference_no":"INV-001","amount":8500,"staging_id":"${stagingId}"}]'::jsonb) AS r`);
  console.log('✅ sync_import_transaction →', JSON.stringify(sync.rows[0].r));
  const prog = await db.query(`SELECT id, programme_code, title, category, governance_lock_status FROM public.programmes`);
  console.log('   Program dicipta:', JSON.stringify(prog.rows));
  const inv = await db.query(`SELECT invoice_no, invoice_value_excl_tax, payment_status FROM public.invoices`);
  console.log('   Invois:', JSON.stringify(inv.rows));

  // 2. Lock program oleh head_governance
  // Tukar identiti pengguna kepada Head Governance (stub auth.uid)
  await db.exec(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT '${HG}'::uuid $$;`);
  await db.exec(`DO $$ BEGIN PERFORM public.lock_programme('${prog.rows[0].id}'::uuid, 'manual'); END $$;`);
  console.log('✅ lock_programme (head_governance)');

  // 3. Staff cuba update terus — trigger mesti BLOCK
  await db.exec(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT '${UID}'::uuid $$;`);
  let blocked = false;
  try {
    await db.exec(`UPDATE public.programmes SET title = 'HACK' WHERE id = '${prog.rows[0].id}'::uuid`);
  } catch (e) {
    blocked = /PROGRAMME_LOCKED/.test(String(e.message));
  }
  console.log(blocked ? '✅ UPDATE terus oleh staff DISEKAT (trigger lock)' : '❌ UPDATE terus tidak disekat!');
  if (!blocked) failed++;

  // 4. Change request oleh staff
  const cr = await db.query(
    `SELECT public.submit_change_request('${prog.rows[0].id}'::uuid, 'title', 'AI Prompt Skills', 'AI Prompt Skills v2',
       'Sebab perubahan lengkap untuk ujian sistem', NULL) AS id`);
  console.log('✅ submit_change_request →', cr.rows[0].id);

  // 5. Kelulusan oleh head_governance
  await db.exec(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT '${HG}'::uuid $$;`);
  const rev = await db.query(`SELECT public.review_change_request('${cr.rows[0].id}'::uuid, true, 'Diluluskan') AS id`);
  console.log('✅ review_change_request →', rev.rows[0].id);
  const crStatus = await db.query(`SELECT status FROM public.change_requests WHERE id = '${cr.rows[0].id}'::uuid`);
  console.log('   Status change request:', crStatus.rows[0].status);

  // 6. Audit trail
  const audit = await db.query(`SELECT action, table_name, count(*) FROM public.audit_logs GROUP BY action, table_name ORDER BY action`);
  console.log('✅ Audit log:', JSON.stringify(audit.rows));

} catch (e) {
  failed++;
  console.log('❌', String(e.message).split('\n').slice(0, 5).join(' | '));
}

console.log(failed === 0 ? '\n🎉 UJIAN FUNGSI LULUS' : `\n${failed} kegagalan`);
process.exit(failed === 0 ? 0 : 1);
