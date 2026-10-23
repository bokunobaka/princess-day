const KEY = 'princessDay.v1';

const DEFAULTS = { stickers: [], muted: false };

export function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // private mode / storage blocked: progress just won't persist
  }
}
