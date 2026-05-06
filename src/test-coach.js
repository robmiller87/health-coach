import { getMockWhoopSummary } from './mockWhoop.js';
import { generateCoachReply } from './coach.js';

const reply = generateCoachReply({
  userProfile: { goal: 'performance + recovery' },
  whoop: getMockWhoopSummary(),
  message: 'Should I train hard today?'
});

console.log(reply);
