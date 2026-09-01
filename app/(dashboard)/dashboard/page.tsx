import type { Metadata } from "next";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { loadDashboardData } from "@/lib/dashboard-data";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Ringkasan keseluruhan program latihan MIMOS Academy",
};

export default async function DashboardPage() {
  const data = await loadDashboardData();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan program latihan, kewangan, import dan tadbir urus MIMOS
          Academy. Dikemas kini pada{" "}
          {new Date(data.generatedAt).toLocaleString("ms-MY")}.
        </p>
      </div>

      <DashboardOverview data={data} />
    </div>
  );
}
