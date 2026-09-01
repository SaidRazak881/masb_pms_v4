"use server";

/**
 * participant-actions.ts — Server Actions untuk operasi CRUD participants
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Participant, BumiStatus, ParticipantStatus } from "@/lib/types";

// Type untuk input participant
interface ParticipantInput {
  programme_id: string;
  name: string;
  email?: string;
  organisation?: string;
  designation?: string;
  bumi_status?: BumiStatus;
  attendance?: number;
  status?: ParticipantStatus;
  certificate_issued?: boolean;
}

// Type untuk output participant (dari Supabase)
interface ParticipantRow {
  id: string;
  programme_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  organisation: string | null;
  designation: string | null;
  department: string | null;
  bumi_status: BumiStatus;
  bumi_verified: boolean;
  attendance: number;
  status: ParticipantStatus;
  certificate_issued: boolean;
  certificate_issue_date: string | null;
  assessment_score: number | null;
  assessment_feedback: string | null;
  payment_status: string | null;
  payment_amount: number | null;
  payment_date: string | null;
  payment_reference: string | null;
  notes: string | null;
  registration_date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Terjemah baris participant dari Supabase kepada type Participant
 */
function mapParticipantRow(row: ParticipantRow): Participant {
  return {
    id: row.id,
    name: row.name,
    email: row.email || "",
    organisation: row.organisation || "",
    designation: row.designation || "",
    bumiStatus: row.bumi_status,
    attendance: row.attendance,
    status: row.status,
    certificateIssued: row.certificate_issued,
  };
}

/**
 * Dapatkan senarai participants bagi suatu programme
 */
export async function getParticipants(programmeId: string): Promise<Participant[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("programme_id", programmeId)
    .order("name");

  if (error) {
    console.error("Error fetching participants:", error);
    return [];
  }

  return (data as ParticipantRow[]).map(mapParticipantRow);
}

/**
 * Dapatkan participant mengikut ID
 */
export async function getParticipantById(id: string): Promise<Participant | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error("Error fetching participant:", error);
    return null;
  }

  return mapParticipantRow(data as ParticipantRow);
}

/**
 * Cipta participant baharu
 */
export async function createParticipant(input: ParticipantInput): Promise<{ 
  success: boolean; 
  participant?: Participant; 
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
    .from("participants")
    .insert({
      programme_id: input.programme_id,
      name: input.name,
      email: input.email,
      organisation: input.organisation,
      designation: input.designation,
      bumi_status: input.bumi_status || "pending",
      attendance: input.attendance || 0,
      status: input.status || "registered",
      certificate_issued: input.certificate_issued || false,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Error creating participant:", error);
    return { 
      success: false, 
      error: error.message || "Gagal mencipta participant" 
    };
  }

  // Revalidate cache
  revalidatePath("/programmes/" + input.programme_id);

  return { 
    success: true, 
    participant: mapParticipantRow(data as ParticipantRow) 
  };
}

/**
 * Kemaskini participant
 */
export async function updateParticipant(
  id: string,
  input: Partial<ParticipantInput>
): Promise<{ 
  success: boolean; 
  participant?: Participant; 
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
    .from("participants")
    .update({
      ...input,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Error updating participant:", error);
    return { 
      success: false, 
      error: error.message || "Gagal mengemaskini participant" 
    };
  }

  // Revalidate cache
  revalidatePath("/programmes/" + input.programme_id);

  return { 
    success: true, 
    participant: data ? mapParticipantRow(data as ParticipantRow) : undefined 
  };
}

/**
 * Padam participant
 */
export async function deleteParticipant(id: string): Promise<{ 
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

  // Semak jika participant wujud
  const { data: participant, error: fetchError } = await supabase
    .from("participants")
    .select("programme_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !participant) {
    return { success: false, error: "Participant tidak ditemui" };
  }

  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting participant:", error);
    return { 
      success: false, 
      error: error.message || "Gagal memadam participant" 
    };
  }

  // Revalidate cache
  revalidatePath("/programmes/" + participant.programme_id);

  return { success: true };
}
