import { START_UNLOCKED, grantEarned } from './rewards.js';

const KEY = 'princessDay.v1';

const defaults = () => ({
  stickers: [],          // finished day ids
  muted: false,
  volume: 1,
  outfit: { dress: 0, crown: 0 },
  unlocked: { dress: [...START_UNLOCKED.dress], crown: [...START_UNLOCKED.crown] },
  pet: null,             // { kind, name }
  plots: [null, null, null], // garden plots: { type, stage, watered }
  daysPlayed: 0,
  bouquets: 0,
  photos: [],            // small jpeg data urls, newest first
  best: { ride: 0, dance: 0 },
  tutorial: false,
});

export function load() {
  const d = defaults();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    Object.assign(d, raw);
    d.outfit = { ...defaults().outfit, ...(raw.outfit || {}) };
    d.unlocked = { dress: [...(raw.unlocked?.dress || d.unlocked.dress)], crown: [...(raw.unlocked?.crown || d.unlocked.crown)] };
    d.best = { ...defaults().best, ...(raw.best || {}) };
    if (!Array.isArray(d.plots) || d.plots.length !== 3) d.plots = [null, null, null];
  } catch {
    /* broken save: start fresh */
  }
  grantEarned(d);
  return d;
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // private mode / storage full: progress just won't persist
  }
}

export function resetAll() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
