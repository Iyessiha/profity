import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { LogoutButton } from "./logout-button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const tc = await getTranslations("common");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("public_id, display_name, is_admin")
    .eq("id", user!.id)
    .single();

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("locale, currency, trading_style")
    .eq("user_id", user!.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-strong">
            {t("welcome")}
            {profile?.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            @{profile?.public_id ?? "—"}
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody className="space-y-2 py-5">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted">
              {t("profile")}
            </h2>
            <p className="text-sm text-text">
              {t("email")} : <span className="text-text-strong">{user!.email}</span>
            </p>
            <p className="text-sm text-text">
              {t("handle")} :{" "}
              <span className="font-mono text-text-strong">
                {profile?.public_id}
              </span>
            </p>
            {profile?.is_admin && (
              <span className="inline-block rounded bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                {tc("admin")}
              </span>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-2 py-5">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted">
              {t("preferences")}
            </h2>
            <p className="text-sm text-text">
              {t("language")} :{" "}
              <span className="text-text-strong">{prefs?.locale ?? "fr"}</span>
            </p>
            <p className="text-sm text-text">
              {t("currency")} :{" "}
              <span className="font-mono text-text-strong">
                {prefs?.currency ?? "XOF"}
              </span>
            </p>
            <p className="text-sm text-text">
              {t("tradingStyle")} :{" "}
              <span className="text-text-strong">
                {prefs?.trading_style ?? t("notSet")}
              </span>
            </p>
          </CardBody>
        </Card>
      </div>

      <p className="mt-8 text-center text-sm text-text-faint">
        {t("autoProvision")}
      </p>
    </div>
  );
}
