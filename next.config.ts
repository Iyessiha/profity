import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Two root layouts (app/(site) and app/[locale]) → app/global-not-found.tsx
  experimental: { globalNotFound: true },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
};

export default withNextIntl(nextConfig);
