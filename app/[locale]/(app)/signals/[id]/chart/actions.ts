"use server";

import { detectPriceRangeFromImage } from "@/lib/engine/detect-range";
import { createClient } from "@/lib/supabase/server";
import type { Signal } from "@/types/domain";

export type DetectRangeResult =
  | { ok: true; min: number; max: number; reliable: boolean }
  | { ok: false; error: string };

export async function detectRange(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
): Promise<DetectRangeResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const result = await detectPriceRangeFromImage(base64Image, mediaType);
  return { ok: true, ...result };
}

export async function getSignalForChart(
  signalId: string,
): Promise<Signal | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("signals")
    .select(
      "id,symbol,timeframe,direction,order_type,entry,stop_loss,take_profits,reward_risk,conclusion,confidence,trend,phase,confluences,reasoning,structure,outcome,created_at",
    )
    .eq("id", signalId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    symbol: data.symbol,
    timeframe: data.timeframe,
    direction: data.direction,
    orderType: data.order_type,
    levels: {
      entry: Number(data.entry),
      stopLoss: Number(data.stop_loss),
      takeProfit: (data.take_profits as number[]).map(Number) as [
        number,
        ...number[],
      ],
      rewardToRisk: Number(data.reward_risk),
    },
    conclusion: data.conclusion,
    outcome: data.outcome,
    createdAt: data.created_at,
    confidence: data.confidence ?? undefined,
    trend: data.trend ?? undefined,
    phase: data.phase ?? undefined,
    confluences: data.confluences ?? undefined,
    reasoning: data.reasoning ?? undefined,
    orderBlock: (data.structure as Record<string, unknown>)
      ?.order_block as Signal["orderBlock"],
    fairValueGap: (data.structure as Record<string, unknown>)
      ?.fair_value_gap as Signal["fairValueGap"],
    breakOfStructure: (data.structure as Record<string, unknown>)
      ?.bos_level as number | undefined,
    changeOfCharacter: (data.structure as Record<string, unknown>)
      ?.choch_level as number | undefined,
    liquidityAbove: (data.structure as Record<string, unknown>)
      ?.liquidity_above as number | undefined,
    liquidityBelow: (data.structure as Record<string, unknown>)
      ?.liquidity_below as number | undefined,
  };
}
