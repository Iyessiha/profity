"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/[locale]/(auth)/actions";

const HUD  = "'Orbitron', monospace";
const BODY = "'Rajdhani', sans-serif";
const SURFACE = "#0a0f1a";
const BORDER  = "rgba(0,255,178,0.08)";
const GREEN   = "#00FFB2";
const BLUE    = "#00D4FF";
const GOLD    = "#C9A84C";
const TEXT    = "#c8d8e8";
const MUTED   = "rgba(200,216,232,0.45)";

type NavItem = { label: string; href: string; icon: string };

export function AdminNav({
  locale,
  displayName,
  publicId,
}: {
  locale: string;
  displayName: string;
  publicId: string;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === `/${locale}/admin`) {
      return pathname === `/${locale}/admin`;
    }
    return pathname.startsWith(href);
  };

  const navSections: { label: string; items: NavItem[] }[] = [
    {
      label: "Navigation",
      items: [
        { label: "Vue d'ensemble", href: `/${locale}/admin`,               icon: "⬡" },
        { label: "Utilisateurs",   href: `/${locale}/admin/users`,         icon: "◈" },
        { label: "Abonnements",    href: `/${locale}/admin/subscriptions`, icon: "◇" },
      ],
    },
  ];

  return (
    <div style={{
      width: 240, minHeight: "100vh", background: SURFACE,
      borderRight: `1px solid ${BORDER}`,
      display: "flex", flexDirection: "column", flexShrink: 0,
      fontFamily: BODY,
    }}>

      {/* Logo */}
      <div style={{ padding: "28px 24px 22px", borderBottom: `1px solid ${BORDER}` }}>
        <Link href={`/${locale}/admin`} style={{ textDecoration: "none" }}>
          <div style={{
            fontFamily: HUD, fontWeight: 900, fontSize: 20, letterSpacing: 2,
            background: `linear-gradient(135deg, ${GREEN}, ${BLUE})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            PROFITYX
          </div>
        </Link>
        <span style={{
          display: "inline-block", marginTop: 8,
          padding: "3px 10px", borderRadius: 20,
          background: "rgba(0,212,255,0.1)",
          border: "1px solid rgba(0,212,255,0.3)",
          fontFamily: HUD, fontSize: 9, fontWeight: 700,
          color: BLUE, letterSpacing: 3,
        }}>
          ADMIN
        </span>
      </div>

      {/* Nav sections */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {navSections.map(section => (
          <div key={section.label} style={{ marginBottom: 8 }}>
            <div style={{
              padding: "8px 14px 4px",
              fontFamily: HUD, fontSize: 9, fontWeight: 700,
              color: MUTED, letterSpacing: 3, textTransform: "uppercase",
            }}>
              {section.label}
            </div>
            {section.items.map(item => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 10, marginBottom: 2,
                    textDecoration: "none",
                    fontFamily: BODY, fontWeight: active ? 700 : 500,
                    fontSize: 14, letterSpacing: 0.3,
                    color: active ? GREEN : TEXT,
                    background: active ? "rgba(0,255,178,0.07)" : "transparent",
                    borderLeft: active ? `3px solid ${GREEN}` : "3px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{
                    fontSize: 14,
                    color: active ? GREEN : MUTED,
                    transition: "color 0.15s",
                  }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        {/* Back to user app */}
        <div style={{ padding: "10px 10px 0" }}>
          <Link href={`/${locale}/dashboard`}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 10,
              textDecoration: "none",
              fontFamily: BODY, fontSize: 13, fontWeight: 500,
              color: MUTED,
              transition: "color 0.15s",
            }}
          >
            <span style={{ fontSize: 13 }}>←</span>
            Espace trader
          </Link>
        </div>

        {/* User identity + logout */}
        <div style={{
          padding: "12px 16px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(0,212,255,0.12)",
              border: "1px solid rgba(0,212,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: HUD, fontSize: 13, color: BLUE, fontWeight: 700,
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: BODY, fontSize: 12, fontWeight: 700, color: TEXT }}>
                {displayName}
              </div>
              <div style={{ fontFamily: BODY, fontSize: 10, color: MUTED }}>
                @{publicId}
              </div>
            </div>
          </div>

          <form action={logout}>
            <button type="submit" style={{
              background: "transparent",
              border: `1px solid ${BORDER}`,
              borderRadius: 8, padding: "6px 10px",
              cursor: "pointer",
              fontFamily: BODY, fontSize: 11, color: MUTED,
              letterSpacing: 0.5,
            }}>
              Exit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
