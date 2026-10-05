import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = { title: "Dashboard — ProfityX" };

const HUD  = "'Orbitron', monospace";
const BODY = "'Rajdhani', sans-serif";

const BG      = "#020408";
const SURFACE = "#0a0f1a";
const SURFACE2 = "#0d1520";
const BORDER  = "rgba(0,255,178,0.08)";
const BORDER2 = "rgba(0,255,178,0.15)";
const GREEN   = "#00FFB2";
const BLUE    = "#00D4FF";
const GOLD    = "#C9A84C";
const RED     = "#FF4444";
const TEXT    = "#c8d8e8";
const MUTED   = "rgba(200,216,232,0.45)";

const PLAN_COLORS: Record<string, { label: string; color: string; glow: string }> = {
  free:  { label: "FREE",  color: MUTED,  glow: "rgba(200,216,232,0.1)" },
  pro:   { label: "PRO",   color: GREEN,  glow: "rgba(0,255,178,0.15)" },
  elite: { label: "ELITE", color: GOLD,   glow: "rgba(201,168,76,0.15)" },
};

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: prefs },
    { data: tierData },
    { data: usedData },
  ] = await Promise.all([
    supabase.from("profiles").select("public_id, display_name, is_admin, created_at").eq("id", user!.id).single(),
    supabase.from("user_preferences").select("locale, currency, trading_style").eq("user_id", user!.id).single(),
    supabase.rpc("current_tier").single<string>(),
    supabase.rpc("analyses_used_this_month", { for_user: user!.id }).single<number>(),
  ]);

  const tier = (tierData as string) ?? "free";
  const usedThisMonth = (usedData as number) ?? 0;

  const { data: allowanceRow } = await supabase
    .from("tier_allowances")
    .select("analyses_monthly")
    .eq("tier", tier)
    .single();

  const quota = allowanceRow?.analyses_monthly ?? 5;

  const { data: recentSignals } = await supabase
    .from("signals")
    .select("id, symbol, direction, created_at, timeframe")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const plan = PLAN_COLORS[tier] ?? PLAN_COLORS.free;
  const usagePercent = quota > 0 ? Math.min((usedThisMonth / quota) * 100, 100) : 100;
  const displayName = profile?.display_name ?? profile?.public_id ?? user!.email?.split("@")[0] ?? "Trader";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { month: "long", year: "numeric" })
    : "";

  const kpis = [
    {
      label: t("kpiUsed"),
      value: `${usedThisMonth}`,
      sub: `${t("analysisOf")} ${quota === 9999 ? t("unlimited") : quota}`,
      color: usagePercent > 80 ? RED : GREEN,
      glow: usagePercent > 80 ? "rgba(255,68,68,0.12)" : "rgba(0,255,178,0.08)",
      icon: "◈",
    },
    {
      label: t("kpiPlan"),
      value: plan.label,
      sub: tier === "free" ? t("upgradeBtn") : "✓ Actif",
      color: plan.color,
      glow: plan.glow,
      icon: "◇",
      href: tier === "free" ? `/${locale}/billing` : undefined,
    },
    {
      label: t("preferences"),
      value: prefs?.currency ?? "XOF",
      sub: prefs?.trading_style ?? t("notSet"),
      color: BLUE,
      glow: "rgba(0,212,255,0.08)",
      icon: "◎",
    },
    {
      label: "Email",
      value: user!.email?.split("@")[0] ?? "—",
      sub: user!.email?.split("@")[1] ? `@${user!.email?.split("@")[1]}` : "",
      color: TEXT,
      glow: "rgba(200,216,232,0.04)",
      icon: "⬡",
    },
  ];

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Welcome header */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 36, flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ fontFamily: BODY, fontSize: 13, color: MUTED, letterSpacing: 2, marginBottom: 6 }}>
            {t("memberSince")} {memberSince}
          </div>
          <h1 style={{
            fontFamily: HUD, fontSize: 28, fontWeight: 900, color: TEXT, margin: 0,
            letterSpacing: 1,
          }}>
            {t("welcome")},{" "}
            <span style={{
              background: `linear-gradient(135deg, ${GREEN}, ${BLUE})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {displayName}
            </span>
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{
              fontFamily: HUD, fontSize: 10, fontWeight: 700, letterSpacing: 2,
              padding: "3px 10px", borderRadius: 20,
              background: plan.glow,
              border: `1px solid ${plan.color}44`,
              color: plan.color,
            }}>
              {plan.label}
            </span>
            <span style={{ fontFamily: BODY, fontSize: 12, color: MUTED }}>
              @{profile?.public_id ?? "—"}
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href={`/${locale}/signals`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 22px", borderRadius: 12, textDecoration: "none",
              background: `linear-gradient(135deg, ${GREEN}22, ${BLUE}11)`,
              border: `1px solid ${BORDER2}`,
              fontFamily: HUD, fontSize: 12, fontWeight: 700,
              color: GREEN, letterSpacing: 1,
              transition: "all 0.2s ease",
            }}
          >
            ◈ {t("newAnalysis")}
          </Link>
          <Link href={`/${locale}/signals`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 22px", borderRadius: 12, textDecoration: "none",
              background: "transparent",
              border: `1px solid ${BORDER}`,
              fontFamily: BODY, fontSize: 13, fontWeight: 600,
              color: TEXT, letterSpacing: 0.5,
            }}
          >
            {t("viewSignals")} →
          </Link>
        </div>
      </div>

      {/* Usage bar */}
      {tier === "free" && (
        <div style={{
          marginBottom: 28, padding: "14px 20px",
          background: `linear-gradient(135deg, rgba(201,168,76,0.08), rgba(0,212,255,0.04))`,
          border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ fontFamily: BODY, fontSize: 14, color: GOLD }}>
            ✦ {t("upgradeBanner")}
          </div>
          <Link href={`/${locale}/billing`}
            style={{
              fontFamily: HUD, fontSize: 11, fontWeight: 700, letterSpacing: 1,
              color: GOLD, textDecoration: "none",
              padding: "6px 16px", borderRadius: 8,
              border: "1px solid rgba(201,168,76,0.3)",
              background: "rgba(201,168,76,0.08)",
            }}
          >
            {t("upgradeBtn")} →
          </Link>
        </div>
      )}

      {/* KPI grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16, marginBottom: 32,
      }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            background: SURFACE, borderRadius: 16,
            border: `1px solid ${BORDER}`,
            padding: "22px 24px",
            boxShadow: `0 0 20px ${kpi.glow}`,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 16, right: 16,
              fontFamily: HUD, fontSize: 22, color: kpi.color, opacity: 0.2,
            }}>
              {kpi.icon}
            </div>
            <div style={{ fontFamily: BODY, fontSize: 11, color: MUTED, letterSpacing: 2, marginBottom: 10 }}>
              {kpi.label.toUpperCase()}
            </div>
            <div style={{ fontFamily: HUD, fontSize: 28, fontWeight: 900, color: kpi.color, lineHeight: 1 }}>
              {kpi.value}
            </div>
            <div style={{ fontFamily: BODY, fontSize: 12, color: MUTED, marginTop: 6 }}>
              {kpi.href ? (
                <Link href={kpi.href} style={{ color: kpi.color, textDecoration: "none", opacity: 0.7 }}>
                  {kpi.sub}
                </Link>
              ) : kpi.sub}
            </div>

            {/* Usage progress bar for analyses */}
            {i === 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{
                  height: 4, borderRadius: 99,
                  background: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${usagePercent}%`,
                    borderRadius: 99,
                    background: usagePercent > 80
                      ? `linear-gradient(90deg, ${RED}, #FF8844)`
                      : `linear-gradient(90deg, ${GREEN}, ${BLUE})`,
                    transition: "width 0.8s ease",
                  }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main content — 2 columns */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 24,
      }}>

        {/* Recent signals */}
        <div style={{
          background: SURFACE, borderRadius: 16,
          border: `1px solid ${BORDER}`,
          overflow: "hidden",
        }}>
          <div style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <h2 style={{
              fontFamily: HUD, fontSize: 12, fontWeight: 700,
              color: MUTED, letterSpacing: 2, margin: 0, textTransform: "uppercase",
            }}>
              {t("recentSignals")}
            </h2>
            <Link href={`/${locale}/signals`}
              style={{ fontFamily: BODY, fontSize: 12, color: GREEN, textDecoration: "none" }}>
              Voir tout →
            </Link>
          </div>

          {recentSignals && recentSignals.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {[t("signalSymbol"), t("signalDirection"), "Timeframe", t("signalTime")].map(h => (
                    <th key={h} style={{
                      padding: "10px 20px",
                      fontFamily: BODY, fontSize: 10, fontWeight: 700,
                      color: MUTED, letterSpacing: 2, textAlign: "left",
                      textTransform: "uppercase",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSignals.map((s) => {
                  const isBull = s.direction?.toLowerCase().includes("bull") ||
                                 s.direction?.toLowerCase().includes("long") ||
                                 s.direction?.toLowerCase() === "buy";
                  const dirColor = isBull ? GREEN : RED;
                  return (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "12px 20px", fontFamily: HUD, fontSize: 13, color: TEXT }}>
                        {s.symbol}
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{
                          fontFamily: BODY, fontSize: 12, fontWeight: 700,
                          color: dirColor, letterSpacing: 1,
                          padding: "3px 10px", borderRadius: 20,
                          background: `${dirColor}15`,
                          border: `1px solid ${dirColor}33`,
                        }}>
                          {s.direction ?? "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", fontFamily: BODY, fontSize: 13, color: MUTED }}>
                        {s.timeframe ?? "—"}
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
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontFamily: HUD, fontSize: 32, color: BORDER, marginBottom: 12 }}>◈</div>
              <p style={{ fontFamily: BODY, fontSize: 14, color: MUTED, margin: 0 }}>{t("noSignals")}</p>
              <Link href={`/${locale}/signals`}
                style={{
                  display: "inline-block", marginTop: 16,
                  fontFamily: HUD, fontSize: 11, color: GREEN,
                  textDecoration: "none", letterSpacing: 1,
                  padding: "8px 20px", borderRadius: 8,
                  border: `1px solid ${GREEN}33`,
                  background: `${GREEN}0a`,
                }}
              >
                {t("newAnalysis")} →
              </Link>
            </div>
          )}
        </div>

        {/* Right column — Profile + Prefs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Profile card */}
          <div style={{
            background: SURFACE, borderRadius: 16,
            border: `1px solid ${BORDER}`, padding: "22px 24px",
          }}>
            <h3 style={{
              fontFamily: HUD, fontSize: 11, fontWeight: 700,
              color: MUTED, letterSpacing: 2, margin: "0 0 16px",
              textTransform: "uppercase",
            }}>
              {t("profile")}
            </h3>
            <Row label={t("email")} value={user!.email ?? "—"} />
            <Row label={t("handle")} value={`@${profile?.public_id ?? "—"}`} mono />
          </div>

          {/* Preferences card */}
          <div style={{
            background: SURFACE, borderRadius: 16,
            border: `1px solid ${BORDER}`, padding: "22px 24px",
          }}>
            <h3 style={{
              fontFamily: HUD, fontSize: 11, fontWeight: 700,
              color: MUTED, letterSpacing: 2, margin: "0 0 16px",
              textTransform: "uppercase",
            }}>
              {t("preferences")}
            </h3>
            <Row label={t("language")} value={prefs?.locale ?? locale} />
            <Row label={t("currency")} value={prefs?.currency ?? "XOF"} />
            <Row label={t("tradingStyle")} value={prefs?.trading_style ?? t("notSet")} />
          </div>

          {/* Plan card */}
          <div style={{
            background: `linear-gradient(135deg, ${plan.glow}, transparent)`,
            borderRadius: 16,
            border: `1px solid ${plan.color}22`,
            padding: "22px 24px",
          }}>
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: 12,
            }}>
              <span style={{
                fontFamily: HUD, fontSize: 10, letterSpacing: 2, color: MUTED,
                textTransform: "uppercase",
              }}>
                {t("kpiPlan")}
              </span>
              <span style={{
                fontFamily: HUD, fontSize: 11, fontWeight: 900,
                color: plan.color, letterSpacing: 3,
                padding: "3px 12px", borderRadius: 20,
                border: `1px solid ${plan.color}44`,
                background: `${plan.color}0f`,
              }}>
                {plan.label}
              </span>
            </div>
            <div style={{ fontFamily: BODY, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
              {usedThisMonth} / {quota === 9999 ? "∞" : quota} analyses ce mois
            </div>
            {tier === "free" && (
              <Link href={`/${locale}/billing`}
                style={{
                  display: "block", textAlign: "center", marginTop: 14,
                  padding: "9px", borderRadius: 10, textDecoration: "none",
                  fontFamily: HUD, fontSize: 11, fontWeight: 700,
                  color: GOLD, letterSpacing: 1,
                  border: "1px solid rgba(201,168,76,0.3)",
                  background: "rgba(201,168,76,0.06)",
                }}
              >
                ↑ {t("upgradeBtn")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const BODY = "'Rajdhani', sans-serif";
  const HUD  = "'Orbitron', monospace";
  const TEXT = "#c8d8e8";
  const MUTED = "rgba(200,216,232,0.45)";
  const BORDER = "rgba(0,255,178,0.08)";
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 0", borderBottom: `1px solid ${BORDER}`,
    }}>
      <span style={{ fontFamily: BODY, fontSize: 12, color: MUTED }}>{label}</span>
      <span style={{
        fontFamily: mono ? HUD : BODY,
        fontSize: mono ? 11 : 13,
        color: TEXT, fontWeight: 600,
        maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {value}
      </span>
    </div>
  );
}
