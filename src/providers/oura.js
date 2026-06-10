// Oura provider — fetches today's readiness, last night's sleep, and
// yesterday's activity from the Oura API v2, then maps everything onto
// the same normalized summary shape the mock provider returns.
//
// Auth: a Personal Access Token from https://cloud.ouraring.com/personal-access-tokens
// set as OURA_PERSONAL_ACCESS_TOKEN in .env. No OAuth needed for personal use.

const BASE = 'https://api.ouraring.com/v2/usercollection';

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

async function ouraGet(path, params, token) {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 401) {
    throw new Error('Oura API: invalid or expired personal access token (401)');
  }
  if (!res.ok) {
    throw new Error(`Oura API: ${path} returned ${res.status}`);
  }
  return res.json();
}

// Pick the record for a given day from an Oura { data: [...] } response.
function forDay(payload, day) {
  return (payload.data || []).find(r => r.day === day) || null;
}

export async function getOuraSummary({ token = process.env.OURA_PERSONAL_ACCESS_TOKEN } = {}) {
  if (!token) {
    throw new Error('OURA_PERSONAL_ACCESS_TOKEN is not set');
  }

  const now = new Date();
  const today = isoDate(now);
  const yesterday = isoDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const range = { start_date: yesterday, end_date: today };

  // Four small requests, fired in parallel:
  //  - daily_readiness → today's readiness score
  //  - daily_sleep     → last night's sleep score
  //  - sleep           → detailed sleep periods (duration, HRV, RHR)
  //  - daily_activity  → yesterday's activity load
  const [readiness, dailySleep, sleepPeriods, activity] = await Promise.all([
    ouraGet('daily_readiness', range, token),
    ouraGet('daily_sleep', range, token),
    ouraGet('sleep', range, token),
    ouraGet('daily_activity', range, token)
  ]);

  const readinessToday = forDay(readiness, today);
  const sleepToday = forDay(dailySleep, today);
  const activityYesterday = forDay(activity, yesterday);

  // The `sleep` endpoint can return naps; prefer the main long sleep for today.
  const mainSleep =
    (sleepPeriods.data || []).find(s => s.day === today && s.type === 'long_sleep') ||
    forDay(sleepPeriods, today);

  return {
    source: 'oura',
    date: today,
    readiness: readinessToday?.score ?? null,
    sleep_hours: mainSleep ? +(mainSleep.total_sleep_duration / 3600).toFixed(1) : null,
    sleep_score: sleepToday?.score ?? null,
    hrv: mainSleep?.average_hrv ?? null,
    rhr: mainSleep?.lowest_heart_rate ?? null,
    activity_yesterday: {
      score: activityYesterday?.score ?? null,
      active_calories: activityYesterday?.active_calories ?? null,
      steps: activityYesterday?.steps ?? null
    }
  };
}
