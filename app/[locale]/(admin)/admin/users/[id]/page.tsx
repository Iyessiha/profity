import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/server-admin";
import { suspendUser, unsuspendUser, promoteToAdmin, revokeAdmin, cancelSubscription } from "../../actions";

export const metadata = { title: "Profil utilisateur — Admin ProfityX" };

type Props = { params: Promise<{ id: string }> };

const HUD    = "'Orbitron', monospace";
const BODY   = "'Rajdhani', sans-serif";
const SURFACE = "#0a0f1a";
const BORDER  = "rgba(0,255,178,0.08)";
const GREEN   = "#00FFB2";
const BLUE    = "#00D4FF";
const GOLD    = "#C9A84C";
const RED     = "#FF4444";
const TEXT    = "#c8d8e8";
const MUTED   = "rgba(200,216,232,0.45)";

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;
  const admin = getAdminClient();

  const [
    { data: profile },
    { data: subscriptions },
    { data: auditLog },
    { data: stats },
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", id).single(),
    admin.from("subscriptions").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    admin.from("admin_actions").select("*").eq("subject_id", id).order("created_at", { ascending: false }).limit(20),
    admin.from("user_stats").select("*").eq("user_id", id).single(),
  ]);

  if (!profile) notFound();

  const activeSub = subscriptions?.find((s) => ["active", "trialing"].includes(s.status));

  return (
    <div style={{ padding: "36px 40px", maxWidth: 900, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16 }}>
        <div>
          <div style={{ fontFamily: BODY, fontSize: 11, color: MUTED, letterSpacing: 3, marginBottom: 6 }}>
            PROFIL UTILISATEUR
          </div>
          <h1 style={{ fontFamily: HUD, fontSize: 22, fontWeight: 900, color: TEXT, margin: "0 0 6px", letterSpacing: 1 }}>
            @{profile.public_id}
          </h1>
          <p style={{ fontFamily: BODY, fontSize: 14, color: MUTED, margin: "0 0 10px" }}>{profile.email}</p>
          <div style={{ display: "flex", gap: 8 }}>
            {profile.is_admin && <Badge color={BLUE} bg="rgba(0,212,255,0.1)">Admin</Badge>}
            {profile.suspended && <Badge color={RED} bg="rgba(255,68,68,0.1)">Suspendu</Badge>}
            {!profile.is_admin && !profile.suspended && <Badge color={GREEN} bg="rgba(0,255,178,0.08)">Actif</Badge>}
          </div>
        </div>
        <span style={{ fontFamily: BODY, fontSize: 12, color: MUTED }}>
          Inscrit le {new Date(profile.created_at).toLocaleDateString("fr")}
        </span>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12, marginBottom: 24,
        }}>
          {[
            { label: "Signaux notés", value: stats.signals_rated, color: TEXT },
            { label: "Wins",          value: stats.signals_won,   color: GREEN },
            { label: "Losses",        value: stats.signals_lost,  color: RED },
            { label: "XP total",      value: stats.total_xp,      color: BLUE },
          ].map(s => (
            <div key={s.label} style={{
              background: SURFACE, borderRadius: 12,
              border: `1px solid ${BORDER}`, padding: "16px 18px",
              textAlign: "center",
            }}>
              <div style={{ fontFamily: BODY, fontSize: 11, color: MUTED, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: HUD, fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Subscriptions */}
      <Section title="Abonnements">
        {subscriptions && subscriptions.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Tier", "Statut", "Fin de période", "Provider", ""].map(h => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: "left",
                    fontFamily: BODY, fontSize: 10, fontWeight: 700,
                    color: MUTED, letterSpacing: 2, textTransform: "uppercase",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "11px 16px" }}><TierBadge tier={s.tier} /></td>
                  <td style={{ padding: "11px 16px" }}><StatusBadge status={s.status} /></td>
                  <td style={{ padding: "11px 16px", fontFamily: BODY, fontSize: 13, color: MUTED }}>
                    {new Date(s.current_period_end).toLocaleDateString("fr")}
                  </td>
                  <td style={{ padding: "11px 16px", fontFamily: BODY, fontSize: 12, color: MUTED }}>
                    {s.provider}
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    {["active", "trialing"].includes(s.status) && (
                      <form action={cancelSubscription.bind(null, s.id, id)}>
                        <button type="submit" style={{
                          background: "transparent", border: `1px solid ${RED}44`,
                          borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                          fontFamily: BODY, fontSize: 11, color: RED,
                        }}>
                          Annuler
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontFamily: BODY, fontSize: 14, color: MUTED, textAlign: "center", padding: "24px 0", margin: 0 }}>
            Aucun abonnement
          </p>
        )}
      </Section>

      {/* Admin actions */}
      <Section title="Actions admin">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {profile.suspended ? (
            <form action={unsuspendUser.bind(null, id)}>
              <ActionBtn color={GREEN} border={`1px solid ${GREEN}44`} bg="rgba(0,255,178,0.08)">
                ✓ Réactiver le compte
              </ActionBtn>
            </form>
          ) : (
            <form action={async (fd: FormData) => {
              "use server";
              const reason = fd.get("reason") as string;
              await suspendUser(id, reason || "Suspension admin");
            }} style={{ display: "flex", gap: 10 }}>
              <input
                name="reason"
                placeholder="Raison de suspension…"
                style={{
                  background: "#0d1520", border: `1px solid ${BORDER}`,
                  borderRadius: 8, padding: "8px 14px",
                  fontFamily: BODY, fontSize: 13, color: TEXT,
                  width: 220, outline: "none",
                }}
              />
              <ActionBtn color={RED} border={`1px solid ${RED}44`} bg="rgba(255,68,68,0.08)">
                Suspendre
              </ActionBtn>
            </form>
          )}

          {profile.is_admin ? (
            <form action={revokeAdmin.bind(null, id)}>
              <ActionBtn color={MUTED} border={`1px solid ${BORDER}`} bg="transparent">
                Révoquer admin
              </ActionBtn>
            </form>
          ) : (
            <form action={promoteToAdmin.bind(null, id)}>
              <ActionBtn color={BLUE} border={`1px solid ${BLUE}44`} bg="rgba(0,212,255,0.08)">
                ↑ Promouvoir admin
              </ActionBtn>
            </form>
          )}
        </div>
      </Section>

      {/* Audit log */}
      {auditLog && auditLog.length > 0 && (
        <Section title="Historique des actions">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {auditLog.map((a) => (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "8px 0", borderBottom: `1px solid ${BORDER}`,
              }}>
                <span style={{
                  fontFamily: HUD, fontSize: 10, color: TEXT,
                  background: "#0d1520", borderRadius: 6,
                  padding: "3px 10px", letterSpacing: 0.5,
                }}>
                  {a.action}
                </span>
                <span style={{ fontFamily: BODY, fontSize: 11, color: MUTED }}>
                  {new Date(a.created_at).toLocaleString("fr")}
                </span>
                {Object.keys(a.details).length > 0 && (
                  <span style={{ fontFamily: BODY, fontSize: 11, color: MUTED, opacity: 0.7 }}>
                    {JSON.stringify(a.details)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: SURFACE, borderRadius: 16,
      border: `1px solid ${BORDER}`, padding: "22px 24px",
      marginBottom: 20,
    }}>
      <h2 style={{
        fontFamily: HUD, fontSize: 10, fontWeight: 700, color: MUTED,
        letterSpacing: 2, margin: "0 0 18px", textTransform: "uppercase",
      }}>
        {title}
      </h2>
      {children}
    </div>
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
      fontFamily: BODY, fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
      color: s.color, background: s.bg,
      border: `1px solid ${s.color}33`,
      borderRadius: 20, padding: "2px 10px", display: "inline-block",
    }}>
      {status}
    </span>
  );
}

function ActionBtn({ children, color, border, bg }: {
  children: React.ReactNode; color: string; border: string; bg: string;
}) {
  return (
    <button type="submit" style={{
      fontFamily: BODY, fontSize: 13, fontWeight: 700,
      color, border, background: bg, borderRadius: 10,
      padding: "9px 18px", cursor: "pointer",
      letterSpacing: 0.5, transition: "opacity 0.15s",
    }}>
      {children}
    </button>
  );
}
