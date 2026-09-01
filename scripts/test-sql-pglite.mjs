/**
 * test-sql-pglite.mjs — Ujian pemasangan SQL TPMS dengan PostgreSQL sebenar
 * (PGlite WASM). Meniru persekitaran Supabase: schema auth + role
 * authenticated/anon, kemudian jalankan kelima-lima fail SQL mengikut
 * urutan rasmi dan lapor sebarang ralat.
 *
 * Guna: node scripts/test-sql-pglite.mjs
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

// Persekitaran asas ala-Supabase
const BOOTSTRAP = `
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE
);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
END $$;
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
GRANT USAGE ON SCHEMA public TO authenticated, anon;
`;

const db = new PGlite();
try {
  await db.exec(BOOTSTRAP);
  console.log('✅ Bootstrap (auth schema + roles)');
} catch (e) {
  console.log('❌ Bootstrap gagal:', e.message);
  process.exit(1);
}

let failed = 0;
for (const f of FILES) {
  const sql = fs.readFileSync(f, 'utf8');
  try {
    await db.exec('BEGIN');
    await db.exec(sql);
    await db.exec('COMMIT');
    console.log(`✅ ${f}`);
  } catch (e) {
    try { await db.exec('ROLLBACK'); } catch (_) {}
    failed++;
    console.log(`❌ ${f}: ${String(e.message).split('\n').slice(0, 4).join(' | ')}`);
  }
}

// Pengesahan akhir
try {
  const tables = await db.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name`);
  const names = tables.rows.map((r) => r.table_name);
  console.log('\nJadual public:', names.join(', '));
  const missing = ['programmes','invoices','import_batches','import_staging',
    'programme_unlock_requests','change_requests','audit_logs','user_profiles']
    .filter((t) => !names.includes(t));
  if (missing.length) { console.log('❌ Jadual hilang:', missing.join(', ')); failed++; }
  else console.log('✅ Semua jadual penting wujud');

  const fns = await db.query(`
    SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN
      ('sync_import_transaction','submit_change_request','review_change_request',
       'lock_programme','request_programme_unlock','review_programme_unlock',
       'log_audit','has_role')`);
  console.log('Fungsi public:', fns.rows.map((r) => r.proname).join(', '));
  if (fns.rows.length < 8) { console.log('❌ Fungsi tidak lengkap'); failed++; }

  const enums = await db.query(`
    SELECT t.typname, count(e.enumlabel) AS n
    FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' GROUP BY t.typname ORDER BY t.typname`);
  console.log('Enum:', enums.rows.map((r) => `${r.typname}(${r.n})`).join(', '));

  // Ujian rerun: jalankan semula semua fail (mesti berjaya — idempotent)
  console.log('\n--- UJIAN RERUN (idempotensi) ---');
  for (const f of FILES) {
    const sql = fs.readFileSync(f, 'utf8');
    try {
      await db.exec('BEGIN');
      await db.exec(sql);
      await db.exec('COMMIT');
      console.log(`✅ rerun ${f}`);
    } catch (e) {
      try { await db.exec('ROLLBACK'); } catch (_) {}
      failed++;
      console.log(`❌ rerun ${f}: ${String(e.message).split('\n').slice(0, 3).join(' | ')}`);
    }
  }
} catch (e) {
  console.log('❌ Pengesahan akhir gagal:', e.message);
  failed++;
}

console.log(failed === 0 ? '\n🎉 SEMUA UJIAN LULUS' : `\n${failed} kegagalan`);
process.exit(failed === 0 ? 0 : 1);
