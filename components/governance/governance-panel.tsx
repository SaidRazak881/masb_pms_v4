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
import { ChangeRequestDialog } from "@/components/governance/change-request-dialog";
import { ChangeRequestInbox } from "@/components/governance/change-request-inbox";
import {
  canApproveUnlock,
  effectiveStatus,
  type GovernanceRole,
  type ProgrammeLockState,
  type UnlockRequest,
} from "@/lib/governance";
import { cancelUnlockAction } from "@/lib/governance-actions";
import type { ChangeRequest } from "@/lib/change-requests";

export interface GovernancePanelProps {
  lock: ProgrammeLockState;
  programmeCode?: string;
  role: GovernanceRole;
  currentUserId: string;
  requests?: UnlockRequest[];
  /** Permohonan ubah data (Change Requests) bagi program ini. */
  changeRequests?: ChangeRequest[];
  /** Tunjukkan sejarah permohonan (lalai: ya). */
  showHistory?: boolean;
}

export function GovernancePanel({
  lock,
  programmeCode,
  role,
  currentUserId,
  requests = [],
  changeRequests = [],
  showHistory = true,
}: GovernancePanelProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [, startTransition] = React.useTransition();

  const pending = requests.find((r) => effectiveStatus(r) === "pending");
  const showApproval = Boolean(pending) && canApproveUnlock(role);
  const canReviewChanges = canApproveUnlock(role);
  const isLocked = lock.locked;

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

      {/* Change Requests — hanya relevan apabila program dikunci */}
      {isLocked && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <p className="text-sm font-semibold">Permohonan Ubah Data</p>
              <p className="text-xs text-muted-foreground">
                Program terkunci — sebarang perubahan perlu melalui kelulusan
                Head Governance. {changeRequests.length} permohonan direkod.
              </p>
            </div>
            <ChangeRequestDialog
              programmeId={lock.programmeId}
              programmeCode={programmeCode}
            />
          </div>

          <ChangeRequestInbox
            requests={changeRequests}
            currentUserId={currentUserId}
            canReview={canReviewChanges}
          />
        </>
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
