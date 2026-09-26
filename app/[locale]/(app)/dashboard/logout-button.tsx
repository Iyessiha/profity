"use client";

import { useTranslations } from "next-intl";
import { logout } from "@/app/[locale]/(auth)/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const t = useTranslations("nav");

  return (
    <form action={logout}>
      <Button variant="ghost" size="sm" type="submit">
        {t("logout")}
      </Button>
    </form>
  );
}
