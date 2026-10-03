import { getAdminClient } from "@/lib/supabase/server-admin";

export const metadata = { title: "Abonnements — Admin Profity" };

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

  if (tier) query = query.eq("tier", tier);
  if (status) query = query.eq("status", status);

  const { data: subs, count } = await query;

  const revenue = (subs ?? [])
    .filter((s) => ["active", "trialing"].includes(s.status))
    .reduce((sum, s) => sum + s.amount_minor, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-strong">
          Abonnements <span className="text-base font-normal text-text-muted">({count ?? 0})</span>
        </h1>
        <div className="flex gap-2 text-sm">
          <span className="text-text-muted">MRR estimé :</span>
          <span className="font-semibold text-long tabular-nums">
            {revenue.toLocaleString("fr")} XOF
          </span>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-3">
        <select name="tier" defaultValue={tier ?? ""} className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none">
          <option value="">Tous les tiers</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="elite">Elite</option>
        </select>
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none">
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="trialing">Trialing</option>
          <option value="cancelled">Annulé</option>
          <option value="expired">Expiré</option>
        </select>
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg">Filtrer</button>
      </form>

      <div className="rounded-xl border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <Th>Utilisateur</Th>
              <Th>Tier</Th>
              <Th>Statut</Th>
              <Th>Montant</Th>
              <Th>Fin de période</Th>
              <Th>Provider</Th>
            </tr>
          </thead>
          <tbody>
            {(subs ?? []).map((s) => {
              const profile = s.profiles as any;
              return (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-bg-soft">
                  <Td>
                    <div>
                      <p className="font-mono text-xs text-accent">@{profile?.public_id}</p>
                      <p className="text-xs text-text-muted">{profile?.email}</p>
                    </div>
                  </Td>
                  <Td>
                    <TierBadge tier={s.tier} />
                  </Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td>
                    <span className="font-mono tabular-nums">
                      {s.amount_minor.toLocaleString("fr")} {s.currency}
                    </span>
                  </Td>
                  <Td>{new Date(s.current_period_end).toLocaleDateString("fr")}</Td>
                  <Td>{s.provider}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}
function TierBadge({ tier }: { tier: string }) {
  const s: Record<string, string> = { elite: "bg-long-soft text-long", pro: "bg-accent-soft text-accent", free: "bg-bg text-text-muted" };
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${s[tier] ?? s.free}`}>{tier.toUpperCase()}</span>;
}
function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = {
    active:    "bg-long-soft text-long",
    trialing:  "bg-accent-soft text-accent",
    cancelled: "bg-short-soft text-short",
    expired:   "bg-bg text-text-muted",
    past_due:  "bg-short-soft text-short",
  };
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${s[status] ?? "bg-bg text-text-muted"}`}>{status}</span>;
}
