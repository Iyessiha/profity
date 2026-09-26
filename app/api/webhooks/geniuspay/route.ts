/* ============================================================================
   GeniusPay webhook handler
   Docs: https://geniuspay.ci/docs/api — section Webhooks
   ----------------------------------------------------------------------------
   Safety guarantees:
   1. Signature + timestamp window verified before any DB access.
   2. (provider, external_id) unique index turns a replay into a silent 200.
   3. All writes use the service role (bypasses RLS — server-only).
   4. Subscription activated only after payment row is committed.
   ============================================================================ */

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  verifyWebhookSignature,
  type GpWebhookPayload,
} from "@/lib/payments/geniuspay";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const rawBody   = await req.text();
  const signature = req.headers.get("x-webhook-signature") ?? "";
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const eventType = req.headers.get("x-webhook-event")     ?? "";

  // 1. Verify signature + timestamp
  let valid = false;
  try {
    valid = verifyWebhookSignature({ rawBody, signature, timestamp });
  } catch {
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }
  if (!valid) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: GpWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as GpWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const externalId = payload.id; // GeniusPay webhook UUID
  if (!externalId) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  // 2. Record event idempotently
  const { error: insertErr } = await admin.from("webhook_events").insert({
    provider:     "geniuspay",
    external_id:  externalId,
    event_type:   eventType || payload.event,
    payload:      payload as unknown as Record<string, unknown>,
    signature_ok: true,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      // Already processed — idempotent 200
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("webhook_events insert:", insertErr);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // 3. Handle event
  let processingError: string | undefined;
  try {
    const event = eventType || payload.event;
    if (event === "payment.success" && payload.data?.status === "completed") {
      await handlePaymentSuccess(payload);
    }
    // payment.failed / payment.cancelled / payment.expired → no subscription
  } catch (err) {
    processingError = String(err);
    console.error("GeniusPay webhook processing:", err);
  }

  // 4. Mark processed (or record error)
  await admin
    .from("webhook_events")
    .update({
      processed_at: new Date().toISOString(),
      error:        processingError ?? null,
    })
    .eq("provider", "geniuspay")
    .eq("external_id", externalId);

  if (processingError) {
    return NextResponse.json({ error: "processing_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// ── Business logic ────────────────────────────────────────────────────────────

async function handlePaymentSuccess(payload: GpWebhookPayload): Promise<void> {
  // Our checkout_intent UUID is stored in metadata.checkout_id
  const checkoutId = payload.data?.metadata?.checkout_id;
  if (!checkoutId) {
    throw new Error(
      `GeniusPay payment.success: missing metadata.checkout_id (gp_ref=${payload.data?.reference})`,
    );
  }

  // Load the intent
  const { data: intent, error: intentErr } = await admin
    .from("checkout_intents")
    .select("id,user_id,tier,amount_minor,currency,completed_at")
    .eq("id", checkoutId)
    .single();

  if (intentErr || !intent) {
    throw new Error(`checkout_intent not found: ${checkoutId}`);
  }
  if (intent.completed_at) return; // already handled by a previous delivery

  // Insert payment record
  const { data: payment, error: payErr } = await admin
    .from("payments")
    .insert({
      user_id:      intent.user_id,
      amount_minor: intent.amount_minor,
      currency:     intent.currency,
      status:       "succeeded",
      provider:     "geniuspay",
      provider_ref: payload.data.reference,
      paid_at:      new Date().toISOString(),
    })
    .select("id")
    .single();

  if (payErr) throw new Error(`payments insert: ${payErr.message}`);

  // Activate subscription (1 calendar month)
  if (intent.tier) {
    const start = new Date();
    const end   = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const { error: subErr } = await admin.from("subscriptions").insert({
      user_id:              intent.user_id,
      tier:                 intent.tier,
      status:               "active",
      amount_minor:         intent.amount_minor,
      currency:             intent.currency,
      current_period_start: start.toISOString(),
      current_period_end:   end.toISOString(),
      provider:             "geniuspay",
      provider_ref:         payment.id,
    });

    if (subErr) throw new Error(`subscriptions insert: ${subErr.message}`);
  }

  // Seal the intent
  await admin
    .from("checkout_intents")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", checkoutId);
}
