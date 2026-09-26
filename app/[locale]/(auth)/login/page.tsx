"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { login } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";

const ERROR_KEYS: Record<string, string> = {
  required: "errorRequired",
  invalid: "errorInvalid",
  notConfirmed: "errorNotConfirmed",
};

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {});
  const t = useTranslations("auth");

  const errorMsg = state.error
    ? t(ERROR_KEYS[state.error] ?? state.error)
    : null;

  return (
    <>
      <Card>
        <CardBody className="space-y-5 py-6">
          <h2 className="font-display text-lg font-semibold text-text-strong">
            {t("loginTitle")}
          </h2>

          <form action={action} className="space-y-4">
            <Input
              label={t("email")}
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t("emailPlaceholder")}
            />
            <Input
              label={t("password")}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder={t("passwordPlaceholder")}
            />

            {errorMsg && (
              <p className="text-sm text-short" role="alert">
                {errorMsg}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? t("loginLoading") : t("loginButton")}
            </Button>
          </form>

          <div className="text-center text-sm text-text-muted">
            <Link href="/forgot-password" className="text-accent hover:underline">
              {t("forgotPassword")}
            </Link>
          </div>
        </CardBody>
      </Card>

      <p className="text-center text-sm text-text-muted">
        {t("noAccount")}{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          {t("createAccount")}
        </Link>
      </p>
    </>
  );
}
