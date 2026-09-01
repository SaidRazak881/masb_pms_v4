"use client";

/**
 * EditProgrammeDialog — dialog "Sunting Program" sebenar.
 * Memanggil server action `updateProgramme` (kemas kini terus ke Supabase
 * dengan RLS — program dikunci tidak boleh dikemas kini).
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { updateProgramme } from "@/lib/actions/programme-actions";
import type {
  Programme,
  ProgrammeCategory,
  ProgrammeStatus,
  TrainingMode,
} from "@/lib/types";

const CATEGORIES: ProgrammeCategory[] = [
  "AI & Data Science",
  "Cybersecurity",
  "Cloud & Infrastructure",
  "Digital Transformation",
  "Leadership & Management",
  "IoT & Embedded Systems",
];

const MODES: { value: TrainingMode; label: string }[] = [
  { value: "in_person", label: "Bersemuka" },
  { value: "online", label: "Dalam Talian" },
  { value: "hybrid", label: "Hibrid" },
];

const STATUSES: { value: ProgrammeStatus; label: string }[] = [
  { value: "draft", label: "Draf" },
  { value: "active", label: "Aktif" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
  { value: "on_hold", label: "Ditangguh" },
];

function dateValue(value: string): string {
  return value ? value.slice(0, 10) : "";
}

export interface EditProgrammeDialogProps {
  programme: Programme;
}

export function EditProgrammeDialog({ programme }: EditProgrammeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState(programme.title);
  const [client, setClient] = React.useState(programme.client);
  const [category, setCategory] = React.useState<ProgrammeCategory>(
    programme.category,
  );
  const [mode, setMode] = React.useState<TrainingMode>(programme.mode);
  const [startDate, setStartDate] = React.useState(dateValue(programme.startDate));
  const [endDate, setEndDate] = React.useState(dateValue(programme.endDate));
  const [venue, setVenue] = React.useState(programme.venue);
  const [trainer, setTrainer] = React.useState(programme.trainer);
  const [manager, setManager] = React.useState(programme.programmeManager);
  const [contracted, setContracted] = React.useState(
    programme.contractedAmount ? String(programme.contractedAmount) : "",
  );
  const [budget, setBudget] = React.useState(
    programme.budget ? String(programme.budget) : "",
  );
  const [actualCost, setActualCost] = React.useState(
    programme.actualCost ? String(programme.actualCost) : "",
  );
  const [status, setStatus] = React.useState<ProgrammeStatus>(
    programme.status,
  );

  function toNumber(value: string): number | undefined {
    if (!value.trim()) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!title.trim()) {
      setError("Tajuk program wajib diisi.");
      return;
    }

    startTransition(async () => {
      const result = await updateProgramme(programme.id, {
        title: title.trim(),
        organizer_name: client.trim(),
        category,
        delivery_mode: mode,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        venue: venue.trim() || undefined,
        trainer: trainer.trim() || undefined,
        programme_manager: manager.trim() || undefined,
        contracted_amount: toNumber(contracted),
        budget: toNumber(budget),
        actual_cost: toNumber(actualCost),
        status,
      });

      if (!result.success) {
        setError(result.error ?? "Gagal menyimpan perubahan.");
        return;
      }
      setMessage("Perubahan berjaya disimpan.");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="h-4 w-4" />
          Sunting Program
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sunting Program</DialogTitle>
          <DialogDescription>
            {programme.code} — kemas kini maklumat program. Audit trail akan
            merekod perubahan ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Tajuk Program</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-client">Pelanggan / Penganjur</Label>
            <Input
              id="edit-client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ProgrammeCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Select
                value={mode}
                onValueChange={(v) => setMode(v as TrainingMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-start">Tarikh Mula</Label>
              <Input
                id="edit-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-end">Tarikh Tamat</Label>
              <Input
                id="edit-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-venue">Lokasi</Label>
            <Input
              id="edit-venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-trainer">Jurulatih</Label>
              <Input
                id="edit-trainer"
                value={trainer}
                onChange={(e) => setTrainer(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-manager">Pengurus Program</Label>
              <Input
                id="edit-manager"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-contracted">Nilai Kontrak (RM)</Label>
              <Input
                id="edit-contracted"
                type="number"
                step="0.01"
                value={contracted}
                onChange={(e) => setContracted(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-budget">Belanjawan (RM)</Label>
              <Input
                id="edit-budget"
                type="number"
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-cost">Kos Sebenar (RM)</Label>
              <Input
                id="edit-cost"
                type="number"
                step="0.01"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ProgrammeStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </div>
          )}
          {message && (
            <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
