import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function getAdminClient() {
  // Use env module which provides fallback values for build-time safety
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  // Check if using placeholders (not configured)
  if (url.includes("placeholder") || key.includes("placeholder")) {
    throw new Error(
      "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment variables."
    );
  }

  return createClient(url, key);
}

export function getAdminClientSafe() {
  try {
    return getAdminClient();
  } catch {
    return null;
  }
}
