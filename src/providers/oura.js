// Oura provider — supports two auth modes:
//
//  1. Personal Access Token (simplest, your own ring):
//     set OURA_PERSONAL_ACCESS_TOKEN in .env
//  2. OAuth (other users connect their own rings):
//     set OURA_CLIENT_ID / OURA_CLIENT_SECRET / OURA_REDIRECT_URI,
//     send users to getAuthUrl(), exchange the code, store tokens per user.
//
// Both modes return the same normalized daily summary.

const BASE = 'https://api.ouraring.com/v2/usercollection';
const AUTH_URL = 'https://cloud.ouraring.com/oauth/authorize';
const TOKEN_URL = 'https://api.ouraring.com/oauth/token';

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

// ---------- OAuth helpers ----------

export function getAuthUrl({ state }) {
  const url = new URL(AUTH_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', process.env.OURA_CLIENT_ID);
  url.searchParams.set('redirect_uri', process.env.OURA_REDIRECT_URI);
  url.searchParams.set('scope', 'personal daily');
  url.searchParams.set('state', state);
  return url.toString();
}

async function tokenRequest(params) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.OURA_CLIENT_ID,
      client_secret: process.env.OURA_CLIENT_SECRET,
      ...params
    })
  });
  if (!res.ok) {
    throw new Error(`Oura OAuth: token request failed (${res.status})`);
  }
  return res.json(); // { access_token, refresh_token, expires_in, ... }
}

export function exchangeCode(code) {
  return tokenRequest({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.OURA_REDIRECT_URI
  });
}

export function refreshAccessToken(refresh_token) {
  return tokenRequest({ grant_type: 'refresh_token', refresh_token });
}

// ---------- Data fetching ----------

async function ouraGet(path, params, accessToken) {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (res.status === 401) {
    const err = new Error('Oura API: token invalid or expired (401)');
    err.code = 'OURA_UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    throw new Error(`Oura API: ${path} returned ${res.status}`);
  }
  return res.json();
}

function forDay(payload, day) {
  return (payload.data || []).find(r => r.day === day) || null;
}

async function fetchSummary(accessToken) {
  const now = new Date();
  const today = isoDate(now);
  const yesterday = isoDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const range = { start_date: yesterday, end_date: today };

  const [readiness, dailySleep, sleepPeriods, activity] = await Promise.all([
    ouraGet('daily_readiness', range, accessToken),
    ouraGet('daily_sleep', range, accessToken),
    ouraGet('sleep', range, accessToken),
    ouraGet('daily_activity', range, accessToken)
  ]);

  const readinessToday = forDay(readiness, today);
  const sleepToday = forDay(dailySleep, today);
  const activityYesterday = forDay(activity, yesterday);

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

// auth = { type: 'pat', token }
//      | { type: 'oauth', access_token, refresh_token, onTokens? }
// onTokens(newTokens) is called after a refresh so the caller can persist them.
export async function getOuraSummary(auth) {
  if (!auth) {
    const pat = process.env.OURA_PERSONAL_ACCESS_TOKEN;
    if (!pat) throw new Error('No Oura auth: set OURA_PERSONAL_ACCESS_TOKEN or connect via OAuth');
    auth = { type: 'pat', token: pat };
  }

  if (auth.type === 'pat') {
    return fetchSummary(auth.token);
  }

  try {
    return await fetchSummary(auth.access_token);
  } catch (err) {
    if (err.code !== 'OURA_UNAUTHORIZED' || !auth.refresh_token) throw err;
    // Access token expired — refresh once and retry.
    const tokens = await refreshAccessToken(auth.refresh_token);
    if (auth.onTokens) await auth.onTokens(tokens);
    return fetchSummary(tokens.access_token);
  }
}
