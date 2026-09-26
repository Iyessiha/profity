import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSignalForChart } from "./actions";
import { ChartAnnotator } from "@/components/chart/chart-annotator";
import { Card, CardBody } from "@/components/ui/card";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function ChartPage({ params }: Props) {
  const { id } = await params;
  const signal = await getSignalForChart(id);

  if (!signal) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-text-strong">
          Annoter mon graphique
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {signal.symbol} · {signal.timeframe} · {signal.direction}
        </p>
      </div>

      {/* Signal summary */}
      <Card className="mb-6">
        <CardBody className="flex flex-wrap gap-6 py-4">
          <div>
            <p className="label-caps mb-1">Entrée</p>
            <p className="font-mono text-sm font-semibold text-accent">{signal.levels.entry}</p>
          </div>
          <div>
            <p className="label-caps mb-1">Stop loss</p>
            <p className="font-mono text-sm font-semibold text-short">{signal.levels.stopLoss}</p>
          </div>
          {signal.levels.takeProfit.map((tp, i) => (
            <div key={i}>
              <p className="label-caps mb-1">TP{i + 1}</p>
              <p className="font-mono text-sm font-semibold text-long">{tp}</p>
            </div>
          ))}
          <div>
            <p className="label-caps mb-1">R:R</p>
            <p className="font-mono text-sm font-semibold text-text-strong">
              1:{signal.levels.rewardToRisk.toFixed(1)}
            </p>
          </div>
        </CardBody>
      </Card>

      <ChartAnnotator signal={signal} />
    </div>
  );
}
