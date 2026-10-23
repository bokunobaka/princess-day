// Tiny WebAudio synth: sound effects + a soft music-box background loop.
// No audio files needed.

let ctx = null;
let master = null;
let muted = false;
let musicTimer = null;
let beat = 0;
let noteIdx = 4;

const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
const BASS = [130.81, 174.61, 196.0, 220.0];

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.7;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function isMuted() {
  return muted;
}

const muteListeners = [];
export function onMuteChange(fn) {
  muteListeners.push(fn);
}

export function setMuted(m) {
  muted = m;
  muteListeners.forEach((fn) => fn(m));
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.7, ctx.currentTime, 0.05);
  if (m && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

function tone(freq, delay, dur, { type = 'sine', vol = 0.2, glideTo = 0 } = {}) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise(dur, vol, freq) {
  if (!ctx || muted) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start();
}

export const sfx = {
  pop() {
    tone(520, 0, 0.12, { type: 'triangle', vol: 0.25, glideTo: 900 });
  },
  chime() {
    [659, 784, 988, 1319].forEach((f, i) => tone(f, i * 0.09, 0.55, { vol: 0.15 }));
  },
  sparkle() {
    tone(1568, 0, 0.25, { vol: 0.08 });
    tone(2093, 0.07, 0.3, { vol: 0.06 });
  },
  boing() {
    tone(260, 0, 0.25, { type: 'triangle', vol: 0.25, glideTo: 620 });
  },
  nope() {
    tone(330, 0, 0.18, { type: 'triangle', vol: 0.15, glideTo: 262 });
  },
  tap() {
    tone(700, 0, 0.07, { type: 'sine', vol: 0.08, glideTo: 500 });
  },
  note(i) {
    const f = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5][i % 6];
    tone(f, 0, 0.7, { type: 'triangle', vol: 0.22 });
    tone(f * 2, 0, 0.5, { vol: 0.06 });
  },
  splash() {
    noise(0.5, 0.25, 900);
    tone(300, 0, 0.3, { type: 'sine', vol: 0.12, glideTo: 120 });
  },
  creak() {
    tone(140, 0, 0.7, { type: 'sawtooth', vol: 0.08, glideTo: 220 });
    tone(110, 0.1, 0.6, { type: 'square', vol: 0.04, glideTo: 180 });
  },
  boo() {
    tone(220, 0, 0.5, { type: 'triangle', vol: 0.12, glideTo: 110 });
  },
  key() {
    [1319, 1760, 2093].forEach((f, i) => tone(f, i * 0.07, 0.35, { vol: 0.12 }));
  },
  // traditional "Happy Birthday" tune (public domain), C major
  birthday() {
    const N = { G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, F5: 698, G5: 784 };
    const tune = [
      ['G4', 0.3], ['G4', 0.15], ['A4', 0.45], ['G4', 0.45], ['C5', 0.45], ['B4', 0.9],
      ['G4', 0.3], ['G4', 0.15], ['A4', 0.45], ['G4', 0.45], ['D5', 0.45], ['C5', 0.9],
      ['G4', 0.3], ['G4', 0.15], ['G5', 0.45], ['E5', 0.45], ['C5', 0.45], ['B4', 0.45], ['A4', 0.6],
      ['F5', 0.3], ['F5', 0.15], ['E5', 0.45], ['C5', 0.45], ['D5', 0.45], ['C5', 0.9],
    ];
    let at = 0;
    for (const [n, d] of tune) {
      tone(N[n], at, d + 0.2, { type: 'triangle', vol: 0.2 });
      at += d;
    }
    return at;
  },
  fanfare() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) =>
      tone(f, i * 0.12, 0.45, { type: 'triangle', vol: 0.18 })
    );
  },
};

export function startMusic() {
  if (musicTimer || !ctx) return;
  musicTimer = setInterval(() => {
    if (muted || document.hidden) return;
    beat++;
    if (Math.random() < 0.75) {
      const steps = [-2, -1, -1, 1, 1, 2];
      noteIdx += steps[(Math.random() * steps.length) | 0];
      noteIdx = Math.max(0, Math.min(SCALE.length - 1, noteIdx));
      tone(SCALE[noteIdx], 0, 1.6, { type: 'sine', vol: 0.05 });
    }
    if (beat % 8 === 0) tone(BASS[(beat / 8) % 4], 0, 3, { type: 'triangle', vol: 0.06 });
  }, 480);
}
