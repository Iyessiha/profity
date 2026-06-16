// =====================================================================
// ProfityX — Edge Function `ingest`
// Reçoit les données poussées par l'EA MT5 (WebRequest), enregistre les
// snapshots/trades, puis lance le moteur de validation du challenge.
//
// Déploiement :  supabase functions deploy ingest --no-verify-jwt
//   (--no-verify-jwt car l'EA n'est pas un user Supabase ; l'auth se fait
//    par connect_token. La fonction tourne en SERVICE_ROLE → bypass RLS.)
//
// CONTRAT DE PAYLOAD attendu (POST JSON) — l'EA doit envoyer exactement :
// {
//   "token": "<connect_token du compte>",
//   "account": {                       // optionnel après la 1re connexion
//     "login": 12345678, "server": "Broker-Live",
//     "company": "Broker Ltd", "currency": "USD", "leverage": 100
//   },
//   "snapshot": {
//     "ts": "2026-06-16T14:05:00Z",    // horodatage
//     "server_date": "2026-06-16",     // DATE serveur broker (l'EA la calcule)
//     "balance": 10250.00,
//     "equity": 10180.50,
//     "margin": 120.00,
//     "open_pl": -69.50,
//     "has_open_positions": true
//   },
//   "deals": [ /* trades clôturés depuis le dernier envoi, optionnel */
//     { "ticket": 99, "position_id": 99, "symbol": "EURUSD", "side": "buy",
//       "volume": 0.10, "price_open": 1.0800, "price_close": 1.0815,
//       "profit": 15.00, "commission": -0.7, "swap": 0,
//       "opened_at": "2026-06-16T12:00:00Z", "closed_at": "2026-06-16T13:30:00Z" }
//   ]
// }
// =====================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const num = (v: unknown) => (v == null ? 0 : Number(v));
const clamp0 = (v: number) => (v < 0 ? 0 : v);

// ---------------------------------------------------------------------
// Moteur de validation — fonction pure.
// Reçoit les règles figées du challenge + l'état précédent + le snapshot,
// renvoie les métriques recalculées et l'éventuelle transition de statut.
// ---------------------------------------------------------------------
type Rules = {
  starting_balance: number;
  profit_target_pct: number;
  max_total_dd_pct: number;
  dd_type: "static" | "trailing";
  max_daily_dd_pct: number | null;
  min_trading_days: number;
  max_trading_days: number | null;
};

function evaluate(opts: {
  rules: Rules;
  equity: number;
  balance: number;
  prevPeak: number;          // peak_equity connu (>= starting_balance)
  dayBaseline: number;       // equity au début du jour serveur courant
  tradingDays: number;
}) {
  const { rules, equity, balance, prevPeak, dayBaseline, tradingDays } = opts;
  const start = rules.starting_balance;

  const peak_equity = Math.max(prevPeak, equity);
  const profit_pct = ((equity - start) / start) * 100;

  // ---- Drawdown total ----
  let total_dd_pct: number;
  let totalFloor: number;
  if (rules.dd_type === "trailing") {
    totalFloor = peak_equity * (1 - rules.max_total_dd_pct / 100);
    total_dd_pct = clamp0(((peak_equity - equity) / peak_equity) * 100);
  } else {
    totalFloor = start * (1 - rules.max_total_dd_pct / 100);
    total_dd_pct = clamp0(((start - equity) / start) * 100);
  }
  const totalBreach = equity < totalFloor;

  // ---- Drawdown journalier ----
  let daily_dd_pct = 0;
  let dailyBreach = false;
  if (rules.max_daily_dd_pct != null && dayBaseline > 0) {
    daily_dd_pct = clamp0(((dayBaseline - equity) / dayBaseline) * 100);
    dailyBreach = daily_dd_pct > rules.max_daily_dd_pct;
  }

  // ---- Transition de statut ----
  let status: "in_progress" | "passed" | "failed" = "in_progress";
  let failed_reason: string | null = null;

  if (totalBreach) {
    status = "failed";
    failed_reason = "total_breach";
  } else if (dailyBreach) {
    status = "failed";
    failed_reason = "daily_breach";
  } else if (
    rules.max_trading_days != null &&
    tradingDays > rules.max_trading_days
  ) {
    status = "failed";
    failed_reason = "time_limit";
  } else if (
    profit_pct >= rules.profit_target_pct &&
    tradingDays >= rules.min_trading_days
  ) {
    status = "passed";
  }

  return {
    peak_equity,
    profit_pct,
    total_dd_pct,
    daily_dd_pct,
    status,
    failed_reason,
    dailyBreach,
    totalBreach,
  };
}

// ---------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }

  const token = body?.token;
  const snap = body?.snapshot;
  if (!token || !snap) return json({ error: "token & snapshot required" }, 400);

  // 1) Authentifier le compte par connect_token
  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("connect_token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (!account) return json({ error: "unknown token" }, 401);

  // 2) Heartbeat + métadonnées compte (remplies si absentes)
  const acctPatch: Record<string, unknown> = { last_seen_at: new Date().toISOString() };
  if (body.account) {
    if (account.mt5_login == null) acctPatch.mt5_login = body.account.login;
    if (!account.broker_server) acctPatch.broker_server = body.account.server;
    if (!account.broker_company) acctPatch.broker_company = body.account.company;
    if (!account.currency) acctPatch.currency = body.account.currency;
    if (account.leverage == null) acctPatch.leverage = body.account.leverage;
  }
  await supabase.from("accounts").update(acctPatch).eq("id", account.id);

  // 3) Challenge actif ?
  const { data: ch } = await supabase
    .from("challenges")
    .select("*")
    .eq("account_id", account.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (!ch) return json({ ok: true, challenge: null }); // connecté, pas de challenge

  const equity = num(snap.equity);
  const balance = num(snap.balance);
  const serverDate: string = snap.server_date;
  const hasActivity = !!snap.has_open_positions || (Array.isArray(body.deals) && body.deals.length > 0);

  // 4) Snapshot d'equity
  await supabase.from("equity_snapshots").insert({
    challenge_id: ch.id,
    ts: snap.ts ?? new Date().toISOString(),
    balance,
    equity,
    margin: num(snap.margin),
    open_pl: num(snap.open_pl),
  });

  // 5) Trades clôturés
  if (Array.isArray(body.deals) && body.deals.length) {
    await supabase.from("deals").upsert(
      body.deals.map((d: any) => ({
        challenge_id: ch.id,
        ticket: d.ticket,
        position_id: d.position_id,
        symbol: d.symbol,
        side: d.side,
        volume: num(d.volume),
        price_open: num(d.price_open),
        price_close: num(d.price_close),
        profit: num(d.profit),
        commission: num(d.commission),
        swap: num(d.swap),
        opened_at: d.opened_at,
        closed_at: d.closed_at,
      })),
      { onConflict: "challenge_id,ticket", ignoreDuplicates: true },
    );
  }

  // 6) Daily record — baseline = equity au 1er snapshot du jour serveur
  const { data: existingDay } = await supabase
    .from("daily_records")
    .select("*")
    .eq("challenge_id", ch.id)
    .eq("trade_date", serverDate)
    .maybeSingle();

  let dayBaseline: number;
  if (!existingDay) {
    dayBaseline = equity;
    await supabase.from("daily_records").insert({
      challenge_id: ch.id,
      trade_date: serverDate,
      baseline_equity: equity,
      lowest_equity: equity,
      daily_dd_pct: 0,
      has_trades: hasActivity,
    });
    await supabase.from("challenge_events").insert({
      challenge_id: ch.id,
      type: "day_started",
      message: `Nouvelle journée serveur ${serverDate}`,
    });
  } else {
    dayBaseline = num(existingDay.baseline_equity);
  }

  // 7) Nombre de jours de trading (jours avec activité)
  let tradingDays = 0;
  {
    const { count } = await supabase
      .from("daily_records")
      .select("id", { count: "exact", head: true })
      .eq("challenge_id", ch.id)
      .eq("has_trades", true);
    tradingDays = count ?? 0;
    // si le jour courant vient de passer "actif", il n'est pas encore compté
    if (hasActivity && (!existingDay || !existingDay.has_trades)) tradingDays += 1;
  }

  // 8) État précédent (peak_equity)
  const { data: prevMetrics } = await supabase
    .from("challenge_metrics")
    .select("peak_equity")
    .eq("challenge_id", ch.id)
    .maybeSingle();
  const prevPeak = prevMetrics ? num(prevMetrics.peak_equity) : num(ch.starting_balance);

  // 9) Évaluation
  const rules: Rules = {
    starting_balance: num(ch.starting_balance),
    profit_target_pct: num(ch.profit_target_pct),
    max_total_dd_pct: num(ch.max_total_dd_pct),
    dd_type: ch.dd_type,
    max_daily_dd_pct: ch.max_daily_dd_pct == null ? null : num(ch.max_daily_dd_pct),
    min_trading_days: num(ch.min_trading_days),
    max_trading_days: ch.max_trading_days == null ? null : num(ch.max_trading_days),
  };
  const r = evaluate({ rules, equity, balance, prevPeak, dayBaseline, tradingDays });

  // 10) Mise à jour des métriques temps réel (Realtime → Dashboard)
  await supabase.from("challenge_metrics").upsert({
    challenge_id: ch.id,
    current_balance: balance,
    current_equity: equity,
    peak_equity: r.peak_equity,
    profit_pct: r.profit_pct,
    total_dd_pct: r.total_dd_pct,
    daily_dd_pct: r.daily_dd_pct,
    trading_days: tradingDays,
    updated_at: new Date().toISOString(),
  });

  // 11) Mise à jour du daily_record (plus bas du jour + dd)
  await supabase
    .from("daily_records")
    .update({
      lowest_equity: Math.min(num(existingDay?.lowest_equity ?? equity), equity),
      daily_dd_pct: r.daily_dd_pct,
      has_trades: hasActivity || existingDay?.has_trades || false,
      breached: r.dailyBreach,
    })
    .eq("challenge_id", ch.id)
    .eq("trade_date", serverDate);

  // 12) Transition de statut → on clôture le challenge + event
  if (r.status !== "in_progress") {
    await supabase
      .from("challenges")
      .update({
        status: r.status,
        failed_reason: r.failed_reason,
        completed_at: new Date().toISOString(),
      })
      .eq("id", ch.id);

    if (r.status === "passed") {
      await supabase.from("challenge_events").insert([
        { challenge_id: ch.id, type: "target_hit", message: `Objectif atteint (+${r.profit_pct.toFixed(2)}%)` },
        { challenge_id: ch.id, type: "passed", message: "Challenge validé 🎉" },
      ]);
    } else {
      await supabase.from("challenge_events").insert([
        { challenge_id: ch.id, type: r.failed_reason === "daily_breach" ? "daily_breach" : "total_breach",
          message: `Limite dépassée (${r.failed_reason})` },
        { challenge_id: ch.id, type: "failed", message: "Challenge échoué" },
      ]);
    }
  }

  return json({
    ok: true,
    challenge_id: ch.id,
    status: r.status,
    profit_pct: Number(r.profit_pct.toFixed(2)),
    total_dd_pct: Number(r.total_dd_pct.toFixed(2)),
    daily_dd_pct: Number(r.daily_dd_pct.toFixed(2)),
    trading_days: tradingDays,
  });
});
