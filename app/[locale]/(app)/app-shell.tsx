"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { logout } from "@/app/[locale]/(auth)/actions";

const HUD = "'Orbitron', monospace";
const BODY = "'Rajdhani', sans-serif";

const BG      = "#020408";
const SURFACE = "#0a0f1a";
const BORDER  = "rgba(0,255,178,0.08)";
const GREEN   = "#00FFB2";
const BLUE    = "#00D4FF";
const TEXT    = "#c8d8e8";
const MUTED   = "rgba(200,216,232,0.45)";

type NavItem = { label: string; href: string; icon: string };

export function AppShell({
  children,
  displayName,
  publicId,
  isAdmin,
  nav,
  adminLabel,
  upgradeLabel,
}: {
  children: React.ReactNode;
  displayName: string;
  publicId: string;
  isAdmin: boolean;
  nav: NavItem[];
  adminLabel: string;
  upgradeLabel: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const segments = pathname.split("/").filter(Boolean);
  const currentPage = segments[segments.length - 1] ?? "dashboard";

  const isActive = (href: string) => currentPage === href || pathname.endsWith(`/${href}`);

  const locale = segments[0] ?? "fr";

  const sidebar = (
    <div style={{
      width: 240, minHeight: "100vh", background: SURFACE,
      borderRight: `1px solid ${BORDER}`, display: "flex",
      flexDirection: "column", flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "28px 24px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <Link href={`/${locale}/dashboard`} style={{ textDecoration: "none" }}>
          <div style={{ fontFamily: HUD, fontWeight: 900, fontSize: 22, letterSpacing: 2,
            background: `linear-gradient(135deg, ${GREEN}, ${BLUE})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>PROFITYX</div>
          <div style={{ fontFamily: BODY, fontSize: 11, color: MUTED, letterSpacing: 3, marginTop: 2 }}>
            TRADING SIGNALS
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {nav.map(item => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={`/${locale}/${item.href}`}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px", borderRadius: 10, marginBottom: 4,
                textDecoration: "none", fontFamily: BODY, fontWeight: 600,
                fontSize: 14, letterSpacing: 0.5,
                background: active ? `rgba(0,255,178,0.08)` : "transparent",
                color: active ? GREEN : TEXT,
                borderLeft: active ? `3px solid ${GREEN}` : "3px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 16, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link href={`/${locale}/admin`}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 14px", borderRadius: 10, marginTop: 4,
              textDecoration: "none", fontFamily: BODY, fontWeight: 600,
              fontSize: 14, letterSpacing: 0.5,
              background: isActive("admin") ? "rgba(0,212,255,0.08)" : "transparent",
              color: isActive("admin") ? BLUE : TEXT,
              borderLeft: isActive("admin") ? `3px solid ${BLUE}` : "3px solid transparent",
            }}
          >
            <span style={{ fontSize: 16, opacity: 0.8 }}>⬦</span>
            {adminLabel}
          </Link>
        )}
      </nav>

      {/* Upgrade banner */}
      <div style={{ padding: "12px", borderTop: `1px solid ${BORDER}` }}>
        <Link href={`/${locale}/billing`}
          style={{
            display: "block", textAlign: "center", padding: "10px 16px",
            borderRadius: 10, textDecoration: "none",
            background: `linear-gradient(135deg, rgba(0,255,178,0.12), rgba(0,212,255,0.08))`,
            border: `1px solid rgba(0,255,178,0.2)`,
            fontFamily: BODY, fontWeight: 700, fontSize: 13,
            color: GREEN, letterSpacing: 1,
          }}
        >
          ↑ {upgradeLabel}
        </Link>
      </div>

      {/* User section */}
      <div style={{ padding: "16px 12px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: `linear-gradient(135deg, ${GREEN}33, ${BLUE}33)`,
            border: `1px solid rgba(0,255,178,0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: HUD, fontSize: 14, color: GREEN, fontWeight: 700,
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: BODY, fontSize: 13, fontWeight: 700, color: TEXT }}>
              {displayName}
            </div>
            <div style={{ fontFamily: BODY, fontSize: 11, color: MUTED }}>
              @{publicId}
            </div>
          </div>
        </div>
        <form action={logout}>
          <button type="submit" style={{
            width: "100%", padding: "8px", border: `1px solid ${BORDER}`,
            borderRadius: 8, background: "transparent", cursor: "pointer",
            fontFamily: BODY, fontSize: 12, color: MUTED, letterSpacing: 0.5,
            transition: "all 0.15s ease",
          }}>
            Déconnexion
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div style={{ display: "flex", minHeight: "100vh", background: BG, fontFamily: BODY }}>
        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: "none", position: "fixed", top: 12, left: 12, zIndex: 100,
            background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8,
            padding: "8px 10px", cursor: "pointer", color: TEXT,
          }}
          className="mobile-menu-btn"
          aria-label="Menu"
        >
          ☰
        </button>

        {/* Sidebar — desktop always visible */}
        <div style={{ display: "flex" }} className="sidebar-wrapper">
          {sidebar}
        </div>

        {/* Main content */}
        <main style={{ flex: 1, minHeight: "100vh", overflowY: "auto" }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
          .sidebar-wrapper { display: none !important; }
        }
      `}</style>
    </>
  );
}
