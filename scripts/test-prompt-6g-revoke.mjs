// =============================================================================
// Ujian: pernyataan REVOKE dalam docs/PROMPT-6G-UPDATED-AT-AND-REVOKE.md §3
// =============================================================================
// Mengesahkan bahawa REVOKE yang Arena luluskan:
//   1. sah secara sintaks
//   2. menghasilkan HANYA SELECT untuk authenticated + anon (kriteria H3)
//   3. TIDAK menyentuh SELECT (keputusan sedar - lihat PROMPT-6G §3)
//   4. TIDAK menyentuh jadual rasmi lain
//   5. boleh dipulihkan (GRANT semula menghasilkan keadaan asal)
//
// Ini mengikut peraturan pengajaran Fasa 6 #4: setiap dakwaan tentang tingkah
// laku PostgreSQL yang ditulis ke dalam prompt mesti diuji dahulu.
// =============================================================================
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';

const DOC = 'docs/PROMPT-6G-UPDATED-AT-AND-REVOKE.md';
let lulus = 0, gagal = 0;
const ok = (m) => { lulus++; console.log(`  ✅ ${m}`); };
const bad = (m) => { gagal++; console.log(`  ❌ ${m}`); };

console.log('--- 1. Ekstrak pernyataan REVOKE daripada PROMPT-6G ---');
const doc = fs.readFileSync(DOC, 'utf8');
const revokes = [...doc.matchAll(/^(REVOKE [\s\S]*?;)$/gm)].map((m) => m[1]);
if (revokes.length !== 3) bad(`jangkaan 3 pernyataan REVOKE, dapat ${revokes.length}`);
else ok('3 pernyataan REVOKE ditemui (satu per jadual warisan)');

const WARISAN = ['profiles', 'programme_participants', 'user_roles'];
for (const t of WARISAN) {
  if (!revokes.some((r) => r.includes(`public.${t}`))) bad(`tiada REVOKE untuk ${t}`);
}
if (WARISAN.every((t) => revokes.some((r) => r.includes(`public.${t}`)))) ok('ketiga-tiga jadual warisan dilindungi');

// SELECT mesti TIDAK disenaraikan dalam REVOKE
for (const r of revokes) {
  const privs = r.split('\n')[0];
  if (/\bSELECT\b/.test(privs)) bad(`REVOKE mengandungi SELECT — sepatutnya dikekalkan: ${privs}`);
}
if (revokes.every((r) => !/\bSELECT\b/.test(r.split('\n')[0]))) ok('tiada REVOKE menyentuh SELECT (keputusan sedar §3)');

console.log('\n--- 2. Bina keadaan live (privilej PENUH seperti X4) ---');
const db = await PGlite.create();
await db.exec(`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  END $$;
  CREATE TYPE public.app_role AS ENUM ('admin','staff','viewer');
  CREATE TABLE public.profiles (id uuid, full_name text);
  CREATE TABLE public.programme_participants (id uuid);
  CREATE TABLE public.user_roles (user_id uuid, role public.app_role);
  -- Jadual rasmi yang MESTI tidak terjejas
  CREATE TABLE public.programmes (id uuid, title text);
  CREATE TABLE public.user_profiles (user_id uuid, role public.app_role);
`);
// X4 melaporkan: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
await db.exec(`GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.profiles, public.programme_participants, public.user_roles TO authenticated, anon;`);
await db.exec(`GRANT SELECT, INSERT, UPDATE, DELETE ON public.programmes, public.user_profiles TO authenticated;`);

const q = `SELECT grantee, table_name,
       string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privs
  FROM information_schema.table_privileges
 WHERE table_schema='public'
   AND table_name IN ('profiles','programme_participants','user_roles','programmes','user_profiles')
   AND grantee IN ('authenticated','anon')
 GROUP BY grantee, table_name ORDER BY table_name, grantee`;
const sebelum = await db.query(q);
const warisanSebelum = sebelum.rows.filter((r) => WARISAN.includes(r.table_name));
const penuh = warisanSebelum.every((r) =>
  ['DELETE','INSERT','REFERENCES','SELECT','TRIGGER','TRUNCATE','UPDATE'].every((p) => r.privs.includes(p)));
if (penuh && warisanSebelum.length === 6) ok(`H1 ditiru: ${warisanSebelum.length} baris, semua ada 7 privilej (sepadan X4 live)`);
else bad(`keadaan awal tidak sepadan X4: ${warisanSebelum.length} baris, penuh=${penuh}`);

console.log('\n--- 3. Jalankan REVOKE ---');
try {
  for (const r of revokes) await db.exec(r);
  ok('ketiga-tiga REVOKE berjaya (sintaks sah)');
} catch (e) { bad(`REVOKE GAGAL: ${e.message.split('\n')[0]}`); }

console.log('\n--- 4. Sahkan kriteria H3 ---');
const selepas = await db.query(q);
const warisanSelepas = selepas.rows.filter((r) => WARISAN.includes(r.table_name));
if (warisanSelepas.length !== 6) bad(`jangkaan 6 baris, dapat ${warisanSelepas.length}`);
else {
  const bukanSelect = warisanSelepas.filter((r) => r.privs !== 'SELECT');
  if (bukanSelect.length) bad(`bukan SELECT sahaja: ${bukanSelect.map((r) => `${r.table_name}/${r.grantee}=${r.privs}`).join('; ')}`);
  else ok('H3 TEPAT: semua 6 baris = hanya SELECT (authenticated + anon × 3 jadual)');
}

console.log('\n--- 5. Sahkan jadual RASMI tidak terjejas ---');
const rasmiSelepas = selepas.rows.filter((r) => !WARISAN.includes(r.table_name));
const rasmiSebelum = sebelum.rows.filter((r) => !WARISAN.includes(r.table_name));
if (JSON.stringify(rasmiSelepas) === JSON.stringify(rasmiSebelum)) {
  ok(`jadual rasmi tidak berubah (${rasmiSelepas.length} baris: ${[...new Set(rasmiSelepas.map((r) => r.table_name))].join(', ')})`);
} else bad('REVOKE telah menjejaskan jadual rasmi!');

console.log('\n--- 6. Sahkan boleh DIPULIHKAN (reversibel) ---');
await db.exec(`GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.profiles, public.programme_participants, public.user_roles TO authenticated, anon;`);
const pulih = await db.query(q);
const pulihWarisan = pulih.rows.filter((r) => WARISAN.includes(r.table_name));
if (JSON.stringify(pulihWarisan) === JSON.stringify(warisanSebelum)) ok('GRANT semula memulihkan keadaan asal sepenuhnya — REVOKE ini reversibel');
else bad('pemulihan tidak menghasilkan keadaan asal');

await db.close();
console.log(`\n${gagal === 0 ? '🎉 REVOKE PROMPT-6G DISAHKAN: tepat, terskop, reversibel' : `🔴 ${gagal} GAGAL`}  (lulus ${lulus}, gagal ${gagal})`);
process.exit(gagal === 0 ? 0 : 1);
