"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    const locale = await getLocale();
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <span className="font-display text-lg font-bold text-accent">Profity</span>
          <span className="rounded bg-accent px-2 py-0.5 text-xs font-semibold text-bg">
            ADMIN
          </span>
          <nav className="ml-4 flex gap-6 text-sm text-text">
            <a href="../admin" className="hover:text-text-strong">Dashboard</a>
            <a href="../admin/users" className="hover:text-text-strong">Utilisateurs</a>
            <a href="../admin/subscriptions" className="hover:text-text-strong">Abonnements</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
