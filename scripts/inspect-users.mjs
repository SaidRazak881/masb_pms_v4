import * as XLSXNS from 'xlsx';
const XLSX = XLSXNS.default ?? XLSXNS;
const wb = XLSX.readFile('V4 RAW/User Profiles Mapping.xlsx', { cellDates: true });
for (const sn of wb.SheetNames) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '', raw: true });
  console.log(`--- ${sn} (${rows.length} rows) ---`);
  for (const r of rows) {
    const cells = r.map(c => String(c).trim()).filter(x => x !== '');
    if (cells.length) console.log(JSON.stringify(cells));
  }
}
