import * as React from "react";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardFooter, CardHeader, DataRow } from "@/components/ui/card";
import { formatPrice, formatRatio } from "@/lib/format";
import type { Direction, Locale, Signal, Tier } from "@/types/domain";
import { cn } from "@/lib/utils";

const DIRECTION_TONE: Record<Direction, "long" | "short" | "flat"> = {
  LONG: "long",
  SHORT: "short",
  NEUTRAL: "flat",
};

const DIRECTION_LABEL: Record<Direction, string> = {
  LONG: "LONG",
  SHORT: "SHORT",
  NEUTRAL: "ATTENDRE",
};

const ORDER_TYPE_LABEL: Record<string, string> = {
  BUY_LIMIT: "Achat limite",
  SELL_LIMIT: "Vente limite",
  BUY_STOP: "Achat stop",
  SELL_STOP: "Vente stop",
  MARKET_BUY: "Achat au marché",
  MARKET_SELL: "Vente au marché",
  WAIT: "Aucun ordre",
};

const PHASE_LABEL: Record<string, string> = {
  accumulation: "Accumulation",
  distribution: "Distribution",
  markup: "Hausse",
  markdown: "Baisse",
  ranging: "Range",
};

const CONFIDENCE_LABEL: Record<string, string> = {
  HIGH: "Confiance haute",
  MEDIUM: "Confiance moyenne",
  LOW: "Confiance faible",
};

const TIER_RANK: Record<Tier, number> = { free: 0, pro: 1, elite: 2 };

export function SignalCard({
  signal,
  tier,
  locale = "fr",
  className,
}: {
  signal: Signal;
  /** Drives what reasoning is shown; levels are always complete. */
  tier: Tier;
  locale?: Locale;
  className?: string;
}) {
  const { levels, symbol } = signal;
  const price = (v: number) => formatPrice(v, symbol, locale);
  const canSeeReasoning = TIER_RANK[tier] >= TIER_RANK.pro;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-surface-overlay">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[0.9375rem] font-semibold tracking-wide text-text-strong">
            {symbol}
          </span>
          <span className="font-mono text-[0.6875rem] text-text-faint">
            {signal.timeframe}
          </span>
        </div>
        <Badge tone={DIRECTION_TONE[signal.direction]} solid>
          {DIRECTION_LABEL[signal.direction]}
        </Badge>
      </CardHeader>

      <div>
        <DataRow label="Type d'ordre">
          {ORDER_TYPE_LABEL[signal.orderType] ?? signal.orderType}
        </DataRow>
        <DataRow label="Entrée">{price(levels.entry)}</DataRow>
        <DataRow label="Stop loss">
          <span className="text-short">{price(levels.stopLoss)}</span>
        </DataRow>
        <DataRow
          label={
            levels.takeProfit.length > 1
              ? `Objectifs (${levels.takeProfit.length})`
              : "Objectif"
          }
        >
          <span className="text-long">
            {levels.takeProfit.map((tp) => price(tp)).join(" · ")}
          </span>
        </DataRow>
        <DataRow label="Rendement / risque">
          <span className="text-accent">
            {formatRatio(levels.rewardToRisk, locale)}
          </span>
        </DataRow>
        {signal.phase ? (
          <DataRow label="Phase de marché">
            {PHASE_LABEL[signal.phase] ?? signal.phase}
          </DataRow>
        ) : null}
      </div>

      {canSeeReasoning ? (
        signal.reasoning ? (
          <CardBody className="border-t border-line bg-surface-sunken">
            <span className="label-caps block">Lecture du marché</span>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-text">
              {signal.reasoning}
            </p>
          </CardBody>
        ) : null
      ) : (
        <CardBody className="border-t border-line bg-surface-sunken">
          <div className="flex items-start gap-2.5">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-text-faint" aria-hidden />
            <p className="text-[0.8125rem] leading-relaxed text-text-muted">
              Les niveaux ci-dessus sont complets et exploitables. Le raisonnement
              Smart Money qui les justifie — structure, zones et confluences — est
              inclus dans le plan Pro.
            </p>
          </div>
        </CardBody>
      )}

      {(signal.confluences?.length || signal.confidence) && canSeeReasoning ? (
        <CardFooter>
          {signal.confluences?.map((c) => (
            <Badge key={c} tone="neutral">
              {c}
            </Badge>
          ))}
          {signal.confidence ? (
            <Badge tone="accent">
              {CONFIDENCE_LABEL[signal.confidence] ?? signal.confidence}
            </Badge>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
