"use client";

/**
 * RequestUnlockDialog — borang permohonan buka kunci (Langkah 5).
 *
 * Pengesahan menggunakan `validateUnlockRequest` daripada lib/governance.ts —
 * peraturan yang SAMA digunakan semula di pelayan, jadi maklum balas klien
 * sentiasa selari dengan penguatkuasaan sebenar.
 */

import * as React from "react";
import { LockOpen, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DEFAULT_UNLOCK_HOURS,
  MAX_REASON_LENGTH,
  MIN_REASON_LENGTH,
  UNLOCK_SCOPES,
  validateUnlockRequest,
  type ValidationResult,
} from "@/lib/governance";
import { requestUnlockAction } from "@/lib/governance-actions";

const HOUR_OPTIONS = [4, 8, 24, 48, 72];

export interface RequestUnlockDialogProps {
  programmeId: string;
  programmeCode?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: (message: string) => void;
}

export function RequestUnlockDialog({
  programmeId,
  programmeCode,
  open,
  onOpenChange,
  onSubmitted,
}: RequestUnlockDialogProps) {
  const [reason, setReason] = React.useState("");
  const [scope, setScope] = React.useState<string[]>([]);
  const [hours, setHours] = React.useState(String(DEFAULT_UNLOCK_HOURS));
  const [errors, setErrors] = React.useState<ValidationResult["errors"]>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!open) {
      setReason("");
      setScope([]);
      setHours(String(DEFAULT_UNLOCK_HOURS));
      setErrors({});
      setServerError(null);
    }
  }, [open]);

  function toggleScope(value: string) {
    setScope((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const input = {
      programmeId,
      reason,
      scope,
      requestedHours: Number(hours),
    };
    const check = validateUnlockRequest(input);
    setErrors(check.errors);
    if (!check.valid) return;

    const formData = new FormData();
    formData.set("programmeId", programmeId);
    formData.set("reason", reason.trim());
    formData.set("requestedHours", hours);
    scope.forEach((s) => formData.append("scope", s));

    startTransition(async () => {
      const result = await requestUnlockAction(formData);
      if (!result.ok) {
        setServerError(result.message);
        if (result.fieldErrors) setErrors(result.fieldErrors);
        return;
      }
      onSubmitted?.(result.message);
      onOpenChange(false);
    });
  }

  const reasonLength = reason.trim().length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockOpen className="h-4 w-4" />
            Permohonan Buka Kunci
          </DialogTitle>
          <DialogDescription>
            Program {programmeCode ?? programmeId} adalah rekod audit.
            Nyatakan justifikasi yang jelas — permohonan ini direkodkan dalam
            jejak audit dan perlu diluluskan oleh Pengurus.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Skop suntingan */}
          <div className="space-y-2">
            <Label>Bahagian yang perlu disunting</Label>
            <div className="flex flex-wrap gap-2">
              {UNLOCK_SCOPES.map((item) => {
                const active = scope.includes(item.value);
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleScope(item.value)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-accent",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            {errors.scope && (
              <p className="text-xs text-destructive">{errors.scope}</p>
            )}
          </div>

          {/* Justifikasi */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="unlock-reason">Justifikasi</Label>
              <span
                className={cn(
                  "text-xs",
                  reasonLength < MIN_REASON_LENGTH
                    ? "text-muted-foreground"
                    : "text-emerald-600",
                )}
              >
                {reasonLength}/{MAX_REASON_LENGTH}
              </span>
            </div>
            <textarea
              id="unlock-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={MAX_REASON_LENGTH}
              placeholder="Contoh: Invois INV-2025-014 tersalah jumlah RM 1,200. Perlu pembetulan sebelum tuntutan akhir kepada pelanggan."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {errors.reason && (
              <p className="text-xs text-destructive">{errors.reason}</p>
            )}
          </div>

          {/* Tempoh */}
          <div className="space-y-2">
            <Label htmlFor="unlock-hours">Tempoh suntingan dipohon</Label>
            <Select value={hours} onValueChange={setHours}>
              <SelectTrigger id="unlock-hours">
                <SelectValue placeholder="Pilih tempoh" />
              </SelectTrigger>
              <SelectContent>
                {HOUR_OPTIONS.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {h} jam
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.requestedHours && (
              <p className="text-xs text-destructive">{errors.requestedHours}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {serverError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Hantar Permohonan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
