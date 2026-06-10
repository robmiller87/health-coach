// Provider router — one place that decides where health data comes from.
// Set PROVIDER=oura (with OURA_PERSONAL_ACCESS_TOKEN) to use real data,
// or leave it unset / PROVIDER=mock for development.
//
// A future whoop.js just needs to export a function returning the same
// normalized shape, then gets one line here.

import { getMockSummary } from './mock.js';
import { getOuraSummary } from './oura.js';

export async function getDailySummary() {
  const provider = (process.env.PROVIDER || 'mock').toLowerCase();

  switch (provider) {
    case 'oura':
      return getOuraSummary();
    case 'mock':
      return getMockSummary();
    default:
      throw new Error(`Unknown PROVIDER "${provider}" (expected: mock, oura)`);
  }
}
