/* ============================================================================
   GeniusPay payment client
   Docs: https://geniuspay.ci/docs/api
   ----------------------------------------------------------------------------
   Env vars (valeurs ajoutées par toi dans .env.local) :
     GENIUSPAY_API_KEY          — X-API-Key header  (pk_live_... ou pk_sandbox_...)
     GENIUSPAY_API_SECRET       — X-API-Secret header (sk_live_... ou sk_sandbox_...)
     GENIUSPAY_WEBHOOK_SECRET   — HMAC signing secret pour les webhooks
     GENIUSPAY_INIT_URL         — optionnel, défaut : https://geniuspay.ci/api/v1/merchant/payments
   ============================================================================ */

import { createHmac, timingSafeEqual } from "crypto";

const INIT_URL =
  process.env.GENIUSPAY_INIT_URL ??
  "https://geniuspay.ci/api/v1/merchant/payments";

const API_KEY    = process.env.GENIUSPAY_API_KEY!;
const API_SECRET = process.env.GENIUSPAY_API_SECRET!;
const WH_SECRET  = process.env.GENIUSPAY_WEBHOOK_SECRET!;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CheckoutParams {
  /** Our checkout_intent UUID — stored in metadata.checkout_id for webhook lookup. */
  checkoutIntentId: string;
  /** Amount in XOF (minimum 200). GeniusPay treats XOF as no minor unit. */
  amount: number;
  currency?: "XOF" | "EUR" | "USD";
  description: string;
  /** Where user lands after successful payment. */
  successUrl: string;
  /** Where user lands after failed/cancelled payment. */
  errorUrl: string;
  customer?: {
    name?:  string;
    email?: string;
    phone?: string;
  };
}

export interface CheckoutSession {
  /** GeniusPay transaction reference (MTX-...). */
  gpReference: string;
  /** GeniusPay internal integer ID. */
  gpId: number;
  /** URL to redirect the user to for payment. */
  checkoutUrl: string;
}

// ── Create checkout session ───────────────────────────────────────────────────

export async function createCheckout(
  params: CheckoutParams,
): Promise<CheckoutSession> {
  const body: Record<string, unknown> = {
    amount:      params.amount,
    currency:    params.currency ?? "XOF",
    description: params.description,
    success_url: params.successUrl,
    error_url:   params.errorUrl,
    metadata:    { checkout_id: params.checkoutIntentId },
  };

  if (params.customer) {
    body.customer = {
      name:  params.customer.name,
      email: params.customer.email,
      phone: params.customer.phone,
    };
  }

  const res = await fetch(INIT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key":    API_KEY,
      "X-API-Secret": API_SECRET,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GeniusPay create payment → ${res.status}: ${text}`);
  }

  const json = (await res.json()) as {
    success: boolean;
    data: {
      id: number;
      reference: string;
      checkout_url?: string;
      payment_url?: string;
    };
  };

  if (!json.success) {
    throw new Error(`GeniusPay: success=false — ${JSON.stringify(json)}`);
  }

  return {
    gpId:        json.data.id,
    gpReference: json.data.reference,
    checkoutUrl: json.data.checkout_url ?? json.data.payment_url ?? "",
  };
}

// ── Webhook signature verification ───────────────────────────────────────────
//
// GeniusPay signs: HMAC-SHA256( timestamp + "." + rawJsonBody, WH_SECRET )
// Header: X-Webhook-Signature (hex)  + X-Webhook-Timestamp (Unix seconds)
//
// We also enforce a ±5 minute timestamp window to block replay attacks.

export function verifyWebhookSignature(opts: {
  rawBody:   string;
  signature: string;   // X-Webhook-Signature header
  timestamp: string;   // X-Webhook-Timestamp header
}): boolean {
  if (!WH_SECRET) throw new Error("GENIUSPAY_WEBHOOK_SECRET is not set");

  // Timestamp window (300 s = 5 min)
  const ts = parseInt(opts.timestamp, 10);
  if (!isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    return false;
  }

  const signed  = `${opts.timestamp}.${opts.rawBody}`;
  const expected = createHmac("sha256", WH_SECRET).update(signed).digest("hex");
  const expBuf  = Buffer.from(expected, "hex");
  const recvBuf = Buffer.from(opts.signature, "hex");

  if (expBuf.length !== recvBuf.length) return false;
  return timingSafeEqual(expBuf, recvBuf);
}

// ── Webhook payload types ────────────────────────────────────────────────────

export type GpPaymentStatus =
  | "pending" | "processing" | "completed"
  | "failed"  | "cancelled"  | "refunded" | "expired";

export interface GpWebhookPayload {
  id:        string;
  event:     string;
  timestamp: number;
  data: {
    object:     string;
    id:         number;
    reference:  string;
    amount:     number;
    status:     GpPaymentStatus;
    metadata:   Record<string, string> | null;
  };
  environment: "sandbox" | "live";
}
