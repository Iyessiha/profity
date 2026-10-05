import { getAdminClient } from "@/lib/supabase/server-admin";

export const metadata = { title: "Abonnements — Admin ProfityX" };

const HUD    = "'Orbitron', monospace";
const BODY   = "'Rajdhani', sans-serif";
const SURFACE = "#0a0f1a";
const BORDER  = "rgba(0,255,178,0.08)";
const BORDER2 = "rgba(0,255,178,0.15)";
const GREEN   = "#00FFB2";
const BLUE    = "#00D4FF";
const GOLD    = "#C9A84C";
const RED     = "#FF4444";
const TEXT    = "#c8d8e8";
const MUTED   = "rgba(200,216,232,0.45)";

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; status?: string }>;
}) {
  const admin = getAdminClient();
  const { tier, status } = await searchParams;

  let query = admin
    .from("subscriptions")
    .select(
      `id, tier, status, amount_minor, currency, current_period_start, current_period_end,
       provider, provider_ref, created_at,
       profiles ( email, public_id )`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (tier)   query = query.eq("tier", tier);
  if (status) query = query.eq("status", status);

  const { data: subs, count } = await query;

  const revenue = (subs ?? [])
    .filter((s) => ["active", "trialing"].includes(s.status))
    .reduce((sum, s) => sum + s.amount_minor, 0);

  const tierStats = { free: 0, pro: 0, elite: 0 } as Record<string, number>;
  for (const s of subs ?? []) {
    if (["active", "trialing"].includes(s.status)) {
      tierStats[s.tier] = (tierStats[s.tier] ?? 0) + 1;
    }
  }

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1200, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: BODY, fontSize: 11, color: MUTED, letterSpacing: 3, marginBottom: 6 }}>
          ADMINISTRATION
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <h1 style={{ fontFamily: HUD, fontSize: 22, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: 1 }}>
            Abonnements{" "}
            <span style={{ fontFamily: BODY, fontSize: 14, fontWeight: 400, color: MUTED }}>({count ?? 0})</span>
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: BODY, fontSize: 13, color: MUTED }}>MRR estimé</span>
            <span style={{
              fontFamily: HUD, fontSize: 16, fontWeight: 900, color: GREEN,
              padding: "4px 14px", borderRadius: 10,
              background: "rgba(0,255,178,0.08)", border: `1px solid ${BORDER2}`,
            }}>
              {revenue.toLocaleString("fr")} XOF
            </span>
          </div>
        </div>
      </div>

      {/* KPI mini-row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Pro actifs",   value: tierStats.pro,   color: GREEN, bg: "rgba(0,255,178,0.08)" },
          { label: "Elite actifs", value: tierStats.elite, color: GOLD,  bg: "rgba(201,168,76,0.08)" },
          { label: "Total actifs", value: (tierStats.pro ?? 0) + (tierStats.elite ?? 0), color: BLUE, bg: "rgba(0,212,255,0.08)" },
        ].map(k => (
          <div key={k.label} style={{
            background: SURFACE, borderRadius: 12,
            border: `1px solid ${BORDER}`,
            padding: "16px 20px",
            boxShadow: `0 0 16px ${k.bg}`,
          }}>
            <div style={{ fontFamily: BODY, fontSize: 10, color: MUTED, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
              {k.label}
            </div>
            <div style={{ fontFamily: HUD, fontSize: 28, fontWeight: 900, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <select name="tier" defaultValue={tier ?? ""} style={{
          background: SURFACE, border: `1px solid ${BORDER}`,
          borderRadius: 10, padding: "9px 14px",
          fontFamily: BODY, fontSize: 13, color: TEXT, outline: "none",
        }}>
          <option value="">Tous les tiers</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="elite">Elite</option>
        </select>
        <select name="status" defaultValue={status ?? ""} style={{
          background: SURFACE, border: `1px solid ${BORDER}`,
          borderRadius: 10, padding: "9px 14px",
          fontFamily: BODY, fontSize: 13, color: TEXT, outline: "none",
        }}>
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="trialing">Trialing</option>
          <option value="cancelled">Annulé</option>
          <option value="expired">Expiré</option>
        </select>
        <button type="submit" style={{
          background: `linear-gradient(135deg, ${GREEN}22, ${BLUE}11)`,
          border: `1px solid ${BORDER2}`,
          borderRadius: 10, padding: "9px 20px", cursor: "pointer",
          fontFamily: HUD, fontSize: 11, fontWeight: 700,
          color: GREEN, letterSpacing: 1,
        }}>
          Filtrer
        </button>
      </form>

      {/* Table */}
      <div style={{
        background: SURFACE, borderRadius: 16,
        border: `1px solid ${BORDER}`, overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {["Utilisateur", "Tier", "Statut", "Montant", "Fin de période", "Provider"].map(h => (
                <th key={h} style={{
                  padding: "12px 20px", textAlign: "left",
                  fontFamily: BODY, fontSize: 10, fontWeight: 700,
                  color: MUTED, letterSpacing: 2, textTransform: "uppercase",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(subs ?? []).map((s) => {
              const profile = s.profiles as any;
              return (
                <tr key={s.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "13px 20px" }}>
                    <div style={{ fontFamily: HUD, fontSize: 11, color: GREEN, marginBottom: 2 }}>
                      @{profile?.public_id}
                    </div>
                    <div style={{ fontFamily: BODY, fontSize: 11, color: MUTED }}>
                      {profile?.email}
                    </div>
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <TierBadge tier={s.tier} />
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <StatusBadge status={s.status} />
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <span style={{ fontFamily: HUD, fontSize: 13, color: TEXT, letterSpacing: 0.5 }}>
                      {s.amount_minor.toLocaleString("fr")} {s.currency}
                    </span>
                  </td>
                  <td style={{ padding: "13px 20px", fontFamily: BODY, fontSize: 12, color: MUTED }}>
                    {new Date(s.current_period_end).toLocaleDateString("fr")}
                  </td>
                  <td style={{ padding: "13px 20px", fontFamily: BODY, fontSize: 12, color: MUTED }}>
                    {s.provider}
                  </td>
                </tr>
              );
            })}
            {(subs ?? []).length === 0 && (
              <tr>
                <td colSpan={6} style={{
                  padding: "48px 24px", textAlign: "center",
                  fontFamily: BODY, fontSize: 14, color: MUTED,
                }}>
                  Aucun abonnement trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    elite: { color: GOLD,  bg: "rgba(201,168,76,0.1)" },
    pro:   { color: GREEN, bg: "rgba(0,255,178,0.1)" },
    free:  { color: MUTED, bg: "rgba(200,216,232,0.06)" },
  };
  const s = map[tier] ?? map.free;
  return (
    <span style={{
      fontFamily: HUD, fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
      color: s.color, background: s.bg,
      border: `1px solid ${s.color}33`,
      borderRadius: 20, padding: "2px 10px", display: "inline-block",
    }}>
      {tier.toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    active:    { color: GREEN, bg: "rgba(0,255,178,0.08)" },
    trialing:  { color: BLUE,  bg: "rgba(0,212,255,0.08)" },
    cancelled: { color: RED,   bg: "rgba(255,68,68,0.08)" },
    expired:   { color: MUTED, bg: "rgba(200,216,232,0.04)" },
    past_due:  { color: GOLD,  bg: "rgba(201,168,76,0.08)" },
  };
  const s = map[status] ?? map.expired;
  return (
    <span style={{
      fontFamily: BODY, fontSize: 11, fontWeight: 600,
      color: s.color, background: s.bg,
      border: `1px solid ${s.color}33`,
      borderRadius: 20, padding: "2px 10px", display: "inline-block",
    }}>
      {status}
    </span>
  );
}
