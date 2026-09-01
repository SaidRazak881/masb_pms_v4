import { CheckCircle2, Clock, FileText, PlusCircle, Send } from "lucide-react";

import {
  FinancialStatusBadge,
  FINANCIAL_TYPE_LABEL,
} from "@/components/programmes/status-badges";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatMYRShort } from "@/lib/format";
import type { FinancialDoc, Programme } from "@/lib/types";

const TYPE_ICON: Record<FinancialDoc["type"], React.ElementType> = {
  quotation: Send,
  po: FileText,
  invoice: CheckCircle2,
};

export function FinancialTab({ programme }: { programme: Programme }) {
  const docs = programme.financials;
  const paid = docs
    .filter((d) => d.status === "paid")
    .reduce((sum, d) => sum + d.amount, 0);
  const outstanding = programme.contractedAmount - paid;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Nilai Kontrak</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {formatMYRShort(programme.contractedAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Telah Diterima</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600">
              {formatMYRShort(paid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Baki Belum Diterima
            </p>
            <p
              className={`mt-1 text-xl font-bold tabular-nums ${
                outstanding > 0 ? "text-amber-600" : "text-muted-foreground"
              }`}
            >
              {formatMYRShort(outstanding)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">
              Dokumen Kewangan (Quotation / PO / Invoice)
            </CardTitle>
            <CardDescription>
              Jejak kitaran dokumen kewangan daripada sebutharga sehingga
              pembayaran.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled={programme.locked}>
            <PlusCircle className="h-4 w-4" />
            Tambah Dokumen
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {docs.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Belum ada dokumen kewangan. Program ini masih dalam draf.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jenis</TableHead>
                  <TableHead>No. Rujukan</TableHead>
                  <TableHead>Tarikh</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => {
                  const Icon = TYPE_ICON[doc.type];
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <span className="flex items-center gap-2 font-medium">
                          <Icon className="h-4 w-4 text-primary" />
                          {FINANCIAL_TYPE_LABEL[doc.type]}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {doc.reference}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(doc.issuedDate)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatMYRShort(doc.amount)}
                      </TableCell>
                      <TableCell>
                        <FinancialStatusBadge status={doc.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {programme.locked && (
        <p className="text-xs text-muted-foreground">
          Program berkunci: dokumen kewangan baharu tidak boleh ditambah
          sehingga rekod dibuka semula oleh pentadbir.
        </p>
      )}
    </div>
  );
}
