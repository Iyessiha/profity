'use client'
export const dynamic = 'force-dynamic'
import LegalShell, { H2 } from '../LegalShell'

export default function Confidentialite() {
  return (
    <LegalShell title="Politique de Confidentialité" updated="6 juin 2026">
      <p>MonWe Infinity LLC attache une grande importance à la protection de vos données personnelles. Cette politique explique quelles données nous collectons et comment nous les utilisons.</p>

      <H2>1. Données collectées</H2>
      <p>Nous collectons les données que vous nous fournissez lors de l'inscription (nom, adresse email, pays, devise et langue préférées) ainsi que les données d'usage du service (analyses effectuées, signaux consultés). Si vous utilisez la connexion Google, nous recevons votre nom et votre adresse email.</p>

      <H2>2. Utilisation des données</H2>
      <p>Vos données servent à fournir et améliorer le service, gérer votre abonnement, vous envoyer des notifications que vous avez activées, et assurer la sécurité de votre compte. Nous ne vendons jamais vos données à des tiers.</p>

      <H2>3. Images de graphiques</H2>
      <p>Les captures d'écran de graphiques que vous téléversez sont traitées par notre moteur d'analyse IA pour générer un signal. Elles sont conservées dans votre historique afin que vous puissiez les retrouver, et ne sont pas partagées publiquement.</p>

      <H2>4. Sous-traitants</H2>
      <p>Nous faisons appel à des prestataires de confiance pour l'hébergement (Vercel), la base de données et l'authentification (Supabase), l'analyse IA (Anthropic) et les paiements (GeniusPay). Chacun traite vos données conformément à ses propres engagements de sécurité.</p>

      <H2>5. Cookies</H2>
      <p>Nous utilisons des cookies strictement nécessaires au fonctionnement (gestion de session). Aucun cookie publicitaire n'est déposé.</p>

      <H2>6. Vos droits</H2>
      <p>Vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Vous pouvez supprimer votre compte à tout moment depuis vos paramètres, ou nous écrire à monweci@gmail.com.</p>

      <H2>7. Sécurité</H2>
      <p>Vos mots de passe sont chiffrés et ne sont jamais accessibles en clair. Les communications sont sécurisées via HTTPS.</p>

      <H2>8. Contact</H2>
      <p>Pour toute question relative à vos données, contactez-nous à monweci@gmail.com.</p>
    </LegalShell>
  )
}
