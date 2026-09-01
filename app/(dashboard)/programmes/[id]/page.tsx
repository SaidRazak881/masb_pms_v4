import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  Lock,
  LockOpen,
  Pencil,
  User,
} from "lucide-react";

import { GovernancePanel } from "@/components/governance/governance-panel";
import { ProgrammeDetailTabs } from "@/components/programmes/programme-detail-tabs";
import {
  ModeBadge,
  ProgrammeStatusBadge,
} from "@/components/programmes/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import {
  getCurrentGovernanceRole,
  listUnlockRequests,
} from "@/lib/governance-actions";
import { canEditProgramme, type ProgrammeLockState } from "@/lib/governance";
import { getProgrammeById } from "@/lib/mock-data";

type DetailPageProps = {
  params: { id: string };
};

export function generateMetadata({ params }: DetailPageProps): Metadata {
  const programme = getProgrammeById(params.id);
  return {
    title: programme ? programme.code : "Perincian Program",
  };
}

export default async function ProgrammeDetailPage({ params }: DetailPageProps) {
  const programme = getProgrammeById(params.id);

  if (!programme) {
    notFound();
  }

  /* ---- Langkah 5: keadaan tadbir urus (lock / unlock) ---- */
  const [role, unlockRequests] = await Promise.all([
    getCurrentGovernanceRole(),
    listUnlockRequests(programme.id),
  ]);

  const lockState: ProgrammeLockState = {
    programmeId: programme.id,
    locked: programme.locked,
    lockReason: programme.status === "completed" ? "programme_completed" : "manual",
    unlockExpiresAt:
      unlockRequests.find((r) => r.status === "approved")?.unlockExpiresAt ?? null,
  };

  const editable = canEditProgramme(lockState);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Navigasi + tindakan */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/programmes"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Senarai Program
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {editable ? (
            <Button variant="outline">
              <Pencil className="h-4 w-4" />
              Sunting Program
            </Button>
          ) : (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <Lock className="h-3.5 w-3.5" />
              Program Berkunci — Audit
            </Badge>
          )}
        </div>
      </div>

      {/* Pengepala program */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  {programme.code}
                </span>
                <ProgrammeStatusBadge status={programme.status} />
                <ModeBadge mode={programme.mode} />
                {programme.locked && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Locked
                  </Badge>
                )}
              </div>
              <h1 className="max-w-3xl text-xl font-bold leading-snug">
                {programme.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Pelanggan:{" "}
                <span className="font-medium text-foreground">
                  {programme.client}
                </span>{" "}
                · Kategori:{" "}
                <span className="font-medium text-foreground">
                  {programme.category}
                </span>
              </p>
            </div>
          </div>

          <div className="grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-2.5">
              <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">Tempoh</p>
                <p className="font-medium">
                  {formatDate(programme.startDate)} —{" "}
                  {formatDate(programme.endDate)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">Pengurus Program</p>
                <p className="font-medium">{programme.programmeManager}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">Jurulatih</p>
                <p className="font-medium">{programme.trainer}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <LockOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">Lokasi</p>
                <p className="font-medium">{programme.venue}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Langkah 5 — Modul Governance Lock & Request Unlock */}
      <GovernancePanel
        lock={lockState}
        programmeCode={programme.code}
        role={role}
        currentUserId="current-user"
        requests={unlockRequests}
      />

      <ProgrammeDetailTabs programme={programme} />
    </div>
  );
}
