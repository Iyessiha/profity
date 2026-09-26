"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { forgotPassword } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";

const ERROR_KEYS: Record<string, string> = {
  emailRequired: "errorEmailRequired",
};

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPassword, {
    error: undefined,
    sent: false,
  });
  const t = useTranslations("auth");

  const sent = !state.error && state.sent;
  const errorMsg = state.error
    ? t(ERROR_KEYS[state.error] ?? state.error)
    : null;

  return (
    <>
      <Card>
        <CardBody className="space-y-5 py-6">
          <h2 className="font-display text-lg font-semibold text-text-strong">
            {t("forgotTitle")}
          </h2>

          {sent ? (
            <p className="text-sm text-long">{t("forgotSuccess")}</p>
          ) : (
            <form action={action} className="space-y-4">
              <Input
                label={t("email")}
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder={t("emailPlaceholder")}
              />

              {errorMsg && (
                <p className="text-sm text-short" role="alert">
                  {errorMsg}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? t("forgotLoading") : t("forgotButton")}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>

      <p className="text-center text-sm text-text-muted">
        <Link href="/login" className="text-accent hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </>
  );
}
