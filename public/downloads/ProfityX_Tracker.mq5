//+------------------------------------------------------------------+
//|                                              ProfityX_Tracker.mq5 |
//|                              MonWe Infinity LLC — ProfityX         |
//|                                                                    |
//|  Rôle : pousser en temps réel l'état du compte (balance, equity,  |
//|         marge, P/L flottant) et les trades clôturés vers l'Edge   |
//|         Function /ingest de ProfityX, qui valide le challenge.    |
//|                                                                    |
//|  /!\ IMPORTANT — AUTORISER L'URL :                                 |
//|     MetaTrader 5 → Outils → Options → Expert Advisors →            |
//|     cocher "Autoriser les WebRequest pour les URL listées" et      |
//|     ajouter EXACTEMENT le domaine de ton projet Supabase, ex :     |
//|       https://<ref>.supabase.co                                    |
//|     Sans ça, WebRequest renvoie -1 (erreur 4014/4060).             |
//|                                                                    |
//|  Conseil : faire tourner l'EA sur un VPS pour un suivi 24/7.       |
//+------------------------------------------------------------------+
#property copyright "MonWe Infinity LLC"
#property version   "1.00"
#property strict

//--- Paramètres saisis par l'abonné -------------------------------------
input string InpIngestUrl  = "https://<ref>.supabase.co/functions/v1/ingest"; // URL de l'Edge Function
input string InpToken      = "";   // connect_token du compte (copié depuis ProfityX)
input int    InpIntervalSec = 10;  // fréquence d'envoi (5 à 15 s recommandé)

//--- État interne -------------------------------------------------------
datetime g_lastDealScan = 0;       // borne basse pour scanner l'historique des deals

//+------------------------------------------------------------------+
int OnInit()
{
   if(StringLen(InpToken) < 8)
   {
      Print("ProfityX: connect_token manquant ou invalide. Renseigne-le dans les paramètres de l'EA.");
      return(INIT_PARAMETERS_INCORRECT);
   }
   g_lastDealScan = TimeCurrent() - 60; // on regarde 1 min en arrière au démarrage
   EventSetTimer(InpIntervalSec < 5 ? 5 : InpIntervalSec);
   Print("ProfityX Tracker démarré. Envoi toutes les ", InpIntervalSec, " s vers ", InpIngestUrl);
   SendUpdate();                        // premier envoi immédiat (heartbeat + meta)
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) { EventKillTimer(); }

//--- Timer : envoi périodique ------------------------------------------
void OnTimer() { SendUpdate(); }

//--- Envoi immédiat dès qu'un deal est ajouté (réactivité) -------------
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest     &request,
                        const MqlTradeResult      &result)
{
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
      SendUpdate();
}

//+------------------------------------------------------------------+
//| Échappe les caractères spéciaux pour le JSON                      |
//+------------------------------------------------------------------+
string JsonEsc(string s)
{
   StringReplace(s, "\\", "\\\\");
   StringReplace(s, "\"", "\\\"");
   return s;
}

//+------------------------------------------------------------------+
//| Construit la liste JSON des deals clôturés non encore envoyés     |
//+------------------------------------------------------------------+
string BuildDealsJson()
{
   string deals = "";
   datetime now = TimeCurrent();
   if(!HistorySelect(g_lastDealScan, now)) return "[]";

   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;

      // on ne garde que les deals de SORTIE (réalisent le profit)
      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_INOUT) continue;

      long   dtype   = HistoryDealGetInteger(ticket, DEAL_TYPE);
      string side    = (dtype == DEAL_TYPE_BUY) ? "buy" : "sell";
      long   posId   = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      string symbol  = HistoryDealGetString (ticket, DEAL_SYMBOL);
      double vol     = HistoryDealGetDouble (ticket, DEAL_VOLUME);
      double price   = HistoryDealGetDouble (ticket, DEAL_PRICE);
      double profit  = HistoryDealGetDouble (ticket, DEAL_PROFIT);
      double comm    = HistoryDealGetDouble (ticket, DEAL_COMMISSION);
      double swap    = HistoryDealGetDouble (ticket, DEAL_SWAP);
      datetime dtime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);

      string obj = StringFormat(
         "{\"ticket\":%I64u,\"position_id\":%I64d,\"symbol\":\"%s\",\"side\":\"%s\","
         "\"volume\":%.2f,\"price_close\":%.5f,\"profit\":%.2f,\"commission\":%.2f,"
         "\"swap\":%.2f,\"closed_at\":\"%s\"}",
         ticket, posId, JsonEsc(symbol), side, vol, price, profit, comm, swap,
         IsoUtc(dtime));

      if(deals != "") deals += ",";
      deals += obj;
   }
   g_lastDealScan = now;
   return "[" + deals + "]";
}

//+------------------------------------------------------------------+
//| Date SERVEUR broker au format YYYY-MM-DD (pour le reset journalier)|
//+------------------------------------------------------------------+
string ServerDate()
{
   MqlDateTime dt;
   TimeToStruct(TimeTradeServer(), dt);
   return StringFormat("%04d-%02d-%02d", dt.year, dt.mon, dt.day);
}

//+------------------------------------------------------------------+
//| Horodatage en UTC réel (TimeGMT) au format ISO 8601               |
//+------------------------------------------------------------------+
string IsoUtc(datetime t)
{
   MqlDateTime dt;
   TimeToStruct(t, dt);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",
                       dt.year, dt.mon, dt.day, dt.hour, dt.min, dt.sec);
}

//+------------------------------------------------------------------+
//| Construit le payload complet et l'envoie via WebRequest           |
//+------------------------------------------------------------------+
void SendUpdate()
{
   long   login    = AccountInfoInteger(ACCOUNT_LOGIN);
   string server   = AccountInfoString (ACCOUNT_SERVER);
   string company  = AccountInfoString (ACCOUNT_COMPANY);
   string currency = AccountInfoString (ACCOUNT_CURRENCY);
   long   leverage = AccountInfoInteger(ACCOUNT_LEVERAGE);

   double balance  = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity   = AccountInfoDouble(ACCOUNT_EQUITY);
   double margin   = AccountInfoDouble(ACCOUNT_MARGIN);
   double floatPL  = AccountInfoDouble(ACCOUNT_PROFIT);
   bool   hasPos   = (PositionsTotal() > 0);

   string deals = BuildDealsJson();

   string json = StringFormat(
      "{"
        "\"token\":\"%s\","
        "\"account\":{\"login\":%I64d,\"server\":\"%s\",\"company\":\"%s\","
                     "\"currency\":\"%s\",\"leverage\":%I64d},"
        "\"snapshot\":{\"ts\":\"%s\",\"server_date\":\"%s\","
                      "\"balance\":%.2f,\"equity\":%.2f,\"margin\":%.2f,"
                      "\"open_pl\":%.2f,\"has_open_positions\":%s},"
        "\"deals\":%s"
      "}",
      JsonEsc(InpToken), login, JsonEsc(server), JsonEsc(company),
      JsonEsc(currency), leverage,
      IsoUtc(TimeGMT()), ServerDate(),
      balance, equity, margin, floatPL, (hasPos ? "true" : "false"),
      deals);

   PostJson(json);
}

//+------------------------------------------------------------------+
//| Effectue le POST JSON et journalise le résultat                   |
//+------------------------------------------------------------------+
void PostJson(string json)
{
   char post[], result[];
   string result_headers;

   int len = StringToCharArray(json, post, 0, WHOLE_ARRAY, CP_UTF8) - 1; // retire le \0 final
   if(len < 0) len = 0;
   ArrayResize(post, len);

   string headers = "Content-Type: application/json\r\n";

   ResetLastError();
   int code = WebRequest("POST", InpIngestUrl, headers, 5000, post, result, result_headers);

   if(code == -1)
   {
      int err = GetLastError();
      PrintFormat("ProfityX: WebRequest a échoué (erreur %d). "
                  "Vérifie que l'URL %s est bien autorisée dans "
                  "Outils > Options > Expert Advisors.", err, InpIngestUrl);
      return;
   }

   if(code != 200)
   {
      string body = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
      PrintFormat("ProfityX: réponse HTTP %d — %s", code, body);
   }
}
//+------------------------------------------------------------------+
