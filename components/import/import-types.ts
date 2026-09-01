/** Jenis kongsi untuk komponen import pintar. */

export interface Summary {
  total: number;
  pending: number;
  valid: number;
  invalid: number;
  duplicates: number;
  synced: number;
  merged: number;
  created: number;
  discarded: number;
}
