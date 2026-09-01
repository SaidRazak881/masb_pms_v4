import {
  FileUp,
  Lock,
  LockOpen,
  Pencil,
  PlusCircle,
  RefreshCw,
  UserCheck,
  Wallet,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { AuditAction, Programme } from "@/lib/types";

const ACTION_META: Record<
  AuditAction,
  { label: string; icon: React.ElementType; color: string }
> = {
  created: { label: "Dicipta", icon: PlusCircle, color: "bg-sky-100 text-sky-700" },
  updated: { label: "Dikemas kini", icon: Pencil, color: "bg-slate-100 text-slate-700" },
  status_changed: { label: "Status diubah", icon: RefreshCw, color: "bg-violet-100 text-violet-700" },
  financial_added: { label: "Dokumen kewangan", icon: Wallet, color: "bg-emerald-100 text-emerald-700" },
  participant_updated: { label: "Peserta dikemas kini", icon: UserCheck, color: "bg-amber-100 text-amber-700" },
  document_uploaded: { label: "Dokumen dimuat naik", icon: FileUp, color: "bg-indigo-100 text-indigo-700" },
  locked: { label: "Program dikunci", icon: Lock, color: "bg-red-100 text-red-700" },
  unlocked: { label: "Program dibuka", icon: LockOpen, color: "bg-emerald-100 text-emerald-700" },
  imported: { label: "Data diimport", icon: FileUp, color: "bg-indigo-100 text-indigo-700" },
};

export function AuditTrailTab({ programme }: { programme: Programme }) {
  const events = [...programme.auditTrail].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Jejak Audit ({events.length} peristiwa)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-6 border-l-2 border-slate-100 pl-6">
          {events.map((event) => {
            const meta = ACTION_META[event.action];
            const Icon = meta.icon;
            return (
              <li key={event.id} className="relative">
                <span
                  className={`absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white ${meta.color}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{event.detail}</p>
                  <time className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(event.timestamp)}
                  </time>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {event.user}
                  </span>{" "}
                  · {meta.label}
                </p>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
