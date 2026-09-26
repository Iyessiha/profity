"use server";

import { createClient } from "@/lib/supabase/server";
import { analyse } from "@/lib/engine/analyse";
import type { OHLCV } from "@/lib/engine/types";

export type RunAnalysisResult =
  | {
      ok: true;
      signalId: string;
      inputTokens: number;
      outputTokens: number;
      costMicros: number;
      model: string;
    }
  | { ok: false; error: string };

export async function runAnalysis(
  symbol: string,
  timeframe: string,
  candles: OHLCV[],
): Promise<RunAnalysisResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "unauthenticated" };

  // Check monthly quota
  const { data: quotaRow } = await supabase
    .rpc("analyses_used_this_month", { for_user: user.id })
    .single<number>();

  const used = quotaRow ?? 0;

  // Fetch allowance for the user's current tier
  const { data: tierRow } = await supabase
    .from("tier_allowances")
    .select("analyses_monthly")
    .eq(
      "tier",
      (
        await supabase
          .rpc("current_tier")
          .single<string>()
      ).data ?? "free",
    )
    .single();

  const allowance = tierRow?.analyses_monthly ?? 5;
  if (used >= allowance) {
    return { ok: false, error: "quota_exceeded" };
  }

  // Derive tier for model/prompt selection
  const { data: tierName } = await supabase
    .rpc("current_tier")
    .single<string>();
  const tier = (tierName as "free" | "pro" | "elite") ?? "free";

  try {
    const result = await analyse({ symbol, timeframe, candles, tier, userId: user.id });
    // signal is already persisted inside analyse(); just return metadata
    return {
      ok: true,
      signalId: result.signalId,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costMicros: result.costMicros,
      model: result.model,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return { ok: false, error: message };
  }
}
