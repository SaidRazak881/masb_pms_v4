/**
 * change-requests.ts — Logik tulen Change Requests (Langkah 4: Governance).
 *
 * Apabila program dikunci oleh Head Governance, staff tidak boleh terus
 * mengemaskini data. Mereka menyerahkan Change Request: medan yang ingin
 * diubah, nilai lama, nilai baharu, sebab dan dokumen sokongan.
 *
 * Modul ini mengandungi LOGIK TULEN sahaja (jenis, label, pengesahan) —
 * tiada I/O. Tindakan sebenar dilaksanakan oleh `change-request-actions.ts`
 * yang memanggil RPC dalam `lib/supabase/change-requests.sql`.
 */

export type ChangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "applied";

export interface ChangeRequest {
  id: string;
  programmeId: string;
  programmeCode?: string;
  fieldName: string;
  fieldLabel: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string;
  supportingDocumentUrl: string | null;
  status: ChangeRequestStatus;
  requestedBy: string;
  requestedByName: string | null;
  requestedAt: string;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
}

/** Medan program yang dibenarkan untuk diminta diubah. */
export const CHANGE_REQUEST_FIELDS: { value: string; label: string }[] = [
  { value: "title", label: "Tajuk Program" },
  { value: "description", label: "Penerangan" },
  { value: "organizer_name", label: "Penganjur" },
  { value: "category", label: "Kategori" },
  { value: "delivery_mode", label: "Mod Pelaksanaan" },
  { value: "start_date", label: "Tarikh Mula" },
  { value: "end_date", label: "Tarikh Tamat" },
  { value: "venue", label: "Lokasi / Venue" },
  { value: "trainer", label: "Jurulatih (Trainer)" },
  { value: "programme_manager", label: "Pengurus Program" },
  { value: "contracted_amount", label: "Nilai Kontrak (RM)" },
  { value: "budget", label: "Bajet (RM)" },
  { value: "actual_cost", label: "Kos Sebenar (RM)" },
  { value: "status", label: "Status Program" },
];

export const CHANGE_REQUEST_STATUS_LABEL: Record<ChangeRequestStatus, string> = {
  pending: "Menunggu Kelulusan",
  approved: "Diluluskan",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  applied: "Telah Dilaksanakan",
};

export const MIN_REASON_LENGTH = 10;
export const MAX_REASON_LENGTH = 2000;

/** Sahkan borang change request (klien & pelayan berkongsi peraturan ini). */
export function validateChangeRequest(input: {
  fieldName: string;
  oldValue: string;
  newValue: string;
  reason: string;
}): { ok: true } | { ok: false; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};

  if (!CHANGE_REQUEST_FIELDS.some((f) => f.value === input.fieldName)) {
    fieldErrors.fieldName = "Sila pilih medan yang ingin diubah.";
  }

  const reason = input.reason.trim();
  if (reason.length < MIN_REASON_LENGTH) {
    fieldErrors.reason = `Sebab wajib sekurang-kurangnya ${MIN_REASON_LENGTH} aksara.`;
  } else if (reason.length > MAX_REASON_LENGTH) {
    fieldErrors.reason = `Sebab tidak boleh melebihi ${MAX_REASON_LENGTH} aksara.`;
  }

  if (!input.oldValue.trim() && !input.newValue.trim()) {
    fieldErrors.newValue =
      "Sila isi nilai lama ATAU nilai baharu (sekurang-kurangnya satu).";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }
  return { ok: true };
}

/** Terjemah nilai enum DB → label mesra pengguna. */
export function changeRequestStatusLabel(status: ChangeRequestStatus): string {
  return CHANGE_REQUEST_STATUS_LABEL[status] ?? status;
}
