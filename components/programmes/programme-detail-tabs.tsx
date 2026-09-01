"use client";

import {
  ClipboardList,
  FilePenLine,
  FileText,
  History,
  PiggyBank,
  Users,
  Wallet,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Programme } from "@/lib/types";
import type { ChangeRequest } from "@/lib/change-requests";
import { OverviewTab } from "@/components/programmes/detail/overview-tab";
import { FinancialTab } from "@/components/programmes/detail/financial-tab";
import { ParticipantsTab } from "@/components/programmes/detail/participants-tab";
import { CostsTab } from "@/components/programmes/detail/costs-tab";
import { DocumentsTab } from "@/components/programmes/detail/documents-tab";
import { AuditTrailTab } from "@/components/programmes/detail/audit-trail-tab";
import { ChangeRequestHistory } from "@/components/governance/change-request-history";

interface ProgrammeDetailTabsProps {
  programme: Programme;
  /** Sejarah permohonan ubah data (untuk tab Change Requests). */
  changeRequests?: ChangeRequest[];
}

export function ProgrammeDetailTabs({
  programme,
  changeRequests = [],
}: ProgrammeDetailTabsProps) {
  const pendingCount = changeRequests.filter((r) => r.status === "pending").length;

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="overview" className="gap-1.5">
          <ClipboardList className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="financial" className="gap-1.5">
          <Wallet className="h-4 w-4" />
          Financial
        </TabsTrigger>
        <TabsTrigger value="participants" className="gap-1.5">
          <Users className="h-4 w-4" />
          Participants
        </TabsTrigger>
        <TabsTrigger value="costs" className="gap-1.5">
          <PiggyBank className="h-4 w-4" />
          Costs
        </TabsTrigger>
        <TabsTrigger value="documents" className="gap-1.5">
          <FileText className="h-4 w-4" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="audit" className="gap-1.5">
          <History className="h-4 w-4" />
          Audit Trail
        </TabsTrigger>
        {programme.locked && (
          <TabsTrigger value="changes" className="gap-1.5">
            <FilePenLine className="h-4 w-4" />
            Change Requests
            {pendingCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab programme={programme} />
      </TabsContent>
      <TabsContent value="financial">
        <FinancialTab programme={programme} />
      </TabsContent>
      <TabsContent value="participants">
        <ParticipantsTab programme={programme} />
      </TabsContent>
      <TabsContent value="costs">
        <CostsTab programme={programme} />
      </TabsContent>
      <TabsContent value="documents">
        <DocumentsTab programme={programme} />
      </TabsContent>
      <TabsContent value="audit">
        <AuditTrailTab programme={programme} />
      </TabsContent>
      <TabsContent value="changes">
        <ChangeRequestHistory requests={changeRequests} />
      </TabsContent>
    </Tabs>
  );
}
