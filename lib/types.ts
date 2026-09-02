/**
 * Entiti-domain untuk Training Programme Management System (TPMS)
 * MIMOS Academy. Jenis ini memodelkan jadual Supabase yang dirancang.
 */

export type ProgrammeStatus =
  | "draft"
  | "active"
  | "completed"
  | "cancelled"
  | "on_hold";

export type TrainingMode = "in_person" | "online" | "hybrid";

export type ProgrammeCategory =
  | "AI & Data Science"
  | "Cybersecurity"
  | "Cloud & Infrastructure"
  | "Digital Transformation"
  | "Leadership & Management"
  | "IoT & Embedded Systems"
  | "Engineering"
  | "Semiconductor"
  | "Non-Training"
  | "Room Rental"
  | "Consultancy"
  | "Certification";

/** Senarai kategori program rasmi (selaras dengan enum programme_category). */
export const PROGRAMME_CATEGORIES: ProgrammeCategory[] = [
  "AI & Data Science",
  "Cybersecurity",
  "Cloud & Infrastructure",
  "Digital Transformation",
  "Leadership & Management",
  "IoT & Embedded Systems",
  "Engineering",
  "Semiconductor",
  "Non-Training",
  "Room Rental",
  "Consultancy",
  "Certification",
];

export type FinancialDocType = "quotation" | "po" | "invoice";

export type FinancialDocStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "invoiced"
  | "paid"
  | "overdue";

export type BumiStatus = "bumiputera" | "non_bumiputera" | "pending";

export type ParticipantStatus =
  | "registered"
  | "confirmed"
  | "attended"
  | "completed"
  | "cancelled";

export type CostCategory =
  | "Trainer Fees"
  | "Venue"
  | "Catering"
  | "Materials & Kit"
  | "Platform / Software"
  | "Logistics"
  | "Administration";

export type DocumentType =
  | "Borang Permohonan"
  | "Quotation"
  | "Purchase Order"
  | "Invoice"
  | "Resit Pembayaran"
  | "Sijil Kehadiran"
  | "Senarai Kehadiran"
  | "Laporan Penilaian";

export type AuditAction =
  | "created"
  | "updated"
  | "status_changed"
  | "financial_added"
  | "participant_updated"
  | "document_uploaded"
  | "locked"
  | "unlocked"
  | "imported";

export interface FinancialDoc {
  id: string;
  type: FinancialDocType;
  reference: string;
  issuedDate: string;
  amount: number;
  status: FinancialDocStatus;
  notes?: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  organisation: string;
  designation: string;
  bumiStatus: BumiStatus;
  attendance: number; // peratus kehadiran 0-100
  status: ParticipantStatus;
  certificateIssued: boolean;
}

export interface CostItem {
  id: string;
  category: CostCategory;
  description: string;
  budgeted: number;
  actual: number;
}

export interface ProgrammeDocument {
  id: string;
  name: string;
  type: DocumentType;
  uploadedBy: string;
  uploadedAt: string;
  sizeKb: number;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  action: AuditAction;
  detail: string;
}

export interface Programme {
  id: string;
  code: string;
  title: string;
  client: string;
  category: ProgrammeCategory;
  mode: TrainingMode;
  year: number;
  status: ProgrammeStatus;
  locked: boolean;

  startDate: string;
  endDate: string;
  venue: string;
  trainer: string;
  programmeManager: string;
  description: string;

  /** Maklumat hubungan tambahan (pilihan). */
  trainerEmail?: string;
  trainerPhone?: string;
  programmeManagerEmail?: string;
  city?: string;
  state?: string;

  budget: number;
  actualCost: number;
  contractedAmount: number;

  participants: Participant[];
  financials: FinancialDoc[];
  costs: CostItem[];
  documents: ProgrammeDocument[];
  auditTrail: AuditEvent[];
}

export interface StagedRow {
  rowNo: number;
  name: string;
  email: string;
  organisation: string;
  designation: string;
  bumiStatus: BumiStatus;
  valid: boolean;
  errors: string[];
}
