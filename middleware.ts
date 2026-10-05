import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const intlMiddleware = createMiddleware(routing);

// Legacy routes → i18n equivalents
const LEGACY_REDIRECTS: Record<string, string> = {
  "/dashboard":       "/fr/dashboard",
  "/admin/dashboard": "/fr/admin",
  "/admin":           "/fr/admin",
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Redirect legacy routes before anything else
  const legacyTarget = LEGACY_REDIRECTS[pathname];
  if (legacyTarget) {
    return NextResponse.redirect(new URL(legacyTarget, request.url));
  }

  // 2. Apply next-intl locale routing (handles /fr, /en prefixes)
  const intlResponse = intlMiddleware(request);

  // 3. Refresh Supabase session cookies on the intl response
  const response = intlResponse ?? NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
