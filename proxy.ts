import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

/** Paths accessible without authentication (relative to locale prefix). */
const PUBLIC_SEGMENTS = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify",
  "/design",
  "/",  // landing page
]);

/** Paths that require is_admin — checked in the (admin) layout, not here. */
// const ADMIN_SEGMENTS = ["/admin"];

function isPublicPath(pathname: string) {
  // Strip the locale prefix (/fr/login → /login, /en → /)
  const withoutLocale = pathname.replace(/^\/(fr|en)/, "") || "/";
  if (PUBLIC_SEGMENTS.has(withoutLocale)) return true;
  // Auth callback is always public
  if (withoutLocale.startsWith("/auth/")) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  // 1. Run next-intl middleware (locale detection, prefix redirect)
  const intlResponse = intlMiddleware(request);

  // 2. Refresh Supabase session (writes cookies onto intlResponse)
  const supabaseResponse = await updateSession(request);

  // Merge Supabase cookies into the intl response
  for (const cookie of supabaseResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie.name, cookie.value, {
      ...cookie,
    });
  }

  // 3. Check auth for protected routes
  const { pathname } = request.nextUrl;
  if (!isPublicPath(pathname)) {
    const hasSession = request.cookies
      .getAll()
      .some((c) => c.name.includes("-auth-token") && c.value);

    if (!hasSession) {
      const locale = pathname.match(/^\/(fr|en)/)?.[1] ?? routing.defaultLocale;
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
