"use server";

/**
 * programme-actions.ts — Server Actions untuk operasi CRUD programmes
 *
 * Modul ini mengandungi Server Actions untuk:
 * - Dapatkan senarai programmes
 * - Dapatkan programme mengikut ID
 * - Cipta programme baharu
 * - Kemaskini programme
 * - Padam programme
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  Programme,
  ProgrammeCategory,
  ProgrammeStatus,
  TrainingMode,
} from "@/lib/types";

// Type untuk input programme
interface ProgrammeInput {
  programme_code: string;
  title: string;
  description?: string;
  organizer_id?: string;
  organizer_name: string;
  category: ProgrammeCategory;
  delivery_mode: TrainingMode;
  start_date?: string;
  end_date?: string;
  venue?: string;
  trainer?: string;
  programme_manager?: string;
  contracted_amount?: number;
  budget?: number;
  actual_cost?: number;
  status?: ProgrammeStatus;
}

// Type untuk output programme (dari Supabase)
interface ProgrammeRow {
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

/**
 * Terjemah baris programmes dari Supabase kepada type Programme
 */
function mapProgrammeRow(row: ProgrammeRow): Programme {
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

/**
 * Dapatkan senarai semua programmes
 */
export async function getProgrammes(): Promise<Programme[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("programmes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching programmes:", error);
    return [];
  }

  return (data as ProgrammeRow[]).map(mapProgrammeRow);
}

/**
 * Dapatkan programme mengikut ID
 */
export async function getProgrammeById(id: string): Promise<Programme | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("programmes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error("Error fetching programme:", error);
    return null;
  }

  return mapProgrammeRow(data as ProgrammeRow);
}

/**
 * Cari programmes mengikut kriteria
 */
export async function searchProgrammes(
  query: {
    category?: ProgrammeCategory;
    status?: ProgrammeStatus;
    year?: number;
    organizer?: string;
    searchTerm?: string;
  }
): Promise<Programme[]> {
  const supabase = await createClient();
  
  let queryBuilder = supabase
    .from("programmes")
    .select("*");

  // Filter mengikut kategori
  if (query.category) {
    queryBuilder = queryBuilder.eq("category", query.category);
  }

  // Filter mengikut status
  if (query.status) {
    queryBuilder = queryBuilder.eq("status", query.status);
  }

  // Filter mengikut tahun
  if (query.year) {
    const startDate = `${query.year}-01-01`;
    const endDate = `${query.year}-12-31`;
    queryBuilder = queryBuilder
      .gte("start_date", startDate)
      .lte("start_date", endDate);
  }

  // Filter mengikut organisasi
  if (query.organizer) {
    queryBuilder = queryBuilder.ilike("organizer_name", `%${query.organizer}%`);
  }

  // Carian teks
  if (query.searchTerm) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${query.searchTerm}%,organizer_name.ilike.%${query.searchTerm}%,programme_code.ilike.%${query.searchTerm}%`
    );
  }

  const { data, error } = await queryBuilder.order("start_date", { ascending: false });

  if (error) {
    console.error("Error searching programmes:", error);
    return [];
  }

  return (data as ProgrammeRow[]).map(mapProgrammeRow);
}

/**
 * Cipta programme baharu
 */
export async function createProgramme(input: ProgrammeInput): Promise<{ 
  success: boolean; 
  programme?: Programme; 
  error?: string; 
}> {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "Sesi pengguna tidak sah" };
  }

  const { data, error } = await supabase
    .from("programmes")
    .insert({
      programme_code: input.programme_code,
      title: input.title,
      description: input.description,
      organizer_id: input.organizer_id,
      organizer_name: input.organizer_name,
      category: input.category,
      delivery_mode: input.delivery_mode,
      start_date: input.start_date,
      end_date: input.end_date,
      venue: input.venue,
      trainer: input.trainer,
      programme_manager: input.programme_manager,
      contracted_amount: input.contracted_amount,
      budget: input.budget,
      actual_cost: input.actual_cost,
      status: input.status || "draft",
      created_by: user.id,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Error creating programme:", error);
    return { 
      success: false, 
      error: error.message || "Gagal mencipta programme" 
    };
  }

  // Revalidate cache
  revalidatePath("/programmes");

  return { 
    success: true, 
    programme: mapProgrammeRow(data as ProgrammeRow) 
  };
}

/**
 * Kemaskini programme
 */
export async function updateProgramme(
  id: string,
  input: Partial<ProgrammeInput>
): Promise<{ 
  success: boolean; 
  programme?: Programme; 
  error?: string; 
}> {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "Sesi pengguna tidak sah" };
  }

  const { data, error } = await supabase
    .from("programmes")
    .update({
      ...input,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Error updating programme:", error);
    return { 
      success: false, 
      error: error.message || "Gagal mengemaskini programme" 
    };
  }

  // Revalidate cache
  revalidatePath("/programmes");
  revalidatePath("/programmes/" + id);

  return { 
    success: true, 
    programme: data ? mapProgrammeRow(data as ProgrammeRow) : undefined 
  };
}

/**
 * Padam programme
 */
export async function deleteProgramme(id: string): Promise<{ 
  success: boolean; 
  error?: string; 
}> {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "Sesi pengguna tidak sah" };
  }

  // Semak jika programme wujud dan boleh dipadam
  const { data: programme, error: fetchError } = await supabase
    .from("programmes")
    .select("created_by, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !programme) {
    return { success: false, error: "Programme tidak ditemui" };
  }

  // Hanya creator boleh padam programme draf
  if (programme.created_by !== user.id || programme.status !== "draft") {
    return { 
      success: false, 
      error: "Anda hanya boleh memadam programme draf yang anda cipta" 
    };
  }

  const { error } = await supabase
    .from("programmes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting programme:", error);
    return { 
      success: false, 
      error: error.message || "Gagal memadam programme" 
    };
  }

  // Revalidate cache
  revalidatePath("/programmes");

  return { success: true };
}
