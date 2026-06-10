import http from 'node:http';
import { getDailySummary } from './providers/index.js';
import { generateCoachReply } from './coach.js';

const userProfile = {
  name: 'Robert',
  goal: 'performance + recovery',
  training_frequency: '4x/week',
  tone: 'direct and practical'
};

const MAX_BODY = 10 * 1024; // 10 KB is plenty for a chat message

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { ok: true, provider: process.env.PROVIDER || 'mock' });
  }

  if (req.method === 'POST' && req.url === '/coach') {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > MAX_BODY) {
        json(res, 413, { error: 'payload_too_large' });
        req.destroy();
      }
    });
    req.on('end', async () => {
      if (res.writableEnded) return;

      let body = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        return json(res, 400, { error: 'invalid_json' });
      }

      try {
        const summary = await getDailySummary();
        const reply = generateCoachReply({
          userProfile,
          summary,
          message: body.message || 'Check-in'
        });
        json(res, 200, { reply, summary });
      } catch (err) {
        console.error(err);
        json(res, 502, { error: 'provider_error', detail: err.message });
      }
    });
    return;
  }

  json(res, 404, { error: 'not_found' });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`health-coach-mvp listening on http://localhost:${port}`);
});
