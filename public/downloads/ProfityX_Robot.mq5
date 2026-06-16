//+------------------------------------------------------------------+
//|                                               ProfityX_Robot.mq5 |
//|                              MonWe Infinity LLC — ProfityX        |
//|                                                                   |
//|  Stratégie : Trend-Follow structurel (EMA50/200 + Stochastique)  |
//|  Prop Firm Guard : position sizing adaptatif, auto-stop sur       |
//|  breach et sur objectif atteint                                   |
//|  Données : pousse snapshot + deals vers /ingest toutes les 10 s  |
//|                                                                   |
//|  Fonctionne sur TOUS les instruments — configurable via inputs.   |
//|                                                                   |
//|  WHITELIST :                                                      |
//|  MT5 > Outils > Options > Expert Advisors > WebRequest           |
//|  Ajouter : https://<ref>.supabase.co                             |
//+------------------------------------------------------------------+
#property copyright "MonWe Infinity LLC"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>

CTrade        trade;
CPositionInfo pos;

//=== INPUTS ============================================================

input group "=== CONNEXION PROFITYX ==="
input string InpIngestUrl  = "https://<ref>.supabase.co/functions/v1/ingest";
input string InpToken      = "";

input group "=== STRATEGIE ==="
input ENUM_TIMEFRAMES InpTrendTF      = PERIOD_H1;
input ENUM_TIMEFRAMES InpSignalTF     = PERIOD_M15;
input int    InpEmaFast               = 50;
input int    InpEmaSlow               = 200;
input int    InpStochK                = 5;
input int    InpStochD                = 3;
input int    InpStochSlowing          = 3;
input int    InpAtrPeriod             = 14;
input double InpAtrMult               = 1.5;
input double InpRR                    = 2.0;
input bool   InpBreakEven             = true;

input group "=== RISQUE ==="
input double InpRiskPct               = 1.0;
input double InpMaxSpreadPoints       = 30;
input int    InpMagic                 = 202501;

input group "=== FILTRE HORAIRE ==="
input bool   InpUseTimeFilter         = false;
input int    InpStartHour             = 8;
input int    InpEndHour               = 20;

input group "=== PROP FIRM GUARD ==="
input double InpStartBalance          = 10000;
input double InpProfitTargetPct       = 8.0;
input double InpMaxTotalDDPct         = 10.0;
input double InpMaxDailyDDPct         = 5.0;
input double InpDDGuardBuffer         = 1.5;
input bool   InpStopOnTargetHit       = true;

input group "=== DONNEES ==="
input int    InpDataIntervalSec       = 10;

//=======================================================================

int    g_hEmaFast     = INVALID_HANDLE;
int    g_hEmaSlow     = INVALID_HANDLE;
int    g_hStoch       = INVALID_HANDLE;
int    g_hAtr         = INVALID_HANDLE;

datetime g_lastDealScan  = 0;
datetime g_dayStart      = 0;
double   g_dayBaseEquity = 0;
double   g_peakEquity    = 0;
bool     g_tradingAllowed= true;
int      g_timerTick     = 0;

//+------------------------------------------------------------------+
int OnInit()
{
   if(StringLen(InpToken) < 8)
   {
      Alert("ProfityX Robot : connect_token manquant dans les parametres.");
      return INIT_PARAMETERS_INCORRECT;
   }

   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(10);
   trade.SetTypeFilling(ORDER_FILLING_FOK);

   g_hEmaFast = iMA(_Symbol, InpTrendTF, InpEmaFast, 0, MODE_EMA, PRICE_CLOSE);
   g_hEmaSlow = iMA(_Symbol, InpTrendTF, InpEmaSlow, 0, MODE_EMA, PRICE_CLOSE);
   g_hStoch   = iStochastic(_Symbol, InpSignalTF, InpStochK, InpStochD,
                             InpStochSlowing, MODE_SMA, STO_LOWHIGH);
   g_hAtr     = iATR(_Symbol, InpSignalTF, InpAtrPeriod);

   if(g_hEmaFast == INVALID_HANDLE || g_hEmaSlow == INVALID_HANDLE ||
      g_hStoch   == INVALID_HANDLE || g_hAtr     == INVALID_HANDLE)
   {
      Alert("ProfityX Robot : erreur creation handles indicateurs.");
      return INIT_FAILED;
   }

   g_peakEquity   = MathMax(AccountInfoDouble(ACCOUNT_EQUITY), InpStartBalance);
   g_lastDealScan = TimeCurrent() - 60;

   InitDayBaseline();
   EventSetTimer(InpDataIntervalSec < 5 ? 5 : InpDataIntervalSec);

   PrintFormat("ProfityX Robot | %s | Risque %.1f%% | RR 1:%.1f | Guard ON",
               _Symbol, InpRiskPct, InpRR);
   SendUpdate();
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) { EventKillTimer(); }

void OnTimer()
{
   g_timerTick++;
   CheckDayReset();
   UpdateGuard();
   if(g_timerTick % 2 == 0 && g_tradingAllowed)
      CheckAndTrade();
   SendUpdate();
}

void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &req,
                        const MqlTradeResult  &res)
{
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
      SendUpdate();
}

void OnTick()
{
   if(InpBreakEven) ManageBreakEven();
}

//+------------------------------------------------------------------+
//  GESTION JOURNEE
//+------------------------------------------------------------------+
void InitDayBaseline()
{
   MqlDateTime dt;
   TimeToStruct(TimeTradeServer(), dt);
   dt.hour = 0; dt.min = 0; dt.sec = 0;
   g_dayStart      = StructToTime(dt);
   g_dayBaseEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   PrintFormat("ProfityX Robot : nouveau jour, baseline = %.2f", g_dayBaseEquity);
}

void CheckDayReset()
{
   MqlDateTime now, day;
   TimeToStruct(TimeTradeServer(), now);
   TimeToStruct(g_dayStart, day);
   if(now.day != day.day || now.mon != day.mon)
      InitDayBaseline();
}

//+------------------------------------------------------------------+
//  PROP FIRM GUARD
//+------------------------------------------------------------------+
void UpdateGuard()
{
   double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
   g_peakEquity   = MathMax(g_peakEquity, equity);

   double totalDD = g_peakEquity > 0 ?
      (g_peakEquity - equity) / g_peakEquity * 100.0 : 0;
   double dailyDD = g_dayBaseEquity > 0 ?
      MathMax(0, (g_dayBaseEquity - equity) / g_dayBaseEquity * 100.0) : 0;
   double profitPct = (equity - InpStartBalance) / InpStartBalance * 100.0;

   // Objectif atteint
   if(InpStopOnTargetHit && profitPct >= InpProfitTargetPct)
   {
      if(g_tradingAllowed)
      {
         g_tradingAllowed = false;
         Alert(StringFormat("ProfityX Robot : OBJECTIF +%.2f%% ATTEINT — trading arrete.", profitPct));
         CloseAll();
      }
      return;
   }

   bool limitDaily = dailyDD >= (InpMaxDailyDDPct - InpDDGuardBuffer);
   bool limitTotal = totalDD >= (InpMaxTotalDDPct  - InpDDGuardBuffer);

   if(limitDaily || limitTotal)
   {
      if(g_tradingAllowed)
      {
         g_tradingAllowed = false;
         string reason = limitDaily ? "DD journalier" : "DD total";
         Alert(StringFormat("ProfityX Robot : GUARD — %s %.2f%% — trading suspendu.",
               reason, limitDaily ? dailyDD : totalDD));
         CloseAll();
      }
   }
   else if(!g_tradingAllowed && profitPct < InpProfitTargetPct)
   {
      g_tradingAllowed = true;
   }
}

void CloseAll()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong t = PositionGetTicket(i);
      if(PositionSelectByTicket(t))
         if(PositionGetString(POSITION_SYMBOL) == _Symbol &&
            PositionGetInteger(POSITION_MAGIC) == InpMagic)
            trade.PositionClose(t);
   }
}

//+------------------------------------------------------------------+
//  SIGNAL & TRADE
//+------------------------------------------------------------------+
void CheckAndTrade()
{
   if(HasOpenPos())           return;
   if(!InTradingHours())      return;
   if(!SpreadOk())            return;

   ENUM_ORDER_TYPE sig = GetSignal();
   if(sig == ORDER_TYPE_BUY || sig == ORDER_TYPE_SELL)
      OpenTrade(sig);
}

bool HasOpenPos()
{
   for(int i = 0; i < PositionsTotal(); i++)
      if(PositionGetTicket(i) > 0 &&
         PositionGetString(POSITION_SYMBOL)  == _Symbol &&
         PositionGetInteger(POSITION_MAGIC)  == InpMagic)
         return true;
   return false;
}

bool InTradingHours()
{
   if(!InpUseTimeFilter) return true;
   MqlDateTime dt;
   TimeToStruct(TimeTradeServer(), dt);
   return (dt.hour >= InpStartHour && dt.hour < InpEndHour);
}

bool SpreadOk()
{
   return (long)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD) <= (long)InpMaxSpreadPoints;
}

// --- Signal : EMA trend H1 + Stochastique M15 croisement ---
ENUM_ORDER_TYPE GetSignal()
{
   double emaF[2], emaS[2];
   if(CopyBuffer(g_hEmaFast, 0, 0, 2, emaF) < 2) return ORDER_TYPE_CLOSE_BY;
   if(CopyBuffer(g_hEmaSlow, 0, 0, 2, emaS) < 2) return ORDER_TYPE_CLOSE_BY;

   bool trendUp   = emaF[1] > emaS[1];
   bool trendDown = emaF[1] < emaS[1];

   double kBuf[3], dBuf[3];
   if(CopyBuffer(g_hStoch, 0, 0, 3, kBuf) < 3) return ORDER_TYPE_CLOSE_BY;
   if(CopyBuffer(g_hStoch, 1, 0, 3, dBuf) < 3) return ORDER_TYPE_CLOSE_BY;

   // Croisement haussier depuis zone de survente (< 25)
   bool buySignal  = trendUp   && kBuf[2] < dBuf[2] && kBuf[1] > dBuf[1] && kBuf[2] < 25.0;
   // Croisement baissier depuis zone de surachat (> 75)
   bool sellSignal = trendDown && kBuf[2] > dBuf[2] && kBuf[1] < dBuf[1] && kBuf[2] > 75.0;

   if(buySignal)  return ORDER_TYPE_BUY;
   if(sellSignal) return ORDER_TYPE_SELL;
   return ORDER_TYPE_CLOSE_BY;
}

void OpenTrade(ENUM_ORDER_TYPE otype)
{
   double atr[1];
   if(CopyBuffer(g_hAtr, 0, 1, 1, atr) < 1) return;

   int    digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   double slDist = atr[0] * InpAtrMult;
   double tpDist = slDist * InpRR;
   double ask    = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid    = SymbolInfoDouble(_Symbol, SYMBOL_BID);

   double entry, sl, tp;
   if(otype == ORDER_TYPE_BUY)
   {
      entry = ask;
      sl    = NormalizeDouble(entry - slDist, digits);
      tp    = NormalizeDouble(entry + tpDist, digits);
   }
   else
   {
      entry = bid;
      sl    = NormalizeDouble(entry + slDist, digits);
      tp    = NormalizeDouble(entry - tpDist, digits);
   }

   double lot = CalcLot(slDist);
   if(lot <= 0) { Print("ProfityX Robot : lot = 0, trade annule."); return; }

   string cmnt = "ProfityX|" + (otype == ORDER_TYPE_BUY ? "BUY" : "SELL");

   if(otype == ORDER_TYPE_BUY)  trade.Buy (lot, _Symbol, entry, sl, tp, cmnt);
   else                          trade.Sell(lot, _Symbol, entry, sl, tp, cmnt);

   if(trade.ResultRetcode() == TRADE_RETCODE_DONE)
      PrintFormat("ProfityX Robot : %s | Lot %.2f | Entry %.5f | SL %.5f | TP %.5f",
                  cmnt, lot, entry, sl, tp);
   else
      PrintFormat("ProfityX Robot : ERREUR %d — %s", trade.ResultRetcode(), trade.ResultComment());
}

// --- Sizing adaptatif : réduit quand on approche des limites ---
double CalcLot(double slDist)
{
   double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
   double dailyDD = g_dayBaseEquity > 0 ?
      MathMax(0, (g_dayBaseEquity - equity) / g_dayBaseEquity * 100.0) : 0;
   double totalDD = g_peakEquity > 0 ?
      MathMax(0, (g_peakEquity - equity) / g_peakEquity * 100.0) : 0;

   double dailyRoom   = MathMax(0.1, InpMaxDailyDDPct - dailyDD);
   double totalRoom   = MathMax(0.1, InpMaxTotalDDPct - totalDD);
   double effectRisk  = MathMin(InpRiskPct, MathMin(dailyRoom, totalRoom) * 0.4);
   double riskAmt     = equity * effectRisk / 100.0;

   double tickVal  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSz   = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tickVal <= 0 || tickSz <= 0) return 0;

   double riskPerLot = (slDist / tickSz) * tickVal;
   if(riskPerLot <= 0) return 0;

   double lot  = MathFloor((riskAmt / riskPerLot) /
                  SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP)) *
                  SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

   return MathMax(SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN),
          MathMin(SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX), lot));
}

// --- BreakEven : SL au prix d'entrée dès le premier 1:1 ---
void ManageBreakEven()
{
   for(int i = 0; i < PositionsTotal(); i++)
   {
      ulong t = PositionGetTicket(i);
      if(!PositionSelectByTicket(t)) continue;
      if(PositionGetString (POSITION_SYMBOL) != _Symbol)  continue;
      if(PositionGetInteger(POSITION_MAGIC)  != InpMagic) continue;

      double open   = PositionGetDouble(POSITION_PRICE_OPEN);
      double slNow  = PositionGetDouble(POSITION_SL);
      double tp     = PositionGetDouble(POSITION_TP);
      long   ptype  = PositionGetInteger(POSITION_TYPE);
      int    digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
      double pt     = SymbolInfoDouble(_Symbol, SYMBOL_POINT);

      if(ptype == POSITION_TYPE_BUY)
      {
         double half  = open + (tp - open) * 0.5;
         double besl  = NormalizeDouble(open + pt, digits);
         if(SymbolInfoDouble(_Symbol, SYMBOL_BID) >= half && slNow < besl)
            trade.PositionModify(t, besl, tp);
      }
      else
      {
         double half  = open - (open - tp) * 0.5;
         double besl  = NormalizeDouble(open - pt, digits);
         if(SymbolInfoDouble(_Symbol, SYMBOL_ASK) <= half && slNow > besl)
            trade.PositionModify(t, besl, tp);
      }
   }
}

//+------------------------------------------------------------------+
//  ENVOI DONNEES
//+------------------------------------------------------------------+
string Esc(string s)
{
   StringReplace(s, "\\", "\\\\");
   StringReplace(s, "\"", "\\\"");
   return s;
}

string IsoUtc(datetime t)
{
   MqlDateTime d; TimeToStruct(t, d);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",
                       d.year, d.mon, d.day, d.hour, d.min, d.sec);
}

string SrvDate()
{
   MqlDateTime d; TimeToStruct(TimeTradeServer(), d);
   return StringFormat("%04d-%02d-%02d", d.year, d.mon, d.day);
}

string DealsJson()
{
   string out = "";
   datetime now = TimeCurrent();
   if(!HistorySelect(g_lastDealScan, now)) return "[]";
   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong tk = HistoryDealGetTicket(i);
      if(tk == 0) continue;
      long entry = HistoryDealGetInteger(tk, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_INOUT) continue;
      string side = (HistoryDealGetInteger(tk, DEAL_TYPE) == DEAL_TYPE_BUY) ? "buy" : "sell";
      string rec  = StringFormat(
         "{\"ticket\":%I64u,\"position_id\":%I64d,\"symbol\":\"%s\",\"side\":\"%s\","
         "\"volume\":%.2f,\"price_close\":%.5f,\"profit\":%.2f,"
         "\"commission\":%.2f,\"swap\":%.2f,\"closed_at\":\"%s\"}",
         tk,
         HistoryDealGetInteger(tk, DEAL_POSITION_ID),
         Esc(HistoryDealGetString(tk, DEAL_SYMBOL)), side,
         HistoryDealGetDouble(tk, DEAL_VOLUME),
         HistoryDealGetDouble(tk, DEAL_PRICE),
         HistoryDealGetDouble(tk, DEAL_PROFIT),
         HistoryDealGetDouble(tk, DEAL_COMMISSION),
         HistoryDealGetDouble(tk, DEAL_SWAP),
         IsoUtc((datetime)HistoryDealGetInteger(tk, DEAL_TIME)));
      if(out != "") out += ",";
      out += rec;
   }
   g_lastDealScan = now;
   return "[" + out + "]";
}

void SendUpdate()
{
   if(StringLen(InpToken) < 8) return;

   double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
   double dailyDD = g_dayBaseEquity > 0 ?
      MathMax(0, (g_dayBaseEquity - equity) / g_dayBaseEquity * 100.0) : 0;

   string json = StringFormat(
      "{\"token\":\"%s\","
       "\"account\":{\"login\":%I64d,\"server\":\"%s\",\"company\":\"%s\","
                    "\"currency\":\"%s\",\"leverage\":%I64d},"
       "\"snapshot\":{\"ts\":\"%s\",\"server_date\":\"%s\","
                     "\"balance\":%.2f,\"equity\":%.2f,\"margin\":%.2f,"
                     "\"open_pl\":%.2f,\"has_open_positions\":%s},"
       "\"robot\":{\"trading_allowed\":%s,\"daily_dd_pct\":%.2f,"
                  "\"peak_equity\":%.2f,\"risk_pct\":%.2f},"
       "\"deals\":%s}",
      Esc(InpToken),
      AccountInfoInteger(ACCOUNT_LOGIN),
      Esc(AccountInfoString(ACCOUNT_SERVER)),
      Esc(AccountInfoString(ACCOUNT_COMPANY)),
      Esc(AccountInfoString(ACCOUNT_CURRENCY)),
      AccountInfoInteger(ACCOUNT_LEVERAGE),
      IsoUtc(TimeGMT()), SrvDate(),
      AccountInfoDouble(ACCOUNT_BALANCE), equity,
      AccountInfoDouble(ACCOUNT_MARGIN),
      AccountInfoDouble(ACCOUNT_PROFIT),
      PositionsTotal() > 0 ? "true" : "false",
      g_tradingAllowed ? "true" : "false",
      dailyDD, g_peakEquity, InpRiskPct,
      DealsJson());

   char post[], result[];
   string hdrs;
   int len = StringToCharArray(json, post, 0, WHOLE_ARRAY, CP_UTF8) - 1;
   if(len < 0) len = 0;
   ArrayResize(post, len);

   ResetLastError();
   int code = WebRequest("POST", InpIngestUrl, "Content-Type: application/json\r\n",
                         5000, post, result, hdrs);
   if(code == -1 && GetLastError() != 4014)
      Print("ProfityX Robot WebRequest erreur ", GetLastError());
}
//+------------------------------------------------------------------+
