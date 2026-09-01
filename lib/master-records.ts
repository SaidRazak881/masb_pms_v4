import type { MasterProgrammeLike, MasterRecords } from "@/lib/excel-parser";
import { PROGRAMMES } from "@/lib/mock-data";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draf",
  active: "Aktif",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  on_hold: "Ditangguh",
};

const MODE_LABEL: Record<string, string> = {
  in_person: "Bersemuka",
  online: "Dalam Talian",
  hybrid: "Hibrid",
};

/**
 * Bina "rekod induk" daripada data program sedia ada untuk digunakan oleh
 * enjin pengesanan pendua parser Excel. Apabila Supabase disambungkan,
 * fungsi ini digantikan dengan query `select()` ke jadual
 * `programmes` + `financial_docs`.
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

export { STATUS_LABEL, MODE_LABEL };
