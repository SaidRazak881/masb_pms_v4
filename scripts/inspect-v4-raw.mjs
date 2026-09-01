import * as XLSXNS from 'xlsx';
const XLSX = XLSXNS.default ?? XLSXNS;
import fs from 'fs';
const dir = 'V4 RAW';
for (const f of fs.readdirSync(dir).sort()) {
  if (!f.endsWith('.xlsx')) continue;
  const wb = XLSX.readFile(`${dir}/${f}`, { cellDates: true });
  console.log(`\n===== ${f} =====`);
  for (const sn of wb.SheetNames) {
    const ws = wb.Sheets[sn];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
    console.log(`--- Sheet: "${sn}" (${rows.length} rows) ---`);
    let shown = 0;
    for (const r of rows.slice(0, 14)) {
      const cells = r.map(c => String(c).replace(/\n/g, '⏎').slice(0, 30));
      if (cells.join('|').trim()) { console.log('  ' + cells.join(' | ')); shown++; }
      if (shown >= 9) break;
    }
  }
}
