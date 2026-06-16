// =====================================================================
// ProfityX — AppLayout.tsx
// ---------------------------------------------------------------------
// Layout principal : sidebar fixe (desktop) + drawer (mobile).
// Gère le switcher de comptes MT5 et la navigation entre pages.
//
// USAGE (Next.js App Router) :
//   // app/layout.tsx
//   import AppLayout from "@/components/AppLayout";
//   export default function RootLayout({ children }) {
//     return <AppLayout>{children}</AppLayout>;
//   }
//
// PROPS :
//   activeAccountId  — compte MT5 sélectionné (vient du searchParam ou du store)
//   onAccountChange  — callback quand l'abonné change de compte
//   currentPage      — "dashboard" | "history" | "settings" | "onboarding"
// =====================================================================

"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Activity, ChevronDown, ChevronRight, Layers,
  LayoutDashboard, LogOut, Menu, Plus,
  Settings, Clock, X, Wifi, WifiOff,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────
interface Account {
  id: string;
  label: string | null;
  mt5_login: number | null;
  broker_server: string | null;
  currency: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  challenges?: { status: string }[];
}

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface Props {
  children: React.ReactNode;
  activeAccountId?: string;
  currentPage?: string;
  onAccountChange?: (id: string) => void;
  onNavigate?: (page: string) => void;
  onSignOut?: () => void;
}

// ─────────────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────────────
const NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} />, href: "/dashboard" },
  { key: "history",   label: "Historique", icon: <Clock size={16} />,          href: "/history"   },
  { key: "settings",  label: "Paramètres", icon: <Settings size={16} />,       href: "/settings"  },
];

// ─────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────
const connected = (acc: Account) =>
  !!acc.last_seen_at &&
  Date.now() - new Date(acc.last_seen_at).getTime() < 30_000;

const challengeStatus = (acc: Account): "in_progress" | "passed" | "failed" | "none" => {
  const ch = acc.challenges?.[0];
  return (ch?.status as any) ?? "none";
};

const statusDot: Record<string, string> = {
  in_progress: "#2DD4A7",
  passed:      "#E8B339",
  failed:      "#FB5566",
  none:        "#69748C",
};

// ─────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────
export default function AppLayout({
  children, activeAccountId, currentPage = "dashboard",
  onAccountChange, onNavigate, onSignOut,
}: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const activeAcc = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];

  // charger les comptes de l'utilisateur
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("accounts")
        .select("*, challenges(status)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setAccounts(data);
    });
  }, []);

  // fermer le switcher en cliquant dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!switcherRef.current?.contains(e.target as Node))
        setSwitcherOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // fermer le drawer sur Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const navigate = (key: string) => {
    onNavigate?.(key);
    setDrawerOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="al-logo-row">
        <span className="al-logo">PROFITY<b>X</b></span>
        <span className="al-logo-tag">Challenge</span>
      </div>

      {/* Account Switcher */}
      <div className="al-section-label">Compte actif</div>
      <div className="al-switcher" ref={switcherRef}>
        {activeAcc ? (
          <button
            className={`al-switcher-btn ${switcherOpen ? "open" : ""}`}
            onClick={() => setSwitcherOpen((o) => !o)}
          >
            <span
              className="al-status-dot"
              style={{ background: statusDot[challengeStatus(activeAcc)] }}
            />
            <span className="al-switcher-info">
              <span className="al-switcher-label">
                {activeAcc.label ?? `Compte ${activeAcc.mt5_login ?? "—"}`}
              </span>
              <span className="al-switcher-meta">
                {activeAcc.broker_server ?? "—"} · {activeAcc.currency ?? "USD"}
              </span>
            </span>
            <span className="al-switcher-live">
              {connected(activeAcc)
                ? <Wifi size={12} color="#2DD4A7" />
                : <WifiOff size={12} color="#69748C" />}
            </span>
            <ChevronDown size={14} className={`al-chevron ${switcherOpen ? "up" : ""}`} />
          </button>
        ) : (
          <button className="al-switcher-btn al-switcher-empty" onClick={() => navigate("onboarding")}>
            <Plus size={14} /> Connecter un compte
          </button>
        )}

        {switcherOpen && (
          <div className="al-dropdown">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                className={`al-dropdown-item ${acc.id === activeAcc?.id ? "active" : ""}`}
                onClick={() => {
                  onAccountChange?.(acc.id);
                  setSwitcherOpen(false);
                  setDrawerOpen(false);
                }}
              >
                <span
                  className="al-status-dot"
                  style={{ background: statusDot[challengeStatus(acc)] }}
                />
                <span className="al-dropdown-info">
                  <span>{acc.label ?? `Compte ${acc.mt5_login ?? "—"}`}</span>
                  <span className="al-dropdown-meta">{acc.broker_server}</span>
                </span>
                {acc.id === activeAcc?.id && <ChevronRight size={12} />}
              </button>
            ))}
            <div className="al-dropdown-sep" />
            <button
              className="al-dropdown-item al-dropdown-add"
              onClick={() => { navigate("onboarding"); setSwitcherOpen(false); }}
            >
              <Plus size={13} /> Ajouter un compte
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="al-section-label" style={{ marginTop: 24 }}>Navigation</div>
      <nav className="al-nav">
        {NAV.map((item) => (
          <button
            key={item.key}
            className={`al-nav-item ${currentPage === item.key ? "active" : ""}`}
            onClick={() => navigate(item.key)}
          >
            {item.icon}
            {item.label}
            {currentPage === item.key && <span className="al-nav-active-bar" />}
          </button>
        ))}
      </nav>

      {/* Spacer + pied */}
      <div style={{ flex: 1 }} />
      <div className="al-footer">
        <div className="al-footer-user">
          <span className="al-footer-avatar">
            <Layers size={14} />
          </span>
          <span className="al-footer-name">MonWe Infinity</span>
        </div>
        <button className="al-signout" onClick={onSignOut} title="Se déconnecter">
          <LogOut size={14} />
        </button>
      </div>
    </>
  );

  return (
    <div className="al-root">
      <style>{CSS}</style>

      {/* ── Sidebar desktop ── */}
      <aside className="al-sidebar">
        {sidebarContent}
      </aside>

      {/* ── Topbar mobile ── */}
      <div className="al-topbar">
        <span className="al-logo al-logo-mobile">PROFITY<b>X</b></span>
        <button className="al-hamburger" onClick={() => setDrawerOpen(true)}>
          <Menu size={20} />
        </button>
      </div>

      {/* ── Drawer mobile ── */}
      {drawerOpen && (
        <>
          <div className="al-overlay" onClick={() => setDrawerOpen(false)} />
          <aside className="al-drawer">
            <button className="al-drawer-close" onClick={() => setDrawerOpen(false)}>
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* ── Contenu ── */}
      <main className="al-main">
        {children}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');

.al-root{
  --ink:#0A0E17; --panel:#121826; --panel2:#161E2E; --hair:#222C40;
  --text:#EAEEF6; --muted:#69748C;
  --climb:#2DD4A7; --gold:#E8B339; --danger:#FB5566;
  --sidebar-w:240px;
  display:flex; min-height:100vh; background:var(--ink); color:var(--text);
  font-family:'Inter',system-ui,sans-serif;
}
.al-root *{box-sizing:border-box;}

/* sidebar desktop */
.al-sidebar{
  width:var(--sidebar-w); flex:none;
  background:var(--panel); border-right:1px solid var(--hair);
  display:flex; flex-direction:column; gap:0;
  padding:24px 16px; position:fixed; top:0; left:0;
  height:100vh; overflow-y:auto; z-index:10;
}

/* logo */
.al-logo-row{display:flex; align-items:center; gap:10px; margin-bottom:28px; padding:0 4px;}
.al-logo{font-family:'Space Grotesk'; font-weight:700; font-size:17px; letter-spacing:.04em;}
.al-logo b{color:var(--climb);}
.al-logo-tag{
  font-size:9.5px; letter-spacing:.12em; text-transform:uppercase;
  color:var(--climb); background:rgba(45,212,167,.1);
  border:1px solid rgba(45,212,167,.2); border-radius:999px; padding:2px 8px;
}

/* section label */
.al-section-label{
  font-size:10px; letter-spacing:.13em; text-transform:uppercase;
  color:var(--muted); font-weight:500; padding:0 6px; margin-bottom:8px;
}

/* account switcher */
.al-switcher{position:relative; margin-bottom:2px;}
.al-switcher-btn{
  width:100%; display:flex; align-items:center; gap:10px;
  background:var(--panel2); border:1px solid var(--hair);
  border-radius:10px; padding:10px 12px; cursor:pointer;
  text-align:left; transition:border-color .2s;
}
.al-switcher-btn:hover, .al-switcher-btn.open{border-color:rgba(45,212,167,.4);}
.al-switcher-empty{color:var(--muted); font-size:13px; justify-content:center;
  border-style:dashed;}
.al-switcher-info{flex:1; display:flex; flex-direction:column; gap:2px; min-width:0;}
.al-switcher-label{font-size:13px; font-weight:500; white-space:nowrap;
  overflow:hidden; text-overflow:ellipsis;}
.al-switcher-meta{font-size:10.5px; color:var(--muted); font-family:'IBM Plex Mono';}
.al-switcher-live{flex:none;}
.al-chevron{color:var(--muted); flex:none; transition:transform .2s;}
.al-chevron.up{transform:rotate(180deg);}
.al-status-dot{width:7px; height:7px; border-radius:50%; flex:none;}

/* dropdown */
.al-dropdown{
  position:absolute; top:calc(100% + 6px); left:0; right:0; z-index:20;
  background:var(--panel); border:1px solid var(--hair); border-radius:12px;
  overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,.4);
}
.al-dropdown-item{
  width:100%; display:flex; align-items:center; gap:10px;
  padding:10px 14px; background:none; border:none; cursor:pointer;
  color:var(--text); text-align:left; font-size:13px; font-family:'Inter';
  transition:background .15s;
}
.al-dropdown-item:hover{background:var(--panel2);}
.al-dropdown-item.active{background:rgba(45,212,167,.06);}
.al-dropdown-info{flex:1; display:flex; flex-direction:column; gap:1px; min-width:0;}
.al-dropdown-meta{font-size:11px; color:var(--muted); font-family:'IBM Plex Mono';}
.al-dropdown-sep{height:1px; background:var(--hair); margin:4px 0;}
.al-dropdown-add{color:var(--climb); font-size:12.5px;}

/* nav */
.al-nav{display:flex; flex-direction:column; gap:2px;}
.al-nav-item{
  position:relative; width:100%; display:flex; align-items:center; gap:10px;
  padding:10px 12px; background:none; border:none; border-radius:9px;
  color:var(--muted); font-size:13.5px; font-weight:500; cursor:pointer;
  text-align:left; font-family:'Inter'; transition:background .15s, color .15s;
}
.al-nav-item:hover{background:var(--panel2); color:var(--text);}
.al-nav-item.active{background:rgba(45,212,167,.08); color:var(--text);}
.al-nav-active-bar{
  position:absolute; right:10px; width:4px; height:4px; border-radius:50%;
  background:var(--climb);
}

/* footer */
.al-footer{display:flex; align-items:center; gap:10px; padding:12px 6px 0;
  border-top:1px solid var(--hair); margin-top:12px;}
.al-footer-avatar{
  width:28px; height:28px; border-radius:8px;
  background:rgba(45,212,167,.1); border:1px solid rgba(45,212,167,.2);
  display:flex; align-items:center; justify-content:center; color:var(--climb);
  flex:none;
}
.al-footer-user{display:flex; align-items:center; gap:8px; flex:1; min-width:0;}
.al-footer-name{font-size:12.5px; font-weight:500; white-space:nowrap;
  overflow:hidden; text-overflow:ellipsis;}
.al-signout{background:none; border:none; color:var(--muted); cursor:pointer;
  padding:6px; border-radius:6px; display:flex; transition:color .2s, background .2s;}
.al-signout:hover{color:var(--danger); background:rgba(251,85,102,.08);}

/* main */
.al-main{
  flex:1; margin-left:var(--sidebar-w);
  min-width:0; padding:28px clamp(16px,3vw,40px);
}

/* topbar mobile */
.al-topbar{display:none;}
.al-hamburger{background:none; border:none; color:var(--text); cursor:pointer; padding:4px;}

/* drawer + overlay mobile */
.al-overlay{position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:30;}
.al-drawer{
  position:fixed; top:0; left:0; height:100vh; width:260px; z-index:40;
  background:var(--panel); border-right:1px solid var(--hair);
  display:flex; flex-direction:column; padding:24px 16px;
  animation:slideIn .22s ease;
}
.al-drawer-close{
  position:absolute; top:16px; right:16px; background:none; border:none;
  color:var(--muted); cursor:pointer; padding:4px;
}
.al-logo-mobile{font-family:'Space Grotesk'; font-weight:700; font-size:17px; letter-spacing:.04em;}
.al-logo-mobile b{color:var(--climb);}

@keyframes slideIn{from{transform:translateX(-100%);} to{transform:translateX(0);}}

@media(max-width:768px){
  .al-sidebar{display:none;}
  .al-topbar{
    display:flex; align-items:center; justify-content:space-between;
    background:var(--panel); border-bottom:1px solid var(--hair);
    padding:14px 20px; position:sticky; top:0; z-index:10;
  }
  .al-main{margin-left:0; padding-top:14px;}
}
`;
