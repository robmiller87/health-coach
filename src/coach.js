// Coach — turns a verdict + data into a WhatsApp-sized reply.
// Architecture: rules decide (verdict.js), the LLM only phrases.
// If no LLM key is configured (or the call fails), we fall back to
// deterministic phrasing so the coach always answers.

import { computeVerdict } from './verdict.js';
import { complete } from './llm.js';

const DISCLAIMER =
  'Note: this is training guidance based on your wearable data, not medical advice.';

const VERDICT_LINES = {
  recover: 'avoid high intensity today — choose Zone 2, mobility, or a light strength session',
  moderate: 'keep training moderate and watch how you feel after warm-up',
  train: 'train normally, but still respect warm-up feedback'
};

function fmt(v, suffix = '') {
  return v == null ? 'n/a' : `${v}${suffix}`;
}

export function deterministicReply({ userProfile, summary, verdict }) {
  const lines = [
    `Readiness: ${fmt(summary.readiness, '%')}. Sleep: ${fmt(summary.sleep_hours, 'h')}. Yesterday: ${fmt(summary.activity_yesterday?.active_calories)} active kcal.`,
    `Based on your goal (${userProfile.goal}): ${VERDICT_LINES[verdict.verdict]}.`
  ];
  if (verdict.habits.length) {
    lines.push(`Also: ${verdict.habits.join(', ')}.`);
  }
  return lines.join('\n\n');
}

export async function generateCoachReply({ userProfile, summary, message, includeDisclaimer = false }) {
  const verdict = computeVerdict(summary);

  const system = [
    'You are a direct, practical health coach replying on WhatsApp.',
    'You will receive wearable data and a pre-computed training verdict.',
    'The verdict is authoritative: never recommend more intensity than it allows.',
    'Reply in 2-4 short sentences. No greetings, no emojis unless the user used them.',
    'Be specific: reference the actual numbers when they explain the advice.',
    'You give training and lifestyle guidance only — never medical diagnosis or treatment advice.'
  ].join(' ');

  const user = JSON.stringify({
    profile: userProfile,
    today: summary,
    verdict,
    user_message: message
  });

  const llmReply = await complete({ system, user });
  let reply = llmReply || deterministicReply({ userProfile, summary, verdict });

  if (includeDisclaimer) {
    reply += `\n\n${DISCLAIMER}`;
  }

  return { reply, verdict };
}
