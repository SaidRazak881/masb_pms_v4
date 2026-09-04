/**
 * DataAttentionPanel — "data bermasalah ditonjolkan di paparan utama"
 * ==================================================================
 *
 * Prinsip pengguna (2026-09-05, direkodkan sebagai DP-22):
 *
 *   "Dalam sistem, data yang tidak lengkap atau bermasalah akan dihighlight
 *    pada paparan utama sistem untuk user kemaskini dan membuat pengesahan
 *    manual."
 *
 * Jadi pengguna TIDAK perlu tahu bahawa halaman `/account-managers` wujud, atau
 * pergi mencarinya. Dashboard — paparan yang dibuka setiap hari — memberitahu
 * mereka berapa nilai yang menunggu keputusan, dan memberi satu pautan untuk
 * memutuskannya. Pengesahan kekal **manual**: panel ini tidak menulis apa-apa.
 *
 * PENDEKATAN TERMUDAH YANG SAH (keputusan DP-22.2)
 * ------------------------------------------------
 * Panel ini membaca `am_unresolved_values()` — RPC yang **sudah dipasang di
 * live** (Langkah 3, disahkan L3-R S1/S3/S4). Maka:
 *
 *   • TIADA SQL baharu → TIADA migration → TIADA HARD GATE
 *   • TIADA pusingan ChatGPT/Supabase diperlukan untuk menghantarnya
 *   • Kuasa kekal di pangkalan data: RPC menolak sendiri (42501) dan
 *     memulangkan kosong bagi peranan yang tidak dibenarkan, jadi panel ini
 *     hanya menyembunyikan dirinya — ia tidak pernah menjadi pihak berkuasa.
 *
 * Alternatif yang ditolak: RPC ringkasan baharu (`am_ringkasan_perlu_tindakan`)
 * lebih murah satu baris SQL, tetapi memerlukan migration live dan satu pusingan
 * GPT — bukan "paling mudah untuk di-apply" seperti yang diminta.
 *
 * Komponen ini SENGAJA bukan "use client": ia menerima data daripada Server
 * Component dan tidak membuat permintaan sendiri, jadi tiada JavaScript tambahan
 * dihantar ke pelayar dan tiada risiko ia menulis secara senyap.
 */

import Link from "next/link";
import { AlertTriangle, ArrowRight, BadgeCheck, CheckCircle2, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  kategoriLabel,
  kategoriTone,
  perluTindakan,
  summarizeUnresolved,
  TONE_CLASS,
  type AmUnresolvedValue,
} from "@/lib/account-manager";

type Props = {
  rows: AmUnresolvedValue[];
  isDemo: boolean;
  /**
   * Mesej ralat daripada Server Action, termasuk `42501` (tiada kuasa) dan kes
   * RPC belum dipasang. Dalam semua kes itu panel ini **tidak dipaparkan**:
   * peranan yang tidak dibenarkan tidak sepatutnya melihat kad ralat, dan
   * menyembunyikannya tidak melemahkan kawalan kerana kuasa dikuatkuasakan oleh
   * pangkalan data, bukan oleh panel ini.
   */
  error?: string;
};

/** Bilangan nilai teratas yang disenaraikan sebelum "dan N lagi". */
const MAKSIMUM_SENARAI = 5;

export function DataAttentionPanel({ rows, isDemo, error }: Props) {
  // Tiada kuasa / RPC hilang / ralat rangkaian -> senyap.
  if (error) return null;

  const ringkasan = summarizeUnresolved(rows);
  const menunggu = rows
    .filter((r) => perluTindakan(r.kategori))
    .sort((a, b) => Number(b.jumlah_baris) - Number(a.jumlah_baris));

  // Keadaan tenang: tiada apa yang menunggu keputusan manusia.
  // DP-21.5 menjelaskan MENGAPA ini biasa berlaku pada live hari ini — live
  // mempunyai sifar nilai `Account Manager` mentah sehingga data quotation/
  // invois masuk (Fasa 8B/8D). Tanpa ayat ini, kosong kelihatan seperti rosak.
  if (menunggu.length === 0) {
    return (
      <Card className="border-muted-foreground/20">
        <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="text-muted-foreground">
            Tiada data Account Manager menunggu pengesahan anda.
          </span>
          {rows.length === 0 && (
            <span className="text-xs text-muted-foreground/80">
              Keputusan DP-8/DP-9 sudah pra-rekod dan akan terpakai automatik
              apabila data quotation/invoice mengandungi nilai Account Manager.
            </span>
          )}
          {isDemo && (
            <Badge variant="outline" className="text-[10px]">
              Mod demo
            </Badge>
          )}
          <Link
            href="/account-managers"
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Buka Pengurus Akaun
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Keadaan menonjol: ada keputusan yang hanya manusia boleh buat.
  return (
    <Card className="border-amber-300 bg-amber-50/40">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Perlu pengesahan anda — {menunggu.length} nilai Account Manager
          <Badge variant="outline" className="text-[10px]">
            {ringkasan.barisTerjejas} baris terjejas
          </Badge>
          {isDemo && (
            <Badge variant="outline" className="text-[10px]">
              Mod demo — data contoh, tulisan ditolak
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Sistem tidak akan meneka pengurus akaun. Nilai di bawah memerlukan
          keputusan manusia supaya laporan kewangan dan komisen tidak salah
          secara senyap.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(ringkasan.mengikutKategori)
            .filter(([kategori]) => perluTindakan(kategori))
            .map(([kategori, jumlah]) => (
              <Badge
                key={kategori}
                variant="outline"
                className={TONE_CLASS[kategoriTone(kategori)]}
              >
                {kategoriLabel(kategori)} · {jumlah}
              </Badge>
            ))}
        </div>

        <ul className="divide-y divide-amber-200/70 rounded-md border border-amber-200 bg-white/70">
          {menunggu.slice(0, MAKSIMUM_SENARAI).map((r) => (
            <li
              key={r.raw_text}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm"
            >
              {/* Ruang putih dikekalkan: nilai seperti "Fuzy / Sholihin "
                  mempunyai ruang hujung yang bermakna (bait Excel sebenar). */}
              <span className="whitespace-pre-wrap font-mono text-xs">
                {r.raw_text}
              </span>
              <Badge
                variant="outline"
                className={TONE_CLASS[kategoriTone(r.kategori)]}
              >
                {kategoriLabel(r.kategori)}
              </Badge>
              <span className="ml-auto text-xs text-muted-foreground">
                {r.jumlah_baris} baris
              </span>
            </li>
          ))}
          {menunggu.length > MAKSIMUM_SENARAI && (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              dan {menunggu.length - MAKSIMUM_SENARAI} nilai lagi…
            </li>
          )}
        </ul>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/account-managers">
            <Button size="sm">
              Sahkan sekarang
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <span className="inline-flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Setiap keputusan direkodkan dengan jejak audit dan boleh dibatalkan.
          </span>
          {ringkasan.selesai + ringkasan.luar > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <BadgeCheck className="h-3 w-3 shrink-0 text-emerald-600" />
              {ringkasan.selesai} selesai · {ringkasan.luar} orang luar
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
