// ============================================================
// PROFITYX — Client WhatsApp Cloud API
// ============================================================

const WA_API  = 'https://graph.facebook.com/v19.0'
const PHONE_ID = process.env.WHATSAPP_PHONE_ID!
const TOKEN    = process.env.WHATSAPP_TOKEN!

export interface WaMessage {
  from: string
  id: string
  text?: { body: string }
  type: string
  timestamp: string
}

// Envoyer un message texte
export async function sendText(to: string, text: string) {
  return fetch(`${WA_API}/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text, preview_url: false },
    }),
  })
}

// Envoyer des boutons de réponse rapide
export async function sendButtons(to: string, body: string, buttons: { id: string; title: string }[]) {
  return fetch(`${WA_API}/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body },
        action: {
          buttons: buttons.map(b => ({
            type: 'reply',
            reply: { id: b.id, title: b.title.slice(0, 20) },
          })),
        },
      },
    }),
  })
}

// Marquer un message comme lu
export async function markAsRead(messageId: string) {
  return fetch(`${WA_API}/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  })
}

// Extraire le texte d'un message entrant
export function extractText(msg: WaMessage): string {
  if (msg.type === 'text') return msg.text?.body ?? ''
  if (msg.type === 'interactive') {
    const m = msg as Record<string, Record<string, Record<string, string>>>
    return m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? ''
  }
  return ''
}
