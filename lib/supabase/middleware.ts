import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/account-managers",
  "/dashboard",
  "/programmes",
  "/import",
  "/participants",
  "/reports",
  "/security",
  "/admin",
];

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Segarkan sesi Supabase pada setiap permintaan dan lindungi laluan dashboard.
 *
 * Nota: semasa pembangunan Mock UI (tanpa env Supabase), fungsi ini
 * membenarkan semua permintaan supaya aplikasi boleh dilayari sepenuhnya.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Mod demo: tiada bukti kelayakan Supabase — langkau pengesahan.
  // Header `x-pathname` tetap dihantar kerana layout dashboard membacanya
  // untuk memutuskan sama ada halaman semasa dikecualikan daripada
  // pengalihan wajib-tukar-kata-laluan.
  if (!url || !anonKey) {
    const demoResponse = NextResponse.next({ request });
    demoResponse.headers.set("x-pathname", request.nextUrl.pathname);
    return demoResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  // Akaun belum diluluskan / disekat tidak dibenarkan ke modul aplikasi.
  // (Semakan status terperinci dilakukan di layout dashboard kerana
  //  middleware Edge tidak sepatutnya membuat pertanyaan pangkalan data.)
  supabaseResponse.headers.set("x-pathname", path);

  return supabaseResponse;
}
