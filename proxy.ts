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

/**
 * Two apps live in this repo:
 *  - the historical ProfityX app (app/(site), app/api) — unprefixed URLs,
 *    client-side auth, handles its own language (lib/i18n.ts);
 *  - the v2 app (app/[locale]) — /fr/... and /en/... URLs via next-intl.
 * Only v2 URLs go through next-intl and the cookie-based auth gate. `/en`
 * alone is the historical English landing page (app/(site)/en).
 */
function isV2Path(pathname: string) {
  return pathname === "/fr" || pathname.startsWith("/fr/") || pathname.startsWith("/en/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Historical app: only the admin API needs a bearer token up front.
  if (!isV2Path(pathname)) {
    if (pathname.startsWith("/api/admin") && !request.headers.get("authorization")) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.next();
  }

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
    "/fr",
    "/fr/:path*",
    "/en/:path*",
    "/api/admin/:path*",
  ],
};
