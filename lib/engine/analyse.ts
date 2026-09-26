/* ============================================================================
   Profity Analysis Engine — orchestrator
   ----------------------------------------------------------------------------
   Flow:
     1. Preprocess OHLCV → compact MarketFeatures (pure TS, no tokens)
     2. Pick model and system prompt by tier
     3. Call Claude with tool_use (structured output, no prose)
     4. Record usage to analysis_usage table
     5. Insert signal to signals table
     6. Return EngineResult
   ============================================================================ */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { preprocess } from "./preprocess";
import {
  buildUserMessage,
  SYSTEM_FREE,
  SYSTEM_PRO,
  SYSTEM_ELITE,
} from "./prompts";
import { toolForTier } from "./tools";
import type { AnalysisRequest, EngineResult, RawSignal } from "./types";

// ── Model selection ──────────────────────────────────────────────────────────
// Haiku for free/pro (cheap, fast, good enough for levels + reasoning).
// Sonnet for elite (better structure identification and narrative).

const MODEL_FREE = "claude-haiku-4-5-20251001";
const MODEL_PRO = "claude-haiku-4-5-20251001";
const MODEL_ELITE = "claude-sonnet-5";

// ── Pricing (micro-dollars per token) ────────────────────────────────────────
// These match the official per-token rates; adjust if pricing changes.
const COST_TABLE: Record<
  string,
  { inputMicros: number; outputMicros: number }
> = {
  "claude-haiku-4-5-20251001": { inputMicros: 0.8, outputMicros: 4 },  // $0.80/$4 per 1M tokens
  "claude-sonnet-5":           { inputMicros: 3,   outputMicros: 15 }, // $3/$15 per 1M tokens
};

function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const rates = COST_TABLE[model] ?? { inputMicros: 3, outputMicros: 15 };
  // Cost in micro-dollars: tokens * (rate per million) / 1_000_000 * 1_000_000 = tokens * rate
  return Math.round(
    inputTokens * rates.inputMicros + outputTokens * rates.outputMicros,
  );
}

// ── Tier configuration ────────────────────────────────────────────────────────

function configForTier(tier: "free" | "pro" | "elite") {
  if (tier === "elite")
    return { model: MODEL_ELITE, system: SYSTEM_ELITE };
  if (tier === "pro")
    return { model: MODEL_PRO, system: SYSTEM_PRO };
  return { model: MODEL_FREE, system: SYSTEM_FREE };
}

// ── Main ─────────────────────────────────────────────────────────────────────

export async function analyse(req: AnalysisRequest): Promise<EngineResult> {
  const { symbol, timeframe, candles, tier, userId } = req;

  // 1. Preprocess (zero tokens)
  const features = preprocess(symbol, timeframe, candles);

  // 2. Build prompt
  const { model, system } = configForTier(tier);
  const tool = toolForTier(tier);
  const userMessage = buildUserMessage(features);

  // 3. Call Claude
  const client = new Anthropic();

  const response = await client.messages.create({
    model,
    max_tokens: tier === "elite" ? 512 : 256,
    system: [
      {
        type: "text",
        text: system,
        // Prompt cache: the system prompt never changes per tier,
        // so Anthropic caches it and charges only ~10% on cache hits.
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [tool],
    tool_choice: { type: "any" },
    messages: [{ role: "user", content: userMessage }],
  });

  // 4. Extract tool_use block
  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Engine: model did not call the emit_signal tool");
  }

  const raw = toolBlock.input as RawSignal;

  // 5. Basic sanity check
  if (!raw.entry || !raw.stop_loss || !raw.take_profits?.length) {
    throw new Error("Engine: missing required level fields in model output");
  }

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const costMicros = estimateCost(model, inputTokens, outputTokens);

  // 6. Persist to database
  const supabase = await createClient();

  const { data: signal, error: sigErr } = await supabase
    .from("signals")
    .insert({
      user_id:     userId,
      symbol,
      timeframe,
      direction:   raw.direction,
      order_type:  raw.order_type,
      entry:       raw.entry,
      stop_loss:   raw.stop_loss,
      take_profits: raw.take_profits,
      reward_risk: computeRR(raw),
      conclusion:  raw.conclusion,
      confidence:  raw.confidence ?? null,
      trend:       raw.trend ?? null,
      phase:       raw.phase ?? null,
      confluences: raw.confluences ?? null,
      reasoning:   raw.reasoning ?? null,
      structure:   buildStructure(raw),
    })
    .select("id")
    .single();

  if (sigErr) {
    throw new Error(`Engine: failed to save signal — ${sigErr.message}`);
  }

  await supabase.from("analysis_usage").insert({
    user_id:      userId,
    signal_id:    signal.id,
    model,
    input_tokens:  inputTokens,
    output_tokens: outputTokens,
    cost_micros:   costMicros,
    tier_at_time:  tier,
  });

  return { signalId: signal.id, signal: raw, inputTokens, outputTokens, costMicros, model };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeRR(raw: RawSignal): number {
  const firstTP = raw.take_profits[0];
  const sl = Math.abs(raw.entry - raw.stop_loss);
  if (sl === 0) return 0;
  return Math.abs(firstTP - raw.entry) / sl;
}

function buildStructure(raw: RawSignal): Record<string, unknown> {
  const s: Record<string, unknown> = {};
  if (raw.order_block)     s.order_block = raw.order_block;
  if (raw.fair_value_gap)  s.fair_value_gap = raw.fair_value_gap;
  if (raw.bos_level)       s.bos_level = raw.bos_level;
  if (raw.choch_level)     s.choch_level = raw.choch_level;
  if (raw.liquidity_above) s.liquidity_above = raw.liquidity_above;
  if (raw.liquidity_below) s.liquidity_below = raw.liquidity_below;
  return s;
}
