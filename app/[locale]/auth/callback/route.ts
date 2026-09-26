import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the redirect from Supabase email links (confirm, password reset).
 *
 * Supabase sends the user here with ?code=…  The PKCE exchange turns that
 * one-time code into a session, then we redirect to the intended destination.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // If the code is missing or invalid, send to login with an error hint.
  return NextResponse.redirect(
    new URL("/login?error=invalid_link", request.url),
  );
}
