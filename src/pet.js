// The princess's pet friend: picked once, follows her through every day.
export const PET_KINDS = [
  { id: 'bunny', icon: '🐰' },
  { id: 'cat', icon: '🐱' },
  { id: 'dog', icon: '🐶' },
  { id: 'fox', icon: '🦊' },
  { id: 'penguin', icon: '🐧' },
  { id: 'pig', icon: '🐷' },
];

// spoken name clips are recorded for each of these
export const PET_NAMES = [
  { id: 'pontu', name: 'Pontu' },
  { id: 'muri', name: 'Muri' },
  { id: 'nublu', name: 'Nublu' },
  { id: 'tupsu', name: 'Tupsu' },
  { id: 'kringel', name: 'Kringel' },
  { id: 'lumi', name: 'Lumi' },
];

export const petName = (id) => (PET_NAMES.find((n) => n.id === id) || PET_NAMES[0]).name;
