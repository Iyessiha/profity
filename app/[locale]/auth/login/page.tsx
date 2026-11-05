import { redirect } from "next/navigation";

// Ancienne URL /auth/login (liens partagés, parrainage) : renvoie vers la page
// de connexion de la langue courante.
export default async function LegacyLoginRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale === "en" ? "en" : "fr"}/login`);
}
