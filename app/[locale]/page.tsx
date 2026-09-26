import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("title"), description: t("description") };
}

// ── Icons ────────────────────────────────────────────────────────────────────

function IconSignal() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}
function IconJournal() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}
function IconPropFirm() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}
function IconCurrency() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-accent">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
    </svg>
  );
}

// ── Feature data ─────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: <IconSignal />, titleKey: "featureSignals", descKey: "featureSignalsDesc" },
  { icon: <IconJournal />, titleKey: "featureJournal", descKey: "featureJournalDesc" },
  { icon: <IconPropFirm />, titleKey: "featurePropFirm", descKey: "featurePropFirmDesc" },
  { icon: <IconCalendar />, titleKey: "featureCalendar", descKey: "featureCalendarDesc" },
  { icon: <IconAlert />, titleKey: "featureAlerts", descKey: "featureAlertsDesc" },
  { icon: <IconCurrency />, titleKey: "featureMultiCurrency", descKey: "featureMultiCurrencyDesc" },
] as const;

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tn = await getTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-surface-base text-text">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-line bg-surface-base/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="font-display text-lg font-bold text-text-strong">
            Profity
          </span>
          <nav className="hidden items-center gap-6 text-sm text-text-muted sm:flex">
            <a href="#features" className="transition-colors hover:text-text">{tn("features")}</a>
            <a href="#pricing" className="transition-colors hover:text-text">{tn("pricing")}</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-text-muted transition-colors hover:text-text">
              {tn("login")}
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-contrast transition-opacity hover:opacity-90"
            >
              {tn("signup")}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-4xl px-4 pb-24 pt-20 text-center">
        <span className="mb-6 inline-block rounded-full border border-accent-line bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
          {t("badge")}
        </span>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-text-strong sm:text-5xl md:text-6xl">
          {t("headline").split("\n").map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
          {t("subheadline")}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-contrast shadow-lg transition-opacity hover:opacity-90"
          >
            {t("cta")}
          </Link>
          <a
            href="#features"
            className="rounded-lg border border-line px-6 py-3 text-sm font-medium text-text transition-colors hover:bg-surface-raised"
          >
            {t("ctaSecondary")}
          </a>
        </div>
        <p className="mt-8 text-xs text-text-faint">{t("socialProof")}</p>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-t border-line bg-surface-raised px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center font-display text-3xl font-bold text-text-strong">
            {t("features")}
          </h2>
          <p className="mb-12 text-center text-text-muted">{t("featuresSubtitle")}</p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon, titleKey, descKey }) => (
              <div
                key={titleKey}
                className="rounded-xl border border-line bg-surface-base p-6 transition-colors hover:border-accent-line"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  {icon}
                </div>
                <h3 className="mb-2 font-display text-base font-semibold text-text-strong">
                  {t(titleKey)}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center font-display text-3xl font-bold text-text-strong">
            {t("tiers")}
          </h2>
          <p className="mb-12 text-center text-text-muted">{t("tiersSubtitle")}</p>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Free */}
            <div className="flex flex-col rounded-xl border border-line bg-surface-raised p-6">
              <div className="mb-1 text-sm font-medium text-tier-free">{t("tierFree")}</div>
              <div className="mb-6 mt-1 font-display text-3xl font-bold text-text-strong">
                {t("tierFreePrice")}<span className="ml-1 text-base font-normal text-text-muted">XOF</span>
              </div>
              <ul className="mb-8 flex-1 space-y-3 text-sm">
                {(["tierFreeFeature1","tierFreeFeature2","tierFreeFeature3","tierFreeFeature4"] as const).map((k) => (
                  <li key={k} className="flex items-start gap-2">
                    <CheckIcon />
                    <span className="text-text">{t(k)}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block rounded-lg border border-line py-2 text-center text-sm font-medium text-text transition-colors hover:bg-surface-overlay"
              >
                {t("tierCta")}
              </Link>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col rounded-xl border-2 border-accent bg-surface-raised p-6">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-contrast">
                {t("tierProBadge")}
              </span>
              <div className="mb-1 text-sm font-medium text-tier-pro">{t("tierPro")}</div>
              <div className="mb-6 mt-1 font-display text-3xl font-bold text-text-strong">
                {t("tierProPrice")}<span className="ml-1 text-base font-normal text-text-muted">{t("tierProCurrency")}</span>
              </div>
              <ul className="mb-8 flex-1 space-y-3 text-sm">
                {(["tierProFeature1","tierProFeature2","tierProFeature3","tierProFeature4"] as const).map((k) => (
                  <li key={k} className="flex items-start gap-2">
                    <CheckIcon />
                    <span className="text-text">{t(k)}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block rounded-lg bg-accent py-2 text-center text-sm font-semibold text-accent-contrast transition-opacity hover:opacity-90"
              >
                {t("tierCta")}
              </Link>
            </div>

            {/* Elite */}
            <div className="flex flex-col rounded-xl border border-line bg-surface-raised p-6">
              <div className="mb-1 text-sm font-medium text-tier-elite">{t("tierElite")}</div>
              <div className="mb-6 mt-1 font-display text-3xl font-bold text-text-strong">
                {t("tierElitePrice")}<span className="ml-1 text-base font-normal text-text-muted">{t("tierEliteCurrency")}</span>
              </div>
              <ul className="mb-8 flex-1 space-y-3 text-sm">
                {(["tierEliteFeature1","tierEliteFeature2","tierEliteFeature3","tierEliteFeature4"] as const).map((k) => (
                  <li key={k} className="flex items-start gap-2">
                    <CheckIcon />
                    <span className="text-text">{t(k)}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block rounded-lg border border-line py-2 text-center text-sm font-medium text-text transition-colors hover:bg-surface-overlay"
              >
                {t("tierCta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-line bg-surface-raised px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center font-display text-3xl font-bold text-text-strong">
            {t("faq")}
          </h2>
          <div className="space-y-6">
            {(
              [
                ["faq1Q", "faq1A"],
                ["faq2Q", "faq2A"],
                ["faq3Q", "faq3A"],
                ["faq4Q", "faq4A"],
              ] as const
            ).map(([q, a]) => (
              <div key={q} className="rounded-xl border border-line bg-surface-base p-6">
                <h3 className="mb-2 font-display text-base font-semibold text-text-strong">
                  {t(q)}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">{t(a)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-line px-4 py-8">
        <p className="text-center text-xs text-text-faint">
          {t("footer", { year })}
        </p>
      </footer>
    </div>
  );
}
