"use client";

import { useEffect, useMemo, useState } from "react";
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
import { CreateProgrammeDialog } from "@/components/programmes/create-programme-dialog";
import { formatDate, formatMYRShort } from "@/lib/format";
import {
  PROGRAMME_CATEGORIES,
  type Programme,
  type ProgrammeCategory,
  type ProgrammeStatus,
} from "@/lib/types";
import { getProgrammes, searchProgrammes } from "@/lib/actions/programme-actions";

/** Pengguna mock — dalam pelaksanaan sebenar diambil daripada sesi Supabase. */
const CURRENT_USER = "Zarina Abu Bakar";

const CATEGORIES = PROGRAMME_CATEGORIES;

interface ProgrammesBrowserProps {
  programmes?: Programme[]; // Optional - jika disediakan, gunakan mock data
}

export function ProgrammesBrowser({ programmes: initialProgrammes }: ProgrammesBrowserProps) {
  const [tab, setTab] = useState<"mine" | "all">("mine");
  const [category, setCategory] = useState<ProgrammeCategory | "all">("all");
  const [year, setYear] = useState("all");
  const [lock, setLock] = useState<"all" | "locked" | "unlocked">("all");
  const [query, setQuery] = useState("");
  const [programmes, setProgrammes] = useState<Programme[]>(initialProgrammes || []);
  const [loading, setLoading] = useState<boolean>(!initialProgrammes);
  const [error, setError] = useState<string | null>(null);

  // Muat data programmes dari Supabase jika tidak disediakan
  useEffect(() => {
    if (initialProgrammes) return;
    
    async function loadProgrammes() {
      try {
        setLoading(true);
        const data = await getProgrammes();
        setProgrammes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuatkan data programmes");
        console.error("Error loading programmes:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadProgrammes();
  }, [initialProgrammes]);

  // Cari programmes berdasarkan filter
  useEffect(() => {
    if (initialProgrammes) return;
    
    async function search() {
      try {
        setLoading(true);
        const data = await searchProgrammes({
          category: category !== "all" ? category : undefined,
          status: undefined, // Tidak filter status di sini
          year: year !== "all" ? Number(year) : undefined,
          organizer: undefined,
          searchTerm: query || undefined,
        });
        setProgrammes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mencari programmes");
        console.error("Error searching programmes:", err);
      } finally {
        setLoading(false);
      }
    }
    
    // Jangan search jika masih loading data awal
    if (programmes.length === 0 && !initialProgrammes) return;
    
    const debounceTimer = setTimeout(() => {
      if (query || category !== "all" || year !== "all") {
        search();
      }
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [category, year, query, initialProgrammes]);

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

        <CreateProgrammeDialog />
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
            <Select value={category} onValueChange={(v) => setCategory(v as ProgrammeCategory | "all")}>
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
            <Select value={lock} onValueChange={(v) => setLock(v as "all" | "locked" | "unlocked")}>
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
