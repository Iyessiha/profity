// =====================================================================
// ProfityX — ChallengeDashboard.tsx  (VERSION PRODUCTION)
// ---------------------------------------------------------------------
// Branchement Supabase Realtime sur :
//   1) challenge_metrics  → métriques temps réel (equity, dd, profit…)
//   2) equity_snapshots   → points de la courbe (INSERT)
//   3) challenge_events   → flux d'activité (INSERT)
// Les règles du challenge (cibles, planchers) viennent de `challenges`.
//
// USAGE :
//   <ChallengeDashboard accountId="<uuid>" />
//
// VARIABLES D'ENV Supabase (dans .env.local) :
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
// =====================================================================

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  XAxis, YAxis, ReferenceLine, ReferenceArea, Tooltip,
} from "recharts";
import {
  Activity, AlertTriangle, CalendarDays,
  CheckCircle2, Circle, RefreshCw, ShieldAlert, TrendingUp,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// Client Supabase (singleton)
// ─────────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ─────────────────────────────────────────────────────────────────────
// Types — alignés sur le schéma SQL
// ─────────────────────────────────────────────────────────────────────
type ChallengeStatus = "in_progress" | "passed" | "failed";
type DdType = "static" | "trailing";
type EventKind =
  | "day_started" | "target_hit" | "daily_breach" | "total_breach"
  | "passed" | "failed" | "connected" | "disconnected" | "trade";

interface Challenge {
  id: string;
  starting_balance: number;
  profit_target_pct: number;
  max_total_dd_pct: number;
  dd_type: DdType;
  max_daily_dd_pct: number | null;
  min_trading_days: number;
  max_trading_days: number | null;
  status: ChallengeStatus;
  failed_reason: string | null;
  started_at: string;
  completed_at: string | null;
}

interface Account {
  id: string;
  label: string | null;
  mt5_login: number | null;
  broker_server: string | null;
  currency: string | null;
  leverage: number | null;
  last_seen_at: string | null;
}

interface Metrics {
  current_balance: number;
  current_equity: number;
  peak_equity: number;
  profit_pct: number;
  total_dd_pct: number;
  daily_dd_pct: number;
  trading_days: number;
  updated_at: string;
}

interface EquityPoint { i: number; equity: number; }

interface ChallengeEvent {
  id: string;
  type: EventKind;
  message: string | null;
  created_at: string;
}

interface Props { accountId: string; }

// ─────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (n: number, plus = true) =>
  `${plus && n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const MAX_SERIES = 120; // points max sur la courbe

// ─────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────
export default function ChallengeDashboard({ accountId }: Props) {
  // ── état
  const [account, setAccount] = useState<Account | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [series, setSeries] = useState<EquityPoint[]>([]);
  const [events, setEvents] = useState<ChallengeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seriesIdx = useRef(0);
  const channels = useRef<RealtimeChannel[]>([]);

  // ── chargement initial
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // 1) compte
      const { data: acc, error: eAcc } = await supabase
        .from("accounts").select("*").eq("id", accountId).single();
      if (eAcc) throw eAcc;
      setAccount(acc);

      // 2) challenge actif
      const { data: ch, error: eCh } = await supabase
        .from("challenges").select("*")
        .eq("account_id", accountId)
        .order("started_at", { ascending: false })
        .limit(1).single();
      if (eCh) throw eCh;
      setChallenge(ch);

      // 3) métriques
      const { data: met } = await supabase
        .from("challenge_metrics").select("*").eq("challenge_id", ch.id).single();
      if (met) setMetrics(met);

      // 4) historique d'equity (80 derniers points)
      const { data: snaps } = await supabase
        .from("equity_snapshots").select("equity, ts")
        .eq("challenge_id", ch.id)
        .order("ts", { ascending: false }).limit(80);
      if (snaps) {
        const pts = snaps.reverse().map((s, i) => {
          seriesIdx.current = i + 1;
          return { i, equity: Number(s.equity) };
        });
        setSeries(pts);
      }

      // 5) derniers events
      const { data: evts } = await supabase
        .from("challenge_events").select("*")
        .eq("challenge_id", ch.id)
        .order("created_at", { ascending: false }).limit(8);
      if (evts) setEvents(evts);

      // ── abonnements Realtime
      setupRealtime(ch.id);
    } catch (e: any) {
      setError(e?.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const setupRealtime = (challengeId: string) => {
    // détruire les canaux précédents
    channels.current.forEach((c) => supabase.removeChannel(c));
    channels.current = [];

    // ── canal 1 : métriques (UPDATE 1:1)
    const metricsChannel = supabase.channel(`metrics:${challengeId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "challenge_metrics",
        filter: `challenge_id=eq.${challengeId}`,
      }, (payload) => {
        setMetrics(payload.new as Metrics);
        // si le challenge vient de changer de statut, recharger
        if ((payload.new as any).updated_at !== (payload.old as any).updated_at) {
          supabase.from("challenges").select("*").eq("id", challengeId).single()
            .then(({ data }) => { if (data) setChallenge(data); });
        }
      }).subscribe();
    channels.current.push(metricsChannel);

    // ── canal 2 : nouveaux snapshots d'equity (INSERT)
    const snapsChannel = supabase.channel(`snaps:${challengeId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "equity_snapshots",
        filter: `challenge_id=eq.${challengeId}`,
      }, (payload) => {
        const pt: EquityPoint = {
          i: seriesIdx.current++,
          equity: Number((payload.new as any).equity),
        };
        setSeries((prev) => [...prev.slice(-(MAX_SERIES - 1)), pt]);
      }).subscribe();
    channels.current.push(snapsChannel);

    // ── canal 3 : events d'activité (INSERT)
    const eventsChannel = supabase.channel(`events:${challengeId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "challenge_events",
        filter: `challenge_id=eq.${challengeId}`,
      }, (payload) => {
        setEvents((prev) => [payload.new as ChallengeEvent, ...prev.slice(0, 7)]);
        // si événement terminal, mettre à jour le statut
        const t = (payload.new as ChallengeEvent).type;
        if (t === "passed" || t === "failed") {
          supabase.from("challenges").select("*").eq("id", challengeId).single()
            .then(({ data }) => { if (data) setChallenge(data); });
        }
      }).subscribe();
    channels.current.push(eventsChannel);
  };

  useEffect(() => { load(); return () => { channels.current.forEach((c) => supabase.removeChannel(c)); }; }, [load]);

  // ─────────────────────────────────────────────────────────────────
  // Indicateur « connecté » : last_seen_at < 30 s
  // ─────────────────────────────────────────────────────────────────
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const check = () => {
      if (!account?.last_seen_at) { setConnected(false); return; }
      setConnected(Date.now() - new Date(account.last_seen_at).getTime() < 30_000);
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, [account]);

  // ─────────────────────────────────────────────────────────────────
  // Calculs dérivés
  // ─────────────────────────────────────────────────────────────────
  if (loading) return <LoadingState />;
  if (error || !challenge || !account) return <ErrorState msg={error} onRetry={load} />;

  const m = metrics;
  const equity = m?.current_equity ?? challenge.starting_balance;
  const profitPct = m?.profit_pct ?? 0;
  const totalDd = m?.total_dd_pct ?? 0;
  const dailyDd = m?.daily_dd_pct ?? 0;
  const tradingDays = m?.trading_days ?? 0;
  const peak = m?.peak_equity ?? challenge.starting_balance;

  const start = challenge.starting_balance;
  const targetEq = start * (1 + challenge.profit_target_pct / 100);
  const totalFloor = challenge.dd_type === "trailing"
    ? peak * (1 - challenge.max_total_dd_pct / 100)
    : start * (1 - challenge.max_total_dd_pct / 100);

  const lo = Math.min(totalFloor, ...series.map((d) => d.equity), equity) - 80;
  const hi = Math.max(targetEq, ...series.map((d) => d.equity), equity) + 80;
  const progress = Math.min(100, Math.max(0, (profitPct / challenge.profit_target_pct) * 100));

  const seenAgo = account.last_seen_at
    ? Math.round((Date.now() - new Date(account.last_seen_at).getTime()) / 1000)
    : null;

  return (
    <div className="px-root">
      <style>{CSS}</style>

      {/* ── Topbar ── */}
      <header className="px-top">
        <div className="px-brand">
          <span className="px-logo">PROFITY<b>X</b></span>
          <span className="px-divider" />
          <span className="px-chal">
            {account.label ?? "Compte"} · Challenge {(start / 1000).toFixed(0)}K
          </span>
        </div>
        <div className={`px-live ${connected ? "on" : "off"}`}>
          <span className="px-dot" />
          {connected ? "EN DIRECT" : "HORS LIGNE"}
          {seenAgo != null && (
            <span className="px-seen">vu il y a {seenAgo} s</span>
          )}
        </div>
      </header>

      <p className="px-meta">
        Compte {account.mt5_login ?? "—"} · {account.broker_server ?? "—"} ·{" "}
        {account.currency ?? "USD"} · levier 1:{account.leverage ?? "—"}
      </p>

      {/* ── Bandeau statut + progression ── */}
      <section className={`px-band ${challenge.status}`}>
        <div className="px-band-left">
          <span className="px-eyebrow">Statut</span>
          <span className="px-status">
            {challenge.status === "in_progress" && <><Activity size={18} /> En cours</>}
            {challenge.status === "passed" && <><CheckCircle2 size={18} /> Validé</>}
            {challenge.status === "failed" && (
              <><AlertTriangle size={18} /> Échoué{" "}
                {challenge.failed_reason && (
                  <span className="px-reason">({challenge.failed_reason.replace("_", " ")})</span>
                )}
              </>
            )}
          </span>
        </div>
        <div className="px-band-right">
          <div className="px-prof">
            <span className="px-eyebrow">Profit · objectif {pct(challenge.profit_target_pct)}</span>
            <span className="px-prof-val">{pct(profitPct)}</span>
          </div>
          <div className="px-bar">
            <div className="px-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      {/* ── HERO : corridor d'equity ── */}
      <section className="px-chart-card">
        <div className="px-chart-head">
          <span className="px-eyebrow">Courbe d'equity · corridor de risque</span>
          <span className="px-equity-now">
            {fmt(equity)} <em>{account.currency ?? "USD"}</em>
          </span>
        </div>
        {series.length > 1 ? (
          <div className="px-chart">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 8, right: 72, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2DD4A7" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#2DD4A7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="i" hide />
                <YAxis domain={[lo, hi]} hide />
                <ReferenceArea y1={lo} y2={totalFloor} fill="#FB5566" fillOpacity={0.07} />
                <ReferenceArea y1={targetEq} y2={hi} fill="#E8B339" fillOpacity={0.06} />
                <ReferenceLine y={targetEq} stroke="#E8B339" strokeDasharray="5 4"
                  label={{ value: `Cible ${pct(challenge.profit_target_pct)}`, position: "right",
                    fill: "#E8B339", fontSize: 11, fontFamily: "Inter" }} />
                {challenge.max_daily_dd_pct && m && (
                  <ReferenceLine
                    y={m.current_equity - (m.current_equity * challenge.max_daily_dd_pct / 100)}
                    stroke="#FB5566" strokeDasharray="2 4" strokeOpacity={0.8}
                    label={{ value: "Limite jour", position: "right",
                      fill: "#FB5566", fontSize: 11, fontFamily: "Inter" }} />
                )}
                <ReferenceLine y={totalFloor} stroke="#FB5566"
                  label={{ value: "Limite totale", position: "right",
                    fill: "#FB5566", fontSize: 11, fontFamily: "Inter" }} />
                <Area type="monotone" dataKey="equity" stroke="none" fill="url(#eq)" />
                <Line type="monotone" dataKey="equity" stroke="#2DD4A7" strokeWidth={2}
                  dot={false} isAnimationActive={false} />
                <Tooltip content={<EqTip currency={account.currency ?? "USD"} />}
                  cursor={{ stroke: "#3A4763" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="px-chart-empty">
            En attente du premier snapshot de l'EA…
          </div>
        )}
      </section>

      {/* ── Jauges ── */}
      <section className="px-grid">
        <Gauge icon={<ShieldAlert size={15} />} label="Perte journalière"
          value={dailyDd} limit={challenge.max_daily_dd_pct ?? challenge.max_total_dd_pct} />
        <Gauge icon={<TrendingUp size={15} />} label="Drawdown total"
          value={totalDd} limit={challenge.max_total_dd_pct} />
        <DaysTile current={tradingDays} min={challenge.min_trading_days} />
      </section>

      {/* ── Flux d'activité ── */}
      <section className="px-feed">
        <span className="px-eyebrow">Activité</span>
        {events.length === 0
          ? <p className="px-feed-empty">Aucune activité pour l'instant.</p>
          : (
            <ul>
              {events.map((e) => (
                <li key={e.id} className={`px-ev ${e.type}`}>
                  <Circle size={7} className="px-ev-dot" />
                  <span className="px-ev-label">{e.message ?? e.type}</span>
                  <span className="px-ev-time">{timeOf(e.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────────────
function Gauge({ icon, label, value, limit }: {
  icon: React.ReactNode; label: string; value: number; limit: number;
}) {
  const ratio = Math.min(1, value / limit);
  const color = ratio > 0.8 ? "#FB5566" : ratio > 0.55 ? "#F59E42" : "#2DD4A7";
  const margin = Math.max(0, limit - value);
  return (
    <div className="px-tile">
      <span className="px-eyebrow">{icon} {label}</span>
      <div className="px-tile-val" style={{ color }}>
        {value.toFixed(2)}<em>%</em>
        <span className="px-tile-limit">/ {limit}%</span>
      </div>
      <div className="px-gauge">
        <div className="px-gauge-fill" style={{ width: `${ratio * 100}%`, background: color }} />
      </div>
      <span className="px-tile-foot">marge : {margin.toFixed(2)} %</span>
    </div>
  );
}

function DaysTile({ current, min }: { current: number; min: number }) {
  const ok = current >= min;
  return (
    <div className="px-tile">
      <span className="px-eyebrow"><CalendarDays size={15} /> Jours de trading</span>
      <div className="px-tile-val" style={{ color: ok ? "#2DD4A7" : "#EAEEF6" }}>
        {current}<span className="px-tile-limit">/ {min} min.</span>
      </div>
      <div className="px-days">
        {Array.from({ length: min }).map((_, k) => (
          <span key={k} className={`px-day ${k < current ? "fill" : ""}`} />
        ))}
      </div>
      <span className="px-tile-foot">
        {ok ? "minimum atteint" : `${min - current} jour(s) restant(s)`}
      </span>
    </div>
  );
}

function EqTip({ active, payload, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-tip">
      {fmt(payload[0].value)} <em>{currency}</em>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="px-root px-center">
      <style>{CSS}</style>
      <RefreshCw size={20} className="px-spin" />
      <span style={{ marginLeft: 10, color: "#69748C", fontSize: 14 }}>Chargement…</span>
    </div>
  );
}

function ErrorState({ msg, onRetry }: { msg: string | null; onRetry: () => void }) {
  return (
    <div className="px-root px-center" style={{ flexDirection: "column", gap: 12 }}>
      <style>{CSS}</style>
      <AlertTriangle size={22} color="#FB5566" />
      <p style={{ color: "#EAEEF6", fontSize: 14, margin: 0 }}>
        {msg ?? "Impossible de charger le challenge."}
      </p>
      <button className="px-retry" onClick={onRetry}>Réessayer</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

.px-root{
  --ink:#0A0E17; --panel:#121826; --hair:#222C40;
  --text:#EAEEF6; --muted:#69748C;
  --climb:#2DD4A7; --gold:#E8B339; --danger:#FB5566;
  background:var(--ink); color:var(--text);
  font-family:'Inter',system-ui,sans-serif;
  min-height:100vh; padding:22px clamp(16px,4vw,40px); box-sizing:border-box;
  max-width:1080px; margin:0 auto;
}
.px-root *{box-sizing:border-box;}
.px-center{display:flex; align-items:center; justify-content:center; min-height:60vh;}
.px-eyebrow{font-size:10.5px; letter-spacing:.13em; text-transform:uppercase;
  color:var(--muted); font-weight:500; display:inline-flex; align-items:center; gap:6px;}
.px-top{display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;}
.px-brand{display:flex; align-items:center; gap:14px;}
.px-logo{font-family:'Space Grotesk'; font-weight:700; font-size:18px; letter-spacing:.04em;}
.px-logo b{color:var(--climb);}
.px-divider{width:1px; height:18px; background:var(--hair);}
.px-chal{font-family:'Space Grotesk'; font-weight:500; font-size:14px;}
.px-live{display:inline-flex; align-items:center; gap:8px; font-size:11px; font-weight:600;
  letter-spacing:.08em; color:var(--climb);
  border:1px solid var(--hair); border-radius:999px; padding:6px 12px;}
.px-live.off{color:var(--muted);}
.px-dot{width:7px; height:7px; border-radius:50%; background:currentColor;
  animation:pulse 2s infinite;}
.px-live.off .px-dot{animation:none;}
.px-seen{color:var(--muted); font-weight:400; letter-spacing:0; margin-left:2px;}
.px-meta{color:var(--muted); font-size:12px; margin:8px 0 18px; font-family:'IBM Plex Mono';}
.px-band{display:flex; align-items:center; justify-content:space-between; gap:24px; flex-wrap:wrap;
  background:var(--panel); border:1px solid var(--hair); border-left:3px solid var(--climb);
  border-radius:14px; padding:18px 22px; margin-bottom:14px;}
.px-band.failed{border-left-color:var(--danger);}
.px-band.passed{border-left-color:var(--gold);}
.px-status{display:flex; align-items:center; gap:8px; font-family:'Space Grotesk';
  font-size:20px; font-weight:600; margin-top:6px;}
.px-band.in_progress .px-status{color:var(--climb);}
.px-band.failed .px-status{color:var(--danger);}
.px-band.passed .px-status{color:var(--gold);}
.px-reason{font-size:13px; opacity:.75;}
.px-band-right{flex:1; min-width:260px;}
.px-prof{display:flex; align-items:baseline; justify-content:space-between; margin-bottom:8px;}
.px-prof-val{font-family:'IBM Plex Mono'; font-size:22px; font-weight:600; color:var(--climb);}
.px-bar{height:7px; background:#0E1422; border-radius:999px; overflow:hidden; border:1px solid var(--hair);}
.px-bar-fill{height:100%; background:linear-gradient(90deg,#2DD4A7,#5BE0BC);
  border-radius:999px; transition:width .8s cubic-bezier(.2,.7,.2,1);}
.px-chart-card{background:var(--panel); border:1px solid var(--hair); border-radius:14px;
  padding:18px 20px 14px; margin-bottom:14px;}
.px-chart-head{display:flex; align-items:baseline; justify-content:space-between; margin-bottom:6px; gap:8px;}
.px-equity-now{font-family:'IBM Plex Mono'; font-size:18px; font-weight:600;}
.px-equity-now em{font-style:normal; color:var(--muted); font-size:12px;}
.px-chart{height:300px; width:100%;}
.px-chart-empty{height:200px; display:flex; align-items:center; justify-content:center;
  color:var(--muted); font-size:13px; font-style:italic;}
.px-tip{background:#0B0F1A; border:1px solid var(--hair); border-radius:8px;
  padding:6px 10px; font-family:'IBM Plex Mono'; font-size:13px; color:var(--text);}
.px-tip em{font-style:normal; color:var(--muted); font-size:11px;}
.px-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:14px;}
.px-tile{background:var(--panel); border:1px solid var(--hair); border-radius:14px; padding:16px 18px;}
.px-tile-val{font-family:'IBM Plex Mono'; font-size:26px; font-weight:600; margin:10px 0 12px;
  display:flex; align-items:baseline; gap:6px;}
.px-tile-val em{font-style:normal; font-size:15px;}
.px-tile-limit{font-size:12px; color:var(--muted); font-weight:400;}
.px-gauge{height:6px; background:#0E1422; border-radius:999px; overflow:hidden; border:1px solid var(--hair);}
.px-gauge-fill{height:100%; border-radius:999px; transition:width .8s cubic-bezier(.2,.7,.2,1), background .4s;}
.px-tile-foot{display:block; margin-top:10px; font-size:11px; color:var(--muted); font-family:'IBM Plex Mono';}
.px-days{display:flex; gap:6px; margin-top:2px;}
.px-day{flex:1; height:6px; border-radius:999px; background:#0E1422; border:1px solid var(--hair);}
.px-day.fill{background:var(--climb); border-color:var(--climb);}
.px-feed{background:var(--panel); border:1px solid var(--hair); border-radius:14px; padding:16px 20px;}
.px-feed ul{list-style:none; margin:12px 0 0; padding:0;}
.px-feed-empty{font-size:12px; color:var(--muted); font-style:italic; margin:12px 0 0;}
.px-ev{display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--hair); font-size:13px;}
.px-ev:last-child{border-bottom:none;}
.px-ev-dot{color:var(--muted); flex:none;}
.px-ev.trade .px-ev-dot{color:var(--climb);}
.px-ev.failed .px-ev-dot, .px-ev.daily_breach .px-ev-dot, .px-ev.total_breach .px-ev-dot{color:var(--danger);}
.px-ev.passed .px-ev-dot, .px-ev.target_hit .px-ev-dot{color:var(--gold);}
.px-ev-label{flex:1; font-family:'IBM Plex Mono'; font-size:12.5px; color:var(--text);}
.px-ev-time{color:var(--muted); font-size:11px; font-family:'IBM Plex Mono';}
.px-retry{background:var(--hair); border:1px solid #3A4763; color:var(--text);
  padding:8px 18px; border-radius:8px; cursor:pointer; font-size:13px;}
.px-retry:hover{background:#2A3448;}
.px-spin{animation:spin 1.2s linear infinite; color:#69748C;}
@keyframes pulse{
  0%{box-shadow:0 0 0 0 rgba(45,212,167,.45);}
  70%{box-shadow:0 0 0 7px rgba(45,212,167,0);}
  100%{box-shadow:0 0 0 0 rgba(45,212,167,0);}
}
@keyframes spin{to{transform:rotate(360deg);}}
@media(max-width:720px){
  .px-band{flex-direction:column; align-items:stretch; gap:16px;}
  .px-band-right{min-width:0;}
  .px-grid{grid-template-columns:1fr;}
}
@media(prefers-reduced-motion:reduce){
  .px-dot{animation:none;} .px-bar-fill,.px-gauge-fill,.px-spin{transition:none; animation:none;}
}
`;
