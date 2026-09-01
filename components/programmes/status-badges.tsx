import { Badge } from "@/components/ui/badge";
import type {
  BumiStatus,
  FinancialDocStatus,
  FinancialDocType,
  ProgrammeStatus,
  TrainingMode,
} from "@/lib/types";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info";

/* ------------------------- Status program ------------------------- */

const PROGRAMME_STATUS_MAP: Record<
  ProgrammeStatus,
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: "Draf", variant: "secondary" },
  active: { label: "Aktif", variant: "info" },
  completed: { label: "Selesai", variant: "success" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
  on_hold: { label: "Ditangguh", variant: "warning" },
};

export function ProgrammeStatusBadge({ status }: { status: ProgrammeStatus }) {
  const map = PROGRAMME_STATUS_MAP[status];
  return <Badge variant={map.variant}>{map.label}</Badge>;
}

/* --------------------------- Mod latihan -------------------------- */

const MODE_LABEL: Record<TrainingMode, string> = {
  in_person: "Bersemuka",
  online: "Dalam Talian",
  hybrid: "Hibrid",
};

export function ModeBadge({ mode }: { mode: TrainingMode }) {
  return <Badge variant="outline">{MODE_LABEL[mode]}</Badge>;
}

/* ------------------------ Status dokumen kewangan ------------------ */

const FINANCIAL_STATUS_MAP: Record<
  FinancialDocStatus,
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: "Draf", variant: "secondary" },
  sent: { label: "Dihantar", variant: "info" },
  accepted: { label: "Diterima", variant: "success" },
  invoiced: { label: "Telah Diinvois", variant: "info" },
  paid: { label: "Dibayar", variant: "success" },
  overdue: { label: "Tertunggak", variant: "destructive" },
};

export function FinancialStatusBadge({ status }: { status: FinancialDocStatus }) {
  const map = FINANCIAL_STATUS_MAP[status];
  return <Badge variant={map.variant}>{map.label}</Badge>;
}

export const FINANCIAL_TYPE_LABEL: Record<FinancialDocType, string> = {
  quotation: "Sebutharga (Quotation)",
  po: "Pesanan Belian (PO)",
  invoice: "Invois",
};

/* ------------------------ Status Bumiputera ------------------------ */

export function BumiBadge({ status }: { status: BumiStatus }) {
  if (status === "bumiputera") {
    return <Badge variant="success">Bumiputera</Badge>;
  }
  if (status === "non_bumiputera") {
    return <Badge variant="secondary">Bukan Bumiputera</Badge>;
  }
  return <Badge variant="warning">Belum Disahkan</Badge>;
}
