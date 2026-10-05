import { getAdminClient } from "@/lib/supabase/server-admin";
import Link from "next/link";

export const metadata = { title: "Admin — ProfityX" };

const HUD      = "'Orbitron', monospace";
const BODY     = "'Rajdhani', sans-serif";
const BG       = "#020408";
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

  const oneWeekAgo  = new Date(Date.now() - 7  * 86400_000).toISOString();
  const oneMonthAgo = new Date(Date.now() - 30 * 86400_000).toISOString();

  const [
    { count: totalUsers },
    { count: newUsersWeek },
    { count: activeSubsCount },
    { data: recentUsers },
    { data: recentActions },
    { data: tierBreakdown },
    { data: recentPayments },
    { data: monthlyRevData },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", oneWeekAgo),
    admin.from("subscriptions").select("*", { count: "exact", head: true }).in("status", ["active", "trialing"]),
    admin.from("profiles").select("id,email,public_id,is_admin,suspended,created_at").order("created_at", { ascending: false }).limit(8),
    admin.from("admin_actions").select("id,action,subject_id,actor_id,created_at,details").order("created_at", { ascending: false }).limit(8),
    admin.from("subscriptions").select("tier").in("status", ["active", "trialing"]),
    admin.from("payments").select("id,amount_minor,currency,status,created_at,profiles(public_id,email)").order("created_at", { ascending: false }).limit(6),
    admin.from("payments").select("amount_minor").eq("status", "succeeded").gte("created_at", oneMonthAgo),
  ]);

  // Tier counts
  const tiers = { free: 0, pro: 0, elite: 0 } as Record<string, number>;
  for (const row of tierBreakdown ?? []) tiers[row.tier] = (tiers[row.tier] ?? 0) + 1;
  const freeUsers = (totalUsers ?? 0) - (activeSubsCount ?? 0);

  // Revenue
  const mrrMinor = (monthlyRevData ?? []).reduce((s, p) => s + (p.amount_minor ?? 0), 0);
  const mrrDisplay = mrrMinor >= 100 ? (mrrMinor / 100).toFixed(0) : mrrMinor;
  const mrrCurrency = "XOF";

  // KPIs
  const kpis = [
    { label: "Utilisateurs",    value: (totalUsers ?? 0).toLocaleString("fr"),     color: BLUE, glow: "rgba(0,212,255,0.08)",   icon: "◈", href: "./admin/users", sub: `+${newUsersWeek ?? 0} cette semaine` },
    { label: "Abonnés actifs",  value: (activeSubsCount ?? 0).toLocaleString("fr"), color: GREEN, glow: "rgba(0,255,178,0.08)", icon: "◇", href: "./admin/subscriptions", sub: `${tiers.pro} Pro · ${tiers.elite} Elite` },
    { label: "Free",            value: freeUsers.toLocaleString("fr"),              color: MUTED, glow: "rgba(200,216,232,0.04)",icon: "⬡", href: "./admin/users", sub: "sans abonnement actif" },
    { label: "Rev. 30 jours",   value: `${Number(mrrDisplay).toLocaleString("fr")} ${mrrCurrency}`, color: GOLD, glow: "rgba(201,168,76,0.08)", icon: "✦", href: "./admin/subscriptions", sub: "paiements succeeded" },
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ padding: "36px 40px", maxWidth: 1200, margin: "0 auto", fontFamily: BODY }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: BODY, fontSize: 11, color: MUTED, letterSpacing: 3, marginBottom: 6 }}>
            ADMINISTRATION
          </div>
          <h1 style={{ fontFamily: HUD, fontSize: 24, fontWeight: 900, color: TEXT, margin: "0 0 6px", letterSpacing: 1 }}>
            Vue d&apos;ensemble
          </h1>
          <div style={{ fontFamily: BODY, fontSize: 12, color: MUTED }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {kpis.map((kpi) => (
            <Link key={kpi.label} href={kpi.href} style={{
              textDecoration: "none",
              background: SURFACE, borderRadius: 16,
              border: `1px solid ${BORDER}`,
              padding: "24px 24px 20px",
              boxShadow: `0 0 28px ${kpi.glow}`,
              position: "relative", overflow: "hidden",
              display: "block", transition: "border-color 0.15s",
            }}>
              <div style={{
                position: "absolute", top: 14, right: 16,
                fontFamily: HUD, fontSize: 30, color: kpi.color, opacity: 0.1,
              }}>
                {kpi.icon}
              </div>
              <div style={{ fontFamily: BODY, fontSize: 10, color: MUTED, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
                {kpi.label}
              </div>
              <div style={{ fontFamily: HUD, fontSize: 30, fontWeight: 900, color: kpi.color, lineHeight: 1, marginBottom: 8 }}>
                {kpi.value}
              </div>
              <div style={{ fontFamily: BODY, fontSize: 11, color: MUTED }}>
                {kpi.sub}
              </div>
            </Link>
          ))}
        </div>

        {/* Tier breakdown bar */}
        <div style={{
          background: SURFACE, borderRadius: 16, border: `1px solid ${BORDER}`,
          padding: "20px 24px", marginBottom: 28,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontFamily: HUD, fontSize: 10, color: MUTED, letterSpacing: 2, textTransform: "uppercase" }}>
              Répartition par plan
            </span>
            <div style={{ display: "flex", gap: 20 }}>
              {[
                { label: "Free", value: freeUsers, color: MUTED },
                { label: "Pro", value: tiers.pro, color: GREEN },
                { label: "Elite", value: tiers.elite, color: GOLD },
              ].map(t => (
                <span key={t.label} style={{ fontFamily: BODY, fontSize: 13, color: t.color, fontWeight: 600 }}>
                  {t.label} · {t.value}
                </span>
              ))}
            </div>
          </div>
          {/* Stacked bar */}
          {(totalUsers ?? 0) > 0 && (() => {
            const total = totalUsers ?? 1;
            const freePct  = (freeUsers / total) * 100;
            const proPct   = (tiers.pro / total) * 100;
            const elitePct = (tiers.elite / total) * 100;
            return (
              <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.04)", overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${freePct}%`, background: "rgba(200,216,232,0.25)", transition: "width 0.4s" }} />
                <div style={{ width: `${proPct}%`, background: GREEN, transition: "width 0.4s" }} />
                <div style={{ width: `${elitePct}%`, background: GOLD, transition: "width 0.4s" }} />
              </div>
            );
          })()}
        </div>

        {/* Three-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>

          {/* Derniers inscrits */}
          <div style={{ background: SURFACE, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{
              padding: "16px 20px", borderBottom: `1px solid ${BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <h2 style={{ fontFamily: HUD, fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 2, margin: 0, textTransform: "uppercase" }}>
                Derniers inscrits
              </h2>
              <Link href="./admin/users" style={{ fontFamily: BODY, fontSize: 12, color: GREEN, textDecoration: "none" }}>
                Tous →
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {(recentUsers ?? []).map(u => (
                <Link key={u.id} href={`./admin/users/${u.id}`} style={{
                  textDecoration: "none", display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 20px", borderBottom: `1px solid ${BORDER}`,
                }}>
                  <div>
                    <div style={{ fontFamily: HUD, fontSize: 10, color: GREEN, letterSpacing: 0.5, marginBottom: 2 }}>
                      @{u.public_id}
                    </div>
                    <div style={{ fontFamily: BODY, fontSize: 11, color: MUTED, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.email}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    {u.is_admin ? (
                      <Badge color={BLUE} bg="rgba(0,212,255,0.1)">Admin</Badge>
                    ) : u.suspended ? (
                      <Badge color={RED} bg="rgba(255,68,68,0.1)">Suspendu</Badge>
                    ) : null}
                    <span style={{ fontFamily: BODY, fontSize: 10, color: MUTED }}>
                      {new Date(u.created_at).toLocaleDateString("fr")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Paiements récents */}
          <div style={{ background: SURFACE, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{
              padding: "16px 20px", borderBottom: `1px solid ${BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <h2 style={{ fontFamily: HUD, fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 2, margin: 0, textTransform: "uppercase" }}>
                Paiements récents
              </h2>
              <Link href="./admin/subscriptions" style={{ fontFamily: BODY, fontSize: 12, color: GREEN, textDecoration: "none" }}>
                Voir →
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {(recentPayments ?? []).length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center", fontFamily: BODY, fontSize: 13, color: MUTED }}>
                  Aucun paiement
                </div>
              ) : (recentPayments ?? []).map((p: any) => (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 20px", borderBottom: `1px solid ${BORDER}`,
                }}>
                  <div>
                    <div style={{ fontFamily: HUD, fontSize: 10, color: p.status === "succeeded" ? GREEN : MUTED, letterSpacing: 0.5, marginBottom: 2 }}>
                      @{(p.profiles as any)?.public_id ?? "—"}
                    </div>
                    <div style={{ fontFamily: BODY, fontSize: 10, color: MUTED }}>
                      {new Date(p.created_at).toLocaleDateString("fr")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontFamily: HUD, fontSize: 13, fontWeight: 700,
                      color: p.status === "succeeded" ? GREEN : p.status === "failed" ? RED : MUTED,
                    }}>
                      {(p.amount_minor / 100).toLocaleString("fr")} {p.currency ?? "XOF"}
                    </div>
                    <div style={{ fontFamily: BODY, fontSize: 10, color: p.status === "succeeded" ? GREEN : p.status === "failed" ? RED : MUTED }}>
                      {p.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions récentes */}
          <div style={{ background: SURFACE, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
              <h2 style={{ fontFamily: HUD, fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 2, margin: 0, textTransform: "uppercase" }}>
                Actions admin
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {(recentActions ?? []).length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center", fontFamily: BODY, fontSize: 13, color: MUTED }}>
                  Aucune action
                </div>
              ) : (recentActions ?? []).map(a => (
                <div key={a.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 20px", borderBottom: `1px solid ${BORDER}`,
                }}>
                  <span style={{
                    fontFamily: HUD, fontSize: 9, color: TEXT, letterSpacing: 0.5,
                    background: SURFACE2, borderRadius: 5, padding: "2px 8px",
                    whiteSpace: "nowrap",
                  }}>
                    {a.action}
                  </span>
                  <span style={{ fontFamily: BODY, fontSize: 10, color: MUTED, flexShrink: 0 }}>
                    {new Date(a.created_at).toLocaleString("fr", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          {[
            { label: "◈  Gérer les utilisateurs",  href: "./admin/users",         color: BLUE  },
            { label: "◇  Abonnements",              href: "./admin/subscriptions", color: GREEN },
          ].map(({ label, href, color }) => (
            <Link key={href} href={href} style={{
              display: "inline-block", padding: "11px 22px", borderRadius: 12, textDecoration: "none",
              fontFamily: HUD, fontSize: 11, fontWeight: 700, color, letterSpacing: 1,
              background: `${color}0a`, border: `1px solid ${color}22`,
            }}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{
      fontFamily: HUD, fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
      color, background: bg, border: `1px solid ${color}33`,
      borderRadius: 20, padding: "2px 8px", display: "inline-block",
    }}>
      {children}
    </span>
  );
}
