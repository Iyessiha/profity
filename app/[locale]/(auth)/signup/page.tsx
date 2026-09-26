"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signup } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";

const ERROR_KEYS: Record<string, string> = {
  required: "errorRequired",
  minLength: "errorMinLength",
  mismatch: "errorMismatch",
  exists: "errorExists",
};

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, {});
  const t = useTranslations("auth");

  const errorMsg = state.error
    ? t(ERROR_KEYS[state.error] ?? state.error)
    : null;

  return (
    <>
      <Card>
        <CardBody className="space-y-5 py-6">
          <h2 className="font-display text-lg font-semibold text-text-strong">
            {t("signupTitle")}
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
              autoComplete="new-password"
              required
              placeholder={t("passwordMinLength")}
              minLength={8}
            />
            <Input
              label={t("confirmPassword")}
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              placeholder={t("passwordPlaceholder")}
            />

            {errorMsg && (
              <p className="text-sm text-short" role="alert">
                {errorMsg}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? t("signupLoading") : t("signupButton")}
            </Button>
          </form>
        </CardBody>
      </Card>

      <p className="text-center text-sm text-text-muted">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </>
  );
}
