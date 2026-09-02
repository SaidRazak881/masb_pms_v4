"use client";

/**
 * UserManagement — Dashboard Pengurusan Pengguna untuk SUPER ADMIN (Fasa 6).
 *
 * Keupayaan:
 *   • KPI: jumlah pengguna, menunggu kelulusan, aktif, disekat, masih guna
 *     kata laluan lalai, bilangan Super Admin.
 *   • Luluskan permohonan pengguna baharu + tetapkan role.
 *   • Sekat / nyahsekat pengguna (dengan sebab untuk audit; sesi ditamatkan).
 *   • Tukar role.
 *   • Set semula kata laluan ke lalai `masb.12345` (wajib tukar selepas itu).
 *   • Wajibkan / batalkan tuntutan tukar kata laluan.
 *
 * Semua tindakan melalui Server Actions → RPC `admin_*` (SECURITY DEFINER).
 * Komponen ini TIDAK membuat keputusan kebenaran sendiri; pangkalan data
 * yang memutuskan dan setiap tindakan direkod dalam `audit_logs`.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_PASSWORD, roleLabel } from "@/lib/auth";
import {
  ASSIGNABLE_ROLE_OPTIONS,
  DEFAULT_APPROVAL_ROLE,
  ROLE_DESCRIPTION,
  STATUS_FILTERS,
  STATUS_SHORT_LABEL,
  formatWhen,
  type ManagedUser,
  type UserRole,
  type UserSummary,
} from "@/lib/user-management";
import {
  approveUser,
  changeUserRole,
  getUserSummary,
  listUsers,
  requirePasswordChange,
  resetUserPassword,
  setUserBlocked,
} from "@/lib/actions/user-management-actions";

type Flash = { kind: "ok" | "err"; text: string } | null;

type PendingDialog =
  | { kind: "approve"; user: ManagedUser }
  | { kind: "block"; user: ManagedUser }
  | { kind: "unblock"; user: ManagedUser }
  | { kind: "role"; user: ManagedUser }
  | { kind: "reset"; user: ManagedUser }
  | null;

export function UserManagement({ isDemo }: { isDemo?: boolean }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<Flash>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [dialog, setDialog] = useState<PendingDialog>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [roleChoice, setRoleChoice] = useState<UserRole>(DEFAULT_APPROVAL_ROLE);
  const [blockReason, setBlockReason] = useState("");
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [listResult, summaryResult] = await Promise.all([
      listUsers(search, statusFilter),
      getUserSummary(),
    ]);

    if (listResult.ok && listResult.data) setUsers(listResult.data);
    else if (!listResult.ok) setFlash({ kind: "err", text: listResult.message });

    if (summaryResult.ok && summaryResult.data) setSummary(summaryResult.data);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-refresh ringan supaya permohonan baharu muncul tanpa reload.
  useEffect(() => {
    const t = setInterval(() => void load(), 45_000);
    return () => clearInterval(t);
  }, [load]);

  const pending = useMemo(
    () => users.filter((u) => u.account_status === "pending"),
    [users],
  );

  function openDialog(next: PendingDialog) {
    setDialogError(null);
    setBlockReason("");
    if (next?.kind === "approve" || next?.kind === "role") {
      setRoleChoice(
        next.kind === "role" ? next.user.role : DEFAULT_APPROVAL_ROLE,
      );
    }
    setDialog(next);
  }

  /** Luluskan terus dengan role lalai (tindakan pantas dari tab Menunggu). */
  async function quickApprove(user: ManagedUser) {
    setBusyId(user.id);
    setFlash(null);
    const res = await approveUser(user.id, DEFAULT_APPROVAL_ROLE);
    setBusyId(null);
    setFlash({ kind: res.success ? "ok" : "err", text: res.message });
    if (res.success) await load();
  }

  async function submitDialog() {
    if (!dialog) return;
    setDialogBusy(true);
    setDialogError(null);

    let res: { success: boolean; message: string; value?: string | number | null };

    switch (dialog.kind) {
      case "approve":
        res = await approveUser(dialog.user.id, roleChoice);
        break;
      case "block":
        res = await setUserBlocked(dialog.user.id, true, blockReason);
        break;
      case "unblock":
        res = await setUserBlocked(dialog.user.id, false, "");
        break;
      case "role":
        res = await changeUserRole(dialog.user.id, roleChoice);
        break;
      case "reset":
        res = await resetUserPassword(dialog.user.id);
        break;
      default:
        res = { success: false, message: "Tindakan tidak dikenali." };
    }

    setDialogBusy(false);

    if (!res.success) {
      setDialogError(res.message);
      return;
    }

    if (dialog.kind === "reset" && typeof res.value === "string") {
      setRevealedPassword(res.value);
      setFlash({ kind: "ok", text: res.message });
      setDialog(null);
      await load();
      return;
    }

    setFlash({ kind: "ok", text: res.message });
    setDialog(null);
    await load();
  }

  async function forcePasswordChange(user: ManagedUser) {
    setBusyId(user.id);
    setFlash(null);
    const res = await requirePasswordChange(user.id, !user.must_change_password);
    setBusyId(null);
    setFlash({ kind: res.success ? "ok" : "err", text: res.message });
    if (res.success) await load();
  }

  const dialogUser = dialog?.user ?? null;

  return (
    <div className="space-y-5">
      {/* Tajuk */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <UserCog className="h-6 w-6 text-primary" />
            Admin Pengguna
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelulusan akaun baharu, sekatan, role dan kata laluan. Hanya Super
            Admin boleh mengakses halaman ini — semua tindakan direkod dalam
            audit log.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Muat Semula
        </Button>
      </div>

      {isDemo && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          Mod Demo — data di bawah adalah contoh. Tindakan tidak benar-benar
          mengubah pangkalan data.
        </div>
      )}

      {/* Mesej tindakan */}
      {flash && (
        <div
          className={
            flash.kind === "ok"
              ? "flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
              : "flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
          }
        >
          {flash.kind === "ok" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{flash.text}</span>
          <button
            type="button"
            onClick={() => setFlash(null)}
            className="text-xs opacity-60 hover:opacity-100"
            aria-label="Tutup mesej"
          >
            ✕
          </button>
        </div>
      )}

      {/* Kata laluan yang didedahkan selepas reset */}
      {revealedPassword && (
        <Card className="border-amber-300 bg-amber-50/70">
          <CardContent className="flex flex-wrap items-center gap-3 py-4">
            <KeyRound className="h-5 w-5 text-amber-700" />
            <div className="flex-1 text-sm text-amber-900">
              <p className="font-medium">Kata laluan lalai baharu</p>
              <p className="text-xs">
                Maklumkan kepada pengguna secara selamat. Mereka akan diwajibkan
                menukarnya semasa log masuk pertama.
              </p>
            </div>
            <code className="rounded border border-amber-300 bg-white px-3 py-1.5 font-mono text-base font-bold tracking-wider text-amber-900">
              {revealedPassword}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevealedPassword(null)}
            >
              Sembunyi
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Kpi label="Jumlah Pengguna" value={summary?.total_users} icon={Users} />
        <Kpi
          label="Menunggu Kelulusan"
          value={summary?.pending_users}
          icon={UserCheck}
          tone={summary?.pending_users ? "amber" : "slate"}
        />
        <Kpi label="Aktif" value={summary?.active_users} icon={ShieldCheck} tone="emerald" />
        <Kpi
          label="Disekat"
          value={summary?.blocked_users}
          icon={Ban}
          tone={summary?.blocked_users ? "rose" : "slate"}
        />
        <Kpi
          label="Guna Kata Laluan Lalai"
          value={summary?.default_password_users}
          icon={KeyRound}
          tone={summary?.default_password_users ? "amber" : "slate"}
        />
        <Kpi label="Super Admin" value={summary?.super_admins} icon={UserCog} />
      </div>

      {/* Carian & penapis */}
      <Card>
        <CardHeader className="space-y-3 pb-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1 space-y-1.5">
              <Label htmlFor="userSearch">Carian</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="userSearch"
                  className="pl-9"
                  placeholder="Nama, e-mel atau jabatan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="w-56 space-y-1.5">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                Menunggu Kelulusan
                {pending.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                    {pending.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="all">Semua Pengguna ({users.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-3">
              {loading ? (
                <LoadingRow />
              ) : pending.length === 0 ? (
                <EmptyRow text="Tiada permohonan yang menunggu kelulusan." />
              ) : (
                <UserTable
                  users={pending}
                  busyId={busyId}
                  onApprove={quickApprove}
                  onOpen={openDialog}
                  onForcePassword={forcePasswordChange}
                  mode="pending"
                />
              )}
            </TabsContent>

            <TabsContent value="all" className="mt-3">
              {loading ? (
                <LoadingRow />
              ) : users.length === 0 ? (
                <EmptyRow text="Tiada pengguna sepadan dengan carian/penapis." />
              ) : (
                <UserTable
                  users={users}
                  busyId={busyId}
                  onApprove={quickApprove}
                  onOpen={openDialog}
                  onForcePassword={forcePasswordChange}
                  mode="all"
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Nota dasar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Polisi Kata Laluan & Pendaftaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>
            • Log masuk menggunakan <strong>e-mel + kata laluan sahaja</strong>.
            Kata laluan lalai sistem ialah{" "}
            <code className="rounded bg-slate-100 px-1 font-mono font-semibold text-slate-800">
              {DEFAULT_PASSWORD}
            </code>{" "}
            dan pengguna <strong>diwajibkan menukarnya</strong> sebaik sahaja log
            masuk.
          </p>
          <p>
            • Pendaftaran sendiri mencipta akaun berstatus{" "}
            <strong>Menunggu Kelulusan</strong> dengan role paling rendah
            (Pemerhati). Akaun itu tidak boleh mengakses mana-mana modul
            sehingga anda meluluskannya.
          </p>
          <p>
            • <strong>Set semula kata laluan</strong> mengembalikan kata laluan
            ke lalai dan menamatkan semua sesi aktif pengguna itu.
          </p>
          <p>
            • <strong>Sekatan</strong> serta-merta menghalang akses dan
            memadamkan refresh token pengguna. Anda tidak boleh menyekat akaun
            sendiri, dan sekurang-kurangnya satu Super Admin aktif mesti kekal.
          </p>
          <p>
            • Role <strong>Super Admin</strong> tidak boleh diberi melalui
            halaman ini — ia hanya boleh ditetapkan melalui SQL oleh pemilik
            sistem, bagi mengelakkan eskalasi kuasa tanpa kawalan.
          </p>
        </CardContent>
      </Card>

      {/* Dialog tindakan */}
      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-lg">
          {dialog && dialogUser && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {dialog.kind === "approve" && "Luluskan Permohonan Pengguna"}
                  {dialog.kind === "block" && "Sekat Pengguna"}
                  {dialog.kind === "unblock" && "Tarik Balik Sekatan"}
                  {dialog.kind === "role" && "Tukar Role Pengguna"}
                  {dialog.kind === "reset" && "Set Semula Kata Laluan"}
                </DialogTitle>
                <DialogDescription>
                  <span className="font-medium text-foreground">
                    {dialogUser.full_name}
                  </span>{" "}
                  · {dialogUser.email}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-1">
                {(dialog.kind === "approve" || dialog.kind === "role") && (
                  <div className="space-y-2">
                    <Label>Role Sistem</Label>
                    <Select
                      value={roleChoice}
                      onValueChange={(v) => setRoleChoice(v as UserRole)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                      {ROLE_DESCRIPTION[roleChoice]}
                    </p>
                    {dialog.kind === "approve" && (
                      <p className="text-xs text-muted-foreground">
                        Kelulusan akan menukar status akaun kepada{" "}
                        <strong>Aktif</strong> dan merekodkan anda sebagai
                        pelulus dalam audit log.
                      </p>
                    )}
                  </div>
                )}

                {dialog.kind === "block" && (
                  <div className="space-y-2">
                    <Label htmlFor="blockReason">Sebab Sekatan (wajib)</Label>
                    <Textarea
                      id="blockReason"
                      rows={3}
                      placeholder="cth. Kontrak tamat — akses ditarik balik."
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                    />
                    <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
                      Pengguna akan serta-merta hilang akses dan semua sesi
                      aktifnya ditamatkan. Sebab ini disimpan dalam rekod audit
                      dan dipaparkan kepada pengguna.
                    </p>
                  </div>
                )}

                {dialog.kind === "unblock" && (
                  <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                    Pengguna akan dibenarkan log masuk semula. Rekod sekatan
                    (sebab, tarikh, siapa) akan dibersihkan daripada profil,
                    tetapi sejarah dalam audit log kekal.
                  </p>
                )}

                {dialog.kind === "reset" && (
                  <div className="space-y-2">
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      Kata laluan pengguna akan dikembalikan kepada{" "}
                      <code className="rounded bg-white/70 px-1 font-mono font-semibold">
                        {DEFAULT_PASSWORD}
                      </code>
                      . Semua sesi aktifnya ditamatkan dan beliau diwajibkan
                      menukar kata laluan pada log masuk seterusnya.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Untuk akaun sendiri, guna halaman{" "}
                      <strong>Keselamatan</strong> — reset kendiri tidak
                      dibenarkan di sini.
                    </p>
                  </div>
                )}

                {dialogError && (
                  <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {dialogError}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialog(null)}
                  disabled={dialogBusy}
                >
                  Batal
                </Button>
                <Button
                  onClick={() => void submitDialog()}
                  disabled={dialogBusy}
                  variant={dialog.kind === "block" ? "destructive" : "default"}
                >
                  {dialogBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {dialog.kind === "approve" && "Luluskan"}
                  {dialog.kind === "block" && "Sekat Pengguna"}
                  {dialog.kind === "unblock" && "Tarik Balik Sekatan"}
                  {dialog.kind === "role" && "Simpan Role"}
                  {dialog.kind === "reset" && "Set Semula Kata Laluan"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ======================================================================= */
/* Sub-komponen                                                             */
/* ======================================================================= */

function Kpi({
  label,
  value,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value?: number;
  icon: typeof Users;
  tone?: "slate" | "amber" | "emerald" | "rose";
}) {
  const toneClass = {
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    rose: "bg-rose-100 text-rose-700",
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold leading-tight">
            {value === undefined ? "—" : value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ user }: { user: ManagedUser }) {
  const s = user.account_status;
  const cls =
    s === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : s === "pending"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}
    >
      {STATUS_SHORT_LABEL[s]}
    </span>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Memuatkan pengguna...
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="py-10 text-center text-sm text-muted-foreground">{text}</div>
  );
}

function UserTable({
  users,
  busyId,
  onApprove,
  onOpen,
  onForcePassword,
  mode,
}: {
  users: ManagedUser[];
  busyId: string | null;
  onApprove: (u: ManagedUser) => void;
  onOpen: (d: PendingDialog) => void;
  onForcePassword: (u: ManagedUser) => void;
  mode: "pending" | "all";
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[220px]">Pengguna</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Kata Laluan</TableHead>
            <TableHead>Daftar / Log Masuk</TableHead>
            <TableHead className="text-right">Tindakan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const busy = busyId === u.id;
            const isSuper = u.role === "super_admin";
            return (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">{u.full_name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                  {(u.designation || u.department) && (
                    <div className="text-[11px] text-muted-foreground/80">
                      {[u.designation, u.department].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {u.block_reason && (
                    <div className="mt-1 max-w-xs truncate text-[11px] text-rose-600" title={u.block_reason}>
                      Sebab: {u.block_reason}
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <Badge variant={isSuper ? "default" : "secondary"}>
                    {roleLabel(u.role)}
                  </Badge>
                </TableCell>

                <TableCell>
                  <StatusBadge user={u} />
                </TableCell>

                <TableCell>
                  {u.must_change_password ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                      <KeyRound className="h-3 w-3" />
                      Lalai — wajib tukar
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                      <ShieldCheck className="h-3 w-3" />
                      Ditukar {formatWhen(u.password_changed_at)}
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-[11px] text-muted-foreground">
                  <div>Daftar: {formatWhen(u.created_at)}</div>
                  <div>
                    Masuk: {formatWhen(u.auth_last_sign_in_at ?? u.last_login_at)}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {u.account_status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => onApprove(u)}
                          disabled={busy}
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Luluskan
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpen({ kind: "approve", user: u })}
                          disabled={busy}
                        >
                          Luluskan + Role
                        </Button>
                      </>
                    )}

                    {u.account_status !== "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpen({ kind: "role", user: u })}
                        disabled={busy || isSuper}
                        title={
                          isSuper
                            ? "Role Super Admin hanya boleh diubah melalui SQL"
                            : "Tukar role"
                        }
                      >
                        <UserCog className="h-3.5 w-3.5" />
                        Role
                      </Button>
                    )}

                    {u.account_status !== "blocked" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpen({ kind: "block", user: u })}
                        disabled={busy || isSuper}
                        title={
                          isSuper
                            ? "Super Admin tidak boleh disekat dari halaman ini"
                            : "Sekat pengguna"
                        }
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Sekat
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpen({ kind: "unblock", user: u })}
                        disabled={busy}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Nyahsekat
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onOpen({ kind: "reset", user: u })}
                      disabled={busy || isSuper}
                      title={
                        isSuper
                          ? "Guna halaman Keselamatan untuk akaun sendiri"
                          : "Set semula kata laluan"
                      }
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Reset
                    </Button>

                    {mode === "all" && u.account_status === "active" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onForcePassword(u)}
                        disabled={busy}
                        title={
                          u.must_change_password
                            ? "Batalkan tuntutan tukar kata laluan"
                            : "Wajibkan tukar kata laluan pada log masuk seterusnya"
                        }
                      >
                        {u.must_change_password ? "Batal Wajib" : "Wajibkan Tukar"}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
