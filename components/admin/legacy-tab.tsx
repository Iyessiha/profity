"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BroadcastPanel,
  CreditsAdminPanel,
  ExportPanel,
  InvoicesAdminPanel,
  LogsPanel,
  SettingsAdminPanel,
  SignalsPanel,
  TreasuryPanel,
} from "./legacy-panels";

export type LegacyTabKey =
  | "treasury"
  | "broadcast"
  | "signals"
  | "invoices"
  | "credits"
  | "settings"
  | "export"
  | "logs";

// Les panneaux legacy lisent des variables CSS (--bg2, --bd, --ac…) qui n'étaient
// définies nulle part dans le repo. On les déclare ici, sur le conteneur.
const THEME = {
  "--bg1": "#050a12",
  "--bg2": "#0a0f1a",
  "--bd": "rgba(0,255,178,0.12)",
  "--ac": "#00D4FF",
  "--ac2": "#FF3A5C",
  "--ac3": "#C9A84C",
  "--ok": "#00FFB2",
  "--ora": "#FF9F1C",
  "--red": "#FF3A5C",
  "--tx0": "#E8F4F8",
  "--tx1": "rgba(232,244,248,0.75)",
  "--tx2": "rgba(232,244,248,0.55)",
  "--tx3": "rgba(232,244,248,0.35)",
} as CSSProperties;

const BODY = "'Rajdhani', sans-serif";
const HUD = "'Orbitron', monospace";

export function LegacyTab({ tab }: { tab: LegacyTabKey }) {
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? "");
    });
  }, []);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <div style={{ ...THEME, minHeight: "100vh", padding: "28px 32px", fontFamily: BODY, color: "var(--tx1)" }}>
      {token === null ? (
        <div style={{ fontFamily: HUD, fontSize: 11, color: "var(--ac2)", letterSpacing: 4 }}>
          CHARGEMENT...
        </div>
      ) : token === "" ? (
        <div style={{ fontFamily: BODY, color: "var(--red)" }}>Session expirée — reconnecte-toi.</div>
      ) : (
        <Panel tab={tab} token={token} showToast={showToast} />
      )}

      {toast && (
        <div
          role="status"
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 50,
            padding: "12px 18px", borderRadius: 8, fontFamily: BODY, fontSize: 14,
            background: "var(--bg2)",
            border: `1px solid ${toast.ok ? "var(--ok)" : "var(--red)"}`,
            color: toast.ok ? "var(--ok)" : "var(--red)",
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Panel({
  tab,
  token,
  showToast,
}: {
  tab: LegacyTabKey;
  token: string;
  showToast: (msg: string, ok: boolean) => void;
}) {
  switch (tab) {
    case "treasury":
      return <TreasuryPanel token={token} />;
    case "broadcast":
      return <BroadcastPanel token={token} showToast={showToast} />;
    case "signals":
      return <SignalsPanel token={token} showToast={showToast} />;
    case "invoices":
      return <InvoicesAdminPanel token={token} showToast={showToast} />;
    case "credits":
      return <CreditsAdminPanel token={token} showToast={showToast} />;
    case "settings":
      return <SettingsAdminPanel token={token} showToast={showToast} />;
    case "export":
      return <ExportPanel token={token} />;
    case "logs":
      return <LogsPanel token={token} />;
  }
}
