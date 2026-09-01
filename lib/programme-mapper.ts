/**
 * programme-mapper.ts — Pemetaan baris `programmes` (Supabase) kepada type
 * domain `Programme`.
 *
 * Modul ini TIDAK mengandungi "use server" supaya boleh diimport oleh
 * server actions, server components dan modul agregasi lain (cth. dashboard
 * dan peserta) tanpa melanggar peraturan fail server actions.
 */

import type {
  Programme,
  ProgrammeCategory,
  ProgrammeStatus,
  TrainingMode,
} from "@/lib/types";

/** Bentuk baris `programmes` daripada Supabase (snake_case). */
export interface ProgrammeRow {
  id: string;
  programme_code: string;
  title: string;
  description: string | null;
  organizer_id: string | null;
  organizer_name: string;
  category: ProgrammeCategory;
  delivery_mode: TrainingMode;
  start_date: string | null;
  end_date: string | null;
  venue: string | null;
  trainer: string | null;
  programme_manager: string | null;
  contracted_amount: number;
  budget: number;
  actual_cost: number;
  status: ProgrammeStatus;
  governance_lock_status: string;
  is_locked: boolean;
  lock_reason: string | null;
  locked_by: string | null;
  locked_at: string | null;
  unlock_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Terjemah baris programmes dari Supabase kepada type Programme. */
export function mapProgrammeRow(row: ProgrammeRow): Programme {
  return {
    id: row.id,
    code: row.programme_code,
    title: row.title,
    client: row.organizer_name,
    category: row.category,
    mode: row.delivery_mode,
    year: row.start_date ? new Date(row.start_date).getFullYear() : new Date().getFullYear(),
    status: row.status,
    locked: row.is_locked,
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    venue: row.venue || "",
    trainer: row.trainer || "",
    programmeManager: row.programme_manager || "",
    description: row.description || "",
    budget: row.budget,
    actualCost: row.actual_cost,
    contractedAmount: row.contracted_amount,
    participants: [],
    financials: [],
    costs: [],
    documents: [],
    auditTrail: [],
  };
}
