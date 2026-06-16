// =====================================================================
// ProfityX — AccountSettings.tsx
// ---------------------------------------------------------------------
// Page paramètres d'un compte MT5 :
//   • Informations du compte (login, broker, devise, levier)
//   • Token de connexion (afficher / copier / régénérer)
//   • Activation / désactivation du compte
//   • Historique complet des challenges (tableau + détails)
//
// USAGE :
//   <AccountSettings accountId="<uuid>" />
// =====================================================================

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  AlertTriangle, Check, ChevronDown, ChevronUp,
  ClipboardCopy, Eye, EyeOff, Loader2,
  PauseCircle, PlayCircle, RefreshCw, ShieldCheck,
  TrendingUp, CalendarDays, Clock,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────
type ChallengeStatus = "in_progress" | "passed" | "failed";

interface Account {
  id: string;
  label: string | null;
  connect_token: string;
  mt5_login: number | null;
  broker_server: string | null;
  broker_company: string | null;
  currency: string | null;
  leverage: number | null;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
}

interface Challenge {
  id: string;
  preset_id: string | null;
  starting_balance: number;
  profit_target_pct: number;
  max_total_dd_pct: number;
  dd_type: "static" | "trailing";
  max_daily_dd_pct: number | null;
  min_trading_days: number;
  status: ChallengeStatus;
  failed_reason: string | null;
  started_at: string;
  completed_at: string | null;
  challenge_metrics?: {
    profit_pct: number;
    total_dd_pct: number;
    trading_days: number;
  } | null;
}

interface Props { accountId: string; }

const fmt = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)} %`;
const dateStr = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const dur = (a: string, b: string | null) => {
  const ms = (b ? new Date(b) : new Date()).getTime() - new Date(a).getTime();
  return Math.max(1, Math.round(ms / 86_400_000)) + " j";
};

// ─────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────
export default function AccountSettings({ accountId }: Props) {
  const [account, setAccount] = useState<Account | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenConfirm, setRegenConfirm] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
  const [saveLabel, setSaveLabel] = useState(false);
  const [editLabel, setEditLabel] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: acc, error: e } = await supabase
        .from("accounts").select("*").eq("id", accountId).single();
      if (e) throw e;
      setAccount(acc);
      setEditLabel(acc.label ?? "");

      const { data: chs } = await supabase
        .from("challenges")
        .select("*, challenge_metrics(profit_pct, total_dd_pct, trading_days)")
        .eq("account_id", accountId)
        .order("started_at", { ascending: false });
      if (chs) setChallenges(chs);
    } catch (e: any) {
      setError(e?.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => { load(); }, [load]);

  // ── Copier le token
  const copyToken = async () => {
    if (!account) return;
    await navigator.clipboard.writeText(account.connect_token);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  // ── Régénérer le token (via RPC ou update direct)
  const regenToken = async () => {
    if (!account) return;
    setRegenLoading(true);
    try {
      // génère un nouveau token côté serveur via une RPC (à créer en SQL)
      // fallback : update avec gen_random_bytes
      const { data, error: e } = await supabase.rpc("regenerate_connect_token", {
        p_account_id: accountId,
      });
      if (e) throw e;
      setAccount((a) => a ? { ...a, connect_token: data } : a);
      setRegenConfirm(false);
      setTokenVisible(true);
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de la régénération du token");
    } finally {
      setRegenLoading(false);
    }
  };

  // ── Activer / Désactiver le compte
  const toggleActive = async () => {
    if (!account) return;
    setPauseLoading(true);
    try {
      const { error: e } = await supabase
        .from("accounts")
        .update({ is_active: !account.is_active })
        .eq("id", accountId);
      if (e) throw e;
      setAccount((a) => a ? { ...a, is_active: !a.is_active } : a);
    } catch (e: any) {
      setError(e?.message ?? "Erreur");
    } finally {
      setPauseLoading(false);
    }
  };

  // ── Sauvegarder le label
  const saveAccountLabel = async () => {
    if (!account || editLabel.trim() === account.label) return;
    setSaveLabel(true);
    await supabase.from("accounts").update({ label: editLabel.trim() }).eq("id", accountId);
    setAccount((a) => a ? { ...a, label: editLabel.trim() } : a);
    setSaveLabel(false);
  };

  if (loading) return <LoadingBlock />;
  if (error || !account) return <ErrorBlock msg={error} onRetry={load} />;

  const activeChallenge = challenges.find((c) => c.status === "in_progress");
  const pastChallenges = challenges.filter((c) => c.status !== "in_progress");

  return (
    <div className="as-root">
      <style>{CSS}</style>

      {/* ── En-tête ── */}
      <header className="as-header">
        <div>
          <p className="as-eyebrow">Paramètres du compte</p>
          <h1 className="as-title">{account.label ?? `Compte ${account.mt5_login ?? "—"}`}</h1>
        </div>
        <span className={`as-badge ${account.is_active ? "active" : "paused"}`}>
          {account.is_active ? "Actif" : "En pause"}
        </span>
      </header>

      {/* ── Infos du compte ── */}
      <Section title="Informations MT5">
        <div className="as-info-grid">
          <InfoField label="Nom du compte">
            <div className="as-editable-row">
              <input
                className="as-input as-input-sm"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={saveAccountLabel}
                onKeyDown={(e) => e.key === "Enter" && saveAccountLabel()}
                maxLength={60}
              />
              {saveLabel && <Loader2 size={13} className="as-spin" />}
            </div>
          </InfoField>
          <InfoField label="Login MT5">
            <Mono>{account.mt5_login ?? "—"}</Mono>
          </InfoField>
          <InfoField label="Serveur broker">
            <Mono>{account.broker_server ?? "—"}</Mono>
          </InfoField>
          <InfoField label="Société">
            <Mono>{account.broker_company ?? "—"}</Mono>
          </InfoField>
          <InfoField label="Devise">
            <Mono>{account.currency ?? "—"}</Mono>
          </InfoField>
          <InfoField label="Levier">
            <Mono>{account.leverage ? `1:${account.leverage}` : "—"}</Mono>
          </InfoField>
          <InfoField label="Dernier signal">
            <Mono>
              {account.last_seen_at
                ? new Date(account.last_seen_at).toLocaleString("fr-FR")
                : "Jamais"}
            </Mono>
          </InfoField>
          <InfoField label="Créé le">
            <Mono>{dateStr(account.created_at)}</Mono>
          </InfoField>
        </div>
      </Section>

      {/* ── Token ── */}
      <Section title="Token de connexion">
        <p className="as-desc">
          Ce token est copié dans l'EA MT5 (paramètre <code className="as-code">InpToken</code>).
          Si tu le régénères, l'EA actuel sera déconnecté jusqu'à la mise à jour du paramètre.
        </p>
        <div className="as-token-row">
          <div className="as-token-field">
            {tokenVisible
              ? <code className="as-token-value">{account.connect_token}</code>
              : <span className="as-token-hidden">{'•'.repeat(32)}</span>
            }
          </div>
          <button className="as-icon-btn" onClick={() => setTokenVisible((v) => !v)}
            title={tokenVisible ? "Masquer" : "Révéler"}>
            {tokenVisible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button className="as-icon-btn" onClick={copyToken} title="Copier">
            {copied ? <Check size={15} /> : <ClipboardCopy size={15} />}
          </button>
        </div>

        {!regenConfirm ? (
          <button className="as-btn-ghost as-btn-danger-ghost"
            onClick={() => setRegenConfirm(true)}>
            <RefreshCw size={14} /> Régénérer le token
          </button>
        ) : (
          <div className="as-confirm-block">
            <AlertTriangle size={14} color="#FB5566" />
            <span>
              L'EA actuel sera déconnecté immédiatement.
              Il faudra mettre à jour son paramètre <code className="as-code">InpToken</code>.
            </span>
            <div className="as-confirm-actions">
              <button className="as-btn-ghost" onClick={() => setRegenConfirm(false)}>
                Annuler
              </button>
              <button className="as-btn-danger" onClick={regenToken} disabled={regenLoading}>
                {regenLoading
                  ? <><Loader2 size={13} className="as-spin" /> Régénération…</>
                  : "Confirmer la régénération"}
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* ── Activation ── */}
      <Section title="État du compte">
        <p className="as-desc">
          {account.is_active
            ? "Le compte accepte les signaux de l'EA. Désactive-le pour stopper l'ingestion sans supprimer le compte."
            : "Le compte est en pause. L'EA peut toujours envoyer des signaux, ils seront ignorés."}
        </p>
        <button
          className={`as-toggle-btn ${account.is_active ? "pause" : "resume"}`}
          onClick={toggleActive}
          disabled={pauseLoading}
        >
          {pauseLoading
            ? <Loader2 size={15} className="as-spin" />
            : account.is_active
              ? <><PauseCircle size={15} /> Mettre en pause</>
              : <><PlayCircle size={15} /> Réactiver le compte</>}
        </button>
      </Section>

      {/* ── Challenge actif ── */}
      {activeChallenge && (
        <Section title="Challenge en cours">
          <ChallengeRow ch={activeChallenge} expanded={false} onToggle={() => {}} active />
        </Section>
      )}

      {/* ── Historique ── */}
      <Section title={`Historique · ${pastChallenges.length} challenge${pastChallenges.length > 1 ? "s" : ""}`}>
        {pastChallenges.length === 0 ? (
          <p className="as-empty">Aucun challenge terminé pour l'instant.</p>
        ) : (
          <div className="as-history">
            {pastChallenges.map((ch) => (
              <ChallengeRow
                key={ch.id} ch={ch}
                expanded={expandedChallenge === ch.id}
                onToggle={() =>
                  setExpandedChallenge((prev) => prev === ch.id ? null : ch.id)}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Ligne de challenge (liste + détails dépliables)
// ─────────────────────────────────────────────────────────────────────
function ChallengeRow({ ch, expanded, onToggle, active = false }: {
  ch: Challenge; expanded: boolean; onToggle: () => void; active?: boolean;
}) {
  const m = ch.challenge_metrics;
  const statusColor = {
    in_progress: "#2DD4A7", passed: "#E8B339", failed: "#FB5566",
  }[ch.status];
  const statusLabel = {
    in_progress: "En cours", passed: "Validé ✓", failed: "Échoué",
  }[ch.status];

  return (
    <div className={`as-ch-row ${expanded || active ? "expanded" : ""}`}>
      <button className="as-ch-summary" onClick={onToggle}>
        <span className="as-ch-status-dot" style={{ background: statusColor }} />
        <span className="as-ch-info">
          <span className="as-ch-name">
            {fmt(ch.starting_balance)} {" · "}
            <span style={{ color: statusColor }}>{statusLabel}</span>
          </span>
          <span className="as-ch-dates">
            {dateStr(ch.started_at)}
            {ch.completed_at && ` → ${dateStr(ch.completed_at)}`}
            {" · "}{dur(ch.started_at, ch.completed_at)}
          </span>
        </span>
        {m && (
          <span className="as-ch-pct" style={{ color: m.profit_pct >= 0 ? "#2DD4A7" : "#FB5566" }}>
            {pct(m.profit_pct)}
          </span>
        )}
        {!active && (expanded
          ? <ChevronUp size={14} color="#69748C" />
          : <ChevronDown size={14} color="#69748C" />)}
      </button>

      {(expanded || active) && (
        <div className="as-ch-detail">
          <div className="as-ch-rules">
            <Stat icon={<TrendingUp size={12} />} label="Objectif"
              val={`+${ch.profit_target_pct} %`} color="#2DD4A7" />
            <Stat icon={<ShieldCheck size={12} />} label="DD total"
              val={`${ch.max_total_dd_pct} % · ${ch.dd_type}`} />
            {ch.max_daily_dd_pct && (
              <Stat icon={<AlertTriangle size={12} />} label="DD jour"
                val={`${ch.max_daily_dd_pct} %`} color="#FB5566" />
            )}
            <Stat icon={<CalendarDays size={12} />} label="Jours min."
              val={String(ch.min_trading_days)} />
          </div>
          {m && (
            <div className="as-ch-results">
              <ResultStat label="Profit final" val={pct(m.profit_pct)}
                color={m.profit_pct >= 0 ? "#2DD4A7" : "#FB5566"} />
              <ResultStat label="DD max atteint" val={`${m.total_dd_pct.toFixed(2)} %`} />
              <ResultStat label="Jours tradés" val={String(m.trading_days)} />
              {ch.failed_reason && (
                <ResultStat label="Raison échec"
                  val={ch.failed_reason.replace("_", " ")} color="#FB5566" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Petits composants
// ─────────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="as-section">
      <h2 className="as-section-title">{title}</h2>
      {children}
    </section>
  );
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="as-info-field">
      <span className="as-info-label">{label}</span>
      <span className="as-info-val">{children}</span>
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return <code className="as-mono">{children}</code>;
}

function Stat({ icon, label, val, color }: {
  icon: React.ReactNode; label: string; val: string; color?: string;
}) {
  return (
    <div className="as-stat">
      {icon}
      <span className="as-stat-label">{label}</span>
      <span className="as-stat-val" style={color ? { color } : {}}>{val}</span>
    </div>
  );
}

function ResultStat({ label, val, color }: { label: string; val: string; color?: string }) {
  return (
    <div className="as-result-stat">
      <span className="as-result-label">{label}</span>
      <span className="as-result-val" style={color ? { color } : {}}>{val}</span>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="as-root as-center">
      <style>{CSS}</style>
      <Loader2 size={20} className="as-spin" style={{ color: "#69748C" }} />
      <span style={{ color: "#69748C", fontSize: 14, marginLeft: 10 }}>Chargement…</span>
    </div>
  );
}

function ErrorBlock({ msg, onRetry }: { msg: string | null; onRetry: () => void }) {
  return (
    <div className="as-root as-center" style={{ flexDirection: "column", gap: 12 }}>
      <style>{CSS}</style>
      <AlertTriangle size={20} color="#FB5566" />
      <p style={{ color: "#EAEEF6", fontSize: 14, margin: 0 }}>{msg ?? "Erreur de chargement."}</p>
      <button className="as-btn-ghost" onClick={onRetry}>Réessayer</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');

.as-root{
  --ink:#0A0E17; --panel:#121826; --panel2:#161E2E; --hair:#222C40;
  --text:#EAEEF6; --muted:#69748C;
  --climb:#2DD4A7; --gold:#E8B339; --danger:#FB5566;
  background:var(--ink); color:var(--text);
  font-family:'Inter',system-ui,sans-serif;
  max-width:760px; padding:0 0 60px;
}
.as-root *{box-sizing:border-box;}
.as-center{display:flex; align-items:center; justify-content:center;
  min-height:50vh; flex-direction:row;}
.as-eyebrow{font-size:10.5px; letter-spacing:.13em; text-transform:uppercase;
  color:var(--muted); margin:0 0 6px; font-weight:500;}
.as-title{font-family:'Space Grotesk'; font-weight:700; font-size:clamp(22px,3vw,28px);
  margin:0; letter-spacing:-.01em;}
.as-desc{font-size:13.5px; color:var(--muted); line-height:1.6; margin:0 0 16px;}

/* header */
.as-header{display:flex; align-items:flex-start; justify-content:space-between;
  gap:12px; margin-bottom:32px;}
.as-badge{
  font-size:11px; letter-spacing:.1em; text-transform:uppercase; font-weight:600;
  border-radius:999px; padding:5px 12px; border:1px solid;
}
.as-badge.active{color:var(--climb); border-color:rgba(45,212,167,.3); background:rgba(45,212,167,.08);}
.as-badge.paused{color:var(--muted); border-color:var(--hair); background:var(--panel);}

/* sections */
.as-section{
  background:var(--panel); border:1px solid var(--hair); border-radius:14px;
  padding:24px; margin-bottom:14px;
}
.as-section-title{font-family:'Space Grotesk'; font-weight:600; font-size:16px;
  margin:0 0 18px; padding-bottom:14px; border-bottom:1px solid var(--hair);}

/* info grid */
.as-info-grid{display:grid; grid-template-columns:1fr 1fr; gap:14px 24px;}
.as-info-field{display:flex; flex-direction:column; gap:4px;}
.as-info-label{font-size:10.5px; text-transform:uppercase; letter-spacing:.1em;
  color:var(--muted); font-weight:500;}
.as-info-val{font-size:13.5px;}
.as-mono{font-family:'IBM Plex Mono'; font-size:13px; color:var(--text);
  background:none; border:none; padding:0;}
.as-editable-row{display:flex; align-items:center; gap:8px;}

/* input */
.as-input{
  background:#0B0F1A; border:1px solid var(--hair); border-radius:8px;
  padding:7px 10px; color:var(--text); font-size:13px; font-family:'Inter';
  outline:none; transition:border-color .2s; width:100%;
}
.as-input:focus{border-color:var(--climb);}
.as-input-sm{flex:1;}

/* token */
.as-token-row{display:flex; align-items:center; gap:8px; margin-bottom:14px;}
.as-token-field{
  flex:1; background:#0B0F1A; border:1px solid var(--hair); border-radius:8px;
  padding:10px 14px; min-width:0; overflow:hidden;
}
.as-token-value{
  font-family:'IBM Plex Mono'; font-size:12.5px; color:var(--climb);
  word-break:break-all; display:block;
}
.as-token-hidden{font-family:'IBM Plex Mono'; font-size:13px; color:var(--muted);
  letter-spacing:.15em;}
.as-icon-btn{
  flex:none; background:var(--panel2); border:1px solid var(--hair); color:var(--muted);
  border-radius:8px; padding:9px; display:flex; cursor:pointer; transition:border-color .2s, color .2s;
}
.as-icon-btn:hover{border-color:var(--climb); color:var(--climb);}
.as-code{font-family:'IBM Plex Mono'; font-size:12px; background:var(--panel2);
  border:1px solid var(--hair); border-radius:4px; padding:1px 5px;}

/* confirm regen */
.as-confirm-block{
  display:flex; flex-wrap:wrap; align-items:flex-start; gap:10px;
  background:rgba(251,85,102,.06); border:1px solid rgba(251,85,102,.2);
  border-radius:10px; padding:14px; font-size:13px; color:var(--text); line-height:1.5;
}
.as-confirm-actions{display:flex; gap:8px; width:100%; flex-wrap:wrap;}

/* boutons */
.as-btn-ghost{
  background:transparent; border:1px solid var(--hair); color:var(--muted);
  border-radius:9px; padding:9px 16px; font-size:13px; cursor:pointer;
  font-family:'Inter'; display:inline-flex; align-items:center; gap:7px;
  transition:border-color .2s, color .2s;
}
.as-btn-ghost:hover{border-color:#3A4763; color:var(--text);}
.as-btn-danger-ghost{color:var(--danger); border-color:rgba(251,85,102,.25);}
.as-btn-danger-ghost:hover{border-color:var(--danger); background:rgba(251,85,102,.06); color:var(--danger);}
.as-btn-danger{
  background:rgba(251,85,102,.12); border:1px solid rgba(251,85,102,.35); color:var(--danger);
  border-radius:9px; padding:9px 16px; font-size:13px; cursor:pointer; font-family:'Inter';
  display:inline-flex; align-items:center; gap:7px; transition:background .2s;
}
.as-btn-danger:hover{background:rgba(251,85,102,.2);}
.as-btn-danger:disabled{opacity:.4; cursor:not-allowed;}
.as-toggle-btn{
  display:inline-flex; align-items:center; gap:8px;
  border-radius:10px; padding:11px 20px; font-size:14px; font-weight:600;
  cursor:pointer; font-family:'Space Grotesk'; border:1px solid;
  transition:background .2s, border-color .2s;
}
.as-toggle-btn.pause{
  background:rgba(251,85,102,.08); border-color:rgba(251,85,102,.3); color:var(--danger);
}
.as-toggle-btn.pause:hover{background:rgba(251,85,102,.15);}
.as-toggle-btn.resume{
  background:rgba(45,212,167,.08); border-color:rgba(45,212,167,.3); color:var(--climb);
}
.as-toggle-btn.resume:hover{background:rgba(45,212,167,.15);}
.as-toggle-btn:disabled{opacity:.4; cursor:not-allowed;}

/* historique */
.as-history{display:flex; flex-direction:column; gap:8px;}
.as-empty{font-size:13px; color:var(--muted); font-style:italic; margin:0;}
.as-ch-row{
  background:var(--panel2); border:1px solid var(--hair);
  border-radius:12px; overflow:hidden; transition:border-color .2s;
}
.as-ch-row.expanded{border-color:rgba(45,212,167,.25);}
.as-ch-summary{
  width:100%; display:flex; align-items:center; gap:12px;
  padding:13px 16px; background:none; border:none; cursor:pointer;
  text-align:left; color:var(--text);
}
.as-ch-summary:hover{background:rgba(255,255,255,.02);}
.as-ch-status-dot{width:8px; height:8px; border-radius:50%; flex:none;}
.as-ch-info{flex:1; display:flex; flex-direction:column; gap:3px; min-width:0;}
.as-ch-name{font-size:13.5px; font-weight:500;}
.as-ch-dates{font-size:11.5px; color:var(--muted); font-family:'IBM Plex Mono';}
.as-ch-pct{font-family:'IBM Plex Mono'; font-size:14px; font-weight:600; flex:none;}
.as-ch-detail{padding:0 16px 16px; border-top:1px solid var(--hair);}
.as-ch-rules{display:flex; flex-wrap:wrap; gap:8px; padding:14px 0 10px;}
.as-stat{
  display:inline-flex; align-items:center; gap:5px;
  background:var(--panel); border:1px solid var(--hair);
  border-radius:999px; padding:4px 10px; font-size:11.5px;
}
.as-stat-label{color:var(--muted);}
.as-stat-val{font-family:'IBM Plex Mono'; font-weight:500;}
.as-ch-results{display:grid; grid-template-columns:repeat(2,1fr); gap:10px 24px; padding-top:4px;}
.as-result-stat{display:flex; flex-direction:column; gap:3px;}
.as-result-label{font-size:10.5px; text-transform:uppercase; letter-spacing:.1em; color:var(--muted);}
.as-result-val{font-family:'IBM Plex Mono'; font-size:14px; font-weight:500;}

.as-spin{animation:spin 1s linear infinite; display:inline-block;}
@keyframes spin{to{transform:rotate(360deg);}}

@media(max-width:580px){
  .as-info-grid{grid-template-columns:1fr;}
  .as-ch-results{grid-template-columns:1fr;}
  .as-token-row{flex-wrap:wrap;}
  .as-token-field{width:100%;}
}
`;
