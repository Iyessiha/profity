// =====================================================================
// ProfityX — ChallengeOnboarding.tsx
// ---------------------------------------------------------------------
// Flux en 3 étapes :
//   1) Nommer le compte MT5
//   2) Choisir un preset de challenge
//   3) Récupérer le connect_token + guide d'installation EA
//
// À la fin, redirige vers <ChallengeDashboard accountId={...} />
//
// USAGE :
//   <ChallengeOnboarding userId="<uuid>" onDone={(accountId) => …} />
//
// VARIABLES D'ENV :
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//   NEXT_PUBLIC_INGEST_URL    (ex : https://<ref>.supabase.co/functions/v1/ingest)
// =====================================================================

"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  AlertTriangle, Check, ChevronRight, ClipboardCopy,
  Download, ExternalLink, ShieldCheck, TrendingUp,
  CalendarDays, Layers, ArrowRight, Loader2,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const INGEST_URL =
  process.env.NEXT_PUBLIC_INGEST_URL ??
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ingest`;

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────
interface Preset {
  id: string;
  name: string;
  description: string | null;
  account_size: number | null;
  profit_target_pct: number;
  max_total_dd_pct: number;
  dd_type: "static" | "trailing";
  max_daily_dd_pct: number | null;
  min_trading_days: number;
  phase: string | null;
}

interface Props {
  userId: string;
  onDone?: (accountId: string) => void;
}

type Step = 1 | 2 | 3;

const pct = (n: number) => `${n}%`;
const money = (n: number) =>
  n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " $";

// ─────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────
export default function ChallengeOnboarding({ userId, onDone }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [label, setLabel] = useState("");
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // charger les presets publics
  useEffect(() => {
    supabase
      .from("challenge_presets")
      .select("*")
      .eq("is_public", true)
      .order("account_size")
      .then(({ data }) => { if (data) setPresets(data); });
  }, []);

  // ── Étape 1 → 2 : validation du nom
  const goStep2 = () => {
    if (!label.trim()) { setError("Donne un nom à ce compte."); return; }
    setError(null);
    setStep(2);
  };

  // ── Étape 2 → 3 : créer le compte + le challenge
  const goStep3 = async () => {
    if (!selectedPreset) { setError("Choisis un preset."); return; }
    setError(null);
    setLoading(true);
    try {
      // 1) créer le compte → Supabase génère le connect_token
      const { data: acc, error: eAcc } = await supabase
        .from("accounts")
        .insert({ user_id: userId, label: label.trim() })
        .select("id, connect_token")
        .single();
      if (eAcc) throw eAcc;

      // 2) créer le challenge à partir du preset (règles copiées)
      const { error: eCh } = await supabase.from("challenges").insert({
        account_id: acc.id,
        preset_id: selectedPreset.id,
        starting_balance: selectedPreset.account_size ?? 10000,
        profit_target_pct: selectedPreset.profit_target_pct,
        max_total_dd_pct: selectedPreset.max_total_dd_pct,
        dd_type: selectedPreset.dd_type,
        max_daily_dd_pct: selectedPreset.max_daily_dd_pct,
        min_trading_days: selectedPreset.min_trading_days,
      });
      if (eCh) throw eCh;

      setToken(acc.connect_token);
      setAccountId(acc.id);
      setStep(3);
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, which: "token" | "url") => {
    await navigator.clipboard.writeText(text);
    if (which === "token") { setCopied(true); setTimeout(() => setCopied(false), 2000); }
    else { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }
  };

  return (
    <div className="ob-root">
      <style>{CSS}</style>

      {/* ── En-tête ── */}
      <div className="ob-header">
        <span className="ob-logo">PROFITY<b>X</b></span>
        <h1 className="ob-title">Connecte ton compte MT5</h1>
        <p className="ob-sub">
          L'EA tourne sur ton broker, ProfityX suit et valide ton challenge en direct.
        </p>
        <Stepper current={step} />
      </div>

      {/* ── Contenu ── */}
      <div className="ob-card">
        {step === 1 && (
          <Step1
            label={label} onChange={setLabel}
            error={error} onNext={goStep2}
          />
        )}
        {step === 2 && (
          <Step2
            presets={presets} selected={selectedPreset}
            onSelect={setSelectedPreset} error={error}
            loading={loading} onBack={() => setStep(1)}
            onNext={goStep3}
          />
        )}
        {step === 3 && (
          <Step3
            token={token} ingestUrl={INGEST_URL}
            copied={copied} copiedUrl={copiedUrl}
            onCopyToken={() => copy(token, "token")}
            onCopyUrl={() => copy(INGEST_URL, "url")}
            onDone={() => onDone?.(accountId)}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Stepper
// ─────────────────────────────────────────────────────────────────────
function Stepper({ current }: { current: Step }) {
  const steps = ["Compte", "Challenge", "Installation"];
  return (
    <div className="ob-stepper">
      {steps.map((s, i) => {
        const n = (i + 1) as Step;
        const done = current > n;
        const active = current === n;
        return (
          <React.Fragment key={s}>
            <div className={`ob-step ${active ? "active" : ""} ${done ? "done" : ""}`}>
              <span className="ob-step-dot">
                {done ? <Check size={11} strokeWidth={3} /> : n}
              </span>
              <span className="ob-step-label">{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`ob-step-line ${done ? "done" : ""}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Étape 1 — Nom du compte
// ─────────────────────────────────────────────────────────────────────
function Step1({ label, onChange, error, onNext }: {
  label: string; onChange: (v: string) => void;
  error: string | null; onNext: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="ob-step-content">
      <p className="ob-step-intro">
        Nomme ce compte pour le retrouver facilement dans ton tableau de bord.
        Tu pourras en connecter plusieurs.
      </p>
      <label className="ob-label">Nom du compte</label>
      <input
        ref={ref}
        className="ob-input"
        placeholder="ex. : Compte FTMO Principal"
        value={label}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onNext()}
        maxLength={60}
      />
      {error && <ErrorMsg msg={error} />}
      <button className="ob-btn-primary" onClick={onNext}>
        Continuer <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Étape 2 — Choix du preset
// ─────────────────────────────────────────────────────────────────────
function Step2({ presets, selected, onSelect, error, loading, onBack, onNext }: {
  presets: Preset[]; selected: Preset | null;
  onSelect: (p: Preset) => void; error: string | null;
  loading: boolean; onBack: () => void; onNext: () => void;
}) {
  return (
    <div className="ob-step-content">
      <p className="ob-step-intro">
        Choisis le type de challenge à valider. Les règles sont figées au démarrage.
      </p>
      {presets.length === 0 && (
        <p className="ob-muted">Chargement des presets…</p>
      )}
      <div className="ob-presets">
        {presets.map((p) => (
          <PresetCard
            key={p.id} preset={p}
            active={selected?.id === p.id}
            onClick={() => onSelect(p)}
          />
        ))}
      </div>
      {error && <ErrorMsg msg={error} />}
      <div className="ob-row">
        <button className="ob-btn-ghost" onClick={onBack}>Retour</button>
        <button
          className="ob-btn-primary"
          onClick={onNext}
          disabled={!selected || loading}
        >
          {loading
            ? <><Loader2 size={15} className="ob-spin" /> Création…</>
            : <>Lancer le challenge <ArrowRight size={15} /></>
          }
        </button>
      </div>
    </div>
  );
}

function PresetCard({ preset: p, active, onClick }: {
  preset: Preset; active: boolean; onClick: () => void;
}) {
  return (
    <div className={`ob-preset ${active ? "active" : ""}`} onClick={onClick}>
      {active && <div className="ob-preset-check"><Check size={11} strokeWidth={3} /></div>}
      <div className="ob-preset-top">
        <span className="ob-preset-name">{p.name}</span>
        {p.account_size && (
          <span className="ob-preset-size">{money(p.account_size)}</span>
        )}
      </div>
      {p.description && <p className="ob-preset-desc">{p.description}</p>}
      <div className="ob-preset-rules">
        <Rule icon={<TrendingUp size={12} />} label="Objectif"
          val={pct(p.profit_target_pct)} color="climb" />
        <Rule icon={<ShieldCheck size={12} />} label="DD total"
          val={`${pct(p.max_total_dd_pct)} · ${p.dd_type}`} color="muted" />
        {p.max_daily_dd_pct && (
          <Rule icon={<AlertTriangle size={12} />} label="DD jour"
            val={pct(p.max_daily_dd_pct)} color="danger" />
        )}
        <Rule icon={<CalendarDays size={12} />} label="Jours min."
          val={String(p.min_trading_days)} color="muted" />
      </div>
    </div>
  );
}

function Rule({ icon, label, val, color }: {
  icon: React.ReactNode; label: string; val: string;
  color: "climb" | "danger" | "muted";
}) {
  return (
    <div className={`ob-rule ob-rule-${color}`}>
      {icon}
      <span className="ob-rule-label">{label}</span>
      <span className="ob-rule-val">{val}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Étape 3 — Token + Guide d'installation
// ─────────────────────────────────────────────────────────────────────
const INSTALL_STEPS = [
  {
    n: 1,
    title: "Télécharge l'EA — choisis ton profil",
    body: "Trader manuel ? Installe le Tracker (surveille sans trader). Trader algo ? Installe le Robot (trade + surveille automatiquement).",
    action: { label: "Télécharger l'EA", icon: <Download size={13} />, key: "dl" },
  },
  {
    n: 2,
    title: "Compile dans MetaEditor",
    body: 'Ouvre MetaEditor (F4), repère ProfityX_Tracker.mq5 dans l\'arborescence Experts, double-clique dessus et appuie sur F7 pour compiler.',
    action: null,
  },
  {
    n: 3,
    title: "Autorise l'URL dans MT5",
    body: "Outils → Options → Expert Advisors → cocher « Autoriser les WebRequest » et ajouter l'URL ci-dessous. Sans ça, l'EA ne peut pas envoyer de données.",
    action: { label: "Copier l'URL", icon: <ClipboardCopy size={13} />, key: "url" },
  },
  {
    n: 4,
    title: "Attache l'EA à un graphique",
    body: "Glisse ProfityX_Tracker depuis le Navigateur sur n'importe quel graphique, colle ton token dans le champ « InpToken » et confirme.",
    action: { label: "Copier le token", icon: <ClipboardCopy size={13} />, key: "token" },
  },
  {
    n: 5,
    title: "VPS recommandé",
    body: "Pour un suivi 24/7, fais tourner MT5 sur un VPS Windows. L'EA doit rester connecté même quand ton PC est éteint.",
    action: null,
  },
];

function Step3({ token, ingestUrl, copied, copiedUrl, onCopyToken, onCopyUrl, onDone }: {
  token: string; ingestUrl: string;
  copied: boolean; copiedUrl: boolean;
  onCopyToken: () => void; onCopyUrl: () => void;
  onDone: () => void;
}) {
  return (
    <div className="ob-step-content">
      {/* Token */}
      <div className="ob-token-block">
        <span className="ob-label">Ton token de connexion</span>
        <p className="ob-token-hint">
          Ce token est le secret entre ton EA et ProfityX. Ne le partage pas.
          Tu peux le régénérer depuis les paramètres du compte si nécessaire.
        </p>
        <div className="ob-token-row">
          <code className="ob-token">{token}</code>
          <button className="ob-copy-btn" onClick={onCopyToken}>
            {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
      </div>

      {/* URL à whitelist */}
      <div className="ob-url-block">
        <span className="ob-label">URL à autoriser dans MT5</span>
        <div className="ob-token-row">
          <code className="ob-token ob-token-url">{ingestUrl}</code>
          <button className="ob-copy-btn" onClick={onCopyUrl}>
            {copiedUrl ? <Check size={14} /> : <ClipboardCopy size={14} />}
            {copiedUrl ? "Copié !" : "Copier"}
          </button>
        </div>
      </div>

      {/* Guide d'installation */}
      <div className="ob-guide">
        <span className="ob-label" style={{ marginBottom: 16, display: "block" }}>
          Guide d'installation — 5 étapes
        </span>
        {INSTALL_STEPS.map((s) => (
          <InstallStep
            key={s.n} step={s}
            token={token} ingestUrl={ingestUrl}
            onCopyToken={onCopyToken} onCopyUrl={onCopyUrl}
            copied={copied} copiedUrl={copiedUrl}
          />
        ))}
      </div>

      {/* CTA final */}
      <div className="ob-final">
        <p className="ob-final-hint">
          Dès que l'EA envoie son premier snapshot, ton dashboard s'anime.
        </p>
        <button className="ob-btn-primary ob-btn-large" onClick={onDone}>
          Voir mon Dashboard <Layers size={16} />
        </button>
      </div>
    </div>
  );
}

function InstallStep({ step: s, token, ingestUrl, onCopyToken, onCopyUrl, copied, copiedUrl }: {
  step: typeof INSTALL_STEPS[0];
  token: string; ingestUrl: string;
  onCopyToken: () => void; onCopyUrl: () => void;
  copied: boolean; copiedUrl: boolean;
}) {
  return (
    <div className="ob-install-step">
      <div className="ob-install-n">{s.n}</div>
      <div className="ob-install-body">
        <strong>{s.title}</strong>
        <p>{s.body}</p>
        {s.action && (
          <button
            className="ob-action-btn"
            onClick={
              s.action.key === "token" ? onCopyToken
              : s.action.key === "url" ? onCopyUrl
              : () => {
                  // déclenchera un vrai lien de téléchargement en prod
                  window.open("/downloads/ProfityX_Tracker.mq5", "_blank");
                }
            }
          >
            {s.action.key === "token" && (copied ? <Check size={13} /> : s.action.icon)}
            {s.action.key === "url" && (copiedUrl ? <Check size={13} /> : s.action.icon)}
            {s.action.key === "dl" && s.action.icon}
            {s.action.key === "token" && copied ? "Copié !" : s.action.label}
            {s.action.key === "url" && copiedUrl ? "Copié !" : s.action.key !== "token" ? s.action.label : ""}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────
function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="ob-error">
      <AlertTriangle size={14} />
      {msg}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

.ob-root{
  --ink:#0A0E17; --panel:#121826; --panel2:#161E2E; --hair:#222C40;
  --text:#EAEEF6; --muted:#69748C;
  --climb:#2DD4A7; --gold:#E8B339; --danger:#FB5566;
  background:var(--ink); color:var(--text);
  font-family:'Inter',system-ui,sans-serif;
  min-height:100vh; width:100%; max-width:100vw; overflow-x:hidden;
  padding:40px clamp(12px,4vw,40px); box-sizing:border-box;
}
.ob-root *{box-sizing:border-box;}

/* header */
.ob-header{max-width:640px; margin:0 auto 32px; text-align:center;}
.ob-logo{font-family:'Space Grotesk'; font-weight:700; font-size:17px; letter-spacing:.05em;}
.ob-logo b{color:var(--climb);}
.ob-title{font-family:'Space Grotesk'; font-weight:700; font-size:clamp(24px,4vw,32px);
  margin:18px 0 10px; letter-spacing:-.02em;}
.ob-sub{color:var(--muted); font-size:15px; margin:0 0 28px; line-height:1.55;}

/* stepper */
.ob-stepper{display:flex; align-items:center; justify-content:center; gap:0;}
.ob-step{display:flex; flex-direction:column; align-items:center; gap:6px;}
.ob-step-dot{
  width:28px; height:28px; border-radius:50%; border:2px solid var(--hair);
  background:var(--panel); display:flex; align-items:center; justify-content:center;
  font-family:'Space Grotesk'; font-size:12px; font-weight:600; color:var(--muted);
  transition:border-color .25s, background .25s, color .25s;
}
.ob-step.active .ob-step-dot{
  border-color:var(--climb); color:var(--climb); background:rgba(45,212,167,.08);
}
.ob-step.done .ob-step-dot{
  border-color:var(--climb); background:var(--climb); color:#0A0E17;
}
.ob-step-label{font-size:10.5px; letter-spacing:.1em; text-transform:uppercase;
  color:var(--muted); font-weight:500;}
.ob-step.active .ob-step-label{color:var(--text);}
.ob-step-line{flex:1; height:2px; background:var(--hair); min-width:32px; margin-bottom:14px;
  transition:background .3s;}
.ob-step-line.done{background:var(--climb);}

/* carte principale */
.ob-card{
  max-width:640px; margin:0 auto;
  background:var(--panel); border:1px solid var(--hair); border-radius:18px;
  padding:clamp(24px,4vw,40px);
}
.ob-step-content{display:flex; flex-direction:column; gap:20px;}
.ob-step-intro{font-size:14px; color:var(--muted); line-height:1.6; margin:0;}
.ob-muted{color:var(--muted); font-size:13px; margin:0;}

/* input */
.ob-label{font-size:11px; letter-spacing:.1em; text-transform:uppercase;
  color:var(--muted); font-weight:500;}
.ob-input{
  width:100%; background:#0B0F1A; border:1px solid var(--hair); border-radius:10px;
  padding:13px 16px; color:var(--text); font-size:15px; font-family:'Inter';
  outline:none; transition:border-color .2s;
}
.ob-input::placeholder{color:var(--muted);}
.ob-input:focus{border-color:var(--climb);}

/* presets */
.ob-presets{display:flex; flex-direction:column; gap:12px;}
.ob-preset{
  position:relative; background:var(--panel2); border:2px solid var(--hair);
  border-radius:14px; padding:16px 18px; cursor:pointer;
  transition:border-color .2s, background .2s;
}
.ob-preset:hover{border-color:#3A4763;}
.ob-preset.active{border-color:var(--climb); background:rgba(45,212,167,.04);}
.ob-preset-check{
  position:absolute; top:14px; right:14px;
  width:20px; height:20px; border-radius:50%;
  background:var(--climb); color:#0A0E17;
  display:flex; align-items:center; justify-content:center;
}
.ob-preset-top{display:flex; align-items:baseline; justify-content:space-between; gap:8px; margin-bottom:4px;}
.ob-preset-name{font-family:'Space Grotesk'; font-size:15px; font-weight:600;}
.ob-preset-size{font-family:'IBM Plex Mono'; font-size:13px; color:var(--muted);}
.ob-preset-desc{font-size:13px; color:var(--muted); margin:0 0 12px; line-height:1.5;}
.ob-preset-rules{display:flex; flex-wrap:wrap; gap:8px;}
.ob-rule{
  display:inline-flex; align-items:center; gap:5px;
  background:#0B0F1A; border:1px solid var(--hair); border-radius:999px;
  padding:4px 10px; font-size:11.5px;
}
.ob-rule-label{color:var(--muted);}
.ob-rule-val{font-family:'IBM Plex Mono'; font-weight:500;}
.ob-rule-climb .ob-rule-val{color:var(--climb);}
.ob-rule-danger .ob-rule-val{color:var(--danger);}
.ob-rule-muted .ob-rule-val{color:var(--text);}

/* boutons */
.ob-btn-primary{
  display:inline-flex; align-items:center; gap:8px; justify-content:center;
  background:var(--climb); color:#0A0E17; border:none; border-radius:10px;
  padding:13px 22px; font-size:14px; font-weight:600; cursor:pointer;
  font-family:'Space Grotesk'; letter-spacing:.01em;
  transition:opacity .2s, transform .1s;
}
.ob-btn-primary:hover{opacity:.9;}
.ob-btn-primary:active{transform:scale(.98);}
.ob-btn-primary:disabled{opacity:.4; cursor:not-allowed;}
.ob-btn-large{padding:15px 28px; font-size:15px; align-self:flex-start;}
.ob-btn-ghost{
  background:transparent; border:1px solid var(--hair); color:var(--muted);
  border-radius:10px; padding:12px 18px; font-size:14px; cursor:pointer;
  transition:border-color .2s, color .2s; font-family:'Inter';
}
.ob-btn-ghost:hover{border-color:#3A4763; color:var(--text);}
.ob-row{display:flex; justify-content:space-between; align-items:center; gap:12px;}

/* erreur */
.ob-error{
  display:flex; align-items:center; gap:8px; color:var(--danger);
  font-size:13px; background:rgba(251,85,102,.08); border:1px solid rgba(251,85,102,.2);
  border-radius:8px; padding:10px 14px;
}

/* token */
.ob-token-block, .ob-url-block{display:flex; flex-direction:column; gap:10px;}
.ob-token-hint{font-size:13px; color:var(--muted); margin:0; line-height:1.5;}
.ob-token-row{display:flex; gap:10px; align-items:center;}
.ob-token{
  flex:1; background:#0B0F1A; border:1px solid var(--hair); border-radius:8px;
  padding:10px 14px; font-family:'IBM Plex Mono'; font-size:13px;
  color:var(--climb); word-break:break-all; overflow-wrap:anywhere;
}
.ob-token-url{color:var(--text); font-size:11.5px;}
.ob-copy-btn{
  flex:none; display:inline-flex; align-items:center; gap:6px;
  background:var(--panel2); border:1px solid var(--hair); color:var(--text);
  border-radius:8px; padding:9px 14px; font-size:13px; cursor:pointer;
  font-family:'Inter'; white-space:nowrap; transition:border-color .2s;
}
.ob-copy-btn:hover{border-color:var(--climb);}

/* guide */
.ob-guide{display:flex; flex-direction:column; gap:0;}
.ob-install-step{display:flex; gap:16px; padding:14px 0;
  border-bottom:1px solid var(--hair);}
.ob-install-step:last-child{border-bottom:none;}
.ob-install-n{
  flex:none; width:26px; height:26px; border-radius:50%;
  background:rgba(45,212,167,.1); border:1px solid var(--climb);
  color:var(--climb); font-family:'Space Grotesk'; font-weight:700;
  font-size:12px; display:flex; align-items:center; justify-content:center;
  margin-top:2px;
}
.ob-install-body{flex:1; display:flex; flex-direction:column; gap:6px;}
.ob-install-body strong{font-size:14px; font-weight:600; color:var(--text);}
.ob-install-body p{margin:0; font-size:13px; color:var(--muted); line-height:1.55;}
.ob-action-btn{
  display:inline-flex; align-items:center; gap:6px; align-self:flex-start;
  background:transparent; border:1px solid var(--hair); color:var(--text);
  border-radius:8px; padding:7px 13px; font-size:12.5px; cursor:pointer;
  font-family:'Inter'; transition:border-color .2s;
}
.ob-action-btn:hover{border-color:var(--climb); color:var(--climb);}

/* final */
.ob-final{display:flex; flex-direction:column; gap:12px;
  padding:20px; background:rgba(45,212,167,.04); border:1px solid rgba(45,212,167,.15);
  border-radius:12px;}
.ob-final-hint{margin:0; font-size:13px; color:var(--muted); line-height:1.55;}

.ob-spin{animation:spin 1s linear infinite; display:inline-block;}
@keyframes spin{to{transform:rotate(360deg);}}

@media(max-width:640px){
  .ob-root{padding:24px 16px 40px;}
  .ob-card{border-radius:14px; padding:20px 16px;}
  .ob-header{margin-bottom:20px;}
  .ob-title{font-size:22px;}
  .ob-sub{font-size:13px;}
  .ob-stepper{gap:0;}
  .ob-step-label{font-size:9px;}
  .ob-step-line{min-width:20px;}
  .ob-presets{gap:10px;}
  .ob-preset{padding:12px 14px;}
  .ob-preset-name{font-size:13px;}
  .ob-preset-rules{gap:6px;}
  .ob-rule{font-size:10.5px; padding:3px 8px;}
  .ob-token-row{flex-direction:column; align-items:stretch;}
  .ob-copy-btn{justify-content:center;}
  .ob-btn-large{align-self:stretch;}
  .ob-btn-primary{width:100%; justify-content:center;}
  .ob-row{flex-direction:column-reverse; gap:8px;}
  .ob-btn-ghost{width:100%; justify-content:center;}
  .ob-install-step{gap:12px;}
  .ob-action-btn{font-size:11.5px; padding:6px 10px;}
}
`;
