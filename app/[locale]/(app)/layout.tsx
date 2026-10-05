import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "./app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("public_id, display_name, is_admin")
    .eq("id", user.id)
    .single();

  const t = await getTranslations("dashboard");

  const nav = [
    { key: "sidebarDashboard", href: "dashboard", icon: "⬡" },
    { key: "sidebarSignals",   href: "signals",   icon: "◈" },
    { key: "sidebarSettings",  href: "settings",  icon: "◎" },
  ];

  return (
    <AppShell
      displayName={profile?.display_name ?? profile?.public_id ?? user.email?.split("@")[0] ?? "Trader"}
      publicId={profile?.public_id ?? ""}
      isAdmin={profile?.is_admin ?? false}
      nav={nav.map(n => ({ label: t(n.key as Parameters<typeof t>[0]), href: n.href, icon: n.icon }))}
      adminLabel={t("sidebarAdmin")}
      upgradeLabel={t("sidebarUpgrade")}
    >
      {children}
    </AppShell>
  );
}
