/* ============================================================================
   Claude Vision — detect price range from a chart screenshot
   ============================================================================ */

import Anthropic from "@anthropic-ai/sdk";

export interface PriceRangeResult {
  min: number;
  max: number;
  /** true when Vision was confident enough to use; false = use manual fallback */
  reliable: boolean;
}

/**
 * Send a base64-encoded chart image to Claude Vision (Haiku — cheapest)
 * and extract the visible y-axis price range.
 * On any error or unreadable chart, returns {min:0,max:0,reliable:false}.
 */
export async function detectPriceRangeFromImage(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" = "image/png",
): Promise<PriceRangeResult> {
  const client = new Anthropic();

  try {
    const resp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 64,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Image },
            },
            {
              type: "text",
              text: 'Read the price values on the vertical (Y) axis of this trading chart. Return ONLY this JSON — no extra text: {"min":<lowest_visible_price>,"max":<highest_visible_price>}. Use 0 for both if you cannot read them.',
            },
          ],
        },
      ],
    });

    const text = resp.content.find((b) => b.type === "text")?.text ?? "";
    const match = text.match(/\{[^}]+\}/);
    if (!match) return { min: 0, max: 0, reliable: false };

    const parsed = JSON.parse(match[0]) as { min: number; max: number };
    const { min, max } = parsed;

    if (!isFinite(min) || !isFinite(max) || min <= 0 || max <= min) {
      return { min: 0, max: 0, reliable: false };
    }

    return { min, max, reliable: true };
  } catch {
    return { min: 0, max: 0, reliable: false };
  }
}
