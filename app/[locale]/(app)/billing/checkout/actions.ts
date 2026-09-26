"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as adminClient } from "@supabase/supabase-js";
import { createCheckout } from "@/lib/payments/geniuspay";

// Prices in XOF (no minor unit — 1 XOF = 1 unit)
const TIER_PRICES: Record<string, number> = {
  pro:   4900,
  elite: 12900,
};

export async function startCheckout(tier: "pro" | "elite") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  const amount = TIER_PRICES[tier];
  if (!amount) throw new Error(`Unknown tier: ${tier}`);

  // Create checkout_intent (service-role to bypass RLS on insert)
  const admin = adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 2);

  const { data: intent, error: intentErr } = await admin
    .from("checkout_intents")
    .insert({
      user_id:      user.id,
      tier,
      amount_minor: amount,
      currency:     "XOF",
      provider:     "geniuspay",
      expires_at:   expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (intentErr || !intent) {
    throw new Error(`Failed to create checkout intent: ${intentErr?.message}`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const locale = await getLocale();

  const session = await createCheckout({
    checkoutIntentId: intent.id,
    amount,
    currency:    "XOF",
    description: `Profity ${tier.charAt(0).toUpperCase() + tier.slice(1)} — 1 mois`,
    successUrl:  `${appUrl}/${locale}/billing/success?intent=${intent.id}`,
    errorUrl:    `${appUrl}/${locale}/billing/error?intent=${intent.id}`,
    customer: {
      email: user.email,
    },
  });

  // Save GP reference on the intent so we can look it up if needed
  await admin
    .from("checkout_intents")
    .update({ provider_ref: session.gpReference } as never)
    .eq("id", intent.id);

  redirect(session.checkoutUrl);
}
