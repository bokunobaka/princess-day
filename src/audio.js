// Tiny WebAudio synth: sound effects + a soft music-box background loop.
// No audio files needed.

let ctx = null;
let master = null;
let muted = false;
let volume = 1;
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
    master.gain.value = muted ? 0 : 0.7 * volume;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function getVolume() {
  return volume;
}

export function setVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  if (master && !muted) master.gain.setTargetAtTime(0.7 * volume, ctx.currentTime, 0.05);
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
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.7 * volume, ctx.currentTime, 0.05);
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
  applause() {
    for (let i = 0; i < 14; i++) setTimeout(() => noise(0.12, 0.12 + Math.random() * 0.1, 2500 + Math.random() * 1500), i * 110 + Math.random() * 60);
  },
  shutter() {
    noise(0.08, 0.3, 4000);
    tone(1800, 0.05, 0.06, { type: 'square', vol: 0.06 });
    tone(1200, 0.11, 0.08, { type: 'square', vol: 0.05 });
  },
  animal(kind) {
    const A = {
      bunny: () => { tone(1100, 0, 0.08, { vol: 0.12, glideTo: 1500 }); tone(1200, 0.12, 0.08, { vol: 0.12, glideTo: 1600 }); },
      cat: () => { tone(520, 0, 0.22, { type: 'triangle', vol: 0.2, glideTo: 880 }); tone(880, 0.2, 0.3, { type: 'triangle', vol: 0.18, glideTo: 420 }); },
      dog: () => { tone(230, 0, 0.12, { type: 'square', vol: 0.12, glideTo: 150 }); tone(230, 0.2, 0.12, { type: 'square', vol: 0.12, glideTo: 150 }); },
      fox: () => { tone(900, 0, 0.1, { type: 'triangle', vol: 0.18, glideTo: 1400 }); tone(1400, 0.12, 0.16, { type: 'triangle', vol: 0.16, glideTo: 700 }); },
      penguin: () => { tone(380, 0, 0.2, { type: 'sawtooth', vol: 0.1, glideTo: 300 }); tone(360, 0.26, 0.2, { type: 'sawtooth', vol: 0.1, glideTo: 290 }); },
      pig: () => { tone(180, 0, 0.12, { type: 'sawtooth', vol: 0.12, glideTo: 260 }); tone(260, 0.14, 0.14, { type: 'sawtooth', vol: 0.12, glideTo: 160 }); },
      cow: () => tone(130, 0, 0.8, { type: 'sawtooth', vol: 0.12, glideTo: 95 }),
      chick: () => { tone(1800, 0, 0.07, { vol: 0.1 }); tone(2200, 0.09, 0.07, { vol: 0.1 }); },
      fish: () => tone(500, 0, 0.12, { vol: 0.14, glideTo: 900 }),
      lion: () => tone(160, 0, 0.7, { type: 'sawtooth', vol: 0.14, glideTo: 70 }),
      elephant: () => { tone(300, 0, 0.5, { type: 'sawtooth', vol: 0.1, glideTo: 520 }); tone(520, 0.45, 0.3, { type: 'sawtooth', vol: 0.09, glideTo: 380 }); },
      panda: () => { tone(700, 0, 0.16, { type: 'triangle', vol: 0.14, glideTo: 520 }); tone(640, 0.2, 0.2, { type: 'triangle', vol: 0.12, glideTo: 480 }); },
      giraffe: () => tone(240, 0, 0.5, { type: 'triangle', vol: 0.12, glideTo: 330 }),
      monkey: () => { tone(800, 0, 0.1, { type: 'square', vol: 0.07, glideTo: 1200 }); tone(1000, 0.14, 0.1, { type: 'square', vol: 0.07, glideTo: 1500 }); tone(1200, 0.28, 0.14, { type: 'square', vol: 0.07, glideTo: 800 }); },
      horse: () => { tone(500, 0, 0.18, { type: 'sawtooth', vol: 0.1, glideTo: 950 }); tone(900, 0.18, 0.3, { type: 'sawtooth', vol: 0.1, glideTo: 380 }); },
    };
    (A[kind] || A.bunny)();
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

// ---------------------------------------------------------------- music + ambience per place
const MUSIC = {
  day: { scale: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99], tempo: 480, type: 'sine', vol: 0.05, bass: [130.81, 174.61, 196.0, 220.0] },
  party: { scale: [329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0], tempo: 330, type: 'triangle', vol: 0.05, bass: [130.81, 196.0, 174.61, 196.0] },
  spooky: { scale: [220.0, 246.94, 261.63, 329.63, 349.23, 415.3, 440.0, 523.25], tempo: 640, type: 'sine', vol: 0.045, bass: [110.0, 98.0, 110.0, 87.31] },
  sea: { scale: [261.63, 293.66, 329.63, 370.0, 392.0, 440.0, 493.88, 523.25], tempo: 700, type: 'sine', vol: 0.05, bass: [130.81, 146.83, 164.81, 146.83] },
  winter: { scale: [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.7, 1318.5], tempo: 560, type: 'triangle', vol: 0.04, bass: [130.81, 196.0, 174.61, 196.0] },
  camp: { scale: [196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0], tempo: 760, type: 'sine', vol: 0.05, bass: [98.0, 130.81, 110.0, 98.0] },
};
let style = MUSIC.day;
let ambient = 'none';
let ambientTimer = null;

function stopAmbient() {
  clearTimeout(ambientTimer);
  ambientTimer = null;
}

function ambientTick() {
  if (!ctx || muted || document.hidden) return schedule();
  const r = Math.random;
  switch (ambient) {
    case 'birds': {
      const f = 2200 + r() * 1500;
      tone(f, 0, 0.09, { vol: 0.025, glideTo: f * 1.3 });
      tone(f * 1.1, 0.12, 0.09, { vol: 0.025, glideTo: f * 1.4 });
      if (r() < 0.5) tone(f * 0.9, 0.26, 0.08, { vol: 0.02, glideTo: f * 1.2 });
      break;
    }
    case 'crickets':
      for (let i = 0; i < 3; i++) tone(4200 + r() * 200, i * 0.07, 0.04, { vol: 0.012 });
      break;
    case 'wind':
      noise(2.4, 0.035, 280 + r() * 200);
      break;
    case 'bubbles': {
      const f = 500 + r() * 900;
      tone(f, 0, 0.11, { vol: 0.03, glideTo: f * 1.5 });
      break;
    }
    case 'pool':
      noise(1.4, 0.03, 900);
      if (r() < 0.4) tone(2800 + r() * 800, 0.1, 0.09, { vol: 0.02, glideTo: 3800 });
      break;
    default:
  }
  schedule();
}

function schedule() {
  const gap = { birds: 1800 + Math.random() * 3200, crickets: 380, wind: 2600, bubbles: 500 + Math.random() * 1200, pool: 1300 }[ambient] || 3000;
  ambientTimer = setTimeout(ambientTick, gap);
}

// each place has its own tune and background sounds; called whenever an area is loaded
export function setScene({ music = 'day', ambience = 'none' } = {}) {
  style = MUSIC[music] || MUSIC.day;
  ambient = ambience;
  stopAmbient();
  if (ctx) schedule();
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
    startMusic();
  }
}

export function startMusic() {
  if (!ctx) return;
  if (!ambientTimer && ambient !== 'none') schedule();
  if (musicTimer) return;
  musicTimer = setInterval(() => {
    if (muted || document.hidden) return;
    beat++;
    if (Math.random() < 0.75) {
      const steps = [-2, -1, -1, 1, 1, 2];
      noteIdx += steps[(Math.random() * steps.length) | 0];
      noteIdx = Math.max(0, Math.min(style.scale.length - 1, noteIdx));
      tone(style.scale[noteIdx], 0, 1.6, { type: style.type, vol: style.vol });
    }
    if (beat % 8 === 0) tone(style.bass[(beat / 8) % 4], 0, 3, { type: 'triangle', vol: 0.06 });
  }, style.tempo);
}
