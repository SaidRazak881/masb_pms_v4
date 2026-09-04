"use client";

/**
 * alias-confirmation.tsx — Permukaan MANUSIA bagi pengesahan pengurus akaun.
 *
 * Prinsip reka bentuk yang tidak boleh dilanggar (spesifikasi sistem):
 *
 *   1. **Sistem mencadangkan, manusia memutuskan.** Padanan bertingkat
 *      (`resolve_account_manager`) hanya menghasilkan **cadangan**. Tiada
 *      laluan dalam komponen ini yang mengesahkan alias secara automatik.
 *   2. **AI/tidak pernah memutuskan penggabungan kewangan.** Veto Kewangan §2.4
 *      menghalang **sistem** memilih seorang daripada sel berbilang orang.
 *      Tetapi DP-8 (keputusan pengguna) membenarkan **manusia** memutuskan —
 *      jadi UI ini TIDAK menyekat nilai berbilang orang; ia **memaksa nota**
 *      supaya keputusan itu boleh diaudit (syarat QA dalam DP-8).
 *   3. **Setiap keputusan boleh dibatalkan.** `am_revoke_alias` /
 *      `am_revoke_external` didedahkan, dengan amaran kesan komisen Fasa 8F.
 *   4. **Pendedahan minimum §2.8.** Pemilih staf hanya menerima `id` +
 *      `full_name` daripada `am_list_staff()`. Komponen ini **tidak** cuba
 *      memaparkan peranan, e-mel atau status staf, kerana data itu memang
 *      tidak dihantar.
 *
 * Kebenaran TIDAK diputuskan di sini — setiap RPC mengawal dirinya sendiri
 * (disahkan di live oleh L3-R S4/S5/S6).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Info,
  RefreshCw,
  UserX,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  confirmAlias,
  confirmExternal,
  listExternal,
  listStaffOptions,
  listUnresolvedValues,
  revokeAlias,
  revokeExternal,
} from "@/lib/actions/account-manager-actions";
import {
  isKeputusanPengguna,
  isMultiPersonRaw,
  kategoriLabel,
  kategoriTone,
  notaKeputusanPengguna,
  perluTindakan,
  summarizeUnresolved,
  TONE_CLASS,
  type AmExternalEntry,
  type AmStaffOption,
  type AmUnresolvedValue,
} from "@/lib/account-manager";

/* ====================== Jenis dalaman ====================== */

type Tab = "semua" | "perlu" | "selesai" | "luar";

type DialogState =
  | { kind: "alias"; row: AmUnresolvedValue }
  | { kind: "external"; row: AmUnresolvedValue }
  | { kind: "revokeAlias"; row: AmUnresolvedValue }
  | { kind: "revokeExternal"; row: AmUnresolvedValue }
  | null;

type Banner = { tone: "ok" | "error" | "info"; text: string } | null;

const PLACEHOLDER_STAFF = "__pilih__";

/* ====================== Komponen ====================== */

export function AliasConfirmation({
  isDemo,
  canResolve,
}: {
  isDemo: boolean;
  canResolve: boolean;
}) {
  const [rows, setRows] = useState<AmUnresolvedValue[]>([]);
  const [staff, setStaff] = useState<AmStaffOption[]>([]);
  const [external, setExternal] = useState<AmExternalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("semua");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [banner, setBanner] = useState<Banner>(null);
  const [busy, setBusy] = useState(false);

  // Borang dialog alias
  const [pickedStaff, setPickedStaff] = useState<string>(PLACEHOLDER_STAFF);
  const [aliasNotes, setAliasNotes] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Borang dialog orang luar
  const [displayName, setDisplayName] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [externalNotes, setExternalNotes] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [u, s, e] = await Promise.all([
      listUnresolvedValues(),
      listStaffOptions(),
      listExternal(),
    ]);
    setRows(u.rows);
    setStaff(s.rows);
    setExternal(e.rows);
    if (u.error) setLoadError(u.error);
    else if (s.error) setLoadError(s.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => summarizeUnresolved(rows), [rows]);

  const visible = useMemo(() => {
    if (tab === "perlu") return rows.filter((r) => perluTindakan(r.kategori));
    if (tab === "selesai") return rows.filter((r) => r.kategori === "SELESAI");
    if (tab === "luar") return rows.filter((r) => r.kategori === "LUAR");
    return rows;
  }, [rows, tab]);

  const openDialog = (state: DialogState) => {
    setFormError(null);
    setBanner(null);
    setPickedStaff(PLACEHOLDER_STAFF);
    setAliasNotes("");
    // SATU-SATUNYA pemangkasan yang dibenarkan dalam fail ini, dan ia sengaja:
    // ini ialah NAMA PAPARAN pra-isi untuk orang luar (medan baharu yang
    // dicipta manusia), BUKUNYA kunci yang dihantar ke pangkalan data.
    // Nama paparan dengan ruang hujung hanya menambah geseran. Kunci sebenar
    // `raw_text` dihantar TANPA trim dalam keempat-empat laluan tulisan di
    // bawah — jika tidak, "Fuzy / Sholihin " tidak akan sepadan dengan DB.
    setDisplayName(state?.kind === "external" ? state.row.raw_text.trim() : "");
    setReason("");
    setExternalNotes("");
    setDialog(state);
  };

  const runWrite = async (fn: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(true);
    setFormError(null);
    const result = await fn();
    setBusy(false);
    if (!result.ok) {
      // Ralat kuasa (42501) ditunjukkan dalam dialog supaya pengguna nampak
      // sebabnya di konteks tindakannya, bukan sebagai banner umum.
      setFormError(result.message);
      return false;
    }
    setDialog(null);
    setBanner({ tone: "ok", text: result.message });
    await load();
    return true;
  };

  const submitAlias = async () => {
    if (!dialog || dialog.kind !== "alias") return;
    const userId = pickedStaff === PLACEHOLDER_STAFF ? null : pickedStaff;
    await runWrite(() => confirmAlias(dialog.row.raw_text, userId ?? "", aliasNotes));
  };

  const submitExternal = async () => {
    if (!dialog || dialog.kind !== "external") return;
    await runWrite(() =>
      confirmExternal(dialog.row.raw_text, displayName, reason, externalNotes),
    );
  };

  const submitRevoke = async () => {
    if (!dialog) return;
    if (dialog.kind === "revokeAlias") {
      await runWrite(() => revokeAlias(dialog.row.raw_text));
    } else if (dialog.kind === "revokeExternal") {
      await runWrite(() => revokeExternal(dialog.row.raw_text));
    }
  };

  const dialogRow = dialog ? dialog.row : null;
  const dialogMulti = dialogRow ? isMultiPersonRaw(dialogRow.raw_text) : false;
  const dialogNotaPengguna = dialogRow ? notaKeputusanPengguna(dialogRow.raw_text) : null;

  return (
    <div className="space-y-6">
      {/* ===================== Papan tajuk ===================== */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Pengurus Akaun</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Nilai mentah lajur <span className="font-mono">Account Manager</span>{" "}
            daripada invois dan import. Sistem hanya <strong>mencadangkan</strong>;
            keputusan siapa yang patut menerima sesuatu nilai dibuat oleh manusia
            di sini, dan setiap keputusan direkodkan dalam jejak audit.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Muat semula
        </Button>
      </div>

      {isDemo && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <strong>Mod demo.</strong> Data di bawah ialah simulasi, bukan
            pangkalan data pengeluaran. Bacaan dibenarkan untuk menilai paparan;{" "}
            <strong>tulisan ditolak</strong>. Sambungkan Supabase untuk membuat
            keputusan sebenar.
          </div>
        </div>
      )}

      {!canResolve && !isDemo && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <strong>Tiada kuasa.</strong> Peranan anda tidak dibenarkan mengesahkan
            alias. Halaman ini boleh dibaca dalam keadaan terhad, tetapi sebarang
            tindakan akan ditolak oleh pangkalan data dengan kod{" "}
            <span className="font-mono">42501</span>.
          </div>
        </div>
      )}

      {banner && (
        <div
          className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
            banner.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : banner.tone === "error"
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : "border-sky-200 bg-sky-50 text-sky-900"
          }`}
        >
          {banner.tone === "ok" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div className="flex-1">{banner.text}</div>
          <button
            type="button"
            className="text-xs opacity-60 hover:opacity-100"
            onClick={() => setBanner(null)}
          >
            tutup
          </button>
        </div>
      )}

      {loadError && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{loadError}</div>
        </div>
      )}

      {/* ===================== Ringkasan ===================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Nilai mentah unik</CardDescription>
            <CardTitle className="text-3xl">{summary.jumlah}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {summary.barisTerjejas} baris invois/import terjejas
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Perlu tindakan</CardDescription>
            <CardTitle className="text-3xl">{summary.perluTindakan}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Belum ada keputusan manusia
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Selesai</CardDescription>
            <CardTitle className="text-3xl">{summary.selesai}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Boleh diagih kepada staf
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Orang luar</CardDescription>
            <CardTitle className="text-3xl">{summary.luar}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Sudah diputuskan, sengaja tidak diagih
          </CardContent>
        </Card>
      </div>

      {/* ===================== Penapis ===================== */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="semua">Semua ({summary.jumlah})</TabsTrigger>
          <TabsTrigger value="perlu">Perlu tindakan ({summary.perluTindakan})</TabsTrigger>
          <TabsTrigger value="selesai">Selesai ({summary.selesai})</TabsTrigger>
          <TabsTrigger value="luar">Orang luar ({summary.luar})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ===================== Jadual ===================== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nilai pengurus akaun</CardTitle>
          <CardDescription>
            Nilai mentah dikekalkan sebagaimana adanya (jejak audit). Pengesahan
            menambah pautan UUID <strong>tanpa</strong> membuang teks asal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sedang membaca…
            </p>
          ) : visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {rows.length === 0
                ? "Tiada nilai mentah Account Manager dijumpai. Ini dijangka jika data invois/import belum mengandungi nilai dalam lajur itu."
                : "Tiada nilai dalam penapis ini."}
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nilai mentah</TableHead>
                    <TableHead className="text-right">Baris</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Diselesaikan kepada</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((r) => {
                    const tone = kategoriTone(r.kategori);
                    const multi = isMultiPersonRaw(r.raw_text);
                    const keputusanPengguna = isKeputusanPengguna(r.raw_text);
                    const isLuar = r.kategori === "LUAR";
                    return (
                      <TableRow key={r.raw_text}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {/* Ruang hujung adalah SEBAHAGIAN daripada nilai
                                mentah ('Fuzy / Sholihin ') — jangan dipangkas
                                dalam paparan, atau pengguna akan mengesahkan
                                rentetan yang berbeza daripada yang di pangkalan
                                data. `whitespace-pre-wrap` mengekalkannya. */}
                            <span className="whitespace-pre-wrap font-mono text-sm">
                              {r.raw_text}
                            </span>
                            <span className="flex flex-wrap gap-1.5">
                              {multi && (
                                <Badge variant="outline" className="border-amber-300 text-amber-800">
                                  berbilang orang
                                </Badge>
                              )}
                              {keputusanPengguna && (
                                <Badge variant="outline" className="border-violet-300 text-violet-800">
                                  keputusan pengguna
                                </Badge>
                              )}
                              {r.alias_wujud && (
                                <Badge variant="outline" className="border-emerald-300 text-emerald-800">
                                  alias manusia
                                </Badge>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <div>{r.jumlah_baris}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.dari_invoices} invois · {r.dari_staging} import
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={TONE_CLASS[tone]}>
                            {kategoriLabel(r.kategori)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {r.resolved_name ? (
                            <span className="text-sm">{r.resolved_name}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {isLuar ? "— (orang luar)" : "— belum diputuskan"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {perluTindakan(r.kategori) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDialog({ kind: "alias", row: r })}
                                  disabled={isDemo}
                                >
                                  <BadgeCheck className="mr-1.5 h-3.5 w-3.5" />
                                  Sahkan alias
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openDialog({ kind: "external", row: r })}
                                  disabled={isDemo}
                                >
                                  <UserX className="mr-1.5 h-3.5 w-3.5" />
                                  Orang luar
                                </Button>
                              </>
                            )}
                            {r.alias_wujud && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openDialog({ kind: "revokeAlias", row: r })}
                                disabled={isDemo}
                              >
                                Batalkan alias
                              </Button>
                            )}
                            {isLuar && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openDialog({ kind: "revokeExternal", row: r })}
                                disabled={isDemo}
                              >
                                Batalkan luar
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
          )}
        </CardContent>
      </Card>

      {/* ===================== Orang luar yang disahkan ===================== */}
      {external.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orang luar yang sudah disahkan</CardTitle>
            <CardDescription>
              Nilai ini <strong>sudah diputuskan</strong> sebagai bukan staf
              MIMOS Academy. Ia kekal tidak diagih, tetapi dilaporkan berasingan
              daripada baki yang belum diputuskan — perbezaan inilah inti DP-9.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nilai mentah</TableHead>
                    <TableHead>Nama paparan</TableHead>
                    <TableHead>Sebab</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {external.map((e) => (
                    <TableRow key={e.raw_text}>
                      <TableCell className="whitespace-pre-wrap font-mono text-sm">
                        {e.raw_text}
                      </TableCell>
                      <TableCell>{e.display_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {e.reason ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isDemo}
                          onClick={() =>
                            openDialog({
                              kind: "revokeExternal",
                              row: {
                                raw_text: e.raw_text,
                                jumlah_baris: 0,
                                dari_invoices: 0,
                                dari_staging: 0,
                                resolved_id: null,
                                resolved_name: null,
                                kategori: "LUAR",
                                alias_wujud: false,
                              },
                            })
                          }
                        >
                          Batalkan
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===================== Dialog ===================== */}
      <Dialog open={dialog !== null} onOpenChange={(o) => !o && !busy && setDialog(null)}>
        <DialogContent className="max-w-lg">
          {dialog && dialogRow && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {dialog.kind === "alias" && "Sahkan alias pengurus akaun"}
                  {dialog.kind === "external" && "Klasifikasikan sebagai orang luar"}
                  {dialog.kind === "revokeAlias" && "Batalkan alias"}
                  {dialog.kind === "revokeExternal" && "Batalkan klasifikasi orang luar"}
                </DialogTitle>
                <DialogDescription>
                  Nilai mentah:{" "}
                  <span className="whitespace-pre-wrap font-mono">
                    {dialogRow.raw_text}
                  </span>
                  {dialogRow.jumlah_baris > 0 &&
                    ` · ${dialogRow.jumlah_baris} baris terjejas`}
                </DialogDescription>
              </DialogHeader>

              {/* Amaran berbilang orang — veto §2.4 vs keputusan manusia DP-8 */}
              {dialogMulti && dialog.kind === "alias" && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    Nilai ini mengandungi <strong>lebih daripada seorang</strong>.
                    Sistem <strong>tidak akan</strong> memilih seorang secara
                    automatik (veto Kewangan §2.4). Anda — sebagai manusia —
                    <strong> boleh</strong> memutuskan (DP-8), tetapi nota sebab
                    <strong> diwajibkan</strong> supaya keputusan itu boleh
                    diaudit. Staf lain dalam sel ini tidak akan menerima kredit
                    untuk baris tersebut, dan ini akan mempengaruhi laporan
                    komisen Fasa 8F.
                  </div>
                </div>
              )}

              {/* Konteks keputusan pengguna yang sedia ada */}
              {dialogNotaPengguna && (
                <div className="flex items-start gap-2 rounded-md border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>{dialogNotaPengguna}</div>
                </div>
              )}

              {/* Amaran pembatalan */}
              {(dialog.kind === "revokeAlias" || dialog.kind === "revokeExternal") && (
                <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    Pembatalan akan mengembalikan nilai ini kepada keadaan{" "}
                    <strong>belum diputuskan</strong>, dan baris yang terjejas
                    tidak lagi boleh diagih dalam laporan. Tindakan ini
                    direkodkan dalam jejak audit. Jika nilai ini ialah keputusan
                    pengguna (DP-8/DP-9), pembatalan akan mengubah angka komisen
                    Fasa 8F.
                  </div>
                </div>
              )}

              {/* Borang alias */}
              {dialog.kind === "alias" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="staff">Staf yang menerima nilai ini</Label>
                    <Select value={pickedStaff} onValueChange={setPickedStaff}>
                      <SelectTrigger id="staff">
                        <SelectValue placeholder="Pilih staf…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PLACEHOLDER_STAFF} disabled>
                          Pilih staf…
                        </SelectItem>
                        {staff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Senarai ini hanya mengandungi staf <strong>aktif</strong>,
                      dan hanya nama — peranan, e-mel dan status akaun sengaja
                      tidak didedahkan (veto §2.8).
                    </p>
                    {staff.length === 0 && (
                      <p className="text-xs text-rose-700">
                        Tiada staf dikembalikan. Sama ada tiada profil aktif, atau
                        peranan anda tidak dibenarkan menyenaraikannya.
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">
                      Nota / sebab
                      {dialogMulti && <span className="text-rose-700"> (wajib)</span>}
                    </Label>
                    <Textarea
                      id="notes"
                      rows={3}
                      value={aliasNotes}
                      onChange={(e) => setAliasNotes(e.target.value)}
                      placeholder={
                        dialogMulti
                          ? "Contoh: Pengesahan pemilik — 'Fuzy' ialah nama panggilan Fuziah (DP-8)."
                          : "Pilihan, tetapi digalakkan untuk keputusan yang tidak jelas."
                      }
                    />
                  </div>
                </div>
              )}

              {/* Borang orang luar */}
              {dialog.kind === "external" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="displayName">
                      Nama paparan <span className="text-rose-700">(wajib)</span>
                    </Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nama yang akan dipaparkan dalam laporan"
                    />
                    <p className="text-xs text-muted-foreground">
                      Diperlukan kerana <strong>LUAR</strong> bermaksud &ldquo;sudah
                      diputuskan&rdquo;. Tanpa nama, laporan tidak dapat membezakan
                      orang luar daripada baki yang belum diputuskan.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reason">Sebab</Label>
                    <Input
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Contoh: jurulatih luar, bukan staf MIMOS Academy"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="extNotes">Nota tambahan</Label>
                    <Textarea
                      id="extNotes"
                      rows={2}
                      value={externalNotes}
                      onChange={(e) => setExternalNotes(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {formError && (
                <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-900">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>{formError}</div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialog(null)}
                  disabled={busy}
                >
                  Batal
                </Button>
                {dialog.kind === "alias" && (
                  <Button onClick={() => void submitAlias()} disabled={busy}>
                    {busy ? "Menyimpan…" : "Sahkan alias"}
                  </Button>
                )}
                {dialog.kind === "external" && (
                  <Button onClick={() => void submitExternal()} disabled={busy}>
                    {busy ? "Menyimpan…" : "Klasifikasikan"}
                  </Button>
                )}
                {(dialog.kind === "revokeAlias" || dialog.kind === "revokeExternal") && (
                  <Button
                    variant="destructive"
                    onClick={() => void submitRevoke()}
                    disabled={busy}
                  >
                    {busy ? "Membatalkan…" : "Ya, batalkan"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
