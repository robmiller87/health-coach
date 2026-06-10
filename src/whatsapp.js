// WhatsApp Cloud API helpers: webhook signature verification + sending.
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks

import crypto from 'node:crypto';

// Meta signs webhook payloads with your app secret.
// Header: X-Hub-Signature-256: sha256=<hmac>
export function verifySignature(rawBody, signatureHeader, appSecret) {
  if (!appSecret) return true; // not configured yet — skip (dev mode)
  if (!signatureHeader?.startsWith('sha256=')) return false;

  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');
  const received = signatureHeader.slice('sha256='.length);

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}

// Extract inbound text messages from a webhook payload.
// Returns [{ from, text }] — ignores statuses, media, etc. for v0.
export function extractTextMessages(payload) {
  const out = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      for (const msg of change.value?.messages || []) {
        if (msg.type === 'text' && msg.text?.body) {
          out.push({ from: msg.from, text: msg.text.body });
        }
      }
    }
  }
  return out;
}

export async function sendText(to, body) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    console.log(`[whatsapp dry-run] to=${to}: ${body}`);
    return { dry_run: true };
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body }
      })
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`WhatsApp send failed: ${res.status} ${detail}`);
  }
  return res.json();
}
