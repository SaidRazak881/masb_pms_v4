import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase Client — Server.
 *
 * Digunakan di dalam Server Components, Route Handlers dan Server Actions
 * untuk membaca data / mengesahkan sesi pengguna.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: {
          name: string;
          value: string;
          options?: CookieOptions;
        }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` dipanggil daripada Server Component — abaikan ralat ini
            // kerana middleware menyegarkan sesi pengguna.
          }
        },
      },
    },
  );
}
