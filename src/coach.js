export function generateCoachReply({ userProfile, whoop, message }) {
  const lowRecovery = whoop.recovery_score < 50;
  const highStrain = whoop.strain_yesterday >= 14;
  const shortSleep = whoop.sleep_hours < 7;

  const recommendations = [];

  if (lowRecovery && highStrain) {
    recommendations.push('avoid high intensity today');
    recommendations.push('choose Zone 2, mobility, or a lighter strength session');
  } else if (lowRecovery) {
    recommendations.push('keep training moderate and watch how you feel after warm-up');
  } else {
    recommendations.push('you can train normally, but still respect warm-up feedback');
  }

  if (shortSleep) {
    recommendations.push('prioritize hydration, protein, and an earlier night');
  }

  return [
    `Recovery: ${whoop.recovery_score}%. Sleep: ${whoop.sleep_hours}h. Yesterday strain: ${whoop.strain_yesterday}.`,
    `Based on your goal (${userProfile.goal}), I would ${recommendations.join('; ')}.`,
    `Your message was: “${message}”.`
  ].join('\n\n');
}
