import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardBody } from "@/components/ui/card";

export default function VerifyPage() {
  const t = useTranslations("auth");

  return (
    <Card>
      <CardBody className="space-y-4 py-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
          <svg
            className="h-7 w-7 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
            />
          </svg>
        </div>

        <h2 className="font-display text-lg font-semibold text-text-strong">
          {t("verifyTitle")}
        </h2>
        <p className="text-sm text-text-muted">{t("verifyMessage")}</p>

        <Link
          href="/login"
          className="inline-block text-sm text-accent hover:underline"
        >
          {t("backToLogin")}
        </Link>
      </CardBody>
    </Card>
  );
}
