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

import { mapProgrammeRow, type ProgrammeRow } from "@/lib/programme-mapper";

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
  city?: string;
  state?: string;
  trainer?: string;
  trainer_email?: string;
  trainer_phone?: string;
  programme_manager?: string;
  programme_manager_email?: string;
  contracted_amount?: number;
  budget?: number;
  actual_cost?: number;
  status?: ProgrammeStatus;
}


function isDemoMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Dapatkan senarai semua programmes
 */
export async function getProgrammes(): Promise<Programme[]> {
  if (isDemoMode()) {
    const { PROGRAMMES } = await import("@/lib/mock-data");
    return PROGRAMMES;
  }
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
  if (isDemoMode()) {
    const { getProgrammeById: getMock } = await import("@/lib/mock-data");
    return getMock(id) ?? null;
  }
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
  if (isDemoMode()) {
    const { PROGRAMMES } = await import("@/lib/mock-data");
    let result = PROGRAMMES;
    if (query.category) result = result.filter((p) => p.category === query.category);
    if (query.status) result = result.filter((p) => p.status === query.status);
    if (query.year) result = result.filter((p) => p.year === query.year);
    if (query.organizer) result = result.filter((p) => p.client.toLowerCase().includes(query.organizer!.toLowerCase()));
    if (query.searchTerm) {
      const q = query.searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.client.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q),
      );
    }
    return result;
  }
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
  if (isDemoMode()) {
    const { PROGRAMMES } = await import("@/lib/mock-data");
    const programme: Programme = {
      ...PROGRAMMES[0],
      id: `demo-${Date.now()}`,
      code: input.programme_code,
      title: input.title,
      client: input.organizer_name,
      category: input.category,
      mode: input.delivery_mode,
      status: input.status || "draft",
      startDate: input.start_date || "",
      endDate: input.end_date || "",
      venue: input.venue || "",
      trainer: input.trainer || "",
      programmeManager: input.programme_manager || "",
      budget: input.budget ?? 0,
      actualCost: input.actual_cost ?? 0,
      contractedAmount: input.contracted_amount ?? 0,
    };
    return { success: true, programme };
  }
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
      city: input.city,
      state: input.state,
      trainer: input.trainer,
      trainer_email: input.trainer_email,
      trainer_phone: input.trainer_phone,
      programme_manager: input.programme_manager,
      programme_manager_email: input.programme_manager_email,
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
  if (isDemoMode()) {
    const { getProgrammeById: getMock } = await import("@/lib/mock-data");
    const existing = getMock(id);
    if (!existing) return { success: false, error: "Programme tidak ditemui" };
    return {
      success: true,
      programme: { ...existing, ...input, client: input.organizer_name ?? existing.client },
    };
  }
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
  if (isDemoMode()) {
    return { success: true };
  }
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
