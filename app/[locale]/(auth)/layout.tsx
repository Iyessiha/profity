import type { Metadata } from "next";
import { useTranslations } from "next-intl";

export const metadata: Metadata = {
  robots: "noindex",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-strong">
            {t("profity")}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{t("tagline")}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
