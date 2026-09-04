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
// 7. DP-12 — SQL inline dalam 4 prompt langkah mesti BYTE-IDENTIK dengan fail
// -----------------------------------------------------------------------------
//
// Prompt langkah dibina oleh scripts/generate-8a3-install-prompts.mjs, yang
// menulis bait fail terus ke markdown. Seksyen ini membuktikan hasilnya:
// kandungan yang diekstrak semula mesti menghasilkan blob SHA, SHA-256, bait,
// baris, aksara dan kiraan CREATE yang SAMA dengan fail asal.
//
// Jika penyalinan (atau penyuntingan tangan) mengubah walau satu bait — termasuk
// ruang kosong atau newline terakhir — blob SHA akan berbeza dan ujian ini gagal.
// Inilah yang menutup rantai integriti DP-12.4(6).
console.log('\n[7] DP-12 — SQL inline dalam prompt langkah byte-identik dengan fail');
{
  const { createHash } = await import('node:crypto');
  const PAGAR = '`'.repeat(4);
  const LANGKAH = [
    ['docs/PROMPT-8A3-L1-CLIENT-MASTER.md', 'lib/supabase/client-master.sql'],
    ['docs/PROMPT-8A3-L2-EXTERNAL-ACCOUNT-MANAGERS.md', 'lib/supabase/external-account-managers.sql'],
    ['docs/PROMPT-8A3-L3-ACCOUNT-MANAGER-RESOLUTION.md', 'lib/supabase/account-manager-resolution.sql'],
    ['docs/PROMPT-8A3-L4-SEED-ALIASES.md', 'lib/supabase/seed-account-manager-aliases.sql'],
  ];
  // Pengekstrak: dari pagar pembuka 4-backtick ke pagar penutup 4-backtick.
  // Bukan-tamak, jadi ia berhenti pada penutup pertama.
  const RE_PAGAR = new RegExp(PAGAR + 'sql\\n([\\s\\S]*?)' + PAGAR);

  for (const [pf, fl] of LANGKAH) {
    const nama = path.basename(pf);
    if (!fs.existsSync(pf)) { bad(`${pf} belum dijana — jalankan scripts/generate-8a3-install-prompts.mjs`); continue; }
    if (!fs.existsSync(fl)) { bad(`${fl} tiada`); continue; }

    const dokumen = fs.readFileSync(pf, 'utf8');
    const m = dokumen.match(RE_PAGAR);
    if (!m) { bad(`${nama}: tiada blok SQL berpagar ${PAGAR}`); continue; }
    const inline = m[1];
    const asal = fs.readFileSync(fl, 'utf8');

    // 1. Perbandingan bait langsung — ujian paling kuat.
    eq(inline === asal, true, `${nama}: SQL inline === bait fail ${path.basename(fl)}`);

    // 2. blob SHA + SHA-256 mesti sepadan (mengesan perbezaan yang tidak
    //    kelihatan, contohnya trailing newline atau CRLF).
    const blobKira = createHash('sha1').update(
      Buffer.concat([Buffer.from(`blob ${Buffer.byteLength(inline, 'utf8')}\0`, 'utf8'),
                     Buffer.from(inline, 'utf8')])).digest('hex');
    const blobAsal = git('hash-object', fl);
    eq(blobKira, blobAsal, `${nama}: blob SHA inline sepadan fail`);

    const shaInline = createHash('sha256').update(Buffer.from(inline, 'utf8')).digest('hex');
    const shaAsal = createHash('sha256').update(fs.readFileSync(fl)).digest('hex');
    eq(shaInline, shaAsal, `${nama}: SHA-256 inline sepadan fail`);

    // 3. Nilai cap jari yang DITERBITKAN dalam prompt mesti sepadan fail.
    eq(dokumen.includes(blobAsal), true, `${nama}: blob SHA diterbitkan`);
    eq(dokumen.includes(shaAsal), true, `${nama}: SHA-256 diterbitkan`);
    const bait = Buffer.byteLength(asal, 'utf8');
    const barisN = (asal.match(/\n/g) || []).length;
    const aksara = [...asal].length;
    eq(dokumen.includes(`**${bait}**`), true, `${nama}: bait ${bait} diterbitkan`);
    eq(dokumen.includes(`**${barisN}**`), true, `${nama}: baris ${barisN} diterbitkan`);
    eq(dokumen.includes(`**${aksara}**`), true, `${nama}: aksara ${aksara} diterbitkan`);

    // 4. Prompt mesti merujuk branch + repo semasa (DP-10.11).
    eq(dokumen.includes(BRANCH_SEMASA), true, `${nama}: merujuk branch semasa`);
    eq(dokumen.includes(REPO_PENUH), true, `${nama}: merujuk nama repo betul`);
  }
}

// -----------------------------------------------------------------------------
// 8. DP-12 — prompt langkah mesti sepadan output penjana (tiada drift)
// -----------------------------------------------------------------------------
//
// Seksyen [7] membuktikan SQL inline === bait fail. Tetapi seseorang masih boleh
// menyunting prompt itu dengan TANGAN selepas penjanaan (mengubah arahan, jadual
// cap jari, atau larangan) tanpa menjana semula. Mod `--check` penjana membina
// dokumen dalam ingatan dan membandingkannya dengan cakera TANPA menulis, jadi
// drift boleh dikesan semasa ujian tanpa mengubah fail.
//
// Sejarah: penjana pada asalnya mengecop `git rev-parse HEAD`, yang sentiasa
// lapuk satu commit (fail dijana dalam commit N tetapi dicop sebagai N-1) dan
// menjadikan penjanaan semula sentiasa menghasilkan diff. Cop itu dibuang;
// kandungan sudah dipin lebih kuat oleh blob SHA yang content-addressed.
console.log('\n[8] DP-12 — prompt langkah sepadan output penjana (tiada drift)');
{
  // KEDUA-DUA penjana mesti bebas drift. Penjana rekonsiliasi membina semula
  // JANGKAAN probe dalam PGlite daripada fail SQL yang diluluskan, jadi jika
  // fail itu berubah dan prompt tidak dijana semula, ChatGPT akan membandingkan
  // output live dengan jangkaan LAPUK dan melaporkan kegagalan palsu.
  const PENJANA = [
    ['scripts/generate-8a3-install-prompts.mjs', '4 prompt langkah 8A-3'],
    ['scripts/generate-8a3-l1-reconciliation.mjs', 'prompt rekonsiliasi L1'],
    ['scripts/generate-8a3-l3-reconciliation.mjs', 'prompt rekonsiliasi L3'],
  ];
  for (const [PEN, label] of PENJANA) {
    if (!fs.existsSync(PEN)) { bad(`${PEN} tiada`); continue; }
    let kod = 0;
    let output = '';
    try {
      output = execFileSync('node', [PEN, '--check'], { encoding: 'utf8' });
    } catch (e) {
      kod = e.status ?? 1;
      output = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    }
    eq(kod, 0, `penjana --check: ${label} sepadan output penjana`);
    if (kod !== 0) {
      for (const l of output.split('\n').filter((x) => x.trim())) {
        console.log(`       ${l}`);
      }
    }
  }
  {
    // Cop commit yang lapuk mesti TIDAK muncul semula — ia punca drift asal.
    for (const pf of ['docs/PROMPT-8A3-L1-CLIENT-MASTER.md',
                      'docs/PROMPT-8A3-L2-EXTERNAL-ACCOUNT-MANAGERS.md',
                      'docs/PROMPT-8A3-L3-ACCOUNT-MANAGER-RESOLUTION.md',
                      'docs/PROMPT-8A3-L4-SEED-ALIASES.md']) {
      if (!fs.existsSync(pf)) continue;
      eq(fs.readFileSync(pf, 'utf8').includes('**Commit:**'), false,
         `${path.basename(pf)}: tiada cop commit (punca bukan-deterministik)`);
    }
  }
}

// -----------------------------------------------------------------------------
console.log('\n[9] DP-14 — pembetulan fixture rekonsiliasi DIKUNCI (tidak boleh regres)');
{
  // DP-14.2: versi pertama prompt rekonsiliasi meramalkan `test`/`Admin` ->
  // NULL kerana fixture hanya menyemai 18 staf Excel sedangkan live ada 20
  // profil (J0a). ChatGPT membenderanya sebagai 🔴. Ramalan Arena yang salah,
  // BUKAN live yang rosak. Seksyen ini mengunci pembetulan itu supaya ramalan
  // lapuk yang sama tidak boleh dihantar semula ke production.
  const REK = 'docs/PROMPT-8A3-L1-REKONSILIASI.md';
  if (!fs.existsSync(REK)) {
    bad(`${REK} tiada`);
  } else {
    const d = fs.readFileSync(REK, 'utf8');
    // (a) Jangkaan R2 mesti kini sepadan output live yang GPT laporkan.
    eq(d.includes('| test | test |'), true,
       'R2: jangkaan `test` -> `test` (sepadan laporan live GPT)');
    eq(d.includes('| Admin | Admin |'), true,
       'R2: jangkaan `Admin` -> `Admin` (sepadan laporan live GPT)');
    // (b) Ramalan lapuk mesti TIADA lagi: test/Admin "dijangka NULL".
    //     SKOP BARIS, bukan /s seluruh dokumen — `Fuzy` dan `Ow Zi Qi`
    //     MEMANG sah "dijangka NULL" (L4 belum dijalankan), jadi padanan
    //     rentas-dokumen akan memberi positif palsu terhadap dokumen yang betul.
    const barisR2 = d.split('\n').filter((l) =>
      (l.includes('`test`') || l.includes('`Admin`')) &&
      /dijangka NULL|meramalkan `NULL`/.test(l) &&
      !/BUKAN|salah|Versi pertama/.test(l));
    eq(barisR2.length, 0,
       'tiada baris meramalkan `test`/`Admin` -> NULL' +
       (barisR2.length ? ` (jumpa: ${barisR2[0].slice(0, 60)}…)` : ''));
    //     Frasa lapuk yang spesifik daripada versi pertama mesti hilang.
    eq(d.includes('tiada nilai Excel yang sepatutnya menyelesaikan kepada akaun Super Admin'),
       false, 'frasa lapuk versi pertama telah dibuang');
    // (b2) Pengawal POSITIF: kenyataan pembetulan mesti wujud, supaya seksyen
    //      ini tidak lulus hanya kerana anotasi dipadam tanpa diganti.
    eq(/`test` → `test` dan `Admin` → `Admin` IALAH JANGKAAN YANG BETUL/.test(d), true,
       'kenyataan pembetulan R2 (jangkaan yang betul) dinyatakan');
    eq(d.includes('20 profil'), true,
       'fixture 20 profil dinyatakan (sepadan J0a live)');
    // (c) DP-14.1: R6b mesti 🟠 makluman + sebab versi PG 18 dinyatakan,
    //     kerana ia menguji REPRESENTASI katalog, bukan kelakuan.
    eq(/### R6b.*MAKLUMAN/.test(d), true, 'R6b ditandakan 🟠 MAKLUMAN');
    eq(d.includes('PostgreSQL 18'), true,
       'R6b: sebab versi (PostgreSQL 18) dinyatakan');
    // (d) Empat kekangan yang wajib sepadan walau apa pun versi mesti kekal.
    for (const k of ['account_manager_aliases_pkey',
                     'account_manager_aliases_raw_unique',
                     'account_manager_aliases_user_id_fkey',
                     'account_manager_aliases_confirmed_by_fkey']) {
      eq(d.includes(k), true, `R6b: kekangan wajib ${k} masih disenaraikan`);
    }
    // (e) DP-14.2 mesti dirujuk supaya ChatGPT tidak "memperbaiki" live.
    eq(d.includes('DP-14.2'), true, 'prompt merujuk DP-14.2 (gate berasingan)');
  }

  // DP-14.3: fixture mesti setara live. Pengawal-pengawal ini kini tinggal di
  // `scripts/lib/fixture-live.mjs` (DP-17.5) kerana fixture itu DIKONGSI oleh
  // penjana L1-R dan L3-R — dua fixture berasingan akan drift antara satu sama
  // lain dan kedua-duanya kelihatan "lulus". Tanpanya fixture boleh
  // senyap-senyap kembali tidak setara (DP-6 muncul semula sebagai ramalan salah).
  const FIXMOD = 'scripts/lib/fixture-live.mjs';
  if (!fs.existsSync(FIXMOD)) {
    bad(`${FIXMOD} tiada — fixture dikongsi hilang`);
  } else {
    const g = fs.readFileSync(FIXMOD, 'utf8');
    eq(g.includes('nEnum !== 8'), true,
       'fixture: pengawal app_role = 8 (sepadan J1d live)');
    eq(g.includes('nSemua !== 20'), true,
       'fixture: pengawal 20 profil (sepadan J0a live)');
    eq(g.includes('lib/supabase/user-management.sql'), true,
       'fixture: user-management.sql (Fasa 6) DIPASANG');
    // Enum yang ditadbir tangan akan mewujudkan drift ketiga — dilarang.
    eq(/ALTER TYPE\s+public\.app_role\s+ADD VALUE/i.test(g), false,
       'fixture: TIDAK mentadbir enum app_role dengan tangan (DP-14.3)');
  }

  // Kata putus mesti direkodkan dalam panel, bukan hanya dalam kod.
  const PANEL = 'docs/PANEL-PAKAR-TPMS.md';
  if (fs.existsSync(PANEL)) {
    const pd = fs.readFileSync(PANEL, 'utf8');
    eq(pd.includes('## DP-14 —'), true, 'panel: DP-14 direkodkan');
    for (const sub of ['### 14.1', '### 14.2', '### 14.3', '### 14.4', '### 14.5']) {
      eq(pd.includes(sub), true, `panel: ${sub} wujud`);
    }
    eq(/Kata putus 14\.2/.test(pd), true, 'panel: kata putus 14.2 dinyatakan');
    eq(pd.includes('Bantahan direkodkan'), true,
       'panel: bantahan posisi A direkodkan (protokol panel)');
  } else {
    bad(`${PANEL} tiada`);
  }
}

// -----------------------------------------------------------------------------
console.log('\n[10] DP-17 — rekonsiliasi L3: pengawal keselamatan DIKUNCI');
{
  // L3 dipasang daripada SQL yang "semantically equivalent tetapi bukan
  // byte-for-byte" (DP-13.2 berulang). Kata putus DP-13.2: sahkan melalui
  // KELAKUAN. L3-R mesti menguji sisi yang laporan L3 tidak sentuh: pendedahan
  // minimum (veto 2.8), pengawal kuasa, postur GRANT, deny-by-default, dan
  // penolakan tulis tanpa kuasa.
  const REK = 'docs/PROMPT-8A3-L3-REKONSILIASI.md';
  if (!fs.existsSync(REK)) {
    bad(`${REK} tiada`);
  } else {
    const d = fs.readFileSync(REK, 'utf8');
    for (const id of ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']) {
      eq(new RegExp(`### ${id} — `).test(d), true, `L3-R: probe ${id} hadir`);
    }
    // Veto 2.8: pendedahan minimum ialah sebab utama L3-R wujud.
    eq(d.includes('TABLE(id uuid, full_name text)'), true,
       'L3-R: pendedahan minimum am_list_staff (id, full_name sahaja) dikunci');
    eq(d.includes('§2.8'), true, 'L3-R: merujuk veto Keselamatan §2.8');
    // S5 mesti dinyatakan sebagai KEGAGALAN yang dijangka, dengan 42501.
    eq(d.includes('42501'), true, 'L3-R: S5 menjangka errcode 42501');
    eq(d.includes('Jangkaan: query ini GAGAL'), true,
       'L3-R: S5 dinyatakan sebagai kegagalan yang DIJANGKA (bukan ralat)');
    // Keselamatan probe tulis: UUID tidak wujud + backstop FK mesti dijelaskan,
    // kerana inilah satu-satunya probe yang memanggil fungsi tulis.
    eq(d.includes('99999999-9999-4999-8999-999999999999'), true,
       'L3-R: S5 guna UUID yang tidak wujud (selamat walaupun pengawal hilang)');
    eq(d.includes('account_manager_aliases_user_id_fkey'), true,
       'L3-R: backstop FK dinyatakan sebagai lapisan ketiga');
    // Read-only: tiada manipulasi identiti.
    eq(d.includes('JANGAN** tetapkan `request.jwt.claims`'), true,
       'L3-R: melarang set_config claims (ujian kuasa positif = kerja L4)');
    eq(/\bINSERT\b|\bUPDATE\b|\bDELETE\b/.test(d.split('```sql').slice(1).join('')),
       false, 'L3-R: tiada DML dalam mana-mana blok sql probe');
    // Mesti dirujuk supaya L4 tidak dimulakan sebelum rekonsiliasi.
    eq(d.includes('SEBELUM Langkah 4'), true,
       'L3-R: menyatakan ia mesti selesai sebelum L4 menulis');
  }

  // DP-17.3: probe L3x asal membuat kesilapan kategori - can_resolve_account_
  // managers() mengambil SIFAR argumen dan menilai identiti PEMANGGIL, bukan
  // baris yang disenaraikan. Jangkaan "= true" per baris tidak boleh dipenuhi
  // dalam execute_sql (tiada claims), jadi ChatGPT melaporkan false bagi
  // semua baris dan membenderanya sebagai penemuan. Prompt kini dipisah dua.
  const L3 = 'docs/PROMPT-8A3-L3-ACCOUNT-MANAGER-RESOLUTION.md';
  if (fs.existsSync(L3)) {
    const d3 = fs.readFileSync(L3, 'utf8');
    eq(d3.includes('L3x_inventori'), true,
       'L3: probe kuasa dipisah - (a) inventori peranan live');
    eq(d3.includes('L3x_sesi'), true,
       'L3: probe kuasa dipisah - (b) kuasa sesi semasa (satu nilai)');
    eq(d3.includes('DP-17.3'), true, 'L3: kesilapan kategori asal direkodkan');
    eq(d3.includes('deny-by-default'), true,
       'L3: false tanpa claims dinyatakan sebagai BUKAN kecacatan');
    eq(/Jangkaan: Super Admin \/ admin \/ head_governance \/ finance = true/.test(d3),
       false, 'L3: jangkaan kategori-salah ("= true" per baris) telah dibuang');
  } else {
    bad(`${L3} tiada`);
  }

  // Fixture dikongsi: dua penjana rekonsiliasi MESTI guna modul yang sama,
  // kerana dua fixture berasingan akan drift (punca DP-14.2).
  const FIX = 'scripts/lib/fixture-live.mjs';
  if (!fs.existsSync(FIX)) {
    bad(`${FIX} tiada`);
  } else {
    const fd = fs.readFileSync(FIX, 'utf8');
    for (const pen of ['scripts/generate-8a3-l1-reconciliation.mjs',
                       'scripts/generate-8a3-l3-reconciliation.mjs']) {
      eq(fs.readFileSync(pen, 'utf8').includes("./lib/fixture-live.mjs"), true,
         `${path.basename(pen)}: guna fixture DIKONGSI (bukan salinan sendiri)`);
    }
    // Pengawal atribut: pepijat trigger on_auth_user_created membuat semua profil
    // menjadi viewer/tidak aktif, dan pengawal KIRAAN (20) tidak mengesannya.
    eq(fd.includes('attr.aktif !== 19'), true,
       'fixture: pengawal 19 profil aktif (bukan hanya kiraan 20)');
    eq(fd.includes('ROLE_DIUKUR_LIVE'), true,
       'fixture: peranan yang DIUKUR daripada live (L3x), bukan diteka');
    eq(fd.includes('on_auth_user_created'), true,
       'fixture: punca pepijat trigger didokumenkan');
  }
}

// -----------------------------------------------------------------------------
console.log('\n[11] DP-18 — diagnostik anon: READ-ONLY dan kesimpulan PRA-DAFTAR');
{
  // L3-R melaporkan S2 🔴 (anon = true bagi 7/7 fungsi). Arena mempunyai bukti
  // mekanikal bahawa jangkaan itu sendiri mungkin artifak fixture, tetapi
  // MENOLAK untuk mengisytiharkannya berdasarkan PGlite sahaja. Prompt S2-F
  // mesti (a) read-only sepenuhnya - kerana "memperbaiki" privilej sebelum punca
  // disahkan akan memusnahkan bukti dan boleh memecahkan 17 fungsi Fasa 6, dan
  // (b) mengandungi kesimpulan PRA-DAFTAR supaya kata putus tidak boleh direka
  // selepas melihat data.
  const F = 'docs/PROMPT-8A3-S2F-ANON-PRIVILEGE-DIAGNOSTIK.md';
  if (!fs.existsSync(F)) {
    bad(`${F} tiada`);
  } else {
    const d = fs.readFileSync(F, 'utf8');
    for (const id of ['F1', 'F2', 'F3', 'F4']) {
      eq(new RegExp(`### ${id} — `).test(d), true, `S2-F: probe ${id} hadir`);
    }
    // (a) READ-ONLY: tiada kenyataan pengubah privilej dalam mana-mana blok sql.
    //     Prosa prompt MEMANG menyebut REVOKE/GRANT (sebagai larangan dan sebagai
    //     analisis), jadi pemeriksaan mesti diskopkan kepada blok ```sql sahaja.
    const sql = d.split('```sql').slice(1).map((b) => b.split('```')[0]).join('\n');
    eq(sql.length > 0, true, 'S2-F: blok sql ditemui untuk diperiksa');
    for (const lar of ['REVOKE', 'GRANT', 'ALTER ', 'DROP ', 'CREATE ', 'INSERT',
                       'UPDATE', 'DELETE']) {
      eq(new RegExp(`\\b${lar.trim()}\\b`, 'i').test(sql), false,
         `S2-F: tiada '${lar.trim()}' dalam mana-mana blok sql (read-only)`);
    }
    // F4 guna SET ROLE untuk mengukur kesan sebenar - dibenarkan, tetapi mesti
    // dipulihkan supaya sesi tidak ditinggalkan sebagai anon.
    eq(sql.includes('SET ROLE anon'), true, 'S2-F: F4 mengukur pandangan anon sebenar');
    eq(sql.includes('RESET ROLE'), true, 'S2-F: peranan dipulihkan (RESET ROLE)');
    // Bukti utama ialah pg_default_acl.
    eq(sql.includes('pg_default_acl'), true, 'S2-F: F1 membaca pg_default_acl (bukti langsung)');
    eq(sql.includes("defaclobjtype = 'f'"), true, 'S2-F: ditapis kepada fungsi');
    // F2 = pembeza sistemik vs khusus-L3.
    eq(sql.includes('pra-L3'), true, 'S2-F: F2 memisah pra-L3 daripada L3 (pembeza utama)');
    eq(sql.includes('pg_auth_members'), true, 'S2-F: F3 menutup penjelasan keahlian peranan');

    // (b) Larangan mengubah apa-apa mesti eksplisit.
    eq(d.includes('JANGAN ubah apa-apa'), true, 'S2-F: melarang sebarang perubahan');
    eq(d.includes('Jangan `REVOKE`'), true, 'S2-F: melarang REVOKE secara khusus');
    eq(d.includes('ALTER DEFAULT PRIVILEGES'), true,
       'S2-F: melarang ALTER DEFAULT PRIVILEGES');

    // (c) Kesimpulan PRA-DAFTAR: A/B/C dengan syarat yang boleh diuji.
    eq(d.includes('A — artifak platform'), true, 'S2-F: kesimpulan A pra-daftar');
    eq(d.includes('B — penemuan sebenar khusus L3'), true, 'S2-F: kesimpulan B pra-daftar');
    eq(d.includes('C — tidak dapat ditentukan'), true, 'S2-F: kesimpulan C pra-daftar');
    // Normalisasi penekanan markdown: dokumen menulis '**bukan** dicipta selepas
    // melihat data', jadi padanan literal terhadap 'bukan dicipta' akan gagal.
    // Buang '*' sebelum memadankan - pengawal mesti menguji MAKSUD, bukan tanda.
    // ...dan ruang putih: dokumen membungkus baris, jadi 'dicipta' dan
    // 'selepas' dipisahkan oleh newline. Runtuhkan kepada satu ruang.
    const dRata = d.replace(/\*/g, ' ').replace(/\s+/g, ' ');
    eq(dRata.includes('bukan dicipta selepas melihat data'), true,
       'S2-F: menyatakan kesimpulan pra-daftar, bukan direka selepas data');
    eq(dRata.includes('Direkodkan lebih awal'), true,
       'S2-F: kesimpulan direkodkan lebih awal');

    // (d) Langkah 4 mesti kekal disekat sehingga S2-F kembali.
    eq(d.includes('Jangan mula Langkah 4'), true, 'S2-F: Langkah 4 kekal disekat');
    // (e) Pemisahan dua soalan (kesetiaan vs postur privilej) mesti wujud.
    eq(d.includes('least-privilege'), true,
       'S2-F: soalan least-privilege diasingkan, tidak ditutup oleh S2');
    eq(d.includes('DP-18.4'), true, 'S2-F: merujuk DP-18.4 (gate tadbir urus)');
  }

  // Panel mesti merekodkan DP-18 dengan bukti mekanikal + pra-daftar.
  const PANEL = 'docs/PANEL-PAKAR-TPMS.md';
  if (fs.existsSync(PANEL)) {
    const pd = fs.readFileSync(PANEL, 'utf8');
    eq(pd.includes('## DP-18 —'), true, 'panel: DP-18 direkodkan');
    for (const sub of ['### 18.1', '### 18.2', '### 18.3', '### 18.4', '### 18.5']) {
      eq(pd.includes(sub), true, `panel: ${sub} wujud`);
    }
    // Bukti mekanikal mesti mengandungi kedua-dua keadaan yang diukur.
    eq(pd.includes('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon'),
       true, 'panel: eksperimen default privileges direkodkan');
    eq(pd.includes('REVOKE ALL … FROM PUBLIC'), true,
       'panel: penemuan bahawa REVOKE FROM PUBLIC tidak membuang grant anon');
    eq(pd.includes('PRA-DAFTAR'), true, 'panel: kesimpulan pra-daftar direkodkan');
    eq(/Kata putus 18\.4/.test(pd), true, 'panel: kata putus 18.4 dinyatakan');
    eq(pd.includes('Bantahan Keselamatan direkodkan'), true,
       'panel: bantahan direkodkan (protokol panel)');
  } else {
    bad(`${PANEL} tiada`);
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
