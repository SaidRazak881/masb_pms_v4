/** Ujian seed-v4-raw.sql DIPASANG SELEPAS schema-master (urutan rasmi). */
import fs from 'fs';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
const UID = '11111111-1111-4111-8111-111111111111';
await db.exec(`CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY, email text UNIQUE);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT '${UID}'::uuid $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
END $$;
INSERT INTO auth.users (id, email) VALUES ('${UID}'::uuid, 'seed@mimos.my');`);
// master dulu
for (const f of ['lib/supabase/schema-master.sql']) {
  await db.exec('BEGIN'); await db.exec(fs.readFileSync(f, 'utf8')); await db.exec('COMMIT');
}
// user_profiles diisi SELEPAS master (master cipta jadual)
await db.exec(`INSERT INTO public.user_profiles (id, full_name, email, role) VALUES ('${UID}'::uuid, 'Seed', 'seed@mimos.my', 'staff');`);
// seed kedua
try {
  await db.exec('BEGIN'); await db.exec(fs.readFileSync('lib/supabase/seed-v4-raw.sql', 'utf8')); await db.exec('COMMIT');
  const counts = await db.query(`SELECT (SELECT count(*) FROM public.organizers) org,
    (SELECT count(*) FROM public.programmes) prog,
    (SELECT count(*) FROM public.financial_docs) fin,
    (SELECT count(*) FROM public.programme_costs) cost,
    (SELECT count(*) FROM public.audit_logs) audit`);
  console.log('✅ seed selepas master →', JSON.stringify(counts.rows[0]));
  // semak log_audit yang mana menang (master vs seed) — seed menimpa! semak definisi
  const la = await db.query(`SELECT prosrc FROM pg_proc WHERE proname='log_audit' AND pronamespace='public'::regnamespace`);
  const src = la.rows[0].prosrc;
  console.log(src.includes('changed_fields') ? '   log_audit: versi MASTER (ada changed_fields)' : '   log_audit: versi SEED LAMA (tiada changed_fields) ⚠️');
} catch (e) {
  console.log('❌ seed selepas master:', String(e.message).split('\n').slice(0,4).join(' | '));
  process.exit(1);
}
