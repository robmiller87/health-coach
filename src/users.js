// Per-user state — a JSON file keyed by phone number. Deliberately simple;
// swap for SQLite when WHOOP OAuth tokens need storing.

import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('data');
const FILE = path.join(DATA_DIR, 'users.json');

const DEFAULT_PROFILE = {
  goal: 'general health',
  training_frequency: 'unknown',
  tone: 'direct and practical',
  disclaimed: false
};

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function save(users) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(users, null, 2));
}

export function getUser(phone) {
  const users = load();
  if (!users[phone]) {
    users[phone] = { ...DEFAULT_PROFILE, created_at: new Date().toISOString() };
    save(users);
  }
  return users[phone];
}

export function updateUser(phone, patch) {
  const users = load();
  users[phone] = { ...(users[phone] || DEFAULT_PROFILE), ...patch };
  save(users);
  return users[phone];
}
