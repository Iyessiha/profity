import { createClient as adminClient } from "@supabase/supabase-js";
import Link from "next/link";

export const metadata = { title: "Utilisateurs — Admin Profity" };

const admin = adminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10));
  const pageSize = 25;
  const from = (pageNum - 1) * pageSize;

  let query = admin
    .from("profiles")
    .select(
      `id, email, public_id, display_name, is_admin, suspended, created_at,
       subscriptions ( tier, status, current_period_end )`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (q) {
    query = query.or(`email.ilike.%${q}%,public_id.ilike.%${q}%`);
  }

  const { data: users, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-strong">
          Utilisateurs <span className="text-base font-normal text-text-muted">({count ?? 0})</span>
        </h1>
        <form method="GET">
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher email / handle…"
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/40 w-64"
          />
        </form>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <Th>Handle</Th>
              <Th>Email</Th>
              <Th>Tier</Th>
              <Th>Statut</Th>
              <Th>Inscrit le</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => {
              const activeSub = (u.subscriptions as any[])
                ?.filter((s: any) => ["active", "trialing"].includes(s.status))
                .sort((a: any, b: any) =>
                  new Date(b.current_period_end).getTime() - new Date(a.current_period_end).getTime()
                )[0];

              return (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-bg-soft">
                  <Td>
                    <span className="font-mono text-xs text-text">@{u.public_id}</span>
                  </Td>
                  <Td>{u.email}</Td>
                  <Td>
                    <TierBadge tier={activeSub?.tier ?? "free"} />
                  </Td>
                  <Td>
                    {u.is_admin ? (
                      <StatusBadge color="accent">Admin</StatusBadge>
                    ) : u.suspended ? (
                      <StatusBadge color="short">Suspendu</StatusBadge>
                    ) : (
                      <StatusBadge color="muted">Actif</StatusBadge>
                    )}
                  </Td>
                  <Td>{new Date(u.created_at).toLocaleDateString("fr")}</Td>
                  <Td>
                    <Link
                      href={`./users/${u.id}`}
                      className="text-xs text-accent hover:underline"
                    >
                      Gérer →
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?${q ? `q=${q}&` : ""}page=${p}`}
              className={`rounded px-3 py-1 text-sm ${
                p === pageNum
                  ? "bg-accent text-bg font-semibold"
                  : "border border-border text-text hover:bg-bg-soft"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}
function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    elite: "bg-long-soft text-long",
    pro:   "bg-accent-soft text-accent",
    free:  "bg-bg text-text-muted",
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${styles[tier] ?? styles.free}`}>
      {tier.toUpperCase()}
    </span>
  );
}
function StatusBadge({ children, color }: { children: React.ReactNode; color: "accent" | "short" | "muted" }) {
  const styles = { accent: "bg-accent-soft text-accent", short: "bg-short-soft text-short", muted: "bg-bg text-text-muted" };
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${styles[color]}`}>{children}</span>;
}
