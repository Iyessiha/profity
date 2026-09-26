"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Signal } from "@/types/domain";
import { detectRange } from "@/app/[locale]/(app)/signals/[id]/chart/actions";

// ── Design tokens (matches the dark app register) ────────────────────────────
const C = {
  entry:       "#D9A94A",
  sl:          "#F26D7D",
  tp:          ["#23D18B", "#1DB87C", "#179E6A"] as string[],
  obBull:      "rgba(35,209,139,0.13)",
  obBullEdge:  "rgba(35,209,139,0.65)",
  obBear:      "rgba(242,109,125,0.13)",
  obBearEdge:  "rgba(242,109,125,0.65)",
  fvgBull:     "rgba(92,176,214,0.11)",
  fvgBullEdge: "rgba(92,176,214,0.60)",
  fvgBear:     "rgba(232,161,60,0.11)",
  fvgBearEdge: "rgba(232,161,60,0.60)",
  bos:         "#5CB0D6",
  choch:       "#E8A13C",
  liq:         "rgba(139,154,172,0.55)",
  labelBg:     "rgba(8,12,18,0.82)",
  labelText:   "#F2F6FA",
  legendBg:    "rgba(8,12,18,0.88)",
};

interface Margins { top: number; right: number; bottom: number; left: number }

// ── Drawing helpers ──────────────────────────────────────────────────────────

function priceToY(
  price: number,
  priceMin: number,
  priceMax: number,
  m: Margins,
  h: number,
): number {
  const chartTop = h * m.top;
  const chartH = h * (1 - m.top - m.bottom);
  return chartTop + ((priceMax - price) / (priceMax - priceMin)) * chartH;
}

function chartLeft(m: Margins, w: number) { return w * m.left; }
function chartRight(m: Margins, w: number) { return w * (1 - m.right); }

function drawDashedLine(
  ctx: CanvasRenderingContext2D,
  y: number,
  x0: number,
  x1: number,
  color: string,
  dash: number[] = [10, 6],
  lineWidth = 1.5,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.restore();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  side: "left" | "right" = "right",
) {
  const PAD_X = 6, PAD_Y = 4;
  ctx.save();
  ctx.font = "bold 11px 'IBM Plex Mono', monospace";
  const w = ctx.measureText(text).width;
  const bx = side === "right" ? x + 4 : x - w - PAD_X * 2 - 4;
  const by = y - 10;
  // Badge bg
  ctx.fillStyle = color;
  roundRect(ctx, bx, by, w + PAD_X * 2, 20, 3);
  ctx.fill();
  // Text
  ctx.fillStyle = "#0a0f16";
  ctx.fillText(text, bx + PAD_X, by + 14);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawZone(
  ctx: CanvasRenderingContext2D,
  yHigh: number,
  yLow: number,
  x0: number,
  x1: number,
  fill: string,
  edge: string,
  label: string,
) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.fillRect(x0, yHigh, x1 - x0, yLow - yHigh);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.strokeRect(x0, yHigh, x1 - x0, yLow - yHigh);
  // Label inside zone
  ctx.font = "10px 'IBM Plex Mono', monospace";
  ctx.fillStyle = edge;
  ctx.fillText(label, x0 + 6, yHigh + 14);
  ctx.restore();
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: Array<{ color: string; label: string; type: "line" | "zone" }>,
) {
  const PAD = 10, ITEM_H = 18, W = 180;
  const totalH = PAD + items.length * ITEM_H + PAD;
  ctx.save();
  ctx.fillStyle = C.legendBg;
  roundRect(ctx, PAD, PAD, W, totalH, 6);
  ctx.fill();
  items.forEach((item, i) => {
    const y = PAD + PAD + i * ITEM_H;
    ctx.strokeStyle = item.color;
    ctx.fillStyle = item.color;
    ctx.lineWidth = 1.5;
    if (item.type === "line") {
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(PAD + 8, y + 6);
      ctx.lineTo(PAD + 28, y + 6);
      ctx.stroke();
    } else {
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.4;
      ctx.fillRect(PAD + 8, y + 2, 20, 8);
      ctx.globalAlpha = 1;
      ctx.strokeRect(PAD + 8, y + 2, 20, 8);
    }
    ctx.setLineDash([]);
    ctx.fillStyle = C.labelText;
    ctx.font = "11px 'IBM Plex Mono', monospace";
    ctx.fillText(item.label, PAD + 34, y + 10);
  });
  ctx.restore();
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  signal: Signal;
}

export function ChartAnnotator({ signal }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgDataUrl, setImgDataUrl] = useState<string | null>(null);
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState("");
  const [margins, setMargins] = useState<Margins>({ top: 0.06, right: 0.08, bottom: 0.12, left: 0.01 });
  const [drawn, setDrawn] = useState(false);

  // Load image object when data URL changes
  useEffect(() => {
    if (!imgDataUrl) return;
    const img = new Image();
    img.onload = () => setImgObj(img);
    img.src = imgDataUrl;
  }, [imgDataUrl]);

  // Re-draw when anything changes
  useEffect(() => {
    if (!imgObj || priceMin <= 0 || priceMax <= priceMin) return;
    drawAnnotations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgObj, priceMin, priceMax, margins]);

  // ── File upload ──
  const onFile = useCallback(async (file: File) => {
    const base64 = await fileToBase64(file);
    setImgDataUrl(base64.dataUrl);
    setDetecting(true);
    setDetectMsg("Détection de la plage de prix…");

    const mt = file.type as "image/jpeg" | "image/png" | "image/webp";
    const res = await detectRange(base64.pure, mt);
    setDetecting(false);

    if (res.ok && res.reliable) {
      setPriceMin(res.min);
      setPriceMax(res.max);
      setDetectMsg(`Plage détectée : ${res.min} – ${res.max}`);
    } else {
      setDetectMsg("Plage non détectée — entre les valeurs manuellement.");
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) onFile(file);
    },
    [onFile],
  );

  // ── Drawing ──
  function drawAnnotations() {
    const canvas = canvasRef.current;
    if (!canvas || !imgObj) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = imgObj.width;
    canvas.height = imgObj.height;
    ctx.drawImage(imgObj, 0, 0);

    const W = canvas.width, H = canvas.height;
    const m = margins;
    const cL = chartLeft(m, W), cR = chartRight(m, W);
    const pMin = priceMin, pMax = priceMax;
    const py = (p: number) => priceToY(p, pMin, pMax, m, H);
    const { levels } = signal;

    // ── OBs ──
    if (signal.orderBlock) {
      const ob = signal.orderBlock;
      const fill = ob.bias === "bullish" ? C.obBull : C.obBear;
      const edge = ob.bias === "bullish" ? C.obBullEdge : C.obBearEdge;
      drawZone(ctx, py(ob.high), py(ob.low), cL, cR, fill, edge, ob.bias === "bullish" ? "Bullish OB" : "Bearish OB");
    }
    if (signal.fairValueGap) {
      const fvg = signal.fairValueGap;
      const fill = fvg.bias === "bullish" ? C.fvgBull : C.fvgBear;
      const edge = fvg.bias === "bullish" ? C.fvgBullEdge : C.fvgBearEdge;
      drawZone(ctx, py(fvg.high), py(fvg.low), cL, cR, fill, edge, "FVG");
    }

    // ── Liquidity levels ──
    if (signal.liquidityAbove) {
      drawDashedLine(ctx, py(signal.liquidityAbove), cL, cR, C.liq, [4, 8], 1);
    }
    if (signal.liquidityBelow) {
      drawDashedLine(ctx, py(signal.liquidityBelow), cL, cR, C.liq, [4, 8], 1);
    }

    // ── BOS / CHoCH ──
    if (signal.breakOfStructure) {
      drawDashedLine(ctx, py(signal.breakOfStructure), cL, cR, C.bos, [6, 6], 1);
      drawLabel(ctx, `BOS ${fmtP(signal.breakOfStructure)}`, cR, py(signal.breakOfStructure), C.bos);
    }
    if (signal.changeOfCharacter) {
      drawDashedLine(ctx, py(signal.changeOfCharacter), cL, cR, C.choch, [6, 6], 1);
      drawLabel(ctx, `CHoCH ${fmtP(signal.changeOfCharacter)}`, cR, py(signal.changeOfCharacter), C.choch);
    }

    // ── Take profits ──
    levels.takeProfit.forEach((tp, i) => {
      const col = C.tp[Math.min(i, C.tp.length - 1)];
      drawDashedLine(ctx, py(tp), cL, cR, col, [10, 6], 1.5);
      drawLabel(ctx, `TP${i + 1}  ${fmtP(tp)}`, cR, py(tp), col);
    });

    // ── Stop loss ──
    drawDashedLine(ctx, py(levels.stopLoss), cL, cR, C.sl, [10, 6], 1.5);
    drawLabel(ctx, `SL  ${fmtP(levels.stopLoss)}`, cR, py(levels.stopLoss), C.sl);

    // ── Entry ── (drawn on top)
    drawDashedLine(ctx, py(levels.entry), cL, cR, C.entry, [10, 6], 2);
    drawLabel(ctx, `ENTRY  ${fmtP(levels.entry)}`, cR, py(levels.entry), C.entry);

    // ── Legend ──
    const legendItems: Array<{ color: string; label: string; type: "line" | "zone" }> = [
      { color: C.entry, label: "Entry", type: "line" },
      { color: C.sl, label: "Stop Loss", type: "line" },
      ...levels.takeProfit.map((_, i) => ({
        color: C.tp[Math.min(i, C.tp.length - 1)],
        label: `TP ${i + 1}`,
        type: "line" as const,
      })),
    ];
    if (signal.orderBlock)
      legendItems.push({ color: signal.orderBlock.bias === "bullish" ? C.obBullEdge : C.obBearEdge, label: "Order Block", type: "zone" });
    if (signal.fairValueGap)
      legendItems.push({ color: C.fvgBullEdge, label: "Fair Value Gap", type: "zone" });
    if (signal.breakOfStructure)
      legendItems.push({ color: C.bos, label: "BOS", type: "line" });
    if (signal.changeOfCharacter)
      legendItems.push({ color: C.choch, label: "CHoCH", type: "line" });

    drawLegend(ctx, legendItems);

    // ── Footer watermark ──
    ctx.save();
    ctx.font = "11px 'IBM Plex Mono', monospace";
    ctx.fillStyle = "rgba(217,169,74,0.45)";
    ctx.fillText("Profity · Smart Money Analysis", cL + 4, H - 8);
    ctx.restore();

    setDrawn(true);
  }

  // ── Download ──
  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${signal.symbol}-${signal.timeframe}-signal.png`;
    a.click();
  }

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      {!imgDataUrl && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line bg-surface-raised text-center transition-colors hover:border-accent-line"
          onClick={() => document.getElementById("chart-file-input")?.click()}
        >
          <svg className="h-10 w-10 text-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm font-medium text-text-muted">Dépose ta capture d'écran ou clique pour choisir</p>
          <p className="text-xs text-text-faint">PNG, JPG, WebP — TradingView, MT4/MT5, cTrader</p>
          <input
            id="chart-file-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </div>
      )}

      {/* Status */}
      {detecting && (
        <p className="text-center text-sm text-text-muted animate-pulse">{detectMsg}</p>
      )}
      {!detecting && detectMsg && (
        <p className="text-center text-sm text-accent">{detectMsg}</p>
      )}

      {/* Price range + margin controls */}
      {imgDataUrl && (
        <div className="grid gap-4 rounded-xl border border-line bg-surface-raised p-5 sm:grid-cols-2">
          <div className="space-y-3">
            <p className="label-caps">Plage de prix visible</p>
            <div className="flex items-center gap-3">
              <label className="w-12 shrink-0 text-xs text-text-muted">Min</label>
              <input
                type="number"
                value={priceMin || ""}
                onChange={(e) => setPriceMin(parseFloat(e.target.value) || 0)}
                className="flex-1 rounded-md border border-line bg-surface-base px-3 py-1.5 font-mono text-sm text-text-strong focus:border-accent focus:outline-none"
                placeholder="0"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-12 shrink-0 text-xs text-text-muted">Max</label>
              <input
                type="number"
                value={priceMax || ""}
                onChange={(e) => setPriceMax(parseFloat(e.target.value) || 0)}
                className="flex-1 rounded-md border border-line bg-surface-base px-3 py-1.5 font-mono text-sm text-text-strong focus:border-accent focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="label-caps">Marges du graphique</p>
            {(["top", "right", "bottom", "left"] as const).map((side) => (
              <div key={side} className="flex items-center gap-3">
                <label className="w-12 shrink-0 text-xs capitalize text-text-muted">{side}</label>
                <input
                  type="range"
                  min={0}
                  max={0.25}
                  step={0.005}
                  value={margins[side]}
                  onChange={(e) =>
                    setMargins((m) => ({ ...m, [side]: parseFloat(e.target.value) }))
                  }
                  className="flex-1 accent-[#D9A94A]"
                />
                <span className="w-10 text-right font-mono text-xs text-text-faint">
                  {Math.round(margins[side] * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      {imgDataUrl && (
        <div className="overflow-auto rounded-xl border border-line bg-surface-sunken p-2">
          <canvas
            ref={canvasRef}
            className="max-w-full rounded-lg"
            style={{ display: imgObj ? "block" : "none" }}
          />
          {!imgObj && (
            <div className="flex h-48 items-center justify-center text-sm text-text-faint">
              Chargement…
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {drawn && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={download}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast transition-opacity hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Télécharger PNG
          </button>
          <button
            onClick={() => { setImgDataUrl(null); setImgObj(null); setDrawn(false); setDetectMsg(""); }}
            className="rounded-lg border border-line px-4 py-2 text-sm text-text-muted transition-colors hover:bg-surface-raised"
          >
            Changer de graphique
          </button>
        </div>
      )}
    </div>
  );
}

// ── Utils ────────────────────────────────────────────────────────────────────

async function fileToBase64(file: File): Promise<{ dataUrl: string; pure: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const pure = dataUrl.split(",")[1];
      resolve({ dataUrl, pure });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fmtP(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 10)   return price.toFixed(3);
  return price.toFixed(5);
}
