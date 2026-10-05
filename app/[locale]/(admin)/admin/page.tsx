import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/server-admin";
import Link from "next/link";

export const metadata = { title: "Admin — ProfityX" };

const HUD  = "'Orbitron', monospace";
const BODY = "'Rajdhani', sans-serif";
const SURFACE  = "#0a0f1a";
const SURFACE2 = "#0d1520";
const BORDER   = "rgba(0,255,178,0.08)";
const BORDER2  = "rgba(0,255,178,0.15)";
const GREEN    = "#00FFB2";
const BLUE     = "#00D4FF";
const GOLD     = "#C9A84C";
const RED      = "#FF4444";
const TEXT     = "#c8d8e8";
const MUTED    = "rgba(200,216,232,0.45)";

export default async function AdminPage() {
  const admin = getAdminClient();

  const [
    { count: totalUsers },
    { count: activeSubsCount },
    { data: recentUsers },
    { data: recentActions },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("subscriptions").select("*", { count: "exact", head: true }).in("status", ["active", "trialing"]),
    admin.from("profiles").select("id,email,public_id,is_admin,suspended,created_at").order("created_at", { ascending: false }).limit(8),
    admin.from("admin_actions").select("id,action,subject_id,actor_id,created_at,details").order("created_at", { ascending: false }).limit(10),
  ]);

  const { data: tierBreakdown } = await admin
    .from("subscriptions")
    .select("tier")
    .in("status", ["active", "trialing"]);

  const tiers = { free: 0, pro: 0, elite: 0 } as Record<string, number>;
  for (const row of tierBreakdown ?? []) {
    tiers[row.tier] = (tiers[row.tier] ?? 0) + 1;
  }
  const freeUsers = (totalUsers ?? 0) - (activeSubsCount ?? 0);

  const kpis = [
    { label: "Total users", value: totalUsers ?? 0, color: BLUE, glow: "rgba(0,212,255,0.1)", icon: "◈" },
    { label: "Free", value: freeUsers, color: MUTED, glow: "rgba(200,216,232,0.04)", icon: "⬡" },
    { label: "Pro actif", value: tiers.pro, color: GREEN, glow: "rgba(0,255,178,0.1)", icon: "◇" },
    { label: "Elite actif", value: tiers.elite, color: GOLD, glow: "rgba(201,168,76,0.1)", icon: "✦" },
  ];

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1200, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: BODY, fontSize: 11, color: MUTED, letterSpacing: 3, marginBottom: 6 }}>
          ADMINISTRATION
        </div>
        <h1 style={{
          fontFamily: HUD, fontSize: 24, fontWeight: 900,
          color: TEXT, margin: 0, letterSpacing: 1,
        }}>
          Vue d&apos;ensemble
        </h1>
      </div>

      {/* KPI row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16, marginBottom: 36,
      }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            background: SURFACE, borderRadius: 16,
            border: `1px solid ${BORDER}`,
            padding: "24px 28px",
            boxShadow: `0 0 24px ${kpi.glow}`,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 16, right: 20,
              fontFamily: HUD, fontSize: 28, color: kpi.color, opacity: 0.12,
            }}>
              {kpi.icon}
            </div>
            <div style={{
              fontFamily: BODY, fontSize: 10, color: MUTED,
              letterSpacing: 2, textTransform: "uppercase", marginBottom: 10,
            }}>
              {kpi.label}
            </div>
            <div style={{
              fontFamily: HUD, fontSize: 36, fontWeight: 900,
              color: kpi.color, lineHeight: 1,
            }}>
              {kpi.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* Recent users table */}
        <div style={{
          background: SURFACE, borderRadius: 16,
          border: `1px solid ${BORDER}`, overflow: "hidden",
        }}>
          <div style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <h2 style={{
              fontFamily: HUD, fontSize: 11, fontWeight: 700, color: MUTED,
              letterSpacing: 2, margin: 0, textTransform: "uppercase",
            }}>
              Derniers inscrits
            </h2>
            <Link href="./admin/users"
              style={{ fontFamily: BODY, fontSize: 12, color: GREEN, textDecoration: "none" }}>
              Voir tous →
            </Link>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Handle", "Email", "Rôle", "Date"].map(h => (
                  <th key={h} style={{
                    padding: "10px 18px", textAlign: "left",
                    fontFamily: BODY, fontSize: 10, fontWeight: 700,
                    color: MUTED, letterSpacing: 2, textTransform: "uppercase",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentUsers ?? []).map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "11px 18px" }}>
                    <Link href={`./admin/users/${u.id}`}
                      style={{
                        fontFamily: HUD, fontSize: 11, color: GREEN,
                        textDecoration: "none", letterSpacing: 0.5,
                      }}>
                      @{u.public_id}
                    </Link>
                  </td>
                  <td style={{
                    padding: "11px 18px",
                    fontFamily: BODY, fontSize: 12, color: MUTED,
                    maxWidth: 140, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {u.email}
                  </td>
                  <td style={{ padding: "11px 18px" }}>
                    {u.is_admin ? (
                      <Badge color={BLUE} bg="rgba(0,212,255,0.1)">Admin</Badge>
                    ) : u.suspended ? (
                      <Badge color={RED} bg="rgba(255,68,68,0.1)">Suspendu</Badge>
                    ) : (
                      <Badge color={MUTED} bg="rgba(200,216,232,0.06)">User</Badge>
                    )}
                  </td>
                  <td style={{
                    padding: "11px 18px",
                    fontFamily: BODY, fontSize: 11, color: MUTED,
                  }}>
                    {new Date(u.created_at).toLocaleDateString("fr")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit trail */}
        <div style={{
          background: SURFACE, borderRadius: 16,
          border: `1px solid ${BORDER}`, overflow: "hidden",
        }}>
          <div style={{ padding: "18px 24px", borderBottom: `1px solid ${BORDER}` }}>
            <h2 style={{
              fontFamily: HUD, fontSize: 11, fontWeight: 700, color: MUTED,
              letterSpacing: 2, margin: 0, textTransform: "uppercase",
            }}>
              Actions récentes
            </h2>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Action", "Date"].map(h => (
                  <th key={h} style={{
                    padding: "10px 20px", textAlign: "left",
                    fontFamily: BODY, fontSize: 10, fontWeight: 700,
                    color: MUTED, letterSpacing: 2, textTransform: "uppercase",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentActions ?? []).length === 0 ? (
                <tr>
                  <td colSpan={2} style={{
                    padding: "48px 24px", textAlign: "center",
                    fontFamily: BODY, fontSize: 13, color: MUTED,
                  }}>
                    Aucune action pour l&apos;instant
                  </td>
                </tr>
              ) : (recentActions ?? []).map(a => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "11px 20px" }}>
                    <span style={{
                      fontFamily: HUD, fontSize: 10, color: TEXT,
                      letterSpacing: 0.5, opacity: 0.8,
                    }}>
                      {a.action}
                    </span>
                  </td>
                  <td style={{
                    padding: "11px 20px",
                    fontFamily: BODY, fontSize: 11, color: MUTED,
                  }}>
                    {new Date(a.created_at).toLocaleString("fr")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  const HUD = "'Orbitron', monospace";
  return (
    <span style={{
      fontFamily: HUD, fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
      color, background: bg,
      border: `1px solid ${color}33`,
      borderRadius: 20, padding: "2px 8px",
      display: "inline-block",
    }}>
      {children}
    </span>
  );
}
