"use client";

/**
 * ChangeRequestHistory — sejarah permohonan ubah data bagi satu program.
 *
 * Memaparkan senarai lengkap (pending / approved / rejected / cancelled /
 * applied) dengan nilai lama → baharu, pemohon, pengesah dan nota semakan.
 */

import { FilePenLine } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import {
  changeRequestStatusLabel,
  type ChangeRequest,
  type ChangeRequestStatus,
} from "@/lib/change-requests";

const STATUS_TONE: Record<ChangeRequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  approved: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  rejected: "bg-rose-100 text-rose-800 hover:bg-rose-100",
  cancelled: "bg-slate-200 text-slate-600 hover:bg-slate-200",
  applied: "bg-sky-100 text-sky-800 hover:bg-sky-100",
};

interface ChangeRequestHistoryProps {
  requests: ChangeRequest[];
}

export function ChangeRequestHistory({ requests }: ChangeRequestHistoryProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-muted-foreground">
        <FilePenLine className="mx-auto mb-2 h-6 w-6" />
        Tiada permohonan ubah data untuk program ini.
        <p className="mt-1 text-xs">
          Apabila program dikunci, staff boleh menghantar permohonan melalui
          butang “Mohon Ubah Data”.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarikh</TableHead>
            <TableHead>Medan</TableHead>
            <TableHead>Nilai Lama → Baharu</TableHead>
            <TableHead>Pemohon</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Semakan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap text-xs">
                {formatDateTime(r.requestedAt)}
              </TableCell>
              <TableCell className="text-sm font-medium">
                {r.fieldLabel}
              </TableCell>
              <TableCell className="max-w-[260px] text-xs">
                <span className="text-slate-500">{r.oldValue || "—"}</span>
                <span className="mx-1 text-muted-foreground">→</span>
                <span className="font-medium text-emerald-700">
                  {r.newValue || "—"}
                </span>
                {r.supportingDocumentUrl && (
                  <span className="block text-[10px] text-muted-foreground">
                    <a
                      href={r.supportingDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Dokumen sokongan
                    </a>
                  </span>
                )}
              </TableCell>
              <TableCell className="text-xs">
                {r.requestedByName ?? "Pengguna"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={STATUS_TONE[r.status]}>
                  {changeRequestStatusLabel(r.status)}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                {r.reviewedByName ? (
                  <>
                    <span>{r.reviewedByName}</span>
                    {r.reviewedAt && (
                      <span className="block">{formatDateTime(r.reviewedAt)}</span>
                    )}
                    {r.reviewNote && (
                      <span className="mt-0.5 block italic">“{r.reviewNote}”</span>
                    )}
                  </>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
