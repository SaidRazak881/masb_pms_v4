import type { Metadata } from "next";

import { ProgrammesBrowser } from "@/components/programmes/programmes-browser";
import { getProgrammes } from "@/lib/actions/programme-actions";

export const metadata: Metadata = {
  title: "Program Latihan",
  description: "Senarai program latihan MIMOS Academy",
};

export default async function ProgrammesPage() {
  // Cuba muat data dari Supabase
  let programmes;
  try {
    programmes = await getProgrammes();
  } catch (error) {
    console.error("Error loading programmes from Supabase:", error);
    programmes = undefined; // Biarkan komponen gunakan mock data
  }

  // Baca nama penuh pengguna semasa daripada sesi Supabase (untuk tab
  // "Program Saya"). Fallback kepada nama demo jika env/sesi tiada.
  let currentUserName = "Zarina Abu Bakar";
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (hasSupabase) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        currentUserName =
          (profile as { full_name?: string } | null)?.full_name ||
          user.user_metadata?.full_name ||
          user.email;
      }
    } catch (error) {
      console.error("ProgrammesPage: gagal membaca sesi pengguna:", error);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Program Latihan</h1>
        <p className="text-sm text-muted-foreground">
          Urus dan pantau semua program latihan MIMOS Academy — daripada draf
          sehingga program dikunci untuk audit.
        </p>
      </div>

      <ProgrammesBrowser
        programmes={programmes}
        currentUserName={currentUserName}
      />
    </div>
  );
}
