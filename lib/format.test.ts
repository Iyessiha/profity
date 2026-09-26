import { describe, expect, it } from "vitest";
import {
  formatMoney,
  formatPrice,
  formatRatio,
  formatSigned,
  pricePrecision,
} from "./format";

/** Intl groups with narrow no-break spaces; compare on the digits, not them. */
const flat = (s: string) => s.replace(/[\s  ]/g, " ").trim();

describe("pricePrecision", () => {
  it("quotes gold to the cent", () => {
    expect(pricePrecision("XAUUSD")).toBe(2);
  });

  it("quotes yen pairs to three decimals", () => {
    expect(pricePrecision("USDJPY")).toBe(3);
    expect(pricePrecision("EURJPY")).toBe(3);
  });

  it("quotes other currency pairs to five decimals", () => {
    expect(pricePrecision("EURUSD")).toBe(5);
  });

  it("quotes indices to one decimal", () => {
    expect(pricePrecision("US30")).toBe(1);
  });

  it("ignores case", () => {
    expect(pricePrecision("xauusd")).toBe(2);
  });
});

describe("formatPrice", () => {
  it("pads to the instrument's precision so columns align", () => {
    expect(flat(formatPrice(2418.6, "XAUUSD"))).toBe("2 418,60");
    expect(flat(formatPrice(1.1, "EURUSD"))).toBe("1,10000");
  });
});

describe("formatMoney", () => {
  it("writes CFA francs without a minor unit", () => {
    const out = flat(formatMoney(9000, "XOF"));
    expect(out).toContain("9 000");
    expect(out).not.toContain(",00");
  });

  it("keeps cents on currencies that have them", () => {
    expect(flat(formatMoney(14.35, "USD"))).toContain("14,35");
  });
});

describe("formatRatio", () => {
  it("reads as a ratio against one unit of risk", () => {
    expect(flat(formatRatio(2.8))).toBe("1 : 2,8");
  });

  it("always shows one decimal", () => {
    expect(flat(formatRatio(3))).toBe("1 : 3,0");
  });
});

describe("formatSigned", () => {
  it("marks a gain with a plus", () => {
    expect(formatSigned(12000, "XOF").startsWith("+")).toBe(true);
  });

  it("marks a loss with a true minus sign", () => {
    expect(formatSigned(-12000, "XOF").startsWith("−")).toBe(true);
  });

  it("leaves a flat result unsigned", () => {
    const out = formatSigned(0, "XOF");
    expect(out.startsWith("+")).toBe(false);
    expect(out.startsWith("−")).toBe(false);
  });
});
