"use client";

/**
 * LockProgrammeButton — butang "Kunci Program" (Head Governance / Pentadbir /
 * Pengurus). Membuka dialog ringkas untuk memilih sebab kunci, kemudian
 * memanggil server action `lockProgrammeAction` (RPC `lock_programme`).
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lockProgrammeAction } from "@/lib/governance-actions";
import { LOCK_REASON_LABEL, type LockReason } from "@/lib/governance";

const REASONS: LockReason[] = [
  "manual",
  "programme_completed",
  "financial_closed",
  "audit_period",
];

export interface LockProgrammeButtonProps {
  programmeId: string;
  programmeCode?: string;
}

export function LockProgrammeButton({
  programmeId,
  programmeCode,
}: LockProgrammeButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<LockReason>("manual");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  function submit() {
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.set("programmeId", programmeId);
    formData.set("lockReason", reason);

    startTransition(async () => {
      const result = await lockProgrammeAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage(result.message);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Lock className="h-4 w-4" />
          Kunci Program
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kunci Program</DialogTitle>
          <DialogDescription>
            {programmeCode
              ? `${programmeCode} — rekod ini akan dikunci sebagai bukti audit.`
              : "Rekod ini akan dikunci sebagai bukti audit."}{" "}
            Tiada sesiapa (termasuk Admin) boleh menyunting terus selepas
            dikunci.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="lock-reason">Sebab Kunci</Label>
          <Select
            value={reason}
            onValueChange={(v) => setReason(v as LockReason)}
          >
            <SelectTrigger id="lock-reason">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {LOCK_REASON_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Kunci Sekarang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
