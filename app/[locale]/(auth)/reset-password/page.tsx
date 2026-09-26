"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { resetPassword } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";

const ERROR_KEYS: Record<string, string> = {
  newPasswordRequired: "errorNewPasswordRequired",
  minLength: "errorMinLength",
  mismatch: "errorMismatch",
};

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(resetPassword, {});
  const t = useTranslations("auth");

  const errorMsg = state.error
    ? t(ERROR_KEYS[state.error] ?? state.error)
    : null;

  return (
    <Card>
      <CardBody className="space-y-5 py-6">
        <h2 className="font-display text-lg font-semibold text-text-strong">
          {t("resetTitle")}
        </h2>

        <form action={action} className="space-y-4">
          <Input
            label={t("newPassword")}
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
            {pending ? t("resetLoading") : t("resetButton")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
