/**
 * Environment variable validation
 * Uses defaults for build-time safety, actual values loaded at runtime
 */

export const env = {
  // Public vars (safe to expose to client)
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",

  // Secret vars (server-only)
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-svc-key",
  DATABASE_URL: process.env.DATABASE_URL || "",
  GENIUSPAY_API_KEY: process.env.GENIUSPAY_API_KEY || "",
  GENIUSPAY_SECRET_KEY: process.env.GENIUSPAY_SECRET_KEY || "",
  GENIUSPAY_WEBHOOK_SECRET: process.env.GENIUSPAY_WEBHOOK_SECRET || "",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-not-for-production",
  BREVO_API_KEY: process.env.BREVO_API_KEY || "",
};

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return (
    env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co" &&
    env.SUPABASE_SERVICE_ROLE_KEY !== "placeholder-svc-key"
  );
}

/**
 * Check if critical services are configured for production
 */
export function validateProdConfig(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL not configured");
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder")) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY not configured");
  }

  if (!env.GENIUSPAY_API_KEY) {
    errors.push("GENIUSPAY_API_KEY not configured");
  }

  return { ok: errors.length === 0, errors };
}
