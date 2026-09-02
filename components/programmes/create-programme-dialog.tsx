"use client";

/**
 * CreateProgrammeDialog — dialog "Program Baharu" SEBENAR.
 * Memanggil server action `createProgramme` (insert ke Supabase dengan RLS).
 * Sebelum ini butang "Program Baharu" hanyalah mock UI tanpa fungsi.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Plus } from "lucide-react";

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
import { createProgramme } from "@/lib/actions/programme-actions";
import {
  PROGRAMME_CATEGORIES,
  type ProgrammeCategory,
  type TrainingMode,
} from "@/lib/types";

const MODES: { value: TrainingMode; label: string }[] = [
  { value: "in_person", label: "Bersemuka" },
  { value: "online", label: "Dalam Talian" },
  { value: "hybrid", label: "Hibrid" },
];

/** Jana kod program auto jika pengguna tidak mengisinya. */
function generateCode(): string {
  const year = new Date().getFullYear();
  const suffix = Date.now().toString(36).toUpperCase().slice(-6);
  return `NEW/${year}/${suffix}`;
}

export function CreateProgrammeDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [client, setClient] = React.useState("");
  const [code, setCode] = React.useState("");
  const [category, setCategory] = React.useState<ProgrammeCategory>(
    "AI & Data Science",
  );
  const [mode, setMode] = React.useState<TrainingMode>("in_person");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [trainer, setTrainer] = React.useState("");
  const [manager, setManager] = React.useState("");

  function resetForm() {
    setTitle("");
    setClient("");
    setCode("");
    setCategory("AI & Data Science");
    setMode("in_person");
    setStartDate("");
    setEndDate("");
    setVenue("");
    setTrainer("");
    setManager("");
    setError(null);
    setMessage(null);
  }

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
      const result = await createProgramme({
        programme_code: code.trim() || generateCode(),
        title: title.trim(),
        organizer_name: client.trim() || "MIMOS Academy",
        category,
        delivery_mode: mode,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        venue: venue.trim() || undefined,
        trainer: trainer.trim() || undefined,
        programme_manager: manager.trim() || undefined,
        status: "draft",
      });

      if (!result.success) {
        setError(result.error ?? "Gagal mencipta program.");
        return;
      }
      setMessage("Program berjaya dicipta.");
      resetForm();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Program Baharu
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Daftar Program Baharu</DialogTitle>
          <DialogDescription>
            Cipta program latihan baharu. Kod program dijana automatik jika
            tidak diisi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-title">Tajuk Program *</Label>
            <Input
              id="new-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="cth. Bengkel Keselamatan Awan"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-client">Pelanggan / Penganjur</Label>
            <Input
              id="new-client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="cth. Kementerian Pengangkutan Malaysia"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-code">Kod Program (pilihan)</Label>
            <Input
              id="new-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`auto: ${generateCode()}`}
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
                  {PROGRAMME_CATEGORIES.map((c) => (
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
              <Label htmlFor="new-start">Tarikh Mula</Label>
              <Input
                id="new-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-end">Tarikh Tamat</Label>
              <Input
                id="new-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-venue">Lokasi</Label>
            <Input
              id="new-venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-trainer">Jurulatih</Label>
              <Input
                id="new-trainer"
                value={trainer}
                onChange={(e) => setTrainer(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-manager">Pengurus Program</Label>
              <Input
                id="new-manager"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
              />
            </div>
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
              Simpan Draf
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
