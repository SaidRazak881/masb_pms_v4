"use client";

/**
 * GovernancePanel — komponen orkestra bagi Modul Governance Lock &
 * Request Unlock (Langkah 5).
 *
 * Menyatukan:
 *   • LockBanner              — keadaan kunci semasa + CTA
 *   • RequestUnlockDialog     — borang permohonan
 *   • UnlockApprovalCard      — panel semakan (Pengurus/Pentadbir)
 *   • UnlockRequestHistory    — bukti audit
 *
 * Diletakkan di halaman perincian program: /programmes/[id].
 */

import * as React from "react";
import { CheckCircle2 } from "lucide-react";

import { LockBanner } from "@/components/governance/lock-banner";
import { RequestUnlockDialog } from "@/components/governance/request-unlock-dialog";
import { UnlockApprovalCard } from "@/components/governance/unlock-approval-card";
import { UnlockRequestHistory } from "@/components/governance/unlock-request-history";
import {
  canApproveUnlock,
  effectiveStatus,
  type GovernanceRole,
  type ProgrammeLockState,
  type UnlockRequest,
} from "@/lib/governance";
import { cancelUnlockAction } from "@/lib/governance-actions";

export interface GovernancePanelProps {
  lock: ProgrammeLockState;
  programmeCode?: string;
  role: GovernanceRole;
  currentUserId: string;
  requests?: UnlockRequest[];
  /** Tunjukkan sejarah permohonan (lalai: ya). */
  showHistory?: boolean;
}

export function GovernancePanel({
  lock,
  programmeCode,
  role,
  currentUserId,
  requests = [],
  showHistory = true,
}: GovernancePanelProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [, startTransition] = React.useTransition();

  const pending = requests.find((r) => effectiveStatus(r) === "pending");
  const showApproval = Boolean(pending) && canApproveUnlock(role);

  function handleCancel(requestId: string) {
    const formData = new FormData();
    formData.set("requestId", requestId);
    formData.set("programmeId", lock.programmeId);
    startTransition(async () => {
      const result = await cancelUnlockAction(formData);
      setNotice(result.message);
    });
  }

  return (
    <section className="space-y-4" aria-label="Tadbir Urus Program">
      <LockBanner
        lock={lock}
        role={role}
        requests={requests}
        onRequestUnlock={() => setDialogOpen(true)}
        onCancelRequest={handleCancel}
      />

      {notice && (
        <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {showApproval && pending && (
        <UnlockApprovalCard
          request={pending}
          reviewerId={currentUserId}
          reviewerRole={role}
          onReviewed={setNotice}
        />
      )}

      {showHistory && requests.length > 0 && (
        <UnlockRequestHistory requests={requests} />
      )}

      <RequestUnlockDialog
        programmeId={lock.programmeId}
        programmeCode={programmeCode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmitted={setNotice}
      />
    </section>
  );
}
