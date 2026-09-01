"use client";

/**
 * ChangeRequestInbox — kad kelulusan permohonan ubah data untuk
 * Head Governance / Admin / Manager.
 *
 * Memaparkan permohonan pending dengan perbandingan nilai lama vs baharu,
 * butang Lulus / Tolak dan ruang nota semakan. Tanpa self-approval.
 */

import * as React from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { ChangeRequest } from "@/lib/change-requests";
import { reviewChangeRequestAction } from "@/lib/change-request-actions";

interface ChangeRequestInboxProps {
  requests: ChangeRequest[];
  /** ID pengguna semasa — untuk pengasingan tugas (no self-approval). */
  currentUserId: string;
  canReview: boolean;
}

export function ChangeRequestInbox({
  requests,
  currentUserId,
  canReview,
}: ChangeRequestInboxProps) {
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState<Record<string, string>>({});

  const pendingRequests = requests.filter((r) => r.status === "pending");

  if (pendingRequests.length === 0) return null;

  async function handleReview(requestId: string, approve: boolean) {
    setPendingId(requestId);
    setNotice(null);
    setError(null);

    const formData = new FormData();
    formData.set("requestId", requestId);
    formData.set("programmeId", pendingRequests.find((r) => r.id === requestId)?.programmeId ?? "");
    formData.set("approve", String(approve));
    formData.set("reviewNote", notes[requestId] ?? "");

    const result = await reviewChangeRequestAction(formData);
    setPendingId(null);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setNotice(result.message);
    setNotes((n) => ({ ...n, [requestId]: "" }));
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
          <Clock className="h-4 w-4" />
          Permohonan Ubah Data Menunggu Kelulusan ({pendingRequests.length})
        </div>

        {notice && (
          <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}
        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </div>
        )}

        {pendingRequests.map((r) => {
          const isOwnRequest = r.requestedBy === currentUserId;
          return (
            <div key={r.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{r.fieldLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    Dimohon oleh {r.requestedByName ?? "Pengguna"} ·{" "}
                    {formatDateTime(r.requestedAt)}
                  </p>
                </div>
                {isOwnRequest && (
                  <Badge variant="outline" className="bg-slate-100 text-slate-600">
                    Permohonan sendiri
                  </Badge>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-[11px] font-medium uppercase text-muted-foreground">
                    Nilai Lama
                  </p>
                  <p className="mt-1 text-sm">{r.oldValue || "—"}</p>
                </div>
                <div className="rounded-md bg-emerald-50 p-3">
                  <p className="text-[11px] font-medium uppercase text-emerald-700">
                    Nilai Baharu
                  </p>
                  <p className="mt-1 text-sm">{r.newValue || "—"}</p>
                </div>
              </div>

              <div className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="text-[11px] font-medium uppercase text-muted-foreground">
                  Sebab
                </p>
                <p className="mt-1">{r.reason}</p>
              </div>

              {r.supportingDocumentUrl && (
                <p className="text-xs text-muted-foreground">
                  Dokumen sokongan:{" "}
                  <a
                    href={r.supportingDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    {r.supportingDocumentUrl}
                  </a>
                </p>
              )}

              {canReview ? (
                <div className="space-y-2">
                  <textarea
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Nota semakan (pilihan)…"
                    value={notes[r.id] ?? ""}
                    onChange={(e) =>
                      setNotes((n) => ({ ...n, [r.id]: e.target.value }))
                    }
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pendingId === r.id || isOwnRequest}
                      onClick={() => handleReview(r.id, false)}
                      title={
                        isOwnRequest
                          ? "Pemohon tidak boleh meluluskan permohonan sendiri"
                          : "Tolak permohonan"
                      }
                    >
                      <XCircle className="mr-1.5 h-4 w-4" />
                      Tolak
                    </Button>
                    <Button
                      size="sm"
                      disabled={pendingId === r.id || isOwnRequest}
                      onClick={() => handleReview(r.id, true)}
                      title={
                        isOwnRequest
                          ? "Pemohon tidak boleh meluluskan permohonan sendiri"
                          : "Luluskan permohonan"
                      }
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      {pendingId === r.id ? "Memproses…" : "Lulus"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Menunggu semakan Head Governance.
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
