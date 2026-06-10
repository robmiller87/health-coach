import test from 'node:test';
import assert from 'node:assert';
import { getMockSummary } from './providers/mock.js';
import { generateCoachReply } from './coach.js';

const profile = { goal: 'performance + recovery' };

test('low readiness + hard yesterday → no intensity', () => {
  const reply = generateCoachReply({
    userProfile: profile,
    summary: getMockSummary({ readiness: 42, activity_yesterday: { active_calories: 700 } }),
    message: 'Should I train hard today?'
  });
  assert.match(reply, /avoid high intensity/);
});

test('low readiness alone → moderate', () => {
  const reply = generateCoachReply({
    userProfile: profile,
    summary: getMockSummary({ readiness: 45, activity_yesterday: { active_calories: 300 } }),
    message: 'check-in'
  });
  assert.match(reply, /keep training moderate/);
});

test('good readiness → train normally', () => {
  const reply = generateCoachReply({
    userProfile: profile,
    summary: getMockSummary({ readiness: 85, sleep_hours: 8.1, activity_yesterday: { active_calories: 300 } }),
    message: 'check-in'
  });
  assert.match(reply, /train normally/);
});

test('short sleep adds recovery habits', () => {
  const reply = generateCoachReply({
    userProfile: profile,
    summary: getMockSummary({ sleep_hours: 5.5 }),
    message: 'check-in'
  });
  assert.match(reply, /earlier night/);
});

test('missing fields render as n/a without crashing', () => {
  const reply = generateCoachReply({
    userProfile: profile,
    summary: getMockSummary({ readiness: null, sleep_hours: null, activity_yesterday: {} }),
    message: 'check-in'
  });
  assert.match(reply, /n\/a/);
});
