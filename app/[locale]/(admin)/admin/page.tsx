import { createClient } from "@/lib/supabase/server";
import { createClient as adminClient } from "@supabase/supabase-js";
import Link from "next/link";

export const metadata = { title: "Admin — Profity" };

const admin = adminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function AdminPage() {
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

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-bold text-text-strong">Vue d'ensemble</h1>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <KpiCard label="Utilisateurs" value={totalUsers ?? 0} />
        <KpiCard label="Free" value={freeUsers} color="text-text-muted" />
        <KpiCard label="Pro actif" value={tiers.pro} color="text-accent" />
        <KpiCard label="Elite actif" value={tiers.elite} color="text-long" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent users */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-text-muted uppercase tracking-wider">
              Derniers inscrits
            </h2>
            <Link href="./admin/users" className="text-xs text-accent hover:underline">
              Voir tous →
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <Th>Handle</Th>
                  <Th>Email</Th>
                  <Th>Rôle</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {(recentUsers ?? []).map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-bg-soft">
                    <Td>
                      <Link href={`./admin/users/${u.id}`} className="font-mono text-accent hover:underline">
                        @{u.public_id}
                      </Link>
                    </Td>
                    <Td>{u.email}</Td>
                    <Td>
                      {u.is_admin ? (
                        <Badge color="accent">Admin</Badge>
                      ) : u.suspended ? (
                        <Badge color="short">Suspendu</Badge>
                      ) : (
                        <Badge color="muted">User</Badge>
                      )}
                    </Td>
                    <Td>{new Date(u.created_at).toLocaleDateString("fr")}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Audit trail */}
        <section>
          <h2 className="mb-3 font-display text-sm font-semibold text-text-muted uppercase tracking-wider">
            Actions récentes
          </h2>
          <div className="rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <Th>Action</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {(recentActions ?? []).map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <Td>
                      <span className="font-mono text-xs text-text">{a.action}</span>
                    </Td>
                    <Td>{new Date(a.created_at).toLocaleString("fr")}</Td>
                  </tr>
                ))}
                {(recentActions ?? []).length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-sm text-text-faint">
                      Aucune action pour l'instant
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color = "text-text-strong" }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</p>
      <p className={`mt-2 font-display text-3xl font-bold tabular-nums ${color}`}>{value}</p>
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
  return <td className="px-4 py-3 text-text">{children}</td>;
}

function Badge({ children, color }: { children: React.ReactNode; color: "accent" | "short" | "muted" }) {
  const styles = {
    accent: "bg-accent-soft text-accent",
    short:  "bg-short-soft text-short",
    muted:  "bg-bg text-text-muted",
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${styles[color]}`}>
      {children}
    </span>
  );
}
