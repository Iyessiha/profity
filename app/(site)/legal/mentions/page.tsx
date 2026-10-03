'use client'
export const dynamic = 'force-dynamic'
import LegalShell, { H2 } from '../LegalShell'

export default function Mentions() {
  return (
    <LegalShell title="Mentions Légales" updated="6 juin 2026">
      <H2>Éditeur du site</H2>
      <p>Le site et l'application ProfityX sont édités par MonWe Infinity LLC, société enregistrée dans l'État du Nouveau-Mexique (USA).</p>

      <H2>Coordonnées</H2>
      <p>MonWe Infinity LLC<br/>Albuquerque, Nouveau-Mexique, États-Unis<br/>Email : monweci@gmail.com</p>

      <H2>Directrice de la publication</H2>
      <p>Yessiha Ilboudo, gérante de MonWe Infinity LLC.</p>

      <H2>Hébergement</H2>
      <p>L'application est hébergée par Vercel Inc. L'infrastructure de base de données est fournie par Supabase.</p>

      <H2>Propriété intellectuelle</H2>
      <p>La marque ProfityX, son logo, son design et l'ensemble de ses contenus sont la propriété exclusive de MonWe Infinity LLC. Toute reproduction totale ou partielle sans autorisation est interdite.</p>

      <H2>Avertissement</H2>
      <p>ProfityX est un outil éducatif d'aide à la décision. Il ne fournit pas de conseil en investissement. Le trading comporte des risques de perte en capital.</p>
    </LegalShell>
  )
}
