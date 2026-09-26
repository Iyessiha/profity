import type { Metadata } from "next";
import { Check } from "lucide-react";
import { SignalCard } from "@/components/signal/signal-card";
import { Badge, TierBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader, CardTitle, DataRow } from "@/components/ui/card";
import { Sparkline, StatTile } from "@/components/ui/stat-tile";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatMoney, formatPercent } from "@/lib/format";
import type { Signal } from "@/types/domain";

export const metadata: Metadata = {
  title: "Design system",
};

const SAMPLE: Signal = {
  id: "demo",
  symbol: "XAUUSD",
  timeframe: "H4",
  direction: "LONG",
  orderType: "BUY_LIMIT",
  levels: {
    entry: 2418.6,
    stopLoss: 2404.15,
    takeProfit: [2447.9, 2463.4, 2481],
    rewardToRisk: 2.8,
  },
  conclusion: "Retour attendu sur l'Order Block H4.",
  outcome: "pending",
  createdAt: "2026-09-26T14:05:00Z",
  confidence: "HIGH",
  trend: "BULLISH",
  phase: "accumulation",
  confluences: ["Order Block H4", "FVG comblé", "BOS confirmé"],
  reasoning:
    "Le prix redescend vers l'Order Block haussier de H4 après une cassure de structure. Le déséquilibre laissé à 2 431 est comblé et la liquidité sous 2 405 a été prise. Entrée en limite sur la zone, invalidation sous le bloc.",
};

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1.5 max-w-[62ch] text-sm text-text-muted">{note}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function DesignPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-24">
      {/* ── Masthead ───────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-4 py-12">
        <div>
          <p className="label-caps">Profity v2 · Fondations</p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Design system
          </h1>
          <p className="mt-3 max-w-[60ch] text-[1.0625rem] text-text-muted">
            Deux registres, un seul vocabulaire de jetons. Aucun composant ne
            nomme une couleur : changer de registre ou de thème ne demande
            aucune modification de composant.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-col gap-12">
        {/* ── Palette ─────────────────────────────────────────────── */}
        <Section
          title="Jetons sémantiques"
          note="Le vert et le rouge appartiennent au marché : LONG, gain, objectif d'un côté ; SHORT, perte, stop de l'autre. L'accent de marque est volontairement hors de cet axe, pour qu'une surface de marque ne puisse jamais passer pour un résultat."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: "surface-raised", cls: "bg-surface-raised", role: "Carte" },
              { name: "surface-sunken", cls: "bg-surface-sunken", role: "Puits" },
              { name: "accent", cls: "bg-accent", role: "Marque" },
              { name: "line-strong", cls: "bg-line-strong", role: "Bordure" },
              { name: "long", cls: "bg-long", role: "LONG · gain · objectif" },
              { name: "short", cls: "bg-short", role: "SHORT · perte · stop" },
              { name: "warn", cls: "bg-warn", role: "Limite approchée" },
              { name: "flat", cls: "bg-flat", role: "Neutre · attendre" },
            ].map((t) => (
              <div
                key={t.name}
                className="overflow-hidden rounded-[var(--radius-card)] border border-line"
              >
                <div className={`h-14 ${t.cls}`} />
                <div className="border-t border-line bg-surface-raised px-2.5 py-2">
                  <span className="block font-mono text-[0.6875rem] text-text-strong">
                    {t.name}
                  </span>
                  <span className="block text-[0.6875rem] text-text-muted">
                    {t.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Signal ──────────────────────────────────────────────── */}
        <Section
          title="Carte de signal"
          note="Le composant central du produit, ici dans le registre application. Les niveaux sont toujours complets, quel que soit le plan : le palier ne restreint que le raisonnement, jamais la qualité du signal."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="label-caps mb-2.5">Plan Pro — raisonnement inclus</p>
              <SignalCard signal={SAMPLE} tier="pro" />
            </div>
            <div>
              <p className="label-caps mb-2.5">Plan gratuit — niveaux seuls</p>
              <SignalCard signal={SAMPLE} tier="free" />
            </div>
          </div>
        </Section>

        {/* ── Tiles ───────────────────────────────────────────────── */}
        <Section
          title="Tuiles de mesure"
          note="Chiffres monospace à largeur fixe : une colonne de prix doit s'aligner d'une ligne à l'autre. Le dernier point d'une courbe est accentué, puisque c'est l'information qu'on y cherche."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile
              label="Réussite · 30 jours"
              value={formatPercent(68.4)}
              tone="long"
              caption="71 gagnants sur 104 notés"
            >
              <Sparkline points={[52, 55, 54, 59, 58, 63, 62, 68.4]} tone="long" />
            </StatTile>
            <StatTile
              label="Analyses restantes"
              value="12"
              suffix="/ 40"
              progress={12 / 40}
              caption="Plan Pro · recharge le 1er novembre"
            />
            <StatTile
              label="Perte du jour"
              value={formatMoney(38_500, "XOF")}
              suffix="/ 125 000"
              tone="short"
              progress={38_500 / 125_000}
              caption="Limite journalière FTMO · 31 % consommés"
            />
          </div>
        </Section>

        {/* ── Controls ────────────────────────────────────────────── */}
        <Section
          title="Contrôles et états"
          note="Les tons sémantiques restent réservés au marché : un bouton destructeur emprunte le rouge parce qu'il détruit, un badge LONG parce que le marché monte. Rien d'autre ne les utilise."
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button>Analyser un graphique</Button>
              <Button variant="secondary">Voir l&apos;historique</Button>
              <Button variant="quiet">Passer au plan Pro</Button>
              <Button variant="ghost">Annuler</Button>
              <Button variant="danger">Clôturer le challenge</Button>
              <Button disabled>Quota épuisé</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="long" solid>LONG</Badge>
              <Badge tone="short" solid>SHORT</Badge>
              <Badge tone="flat">ATTENDRE</Badge>
              <Badge tone="accent">Confiance haute</Badge>
              <Badge tone="warn">Limite à 80 %</Badge>
              <Badge tone="info">Ordre en attente</Badge>
              <Badge tone="neutral">Order Block H4</Badge>
              <TierBadge tier="free" />
              <TierBadge tier="pro" />
              <TierBadge tier="elite" />
            </div>
          </div>
        </Section>

        {/* ── Document register ───────────────────────────────────── */}
        <Section
          title="Registre document"
          note="Les écrans où l'utilisateur sort sa carte bancaire changent de registre : fond clair, indigo, chaque valeur étiquetée dans sa case. Mêmes composants, mêmes jetons — seul le conteneur porte data-register."
        >
          <div
            data-register="document"
            className="rounded-[var(--radius-card)] border border-line p-5"
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Plan Pro</CardTitle>
                  <TierBadge tier="pro" />
                </CardHeader>
                <CardBody>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-3xl font-bold text-text-strong tabular">
                      {formatMoney(9_000, "XOF")}
                    </span>
                    <span className="text-sm text-text-muted">/ mois</span>
                  </div>
                  <ul className="mt-4 flex flex-col gap-2">
                    {[
                      "40 analyses de graphique par mois",
                      "Raisonnement Smart Money complet",
                      "Signaux sur événements économiques",
                      "Alertes Telegram et WhatsApp",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-long"
                          aria-hidden
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
                <CardFooter>
                  <Button className="w-full">Choisir le plan Pro</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Facture PRO-2026-0418</CardTitle>
                  <Badge tone="long">Payée</Badge>
                </CardHeader>
                <div>
                  <DataRow label="Client">Amadou Diallo</DataRow>
                  <DataRow label="Plan">Pro · mensuel</DataRow>
                  <DataRow label="Moyen de paiement">Orange Money</DataRow>
                  <DataRow label="Montant">{formatMoney(9_000, "XOF")}</DataRow>
                  <DataRow label="Équivalent">{formatMoney(14.35, "USD")}</DataRow>
                  <DataRow label="Émise le">26 septembre 2026</DataRow>
                </div>
                <CardFooter>
                  <Button variant="secondary" size="sm">
                    Télécharger le PDF
                  </Button>
                  <Button variant="ghost" size="sm">
                    Renvoyer par e-mail
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
