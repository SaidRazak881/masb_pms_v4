import type { MasterProgrammeLike, MasterRecords } from "@/lib/excel-parser";
import { PROGRAMMES } from "@/lib/mock-data";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draf",
  active: "Aktif",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  on_hold: "Ditangguh",
  unlocked: "Tidak Dikunci",
  locked: "Dikunci (Governance)",
};

const MODE_LABEL: Record<string, string> = {
  in_person: "Bersemuka",
  physical: "Bersemuka",
  online: "Dalam Talian",
  hybrid: "Hibrid",
};

/**
 * Bina "rekod induk" daripada data mock untuk digunakan oleh enjin
 * pengesanan pendua parser Excel. Digunakan sebagai sandaran apabila
 * Supabase belum dikonfigurasikan (mod demo).
 */
export function getMasterRecords(): MasterRecords {
  const programmes: MasterProgrammeLike[] = PROGRAMMES.map((p) => ({
    id: p.id,
    title: p.title,
    client: p.client,
    code: p.code,
    codeLabel: p.code,
    status: p.status,
    statusLabel: STATUS_LABEL[p.status] ?? p.status,
    year: p.year,
    contractedAmount: p.contractedAmount,
    category: p.category,
    trainer: p.trainer,
  }));

  const quotationRefs = PROGRAMMES.flatMap((p) =>
    p.financials
      .filter((f) => f.type === "quotation")
      .map((f) => f.reference),
  );
  const invoiceRefs = PROGRAMMES.flatMap((p) =>
    p.financials
      .filter((f) => f.type === "invoice")
      .map((f) => f.reference),
  );

  return { programmes, quotationRefs, invoiceRefs };
}

/* ------------------------------------------------------------------ */
/* Rekod induk sebenar daripada Supabase                               */
/* ------------------------------------------------------------------ */

/** Baris `programmes` yang diperlukan untuk pengesanan pendua. */
interface ProgrammeRow {
  id: string;
  programme_code: string | null;
  title: string;
  organizer_name: string | null;
  category: string | null;
  delivery_mode: string | null;
  start_date: string | null;
  governance_lock_status: string | null;
}

/** Baris `invoices` yang membekalkan rujukan + nilai kontrak. */
interface InvoiceRow {
  programme_id: string | null;
  quotation_no: string | null;
  invoice_no: string | null;
  po_value_excl_tax: number | null;
  invoice_value_excl_tax: number | null;
}

export interface MasterRecordsResult {
  master: MasterRecords;
  /** `true` apabila data datang daripada Supabase, bukan mock. */
  live: boolean;
  /** Diisi apabila query Supabase gagal dan sandaran mock digunakan. */
  error: string | null;
}

function yearOf(date: string | null): number {
  if (!date) return new Date().getFullYear();
  const parsed = Number(date.slice(0, 4));
  return Number.isFinite(parsed) && parsed > 1900
    ? parsed
    : new Date().getFullYear();
}

/**
 * Ambil rekod induk sebenar daripada Supabase (`programmes` + `invoices`)
 * supaya pengesanan pendua parser membandingkan fail Excel dengan data
 * pengeluaran, bukan data mock.
 *
 * Penting untuk Langkah 4.5: `matchId` program di sini ialah UUID sebenar,
 * jadi tindakan **Merge** boleh dihantar sebagai `duplicateMatchId` yang sah
 * kepada `/api/import/sync` (RPC menolak nilai bukan-UUID).
 *
 * Jika env Supabase tiada atau query gagal, fungsi ini kembali kepada
 * `getMasterRecords()` supaya UI import kekal berfungsi dalam mod demo.
 */
export async function fetchMasterRecords(): Promise<MasterRecordsResult> {
  const configured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!configured) {
    return { master: getMasterRecords(), live: false, error: null };
  }

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const [programmesResult, invoicesResult] = await Promise.all([
      supabase
        .from("programmes")
        .select(
          "id, programme_code, title, organizer_name, category, delivery_mode, start_date, governance_lock_status",
        )
        .limit(2000),
      supabase
        .from("invoices")
        .select(
          "programme_id, quotation_no, invoice_no, po_value_excl_tax, invoice_value_excl_tax",
        )
        .limit(5000),
    ]);

    if (programmesResult.error) throw new Error(programmesResult.error.message);
    if (invoicesResult.error) throw new Error(invoicesResult.error.message);

    const programmeRows = (programmesResult.data ?? []) as ProgrammeRow[];
    const invoiceRows = (invoicesResult.data ?? []) as InvoiceRow[];

    // Nilai kontrak = jumlah nilai PO/invois setiap program, untuk paparan
    // sisi-bersisi dalam dialog perbandingan pendua.
    const contracted = new Map<string, number>();
    for (const inv of invoiceRows) {
      if (!inv.programme_id) continue;
      const value = inv.invoice_value_excl_tax ?? inv.po_value_excl_tax ?? 0;
      contracted.set(
        inv.programme_id,
        (contracted.get(inv.programme_id) ?? 0) + Number(value || 0),
      );
    }

    const programmes: MasterProgrammeLike[] = programmeRows.map((p) => {
      const status = p.governance_lock_status ?? "unlocked";
      return {
        id: p.id,
        title: p.title ?? "",
        client: p.organizer_name ?? "",
        code: p.programme_code ?? p.id.slice(0, 8),
        codeLabel: p.programme_code ?? p.id.slice(0, 8),
        status,
        statusLabel: STATUS_LABEL[status] ?? status,
        year: yearOf(p.start_date),
        contractedAmount: contracted.get(p.id) ?? 0,
        category: p.category ?? "",
        trainer: "",
      };
    });

    const quotationRefs = invoiceRows
      .map((i) => i.quotation_no)
      .filter((ref): ref is string => Boolean(ref && ref.trim()));

    const invoiceRefs = invoiceRows
      .map((i) => i.invoice_no)
      .filter((ref): ref is string => Boolean(ref && ref.trim()));

    return {
      master: { programmes, quotationRefs, invoiceRefs },
      live: true,
      error: null,
    };
  } catch (error) {
    return {
      master: getMasterRecords(),
      live: false,
      error:
        error instanceof Error
          ? error.message
          : "Rekod induk Supabase tidak dapat dibaca.",
    };
  }
}

export { STATUS_LABEL, MODE_LABEL };
