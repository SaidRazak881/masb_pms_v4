"use client";

/**
 * ChangeRequestDialog — borang permohonan ubah data untuk program terkunci.
 *
 * Dipaparkan kepada staff apabila program dalam keadaan `locked`. Staff
 * memilih medan, mengisi nilai lama/nilai baharu dan sebab. Permohonan
 * dihantar kepada Head Governance untuk kelulusan.
 */

import * as React from "react";
import { CheckCircle2, FilePenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CHANGE_REQUEST_FIELDS,
  MAX_REASON_LENGTH,
} from "@/lib/change-requests";
import { submitChangeRequestAction } from "@/lib/change-request-actions";

interface ChangeRequestDialogProps {
  programmeId: string;
  programmeCode?: string;
  disabled?: boolean;
}

export function ChangeRequestDialog({
  programmeId,
  programmeCode,
  disabled = false,
}: ChangeRequestDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [fieldName, setFieldName] = React.useState("");
  const [oldValue, setOldValue] = React.useState("");
  const [newValue, setNewValue] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [documentUrl, setDocumentUrl] = React.useState("");
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});
    setNotice(null);

    const formData = new FormData();
    formData.set("programmeId", programmeId);
    formData.set("fieldName", fieldName);
    formData.set("oldValue", oldValue);
    formData.set("newValue", newValue);
    formData.set("reason", reason);
    formData.set("supportingDocumentUrl", documentUrl);

    const result = await submitChangeRequestAction(formData);
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      return;
    }

    setNotice(result.message);
    setFieldName("");
    setOldValue("");
    setNewValue("");
    setReason("");
    setDocumentUrl("");
    // Tutup dialog selepas jeda supaya mesej kejayaan dapat dilihat.
    setTimeout(() => setOpen(false), 900);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <FilePenLine className="mr-2 h-4 w-4" />
          Mohon Ubah Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mohon Ubah Data — {programmeCode}</DialogTitle>
          <DialogDescription>
            Program ini dikunci oleh Head Governance. Hantar permohonan
            perubahan medan tertentu; kelulusan diperlukan sebelum data
            dikemas kini. Setiap keputusan direkod dalam audit log.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cr-field">Medan yang ingin diubah *</Label>
            <Select value={fieldName} onValueChange={setFieldName}>
              <SelectTrigger id="cr-field">
                <SelectValue placeholder="Pilih medan…" />
              </SelectTrigger>
              <SelectContent>
                {CHANGE_REQUEST_FIELDS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.fieldName && (
              <p className="text-xs text-rose-600">{fieldErrors.fieldName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cr-old">Nilai lama</Label>
              <Input
                id="cr-old"
                placeholder="Nilai semasa dalam sistem"
                value={oldValue}
                onChange={(e) => setOldValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cr-new">Nilai baharu</Label>
              <Input
                id="cr-new"
                placeholder="Nilai cadangan"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>
          </div>
          {fieldErrors.newValue && (
            <p className="text-xs text-rose-600">{fieldErrors.newValue}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="cr-reason">Sebab permohonan *</Label>
            <textarea
              id="cr-reason"
              className="flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Terangkan sebab perubahan (minimum 10 aksara)…"
              value={reason}
              maxLength={MAX_REASON_LENGTH}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">
              {reason.length}/{MAX_REASON_LENGTH}
            </p>
            {fieldErrors.reason && (
              <p className="text-xs text-rose-600">{fieldErrors.reason}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cr-doc">Dokumen sokongan (URL, jika ada)</Label>
            <Input
              id="cr-doc"
              placeholder="https://… / laluan fail dalam Supabase Storage"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Disarankan untuk perubahan kewangan (cth. invois semakan).
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </div>
          )}
          {notice && (
            <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menghantar…" : "Hantar Permohonan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
