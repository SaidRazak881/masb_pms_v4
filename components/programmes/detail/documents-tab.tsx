"use client";

import { Download, FileSpreadsheet, FileText, Paperclip, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { Programme } from "@/lib/types";

export function DocumentsTab({ programme }: { programme: Programme }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">
          Dokumen Program ({programme.documents.length})
        </CardTitle>
        <Button variant="outline" size="sm" disabled={programme.locked}>
          <Upload className="h-4 w-4" />
          Muat Naik Dokumen
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Fail</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Dikemas Oleh</TableHead>
              <TableHead>Tarikh</TableHead>
              <TableHead className="text-right">Saiz</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programme.documents.map((doc) => {
              const isSheet = doc.name.endsWith(".xlsx");
              return (
                <TableRow key={doc.id}>
                  <TableCell>
                    <span className="flex items-center gap-2.5 font-medium">
                      {isSheet ? (
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary" />
                      )}
                      <span className="max-w-[280px] truncate">{doc.name}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {doc.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{doc.uploadedBy}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDate(doc.uploadedAt)}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                    {doc.sizeKb >= 1024
                      ? `${(doc.sizeKb / 1024).toFixed(1)} MB`
                      : `${doc.sizeKb} KB`}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" aria-label="Muat turun">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex items-center gap-2 border-t border-dashed p-4 text-xs text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" />
          Sokongan: PDF, Excel (.xlsx), Word (.docx) — had 10 MB setiap fail.
          {programme.locked && " Muat naik dilumpuhkan kerana program berkunci."}
        </div>
      </CardContent>
    </Card>
  );
}
