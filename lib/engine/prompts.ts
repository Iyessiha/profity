/* ============================================================================
   Prompt builder — converts MarketFeatures into a compact AI prompt
   ----------------------------------------------------------------------------
   Goal: ~150 input tokens for the user message, vs. ~2000+ for raw OHLCV.
   The system prompt is static and benefits from Anthropic prompt caching.
   ========================================================================== */

import type { MarketFeatures } from "./types";

// ── System prompts (cached — charge once per cache lifetime) ─────────────────

export const SYSTEM_FREE = `You are a Smart Money Concepts (SMC) trading signal engine.
Given pre-computed market features, output ONE trading signal in the exact JSON schema provided.

RULES:
- Direction is LONG, SHORT, or NEUTRAL (when confluence is too weak)
- Order type: BUY_LIMIT/SELL_LIMIT (zone retest), BUY_STOP/SELL_STOP (breakout), MARKET_BUY/MARKET_SELL (strong momentum), WAIT (NEUTRAL)
- entry and stop_loss must be on opposite sides of a key SMC level
- take_profits: array of 1–3 targets, nearest first
- Stop must be beyond the invalidation level (OB low for LONG, OB high for SHORT)
- conclusion: 1 sentence, max 120 chars
- Output ONLY the JSON object matching the tool schema. No prose.`;

export const SYSTEM_PRO = `${SYSTEM_FREE}

ADDITIONAL FIELDS (required for Pro tier):
- confidence: HIGH (3+ confluences, clear structure), MEDIUM (2 confluences), LOW (1 or uncertain)
- trend, phase: from features
- confluences: list the SMC concepts aligning (e.g. ["OB retest","FVG fill","Discount zone","BOS confirmed"])
- reasoning: 2–3 sentences explaining the SMC narrative behind the trade`;

export const SYSTEM_ELITE = `${SYSTEM_PRO}

ADDITIONAL FIELDS (required for Elite tier):
- order_block: the OB being traded {high, low, bias} or null
- fair_value_gap: relevant FVG {high, low, bias} or null
- bos_level: most recent BOS price or null
- choch_level: CHoCH price if present or null
- liquidity_above: buy-side pool or null
- liquidity_below: sell-side pool or null`;

// ── User message (compact) ───────────────────────────────────────────────────

function fmt(n: number, decimals = 5): string {
  return n.toFixed(decimals).replace(/\.?0+$/, "");
}

function fmtZone(z: { high: number; low: number; bias: string; ageCandles: number }): string {
  return `${z.bias[0].toUpperCase()}OB:${fmt(z.low)}-${fmt(z.high)}(${z.ageCandles}c)`;
}

function fmtFVG(z: { high: number; low: number; bias: string; ageCandles: number }): string {
  return `${z.bias[0].toUpperCase()}FVG:${fmt(z.low)}-${fmt(z.high)}(${z.ageCandles}c)`;
}

export function buildUserMessage(f: MarketFeatures): string {
  const lines: string[] = [
    `${f.symbol} ${f.timeframe} | P:${fmt(f.currentPrice)} ATR:${fmt(f.atr, 4)}`,
    `Trend:${f.trend} Phase:${f.phase} SwH:${fmt(f.swingHigh)} SwL:${fmt(f.swingLow)}`,
  ];

  if (f.orderBlocks.length > 0) {
    lines.push(`OBs: ${f.orderBlocks.map(fmtZone).join(" ")}`);
  }
  if (f.fairValueGaps.length > 0) {
    lines.push(`FVGs: ${f.fairValueGaps.map(fmtFVG).join(" ")}`);
  }

  const struct: string[] = [];
  if (f.bosLevel) struct.push(`BOS:${fmt(f.bosLevel)}`);
  if (f.chochLevel) struct.push(`CHoCH:${fmt(f.chochLevel)}`);
  if (f.liquidityAbove) struct.push(`Liq↑:${fmt(f.liquidityAbove)}`);
  if (f.liquidityBelow) struct.push(`Liq↓:${fmt(f.liquidityBelow)}`);
  if (struct.length > 0) lines.push(struct.join(" "));

  lines.push(`Candles(5): ${f.recentBiases.join(",")}`);
  lines.push("Generate signal.");

  return lines.join("\n");
}
