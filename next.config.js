/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }] },
  env: {
    // ProfityX — Supabase (barax project)
    // Ces clés sont publiques (NEXT_PUBLIC_) : elles s'exposent dans le bundle client.
    NEXT_PUBLIC_SUPABASE_URL:      'https://crlfkiniwalhzvpxrqav.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybGZraW5pd2FsaHp2cHhycWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzAyODIsImV4cCI6MjA5NjI0NjI4Mn0.vEISYPOPQQZeO6US3C_6pTCDPDup5iUI002euEM-cdE',
    NEXT_PUBLIC_INGEST_URL:        'https://crlfkiniwalhzvpxrqav.supabase.co/functions/v1/ingest',
  },
}
module.exports = nextConfig
