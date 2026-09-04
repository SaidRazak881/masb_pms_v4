/**
 * test-tiada-cjk.mjs — Pengawal pencemaran aksara CJK dalam seluruh repo
 * ======================================================================
 *
 * MENGAPA UJIAN INI WUJUD
 * -----------------------
 * Arena (model bahasa) telah **tiga kali** tersilap menaip aksara Cina ke dalam
 * teks Malay semasa menulis kod dan dokumentasi:
 *
 *   1. `\u6070\u597d` (maksud: 'kebetulan') dalam komen `lib/actions/account-manager-actions.ts`
 *   2. `\u51fa\u73b0` (maksud: 'muncul') dalam DP-20.5 `docs/PANEL-PAKAR-TPMS.md`
 *   3. `\u6574\u4e2a` (maksud: 'seluruh') dalam pengajaran #69 `docs/PANEL-PAKAR-TPMS.md`
 *
 * Ketiganya ditangkap oleh pengimbas ad-hoc **selepas** ditulis, dan ketiganya
 * tidak akan kelihatan kepada pengguna sehingga mereka membaca dokumen itu —
 * atau sehingga dokumen itu dihantar kepada ChatGPT sebagai konteks, di mana
 * teks bercampur bahasa boleh mengelirukan pembantu AI itu.
 *
 * Maka pengimbas itu dijadikan **ujian tetap dalam suite**, bukan langkah
 * manual yang bergantung pada Arena teringat untuk melakukannya.
 *
 * SKOP: semua fail teks yang dijejak git (`.ts`, `.tsx`, `.mjs`, `.js`, `.sql`,
 * `.md`, `.json`, `.css`). Fail binari dan `node_modules` dikecualikan kerana
 * hanya fail yang dijejak git yang dibaca.
 *
 * JULAT AKSARA yang diperiksa:
 *   \u3040-\u30ff  Hiragana + Katakana (Jepun)
 *   \u3400-\u4dbf  CJK Unified Ideographs Extension A
 *   \u4e00-\u9fff  CJK Unified Ideographs (Cina)
 *   \uac00-\ud7af  Hangul (Korea)
 *   \uf900-\ufaff  CJK Compatibility Ideographs
 *
 * Nota: emoji (✅ 🔴 🟠 ⏳ ⛔) dan tanda teknikal (→ · §) **bukan** CJK dan
 * sengaja tidak dilaporkan — ia digunakan secara meluas dan konsisten dalam
 * dokumentasi projek ini.
 *
 * Jalankan: node scripts/test-tiada-cjk.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const CJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff]/;
const SAMBUNGAN_DIIZINKAN = /\.(ts|tsx|mjs|js|sql|md|json|css)$/;

// Hanya fail yang DIJEJAK git: ini mengecualikan node_modules, .next, dan
// sebarang fail sementara tanpa perlu menyenaraikan pengecualian secara manual.
// --cached: fail yang sudah dijejak. --others --exclude-standard: fail baharu
// yang BELUM di-git-add tetapi tidak diabaikan - supaya fail yang baru ditulis
// tidak lolos daripada pengimbas hanya kerana ia belum masuk indeks.
const fail = execFileSync('git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n')
  .map((f) => f.trim())
  .filter((f) => f && SAMBUNGAN_DIIZINKAN.test(f));

let pass = 0;
let fail_ = 0;
const hits = [];

for (const f of fail) {
  if (!fs.existsSync(f)) continue; // fail dipadam dalam indeks tetapi belum di-commit
  let teks;
  try {
    teks = fs.readFileSync(f, 'utf8');
  } catch {
    continue; // binari
  }
  const baris = teks.split('\n');
  for (let i = 0; i < baris.length; i++) {
    const aksara = baris[i].match(new RegExp(CJK.source, 'g'));
    if (aksara) {
      hits.push({ fail: f, baris: i + 1, aksara: aksara.join(''), teks: baris[i].trim().slice(0, 80) });
    }
  }
}

console.log(`\nMengimbas ${fail.length} fail teks yang dijejak git untuk aksara CJK…\n`);

if (hits.length === 0) {
  pass++;
  console.log(`  ✅ Tiada pencemaran CJK dalam ${fail.length} fail.`);
} else {
  for (const h of hits) {
    fail_++;
    console.log(`  ❌ ${h.fail}:${h.baris} — "${h.aksara}"`);
    console.log(`       ${h.teks}`);
  }
}

// Pengawal kendiri: ujian ini sendiri mesti bebas CJK dalam KODnya. Rentetan
// ungkapan nalar mengandungi kod escape (\u4e00), bukan aksara sebenar, jadi ia
// tidak sepatutnya mencetuskan pengimbas — jika ia mencetuskan, pengimbas itu
// telah ditulis dengan salah.
const sendiri = fs.readFileSync('scripts/test-tiada-cjk.mjs', 'utf8');
const sendiriHit = sendiri.split('\n').filter((l) => CJK.test(l));
if (sendiriHit.length === 0) {
  pass++;
  console.log('  ✅ Pengawal kendiri: fail ujian ini sendiri bebas aksara CJK literal.');
} else {
  fail_++;
  console.log(`  ❌ Pengawal kendiri gagal: ${sendiriHit.length} baris dalam ujian ini mengandungi CJK literal.`);
}

console.log(`\n${'='.repeat(62)}`);
console.log(`KEPUTUSAN: ${pass} lulus, ${fail_} gagal`);
console.log(`${'='.repeat(62)}\n`);
process.exit(fail_ === 0 ? 0 : 1);
