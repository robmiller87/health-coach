// Verdict engine — deterministic rules over the normalized daily summary.
// This stays the safety net: the LLM only phrases the verdict, it never
// decides whether someone with 30% readiness should do intervals.

export function computeVerdict(summary) {
  const readiness = summary.readiness;
  const flags = [];

  const lowReadiness = readiness != null && readiness < 50;
  const veryLowReadiness = readiness != null && readiness < 33;
  const hardYesterday =
    summary.activity_yesterday?.active_calories != null &&
    summary.activity_yesterday.active_calories >= 600;
  const shortSleep = summary.sleep_hours != null && summary.sleep_hours < 7;

  if (lowReadiness) flags.push('low_readiness');
  if (veryLowReadiness) flags.push('very_low_readiness');
  if (hardYesterday) flags.push('hard_yesterday');
  if (shortSleep) flags.push('short_sleep');

  let verdict;
  let intensity_cap;

  if (veryLowReadiness || (lowReadiness && hardYesterday)) {
    verdict = 'recover';
    intensity_cap = 'zone2'; // Zone 2, mobility, or light strength only
  } else if (lowReadiness || (hardYesterday && shortSleep)) {
    verdict = 'moderate';
    intensity_cap = 'moderate'; // train, but no max-effort work
  } else {
    verdict = 'train';
    intensity_cap = 'none';
  }

  const habits = [];
  if (shortSleep) habits.push('hydrate', 'prioritize protein', 'earlier night tonight');

  return { verdict, intensity_cap, flags, habits };
}
