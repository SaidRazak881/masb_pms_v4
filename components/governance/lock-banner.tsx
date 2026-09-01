"use client";

/**
 * LockBanner — papan maklum keadaan kunci program (Langkah 5).
 *
 * Memaparkan salah satu daripada tiga keadaan:
 *   1. Berkunci penuh          → amaran merah + butang "Mohon Buka Kunci"
 *   2. Tetingkap suntingan aktif → jalur hijau + kira detik baki masa
 *   3. Permohonan menunggu      → jalur kuning + butang batal
 */

import * as React from "react";
import { Lock, LockOpen, ShieldAlert, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LOCK_REASON_LABEL,
  canRequestUnlock,
  formatRemaining,
  isUnlockWindowActive,
  scopeLabel,
  type GovernanceRole,
  type ProgrammeLockState,
  type UnlockRequest,
} from "@/lib/governance";

export interface LockBannerProps {
  lock: ProgrammeLockState;
  role: GovernanceRole;
  requests?: UnlockRequest[];
  onRequestUnlock?: () => void;
  onCancelRequest?: (requestId: string) => void;
  className?: string;
}

/** Kira semula setiap 30 saat supaya baki masa kekal tepat. */
function useTicker(active: boolean) {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [active]);
}

export function LockBanner({
  lock,
  role,
  requests = [],
  onRequestUnlock,
  onCancelRequest,
  className,
}: LockBannerProps) {
  const windowActive = isUnlockWindowActive(lock.unlockExpiresAt);
  useTicker(windowActive);

  const pending = requests.find((r) => r.status === "pending");
  const mayRequest = canRequestUnlock(lock, role, requests);

  if (!lock.locked) {
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900",
          className,
        )}
      >
        <LockOpen className="h-4 w-4 shrink-0" />
        <span>Program terbuka untuk suntingan.</span>
      </div>
    );
  }

  if (windowActive) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900",
          className,
        )}
      >
        <div className="flex items-start gap-2.5">
          <Timer className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Tetingkap suntingan aktif</p>
            <p className="text-emerald-800">
              Baki masa: {formatRemaining(lock.unlockExpiresAt)}. Program akan
              mengunci semula secara automatik selepas tempoh ini.
            </p>
          </div>
        </div>
        <Badge variant="success">Boleh Disunting</Badge>
      </div>
    );
  }

  if (pending) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900",
          className,
        )}
      >
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">
              Permohonan buka kunci menunggu kelulusan
            </p>
            <p className="text-amber-800">
              Dipohon oleh {pending.requestedByName} · Skop:{" "}
              {pending.scope.map(scopeLabel).join(", ")} · {pending.requestedHours}{" "}
              jam
            </p>
          </div>
        </div>
        {onCancelRequest && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancelRequest(pending.id)}
          >
            Batalkan Permohonan
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">
            Program Berkunci — {LOCK_REASON_LABEL[lock.lockReason]}
          </p>
          <p className="text-red-800">
            Rekod ini dikekalkan sebagai bukti audit. Suntingan memerlukan
            kelulusan bertulis daripada Pengurus.
          </p>
        </div>
      </div>
      {mayRequest && onRequestUnlock && (
        <Button size="sm" onClick={onRequestUnlock}>
          <LockOpen className="h-4 w-4" />
          Mohon Buka Kunci
        </Button>
      )}
    </div>
  );
}
