import type { Currency, Locale } from "@/types/domain";

/** Currencies with no minor unit — writing "1 000,00 XOF" is wrong. */
const ZERO_DECIMAL: ReadonlySet<Currency> = new Set(["XOF", "XAF"]);

const LOCALE_TAG: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-MA",
  pt: "pt-PT",
};

/**
 * Decimal places a quoted price carries, by instrument family. Gold trades to
 * the cent, JPY pairs to three decimals, other FX pairs to five.
 */
export function pricePrecision(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s.includes("JPY")) return 3;
  if (s.startsWith("XAU") || s.startsWith("XAG")) return 2;
  if (s.startsWith("BTC") || s.startsWith("ETH")) return 2;
  if (/^(US30|NAS100|SPX500|GER40|UK100)/.test(s)) return 1;
  return 5;
}

export function formatPrice(
  value: number,
  symbol: string,
  locale: Locale = "fr",
): string {
  const digits = pricePrecision(symbol);
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatMoney(
  value: number,
  currency: Currency,
  locale: Locale = "fr",
): string {
  const digits = ZERO_DECIMAL.has(currency) ? 0 : 2;
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(
  value: number,
  locale: Locale = "fr",
  digits = 1,
): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
    .concat(" %");
}

/** A reward-to-risk ratio reads as "1 : 2,8", never as "2.8x". */
export function formatRatio(value: number, locale: Locale = "fr"): string {
  const n = new Intl.NumberFormat(LOCALE_TAG[locale], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
  return `1 : ${n}`;
}

/** Signed value with an explicit plus, for P&L where direction is the point. */
export function formatSigned(
  value: number,
  currency: Currency,
  locale: Locale = "fr",
): string {
  const body = formatMoney(Math.abs(value), currency, locale);
  if (value > 0) return `+${body}`;
  if (value < 0) return `−${body}`;
  return body;
}
