"use client";

/**
 * UnlockRequestHistory — sejarah permohonan buka kunci bagi satu program
 * (Langkah 5). Ini adalah bukti tadbir urus untuk juruaudit.
 */

import { History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import {
  UNLOCK_STATUS_LABEL,
  UNLOCK_STATUS_VARIANT,
  effectiveStatus,
  scopeLabel,
  type UnlockRequest,
} from "@/lib/governance";

export function UnlockRequestHistory({
  requests,
}: {
  requests: UnlockRequest[];
}) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Sejarah Permohonan Buka Kunci
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tiada permohonan buka kunci direkodkan bagi program ini.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...requests].sort(
    (a, b) =>
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Sejarah Permohonan Buka Kunci ({sorted.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((request) => {
          const status = effectiveStatus(request);
          return (
            <div
              key={request.id}
              className="rounded-lg border p-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{request.requestedByName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(request.requestedAt)}
                  </span>
                </div>
                <Badge variant={UNLOCK_STATUS_VARIANT[status]}>
                  {UNLOCK_STATUS_LABEL[status]}
                </Badge>
              </div>

              <p className="mt-2 leading-relaxed text-muted-foreground">
                {request.reason}
              </p>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {request.scope.map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px]">
                    {scopeLabel(s)}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-[10px]">
                  {request.requestedHours} jam
                </Badge>
              </div>

              {request.reviewedAt && (
                <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
                  Disemak oleh {request.reviewedByName ?? "—"} pada{" "}
                  {formatDateTime(request.reviewedAt)}
                  {request.reviewNote ? ` — “${request.reviewNote}”` : ""}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
