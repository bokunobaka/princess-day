// Spoken lines + a subtitle for grown-ups.
// Order of preference: a recorded clip (public/voice/<lang>/<id>.mp3, listed in manifest.json),
// then a device voice for the language, otherwise the subtitle alone.
import { isMuted, onMuteChange, getVolume } from './audio.js';
import { lang } from './i18n.js';
import { lineId } from './hash.js';

const BASE = import.meta.env.BASE_URL;

let voice = null;
let subtitleTimer = 0;
let clips = {}; // line id -> true, for lines that have a recording
let clip = null; // the clip currently playing

fetch(`${BASE}voice/${lang}/manifest.json`)
  .then((r) => (r.ok ? r.json() : {}))
  .then((m) => (clips = m))
  .catch(() => {});

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  const mine = voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(lang));
  voice =
    mine.find((v) => /(anu|epp|female|samantha|zira|karen|moira|tessa|serena)/i.test(v.name)) || mine[0] || null;
}

if ('speechSynthesis' in window) {
  pickVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

function stopClip() {
  if (clip) {
    clip.pause();
    clip = null;
  }
}

onMuteChange((m) => m && stopClip());

export function say(text) {
  const el = document.getElementById('subtitle');
  if (el) {
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(subtitleTimer);
    subtitleTimer = setTimeout(() => el.classList.remove('show'), 4200);
  }
  if (isMuted()) return;
  stopClip();
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();

  const id = lineId(text);
  if (clips[id]) {
    clip = new Audio(`${BASE}voice/${lang}/${id}.mp3`);
    clip.volume = getVolume();
    clip.play().catch(() => {}); // autoplay can be refused before the first tap
    return;
  }
  if (!('speechSynthesis' in window) || !voice) return;
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.pitch = 1.25;
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}
