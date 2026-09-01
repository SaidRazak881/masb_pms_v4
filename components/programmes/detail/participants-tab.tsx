"use client";

import { useMemo, useState } from "react";
import { Award, ShieldCheck, Users } from "lucide-react";

import { BumiBadge } from "@/components/programmes/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { formatPercent } from "@/lib/format";
import type { BumiStatus, Programme } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function ParticipantsTab({ programme }: { programme: Programme }) {
  const [filter, setFilter] = useState<"all" | BumiStatus>("all");
  const [pendingName, setPendingName] = useState<string | null>(null);

  const stats = useMemo(() => {
    const list = programme.participants;
    return {
      total: list.length,
      bumi: list.filter((p) => p.bumiStatus === "bumiputera").length,
      nonBumi: list.filter((p) => p.bumiStatus === "non_bumiputera").length,
      pending: list.filter((p) => p.bumiStatus === "pending").length,
      certified: list.filter((p) => p.certificateIssued).length,
    };
  }, [programme]);

  const rows = programme.participants.filter(
    (p) => filter === "all" || p.bumiStatus === filter,
  );

  return (
    <div className="space-y-6">
      {/* Statistik */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Jumlah Peserta</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {formatPercent(stats.bumi, stats.total)}
              </p>
              <p className="text-xs text-muted-foreground">
                Bumiputera ({stats.bumi} orang)
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Award className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {stats.pending}
              </p>
              <p className="text-xs text-muted-foreground">
                Status Bumi Belum Disahkan
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Award className="h-8 w-8 text-sky-600" />
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {stats.certified}
              </p>
              <p className="text-xs text-muted-foreground">Sijil Dikeluarkan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Penapis */}
      <div className="flex items-center justify-between gap-3">
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua peserta ({stats.total})</SelectItem>
            <SelectItem value="bumiputera">
              Bumiputera ({stats.bumi})
            </SelectItem>
            <SelectItem value="non_bumiputera">
              Bukan Bumiputera ({stats.nonBumi})
            </SelectItem>
            <SelectItem value="pending">
              Belum Disahkan ({stats.pending})
            </SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          Eksport Senarai (Excel)
        </Button>
      </div>

      {/* Jadual peserta */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama &amp; E-mel</TableHead>
                <TableHead>Organisasi / Jawatan</TableHead>
                <TableHead>Status Bumi</TableHead>
                <TableHead className="text-center">Kehadiran</TableHead>
                <TableHead>Sijil</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {initials(p.name)}
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{p.organisation}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.designation}
                    </p>
                  </TableCell>
                  <TableCell>
                    <BumiBadge status={p.bumiStatus} />
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`text-sm font-medium tabular-nums ${
                        p.attendance < 70
                          ? "text-red-600"
                          : p.attendance < 90
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {p.attendance}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {p.certificateIssued ? (
                      <Badge variant="success">Telah Dikeluarkan</Badge>
                    ) : (
                      <Badge variant="outline">Belum</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.bumiStatus === "pending" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPendingName(p.name)}
                        disabled={programme.locked}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Sahkan Bumi
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog pengesahan status Bumiputera */}
      <Dialog
        open={pendingName !== null}
        onOpenChange={(open) => !open && setPendingName(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sahkan Status Bumiputera</DialogTitle>
            <DialogDescription>
              Sahkan peserta berdasarkan dokumen sokongan (cth. salinan
              kad pengenalan / pengisytiharan Bumiputera).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-lg border bg-slate-50 p-4 text-sm">
            <p>
              Peserta: <span className="font-semibold">{pendingName}</span>
            </p>
            <p className="text-muted-foreground">
              Mock UI: tindakan ini akan mengemas kini medan{" "}
              <code className="rounded bg-white px-1 py-0.5 text-xs">
                bumiputera_status
              </code>{" "}
              dalam Supabase.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingName(null)}>
              Bukan Bumiputera
            </Button>
            <Button onClick={() => setPendingName(null)}>
              <ShieldCheck className="h-4 w-4" />
              Sahkan Bumiputera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
