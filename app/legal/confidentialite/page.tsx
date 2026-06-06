'use client'
export const dynamic = 'force-dynamic'
import LegalShell, { H2 } from '../LegalShell'

export default function Confidentialite() {
  return (
    <LegalShell title="Politique de Confidentialité" updated="6 juin 2026">
      <p>MonWe Infinity LLC attache une grande importance à la protection de vos données personnelles. Cette politique explique quelles données nous collectons, pourquoi et comment nous les utilisons, en conformité avec les réglementations applicables en matière de protection des données.</p>

      <H2>1. Responsable du traitement</H2>
      <p>MonWe Infinity LLC — Albuquerque, New Mexico, USA — EIN 38-4396094 — monweci@gmail.com</p>

      <H2>2. Données collectées</H2>
      <p><strong>Données d'inscription :</strong> nom, adresse email, pays, devise et langue préférées. Si vous utilisez la connexion Google, nous recevons votre nom et votre adresse email via OAuth.</p>
      <p><strong>Données de profil trading :</strong> type de trading pratiqué, broker préféré, niveau de risque, actifs favoris. Ces données sont facultatives et servent à personnaliser les analyses générées.</p>
      <p><strong>Données d'usage :</strong> analyses effectuées, signaux consultés, événements macroéconomiques suivis, streak de connexion, points d'expérience (XP).</p>
      <p><strong>Données financières :</strong> historique des abonnements (plan, statut, date), transactions de crédits (ajout, débit, type, description), solde de crédits. Les données de paiement (numéros de carte, coordonnées bancaires) sont traitées exclusivement par GeniusPay et ne transitent jamais par nos serveurs.</p>
      <p><strong>Données techniques :</strong> adresse IP, type de navigateur, timestamps de connexion — collectés automatiquement à des fins de sécurité.</p>

      <H2>3. Images de graphiques</H2>
      <p>Les captures d'écran de graphiques que vous téléversez sont transmises à l'API Anthropic pour générer une analyse IA. Elles sont conservées dans votre historique personnel pour une durée de 90 jours (plan Pro) ou illimitée (plan Elite), puis supprimées. Elles ne sont pas partagées publiquement.</p>

      <H2>4. Données de crédits et transactions</H2>
      <p>Chaque mouvement de votre solde de crédits (inscription, recharge mensuelle, achat de pack, débit par analyse, remboursement) est enregistré dans votre historique de transactions. Ces données sont utilisées pour calculer votre solde en temps réel, résoudre les litiges et produire les rapports de trésorerie internes (sans identification personnelle dans les rapports agrégés).</p>

      <H2>5. Utilisation des données</H2>
      <p>Vos données servent à : fournir et améliorer le service ; gérer votre abonnement et votre solde de crédits ; vous envoyer des notifications que vous avez activées (alertes annonces, quota bas, plan activé) ; assurer la sécurité de votre compte ; calculer vos statistiques de trading (streak, XP, historique). Nous ne vendons jamais vos données à des tiers.</p>

      <H2>6. Sous-traitants</H2>
      <p>Nous faisons appel aux prestataires suivants, chacun s'engageant à traiter vos données de manière sécurisée :</p>
      <p><strong>Vercel</strong> (hébergement applicatif) · <strong>Supabase</strong> (base de données, authentification, stockage) · <strong>Anthropic</strong> (analyse IA des graphiques — vos images sont soumises à leur politique de confidentialité) · <strong>GeniusPay</strong> (paiements — vos données bancaires leur sont transmises directement) · <strong>Google AdSense</strong> (publicité contextuelle sur les pages accessibles sans connexion)</p>

      <H2>7. Cookies et publicité</H2>
      <p>Nous utilisons des cookies strictement nécessaires au fonctionnement du service (gestion de session, préférences thème). La plateforme intègre Google AdSense qui peut déposer des cookies à des fins publicitaires sur les pages publiques. Vous pouvez gérer vos préférences publicitaires via les paramètres de votre navigateur ou via <a href="https://adssettings.google.com" target="_blank" style={{ color:'var(--ac)' }}>adssettings.google.com</a>.</p>

      <H2>8. Durée de conservation</H2>
      <p>Vos données de compte sont conservées pendant toute la durée de votre abonnement et 3 ans après suppression du compte (obligation légale comptable). L'historique des analyses est conservé 90 jours (Pro) ou sans limite (Elite). Les données de transactions de crédits sont conservées 5 ans.</p>

      <H2>9. Vos droits</H2>
      <p>Vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité et d'opposition au traitement de vos données. Pour exercer ces droits, contactez-nous à monweci@gmail.com en indiquant votre identifiant ProfityX (PX-XXXXXX visible dans votre profil). Vous pouvez également supprimer votre compte directement depuis Paramètres → Compte → Supprimer le compte.</p>

      <H2>10. Sécurité</H2>
      <p>Vos mots de passe sont chiffrés via bcrypt et ne sont jamais accessibles en clair. Toutes les communications sont chiffrées via HTTPS/TLS. L'accès à la base de données est protégé par Row Level Security (RLS) — chaque utilisateur ne peut accéder qu'à ses propres données.</p>

      <H2>11. Contact</H2>
      <p>Pour toute question relative à vos données personnelles : monweci@gmail.com — Support WhatsApp : +225 0500 44 64 64</p>
    </LegalShell>
  )
}
