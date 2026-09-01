import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMYRShort } from "@/lib/format";
import type { Programme } from "@/lib/types";

export function CostsTab({ programme }: { programme: Programme }) {
  const totalBudget = programme.costs.reduce((s, c) => s + c.budgeted, 0);
  const totalActual = programme.costs.reduce((s, c) => s + c.actual, 0);
  const variance = totalActual - totalBudget;
  const overBudget = variance > 0;

  return (
    <div className="space-y-6">
      {/* Ringkasan */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Jumlah Bajet</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {formatMYRShort(totalBudget)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Belanja Sebenar</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {formatMYRShort(totalActual)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {overBudget ? (
                <TrendingUp className="h-3.5 w-3.5 text-red-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
              )}
              Varians (Sebenar − Bajet)
            </p>
            <p
              className={`mt-1 text-xl font-bold tabular-nums ${
                overBudget ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {overBudget ? "+" : "−"}
              {formatMYRShort(Math.abs(variance))}
            </p>
          </CardContent>
        </Card>
      </div>

      {overBudget && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Perhatian: belanja sebenar melebihi bajet sebanyak{" "}
              <strong>{formatMYRShort(variance)}</strong>. Sila semak item kos
              yang bertanda merah dan kemukakan justifikasi kepada unit
              kewangan sebelum program dikunci.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pecahan kos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pecahan Kos Mengikut Kategori</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori Kos</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Bajet (RM)</TableHead>
                <TableHead className="text-right">Sebenar (RM)</TableHead>
                <TableHead className="text-right">Varians</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programme.costs.map((cost) => {
                const diff = cost.actual - cost.budgeted;
                const over = diff > 0;
                const pct = cost.budgeted
                  ? Math.round((cost.actual / cost.budgeted) * 100)
                  : 0;
                return (
                  <TableRow key={cost.id}>
                    <TableCell className="font-medium">{cost.category}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {cost.description}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMYRShort(cost.budgeted)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {cost.actual > 0
                        ? formatMYRShort(cost.actual)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {cost.actual > 0 ? (
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-medium tabular-nums ${
                            over ? "text-red-600" : "text-emerald-600"
                          }`}
                        >
                          {over ? (
                            <TrendingUp className="h-3.5 w-3.5" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5" />
                          )}
                          {over ? "+" : "−"}
                          {formatMYRShort(Math.abs(diff))}
                          <span className="text-xs text-muted-foreground">
                            ({pct}%)
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Belum dibelanja
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">
                  Jumlah
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatMYRShort(totalBudget)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatMYRShort(totalActual)}
                </TableCell>
                <TableCell
                  className={`text-right font-semibold tabular-nums ${
                    overBudget ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {overBudget ? "+" : "−"}
                  {formatMYRShort(Math.abs(variance))}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
