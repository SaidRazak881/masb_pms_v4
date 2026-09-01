"use client";

/**
 * ParticipantsBrowser — senarai peserta seluruh organisasi.
 *
 * Paparan:
 *   • Kad ringkasan: jumlah peserta, Bumiputera / Bukan Bumiputera /
 *     belum disahkan, status selesai & sijil.
 *   • Jadual peserta dengan carian, penapis status Bumiputera dan penapis
 *     organisasi. Setiap baris memaparkan bilangan program yang dihadiri.
 *
 * Nota data sensitif: status Bumiputera hanya boleh digunakan bagi tujuan
 * yang dibenarkan oleh polisi organisasi. Paparan ini dikawal oleh RLS
 * di peringkat pangkalan data (lihat skema master).
 */

import { useMemo, useState } from "react";
import { AlertTriangle, Search, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BumiBadge } from "@/components/programmes/status-badges";
import { PARTICIPANT_STATUS_LABEL } from "@/lib/reporting";
import type { BumiStatus } from "@/lib/types";
import type { ParticipantAggregate, ParticipantsSummary } from "@/lib/participants-data";

interface ParticipantsBrowserProps {
  participants: ParticipantAggregate[];
  summary: ParticipantsSummary;
  isDemo?: boolean;
}

type BumiFilter = BumiStatus | "all";

export function ParticipantsBrowser({
  participants,
  summary,
  isDemo = false,
}: ParticipantsBrowserProps) {
  const [query, setQuery] = useState("");
  const [bumiFilter, setBumiFilter] = useState<BumiFilter>("all");
  const [orgFilter, setOrgFilter] = useState("all");

  const organisations = useMemo(() => {
    const set = new Set<string>();
    for (const p of participants) {
      if (p.organisation) set.add(p.organisation);
    }
    return [...set].sort();
  }, [participants]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return participants.filter((p) => {
      if (bumiFilter !== "all" && p.bumiStatus !== bumiFilter) return false;
      if (orgFilter !== "all" && p.organisation !== orgFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.organisation.toLowerCase().includes(q) ||
        p.programmeCodes.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [participants, query, bumiFilter, orgFilter]);

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Mod demo — data peserta contoh. Data sebenar akan dipaparkan
          selepas env Supabase disambungkan.</span>
        </div>
      )}

      {/* ============ Ringkasan ============ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <SummaryCard label="Jumlah Peserta" value={summary.total} />
        <SummaryCard label="Bumiputera" value={summary.bumiputera} tone="emerald" />
        <SummaryCard label="Bukan Bumiputera" value={summary.nonBumiputera} tone="sky" />
        <SummaryCard label="Belum Disahkan" value={summary.pendingBumi} tone="amber" />
        <SummaryCard label="Selesai" value={summary.completed} />
        <SummaryCard label="Sijil Diterbitkan" value={summary.certificateIssued} />
        <SummaryCard label="Program Terlibat" value={summary.uniqueProgrammes} />
      </div>

      {/* ============ Penapis ============ */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, e-mel, organisasi atau kod program…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={bumiFilter}
              onValueChange={(v) => setBumiFilter(v as BumiFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status Bumiputera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="bumiputera">Bumiputera</SelectItem>
                <SelectItem value="non_bumiputera">Bukan Bumiputera</SelectItem>
                <SelectItem value="pending">Belum disahkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-56">
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Organisasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua organisasi</SelectItem>
                {organisations.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="ml-auto text-xs text-muted-foreground">
            {filtered.length} daripada {participants.length} peserta
          </p>
        </CardContent>
      </Card>

      {/* ============ Jadual ============ */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>E-mel</TableHead>
                <TableHead>Organisasi</TableHead>
                <TableHead>Status Bumiputera</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Kehadiran</TableHead>
                <TableHead className="text-right">Program</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    <Users className="mx-auto mb-1 h-5 w-5" />
                    Tiada peserta sepadan dengan penapis.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.email || <Badge variant="outline">Tiada e-mel</Badge>}
                  </TableCell>
                  <TableCell>{p.organisation || "—"}</TableCell>
                  <TableCell>
                    <BumiBadge status={p.bumiStatus} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 text-slate-700">
                      {PARTICIPANT_STATUS_LABEL[p.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{p.attendance}%</TableCell>
                  <TableCell className="text-right">
                    {p.programmeCodes.length > 1 ? (
                      <Badge variant="secondary" title={p.programmeCodes.join(", ")}>
                        {p.programmeCodes.length} program
                      </Badge>
                    ) : (
                      <span className="font-mono text-xs">{p.programmeCodes[0]}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "emerald" | "sky" | "amber";
}) {
  const color =
    tone === "emerald"
      ? "text-emerald-600"
      : tone === "sky"
        ? "text-sky-600"
        : tone === "amber"
          ? "text-amber-600"
          : "";
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className={`mt-1 text-xl font-bold tracking-tight ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
