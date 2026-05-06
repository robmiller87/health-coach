import http from 'node:http';
import { getMockWhoopSummary } from './mockWhoop.js';
import { generateCoachReply } from './coach.js';

const userProfile = {
  name: 'Robert',
  goal: 'performance + recovery',
  training_frequency: '4x/week',
  tone: 'direct and practical'
};

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { ok: true });
  }

  if (req.method === 'POST' && req.url === '/coach') {
    let raw = '';
    req.on('data', chunk => raw += chunk);
    req.on('end', () => {
      const body = raw ? JSON.parse(raw) : {};
      const whoop = getMockWhoopSummary();
      const reply = generateCoachReply({
        userProfile,
        whoop,
        message: body.message || 'Check-in'
      });
      json(res, 200, { reply, whoop });
    });
    return;
  }

  json(res, 404, { error: 'not_found' });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`health-coach-mvp listening on http://localhost:${port}`);
});
