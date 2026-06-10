// Deterministic coaching rules over the normalized daily summary.
// These rules stay the "verdict engine" even once an LLM phrases the reply.

export function generateCoachReply({ userProfile, summary, message }) {
  const lowReadiness = summary.readiness != null && summary.readiness < 50;
  const hardYesterday =
    summary.activity_yesterday?.active_calories != null &&
    summary.activity_yesterday.active_calories >= 600;
  const shortSleep = summary.sleep_hours != null && summary.sleep_hours < 7;

  const recommendations = [];

  if (lowReadiness && hardYesterday) {
    recommendations.push('avoid high intensity today');
    recommendations.push('choose Zone 2, mobility, or a lighter strength session');
  } else if (lowReadiness) {
    recommendations.push('keep training moderate and watch how you feel after warm-up');
  } else {
    recommendations.push('you can train normally, but still respect warm-up feedback');
  }

  if (shortSleep) {
    recommendations.push('prioritize hydration, protein, and an earlier night');
  }

  const fmt = (v, suffix = '') => (v == null ? 'n/a' : `${v}${suffix}`);

  return [
    `Readiness: ${fmt(summary.readiness, '%')}. Sleep: ${fmt(summary.sleep_hours, 'h')}. Yesterday: ${fmt(summary.activity_yesterday?.active_calories)} active kcal.`,
    `Based on your goal (${userProfile.goal}), I would ${recommendations.join('; ')}.`
  ].join('\n\n');
}
