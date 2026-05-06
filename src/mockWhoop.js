export function getMockWhoopSummary() {
  return {
    recovery_score: 42,
    sleep_hours: 6.2,
    sleep_performance: 71,
    strain_yesterday: 15.3,
    hrv: 48,
    rhr: 59,
    workouts: [
      { type: 'strength', strain: 9.8, duration_minutes: 52 }
    ]
  };
}
