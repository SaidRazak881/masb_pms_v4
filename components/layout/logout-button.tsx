"use client";

/**
 * LogoutButton — butang log keluar.
 *
 * Memanggil Supabase Auth signOut apabila env Supabase diisi; dalam mod
 * demo, terus mengalih ke /login.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

const HAS_SUPABASE = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    if (HAS_SUPABASE) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={loading}
      className="gap-1.5 text-muted-foreground"
      title="Log keluar"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Log keluar…" : "Log Keluar"}
    </Button>
  );
}
