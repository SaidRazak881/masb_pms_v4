"use client";

/**
 * CreateProgrammeDialog — dialog "Program Baharu" SEBENAR (form penuh).
 * Memanggil server action `createProgramme` (insert ke Supabase dengan RLS).
 *
 * Reka bentuk: FORM PENUH — semua medan program tersedia (pilihan, kecuali
 * tajuk) supaya sesuai untuk kes PIC yang sudah ada banyak maklumat mahu
 * diisi terus; pengguna yang ada sedikit maklumat boleh isi minimum dahulu
 * dan lengkapkan kemudian melalui "Sunting Program".
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
import { Textarea } from "@/components/ui/textarea";
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

const CATEGORIES: ProgrammeCategory[] = PROGRAMME_CATEGORIES;

/** Jana kod program auto jika pengguna tidak mengisinya. */
function generateCode(): string {
  const year = new Date().getFullYear();
  const suffix = Date.now().toString(36).toUpperCase().slice(-6);
  return `NEW/${year}/${suffix}`;
}

function toNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function CreateProgrammeDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  // Maklumat am
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [client, setClient] = React.useState("");
  const [code, setCode] = React.useState("");
  const [category, setCategory] = React.useState<ProgrammeCategory>(
    "AI & Data Science",
  );
  const [mode, setMode] = React.useState<TrainingMode>("in_person");

  // Tempoh & lokasi
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");

  // Jurulatih & pengurus
  const [trainer, setTrainer] = React.useState("");
  const [trainerEmail, setTrainerEmail] = React.useState("");
  const [trainerPhone, setTrainerPhone] = React.useState("");
  const [manager, setManager] = React.useState("");
  const [managerEmail, setManagerEmail] = React.useState("");

  // Kewangan (pilihan — boleh diisi kemudian)
  const [contracted, setContracted] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [actualCost, setActualCost] = React.useState("");

  function resetForm() {
    setTitle("");
    setDescription("");
    setClient("");
    setCode("");
    setCategory("AI & Data Science");
    setMode("in_person");
    setStartDate("");
    setEndDate("");
    setVenue("");
    setCity("");
    setState("");
    setTrainer("");
    setTrainerEmail("");
    setTrainerPhone("");
    setManager("");
    setManagerEmail("");
    setContracted("");
    setBudget("");
    setActualCost("");
    setError(null);
    setMessage(null);
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
        description: description.trim() || undefined,
        organizer_name: client.trim() || "MIMOS Academy",
        category,
        delivery_mode: mode,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        venue: venue.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        trainer: trainer.trim() || undefined,
        trainer_email: trainerEmail.trim() || undefined,
        trainer_phone: trainerPhone.trim() || undefined,
        programme_manager: manager.trim() || undefined,
        programme_manager_email: managerEmail.trim() || undefined,
        contracted_amount: toNumber(contracted),
        budget: toNumber(budget),
        actual_cost: toNumber(actualCost),
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
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Daftar Program Baharu</DialogTitle>
          <DialogDescription>
            Hanya <strong>Tajuk Program</strong> wajib diisi — semua medan lain
            boleh dilengkapkan kemudian melalui Sunting Program. Kod program
            dijana automatik jika tidak diisi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          {/* Maklumat am */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500">
              Maklumat Am
            </h3>
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
              <Label htmlFor="new-desc">Penerangan</Label>
              <Textarea
                id="new-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ringkasan / objektif program (pilihan)"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
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
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
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
          </section>

          {/* Tempoh & lokasi */}
          <section className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-slate-500">
              Tempoh &amp; Lokasi
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
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
              <Label htmlFor="new-venue">Lokasi / Venue</Label>
              <Input
                id="new-venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="cth. MIMOS Training Centre"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-city">Bandar</Label>
                <Input
                  id="new-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-state">Negeri</Label>
                <Input
                  id="new-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Jurulatih & pengurus */}
          <section className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-slate-500">
              Jurulatih &amp; Pengurus Program
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-trainer">Jurulatih</Label>
                <Input
                  id="new-trainer"
                  value={trainer}
                  onChange={(e) => setTrainer(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-trainer-email">E-mel Jurulatih</Label>
                <Input
                  id="new-trainer-email"
                  type="email"
                  value={trainerEmail}
                  onChange={(e) => setTrainerEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-trainer-phone">Telefon Jurulatih</Label>
                <Input
                  id="new-trainer-phone"
                  value={trainerPhone}
                  onChange={(e) => setTrainerPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-manager">Pengurus Program (PIC)</Label>
                <Input
                  id="new-manager"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-manager-email">E-mel Pengurus Program</Label>
              <Input
                id="new-manager-email"
                type="email"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
              />
            </div>
          </section>

          {/* Kewangan */}
          <section className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-slate-500">
              Kewangan (pilihan — boleh diisi kemudian)
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-contracted">Nilai Kontrak (RM)</Label>
                <Input
                  id="new-contracted"
                  type="number"
                  step="0.01"
                  value={contracted}
                  onChange={(e) => setContracted(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-budget">Belanjawan (RM)</Label>
                <Input
                  id="new-budget"
                  type="number"
                  step="0.01"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-cost">Kos Sebenar (RM)</Label>
                <Input
                  id="new-cost"
                  type="number"
                  step="0.01"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                />
              </div>
            </div>
          </section>

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

          <DialogFooter className="gap-2">
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
