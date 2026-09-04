// =============================================================================
// scripts/test-doc-references.mjs
//
// PENGESAHAN RUJUKAN SILANG DALAM DOKUMEN — penjaga terhadap kelas ralat yang
// telah DUA kali menyebabkan kerja live tersekat.
//
// Sejarah (direkodkan dalam docs/PANEL-PAKAR-TPMS.md):
//
//   DP-10.1  Arena menulis ref projek Supabase 21 aksara
//            (`lmenmfsbjgxcfhnykkgow`) dalam 2 fail prompt. ChatGPT mendapat
//            `ZodError: ref must be exactly 20 characters long` dan terpaksa
//            mencari ref sebenar sendiri.
//
//   DP-10.11 Arena menulis nama repo GitHub dengan HYPHEN
//            (`SaidRazak881/masb-pms-v4`) sedangkan remote sebenar ialah
//            `SaidRazak881/masb_pms_v4` (UNDERSCORE). ChatGPT mendapat
//            `404 Not Found` pada SETIAP fail — persona, panel, dan keempat-empat
//            fail SQL — lalu BERHENTI sebelum Langkah 1 kerana tidak dapat
//            mengesahkan SHA-256. Pemasangan yang sudah diluluskan pengguna
//            tersekat sepenuhnya.
//
// PUNCA AKAR KEDUA-DUANYA SAMA: pengecam infrastruktur disalin daripada
// INGATAN/ konteks sesi, bukan daripada repo. Ujian ini menghilangkan punca itu
// dengan membaca setiap pengecam daripada SUMBER AUTORITATIF:
//
//   nama repo    <- `git remote get-url origin`
//   branch       <- `git ls-remote origin` (branch yang benar-benar wujud)
//   laluan fail  <- `fs.existsSync` (fail yang benar-benar wujud)
//   ref projek   <- panjang 20 aksara (dibuktikan oleh ZodError di atas)
//
// Jalankan: node scripts/test-doc-references.mjs
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

let lulus = 0;
let gagal = 0;
const failures = [];

const ok = (m) => { lulus++; console.log(`  ✅ ${m}`); };
const bad = (m) => { gagal++; failures.push(m); console.log(`  ❌ ${m}`); };
const eq = (dapat, jangka, label) => {
  if (dapat === jangka) ok(`${label}: ${JSON.stringify(dapat)}`);
  else bad(`${label}: dapat ${JSON.stringify(dapat)}, jangkaan ${JSON.stringify(jangka)}`);
};

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8' }).trim();

// -----------------------------------------------------------------------------
// SUMBER AUTORITATIF
// -----------------------------------------------------------------------------
const remoteUrl = git('remote', 'get-url', 'origin');
const mRemote = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
if (!mRemote) {
  console.log(`RALAT FATAL: tidak dapat menghurai remote origin: ${remoteUrl}`);
  process.exit(1);
}
const OWNER = mRemote[1];
const REPO = mRemote[2];
const REPO_PENUH = `${OWNER}/${REPO}`;

const BRANCH_SEMASA = git('rev-parse', '--abbrev-ref', 'HEAD');

// Branch yang BENAR-BENAR wujud di origin.
const remoteRefs = git('ls-remote', '--heads', 'origin')
  .split('\n')
  .map((l) => l.replace(/^.*refs\/heads\//, '').trim())
  .filter(Boolean);

// Ref projek Supabase yang SAH — 20 aksara.
// Bukti: laporan ChatGPT dari live (2026-09-04) — ref 21 aksara menghasilkan
// `ZodError: ref must be exactly 20 characters long`, dan ref ini berjaya
// menyambung ke projek live `lmenmfsbjgxfhnykkgow`.
const REF_SUPABASE = 'lmenmfsbjgxfhnykkgow';

console.log('=== SUMBER AUTORITATIF (daripada repo, bukan ingatan) ===');
console.log(`  remote origin   : ${remoteUrl}`);
console.log(`  nama repo       : ${REPO_PENUH}`);
console.log(`  branch semasa   : ${BRANCH_SEMASA}`);
console.log(`  branch di origin: ${remoteRefs.length}`);
console.log(`  ref Supabase    : ${REF_SUPABASE} (${REF_SUPABASE.length} aksara)`);
console.log('');

eq(REF_SUPABASE.length, 20, 'ref Supabase = 20 aksara (DP-10.1)');
eq(remoteRefs.includes(BRANCH_SEMASA), true,
   `branch semasa '${BRANCH_SEMASA}' wujud di origin`);

// -----------------------------------------------------------------------------
// KUMPUL FAIL DOKUMEN
// -----------------------------------------------------------------------------
const kumpulMd = (dir) => {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...kumpulMd(p));
    else if (e.name.toLowerCase().endsWith('.md')) out.push(p);
  }
  return out;
};
const DOKUMEN = [...kumpulMd('docs'), 'README.md'].filter((f) => fs.existsSync(f));
console.log(`\n=== MENGIMBAS ${DOKUMEN.length} FAIL MARKDOWN ===`);

// -----------------------------------------------------------------------------
// 1. URL GITHUB — nama repo mesti sepadan remote sebenar
// -----------------------------------------------------------------------------
console.log('\n[1] Nama repo dalam setiap URL GitHub');
const URL_GH = /https:\/\/github\.com\/([^/\s)]+)\/([^/\s)]+)(\/[^\s)]*)?/g;
// Kelas aksara di atas tidak mengecualikan backtick, jadi URL yang dibungkus
// dalam inline code ditangkap bersama penutupnya; `.git` juga bukan sebahagian
// daripada nama repo. Buang kedua-duanya sebelum membandingkan.
const bersihRepo = (x) => x.replace(/[`'",.;:>)\]]+$/, '').replace(/[.]git$/i, '');

// Baris yang MENANDAKAN sesuatu nilai sebagai salah dibenarkan mengandungi
// nilai salah itu — itulah cara rekod panel mendokumentasikan typo (DP-10.1,
// DP-10.11). Tanpa pengecualian ini, dokumentasi ralat akan dituduh sebagai
// ralat, dan penjaga ini tidak boleh dipakai pada dokumen yang merekodkannya.
// Peraturan ini sama dengan yang dipakai untuk ref Supabase di bahagian [4].
// '❌' dimasukkan kerana dokumen projek ini secara konsisten menandakan nilai
// yang salah dengan emoji itu (contoh: jadual perbandingan dalam DP-10.11 dan
// PROMPT-8A3-SAMBUNGAN §0).
const DITANDA_SALAH = /salah|typo|hyphen|HYPHEN|404|UNDERSCORE|❌/i;

let jumlahUrl = 0;
const repoSalah = new Map();

for (const f of DOKUMEN) {
  for (const baris of fs.readFileSync(f, 'utf8').split('\n')) {
    const ditandai = DITANDA_SALAH.test(baris);
    for (const m of baris.matchAll(URL_GH)) {
      jumlahUrl++;
      const penuh = `${bersihRepo(m[1])}/${bersihRepo(m[2])}`;
      if (penuh !== REPO_PENUH && !ditandai) {
        if (!repoSalah.has(penuh)) repoSalah.set(penuh, []);
        repoSalah.get(penuh).push(f);
      }
    }
  }
}

eq(jumlahUrl > 0, true, `URL GitHub ditemui dalam dokumen (${jumlahUrl})`);
if (repoSalah.size === 0) {
  ok(`semua ${jumlahUrl} URL GitHub guna nama repo betul '${REPO_PENUH}'`);
} else {
  for (const [salah, fail] of repoSalah) {
    bad(`nama repo SALAH '${salah}' (sepatutnya '${REPO_PENUH}') dalam: ` +
        [...new Set(fail)].join(', '));
  }
}

// Bentuk hyphen yang khusus — ia kelihatan sah tetapi memberi 404 (DP-10.11).
const BENTUK_HYPHEN = 'SaidRazak881/masb-pms-v4';
if (BENTUK_HYPHEN !== REPO_PENUH) {
  // Kegagalan HANYA jika ia muncul pada baris OPERASIONAL. Kemunculan dalam
  // rekod panel yang mendokumentasikan typo itu sendiri adalah dijangka.
  const adaHyphen = [];
  for (const f of DOKUMEN) {
    fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
      if (l.includes(BENTUK_HYPHEN) && !DITANDA_SALAH.test(l)) {
        adaHyphen.push(`${f}:${i + 1}`);
      }
    });
  }
  eq(adaHyphen.length, 0,
     `tiada baris OPERASIONAL guna bentuk hyphen '${BENTUK_HYPHEN}' (DP-10.11)` +
     (adaHyphen.length ? ` — ditemui di ${adaHyphen.join(', ')}` : ''));
}

// -----------------------------------------------------------------------------
// 2. URL blob/tree/raw — branch mesti wujud di origin, laluan mesti wujud
// -----------------------------------------------------------------------------
//
// URL GitHub kabur untuk branch yang mengandungi '/':
//   .../blob/arena/01a06274-masb-pms-v4/docs/PROMPT-8A3-INSTALL.md
// boleh diparse sebagai ref='arena' + laluan='01a06274-.../docs/...' ATAU
// ref='arena/01a06274-masb-pms-v4' + laluan='docs/...'.
// Penyelesaian: cuba SETIAP pemotongan dan terima yang pertama memberikan
// laluan yang benar-benar wujud — sekaligus mengesahkan fail itu ada.
console.log('\n[2] URL blob/tree/raw — branch wujud + laluan fail wujud');
const sesudah = (x) => (x.length > 90 ? x.slice(0, 90) + '…' : x);
const URL_BLOB = /https:\/\/github\.com\/[^/\s)]+\/[^/\s)]+\/(blob|tree|raw)\/([^\s)]+)/g;
let jumlahBlob = 0;
let laluanRosak = 0;
let dilangkauTemplat = 0;
const branchRujukan = new Set();

for (const f of DOKUMEN) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(URL_BLOB)) {
    jumlahBlob++;
    const jenis = m[1];
    // Buang query/fragment, kemudian buang tanda baca markdown yang mengekor.
    // URL dalam dokumen sering dibungkus dalam inline code, jadi pengeksrak
    // naif menangkap backtick penutup dan melaporkan laluan yang "tidak wujud"
    // padahal fail itu ada (contoh sebenar: fix-rls-recursion.sql`).
    let selepas = m[2].split('?')[0].split('#')[0];
    selepas = selepas.replace(/[`'\",.;:>\])]+$/, '');
    // Langkau placeholder templat seperti .../{PATH} — ia memang bukan fail.
    // Langkau placeholder templat: {PATH}, <laluan>, <path> — bukan fail sebenar.
    if (/[{}<>]/.test(selepas)) { dilangkauTemplat++; continue; }
    const bahagian = selepas.split('/');

    let ditemui = null;
    for (let i = 1; i < bahagian.length; i++) {
      const ref = bahagian.slice(0, i).join('/');
      const laluan = bahagian.slice(i).join('/');
      if (laluan && fs.existsSync(laluan)) { ditemui = { ref, laluan }; break; }
    }

    if (!ditemui) {
      laluanRosak++;
      bad(`${f}: URL ${jenis} merujuk laluan yang TIDAK WUJUD -> '${sesudah(selepas)}'`);
      continue;
    }
    branchRujukan.add(ditemui.ref);
  }
}

eq(jumlahBlob > 0, true, `URL blob/tree/raw ditemui (${jumlahBlob})`);
if (dilangkauTemplat > 0) ok(`${dilangkauTemplat} URL templat ({PATH}/<laluan>) dilangkau — bukan fail sebenar`);
eq(laluanRosak, 0, 'setiap laluan fail dalam URL GitHub wujud dalam repo');

const branchTidakWujud = [...branchRujukan].filter((b) => !remoteRefs.includes(b));
eq(branchTidakWujud.length, 0,
   'setiap branch yang dirujuk wujud di origin' +
   (branchTidakWujud.length ? ` — tidak wujud: ${branchTidakWujud.join(', ')}` : ''));

// -----------------------------------------------------------------------------
// 3. Prompt 8A-3 mesti merujuk branch SEMASA (bukan branch lapuk)
// -----------------------------------------------------------------------------
console.log('\n[3] PROMPT-8A3-INSTALL merujuk branch semasa');
const PROMPT_8A3 = 'docs/PROMPT-8A3-INSTALL.md';
// Kedua-dua prompt 8A-3 membawa SHA-256 yang ChatGPT mesti sahkan. SHA lapuk
// dalam mana-mana satu akan menghantarnya ke jalan buntu yang sama.
const PROMPT_8A3_SET = ['docs/PROMPT-8A3-INSTALL.md', 'docs/PROMPT-8A3-SAMBUNGAN.md'];
if (!fs.existsSync(PROMPT_8A3)) {
  bad(`${PROMPT_8A3} tiada`);
} else {
  const s = fs.readFileSync(PROMPT_8A3, 'utf8');
  eq(s.includes(`/${BRANCH_SEMASA}/`), true,
     `prompt merujuk branch semasa '${BRANCH_SEMASA}'`);

  // Keempat-empat fail pemasangan mesti dirujuk dengan laluan yang wujud.
  const FAIL_PASANG = [
    'lib/supabase/client-master.sql',
    'lib/supabase/external-account-managers.sql',
    'lib/supabase/account-manager-resolution.sql',
    'lib/supabase/seed-account-manager-aliases.sql',
  ];
  for (const fl of FAIL_PASANG) {
    eq(fs.existsSync(fl), true, `fail pemasangan wujud: ${fl}`);
    eq(s.includes(fl), true, `prompt merujuk ${path.basename(fl)}`);
  }
}

// -----------------------------------------------------------------------------
// 4. Ref projek Supabase — panjang 20, dan kemunculan 21 aksara MESTI ditandakan
// -----------------------------------------------------------------------------
console.log('\n[4] Ref projek Supabase dalam dokumen');
const REF_RE = /\b(lmenmfsbjg[a-z]+)\b/g;
let kiraBetul = 0;
const salahTidakDitanda = [];

for (const f of DOKUMEN) {
  const s = fs.readFileSync(f, 'utf8');
  const baris = s.split('\n');
  baris.forEach((l, i) => {
    for (const m of l.matchAll(REF_RE)) {
      const ref = m[1];
      if (ref === REF_SUPABASE) { kiraBetul++; continue; }
      // Ref bukan-kanonik hanya dibenarkan sebagai DOKUMENTASI typo, dan baris
      // itu mesti menandakannya secara eksplisit.
      if (!/salah|typo|21/i.test(l)) {
        salahTidakDitanda.push(`${f}:${i + 1} -> '${ref}' (${ref.length} aksara)`);
      }
    }
  });
}

eq(kiraBetul > 0, true,
   `ref kanonik '${REF_SUPABASE}' hadir ${kiraBetul} kali dalam dokumen`);
eq(salahTidakDitanda.length, 0,
   'tiada ref Supabase bukan-20-aksara yang tidak ditandakan sebagai typo' +
   (salahTidakDitanda.length ? `\n       ${salahTidakDitanda.join('\n       ')}` : ''));

// Prompt pemasangan mesti mengandungi ref kanonik — tanpanya ChatGPT tidak
// tahu projek mana yang hendak disambungkan.
if (fs.existsSync(PROMPT_8A3)) {
  const s = fs.readFileSync(PROMPT_8A3, 'utf8');
  eq(s.includes(REF_SUPABASE), true, 'PROMPT-8A3 mengandungi ref kanonik');
}

// -----------------------------------------------------------------------------
// 5. SHA-256 dalam prompt mesti sepadan fail sebenar
// -----------------------------------------------------------------------------
//
// ChatGPT diarahkan BERHENTI jika SHA tidak sepadan. Jika SHA dalam prompt
// lapuk (contohnya selepas fail SQL disunting), pemasangan yang sah akan
// tersekat — persis seperti yang berlaku dalam laporan J0.
console.log('\n[5] SHA-256 dalam prompt 8A-3 sepadan fail sebenar');
{
  const { createHash } = await import('node:crypto');
  const FAIL_PASANG = [
    'lib/supabase/client-master.sql',
    'lib/supabase/external-account-managers.sql',
    'lib/supabase/account-manager-resolution.sql',
    'lib/supabase/seed-account-manager-aliases.sql',
  ];
  const shaSemasa = new Map(FAIL_PASANG.map((fl) => [fl,
    fs.existsSync(fl)
      ? createHash('sha256').update(fs.readFileSync(fl)).digest('hex')
      : null]));

  for (const pf of PROMPT_8A3_SET) {
    if (!fs.existsSync(pf)) { bad(`${pf} tiada`); continue; }
    const teks = fs.readFileSync(pf, 'utf8');
    const shaDalamPrompt = new Set(
      [...teks.matchAll(/\b([a-f0-9]{64})\b/g)].map((m) => m[1]));
    const nama = path.basename(pf);
    for (const fl of FAIL_PASANG) {
      const sha = shaSemasa.get(fl);
      if (!sha) { bad(`${fl} tiada`); continue; }
      // Hanya tuntut SHA jika prompt itu memang menyebut fail tersebut.
      if (!teks.includes(path.basename(fl))) continue;
      eq(shaDalamPrompt.has(sha), true,
         `${nama}: SHA-256 ${path.basename(fl)} semasa (${sha.slice(0, 12)}…)`);
    }
    // Prompt sambungan mesti merujuk branch semasa juga.
    eq(teks.includes(BRANCH_SEMASA), true, `${nama}: merujuk branch semasa`);
  }
}

// -----------------------------------------------------------------------------
// 6. GATE INTEGRITI DP-11 — nilai yang DITERBITKAN mesti sepadan fail sebenar
// -----------------------------------------------------------------------------
//
// Prompt kini menerbitkan Git blob SHA (Lapis 1) dan cap jari struktur
// (Lapis 2) yang ChatGPT mesti bandingkan. Jika nilai ini lapuk, ChatGPT akan
// mendapat "tidak sepadan" pada fail yang SEBENARNYA betul dan berhenti —
// iaitu jalan buntu yang sama seperti DP-10.11, tetapi kali ini disebabkan
// oleh penjaga itu sendiri. Jadi nilai terbitan mesti disahkan di sini.
//
// Semantik yang MESTI ditiru tepat:
//   bait   = bilangan bait UTF-8              (sama seperti `wc -c`)
//   baris  = bilangan '\n'                    (sama seperti `wc -l`)
//   aksara = bilangan TITIK KOD Unicode, bukan unit UTF-16. Emoji seperti
//            U+1F7E2 ialah 2 unit UTF-16 tetapi 1 titik kod, jadi
//            `content.length` TIDAK boleh dipakai; guna `[...content].length`.
//   CREATE = bilangan BARIS yang sepadan       (sama seperti `grep -c`)
console.log('\n[6] Gate integriti DP-11 — blob SHA + cap jari struktur diterbitkan betul');
{
  const FAIL_GATE = [
    'lib/supabase/client-master.sql',
    'lib/supabase/external-account-managers.sql',
    'lib/supabase/account-manager-resolution.sql',
    'lib/supabase/seed-account-manager-aliases.sql',
  ];
  const kiraBaris = (senarai, awalan) =>
    senarai.filter((l) => l.startsWith(awalan)).length;

  const capJari = new Map();
  for (const fl of FAIL_GATE) {
    if (!fs.existsSync(fl)) { bad(`${fl} tiada`); continue; }
    const teks = fs.readFileSync(fl, 'utf8');
    const buf = fs.readFileSync(fl);
    const senarai = teks.split('\n');
    const bukanKosong = senarai.map((l) => l.replace(/\s+$/, '')).filter((l) => l !== '');
    capJari.set(fl, {
      blob: git('hash-object', fl),
      bait: buf.length,
      baris: (teks.match(/\n/g) || []).length,
      aksara: [...teks].length,
      table: kiraBaris(senarai, 'CREATE TABLE'),
      func: (teks.match(/CREATE OR REPLACE FUNCTION/g) || []).length,
      policy: kiraBaris(senarai, 'CREATE POLICY'),
      index: kiraBaris(senarai, 'CREATE INDEX'),
      pertama: bukanKosong[0] ?? '',
      terakhir: bukanKosong[bukanKosong.length - 1] ?? '',
    });
  }

  // Git blob SHA mesti = SHA1('blob <bait>\0' + kandungan). Disahkan tiga cara
  // dalam DP-11.2; diuji di sini supaya definisi itu tidak boleh menyimpang.
  const { createHash } = await import('node:crypto');
  for (const [fl, cj] of capJari) {
    const buf = fs.readFileSync(fl);
    const kira = createHash('sha1')
      .update(Buffer.concat([
        Buffer.from(`blob ${buf.length}\0`, 'utf8'), buf])).digest('hex');
    eq(kira, cj.blob, `definisi blob SHA sah bagi ${path.basename(fl)}`);
  }

  for (const pf of PROMPT_8A3_SET) {
    if (!fs.existsSync(pf)) continue;
    const teks = fs.readFileSync(pf, 'utf8');
    const nama = path.basename(pf);
    for (const [fl, cj] of capJari) {
      if (!teks.includes(path.basename(fl))) continue;
      // Lapis 1
      eq(teks.includes(cj.blob), true, `${nama}: blob SHA ${path.basename(fl)} diterbitkan`);
      // Lapis 2 — hanya tuntut nilai yang prompt itu memang siarkan
      if (/cap jari struktur|Lapis 2/i.test(teks)) {
        eq(teks.includes(String(cj.bait)), true, `${nama}: bait ${cj.bait} (${path.basename(fl)})`);
        eq(teks.includes(String(cj.baris)), true, `${nama}: baris ${cj.baris} (${path.basename(fl)})`);
        eq(teks.includes(String(cj.aksara)), true, `${nama}: aksara ${cj.aksara} (${path.basename(fl)})`);
        eq(teks.includes(`${cj.table} / ${cj.func} / ${cj.policy} / ${cj.index}`), true,
           `${nama}: kiraan CREATE ${cj.table}/${cj.func}/${cj.policy}/${cj.index} (${path.basename(fl)})`);
      }
    }
  }
}

// -----------------------------------------------------------------------------
console.log(`\nKEPUTUSAN: ${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) {
  console.log('\nKegagalan:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('🎉 SEMUA RUJUKAN DOKUMEN DISAHKAN terhadap repo sebenar.');
