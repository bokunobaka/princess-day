// What each finished day (or mini-game) unlocks in the wardrobe.
// Indexes point into DRESSES / CROWN_ICONS in models.js.
export const START_UNLOCKED = { dress: [0, 1, 2], crown: [0, 1] };

export const REWARDS = {
  1: { dress: [3] },
  2: { crown: [2] },
  3: { dress: [4] },
  4: { crown: [3] },
  5: { dress: [8] },
  6: { dress: [6] },       // the witch hat and cat ears come with the day itself
  7: { dress: [5] },
  8: { dress: [7] },
  9: { crown: [9] },
  10: { dress: [9] },
  11: { crown: [7] },
  12: { crown: [8] },
  13: { dress: [10] },
  14: { crown: [10] },
  15: { dress: [12] },
  16: { dress: [13], crown: [11] },
};
export const MINIGAME_REWARDS = { ride: { crown: [6] }, dance: { dress: [11] } };
export const START_OF_DAY = { 6: { crown: [4, 5] } };

// adds the reward's items to `saved.unlocked`; returns the ones that were new
export function grant(saved, reward) {
  const fresh = [];
  for (const type of ['dress', 'crown']) {
    for (const i of (reward && reward[type]) || []) {
      if (!saved.unlocked[type].includes(i)) {
        saved.unlocked[type].push(i);
        fresh.push({ type, index: i });
      }
    }
  }
  return fresh;
}

// everything earned so far (used when loading older saves)
export function grantEarned(saved) {
  for (const id of saved.stickers) grant(saved, REWARDS[id]);
  for (const id of saved.stickers) grant(saved, START_OF_DAY[id]);
  grant(saved, { dress: [saved.outfit.dress], crown: [saved.outfit.crown] });
}
