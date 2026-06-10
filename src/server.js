import http from 'node:http';
import { getDailySummary } from './providers/index.js';
import { getMockSummary } from './providers/mock.js';
import { generateCoachReply } from './coach.js';
import { getUser, updateUser } from './users.js';
import { verifySignature, extractTextMessages, sendText } from './whatsapp.js';

const MAX_BODY = 64 * 1024; // webhook payloads are bigger than chat messages

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
}

function readBody(req, res) {
  return new Promise(resolve => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > MAX_BODY) {
        json(res, 413, { error: 'payload_too_large' });
        req.destroy();
        resolve(null);
      }
    });
    req.on('end', () => resolve(res.writableEnded ? null : raw));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return json(res, 200, { ok: true, provider: process.env.PROVIDER || 'mock' });
  }

  // --- WhatsApp webhook verification (Meta calls this once on setup) ---
  if (req.method === 'GET' && url.pathname === '/webhook') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      res.writeHead(200, { 'content-type': 'text/plain' });
      return res.end(challenge);
    }
    return json(res, 403, { error: 'verification_failed' });
  }

  // --- WhatsApp inbound messages ---
  if (req.method === 'POST' && url.pathname === '/webhook') {
    const raw = await readBody(req, res);
    if (raw == null) return;

    const valid = verifySignature(
      raw,
      req.headers['x-hub-signature-256'],
      process.env.WHATSAPP_APP_SECRET
    );
    if (!valid) return json(res, 401, { error: 'bad_signature' });

    let payload = {};
    try {
      payload = JSON.parse(raw);
    } catch {
      return json(res, 400, { error: 'invalid_json' });
    }

    // Ack immediately — Meta retries on slow responses.
    json(res, 200, { received: true });

    for (const { from, text } of extractTextMessages(payload)) {
      try {
        const profile = getUser(from);
        const summary = await getDailySummary();
        const { reply } = await generateCoachReply({
          userProfile: profile,
          summary,
          message: text,
          includeDisclaimer: !profile.disclaimed
        });
        await sendText(from, reply);
        if (!profile.disclaimed) updateUser(from, { disclaimed: true });
      } catch (err) {
        console.error('webhook handling failed:', err.message);
      }
    }
    return;
  }

  // --- Direct API for local testing ---
  if (req.method === 'POST' && url.pathname === '/coach') {
    const raw = await readBody(req, res);
    if (raw == null) return;

    let body = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return json(res, 400, { error: 'invalid_json' });
    }

    try {
      // In mock mode, allow scenario overrides: {"summary": {"readiness": 90}}
      const provider = (process.env.PROVIDER || 'mock').toLowerCase();
      const summary =
        provider === 'mock' && body.summary
          ? getMockSummary(body.summary)
          : await getDailySummary();

      const profile = getUser(body.phone || 'local-test');
      const { reply, verdict } = await generateCoachReply({
        userProfile: profile,
        summary,
        message: body.message || 'Check-in'
      });
      json(res, 200, { reply, verdict, summary });
    } catch (err) {
      console.error(err);
      json(res, 502, { error: 'provider_error', detail: err.message });
    }
  } else if (!res.writableEnded) {
    json(res, 404, { error: 'not_found' });
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`health-coach-mvp listening on http://localhost:${port}`);
});
