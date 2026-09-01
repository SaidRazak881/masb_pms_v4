import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase Client — Browser.
 *
 * Digunakan di dalam Client Components (event handler, form, muat naik fail).
 * Persistensi sesi diuruskan oleh middleware (lib/supabase/middleware.ts).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY belum ditetapkan. " +
        "Sila salin .env.example ke .env.local dan isikan maklumat projek Supabase.",
    );
  }

  return createBrowserClient(url, anonKey);
}
