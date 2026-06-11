// Provider router — decides where health data comes from, per user.
//
// Priority:
//  1. The user has connected their own Oura via OAuth → use their tokens
//  2. PROVIDER=oura with OURA_PERSONAL_ACCESS_TOKEN → owner's ring
//  3. PROVIDER=mock (default) → fake data for development

import { getMockSummary } from './mock.js';
import { getOuraSummary } from './oura.js';
import { updateUser } from '../users.js';

export async function getDailySummary({ phone, user } = {}) {
  if (user?.oura?.access_token) {
    return getOuraSummary({
      type: 'oauth',
      access_token: user.oura.access_token,
      refresh_token: user.oura.refresh_token,
      onTokens: tokens =>
        updateUser(phone, {
          oura: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token ?? user.oura.refresh_token
          }
        })
    });
  }

  const provider = (process.env.PROVIDER || 'mock').toLowerCase();
  switch (provider) {
    case 'oura':
      return getOuraSummary(); // falls back to PAT from env
    case 'mock':
      return getMockSummary();
    default:
      throw new Error(`Unknown PROVIDER "${provider}" (expected: mock, oura)`);
  }
}
