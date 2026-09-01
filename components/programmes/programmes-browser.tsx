"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Lock,
  LockOpen,
  Plus,
  Search,
  Users,
} from "lucide-react";

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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ModeBadge,
  ProgrammeStatusBadge,
} from "@/components/programmes/status-badges";
import { formatDate, formatMYRShort } from "@/lib/format";
import type { Programme } from "@/lib/types";

/** Pengguna mock — dalam pelaksanaan sebenar diambil daripada sesi Supabase. */
const CURRENT_USER = "Zarina Abu Bakar";

const CATEGORIES = [
  "AI & Data Science",
  "Cybersecurity",
  "Cloud & Infrastructure",
  "Digital Transformation",
  "Leadership & Management",
  "IoT & Embedded Systems",
] as const;

interface ProgrammesBrowserProps {
  programmes: Programme[];
}

export function ProgrammesBrowser({ programmes }: ProgrammesBrowserProps) {
  const [tab, setTab] = useState<"mine" | "all">("mine");
  const [category, setCategory] = useState("all");
  const [year, setYear] = useState("all");
  const [lock, setLock] = useState("all");
  const [query, setQuery] = useState("");

  const years = useMemo(
    () =>
      Array.from(new Set(programmes.map((p) => p.year))).sort((a, b) => b - a),
    [programmes],
  );

  const filtered = useMemo(() => {
    return programmes.filter((p) => {
      if (tab === "mine" && p.programmeManager !== CURRENT_USER) return false;
      if (category !== "all" && p.category !== category) return false;
      if (year !== "all" && p.year !== Number(year)) return false;
      if (lock === "locked" && !p.locked) return false;
      if (lock === "unlocked" && p.locked) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const haystack =
          `${p.title} ${p.client} ${p.code} ${p.trainer}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [programmes, tab, category, year, lock, query]);

  return (
    <div className="space-y-4">
      {/* Tab + tindakan */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "mine" | "all")}>
          <TabsList>
            <TabsTrigger value="mine">Program Saya</TabsTrigger>
            <TabsTrigger value="all">Semua Program</TabsTrigger>
          </TabsList>
        </Tabs>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Program Baharu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Daftar Program Baharu</DialogTitle>
              <DialogDescription>
                Mock UI: borang ringkas ini akan disambungkan kepada Supabase
                pada fasa pelaksanaan.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-title">Tajuk Program</Label>
                <Input id="new-title" placeholder="cth. Bengkel Keselamatan Awan" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Kategori</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Mod</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mod" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">Bersemuka</SelectItem>
                      <SelectItem value="online">Dalam Talian</SelectItem>
                      <SelectItem value="hybrid">Hibrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Batal</Button>
              <Button>Simpan Draf</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Penapis */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[240px] flex-1 space-y-1.5">
            <Label htmlFor="programme-search" className="text-xs">
              Carian
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="programme-search"
                placeholder="Tajuk, pelanggan, kod atau jurulatih..."
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full space-y-1.5 sm:w-56">
            <Label className="text-xs">Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Semua kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1.5 sm:w-36">
            <Label className="text-xs">Tahun</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue placeholder="Semua tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1.5 sm:w-44">
            <Label className="text-xs">Status Kunci</Label>
            <Select value={lock} onValueChange={setLock}>
              <SelectTrigger>
                <SelectValue placeholder="Status kunci" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="unlocked">Tidak Berkunci</SelectItem>
                <SelectItem value="locked">Berkunci (Locked)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jadual senarai */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Kod</TableHead>
                <TableHead>Program &amp; Pelanggan</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Tarikh</TableHead>
                <TableHead className="text-right">Nilai Kontrak</TableHead>
                <TableHead className="text-center">Peserta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Kunci</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    Tiada program yang sepadan dengan penapis anda.
                  </TableCell>
                </TableRow>
              )}

              {filtered.map((p) => (
                <TableRow key={p.id} className="group cursor-pointer">
                  <TableCell className="font-mono text-xs font-medium">
                    <Link href={`/programmes/${p.id}`} className="block">
                      {p.code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/programmes/${p.id}`} className="block">
                      <div className="flex items-start gap-2">
                        {p.locked && (
                          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        )}
                        <div>
                          <p className="font-medium leading-snug group-hover:text-primary">
                            {p.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.client} · {p.trainer}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs">{p.category}</span>
                      <ModeBadge mode={p.mode} />
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatDate(p.startDate)}
                    <br />
                    <span className="text-muted-foreground">
                      hingga {formatDate(p.endDate)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMYRShort(p.contractedAmount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-sm tabular-nums">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {p.participants.length}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ProgrammeStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    {p.locked ? (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" />
                        Locked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <LockOpen className="h-3 w-3" />
                        Open
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Paparan mock: {filtered.length} daripada {programmes.length} program.
        Data akan diambil daripada Supabase pada fasa seterusnya.
      </p>
    </div>
  );
}
