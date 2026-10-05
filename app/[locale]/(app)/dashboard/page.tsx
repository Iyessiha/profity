import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard — ProfityX" };

const HUD     = "'Orbitron', monospace";
const BODY    = "'Rajdhani', sans-serif";
const BG      = "#020408";
const SURFACE = "#0a0f1a";
const SURFACE2 = "#0d1520";
const BORDER  = "rgba(0,255,178,0.08)";
const BORDER2 = "rgba(0,255,178,0.18)";
const GREEN   = "#00FFB2";
const BLUE    = "#00D4FF";
const GOLD    = "#C9A84C";
const RED     = "#FF4444";
const TEXT    = "#c8d8e8";
const MUTED   = "rgba(200,216,232,0.45)";

const PLAN: Record<string, { label: string; color: string; glow: string }> = {
  free:  { label: "FREE",  color: MUTED,  glow: "rgba(200,216,232,0.06)" },
  pro:   { label: "PRO",   color: GREEN,  glow: "rgba(0,255,178,0.1)"  },
  elite: { label: "ELITE", color: GOLD,   glow: "rgba(201,168,76,0.12)" },
};

const DIR_COLOR = (d: string) =>
  d?.toUpperCase().includes("LONG") || d?.toUpperCase().includes("BUY") ? GREEN : RED;

export default async function DashboardPage() {
  const [t, locale, supabase] = await Promise.all([
    getTranslations("dashboard"),
    getLocale(),
    createClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: prefs },
    { data: tierData },
    { data: usedData },
    { data: stats },
  ] = await Promise.all([
    supabase.from("profiles").select("public_id,display_name,is_admin,created_at").eq("id", user!.id).single(),
    supabase.from("user_preferences").select("locale,currency,trading_style,timezone").eq("user_id", user!.id).single(),
    supabase.rpc("current_tier").single<string>(),
    supabase.rpc("analyses_used_this_month", { for_user: user!.id }).single<number>(),
    supabase.from("user_stats").select("*").eq("user_id", user!.id).single(),
  ]);

  const tier       = (tierData as string) ?? "free";
  const used       = (usedData as number) ?? 0;
  const plan       = PLAN[tier] ?? PLAN.free;
  const streak     = stats?.current_streak ?? 0;
  const wins       = stats?.signals_won ?? 0;
  const losses     = stats?.signals_lost ?? 0;
  const rated      = stats?.signals_rated ?? 0;
  const xp         = stats?.total_xp ?? 0;
  const winRate    = rated > 0 ? Math.round((wins / rated) * 100) : 0;

  const { data: allowanceRow } = await supabase
    .from("tier_allowances")
    .select("analyses_monthly")
    .eq("tier", tier)
    .single();
  const quota        = allowanceRow?.analyses_monthly ?? 5;
  const usagePct     = quota > 0 ? Math.min((used / quota) * 100, 100) : 100;
  const usageColor   = usagePct > 80 ? RED : usagePct > 60 ? GOLD : GREEN;

  const { data: recentSignals } = await supabase
    .from("signals")
    .select("id,symbol,direction,timeframe,outcome,created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: wallet } = await supabase
    .from("credit_wallets")
    .select("balance")
    .eq("user_id", user!.id)
    .single();

  const displayName  = profile?.display_name ?? profile?.public_id ?? user!.email?.split("@")[0] ?? "Trader";
  const memberSince  = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ padding: "32px 36px", maxWidth: 1160, margin: "0 auto", fontFamily: BODY }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontFamily: BODY, fontSize: 12, color: MUTED, letterSpacing: 2, marginBottom: 6 }}>
              {memberSince && `Membre depuis ${memberSince}`}
            </div>
            <h1 style={{ fontFamily: HUD, fontSize: 26, fontWeight: 900, color: TEXT, margin: "0 0 10px", letterSpacing: 1 }}>
              Bonjour,{" "}
              <span style={{ background: `linear-gradient(135deg, ${GREEN}, ${BLUE})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {displayName}
              </span>
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                fontFamily: HUD, fontSize: 9, fontWeight: 700, letterSpacing: 2,
                padding: "3px 12px", borderRadius: 20,
                background: plan.glow, border: `1px solid ${plan.color}44`, color: plan.color,
              }}>
                {plan.label}
              </span>
              <span style={{ fontFamily: BODY, fontSize: 12, color: MUTED }}>@{profile?.public_id ?? "—"}</span>
              {streak > 0 && (
                <span style={{ fontFamily: BODY, fontSize: 12, color: GOLD }}>
                  🔥 {streak} jours de streak
                </span>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href={`/${locale}/signals`} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 22px", borderRadius: 12, textDecoration: "none",
              background: `linear-gradient(135deg, ${GREEN}22, ${BLUE}11)`,
              border: `1px solid ${BORDER2}`,
              fontFamily: HUD, fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: 1,
            }}>
              ◈ Nouvelle analyse
            </Link>
            <Link href={`/${locale}/journal`} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 20px", borderRadius: 12, textDecoration: "none",
              background: "transparent", border: `1px solid ${BORDER}`,
              fontFamily: BODY, fontSize: 13, fontWeight: 600, color: TEXT,
            }}>
              Journal →
            </Link>
          </div>
        </div>

        {/* ── Upgrade banner (free only) ── */}
        {tier === "free" && (
          <div style={{
            marginBottom: 24, padding: "14px 22px",
            background: `linear-gradient(135deg, rgba(201,168,76,0.08), rgba(0,212,255,0.04))`,
            border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          }}>
            <span style={{ fontFamily: BODY, fontSize: 14, color: GOLD }}>
              ✦ Passez Pro — analyses illimitées, signaux news, accès journal avancé
            </span>
            <Link href={`/${locale}/billing`} style={{
              fontFamily: HUD, fontSize: 10, fontWeight: 700, letterSpacing: 1, color: GOLD,
              textDecoration: "none", padding: "6px 16px", borderRadius: 8,
              border: "1px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.08)",
            }}>
              Upgrader →
            </Link>
          </div>
        )}

        {/* ── KPI Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>

          {/* Analyses */}
          <KpiCard
            icon="◈" label="Analyses ce mois" color={usageColor}
            glow={`${usageColor}12`}
            value={`${used} / ${quota >= 9999 ? "∞" : quota}`}
            sub={`${Math.round(usagePct)}% utilisé`}
          >
            <div style={{ marginTop: 12 }}>
              <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${usagePct}%`, borderRadius: 99,
                  background: `linear-gradient(90deg, ${usageColor}, ${usageColor}88)`,
                }} />
              </div>
            </div>
          </KpiCard>

          {/* Win rate */}
          <KpiCard
            icon="◇" label="Win rate" color={winRate >= 55 ? GREEN : winRate >= 40 ? GOLD : RED}
            glow={`${winRate >= 55 ? GREEN : winRate >= 40 ? GOLD : RED}12`}
            value={rated > 0 ? `${winRate}%` : "—"}
            sub={rated > 0 ? `${wins}W · ${losses}L sur ${rated} signaux` : "Pas encore de signaux notés"}
          />

          {/* XP */}
          <KpiCard
            icon="✦" label="XP total" color={BLUE}
            glow="rgba(0,212,255,0.08)"
            value={xp.toLocaleString("fr")}
            sub={`Streak : ${streak} jour${streak > 1 ? "s" : ""}`}
          />

          {/* Plan */}
          <KpiCard
            icon="⬡" label="Plan actif" color={plan.color}
            glow={plan.glow}
            value={plan.label}
            sub={tier === "free" ? "Gratuit — 5 analyses/mois" : tier === "pro" ? "50 analyses/mois" : "Analyses illimitées"}
          >
            {tier === "free" && (
              <Link href={`/${locale}/billing`} style={{
                display: "block", textAlign: "center", marginTop: 12,
                padding: "7px", borderRadius: 8, textDecoration: "none",
                fontFamily: HUD, fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1,
                border: "1px solid rgba(201,168,76,0.25)", background: "rgba(201,168,76,0.06)",
              }}>
                ↑ Upgrader
              </Link>
            )}
          </KpiCard>
        </div>

        {/* ── Main content : 2 cols ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 22 }}>

          {/* Left — Signaux récents */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <div style={{ background: SURFACE, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
              <div style={{
                padding: "18px 24px", borderBottom: `1px solid ${BORDER}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <h2 style={{ fontFamily: HUD, fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 2, margin: 0, textTransform: "uppercase" }}>
                  Signaux récents
                </h2>
                <Link href={`/${locale}/signals`} style={{ fontFamily: BODY, fontSize: 12, color: GREEN, textDecoration: "none" }}>
                  Voir tous →
                </Link>
              </div>

              {recentSignals && recentSignals.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {["Paire", "Direction", "TF", "Résultat", "Date"].map(h => (
                        <th key={h} style={{
                          padding: "10px 20px", textAlign: "left",
                          fontFamily: BODY, fontSize: 10, fontWeight: 700,
                          color: MUTED, letterSpacing: 2, textTransform: "uppercase",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentSignals.map(s => {
                      const dc = DIR_COLOR(s.direction ?? "");
                      const outcomeColor =
                        s.outcome === "pending" ? MUTED :
                        s.outcome === "stopped" ? RED :
                        s.outcome === "cancelled" ? MUTED : GREEN;
                      return (
                        <tr key={s.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <td style={{ padding: "12px 20px", fontFamily: HUD, fontSize: 13, color: TEXT }}>
                            {s.symbol}
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{
                              fontFamily: BODY, fontSize: 12, fontWeight: 700, color: dc,
                              padding: "3px 10px", borderRadius: 20,
                              background: `${dc}15`, border: `1px solid ${dc}30`,
                            }}>
                              {s.direction}
                            </span>
                          </td>
                          <td style={{ padding: "12px 20px", fontFamily: BODY, fontSize: 13, color: MUTED }}>{s.timeframe}</td>
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{ fontFamily: BODY, fontSize: 12, fontWeight: 600, color: outcomeColor }}>
                              {s.outcome === "pending" ? "En cours" :
                               s.outcome === "stopped" ? "Stop loss" :
                               s.outcome === "cancelled" ? "Annulé" :
                               s.outcome?.toUpperCase() ?? "—"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 20px", fontFamily: BODY, fontSize: 12, color: MUTED }}>
                            {new Date(s.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: "52px 24px", textAlign: "center" }}>
                  <div style={{ fontFamily: HUD, fontSize: 36, color: BORDER, marginBottom: 14 }}>◈</div>
                  <p style={{ fontFamily: BODY, fontSize: 14, color: MUTED, margin: "0 0 16px" }}>
                    Aucun signal pour l&apos;instant
                  </p>
                  <Link href={`/${locale}/signals`} style={{
                    display: "inline-block",
                    fontFamily: HUD, fontSize: 11, color: GREEN, textDecoration: "none",
                    padding: "8px 20px", borderRadius: 8,
                    border: `1px solid ${GREEN}33`, background: `${GREEN}0a`,
                  }}>
                    Créer mon premier signal →
                  </Link>
                </div>
              )}
            </div>

            {/* Performance card */}
            {rated > 0 && (
              <div style={{ background: SURFACE, borderRadius: 16, border: `1px solid ${BORDER}`, padding: "22px 24px" }}>
                <h3 style={{ fontFamily: HUD, fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 2, margin: "0 0 18px", textTransform: "uppercase" }}>
                  Performance
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {[
                    { label: "Signaux notés", value: rated, color: TEXT },
                    { label: "Wins", value: wins, color: GREEN },
                    { label: "Losses", value: losses, color: RED },
                    { label: "Win rate", value: `${winRate}%`, color: winRate >= 55 ? GREEN : winRate >= 40 ? GOLD : RED },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: SURFACE2, borderRadius: 10, border: `1px solid ${BORDER}`,
                      padding: "14px 16px", textAlign: "center",
                    }}>
                      <div style={{ fontFamily: BODY, fontSize: 10, color: MUTED, marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontFamily: HUD, fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Profil */}
            <div style={{ background: SURFACE, borderRadius: 16, border: `1px solid ${BORDER}`, padding: "22px 24px" }}>
              <h3 style={{ fontFamily: HUD, fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 2, margin: "0 0 16px", textTransform: "uppercase" }}>
                Profil
              </h3>
              <InfoRow label="Email" value={user!.email?.split("@")[0] + "@…" ?? "—"} />
              <InfoRow label="Handle" value={`@${profile?.public_id ?? "—"}`} mono />
              <InfoRow label="Langue" value={(prefs?.locale ?? locale).toUpperCase()} />
              <InfoRow label="Devise" value={prefs?.currency ?? "XOF"} />
              {prefs?.trading_style && <InfoRow label="Style" value={prefs.trading_style} />}
              <Link href={`/${locale}/settings`} style={{
                display: "block", textAlign: "center", marginTop: 14,
                padding: "8px", borderRadius: 8, textDecoration: "none",
                fontFamily: BODY, fontSize: 12, fontWeight: 600, color: MUTED,
                border: `1px solid ${BORDER}`,
              }}>
                Modifier le profil
              </Link>
            </div>

            {/* Plan + usage */}
            <div style={{
              background: `linear-gradient(135deg, ${plan.glow}, transparent)`,
              borderRadius: 16, border: `1px solid ${plan.color}22`, padding: "22px 24px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontFamily: HUD, fontSize: 10, color: MUTED, letterSpacing: 2 }}>PLAN</span>
                <span style={{
                  fontFamily: HUD, fontSize: 11, fontWeight: 900, color: plan.color,
                  letterSpacing: 3, padding: "3px 12px", borderRadius: 20,
                  border: `1px solid ${plan.color}44`, background: `${plan.color}0f`,
                }}>
                  {plan.label}
                </span>
              </div>
              <div style={{ fontFamily: BODY, fontSize: 14, color: MUTED, lineHeight: 1.7 }}>
                <div>{used} / {quota >= 9999 ? "∞" : quota} analyses ce mois</div>
                <div>XP total : {xp.toLocaleString("fr")}</div>
                {(wallet?.balance ?? 0) > 0 && (
                  <div>Crédits : {wallet!.balance}</div>
                )}
              </div>
              <div style={{ marginTop: 12, height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${usagePct}%`, borderRadius: 99,
                  background: `linear-gradient(90deg, ${plan.color}, ${plan.color}66)`,
                }} />
              </div>
              {tier === "free" && (
                <Link href={`/${locale}/billing`} style={{
                  display: "block", textAlign: "center", marginTop: 14,
                  padding: "9px", borderRadius: 10, textDecoration: "none",
                  fontFamily: HUD, fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1,
                  border: "1px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.06)",
                }}>
                  ↑ Passer Pro
                </Link>
              )}
            </div>

            {/* Accès rapide */}
            <div style={{ background: SURFACE, borderRadius: 16, border: `1px solid ${BORDER}`, padding: "18px 20px" }}>
              <h3 style={{ fontFamily: HUD, fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 2, margin: "0 0 14px", textTransform: "uppercase" }}>
                Navigation rapide
              </h3>
              {[
                { label: "◈  Mes signaux",       href: `/${locale}/signals` },
                { label: "◎  Journal de trading", href: `/${locale}/journal` },
                { label: "◇  Calendrier éco.",   href: `/${locale}/calendar` },
                { label: "⬡  Paramètres",        href: `/${locale}/settings` },
              ].map(({ label, href }) => (
                <Link key={href} href={href} style={{
                  display: "block", padding: "9px 12px", borderRadius: 8, textDecoration: "none",
                  fontFamily: BODY, fontSize: 13, fontWeight: 500, color: TEXT,
                  marginBottom: 4,
                  transition: "background 0.15s",
                }}>
                  {label}
                </Link>
              ))}
              {profile?.is_admin && (
                <Link href={`/${locale}/admin`} style={{
                  display: "block", marginTop: 8, padding: "9px 12px", borderRadius: 8, textDecoration: "none",
                  fontFamily: BODY, fontSize: 13, fontWeight: 600, color: BLUE,
                  border: `1px solid rgba(0,212,255,0.15)`, background: "rgba(0,212,255,0.05)",
                }}>
                  ⚙  Espace Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ── */

function KpiCard({
  icon, label, value, sub, color, glow, children,
}: {
  icon: string; label: string; value: string; sub: string;
  color: string; glow: string; children?: React.ReactNode;
}) {
  return (
    <div style={{
      background: SURFACE, borderRadius: 16, border: `1px solid ${BORDER}`,
      padding: "22px 24px", position: "relative", overflow: "hidden",
      boxShadow: `0 0 24px ${glow}`,
    }}>
      <div style={{ position: "absolute", top: 14, right: 18, fontFamily: HUD, fontSize: 24, color, opacity: 0.14 }}>
        {icon}
      </div>
      <div style={{ fontFamily: BODY, fontSize: 10, color: MUTED, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: HUD, fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: BODY, fontSize: 12, color: MUTED, marginTop: 6 }}>
        {sub}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 0", borderBottom: `1px solid ${BORDER}`,
    }}>
      <span style={{ fontFamily: BODY, fontSize: 12, color: MUTED }}>{label}</span>
      <span style={{
        fontFamily: mono ? HUD : BODY, fontSize: mono ? 11 : 13,
        color: TEXT, fontWeight: 600,
        maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {value}
      </span>
    </div>
  );
}
