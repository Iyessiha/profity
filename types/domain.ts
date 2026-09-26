/* ============================================================================
   Profity — domain model
   ----------------------------------------------------------------------------
   Vocabulary shared by the database, the API boundary and the UI. Runtime
   validation of anything crossing that boundary lives in lib/schemas.ts; these
   types are the compile-time half of the same contract.
   ========================================================================== */

export type Locale = "fr" | "en" | "ar" | "pt";

export type Currency = "XOF" | "XAF" | "USD" | "EUR" | "GHS" | "NGN" | "MAD";

export type Tier = "free" | "pro" | "elite";

/* ── Market direction ─────────────────────────────────────────────────────
   NEUTRAL is a real answer, not a missing one: the engine returns it when
   confluence is too weak to justify a position. */
export type Direction = "LONG" | "SHORT" | "NEUTRAL";

export type OrderType =
  | "BUY_LIMIT"
  | "SELL_LIMIT"
  | "BUY_STOP"
  | "SELL_STOP"
  | "MARKET_BUY"
  | "MARKET_SELL"
  | "WAIT";

export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export type MarketPhase =
  | "accumulation"
  | "distribution"
  | "markup"
  | "markdown"
  | "ranging";

export type Trend = "BULLISH" | "BEARISH" | "RANGING";

/** How a signal actually resolved. `pending` until the market decides. */
export type TradeOutcome =
  | "pending"
  | "tp1"
  | "tp2"
  | "tp3"
  | "stopped"
  | "breakeven"
  | "cancelled";

/* ── Smart Money structures ─────────────────────────────────────────────── */

/** A price band: order block, fair value gap, or a liquidity pool. */
export interface PriceZone {
  high: number;
  low: number;
  bias: "bullish" | "bearish";
  label: string;
}

export type AnnotationKind =
  | "order_block"
  | "fair_value_gap"
  | "break_of_structure"
  | "change_of_character"
  | "entry"
  | "stop_loss"
  | "take_profit"
  | "liquidity"
  | "premium"
  | "discount";

export interface ChartAnnotation {
  kind: AnnotationKind;
  bias: "bullish" | "bearish" | "neutral";
  price: number;
  /** Set when the annotation covers a band rather than a single level. */
  priceEnd?: number;
  label: string;
}

/* ── Signal ───────────────────────────────────────────────────────────────
   Tiers gate depth, never correctness: a free signal is complete and tradable,
   it simply carries less reasoning. Fields a free user cannot see are
   optional here and omitted server-side before the payload is sent. */

export interface SignalLevels {
  entry: number;
  stopLoss: number;
  takeProfit: [number, ...number[]];
  /** Reward-to-risk against the first take-profit. */
  rewardToRisk: number;
}

export interface Signal {
  id: string;
  symbol: string;
  timeframe: string;
  direction: Direction;
  orderType: OrderType;
  levels: SignalLevels;
  conclusion: string;
  outcome: TradeOutcome;
  createdAt: string;

  /* pro and above */
  confidence?: Confidence;
  trend?: Trend;
  phase?: MarketPhase;
  confluences?: string[];
  reasoning?: string;

  /* elite */
  orderBlock?: PriceZone;
  fairValueGap?: PriceZone;
  breakOfStructure?: number;
  changeOfCharacter?: number;
  liquidityAbove?: number;
  liquidityBelow?: number;
  annotations?: ChartAnnotation[];
}

/* ── Economic calendar ────────────────────────────────────────────────────
   Impact drives whether we notify at all, so it is a closed set. */

export type EventImpact = "high" | "medium" | "low" | "holiday";

export interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  scheduledAt: string;
  impact: EventImpact;
  forecast: string | null;
  previous: string | null;
  actual: string | null;
}

/* ── Journal ─────────────────────────────────────────────────────────────── */

export interface JournalEntry {
  id: string;
  symbol: string;
  direction: Direction;
  entry: number;
  exit: number | null;
  stopLoss: number | null;
  size: number;
  /** Realised result in the account currency; null while still open. */
  profitLoss: number | null;
  openedAt: string;
  closedAt: string | null;
  /** The trader's own reasoning — the part that makes a journal useful. */
  notes: string | null;
  tags: string[];
  signalId: string | null;
}

/* ── Prop firm challenge ──────────────────────────────────────────────────
   Breach rules are the whole product here: a challenge is lost on a limit,
   not on a bad day, so both limits are tracked as consumed-versus-allowed. */

export interface ChallengeLimits {
  accountSize: number;
  currency: Currency;
  /** Absolute amount allowed to be lost in one trading day. */
  dailyLossLimit: number;
  dailyLossUsed: number;
  /** Absolute amount allowed to be lost overall. */
  maxDrawdown: number;
  currentDrawdown: number;
  profitTarget: number;
  profitReached: number;
}

export type ChallengeStatus = "active" | "passed" | "breached" | "abandoned";

export interface Challenge {
  id: string;
  firmName: string;
  phase: string;
  status: ChallengeStatus;
  limits: ChallengeLimits;
  startedAt: string;
  endsAt: string | null;
}

/* ── Account ─────────────────────────────────────────────────────────────── */

export interface UserProfile {
  id: string;
  publicId: string;
  email: string;
  displayName: string | null;
  locale: Locale;
  currency: Currency;
  tier: Tier;
  isAdmin: boolean;
  suspended: boolean;
  createdAt: string;
}

export interface UsageQuota {
  used: number;
  allowance: number;
  resetsAt: string;
}

export interface TradingStats {
  rated: number;
  wins: number;
  losses: number;
  /** Share of rated signals that reached a take-profit, as a percentage. */
  winRate: number;
}

/* ── API boundary ─────────────────────────────────────────────────────────
   Every route answers in this shape so the client has one thing to branch on
   and errors always carry a code the UI can translate. */

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
