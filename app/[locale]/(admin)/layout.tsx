"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const HUD  = "'Orbitron', monospace";
const BODY = "'Rajdhani', sans-serif";
const BG      = "#020408";
const SURFACE = "#0a0f1a";
const BORDER  = "rgba(0,255,178,0.08)";
const GREEN   = "#00FFB2";
const BLUE    = "#00D4FF";
const RED     = "#FF4444";
const TEXT    = "#c8d8e8";
const MUTED   = "rgba(200,216,232,0.45)";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, display_name, public_id")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    const locale = await getLocale();
    redirect(`/${locale}/dashboard`);
  }

  const locale = await getLocale();

  const navItems = [
    { label: "Vue d'ensemble", href: `/${locale}/admin`, icon: "⬡" },
    { label: "Utilisateurs", href: `/${locale}/admin/users`, icon: "◈" },
    { label: "Abonnements", href: `/${locale}/admin/subscriptions`, icon: "◇" },
  ];

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div style={{ display: "flex", minHeight: "100vh", background: BG, fontFamily: BODY }}>

        {/* Admin sidebar */}
        <div style={{
          width: 240, minHeight: "100vh", background: SURFACE,
          borderRight: `1px solid ${BORDER}`, display: "flex",
          flexDirection: "column", flexShrink: 0,
        }}>
          {/* Logo + Admin badge */}
          <div style={{ padding: "28px 24px 20px", borderBottom: `1px solid ${BORDER}` }}>
            <Link href={`/${locale}/admin`} style={{ textDecoration: "none" }}>
              <div style={{
                fontFamily: HUD, fontWeight: 900, fontSize: 20, letterSpacing: 2,
                background: `linear-gradient(135deg, ${GREEN}, ${BLUE})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                PROFITYX
              </div>
            </Link>
            <div style={{
              marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6,
              padding: "3px 10px", borderRadius: 20,
              background: "rgba(0,212,255,0.1)",
              border: "1px solid rgba(0,212,255,0.3)",
            }}>
              <span style={{ fontFamily: HUD, fontSize: 9, fontWeight: 700, color: BLUE, letterSpacing: 3 }}>
                ADMIN
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "16px 12px" }}>
            {navItems.map(item => (
              <Link key={item.href} href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 10, marginBottom: 4,
                  textDecoration: "none", fontFamily: BODY, fontWeight: 600,
                  fontSize: 14, color: TEXT, letterSpacing: 0.5,
                  border: "3px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: 16, opacity: 0.7 }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Back to app */}
          <div style={{ padding: "12px", borderTop: `1px solid ${BORDER}` }}>
            <Link href={`/${locale}/dashboard`}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 10,
                textDecoration: "none", fontFamily: BODY,
                fontSize: 13, color: MUTED,
              }}
            >
              ← App dashboard
            </Link>
          </div>

          {/* Admin identity */}
          <div style={{
            padding: "16px 20px", borderTop: `1px solid ${BORDER}`,
            fontFamily: BODY, fontSize: 12, color: MUTED,
          }}>
            <div style={{ fontWeight: 700, color: TEXT }}>
              {profile.display_name ?? profile.public_id ?? "Admin"}
            </div>
            <div style={{ marginTop: 2 }}>@{profile.public_id}</div>
          </div>
        </div>

        {/* Main */}
        <main style={{ flex: 1, minHeight: "100vh", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </>
  );
}
