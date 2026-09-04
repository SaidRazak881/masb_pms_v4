/**
 * test-account-manager-ui.mjs — Ujian kontrak permukaan 8A-2 (Pengurus Akaun)
 * ==========================================================================
 *
 * MENGAPA UJIAN INI WUJUD
 * -----------------------
 * Fasa 8A-2 menambah empat fail baharu yang **bersambung kepada SQL yang sudah
 * dipasang di live** melalui nama fungsi dan nama parameter:
 *
 *   lib/account-manager.ts                       (helper tulen)
 *   lib/actions/account-manager-actions.ts       (Server Action -> rpc)
 *   app/(dashboard)/account-managers/page.tsx    (gate peranan)
 *   components/account-managers/alias-confirmation.tsx (UI)
 *   components/layout/sidebar-nav.tsx            (pautan nav)
 *
 * Ralat dalam sambungan ini **tidak kelihatan semasa binaan**: `tsc` dan
 * `next build` lulus walaupun nama RPC salah eja, kerana `.rpc("nama")`
 * menerima sebarang rentetan. Ralat itu hanya muncul apabila pengguna sebenar
 * menekan butang — iaitu tepat pada saat sistem mula digunakan.
 *
 * Ujian ini menutup jurang itu dengan membandingkan kod TS **terus kepada
 * fail SQL** dalam `lib/supabase/`, dan dengan menguji kelakuan helper tulen
 * secara langsung (import sebenar, bukan salinan logik).
 *
 * KONTRAK YANG DIKUNCI
 * --------------------
 *  A. Nama RPC + nama parameter + parameter wajib  == definisi SQL
 *  B. Lima `kategori` dalam TS                     == literal CASE dalam SQL
 *  C. Peranan dalam nav                            == `can_resolve_account_managers()`
 *  D. Kelakuan DP-8 (nota wajib untuk berbilang orang), DP-9 (orang luar),
 *     veto Kewangan §2.4, dan pendedahan minimum Keselamatan §2.8
 *  E. Mod demo: baca dibenarkan, TULISAN ditolak
 *  F. UI: ruang putih dikekalkan, tiada pengesahan automatik, boleh dibatalkan
 *  G. Tiada pencemaran aksara CJK
 *
 * Kontrak C penting secara khusus kerana corak "fixture ≠ live" sudah
 * menghasilkan lima sisihan (DP-14.1, DP-14.2, DP-17.5, S2, enum drift).
 * Jika senarai peranan nav dan fungsi SQL berbeza, pengguna akan melihat
 * pautan yang kemudian menolak mereka — ralat yang memalukan dan sukar dikesan.
 *
 * Jalankan: node scripts/test-account-manager-ui.mjs
 */
import fs from 'fs';
import path from 'path';

let pass = 0;
let fail = 0;
const ok = (m) => { pass++; console.log(`  ✅ ${m}`); };
const bad = (m) => { fail++; console.log(`  ❌ ${m}`); };
const eq = (a, b, m) => (JSON.stringify(a) === JSON.stringify(b) ? ok(m) : bad(`${m} — dapat ${JSON.stringify(a)}, mahu ${JSON.stringify(b)}`));
const truthy = (v, m) => (v ? ok(m) : bad(m));
const section = (t) => console.log(`\n${'─'.repeat(62)}\n${t}\n${'─'.repeat(62)}`);

const ROOT = process.cwd();
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const FAIL_TS = [
  'lib/account-manager.ts',
  'components/dashboard/data-attention-panel.tsx',
  'app/(dashboard)/dashboard/page.tsx',
  'lib/actions/account-manager-actions.ts',
  'app/(dashboard)/account-managers/page.tsx',
  'components/account-managers/alias-confirmation.tsx',
  'components/layout/sidebar-nav.tsx',
];

/* =====================================================================
 * PARSER: definisi fungsi SQL daripada SEMUA fail dalam lib/supabase/
 * ===================================================================== */
function sqlFunctions() {
  const out = new Map();
  const dir = path.join(ROOT, 'lib/supabase');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql'))) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    const re = /CREATE OR REPLACE FUNCTION\s+public\.(\w+)\s*\(([^)]*)\)/g;
    let m;
    while ((m = re.exec(src))) {
      const params = [];
      for (const raw of m[2].split(',')) {
        const p = raw.replace(/\s+/g, ' ').trim();
        if (!p) continue;
        const bits = p.split(' ');
        params.push({ name: bits[0], type: bits[1] ?? '?', hasDefault: /DEFAULT/i.test(p) });
      }
      if (!out.has(m[1])) out.set(m[1], []);
      out.get(m[1]).push({ file: f, params });
    }
  }
  return out;
}

/** Semua panggilan `.rpc("nama", { ... })` dalam satu sumber TS. */
function rpcCalls(src) {
  const out = [];
  const re = /\.rpc\(\s*"([A-Za-z0-9_]+)"\s*(?:,\s*\{([^}]*)\})?/g;
  let m;
  while ((m = re.exec(src))) {
    const args = [];
    if (m[2]) {
      for (const part of m[2].split(',')) {
        const k = part.split(':')[0].replace(/\s+/g, '').trim();
        if (k) args.push(k);
      }
    }
    out.push({ name: m[1], args });
  }
  return out;
}

/**
 * Buang komen daripada sumber TS/TSX.
 *
 * MENGAPA: dokumentasi komponen ini menerangkan apa yang SENGAJA tidak dibuat
 * ("Komponen ini SENGAJA bukan \"use client\""; alternatif yang ditolak
 * `am_ringkasan_perlu_tindakan`). Assertion yang mencari token dalam teks penuh
 * akan "menangkap" prosa itu dan gagal pada kod yang betul — kelas kesilapan
 * yang sama seperti keperluan menormalkan penekanan markdown sebelum memadankan.
 * Jadi token kehadiran/ketiadaan diuji terhadap KOD sahaja.
 */
const tanpaKomen = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')            // blok /* ... */
  .replace(/(^|\n)\s*\/\/[^\n]*/g, '$1')        // baris // ...
  .split('\n')
  .filter((l) => !/^\s*\*/.test(l))                // baris * dalam JSDoc
  .join('\n');

const SQL = sqlFunctions();
const ACTIONS = read('lib/actions/account-manager-actions.ts');
const PAGE = read('app/(dashboard)/account-managers/page.tsx');
const COMP = read('components/account-managers/alias-confirmation.tsx');
const NAV = read('components/layout/sidebar-nav.tsx');
const RESOLUTION = read('lib/supabase/account-manager-resolution.sql');

/* ===================================================================== */
section('BAHAGIAN 0 — fail wujud');
for (const f of FAIL_TS) {
  const st = fs.existsSync(path.join(ROOT, f)) ? fs.statSync(path.join(ROOT, f)).size : 0;
  truthy(st > 800, `${f} wujud dan tidak remeh (${st} bait)`);
}

/* ===================================================================== */
section('BAHAGIAN A — kontrak RPC ↔ SQL');

const calls = [...rpcCalls(ACTIONS), ...rpcCalls(PAGE)];
truthy(calls.length >= 8, `sekurang-kurangnya 8 panggilan rpc ditemui (dapat ${calls.length})`);

// A1: setiap nama RPC mesti wujud dalam SQL yang dipasang
const namesUsed = [...new Set(calls.map((c) => c.name))].sort();
for (const n of namesUsed) {
  truthy(SQL.has(n), `RPC "${n}" ditakrifkan dalam lib/supabase/*.sql`);
}
eq(namesUsed, [
  'am_confirm_alias', 'am_confirm_external', 'am_list_staff', 'am_revoke_alias',
  'am_revoke_external', 'am_unresolved_values', 'can_resolve_account_managers',
  'is_external_account_manager',
], 'set nama RPC yang digunakan = 8 fungsi yang dipasang (tiada typo, tiada sisa)');

// A2: nama parameter + parameter wajib
for (const c of calls) {
  const defs = SQL.get(c.name);
  if (!defs) continue;
  const def = defs[0];
  const declared = new Set(def.params.map((p) => p.name));
  const required = def.params.filter((p) => !p.hasDefault).map((p) => p.name);

  for (const a of c.args) {
    truthy(declared.has(a), `${c.name}: argumen "${a}" ialah parameter yang diisytihar SQL`);
  }
  for (const r of required) {
    truthy(c.args.includes(r), `${c.name}: parameter WAJIB "${r}" dibekalkan oleh kod TS`);
  }
  if (def.params.length === 0) {
    eq(c.args, [], `${c.name}: fungsi tanpa parameter dipanggil tanpa argumen`);
  }
}

// A3: am_list_staff mendedahkan HANYA id + full_name (veto §2.8, disahkan live S1)
const listStaff = SQL.get('am_list_staff')?.[0];
truthy(listStaff, 'am_list_staff ditakrifkan');
truthy(/RETURNS\s+TABLE\s*\(\s*id\s+uuid\s*,\s*full_name\s+text\s*\)/.test(RESOLUTION),
  'am_list_staff RETURNS TABLE(id uuid, full_name text) — dua medan sahaja (§2.8)');

/* ===================================================================== */
section('BAHAGIAN B — lima kategori ↔ literal CASE dalam SQL');

const helper = await import('../lib/account-manager.ts');

const sqlKategori = new Set();
for (const line of RESOLUTION.split('\n')) {
  if (!/THEN|ELSE/.test(line)) continue;
  for (const m of line.matchAll(/'(SELESAI|LUAR|BERBILANG_ORANG|TIADA_PADANAN|PERLU_PENGESAHAN)'/g)) {
    sqlKategori.add(m[1]);
  }
}
eq([...helper.AM_KATEGORI].sort(), [...sqlKategori].sort(),
  'AM_KATEGORI (TS) == literal kategori yang dihasilkan CASE dalam SQL');
eq(helper.AM_KATEGORI.length, 5, 'tepat lima kategori (inti DP-9: LUAR ≠ TIADA_PADANAN)');

for (const k of helper.AM_KATEGORI) {
  truthy(helper.KATEGORI_LABEL[k] && helper.KATEGORI_LABEL[k] !== k, `${k} ada label Malay yang dibaca manusia`);
  truthy(helper.TONE_CLASS[helper.kategoriTone(k)], `${k} ada ton + kelas CSS yang wujud`);
}
eq(helper.kategoriLabel('KATEGORI_BAHARU'), 'KATEGORI_BAHARU', 'kategori tidak dikenali -> label pas-through (tidak terhempas)');
eq(helper.kategoriTone('KATEGORI_BAHARU'), 'tidak_diketahui', 'kategori tidak dikenali -> ton "tidak_diketahui"');

/* ===================================================================== */
section('BAHAGIAN C — peranan nav ↔ can_resolve_account_managers()');

const bodyMatch = RESOLUTION.match(/CREATE OR REPLACE FUNCTION public\.can_resolve_account_managers\(\)[\s\S]*?\$\$;[\s\S]*?\$\$;/);
truthy(bodyMatch, 'badan can_resolve_account_managers() ditemui');
const sqlRoles = new Set([...(bodyMatch?.[0] ?? '').matchAll(/has_role\('(\w+)'/g)].map((m) => m[1]));
eq([...sqlRoles].sort(), ['admin', 'finance', 'head_governance'],
  'SQL membenarkan admin + head_governance + finance (super_admin lulus melalui has_role)');

const hrefIdx = NAV.indexOf('href: "/account-managers"');
truthy(hrefIdx > -1, 'pautan /account-managers ada dalam sidebar-nav');
const navRolesRaw = NAV.slice(hrefIdx).match(/roles:\s*\[([^\]]*)\]/)?.[1] ?? '';
const navRoles = [...navRolesRaw.matchAll(/"(\w+)"/g)].map((m) => m[1]);
eq([...navRoles].sort(), ['admin', 'finance', 'head_governance', 'super_admin'],
  'nav menunjukkan pautan kepada 4 peranan yang dibenarkan SQL');

const navTanpaSuper = navRoles.filter((r) => r !== 'super_admin').sort();
eq(navTanpaSuper, [...sqlRoles].sort(),
  'nav tolak super_admin == set peranan SQL TEPAT (tiada peranan liar, tiada yang hilang)');
truthy(/super_admin/.test(navRolesRaw),
  'super_admin disenaraikan secara eksplisit (has_role mengembalikan true untuk super_admin — lihat test-c13-has-role-drift.mjs)');

// Middleware mesti melindungi laluan yang sama - jika tidak, pelawat yang tidak
// log masuk melihat "Akses Ditolak" dan bukannya dialih ke /login seperti setiap
// halaman dashboard lain. DB tetap melindungi (RPC menjaga diri); ini lapisan
// kedua + konsistensi UX.
const MIDDLEWARE = read('lib/supabase/middleware.ts');
const prefixes = [...MIDDLEWARE.matchAll(/^\s*"(\/[\w-]+)",$/gm)].map((m) => m[1]);
truthy(prefixes.includes('/account-managers'),
  'middleware: /account-managers ada dalam PROTECTED_PREFIXES');
truthy(prefixes.includes('/dashboard') && prefixes.includes('/admin'),
  'middleware: senarai prefix masih mengandungi laluan dashboard sedia ada');

// Gate mesti MENANYA pangkalan data, bukan meneka daripada senarai peranan setempat
truthy(PAGE.includes('can_resolve_account_managers'), 'page menyemak kuasa melalui RPC (sumber kebenaran = DB)');
truthy(PAGE.includes('Akses Ditolak'), 'page memaparkan "Akses Ditolak" apabila RPC menolak');
truthy(/rpcMissing/.test(PAGE), 'page membezakan "RPC belum dipasang" daripada "tiada kuasa"');
truthy(/account-manager-resolution\.sql/.test(PAGE), 'mesej RPC-hilang menamakan fail SQL yang perlu dipasang');

/* ===================================================================== */
section('BAHAGIAN D — kelakuan helper tulen (DP-8, DP-9, §2.4)');

// D1: pengesanan berbilang orang — termasuk kes ruang hujung yang sebenar
eq(helper.isMultiPersonRaw('Fuzy / Dila'), true, '"Fuzy / Dila" -> berbilang orang');
eq(helper.isMultiPersonRaw('Fuzy / Sholihin '), true, '"Fuzy / Sholihin " (ruang hujung) -> berbilang orang');
eq(helper.isMultiPersonRaw('Fuzy'), false, '"Fuzy" -> seorang');
eq(helper.isMultiPersonRaw('Abu Said'), false, '"Abu Said" (dua perkataan, satu orang) -> BUKAN berbilang');
eq(helper.isMultiPersonRaw(''), false, 'rentetan kosong -> bukan berbilang');

// D2/D3: keputusan pengguna yang MENGIKAT (2026-09-04)
eq([...helper.KEPUTUSAN_DP8].sort(), ['Fuzy', 'Fuzy / Dila', 'Fuzy / Sholihin '].sort(),
  'DP-8: ketiga-tiga nilai Fuzy dirakam (semua -> Fuziah, keputusan pengguna)');
truthy(helper.KEPUTUSAN_DP8.has('Fuzy / Sholihin '), 'DP-8 mengekalkan ruang hujung sebenar daripada Excel');
eq([...helper.KEPUTUSAN_DP9], ['Ow Zi Qi'], 'DP-9: "Ow Zi Qi" = orang luar, kekal NULL, dilaporkan berasingan');

for (const v of [...helper.KEPUTUSAN_DP8, ...helper.KEPUTUSAN_DP9]) {
  eq(helper.isKeputusanPengguna(v), true, `"${v}" ditanda sebagai keputusan pengguna`);
  truthy(helper.notaKeputusanPengguna(v)?.length > 10, `"${v}" ada nota audit`);
}
eq(helper.isKeputusanPengguna('Abu Said'), false, '"Abu Said" BUKAN keputusan pengguna (tiada label palsu)');

// D4: perlu tindakan
eq(helper.perluTindakan('SELESAI'), false, 'SELESAI tidak perlu tindakan');
eq(helper.perluTindakan('LUAR'), false, 'LUAR tidak perlu tindakan (sudah diputuskan)');
for (const k of ['BERBILANG_ORANG', 'TIADA_PADANAN', 'PERLU_PENGESAHAN']) {
  eq(helper.perluTindakan(k), true, `${k} PERLU tindakan manusia`);
}

// D5: veto §2.4 — sistem tak boleh memilih; manusia boleh, dengan jejak audit
const UUID = '11111111-1111-1111-1111-111111111111';
truthy(helper.validateAliasConfirmation('Fuzy / Dila', UUID, '') !== null,
  '§2.4+DP-8: berbilang orang TANPA nota -> DITOLAK');
truthy(helper.validateAliasConfirmation('Fuzy / Dila', UUID, 'pendek') !== null,
  'DP-8: nota terlalu pendek -> DITOLAK');
eq(helper.validateAliasConfirmation('Fuzy / Dila', UUID, 'Disahkan manusia: Fuzy ialah Fuziah (DP-8).'), null,
  'DP-8: berbilang orang DENGAN nota mencukupi -> DITERIMA (manusia memutuskan)');
eq(helper.validateAliasConfirmation('Fuzy', UUID, ''), null, 'seorang staf tanpa nota -> diterima');
truthy(helper.validateAliasConfirmation('  ', UUID, 'nota panjang yang mencukupi') !== null, 'nilai mentah kosong -> ditolak');
truthy(helper.validateAliasConfirmation('Fuzy', null, '') !== null, 'tiada staf dipilih -> ditolak');

// D6: DP-9 — display_name wajib supaya LUAR benar-benar "sudah diputuskan"
truthy(helper.validateExternalClassification('Ow Zi Qi', '  ') !== null, 'DP-9: nama paparan kosong -> ditolak');
eq(helper.validateExternalClassification('Ow Zi Qi', 'Ow Zi Qi (luar)'), null, 'DP-9: klasifikasi luar yang sah -> diterima');

// D7: ringkasan tulen
const rows = [
  { raw_text: 'Farrah', jumlah_baris: 10, dari_invoices: 4, dari_staging: 6, resolved_id: UUID, resolved_name: 'Farrah', kategori: 'SELESAI', alias_wujud: false },
  { raw_text: 'Ow Zi Qi', jumlah_baris: 3, dari_invoices: 3, dari_staging: 0, resolved_id: null, resolved_name: null, kategori: 'LUAR', alias_wujud: false },
  { raw_text: 'Fuzy / Dila', jumlah_baris: 4, dari_invoices: 4, dari_staging: 0, resolved_id: null, resolved_name: null, kategori: 'BERBILANG_ORANG', alias_wujud: false },
  { raw_text: 'Abu Said', jumlah_baris: 4, dari_invoices: 4, dari_staging: 0, resolved_id: null, resolved_name: null, kategori: 'TIADA_PADANAN', alias_wujud: false },
  { raw_text: 'Zul', jumlah_baris: 2, dari_invoices: 0, dari_staging: 2, resolved_id: null, resolved_name: null, kategori: 'PERLU_PENGESAHAN', alias_wujud: false },
];
const s = helper.summarizeUnresolved(rows);
eq(s.jumlah, 5, 'ringkasan: jumlah nilai');
eq(s.selesai, 1, 'ringkasan: SELESAI');
eq(s.luar, 1, 'ringkasan: LUAR');
eq(s.perluTindakan, 3, 'ringkasan: baki yang PERLU tindakan manusia');
eq(s.barisTerjejas, 23, 'ringkasan: jumlah baris terjejas (10+3+4+4+2)');
eq(s.mengikutKategori.BERBILANG_ORANG, 1, 'ringkasan: pecahan mengikut kategori');
eq(helper.summarizeUnresolved([]).jumlah, 0, 'ringkasan: senarai kosong tidak terhempas');

/* ===================================================================== */
section('BAHAGIAN E — kawalan keselamatan dalam Server Action');

// E1: mod demo boleh BACA, tetapi TIDAK boleh menulis
const tulis = ['confirmAlias', 'revokeAlias', 'confirmExternal', 'revokeExternal'];
for (const fn of tulis) {
  const body = ACTIONS.split(`export async function ${fn}`)[1]?.split('\nexport async function')[0] ?? '';
  truthy(body.length > 0, `${fn} ditemui dalam actions`);
  truthy(/isDemoMode\(\)/.test(body) && /fail\(DEMO_TULIS\)/.test(body),
    `${fn}: mod demo MENOLAK tulisan (tiada data palsu dianggap sebagai keputusan)`);
  truthy(/revalidatePath\(HALAMAN\)/.test(body), `${fn}: revalidatePath selepas tulisan berjaya`);
}
eq(ACTIONS.match(/const HALAMAN = "([^"]+)"/)?.[1], '/account-managers',
  'HALAMAN == href nav (revalidate menyegarkan halaman yang betul)');

// E2: pengesahan sebelum RPC — tiada panggilan sia-sia atau berbahaya
truthy(/validateAliasConfirmation\(/.test(ACTIONS), 'confirmAlias mengesahkan input SEBELUM memanggil RPC');
truthy(/validateExternalClassification\(/.test(ACTIONS), 'confirmExternal mengesahkan input SEBELUM memanggil RPC');
eq((ACTIONS.match(/if \(!rawText\.trim\(\)\) return fail\(/g) ?? []).length, 2,
  'kedua-dua fungsi revoke menolak teks kosong');

// E3: larangan tetap
for (const f of FAIL_TS) {
  truthy(!/service_role/.test(read(f)), `${f}: tiada rujukan service_role (larangan tetap)`);
  truthy(!/SUPABASE_SERVICE_ROLE/.test(read(f)), `${f}: tiada kunci service role`);
}

// E4: 42501 diterjemah ke Malay, bukan dibocorkan mentah
truthy(/42501/.test(ACTIONS) && /translateAmError/.test(ACTIONS),
  'kod 42501 dipetakan kepada mesej Malay yang difahami pengguna');
truthy(/tiada kuasa|tidak mempunyai kuasa|kuasa/i.test(ACTIONS), 'mesej 42501 menyebut soal kuasa');

// E5: baca mendedahkan isDemo supaya UI boleh menandakan data bukan sebenar
for (const fn of ['listUnresolvedValues', 'listStaffOptions', 'listExternal']) {
  const body = ACTIONS.split(`export async function ${fn}`)[1]?.split('\nexport async function')[0] ?? '';
  truthy(/isDemo/.test(body), `${fn} memulangkan bendera isDemo`);
}
truthy(COMP.includes('isDemo'), 'UI menggunakan bendera isDemo untuk menandakan mod demo');

/* ===================================================================== */
section('BAHAGIAN F — kawalan UI (ruang putih, §2.4, §2.8, kebolehbalikan)');

// F1: ruang putih dalam raw_text WAJIB dikekalkan — 'Fuzy / Sholihin '
truthy(/whitespace-pre-wrap|whitespace-pre/.test(COMP),
  'UI mengekalkan ruang putih (whitespace-pre-wrap) supaya "Fuzy / Sholihin " kelihatan seperti dalam DB');
// Invarian sebenar: nilai yang DIHANTAR sebagai p_raw_text mesti bait-identik
// dengan DB. Pemangkasan pada nama paparan pra-isi dibenarkan (kata putus panel:
// ia medan baharu ciptaan manusia, bukan kunci) — jadi ujian ini memeriksa
// LALUAN HANTAR, bukan kehadiran .trim() di mana-mana sahaja.
// Argumen PERTAMA sahaja = p_raw_text; argumen lain (userId, nota) tidak relevan.
const ARG_PERTAMA = (fn) => new RegExp(fn + '\\(\\s*([^,)]+)');
const HANTAR = ['confirmAlias', 'confirmExternal', 'revokeAlias', 'revokeExternal']
  .map((fn) => [fn, ARG_PERTAMA(fn)]);
for (const [fn, re] of HANTAR) {
  const m = COMP.match(re);
  truthy(m, `UI memanggil ${fn}`);
  const arg = m?.[1]?.trim() ?? '';
  truthy(/raw_text$/.test(arg) && !/trim\(/.test(arg),
    `${fn}: raw_text dihantar TANPA pemangkasan ("${arg}")`);
}
eq((COMP.match(/raw_text\.trim\(\)/g) ?? []).length, 1,
  'hanya SATU .trim() pada raw_text — nama paparan pra-isi, bukan laluan hantar');

// F2: §2.8 pendedahan minimum dalam pemilih staf
for (const medan of ['.email', '.role', '.account_status', '.designation', '.department', '.phone']) {
  truthy(!COMP.includes(`staff${medan}`) && !COMP.includes(`option${medan}`),
    `pemilih staf tidak menyentuh ${medan} (§2.8 pendedahan minimum)`);
}
truthy(/full_name/.test(COMP), 'pemilih staf memaparkan full_name');

// F3: mesej veto + keputusan pengguna
truthy(/§2\.4|veto|Veto/.test(COMP), 'UI menerangkan veto Kewangan §2.4 (sistem tidak memilih seorang daripada berbilang)');
truthy(/DP-8|isKeputusanPengguna|KEPUTUSAN_DP8/.test(COMP), 'UI menandakan nilai yang sudah diputuskan pengguna (DP-8)');
truthy(/DP-9|KEPUTUSAN_DP9/.test(COMP), 'UI menandakan orang luar (DP-9)');

// F4: setiap keputusan boleh dibatalkan (syarat QA dalam DP-8)
truthy(/revokeAlias|revokeExternal/.test(COMP), 'UI menyediakan pembatalan bagi alias dan orang luar');
truthy(/batal|Batal/.test(COMP), 'UI menggunakan perkataan "batal" untuk pembatalan');

// F5: TIADA pengesahan automatik — sistem mengingati, tidak meneka
const effects = [...COMP.matchAll(/useEffect\(/g)];
let autoTulis = 0;
for (const e of effects) {
  const chunk = COMP.slice(e.index, e.index + 600);
  if (/confirmAlias|revokeAlias|confirmExternal|revokeExternal/.test(chunk)) autoTulis++;
}
eq(autoTulis, 0, 'tiada useEffect yang menulis ke pangkalan data (tiada pengesahan automatik)');
truthy(/sistem/i.test(COMP) && /meneka|auto/i.test(COMP),
  'UI menyatakan dengan jelas bahawa sistem tidak meneka');

// F6: DP-21.5 — halaman ini kosong pada live walaupun seed berjaya (live ada
// SIFAR nilai Account Manager mentah: K9 bilangan_nilai = 0, K8 []). Tanpa
// penjelasan, kosong kelihatan seperti kerosakan kepada pengguna pertama.
truthy(/dijangka/.test(COMP), 'UI menyatakan bahawa senarai kosong itu DIJANGKA, bukan rosak');
truthy(COMP.includes('invoices') && COMP.includes('import_staging'),
  'UI menamakan sumber senarai (invoices + import_staging) supaya kosong boleh dijelaskan');
truthy(COMP.includes('KEPUTUSAN_DP8') && COMP.includes('KEPUTUSAN_DP9'),
  'UI menyenaraikan keputusan pra-rekod DP-8/DP-9 dalam keadaan kosong');
truthy(/8B\/8D|8B|8D/.test(COMP),
  'UI menyatakan bila nilai itu akan muncul (Fasa 8B/8D)');
truthy(/pra-rekod|prarekod/i.test(COMP), 'UI menggunakan istilah "pra-rekod" bagi keputusan seed');

/* ===================================================================== */
section('BAHAGIAN H — panel paparan utama (DP-22)');
// Prinsip pengguna 2026-09-05: "data yang tidak lengkap atau bermasalah akan
// dihighlight pada paparan utama sistem untuk user kemaskini dan membuat
// pengesahan manual." Ujian ini mengunci cara ia dilaksanakan: RPC yang SUDAH
// dipasang (tiada SQL baharu), Server Component (tiada JS tambahan, tidak boleh
// menulis), dan sembunyi diri apabila tiada kuasa.
const PANEL = 'components/dashboard/data-attention-panel.tsx';
const DASH = 'app/(dashboard)/dashboard/page.tsx';
truthy(fs.existsSync(path.join(ROOT, PANEL)), 'panel data-attention-panel.tsx wujud');
const panel = read(PANEL);
const dash = read(DASH);

// H1: pendekatan termudah - tiada RPC/SQL baharu
eq((panel.match(/\.rpc\(/g) ?? []).length, 0,
  'panel tidak memanggil RPC sendiri (ia membaca data yang dihantar halaman)');
truthy(dash.includes('listUnresolvedValues'),
  'dashboard membaca am_unresolved_values() melalui action yang SUDAH wujud');
const panelKod = tanpaKomen(panel);
truthy(!/am_ringkasan|am_dashboard|CREATE\s|migration/i.test(panelKod),
  'KOD panel tidak memerlukan SQL/migration baharu (tiada HARD GATE untuk menghantarnya)');
truthy(/am_ringkasan_perlu_tindakan/.test(panel),
  'panel MENDOKUMENTASIKAN alternatif yang ditolak (supaya ia tidak dicadangkan semula)');

// H2: Server Component - tidak boleh menulis, tiada JS tambahan
truthy(!panelKod.includes('"use client"'),
  'KOD panel BUKAN "use client" -> tiada JavaScript tambahan, tiada risiko menulis secara senyap');
truthy(!/^\s*"use client"/m.test(panel),
  'panel tidak mempunyai direktif "use client" pada baris pertama kodnya');
for (const fn of ['confirmAlias', 'revokeAlias', 'confirmExternal', 'revokeExternal']) {
  truthy(!panel.includes(fn), `panel tidak mempunyai keupayaan menulis (${fn})`);
}

// H3: kuasa kekal di pangkalan data - panel menyembunyikan dirinya
truthy(/if \(error\) return null/.test(panel),
  'panel menyembunyikan dirinya apabila tiada kuasa / RPC hilang (42501)');
truthy(dash.includes('error={am.error}') || dash.includes('am.error'),
  'dashboard menghantar ralat kepada panel (bukan menelannya)');

// H4: hanya data bermasalah ditonjolkan
truthy(panel.includes('perluTindakan'),
  'panel menapis kepada nilai yang PERLU tindakan manusia sahaja');
truthy(/href="\/account-managers"/.test(panel),
  'panel memberi pautan ke halaman pengesahan (pengguna tidak perlu mencari halaman itu)');
truthy(/whitespace-pre-wrap/.test(panel),
  'panel mengekalkan ruang putih ("Fuzy / Sholihin ")');
truthy(/Sahkan sekarang|Buka Pengurus Akaun/.test(panel),
  'panel mempunyai seruan bertindak yang jelas');

// H5: keadaan tenang menerangkan DP-21.5 (kosong = betul, bukan rosak)
truthy(/pra-rekod/.test(panel),
  'panel menerangkan keputusan pra-rekod apabila senarai kosong (DP-21.5)');
truthy(/8B\/8D/.test(panel), 'panel menamakan fasa yang akan membawa data itu');

// H6: pengesahan kekal MANUAL - panel tidak membuat keputusan
truthy(/tidak akan meneka|tidak meneka/i.test(panel),
  'panel menyatakan sistem tidak meneka (pengesahan manual oleh manusia)');

/* ===================================================================== */
section('BAHAGIAN G — kebersihan teks');

const CJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/;
for (const f of FAIL_TS) {
  const lines = read(f).split('\n');
  const hits = lines.map((l, i) => [i + 1, l]).filter(([, l]) => CJK.test(l));
  eq(hits.map(([n]) => n), [], `${f}: tiada pencemaran aksara CJK${hits.length ? ` (baris ${hits.map(([n]) => n).join(',')})` : ''}`);
}

/* ===================================================================== */
console.log(`\n${'='.repeat(62)}`);
console.log(`KEPUTUSAN: ${pass} lulus, ${fail} gagal`);
console.log(`${'='.repeat(62)}\n`);
process.exit(fail === 0 ? 0 : 1);
