// Prints every line the game can speak in Estonian as JSON: [{ id, text }].
// Used to record the voice clips in public/voice/et (see README, "Voice").
globalThis.location = { search: '?lang=et' };
globalThis.localStorage = { getItem: () => null, setItem() {} };
globalThis.document = {};
const { STRINGS, t } = await import('../src/i18n.js');
const { lineId } = await import('../src/hash.js');

const E = STRINGS.et;
const out = new Set();
const add = (s) => s && out.add(s);

// every spoken sentence: day lines (not names, item words or templates with {slots}) + the wardrobe prompt
const plain = Object.keys(E).filter(
  (k) => (k === 'wardrobe.pick' || /^d\d+\./.test(k)) && !/\.name$|\.i\./.test(k) && !E[k].includes('{')
);
plain.forEach((k) => add(E[k]));
E.nums.forEach(add);
E.stirs.forEach(add);
E.splashes.forEach(add);
['yellow', 'white', 'purple'].forEach((c) => add(t('d1.other', { color: t('color.' + c) })));
['egg', 'flour', 'strawberry'].forEach((i) => add(t('d3.found', { x: t('d3.i.' + i) })));
const guests = [['bunny', 'carrot'], ['elephant', 'cookie'], ['panda', 'cupcake']];
for (const [a, treat] of guests) {
  const name = t('animal.' + a);
  add(t('d4.yes', { name }));
  add(t('d4.yum', { name }));
  add(t('d4.no', { name, want: t('treat.' + treat) }));
}

const swimmers = [['bunny', 'watermelon'], ['elephant', 'icecream'], ['panda', 'juice']];
for (const [a, drink] of swimmers) add(t('d10.no', { name: t('animal.' + a), want: t('drink.' + drink) }));

const lines = [...out].map((text) => ({ id: lineId(text), text }));
const ids = new Set(lines.map((l) => l.id));
if (ids.size !== lines.length) throw new Error('hash collision between voice lines');
const tooLong = lines.filter((l) => l.text.length > 300);
if (tooLong.length) throw new Error('line over 300 characters: ' + tooLong[0].text);
console.log(JSON.stringify(lines, null, 1));
