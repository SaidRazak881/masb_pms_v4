"use server";

/**
 * financial-actions.ts — Server Actions untuk operasi CRUD financial_docs
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FinancialDoc, FinancialDocType, FinancialDocStatus } from "@/lib/types";

// Type untuk input financial doc
interface FinancialDocInput {
  programme_id: string;
  doc_type: FinancialDocType;
  reference_no: string;
  amount?: number;
  issued_date?: string;
  due_date?: string;
  status?: FinancialDocStatus;
  notes?: string;
  account_manager?: string;
  pic_name?: string;
}

// Type untuk output financial doc (dari Supabase)
interface FinancialDocRow {
  id: string;
  programme_id: string;
  doc_type: FinancialDocType;
  reference_no: string;
  revision: string | null;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  issued_date: string | null;
  due_date: string | null;
  valid_until: string | null;
  status: FinancialDocStatus;
  notes: string | null;
  description: string | null;
  account_manager: string | null;
  account_manager_email: string | null;
  pic_name: string | null;
  pic_email: string | null;
  pic_phone: string | null;
  file_path: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Terjemah baris financial_doc dari Supabase kepada type FinancialDoc
 */
function mapFinancialDocRow(row: FinancialDocRow): FinancialDoc {
  return {
    id: row.id,
    type: row.doc_type,
    reference: row.reference_no,
    issuedDate: row.issued_date || "",
    amount: row.amount,
    status: row.status,
    notes: row.notes || undefined,
  };
}

/**
 * Dapatkan senarai financial docs bagi suatu programme
 */
export async function getFinancialDocs(programmeId: string): Promise<FinancialDoc[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("financial_docs")
    .select("*")
    .eq("programme_id", programmeId)
    .order("issued_date");

  if (error) {
    console.error("Error fetching financial docs:", error);
    return [];
  }

  return (data as FinancialDocRow[]).map(mapFinancialDocRow);
}

/**
 * Dapatkan financial doc mengikut ID
 */
export async function getFinancialDocById(id: string): Promise<FinancialDoc | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("financial_docs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error("Error fetching financial doc:", error);
    return null;
  }

  return mapFinancialDocRow(data as FinancialDocRow);
}

/**
 * Cipta financial doc baharu
 */
export async function createFinancialDoc(input: FinancialDocInput): Promise<{ 
  success: boolean; 
  financialDoc?: FinancialDoc; 
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
    .from("financial_docs")
    .insert({
      programme_id: input.programme_id,
      doc_type: input.doc_type,
      reference_no: input.reference_no,
      amount: input.amount,
      issued_date: input.issued_date,
      due_date: input.due_date,
      status: input.status || "draft",
      notes: input.notes,
      account_manager: input.account_manager,
      pic_name: input.pic_name,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Error creating financial doc:", error);
    return { 
      success: false, 
      error: error.message || "Gagal mencipta financial doc" 
    };
  }

  // Revalidate cache
  revalidatePath("/programmes/" + input.programme_id);

  return { 
    success: true, 
    financialDoc: mapFinancialDocRow(data as FinancialDocRow) 
  };
}

/**
 * Kemaskini financial doc
 */
export async function updateFinancialDoc(
  id: string,
  input: Partial<FinancialDocInput>
): Promise<{ 
  success: boolean; 
  financialDoc?: FinancialDoc; 
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
    .from("financial_docs")
    .update({
      ...input,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Error updating financial doc:", error);
    return { 
      success: false, 
      error: error.message || "Gagal mengemaskini financial doc" 
    };
  }

  // Revalidate cache
  revalidatePath("/programmes/" + input.programme_id);

  return { 
    success: true, 
    financialDoc: data ? mapFinancialDocRow(data as FinancialDocRow) : undefined 
  };
}

/**
 * Padam financial doc
 */
export async function deleteFinancialDoc(id: string): Promise<{ 
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

  // Semak jika financial doc wujud
  const { data: financialDoc, error: fetchError } = await supabase
    .from("financial_docs")
    .select("programme_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !financialDoc) {
    return { success: false, error: "Financial doc tidak ditemui" };
  }

  const { error } = await supabase
    .from("financial_docs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting financial doc:", error);
    return { 
      success: false, 
      error: error.message || "Gagal memadam financial doc" 
    };
  }

  // Revalidate cache
  revalidatePath("/programmes/" + financialDoc.programme_id);

  return { success: true };
}
