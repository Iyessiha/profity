import { notFound } from "next/navigation";
import { createClient as adminClient } from "@supabase/supabase-js";
import { suspendUser, unsuspendUser, promoteToAdmin, revokeAdmin, cancelSubscription } from "../../actions";

export const metadata = { title: "Profil utilisateur — Admin Profity" };

const admin = adminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Props = { params: Promise<{ id: string }> };

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;

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

  const activeSub = subscriptions?.find((s) =>
    ["active", "trialing"].includes(s.status)
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-strong">
            @{profile.public_id}
          </h1>
          <p className="text-sm text-text-muted mt-0.5">{profile.email}</p>
          <div className="mt-2 flex gap-2">
            {profile.is_admin && <Badge color="accent">Admin</Badge>}
            {profile.suspended && <Badge color="short">Suspendu</Badge>}
            {!profile.is_admin && !profile.suspended && <Badge color="muted">Actif</Badge>}
          </div>
        </div>
        <p className="text-xs text-text-faint">
          Inscrit le {new Date(profile.created_at).toLocaleDateString("fr")}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Signaux notés" value={stats.signals_rated} />
          <StatCard label="Wins" value={stats.signals_won} color="text-long" />
          <StatCard label="Losses" value={stats.signals_lost} color="text-short" />
          <StatCard label="XP total" value={stats.total_xp} color="text-accent" />
        </div>
      )}

      {/* Subscription */}
      <Section title="Abonnements">
        {subscriptions && subscriptions.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <Th>Tier</Th><Th>Statut</Th><Th>Fin</Th><Th>Provider</Th><Th></Th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <Td><TierBadge tier={s.tier} /></Td>
                  <Td>{s.status}</Td>
                  <Td>{new Date(s.current_period_end).toLocaleDateString("fr")}</Td>
                  <Td>{s.provider}</Td>
                  <Td>
                    {["active", "trialing"].includes(s.status) && (
                      <form action={cancelSubscription.bind(null, s.id, id)}>
                        <button
                          type="submit"
                          className="text-xs text-short hover:underline"
                          onClick={(e) => {
                            if (!confirm("Annuler cet abonnement ?")) e.preventDefault();
                          }}
                        >
                          Annuler
                        </button>
                      </form>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-text-faint py-4 text-center">Aucun abonnement</p>
        )}
      </Section>

      {/* Admin actions */}
      <Section title="Actions admin">
        <div className="flex flex-wrap gap-3">
          {profile.suspended ? (
            <form action={unsuspendUser.bind(null, id)}>
              <ActionButton color="long">Réactiver le compte</ActionButton>
            </form>
          ) : (
            <form action={async (fd: FormData) => {
              "use server";
              const reason = fd.get("reason") as string;
              await suspendUser(id, reason || "Suspension admin");
            }}>
              <div className="flex gap-2">
                <input
                  name="reason"
                  placeholder="Raison de suspension…"
                  className="rounded border border-border bg-bg px-3 py-2 text-sm text-text w-52 focus:outline-none focus:ring-2 focus:ring-short/40"
                />
                <ActionButton color="short">Suspendre</ActionButton>
              </div>
            </form>
          )}

          {profile.is_admin ? (
            <form action={revokeAdmin.bind(null, id)}>
              <ActionButton color="muted">Révoquer admin</ActionButton>
            </form>
          ) : (
            <form action={promoteToAdmin.bind(null, id)}>
              <ActionButton color="accent">Promouvoir admin</ActionButton>
            </form>
          )}
        </div>
      </Section>

      {/* Audit log */}
      {auditLog && auditLog.length > 0 && (
        <Section title="Historique des actions">
          <ul className="space-y-2">
            {auditLog.map((a) => (
              <li key={a.id} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-xs bg-bg px-2 py-0.5 rounded text-text">{a.action}</span>
                <span className="text-text-faint text-xs">{new Date(a.created_at).toLocaleString("fr")}</span>
                {Object.keys(a.details).length > 0 && (
                  <span className="text-text-muted text-xs">{JSON.stringify(a.details)}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted">{title}</h2>
      {children}
    </div>
  );
}
function StatCard({ label, value, color = "text-text-strong" }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg p-3 text-center">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`font-display text-xl font-bold tabular-nums mt-1 ${color}`}>{value}</p>
    </div>
  );
}
function Badge({ children, color }: { children: React.ReactNode; color: "accent" | "short" | "muted" }) {
  const s = { accent: "bg-accent-soft text-accent", short: "bg-short-soft text-short", muted: "bg-bg text-text-muted" };
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${s[color]}`}>{children}</span>;
}
function TierBadge({ tier }: { tier: string }) {
  const s: Record<string, string> = { elite: "bg-long-soft text-long", pro: "bg-accent-soft text-accent", free: "bg-bg text-text-muted" };
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${s[tier] ?? s.free}`}>{tier.toUpperCase()}</span>;
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 text-sm text-text">{children}</td>;
}
function ActionButton({ children, color }: { children: React.ReactNode; color: "accent" | "short" | "long" | "muted" }) {
  const s = {
    accent: "bg-accent text-bg hover:bg-accent/90",
    short:  "bg-short text-white hover:bg-short/90",
    long:   "bg-long text-white hover:bg-long/90",
    muted:  "border border-border text-text hover:bg-bg-soft",
  };
  return (
    <button type="submit" className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${s[color]}`}>
      {children}
    </button>
  );
}
