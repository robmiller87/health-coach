// Mock provider — returns a normalized daily summary so the rest of the
// app never needs to know which wearable is behind it.
//
// Optional overrides let you test different scenarios:
//   getMockSummary({ readiness: 90, sleep_hours: 8.5 })

export function getMockSummary(overrides = {}) {
  return {
    source: 'mock',
    date: new Date().toISOString().slice(0, 10),
    readiness: 42,            // 0–100 (WHOOP recovery / Oura readiness)
    sleep_hours: 6.2,
    sleep_score: 71,          // 0–100
    hrv: 48,                  // ms
    rhr: 59,                  // bpm
    activity_yesterday: {
      score: 88,              // 0–100 (Oura activity score; null for WHOOP)
      active_calories: 640,
      steps: 11200
    },
    ...overrides
  };
}
