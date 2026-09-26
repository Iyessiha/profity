/* ============================================================================
   Anthropic tool schemas — structured output per tier
   ----------------------------------------------------------------------------
   Using tool_use forces JSON output with zero prose overhead.
   Each tier schema only requests the fields it needs → fewer output tokens.
   ========================================================================== */

import type Anthropic from "@anthropic-ai/sdk";

const levelFields = {
  direction: {
    type: "string" as const,
    enum: ["LONG", "SHORT", "NEUTRAL"],
    description: "Trade direction",
  },
  order_type: {
    type: "string" as const,
    enum: [
      "BUY_LIMIT",
      "SELL_LIMIT",
      "BUY_STOP",
      "SELL_STOP",
      "MARKET_BUY",
      "MARKET_SELL",
      "WAIT",
    ],
  },
  entry: { type: "number" as const },
  stop_loss: { type: "number" as const },
  take_profits: {
    type: "array" as const,
    items: { type: "number" as const },
    minItems: 1,
    maxItems: 3,
  },
  conclusion: {
    type: "string" as const,
    maxLength: 120,
  },
};

const reasoningFields = {
  confidence: {
    type: "string" as const,
    enum: ["HIGH", "MEDIUM", "LOW"],
  },
  trend: {
    type: "string" as const,
    enum: ["BULLISH", "BEARISH", "RANGING"],
  },
  phase: { type: "string" as const },
  confluences: {
    type: "array" as const,
    items: { type: "string" as const },
  },
  reasoning: { type: "string" as const, maxLength: 400 },
};

const structureFields = {
  order_block: {
    type: ["object", "null"] as unknown as "object",
    properties: {
      high: { type: "number" as const },
      low: { type: "number" as const },
      bias: { type: "string" as const },
    },
  },
  fair_value_gap: {
    type: ["object", "null"] as unknown as "object",
    properties: {
      high: { type: "number" as const },
      low: { type: "number" as const },
      bias: { type: "string" as const },
    },
  },
  bos_level: { type: ["number", "null"] as unknown as "number" },
  choch_level: { type: ["number", "null"] as unknown as "number" },
  liquidity_above: { type: ["number", "null"] as unknown as "number" },
  liquidity_below: { type: ["number", "null"] as unknown as "number" },
};

function makeTool(
  properties: Record<string, unknown>,
  required: string[],
): Anthropic.Tool {
  return {
    name: "emit_signal",
    description: "Emit a structured SMC trading signal",
    input_schema: {
      type: "object",
      properties,
      required,
    },
  };
}

export const TOOL_FREE = makeTool(
  { ...levelFields },
  ["direction", "order_type", "entry", "stop_loss", "take_profits", "conclusion"],
);

export const TOOL_PRO = makeTool(
  { ...levelFields, ...reasoningFields },
  [
    "direction",
    "order_type",
    "entry",
    "stop_loss",
    "take_profits",
    "conclusion",
    "confidence",
    "trend",
    "phase",
    "confluences",
    "reasoning",
  ],
);

export const TOOL_ELITE = makeTool(
  { ...levelFields, ...reasoningFields, ...structureFields },
  [
    "direction",
    "order_type",
    "entry",
    "stop_loss",
    "take_profits",
    "conclusion",
    "confidence",
    "trend",
    "phase",
    "confluences",
    "reasoning",
    "order_block",
    "fair_value_gap",
    "bos_level",
    "choch_level",
    "liquidity_above",
    "liquidity_below",
  ],
);

export function toolForTier(tier: "free" | "pro" | "elite") {
  if (tier === "elite") return TOOL_ELITE;
  if (tier === "pro") return TOOL_PRO;
  return TOOL_FREE;
}
