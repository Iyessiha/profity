import { getAdminClient } from "@/lib/supabase/server-admin";
import Link from "next/link";

export const metadata = { title: "Utilisateurs — Admin ProfityX" };

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

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const admin = getAdminClient();
  const { q, page } = await searchParams;
  const pageNum  = Math.max(1, parseInt(page ?? "1", 10));
  const pageSize = 25;
  const from     = (pageNum - 1) * pageSize;

  let query = admin
    .from("profiles")
    .select(
      `id, email, public_id, display_name, is_admin, suspended, created_at,
       subscriptions ( tier, status, current_period_end )`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (q) query = query.or(`email.ilike.%${q}%,public_id.ilike.%${q}%`);

  const { data: users, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1200, margin: "0 auto" }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 32, flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ fontFamily: BODY, fontSize: 11, color: MUTED, letterSpacing: 3, marginBottom: 6 }}>
            ADMINISTRATION
          </div>
          <h1 style={{ fontFamily: HUD, fontSize: 22, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: 1 }}>
            Utilisateurs{" "}
            <span style={{ fontFamily: BODY, fontSize: 14, fontWeight: 400, color: MUTED, letterSpacing: 0 }}>
              ({count ?? 0})
            </span>
          </h1>
        </div>

        {/* Search */}
        <form method="GET">
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              fontFamily: HUD, fontSize: 12, color: MUTED,
            }}>◎</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Email ou handle…"
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: "10px 16px 10px 36px",
                fontFamily: BODY, fontSize: 13, color: TEXT,
                width: 260, outline: "none",
              }}
            />
          </div>
        </form>
      </div>

      {/* Table */}
      <div style={{
        background: SURFACE, borderRadius: 16,
        border: `1px solid ${BORDER}`, overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {["Handle", "Email", "Tier", "Statut", "Inscrit le", ""].map(h => (
                <th key={h} style={{
                  padding: "12px 20px", textAlign: "left",
                  fontFamily: BODY, fontSize: 10, fontWeight: 700,
                  color: MUTED, letterSpacing: 2, textTransform: "uppercase",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => {
              const activeSub = (u.subscriptions as any[])
                ?.filter((s: any) => ["active", "trialing"].includes(s.status))
                .sort((a: any, b: any) =>
                  new Date(b.current_period_end).getTime() - new Date(a.current_period_end).getTime()
                )[0];
              const tier = activeSub?.tier ?? "free";

              return (
                <tr key={u.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "13px 20px" }}>
                    <span style={{ fontFamily: HUD, fontSize: 11, color: GREEN, letterSpacing: 0.5 }}>
                      @{u.public_id}
                    </span>
                  </td>
                  <td style={{
                    padding: "13px 20px",
                    fontFamily: BODY, fontSize: 13, color: MUTED,
                    maxWidth: 180, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {u.email}
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <TierBadge tier={tier} />
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    {u.is_admin ? (
                      <Badge color={BLUE} bg="rgba(0,212,255,0.1)">Admin</Badge>
                    ) : u.suspended ? (
                      <Badge color={RED} bg="rgba(255,68,68,0.1)">Suspendu</Badge>
                    ) : (
                      <Badge color={MUTED} bg="rgba(200,216,232,0.06)">Actif</Badge>
                    )}
                  </td>
                  <td style={{
                    padding: "13px 20px",
                    fontFamily: BODY, fontSize: 12, color: MUTED,
                  }}>
                    {new Date(u.created_at).toLocaleDateString("fr")}
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <Link href={`./users/${u.id}`} style={{
                      fontFamily: BODY, fontSize: 12, color: GREEN,
                      textDecoration: "none", letterSpacing: 0.5,
                    }}>
                      Gérer →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(users ?? []).length === 0 && (
              <tr>
                <td colSpan={6} style={{
                  padding: "48px 24px", textAlign: "center",
                  fontFamily: BODY, fontSize: 14, color: MUTED,
                }}>
                  Aucun utilisateur trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 24 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?${q ? `q=${q}&` : ""}page=${p}`}
              style={{
                display: "inline-block",
                padding: "6px 14px", borderRadius: 8,
                fontFamily: BODY, fontSize: 13, fontWeight: 600,
                textDecoration: "none",
                background: p === pageNum ? GREEN : "transparent",
                color: p === pageNum ? "#020408" : MUTED,
                border: p === pageNum ? `1px solid ${GREEN}` : `1px solid ${BORDER}`,
              }}
            >
              {p}
            </a>
          ))}
        </div>
      )}
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
      borderRadius: 20, padding: "2px 10px",
      display: "inline-block",
    }}>
      {tier.toUpperCase()}
    </span>
  );
}

function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
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
