/* ============================================================================
   Profity Analysis Engine — shared types
   ========================================================================== */

export interface OHLCV {
  t: number; // Unix timestamp (seconds)
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface PriceZoneFeature {
  high: number;
  low: number;
  bias: "bullish" | "bearish";
  /** How many candles ago this zone formed. */
  ageCandles: number;
}

/**
 * Pre-computed SMC features fed to the AI.
 * All expensive work happens here in TypeScript — the AI only reasons.
 */
export interface MarketFeatures {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  trend: "BULLISH" | "BEARISH" | "RANGING";
  phase: "accumulation" | "distribution" | "markup" | "markdown" | "ranging";
  swingHigh: number;
  swingLow: number;
  /** Up to 3 most recent, closest to current price first. */
  orderBlocks: PriceZoneFeature[];
  fairValueGaps: PriceZoneFeature[];
  /** Last confirmed Break of Structure price, null if none. */
  bosLevel: number | null;
  /** Last Change of Character price, null if none. */
  chochLevel: number | null;
  /** Buy-side liquidity: equal highs or swing-high cluster above price. */
  liquidityAbove: number | null;
  /** Sell-side liquidity: equal lows or swing-low cluster below price. */
  liquidityBelow: number | null;
  /** 14-period ATR — used to sanity-check AI-proposed SL distances. */
  atr: number;
  /** Last 5 candle directions, oldest→newest. */
  recentBiases: Array<"bull" | "bear" | "doji">;
}

export interface AnalysisRequest {
  symbol: string;
  timeframe: string;
  candles: OHLCV[];
  /** Tier determines prompt depth and model selection. */
  tier: "free" | "pro" | "elite";
  userId: string;
}

/** Raw output from the AI, before mapping to the DB schema. */
export interface RawSignal {
  direction: "LONG" | "SHORT" | "NEUTRAL";
  order_type:
    | "BUY_LIMIT"
    | "SELL_LIMIT"
    | "BUY_STOP"
    | "SELL_STOP"
    | "MARKET_BUY"
    | "MARKET_SELL"
    | "WAIT";
  entry: number;
  stop_loss: number;
  take_profits: number[];
  conclusion: string;
  // Pro+
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  trend?: "BULLISH" | "BEARISH" | "RANGING";
  phase?: string;
  confluences?: string[];
  reasoning?: string;
  // Elite
  order_block?: { high: number; low: number; bias: string } | null;
  fair_value_gap?: { high: number; low: number; bias: string } | null;
  bos_level?: number | null;
  choch_level?: number | null;
  liquidity_above?: number | null;
  liquidity_below?: number | null;
}

export interface EngineResult {
  signalId: string;
  signal: RawSignal;
  inputTokens: number;
  outputTokens: number;
  /** Micro-dollars (millionths of a cent). */
  costMicros: number;
  model: string;
}
