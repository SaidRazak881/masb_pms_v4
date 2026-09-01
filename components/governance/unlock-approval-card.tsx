"use client";

/**
 * UnlockApprovalCard — panel semakan permohonan bagi Pengurus/Pentadbir
 * (Langkah 5).
 *
 * Menguatkuasakan pengasingan tugas di UI: butang kelulusan dilumpuhkan jika
 * penyemak adalah pemohon sendiri. Pelayan menguatkuasakan perkara sama.
 */

import * as React from "react";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";
import {
  canReviewRequest,
  scopeLabel,
  type GovernanceRole,
  type UnlockRequest,
} from "@/lib/governance";
import { reviewUnlockAction } from "@/lib/governance-actions";

const HOUR_OPTIONS = [4, 8, 24, 48, 72];

export interface UnlockApprovalCardProps {
  request: UnlockRequest;
  reviewerId: string;
  reviewerRole: GovernanceRole;
  onReviewed?: (message: string) => void;
}

export function UnlockApprovalCard({
  request,
  reviewerId,
  reviewerRole,
  onReviewed,
}: UnlockApprovalCardProps) {
  const [note, setNote] = React.useState("");
  const [hours, setHours] = React.useState(String(request.requestedHours));
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const check = canReviewRequest({ request, reviewerId, reviewerRole });

  function submit(decision: "approve" | "reject") {
    setError(null);
    if (!check.allowed) {
      setError(check.message ?? "Tindakan tidak dibenarkan.");
      return;
    }
    if (decision === "reject" && note.trim().length < 10) {
      setError("Sila nyatakan sebab penolakan (sekurang-kurangnya 10 aksara).");
      return;
    }

    const formData = new FormData();
    formData.set("requestId", request.id);
    formData.set("programmeId", request.programmeId);
    formData.set("decision", decision);
    formData.set("reviewNote", note.trim());
    formData.set("grantedHours", hours);

    startTransition(async () => {
      const result = await reviewUnlockAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onReviewed?.(result.message);
    });
  }

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              Semakan Permohonan Buka Kunci
            </CardTitle>
            <CardDescription>
              {request.requestedByName} ·{" "}
              {formatDateTime(request.requestedAt)}
            </CardDescription>
          </div>
          <Badge variant="warning">Menunggu Kelulusan</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Skop dipohon
          </p>
          <div className="flex flex-wrap gap-1.5">
            {request.scope.map((s) => (
              <Badge key={s} variant="outline">
                {scopeLabel(s)}
              </Badge>
            ))}
            <Badge variant="info">{request.requestedHours} jam</Badge>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Justifikasi pemohon
          </p>
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm leading-relaxed">
            {request.reason}
          </p>
        </div>

        {!check.allowed ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {check.message}
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`hours-${request.id}`}>
                  Tempoh diluluskan
                </Label>
                <Select value={hours} onValueChange={setHours}>
                  <SelectTrigger id={`hours-${request.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUR_OPTIONS.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {h} jam
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`note-${request.id}`}>
                Catatan penyemak{" "}
                <span className="text-muted-foreground">
                  (wajib jika menolak)
                </span>
              </Label>
              <textarea
                id={`note-${request.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Catatan ringkas untuk jejak audit…"
              />
            </div>

            {error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => submit("approve")} disabled={pending}>
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Luluskan
              </Button>
              <Button
                variant="destructive"
                onClick={() => submit("reject")}
                disabled={pending}
              >
                <X className="h-4 w-4" />
                Tolak
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
