// Turns recorded WAV clips (named <id>.wav, ids from tools/voice-lines.mjs) into the MP3s the game plays.
//   node tools/wav-to-mp3.mjs <folder-with-wavs> [lang=et]
// Writes public/voice/<lang>/<id>.mp3 and rebuilds manifest.json from every MP3 present.
import fs from 'node:fs';
import path from 'node:path';
import { Mp3Encoder } from '@breezystack/lamejs';

const [dir, lang = 'et'] = process.argv.slice(2);
if (!dir) {
  console.error('usage: node tools/wav-to-mp3.mjs <folder-with-wavs> [lang]');
  process.exit(1);
}
const outDir = path.join('public', 'voice', lang);
fs.mkdirSync(outDir, { recursive: true });

function toMp3(wav) {
  // minimal RIFF reader: 16-bit PCM only (what the voice service returns)
  let pos = 12;
  let fmt = null;
  let data = null;
  while (pos + 8 <= wav.length) {
    const id = wav.toString('ascii', pos, pos + 4);
    const size = wav.readUInt32LE(pos + 4);
    if (id === 'fmt ') fmt = { ch: wav.readUInt16LE(pos + 10), rate: wav.readUInt32LE(pos + 12), bits: wav.readUInt16LE(pos + 22) };
    if (id === 'data') data = wav.subarray(pos + 8, pos + 8 + size);
    pos += 8 + size + (size % 2);
  }
  if (!fmt || !data || fmt.bits !== 16) throw new Error('unsupported WAV (need 16-bit PCM)');
  const pcm = new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length - (data.length % 2)));
  const all = fmt.ch === 1 ? pcm : pcm.filter((_, i) => i % fmt.ch === 0);
  // trim silence at both ends (the service pads short words), keeping a little breathing room
  let peak = 0;
  for (let i = 0; i < all.length; i++) peak = Math.max(peak, Math.abs(all[i]));
  const quiet = Math.max(300, peak * 0.03);
  const pad = Math.round(fmt.rate * 0.12);
  let a = 0;
  let b = all.length - 1;
  while (a < b && Math.abs(all[a]) < quiet) a++;
  while (b > a && Math.abs(all[b]) < quiet) b--;
  const mono = all.subarray(Math.max(0, a - pad), Math.min(all.length, b + pad));
  const enc = new Mp3Encoder(1, fmt.rate, 64);
  const parts = [];
  for (let i = 0; i < mono.length; i += 1152) {
    const chunk = enc.encodeBuffer(mono.subarray(i, i + 1152));
    if (chunk.length) parts.push(Buffer.from(chunk));
  }
  parts.push(Buffer.from(enc.flush()));
  return Buffer.concat(parts);
}

let n = 0;
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.wav'))) {
  const id = f.slice(0, -4);
  fs.writeFileSync(path.join(outDir, id + '.mp3'), toMp3(fs.readFileSync(path.join(dir, f))));
  n++;
}

const manifest = {};
for (const f of fs.readdirSync(outDir).filter((f) => f.endsWith('.mp3'))) manifest[f.slice(0, -4)] = 1;
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest));
console.log(`converted ${n} clip(s); ${Object.keys(manifest).length} in manifest`);
