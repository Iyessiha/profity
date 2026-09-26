/* ============================================================================
   SMC Pre-processor — pure TypeScript, zero API tokens
   ----------------------------------------------------------------------------
   Converts raw OHLCV candles into structured SMC features before sending
   anything to the AI. The LLM only reasons; it does not calculate.
   ========================================================================== */

import type { OHLCV, MarketFeatures, PriceZoneFeature } from "./types";

// ── ATR ─────────────────────────────────────────────────────────────────────

function atr(candles: OHLCV[], period = 14): number {
  if (candles.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];
    trs.push(
      Math.max(
        c.h - c.l,
        Math.abs(c.h - prev.c),
        Math.abs(c.l - prev.c),
      ),
    );
  }
  const slice = trs.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

// ── Swing detection ──────────────────────────────────────────────────────────
// A swing high: candle whose high is the highest in a window of [left, right].
// A swing low: candle whose low is the lowest in the same window.

interface Swing {
  index: number;
  price: number;
  kind: "high" | "low";
}

function detectSwings(candles: OHLCV[], lookback = 3): Swing[] {
  const swings: Swing[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const hi = candles[i].h;
    const lo = candles[i].l;
    let isSwingH = true;
    let isSwingL = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if (candles[j].h >= hi) isSwingH = false;
      if (candles[j].l <= lo) isSwingL = false;
    }
    if (isSwingH) swings.push({ index: i, price: hi, kind: "high" });
    if (isSwingL) swings.push({ index: i, price: lo, kind: "low" });
  }
  return swings;
}

// ── Trend via swing sequence ─────────────────────────────────────────────────

function classifyTrend(
  swings: Swing[],
): "BULLISH" | "BEARISH" | "RANGING" {
  const highs = swings.filter((s) => s.kind === "high").slice(-3);
  const lows = swings.filter((s) => s.kind === "low").slice(-3);
  if (highs.length < 2 || lows.length < 2) return "RANGING";

  const hhCount = highs
    .slice(1)
    .filter((h, i) => h.price > highs[i].price).length;
  const hlCount = lows
    .slice(1)
    .filter((l, i) => l.price > lows[i].price).length;
  const llCount = lows
    .slice(1)
    .filter((l, i) => l.price < lows[i].price).length;
  const lhCount = highs
    .slice(1)
    .filter((h, i) => h.price < highs[i].price).length;

  if (hhCount > 0 && hlCount > 0) return "BULLISH";
  if (llCount > 0 && lhCount > 0) return "BEARISH";
  return "RANGING";
}

// ── Market phase ─────────────────────────────────────────────────────────────

function classifyPhase(
  trend: "BULLISH" | "BEARISH" | "RANGING",
  swings: Swing[],
  candles: OHLCV[],
): MarketFeatures["phase"] {
  if (trend === "RANGING") return "ranging";

  // Volume proxy: compare recent average to older average.
  const len = candles.length;
  const recentVol =
    candles
      .slice(-10)
      .reduce((a, c) => a + c.v, 0) / 10;
  const olderVol =
    candles
      .slice(Math.max(0, len - 30), len - 10)
      .reduce((a, c) => a + c.v, 0) / 20;

  if (trend === "BULLISH") {
    return recentVol > olderVol * 1.2 ? "markup" : "accumulation";
  }
  return recentVol > olderVol * 1.2 ? "markdown" : "distribution";
}

// ── Break of Structure / Change of Character ─────────────────────────────────

interface StructureBreak {
  level: number;
  kind: "bos" | "choch";
}

function detectStructureBreaks(
  candles: OHLCV[],
  swings: Swing[],
  trend: "BULLISH" | "BEARISH" | "RANGING",
): { bos: number | null; choch: number | null } {
  const last = candles[candles.length - 1];
  const prevHighSwings = swings
    .filter((s) => s.kind === "high")
    .slice(-3)
    .reverse();
  const prevLowSwings = swings
    .filter((s) => s.kind === "low")
    .slice(-3)
    .reverse();

  let bos: number | null = null;
  let choch: number | null = null;

  if (trend === "BULLISH") {
    // BOS: price closes above a previous swing high (continuation)
    const broke = prevHighSwings.find((s) => last.c > s.price);
    if (broke) bos = broke.price;
    // CHoCH: price closes below a previous swing low (reversal warning)
    const changed = prevLowSwings.find((s) => last.c < s.price);
    if (changed) choch = changed.price;
  } else if (trend === "BEARISH") {
    const broke = prevLowSwings.find((s) => last.c < s.price);
    if (broke) bos = broke.price;
    const changed = prevHighSwings.find((s) => last.c > s.price);
    if (changed) choch = changed.price;
  } else {
    // Ranging: look for any recent break in either direction
    const recentSwings = swings.slice(-6);
    for (const s of recentSwings.reverse()) {
      if (s.kind === "high" && last.c > s.price) {
        choch = s.price;
        break;
      }
      if (s.kind === "low" && last.c < s.price) {
        choch = s.price;
        break;
      }
    }
  }

  return { bos, choch };
}

// ── Order Blocks ─────────────────────────────────────────────────────────────
// Bullish OB: last bearish candle before a strong bullish impulsive move up.
// Bearish OB: last bullish candle before a strong bearish impulsive move down.

function detectOrderBlocks(
  candles: OHLCV[],
  trend: "BULLISH" | "BEARISH" | "RANGING",
): PriceZoneFeature[] {
  const result: PriceZoneFeature[] = [];
  const n = candles.length;
  // Scan last 40 candles for OB patterns
  for (let i = Math.max(1, n - 40); i < n - 3; i++) {
    const c = candles[i];
    const bodySize = Math.abs(c.c - c.o);
    const nextThree = candles.slice(i + 1, i + 4);
    const nextMove = nextThree[nextThree.length - 1].c - c.c;

    // Bullish OB: bearish candle followed by strong upward move
    if (
      c.c < c.o && // bearish candle
      nextMove > bodySize * 1.5 && // strong move up
      (trend === "BULLISH" || trend === "RANGING")
    ) {
      result.push({
        high: c.h,
        low: c.l,
        bias: "bullish",
        ageCandles: n - 1 - i,
      });
    }

    // Bearish OB: bullish candle followed by strong downward move
    if (
      c.c > c.o && // bullish candle
      nextMove < -bodySize * 1.5 && // strong move down
      (trend === "BEARISH" || trend === "RANGING")
    ) {
      result.push({
        high: c.h,
        low: c.l,
        bias: "bearish",
        ageCandles: n - 1 - i,
      });
    }
  }

  // Return at most 3, closest to current price first
  const current = candles[n - 1].c;
  return result
    .sort((a, b) => {
      const aMid = (a.high + a.low) / 2;
      const bMid = (b.high + b.low) / 2;
      return Math.abs(aMid - current) - Math.abs(bMid - current);
    })
    .slice(0, 3);
}

// ── Fair Value Gaps ──────────────────────────────────────────────────────────
// 3-candle pattern: candle[i-1].high < candle[i+1].low (bullish FVG)
//                  candle[i-1].low  > candle[i+1].high (bearish FVG)

function detectFVGs(
  candles: OHLCV[],
  trend: "BULLISH" | "BEARISH" | "RANGING",
): PriceZoneFeature[] {
  const result: PriceZoneFeature[] = [];
  const n = candles.length;

  for (let i = 1; i < n - 1; i++) {
    const prev = candles[i - 1];
    const next = candles[i + 1];
    const ageCandles = n - 1 - i;

    if (prev.h < next.l && (trend === "BULLISH" || trend === "RANGING")) {
      result.push({
        low: prev.h,
        high: next.l,
        bias: "bullish",
        ageCandles,
      });
    }
    if (prev.l > next.h && (trend === "BEARISH" || trend === "RANGING")) {
      result.push({
        low: next.h,
        high: prev.l,
        bias: "bearish",
        ageCandles,
      });
    }
  }

  const current = candles[n - 1].c;
  return result
    .sort((a, b) => {
      const aMid = (a.high + a.low) / 2;
      const bMid = (b.high + b.low) / 2;
      return Math.abs(aMid - current) - Math.abs(bMid - current);
    })
    .slice(0, 3);
}

// ── Liquidity pools ──────────────────────────────────────────────────────────
// Equal highs (buy-side liquidity) and equal lows (sell-side liquidity).
// "Equal" = within 0.1% of each other.

function detectLiquidity(
  candles: OHLCV[],
  current: number,
): { above: number | null; below: number | null } {
  const recent = candles.slice(-30);
  const highs = recent.map((c) => c.h);
  const lows = recent.map((c) => c.l);
  const tol = current * 0.001;

  let above: number | null = null;
  let below: number | null = null;

  // Find the most prominent cluster of equal highs above price
  for (let i = 0; i < highs.length - 1; i++) {
    const matches = highs.filter(
      (h, j) => j !== i && Math.abs(h - highs[i]) < tol,
    );
    if (matches.length >= 2 && highs[i] > current) {
      if (above === null || highs[i] < above) {
        above = highs[i];
      }
    }
  }

  for (let i = 0; i < lows.length - 1; i++) {
    const matches = lows.filter(
      (l, j) => j !== i && Math.abs(l - lows[i]) < tol,
    );
    if (matches.length >= 2 && lows[i] < current) {
      if (below === null || lows[i] > below) {
        below = lows[i];
      }
    }
  }

  return { above, below };
}

// ── Recent candle biases ─────────────────────────────────────────────────────

function recentBiases(
  candles: OHLCV[],
  count = 5,
): Array<"bull" | "bear" | "doji"> {
  return candles.slice(-count).map((c) => {
    const body = Math.abs(c.c - c.o);
    const range = c.h - c.l;
    if (range === 0) return "doji";
    if (body / range < 0.15) return "doji";
    return c.c > c.o ? "bull" : "bear";
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function preprocess(
  symbol: string,
  timeframe: string,
  candles: OHLCV[],
): MarketFeatures {
  if (candles.length < 20) {
    throw new Error(`Need at least 20 candles, got ${candles.length}`);
  }

  const swings = detectSwings(candles);
  const trend = classifyTrend(swings);
  const phase = classifyPhase(trend, swings, candles);
  const { bos, choch } = detectStructureBreaks(candles, swings, trend);
  const orderBlocks = detectOrderBlocks(candles, trend);
  const fairValueGaps = detectFVGs(candles, trend);
  const current = candles[candles.length - 1].c;
  const { above, below } = detectLiquidity(candles, current);

  const highSwings = swings.filter((s) => s.kind === "high");
  const lowSwings = swings.filter((s) => s.kind === "low");
  const swingHigh =
    highSwings.length > 0
      ? Math.max(...highSwings.slice(-5).map((s) => s.price))
      : candles[candles.length - 1].h;
  const swingLow =
    lowSwings.length > 0
      ? Math.min(...lowSwings.slice(-5).map((s) => s.price))
      : candles[candles.length - 1].l;

  return {
    symbol,
    timeframe,
    currentPrice: current,
    trend,
    phase,
    swingHigh,
    swingLow,
    orderBlocks,
    fairValueGaps,
    bosLevel: bos,
    chochLevel: choch,
    liquidityAbove: above,
    liquidityBelow: below,
    atr: atr(candles),
    recentBiases: recentBiases(candles),
  };
}
