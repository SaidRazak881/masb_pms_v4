/** Utiliti pemformatan untuk UI TPMS. */

/** Parser tarikh selamat — kembali null jika tidak sah/kosong. */
function parseSafeDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format nombor sebagai mata wang Ringgit Malaysia, cth. RM 12,500.00 */
export function formatMYR(amount: number | null | undefined): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Format ringkas tanpa perpuluhan, cth. RM 12,500 */
export function formatMYRShort(amount: number | null | undefined): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format tarikh ISO (2025-06-15) -> 15 Jun 2025. Selamat untuk kosong/tidak sah. */
export function formatDate(iso: string | null | undefined): string {
  const date = parseSafeDate(iso);
  if (!date) return "—";
  return new Intl.DateTimeFormat("ms-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Format tarikh-masa penuh, cth. 15 Jun 2025, 09:30. Selamat untuk kosong/tidak sah. */
export function formatDateTime(iso: string | null | undefined): string {
  const date = parseSafeDate(iso);
  if (!date) return "—";
  return new Intl.DateTimeFormat("ms-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Peratusan dengan satu tempat perpuluhan, cth. 82.4% */
export function formatPercent(value: number, total: number): string {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}
