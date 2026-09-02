import type { Metadata } from "next";
import Link from "next/link";
import { Upload } from "lucide-react";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { Button } from "@/components/ui/button";
import { loadDashboardData } from "@/lib/dashboard-data";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Ringkasan keseluruhan program latihan MIMOS Academy",
};

export default async function DashboardPage() {
  const data = await loadDashboardData();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan program latihan, kewangan, import dan tadbir urus MIMOS
            Academy. Dikemas kini pada{" "}
            {new Date(data.generatedAt).toLocaleString("ms-MY")}.
          </p>
        </div>
        <Link href="/import">
          <Button>
            <Upload className="h-4 w-4" />
            Import Data (Excel)
          </Button>
        </Link>
      </div>

      <DashboardOverview data={data} />
    </div>
  );
}
