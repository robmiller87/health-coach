import test from 'node:test';
import assert from 'node:assert';
import { getMockSummary } from './providers/mock.js';
import { computeVerdict } from './verdict.js';
import { generateCoachReply, deterministicReply } from './coach.js';
import { verifySignature, extractTextMessages } from './whatsapp.js';
import crypto from 'node:crypto';

const profile = { goal: 'performance + recovery' };

// --- verdict engine ---

test('very low readiness → recover', () => {
  const v = computeVerdict(getMockSummary({ readiness: 25 }));
  assert.equal(v.verdict, 'recover');
  assert.equal(v.intensity_cap, 'zone2');
});

test('low readiness + hard yesterday → recover', () => {
  const v = computeVerdict(getMockSummary({ readiness: 42, activity_yesterday: { active_calories: 700 } }));
  assert.equal(v.verdict, 'recover');
});

test('low readiness alone → moderate', () => {
  const v = computeVerdict(getMockSummary({ readiness: 45, activity_yesterday: { active_calories: 300 } }));
  assert.equal(v.verdict, 'moderate');
});

test('good readiness, easy yesterday → train', () => {
  const v = computeVerdict(getMockSummary({ readiness: 85, sleep_hours: 8.1, activity_yesterday: { active_calories: 300 } }));
  assert.equal(v.verdict, 'train');
  assert.equal(v.intensity_cap, 'none');
});

test('short sleep adds habit flags', () => {
  const v = computeVerdict(getMockSummary({ sleep_hours: 5.5 }));
  assert.ok(v.flags.includes('short_sleep'));
  assert.ok(v.habits.length > 0);
});

// --- coach (deterministic fallback path; no GROQ_API_KEY in tests) ---

test('coach reply respects recover verdict', async () => {
  delete process.env.GROQ_API_KEY;
  const { reply, verdict } = await generateCoachReply({
    userProfile: profile,
    summary: getMockSummary({ readiness: 30 }),
    message: 'Should I train hard today?'
  });
  assert.equal(verdict.verdict, 'recover');
  assert.match(reply, /avoid high intensity/);
});

test('disclaimer appears when requested', async () => {
  delete process.env.GROQ_API_KEY;
  const { reply } = await generateCoachReply({
    userProfile: profile,
    summary: getMockSummary(),
    message: 'hi',
    includeDisclaimer: true
  });
  assert.match(reply, /not medical advice/);
});

test('missing fields render as n/a without crashing', () => {
  const summary = getMockSummary({ readiness: null, sleep_hours: null, activity_yesterday: {} });
  const reply = deterministicReply({ userProfile: profile, summary, verdict: computeVerdict(summary) });
  assert.match(reply, /n\/a/);
});

// --- whatsapp helpers ---

test('signature verification accepts valid HMAC and rejects bad one', () => {
  const secret = 'test-secret';
  const body = '{"hello":"world"}';
  const sig = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(verifySignature(body, sig, secret), true);
  assert.equal(verifySignature(body, 'sha256=deadbeef', secret), false);
});

test('extractTextMessages pulls text and ignores statuses', () => {
  const payload = {
    entry: [{ changes: [{ value: {
      messages: [
        { type: 'text', from: '33600000000', text: { body: 'train today?' } },
        { type: 'image', from: '33600000000' }
      ],
      statuses: [{ status: 'delivered' }]
    } }] }]
  };
  const msgs = extractTextMessages(payload);
  assert.equal(msgs.length, 1);
  assert.equal(msgs[0].text, 'train today?');
});
