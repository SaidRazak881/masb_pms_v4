// =============================================================================
// Ujian: kriteria E1–E9 dalam docs/PROMPT-6H-E1-E9-PRECISE-CRITERIA.md
// =============================================================================
// Mengikut peraturan pengajaran Fasa 6: kriteria mesti DITERBITKAN daripada
// kod/ujian automatik, bukan dinyatakan secara manual.
//
// Ujian ini membaca PROTECTED_PREFIXES yang SEBENAR dari
// lib/supabase/middleware.ts, kemudian menyemak bahawa kriteria E dalam
// PROMPT-6H konsisten dengannya:
//   - laluan yang dijangka redirect ke /login (E1, E2, E8) MESTI dilindungi
//   - laluan yang dijangka 200 (E3–E7) MESTI TIDAK dilindungi
//   - parameter `redirect` mesti ditetapkan oleh middleware (bukti url_akhir)
//
// Ini juga menyemak kesilapan kriteria Arena #7: E1-E9 tidak menyatakan sama
// ada redirect diikuti. Ujian ini mengesahkan bahawa middleware benar-benar
// melakukan NextResponse.redirect (3xx), jadi "200 + kandungan /login" ialah
// keputusan yang DIJANGKA apabila klien mengikuti redirect.
// =============================================================================
import fs from 'node:fs';

let lulus = 0, gagal = 0;
const ok = (m) => { lulus++; console.log(`  ✅ ${m}`); };
const bad = (m) => { gagal++; console.log(`  ❌ ${m}`); };

const MW = 'lib/supabase/middleware.ts';
const DOC = 'docs/PROMPT-6H-E1-E9-PRECISE-CRITERIA.md';
for (const f of [MW, DOC]) {
  if (!fs.existsSync(f)) { console.log(`  ❌ fail tidak dijumpai: ${f}`); process.exit(1); }
}
const mw = fs.readFileSync(MW, 'utf8');
const doc = fs.readFileSync(DOC, 'utf8');

console.log('--- 1. Terbitkan PROTECTED_PREFIXES daripada middleware sebenar ---');
const mArr = mw.match(/PROTECTED_PREFIXES\s*=\s*\[([\s\S]*?)\]/);
if (!mArr) { bad('PROTECTED_PREFIXES tidak dijumpai dalam middleware.ts'); process.exit(1); }
const prefixes = [...mArr[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
console.log(`  ${prefixes.length} prefix: ${prefixes.join(', ')}`);
if (prefixes.length >= 7) ok(`PROTECTED_PREFIXES dibaca (${prefixes.length} prefix)`);
else bad(`PROTECTED_PREFIXES hanya ${prefixes.length} — jangkaan >= 7`);

const dilindungi = (p) => prefixes.some((x) => p === x || p.startsWith(`${x}/`));

console.log('\n--- 2. Sahkan middleware benar-benar melakukan redirect (3xx) ---');
if (/NextResponse\.redirect\(/.test(mw)) ok('middleware memanggil NextResponse.redirect → 3xx mentah');
else bad('middleware TIDAK memanggil NextResponse.redirect — kriteria E1/E2/E8 salah');
if (/searchParams\.set\(\s*"redirect"/.test(mw)) ok('middleware menetapkan ?redirect=<path> → url_akhir boleh diramal');
else bad('middleware tidak menetapkan parameter redirect — url_akhir tidak akan ada ?redirect=');
if (/if\s*\(\s*!user\s*&&\s*isProtected\s*\)/.test(mw)) ok('redirect hanya apabila !user && isProtected → tanpa sesi, laluan dilindungi MESTI redirect');
else bad('logik perlindungan tidak sepadan jangkaan');

console.log('\n--- 3. Sahkan kriteria E dalam PROMPT-6H konsisten dengan kod ---');
// Laluan yang PROMPT-6H jangka REDIRECT ke /login
const jangkaRedirect = ['/programmes', '/admin/users', '/security'];
for (const p of jangkaRedirect) {
  if (dilindungi(p)) ok(`${p} dilindungi → kriteria "redirect ke /login?redirect=" BETUL`);
  else bad(`${p} TIDAK dilindungi, tetapi PROMPT-6H menjangkakan redirect — kriteria salah`);
}
// Laluan yang PROMPT-6H jangka 200
const jangka200 = ['/login', '/register', '/forgot-password', '/pending-approval', '/account-blocked'];
for (const p of jangka200) {
  if (!dilindungi(p)) ok(`${p} TIDAK dilindungi → kriteria "200" BETUL`);
  else bad(`${p} dilindungi, tetapi PROMPT-6H menjangkakan 200 — kriteria salah`);
}

console.log('\n--- 4. Sahkan ramalan url_akhir (encode path) tepat ---');
for (const p of jangkaRedirect) {
  const encoded = encodeURIComponent(p);
  if (doc.includes(encoded) || doc.includes(p)) ok(`${p} → ${encoded} dirujuk dalam PROMPT-6H`);
  else bad(`${p}: PROMPT-6H tidak menyebut ${encoded} atau ${p}`);
}

console.log('\n--- 5. Sahkan PROMPT-6H menyatakan sifat "tanpa log masuk" ---');
if (/tanpa log masuk/i.test(doc)) ok('PROMPT-6H menyatakan E1–E9 ialah semakan tanpa log masuk');
else bad('PROMPT-6H tidak menyatakan E1–E9 tanpa log masuk — punca kesilapan #7');
if (/BUKAN.*kriteria|Yang \*\*BUKAN\*\* kriteria/i.test(doc)) ok('PROMPT-6H menyenaraikan apa yang BUKAN kriteria (menghalang PASS ditahan)');
else bad('PROMPT-6H tiada senarai "yang bukan kriteria"');
if (/redirect diikuti|status_mentah|url_akhir/i.test(doc)) ok('PROMPT-6H membezakan status mentah vs url_akhir (pembetulan kesilapan #7)');
else bad('PROMPT-6H tidak membezakan status mentah vs url_akhir');

console.log('\n--- 6. Sahkan E9 merujuk rentetan MFA yang tepat ---');
const mfaStrings = ['authenticator', 'Pengesahan 2-Langkah', 'kod 6 digit', 'TOTP', 'MFA', 'MfaGuard'];
for (const s of mfaStrings) {
  if (doc.includes(s)) ok(`E9 menyemak "${s}"`);
  else bad(`E9 tidak menyemak "${s}"`);
}
// Dan sahkan kod Fasa 6 benar-benar bebas MFA
const adaMfa = [];
for (const dir of ['app', 'components', 'lib']) {
  for (const f of fs.readdirSync(dir, { recursive: true })) {
    const p = `${dir}/${f}`;
    if (!/\.(ts|tsx)$/.test(p) || !fs.statSync(p).isFile()) continue;
    const c = fs.readFileSync(p, 'utf8');
    if (/MfaGuard|from ["'].*\/mfa["']/.test(c)) adaMfa.push(p);
  }
}
if (adaMfa.length === 0) ok('kod app/components/lib bebas MfaGuard dan import lib/mfa — E9 patut lulus');
else bad(`MASIH ada rujukan MFA: ${adaMfa.join(', ')}`);

console.log(`\n${gagal === 0 ? '🎉 KRITERIA E1–E9 DISAHKAN: diterbitkan daripada middleware sebenar' : `🔴 ${gagal} GAGAL`}  (lulus ${lulus}, gagal ${gagal})`);
process.exit(gagal === 0 ? 0 : 1);
