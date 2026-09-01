import type { Metadata } from "next";

import { ImportHistory } from "@/components/import/import-history";
import { SmartExcelImport } from "@/components/import/smart-excel-import";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Import Data (Excel)",
  description:
    "Staging Area pintar untuk muat naik Excel — Sebut Harga, Invois dan Cost of Sale",
};

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Import Excel Pintar
        </h1>
        <p className="text-sm text-muted-foreground">
          Muat naik <strong>Quotation Tracker</strong> atau{" "}
          <strong>Income Statement</strong> MIMOS Academy. Sistem mengenali
          pengepala secara automatik, mengesahkan lajur wajib, mengesan
          kemungkinan pendua, dan memetakan data ke jadual{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
            import_staging
          </code>{" "}
          untuk semakan akhir. Semua keputusan sync direkodkan dalam audit
          log dan boleh disemak semula di bawah tab Sejarah Import.
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Muat Naik &amp; Semakan</TabsTrigger>
          <TabsTrigger value="history">Sejarah Import</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="space-y-4">
          <SmartExcelImport />
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
          <ImportHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
